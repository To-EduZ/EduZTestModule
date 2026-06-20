// Cambridge YLE Placement Test - Question Bank
// Structure follows the official Cambridge "Test Your English for Young Learners" format
// Total: 30 questions (18 Language Use + 12 Listening), scaled to 0-80

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

// ─── All 30 Questions ──────────────────────────────────────────────────────

export const CAMBRIDGE_QUESTIONS: CambridgeQuestion[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: LANGUAGE USE
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Part 1: Vocabulary (6 tasks, 3-option MCQ) ────────────────────────
  {
    id: "lu-p1-t1",
    section: "language-use",
    part: 1,
    taskNumber: 1,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary",
    dialogue: "A: Look! There's a _____ in the garden.\nB: Oh yes! It's eating the flowers.",
    questionText: "Choose the best word to complete the dialogue.",
    options: ["rabbit", "table", "car"],
    correctAnswer: "rabbit",
  },
  {
    id: "lu-p1-t2",
    section: "language-use",
    part: 1,
    taskNumber: 2,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary",
    dialogue: "A: Can I have some _____, please?\nB: Sure! Do you want apple or orange?",
    questionText: "Choose the best word to complete the dialogue.",
    options: ["juice", "pencil", "book"],
    correctAnswer: "juice",
  },
  {
    id: "lu-p1-t3",
    section: "language-use",
    part: 1,
    taskNumber: 3,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary",
    dialogue: "A: I need to wash my _____.\nB: OK. The soap is next to the sink.",
    questionText: "Choose the best word to complete the dialogue.",
    options: ["hands", "homework", "shoes"],
    correctAnswer: "hands",
  },
  {
    id: "lu-p1-t4",
    section: "language-use",
    part: 1,
    taskNumber: 4,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary",
    dialogue: "A: What colour is your new _____?\nB: It's red. I ride it to school every day.",
    questionText: "Choose the best word to complete the dialogue.",
    options: ["bicycle", "television", "blanket"],
    correctAnswer: "bicycle",
  },
  {
    id: "lu-p1-t5",
    section: "language-use",
    part: 1,
    taskNumber: 5,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary",
    dialogue: "A: Where are my _____?\nB: They're under your bed.",
    questionText: "Choose the best word to complete the dialogue.",
    options: ["socks", "clouds", "trees"],
    correctAnswer: "socks",
  },
  {
    id: "lu-p1-t6",
    section: "language-use",
    part: 1,
    taskNumber: 6,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary",
    dialogue: "A: Let's go to the _____ today.\nB: Great! I want to swim in the sea!",
    questionText: "Choose the best word to complete the dialogue.",
    options: ["beach", "hospital", "library"],
    correctAnswer: "beach",
  },

  // ─── Part 2: Functional Language (6 tasks, 3-option MCQ) ───────────────
  {
    id: "lu-p2-t1",
    section: "language-use",
    part: 2,
    taskNumber: 1,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Functional language",
    dialogue: "A: Would you like some more cake?\nB: _____",
    questionText: "Choose the best response.",
    options: ["Yes, please!", "I'm eight years old.", "It's Monday."],
    correctAnswer: "Yes, please!",
  },
  {
    id: "lu-p2-t2",
    section: "language-use",
    part: 2,
    taskNumber: 2,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Functional language",
    dialogue: "A: How do you get to school?\nB: _____",
    questionText: "Choose the best response.",
    options: ["I walk with my mum.", "I like pizza.", "It's very big."],
    correctAnswer: "I walk with my mum.",
  },
  {
    id: "lu-p2-t3",
    section: "language-use",
    part: 2,
    taskNumber: 3,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Functional language",
    dialogue: "A: What's the matter?\nB: _____",
    questionText: "Choose the best response.",
    options: ["I've got a headache.", "I like football.", "It's under the table."],
    correctAnswer: "I've got a headache.",
  },
  {
    id: "lu-p2-t4",
    section: "language-use",
    part: 2,
    taskNumber: 4,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Functional language",
    dialogue: "A: Can you help me, please?\nB: _____",
    questionText: "Choose the best response.",
    options: ["Of course!", "I'm hungry.", "It's a cat."],
    correctAnswer: "Of course!",
  },
  {
    id: "lu-p2-t5",
    section: "language-use",
    part: 2,
    taskNumber: 5,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Functional language",
    dialogue: "A: When is your birthday?\nB: _____",
    questionText: "Choose the best response.",
    options: ["It's in July.", "I'm at school.", "It's very cold."],
    correctAnswer: "It's in July.",
  },
  {
    id: "lu-p2-t6",
    section: "language-use",
    part: 2,
    taskNumber: 6,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Functional language",
    dialogue: "A: How was your holiday?\nB: _____",
    questionText: "Choose the best response.",
    options: ["It was great, thanks!", "I go to school.", "She's my sister."],
    correctAnswer: "It was great, thanks!",
  },

  // ─── Part 3: Grammar (2 tasks × 3 gaps = 6 questions) ─────────────────
  // Task 1: Present Simple passage
  {
    id: "lu-p3-t1-g1",
    section: "language-use",
    part: 3,
    taskNumber: 1,
    questionNumberInTask: 1,
    type: "gapped-text",
    testingFocus: "Grammar",
    passage:
      "My name is Tom. I __(1)__ ten years old. I __(2)__ to school every day. My favourite subject __(3)__ English because the teacher is really nice.",
    gapLabel: "(1)",
    questionText: "Choose the correct word for gap (1).",
    options: ["am", "is", "are"],
    correctAnswer: "am",
  },
  {
    id: "lu-p3-t1-g2",
    section: "language-use",
    part: 3,
    taskNumber: 1,
    questionNumberInTask: 2,
    type: "gapped-text",
    testingFocus: "Grammar",
    passage:
      "My name is Tom. I __(1)__ ten years old. I __(2)__ to school every day. My favourite subject __(3)__ English because the teacher is really nice.",
    gapLabel: "(2)",
    questionText: "Choose the correct word for gap (2).",
    options: ["go", "goes", "going"],
    correctAnswer: "go",
  },
  {
    id: "lu-p3-t1-g3",
    section: "language-use",
    part: 3,
    taskNumber: 1,
    questionNumberInTask: 3,
    type: "gapped-text",
    testingFocus: "Grammar",
    passage:
      "My name is Tom. I __(1)__ ten years old. I __(2)__ to school every day. My favourite subject __(3)__ English because the teacher is really nice.",
    gapLabel: "(3)",
    questionText: "Choose the correct word for gap (3).",
    options: ["am", "is", "are"],
    correctAnswer: "is",
  },
  // Task 2: Past Simple passage
  {
    id: "lu-p3-t2-g1",
    section: "language-use",
    part: 3,
    taskNumber: 2,
    questionNumberInTask: 1,
    type: "gapped-text",
    testingFocus: "Grammar",
    passage:
      "Last Saturday, Anna __(4)__ to the park with her family. She __(5)__ games with her friends all afternoon. They __(6)__ a really good time together.",
    gapLabel: "(4)",
    questionText: "Choose the correct word for gap (4).",
    options: ["go", "went", "goes"],
    correctAnswer: "went",
  },
  {
    id: "lu-p3-t2-g2",
    section: "language-use",
    part: 3,
    taskNumber: 2,
    questionNumberInTask: 2,
    type: "gapped-text",
    testingFocus: "Grammar",
    passage:
      "Last Saturday, Anna __(4)__ to the park with her family. She __(5)__ games with her friends all afternoon. They __(6)__ a really good time together.",
    gapLabel: "(5)",
    questionText: "Choose the correct word for gap (5).",
    options: ["played", "plays", "playing"],
    correctAnswer: "played",
  },
  {
    id: "lu-p3-t2-g3",
    section: "language-use",
    part: 3,
    taskNumber: 2,
    questionNumberInTask: 3,
    type: "gapped-text",
    testingFocus: "Grammar",
    passage:
      "Last Saturday, Anna __(4)__ to the park with her family. She __(5)__ games with her friends all afternoon. They __(6)__ a really good time together.",
    gapLabel: "(6)",
    questionText: "Choose the correct word for gap (6).",
    options: ["have", "has", "had"],
    correctAnswer: "had",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: LISTENING
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Part 1: Image Selection (4 tasks, 3-option image MCQ) ─────────────
  {
    id: "li-p1-t1",
    section: "listening",
    part: 1,
    taskNumber: 1,
    questionNumberInTask: 1,
    type: "listening-image",
    testingFocus: "Listening for detail and gist",
    audioText:
      "Man: What pet does Sam have?\nWoman: He has a little brown dog. It likes to play with a ball in the garden.",
    questionText: "What pet does Sam have?",
    options: ["A", "B", "C"],
    correctAnswer: "A",
    images: [
      "/cambridge-test/lp1_q1_a.png",
      "/cambridge-test/lp1_q1_b.png",
      "/cambridge-test/lp1_q1_c.png",
    ],
  },
  {
    id: "li-p1-t2",
    section: "listening",
    part: 1,
    taskNumber: 2,
    questionNumberInTask: 1,
    type: "listening-image",
    testingFocus: "Listening for detail and gist",
    audioText:
      "Woman: What does Lily want for her birthday?\nMan: She wants a new red bicycle. Her old one is too small now.",
    questionText: "What does Lily want for her birthday?",
    options: ["A", "B", "C"],
    correctAnswer: "A",
    images: [
      "/cambridge-test/lp1_q2_a.png",
      "/cambridge-test/lp1_q2_b.png",
      "/cambridge-test/lp1_q2_c.png",
    ],
  },
  {
    id: "li-p1-t3",
    section: "listening",
    part: 1,
    taskNumber: 3,
    questionNumberInTask: 1,
    type: "listening-image",
    testingFocus: "Listening for detail and gist",
    audioText:
      "Man: What's the weather like today?\nWoman: It's raining outside. Don't forget to take your umbrella!",
    questionText: "What's the weather like today?",
    options: ["A", "B", "C"],
    correctAnswer: "A",
    images: [
      "/cambridge-test/lp1_q3_a.png",
      "/cambridge-test/lp1_q3_b.png",
      "/cambridge-test/lp1_q3_c.png",
    ],
  },
  {
    id: "li-p1-t4",
    section: "listening",
    part: 1,
    taskNumber: 4,
    questionNumberInTask: 1,
    type: "listening-image",
    testingFocus: "Listening for detail and gist",
    audioText:
      "Woman: What is Dad making for dinner?\nMan: He's making pasta with tomato sauce. It smells really good!",
    questionText: "What is Dad making for dinner?",
    options: ["A", "B", "C"],
    correctAnswer: "A",
    images: [
      "/cambridge-test/lp1_q4_a.png",
      "/cambridge-test/lp1_q4_b.png",
      "/cambridge-test/lp1_q4_c.png",
    ],
  },

  // ─── Part 2: Text MCQ (4 tasks) ───────────────────────────────────────
  {
    id: "li-p2-t1",
    section: "listening",
    part: 2,
    taskNumber: 1,
    questionNumberInTask: 1,
    type: "listening-mcq",
    testingFocus: "Listening for detail and gist",
    audioText:
      "Girl: Did you go to the party yesterday?\nBoy: Yes! There were lots of children. We ate cake and played games. It was so much fun!",
    questionText: "What did they do at the party?",
    options: [
      "They ate cake and played games.",
      "They went swimming.",
      "They watched a movie.",
    ],
    correctAnswer: "They ate cake and played games.",
  },
  {
    id: "li-p2-t2",
    section: "listening",
    part: 2,
    taskNumber: 2,
    questionNumberInTask: 1,
    type: "listening-mcq",
    testingFocus: "Listening for detail and gist",
    audioText:
      "Boy: Where does your grandmother live?\nGirl: She lives in a small house near the sea. We visit her every summer and play on the beach.",
    questionText: "Where does the grandmother live?",
    options: ["Near the sea.", "In the mountains.", "In the city."],
    correctAnswer: "Near the sea.",
  },
  {
    id: "li-p2-t3",
    section: "listening",
    part: 2,
    taskNumber: 3,
    questionNumberInTask: 1,
    type: "listening-mcq",
    testingFocus: "Listening for detail and gist",
    audioText:
      "Woman: What time do you wake up in the morning?\nBoy: I wake up at seven o'clock. Then I have breakfast and brush my teeth before school.",
    questionText: "What does the boy do after waking up?",
    options: [
      "He has breakfast and brushes his teeth.",
      "He goes to school right away.",
      "He plays with his friends.",
    ],
    correctAnswer: "He has breakfast and brushes his teeth.",
  },
  {
    id: "li-p2-t4",
    section: "listening",
    part: 2,
    taskNumber: 4,
    questionNumberInTask: 1,
    type: "listening-mcq",
    testingFocus: "Listening for detail and gist",
    audioText:
      "Girl: How many brothers and sisters do you have?\nBoy: I have one brother. He's older than me. He's twelve and I'm nine. We play football together.",
    questionText: "How old is the boy?",
    options: ["Nine years old.", "Twelve years old.", "Ten years old."],
    correctAnswer: "Nine years old.",
  },

  // ─── Part 3: Longer conversation (1 task, 4 questions) ────────────────
  {
    id: "li-p3-t1-q1",
    section: "listening",
    part: 3,
    taskNumber: 1,
    questionNumberInTask: 1,
    type: "listening-detail",
    testingFocus: "Listening for detail",
    audioText:
      "Today is Sports Day at school. Ben is really excited because he loves running. His friend Mia is going to do the long jump. Their teacher, Mrs Brown, says everyone must bring a water bottle because it's very hot today. Ben runs in the first race and comes second. He's a little bit sad, but Mia tells him: Well done! Second place is really good! After lunch, Mia does the long jump and she wins first place! Ben cheers loudly for her. At the end of the day, Mrs Brown gives everyone a certificate for taking part. Ben says it's the best day of the year.",
    questionText: "What sport does Ben do?",
    options: ["Running", "Swimming", "Football"],
    correctAnswer: "Running",
  },
  {
    id: "li-p3-t1-q2",
    section: "listening",
    part: 3,
    taskNumber: 1,
    questionNumberInTask: 2,
    type: "listening-detail",
    testingFocus: "Listening for detail",
    audioText:
      "Today is Sports Day at school. Ben is really excited because he loves running. His friend Mia is going to do the long jump. Their teacher, Mrs Brown, says everyone must bring a water bottle because it's very hot today. Ben runs in the first race and comes second. He's a little bit sad, but Mia tells him: Well done! Second place is really good! After lunch, Mia does the long jump and she wins first place! Ben cheers loudly for her. At the end of the day, Mrs Brown gives everyone a certificate for taking part. Ben says it's the best day of the year.",
    questionText: "Why must everyone bring a water bottle?",
    options: [
      "Because it's very hot.",
      "Because the teacher says so.",
      "Because they're thirsty.",
    ],
    correctAnswer: "Because it's very hot.",
  },
  {
    id: "li-p3-t1-q3",
    section: "listening",
    part: 3,
    taskNumber: 1,
    questionNumberInTask: 3,
    type: "listening-detail",
    testingFocus: "Listening for detail",
    audioText:
      "Today is Sports Day at school. Ben is really excited because he loves running. His friend Mia is going to do the long jump. Their teacher, Mrs Brown, says everyone must bring a water bottle because it's very hot today. Ben runs in the first race and comes second. He's a little bit sad, but Mia tells him: Well done! Second place is really good! After lunch, Mia does the long jump and she wins first place! Ben cheers loudly for her. At the end of the day, Mrs Brown gives everyone a certificate for taking part. Ben says it's the best day of the year.",
    questionText: "Where does Ben finish in his race?",
    options: ["Second place", "First place", "Third place"],
    correctAnswer: "Second place",
  },
  {
    id: "li-p3-t1-q4",
    section: "listening",
    part: 3,
    taskNumber: 1,
    questionNumberInTask: 4,
    type: "listening-detail",
    testingFocus: "Listening for detail",
    audioText:
      "Today is Sports Day at school. Ben is really excited because he loves running. His friend Mia is going to do the long jump. Their teacher, Mrs Brown, says everyone must bring a water bottle because it's very hot today. Ben runs in the first race and comes second. He's a little bit sad, but Mia tells him: Well done! Second place is really good! After lunch, Mia does the long jump and she wins first place! Ben cheers loudly for her. At the end of the day, Mrs Brown gives everyone a certificate for taking part. Ben says it's the best day of the year.",
    questionText: "What does Mrs Brown give everyone at the end?",
    options: ["A certificate", "A medal", "A trophy"],
    correctAnswer: "A certificate",
  },
];

// Helper: get questions by section/part
export function getQuestionsBySection(section: "language-use" | "listening") {
  return CAMBRIDGE_QUESTIONS.filter((q) => q.section === section);
}

export function getQuestionsByPart(
  section: "language-use" | "listening",
  part: 1 | 2 | 3
) {
  return CAMBRIDGE_QUESTIONS.filter(
    (q) => q.section === section && q.part === part
  );
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
    }
  } else {
    switch (part) {
      case 1:
        return "Image Selection";
      case 2:
        return "Multiple Choice";
      case 3:
        return "Longer Listening";
    }
  }
}
