import express from 'express';
import apiApp from '../server/api';

const app = express();

// Mount the API router
// On Vercel, the incoming request URL path can be '/api/imagekit/auth' or '/imagekit/auth'.
// By mounting at both '/api' and '/', we ensure that all routes match correctly in both
// Vercel Serverless Functions and local Express development environments.
app.use('/api', apiApp);
app.use('/', apiApp);

export default app;
