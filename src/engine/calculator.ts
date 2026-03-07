import {
  CardEffect,
  ComparisonResult,
  SimulateRequest,
  SimulationResult,
  TokenGroup,
} from '../types';

/**
 * Format a token state array into a human-readable string.
 * e.g. [{ tokenType: 'Treasure', quantity: 2 }, { tokenType: 'Food', quantity: 1 }]
 *   => "2 Treasures, 1 Food"
 */
export function formatState(state: TokenGroup[]): string {
  return state
    .map(({ tokenType, quantity }) => {
      const plural = quantity !== 1 ? `${tokenType}s` : tokenType;
      return `${quantity} ${plural}`;
    })
    .join(', ');
}

/**
 * Apply a single replacement effect to the current token state (CR 616.1).
 * Each effect is applied exactly once.
 *
 * ADD     – adds modifierValue tokens of targetTokenType.
 * MULT    – multiplies every token group's quantity (targetTokenType === 'ALL')
 *           or only the matching group.
 * REPLACE – re-maps the existing token pool to one or more new types;
 *           comma-separated targetTokenType means one group per type
 *           (e.g. Academy Manufactor: "Food,Gold,Treasure").
 */
export function applyEffect(
  state: TokenGroup[],
  effect: CardEffect,
): TokenGroup[] {
  switch (effect.effectType) {
    case 'ADD': {
      const existing = state.find(
        (t) => t.tokenType === effect.targetTokenType,
      );
      if (existing) {
        return state.map((t) =>
          t.tokenType === effect.targetTokenType
            ? { ...t, quantity: t.quantity + effect.modifierValue }
            : t,
        );
      }
      return [
        ...state,
        { tokenType: effect.targetTokenType, quantity: effect.modifierValue },
      ];
    }

    case 'MULT': {
      if (effect.targetTokenType === 'ALL') {
        return state.map((t) => ({
          ...t,
          quantity: t.quantity * effect.modifierValue,
        }));
      }
      return state.map((t) =>
        t.tokenType === effect.targetTokenType
          ? { ...t, quantity: t.quantity * effect.modifierValue }
          : t,
      );
    }

    case 'REPLACE': {
      const targetTypes = effect.targetTokenType
        .split(',')
        .map((s) => s.trim());
      const totalQuantity = state.reduce((sum, t) => sum + t.quantity, 0);

      if (targetTypes.length > 1) {
        // Multi-type REPLACE (e.g. Academy Manufactor):
        // each target type receives modifierValue tokens per original token.
        return targetTypes.map((type) => ({
          tokenType: type,
          quantity: totalQuantity * effect.modifierValue,
        }));
      }

      // Single-type REPLACE: change every group's token type.
      return state.map((t) => ({ ...t, tokenType: targetTypes[0] }));
    }
  }
}

/**
 * Sort effects into the mathematically optimal order (CR 616.1 / ADD→REPLACE→MULT)
 * so that the final yield equals (T + A) * M.
 */
export function sortEffectsOptimally(effects: CardEffect[]): CardEffect[] {
  const order: Record<string, number> = { ADD: 0, REPLACE: 1, MULT: 2 };
  return [...effects].sort((a, b) => order[a.effectType] - order[b.effectType]);
}

/**
 * Run a simulation of a token creation event through an ordered list of effects.
 * Returns the execution order, step-by-step log, and total token count.
 */
export function simulate(
  initialEvent: TokenGroup,
  effects: CardEffect[],
): SimulationResult {
  let state: TokenGroup[] = [{ ...initialEvent }];
  const stepByStep: string[] = [`1. Initial: ${formatState(state)}`];

  for (let i = 0; i < effects.length; i++) {
    state = applyEffect(state, effects[i]);
    stepByStep.push(
      `${i + 2}. Apply ${effects[i].cardName}: ${formatState(state)}`,
    );
  }

  return {
    executionOrder: effects.map((e) => e.cardName),
    stepByStep,
    finalTotal: state.reduce((sum, t) => sum + t.quantity, 0),
  };
}

/**
 * Run both the user-ordered and optimally-sorted simulations and return
 * the side-by-side comparison object required by the frontend (section 4).
 */
export function calculateTokenYield(request: SimulateRequest): ComparisonResult {
  const { initialEvent, effects } = request;

  const userSimulation = simulate(initialEvent, effects);
  const optimalEffects = sortEffectsOptimally(effects);
  const optimalSimulation = simulate(initialEvent, optimalEffects);

  return {
    initialEvent,
    userSimulation,
    optimalSimulation,
  };
}
