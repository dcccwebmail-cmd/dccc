import express from 'express';
import apiApp from '../server/api';

const app = express();

// Mount the API router
// On Vercel, the incoming request URL path can be '/api/imagekit/auth' or '/imagekit/auth'.
// By mounting at both '/api' and '/', we ensure that all routes match correctly in both
// Vercel Serverless Functions and local Express development environments.
app.use('/api', apiApp);
app.use('/', apiApp);

// Catch any serverless level error and guarantee JSON response
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Serverless Entry Global Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "A serverless function error occurred."
  });
});

export default app;
