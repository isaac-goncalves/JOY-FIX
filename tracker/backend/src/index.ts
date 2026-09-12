import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import controllersRouter from './routes/controllers.js';
import partsRouter from './routes/parts.js';
import maintenanceRouter from './routes/maintenance.js';
import transactionsRouter from './routes/transactions.js';
import dashboardRouter from './routes/dashboard.js';
import { migrate } from './db/migrate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Run migrations
migrate();

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/controllers', controllersRouter);
app.use('/api/parts', partsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/dashboard', dashboardRouter);

// Serve frontend static files in production
const frontendDist = join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`JoyFix Tracker API running on http://localhost:${PORT}`);
});
