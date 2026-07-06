"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, Square, Loader2, PlayCircle, Send, Image as ImageIcon,
  Star, Award, Sparkles, Volume2, BookOpen, PenTool, CheckCircle2, 
  XCircle, ChevronRight, Home, ArrowRight, Trophy, Shield, RefreshCw, Compass, RotateCcw, Download, FileText, Share2,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import DevelopmentRadarChart from "@/components/DevelopmentRadarChart";
import { toPng, toBlob } from "html-to-image";
import jsPDF from "jspdf";
import SkillShield from "./components/SkillShield";
import Soundwave from "./components/Soundwave";
import TeacherAvatar from "./components/TeacherAvatar";
import WarmupStage from "./components/WarmupStage";
import PictureStage from "./components/PictureStage";
import ReadingStage from "./components/ReadingStage";
import WritingStage from "./components/WritingStage";
import ResultsStage from "./components/ResultsStage";

// Shuffle helper (Fisher-Yates)
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Stage = "intro" | "warmup" | "picture" | "reading" | "writing" | "results";

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  stage: Stage;
  audioUrl?: string;
}

// Inline helper components removed and loaded from components directory

export default function InteractiveTest() {
  const [stage, setStage] = useState<Stage>("intro");
  const [activeTab, setActiveTab] = useState<"progress" | "chat">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Develop Mode Simulation Mock Inputs
  const [isDevModeEnabled, setIsDevModeEnabled] = useState(false);
  const [devInputText, setDevInputText] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

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

  const handleMockTextSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devInputText.trim() || isProcessing) return;
    const textToSend = devInputText.trim();
    setDevInputText("");
    
    // Simulate real-time SpeechRecognition transcription
    realtimeTranscriptRef.current = textToSend;
    setRealtimeTranscript(textToSend);
    
    // Call handleAudioSubmission with an empty blob to trigger the API flow
    const emptyBlob = new Blob([new Uint8Array(100)], { type: "audio/webm" });
    await handleAudioSubmission(emptyBlob);
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
  const answerZoneRef = useRef<HTMLDivElement>(null);

  // Scroll to top of the main container when stage changes
  useEffect(() => {
    if (mainScrollContainerRef.current) {
      mainScrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [stage, pictureIndex]); // Cuộn lên đầu khi qua bài hoặc đổi ảnh

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
      const handlePlay = () => setIsTtsSpeaking(true);
      const handlePause = () => setIsTtsSpeaking(false);
      const handleEnded = () => {
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

      audioEl.addEventListener("play", handlePlay);
      audioEl.addEventListener("pause", handlePause);
      audioEl.addEventListener("ended", handleEnded);
      return () => {
        audioEl.removeEventListener("play", handlePlay);
        audioEl.removeEventListener("pause", handlePause);
        audioEl.removeEventListener("ended", handleEnded);
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
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

    console.log(`⏱️ Queuing transition with fallback timeout of ${fallbackDelay}ms for text: "${cleanText}"`);
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
        
        // For pictureIndex === 0 (Picture 1), we use this local timer fallback.
        // For pictureIndex === 1 (Picture 2), sendSilentTransitionMessage() will fetch the greeting & question dynamically.
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
      // Check if we already asked it in the messages to avoid double posting on state changes
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
          console.log("⚡ Auto-activating mic for Stage 3 Reading!");
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

      // Start hesitation timer of 5 seconds in practice mode
      if (interactiveMode === "practice") {
        setShowVocabularyHint(false);
        if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
        hesitationTimerRef.current = setTimeout(() => {
          console.log("⏱️ Hesitation detected (5 seconds)!");
          // Check if user has spoken any keywords of the current question
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

              // Clear hesitation timer since they started speaking!
              if (hesitationTimerRef.current) {
                clearTimeout(hesitationTimerRef.current);
                hesitationTimerRef.current = null;
              }

              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = setTimeout(() => {
                console.log("⏱️ Silence detected! Submitting text: " + realtimeTranscriptRef.current);
                stopRecording();
              }, 1800);
            }
          };

          recognition.onerror = (e: any) => {
            if (e.error === "aborted") {
              // Bỏ qua lỗi ngắt kết nối thủ công vì đây là hành vi bình thường khi tắt mic
              console.log("🎙️ Speech recognition stopped/aborted manually.");
              return;
            }
            if (e.error === "network") {
              console.warn("⚠️ Speech Recognition Network Error. Chờ kết nối lại...");
              return;
            }
            console.warn("Speech Recognition Error Type:", e.error);
            console.warn("Speech Recognition Error Details:", e.message || "No message", e);
            if (e.error === "not-allowed") {
              console.warn("⚠️ Microphone access denied or origin is not secure (requires localhost or HTTPS).");
            }
          };

          recognition.onend = () => {
            console.log("Speech recognition ended.");
          };

          recognitionRef.current = recognition;
          recognition.start();
        } else {
          console.warn("SpeechRecognition not supported in this browser.");
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

    // Clear hesitation timer when recording stops
    if (hesitationTimerRef.current) {
      clearTimeout(hesitationTimerRef.current);
      hesitationTimerRef.current = null;
    }
  }
  // Trigger silent message when picture index changes to 1
  useEffect(() => {
    if (stage === "picture" && pictureIndex === 1 && currentQuestion && messages.length > 0) {
      // Check if we just transitioned by looking at the last message
      const lastMsg = messages[messages.length - 1];
      // When we transition, we rename previous picture messages to "intro"
      if (lastMsg && lastMsg.stage === "intro") {
        // Prevent double firing if there's already a picture message
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
        setIsTransitioningStage(false); // Reset transitioning flag to allow mic activation after the speaking is finished
        addAiMessage(data.aiResponse);
      }
    } catch (err) {
      console.error("Silent transition failed:", err);
      setIsTransitioningStage(false); // Reset flag on error to prevent locking
    } finally {
      setIsProcessing(false);
    }
  };

  async function handleAudioSubmission(audioBlob: Blob) {
    setIsProcessing(true);
    const transcriptText = realtimeTranscriptRef.current;
    
    // Reset real-time transcripts for the next turn
    realtimeTranscriptRef.current = "";
    setRealtimeTranscript("");

    // Clear and hide hint on submission
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
        // 1. Add user transcription message
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + "_u",
          role: "user",
          content: data.transcribedText || "(Con đã trả lời bằng giọng nói 🎤)",
          stage
        }]);

        // 2. Add AI reply
        addAiMessage(data.aiResponse);

        // 3. Extract kid info dynamically in Stage 1 Warmup
        if (stage === "warmup") {
          const userMsgs = messages.filter(m => m.role === "user");
          const transcript = (data.transcribedText || "").trim();
          
          if (userMsgs.length === 0) {
            // First user response: Name
            const name = transcript.replace(/(my name is|i am|tên con là|tên là|con là)/gi, "").trim();
            setKidName(name || "Con");
          } else if (userMsgs.length === 1) {
            // Second user response: Age
            const age = transcript.replace(/[^0-9]/g, "");
            setKidAge(age || "7");
          } else if (userMsgs.length === 2) {
            // Third user response: Favorite animal
            setFavAnimal(transcript || "monkey");
          }
        }

        // 4. Track keywords and probing turns during Stage 2 Picture description
        if (stage === "picture" && currentQuestion) {
          const newlyFound = data.keywordsHit || [];
          setKeywordsMentioned((prev) => Array.from(new Set([...prev, ...newlyFound])));
          
          // Increment probing turns count based on how many sub-questions were processed/answered in this turn
          const turnsCompleted = (data.answeredIndices?.length || 1);
          setProbingTurnsCount(prev => prev + turnsCompleted);
        }

        // 5. Track reading accuracy in Stage 3 Reading Aloud
        if (stage === "reading") {
          setReadingAccuracyState(data.readingAccuracy || 85);
        }

        // 6. Handle automatic stage transitions with client-side out-of-bounds safety check
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
            // Handle sequential 2-picture logic
            if (pictureIndex === 0) {
              runTransitionAfterSpeech(() => {
                setKeywordsHitPic1(keywordsMentioned.length);
                setTotalProbingTurns(prev => prev + probingTurnsCount);
                setPictureIndex(1);
                
                // Switch to second question (use modulo fallback if only 1 image seeded)
                const nextQuestion = picQuestions[1 % picQuestions.length] || currentQuestion;
                setCurrentQuestion(nextQuestion);
                
                // Rename previous picture messages to avoid affecting Picture 2's turn count on backend
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
            // After reading aloud story, transition to the MCQ panel after a short delay
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

  // Stage 3 MCQ Option click logic
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

  // Letter tile tap handlers
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

  // Drag and Drop handlers
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

  // Stage 4 Writing submission & scoring calculation (using letter tiles)
  const handleWritingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const builtWord = selectedLetters.map(t => t.letter).join("");
    if (!builtWord) return;

    const isCorrect = builtWord.toLowerCase().trim() === activeSpelling[writingTaskIndex].correctWord.toLowerCase().trim();

    if (writingTaskIndex === 0) {
      // Save Task 1 result
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
      // Save Task 2 result
      setSpellingCorrect2(isCorrect);
      setWritingSubmitted(true);
      
      if (isCorrect) {
        playTTS("Fantastic! Correct spelling!");
      } else {
        playTTS("Well done! You worked so hard!");
      }

      // Auto-transition to final Report Card
      setTimeout(() => {
        setStage("results");
      }, 2500);
    }
  };

  // Automatically calculate scores and save session when test enters results stage
  useEffect(() => {
    if (stage === "results" && !activeSessionId) {
      // 1. Calculate Speaking Score
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

      // 2. Calculate Listening Score
      let listeningScore = 0;
      if (isSkillTested("listening")) {
        const pictureListening = Math.max(100 - ((totalProbingTurns + probingTurnsCount) * 8), 65);
        const mcqListening = isMcqCorrect ? 100 : 40;
        listeningScore = Math.round((pictureListening + mcqListening) / 2);
      }

      // 3. Calculate Reading Score
      let readingScore = 0;
      if (isSkillTested("reading")) {
        const mcqReading = isMcqCorrect ? 100 : 30;
        readingScore = Math.round((readingAccuracyState + mcqReading) / 2);
      }

      // 4. Calculate Writing Score
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
      console.log("💾 Autosaving interactive session to database (default: no rating)...");
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
        console.log(`💾 Autosave successful! Created record: ${data.id}`);
      }
    } catch (err) {
      console.error("❌ Lỗi tự động lưu phiên làm bài:", err);
    }
  };

  const updateInteractiveSessionStars = async (stars: number) => {
    if (!activeSessionId) return;
    try {
      console.log(`⭐ Updating session ${activeSessionId} satisfaction rating to ${stars} stars...`);
      const res = await fetch(`/api/interactive-sessions?id=${activeSessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentStars: stars })
      });
      const data = await res.json();
      if (data.success) {
        console.log("⭐ Satisfaction rating updated successfully!");
      }
    } catch (err) {
      console.error("❌ Lỗi cập nhật số sao đánh giá:", err);
    }
  };

  // MongoDB sync logic to log results in real DB
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
        const json = await res.json();
        return json;
      });

      const results = await Promise.all(promises);
      const successful = results.every(r => r.success);
      if (successful) {
        setSaveSuccess(true);
      } else {
        setSaveSuccess(false);
      }
    } catch (err) {
      console.error("Lỗi đồng bộ MongoDB:", err);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Convert Score to shields (1 to 5)
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

  // 0. Dynamic YLE Test Loading overlay
  if (isGenerating) {
    return (
      <div className="w-full min-h-screen bg-pastel-bg dark:bg-dark-bg flex flex-col items-center justify-center p-4 md:p-6 text-center select-none">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border-8 border-indigo-300 border-t-indigo-600 animate-spin" />
          <span className="text-4xl absolute inset-0 flex items-center justify-center animate-bounce">👩‍🏫</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 animate-pulse">
          Cô giáo AI đang soạn bộ đề thi riêng cho con...
        </h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-sm leading-relaxed">
          Đợi một chút xíu nhé! Cô đang lấy những bức tranh đẹp nhất từ MongoDB và nhờ trí tuệ nhân tạo dệt thành câu chuyện đọc hiểu lôi cuốn nhất dành riêng cho con đấy! 🚀✨
        </p>
      </div>
    );
  }

  // 1. Intro view
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
          position = heightLeft - imgHeight; // shift image up
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
        const blob = await toBlob(resultsRef.current, { cacheBust: true, pixelRatio: 2, fontEmbedCSS: "" });        if (!blob) return;
        const file = new File([blob], `Ket_Qua_Test_${kidName}.png`, { type: "image/png" });
        
        // Try Web Share API (Mobile)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Kết quả bài kiểm tra',
              text: `Xem kết quả bài kiểm tra tiếng Anh của bé ${kidName}!`,
              files: [file]
            });
            return;
          } catch (err) {
            console.log("Share cancelled or failed", err);
          }
        }
        
        // Fallback to Clipboard (Desktop)
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

  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background bubbles */}

        <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-4 border-blue-100 dark:border-blue-900 relative z-10">
          <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: "2.5s" }}>🌟</div>
          <h1 className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 mb-2">BÀI THI ĐẦU VÀO CHO BÉ</h1>
          <h3 className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 md:mb-6">Đánh giá năng lực đầu vào</h3>
          
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 md:p-4 text-left border border-slate-200 dark:border-slate-600 space-y-2.5 md:space-y-3 mb-6 md:mb-6">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Lộ trình bài test:</h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-pink-100 border border-pink-200 text-pink-500 flex items-center justify-center shrink-0">1</span>
              <span><strong>Warm-up:</strong> Chào hỏi tự nhiên, phản xạ nói cơ bản</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-200 text-amber-500 flex items-center justify-center shrink-0">2</span>
              <span><strong>Speaking:</strong> Tương tác và miêu tả <strong>Bức tranh</strong> sinh động</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-500 flex items-center justify-center shrink-0">3</span>
              <span><strong>Reading:</strong> Đọc to <strong>Truyện ngắn động</strong> & MCQ trắc nghiệm</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-500 flex items-center justify-center shrink-0">4</span>
              <span><strong>Writing:</strong> Đánh vần và gõ <strong>từ vựng</strong> tương tác</span>
            </div>
          </div>

          {/* Test Code Input Room */}
          <div className="mb-6 text-left bg-blue-50/50 dark:bg-slate-800/40 p-4 border border-blue-100 dark:border-blue-900 rounded-2xl">
            <label className="block text-xs font-black text-indigo-600 dark:text-indigo-400 mb-1.5 uppercase tracking-wide">
              🔑 Nhập mã phòng thi (nếu có):
            </label>
            <input 
              type="text" 
              value={testCodeInput} 
              onChange={e => setTestCodeInput(e.target.value)} 
              className="w-full bg-white dark:bg-slate-800 border-2 border-blue-200 focus:border-indigo-500 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold text-center text-sm transition-colors" 
              placeholder="Ví dụ: MID_TERM_A, LOP_MOVERS_01..." 
            />
            {verifyError && (
              <p className="text-red-500 text-[11px] font-bold mt-1.5 flex items-center gap-1 justify-center bg-red-50 dark:bg-red-950/20 p-1.5 rounded-lg border border-red-100 dark:border-red-900">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" /> {verifyError}
              </p>
            )}
          </div>

          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mb-6 font-extrabold">
            Bé hãy bật loa thật to và chuẩn bị sát Mic để thi cùng cô giáo AI nhé! 🎤👩‍🏫
          </p>

          <button 
            onClick={startTest}
            disabled={verifyingCode}
            className="w-full btn-3d-green py-4 font-bold text-xl shadow-lg hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {verifyingCode ? (
              <span>Đang kiểm tra phòng thi...</span>
            ) : (
              <>
                <PlayCircle className="inline-block mr-2 w-6 h-6 animate-pulse" />
                BẮT ĐẦU PHÒNG THI
              </>
            )}
          </button>
          
          <Link href="/" className="block mt-4 text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-300 text-xs">
            Quay lại Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  // 2. Report Card view (Results screen)
  if (stage === "results") {
    return (
      <ResultsStage
        overallLevelInfo={overallLevelInfo}
        scores={scores}
        kidName={kidName}
        kidAge={kidAge}
        selectedRatingStars={selectedRatingStars}
        hoveredRatingStars={hoveredRatingStars}
        saveSuccess={saveSuccess}
        isSaving={isSaving}
        messages={messages}
        isSkillTested={isSkillTested}
        getShieldsCount={getShieldsCount}
        roadmapTasks={roadmapTasks}
        setSelectedRatingStars={setSelectedRatingStars}
        setHoveredRatingStars={setHoveredRatingStars}
        updateInteractiveSessionStars={updateInteractiveSessionStars}
        exportToImage={exportToImage}
        exportToPDF={exportToPDF}
        shareToZalo={shareToZalo}
        saveResultsToDb={saveResultsToDb}
        setStage={setStage}
        startTest={startTest}
        resultsRef={resultsRef}
      />
    );
  }

  // 3. Main Testing stages interface
  return (
    <div className="bg-slate-50 dark:bg-dark-bg flex flex-col h-[100dvh] overflow-hidden w-full max-w-[95%] lg:max-w-[1400px] mx-auto relative select-none">
      {/* Hidden audio element for TTS */}
      <audio ref={audioRef} className="hidden" />

      {/* Header with Stage indicators */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 md:p-4 shadow-md flex items-center justify-between sticky top-0 z-20 border-b dark:border-slate-700 rounded-b-3xl select-none gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-lg sm:text-xl shadow-inner border-2 border-blue-200">👩‍🏫</div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm md:text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <span className="truncate">Cô Lily</span>
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-[8px] px-1 py-0.2 rounded font-mono font-black uppercase">PRO</span>
            </h2>
            <p className="text-[9px] sm:text-[10px] text-blue-500 font-extrabold capitalize truncate">
              <span className="hidden sm:inline">Giai đoạn </span>
              {stage === "warmup" ? "1: Khởi động" : stage === "picture" ? "2: Tả tranh" : stage === "reading" ? "3: Tập đọc" : "4: Đánh vần"}
            </p>
          </div>
        </div>

        {/* Cambridge Progress Bar */}
        <div className="flex flex-col items-center gap-0.5 sm:gap-1 max-w-[80px] sm:max-w-[150px] md:max-w-xs w-full">
          <div className="hidden sm:flex justify-between w-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <span>Tiến trình</span>
            <span>
              {stage === "warmup" ? "25%" : stage === "picture" ? "50%" : stage === "reading" ? "75%" : "95%"}
            </span>
          </div>
          <div className="flex items-center gap-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 sm:h-2.5 md:h-3 border border-slate-200 dark:border-slate-600 px-0.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-blue-500 h-1 sm:h-1.5 md:h-2 rounded-full transition-all duration-500 shadow-sm animate-pulse-slow"
              style={{ 
                width: 
                  stage === "warmup" ? "25%" : 
                  stage === "picture" ? "50%" : 
                  stage === "reading" ? "75%" : "95%" 
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/">
            <button className="btn-3d-pink px-3 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-xs font-black flex items-center gap-1 cursor-pointer">
              <span>Thoát</span>
              <span className="hidden sm:inline">🚪</span>
            </button>
          </Link>
        </div>
      </div>


      {/* Main Workspace Area — fullscreen per stage on mobile */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div className="absolute inset-4 bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-800 shadow-md p-4 md:p-6 overflow-hidden">
          
          {/* Grid structure: side-by-side on desktop, vertical stack on mobile */}
          <div 
            ref={mainScrollContainerRef}
            className="h-full w-full flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-6 min-h-0 overflow-hidden"
          >
            
            {/* Left Column: Tranh & Bài học */}
            <div className={`lg:col-span-6 flex flex-col min-h-0 shrink-0 max-h-[48vh] sm:max-h-[55vh] lg:max-h-full lg:h-full ${stage === "warmup" ? "hidden lg:flex" : ""}`}>
              {stage === "warmup" && <WarmupStage />}

              {stage === "picture" && currentQuestion && (
                <PictureStage
                  currentQuestion={currentQuestion}
                  pictureIndex={pictureIndex}
                  subQuestionIndex={subQuestionIndex}
                  showVocabularyHint={showVocabularyHint}
                  interactiveMode={interactiveMode}
                  keywordsMentioned={keywordsMentioned}
                  setIsImageZoomed={setIsImageZoomed}
                />
              )}

              {stage === "reading" && (
                <ReadingStage
                  activeStory={activeStory}
                  showVocabularyHint={showVocabularyHint}
                  interactiveMode={interactiveMode}
                  showMcq={showMcq}
                  activeMcq={activeMcq}
                  selectedMcqOption={selectedMcqOption}
                  mcqAnswered={mcqAnswered}
                  handleMcqSelect={handleMcqSelect}
                />
              )}

              {stage === "writing" && (
                <WritingStage
                  writingTaskIndex={writingTaskIndex}
                  activeSpelling={activeSpelling}
                  selectedLetters={selectedLetters}
                  availableLetters={availableLetters}
                  writingSubmitted={writingSubmitted}
                  draggedTile={draggedTile}
                  isDragOverAnswer={isDragOverAnswer}
                  isDragOverAvailable={isDragOverAvailable}
                  answerZoneRef={answerZoneRef}
                  handleDragOver={handleDragOver}
                  handleDragEnter={handleDragEnter}
                  handleDragLeave={handleDragLeave}
                  handleDrop={handleDrop}
                  handleAnswerLetterTap={handleAnswerLetterTap}
                  handleLetterTileTap={handleLetterTileTap}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  handleDropOnTile={handleDropOnTile}
                  handleResetLetters={handleResetLetters}
                  handleWritingSubmit={handleWritingSubmit}
                />
              )}
            </div>

            {/* Right Column: Trò chuyện cùng cô */}
            <div className="lg:col-span-6 flex flex-col min-h-0 lg:border-l-4 border-slate-100 dark:border-slate-800 lg:pl-6 flex-1 lg:h-full">

              {/* Dialogue exchange box (auto scroll) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-600 gap-3 py-10">
                    <span className="text-4xl animate-pulse">👋</span>
                    <p className="text-xs font-black">Hãy nói gì đó để bắt đầu trò chuyện cùng cô Lily nhé!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex items-start gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "ai" && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center border border-blue-200 shrink-0 text-sm select-none shadow-sm">
                          👩‍🏫
                        </div>
                      )}
                      <div className={`relative max-w-[80%] lg:max-w-[88%] px-4 py-3 rounded-2xl text-sm md:text-base font-black shadow-sm ${
                        msg.role === "ai" 
                          ? "bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50 rounded-tl-none" 
                          : "bg-blue-600 dark:bg-indigo-500 text-white rounded-tr-none"
                      }`}>
                       {msg.role === "ai" && (
                         <div className="absolute left-[-6px] top-3 w-0 h-0 border-t-[8px] border-t-slate-50 dark:border-t-slate-700 border-l-[6px] border-l-transparent" />
                       )}
                       {msg.role === "user" && (
                         <div className="absolute right-[-6px] top-3 w-0 h-0 border-t-[8px] border-t-blue-600 dark:border-t-indigo-500 border-r-[6px] border-r-transparent" />
                       )}
                       <p className="whitespace-pre-line">{msg.content}</p>
                     </div>
                     {msg.role === "user" && (
                       <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center border border-emerald-200 shrink-0 text-sm select-none shadow-sm">
                         👶
                       </div>
                     )}
                   </div>
                 ))
               )}
               
               {isProcessing && (
                 <div className="flex justify-start items-start gap-2.5">
                   <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center border border-blue-200 shrink-0 text-sm select-none shadow-sm">
                     👩‍🏫
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
                     <div className="flex gap-0.5">
                       <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                       <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                       <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                     </div>
                     <span>Cô Lily đang suy nghĩ...</span>
                   </div>
                 </div>
               )}
               <div ref={messagesEndRef} />
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Sleek, Space-efficient Bottom Control Panel */}
      <div className="bg-white dark:bg-slate-900 border-t-2 border-slate-100 dark:border-slate-800 p-3 sm:p-4 rounded-t-3xl shadow-lg shrink-0 select-none">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          
          <div className="flex items-center gap-3 sm:gap-4 w-full">
            {/* Left/Center Area: Status & Transcript (Unified) */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-4 py-2.5 rounded-2xl min-h-[56px] flex flex-col justify-center overflow-hidden">
              {isRecording ? (
                <div className="flex items-center gap-3 w-full">
                  <Soundwave />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-wider mb-0.5 animate-pulse">Con đang nói:</p>
                    <p className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 truncate">
                      {realtimeTranscript || "Hãy nói đi con, cô đang nghe nè... 🎤"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-left w-full">
                  <p className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 leading-snug">
                    {stage === "writing" 
                      ? "Kéo thả hoặc bấm chữ cái để ghép từ ở trên nhé! ✍️" 
                      : showMcq 
                      ? "Chọn đáp án trắc nghiệm ở trên nhé! 🧩" 
                      : "Sẵn sàng trò chuyện cùng cô Lily"}
                  </p>
                  {stage !== "writing" && !showMcq && (
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-extrabold mt-0.5">
                      {autoActivateMic 
                        ? "🎤 Mic sẽ tự động bật khi cô Lily nói xong" 
                        : "Bấm nút Nói màu xanh lá bên cạnh để bắt đầu nói với cô"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Mic / Stop Action Button on the Right */}
            {stage !== "writing" && !showMcq && (
              <div className="shrink-0">
                {!isRecording ? (
                  <button 
                    type="button"
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-emerald-400 to-green-500 text-white rounded-full flex flex-col items-center justify-center hover:scale-105 active:scale-[0.95] disabled:opacity-20 disabled:hover:scale-100 transition-all shadow-md cursor-pointer border-b-4 border-emerald-700 shrink-0"
                  >
                    <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">NÓI</span>
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={stopRecording}
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-rose-400 to-red-500 text-white rounded-full flex flex-col items-center justify-center hover:scale-105 active:scale-[0.95] animate-pulse-slow shadow-md shadow-rose-200 cursor-pointer border-b-4 border-rose-700 shrink-0"
                  >
                    <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">DỪNG</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Settings Row (Auto-mic Toggle) */}
          {stage !== "writing" && !showMcq && (
            <div className="flex items-center justify-end gap-2 px-1 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>🎙️ Tự động bật Mic</span>
              <button
                type="button"
                onClick={() => setAutoActivateMic(!autoActivateMic)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoActivateMic ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoActivateMic ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Dev Mode Input Sub-row */}
          {isDevModeEnabled && !showMcq && stage !== "writing" && (
            <form onSubmit={handleMockTextSubmission} className="w-full flex gap-2 mt-1">
              <input
                type="text"
                value={devInputText}
                onChange={(e) => setDevInputText(e.target.value)}
                placeholder="Giả lập lời nói của bé (Dev)..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-1.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                Gửi
              </button>
            </form>
          )}

        </div>
      </div>

{/* Image Zoom Modal Overlay */}
      {isImageZoomed && currentQuestion?.imagePath && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsImageZoomed(false)}
        >
          <div 
            className="relative w-full max-w-4xl h-[80vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-slate-950 flex items-center justify-center animate-pulse-slow"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer transition-colors z-10"
              onClick={() => setIsImageZoomed(false)}
            >
              ✕
            </button>
            <Image 
              src={currentQuestion.imagePath} 
              alt="Zoomed illustration" 
              fill
              className="object-contain p-4"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
