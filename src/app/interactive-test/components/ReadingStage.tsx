import React from "react";

interface ReadingStageProps {
  activeStory: string;
  showVocabularyHint: boolean;
  interactiveMode: "test" | "practice";
  showMcq: boolean;
  activeMcq: {
    question: string;
    options: string[];
    correctIndex: number;
  };
  selectedMcqOption: number | null;
  mcqAnswered: boolean;
  handleMcqSelect: (idx: number) => void;
}

export default function ReadingStage({
  activeStory,
  showVocabularyHint,
  interactiveMode,
  showMcq,
  activeMcq,
  selectedMcqOption,
  mcqAnswered,
  handleMcqSelect,
}: ReadingStageProps) {
  return (
    <div className="flex-1 flex flex-col justify-center min-h-0 gap-2">
      {!showMcq ? (
        // Reading Aloud slide
        <div className="flex flex-col items-center p-1.5 min-h-0 w-full">
          <h3 className="font-extrabold text-emerald-800 dark:text-emerald-400 mb-2.5 flex items-center gap-2 text-sm uppercase tracking-wider">
            <span className="text-lg">📖</span>
            Đọc to câu chuyện dưới đây cho cô giáo Lily nghe nhé:
          </h3>

          <div className="relative bg-amber-50 dark:bg-slate-900 border-4 border-amber-200 dark:border-slate-700 rounded-3xl p-5 md:p-6 shadow-inner w-full max-w-xl mb-2.5">
            <span className="absolute -top-3 -left-3 text-2xl">✨</span>
            <span className="absolute -bottom-3 -right-3 text-2xl">🎈</span>
            <p className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed font-sans text-center select-none whitespace-normal">
              "{activeStory}"
            </p>
          </div>

          {/* Practice Mode Vocabulary Hints Card */}
          {(showVocabularyHint || interactiveMode === "practice") && (
            <div className="bg-amber-50/60 dark:bg-amber-950/10 border-2 border-dashed border-amber-200 dark:border-amber-900/40 rounded-2xl p-2.5 text-left w-full max-w-xl shrink-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">💡</span>
                <h5 className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 font-sans">
                  Gợi ý từ vựng cho con:
                </h5>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeStory
                  .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
                  .split(/\s+/)
                  .slice(0, 5)
                  .map((kw: string) => (
                    <span
                      key={kw}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-0.5 text-xs font-bold shadow-sm font-sans"
                    >
                      {kw}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Reading MCQ slide
        <div className="flex flex-col items-center p-2 min-h-0">
          <h3 className="font-extrabold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            <span className="text-lg">🧩</span>
            Đã đến giờ trả lời câu hỏi! Chọn 1 đáp án đúng:
          </h3>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border-2 border-blue-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm mb-5 text-center w-full max-w-lg">
            <p className="text-base md:text-xl font-black text-slate-800 dark:text-slate-100">
              {activeMcq.question}
            </p>
          </div>

          {/* Interactive MCQ Choices */}
          <div className="flex flex-col gap-3 w-full max-w-md">
            {activeMcq.options.map((option: string, idx: number) => {
              const isSelected = selectedMcqOption === idx;
              const isCorrectOption = idx === activeMcq.correctIndex;

              let optionClass =
                "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 hover:translate-y-[-2px]";
              if (mcqAnswered) {
                if (isCorrectOption) {
                  optionClass =
                    "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border-emerald-500 border-l-4 border-l-emerald-500 text-emerald-800 dark:text-emerald-300 scale-[1.04] shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-300/50 z-10";
                } else if (isSelected) {
                  optionClass =
                    "bg-rose-100 dark:bg-rose-950/50 border-rose-400 text-rose-700 dark:text-rose-300 opacity-60";
                } else {
                  optionClass =
                    "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-40";
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
                    <span className="text-2xl shrink-0 ml-2 animate-bounce">
                      ✅
                    </span>
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
  );
}
