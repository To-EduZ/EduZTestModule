import { useState, useEffect, useRef } from "react";
import { toPng, toBlob } from "html-to-image";
import jsPDF from "jspdf";

// Shuffle helper (Fisher-Yates)
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type Stage = "intro" | "warmup" | "picture" | "reading" | "writing" | "results";

export interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  stage: Stage;
  audioUrl?: string;
}

export function useInteractiveSession() {
  const [stage, setStage] = useState<Stage>("intro");
  const [activeTab, setActiveTab] = useState<"progress" | "chat">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Develop Mode Simulation Mock Inputs
  const [isDevModeEnabled, setIsDevModeEnabled] = useState(false);
  const [devInputText, setDevInputText] = useState("");
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Real-time and Child-friendly states (simplified: always real-time, always auto-mic)
  const isRealtimeMode = true;
  const [autoActivateMic, setAutoActivateMic] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState("");
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const interactiveMode = "practice" as const;
  const [showVocabularyHint, setShowVocabularyHint] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeTranscriptRef = useRef("");
  const hesitationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const voices = [
    { code: "en-US-AriaNeural", name: "Mỹ (Nữ) 🇺🇸" },
    { code: "en-US-GuyNeural", name: "Mỹ (Nam) 🇺🇸" },
    { code: "en-GB-SoniaNeural", name: "Anh (Nữ) 🇬🇧" },
    { code: "en-GB-RyanNeural", name: "Anh (Nam) 🇬🇧" },
    { code: "en-AU-NatashaNeural", name: "Úc (Nữ) 🇦🇺" },
  ];

  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-AriaNeural");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferred_accent_voice");
      if (saved) {
        setSelectedVoice(saved);
      }

      // Check browser SpeechRecognition support
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        setIsSpeechSupported(false);
      }

      // Check if developer mode is enabled in homepage settings
      setIsDevModeEnabled(localStorage.getItem("dev_mode_enabled") === "true");
    }
  }, []);

  const handleVoiceChange = (voiceCode: string) => {
    setSelectedVoice(voiceCode);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_accent_voice", voiceCode);
    }
  };

  // Custom Kid States collected during the test
  const [kidName, setKidName] = useState("Con");
  const [kidAge, setKidAge] = useState("7");
  const [favAnimal, setFavAnimal] = useState("");
  
  // Dynamic AI YLE Question Generator states
  const [isGenerating, setIsGenerating] = useState(false);
  const [dynamicStory, setDynamicStory] = useState("");
  const [dynamicMcq, setDynamicMcq] = useState<any>(null);
  const [dynamicSpelling, setDynamicSpelling] = useState<any[]>([]);

  // Test code and sections states
  const [testCodeInput, setTestCodeInput] = useState("");
  const [activeTestCode, setActiveTestCode] = useState("");
  const [activeTestPaperId, setActiveTestPaperId] = useState("");
  const [testPaperSections, setTestPaperSections] = useState<any[]>([]);
  const [verifyError, setVerifyError] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Stage 2: 2 Pictures Sequence States
  const [picQuestions, setPicQuestions] = useState<any[]>([]);
  const [pictureIndex, setPictureIndex] = useState(0);
  const [subQuestionIndex, setSubQuestionIndex] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);
  
  // Reset attempts when sub-question or picture index changes
  useEffect(() => {
    setAttemptsCount(0);
  }, [subQuestionIndex, pictureIndex]);

  const lastAskedPicIndexRef = useRef<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [keywordsHitPic1, setKeywordsHitPic1] = useState(0);
  const [totalProbingTurns, setTotalProbingTurns] = useState(0);
  const [keywordsMentioned, setKeywordsMentioned] = useState<string[]>([]);
  const [probingTurnsCount, setProbingTurnsCount] = useState(0);

  // Stage 3 (Reading Aloud & MCQ) States
  const [readingAccuracyState, setReadingAccuracyState] = useState(85);
  const [showMcq, setShowMcq] = useState(false);
  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(null);
  const [mcqAnswered, setMcqAnswered] = useState(false);
  const [isMcqCorrect, setIsMcqCorrect] = useState<boolean | null>(null);
  
  // Stage 4 (Writing & spelling 2 words) States
  const [writingTaskIndex, setWritingTaskIndex] = useState(0);
  const [typedWord, setTypedWord] = useState("");
  const [writingSubmitted, setWritingSubmitted] = useState(false);
  const [spellingCorrect1, setSpellingCorrect1] = useState<boolean | null>(null);
  const [spellingCorrect2, setSpellingCorrect2] = useState<boolean | null>(null);
  
  // Letter Tiles state (replaces keyboard input for spelling)
  const [availableLetters, setAvailableLetters] = useState<{letter: string, id: number}[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<{letter: string, id: number}[]>([]);
  const [draggedTile, setDraggedTile] = useState<{letter: string, id: number, source: "available" | "selected"} | null>(null);
  const [isDragOverAnswer, setIsDragOverAnswer] = useState(false);
  const [isDragOverAvailable, setIsDragOverAvailable] = useState(false);
  
  // Final aggregated scores out of 100
  const [scores, setScores] = useState({
    speaking: 0,
    listening: 0,
    reading: 0,
    writing: 0
  });
  
  // MongoDB sync states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedRatingStars, setSelectedRatingStars] = useState<number | null>(null);
  const [hoveredRatingStars, setHoveredRatingStars] = useState<number | null>(null);
  
  // Transition stage management to prevent microphone auto-activation race condition
  const [isTransitioningStage, setIsTransitioningStage] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingTransitionRef = useRef<(() => void) | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainScrollContainerRef = useRef<HTMLDivElement>(null);
  const answerZoneRef = useRef<HTMLDivElement | null>(null);

  // Scroll to top of the main container when stage changes
  useEffect(() => {
    if (mainScrollContainerRef.current) {
      mainScrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [stage, pictureIndex]);

  // Ref callback to avoid stale closure issues
  const handleAudioSubmissionRef = useRef<any>(null);
  useEffect(() => {
    handleAudioSubmissionRef.current = handleAudioSubmission;
  });

  const isSkillTested = (skillName: "speaking" | "listening" | "reading" | "writing") => {
    if (testPaperSections.length === 0) return true;
    switch (skillName) {
      case "speaking":
        return testPaperSections.some(s => s.type === "warmup" || s.type === "picture");
      case "listening":
        return testPaperSections.some(s => s.type === "warmup" || s.type === "picture" || s.type === "reading");
      case "reading":
        return testPaperSections.some(s => s.type === "reading");
      case "writing":
        return testPaperSections.some(s => s.type === "writing");
      default:
        return false;
    }
  };

  const getReferenceScore = () => {
    const activeScores = [
      isSkillTested("speaking") && scores.speaking,
      isSkillTested("listening") && scores.listening,
      isSkillTested("reading") && scores.reading,
      isSkillTested("writing") && scores.writing,
    ].filter((v): v is number => typeof v === "number");
    return activeScores.length > 0 ? Math.max(...activeScores) : 0;
  };

  const getTeacherState = () => {
    if (isProcessing) return "thinking";
    if (isRecording) return "listening";
    if (isTtsSpeaking) return "speaking";
    return "idle";
  };

  // 1. Dynamic Reference story fallback
  const activeStory = dynamicStory || "Max is a happy little monkey who lives in a very tall coconut tree in the jungle. He loves to eat sweet yellow bananas every morning. Today, Max looks down and sees a small green frog sitting on a leaf in the pond. The frog is jumping up and down and singing a funny song. Max waves hello and laughs happily!";

  // 2. Dynamic MCQ Question fallback
  const activeMcq = dynamicMcq || {
    question: "What does Max love to eat every morning?",
    options: [
      "Red apples 🍎",
      "Sweet yellow bananas 🍌",
      "Green leaves 🍃"
    ],
    correctIndex: 1
  };

  // 3. Dynamic Spelling Task fallback
  const activeSpelling = (dynamicSpelling && dynamicSpelling.length >= 2) ? dynamicSpelling : [
    {
      prompt: "Can you spell the word for the animal that lives in the tree? It starts with 'm'.",
      correctWord: "monkey"
    },
    {
      prompt: "Excellent! Now, can you spell the word for the yellow fruit that Max loves to eat? It starts with 'b'.",
      correctWord: "banana"
    }
  ];

  // Auto-scroll chat history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, stage]);

  // Auto-switch layout based on stage
  useEffect(() => {
    if (stage === "warmup") {
      setActiveTab("chat");
    } else {
      setActiveTab("progress");
    }
  }, [stage]);

  // Initialize letter tiles when entering writing stage or switching writing task
  useEffect(() => {
    if (stage === "writing" && activeSpelling[writingTaskIndex]) {
      const correctWord = activeSpelling[writingTaskIndex].correctWord;
      const correctLetters = correctWord.toLowerCase().split("");
      // Generate 3-4 distractor letters
      const distractors = "bcdfghjklmnpqrstvwxyzaeiou".split("").filter(l => !correctLetters.includes(l));
      const numDistractors = Math.min(3, distractors.length);
      const shuffledDistractors = shuffleArray(distractors).slice(0, numDistractors);
      // Combine and shuffle all letters with unique IDs
      const allLetters = [...correctLetters, ...shuffledDistractors].map((letter, i) => ({ letter, id: i }));
      setAvailableLetters(shuffleArray(allLetters));
      setSelectedLetters([]);
      setTypedWord("");
      setWritingSubmitted(false);
    }
  }, [stage, writingTaskIndex]);

  // Auto-scroll the spelling answer zone to the right end when selectedLetters updates
  useEffect(() => {
    if (answerZoneRef.current) {
      answerZoneRef.current.scrollTo({
        left: answerZoneRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [selectedLetters]);

  const playTTS = (text: string) => {
    const cleanText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    const url = `/api/tts?text=${encodeURIComponent(cleanText.trim())}&voice=${selectedVoice}`;
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(e => {
        if (e.name === "AbortError" || e.message?.includes("interrupted")) {
          console.log("🔊 Audio play interrupted (expected due to rapid UI transitions).");
        } else {
          console.warn("Lỗi phát audio (Ignored):", e);
        }
      });
    }
  };

  // Keep track of TTS audio playback to automate microphone activation loop
  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      const playHandler = () => setIsTtsSpeaking(true);
      const pauseHandler = () => setIsTtsSpeaking(false);
      const endedHandler = () => {
        setIsTtsSpeaking(false);
        console.log("🔊 TTS Audio finished playing.");

        if (pendingTransitionRef.current) {
          console.log("⏭️ Executing pending transition after audio ended.");
          pendingTransitionRef.current();
          return;
        }

        if (isTransitioningStage) {
          console.log("⏭️ Skipping mic activation during stage/picture transition.");
          return;
        }
        if (
          isRealtimeMode && 
          autoActivateMic && 
          (stage === "warmup" || stage === "picture" || (stage === "reading" && !showMcq)) &&
          !isProcessing &&
          !isRecording
        ) {
          console.log("⚡ Auto-activating mic for the student!");
          setTimeout(() => {
            startRecording();
          }, 300);
        }
      };

      audioEl.addEventListener("play", playHandler);
      audioEl.addEventListener("pause", pauseHandler);
      audioEl.addEventListener("ended", endedHandler);
      return () => {
        audioEl.removeEventListener("play", playHandler);
        audioEl.removeEventListener("pause", pauseHandler);
        audioEl.removeEventListener("ended", endedHandler);
      };
    }
  }, [stage, isRealtimeMode, autoActivateMic, isProcessing, isRecording, showMcq, isTransitioningStage]);

  const addAiMessage = (content: string) => {
    const newMessage: Message = { id: Date.now().toString(), role: "ai", content, stage };
    setMessages((prev) => [...prev, newMessage]);
    playTTS(content);
  };

  const runTransitionAfterSpeech = (transitionFn: () => void, textToSpeak: string) => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    setIsTransitioningStage(true);

    const executeTransition = () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      pendingTransitionRef.current = null;
      transitionFn();
    };

    pendingTransitionRef.current = executeTransition;

    const cleanText = textToSpeak.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const fallbackDelay = Math.max(3500, Math.min(wordCount * 450 + 1800, 9500));

    console.log(`⏱️ Queuing transition with fallback timeout of ${fallbackDelay}ms`);
    transitionTimeoutRef.current = setTimeout(() => {
      console.log("⏰ Fallback transition timeout triggered.");
      executeTransition();
    }, fallbackDelay);
  };

  const startTest = async () => {
    setIsGenerating(true);
    setVerifyError("");
    
    // Reset all test-related states to guarantee a clean start
    setMessages([]);
    setKeywordsMentioned([]);
    setProbingTurnsCount(0);
    setShowMcq(false);
    setSelectedMcqOption(null);
    setMcqAnswered(false);
    setIsMcqCorrect(null);
    setTypedWord("");
    setWritingSubmitted(false);
    setSaveSuccess(null);
    setPictureIndex(0);
    setSubQuestionIndex(0);
    lastAskedPicIndexRef.current = null;
    setAttemptsCount(0);
    setKeywordsHitPic1(0);
    setTotalProbingTurns(0);
    setWritingTaskIndex(0);
    setSpellingCorrect1(null);
    setSpellingCorrect2(null);
    setActiveSessionId(null);
    setSelectedRatingStars(null);
    setHoveredRatingStars(null);
    setReadingAccuracyState(85);

    let sections: any[] = [];
    let pId = "";
    let tCode = "";
    let url = "/api/interactive-test/generate";
    try {
      if (testCodeInput.trim()) {
        setVerifyingCode(true);
        const verifyRes = await fetch(`/api/test-papers/verify?code=${encodeURIComponent(testCodeInput.trim())}`);
        const verifyData = await verifyRes.json();
        setVerifyingCode(false);
        if (!verifyRes.ok || !verifyData.success) {
          setVerifyError(verifyData.error || "Mã phòng thi không đúng hoặc chưa được xuất bản!");
          setIsGenerating(false);
          return;
        }
        pId = verifyData.data.id;
        tCode = testCodeInput.trim();
        sections = verifyData.data.sections || [];
        url += `?testCode=${encodeURIComponent(tCode)}`;
      }

      setActiveTestCode(tCode);
      setActiveTestPaperId(pId);
      setTestPaperSections(sections);

      const isDevMode = typeof window !== "undefined" && localStorage.getItem("dev_mode_enabled") === "true";
      const res = await fetch(url, {
        headers: isDevMode ? { "x-develop-mode": "true" } : {},
      });
      const data = await res.json();
      if (data.success) {
        // Shorten the test by slicing to max 2 questions per picture
        const shortenedPictures = data.pictures.map((pic: any) => ({
          ...pic,
          questions: pic.questions && pic.questions.length > 0 ? pic.questions.slice(0, 2) : []
        }));
        setPicQuestions(shortenedPictures);
        setCurrentQuestion(shortenedPictures[0]);
        setDynamicStory(data.story);
        setDynamicMcq(data.mcq);
        setDynamicSpelling(data.spelling);
        console.log("🎯 [AI Generator] Đã sinh đề thi động thành công!");
      }
    } finally {
      setIsGenerating(false);
      
      // Select first valid stage from sections config, default to picture
      let firstStage: Stage = "picture";
      if (sections && sections.length > 0) {
        const firstSec = sections[0];
        if (firstSec.type === "warmup") firstStage = "warmup";
        else if (firstSec.type === "picture") firstStage = "picture";
        else if (firstSec.type === "reading") firstStage = "reading";
        else if (firstSec.type === "writing") firstStage = "writing";
      }
      
      setStage(firstStage);
      setPictureIndex(0);
      setSubQuestionIndex(0);
      setAttemptsCount(0);
      lastAskedPicIndexRef.current = null;
    }
  };

  const getNextStage = (currentStage: Stage): Stage => {
    if (testPaperSections.length === 0) {
      if (currentStage === "intro") return "picture";
      if (currentStage === "warmup") return "picture";
      if (currentStage === "picture") return "reading";
      if (currentStage === "reading") return "writing";
      return "results";
    }

    const currentSectionIndex = testPaperSections.findIndex(s => {
      if (currentStage === "warmup" && s.type === "warmup") return true;
      if (currentStage === "picture" && s.type === "picture") return true;
      if (currentStage === "reading" && s.type === "reading") return true;
      if (currentStage === "writing" && s.type === "writing") return true;
      return false;
    });

    for (let i = currentSectionIndex + 1; i < testPaperSections.length; i++) {
      const nextSec = testPaperSections[i];
      if (nextSec.type === "warmup") return "warmup";
      if (nextSec.type === "picture") return "picture";
      if (nextSec.type === "reading") return "reading";
      if (nextSec.type === "writing") return "writing";
    }

    return "results";
  };

  // Automatically ask the first sub-question when starting picture stage or switching pictures
  useEffect(() => {
    if (stage === "picture" && currentQuestion) {
      if (lastAskedPicIndexRef.current !== pictureIndex) {
        lastAskedPicIndexRef.current = pictureIndex;
        setSubQuestionIndex(0);
        
        if (pictureIndex === 0) {
          const firstQuestionText = currentQuestion.questions?.[0]?.examinerScript || currentQuestion.examinerScript || "Look at the picture. What can you see?";
          
          const timer = setTimeout(() => {
            setIsTransitioningStage(false);
            addAiMessage(firstQuestionText);
          }, 1200);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [stage, pictureIndex, currentQuestion]);

  // Automatically start warmup if it's the first stage
  useEffect(() => {
    if (stage === "warmup" && messages.length === 0) {
      const timer = setTimeout(() => {
        addAiMessage("Hello! Welcome to the English test. What's your name?");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, messages.length]);

  // Automatically prompt for reading if it's the first stage of the test
  useEffect(() => {
    if (stage === "reading" && messages.length === 0) {
      const timer = setTimeout(() => {
        addAiMessage("Let's read a short story together. Please read the story on the screen aloud!");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, messages.length]);

  // Automatically speak and display spelling prompt when entering writing stage or switching writing task
  useEffect(() => {
    if (stage === "writing" && activeSpelling[writingTaskIndex]) {
      const promptText = activeSpelling[writingTaskIndex].prompt;
      const isAlreadyAsked = messages.some(m => m.content === promptText);
      if (!isAlreadyAsked) {
        const timer = setTimeout(() => {
          setIsTransitioningStage(false);
          addAiMessage(promptText);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [stage, writingTaskIndex, activeSpelling, messages]);

  // Reset transition flag and auto-activate mic when entering reading stage
  useEffect(() => {
    if (stage === "reading") {
      setIsTransitioningStage(false);
      if (isRealtimeMode && autoActivateMic && !isProcessing && !isRecording) {
        const timer = setTimeout(() => {
          startRecording();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [stage, isRealtimeMode, autoActivateMic]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioSubmissionRef.current(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);

      if (interactiveMode === "practice") {
        setShowVocabularyHint(false);
        if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
        hesitationTimerRef.current = setTimeout(() => {
          const currentWords = realtimeTranscriptRef.current.toLowerCase();
          const expected = currentQuestion?.questions?.[subQuestionIndex]?.expectedKeywords || currentQuestion?.evaluationCriteria?.expectedKeywords || [];
          const hasMatchedAny = expected.some((kw: string) => currentWords.includes(kw.toLowerCase()));
          
          if (!hasMatchedAny) {
            setShowVocabularyHint(true);
          }
        }, 5000);
      }

      if (isRealtimeMode) {
        setRealtimeTranscript("");
        realtimeTranscriptRef.current = "";
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionClass) {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: any) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            const currentText = (finalTranscript || interimTranscript).trim();
            if (currentText) {
              setRealtimeTranscript(currentText);
              realtimeTranscriptRef.current = currentText;

              if (hesitationTimerRef.current) {
                clearTimeout(hesitationTimerRef.current);
                hesitationTimerRef.current = null;
              }

              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = setTimeout(() => {
                stopRecording();
              }, 1800);
            }
          };

          recognition.onerror = (e: any) => {
            if (e.error === "aborted") return;
            if (e.error === "network") return;
            console.warn("Speech Recognition Error Type:", e.error);
          };

          recognitionRef.current = recognition;
          recognition.start();
        }
      }
    } catch (err) {
      alert("Con hãy cấp quyền sử dụng Microphone cho trình duyệt nhé! 🎤");
    }
  }

  function stopRecording() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
      recognitionRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);

    if (hesitationTimerRef.current) {
      clearTimeout(hesitationTimerRef.current);
      hesitationTimerRef.current = null;
    }
  }

  // Trigger silent message when picture index changes to 1
  useEffect(() => {
    if (stage === "picture" && pictureIndex === 1 && currentQuestion && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.stage === "intro") {
        const hasPicMessages = messages.some(m => m.stage === "picture");
        if (!hasPicMessages) {
          sendSilentTransitionMessage();
        }
      }
    }
  }, [pictureIndex, stage, currentQuestion, messages]);

  const sendSilentTransitionMessage = async () => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("text", "[NEW_PICTURE]");
      formData.append("stage", "picture");
      formData.append("mode", interactiveMode);
      formData.append("chatHistory", JSON.stringify([]));
      formData.append("context", JSON.stringify({
        pictureIndex: 1,
        subQuestionIndex: 0,
        questions: currentQuestion.questions || [],
        expectedKeywords: currentQuestion.questions?.[0]?.expectedKeywords || currentQuestion.evaluationCriteria?.expectedKeywords || [],
        attemptsCount: 0
      }));

      const isDevMode = typeof window !== "undefined" && localStorage.getItem("dev_mode_enabled") === "true";
      const res = await fetch("/api/interactive-chat", {
        method: "POST",
        headers: isDevMode ? { "x-develop-mode": "true" } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setIsTransitioningStage(false);
        addAiMessage(data.aiResponse);
      }
    } catch (err) {
      console.error("Silent transition failed:", err);
      setIsTransitioningStage(false);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleMockTextSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devInputText.trim() || isProcessing) return;
    const textToSend = devInputText.trim();
    setDevInputText("");
    
    realtimeTranscriptRef.current = textToSend;
    setRealtimeTranscript(textToSend);
    
    const emptyBlob = new Blob([new Uint8Array(100)], { type: "audio/webm" });
    await handleAudioSubmission(emptyBlob);
  };

  async function handleAudioSubmission(audioBlob: Blob) {
    setIsProcessing(true);
    const transcriptText = realtimeTranscriptRef.current;
    
    realtimeTranscriptRef.current = "";
    setRealtimeTranscript("");
    setShowVocabularyHint(false);
    if (hesitationTimerRef.current) {
      clearTimeout(hesitationTimerRef.current);
      hesitationTimerRef.current = null;
    }

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("stage", stage);
      formData.append("mode", interactiveMode);
      
      if (transcriptText) {
        formData.append("text", transcriptText);
      }
      
      const currentStageMessages = messages.filter(m => m.stage === stage);
      formData.append("chatHistory", JSON.stringify(currentStageMessages.slice(-6)));
      
      if (stage === "picture" && currentQuestion) {
        formData.append("context", JSON.stringify({
          pictureIndex,
          subQuestionIndex,
          questions: currentQuestion.questions || [],
          expectedKeywords: currentQuestion.questions?.[subQuestionIndex]?.expectedKeywords || currentQuestion.evaluationCriteria?.expectedKeywords || [],
          attemptsCount,
          keywordsMentioned
        }));
      } else if (stage === "reading") {
        formData.append("context", JSON.stringify({
          referenceStory: activeStory
        }));
      }

      const isDevMode = typeof window !== "undefined" && localStorage.getItem("dev_mode_enabled") === "true";
      const res = await fetch("/api/interactive-chat", {
        method: "POST",
        headers: isDevMode ? { "x-develop-mode": "true" } : {},
        body: formData,
      });

      const data = await res.json();
      
      if (data.success) {
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + "_u",
          role: "user",
          content: data.transcribedText || "(Con đã trả lời bằng giọng nói 🎤)",
          stage
        }]);

        addAiMessage(data.aiResponse);

        if (stage === "warmup") {
          const userMsgs = messages.filter(m => m.role === "user");
          const transcript = (data.transcribedText || "").trim();
          
          if (userMsgs.length === 0) {
            const name = transcript.replace(/(my name is|i am|tên con là|tên là|con là)/gi, "").trim();
            setKidName(name || "Con");
          } else if (userMsgs.length === 1) {
            const age = transcript.replace(/[^0-9]/g, "");
            setKidAge(age || "7");
          } else if (userMsgs.length === 2) {
            setFavAnimal(transcript || "monkey");
          }
        }

        if (stage === "picture" && currentQuestion) {
          const newlyFound = data.keywordsHit || [];
          setKeywordsMentioned((prev) => Array.from(new Set([...prev, ...newlyFound])));
          
          const turnsCompleted = (data.answeredIndices?.length || 1);
          setProbingTurnsCount(prev => prev + turnsCompleted);
        }

        if (stage === "reading") {
          setReadingAccuracyState(data.readingAccuracy || 85);
        }

        const isStageOver = data.stageComplete || (stage === "picture" && currentQuestion && typeof data.nextSubQuestionIndex === "number" && data.nextSubQuestionIndex >= (currentQuestion.questions?.length || 2));

        if (stage === "picture" && !isStageOver) {
          if (typeof data.nextSubQuestionIndex === "number") {
            if (data.nextSubQuestionIndex === subQuestionIndex) {
              setAttemptsCount(prev => prev + 1);
            } else {
              setSubQuestionIndex(data.nextSubQuestionIndex);
              setAttemptsCount(0);
            }
          } else {
            setSubQuestionIndex(prev => prev + 1);
            setAttemptsCount(0);
          }
        }

        if (isStageOver) {
          if (stage === "warmup") {
            runTransitionAfterSpeech(() => {
              setStage(getNextStage("warmup"));
            }, data.aiResponse);
          } else if (stage === "picture") {
            if (pictureIndex === 0) {
              runTransitionAfterSpeech(() => {
                setKeywordsHitPic1(keywordsMentioned.length);
                setTotalProbingTurns(prev => prev + probingTurnsCount);
                setPictureIndex(1);
                
                const nextQuestion = picQuestions[1 % picQuestions.length] || currentQuestion;
                setCurrentQuestion(nextQuestion);
                
                setMessages(prev => prev.map(m => m.stage === "picture" ? { ...m, stage: "intro" } as Message : m));
                
                setKeywordsMentioned([]);
                setProbingTurnsCount(0);
                setSubQuestionIndex(0);
                setIsProcessing(false);
              }, data.aiResponse);
            } else {
              runTransitionAfterSpeech(() => {
                setTotalProbingTurns(prev => prev + probingTurnsCount);
                setStage(getNextStage("picture"));
              }, data.aiResponse);
            }
          } else if (stage === "reading") {
            runTransitionAfterSpeech(() => {
              setShowMcq(true);
            }, data.aiResponse);
          }
        }
      } else {
        alert("Có lỗi xảy ra: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối đến server AI.");
    } finally {
      setIsProcessing(false);
    }
  }

  const handleMcqSelect = (optionIndex: number) => {
    if (mcqAnswered) return;
    
    setSelectedMcqOption(optionIndex);
    setMcqAnswered(true);
    const correct = optionIndex === activeMcq.correctIndex;
    setIsMcqCorrect(correct);

    const feedbackText = correct
      ? "Perfect! You got it right! Let's do some spelling now!"
      : `Good try! Max actually loves ${activeMcq.options[activeMcq.correctIndex]}. Let's do some spelling now!`;

    playTTS(feedbackText);
    runTransitionAfterSpeech(() => {
      setStage(getNextStage("reading"));
    }, feedbackText);
  };

  const handleLetterTileTap = (tile: {letter: string, id: number}) => {
    setAvailableLetters(prev => prev.filter(t => t.id !== tile.id));
    setSelectedLetters(prev => [...prev, tile]);
  };

  const handleAnswerLetterTap = (tile: {letter: string, id: number}) => {
    setSelectedLetters(prev => prev.filter(t => t.id !== tile.id));
    setAvailableLetters(prev => [...prev, tile]);
  };

  const handleResetLetters = () => {
    setAvailableLetters(prev => [...prev, ...selectedLetters]);
    setSelectedLetters([]);
  };

  const handleDragStart = (
    e: React.DragEvent,
    tile: { letter: string; id: number },
    source: "available" | "selected"
  ) => {
    if (writingSubmitted) return;
    setDraggedTile({ ...tile, source });
    e.dataTransfer.setData("text/plain", tile.id.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTile(null);
    setIsDragOverAnswer(false);
    setIsDragOverAvailable(false);
  };

  const handleDragOver = (e: React.DragEvent, target: "answer" | "available") => {
    if (writingSubmitted) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, target: "answer" | "available") => {
    if (writingSubmitted) return;
    e.preventDefault();
    if (target === "answer") {
      setIsDragOverAnswer(true);
    } else {
      setIsDragOverAvailable(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, target: "answer" | "available") => {
    if (target === "answer") {
      setIsDragOverAnswer(false);
    } else {
      setIsDragOverAvailable(false);
    }
  };

  const handleDrop = (e: React.DragEvent, target: "answer" | "available") => {
    if (writingSubmitted) return;
    e.preventDefault();
    if (!draggedTile) return;

    if (draggedTile.source === "available" && target === "answer") {
      setAvailableLetters(prev => prev.filter(t => t.id !== draggedTile.id));
      setSelectedLetters(prev => [...prev, { letter: draggedTile.letter, id: draggedTile.id }]);
    } else if (draggedTile.source === "selected" && target === "available") {
      setSelectedLetters(prev => prev.filter(t => t.id !== draggedTile.id));
      setAvailableLetters(prev => [...prev, { letter: draggedTile.letter, id: draggedTile.id }]);
    }

    setDraggedTile(null);
    setIsDragOverAnswer(false);
    setIsDragOverAvailable(false);
  };

  const handleDropOnTile = (e: React.DragEvent, targetIdx: number) => {
    if (writingSubmitted || !draggedTile) return;
    e.preventDefault();
    e.stopPropagation();

    if (draggedTile.source === "selected") {
      setSelectedLetters(prev => {
        const list = [...prev];
        const draggedIdx = list.findIndex(t => t.id === draggedTile.id);
        if (draggedIdx !== -1) {
          const [removed] = list.splice(draggedIdx, 1);
          list.splice(targetIdx, 0, removed);
        }
        return list;
      });
    } else if (draggedTile.source === "available") {
      setAvailableLetters(prev => prev.filter(t => t.id !== draggedTile.id));
      setSelectedLetters(prev => {
        const list = [...prev];
        list.splice(targetIdx, 0, { letter: draggedTile.letter, id: draggedTile.id });
        return list;
      });
    }

    setDraggedTile(null);
    setIsDragOverAnswer(false);
    setIsDragOverAvailable(false);
  };

  const handleWritingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const builtWord = selectedLetters.map(t => t.letter).join("");
    if (!builtWord) return;

    const isCorrect = builtWord.toLowerCase().trim() === activeSpelling[writingTaskIndex].correctWord.toLowerCase().trim();

    if (writingTaskIndex === 0) {
      setSpellingCorrect1(isCorrect);
      setWritingSubmitted(true);
      
      const feedbackText = isCorrect
        ? "Perfect! That's correct spelling! Next word!"
        : "Good try! Let's try spelling the next word!";
      
      playTTS(feedbackText);
      runTransitionAfterSpeech(() => {
        setTypedWord("");
        setWritingSubmitted(false);
        setWritingTaskIndex(1);
      }, feedbackText);
      
    } else {
      setSpellingCorrect2(isCorrect);
      setWritingSubmitted(true);
      
      if (isCorrect) {
        playTTS("Fantastic! Correct spelling!");
      } else {
        playTTS("Well done! You worked so hard!");
      }

      setTimeout(() => {
        setStage("results");
      }, 2500);
    }
  };

  // Score calculation
  useEffect(() => {
    if (stage === "results" && !activeSessionId) {
      let speakingScore = 0;
      if (isSkillTested("speaking")) {
        const expectedKeywordsLength1 = Math.max(
          picQuestions[0]?.questions?.reduce((acc: number, q: any) => acc + (q.expectedKeywords?.length || 0), 0) ||
          picQuestions[0]?.evaluationCriteria?.expectedKeywords?.length || 3,
          1
        );
        const expectedKeywordsLength2 = Math.max(
          picQuestions[1 % picQuestions.length]?.questions?.reduce((acc: number, q: any) => acc + (q.expectedKeywords?.length || 0), 0) ||
          picQuestions[1 % picQuestions.length]?.evaluationCriteria?.expectedKeywords?.length || 3,
          1
        );
        const totalExpected = expectedKeywordsLength1 + expectedKeywordsLength2;
        const totalKeywordsHit = keywordsHitPic1 + keywordsMentioned.length;
        const pictureSpeaking = Math.round((totalKeywordsHit / totalExpected) * 100);
        
        speakingScore = Math.round((100 + pictureSpeaking + readingAccuracyState) / 3);
      }

      let listeningScore = 0;
      if (isSkillTested("listening")) {
        const pictureListening = Math.max(100 - ((totalProbingTurns + probingTurnsCount) * 8), 65);
        const mcqListening = isMcqCorrect ? 100 : 40;
        listeningScore = Math.round((pictureListening + mcqListening) / 2);
      }

      let readingScore = 0;
      if (isSkillTested("reading")) {
        const mcqReading = isMcqCorrect ? 100 : 30;
        readingScore = Math.round((readingAccuracyState + mcqReading) / 2);
      }

      let writingScore = 0;
      if (isSkillTested("writing")) {
        const correctSpellingsCount = (spellingCorrect1 ? 1 : 0) + (spellingCorrect2 ? 1 : 0);
        writingScore = correctSpellingsCount === 2 ? 100 : correctSpellingsCount === 1 ? 65 : 30;
      }

      const computedScores = {
        speaking: speakingScore,
        listening: listeningScore,
        reading: readingScore,
        writing: writingScore
      };

      setScores(computedScores);
      autoSaveInteractiveSession(computedScores);
    }
  }, [
    stage,
    activeSessionId,
    testPaperSections,
    picQuestions,
    keywordsHitPic1,
    keywordsMentioned,
    readingAccuracyState,
    totalProbingTurns,
    probingTurnsCount,
    isMcqCorrect,
    spellingCorrect1,
    spellingCorrect2
  ]);

  const autoSaveInteractiveSession = async (computedScores: typeof scores) => {
    try {
      console.log("💾 Autosaving interactive session...");
      const activeScores = [
        isSkillTested("speaking") && computedScores.speaking,
        isSkillTested("listening") && computedScores.listening,
        isSkillTested("reading") && computedScores.reading,
        isSkillTested("writing") && computedScores.writing,
      ].filter((v): v is number => typeof v === "number");
      const refScore = activeScores.length > 0 ? Math.max(...activeScores) : 0;
      const overallLevelStr = refScore >= 85 ? "Flyers (A2)" : refScore >= 60 ? "Movers (A1)" : "Starters (Pre-A1)";
      
      const transcriptToSave = messages.map(m => ({
        role: m.role,
        content: m.content,
        stage: m.stage
      }));

      const res = await fetch("/api/interactive-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidName: kidName || "Con",
          kidAge: Number(kidAge || 7),
          scores: computedScores,
          chatHistory: transcriptToSave,
          overallLevel: overallLevelStr,
          userId: localStorage.getItem("eduz_user_id") || `kid_entrance_${Date.now()}`,
          testCode: activeTestCode,
          testPaperId: activeTestPaperId
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSessionId(data.id);
        console.log(`💾 Autosave successful! ID: ${data.id}`);
      }
    } catch (err) {
      console.error("❌ Lỗi tự động lưu phiên làm bài:", err);
    }
  };

  const updateInteractiveSessionStars = async (stars: number) => {
    if (!activeSessionId) return;
    try {
      const res = await fetch(`/api/interactive-sessions?id=${activeSessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentStars: stars })
      });
      const data = await res.json();
      if (data.success) {
        console.log("⭐ Stars updated.");
      }
    } catch (err) {
      console.error("❌ Lỗi cập nhật sao:", err);
    }
  };

  const saveResultsToDb = async () => {
    setIsSaving(true);
    try {
      const skills: ("Speaking" | "Listening" | "Reading" | "Writing")[] = [];
      if (isSkillTested("speaking")) skills.push("Speaking");
      if (isSkillTested("listening")) skills.push("Listening");
      if (isSkillTested("reading")) skills.push("Reading");
      if (isSkillTested("writing")) skills.push("Writing");

      const refScore = getReferenceScore();
      const level = refScore >= 85 ? "Flyers" : refScore >= 60 ? "Movers" : "Starters";
      
      const promises = skills.map(async (skill) => {
        let skillScore = 0;
        if (skill === "Speaking") skillScore = scores.speaking;
        else if (skill === "Listening") skillScore = scores.listening;
        else if (skill === "Reading") skillScore = scores.reading;
        else if (skill === "Writing") skillScore = scores.writing;
        
        let stars = 5;
        if (skillScore >= 85) stars = 5;
        else if (skillScore >= 70) stars = 4;
        else if (skillScore >= 50) stars = 3;
        else if (skillScore >= 30) stars = 2;
        else stars = 1;

        const res = await fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: `kid_entrance_${Date.now()}`,
            level,
            skill,
            sentence: skill === "Speaking" 
              ? "Entrance Interview: Life Communication & Double Picture Probing" 
              : skill === "Reading" 
              ? activeStory 
              : "Double word spelling assessment",
            score: skillScore,
            stars,
            mispronouncedWords: [],
            feedback: {
              tutorComment: skill === "Speaking" 
                ? `Bé ${kidName} miêu tả 2 bức tranh sinh động và giao tiếp tự nhiên với cô giáo AI.` 
                : skill === "Reading"
                ? `Bé ${kidName} đọc tốt câu chuyện dài, phát âm chuẩn xác ${readingAccuracyState}% số từ.`
                : `Bé hoàn thành rất tốt phần thi ${skill} đầu vào của trung tâm.`,
              tips: "Chúc mừng con đã xuất sắc hoàn thành kỳ thi đánh giá năng lực! Hãy tiếp tục duy trì đam mê nhé con!"
            },
            roadmap: skill === "Speaking" 
              ? ["Luyện tập nhại giọng theo AI trước gương", "Tự tin kể câu chuyện ngắn"] 
              : ["Xem lại lỗi nhỏ và luyện đọc to mỗi tối để nhớ chữ lâu hơn."]
          })
        });
        return await res.json();
      });

      const results = await Promise.all(promises);
      const successful = results.every(r => r.success);
      setSaveSuccess(successful);
    } catch (err) {
      console.error("Lỗi đồng bộ MongoDB:", err);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const getShieldsCount = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 75) return 4;
    if (score >= 50) return 3;
    if (score >= 30) return 2;
    return 1;
  };

  const getOverallLevel = (speakingScore: number) => {
    if (speakingScore >= 85) return { name: "Flyers (A2)", mascot: "🦁", title: "Lion Dũng Cảm", theme: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300", desc: "Wow! Bé có năng lực Tiếng Anh thật kinh ngạc! Con phát âm cực kỳ chuẩn xác, nghe hiểu nhanh nhạy và viết chính tả hoàn hảo. Con hoàn toàn sẵn sàng chinh phục các kỳ thi chuẩn quốc tế Flyers và đạt điểm tuyệt đối. Cô rất tự hào về con! 🦁🏆" };
    if (speakingScore >= 60) return { name: "Movers (A1)", mascot: "🐒", title: "Monkey Thông Minh", theme: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300", desc: "Chúc mừng bé xuất sắc đạt cấp độ Movers! Con có vốn từ vựng tốt, miêu tả tranh sinh động và đọc câu chuyện rất lưu loát. Hãy rèn luyện thêm ngữ pháp và chính tả khi viết câu để chuẩn bị cho nấc thang Flyers đầy thú vị tiếp theo nhé! 🐒👑" };
    return { name: "Starters (Pre-A1)", mascot: "🦛", title: "Hippo Dễ Thương", theme: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300", desc: "Bé ơi, con đã rất dũng cảm hoàn thành bài thi! Con có phản xạ nghe nói cơ bản, nhận diện được các từ quen thuộc. Cùng cô giáo AI rèn luyện thêm vốn từ vựng và tự tin bật âm để nhanh chóng chinh phục nấc thang Movers nhé! Cô chúc mừng con! 🦛🌟" };
  };

  const roadmapTasks = () => {
    const refScore = getReferenceScore();
    if (refScore >= 85) {
      return [
        "Thử thách tự viết 1 đoạn văn ngắn 5 câu giới thiệu về bản thân và gia đình ✍️",
        "Luyện nghe các đoạn hội thoại dài và tóm tắt lại ý chính 🎧",
        "Trở thành trợ giảng nhí giúp cô giáo AI hướng dẫn các bạn nhỏ hơn đọc bài nhé 👩‍🏫"
      ];
    } else if (refScore >= 60) {
      return [
        "Luyện miêu tả 1 bức tranh con thích bằng 3 câu tiếng Anh trôi chảy 🖼️",
        "Luyện chép chính tả 3 từ vựng khó chủ đề trường học và sở thích 📓",
        "Đọc to câu chuyện ngắn mỗi tối để luyện ngữ điệu lên xuống tự nhiên 📖"
      ];
    } else {
      return [
        "Luyện nghe & nhại giọng theo cô giáo AI 3 câu nói cơ bản mỗi ngày 🗣️",
        "Chơi trò chơi 'Đuổi hình bắt chữ' để tăng 20 từ vựng chủ đề phòng ngủ & động vật 🧸",
        "Viết nắn nót bảng chữ cái tiếng Anh và các từ ngắn 3 lần vào vở học tập ✍️"
      ];
    }
  };

  const overallLevelInfo = getOverallLevel(getReferenceScore());

  const exportToImage = async () => {
    if (resultsRef.current) {
      try {
        const dataUrl = await toPng(resultsRef.current, { cacheBust: true, pixelRatio: 2, fontEmbedCSS: "" });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `Ket_Qua_Test_${kidName}_${new Date().getTime()}.png`;
        link.click();
      } catch (err) {
        console.error("Lỗi xuất ảnh:", err);
      }
    }
  };

  const exportToPDF = async () => {
    if (resultsRef.current) {
      try {
        const dataUrl = await toPng(resultsRef.current, { cacheBust: true, pixelRatio: 2, fontEmbedCSS: "" });
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (resultsRef.current.offsetHeight * pdfWidth) / resultsRef.current.offsetWidth;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save(`Ket_Qua_Test_${kidName}_${new Date().getTime()}.pdf`);
      } catch (err) {
        console.error("Lỗi xuất PDF:", err);
      }
    }
  };

  const shareToZalo = async () => {
    if (resultsRef.current) {
      try {
        const blob = await toBlob(resultsRef.current, { cacheBust: true, pixelRatio: 2, fontEmbedCSS: "" });
        if (!blob) return;
        const file = new File([blob], `Ket_Qua_Test_${kidName}.png`, { type: "image/png" });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Kết quả bài kiểm tra',
              text: `Xem kết quả bài kiểm tra tiếng Anh của bé ${kidName}!`,
              files: [file]
            });
            return;
          } catch (err) {
            console.log("Share failed", err);
          }
        }
        
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          alert("Đã sao chép ảnh kết quả! Bạn có thể dán (Ctrl+V) trực tiếp vào đoạn chat Zalo.");
        } catch (clipboardErr) {
          console.error("Clipboard error", clipboardErr);
          alert("Trình duyệt không hỗ trợ chia sẻ trực tiếp. Vui lòng 'Tải Ảnh Kết Quả' và gửi qua Zalo.");
        }
      } catch (err) {
        console.error("Lỗi tạo ảnh chia sẻ:", err);
      }
    }
  };

  return {
    stage, setStage,
    activeTab, setActiveTab,
    messages, setMessages,
    isRecording, setIsRecording,
    isProcessing, setIsProcessing,
    isDevModeEnabled,
    devInputText, setDevInputText,
    resultsRef,
    isRealtimeMode,
    autoActivateMic, setAutoActivateMic,
    realtimeTranscript,
    isSpeechSupported,
    isTtsSpeaking,
    interactiveMode,
    showVocabularyHint,
    isImageZoomed, setIsImageZoomed,
    voices,
    selectedVoice,
    handleVoiceChange,
    handleMockTextSubmission,
    kidName, setKidName,
    kidAge, setKidAge,
    favAnimal, setFavAnimal,
    isGenerating,
    activeStory,
    activeMcq,
    activeSpelling,
    testCodeInput, setTestCodeInput,
    activeTestCode,
    activeTestPaperId,
    testPaperSections,
    verifyError,
    verifyingCode,
    picQuestions,
    pictureIndex,
    subQuestionIndex,
    attemptsCount,
    currentQuestion,
    keywordsHitPic1,
    totalProbingTurns,
    keywordsMentioned,
    probingTurnsCount,
    readingAccuracyState,
    showMcq,
    selectedMcqOption,
    mcqAnswered,
    isMcqCorrect,
    writingTaskIndex,
    typedWord,
    writingSubmitted,
    spellingCorrect1,
    spellingCorrect2,
    availableLetters,
    selectedLetters,
    draggedTile,
    isDragOverAnswer,
    isDragOverAvailable,
    scores,
    isSaving,
    saveSuccess,
    activeSessionId,
    selectedRatingStars, setSelectedRatingStars,
    hoveredRatingStars, setHoveredRatingStars,
    isTransitioningStage,
    audioRef,
    messagesEndRef,
    answerZoneRef,
    isSkillTested,
    getTeacherState,
    startTest,
    startRecording,
    stopRecording,
    handleMcqSelect,
    handleLetterTileTap,
    handleAnswerLetterTap,
    handleResetLetters,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDropOnTile,
    handleWritingSubmit,
    updateInteractiveSessionStars,
    saveResultsToDb,
    getShieldsCount,
    roadmapTasks,
    overallLevelInfo,
    exportToImage,
    exportToPDF,
    shareToZalo,
    mainScrollContainerRef
  };
}
