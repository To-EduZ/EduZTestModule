import { AdaptiveQuestion, adaptiveQuestionBank } from "./adaptiveQuestionBank";

// 3PL IRT Model probability function
// P(θ) = c + (1 - c) / (1 + e^(-a * (θ - b)))
export function probability3PL(theta: number, a: number, b: number, c: number): number {
  const expTerm = Math.exp(-a * (theta - b));
  return c + (1 - c) / (1 + expTerm);
}

// Fisher Information for 3PL
// I(θ) = a^2 * (1 - P(θ)) / P(θ) * (P(θ) - c)^2 / (1 - c)^2
export function fisherInformation3PL(theta: number, a: number, b: number, c: number): number {
  const p = probability3PL(theta, a, b, c);
  if (p === 1 || p === 0) return 0;
  return Math.pow(a, 2) * ((1 - p) / p) * Math.pow((p - c) / (1 - c), 2);
}

// EAP (Expected A Posteriori) Theta Estimation
// Uses Gaussian quadrature for integration
export function estimateThetaEAP(
  responses: { difficulty: number; discrimination: number; guessing: number; isCorrect: boolean }[]
): { theta: number; standardError: number } {
  // Nodes (X) and Weights (W) for Gauss-Hermite Quadrature (21 points)
  // Simplified to 11 points for performance, covering range [-4, 4]
  const X = [-4.0, -3.2, -2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4, 3.2, 4.0];
  // Normal density as weights (simplified, unnormalized)
  const W = X.map(x => Math.exp(-0.5 * x * x));

  let numerator = 0;
  let denominator = 0;

  // L(u|θ)
  const likelihoods = X.map(theta => {
    let L = 1;
    for (const r of responses) {
      const p = probability3PL(theta, r.discrimination, r.difficulty, r.guessing);
      L *= r.isCorrect ? p : (1 - p);
    }
    return L;
  });

  for (let i = 0; i < X.length; i++) {
    const prior = W[i];
    const L = likelihoods[i];
    numerator += X[i] * L * prior;
    denominator += L * prior;
  }

  const expectedTheta = denominator === 0 ? 0 : numerator / denominator;

  // Calculate standard error (variance)
  let varNumerator = 0;
  for (let i = 0; i < X.length; i++) {
    const prior = W[i];
    const L = likelihoods[i];
    varNumerator += Math.pow(X[i] - expectedTheta, 2) * L * prior;
  }
  const variance = denominator === 0 ? 1 : varNumerator / denominator;
  const standardError = Math.sqrt(variance);

  return { theta: expectedTheta, standardError };
}

// Maximum Information Item Selection
export function selectNextQuestion(
  currentTheta: number,
  answeredQuestionIds: string[],
  skillCounts: Record<string, number>
): AdaptiveQuestion | null {
  // Filter out already answered questions
  const availableQuestions = adaptiveQuestionBank.filter(q => !answeredQuestionIds.includes(q.id));
  if (availableQuestions.length === 0) return null;

  // Find skill with lowest count to balance
  const skills = ["Speaking", "Listening", "Reading", "Writing"];
  let targetSkill: string | null = null;
  let minCount = Infinity;

  for (const s of skills) {
    const count = skillCounts[s] || 0;
    if (count < minCount) {
      minCount = count;
      targetSkill = s;
    }
  }

  // Filter by target skill first to enforce balance, if possible
  let candidates = availableQuestions.filter(q => q.skill === targetSkill);
  if (candidates.length === 0) {
    candidates = availableQuestions; // Fallback
  }

  // Select item with max Fisher information at currentTheta
  let maxInfo = -Infinity;
  let selectedItem = candidates[0];

  for (const q of candidates) {
    const info = fisherInformation3PL(currentTheta, q.discrimination, q.difficulty, q.guessing);
    if (info > maxInfo) {
      maxInfo = info;
      selectedItem = q;
    }
  }

  return selectedItem;
}

export function thetaToLevel(theta: number): "Starters" | "Movers" | "Flyers" {
  if (theta < -0.5) return "Starters";
  if (theta > 0.5) return "Flyers";
  return "Movers"; // [-0.5, 0.5]
}

export function shouldStopTest(
  numQuestions: number,
  standardError: number,
  minQuestions = 8,
  maxQuestions = 20,
  targetSE = 0.3
): boolean {
  if (numQuestions >= maxQuestions) return true;
  if (numQuestions >= minQuestions && standardError <= targetSE) return true;
  return false;
}
