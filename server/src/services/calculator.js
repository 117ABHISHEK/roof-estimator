// Server-side pricing engine. This is the ONE place the formula lives.
// Nothing here trusts the client: every answer is re-validated against the
// active config before it's used in arithmetic.

export class EstimateValidationError extends Error {
  constructor(errors) {
    super('Invalid estimate answers');
    this.name = 'EstimateValidationError';
    this.errors = errors; // { [questionKey]: message }
  }
}

function findOption(question, value) {
  return question.options?.find((opt) => opt.value === value) ?? null;
}

/**
 * Validates `answers` against the active question set.
 * Returns { valid: true } or throws EstimateValidationError with a map of
 * per-field messages so the frontend can highlight the right step.
 */
export function validateAnswers(config, answers) {
  const errors = {};
  const activeQuestions = config.questions.filter((q) => q.active);

  for (const q of activeQuestions) {
    const value = answers?.[q.key];

    if (q.required && (value === undefined || value === null || value === '')) {
      errors[q.key] = `${q.label} is required.`;
      continue;
    }
    if (value === undefined || value === null || value === '') continue;

    if (q.type === 'number') {
      const num = Number(value);
      if (Number.isNaN(num)) {
        errors[q.key] = `${q.label} must be a number.`;
        continue;
      }
      if (q.min !== undefined && num < q.min) {
        errors[q.key] = `${q.label} must be at least ${q.min}.`;
      }
      if (q.max !== undefined && num > q.max) {
        errors[q.key] = `${q.label} must be at most ${q.max}.`;
      }
    }

    if (q.type === 'select') {
      const opt = findOption(q, value);
      if (!opt) {
        errors[q.key] = `${q.label}: please choose a valid option.`;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new EstimateValidationError(errors);
  }

  return { valid: true };
}

/**
 * Computes { estimate_low, estimate_high, estimate_mid } from validated
 * answers. Assumes validateAnswers() has already passed — this function
 * does not re-validate, it just does arithmetic, and defaults any
 * missing/inactive-question rate contribution to 0 (a question the owner
 * has turned off simply drops out of the formula rather than erroring).
 */
export function calculateEstimate(config, answers) {
  const questions = config.questions;
  const modifiers = config.modifiers;

  const getQuestion = (key) => questions.find((q) => q.key === key);

  const roofArea = Number(answers.roof_area || 0);

  const materialQ = getQuestion('material');
  const pitchQ = getQuestion('pitch');
  const layersQ = getQuestion('layers');
  const storiesQ = getQuestion('stories');

  const materialOpt = materialQ ? findOption(materialQ, answers.material) : null;
  const pitchOpt = pitchQ ? findOption(pitchQ, answers.pitch) : null;
  const layersOpt = layersQ ? findOption(layersQ, answers.layers) : null;
  const storiesOpt = storiesQ ? findOption(storiesQ, answers.stories) : null;

  const ratePerSqft = Number(materialOpt?.rate_per_sqft ?? 0);
  const pitchMult = Number(pitchOpt?.multiplier ?? 1);
  const tearOffPerSqft = Number(layersOpt?.tear_off_per_sqft ?? 0);
  const storiesMult = Number(storiesOpt?.multiplier ?? 1);

  const wasteFactor = Number(modifiers.waste_factor ?? 0.1);
  const permitFee = Number(modifiers.permit_flat_fee ?? 350);
  const spreadPct = Number(modifiers.range_spread_pct ?? 12) / 100;

  const baseMaterialCost = roofArea * ratePerSqft * (1 + wasteFactor);
  const tearOffCost = roofArea * tearOffPerSqft;
  const subtotal = (baseMaterialCost + tearOffCost) * pitchMult * storiesMult;
  const midPointEstimate = subtotal + permitFee;

  const estimate_low = Math.round(midPointEstimate * (1 - spreadPct));
  const estimate_high = Math.round(midPointEstimate * (1 + spreadPct));

  return { estimate_low, estimate_high, estimate_mid: Math.round(midPointEstimate) };
}
