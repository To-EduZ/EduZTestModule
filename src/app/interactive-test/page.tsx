"use client";

import React from "react";
import { 
  PlayCircle, Home, AlertCircle, Mic, Square
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useInteractiveSession } from "./hooks/useInteractiveSession";
import WarmupStage from "./components/WarmupStage";
import PictureStage from "./components/PictureStage";
import ReadingStage from "./components/ReadingStage";
import WritingStage from "./components/WritingStage";
import ResultsStage from "./components/ResultsStage";
import Soundwave from "./components/Soundwave";

export default function InteractiveTest() {
  const {
    stage, setStage,
    activeTab, setActiveTab,
    messages,
    isRecording,
    isProcessing,
    isDevModeEnabled,
    devInputText, setDevInputText,
    resultsRef,
    autoActivateMic, setAutoActivateMic,
    realtimeTranscript,
    isTtsSpeaking,
    interactiveMode,
    showVocabularyHint,
    isImageZoomed, setIsImageZoomed,
    handleMockTextSubmission,
    kidName,
    kidAge,
    isGenerating,
    activeStory,
    activeMcq,
    activeSpelling,
    testCodeInput, setTestCodeInput,
    verifyError,
    verifyingCode,
    pictureIndex,
    subQuestionIndex,
    currentQuestion,
    keywordsMentioned,
    showMcq,
    selectedMcqOption,
    mcqAnswered,
    writingTaskIndex,
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
    selectedRatingStars, setSelectedRatingStars,
    hoveredRatingStars, setHoveredRatingStars,
    audioRef,
    messagesEndRef,
    answerZoneRef,
    isSkillTested,
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
  } = useInteractiveSession();

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
