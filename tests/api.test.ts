import request from 'supertest';
import app from '../src/app';

// ---------------------------------------------------------------------------
// GET /api/cards
// ---------------------------------------------------------------------------
describe('GET /api/cards', () => {
  it('returns 200 with an array', async () => {
    const res = await request(app).get('/api/cards');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('every card has the required schema fields', async () => {
    const res = await request(app).get('/api/cards');
    for (const card of res.body) {
      expect(card).toHaveProperty('cardName');
      expect(card).toHaveProperty('effectType');
      expect(['ADD', 'MULT', 'REPLACE']).toContain(card.effectType);
      expect(card).toHaveProperty('modifierValue');
      expect(typeof card.modifierValue).toBe('number');
      expect(card).toHaveProperty('targetTokenType');
    }
  });

  it('includes known cards from all three effect categories', async () => {
    const res = await request(app).get('/api/cards');
    const names = res.body.map((c: { cardName: string }) => c.cardName);
    expect(names).toContain('Doubling Season');       // MULT
    expect(names).toContain('Peregrin Took');         // ADD
    expect(names).toContain('Academy Manufactor');    // REPLACE
  });
});

// ---------------------------------------------------------------------------
// POST /api/simulate
// ---------------------------------------------------------------------------
describe('POST /api/simulate', () => {
  const validBody = {
    initialEvent: { tokenType: 'Treasure', quantity: 1 },
    effects: [
      {
        cardName: 'Doubling Season',
        effectType: 'MULT',
        modifierValue: 2,
        targetTokenType: 'ALL',
      },
      {
        cardName: 'Peregrin Took',
        effectType: 'ADD',
        modifierValue: 1,
        targetTokenType: 'Food',
      },
    ],
  };

  it('returns 200 with the full comparison object', async () => {
    const res = await request(app).post('/api/simulate').send(validBody);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('initialEvent');
    expect(res.body).toHaveProperty('userSimulation');
    expect(res.body).toHaveProperty('optimalSimulation');
  });

  it('matches the exact example from the problem statement §4', async () => {
    const res = await request(app).post('/api/simulate').send(validBody);
    const { userSimulation, optimalSimulation } = res.body;

    expect(userSimulation.executionOrder).toEqual([
      'Doubling Season',
      'Peregrin Took',
    ]);
    expect(userSimulation.stepByStep).toEqual([
      '1. Initial: 1 Treasure',
      '2. Apply Doubling Season: 2 Treasures',
      '3. Apply Peregrin Took: 2 Treasures, 1 Food',
    ]);
    expect(userSimulation.finalTotal).toBe(3);

    expect(optimalSimulation.executionOrder).toEqual([
      'Peregrin Took',
      'Doubling Season',
    ]);
    expect(optimalSimulation.stepByStep).toEqual([
      '1. Initial: 1 Treasure',
      '2. Apply Peregrin Took: 1 Treasure, 1 Food',
      '3. Apply Doubling Season: 2 Treasures, 2 Foods',
    ]);
    expect(optimalSimulation.finalTotal).toBe(4);
  });

  it('returns 400 when body is missing', async () => {
    const res = await request(app).post('/api/simulate').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when quantity is negative', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({ ...validBody, initialEvent: { tokenType: 'Treasure', quantity: -1 } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when effects is not an array', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({ initialEvent: { tokenType: 'Treasure', quantity: 1 }, effects: null });
    expect(res.status).toBe(400);
  });

  it('handles an empty effects array (identity)', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({ initialEvent: { tokenType: 'Treasure', quantity: 5 }, effects: [] });
    expect(res.status).toBe(200);
    expect(res.body.userSimulation.finalTotal).toBe(5);
    expect(res.body.optimalSimulation.finalTotal).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------
describe('GET /health', () => {
  it('returns { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
