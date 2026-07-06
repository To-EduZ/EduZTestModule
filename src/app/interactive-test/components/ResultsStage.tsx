import React from "react";
import Link from "next/link";
import {
  Trophy,
  Download,
  FileText,
  Share2,
  Award,
  Compass,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import DevelopmentRadarChart from "@/components/DevelopmentRadarChart";
import SkillShield from "./SkillShield";

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  stage: string;
  audioUrl?: string;
}

interface ResultsStageProps {
  overallLevelInfo: {
    name: string;
    mascot: string;
    title: string;
    theme: string;
    desc: string;
  };
  scores: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
  kidName: string;
  kidAge: string;
  selectedRatingStars: number | null;
  hoveredRatingStars: number | null;
  saveSuccess: boolean | null;
  isSaving: boolean;
  messages: Message[];
  isSkillTested: (skillName: "speaking" | "listening" | "reading" | "writing") => boolean;
  getShieldsCount: (score: number) => number;
  roadmapTasks: () => string[];
  setSelectedRatingStars: (val: number | null) => void;
  setHoveredRatingStars: (val: number | null) => void;
  updateInteractiveSessionStars: (stars: number) => void;
  exportToImage: () => void;
  exportToPDF: () => void;
  shareToZalo: () => void;
  saveResultsToDb: () => void;
  setStage: (val: any) => void;
  startTest: () => void;
  resultsRef: React.RefObject<HTMLDivElement | null>;
}

