import {
  applyEffect,
  calculateTokenYield,
  formatState,
  simulate,
  sortEffectsOptimally,
} from '../src/engine/calculator';
import { CardEffect, TokenGroup } from '../src/types';

// ---------------------------------------------------------------------------
// formatState
// ---------------------------------------------------------------------------
describe('formatState', () => {
  it('uses plural for quantity > 1', () => {
    expect(formatState([{ tokenType: 'Treasure', quantity: 2 }])).toBe(
      '2 Treasures',
    );
  });

  it('uses singular for quantity === 1', () => {
    expect(formatState([{ tokenType: 'Food', quantity: 1 }])).toBe('1 Food');
  });

  it('joins multiple groups with a comma', () => {
    const state: TokenGroup[] = [
      { tokenType: 'Treasure', quantity: 2 },
      { tokenType: 'Food', quantity: 1 },
    ];
    expect(formatState(state)).toBe('2 Treasures, 1 Food');
  });
});

// ---------------------------------------------------------------------------
// applyEffect – ADD
// ---------------------------------------------------------------------------
describe('applyEffect – ADD', () => {
  const base: TokenGroup[] = [{ tokenType: 'Treasure', quantity: 1 }];

  it('adds a new token group when targetTokenType is absent', () => {
    const effect: CardEffect = {
      cardName: 'Peregrin Took',
      effectType: 'ADD',
      modifierValue: 1,
      targetTokenType: 'Food',
    };
    const result = applyEffect(base, effect);
    expect(result).toEqual([
      { tokenType: 'Treasure', quantity: 1 },
      { tokenType: 'Food', quantity: 1 },
    ]);
  });

  it('increments an existing token group', () => {
    const state: TokenGroup[] = [
      { tokenType: 'Food', quantity: 2 },
    ];
    const effect: CardEffect = {
      cardName: 'Peregrin Took',
      effectType: 'ADD',
      modifierValue: 1,
      targetTokenType: 'Food',
    };
    const result = applyEffect(state, effect);
    expect(result).toEqual([{ tokenType: 'Food', quantity: 3 }]);
  });

  it('uses modifierValue when adding', () => {
    const effect: CardEffect = {
      cardName: 'Test Add',
      effectType: 'ADD',
      modifierValue: 3,
      targetTokenType: 'Squirrel',
    };
    const result = applyEffect(base, effect);
    expect(result).toEqual([
      { tokenType: 'Treasure', quantity: 1 },
      { tokenType: 'Squirrel', quantity: 3 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// applyEffect – MULT
// ---------------------------------------------------------------------------
describe('applyEffect – MULT', () => {
  const base: TokenGroup[] = [
    { tokenType: 'Treasure', quantity: 2 },
    { tokenType: 'Food', quantity: 1 },
  ];

  it('doubles all token groups when targetTokenType is ALL', () => {
    const effect: CardEffect = {
      cardName: 'Doubling Season',
      effectType: 'MULT',
      modifierValue: 2,
      targetTokenType: 'ALL',
    };
    expect(applyEffect(base, effect)).toEqual([
      { tokenType: 'Treasure', quantity: 4 },
      { tokenType: 'Food', quantity: 2 },
    ]);
  });

  it('triples all token groups (Ojer Taq)', () => {
    const effect: CardEffect = {
      cardName: 'Ojer Taq, Deepest Foundation',
      effectType: 'MULT',
      modifierValue: 3,
      targetTokenType: 'ALL',
    };
    expect(applyEffect([{ tokenType: 'Treasure', quantity: 1 }], effect)).toEqual([
      { tokenType: 'Treasure', quantity: 3 },
    ]);
  });

  it('only multiplies the targeted token type', () => {
    const effect: CardEffect = {
      cardName: 'Targeted Mult',
      effectType: 'MULT',
      modifierValue: 2,
      targetTokenType: 'Treasure',
    };
    const result = applyEffect(base, effect);
    expect(result).toEqual([
      { tokenType: 'Treasure', quantity: 4 },
      { tokenType: 'Food', quantity: 1 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// applyEffect – REPLACE
// ---------------------------------------------------------------------------
describe('applyEffect – REPLACE', () => {
  const base: TokenGroup[] = [{ tokenType: 'Treasure', quantity: 2 }];

  it('replaces token type (single target) keeping quantity', () => {
    const effect: CardEffect = {
      cardName: 'Koma, Cosmos Serpent',
      effectType: 'REPLACE',
      modifierValue: 1,
      targetTokenType: "Koma's Coil",
    };
    expect(applyEffect(base, effect)).toEqual([
      { tokenType: "Koma's Coil", quantity: 2 },
    ]);
  });

  it('splits into multiple token types (Academy Manufactor)', () => {
    const effect: CardEffect = {
      cardName: 'Academy Manufactor',
      effectType: 'REPLACE',
      modifierValue: 1,
      targetTokenType: 'Food,Gold,Treasure',
    };
    // 2 total tokens → 2 of each new type
    expect(applyEffect(base, effect)).toEqual([
      { tokenType: 'Food', quantity: 2 },
      { tokenType: 'Gold', quantity: 2 },
      { tokenType: 'Treasure', quantity: 2 },
    ]);
  });

  it('Academy Manufactor respects modifierValue > 1', () => {
    const effect: CardEffect = {
      cardName: 'Academy Manufactor x2',
      effectType: 'REPLACE',
      modifierValue: 2,
      targetTokenType: 'Food,Treasure',
    };
    expect(applyEffect([{ tokenType: 'Treasure', quantity: 1 }], effect)).toEqual([
      { tokenType: 'Food', quantity: 2 },
      { tokenType: 'Treasure', quantity: 2 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// sortEffectsOptimally
// ---------------------------------------------------------------------------
describe('sortEffectsOptimally', () => {
  const ds: CardEffect = {
    cardName: 'Doubling Season',
    effectType: 'MULT',
    modifierValue: 2,
    targetTokenType: 'ALL',
  };
  const pt: CardEffect = {
    cardName: 'Peregrin Took',
    effectType: 'ADD',
    modifierValue: 1,
    targetTokenType: 'Food',
  };
  const am: CardEffect = {
    cardName: 'Academy Manufactor',
    effectType: 'REPLACE',
    modifierValue: 1,
    targetTokenType: 'Food,Gold,Treasure',
  };

  it('places ADD before REPLACE before MULT', () => {
    const sorted = sortEffectsOptimally([ds, am, pt]);
    expect(sorted.map((e) => e.effectType)).toEqual(['ADD', 'REPLACE', 'MULT']);
  });

  it('does not mutate the original array', () => {
    const original = [ds, pt];
    sortEffectsOptimally(original);
    expect(original[0]).toBe(ds);
  });
});

// ---------------------------------------------------------------------------
// simulate – reproduces the exact example from the problem statement §4
// ---------------------------------------------------------------------------
describe('simulate – problem statement example', () => {
  const ds: CardEffect = {
    cardName: 'Doubling Season',
    effectType: 'MULT',
    modifierValue: 2,
    targetTokenType: 'ALL',
  };
  const pt: CardEffect = {
    cardName: 'Peregrin Took',
    effectType: 'ADD',
    modifierValue: 1,
    targetTokenType: 'Food',
  };
  const initial: TokenGroup = { tokenType: 'Treasure', quantity: 1 };

  it('user order [Doubling Season, Peregrin Took] → finalTotal 3', () => {
    const result = simulate(initial, [ds, pt]);
    expect(result.executionOrder).toEqual(['Doubling Season', 'Peregrin Took']);
    expect(result.stepByStep).toEqual([
      '1. Initial: 1 Treasure',
      '2. Apply Doubling Season: 2 Treasures',
      '3. Apply Peregrin Took: 2 Treasures, 1 Food',
    ]);
    expect(result.finalTotal).toBe(3);
  });

  it('optimal order [Peregrin Took, Doubling Season] → finalTotal 4', () => {
    const result = simulate(initial, [pt, ds]);
    expect(result.executionOrder).toEqual(['Peregrin Took', 'Doubling Season']);
    expect(result.stepByStep).toEqual([
      '1. Initial: 1 Treasure',
      '2. Apply Peregrin Took: 1 Treasure, 1 Food',
      '3. Apply Doubling Season: 2 Treasures, 2 Foods',
    ]);
    expect(result.finalTotal).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// calculateTokenYield – full comparison object
// ---------------------------------------------------------------------------
describe('calculateTokenYield', () => {
  const ds: CardEffect = {
    cardName: 'Doubling Season',
    effectType: 'MULT',
    modifierValue: 2,
    targetTokenType: 'ALL',
  };
  const pt: CardEffect = {
    cardName: 'Peregrin Took',
    effectType: 'ADD',
    modifierValue: 1,
    targetTokenType: 'Food',
  };
  const initial: TokenGroup = { tokenType: 'Treasure', quantity: 1 };

  it('returns initialEvent unchanged', () => {
    const result = calculateTokenYield({ initialEvent: initial, effects: [ds, pt] });
    expect(result.initialEvent).toEqual(initial);
  });

  it('userSimulation follows the given effect order', () => {
    const result = calculateTokenYield({ initialEvent: initial, effects: [ds, pt] });
    expect(result.userSimulation.executionOrder).toEqual([
      'Doubling Season',
      'Peregrin Took',
    ]);
    expect(result.userSimulation.finalTotal).toBe(3);
  });

  it('optimalSimulation auto-sorts to ADD before MULT', () => {
    const result = calculateTokenYield({ initialEvent: initial, effects: [ds, pt] });
    expect(result.optimalSimulation.executionOrder).toEqual([
      'Peregrin Took',
      'Doubling Season',
    ]);
    expect(result.optimalSimulation.finalTotal).toBe(4);
  });

  it('optimal yield formula (T + A) * M with multiple effects', () => {
    // T=1, A=1+1=2 (Peregrin + Chatterfang), M=2*2=4 (DS + Parallel Lives)
    // Optimal = (1 + 2) * 4 = 12 treasures... but tokens differ in type.
    // Numeric validation using pure treasure-type ADD for simplicity.
    const add2: CardEffect = {
      cardName: 'Add 2',
      effectType: 'ADD',
      modifierValue: 2,
      targetTokenType: 'Treasure',
    };
    const mult2: CardEffect = {
      cardName: 'Mult 2',
      effectType: 'MULT',
      modifierValue: 2,
      targetTokenType: 'ALL',
    };
    const result = calculateTokenYield({
      initialEvent: { tokenType: 'Treasure', quantity: 1 },
      effects: [mult2, add2],
    });
    // User order: MULT first → 2, then ADD → 4. Optimal: ADD first → 3, then MULT → 6.
    expect(result.userSimulation.finalTotal).toBe(4);
    expect(result.optimalSimulation.finalTotal).toBe(6);
  });

  it('returns equal totals when all effects are already in optimal order', () => {
    const result = calculateTokenYield({ initialEvent: initial, effects: [pt, ds] });
    expect(result.userSimulation.finalTotal).toBe(
      result.optimalSimulation.finalTotal,
    );
  });
});
