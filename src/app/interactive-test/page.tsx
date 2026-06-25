"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, Square, Loader2, PlayCircle, Send, Image as ImageIcon,
  Star, Award, Sparkles, Volume2, BookOpen, PenTool, CheckCircle2, 
  XCircle, ChevronRight, Home, ArrowRight, Trophy, Shield, RefreshCw, Compass, RotateCcw
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import DevelopmentRadarChart from "@/components/DevelopmentRadarChart";

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

// Custom YLE Shield SVG Component
const YleShield = ({ filled }: { filled: boolean }) => (
  <svg 
    className={`w-6 h-8 drop-shadow-sm transition-all duration-300 ${filled ? "text-amber-500 fill-amber-400 scale-110 animate-bounce-subtle" : "text-slate-200 fill-slate-100"}`} 
    viewBox="0 0 24 30"
  >
    <path 
      d="M12 2 L2 5 C2 15, 6 24, 12 28 C18 24, 22 15, 22 5 Z" 
      stroke="currentColor" 
      strokeWidth="2" 
    />
    {filled && (
      <path 
        d="M12 7 L14 11 L19 11 L15 14 L17 19 L12 16 L7 19 L9 14 L5 11 L10 11 Z" 
        fill="white" 
        transform="translate(4, 5) scale(0.65)"
      />
    )}
  </svg>
);

const Soundwave = () => (
  <div className="flex items-center gap-1 h-6 select-none shrink-0">
    <span className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ height: "60%", animationDuration: "0.8s", animationDelay: "0.1s" }} />
    <span className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ height: "100%", animationDuration: "0.7s", animationDelay: "0.2s" }} />
    <span className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ height: "40%", animationDuration: "0.9s", animationDelay: "0.3s" }} />
    <span className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ height: "80%", animationDuration: "0.6s", animationDelay: "0.4s" }} />
    <span className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ height: "50%", animationDuration: "0.8s", animationDelay: "0.5s" }} />
  </div>
);

