import React from "react";

export default function WarmupStage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full blur-xl opacity-30 animate-pulse" />
        <span className="text-[120px] md:text-[160px] leading-none block relative animate-bounce" style={{ animationDuration: "3s" }}>
          🏫
        </span>
      </div>
      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
        Giai đoạn 1: Chào hỏi với cô giáo AI
      </h3>
      <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-md leading-relaxed font-black">
        Con hãy lắng nghe câu hỏi của cô giáo Lily, nhấn nút micro ở dưới cùng và nói thật rõ ràng nhé! 🎤🌟
      </p>
    </div>
  );
}
