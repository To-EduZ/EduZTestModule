"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Volume2,
  CheckCircle,
  BookOpen,
  Headphones,
  ChevronRight,
  Trophy,
  Star,
  RefreshCw,
  Sparkles,
  Home,
} from "lucide-react";
import {
  CAMBRIDGE_QUESTIONS,
  CambridgeQuestion,
  CambridgeResult,
  calculateResult,
  getSectionLabel,
  getPartLabel,
} from "@/lib/cambridgeQuestionBank";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSectionIcon(section: "language-use" | "listening") {
  if (section === "language-use")
    return <BookOpen className="w-4 h-4 md:w-5 md:h-5" />;
  return <Headphones className="w-4 h-4 md:w-5 md:h-5" />;
}

function getSectionColor(section: "language-use" | "listening") {
  return section === "language-use"
    ? "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800"
    : "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800";
}

function getClubGradient(club: string) {
  switch (club) {
    case "Orbit":
      return "from-indigo-500 via-purple-500 to-pink-500";
    case "Zoom":
      return "from-emerald-500 via-teal-500 to-cyan-500";
    case "Lift Off":
      return "from-amber-500 via-orange-500 to-yellow-500";
    default:
      return "from-slate-400 via-slate-500 to-slate-600";
  }
}

function getClubColor(club: string) {
  switch (club) {
    case "Orbit":
      return "text-purple-600 dark:text-purple-400";
    case "Zoom":
      return "text-emerald-600 dark:text-emerald-400";
    case "Lift Off":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-slate-600 dark:text-slate-400";
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CambridgeTestPage() {
  const [testState, setTestState] = useState<"intro" | "test" | "results">(
    "intro"
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<CambridgeResult | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [listeningPlayed, setListeningPlayed] = useState<
    Record<string, boolean>
  >({});

  // For Part 3 Listening — grouped questions share an audio
  const [listeningP3AudioPlayed, setListeningP3AudioPlayed] = useState(false);

  const autoSubmitRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = CAMBRIDGE_QUESTIONS[currentIndex];
  const totalQuestions = CAMBRIDGE_QUESTIONS.length;

  // Voice preference from localStorage
  const selectedVoice =
    typeof window !== "undefined"
      ? localStorage.getItem("preferred_accent_voice") || "en-US-AriaNeural"
      : "en-US-AriaNeural";

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ── Auto-advance after selecting option ──
  useEffect(() => {
    if (selectedOption && testState === "test") {
      setShowCelebrate(true);
      autoSubmitRef.current = setTimeout(() => {
        handleSubmitAnswer(selectedOption);
        setShowCelebrate(false);
      }, 900);

      return () => {
        if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption]);

  // ── TTS Playback ──
  const playNativeTTS = useCallback(
    (text: string) => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voiceLang = selectedVoice.startsWith("en-GB")
          ? "en-GB"
          : selectedVoice.startsWith("en-AU")
            ? "en-AU"
            : "en-US";
        utterance.lang = voiceLang;
        utterance.rate = 0.85;
        utterance.onstart = () => setTtsPlaying(true);
        utterance.onend = () => setTtsPlaying(false);
        utterance.onerror = () => setTtsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    },
    [selectedVoice]
  );

  const playTTS = useCallback(
    (text: string) => {
      if (!text) return;
      setTtsPlaying(true);

      try {
        const ttsUrl = `/api/tts?text=${encodeURIComponent(text)}&voice=${selectedVoice}`;
        const audio = new Audio(ttsUrl);
        audioRef.current = audio;
        audio.onended = () => setTtsPlaying(false);
        audio.onerror = () => {
          console.warn("Edge TTS failed, using native SpeechSynthesis");
          playNativeTTS(text);
        };
        audio.play().catch(() => {
          console.warn("Autoplay blocked, using native SpeechSynthesis");
          playNativeTTS(text);
        });
      } catch {
        playNativeTTS(text);
      }
    },
    [selectedVoice, playNativeTTS]
  );

  const handlePlayAudio = () => {
    if (!currentQuestion?.audioText || ttsPlaying) return;
    playTTS(currentQuestion.audioText);
    setListeningPlayed((prev) => ({ ...prev, [currentQuestion.id]: true }));
    if (currentQuestion.type === "listening-detail") {
      setListeningP3AudioPlayed(true);
    }
  };

  // ── Submit Answer ──
  const handleSubmitAnswer = (answer: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIndex + 1 >= totalQuestions) {
      // Test complete
      const res = calculateResult(newAnswers, CAMBRIDGE_QUESTIONS);
      setResult(res);
      setTestState("results");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // ── Restart ──
  const handleRestart = () => {
    setTestState("intro");
    setCurrentIndex(0);
    setAnswers({});
    setSelectedOption(null);
    setResult(null);
    setListeningPlayed({});
    setListeningP3AudioPlayed(false);
  };

  // ── Progress calculation ──
  const progressPercent = ((currentIndex) / totalQuestions) * 100;

  // Determine which section/part info to show
  const getCurrentSectionPart = () => {
    if (!currentQuestion) return { section: "", part: "", partNum: 0 };
    const sectionLabel = getSectionLabel(currentQuestion.section);
    const partLabel = getPartLabel(currentQuestion.section, currentQuestion.part);
    return {
      section: sectionLabel,
      part: partLabel,
      partNum: currentQuestion.part,
    };
  };

  // ─── INTRO SCREEN ─────────────────────────────────────────────────────────

  if (testState === "intro") {
    return (
      <div className="w-full min-h-screen bg-pastel-bg dark:bg-dark-bg flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-indigo-300 dark:border-indigo-800 p-5 md:p-8 shadow-2xl max-w-lg w-full relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-200/40 dark:bg-violet-900/20 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-sky-200/40 dark:bg-sky-900/20 rounded-full pointer-events-none" />

          <div className="relative z-10 text-center">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">
              Cambridge YLE Test
            </h1>
            <p className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-4">
              Test Your English for Young Learners
            </p>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Bài kiểm tra tiếng Anh theo chuẩn Cambridge giúp con biết trình
              độ hiện tại. Gồm 30 câu hỏi, chia thành 2 phần chính.
            </p>

            {/* Test Structure */}
            <div className="space-y-3 mb-6">
              <div className="bg-violet-50 dark:bg-violet-950/30 border-2 border-violet-200 dark:border-violet-800 rounded-2xl p-3 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5 text-violet-500" />
                  <span className="font-black text-violet-700 dark:text-violet-300 text-sm">
                    📝 Language Use
                  </span>
                  <span className="ml-auto text-[10px] font-black text-violet-500 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded-full">
                    18 câu
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-7">
                  Từ vựng • Giao tiếp • Ngữ pháp
                </p>
              </div>

              <div className="bg-sky-50 dark:bg-sky-950/30 border-2 border-sky-200 dark:border-sky-800 rounded-2xl p-3 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Headphones className="w-5 h-5 text-sky-500" />
                  <span className="font-black text-sky-700 dark:text-sky-300 text-sm">
                    🎧 Listening
                  </span>
                  <span className="ml-auto text-[10px] font-black text-sky-500 bg-sky-100 dark:bg-sky-900/50 px-2 py-0.5 rounded-full">
                    12 câu
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-7">
                  Nghe chọn hình • Nghe chọn đáp án • Nghe hiểu chi tiết
                </p>
              </div>
            </div>

            {/* Score Bands */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Thang điểm CEFR
              </p>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  {
                    range: "0-20",
                    level: "Pre-A1",
                    club: "Countdown",
                    emoji: "🚀",
                    bg: "bg-slate-100 dark:bg-slate-700",
                  },
                  {
                    range: "21-40",
                    level: "A1",
                    club: "Lift Off",
                    emoji: "🌟",
                    bg: "bg-amber-50 dark:bg-amber-950/30",
                  },
                  {
                    range: "41-60",
                    level: "A2",
                    club: "Zoom",
                    emoji: "⚡",
                    bg: "bg-emerald-50 dark:bg-emerald-950/30",
                  },
                  {
                    range: "61-80",
                    level: "B1",
                    club: "Orbit",
                    emoji: "🪐",
                    bg: "bg-purple-50 dark:bg-purple-950/30",
                  },
                ].map((band) => (
                  <div
                    key={band.level}
                    className={`${band.bg} rounded-xl p-1.5`}
                  >
                    <div className="text-lg">{band.emoji}</div>
                    <div className="text-[9px] font-black text-slate-600 dark:text-slate-300">
                      {band.level}
                    </div>
                    <div className="text-[8px] font-bold text-slate-400">
                      {band.range}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setTestState("test")}
              className="btn-3d-green w-full py-4 text-lg font-black uppercase tracking-wider"
            >
              <Sparkles className="w-5 h-5 inline mr-2" />
              BẮT ĐẦU LÀM BÀI
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULTS SCREEN ───────────────────────────────────────────────────────

  if (testState === "results" && result) {
    return (
      <div className="w-full min-h-screen bg-pastel-bg dark:bg-dark-bg py-6 md:py-10 px-3 md:px-4 flex flex-col items-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-300 dark:border-amber-800 p-5 md:p-8 shadow-2xl max-w-2xl w-full text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div
            className="absolute -top-4 -left-4 text-4xl animate-spin"
            style={{ animationDuration: "6s" }}
          >
            ⭐
          </div>
          <div className="absolute -top-4 -right-4 text-4xl animate-bounce">
            🎈
          </div>
          <div
            className="absolute bottom-4 left-4 text-3xl animate-bounce"
            style={{ animationDelay: "0.3s" }}
          >
            🎉
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">
              KẾT QUẢ ĐÁNH GIÁ
            </h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
              Cambridge Young Learners English Test
            </p>

            {/* Main Score Circle */}
            <div
              className={`bg-gradient-to-br ${getClubGradient(result.clubName)} rounded-3xl p-6 md:p-8 mb-6 text-white relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/10 rounded-full scale-150 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="text-6xl md:text-7xl font-black mb-1 tracking-tighter">
                  {result.scaledScore}
                  <span className="text-2xl md:text-3xl opacity-70">/80</span>
                </div>
                <div className="text-xl md:text-2xl font-black opacity-90 mb-1">
                  {result.clubEmoji} {result.clubName} Club
                </div>
                <div className="inline-block bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1 text-sm font-black">
                  CEFR Level: {result.cefrLevel}
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
              <div className="bg-violet-50 dark:bg-violet-950/30 border-2 border-violet-200 dark:border-violet-800 rounded-2xl p-4">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <BookOpen className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase">
                    Language Use
                  </span>
                </div>
                <div className="text-3xl font-black text-violet-700 dark:text-violet-300">
                  {result.languageUseRaw}
                  <span className="text-base text-violet-400">/18</span>
                </div>
              </div>
              <div className="bg-sky-50 dark:bg-sky-950/30 border-2 border-sky-200 dark:border-sky-800 rounded-2xl p-4">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Headphones className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase">
                    Listening
                  </span>
                </div>
                <div className="text-3xl font-black text-sky-700 dark:text-sky-300">
                  {result.listeningRaw}
                  <span className="text-base text-sky-400">/12</span>
                </div>
              </div>
            </div>

            {/* CEFR Level Guide */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6 text-left">
              <h4 className="font-black text-slate-700 dark:text-slate-200 mb-3 text-center text-sm">
                📊 Bảng xếp hạng Cambridge
              </h4>
              <div className="space-y-2">
                {[
                  {
                    range: "61-80",
                    level: "B1",
                    club: "Orbit",
                    emoji: "🪐",
                    desc: "Sử dụng tiếng Anh tự tin trong nhiều tình huống",
                  },
                  {
                    range: "41-60",
                    level: "A2",
                    club: "Zoom",
                    emoji: "⚡",
                    desc: "Giao tiếp cơ bản trong các tình huống quen thuộc",
                  },
                  {
                    range: "21-40",
                    level: "A1",
                    club: "Lift Off",
                    emoji: "🌟",
                    desc: "Hiểu và sử dụng các cụm từ đơn giản hàng ngày",
                  },
                  {
                    range: "0-20",
                    level: "Pre-A1",
                    club: "Countdown",
                    emoji: "🚀",
                    desc: "Đang bắt đầu học tiếng Anh - tiếp tục cố gắng!",
                  },
                ].map((band) => (
                  <div
                    key={band.level}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                      result.cefrLevel === band.level
                        ? "bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 scale-[1.02]"
                        : "opacity-60"
                    }`}
                  >
                    <span className="text-xl">{band.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-700 dark:text-slate-200">
                          {band.level}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ({band.range})
                        </span>
                        {result.cefrLevel === band.level && (
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 animate-bounce">
                            ← Con ở đây!
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 truncate">
                        {band.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRestart}
                className="btn-3d-orange flex-1 px-6 py-3 font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Làm Lại
              </button>
              <Link href="/" className="flex-1">
                <button className="btn-3d-blue w-full px-6 py-3 font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" /> Về Trang Chủ
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── TEST SCREEN ──────────────────────────────────────────────────────────

  if (!currentQuestion) return null;

  const { section, part, partNum } = getCurrentSectionPart();

  // Check if we are on the first question of a new section or part
  const prevQuestion =
    currentIndex > 0 ? CAMBRIDGE_QUESTIONS[currentIndex - 1] : null;
  const isNewSection =
    !prevQuestion || prevQuestion.section !== currentQuestion.section;
  const isNewPart =
    isNewSection ||
    !prevQuestion ||
    prevQuestion.part !== currentQuestion.part;

  // For Listening Part 3, check if audio has been played for this block
  const isListeningP3 =
    currentQuestion.section === "listening" && currentQuestion.part === 3;
  const needsAudioFirst =
    currentQuestion.section === "listening" &&
    !listeningPlayed[currentQuestion.id] &&
    currentQuestion.part !== 3;
  const needsP3Audio = isListeningP3 && !listeningP3AudioPlayed;

  // Determine option labels for display
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="w-full min-h-screen bg-pastel-bg dark:bg-dark-bg flex flex-col">
      {/* ── Header ── */}
      <header className="w-full bg-white dark:bg-slate-900 border-b-4 border-slate-100 dark:border-slate-700 py-2.5 md:py-3 px-3 md:px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto">
          {/* Top row: nav + progress counter */}
          <div className="flex items-center justify-between mb-2">
            <Link href="/">
              <button className="btn-3d-gray px-3 py-1.5 text-xs font-black flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">THOÁT</span>
                <span className="sm:hidden">VỀ</span>
              </button>
            </Link>

            {/* Section & Part Badge */}
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 text-[10px] md:text-xs font-black shadow-sm ${getSectionColor(currentQuestion.section)}`}
              >
                {getSectionIcon(currentQuestion.section)}
                <span className="hidden sm:inline">{section}</span>
                <span className="sm:hidden">
                  {currentQuestion.section === "language-use" ? "📝" : "🎧"}
                </span>
              </span>
              <span className="text-[10px] font-black text-slate-400">
                Part {partNum}: {part}
              </span>
            </div>

            {/* Question counter */}
            <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-black px-3 py-1.5 rounded-xl border-2 border-amber-300 dark:border-amber-700 text-xs shadow-sm flex items-center gap-1">
              <span>🎯</span>
              <span>
                {currentIndex + 1} / {totalQuestions}
              </span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex items-start md:items-center justify-center px-3 md:px-4 py-4 md:py-6">
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 shadow-xl w-full max-w-2xl relative overflow-hidden animate-slide-up">
          {/* ── LANGUAGE USE: Part 1 & 2 — Dialogue MCQ ── */}
          {currentQuestion.type === "dialogue-mcq" && (
            <div>
              {/* Part indicator */}
              <div className="mb-4">
                <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                  {currentQuestion.part === 1
                    ? "📖 Vocabulary — Chọn từ đúng"
                    : "💬 Functional Language — Chọn câu trả lời"}
                </span>
              </div>

              {/* Dialogue bubble */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-3xl p-4 md:p-5 mb-5">
                {currentQuestion.dialogue
                  ?.split("\n")
                  .map((line, idx) => {
                    const parts = line.split("_____");
                    const speaker = line.startsWith("A:")
                      ? "A"
                      : line.startsWith("B:")
                        ? "B"
                        : "";
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 ${idx > 0 ? "mt-3" : ""}`}
                      >
                        <span
                          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 ${
                            speaker === "A"
                              ? "bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-700"
                              : "bg-pink-100 text-pink-600 border-pink-300 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-700"
                          }`}
                        >
                          {speaker === "A" ? "👦" : "👧"}
                        </span>
                        <div className="flex-1">
                          <p className="text-base md:text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed">
                            {parts.length > 1 ? (
                              <>
                                {parts[0]}
                                <span className="inline-block px-3 py-0.5 mx-1 bg-amber-100 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 border-dashed rounded-lg text-amber-600 dark:text-amber-400 text-base font-black min-w-[80px] text-center">
                                  ?
                                </span>
                                {parts[1]}
                              </>
                            ) : (
                              line.substring(line.indexOf(":") + 1).trim()
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Question */}
              <p className="text-sm font-black text-slate-600 dark:text-slate-300 mb-3">
                ❓ {currentQuestion.questionText}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (selectedOption) return;
                      setSelectedOption(opt);
                    }}
                    disabled={selectedOption !== null}
                    className={`w-full text-left p-3.5 md:p-4 rounded-2xl border-3 font-extrabold text-base transition-all flex items-center gap-3 ${
                      selectedOption === opt
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 animate-celebrate"
                        : selectedOption !== null
                          ? "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 opacity-50"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:translate-y-[-2px] cursor-pointer"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 ${
                        selectedOption === opt
                          ? "bg-emerald-400 text-white border-emerald-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {optionLabels[idx]}
                    </span>
                    <span className="flex-1 text-sm md:text-base">{opt}</span>
                    {selectedOption === opt && (
                      <CheckCircle className="w-5 h-5 text-emerald-500 animate-pop-in shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LANGUAGE USE: Part 3 — Gapped Text ── */}
          {currentQuestion.type === "gapped-text" && (
            <div>
              <div className="mb-4">
                <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                  📝 Grammar — Chọn từ điền vào chỗ trống
                </span>
              </div>

              {/* Passage with gaps highlighted */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-3xl p-4 md:p-5 mb-5">
                <p className="text-base md:text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-loose">
                  {currentQuestion.passage?.split(/__\(\d+\)__/).map((segment, idx, arr) => (
                    <React.Fragment key={idx}>
                      {segment}
                      {idx < arr.length - 1 && (
                        <span
                          className={`inline-block px-2.5 py-0.5 mx-1 rounded-lg text-sm font-black min-w-[50px] text-center border-2 border-dashed ${
                            currentQuestion.gapLabel ===
                            `(${idx + 1 + (currentQuestion.taskNumber === 2 ? 3 : 0)})`
                              ? "bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 border-amber-400 dark:border-amber-600 animate-pulse scale-110"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          ({idx + 1 + (currentQuestion.taskNumber === 2 ? 3 : 0)})
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </p>
              </div>

              {/* Question */}
              <p className="text-sm font-black text-slate-600 dark:text-slate-300 mb-3">
                ❓ {currentQuestion.questionText}
              </p>

              {/* Options - Horizontal layout for short words */}
              <div className="flex flex-wrap gap-3 justify-center">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (selectedOption) return;
                      setSelectedOption(opt);
                    }}
                    disabled={selectedOption !== null}
                    className={`px-5 py-3 rounded-2xl border-3 font-extrabold text-base transition-all flex items-center gap-2 ${
                      selectedOption === opt
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 animate-celebrate"
                        : selectedOption !== null
                          ? "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 opacity-50"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:translate-y-[-2px] cursor-pointer"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 ${
                        selectedOption === opt
                          ? "bg-emerald-400 text-white border-emerald-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {optionLabels[idx]}
                    </span>
                    <span>{opt}</span>
                    {selectedOption === opt && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 animate-pop-in" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LISTENING: Part 1 — Image Selection ── */}
          {currentQuestion.type === "listening-image" && (
            <div>
              <div className="mb-4">
                <span className="text-[10px] font-black text-sky-500 dark:text-sky-400 uppercase tracking-widest">
                  🎧 Listening — Nghe và chọn hình đúng
                </span>
              </div>

              {/* Audio Button */}
              <div className="text-center mb-5">
                <button
                  onClick={handlePlayAudio}
                  disabled={ttsPlaying}
                  className="btn-3d-blue px-8 py-4 text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 mx-auto"
                >
                  <Volume2
                    className={`w-6 h-6 ${ttsPlaying ? "animate-pulse" : ""}`}
                  />
                  {ttsPlaying ? "Đang phát... 🔊" : "BẤM ĐỂ NGHE 🔊"}
                </button>
              </div>

              {/* Question */}
              <p className="text-sm font-black text-slate-600 dark:text-slate-300 mb-4 text-center">
                ❓ {currentQuestion.questionText}
              </p>

              {/* Image Options - 3 large images */}
              <div className="grid grid-cols-3 gap-3">
                {currentQuestion.images?.map((imgPath, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (selectedOption) return;
                      setSelectedOption(currentQuestion.options[idx]);
                    }}
                    disabled={selectedOption !== null}
                    className={`relative rounded-2xl border-4 overflow-hidden transition-all aspect-square ${
                      selectedOption === currentQuestion.options[idx]
                        ? "border-emerald-400 dark:border-emerald-600 ring-4 ring-emerald-200 dark:ring-emerald-900/30 scale-105 animate-celebrate"
                        : selectedOption !== null
                          ? "border-slate-100 dark:border-slate-800 opacity-40"
                          : "border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:scale-105 cursor-pointer"
                    }`}
                  >
                    <Image
                      src={imgPath}
                      alt={`Option ${optionLabels[idx]}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 30vw, 200px"
                    />
                    {/* Label overlay */}
                    <span
                      className={`absolute top-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 shadow-md ${
                        selectedOption === currentQuestion.options[idx]
                          ? "bg-emerald-400 text-white border-emerald-500"
                          : "bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {optionLabels[idx]}
                    </span>
                    {selectedOption === currentQuestion.options[idx] && (
                      <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-emerald-500 drop-shadow-lg animate-pop-in" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LISTENING: Part 2 — Text MCQ ── */}
          {currentQuestion.type === "listening-mcq" && (
            <div>
              <div className="mb-4">
                <span className="text-[10px] font-black text-sky-500 dark:text-sky-400 uppercase tracking-widest">
                  🎧 Listening — Nghe và chọn đáp án đúng
                </span>
              </div>

              {/* Audio Button */}
              <div className="text-center mb-5">
                <button
                  onClick={handlePlayAudio}
                  disabled={ttsPlaying}
                  className="btn-3d-blue px-8 py-4 text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 mx-auto"
                >
                  <Volume2
                    className={`w-6 h-6 ${ttsPlaying ? "animate-pulse" : ""}`}
                  />
                  {ttsPlaying ? "Đang phát... 🔊" : "BẤM ĐỂ NGHE 🔊"}
                </button>
              </div>

              {/* Question */}
              <p className="text-base font-black text-slate-700 dark:text-slate-200 mb-4">
                ❓ {currentQuestion.questionText}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (selectedOption) return;
                      setSelectedOption(opt);
                    }}
                    disabled={selectedOption !== null}
                    className={`w-full text-left p-3.5 md:p-4 rounded-2xl border-3 font-extrabold text-base transition-all flex items-center gap-3 ${
                      selectedOption === opt
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 animate-celebrate"
                        : selectedOption !== null
                          ? "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 opacity-50"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-400 hover:translate-y-[-2px] cursor-pointer"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 ${
                        selectedOption === opt
                          ? "bg-emerald-400 text-white border-emerald-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {optionLabels[idx]}
                    </span>
                    <span className="flex-1 text-sm md:text-base">{opt}</span>
                    {selectedOption === opt && (
                      <CheckCircle className="w-5 h-5 text-emerald-500 animate-pop-in shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LISTENING: Part 3 — Longer Listening with Detail Questions ── */}
          {currentQuestion.type === "listening-detail" && (
            <div>
              <div className="mb-4">
                <span className="text-[10px] font-black text-sky-500 dark:text-sky-400 uppercase tracking-widest">
                  🎧 Listening — Nghe đoạn hội thoại dài và trả lời
                </span>
              </div>

              {/* Audio Player - persistent for the whole task */}
              <div className="text-center mb-4">
                <button
                  onClick={handlePlayAudio}
                  disabled={ttsPlaying}
                  className={`px-8 py-4 text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 mx-auto ${
                    listeningP3AudioPlayed
                      ? "btn-3d-gray"
                      : "btn-3d-blue"
                  }`}
                >
                  <Volume2
                    className={`w-6 h-6 ${ttsPlaying ? "animate-pulse" : ""}`}
                  />
                  {ttsPlaying
                    ? "Đang phát... 🔊"
                    : listeningP3AudioPlayed
                      ? "NGHE LẠI 🔄"
                      : "BẤM ĐỂ NGHE 🔊"}
                </button>
                {listeningP3AudioPlayed && (
                  <p className="text-xs font-bold text-emerald-500 mt-2">
                    ✅ Đã nghe xong — Hãy trả lời câu hỏi bên dưới
                  </p>
                )}
              </div>

              {/* Sub-question indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4].map((num) => (
                  <div
                    key={num}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                      currentQuestion.questionNumberInTask === num
                        ? "bg-sky-500 text-white border-sky-600 scale-110"
                        : currentQuestion.questionNumberInTask > num
                          ? "bg-emerald-100 text-emerald-500 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700"
                          : "bg-slate-100 text-slate-400 border-slate-300 dark:bg-slate-800 dark:border-slate-600"
                    }`}
                  >
                    {currentQuestion.questionNumberInTask > num ? "✓" : num}
                  </div>
                ))}
              </div>

              {/* Question */}
              <p className="text-base font-black text-slate-700 dark:text-slate-200 mb-4">
                ❓ Câu {currentQuestion.questionNumberInTask}:{" "}
                {currentQuestion.questionText}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (selectedOption) return;
                      setSelectedOption(opt);
                    }}
                    disabled={selectedOption !== null}
                    className={`w-full text-left p-3.5 md:p-4 rounded-2xl border-3 font-extrabold text-base transition-all flex items-center gap-3 ${
                      selectedOption === opt
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 animate-celebrate"
                        : selectedOption !== null
                          ? "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 opacity-50"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-400 hover:translate-y-[-2px] cursor-pointer"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 ${
                        selectedOption === opt
                          ? "bg-emerald-400 text-white border-emerald-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {optionLabels[idx]}
                    </span>
                    <span className="flex-1 text-sm md:text-base">{opt}</span>
                    {selectedOption === opt && (
                      <CheckCircle className="w-5 h-5 text-emerald-500 animate-pop-in shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submitting animation */}
          {selectedOption && (
            <div className="mt-4 text-center">
              <p className="text-sm font-black text-emerald-500 animate-pulse">
                ✨ Đang chuyển câu tiếp theo...
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