export default function ResultsStage({
  overallLevelInfo,
  scores,
  kidName,
  kidAge,
  selectedRatingStars,
  hoveredRatingStars,
  saveSuccess,
  isSaving,
  messages,
  isSkillTested,
  getShieldsCount,
  roadmapTasks,
  setSelectedRatingStars,
  setHoveredRatingStars,
  updateInteractiveSessionStars,
  exportToImage,
  exportToPDF,
  shareToZalo,
  saveResultsToDb,
  setStage,
  startTest,
  resultsRef,
}: ResultsStageProps) {
  return (
    <div className="w-full min-h-screen pb-20 relative bg-pastel-bg dark:bg-dark-bg overflow-x-hidden">
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
        {/* Satisfaction Star Rating Card */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-indigo-100 dark:border-indigo-800 p-4 md:p-6 shadow-md text-center w-full animate-fade-in relative z-20">
          <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 mb-1.5 font-sans">
            <span>🌟</span> Con đánh giá độ hài lòng về bài test này nhé!
          </h3>
          <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 font-sans">
            Hãy bấm vào các ngôi sao bên dưới để tặng cô Lily sao nhé! 5 sao là bé cực kỳ thích đó! ⭐
          </p>
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <button
                key={starIndex}
                type="button"
                onClick={() => {
                  setSelectedRatingStars(starIndex);
                  updateInteractiveSessionStars(starIndex);
                }}
                onMouseEnter={() => setHoveredRatingStars(starIndex)}
                onMouseLeave={() => setHoveredRatingStars(null)}
                className="transition-transform duration-200 hover:scale-125 focus:outline-none cursor-pointer text-4xl select-none"
              >
                <span
                  className={
                    starIndex <= (hoveredRatingStars ?? selectedRatingStars ?? 0)
                      ? "text-amber-400 drop-shadow-md"
                      : "text-slate-200 dark:text-slate-700"
                  }
                >
                  ★
                </span>
              </button>
            ))}
          </div>
          {selectedRatingStars !== null && (
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-wide uppercase animate-pulse">
              Cảm ơn con đã tặng cô {selectedRatingStars} sao yêu thích! 🎉
            </p>
          )}
        </section>

        {/* Export & Share Buttons */}
        <div className="flex flex-row justify-center flex-wrap gap-4 my-4">
          <button
            onClick={exportToImage}
            className="flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-xl font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Tải Ảnh Kết Quả
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-xl font-bold transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" /> Xuất File PDF
          </button>
          <button
            onClick={shareToZalo}
            className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl font-bold transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4" /> Chia sẻ Zalo
          </button>
        </div>

        {/* Certificate Showcase Card */}
        <section
          ref={resultsRef}
          className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-300 dark:border-amber-800 p-5 md:p-8 shadow-xl text-center relative overflow-hidden"
        >
          <div
            className="absolute top-2 left-6 text-2xl animate-bounce"
            style={{ animationDelay: "1s" }}
          >
            ✨
          </div>
          <div
            className="absolute top-8 right-8 text-2xl animate-bounce"
            style={{ animationDelay: "2.5s" }}
          >
            🎈
          </div>

          <span className="bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full border border-blue-200 inline-flex items-center gap-1.5 mb-4 shadow-sm">
            <Award className="w-3.5 h-3.5 text-blue-500 fill-blue-100" />
            Chứng Nhận Năng Lực Tiếng Anh
          </span>

          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            BẢNG KẾT QUẢ CỦA BÉ {kidName.toUpperCase()}
          </h2>
          <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 font-extrabold mt-1">
            Tuổi học viên: {kidAge} tuổi
          </p>

          {/* Stacking Recommended Level (ô 1) and Development Radar Chart (ô 2) vertically */}
          <div className="flex flex-col gap-6 items-center justify-center my-8 max-w-xl mx-auto w-full">
            {/* Top: Recommended Level Badge (ô 1) */}
            <div
              className={`border-2 rounded-3xl p-6 shadow-md transition-all hover:scale-105 duration-300 text-center w-full flex flex-col justify-center items-center ${overallLevelInfo.theme}`}
            >
              <span
                className="text-5xl block animate-bounce"
                style={{ animationDuration: "2s" }}
              >
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
            {(() => {
              const chartData = [
                isSkillTested("speaking") && {
                  label: "Speaking (Nói)",
                  value: scores.speaking,
                  emoji: "🎤",
                },
                isSkillTested("listening") && {
                  label: "Listening (Nghe)",
                  value: scores.listening,
                  emoji: "🎧",
                },
                isSkillTested("reading") && {
                  label: "Reading (Đọc)",
                  value: scores.reading,
                  emoji: "📖",
                },
                isSkillTested("writing") && {
                  label: "Writing (Viết)",
                  value: scores.writing,
                  emoji: "✍️",
                },
              ].filter(Boolean) as any[];

              if (chartData.length >= 3) {
                return (
                  <div className="flex justify-center items-center w-full">
                    <DevelopmentRadarChart
                      title="Biểu đồ phát triển"
                      colorScheme="violet"
                      size={380}
                      data={chartData}
                    />
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Skills Shields Matrix Grid */}
          <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-3xl p-4 md:p-6 shadow-inner mt-4 md:mt-6">
            <h3 className="text-xs md:text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 md:mb-6">
              Đánh giá theo các kỹ năng được thi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Speaking */}
              <div
                className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm ${
                  !isSkillTested("speaking") ? "opacity-40 bg-slate-50/50 dark:bg-slate-900/30" : ""
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">
                    🎤 Speaking (Kỹ năng Nói)
                  </h4>
                  {isSkillTested("speaking") ? (
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold mt-0.5">
                      Điểm quy đổi: {scores.speaking}/100
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                      Không đánh giá (N/A)
                    </p>
                  )}
                </div>
                {isSkillTested("speaking") ? (
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkillShield key={i} filled={i < getShieldsCount(scores.speaking)} />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-2.5 py-1 rounded-xl font-bold border border-slate-200 dark:border-slate-700 select-none">
                    N/A
                  </span>
                )}
              </div>

              {/* Listening */}
              <div
                className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm ${
                  !isSkillTested("listening") ? "opacity-40 bg-slate-50/50 dark:bg-slate-900/30" : ""
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">
                    🎧 Listening (Kỹ năng Nghe)
                  </h4>
                  {isSkillTested("listening") ? (
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold mt-0.5">
                      Điểm quy đổi: {scores.listening}/100
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                      Không đánh giá (N/A)
                    </p>
                  )}
                </div>
                {isSkillTested("listening") ? (
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkillShield key={i} filled={i < getShieldsCount(scores.listening)} />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-2.5 py-1 rounded-xl font-bold border border-slate-200 dark:border-slate-700 select-none">
                    N/A
                  </span>
                )}
              </div>

              {/* Reading */}
              <div
                className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm ${
                  !isSkillTested("reading") ? "opacity-40 bg-slate-50/50 dark:bg-slate-900/30" : ""
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">
                    📖 Reading (Kỹ năng Đọc)
                  </h4>
                  {isSkillTested("reading") ? (
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold mt-0.5">
                      Điểm quy đổi: {scores.reading}/100
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                      Không đánh giá (N/A)
                    </p>
                  )}
                </div>
                {isSkillTested("reading") ? (
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkillShield key={i} filled={i < getShieldsCount(scores.reading)} />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-2.5 py-1 rounded-xl font-bold border border-slate-200 dark:border-slate-700 select-none">
                    N/A
                  </span>
                )}
              </div>

              {/* Writing */}
              <div
                className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm ${
                  !isSkillTested("writing") ? "opacity-40 bg-slate-50/50 dark:bg-slate-900/30" : ""
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">
                    ✍️ Writing (Kỹ năng Viết)
                  </h4>
                  {isSkillTested("writing") ? (
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold mt-0.5">
                      Điểm quy đổi: {scores.writing}/100
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                      Không đánh giá (N/A)
                    </p>
                  )}
                </div>
                {isSkillTested("writing") ? (
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkillShield key={i} filled={i < getShieldsCount(scores.writing)} />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-2.5 py-1 rounded-xl font-bold border border-slate-200 dark:border-slate-700 select-none">
                    N/A
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* AI Feedback Section */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 md:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="shrink-0 flex sm:flex-col items-center gap-2 self-center sm:self-start bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 w-full sm:w-28 text-center shadow-inner">
              <span className="text-5xl animate-bounce" style={{ animationDuration: "2.5s" }}>
                {overallLevelInfo.mascot}
              </span>
              <div>
                <p className="text-slate-700 dark:text-slate-200 leading-tight font-black">
                  {overallLevelInfo.title}
                </p>
                <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 mt-0.5">
                  Cô giáo AI
                </p>
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
            <Compass
              className="w-6 h-6 text-blue-500 animate-spin"
              style={{ animationDuration: "8s" }}
            />
            Lộ trình rèn luyện nâng cao năng lực 🚀
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-6">
            Dựa trên kết quả thi đầu vào, cô giáo AI đã chuẩn hóa riêng cho con 3 bài tập nhỏ luyện
            tập tại nhà:
          </p>

          <div className="space-y-4">
            {roadmapTasks().map((task, index) => (
              <div
                key={index}
                className="border-2 border-blue-50 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-start gap-3 shadow-sm hover:border-blue-200 dark:hover:border-slate-700 transition-colors"
              >
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

        {/* Chat Transcript Section */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 md:p-8 shadow-xl mt-6">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 border-b dark:border-slate-800 pb-4">
            💬 Lịch sử trò chuyện với cô giáo
          </h3>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${
                    msg.role === "ai"
                      ? "bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50 border-2 border-slate-200 dark:border-slate-600"
                      : "bg-blue-600 dark:bg-indigo-500 text-white"
                  }`}
                >
                  <div className="text-[10px] uppercase font-black tracking-wider opacity-60 mb-1 flex items-center gap-1">
                    {msg.role === "ai" ? (
                      <>
                        <span>🤖</span> Cô giáo AI
                      </>
                    ) : (
                      <>
                        <span>👤</span> Học viên {kidName}
                      </>
                    )}
                  </div>
                  {msg.content}
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
                <>Lưu kết quả học tập 💾</>
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
              startTest();
            }}
            className="btn-3d-gray w-full sm:w-auto px-8 py-4 text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:scale-105 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Thi lại đề này 🔄
          </button>
        </section>
      </main>
    </div>
  );
}
