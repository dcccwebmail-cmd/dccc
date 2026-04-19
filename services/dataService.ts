import { DCCCData, Department, Event, Moderator, Executive } from '../types';
import { db, emptyData, initialData } from './firebase';

const GLOBALS_COLLECTION = 'globals';
const DEPARTMENTS_COLLECTION = 'departments';
const EVENTS_COLLECTION = 'events';
const MODERATORS_COLLECTION = 'moderators';
const PANELS_COLLECTION = 'panels'; // Renamed from EXECUTIVES_COLLECTION
const LEGACY_EXECUTIVES_COLLECTION = 'executives'; // Old collection name
const EXECUTIVES_BACKUP_COLLECTION = 'executives_backup';

/**
 * Checks if there are any legacy (flat-structured) executive documents
 * that need to be migrated from the 'executives' collection.
 */
export const needsExecutiveMigration = async (): Promise<boolean> => {
    if (!db) return false;
    const snapshot = await db.collection(LEGACY_EXECUTIVES_COLLECTION).get();
    // Migration is needed if there's any document that doesn't have subcollections,
    // which we infer by checking if a document's data fields look like an executive member.
    return snapshot.docs.some((doc: any) => doc.data().name && doc.data().position);
};


export const getData = async (): Promise<DCCCData> => {
  if (!db) {
    console.warn("Firebase not initialized. Returning empty data structure.");
    return initialData; // Return full initial data in offline mode
  }

  try {
    const getGlobalDoc = (docId: string) => db.collection(GLOBALS_COLLECTION).doc(docId).get().then((snap: any) => snap.exists ? snap.data() : null);
    const getCollection = (name: string) => db.collection(name).get().then((snap: any) => snap.docs.map((doc: any) => doc.data()));

    // Use a more efficient collectionGroup query to fetch all members from all subcollections at once.
    // This will now fetch from the 'panels' collection's subcollections.
    const executivesPromise = db.collectionGroup('members').get().then((snap: any) => snap.docs.map((doc: any) => doc.data()));

    const [
      hero,
      about,
      footer,
      join,
      themeColors,
      departments,
      events,
      moderators,
      executives
    ] = await Promise.all([
      getGlobalDoc('hero'),
      getGlobalDoc('about'),
      getGlobalDoc('footer'),
      getGlobalDoc('join'),
      getGlobalDoc('themeColors'),
      getCollection(DEPARTMENTS_COLLECTION),
      getCollection(EVENTS_COLLECTION),
      getCollection(MODERATORS_COLLECTION),
      executivesPromise,
    ]);
    
    // Merge fetched data over the empty shell. 
    // We use initialData as fallback for singletons (global docs) to ensure default content exists if DB is empty.
    return {
      hero: hero || initialData.hero,
      about: about || initialData.about,
      footer: footer || initialData.footer,
      join: join || initialData.join,
      themeColors: themeColors || initialData.themeColors,
      departments: (departments as Department[]).length > 0 ? departments as Department[] : initialData.departments,
      events: (events as Event[]).length > 0 ? events as Event[] : initialData.events,
      moderators: (moderators as Moderator[]).length > 0 ? moderators as Moderator[] : initialData.moderators,
      executives: (executives as Executive[]).length > 0 ? executives as Executive[] : initialData.executives,
    } as DCCCData;

  } catch (error) {
    console.error("Error fetching from Firestore, returning empty data as fallback:", error);
    return initialData;
  }
};


// Generic function to save a document to the 'globals' collection
export const saveGlobal = async (docId: string, data: object): Promise<void> => {
    if (!db) {
        throw new Error("Firebase not initialized. Cannot save data.");
    }
    await db.collection(GLOBALS_COLLECTION).doc(docId).set(data, { merge: true });
};

