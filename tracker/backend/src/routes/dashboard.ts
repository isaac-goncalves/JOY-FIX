import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/stats', (_req, res) => {
  const db = getDb();

  const totalByStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM controllers GROUP BY status
  `).all();

  const totalInvested = db.prepare(`
    SELECT COALESCE(SUM(purchase_price), 0) as total FROM controllers WHERE status != 'SCRAP'
  `).get() as { total: number };

  const totalPartsCost = db.prepare(`
    SELECT COALESCE(SUM(ml.total_cost), 0) as total FROM maintenance_logs ml
    JOIN controllers c ON ml.controller_id = c.id
    WHERE c.status != 'SCRAP'
  `).get() as { total: number };

  const totalSales = db.prepare(`
    SELECT COALESCE(SUM(value), 0) as total FROM transactions WHERE type = 'SALE'
  `).get() as { total: number };

  const totalPurchases = db.prepare(`
    SELECT COALESCE(SUM(value), 0) as total FROM transactions WHERE type = 'PURCHASE'
  `).get() as { total: number };

  const totalControllers = db.prepare('SELECT COUNT(*) as count FROM controllers').get() as { count: number };

  const totalParts = db.prepare('SELECT SUM(quantity) as count FROM parts').get() as { count: number };

  const lowStockParts = db.prepare('SELECT * FROM parts WHERE quantity <= low_stock_threshold').all();

  const profit = totalSales.total - totalPurchases.total - totalPartsCost.total;

  res.json({
    total_controllers: totalControllers.count,
    total_parts_stock: totalParts.count || 0,
    total_invested: totalInvested.total + totalPartsCost.total,
    total_sales: totalSales.total,
    total_purchases: totalPurchases.total,
    total_parts_cost: totalPartsCost.total,
    profit,
    status_breakdown: totalByStatus,
    low_stock_parts: lowStockParts,
  });
});

router.get('/monthly-profit', (_req, res) => {
  const db = getDb();
  const monthly = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'SALE' THEN value ELSE 0 END) as sales,
      SUM(CASE WHEN type = 'PURCHASE' THEN value ELSE 0 END) as purchases
    FROM transactions
    WHERE date >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all();
  res.json(monthly);
});

router.get('/controllers-by-type', (_req, res) => {
  const db = getDb();
  const byType = db.prepare(`
    SELECT type, COUNT(*) as count FROM controllers GROUP BY type
  `).all();
  res.json(byType);
});

router.get('/top-types', (_req, res) => {
  const db = getDb();
  const top = db.prepare(`
    SELECT 
      c.type,
      COUNT(*) as total_sold,
      SUM(t.value) as total_revenue
    FROM transactions t
    JOIN controllers c ON t.controller_id = c.id
    WHERE t.type = 'SALE'
    GROUP BY c.type
    ORDER BY total_revenue DESC
    LIMIT 5
  `).all();
  res.json(top);
});

export default router;
