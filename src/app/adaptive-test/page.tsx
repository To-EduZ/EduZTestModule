"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Volume2, Sparkles, Send, Mic, Headphones, BookOpen, PenTool, CheckCircle, RefreshCw, Compass } from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";
import { AdaptiveQuestion } from "@/lib/adaptiveQuestionBank";

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
  
  // Results
  const [finalResult, setFinalResult] = useState<any>(null);

  const voices = [
    { code: "en-US-AriaNeural", name: "Mỹ (Nữ) 🇺🇸" },
    { code: "en-US-GuyNeural", name: "Mỹ (Nam) 🇺🇸" },
    { code: "en-GB-SoniaNeural", name: "Anh (Nữ) 🇬🇧" },
    { code: "en-GB-RyanNeural", name: "Anh (Nam) 🇬🇧" },
    { code: "en-AU-NatashaNeural", name: "Úc (Nữ) 🇦🇺" },
  ];

  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-AriaNeural");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferred_accent_voice");
      if (saved) {
        setSelectedVoice(saved);
      }
    }
  }, []);

  const handleVoiceChange = (voiceCode: string) => {
    setSelectedVoice(voiceCode);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_accent_voice", voiceCode);
    }
  };

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
      alert("Trình duyệt chưa hỗ trợ nghe thử rồi! 🔊");
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

  const handleChoiceSubmit = () => {
    if (!selectedOption) return;
    const fd = new FormData();
    fd.append("choice", selectedOption);
    submitAnswer(fd);
  };

  const handleWritingSubmit = () => {
    if (!userWriting.trim()) return;
    const fd = new FormData();
    fd.append("textAnswer", userWriting);
    submitAnswer(fd);
  };

  const handleSpeakingSubmit = (audioBlob: Blob) => {
    const fd = new FormData();
    fd.append("audio", audioBlob, "speaking.webm");
    submitAnswer(fd);
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
    <div className="w-full min-h-screen bg-pastel-bg dark:bg-dark-bg pb-20">
      <header className="w-full bg-white dark:bg-slate-900 border-b-4 border-slate-100 dark:border-slate-700 py-3 md:py-4 px-3 md:px-4 sticky top-0 z-30 shadow-sm flex items-center justify-between gap-2">
        <Link href="/">
          <button className="btn-3d-gray px-2.5 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-black flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">THOÁT</span><span className="sm:hidden">VỀ</span>
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-center">Câu hỏi</span>
          <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-black px-2.5 md:px-3 py-1 rounded-xl border border-amber-300 dark:border-amber-700 text-sm">
            #{questionCount}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-2 md:px-3 py-1 md:py-1.5 rounded-xl text-[10px] md:text-xs font-black text-slate-600 dark:text-slate-300 uppercase">
          Level: <span className="text-blue-500 dark:text-blue-400">{currentLevel}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 md:px-4 mt-6 md:mt-8 flex flex-col justify-center">
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 shadow-xl mb-6 relative overflow-hidden">
          {/* Header Title with Mascot */}
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800 flex items-center justify-center text-xl md:text-2xl shadow-sm shrink-0">
              {currentQuestion.level === "Starters" ? "🦛" : currentQuestion.level === "Movers" ? "🐒" : "🦁"}
            </div>
            <div>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                {currentQuestion.skill === "Speaking" && <Mic className="w-3 h-3 text-pink-500" />}
                {currentQuestion.skill === "Listening" && <Headphones className="w-3 h-3 text-blue-500" />}
                {currentQuestion.skill === "Reading" && <BookOpen className="w-3 h-3 text-emerald-500" />}
                {currentQuestion.skill === "Writing" && <PenTool className="w-3 h-3 text-amber-500" />}
                Kỹ năng {currentQuestion.skill}
              </span>
              <p className="text-sm font-bold text-slate-500 mt-1">{currentQuestion.hint}</p>
            </div>
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl py-4 md:py-6 px-3 md:px-4 text-center mb-4 md:mb-6 relative flex flex-col items-center justify-center">
            <span className="text-6xl tracking-widest block mb-3">{currentQuestion.illustration}</span>
            <span className="text-xs font-black text-slate-400 bg-white border border-slate-100 px-3 py-1 rounded-full shadow-sm max-w-xs uppercase tracking-wide">
              🎨 {currentQuestion.illustrationDesc}
            </span>
          </div>

          {/* DYNAMIC SKILL WORKSPACE */}
          
          {/* SPEAKING */}
          {currentQuestion.skill === "Speaking" && (
            <div className="text-center py-4 border-t border-slate-100">
              <p className="text-2xl font-black text-slate-800 tracking-tight leading-snug mb-4">
                "{currentQuestion.prompt}"
              </p>
              
              {/* Voice Accent Selector */}
              <div className="mt-4 mb-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-3 inline-block mx-auto max-w-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 text-center">
                  Chọn accent của cô giáo AI:
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {voices.map((v) => {
                    const isSelected = selectedVoice === v.code;
                    return (
                      <button
                        key={v.code}
                        onClick={() => handleVoiceChange(v.code)}
                        disabled={ttsPlaying || isProcessing}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-400 text-indigo-600 font-extrabold scale-105"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={playTTS}
                disabled={ttsPlaying || isProcessing}
                className="btn-3d-yellow px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center mx-auto gap-1.5"
              >
                <Volume2 className={`w-4 h-4 ${ttsPlaying ? "animate-bounce" : ""}`} />
                {ttsPlaying ? "Đang đọc mẫu..." : "Nghe cô đọc mẫu 🔊"}
              </button>
            </div>
          )}

          {/* LISTENING & READING */}
          {(currentQuestion.skill === "Listening" || currentQuestion.skill === "Reading") && (
            <div className="border-t border-slate-100 pt-6">
              {currentQuestion.skill === "Listening" ? (
               <div className="text-center mb-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                 {/* Voice Accent Selector */}
                 <div className="mt-1 mb-4 bg-white/80 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-2xl p-2.5 inline-block mx-auto max-w-full">
                   <span className="text-[10px] font-black text-blue-400 dark:text-blue-550 uppercase tracking-wider block mb-1.5 text-center">
                     Chọn accent của cô giáo AI:
                   </span>
                   <div className="flex flex-wrap justify-center gap-1.5">
                     {voices.map((v) => {
                       const isSelected = selectedVoice === v.code;
                       return (
                         <button
                           key={v.code}
                           onClick={() => handleVoiceChange(v.code)}
                           disabled={ttsPlaying || isProcessing}
                           className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border-2 transition-all cursor-pointer ${
                             isSelected
                               ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-extrabold scale-105"
                               : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-655"
                           }`}
                         >
                           {v.name}
                         </button>
                       );
                     })}
                   </div>
                 </div>

                 <button onClick={playTTS} disabled={ttsPlaying || isProcessing} className="btn-3d-blue px-6 py-3.5 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 mx-auto">
                   <Volume2 className="w-5 h-5" />
                   {ttsPlaying ? "Đang phát âm thanh... 🔊" : "BẤM ĐỂ NGHE 🔊"}
                 </button>
               </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-6 text-center">
                <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-serif">"{currentQuestion.prompt}"</p>
              </div>
            )}
            
            <p className="text-slate-800 dark:text-slate-200 font-extrabold text-sm mb-4">❓ {currentQuestion.questionText}</p>
            
            <div className="grid grid-cols-1 gap-3 mb-6">
              {currentQuestion.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(opt)}
                  disabled={isProcessing}
                  className={`w-full text-left p-4 rounded-2xl border-2 font-extrabold text-sm transition-all flex justify-between ${
                    selectedOption === opt 
                      ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-700 text-blue-700 dark:text-blue-300" 
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {opt}
                  {selectedOption === opt && <CheckCircle className="w-5 h-5 text-blue-500" />}
                </button>
              ))}
            </div>

              <button
                onClick={handleChoiceSubmit}
                disabled={!selectedOption || isProcessing}
                className="btn-3d-green w-full py-4 text-sm font-black tracking-wider uppercase flex items-center justify-center gap-1.5"
              >
                Gửi câu trả lời
              </button>
            </div>
          )}

          {/* WRITING */}
          {currentQuestion.skill === "Writing" && (
            <div className="border-t border-slate-100 pt-6">
              <label className="block text-slate-700 font-extrabold text-sm mb-2">Con viết câu của mình vào đây nhé: 📝</label>
              <textarea
                rows={3}
                value={userWriting}
                onChange={(e) => setUserWriting(e.target.value)}
                disabled={isProcessing}
                className="w-full rounded-2xl border-2 border-slate-200 focus:border-amber-400 p-4 text-base font-extrabold text-slate-700 outline-none mb-6"
              />
              <button
                onClick={handleWritingSubmit}
                disabled={!userWriting.trim() || isProcessing}
                className="btn-3d-green w-full py-4 text-sm font-black tracking-wider uppercase flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" /> Nộp bài
              </button>
            </div>
          )}
        </section>

        {currentQuestion.skill === "Speaking" && (
          <section className="w-full mb-8">
            <AudioRecorder
              onRecordingComplete={handleSpeakingSubmit}
              isProcessing={isProcessing}
              sentence={currentQuestion.prompt}
            />
          </section>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-600 font-bold text-sm mb-8 text-center">
            {errorMsg}
          </div>
        )}
      </main>

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
