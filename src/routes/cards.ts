import { Router, Request, Response } from 'express';
import cards from '../data/cards.json';
import { CardEffect } from '../types';

const router = Router();

/**
 * GET /api/cards
 * Returns the full card database categorised by effect type.
 */
router.get('/', (_req: Request, res: Response) => {
  res.json(cards as CardEffect[]);
});

export default router;
