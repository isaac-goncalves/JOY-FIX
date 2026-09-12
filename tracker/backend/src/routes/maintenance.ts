import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { controller_id } = req.query;
  let query = 'SELECT ml.*, c.serial_or_label, c.type as controller_type FROM maintenance_logs ml JOIN controllers c ON ml.controller_id = c.id WHERE 1=1';
  const params: any[] = [];

  if (controller_id) {
    query += ' AND ml.controller_id = ?';
    params.push(controller_id);
  }

  query += ' ORDER BY ml.date DESC';
  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { controller_id, date, description, parts_used, labor_cost, technician } = req.body;

  if (!controller_id || !description) {
    res.status(400).json({ error: 'controller_id and description are required' });
    return;
  }

  const parts = Array.isArray(parts_used) ? parts_used : [];
  let partsCost = 0;
  for (const p of parts) {
    partsCost += (p.cost || 0) * (p.qty || 1);
  }
  const total = partsCost + (labor_cost || 0);

  const result = db.prepare(`
    INSERT INTO maintenance_logs (controller_id, date, description, parts_used, labor_cost, total_cost, technician)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(controller_id, date || new Date().toISOString().split('T')[0], description, JSON.stringify(parts), labor_cost || 0, total, technician || 'Isaac');

  // Deduct parts from inventory
  for (const p of parts) {
    if (p.part_id) {
      db.prepare('UPDATE parts SET quantity = MAX(0, quantity - ?), updated_at = datetime(\'now\') WHERE id = ?').run(p.qty || 1, p.part_id);
    }
  }

  const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(log);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM maintenance_logs WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Maintenance log not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
