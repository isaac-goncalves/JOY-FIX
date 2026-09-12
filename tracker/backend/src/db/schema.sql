CREATE TABLE IF NOT EXISTS controllers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_or_label TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('JOYCON_L','JOYCON_R','DUALSENSE','XBOX','PRO_CONTROLLER','OUTRO')),
  color TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'STOCK' CHECK(status IN ('STOCK','MAINTENANCE','READY','SOLD','SCRAP')),
  purchase_price REAL NOT NULL DEFAULT 0,
  purchase_date TEXT NOT NULL DEFAULT (date('now')),
  seller_info TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('ANALOG','BUTTON','SHELL','CABLE','OTHER')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL DEFAULT 0,
  supplier TEXT DEFAULT '',
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  controller_id INTEGER NOT NULL,
  date TEXT NOT NULL DEFAULT (date('now')),
  description TEXT NOT NULL DEFAULT '',
  parts_used TEXT NOT NULL DEFAULT '[]',
  labor_cost REAL NOT NULL DEFAULT 0,
  total_cost REAL NOT NULL DEFAULT 0,
  technician TEXT DEFAULT 'Isaac',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (controller_id) REFERENCES controllers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  controller_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('PURCHASE','SALE')),
  date TEXT NOT NULL DEFAULT (date('now')),
  value REAL NOT NULL DEFAULT 0,
  buyer_seller_info TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (controller_id) REFERENCES controllers(id) ON DELETE CASCADE
);
