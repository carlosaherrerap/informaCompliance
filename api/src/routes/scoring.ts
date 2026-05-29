import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { verify } from 'jsonwebtoken';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL || '' });
const jwtSecret = process.env.JWT_SECRET || 'secret';

function authMiddleware(req: Request, res: Response, next: Function) {
  try {
    const auth = String(req.headers.authorization || '');
    const token = auth.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = verify(token, jwtSecret) as any;
    (req as any).uid = Number(decoded.uid);
    (req as any).userRole = decoded.role || 'user';
    next();
  } catch {
    res.status(401).json({ error: 'No autorizado' });
  }
}

// Scoring algorithm: sum of points * weight from each field's data-foo (e.g., "5|0.10")
function calculateScore(payload: any): { score: number; label: string; color: string } {
  let total = 0;
  for (const key in payload) {
    const val = payload[key];
    if (typeof val === 'string' && val.includes('|')) {
      const [pointsStr, weightStr] = val.split('|');
      const points = parseFloat(pointsStr) || 0;
      const weight = parseFloat(weightStr) || 1;
      total += points * weight;
    }
  }
  const score = Number(total.toFixed(2));
  // Determine label/color based on thresholds
  let label = 'BAJO';
  let color = '#28a745'; // green
  if (score > 70) { label = 'ALTO'; color = '#dc3545'; }
  else if (score > 40) { label = 'MEDIO'; color = '#fd7e14'; }
  return { score, label, color };
}
router.post('/scoring/natural', authMiddleware, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const payload = req.body;
  const result = calculateScore(payload);
  try {
    await pool.query(
      `INSERT INTO risk_scoring (user_id, type, payload, result) VALUES ($1, $2, $3, $4)`,
      [uid, 'natural', payload, result]
    );
    res.json({ success: true, result });
  } catch (err) {
    console.error('Scoring insert error:', err);
    res.status(500).json({ error: 'Error persisting scoring' });
  }
});

router.post('/scoring/company', authMiddleware, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const payload = req.body;
  const result = calculateScore(payload);
  try {
    await pool.query(
      `INSERT INTO risk_scoring (user_id, type, payload, result) VALUES ($1, $2, $3, $4)`,
      [uid, 'company', payload, result]
    );
    res.json({ success: true, result });
  } catch (err) {
    console.error('Scoring insert error:', err);
    res.status(500).json({ error: 'Error persisting scoring' });
  }
});

export default router;
