/**
 * Effect type categories per the Knowledge Base:
 *  - ADD:     Adds a flat number of tokens (potentially a different type).
 *  - MULT:    Multiplies the current token quantity (CR 616.1 replacement).
 *  - REPLACE: Changes the fundamental nature of the tokens being created.
 */
export type EffectType = 'ADD' | 'MULT' | 'REPLACE';

/** Card database entry matching the JSON schema structure. */
export interface CardEffect {
  cardName: string;
  effectType: EffectType;
  /** Flat addend (ADD), multiplier (MULT), or quantity produced per type (REPLACE). */
  modifierValue: number;
  /** Token type this effect targets, or "ALL" for all token types. */
  targetTokenType: string;
}

/** A group of tokens of a single type currently in the event state. */
export interface TokenGroup {
  tokenType: string;
  quantity: number;
}

/** Per-simulation output sent to the frontend. */
export interface SimulationResult {
  executionOrder: string[];
  stepByStep: string[];
  finalTotal: number;
}

/** Full comparative response object returned by POST /api/simulate. */
export interface ComparisonResult {
  initialEvent: TokenGroup;
  userSimulation: SimulationResult;
  optimalSimulation: SimulationResult;
}

/** Request body accepted by POST /api/simulate. */
export interface SimulateRequest {
  initialEvent: TokenGroup;
  /** Effects in the user's chosen drag-and-drop order. */
  effects: CardEffect[];
}
