// Cambridge YLE Placement Test - Question Bank
// Structure follows the official Cambridge "Test Your English for Young Learners" format

export interface CambridgeQuestion {
  id: string;
  section: "language-use" | "listening";
  part: 1 | 2 | 3;
  taskNumber: number;
  questionNumberInTask: number; // 1 for single-question tasks, 1-3 or 1-4 for multi-question tasks
  type:
    | "dialogue-mcq" // Language Use Part 1 & 2
    | "gapped-text" // Language Use Part 3
    | "listening-image" // Listening Part 1
    | "listening-mcq" // Listening Part 2
    | "listening-detail"; // Listening Part 3
  testingFocus: string;

  // For dialogue MCQ (LU Part 1 & 2)
  dialogue?: string; // Short dialogue with a blank: "A: ... _____ ...\nB: ..."

  // For gapped text (LU Part 3) - passage stored at task level via getPassage()
  passage?: string;
  gapLabel?: string; // e.g. "(1)", "(2)", "(3)"

  // For listening (all listening parts)
  audioText?: string; // Text to be read by TTS

  questionText: string;
  options: string[];
  correctAnswer: string;

  // For listening Part 1 image selection
  images?: string[]; // Paths relative to /cambridge-test/ in public folder
}

// ─── Scoring ────────────────────────────────────────────────────────────────
export interface CambridgeResult {
  rawScore: number;        // 0-30
  scaledScore: number;     // 0-80
  cefrLevel: string;       // Pre-A1, A1, A2, B1
  clubName: string;        // Countdown, Lift Off, Zoom, Orbit
  clubEmoji: string;
  languageUseRaw: number;  // 0-18
  listeningRaw: number;    // 0-12
}

export function calculateResult(
  answers: Record<string, string>,
  questions: CambridgeQuestion[]
): CambridgeResult {
  let languageUseRaw = 0;
  let listeningRaw = 0;

  for (const q of questions) {
    const userAnswer = answers[q.id];
    if (userAnswer === q.correctAnswer) {
      if (q.section === "language-use") languageUseRaw++;
      else listeningRaw++;
    }
  }

  const rawScore = languageUseRaw + listeningRaw;
  const scaledScore = Math.round((rawScore / 30) * 80);

  let cefrLevel: string;
  let clubName: string;
  let clubEmoji: string;

  if (scaledScore >= 61) {
    cefrLevel = "B1";
    clubName = "Orbit";
    clubEmoji = "🪐";
  } else if (scaledScore >= 41) {
    cefrLevel = "A2";
    clubName = "Zoom";
    clubEmoji = "⚡";
  } else if (scaledScore >= 21) {
    cefrLevel = "A1";
    clubName = "Lift Off";
    clubEmoji = "🌟";
  } else {
    cefrLevel = "Pre-A1";
    clubName = "Countdown";
    clubEmoji = "🚀";
  }

  return {
    rawScore,
    scaledScore,
    cefrLevel,
    clubName,
    clubEmoji,
    languageUseRaw,
    listeningRaw,
  };
}

// Helper: get section/part label
export function getSectionLabel(section: "language-use" | "listening"): string {
  return section === "language-use" ? "Language Use" : "Listening";
}

export function getPartLabel(
  section: "language-use" | "listening",
  part: 1 | 2 | 3
): string {
  if (section === "language-use") {
    switch (part) {
      case 1:
        return "Vocabulary";
      case 2:
        return "Functional Language";
      case 3:
        return "Grammar";
      default:
        return "";
    }
  } else {
    switch (part) {
      case 1:
        return "Image Selection";
      case 2:
        return "Multiple Choice";
      case 3:
        return "Longer Listening";
      default:
        return "";
    }
  }
}
