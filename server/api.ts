import express from 'express';
import cors from 'cors';
import ImageKit from 'imagekit';
import { Resend } from 'resend';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const apiApp = express.Router();

apiApp.use(cors());
apiApp.use(express.json({ limit: '10mb' }));
apiApp.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize Firebase Admin SDK
let adminDb: any = null;
try {
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'dccc-v3'
    });
  }
  adminDb = getFirestore();
  console.log("Firebase Admin initialized successfully.");
} catch (err) {
  console.error("Firebase Admin initialization failed:", err);
}

// ImageKit initialization
let imagekit: ImageKit | null = null;
const getIkClient = () => {
  if (!imagekit) {
    const urlEndpoint = process.env.VITE_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT;
    const publicKey = process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || process.env.VITE_IMAGEKIT_PRIVATE_KEY;

    if (!urlEndpoint || !publicKey || !privateKey) {
      throw new Error(`ImageKit environment variables are missing. Required: urlEndpoint, publicKey, privateKey. Received: endpoint=${!!urlEndpoint}, public=${!!publicKey}, private=${!!privateKey}`);
    }
    imagekit = new ImageKit({
      urlEndpoint,
      publicKey,
      privateKey
    });
  }
  return imagekit;
};

// API Route to fetch public configuration for ImageKit
apiApp.get('/imagekit/config', (req, res) => {
  res.json({
    urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT || '',
    publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || ''
  });
});

