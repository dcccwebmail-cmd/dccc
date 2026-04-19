import express from 'express';
import cors from 'cors';
import ImageKit from 'imagekit';

const apiApp = express.Router();

apiApp.use(cors());
apiApp.use(express.json());

// ImageKit initialization
let imagekit: ImageKit | null = null;
const getIkClient = () => {
  if (!imagekit) {
    if (!process.env.VITE_IMAGEKIT_URL_ENDPOINT || !process.env.VITE_IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY) {
      throw new Error('ImageKit environment variables are missing.');
    }
    imagekit = new ImageKit({
      urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT,
      publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY
    });
  }
  return imagekit;
};

// API Route to fetch auth parameters for client-side upload
apiApp.get('/imagekit/auth', (req, res) => {
  try {
    const ik = getIkClient();
    const authenticationParameters = ik.getAuthenticationParameters();
    res.json(authenticationParameters);
  } catch (error: any) {
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

export default apiApp;
