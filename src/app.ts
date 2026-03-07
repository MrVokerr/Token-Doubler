import express from 'express';
import cors from 'cors';
import cardsRouter from './routes/cards';
import simulateRouter from './routes/simulate';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/cards', cardsRouter);
app.use('/api/simulate', simulateRouter);

/** Health check */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;

/* Start the server only when this file is run directly (not during tests). */
if (require.main === module) {
  const PORT = process.env.PORT ?? 3000;
  app.listen(PORT, () => {
    console.log(`Token-Doubler API listening on port ${PORT}`);
  });
}