// Function to overwrite an entire collection. It now has special logic for 'panels'.
export const saveCollection = async <T extends { id: string }>(collectionName: string, items: T[]): Promise<void> => {
    if (!db) {
        throw new Error("Firebase not initialized. Cannot save collection.");
    }
    const collectionRef = db.collection(collectionName);
    const batch = db.batch();

    if (collectionName === PANELS_COLLECTION) {
        const executives = items as unknown as Executive[];
        
        // 1. Read all nested documents to prepare for deletion
        const yearsSnapshot = await collectionRef.get();
        const memberSnapshots = await Promise.all(
            yearsSnapshot.docs.map((doc: any) => doc.ref.collection('members').get())
        );

        // 2. Add all delete operations to the batch
        memberSnapshots.forEach(snapshot => snapshot.docs.forEach((doc:any) => batch.delete(doc.ref)));
        yearsSnapshot.docs.forEach((doc:any) => batch.delete(doc.ref));
        
        // 3. Group new executives by year
        const executivesByYear = executives.reduce((acc, exec) => {
            const year = String(exec.year);
            if (!acc[year]) acc[year] = [];
            acc[year].push(exec);
            return acc;
        }, {} as Record<string, Executive[]>);
        
        // 4. Add all new documents to the batch
        for (const year in executivesByYear) {
            const yearDocRef = collectionRef.doc(year);
            batch.set(yearDocRef, { lastUpdated: new Date().toISOString() }); // Create the year document

            const members = executivesByYear[year];
            members.forEach(item => {
                const docRef = yearDocRef.collection('members').doc(item.id);
                batch.set(docRef, item);
            });
        }
    } else {
        // Original logic for other collections (departments, events, etc.)
        const snapshot = await collectionRef.get();
        snapshot.docs.forEach((doc: any) => {
            batch.delete(doc.ref);
        });

        items.forEach(item => {
            const docRef = collectionRef.doc(item.id);
            batch.set(docRef, item);
        });
    }

    await batch.commit();
};

/**
 * Fully automated migration tool.
 * 1. Reads from 'executives' collection.
 * 2. Merges with any data in the new 'panels' structure.
 * 3. Backs up the old 'executives' data to 'executives_backup'.
 * 4. Cleans and overwrites the 'panels' collection with merged data.
 * 5. Deletes the old flat documents from 'executives'.
 */
export const migrateAndSyncExecutives = async (): Promise<{migrated: number, total: number}> => {
    if (!db) {
        throw new Error("Firebase not initialized. Cannot migrate data.");
    }

    // 1. Fetch from the legacy 'executives' collection
    const rootSnapshot = await db.collection(LEGACY_EXECUTIVES_COLLECTION).get();
    
    const legacyExecutives: Executive[] = [];
    const legacyDocsToDelete: any[] = [];
    
    rootSnapshot.docs.forEach((doc: any) => {
        if (doc.data().name && doc.data().position) {
            legacyExecutives.push(doc.data() as Executive);
            legacyDocsToDelete.push(doc.ref);
        }
    });

    if (legacyExecutives.length === 0) {
        console.log("No legacy executives found to migrate.");
        return { migrated: 0, total: 0 };
    }

    // 2. Fetch current data from the new 'panels' nested structure
    const currentSnapshot = await db.collectionGroup('members').get();
    const currentExecutives: Executive[] = currentSnapshot.docs.map((doc: any) => doc.data());
    
    // 3. Merge data, giving precedence to current data in case of ID conflicts
    const allExecutivesMap = new Map<string, Executive>();
    legacyExecutives.forEach(exec => {
        if (!exec.year) {
            exec.year = new Date().getFullYear() - 1; // Sensible default
        }
        allExecutivesMap.set(exec.id, exec);
    });
    currentExecutives.forEach(exec => allExecutivesMap.set(exec.id, exec));

    const mergedExecutives = Array.from(allExecutivesMap.values());
    
    // 4. Use a batch to perform all operations atomically
    const batch = db.batch();

    // 4a. Clean the destination 'panels' collection first to prevent duplicates
    const existingPanelsYears = await db.collection(PANELS_COLLECTION).get();
    if (!existingPanelsYears.empty) {
        const existingPanelsMembers = await Promise.all(
            existingPanelsYears.docs.map((doc: any) => doc.ref.collection('members').get())
        );
        existingPanelsMembers.forEach(snapshot => snapshot.docs.forEach((doc: any) => batch.delete(doc.ref)));
        existingPanelsYears.docs.forEach((doc: any) => batch.delete(doc.ref));
    }

    // 4b. Back up legacy data
    legacyExecutives.forEach(exec => {
        const backupRef = db.collection(EXECUTIVES_BACKUP_COLLECTION).doc(exec.id);
        batch.set(backupRef, exec);
    });

    // 4c. Overwrite the 'panels' collection with the complete, merged data
    const executivesByYear = mergedExecutives.reduce((acc, exec) => {
        const year = String(exec.year);
        if (!acc[year]) acc[year] = [];
        acc[year].push(exec);
        return acc;
    }, {} as Record<string, Executive[]>);
    
    for (const year in executivesByYear) {
        const yearDocRef = db.collection(PANELS_COLLECTION).doc(year);
        batch.set(yearDocRef, { lastUpdated: new Date().toISOString() });
        executivesByYear[year].forEach(item => {
            const docRef = yearDocRef.collection('members').doc(item.id);
            batch.set(docRef, item);
        });
    }
    
    // 4d. Delete the old flat documents from 'executives'
    legacyDocsToDelete.forEach(docRef => {
        batch.delete(docRef);
    });

    await batch.commit();
    
    return {
        migrated: legacyExecutives.length,
        total: mergedExecutives.length
    };
};

