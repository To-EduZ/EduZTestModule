"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Sparkles,
  Upload,
  Trash2,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Image as ImageIcon,
  Palette
} from "lucide-react";
import { Mascot, MascotState } from "@/types/mascot";

// Predefined color presets
const THEME_PRESETS = [
  {
    name: "Blue (Cô Lily)",
    ring: "border-blue-300 dark:border-blue-700",
    bg: "bg-sky-50 dark:bg-slate-800",
    text: "text-indigo-500 dark:text-indigo-400",
    border: "border-slate-100 dark:border-slate-800",
    colorBox: "bg-sky-400"
  },
  {
    name: "Amber (Khỉ Max)",
    ring: "border-amber-300 dark:border-amber-700",
    bg: "bg-yellow-50 dark:bg-slate-800",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/50",
    colorBox: "bg-amber-400"
  },
  {
    name: "Emerald (Xanh Lá)",
    ring: "border-emerald-300 dark:border-emerald-700",
    bg: "bg-emerald-50 dark:bg-slate-800",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-900/50",
    colorBox: "bg-emerald-400"
  },
  {
    name: "Pink (Hippo)",
    ring: "border-pink-300 dark:border-pink-700",
    bg: "bg-pink-50 dark:bg-slate-800",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-100 dark:border-pink-900/50",
    colorBox: "bg-pink-400"
  }
];