const TeacherAvatar = ({ state }: { state: "idle" | "speaking" | "listening" | "thinking" }) => {
  let ringColor = "border-blue-300 dark:border-blue-700";
  let pulseClass = "";
  let badgeText = "Cô Lily AI 👩‍🏫";
  let badgeTheme = "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-955/40 dark:text-blue-300 dark:border-blue-850";

  if (state === "speaking") {
    ringColor = "border-emerald-400 dark:border-emerald-600";
    pulseClass = "animate-pulse ring-4 ring-emerald-100 dark:ring-emerald-950/20";
    badgeText = "Cô Lily đang nói... 🔊";
    badgeTheme = "bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-955/40 dark:text-emerald-350 dark:border-emerald-900";
  } else if (state === "listening") {
    ringColor = "border-rose-400 dark:border-rose-600";
    pulseClass = "animate-pulse ring-4 ring-rose-100 dark:ring-rose-950/20";
    badgeText = "Cô đang nghe con nè... 🎤";
    badgeTheme = "bg-rose-50 text-rose-600 border-rose-255 dark:bg-rose-955/40 dark:text-rose-350 dark:border-rose-900";
  } else if (state === "thinking") {
    ringColor = "border-amber-400 dark:border-amber-600";
    pulseClass = "animate-pulse ring-4 ring-amber-100 dark:ring-amber-950/20";
    badgeText = "Cô đang suy nghĩ... 🧠";
    badgeTheme = "bg-amber-50 text-amber-600 border-amber-250 dark:bg-amber-955/40 dark:text-amber-350 dark:border-amber-900";
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 w-full select-none">
      <div className={`relative w-12 h-12 rounded-full border-2 ${ringColor} ${pulseClass} transition-all duration-300 flex items-center justify-center bg-sky-50 dark:bg-slate-800 shadow-sm shrink-0`}>
        {/* Cute female teacher avatar SVG */}
        <svg className="w-8 h-8 text-indigo-500 fill-indigo-100 dark:text-indigo-400 dark:fill-indigo-950/30" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          <circle cx="10.5" cy="8" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
          <circle cx="13.5" cy="8" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
          <line x1="12" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1" />
        </svg>
        {state === "speaking" && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 text-[8px] items-center justify-center">🔊</span>
          </span>
        )}
        {state === "listening" && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 text-[8px] items-center justify-center">🎤</span>
          </span>
        )}
        {state === "thinking" && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 text-[8px] items-center justify-center">🧠</span>
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1">
          <span className="text-sm font-black text-slate-800 dark:text-slate-100">Cô Lily AI</span>
          <span className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-[8px] px-1 py-0.2 rounded font-mono font-black uppercase">PRO</span>
        </div>
        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black border shadow-sm ${badgeTheme}`}>
          {badgeText}
        </span>
      </div>
    </div>
  );
};

export default function InteractiveTest() {
  const [stage, setStage] = useState<Stage>("intro");
  const [activeTab, setActiveTab] = useState<"progress" | "chat">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Real-time and Child-friendly states (simplified: always real-time, always auto-mic)
  const isRealtimeMode = true;
  const autoActivateMic = true;
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
    speaking: 85,
    listening: 90,
    reading: 80,
    writing: 100
  });
  
  // MongoDB sync states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  
  // Transition stage management to prevent microphone auto-activation race condition
  const [isTransitioningStage, setIsTransitioningStage] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ref callback to avoid stale closure issues
  const handleAudioSubmissionRef = useRef<any>(null);
  useEffect(() => {
    handleAudioSubmissionRef.current = handleAudioSubmission;
  });

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

  const playTTS = (text: string) => {
    const cleanText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    const url = `/api/tts?text=${encodeURIComponent(cleanText.trim())}&voice=${selectedVoice}`;
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(e => console.error("Lỗi phát audio:", e));
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
      };
    }
  }, [stage, isRealtimeMode, autoActivateMic, isProcessing, isRecording, showMcq, isTransitioningStage]);

  const addAiMessage = (content: string) => {
    const newMessage: Message = { id: Date.now().toString(), role: "ai", content, stage };
    setMessages((prev) => [...prev, newMessage]);
    playTTS(content);
  };

  const startTest = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/interactive-test/generate");
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
    } catch (err) {
      console.error("Lỗi gọi API sinh đề thi động:", err);
      // Fallback variables will take place automatically
    } finally {
      setIsGenerating(false);
      setStage("warmup");
      setPictureIndex(0);
      setSubQuestionIndex(0);
      setAttemptsCount(0);
      lastAskedPicIndexRef.current = null;
      // Add slight delay to make transitions natural
      setTimeout(() => {
        addAiMessage("Hello! Welcome to the English test. What's your name?");
      }, 500);
    }
  };

  // Automatically ask the first sub-question when starting picture stage or switching pictures
  useEffect(() => {
    if (stage === "picture" && currentQuestion) {
      if (lastAskedPicIndexRef.current !== pictureIndex) {
        lastAskedPicIndexRef.current = pictureIndex;
        setSubQuestionIndex(0);
        
        const firstQuestionText = currentQuestion.questions?.[0]?.examinerScript || currentQuestion.examinerScript || "Look at the picture. What can you see?";
        
        const timer = setTimeout(() => {
          setIsTransitioningStage(false);
          addAiMessage(firstQuestionText);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [stage, pictureIndex, currentQuestion]);

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
          const currentQ = currentQuestion?.questions?.[subQuestionIndex];
          const expected = currentQ?.expectedKeywords || [];
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
            console.error("Speech Recognition Error Type:", e.error);
            console.error("Speech Recognition Error Details:", e.message || "No message", e);
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
          attemptsCount
        }));
      } else if (stage === "reading") {
        formData.append("context", JSON.stringify({
          referenceStory: activeStory
        }));
      }

      const res = await fetch("/api/interactive-chat", {
        method: "POST",
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

        // 6. Handle automatic stage transitions
        if (stage === "picture" && !data.stageComplete) {
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

        if (data.stageComplete) {
          if (stage === "warmup") {
            setIsTransitioningStage(true);
            setTimeout(() => setStage("picture"), 2500);
          } else if (stage === "picture") {
            // Handle sequential 2-picture logic
            if (pictureIndex === 0) {
              setIsTransitioningStage(true);
              setTimeout(() => {
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
              }, 2500);
            } else {
              setIsTransitioningStage(true);
              setTimeout(() => {
                setTotalProbingTurns(prev => prev + probingTurnsCount);
                setStage("reading");
              }, 2500);
            }
          } else if (stage === "reading") {
            // After reading aloud story, transition to the MCQ panel after a short delay
            setTimeout(() => setShowMcq(true), 2500);
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

    if (correct) {
      playTTS("Perfect! You got it right! Let's do some spelling now!");
      setTimeout(() => {
        setStage("writing");
      }, 3500);
    } else {
      playTTS(`Good try! Max actually loves ${activeMcq.options[activeMcq.correctIndex]}. Let's do some spelling now!`);
      setTimeout(() => {
        setStage("writing");
      }, 4500);
    }
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
      
      if (isCorrect) {
        playTTS("Perfect! That's correct spelling! Next word!");
      } else {
        playTTS("Good try! Let's try spelling the next word!");
      }

      setTimeout(() => {
        setTypedWord("");
        setWritingSubmitted(false);
        setWritingTaskIndex(1);
        // Letter tiles will be re-initialized by the useEffect
      }, 2500);
      
    } else {
      // Save Task 2 result
      setSpellingCorrect2(isCorrect);
      setWritingSubmitted(true);
      
      if (isCorrect) {
        playTTS("Fantastic! Correct spelling!");
      } else {
        playTTS("Well done! You worked so hard!");
      }

      // Calculate final aggregated scores across all 4 stages
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
      const speakingScore = Math.round((100 + pictureSpeaking + readingAccuracyState) / 3);

      const pictureListening = Math.max(100 - ((totalProbingTurns + probingTurnsCount) * 8), 65);
      const mcqListening = isMcqCorrect ? 100 : 40;
      const listeningScore = Math.round((pictureListening + mcqListening) / 2);

      const mcqReading = isMcqCorrect ? 100 : 30;
      const readingScore = Math.round((readingAccuracyState + mcqReading) / 2);

      // Writing score: both correct (100), one correct (65), both wrong (30)
      const correctSpellingsCount = (spellingCorrect1 ? 1 : 0) + (isCorrect ? 1 : 0);
      const writingScore = correctSpellingsCount === 2 ? 100 : correctSpellingsCount === 1 ? 65 : 30;

      const computedScores = {
        speaking: speakingScore,
        listening: listeningScore,
        reading: readingScore,
        writing: writingScore
      };

      setScores(computedScores);

      // Auto-transition to final Report Card
      setTimeout(() => {
        setStage("results");
      }, 2500);
    }
  };

  // MongoDB sync logic to log results in real DB
  const saveResultsToDb = async () => {
    setIsSaving(true);
    try {
      const skills: ("Speaking" | "Listening" | "Reading" | "Writing")[] = ["Speaking", "Listening", "Reading", "Writing"];
      const level = scores.speaking >= 85 ? "Flyers" : scores.speaking >= 60 ? "Movers" : "Starters";
      
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

  // Convert Score to YLE shields (1 to 5)
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
    if (scores.speaking >= 85) {
      return [
        "Thử thách tự viết 1 đoạn văn ngắn 5 câu giới thiệu về bản thân và gia đình ✍️",
        "Luyện nghe các đoạn hội thoại dài và tóm tắt lại ý chính 🎧",
        "Trở thành trợ giảng nhí giúp cô giáo AI hướng dẫn các bạn nhỏ hơn đọc bài nhé 👩‍🏫"
      ];
    } else if (scores.speaking >= 60) {
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

  const overallLevelInfo = getOverallLevel(scores.speaking);

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
  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background bubbles */}

        <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-4 border-blue-100 dark:border-blue-900 relative z-10">
          <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: "2.5s" }}>🌟</div>
          <h1 className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 mb-2">BÀI THI ĐẦU VÀO CHO BÉ</h1>
          <h3 className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 md:mb-6">Đánh giá năng lực đầu vào</h3>
          
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 md:p-4 text-left border border-slate-200 dark:border-slate-600 space-y-2.5 md:space-y-3 mb-6 md:mb-8">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Lộ trình bài test:</h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-pink-100 border border-pink-200 text-pink-500 flex items-center justify-center shrink-0">1</span>
              <span><strong>Warm-up:</strong> Chào hỏi tự nhiên, phản xạ nói cơ bản</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-200 text-amber-500 flex items-center justify-center shrink-0">2</span>
              <span><strong>Speaking:</strong> Tương tác và miêu tả <strong>2 Bức tranh</strong> liên tiếp</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-500 flex items-center justify-center shrink-0">3</span>
              <span><strong>Reading:</strong> Đọc to <strong>Truyện dài động</strong> & MCQ trắc nghiệm</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-500 flex items-center justify-center shrink-0">4</span>
              <span><strong>Writing:</strong> Đánh vần và gõ <strong>2 từ vựng</strong> (Không gợi ý!)</span>
            </div>
          </div>

          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mb-6 md:mb-8 font-extrabold">
            Bé hãy bật loa thật to và chuẩn bị sát Mic để thi cùng cô giáo AI nhé! 🎤👩‍🏫
          </p>

          <button 
            onClick={startTest}
            className="w-full btn-3d-green py-4 font-bold text-xl shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            <PlayCircle className="inline-block mr-2 w-6 h-6 animate-pulse" />
            BẮT ĐẦU PHÒNG THI
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
      <div className="w-full min-h-screen pb-20 relative bg-pastel-bg dark:bg-dark-bg overflow-x-hidden">
        {/* Decorative bubbles */}

        {/* Header bar */}
        <header className="w-full bg-white dark:bg-slate-900 border-b-4 border-slate-100 dark:border-slate-700 py-3 md:py-4 px-3 md:px-4 sticky top-0 z-30 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/">
              <button className="btn-3d-gray px-4 py-2.5 text-xs font-black flex items-center gap-1">
                Quay Lại Trang Chủ
              </button>
            </Link>
            
            <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 md:px-4 py-1 md:py-1.5 rounded-2xl">
              <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
              <span className="text-[10px] md:text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Kết Quả Đánh Giá Năng Lực Đầu Vào
              </span>
            </div>

            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center border-2 border-emerald-300 dark:border-emerald-700">
              <span className="text-lg">👑</span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl w-full mx-auto px-3 md:px-4 mt-6 md:mt-8 flex flex-col gap-6 md:gap-8 relative z-10">
          
          {/* Certificate Showcase Card */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-300 dark:border-amber-800 p-5 md:p-8 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-2 left-6 text-2xl animate-bounce" style={{ animationDelay: "1s" }}>✨</div>
            <div className="absolute top-8 right-8 text-2xl animate-bounce" style={{ animationDelay: "2.5s" }}>🎈</div>
            
            <span className="bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full border border-blue-200 inline-flex items-center gap-1.5 mb-4 shadow-sm">
              <Award className="w-3.5 h-3.5 text-blue-500 fill-blue-100" />
              Chứng Nhận Năng Lực Quốc Tế Cambridge YLE
            </span>

            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              BẢNG KẾT QUẢ CỦA BÉ {kidName.toUpperCase()}
            </h2>
            <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 font-extrabold mt-1">Tuổi học viên: {kidAge} tuổi</p>

            {/* Stacking Recommended Level (ô 1) and Development Radar Chart (ô 2) vertically */}
            <div className="flex flex-col gap-6 items-center justify-center my-8 max-w-xl mx-auto w-full">
              {/* Top: Recommended Level Badge (ô 1) */}
              <div className={`border-2 rounded-3xl p-6 shadow-md transition-all hover:scale-105 duration-300 text-center w-full flex flex-col justify-center items-center ${overallLevelInfo.theme}`}>
                <span className="text-5xl block animate-bounce" style={{ animationDuration: "2s" }}>
                  {overallLevelInfo.mascot}
                </span>
                <span className="text-xs font-black opacity-60 uppercase tracking-widest block mt-2">
                  Trình độ khuyến nghị
                </span>
                <span className="text-3xl font-black block mt-1 tracking-tight font-sans">
                  {overallLevelInfo.name}
                </span>
                <span className="inline-block mt-3 bg-white/70 dark:bg-slate-800/70 px-3 py-1 rounded-xl text-xs font-bold border border-current">
                  {overallLevelInfo.title}
                </span>
              </div>

              {/* Bottom: Development Radar Chart (ô 2) */}
              <div className="flex justify-center items-center w-full">
                <DevelopmentRadarChart
                  title="Biểu đồ phát triển"
                  colorScheme="violet"
                  size={380}
                  data={[
                    { label: "Speaking (Nói)", value: scores.speaking, emoji: "🎤" },
                    { label: "Listening (Nghe)", value: scores.listening, emoji: "🎧" },
                    { label: "Reading (Đọc)", value: scores.reading, emoji: "📖" },
                    { label: "Writing (Viết)", value: scores.writing, emoji: "✍️" },
                  ]}
                />
              </div>
            </div>

            {/* YLE Shields Matrix Grid */}
            <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-3xl p-4 md:p-6 shadow-inner mt-4 md:mt-6">
              <h3 className="text-xs md:text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 md:mb-6">
                Đánh giá theo 4 kỹ năng ngôn ngữ
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {/* Speaking */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">🎤 Speaking (Kỹ năng Nói)</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold mt-0.5">Điểm quy đổi: {scores.speaking}/100</p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <YleShield key={i} filled={i < getShieldsCount(scores.speaking)} />
                    ))}
                  </div>
                </div>

                {/* Listening */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">🎧 Listening (Kỹ năng Nghe)</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold mt-0.5">Điểm quy đổi: {scores.listening}/100</p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <YleShield key={i} filled={i < getShieldsCount(scores.listening)} />
                    ))}
                  </div>
                </div>

                {/* Reading */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">📖 Reading (Kỹ năng Đọc)</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold mt-0.5">Điểm quy đổi: {scores.reading}/100</p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <YleShield key={i} filled={i < getShieldsCount(scores.reading)} />
                    ))}
                  </div>
                </div>

                {/* Writing */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">✍️ Writing (Kỹ năng Viết)</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold mt-0.5">Điểm quy đổi: {scores.writing}/100</p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <YleShield key={i} filled={i < getShieldsCount(scores.writing)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* AI Feedback Section */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 md:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              
              <div className="shrink-0 flex sm:flex-col items-center gap-2 self-center sm:self-start bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-750 rounded-2xl p-4 w-full sm:w-28 text-center shadow-inner">
                <span className="text-5xl animate-bounce" style={{ animationDuration: "2.5s" }}>
                  {overallLevelInfo.mascot}
                </span>
                <div>
                  <p className="text-slate-700 dark:text-slate-200 leading-tight font-black">
                    {overallLevelInfo.title}
                  </p>
                  <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 mt-0.5">Cô giáo AI</p>
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="relative bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-5 shadow-sm">
                  <div className="hidden sm:block absolute left-0 top-8 w-4 h-4 bg-emerald-50 border-l-2 border-b-2 border-emerald-200 transform -translate-x-[9px] rotate-45" />
                  
                  <h4 className="text-emerald-800 font-extrabold text-sm mb-2 flex items-center gap-1.5">
                    Lời khuyên nồng nhiệt của cô giáo dành cho bé {kidName}:
                  </h4>
                  
                  <p className="text-slate-700 text-sm font-extrabold leading-relaxed">
                    "{overallLevelInfo.desc}"
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Learning Roadmap checklist */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 md:p-8 shadow-xl">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 border-b dark:border-slate-800 pb-4">
              <Compass className="w-6 h-6 text-blue-500 animate-spin" style={{ animationDuration: "8s" }} />
              Lộ trình rèn luyện nâng cao năng lực 🚀
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-450 font-bold leading-relaxed mb-6">
              Dựa trên kết quả thi đầu vào, cô giáo AI đã chuẩn hóa riêng cho con 3 bài tập nhỏ luyện tập tại nhà:
            </p>

            <div className="space-y-4">
              {roadmapTasks().map((task, index) => (
                <div key={index} className="border-2 border-blue-50 dark:border-slate-800 bg-white dark:bg-slate-850 rounded-2xl p-4 flex items-start gap-3 shadow-sm hover:border-blue-200 dark:hover:border-slate-750 transition-colors">
                  <span className="inline-block text-xs font-black bg-blue-100/60 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md mr-2 font-mono shrink-0">
                    Bài {index + 1}
                  </span>
                  <div className="text-sm font-extrabold leading-relaxed text-slate-700 dark:text-slate-200">
                    {task}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Control Actions / MongoDB Sync trigger */}
          <section className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
            
            {saveSuccess === null ? (
              <button 
                onClick={saveResultsToDb}
                disabled={isSaving}
                className="btn-3d-green w-full sm:w-auto px-8 py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-105 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu trữ...
                  </>
                ) : (
                  <>
                    Lưu kết quả học tập 💾
                  </>
                )}
              </button>
            ) : saveSuccess ? (
              <div className="w-full sm:w-auto px-6 py-3 bg-emerald-50 border-2 border-emerald-300 text-emerald-700 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Đồng bộ database thành công! 🚀
              </div>
            ) : (
              <div className="w-full sm:w-auto px-6 py-3 bg-rose-50 border-2 border-rose-300 text-rose-700 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm">
                <XCircle className="w-4 h-4 shrink-0" />
                Không thể kết nối. Lưu offline! 🔌
              </div>
            )}

            <button
              onClick={() => {
                setStage("intro");
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
              }}
              className="btn-3d-yellow w-full sm:w-auto px-8 py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-1 hover:scale-105 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Thi Lại Bài Test 🔄
            </button>

            <Link href="/" className="w-full sm:w-auto">
              <button className="btn-3d-blue w-full sm:w-auto px-8 py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-1 hover:scale-105 cursor-pointer">
                <Home className="w-4 h-4" />
                Về Trang Chủ 🏠
              </button>
            </Link>

          </section>

        </main>
      </div>
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
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-955/50 flex items-center justify-center text-lg sm:text-xl shadow-inner border-2 border-blue-200">👩‍🏫</div>
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
          <div className="flex items-center gap-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 sm:h-2.5 md:h-3 border border-slate-200 dark:border-slate-650 px-0.5 overflow-hidden">
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
        <div className="absolute inset-4 bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-150 dark:border-slate-800 shadow-md p-4 md:p-6 overflow-hidden">
          
          {/* Grid structure: side-by-side on desktop, vertical stack on mobile */}
          <div className="h-full w-full flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
            
            {/* Left Column: Tranh & Bài học */}
            <div className="lg:col-span-6 flex flex-col min-h-0 overflow-y-auto h-[45dvh] lg:h-full shrink-0">
             {stage === "warmup" && (
               <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
                 <div className="relative mb-6">
                   <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full blur-xl opacity-30 animate-pulse" />
                   <span className="text-[120px] md:text-[160px] leading-none block relative animate-bounce" style={{ animationDuration: "3s" }}>🏫</span>
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Giai đoạn 1: Chào hỏi với cô giáo AI</h3>
                 <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-md leading-relaxed font-black">
                   Con hãy lắng nghe câu hỏi của cô giáo Lily, nhấn nút micro ở dưới cùng và nói thật rõ ràng nhé! 🎤🌟
                 </p>
                 
               </div>
             )}

             {stage === "picture" && currentQuestion && (
               <div className="flex-1 flex flex-col min-h-0 justify-between">
                 <div>
                   <h3 className="font-extrabold text-amber-700 dark:text-amber-300 flex items-center justify-between mb-3 text-xs uppercase tracking-wider">
                     <div className="flex items-center gap-2">
                       <span className="text-lg">🖼️</span>
                       <span>Bức tranh {pictureIndex + 1}/2 — Thử thách {subQuestionIndex + 1}/{currentQuestion.questions?.length || 5}</span>
                     </div>
                     
                     {/* Cambridge shield trackers */}
                     <div className="flex gap-0.5">
                       {Array.from({ length: currentQuestion.questions?.length || 5 }).map((_, i) => (
                         <YleShield key={i} filled={i <= subQuestionIndex} />
                       ))}
                     </div>
                   </h3>
                 </div>

                 {currentQuestion.imagePath && (
                   <div 
                     onClick={() => setIsImageZoomed(true)}
                     className="relative w-full max-w-full sm:max-w-xl mx-auto aspect-video md:max-h-[420px] flex-1 min-h-[150px] sm:min-h-[220px] rounded-3xl overflow-hidden shadow-xl border-4 border-gradient-to-r from-amber-200 to-blue-200 dark:border-slate-700 hover:scale-[1.01] transition-transform duration-300 my-2 bg-slate-50 dark:bg-slate-950/40 cursor-pointer cursor-zoom-in"
                   >
                     <Image 
                       src={currentQuestion.imagePath} 
                       alt="Study illustration" 
                       fill 
                       className="object-contain"
                       sizes="(max-width: 768px) 100vw, 700px"
                       priority
                     />
                   </div>
                 )}

                 {/* Simplified star counter for keywords */}
                 <div className="mt-3 flex items-center justify-between bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
                   <span className="text-xs font-black text-slate-500 dark:text-slate-400">⭐ Từ vựng đạt:</span>
                   <div className="flex items-center gap-1">
                     <span className="text-lg font-black text-amber-500">{keywordsMentioned.length}</span>
                     <span className="text-xs font-bold text-slate-400">từ</span>
                     {keywordsMentioned.length > 0 && <span className="text-lg animate-bounce">🌟</span>}
                   </div>
                 </div>
               </div>
             )}

             {stage === "reading" && (
               <div className="flex-1 flex flex-col justify-center min-h-0">
                 {!showMcq ? (
                   // Reading Aloud slide
                   <div className="flex flex-col items-center p-2 min-h-0">
                     <h3 className="font-extrabold text-emerald-805 dark:text-emerald-355 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                       <span className="text-lg">📖</span>
                       Đọc to câu chuyện dưới đây cho cô giáo Lily nghe nhé:
                     </h3>
                     
                     <div className="relative bg-amber-50 dark:bg-slate-855 border-4 border-amber-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-inner w-full max-w-xl">
                       <span className="absolute -top-4 -left-4 text-3xl">✨</span>
                       <span className="absolute -bottom-4 -right-4 text-3xl">🎈</span>
                       <p className="text-base md:text-xl font-bold text-slate-850 dark:text-slate-100 leading-relaxed font-sans text-center select-none whitespace-normal">
                         "{activeStory}"
                       </p>
                     </div>
                   </div>
                 ) : (
                   // Reading MCQ slide
                   <div className="flex flex-col items-center p-2 min-h-0">
                     <h3 className="font-extrabold text-blue-805 dark:text-blue-300 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                       <span className="text-lg">🧩</span>
                       Đã đến giờ trả lời câu hỏi! Chọn 1 đáp án đúng:
                     </h3>
                     
                     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 border-2 border-blue-150 dark:border-slate-700 rounded-2xl p-5 shadow-sm mb-5 text-center w-full max-w-lg">
                       <p className="text-base md:text-xl font-black text-slate-800 dark:text-slate-100">
                         {activeMcq.question}
                       </p>
                     </div>

                     {/* Interactive MCQ Choices */}
                     <div className="flex flex-col gap-3 w-full max-w-md">
                       {activeMcq.options.map((option: string, idx: number) => {
                         const isSelected = selectedMcqOption === idx;
                         const isCorrectOption = idx === activeMcq.correctIndex;
                         
                         let optionClass = "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 hover:translate-y-[-2px]";
                         if (mcqAnswered) {
                           if (isCorrectOption) {
                             optionClass = "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 scale-[1.02] shadow-md z-10";
                           } else if (isSelected) {
                             optionClass = "bg-rose-100 dark:bg-rose-950/50 border-rose-400 text-rose-700 dark:text-rose-300 opacity-60";
                           } else {
                             optionClass = "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-40";
                           }
                         }

                         return (
                           <button
                             key={idx}
                             type="button"
                             onClick={() => handleMcqSelect(idx)}
                             disabled={mcqAnswered}
                             className={`w-full px-5 py-4 rounded-2xl font-black text-base md:text-lg transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-between ${optionClass}`}
                           >
                             <span>{option}</span>
                             {mcqAnswered && isCorrectOption && (
                               <span className="text-2xl shrink-0 ml-2 animate-bounce">✅</span>
                             )}
                             {mcqAnswered && isSelected && !isCorrectOption && (
                               <span className="text-2xl shrink-0 ml-2">❌</span>
                             )}
                           </button>
                         );
                       })}
                     </div>
                   </div>
                 )}
               </div>
             )}

             {stage === "writing" && (
               <div className="flex-1 flex flex-col justify-center items-center min-h-0">
                 <h3 className="font-extrabold text-indigo-805 dark:text-indigo-300 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                   <span className="text-lg">✍️</span>
                   Thử thách đánh vần [{writingTaskIndex + 1}/2]
                 </h3>

                 <div className="bg-white dark:bg-slate-855 border-4 border-indigo-200 dark:border-slate-700 rounded-3xl p-5 md:p-6 shadow-md w-full max-w-md flex flex-col items-center text-center">
                   <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-indigo-50 dark:bg-slate-800 border-2 border-indigo-200 flex items-center justify-center text-4xl md:text-5xl mb-4 shadow-inner">
                     <span className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-300/40 animate-spin" style={{ animationDuration: "12s" }} />
                     <span className="animate-bounce" style={{ animationDuration: "2.5s" }}>
                       {writingTaskIndex === 0 ? "🐒" : "🍌"}
                     </span>
                   </div>
                   
                   <p className="text-slate-750 dark:text-slate-200 font-extrabold text-sm md:text-base leading-relaxed mb-4 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-750 w-full text-center">
                     Cô Lily hỏi: &quot;{activeSpelling[writingTaskIndex].prompt}&quot;
                   </p>

                   {/* Answer zone — where selected letters appear */}
                   <div 
                     onDragOver={(e) => handleDragOver(e, "answer")}
                     onDragEnter={(e) => handleDragEnter(e, "answer")}
                     onDragLeave={(e) => handleDragLeave(e, "answer")}
                     onDrop={(e) => handleDrop(e, "answer")}
                     className={`answer-zone w-full mb-4 transition-all duration-200 ${
                       selectedLetters.length > 0 ? "has-letters" : ""
                     } ${isDragOverAnswer ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 ring-4 ring-indigo-200/50 scale-[1.02]" : ""}`}
                   >
                     {selectedLetters.length === 0 ? (
                       <span className="text-xs font-bold text-slate-400 italic">
                         Kéo thả chữ cái vào đây hoặc bấm để chọn... ✨
                       </span>
                     ) : (
                       selectedLetters.map((tile, idx) => (
                         <button
                           key={`ans-${tile.id}`}
                           onClick={() => !writingSubmitted && handleAnswerLetterTap(tile)}
                           draggable={!writingSubmitted}
                           onDragStart={(e) => handleDragStart(e, tile, "selected")}
                           onDragEnd={handleDragEnd}
                           onDragOver={(e) => handleDragOver(e, "answer")}
                           onDrop={(e) => handleDropOnTile(e, idx)}
                           className={`letter-tile in-answer transition-all duration-100 ${
                             draggedTile?.id === tile.id ? "opacity-40 scale-95 border-dashed" : ""
                           }`}
                           type="button"
                           disabled={writingSubmitted}
                         >
                           {tile.letter}
                         </button>
                       ))
                     )}
                   </div>

                   {/* Available letter tiles */}
                    <div 
                      onDragOver={(e) => handleDragOver(e, "available")}
                      onDragEnter={(e) => handleDragEnter(e, "available")}
                      onDragLeave={(e) => handleDragLeave(e, "available")}
                      onDrop={(e) => handleDrop(e, "available")}
                      className={`flex flex-wrap gap-2.5 justify-center mb-4 p-3 rounded-2xl border-2 border-dashed transition-all duration-200 w-full ${
                        isDragOverAvailable 
                          ? "border-amber-400 dark:border-amber-500 bg-amber-50/40 dark:bg-slate-800/40 scale-[1.02] ring-4 ring-amber-100/30" 
                          : "border-transparent"
                      }`}
                    >
                     {availableLetters.map((tile) => (
                       <button
                         key={`avail-${tile.id}`}
                         onClick={() => handleLetterTileTap(tile)}
                         draggable={!writingSubmitted}
                         onDragStart={(e) => handleDragStart(e, tile, "available")}
                         onDragEnd={handleDragEnd}
                         className={`letter-tile transition-all duration-100 ${
                           draggedTile?.id === tile.id ? "opacity-40 scale-95 border-dashed" : ""
                         }`}
                         type="button"
                         disabled={writingSubmitted}
                       >
                         {tile.letter}
                       </button>
                     ))}
                   </div>

                   {/* Action buttons */}
                   <form onSubmit={handleWritingSubmit} className="w-full flex gap-2.5">
                     <button
                       type="button"
                       onClick={handleResetLetters}
                       disabled={selectedLetters.length === 0 || writingSubmitted}
                       className="btn-3d-gray px-3 py-3 text-xs font-black flex items-center gap-1 flex-1"
                     >
                       <RotateCcw className="w-4 h-4" /> Xếp lại
                     </button>
                     <button
                       type="submit"
                       disabled={selectedLetters.length === 0 || writingSubmitted}
                       className="btn-3d-blue py-3 font-extrabold text-sm flex items-center justify-center gap-2 flex-[2] disabled:opacity-50 cursor-pointer"
                     >
                       Nộp bài 🚀
                     </button>
                   </form>

                   {writingSubmitted && (
                     <div className="mt-4 animate-bounce-subtle text-xs font-black">
                       {selectedLetters.map(t => t.letter).join("").toLowerCase() === activeSpelling[writingTaskIndex].correctWord.toLowerCase() ? (
                         <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-250">🎉 Xuất sắc! Con đã ghép đúng rồi!</span>
                       ) : (
                         <span className="text-rose-500 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-full border border-rose-250">✍️ Gần đúng rồi, cô đang chấm điểm nhé!</span>
                       )}
                     </div>
                   )}
                 </div>
               </div>
             )}
            </div>

            {/* Right Column: Trò chuyện cùng cô */}
            <div className="lg:col-span-6 flex flex-col min-h-0 lg:border-l-4 border-slate-100 dark:border-slate-800 lg:pl-6 flex-1 lg:h-full">

              {/* Dialogue exchange box (auto scroll) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-405 dark:text-slate-600 gap-3 py-10">
                    <span className="text-4xl animate-pulse">👋</span>
                    <p className="text-xs font-black">Hãy nói gì đó để bắt đầu trò chuyện cùng cô Lily nhé!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex items-start gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "ai" && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-955 flex items-center justify-center border border-blue-200 shrink-0 text-sm select-none shadow-sm">
                          👩‍🏫
                        </div>
                      )}
                      <div className={`relative max-w-[80%] lg:max-w-[88%] px-4 py-3 rounded-2xl text-xs md:text-sm font-black shadow-sm ${
                        msg.role === "ai" 
                          ? "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-tl-none" 
                          : "bg-blue-500 text-white rounded-tr-none"
                      }`}>
                       {msg.role === "ai" && (
                         <div className="absolute left-[-6px] top-3 w-0 h-0 border-t-[8px] border-t-white dark:border-t-slate-800 border-l-[6px] border-l-transparent" />
                       )}
                       {msg.role === "user" && (
                         <div className="absolute right-[-6px] top-3 w-0 h-0 border-t-[8px] border-t-blue-500 border-r-[6px] border-r-transparent" />
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
                   <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-955 flex items-center justify-center border border-blue-200 shrink-0 text-sm select-none shadow-sm">
                     👩‍🏫
                   </div>
                   <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-2 text-sm font-black text-slate-555 dark:text-slate-400">
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

      {/* Simplified Bottom Control Panel */}
      <div className="bg-white dark:bg-slate-900 border-t-4 border-slate-150 dark:border-slate-800 p-2.5 sm:p-4 rounded-t-3xl shadow-lg shrink-0 select-none">
        <div className="max-w-6xl mx-auto flex flex-col gap-2">

          {/* Practice Mode Vocabulary Hints Card */}
          {(showVocabularyHint || (interactiveMode === "practice" && (stage === "picture" || stage === "reading"))) && (
            <div className="bg-amber-50 dark:bg-amber-955/20 border-2 border-dashed border-amber-300 dark:border-amber-905 rounded-2xl p-3 text-left animate-bounce-subtle shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">💡</span>
                <h5 className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 font-sans">Gợi ý từ vựng cho con:</h5>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(stage === "picture" 
                  ? currentQuestion?.questions?.[subQuestionIndex]?.expectedKeywords 
                  : stage === "reading" 
                  ? activeStory.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/).slice(0, 5) 
                  : []
                )?.map((kw: string) => (
                  <span key={kw} className="bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-205 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold shadow-sm font-sans">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Transcript display (Full width) */}
          <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-4 py-2 rounded-2xl h-12 sm:h-14 flex items-center overflow-hidden shrink-0">
            {isRecording ? (
              <div className="flex items-center gap-3 w-full">
                <Soundwave />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-wider mb-0.5 animate-pulse">Con đang nói:</p>
                  <p className="text-xs sm:text-sm font-black text-slate-705 dark:text-slate-300 truncate">
                    {realtimeTranscript || "Hãy nói đi con, cô đang nghe nè... 🎤"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] sm:text-xs md:text-sm font-black text-slate-550 dark:text-slate-400 w-full text-center">
                {stage === "writing" 
                  ? "Kéo thả hoặc bấm chữ cái để ghép từ ở trên nhé! ✍️" 
                  : showMcq 
                  ? "Chọn đáp án trắc nghiệm ở trên nhé! 🧩" 
                  : isRecording 
                  ? "Con cứ nói đi, cô sẽ tự nộp bài ⚡"
                  : "Bấm nút 🎤 để nói với cô Lily"}
              </p>
            )}
          </div>

          {/* Action Row containing Mic trigger and child guide text */}
          <div className="flex flex-col items-center gap-1.5 mt-1 w-full shrink-0">
            {/* Big Mic Button */}
            <div className="shrink-0">
              {!isRecording ? (
                <button 
                  type="button"
                  onClick={startRecording}
                  disabled={isProcessing || showMcq || stage === "writing"}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 bg-gradient-to-tr from-emerald-400 to-green-500 text-white rounded-full flex flex-col items-center justify-center hover:scale-105 active:scale-[0.95] disabled:opacity-20 disabled:hover:scale-100 transition-all shadow-md cursor-pointer border-b-6 border-emerald-700 shrink-0"
                >
                  <Mic className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5" />
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">NÓI</span>
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={stopRecording}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 bg-gradient-to-tr from-rose-400 to-red-500 text-white rounded-full flex flex-col items-center justify-center hover:scale-105 active:scale-[0.95] animate-pulse-slow shadow-md shadow-rose-200 cursor-pointer border-b-6 border-rose-700 shrink-0"
                >
                  <Square className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">DỪNG</span>
                </button>
              )}
            </div>

            {/* Hint message for children */}
            <p className="text-center text-[10px] text-slate-450 dark:text-slate-500 font-extrabold select-none max-w-xs sm:max-w-md">
              {stage === "writing" 
                ? "Con hãy kéo thả các chữ cái hoặc bấm để ghép từ nhé! ✍️" 
                : showMcq 
                ? "Con hãy chọn câu trả lời ở bên trái nhé!" 
                : isRecording 
                ? isRealtimeMode 
                  ? "Con cứ nói đi, cô sẽ tự nộp bài khi con dừng nói ⚡" 
                  : "Đang nghe... Con bấm nút Dừng màu đỏ khi nói xong nhé!" 
                : "Bấm nút Nói màu xanh lá để bắt đầu nói với cô Lily"}
            </p>
          </div>

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
