import { db } from './firebase';

export interface OfflineFormSettings {
  year: string;
  prefixFormat: string;
  boothStartSerials: {
    [booth: string]: number;
  };
}

export interface OfflineSoldForm {
  id?: string;
  phone: string;
  booth: string;
  serial: number;
  dccc_id: string;
  sold_at: string;
  is_registered: boolean;
  registered_at?: string;
  registration_id?: string;
}

const SETTINGS_DOC = 'globals/offline_form_settings';
const COLLECTION = 'offline_sold_forms';

const defaultSettings: OfflineFormSettings = {
  year: '26',
  prefixFormat: 'DCCC-{year}-{booth}-',
  boothStartSerials: {
    A: 1,
    B: 1,
    C: 1,
    D: 1,
  },
};

/**
 * Gets the central settings for offline forms.
 */
export const getOfflineFormSettings = async (): Promise<OfflineFormSettings> => {
  if (!db) return defaultSettings;
  try {
    const doc = await db.doc(SETTINGS_DOC).get();
    if (doc.exists) {
      const data = doc.data();
      return {
        ...defaultSettings,
        ...data,
        boothStartSerials: {
          ...defaultSettings.boothStartSerials,
          ...(data.boothStartSerials || {}),
        },
      };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error fetching offline settings:', error);
    return defaultSettings;
  }
};

/**
 * Saves the central settings for offline forms.
 */
export const saveOfflineFormSettings = async (settings: OfflineFormSettings): Promise<void> => {
  if (!db) throw new Error('Database not initialized');
  await db.doc(SETTINGS_DOC).set(settings, { merge: true });
};

/**
 * Fetches all sold offline forms.
 */
export const getOfflineSoldForms = async (): Promise<OfflineSoldForm[]> => {
  if (!db) return [];
  try {
    const snapshot = await db.collection(COLLECTION).orderBy('sold_at', 'desc').get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as OfflineSoldForm));
  } catch (error) {
    console.error('Error fetching offline sold forms:', error);
    return [];
  }
};

/**
 * Checks if a phone number or DCCC ID is already used in a sold form.
 */
export const checkOfflineDuplicate = async (phone: string, dccc_id?: string): Promise<{ phoneExists: boolean; idExists: boolean }> => {
  if (!db) return { phoneExists: false, idExists: false };
  
  let phoneExists = false;
  let idExists = false;

  const phoneQuery = await db.collection(COLLECTION).where('phone', '==', phone).get();
  if (!phoneQuery.empty) {
    phoneExists = true;
  }

  if (dccc_id) {
    const idQuery = await db.collection(COLLECTION).where('dccc_id', '==', dccc_id).get();
    if (!idQuery.empty) {
      idExists = true;
    }
  }

  return { phoneExists, idExists };
};

/**
 * Records a new offline form sale, generating the DCCC ID automatically.
 */
export const sellOfflineForm = async (phone: string, booth: string): Promise<OfflineSoldForm> => {
  if (!db) throw new Error('Database not initialized');

  // Validate phone format basically
  const sanitizedPhone = phone.trim();
  if (!sanitizedPhone) {
    throw new Error('Phone number cannot be empty.');
  }

  // Check duplicate phone first
  const { phoneExists } = await checkOfflineDuplicate(sanitizedPhone);
  if (phoneExists) {
    throw new Error('This mobile number is already registered for an offline form.');
  }

  // Get active settings
  const settings = await getOfflineFormSettings();
  
  // Find highest serial for this booth and year in DB
  const querySnapshot = await db.collection(COLLECTION)
    .where('booth', '==', booth)
    .get();

  let maxSerial = 0;
  querySnapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    // Only count if it belongs to the current year
    if (data.dccc_id && data.dccc_id.includes(`-${settings.year}-`)) {
      if (data.serial > maxSerial) {
        maxSerial = data.serial;
      }
    }
  });

  // Calculate next serial
  let nextSerial = maxSerial > 0 ? maxSerial + 1 : (settings.boothStartSerials[booth] || 1);

  // Generate DCCC ID
  // e.g. DCCC-{year}-{booth}- -> DCCC-26-A- -> DCCC-26-A-001
  let formattedPrefix = settings.prefixFormat
    .replace('{year}', settings.year)
    .replace('{booth}', booth);
  
  const paddedSerial = nextSerial.toString().padStart(3, '0');
  const dccc_id = `${formattedPrefix}${paddedSerial}`;

  // Double check ID uniqueness just in case
  const { idExists } = await checkOfflineDuplicate(sanitizedPhone, dccc_id);
  if (idExists) {
    throw new Error(`Generated ID ${dccc_id} already exists. Please verify settings or serial counters.`);
  }

  const newForm: Omit<OfflineSoldForm, 'id'> = {
    phone: sanitizedPhone,
    booth,
    serial: nextSerial,
    dccc_id,
    sold_at: new Date().toISOString(),
    is_registered: false,
  };

  const docRef = await db.collection(COLLECTION).add(newForm);
  
  return {
    id: docRef.id,
    ...newForm,
  };
};

/**
 * Verifies if a user's phone and DCCC ID match an existing offline sold form.
 * Returns the offline sold form if valid, or null.
 */
export const verifyOfflineForm = async (phone: string, dcccId: string): Promise<OfflineSoldForm | null> => {
  if (!db) return null;
  
  const formattedPhone = phone.trim();
  const formattedId = dcccId.trim();

  const snapshot = await db.collection(COLLECTION)
    .where('phone', '==', formattedPhone)
    .where('dccc_id', '==', formattedId)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as OfflineSoldForm;
};

/**
 * Marks an offline form as registered.
 */
export const markOfflineFormAsRegistered = async (soldFormId: string, registrationId: string): Promise<void> => {
  if (!db) return;
  await db.collection(COLLECTION).doc(soldFormId).update({
    is_registered: true,
    registered_at: new Date().toISOString(),
    registration_id: registrationId,
  });
};

/**
 * Deletes an offline sold form record.
 */
export const deleteOfflineSoldForm = async (id: string): Promise<void> => {
  if (!db) return;
  await db.collection(COLLECTION).doc(id).delete();
};
