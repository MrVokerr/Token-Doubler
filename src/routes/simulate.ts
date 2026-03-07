import { Router, Request, Response } from 'express';
import { calculateTokenYield } from '../engine/calculator';
import { SimulateRequest } from '../types';

const router = Router();

/**
 * POST /api/simulate
 *
 * Body: SimulateRequest
 *   { initialEvent: { tokenType, quantity }, effects: CardEffect[] }
 *
 * Returns: ComparisonResult
 *   { initialEvent, userSimulation, optimalSimulation }
 */
router.post('/', (req: Request, res: Response) => {
  const body = req.body as SimulateRequest;

  if (
    !body ||
    !body.initialEvent ||
    typeof body.initialEvent.tokenType !== 'string' ||
    typeof body.initialEvent.quantity !== 'number' ||
    body.initialEvent.quantity < 0 ||
    !Array.isArray(body.effects)
  ) {
    res.status(400).json({
      error:
        'Invalid request body. Expected { initialEvent: { tokenType: string, quantity: number }, effects: CardEffect[] }',
    });
    return;
  }

  const result = calculateTokenYield(body);
  res.json(result);
});

export default router;
