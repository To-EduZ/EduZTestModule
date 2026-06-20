"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Volume2, Sparkles, Send, Mic, Headphones, BookOpen, PenTool, CheckCircle, RefreshCw, Compass, RotateCcw } from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";
import { AdaptiveQuestion } from "@/lib/adaptiveQuestionBank";

// Shuffle helper (Fisher-Yates)
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AdaptiveTestPage() {
  const router = useRouter();
  
  // Test State
  const [testState, setTestState] = useState<"start" | "running" | "completed">("start");
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Question State
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null);
  const [currentLevel, setCurrentLevel] = useState<string>("Movers");
  const [questionCount, setQuestionCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  
  // Inputs
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userWriting, setUserWriting] = useState("");
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  // Word Chips state (for Writing skill drag-and-drop)
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  
  // Animation states
  const [showCelebrate, setShowCelebrate] = useState(false);
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Results
  const [finalResult, setFinalResult] = useState<any>(null);

  // Use a fixed voice (simplified - no selector for kids)
  const selectedVoice = typeof window !== "undefined" 
    ? (localStorage.getItem("preferred_accent_voice") || "en-US-AriaNeural") 
    : "en-US-AriaNeural";

  // When question changes and it's a Writing question, prepare word chips
  useEffect(() => {
    if (currentQuestion?.skill === "Writing" && currentQuestion.prompt) {
      const words = currentQuestion.prompt.split(/\s+/).filter(w => w.length > 0);
      setShuffledWords(shuffleArray(words));
      setPlacedWords([]);
    }
  }, [currentQuestion]);

  // Auto-submit for Reading/Listening after selecting an option
  useEffect(() => {
    if (selectedOption && currentQuestion && (currentQuestion.skill === "Listening" || currentQuestion.skill === "Reading")) {
      // Show celebrate animation
      setShowCelebrate(true);
      
      // Auto-submit after 1.2 seconds
      autoSubmitTimerRef.current = setTimeout(() => {
        handleChoiceSubmit(selectedOption);
        setShowCelebrate(false);
      }, 1200);
      
      return () => {
        if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
      };
    }
  }, [selectedOption]);

  const startTest = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/adaptive-test/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "kid_primary_std_01" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setSessionId(data.sessionId);
      setCurrentQuestion(data.firstQuestion);
      setTestState("running");
      setStartTime(Date.now());
    } catch (err: any) {
      setErrorMsg("Không thể bắt đầu bài kiểm tra. Hãy thử lại!");
    } finally {
      setIsProcessing(false);
    }
  };

  const playNativeTTS = (textToSpeak: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voiceLang = selectedVoice.startsWith("en-GB") ? "en-GB" : selectedVoice.startsWith("en-AU") ? "en-AU" : "en-US";
      utterance.lang = voiceLang;
      utterance.rate = 0.8;
      utterance.onstart = () => setTtsPlaying(true);
      utterance.onend = () => setTtsPlaying(false);
      utterance.onerror = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTtsPlaying(false);
    }
  };

  const playTTS = () => {
    if (!currentQuestion) return;
    try {
      setTtsPlaying(true);
      const textToSpeak = currentQuestion.skill === "Listening" ? currentQuestion.audioText : currentQuestion.prompt;
      if (!textToSpeak) return;

      const ttsUrl = `/api/tts?text=${encodeURIComponent(textToSpeak)}&voice=${selectedVoice}`;
      const audio = new Audio(ttsUrl);
      audio.onended = () => setTtsPlaying(false);
      audio.onerror = (e) => {
        console.warn("Lỗi phát Edge TTS, chuyển sang Web Speech API:", e);
        playNativeTTS(textToSpeak);
      };

      audio.play().catch((err) => {
        console.warn("Autoplay bị chặn, chuyển sang Web Speech API:", err);
        playNativeTTS(textToSpeak);
      });
    } catch (e) {
      console.warn("Lỗi tạo Audio, chuyển sang Web Speech API:", e);
      const textToSpeak = currentQuestion.skill === "Listening" ? currentQuestion.audioText : currentQuestion.prompt;
      if (textToSpeak) playNativeTTS(textToSpeak);
    }
  };

  const submitAnswer = async (formData: FormData) => {
    if (!sessionId || !currentQuestion) return;
    setIsProcessing(true);
    setErrorMsg(null);
    
    try {
      formData.append("sessionId", sessionId);
      formData.append("questionId", currentQuestion.id);
      formData.append("timeTakenMs", (Date.now() - startTime).toString());
      
      const res = await fetch("/api/adaptive-test/answer", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setCurrentLevel(data.newLevel);
      setQuestionCount(prev => prev + 1);

      if (data.isDone) {
        completeTest();
      } else {
        setCurrentQuestion(data.nextQuestion);
        setSelectedOption(null);
        setUserWriting("");
        setPlacedWords([]);
        setStartTime(Date.now());
        setIsProcessing(false);
      }
    } catch (err: any) {
      setErrorMsg("Có lỗi xảy ra khi nộp bài. Con thử lại nhé!");
      setIsProcessing(false);
    }
  };

  const completeTest = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/adaptive-test/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setFinalResult(data);
      setTestState("completed");
    } catch (err: any) {
      setErrorMsg("Không thể hoàn tất bài thi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChoiceSubmit = (option?: string) => {
    const choice = option || selectedOption;
    if (!choice) return;
    const fd = new FormData();
    fd.append("choice", choice);
    submitAnswer(fd);
  };

  const handleWritingSubmitFromChips = () => {
    if (placedWords.length === 0) return;
    const fd = new FormData();
    fd.append("textAnswer", placedWords.join(" "));
    submitAnswer(fd);
  };

  const handleSpeakingSubmit = (audioBlob: Blob) => {
    const fd = new FormData();
    fd.append("audio", audioBlob, "speaking.webm");
    submitAnswer(fd);
  };

  // Word chip tap-to-place handlers
  const handleWordChipTap = (word: string, index: number) => {
    setPlacedWords(prev => [...prev, word]);
    setShuffledWords(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handlePlacedWordTap = (word: string, index: number) => {
    setShuffledWords(prev => [...prev, word]);
    setPlacedWords(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, word: string, index: number, source: "avail" | "placed") => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ word, index, source }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropToPlaced = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const wordToMove = data.word;
      
      let newPlaced = [...placedWords];
      let newShuffled = [...shuffledWords];

      if (data.source === "avail") {
        newShuffled.splice(data.index, 1);
        if (typeof targetIndex === "number") {
          newPlaced.splice(targetIndex, 0, wordToMove);
        } else {
          newPlaced.push(wordToMove);
        }
      } else if (data.source === "placed") {
        newPlaced.splice(data.index, 1);
        let adjustedTarget = targetIndex;
        if (typeof adjustedTarget === "number") {
          if (data.index < adjustedTarget) {
            adjustedTarget--;
          }
          newPlaced.splice(adjustedTarget, 0, wordToMove);
        } else {
          newPlaced.push(wordToMove);
        }
      }

      setPlacedWords(newPlaced);
      setShuffledWords(newShuffled);
    } catch (err) {}
  };

  const handleDropOnPlacedWord = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling to the container
    
    const rect = e.currentTarget.getBoundingClientRect();
    const isRightHalf = e.clientX > rect.left + rect.width / 2;
    const targetIndex = isRightHalf ? idx + 1 : idx;
    
    handleDropToPlaced(e, targetIndex);
  };

  const handleDropToAvail = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.source === "placed") {
        handlePlacedWordTap(data.word, data.index);
      }
    } catch (err) {}
  };

  const handleResetWords = () => {
    if (!currentQuestion) return;
    const words = currentQuestion.prompt.split(/\s+/).filter(w => w.length > 0);
    setShuffledWords(shuffleArray(words));
    setPlacedWords([]);
  };

  // Skill icon helper
  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case "Speaking": return <Mic className="w-5 h-5 text-pink-500" />;
      case "Listening": return <Headphones className="w-5 h-5 text-blue-500" />;
      case "Reading": return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case "Writing": return <PenTool className="w-5 h-5 text-amber-500" />;
      default: return null;
    }
  };

  const getSkillColor = (skill: string) => {
    switch (skill) {
      case "Speaking": return "bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800";
      case "Listening": return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800";
      case "Reading": return "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800";
      case "Writing": return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800";
      default: return "";
    }
  };

  // UI Renders
  if (testState === "start") {
    return (
      <div className="w-full min-h-screen bg-pastel-bg dark:bg-dark-bg flex flex-col items-center justify-center p-4 md:p-6 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-300 dark:border-amber-800 p-5 md:p-8 shadow-2xl max-w-lg w-full relative">
          <div className="text-6xl mb-4 animate-bounce">🚀</div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">Đánh Giá Năng Lực AI</h1>
          <p className="text-slate-600 dark:text-slate-300 font-bold mb-6 md:mb-8 text-sm md:text-base">
            Bài kiểm tra thích ứng thông minh. Cô giáo AI sẽ điều chỉnh độ khó của câu hỏi tùy theo câu trả lời của con!
          </p>
          <button 
            onClick={startTest}
            disabled={isProcessing}
            className="btn-3d-green w-full py-4 text-lg font-black uppercase tracking-wider"
          >
            {isProcessing ? "Đang chuẩn bị phòng thi..." : "BẮT ĐẦU NGAY"}
          </button>
        </div>
      </div>
    );
  }

  if (testState === "completed" && finalResult) {
    return (
      <div className="w-full min-h-screen bg-pastel-bg dark:bg-dark-bg py-8 md:py-10 px-3 md:px-4 flex flex-col items-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-300 dark:border-amber-800 p-5 md:p-8 shadow-2xl max-w-2xl w-full text-center relative overflow-hidden">
          <div className="absolute -top-4 -left-4 text-4xl animate-spin" style={{animationDuration:'6s'}}>⭐</div>
          <div className="absolute -top-4 -right-4 text-4xl animate-bounce">🎈</div>
          
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">KẾT QUẢ ĐÁNH GIÁ</h2>
          <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 md:mb-6 uppercase tracking-widest">Hoàn thành bài kiểm tra CAT</p>

          <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800 rounded-3xl p-4 md:p-6 mb-6 md:mb-8 flex flex-col items-center">
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase mb-2">Trình Độ Khuyến Nghị</span>
            <div className="text-5xl mb-2">
              {finalResult.finalLevel === "Starters" ? "🦛" : finalResult.finalLevel === "Movers" ? "🐒" : "🦁"}
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{finalResult.finalLevel}</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3">
              <div className="text-xs font-black text-emerald-600 mb-1 uppercase">Từ Vựng</div>
              <div className="text-2xl font-black text-emerald-700">{finalResult.finalScores.vocabulary}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-3">
              <div className="text-xs font-black text-blue-600 mb-1 uppercase">Ngữ Pháp</div>
              <div className="text-2xl font-black text-blue-700">{finalResult.finalScores.grammar}</div>
            </div>
            <div className="bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 rounded-2xl p-3">
              <div className="text-xs font-black text-pink-600 mb-1 uppercase">Phát Âm</div>
              <div className="text-2xl font-black text-pink-700">{finalResult.finalScores.pronunciation}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl p-3">
              <div className="text-xs font-black text-purple-600 mb-1 uppercase">Nghe Hiểu</div>
              <div className="text-2xl font-black text-purple-700">{finalResult.finalScores.fluency}</div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-2xl p-4 md:p-5 text-left mb-6 md:mb-8 shadow-inner relative">
            <Compass className="absolute top-4 right-4 w-8 h-8 text-slate-300 animate-spin" style={{animationDuration: '10s'}}/>
            <h4 className="font-black text-slate-700 dark:text-slate-200 mb-2">👩‍🏫 Nhận Xét Của Cô Giáo AI:</h4>
            <p className="text-slate-600 dark:text-slate-300 font-bold leading-relaxed text-sm">{finalResult.aiRecommendation}</p>
          </div>

          <Link href="/">
            <button className="btn-3d-blue w-full sm:w-auto px-8 py-4 font-black uppercase tracking-wider">
              VỀ TRANG CHỦ
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Running State
  if (!currentQuestion) return null;

  return (
    <div className="w-full min-h-screen bg-pastel-bg dark:bg-dark-bg flex flex-col">
      {/* Compact Header */}
      <header className="w-full bg-white dark:bg-slate-900 border-b-4 border-slate-100 dark:border-slate-700 py-2.5 md:py-3 px-3 md:px-4 sticky top-0 z-30 shadow-sm relative">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <button className="btn-3d-gray px-3 py-1.5 text-xs font-black flex items-center gap-1 z-10 relative">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">THOÁT</span><span className="sm:hidden">VỀ</span>
            </button>
          </Link>
          
          {/* Centered Skill Indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl border-2 text-sm font-black shadow-sm ${getSkillColor(currentQuestion.skill)}`}>
              {getSkillIcon(currentQuestion.skill)}
              {currentQuestion.skill}
            </span>
          </div>

          <div className="flex items-center gap-2 z-10 relative">
            {/* Progress Tracker (e.g. 3/20) */}
            <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-black px-3 py-1.5 rounded-xl border-2 border-amber-300 dark:border-amber-700 text-xs md:text-sm shadow-sm flex items-center gap-1">
              <span>🎯</span>
              <span>{questionCount} / 20</span>
            </span>
            <span className="hidden sm:inline-flex bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-black px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-[10px] uppercase">
              {currentLevel}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content — centered, no scroll needed */}
      <main className="flex-1 flex items-center justify-center px-3 md:px-4 py-4">
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 shadow-xl w-full max-w-2xl relative overflow-hidden animate-slide-up">
          
          {/* Big Illustration Area */}
          <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-3xl py-6 md:py-8 px-4 text-center mb-5 relative flex flex-col items-center justify-center">
            <span className="text-8xl md:text-9xl tracking-widest block mb-3 animate-pop-in">{currentQuestion.illustration}</span>
            <span className="text-[10px] font-black text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm max-w-xs uppercase tracking-wide">
              🎨 {currentQuestion.illustrationDesc}
            </span>
          </div>

          {/* SPEAKING */}
          {currentQuestion.skill === "Speaking" && (
            <div className="text-center py-4">
              <p className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-snug mb-8">
                &quot;{currentQuestion.prompt}&quot;
              </p>
              
              <div className="mt-2">
                <AudioRecorder
                  onRecordingComplete={handleSpeakingSubmit}
                  isProcessing={isProcessing}
                  sentence={currentQuestion.prompt}
                />
              </div>
            </div>
          )}

          {/* LISTENING & READING — with auto-submit */}
          {(currentQuestion.skill === "Listening" || currentQuestion.skill === "Reading") && (
            <div className="pt-2">
              {currentQuestion.skill === "Listening" ? (
                <div className="text-center mb-5">
                  <button onClick={playTTS} disabled={ttsPlaying || isProcessing} className="btn-3d-blue px-8 py-4 text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 mx-auto">
                    <Volume2 className="w-6 h-6" />
                    {ttsPlaying ? "Đang phát... 🔊" : "BẤM ĐỂ NGHE 🔊"}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-5 text-center">
                  <p className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100">&quot;{currentQuestion.prompt}&quot;</p>
                </div>
              )}
              
              <p className="text-slate-800 dark:text-slate-200 font-extrabold text-base mb-4">❓ {currentQuestion.questionText}</p>
              
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options?.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isProcessing) return;
                      setSelectedOption(opt);
                    }}
                    disabled={isProcessing || selectedOption !== null}
                    className={`w-full text-left p-4 md:p-5 rounded-2xl border-3 font-extrabold text-base transition-all flex justify-between items-center ${
                      selectedOption === opt 
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-700 text-blue-700 dark:text-blue-300 animate-celebrate" 
                        : selectedOption !== null
                        ? "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:translate-y-[-2px]"
                    }`}
                  >
                    <span className="text-base md:text-lg">{opt}</span>
                    {selectedOption === opt && <CheckCircle className="w-6 h-6 text-blue-500 animate-pop-in" />}
                  </button>
                ))}
              </div>

              {selectedOption && (
                <div className="mt-4 text-center">
                  <p className="text-sm font-black text-blue-500 animate-pulse">✨ Đang gửi câu trả lời...</p>
                </div>
              )}
            </div>
          )}

          {/* WRITING — Word Chips Drag & Drop */}
          {currentQuestion.skill === "Writing" && (
            <div className="pt-2">
              <p className="text-slate-700 dark:text-slate-200 font-extrabold text-base md:text-lg mb-1">📝 Ghép các từ thành câu đúng:</p>
              <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">Bấm hoặc kéo thả từ bên dưới để ghép câu.</p>
              
              {/* Drop zone (placed words) */}
              <div 
                className={`drop-zone mb-5 min-h-[72px] ${placedWords.length > 0 ? "has-items" : ""}`}
                onDragOver={handleDragOver}
                onDrop={handleDropToPlaced}
              >
                {placedWords.length === 0 ? (
                  <span className="text-sm md:text-base font-bold text-slate-400 dark:text-slate-500 italic">
                    Kéo thả hoặc bấm vào các từ bên dưới để xếp vào đây... ✨
                  </span>
                ) : (
                  placedWords.map((word, idx) => (
                    <button
                      key={`placed-${idx}-${word}`}
                      onClick={() => handlePlacedWordTap(word, idx)}
                      draggable={!isProcessing}
                      onDragStart={(e) => handleDragStart(e, word, idx, "placed")}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnPlacedWord(e, idx)}
                      className="word-chip placed animate-pop-in cursor-grab active:cursor-grabbing"
                      type="button"
                    >
                      {word}
                    </button>
                  ))
                )}
              </div>

              {/* Available word chips */}
              <div 
                className="flex flex-wrap gap-3 justify-center mb-5 min-h-[50px]"
                onDragOver={handleDragOver}
                onDrop={handleDropToAvail}
              >
                {shuffledWords.map((word, idx) => (
                  <button
                    key={`avail-${idx}-${word}`}
                    onClick={() => handleWordChipTap(word, idx)}
                    draggable={!isProcessing}
                    onDragStart={(e) => handleDragStart(e, word, idx, "avail")}
                    className="word-chip cursor-grab active:cursor-grabbing"
                    type="button"
                    disabled={isProcessing}
                  >
                    {word}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleResetWords}
                  disabled={placedWords.length === 0 || isProcessing}
                  className="btn-3d-gray px-4 py-3 text-xs font-black flex items-center gap-1.5 flex-1"
                  type="button"
                >
                  <RotateCcw className="w-4 h-4" /> Xếp lại
                </button>
                <button
                  onClick={handleWritingSubmitFromChips}
                  disabled={shuffledWords.length > 0 || isProcessing}
                  className="btn-3d-green px-4 py-3 text-sm font-black tracking-wider uppercase flex items-center justify-center gap-1.5 flex-[2]"
                  type="button"
                >
                  <Send className="w-4 h-4" /> Gửi câu trả lời
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {errorMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-600 font-bold text-sm text-center shadow-lg z-40 max-w-sm animate-slide-up">
          {errorMsg}
        </div>
      )}

      {/* Loading overlay for transitions */}
      {isProcessing && testState === "running" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-3" />
            <p className="font-black text-slate-700 dark:text-slate-200">Đang phân tích...</p>
          </div>
        </div>
      )}
    </div>
  );
}
