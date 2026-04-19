import express from 'express';
import cors from 'cors';
import ImageKit from 'imagekit';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // ImageKit initialization
  // Fails gracefully if not provided
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
  app.get('/api/imagekit/auth', (req, res) => {
    try {
      const ik = getIkClient();
      const authenticationParameters = ik.getAuthenticationParameters();
      res.json(authenticationParameters);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route to list media files
  app.get('/api/imagekit/files', async (req, res) => {
    try {
      const ik = getIkClient();
      const pathParam = req.query.path as string | undefined;
      const files = await ik.listFiles({
        skip: 0,
        limit: 100,
        path: pathParam || undefined,
      });
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route to list all unique folders (virtual)
  app.get('/api/imagekit/folders', async (req, res) => {
    try {
      const ik = getIkClient();
      // Fetch maximum items to parse folders
      const files = await ik.listFiles({ skip: 0, limit: 1000 });
      const folders = new Set<string>();
      files.forEach((f: any) => {
        if (f.folder) folders.add(f.folder);
      });
      res.json(Array.from(folders).sort());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route to create folder
  app.post('/api/imagekit/folder', async (req, res) => {
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
  app.put('/api/imagekit/files/:fileId/rename', async (req, res) => {
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
  app.delete('/api/imagekit/files/:fileId', async (req, res) => {
    try {
      const ik = getIkClient();
      const { fileId } = req.params;
      await ik.deleteFile(fileId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
