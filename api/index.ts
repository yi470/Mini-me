export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const responseBody = {
    status: 'ok',
    service: 'In My Colors API',
    endpoints: ['/api/reflect', '/api/reflect/revise'],
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now(),
  };

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(responseBody);
  }

  res.statusCode = 200;
  res.end(JSON.stringify(responseBody));
}
