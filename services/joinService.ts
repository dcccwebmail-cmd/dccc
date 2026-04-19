
import { db } from './firebase';
import { EmailConfig, BrevoConfig, IdCardConfig, JoinRequest } from '../types';
import { sendBrevoEmail } from './emailService';

// Updated Script URL
const GOOGLE_SHEET_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxrbMNLvHAR5sFgqXt00qcJy2HxKm0H4JRKIMdzdMyF8naOzpWfgZz986ocMXB5wQkShA/exec"; 

const COLLECTION = 'join_requests';
const METADATA_DOC = 'globals/metadata'; // Store counters here

export const submitJoinRequest = async (data: Omit<JoinRequest, 'id' | 'status' | 'submitted_at'>) => {
  if (!db) throw new Error("Database not initialized");
  
  // 1. Save to Firestore (Primary)
  const docRef = await db.collection(COLLECTION).add({
    ...data,
    status: 'pending',
    submitted_at: new Date().toISOString()
  });

  // 2. Send to Google Sheets (Secondary/Backup)
  // Sends the entire object. The Apps Script must parse this hierarchy.
  if (GOOGLE_SHEET_SCRIPT_URL) {
      try {
          const sheetPayload = {
              id: docRef.id,
              status: 'pending',
              ...data
          };
          
          await fetch(GOOGLE_SHEET_SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors', // Important: Google Scripts don't support CORS for POST requests from browser
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(sheetPayload)
          });
          console.log("Sent full info to Google Sheet");
      } catch (sheetError) {
          console.error("Failed to send to Google Sheet", sheetError);
      }
  }
};

export const getJoinRequests = async () => {
  if (!db) return [];
  try {
    const snapshot = await db.collection(COLLECTION).orderBy('submitted_at', 'desc').get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as JoinRequest));
  } catch (error) {
    console.error("Error fetching join requests:", error);
    return [];
  }
};

// Helper to generate the next Online ID
const generateNextOnlineId = async (sessionYear?: string): Promise<string> => {
    if (!db) throw new Error("DB not connected");
    
    // Use provided session year or default to current year's last 2 digits
    const yearShort = sessionYear || new Date().getFullYear().toString().slice(-2);
    const prefix = `DCCC-${yearShort}-O-`;
    
    // We use a transaction to safely increment the counter
    const metadataRef = db.doc(METADATA_DOC);
    
    return await db.runTransaction(async (transaction: any) => {
        const doc = await transaction.get(metadataRef);
        let currentSerial = 0;
        
        if (doc.exists && doc.data().last_online_serial) {
            currentSerial = doc.data().last_online_serial;
        }
        
        const newSerial = currentSerial + 1;
        transaction.set(metadataRef, { last_online_serial: newSerial }, { merge: true });
        
        return `${prefix}${newSerial.toString().padStart(3, '0')}`;
    });
};

interface UpdateStatusOptions {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    userData?: JoinRequest;
    emailConfig?: EmailConfig;
    brevoConfig?: BrevoConfig;
    idCardConfig?: IdCardConfig;
    sessionYear?: string; // Configured year from admin
}

export const updateJoinRequestStatus = async ({
    id, 
    status,
    userData,
    emailConfig,
    brevoConfig,
    idCardConfig,
    sessionYear
}: UpdateStatusOptions) => {
  if (!db) return;
  
  let assignedId = userData?.assignedId || "";

  // 1. Logic for Approval & ID Generation
  if (status === 'approved' && userData && !assignedId) {
      // Robust check using optional chaining
      const regType = userData.meta?.reg_type;
      
      if (regType === 'offline') {
          // Use the ID from the form (safely accessing payment.dccc_id)
          const formId = userData.payment?.dccc_id;
          if (formId) {
              assignedId = formId;
          } else {
              console.warn("Approved Offline Request but 'dccc_id' missing in payment data:", userData);
              throw new Error("Cannot approve: Missing Offline Form ID in payment data.");
          }
      } else {
          // Generate new Online ID using the configured session year
          try {
              assignedId = await generateNextOnlineId(sessionYear);
          } catch (e) {
              console.error("Failed to generate ID", e);
              throw new Error("Failed to generate unique Student ID. Please check connection.");
          }
      }
  }

  // 2. Update Firestore
  const updatePayload: any = { status };
  // Only add assignedId to update if it has a valid value
  if (assignedId) {
      updatePayload.assignedId = assignedId;
  }

  await db.collection(COLLECTION).doc(id).update(updatePayload);

  // 3. Send Email via Brevo (Client-side) if Approved
  if (status === 'approved' && userData && brevoConfig?.apiKey) {
      try {
          await sendBrevoEmail({
              brevoConfig,
              to: { name: userData.personal.name_en, email: userData.personal.email },
              subject: emailConfig?.subject || "Welcome to DCCC",
              htmlContent: emailConfig?.body || "Your membership is approved.",
              userData: { ...userData, assignedId }, // Pass the newly assigned ID
              idCardConfig
          });
          console.log("Brevo email sent successfully.");
      } catch (emailError) {
          console.error("Failed to send Brevo email:", emailError);
          // Don't throw here to avoid rolling back the approval state in UI logic, but log it loudly.
          // In a production backend, this would be a separate queue.
          alert(`Status updated to Approved, but Email failed to send: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
      }
  }

  // 4. Update Google Sheet (Legacy / Backup Record)
  if (GOOGLE_SHEET_SCRIPT_URL) {
      try {
          const sheetPayload = {
              action: 'update_status',
              id: id,
              status: status,
              assignedId: assignedId // Pass the ID generated here to the sheet
          };
          
          await fetch(GOOGLE_SHEET_SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(sheetPayload)
          });
          console.log("Updated status in Google Sheet");
      } catch (sheetError) {
          console.error("Failed to update status in Google Sheet", sheetError);
      }
  }
};

export const deleteJoinRequest = async (id: string) => {
    if (!db) return;
    await db.collection(COLLECTION).doc(id).delete();
};
