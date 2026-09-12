import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { migrate } from './migrate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../joyfix.db');

export function seed(dbPathArg?: string) {
  const path = dbPathArg || dbPath;
  migrate(path);
  const db = new Database(path);
  db.pragma('foreign_keys = ON');

  const existingControllers = db.prepare('SELECT COUNT(*) as count FROM controllers').get() as { count: number };
  if (existingControllers.count > 0) {
    console.log('Database already seeded. Skipping.');
    db.close();
    return db;
  }

  const insertController = db.prepare(`
    INSERT INTO controllers (serial_or_label, type, color, status, purchase_price, purchase_date, seller_info, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPart = db.prepare(`
    INSERT INTO parts (name, type, quantity, unit_cost, supplier, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMaintenance = db.prepare(`
    INSERT INTO maintenance_logs (controller_id, date, description, parts_used, labor_cost, total_cost, technician)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (controller_id, type, date, value, buyer_seller_info, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    // Controllers
    insertController.run('Joy-Con L Azul #001', 'JOYCON_L', 'Azul', 'SOLD', 45, '2025-01-15', 'Mercado Livre', 'Drift no analógico');
    insertController.run('Joy-Con R Vermelho #002', 'JOYCON_R', 'Vermelho', 'READY', 50, '2025-02-01', 'OLX', 'Botão R com problema');
    insertController.run('DualSense Preto #003', 'DUALSENSE', 'Preto', 'STOCK', 120, '2025-03-10', 'Cliente local', 'Análógico com drift leve');
    insertController.run('Xbox Series Branco #004', 'XBOX', 'Branco', 'MAINTENANCE', 150, '2025-04-05', 'Facebook Marketplace', 'Bateria viciada');
    insertController.run('Pro Controller Nintendo #005', 'PRO_CONTROLLER', 'Preto', 'SCRAP', 80, '2024-12-20', 'Feira', 'Placa com defeito, não vale conserto');

    // Parts
    insertPart.run('Analógico Hall Effect ESX300', 'ANALOG', 8, 25, 'AliExpress', 3);
    insertPart.run('Analógico Original PS5', 'ANALOG', 3, 35, 'Descarte', 2);
    insertPart.run('Botão DualSense (conjunto)', 'BUTTON', 12, 8, 'AliExpress', 4);
    insertPart.run('Shell Joy-Con Azul', 'SHELL', 2, 15, 'AliExpress', 2);
    insertPart.run('Bateria DualSense', 'OTHER', 4, 40, 'Mercado Livre', 2);
    insertPart.run('Cabo USB-C curto', 'CABLE', 10, 5, 'Shopee', 5);
    insertPart.run('Membrana botões Xbox', 'BUTTON', 6, 10, 'AliExpress', 3);
    insertPart.run('Analógico Magnético TMR', 'ANALOG', 5, 45, 'AliExpress', 2);

    // Maintenance logs
    insertMaintenance.run(1, '2025-01-20', 'Troca de analógico por Hall Effect', JSON.stringify([{ part_id: 1, qty: 1, cost: 25 }]), 60, 85, 'Isaac');
    insertMaintenance.run(2, '2025-02-10', 'Limpeza e lubrificação de botão R', JSON.stringify([]), 30, 30, 'Isaac');
    insertMaintenance.run(4, '2025-04-15', 'Instalação de nova bateria', JSON.stringify([{ part_id: 5, qty: 1, cost: 40 }]), 50, 90, 'Isaac');

    // Transactions
    insertTransaction.run(1, 'PURCHASE', '2025-01-15', 45, 'Mercado Livre', 'Compra para revenda');
    insertTransaction.run(1, 'SALE', '2025-02-05', 130, 'WhatsApp', 'Vendido após conserto');
    insertTransaction.run(2, 'PURCHASE', '2025-02-01', 50, 'OLX', '');
    insertTransaction.run(3, 'PURCHASE', '2025-03-10', 120, 'Cliente local', '');
    insertTransaction.run(4, 'PURCHASE', '2025-04-05', 150, 'Facebook', '');
    insertTransaction.run(5, 'PURCHASE', '2024-12-20', 80, 'Feira', '');
  });

  seedAll();
  console.log('Seed data inserted successfully.');
  db.close();
  return db;
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seed();
}
