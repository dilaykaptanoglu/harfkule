import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.js';
import { friendsRouter } from './routes/friends.js';
import { gamesRouter } from './routes/games.js';
import './db.js';

const PORT = Number(process.env.PORT || 8787);
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'harfkule-api', version: 1 });
});

app.use('/auth', authRouter);
app.use('/friends', friendsRouter);
app.use('/games', gamesRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Sunucu hatası.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HarfKule API http://0.0.0.0:${PORT}`);
});
