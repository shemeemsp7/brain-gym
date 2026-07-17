// pages/api/health.js
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'brain-gym-api'
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
