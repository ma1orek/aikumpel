import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    if (req.body.version && req.body.input) {
      // Tworzenie predykcji
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } else if (req.body.id) {
      // Sprawdzanie statusu predykcji
      const response = await fetch(`https://api.replicate.com/v1/predictions/${req.body.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      res.status(400).json({ error: 'Invalid request body' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Replicate API error', details: error?.message || String(error) });
  }
} 