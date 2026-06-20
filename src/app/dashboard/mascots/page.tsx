"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  Edit2, 
  CheckCircle2, 
  Loader2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Star, 
  Upload, 
  Image as ImageIcon, 
  Palette, 
  MessageSquare, 
  Settings,
  Sparkles
} from "lucide-react";
import { Mascot, MascotState } from "@/types/mascot";
import { useMascot } from "@/contexts/MascotContext";

const COLOR_PRESETS = [
  {
    name: "Sky Blue",
    label: "Xanh dương (Lily)",
    themeColors: {
      ring: "border-blue-300 dark:border-blue-700",
      bg: "bg-sky-50 dark:bg-slate-800",
      text: "text-indigo-500 dark:text-indigo-400",
      border: "border-slate-100 dark:border-slate-800"
    },
    colorClass: "bg-sky-400 border-sky-300",
  },
  {
    name: "Amber Gold",
    label: "Vàng cam (Max)",
    themeColors: {
      ring: "border-amber-300 dark:border-amber-700",
      bg: "bg-yellow-50 dark:bg-slate-800",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/50"
    },
    colorClass: "bg-amber-400 border-amber-300",
  },
  {
    name: "Emerald Green",
    label: "Lục bảo",
    themeColors: {
      ring: "border-emerald-300 dark:border-emerald-700",
      bg: "bg-emerald-50 dark:bg-slate-800",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-900/50"
    },
    colorClass: "bg-emerald-500 border-emerald-400",
  },
  {
    name: "Crimson Red",
    label: "Đỏ hồng đào",
    themeColors: {
      ring: "border-rose-300 dark:border-rose-700",
      bg: "bg-rose-50 dark:bg-slate-800",
      text: "text-rose-600 dark:text-rose-400",
      border: "border-rose-100 dark:border-rose-900/50"
    },
    colorClass: "bg-rose-500 border-rose-400",
  },
  {
    name: "Lavender Violet",
    label: "Tím Lavender",
    themeColors: {
      ring: "border-purple-300 dark:border-purple-700",
      bg: "bg-purple-50 dark:bg-slate-800",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-100 dark:border-purple-900/50"
    },
    colorClass: "bg-purple-500 border-purple-400",
  },
  {
    name: "Orange Energy",
    label: "Cam năng động",
    themeColors: {
      ring: "border-orange-300 dark:border-orange-700",
      bg: "bg-orange-50 dark:bg-slate-800",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-100 dark:border-orange-900/50"
    },
    colorClass: "bg-orange-500 border-orange-400",
  },
  {
    name: "Classic Slate",
    label: "Xám trung tính",
    themeColors: {
      ring: "border-slate-400 dark:border-slate-600",
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-200 dark:border-slate-700"
    },
    colorClass: "bg-slate-500 border-slate-400",
  }
];

