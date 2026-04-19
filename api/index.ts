import express from 'express';
import apiApp from '../server/api';

const app = express();

// Mount the API router
// Vercel routes `/api/*` rewrites to this function, so it mounts at `/api`
app.use('/api', apiApp);

export default app;
