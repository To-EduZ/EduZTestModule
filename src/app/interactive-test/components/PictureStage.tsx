import React from "react";
import Image from "next/image";
import SkillShield from "./SkillShield";

interface PictureStageProps {
  currentQuestion: any;
  pictureIndex: number;
  subQuestionIndex: number;
  showVocabularyHint: boolean;
  interactiveMode: "test" | "practice";
  keywordsMentioned: string[];
  setIsImageZoomed: (val: boolean) => void;
}

export default function PictureStage({
  currentQuestion,
  pictureIndex,
  subQuestionIndex,
  showVocabularyHint,
  interactiveMode,
  keywordsMentioned,
  setIsImageZoomed,
}: PictureStageProps) {
  if (!currentQuestion) return null;

  const expectedKeywords =
    currentQuestion.questions?.[subQuestionIndex]?.expectedKeywords ||
    currentQuestion.evaluationCriteria?.expectedKeywords ||
    [];

  return (
    <div className="flex-1 flex flex-col min-h-0 justify-between gap-2.5">
      <div>
        <h3 className="font-extrabold text-amber-700 dark:text-amber-300 flex items-center justify-between mb-3 text-xs uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖼️</span>
            <span>
              Bức tranh {pictureIndex + 1}/2 — Thử thách {subQuestionIndex + 1}/
              {currentQuestion.questions?.length || 5}
            </span>
          </div>

          {/* Cambridge shield trackers */}
          <div className="flex gap-0.5">
            {Array.from({ length: currentQuestion.questions?.length || 5 }).map(
              (_, i) => (
                <SkillShield key={i} filled={i <= subQuestionIndex} />
              )
            )}
          </div>
        </h3>
      </div>

      {currentQuestion.imagePath && (
        <div
          onClick={() => setIsImageZoomed(true)}
          className="relative w-full max-w-full sm:max-w-xl mx-auto aspect-video md:max-h-[500px] flex-1 min-h-[150px] sm:min-h-[220px] rounded-3xl overflow-hidden shadow-xl border-4 border-gradient-to-r from-amber-200 to-blue-200 dark:border-slate-700 hover:scale-[1.01] transition-transform duration-300 my-1 bg-slate-50 dark:bg-slate-950/40 cursor-pointer cursor-zoom-in"
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

      {/* Practice Mode Vocabulary Hints Card */}
      {(showVocabularyHint || interactiveMode === "practice") && (
        <div className="bg-amber-50/60 dark:bg-amber-950/10 border-2 border-dashed border-amber-200 dark:border-amber-900/40 rounded-2xl p-2.5 text-left shrink-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">💡</span>
            <h5 className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 font-sans">
              Gợi ý từ vựng cho con:
            </h5>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {expectedKeywords.map((kw: string) => {
              const isHit = keywordsMentioned.some(
                (k) => k.toLowerCase() === kw.toLowerCase()
              );
              return (
                <span
                  key={kw}
                  className={`border rounded-xl px-2.5 py-0.5 text-xs font-bold shadow-sm font-sans transition-all duration-300 ${
                    isHit
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 scale-105"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {kw}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Simplified star counter for keywords */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-2.5 rounded-2xl shrink-0">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400">
          ⭐ Từ vựng đạt:
        </span>
        <div className="flex items-center gap-1">
          <span className="text-lg font-black text-amber-500">
            {keywordsMentioned.length}
          </span>
          <span className="text-xs font-bold text-slate-400">từ</span>
          {keywordsMentioned.length > 0 && (
            <span className="text-lg animate-bounce">🌟</span>
          )}
        </div>
      </div>
    </div>
  );
}
