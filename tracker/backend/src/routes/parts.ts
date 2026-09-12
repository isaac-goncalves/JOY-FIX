import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { type, search } = req.query;
  let query = 'SELECT * FROM parts WHERE 1=1';
  const params: any[] = [];

  if (type && typeof type === 'string') {
    query += ' AND type = ?';
    params.push(type);
  }
  if (search && typeof search === 'string') {
    query += ' AND (name LIKE ? OR supplier LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  query += ' ORDER BY name ASC';
  const parts = db.prepare(query).all(...params);
  res.json(parts);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
  if (!part) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }
  res.json(part);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, type, quantity, unit_cost, supplier, low_stock_threshold } = req.body;

  if (!name || !type) {
    res.status(400).json({ error: 'name and type are required' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO parts (name, type, quantity, unit_cost, supplier, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, type, quantity || 0, unit_cost || 0, supplier || '', low_stock_threshold || 3);

  const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(part);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, type, quantity, unit_cost, supplier, low_stock_threshold } = req.body;

  const existing = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }

  db.prepare(`
    UPDATE parts SET
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      quantity = COALESCE(?, quantity),
      unit_cost = COALESCE(?, unit_cost),
      supplier = COALESCE(?, supplier),
      low_stock_threshold = COALESCE(?, low_stock_threshold),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, type, quantity, unit_cost, supplier, low_stock_threshold, req.params.id);

  const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
  res.json(part);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM parts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