/**
 * Checks if a backup of executives exists.
 */
export const checkBackup = async (): Promise<boolean> => {
    if (!db) return false;
    const snapshot = await db.collection(EXECUTIVES_BACKUP_COLLECTION).limit(1).get();
    return !snapshot.empty;
};

/**
 * Restores executive data from the backup collection, merges it with current data,
 * and then deletes the backup.
 */
export const restoreBackup = async (): Promise<{ restored: number, total: number }> => {
    if (!db) {
        throw new Error("Firebase not initialized. Cannot restore data.");
    }

    // 1. Fetch from backup collection
    const backupSnapshot = await db.collection(EXECUTIVES_BACKUP_COLLECTION).get();
    if (backupSnapshot.empty) {
        console.log("No backup found to restore.");
        const currentSnapshot = await db.collectionGroup('members').get();
        return { restored: 0, total: currentSnapshot.size };
    }
    const backupExecutives: Executive[] = backupSnapshot.docs.map((doc: any) => doc.data());

    // 2. Fetch current data from 'panels'
    const currentSnapshot = await db.collectionGroup('members').get();
    const currentExecutives: Executive[] = currentSnapshot.docs.map((doc: any) => doc.data());

    // 3. Merge data, giving precedence to current data for conflicts
    const allExecutivesMap = new Map<string, Executive>();
    backupExecutives.forEach(exec => allExecutivesMap.set(exec.id, exec));
    currentExecutives.forEach(exec => allExecutivesMap.set(exec.id, exec));

    const mergedExecutives = Array.from(allExecutivesMap.values());

    // 4. Use a batch for atomic operations
    const batch = db.batch();

    // 4a. Clean the 'panels' collection
    const existingPanelsYears = await db.collection(PANELS_COLLECTION).get();
    if (!existingPanelsYears.empty) {
        const existingPanelsMembers = await Promise.all(
            existingPanelsYears.docs.map((doc: any) => doc.ref.collection('members').get())
        );
        existingPanelsMembers.forEach(snapshot => snapshot.docs.forEach((doc: any) => batch.delete(doc.ref)));
        existingPanelsYears.docs.forEach((doc: any) => batch.delete(doc.ref));
    }

    // 4b. Overwrite 'panels' with merged data
    const executivesByYear = mergedExecutives.reduce((acc, exec) => {
        const year = String(exec.year);
        if (!acc[year]) acc[year] = [];
        acc[year].push(exec);
        return acc;
    }, {} as Record<string, Executive[]>);

    for (const year in executivesByYear) {
        const yearDocRef = db.collection(PANELS_COLLECTION).doc(year);
        batch.set(yearDocRef, { lastUpdated: new Date().toISOString() });
        executivesByYear[year].forEach(item => {
            const docRef = yearDocRef.collection('members').doc(item.id);
            batch.set(docRef, item);
        });
    }
    
    // 4c. Delete the backup collection documents
    backupSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    return {
        restored: backupExecutives.length,
        total: mergedExecutives.length
    };
};