export default function MascotCRUDPage() {
  const [mascots, setMascots] = useState<Mascot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form edit states
  const [isEditing, setIsEditing] = useState(false);
  const [mId, setMId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Dialogues
  const [diagSpeaking, setDiagSpeaking] = useState("Đang nói... 🔊");
  const [diagListening, setDiagListening] = useState("Đang nghe... 🎤");
  const [diagThinking, setDiagThinking] = useState("Đang suy nghĩ... 🧠");

  // Selected preset index
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);

  // Custom colors (if they want to manually override)
  const [ringColor, setRingColor] = useState(THEME_PRESETS[0].ring);
  const [bgColor, setBgColor] = useState(THEME_PRESETS[0].bg);
  const [textColor, setTextColor] = useState(THEME_PRESETS[0].text);
  const [borderColor, setBorderColor] = useState(THEME_PRESETS[0].border);

  // Image files & URLs
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [stateFiles, setStateFiles] = useState<Record<string, File | null>>({
    idle: null,
    speaking: null,
    listening: null,
    thinking: null,
    happy: null,
    encouraging: null
  });

  const [statePreviews, setStatePreviews] = useState<Record<string, string | null>>({
    idle: null,
    speaking: null,
    listening: null,
    thinking: null,
    happy: null,
    encouraging: null
  });

  // Reference for file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const stateInputRefs = {
    idle: useRef<HTMLInputElement>(null),
    speaking: useRef<HTMLInputElement>(null),
    listening: useRef<HTMLInputElement>(null),
    thinking: useRef<HTMLInputElement>(null),
    happy: useRef<HTMLInputElement>(null),
    encouraging: useRef<HTMLInputElement>(null)
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const fetchMascots = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mascots");
      const json = await res.json();
      if (json.success && json.data) {
        setMascots(json.data);
      }
    } catch (err: any) {
      showToast("error", "Lỗi khi tải danh sách Mascot!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMascots();
  }, []);

  // Update theme colors when preset index changes
  const selectPreset = (idx: number) => {
    setSelectedPresetIdx(idx);
    setRingColor(THEME_PRESETS[idx].ring);
    setBgColor(THEME_PRESETS[idx].bg);
    setTextColor(THEME_PRESETS[idx].text);
    setBorderColor(THEME_PRESETS[idx].border);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleStateFile = (state: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStateFiles(prev => ({ ...prev, [state]: file }));
      setStatePreviews(prev => ({ ...prev, [state]: URL.createObjectURL(file) }));
    }
  };

  const resetForm = () => {
    setMId("");
    setName("");
    setDescription("");
    setDiagSpeaking("Đang nói... 🔊");
    setDiagListening("Đang nghe con nè... 🎤");
    setDiagThinking("Đang suy nghĩ... 🧠");
    selectPreset(0);
    setAvatarFile(null);
    setAvatarPreview(null);
    setStateFiles({
      idle: null,
      speaking: null,
      listening: null,
      thinking: null,
      happy: null,
      encouraging: null
    });
    setStatePreviews({
      idle: null,
      speaking: null,
      listening: null,
      thinking: null,
      happy: null,
      encouraging: null
    });
    setIsEditing(false);
    
    // Clear HTML file inputs
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    Object.values(stateInputRefs).forEach(ref => {
      if (ref.current) ref.current.value = "";
    });
  };

  const handleEdit = (m: Mascot) => {
    setIsEditing(true);
    setMId(m.id);
    setName(m.name);
    setDescription(m.description || "");
    setDiagSpeaking(m.dialogue?.speaking || "");
    setDiagListening(m.dialogue?.listening || "");
    setDiagThinking(m.dialogue?.thinking || "");

    // Set custom/theme colors
    setRingColor(m.themeColors?.ring || "");
    setBgColor(m.themeColors?.bg || "");
    setTextColor(m.themeColors?.text || "");
    setBorderColor(m.themeColors?.border || "");

    // Check if colors match any preset
    const matchedIdx = THEME_PRESETS.findIndex(p => p.ring === m.themeColors?.ring && p.bg === m.themeColors?.bg);
    setSelectedPresetIdx(matchedIdx !== -1 ? matchedIdx : -1);

    setAvatarPreview(m.avatarUrl || null);
    setAvatarFile(null);

    const previews: Record<string, string | null> = {};
    Object.keys(statePreviews).forEach(state => {
      previews[state] = m.images?.[state as MascotState] || null;
    });
    setStatePreviews(previews);

    // Reset selected files
    setStateFiles({
      idle: null,
      speaking: null,
      listening: null,
      thinking: null,
      happy: null,
      encouraging: null
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Mascot "${id}"?`)) return;
    try {
      const res = await fetch(`/api/mascots?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Đã xóa Mascot thành công!");
        fetchMascots();
        if (isEditing && mId === id) resetForm();
      } else {
        throw new Error(json.error);
      }
    } catch (err: any) {
      showToast("error", err.message || "Không thể xóa Mascot!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mId.trim()) return showToast("error", "Mã ID không được để trống!");
    if (!name.trim()) return showToast("error", "Tên Mascot không được để trống!");
    if (!avatarPreview && !avatarFile) return showToast("error", "Vui lòng chọn ảnh đại diện!");

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      const payload = {
        id: mId.trim().toLowerCase(),
        name: name.trim(),
        description: description.trim(),
        avatarUrl: avatarPreview, // fallback to existing URL
        dialogue: {
          speaking: diagSpeaking.trim(),
          listening: diagListening.trim(),
          thinking: diagThinking.trim()
        },
        themeColors: {
          ring: ringColor,
          bg: bgColor,
          text: textColor,
          border: borderColor
        },
        images: { ...statePreviews } // keep current previews URL strings
      };

      formData.append("mascotData", JSON.stringify(payload));
      
      if (avatarFile) {
        formData.append("file_avatar", avatarFile);
      }
      
      Object.entries(stateFiles).forEach(([state, file]) => {
        if (file) {
          formData.append(`file_${state}`, file);
        }
      });

      const res = await fetch("/api/mascots", {
        method: isEditing ? "PUT" : "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("success", isEditing ? "Cập nhật Mascot thành công!" : "Tạo Mascot thành công!");
      resetForm();
      fetchMascots();
    } catch (err: any) {
      showToast("error", err.message || "Gặp sự cố khi lưu Mascot!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-pastel-bg dark:bg-dark-bg pb-20 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-2xl shadow-lg border-2 flex items-center gap-3 animate-slide-left ${toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-800 border-red-300"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          <span className="font-black text-sm">{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="w-full bg-white dark:bg-slate-900 border-b-4 border-slate-100 dark:border-slate-700 py-3 px-4 sticky top-0 z-35 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard">
            <button className="btn-3d-gray px-4 py-2.5 text-xs font-black flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> BẢNG TIẾN ĐỘ
            </button>
          </Link>
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 px-4 py-1.5 rounded-2xl">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="text-xs md:text-sm font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">Cấu Hình Mascot AI</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 mt-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-xl">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
            <Database className="w-7 h-7 text-indigo-500" /> Quản Lý Mascot Thần Thoại
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Thêm mới, chỉnh sửa và cấu hình các trạng thái hoạt họa của giáo viên AI (Mascot) tương tác cùng các bé học sinh.
          </p>
        </div>

        {/* Responsive layout: stacks on mobile, columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* COLUMN 1: FORM (Add / Edit) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                {isEditing ? `📝 Sửa Mascot: ${mId}` : "➕ Thêm Mascot Mới"}
              </h2>
              {isEditing && (
                <button onClick={resetForm} className="btn-3d-gray px-3 py-1 text-xs font-black">HỦY SỬA</button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ID & Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Mã ID *</label>
                  <input
                    required
                    value={mId}
                    onChange={e => setMId(e.target.value)}
                    disabled={isEditing}
                    className="w-full bg-slate-50 dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 font-bold text-sm"
                    placeholder="vd: hippo, lily"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Tên Hiển Thị *</label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 font-bold text-sm"
                    placeholder="vd: Hà Mã Dễ Thương"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Mô tả (Description)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-850 border-2 border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 font-bold text-sm"
                  placeholder="Mô tả tính cách hoặc vai trò..."
                />
              </div>

              {/* Theme Presets */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" /> Tông màu chủ đạo (Theme Presets)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => selectPreset(idx)}
                      className={`p-2 rounded-xl border-2 font-bold text-xs flex items-center gap-2 transition-all select-none ${
                        selectedPresetIdx === idx
                          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 scale-102"
                          : "border-slate-100 dark:border-slate-800 hover:border-slate-300 text-slate-650"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${preset.colorBox} shrink-0`} />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
                {/* Advanced manual color settings (collapsible / read-only fields for confirmation) */}
                <div className="mt-2 text-[10px] font-bold text-slate-400 flex flex-wrap gap-2">
                  <span>Ring: <code className="bg-slate-100 px-1 rounded">{ringColor.split(" ")[0]}</code></span>
                  <span>Bg: <code className="bg-slate-100 px-1 rounded">{bgColor.split(" ")[0]}</code></span>
                </div>
              </div>

              {/* State dialogues */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-850/40 p-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-1.5 mb-2">Lời thoại tương tác</p>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-0.5">Lời thoại Nói (Speaking Dialogue)</label>
                  <input
                    value={diagSpeaking}
                    onChange={e => setDiagSpeaking(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-0.5">Lời thoại Nghe (Listening Dialogue)</label>
                  <input
                    value={diagListening}
                    onChange={e => setDiagListening(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-0.5">Lời thoại Nghĩ (Thinking Dialogue)</label>
                  <input
                    value={diagThinking}
                    onChange={e => setDiagThinking(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Avatar upload */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Ảnh Đại Diện (Avatar URL/File) *</label>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 bg-slate-100 border-2 border-slate-200 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt="Avatar Preview" fill className="object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      ref={avatarInputRef}
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="btn-3d-orange px-3 py-1.5 text-[10px] font-black flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> Chọn tệp tin
                    </button>
                    <input
                      type="text"
                      value={avatarPreview || ""}
                      onChange={e => {
                        setAvatarPreview(e.target.value);
                        setAvatarFile(null);
                      }}
                      placeholder="Hoặc dán URL ảnh trực tiếp..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* State Images (idle, speaking, listening, thinking) */}
              <div className="space-y-4 bg-sky-50/20 border-2 border-sky-100 rounded-2xl p-3">
                <p className="text-xs font-black text-sky-850 uppercase tracking-widest border-b pb-1.5 mb-2">Ảnh động tác các trạng thái</p>
                
                {["idle", "speaking", "listening", "thinking", "happy", "encouraging"].map((state) => (
                  <div key={state} className="flex items-center gap-3 border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                    <div className="relative w-10 h-10 bg-white border border-slate-200 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                      {statePreviews[state] ? (
                        <Image src={statePreviews[state]!} alt={`${state} Preview`} fill className="object-cover" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{state}</span>
                        <button
                          type="button"
                          onClick={() => stateInputRefs[state as MascotState].current?.click()}
                          className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100 flex items-center gap-0.5"
                        >
                          <Upload className="w-2.5 h-2.5" /> Upload file
                        </button>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={stateInputRefs[state as MascotState]}
                        onChange={e => handleStateFile(state, e)}
                        className="hidden"
                      />
                      <input
                        type="text"
                        value={statePreviews[state] || ""}
                        onChange={e => {
                          setStatePreviews(prev => ({ ...prev, [state]: e.target.value }));
                          setStateFiles(prev => ({ ...prev, [state]: null }));
                        }}
                        placeholder="Hoặc dán URL trạng thái..."
                        className="w-full bg-white border border-slate-200 rounded-md px-2 py-0.5 text-[9px] font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-3d-blue w-full py-3.5 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang nạp và lưu trữ...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {isEditing ? "Lưu Mascot" : "Tạo Mascot"}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* COLUMN 2: LIST & PREVIEW */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-lg">
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" /> Ngân Hàng Mascot Hiện Tại ({mascots.length})
              </h2>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p className="font-extrabold text-sm animate-pulse">Đang tải danh sách các bé Mascot...</p>
                </div>
              ) : mascots.length === 0 ? (
                <div className="py-20 text-center text-slate-450 font-bold border-2 border-dashed border-slate-200 rounded-2xl">
                  Chưa có Mascot nào trong Database.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mascots.map((m) => {
                    const matchedPreset = THEME_PRESETS.find(p => p.ring === m.themeColors?.ring && p.bg === m.themeColors?.bg);
                    const presetName = matchedPreset ? matchedPreset.name.split(" ")[0] : "Tự chọn";

                    return (
                      <div
                        key={m.id}
                        className={`border-4 rounded-3xl p-4 md:p-5 flex flex-col justify-between hover:scale-102 transition-all duration-200 bg-slate-50 dark:bg-slate-850 ${
                          m.themeColors?.border || "border-slate-100"
                        }`}
                      >
                        <div>
                          {/* Top row: ID, Edit/Delete */}
                          <div className="flex items-start justify-between mb-3.5">
                            <div>
                              <span className="font-black text-xs text-indigo-700 bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-850">{m.id}</span>
                              <span className="ml-2 text-[10px] font-black text-slate-450 uppercase">Theme: {presetName}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleEdit(m)}
                                className="p-1.5 text-blue-500 bg-blue-55 rounded-xl hover:bg-blue-100 shadow-sm border border-blue-200"
                              >
                                <PenTool className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="p-1.5 text-red-500 bg-red-55 rounded-xl hover:bg-red-100 shadow-sm border border-red-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Mascot Info */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`relative w-12 h-12 rounded-full border-2 overflow-hidden flex items-center justify-center shrink-0 ${m.themeColors?.ring || "border-slate-200"} ${m.themeColors?.bg || "bg-white"}`}>
                              {m.avatarUrl ? (
                                <Image src={m.avatarUrl} alt={m.name} fill className="object-cover" sizes="48px" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 leading-tight">{m.name}</h3>
                              <p className="text-[10px] font-semibold text-slate-450 line-clamp-1 mt-0.5">{m.description || "Không có mô tả."}</p>
                            </div>
                          </div>

                          {/* Dialogue Bubble Previews */}
                          <div className="space-y-1.5 text-[11px] font-bold text-slate-500 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/80">
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-500 shrink-0">🔊 Speaking:</span>
                              <span className="text-slate-700 dark:text-slate-300 truncate font-semibold">"{m.dialogue?.speaking}"</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-rose-400 shrink-0">🎤 Listening:</span>
                              <span className="text-slate-700 dark:text-slate-300 truncate font-semibold">"{m.dialogue?.listening}"</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-amber-500 shrink-0">🧠 Thinking:</span>
                              <span className="text-slate-700 dark:text-slate-300 truncate font-semibold">"{m.dialogue?.thinking}"</span>
                            </div>
                          </div>
                        </div>

                        {/* State visual preview strip */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-750 flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">States:</span>
                          {["idle", "speaking", "listening", "thinking", "happy", "encouraging"].map(state => {
                            const url = m.images?.[state as MascotState];
                            return (
                              <div
                                key={state}
                                title={`${state} state preview`}
                                className="relative w-6 h-6 rounded-full border border-slate-200 bg-white overflow-hidden"
                              >
                                {url ? (
                                  <Image src={url} alt={state} fill className="object-cover" sizes="24px" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[6px] font-extrabold text-slate-300">∅</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
