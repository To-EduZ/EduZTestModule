import React from "react";
import { RotateCcw } from "lucide-react";

interface WritingStageProps {
  writingTaskIndex: number;
  activeSpelling: Array<{ prompt: string; correctWord: string }>;
  selectedLetters: Array<{ letter: string; id: number }>;
  availableLetters: Array<{ letter: string; id: number }>;
  writingSubmitted: boolean;
  draggedTile: any;
  isDragOverAnswer: boolean;
  isDragOverAvailable: boolean;
  answerZoneRef: React.RefObject<HTMLDivElement | null>;
  handleDragOver: (e: React.DragEvent, target: "answer" | "available") => void;
  handleDragEnter: (e: React.DragEvent, target: "answer" | "available") => void;
  handleDragLeave: (e: React.DragEvent, target: "answer" | "available") => void;
  handleDrop: (e: React.DragEvent, target: "answer" | "available") => void;
  handleAnswerLetterTap: (tile: { letter: string; id: number }) => void;
  handleLetterTileTap: (tile: { letter: string; id: number }) => void;
  handleDragStart: (
    e: React.DragEvent,
    tile: { letter: string; id: number },
    source: "available" | "selected"
  ) => void;
  handleDragEnd: () => void;
  handleDropOnTile: (e: React.DragEvent, targetIdx: number) => void;
  handleResetLetters: () => void;
  handleWritingSubmit: (e: React.FormEvent) => void;
}

export default function WritingStage({
  writingTaskIndex,
  activeSpelling,
  selectedLetters,
  availableLetters,
  writingSubmitted,
  draggedTile,
  isDragOverAnswer,
  isDragOverAvailable,
  answerZoneRef,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handleAnswerLetterTap,
  handleLetterTileTap,
  handleDragStart,
  handleDragEnd,
  handleDropOnTile,
  handleResetLetters,
  handleWritingSubmit,
}: WritingStageProps) {
  if (!activeSpelling[writingTaskIndex]) return null;

  const currentTask = activeSpelling[writingTaskIndex];
  const builtWord = selectedLetters.map((t) => t.letter).join("").toLowerCase();
  const isCorrect = builtWord.trim() === currentTask.correctWord.toLowerCase().trim();

  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-0">
      <h3 className="font-extrabold text-indigo-800 dark:text-indigo-300 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
        <span className="text-lg">✍️</span>
        Thử thách đánh vần [{writingTaskIndex + 1}/2]
      </h3>

      <div className="bg-white dark:bg-slate-900 border-4 border-indigo-200 dark:border-slate-700 rounded-3xl p-5 md:p-6 shadow-md w-full max-w-md flex flex-col items-center text-center">
        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-indigo-50 dark:bg-slate-800 border-2 border-indigo-200 flex items-center justify-center text-4xl md:text-5xl mb-4 shadow-inner">
          <span
            className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-300/40 animate-spin"
            style={{ animationDuration: "12s" }}
          />
          <span className="animate-bounce" style={{ animationDuration: "2.5s" }}>
            {writingTaskIndex === 0 ? "🐒" : "🍌"}
          </span>
        </div>

        <p className="text-slate-700 dark:text-slate-200 font-extrabold text-sm md:text-base leading-relaxed mb-4 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 w-full text-center">
          Cô Lily hỏi: &quot;{currentTask.prompt}&quot;
        </p>

        {/* Answer zone — where selected letters appear */}
        <div
          ref={answerZoneRef}
          onDragOver={(e) => handleDragOver(e, "answer")}
          onDragEnter={(e) => handleDragEnter(e, "answer")}
          onDragLeave={(e) => handleDragLeave(e, "answer")}
          onDrop={(e) => handleDrop(e, "answer")}
          className={`answer-zone w-full mb-4 transition-all duration-200 ${
            selectedLetters.length > 0 ? "has-letters" : ""
          } ${selectedLetters.length > 6 ? "scale-down" : ""} ${
            isDragOverAnswer
              ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 ring-4 ring-indigo-200/50 scale-[1.02]"
              : ""
          }`}
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
            {isCorrect ? (
              <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-200">
                🎉 Xuất sắc! Con đã ghép đúng rồi!
              </span>
            ) : (
              <span className="text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-full border border-rose-200">
                ✍️ Gần đúng rồi, cô đang chấm điểm nhé!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
