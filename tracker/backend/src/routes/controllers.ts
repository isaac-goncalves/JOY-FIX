import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { status, type, search } = req.query;
  let query = 'SELECT * FROM controllers WHERE 1=1';
  const params: any[] = [];

  if (status && typeof status === 'string') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (type && typeof type === 'string') {
    query += ' AND type = ?';
    params.push(type);
  }
  if (search && typeof search === 'string') {
    query += ' AND (serial_or_label LIKE ? OR color LIKE ? OR notes LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY created_at DESC';
  const controllers = db.prepare(query).all(...params);
  res.json(controllers);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const controller = db.prepare('SELECT * FROM controllers WHERE id = ?').get(req.params.id);
  if (!controller) {
    res.status(404).json({ error: 'Controller not found' });
    return;
  }

  const maintenance = db.prepare('SELECT * FROM maintenance_logs WHERE controller_id = ? ORDER BY date DESC').all(req.params.id);
  const transactions = db.prepare('SELECT * FROM transactions WHERE controller_id = ? ORDER BY date DESC').all(req.params.id);

  const totalMaintenanceCost = (maintenance as any[]).reduce((sum, m) => sum + (m.total_cost || 0), 0);

  res.json({ ...controller, maintenance, transactions, total_maintenance_cost: totalMaintenanceCost });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { serial_or_label, type, color, status, purchase_price, purchase_date, seller_info, notes } = req.body;

  if (!serial_or_label || !type) {
    res.status(400).json({ error: 'serial_or_label and type are required' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO controllers (serial_or_label, type, color, status, purchase_price, purchase_date, seller_info, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(serial_or_label, type, color || '', status || 'STOCK', purchase_price || 0, purchase_date || new Date().toISOString().split('T')[0], seller_info || '', notes || '');

  const controller = db.prepare('SELECT * FROM controllers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(controller);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { serial_or_label, type, color, status, purchase_price, purchase_date, seller_info, notes } = req.body;

  const existing = db.prepare('SELECT * FROM controllers WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Controller not found' });
    return;
  }

  db.prepare(`
    UPDATE controllers SET
      serial_or_label = COALESCE(?, serial_or_label),
      type = COALESCE(?, type),
      color = COALESCE(?, color),
      status = COALESCE(?, status),
      purchase_price = COALESCE(?, purchase_price),
      purchase_date = COALESCE(?, purchase_date),
      seller_info = COALESCE(?, seller_info),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(serial_or_label, type, color, status, purchase_price, purchase_date, seller_info, notes, req.params.id);

  const controller = db.prepare('SELECT * FROM controllers WHERE id = ?').get(req.params.id);
  res.json(controller);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM controllers WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Controller not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
