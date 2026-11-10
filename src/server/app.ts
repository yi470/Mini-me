import express from 'express';
import { handleReflect, handleRevise } from './geminiService.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

// Set CORS and JSON content-type headers for API routes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoint for monitoring & Vercel inspection
app.get(['/api/health', '/api', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'In My Colors API',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now(),
  });
});

// Reflection endpoints (support both with /api and without /api prefix for flexibility)
app.post(['/api/reflect', '/reflect'], handleReflect);
app.post(['/api/reflect/revise', '/reflect/revise', '/revise'], handleRevise);

// 405 Method Not Allowed fallback for reflection endpoints
app.all(['/api/reflect', '/reflect', '/api/reflect/revise', '/reflect/revise', '/revise'], (req, res) => {
  res.status(405).json({
    error: `Method ${req.method} not allowed on ${req.url}. Use POST.`,
  });
});

// JSON 404 handler for any unmatched /api routes
app.all(['/api/*', '/reflect*'], (req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.url}`,
  });
});

// Global error handler guaranteeing valid JSON responses
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    error: err?.message || 'An unexpected internal server error occurred.',
  });
});

export default app;