export default function MascotsManagementPage() {
  const { currentMascot, setMascotId, refreshMascots } = useMascot();
  const [mascots, setMascots] = useState<Mascot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingMascot, setEditingMascot] = useState<Mascot | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tabbed Navigation
  const [activeTab, setActiveTab] = useState<"general" | "images" | "dialogues" | "ai_generator">("general");

  // Advanced color options toggle
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  // File Upload State
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // AI Generator States
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReferenceImage, setAiReferenceImage] = useState<File | null>(null);
  const [aiReferencePreview, setAiReferencePreview] = useState<string | null>(null);
  const [aiProgressStep, setAiProgressStep] = useState<string | null>(null);
  const [aiIsGenerating, setAiIsGenerating] = useState(false);

  useEffect(() => {
    fetchMascots();
  }, []);

  const fetchMascots = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/mascots");
      const json = await res.json();
      if (json.success) {
        setMascots(json.data);
      } else {
        setError(json.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (mascot: Mascot) => {
    const safeImages = {
      idle: mascot.images?.idle || "",
      speaking: mascot.images?.speaking || "",
      listening: mascot.images?.listening || "",
      thinking: mascot.images?.thinking || "",
      happy: mascot.images?.happy || "",
      encouraging: mascot.images?.encouraging || "",
    };
    setEditingMascot({ 
      ...mascot, 
      images: safeImages 
    });
    setIsCreating(false);
    setSaveSuccess(false);
    setActiveTab("general");
    setShowAdvancedColors(false);

    // Reset AI States
    setAiPrompt("");
    setAiReferenceImage(null);
    setAiReferencePreview(null);
    setAiProgressStep(null);
    setAiIsGenerating(false);
  };

  const handleCreateNew = () => {
    setEditingMascot({
      id: "",
      name: "",
      description: "",
      avatarUrl: "",
      images: { idle: "", speaking: "", listening: "", thinking: "", happy: "", encouraging: "" },
      dialogue: { speaking: "Đang nói...", listening: "Đang nghe...", thinking: "Đang suy nghĩ..." },
      themeColors: {
        ring: "border-slate-300 dark:border-slate-700",
        bg: "bg-slate-50 dark:bg-slate-800",
        text: "text-slate-600 dark:text-slate-300",
        border: "border-slate-200 dark:border-slate-700",
      }
    });
    setIsCreating(true);
    setSaveSuccess(false);
    setActiveTab("general");
    setShowAdvancedColors(false);

    // Reset AI States
    setAiPrompt("");
    setAiReferenceImage(null);
    setAiReferencePreview(null);
    setAiProgressStep(null);
    setAiIsGenerating(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa Mascot "${name}" không?`)) return;

    try {
      const res = await fetch(`/api/mascots?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setMascots((prev) => prev.filter(m => m.id !== id));
        await refreshMascots(); // Sync context
        if (currentMascot.id === id && mascots.length > 1) {
          const nextMascot = mascots.find(m => m.id !== id);
          if (nextMascot) setMascotId(nextMascot.id);
        }
      } else {
        alert("Lỗi khi xóa: " + json.error);
      }
    } catch (err: any) {
      alert("Lỗi kết nối: " + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMascot) return;

    if (!editingMascot.id || !editingMascot.name) {
      alert("Vui lòng nhập ID và Tên Mascot.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const method = isCreating ? "POST" : "PUT";
      const res = await fetch(`/api/mascots`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMascot),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        if (isCreating) {
          setMascots(prev => [...prev, json.data]);
        } else {
          setMascots((prev) => prev.map((m) => (m.id === editingMascot.id ? json.data : m)));
        }
        await refreshMascots(); // Sync context
        setTimeout(() => setEditingMascot(null), 1500);
      } else {
        alert("Lỗi khi lưu: " + json.error);
      }
    } catch (err: any) {
      alert("Lỗi kết nối: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogueChange = (key: "speaking" | "listening" | "thinking", value: string) => {
    if (editingMascot) {
      setEditingMascot({
        ...editingMascot,
        dialogue: { ...editingMascot.dialogue, [key]: value },
      });
    }
  };

  const handleColorChange = (key: "ring" | "bg" | "text" | "border", value: string) => {
    if (editingMascot) {
      setEditingMascot({
        ...editingMascot,
        themeColors: { ...editingMascot.themeColors, [key]: value },
      });
    }
  };

  const handlePresetSelect = (presetColors: Mascot["themeColors"]) => {
    if (editingMascot) {
      setEditingMascot({
        ...editingMascot,
        themeColors: { ...presetColors }
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: string) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingMascot) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "mascots");

    setUploadingField(fieldKey);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        if (fieldKey === "avatarUrl") {
          setEditingMascot({ ...editingMascot, avatarUrl: json.url });
        } else {
          const stateKey = fieldKey.replace("images.", "");
          setEditingMascot({
            ...editingMascot,
            images: {
              ...editingMascot.images,
              [stateKey]: json.url,
            },
          });
        }
      } else {
        alert("Lỗi khi tải ảnh lên: " + json.error);
      }
    } catch (err: any) {
      alert("Lỗi kết nối khi tải ảnh lên: " + err.message);
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  };

  // AI Generator Flow
  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setAiReferenceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAiReferencePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const clearReferenceImage = () => {
    setAiReferenceImage(null);
    setAiReferencePreview(null);
  };

  const handleAIGenerate = async () => {
    if (!editingMascot) return;
    if (!aiPrompt && !aiReferenceImage) {
      alert("Vui lòng nhập mô tả văn bản hoặc tải lên ảnh tham chiếu.");
      return;
    }

    setAiIsGenerating(true);
    setAiProgressStep("Khởi động AI Engine...");
    
    const formData = new FormData();
    if (aiPrompt) formData.append("prompt", aiPrompt);
    if (aiReferenceImage) {
      formData.append("image", aiReferenceImage);
    }
    formData.append("state", "all");

    try {
      // Progress simulation steps
      const steps = [
        "Đang phân tích hình ảnh tham chiếu (Vision AI)...",
        "Đang kết nối API Image Generation...",
        "Đang tạo trạng thái Chờ (Idle) (1/6)...",
        "Đang tạo trạng thái Nói (Speaking) (2/6)...",
        "Đang tạo trạng thái Nghe (Listening) (3/6)...",
        "Đang tạo trạng thái Nghĩ (Thinking) (4/6)...",
        "Đang tạo trạng thái Vui vẻ (Happy) (5/6)...",
        "Đang tạo trạng thái Động viên (Encouraging) (6/6)...",
        "Đang lưu trữ các tệp lên Cloudinary...",
        "Hoàn tất! Đang áp dụng thiết kế..."
      ];
      
      let stepIdx = 0;
      setAiProgressStep(aiReferenceImage ? steps[0] : steps[1]);
      
      const interval = setInterval(() => {
        if (aiReferenceImage && stepIdx === 0) {
          stepIdx++;
          return;
        }
        if (stepIdx < steps.length - 1) {
          setAiProgressStep(steps[stepIdx]);
          stepIdx++;
        }
      }, 1800);

      const res = await fetch("/api/mascots/generate-images", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      const json = await res.json();

      if (json.success) {
        setAiProgressStep("Tạo bộ ảnh thành công! 🎉");
        
        setEditingMascot({
          ...editingMascot,
          avatarUrl: json.avatarUrl,
          images: {
            ...editingMascot.images,
            ...json.images
          }
        });
        
        setTimeout(() => {
          setAiIsGenerating(false);
          setAiProgressStep(null);
          setActiveTab("images");
        }, 1500);
      } else {
        alert("Lỗi từ AI Image Generator: " + json.error);
        setAiIsGenerating(false);
        setAiProgressStep(null);
      }
    } catch (err: any) {
      alert("Lỗi kết nối: " + err.message);
      setAiIsGenerating(false);
      setAiProgressStep(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:scale-105 transition-transform border border-slate-200 dark:border-slate-700">
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </Link>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Quản lý Mascot</h1>
          </div>
          <button 
            onClick={handleCreateNew}
            className="btn-3d-blue px-4 py-2.5 flex items-center gap-2 text-sm font-black uppercase tracking-wider animate-pulse hover:animate-none"
          >
            <Plus className="w-4 h-4" /> Thêm Mascot
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 mb-6 font-bold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mascots.map((mascot) => {
            const isSelected = currentMascot?.id === mascot.id;
            return (
              <div key={mascot.id} className={`bg-white dark:bg-slate-900 rounded-3xl border-4 p-6 shadow-sm flex gap-6 relative transition-all ${isSelected ? "border-emerald-400 dark:border-emerald-600 shadow-md scale-[1.02]" : "border-slate-100 dark:border-slate-800"}`}>
                {isSelected && (
                  <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1 border-2 border-white dark:border-slate-900 z-10">
                    <Star className="w-3 h-3 fill-white" /> Đang chọn
                  </div>
                )}
                
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 border-4 overflow-hidden shadow-inner ${mascot.themeColors?.bg || "bg-slate-50"} ${mascot.themeColors?.ring || "border-slate-300"}`}>
                  {mascot.avatarUrl ? (
                    <Image src={mascot.avatarUrl} alt={mascot.name} width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-4xl">🎭</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 truncate">{mascot.name}</h3>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{mascot.description || "Chưa có mô tả"}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {!isSelected && (
                      <button 
                        onClick={() => setMascotId(mascot.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black rounded-lg transition-colors flex-1"
                      >
                        Chọn dùng
                      </button>
                    )}
                    <button 
                      onClick={() => handleEdit(mascot)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-900 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(mascot.id, mascot.name)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {mascots.length === 0 && !error && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 mt-6">
            <span className="text-4xl block mb-4">🤷‍♂️</span>
            <p className="text-slate-500 dark:text-slate-400 font-bold">Chưa có Mascot nào. Bạn có thể thêm thủ công hoặc chạy script đồng bộ.</p>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {editingMascot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto max-h-[90vh] flex flex-col transition-all transform scale-100">
            
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                {isCreating ? "Thêm Mascot mới" : `Cấu hình ${editingMascot.name}`}
              </h3>
              <button 
                onClick={() => setEditingMascot(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="px-6 pt-4 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700 p-1.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl max-w-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "general"
                      ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm border border-slate-200/50 dark:border-slate-600"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  Giao diện & Màu
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("images")}
                  className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "images"
                      ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm border border-slate-200/50 dark:border-slate-600"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Ảnh Trạng Thái
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("dialogues")}
                  className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "dialogues"
                      ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm border border-slate-200/50 dark:border-slate-600"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Lời thoại
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ai_generator")}
                  className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "ai_generator"
                      ? "bg-white dark:bg-slate-700 text-purple-500 shadow-sm border border-slate-200/50 dark:border-slate-600 font-black"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-purple-400"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                  Tạo bằng AI
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="p-4 md:p-6 overflow-y-auto flex-1">
              
              {/* Tab 1: General & Color Styling */}
              {activeTab === "general" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* General Config inputs (col-span-2) */}
                  <div className="lg:col-span-2 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Tên Mascot <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          value={editingMascot.name}
                          onChange={e => setEditingMascot({...editingMascot, name: e.target.value})}
                          placeholder="VD: Cô Lily AI"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-400 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Mã ID <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          value={editingMascot.id}
                          onChange={e => setEditingMascot({...editingMascot, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")})}
                          placeholder="VD: lily"
                          className={`w-full px-4 py-2.5 border-2 rounded-xl font-bold text-sm ${isCreating ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-400" : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"}`}
                          disabled={!isCreating}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Mô tả</label>
                      <textarea 
                        value={editingMascot.description || ""}
                        onChange={e => setEditingMascot({...editingMascot, description: e.target.value})}
                        placeholder="Mô tả ngắn gọn tính cách hoặc vai trò..."
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-400 text-sm min-h-[70px]"
                      />
                    </div>

                    {/* Presets Theme Selection */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Chọn tông màu giao diện
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {COLOR_PRESETS.map((preset) => {
                          const isPresetSelected = editingMascot.themeColors?.bg === preset.themeColors.bg;
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => handlePresetSelect(preset.themeColors)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-bold text-xs transition-all hover:scale-[1.03] active:scale-95 ${
                                isPresetSelected 
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              <span className={`w-3 h-3 rounded-full border ${preset.colorClass}`}></span>
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Advanced Color Classes Inputs */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedColors(!showAdvancedColors)}
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1.5"
                      >
                        {showAdvancedColors ? "Ẩn" : "Hiện"} tùy biến mã lớp Tailwind (Nâng cao)
                      </button>
                      
                      {showAdvancedColors && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-500 mb-1">Nền Avatar (bg-)</label>
                            <input type="text" value={editingMascot.themeColors?.bg || ""} onChange={e => handleColorChange("bg", e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold" />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-500 mb-1">Viền Avatar (border-)</label>
                            <input type="text" value={editingMascot.themeColors?.ring || ""} onChange={e => handleColorChange("ring", e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold" />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-500 mb-1">Màu Chữ (text-)</label>
                            <input type="text" value={editingMascot.themeColors?.text || ""} onChange={e => handleColorChange("text", e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold" />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-500 mb-1">Viền Hộp thoại (border-)</label>
                            <input type="text" value={editingMascot.themeColors?.border || ""} onChange={e => handleColorChange("border", e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview Container (col-span-1) */}
                  <div className="flex flex-col gap-4">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Xem Trước Thiết Kế (Live)</span>
                    <div className={`w-full p-6 rounded-3xl border-4 flex flex-col items-center gap-5 transition-all duration-300 shadow-md ${editingMascot.themeColors?.bg || "bg-slate-50"} ${editingMascot.themeColors?.border || "border-slate-200"}`}>
                      <div className={`w-28 h-28 rounded-3xl border-4 flex items-center justify-center shrink-0 overflow-hidden relative shadow-md transition-all duration-300 ${editingMascot.themeColors?.ring || "border-slate-300"}`}>
                        {editingMascot.avatarUrl ? (
                          <img src={editingMascot.avatarUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-5xl">🎭</span>
                        )}
                      </div>
                      <div className="text-center w-full">
                        <h4 className={`text-xl font-black transition-colors duration-300 ${editingMascot.themeColors?.text || "text-slate-700"}`}>
                          {editingMascot.name || "Tên Mascot"}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 max-w-[220px] mx-auto truncate">
                          {editingMascot.description || "Chưa có mô tả..."}
                        </p>
                      </div>
                      
                      {/* Dialogue balloon preview */}
                      <div className={`w-full bg-white dark:bg-slate-950 border-2 rounded-2xl p-4 shadow-sm text-xs font-bold text-slate-700 dark:text-slate-300 relative transition-all duration-300 ${editingMascot.themeColors?.border || "border-slate-200"}`}>
                        <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Hộp thoại speaking:</span>
                        <p className="italic">"{editingMascot.dialogue?.speaking || "Đang nói..."}"</p>
                        <div className={`absolute left-1/2 -bottom-2 -translate-x-1/2 w-3.5 h-3.5 bg-white dark:bg-slate-950 border-b-2 border-r-2 rotate-45 transition-all duration-300 ${editingMascot.themeColors?.border || "border-slate-200"}`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Image State uploads */}
              {activeTab === "images" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-900/50 text-xs font-bold leading-relaxed mb-4">
                    💡 **Mẹo:** Bạn có thể chọn tải ảnh trực tiếp từ thiết bị của mình lên Cloudinary bảo mật, hoặc dán đường dẫn URL trực tiếp từ nguồn ngoài (Web, CDN khác). Dung lượng tối đa là 10MB/ảnh.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Avatar Block */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">🎭 Ảnh Đại Diện (Avatar)</label>
                          {uploadingField === "avatarUrl" && (
                            <span className="text-xs font-bold text-blue-500 flex items-center gap-1">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-3 items-center">
                          <div className="w-16 h-16 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm">
                            {editingMascot.avatarUrl ? (
                              <img src={editingMascot.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">🎭</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl cursor-pointer transition-colors border border-blue-200 dark:border-blue-900/50">
                              <Upload className="w-3.5 h-3.5" />
                              Chọn ảnh thiết bị
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, "avatarUrl")}
                                disabled={uploadingField !== null}
                              />
                            </label>
                            <p className="text-[10px] text-slate-400 font-bold mt-1.5">Ảnh hiển thị chính trên các danh sách</p>
                          </div>
                        </div>
                      </div>
                      
                      <input 
                        type="text" 
                        value={editingMascot.avatarUrl || ""}
                        onChange={e => setEditingMascot({...editingMascot, avatarUrl: e.target.value})}
                        placeholder="Hoặc dán URL: https://..."
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-400 text-ellipsis overflow-hidden"
                      />
                    </div>

                    {/* State Images */}
                    {Object.keys(editingMascot.images || {}).map((stateKey) => {
                      const fieldKey = `images.${stateKey}`;
                      const stateNameMap: Record<string, { title: string, desc: string, icon: string }> = {
                        idle: { title: "Trạng thái chờ", desc: "Ảnh chờ tương tác mặc định", icon: "💤" },
                        speaking: { title: "Trạng thái nói", desc: "Khi phát âm thanh lời nói", icon: "🔊" },
                        listening: { title: "Trạng thái nghe", desc: "Khi thu âm giọng học sinh", icon: "🎤" },
                        thinking: { title: "Trạng thái nghĩ", desc: "Khi đang xử lý kết quả AI", icon: "🧠" },
                        happy: { title: "Trạng thái vui vẻ", desc: "Khi học sinh trả lời đúng", icon: "🎉" },
                        encouraging: { title: "Trạng thái khuyến khích", desc: "Khi học sinh trả lời sai/cần gợi ý", icon: "💪" }
                      };
                      const details = stateNameMap[stateKey] || { title: stateKey, desc: "", icon: "🖼️" };
                      const imageUrl = editingMascot.images?.[stateKey as MascotState] || "";

                      return (
                        <div key={stateKey} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                <span>{details.icon}</span> {details.title}
                              </label>
                              {uploadingField === fieldKey && (
                                <span className="text-xs font-bold text-blue-500 flex items-center gap-1">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
                                </span>
                              )}
                            </div>
                            
                            <div className="flex gap-3 items-center">
                              <div className="w-16 h-16 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm">
                                {imageUrl ? (
                                  <img src={imageUrl} alt={details.title} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xl">🎭</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl cursor-pointer transition-colors border border-blue-200 dark:border-blue-900/50">
                                  <Upload className="w-3.5 h-3.5" />
                                  Chọn ảnh thiết bị
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, fieldKey)}
                                    disabled={uploadingField !== null}
                                  />
                                </label>
                                <p className="text-[10px] text-slate-400 font-bold mt-1.5 leading-snug">{details.desc}</p>
                              </div>
                            </div>
                          </div>
                          
                          <input 
                            type="text" 
                            value={imageUrl}
                            onChange={e => {
                              const newImages = { ...editingMascot.images, [stateKey]: e.target.value };
                              setEditingMascot({ ...editingMascot, images: newImages as any });
                            }}
                            placeholder="Hoặc dán URL: https://..."
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-400 text-ellipsis overflow-hidden"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: Dialogue Setup */}
              {activeTab === "dialogues" && (
                <div className="space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-300 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-900/50 text-xs font-bold leading-relaxed mb-2">
                    💬 Lời thoại bong bóng thoại hiển thị trên màn hình kiểm tra tương tác khi mascot chuyển đổi các trạng thái AI (Nói, Nghe, Nghĩ).
                  </div>

                  <div className="space-y-4 max-w-2xl">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">Trạng thái Nói 🔊</span>
                      <input 
                        type="text" 
                        value={editingMascot.dialogue?.speaking || ""} 
                        onChange={e => handleDialogueChange("speaking", e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-400" 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">Trạng thái Nghe 🎤</span>
                      <input 
                        type="text" 
                        value={editingMascot.dialogue?.listening || ""} 
                        onChange={e => handleDialogueChange("listening", e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-400" 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">Trạng thái Nghĩ 🧠</span>
                      <input 
                        type="text" 
                        value={editingMascot.dialogue?.thinking || ""} 
                        onChange={e => handleDialogueChange("thinking", e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-400" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: AI Generator */}
              {activeTab === "ai_generator" && (
                <div className="space-y-6">
                  {aiIsGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 max-w-xl mx-auto space-y-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 animate-spin flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">
                          Đang tạo bộ ảnh Mascot bằng AI...
                        </h4>
                        <p className="text-sm font-bold text-purple-600 dark:text-purple-400 animate-pulse">
                          {aiProgressStep}
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm font-medium leading-relaxed">
                          Hệ thống đang gọi API AI để tạo các trạng thái cử chỉ đồng nhất (Idle, Speaking, Thinking...) và tải trực tiếp lên Cloudinary. Quá trình này thường mất khoảng 10-20 giây.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-5">
                        <div className="bg-purple-50 dark:bg-purple-950/10 text-purple-700 dark:text-purple-300 p-4 rounded-2xl border border-purple-200/50 dark:border-purple-900/50 text-xs font-bold leading-relaxed">
                          ✨ **Tạo Mascot nhất quán bằng AI:** Bạn có thể nhập mô tả bằng tiếng Việt hoặc tiếng Anh về nhân vật mascot. Để có kết quả nhất quán nhất, hãy gán thêm mô tả phong cách (Ví dụ: `Pixar 3D cartoon style`, `isolated flat background`).
                        </div>

                        {/* Prompt Input */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500">Mô tả Mascot bằng lời (Prompt)</label>
                          <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Ví dụ: Một chú gấu trúc tròn trịa dễ thương đang mặc áo phao xanh lá, phong cách hoạt hình 3D Pixar, nền xám nhạt."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-purple-400 min-h-[100px]"
                          />
                        </div>

                        {/* Reference Image Input */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500">Hoặc ảnh tham chiếu làm mẫu (Vision AI)</label>
                          
                          {aiReferencePreview ? (
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl">
                              <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 relative shrink-0">
                                <img src={aiReferencePreview} alt="Reference Preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Đã chọn ảnh tham chiếu</p>
                                <p className="text-[10px] text-slate-400 font-bold">Hệ thống sẽ dùng Vision AI để phân tích và giữ nguyên phong cách nhân vật này.</p>
                              </div>
                              <button
                                type="button"
                                onClick={clearReferenceImage}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 rounded-2xl cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/20 group">
                              <Upload className="w-8 h-8 text-slate-400 group-hover:text-purple-500 transition-colors mb-2" />
                              <span className="text-xs font-black text-slate-600 dark:text-slate-300 group-hover:text-purple-500 transition-colors">Tải lên ảnh mẫu tham khảo</span>
                              <span className="text-[10px] text-slate-400 font-bold mt-1">Hỗ trợ PNG, JPG, JPEG</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleReferenceImageChange}
                              />
                            </label>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleAIGenerate}
                            disabled={!aiPrompt && !aiReferenceImage}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black shadow-lg shadow-purple-200 dark:shadow-none hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none uppercase text-xs tracking-wider"
                          >
                            <Sparkles className="w-4 h-4" />
                            Bắt đầu tạo bộ ảnh AI (6 trạng thái)
                          </button>
                        </div>
                      </div>

                      {/* Right: Side Preview Information */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-4">
                        <h5 className="text-xs font-black uppercase text-slate-500">Cách hoạt động</h5>
                        <ul className="text-xs font-bold text-slate-600 dark:text-slate-400 space-y-3 list-disc pl-4 leading-relaxed">
                          <li>AI sẽ phân tích Prompt hoặc ảnh tham chiếu của bạn.</li>
                          <li>Tạo ra **6 tư thế cảm xúc khác nhau** dựa trên mô tả chung để đảm bảo tính nhất quán của nhân vật.</li>
                          <li>Sau khi ảnh được tạo thành công, toàn bộ ảnh sẽ được tải lên tài khoản Cloudinary của bạn.</li>
                          <li>Các ô đường dẫn URL ở tab **Ảnh Trạng Thái** sẽ tự động được điền.</li>
                        </ul>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* Save Alert */}
              {saveSuccess && (
                <div className="mt-5 bg-emerald-50 text-emerald-600 p-3 rounded-xl border border-emerald-200 font-bold flex items-center justify-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-5 h-5" /> Đã lưu thành công!
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setEditingMascot(null)} 
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Huỷ
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving || uploadingField !== null || aiIsGenerating} 
                  className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-200 dark:shadow-none transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isCreating ? "Tạo Mascot" : "Lưu thay đổi"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