// API Route to fetch auth parameters for client-side upload
apiApp.get('/imagekit/auth', (req, res) => {
  try {
    const ik = getIkClient();
    const authenticationParameters = ik.getAuthenticationParameters();
    // Return publicKey along with signature, expire, token
    res.json({
        ...authenticationParameters,
        publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || ''
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Secure API Route to handle server-side ImageKit upload proxy
apiApp.post('/imagekit/upload', async (req, res) => {
  try {
    const ik = getIkClient();
    const { file, fileName, folder, useUniqueFileName } = req.body;
    
    if (!file || !fileName) {
      return res.status(400).json({ error: "Missing required parameters: file, fileName." });
    }

    console.log(`Uploading file ${fileName} to folder ${folder || '/'} via secure server proxy...`);
    const result = await ik.upload({
      file,
      fileName,
      folder: folder || '/',
      useUniqueFileName: useUniqueFileName !== undefined ? useUniqueFileName : true
    });

    res.json(result);
  } catch (error: any) {
    console.error("ImageKit server-side upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API Route to list media files
apiApp.get('/imagekit/files', async (req, res) => {
  try {
    const ik = getIkClient();
    const pathParam = req.query.path as string | undefined;
    const result = await ik.listFiles({
      skip: 0,
      limit: 1000,
      path: pathParam || undefined,
    });
    // Return only actual files
    res.json(result.filter((f: any) => f.type !== 'folder'));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to list all unique folders (virtual + actual)
apiApp.get('/imagekit/folders', async (req, res) => {
  try {
    const ik = getIkClient();
    const result = await ik.listFiles({ skip: 0, limit: 1000 });
    const folders = new Set<string>();
    result.forEach((f: any) => {
      // Direct folder items
      if (f.type === 'folder' && f.filePath) {
         folders.add(f.filePath);
      }
      
      if (f.filePath) {
         let current = f.filePath.substring(0, f.filePath.lastIndexOf('/'));
         if (current === '') current = '/';
         
         if (current !== '/') {
            while (current && current !== '/' && current !== '') {
               folders.add(current);
               const parts = current.split('/');
               parts.pop();
               current = parts.join('/');
               if (current === '') current = '/';
            }
         }
      }
    });
    res.json(Array.from(folders).sort());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to create folder
apiApp.post('/imagekit/folder', async (req, res) => {
  try {
     const ik = getIkClient();
     const { folderName, parentFolderPath } = req.body;
     // imagekit node SDK createFolder support natively
     await ik.createFolder({ folderName, parentFolderPath });
     res.json({ success: true });
  } catch (error: any) {
     res.status(500).json({ error: error.message });
  }
});

// API Route to rename a media file (Note: imagekit SDK syntax)
apiApp.put('/imagekit/files/:fileId/rename', async (req, res) => {
  try {
    const ik = getIkClient();
    const { filePath, newFileName } = req.body;
    await ik.renameFile({ filePath, newFileName, purgeCache: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route to delete a media file
apiApp.delete('/imagekit/files/:fileId', async (req, res) => {
  try {
    const ik = getIkClient();
    const { fileId } = req.params;
    await ik.deleteFile(fileId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Secure Proxy for Resend Email Sending
apiApp.post('/email/send', async (req, res) => {
  try {
    const { to, subject, html, attachments, resendApiKey } = req.body;
    
    const apiKey = process.env.RESEND_API_KEY || resendApiKey;
    if (!apiKey) {
      return res.status(400).json({ error: "Resend API Key is missing. Please configure RESEND_API_KEY on the server or provide it in settings." });
    }

    const fromHeader = req.body.from;
    if (!fromHeader) {
      return res.status(400).json({ error: "Sender details are missing." });
    }

    const resendClient = new Resend(apiKey);
    const formattedAttachments = attachments?.map((att: any) => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64')
    }));

    const sendPayload: any = {
      from: fromHeader,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };

    if (formattedAttachments && formattedAttachments.length > 0) {
      sendPayload.attachments = formattedAttachments;
    }

    console.log(`Sending secure email via Resend to ${JSON.stringify(to)} with subject "${subject}" using SDK...`);

    const { data, error } = await resendClient.emails.send(sendPayload);

    if (error) {
      console.error(`Resend SDK error:`, error);
      return res.status(400).json({ error: (error as any).message || error });
    }

    res.json(data || { success: true });
  } catch (error: any) {
    console.error("Error in secure /email/send proxy:", error);
    res.status(500).json({ error: error.message });
  }
});

// Resend Webhook endpoint for tracking email status
apiApp.post('/webhooks/resend', async (req, res) => {
  try {
    const event = req.body;
    console.log("Received Resend Webhook:", JSON.stringify(event));

    // Resend sends webhook details containing 'type' and 'data'
    const eventType = event?.type;
    const emailId = event?.data?.email_id;

    if (!eventType || !emailId) {
      return res.status(400).json({ error: "Invalid Resend webhook payload structure." });
    }

    if (!adminDb) {
      return res.status(500).json({ error: "Firestore Admin Database is not initialized." });
    }

    // Map Resend events to our JoinRequest emailStatus types
    const mapResendStatus = (type: string): 'sending' | 'sent' | 'delivered' | 'bounced' | 'opened' | 'failed' | null => {
      switch (type) {
        case 'email.sent': return 'sent';
        case 'email.delivered': return 'delivered';
        case 'email.bounced': return 'bounced';
        case 'email.opened': return 'opened';
        case 'email.clicked': return 'opened';
        case 'email.complained': return 'failed';
        case 'email.delivery_delayed': return 'sending';
        default: return null;
      }
    };

    const targetStatus = mapResendStatus(eventType);
    if (!targetStatus) {
      console.log(`Ignoring Resend event type: ${eventType}`);
      return res.json({ received: true, ignored: true });
    }

    // Query join_requests collection in Firestore to find request with matching emailId
    const snapshot = await adminDb.collection('join_requests').where('emailId', '==', emailId).get();
    
    if (snapshot.empty) {
      console.warn(`No JoinRequest document found matching emailId: ${emailId}`);
      return res.json({ success: false, reason: "No matching document found in Firestore." });
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc: any) => {
      console.log(`Updating document ${doc.id} with email status: ${targetStatus}`);
      batch.update(doc.ref, { emailStatus: targetStatus });
    });
    await batch.commit();

    res.json({ success: true, updatedCount: snapshot.size });
  } catch (error: any) {
    console.error("Error in /webhooks/resend listener:", error);
    res.status(500).json({ error: error.message });
  }
});

export default apiApp;
