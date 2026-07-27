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

// ImageKit initialization helper with support for custom configs, headers, query params, and credential cleaning
const getIkClient = (reqOrConfig?: any) => {
  let customConfig: any = {};

  if (reqOrConfig && typeof reqOrConfig === 'object') {
    if (reqOrConfig.headers || reqOrConfig.query || reqOrConfig.body) {
      const req = reqOrConfig;
      customConfig = {
        urlEndpoint: req.headers?.['x-imagekit-url-endpoint'] || req.query?.urlEndpoint || req.body?.imagekitConfig?.urlEndpoint,
        publicKey: req.headers?.['x-imagekit-public-key'] || req.query?.publicKey || req.body?.imagekitConfig?.publicKey,
        privateKey: req.headers?.['x-imagekit-private-key'] || req.query?.privateKey || req.body?.imagekitConfig?.privateKey,
      };
    } else {
      customConfig = reqOrConfig;
    }
  }

  const clean = (val?: any) => typeof val === 'string' ? val.replace(/^["']|["']$/g, '').trim() : '';

  const urlEndpoint = clean(
    customConfig?.urlEndpoint || 
    process.env.VITE_IMAGEKIT_URL_ENDPOINT || 
    process.env.IMAGEKIT_URL_ENDPOINT || 
    process.env.IMAGE_KIT_URL_ENDPOINT
  );

  const publicKey = clean(
    customConfig?.publicKey || 
    process.env.VITE_IMAGEKIT_PUBLIC_KEY || 
    process.env.IMAGEKIT_PUBLIC_KEY || 
    process.env.IMAGE_KIT_PUBLIC_KEY
  );

  const privateKey = clean(
    customConfig?.privateKey || 
    process.env.IMAGEKIT_PRIVATE_KEY || 
    process.env.VITE_IMAGEKIT_PRIVATE_KEY || 
    process.env.IMAGE_KIT_PRIVATE_KEY
  );

  if (!urlEndpoint || !publicKey || !privateKey) {
    const missing = [];
    if (!urlEndpoint) missing.push('urlEndpoint (VITE_IMAGEKIT_URL_ENDPOINT / IMAGEKIT_URL_ENDPOINT)');
    if (!publicKey) missing.push('publicKey (VITE_IMAGEKIT_PUBLIC_KEY / IMAGEKIT_PUBLIC_KEY)');
    if (!privateKey) missing.push('privateKey (IMAGEKIT_PRIVATE_KEY)');
    throw new Error(`ImageKit credentials missing on server: ${missing.join(', ')}. Please configure environment variables in your deployment settings.`);
  }

  return new ImageKit({
    urlEndpoint,
    publicKey,
    privateKey
  });
};

// API Route to fetch public configuration for ImageKit
apiApp.get('/imagekit/config', (req, res) => {
  const urlEndpoint = (process.env.VITE_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT || process.env.IMAGE_KIT_URL_ENDPOINT || '').trim();
  const publicKey = (process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || process.env.IMAGE_KIT_PUBLIC_KEY || '').trim();
  res.json({ urlEndpoint, publicKey });
});

// API Route to fetch auth parameters for client-side upload
apiApp.get('/imagekit/auth', (req, res) => {
  try {
    const ik = getIkClient(req);
    const authenticationParameters = ik.getAuthenticationParameters();
    const publicKey = (
      req.headers['x-imagekit-public-key'] ||
      process.env.VITE_IMAGEKIT_PUBLIC_KEY || 
      process.env.IMAGEKIT_PUBLIC_KEY || 
      process.env.IMAGE_KIT_PUBLIC_KEY || 
      ''
    ).toString().trim();

    res.json({
        ...authenticationParameters,
        publicKey
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
    const { file, fileName, folder, useUniqueFileName } = body;
    const ik = getIkClient(req);
    
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
    const ik = getIkClient(req);
    const pathParam = req.query.path as string | undefined;
    const result = await ik.listFiles({
      skip: 0,
      limit: 1000,
      path: pathParam || undefined,
    });
    
    if (Array.isArray(result)) {
      res.json(result.filter((f: any) => f.type !== 'folder'));
    } else {
      res.json([]);
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// API Route to list all unique folders (virtual + actual)
apiApp.get('/imagekit/folders', async (req, res) => {
  try {
    const ik = getIkClient(req);
    const result = await ik.listFiles({ skip: 0, limit: 1000 });
    const folders = new Set<string>();
    
    if (Array.isArray(result)) {
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
    }
    res.json(Array.from(folders).sort());
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// API Route to create folder
apiApp.post('/imagekit/folder', async (req, res) => {
  try {
     const ik = getIkClient(req);
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
    const ik = getIkClient(req);
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
    const ik = getIkClient(req);
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
