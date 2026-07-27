import express from 'express';
import cors from 'cors';
import ImageKit from 'imagekit';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const apiApp = express.Router();

apiApp.use(cors());
apiApp.use(express.json({ limit: '50mb' }));
apiApp.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// ImageKit initialization helper with support for custom configs and credential trimming
const getIkClient = (customConfig?: { urlEndpoint?: string; publicKey?: string; privateKey?: string }) => {
  const urlEndpoint = (customConfig?.urlEndpoint || process.env.VITE_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT || '').trim();
  const publicKey = (customConfig?.publicKey || process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || '').trim();
  const privateKey = (customConfig?.privateKey || process.env.IMAGEKIT_PRIVATE_KEY || process.env.VITE_IMAGEKIT_PRIVATE_KEY || '').trim();

  if (!urlEndpoint || !publicKey || !privateKey) {
    throw new Error(`ImageKit environment variables or credentials are missing. Required: urlEndpoint, publicKey, privateKey. Found: endpoint=${!!urlEndpoint}, public=${!!publicKey}, private=${!!privateKey}`);
  }

  return new ImageKit({
    urlEndpoint,
    publicKey,
    privateKey
  });
};

// API Route to fetch public configuration for ImageKit
apiApp.get('/imagekit/config', (req, res) => {
  res.json({
    urlEndpoint: (process.env.VITE_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT || '').trim(),
    publicKey: (process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || '').trim()
  });
});

// API Route to fetch auth parameters for client-side upload
apiApp.get('/imagekit/auth', (req, res) => {
  try {
    const ik = getIkClient();
    const authenticationParameters = ik.getAuthenticationParameters();
    res.json({
        ...authenticationParameters,
        publicKey: (process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || '').trim()
    });
  } catch (error: any) {
    console.error("ImageKit Auth Error:", error.message);
    res.status(400).json({ error: error.message || "ImageKit configuration is missing or invalid on the server." });
  }
});

// Secure API Route to handle server-side ImageKit upload proxy
apiApp.post('/imagekit/upload', async (req, res) => {
  try {
    const body = req.body || {};
    const { file, fileName, folder, useUniqueFileName, imagekitConfig } = body;
    const ik = getIkClient(imagekitConfig);
    
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
    res.status(400).json({ error: error.message || "ImageKit upload failed on the server." });
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
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
});

// API Route to create folder
apiApp.post('/imagekit/folder', async (req, res) => {
  try {
     const ik = getIkClient();
     const { folderName, parentFolderPath } = req.body || {};
     await ik.createFolder({ folderName, parentFolderPath });
     res.json({ success: true });
  } catch (error: any) {
     res.status(400).json({ error: error.message });
  }
});

// API Route to rename a media file (Note: imagekit SDK syntax)
apiApp.put('/imagekit/files/:fileId/rename', async (req, res) => {
  try {
    const ik = getIkClient();
    const { filePath, newFileName } = req.body || {};
    await ik.renameFile({ filePath, newFileName, purgeCache: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
});

// Fallback for non-existent API routes (Ensure 404s return JSON, not HTML)
apiApp.use((req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global API Error Handler - ALWAYS returns JSON
apiApp.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global API Error Handler caught error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || "An unexpected server error occurred on the API route."
  });
});

export default apiApp;
