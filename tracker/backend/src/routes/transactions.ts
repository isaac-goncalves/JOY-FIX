import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { controller_id, type } = req.query;
  let query = 'SELECT t.*, c.serial_or_label FROM transactions t JOIN controllers c ON t.controller_id = c.id WHERE 1=1';
  const params: any[] = [];

  if (controller_id) {
    query += ' AND t.controller_id = ?';
    params.push(controller_id);
  }
  if (type && typeof type === 'string') {
    query += ' AND t.type = ?';
    params.push(type);
  }

  query += ' ORDER BY t.date DESC';
  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { controller_id, type, date, value, buyer_seller_info, notes } = req.body;

  if (!controller_id || !type || value === undefined) {
    res.status(400).json({ error: 'controller_id, type, and value are required' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO transactions (controller_id, type, date, value, buyer_seller_info, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(controller_id, type, date || new Date().toISOString().split('T')[0], value, buyer_seller_info || '', notes || '');

  // If SALE, update controller status to SOLD
  if (type === 'SALE') {
    db.prepare('UPDATE controllers SET status = \'SOLD\', updated_at = datetime(\'now\') WHERE id = ?').run(controller_id);
  }

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(transaction);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
