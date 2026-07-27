import express from 'express';
import apiApp from '../server/api';

const app = express();

// Path normalization for Vercel Serverless Function rewrites
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    req.url = req.url.replace(/^\/api/, '');
  } else if (req.url === '/api') {
    req.url = '/';
  }
  next();
});

// Mount router
app.use(apiApp);

// Catch-all serverless error handler ensuring clean JSON output
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Serverless Entry Global Error:", err);
  if (!res.headersSent) {
    res.status(err.status || err.statusCode || 500).json({
      error: err.message || "A serverless function error occurred."
    });
  }
});

export default app;
