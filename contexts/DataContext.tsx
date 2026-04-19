import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { DCCCData } from '../types';
import { 
  getData, 
  saveGlobal, 
  saveCollection, 
  migrateAndSyncExecutives, 
  needsExecutiveMigration,
  restoreBackup,
  checkBackup
} from '../services/dataService';

interface DataContextType {
  data: DCCCData | null;
  loading: boolean;
  updateData: (updatedData: Partial<DCCCData>) => Promise<void>;
  migrateExecutives: () => Promise<{migrated: number, total: number}>;
  checkMigrationNeeded: () => Promise<boolean>;
  restoreBackup: () => Promise<{ restored: number; total: number }>;
  checkBackup: () => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DCCCData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const fetchedData = await getData();
    setData(fetchedData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateData = useCallback(async (partialData: Partial<DCCCData>) => {
    // Optimistic update of the main context state
    setData(prevData => ({ ...prevData, ...partialData } as DCCCData));

    try {
        const promises = [];
        if (partialData.hero) promises.push(saveGlobal('hero', partialData.hero));
        if (partialData.about) promises.push(saveGlobal('about', partialData.about));
        if (partialData.footer) promises.push(saveGlobal('footer', partialData.footer));
        if (partialData.join) promises.push(saveGlobal('join', partialData.join));
        if (partialData.themeColors) promises.push(saveGlobal('themeColors', partialData.themeColors));

        if (partialData.departments) promises.push(saveCollection('departments', partialData.departments));
        if (partialData.events) promises.push(saveCollection('events', partialData.events));
        if (partialData.moderators) promises.push(saveCollection('moderators', partialData.moderators));
        // Save executives to the 'panels' collection
        if (partialData.executives) promises.push(saveCollection('panels', partialData.executives));

        await Promise.all(promises);
        console.log("Data saved successfully for keys:", Object.keys(partialData));
    } catch (error) {
        console.error("Failed to save data:", error);
        alert("Failed to save data. Changes might not be persisted. Please refresh and try again.");
    }
  }, []);

  const migrateExecutives = useCallback(async () => {
    const stats = await migrateAndSyncExecutives();
    // After migrating, reload all data to ensure UI is up-to-date
    await loadData();
    return stats;
  }, [loadData]);
  
  const checkMigrationNeeded = useCallback(async () => {
    return await needsExecutiveMigration();
  }, []);

  const restoreBackup = useCallback(async () => {
    const stats = await restoreBackup();
    // After restoring, reload all data to ensure UI is up-to-date
    await loadData();
    return stats;
  }, [loadData]);
  
  const checkBackup = useCallback(async () => {
    return await checkBackup();
  }, []);

  const value = { data, loading, updateData, migrateExecutives, checkMigrationNeeded, restoreBackup, checkBackup };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};