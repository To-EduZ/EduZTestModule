"use client";

import React, { useEffect, useState } from "react";
import { Database, Plus, RefreshCw, Trash2, Edit3, Settings, CheckCircle2, AlertCircle, Save, Layers } from "lucide-react";

interface TestSection {
  type: "warmup" | "picture" | "reading" | "writing" | "custom_speaking";
  name: string;
  timeLimit?: number;
  questionIds: string[];
  config?: {
    picCount?: number;
    wordCount?: number;
    aiPromptOverride?: string;
  };
}

interface TestPaper {
  id: string;
  name: string;
  moduleType: "interactive" | "yle";
  status: "draft" | "published";
  testCode?: string;
  centerId?: string;
  questionIds: string[];
  sections?: TestSection[];
  _id?: string;
}

interface AppConfig {
  interactiveMode: "fixed" | "random";
  interactiveFixedTestId: string;
  yleMode: "fixed" | "random";
  yleFixedTestId: string;
}

export default function TestPaperManager() {
  const [papers, setPapers] = useState<TestPaper[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states for Create/Edit
  const [isEditing, setIsEditing] = useState(false);
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formModule, setFormModule] = useState<"interactive" | "yle">("yle");
  const [formStatus, setFormStatus] = useState<"draft" | "published">("draft");
  const [formQuestions, setFormQuestions] = useState<string>(""); // Still keep for YLE
  const [formTestCode, setFormTestCode] = useState("");
  const [formCenterId, setFormCenterId] = useState("");
  const [formSections, setFormSections] = useState<TestSection[]>([]);

  // Section Sub-form states
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [secType, setSecType] = useState<"warmup" | "picture" | "reading" | "writing" | "custom_speaking">("warmup");
  const [secName, setSecName] = useState("Khởi động (Warm-up)");
  const [secTimeLimit, setSecTimeLimit] = useState("");
  const [secPicCount, setSecPicCount] = useState("2");
  const [secWordCount, setSecWordCount] = useState("");
  const [secAiPrompt, setSecAiPrompt] = useState("");
  const [secQuestions, setSecQuestions] = useState<string[]>([]);

  // Available questions lookup
  const [yleQIds, setYleQIds] = useState<string[]>([]);
  const [interactiveQIds, setInteractiveQIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    fetchQuestions();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [papersRes, configRes] = await Promise.all([
        fetch("/api/test-papers"),
        fetch("/api/app-config")
      ]);
      const p = await papersRes.json();
      const c = await configRes.json();
      if (p.success) setPapers(p.data);
      if (c.success) setConfig(c.data);
    } catch (err: any) {
      showToast("error", "Lỗi tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const yleRes = await fetch("/api/cambridge-questions");
      const intRes = await fetch("/api/questions");
      const y = await yleRes.json();
      const i = await intRes.json();
      if (y.success) setYleQIds(y.data.map((q: any) => q.id));
      if (i.success) setInteractiveQIds(i.data.map((q: any) => q.id));
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      const res = await fetch("/api/app-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Đã lưu cài đặt hiển thị!");
      } else throw new Error(data.error);
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormId("");
    setFormName("");
    setFormModule("yle");
    setFormStatus("draft");
    setFormQuestions("");
    setFormTestCode("");
    setFormCenterId("");
    setFormSections([]);
    
    // Reset section fields
    setEditingSectionIndex(null);
    setSecType("warmup");
    setSecName("Khởi động (Warm-up)");
    setSecTimeLimit("");
    setSecPicCount("2");
    setSecWordCount("");
    setSecAiPrompt("");
    setSecQuestions([]);
  };

  const handleEdit = (p: TestPaper) => {
    setIsEditing(true);
    setFormId(p.id);
    setFormName(p.name);
    setFormModule(p.moduleType);
    setFormStatus(p.status);
    setFormQuestions(p.questionIds.join(", "));
    setFormTestCode(p.testCode || "");
    setFormCenterId(p.centerId || "");
    setFormSections(p.sections || []);

    // Reset section edit mode
    setEditingSectionIndex(null);
    setSecType("warmup");
    setSecName("Khởi động (Warm-up)");
    setSecTimeLimit("");
    setSecPicCount("2");
    setSecWordCount("");
    setSecAiPrompt("");
    setSecQuestions([]);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa đề thi này?")) return;
    try {
      const res = await fetch(`/api/test-papers?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showToast("success", "Đã xóa đề!");
        fetchData();
        if (formId === id) resetForm();
      } else throw new Error(data.error);
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Section actions
  const handleAddSection = () => {
    if (!secName.trim()) {
      showToast("error", "Vui lòng nhập tên phần thi!");
      return;
    }
    const newSec: TestSection = {
      type: secType,
      name: secName.trim(),
      timeLimit: secTimeLimit ? Number(secTimeLimit) : undefined,
      questionIds: secQuestions,
      config: {
        picCount: secType === "picture" ? Number(secPicCount) : undefined,
        wordCount: secType === "reading" && secWordCount ? Number(secWordCount) : undefined,
        aiPromptOverride: secType === "reading" && secAiPrompt.trim() ? secAiPrompt.trim() : undefined,
      }
    };

    if (editingSectionIndex !== null) {
      const updated = [...formSections];
      updated[editingSectionIndex] = newSec;
      setFormSections(updated);
      setEditingSectionIndex(null);
      showToast("success", "Đã cập nhật phần thi!");
    } else {
      setFormSections([...formSections, newSec]);
      showToast("success", "Đã thêm phần thi mới!");
    }

    // Reset sub-form to defaults
    setSecName("Khởi động (Warm-up)");
    setSecType("warmup");
    setSecTimeLimit("");
    setSecPicCount("2");
    setSecWordCount("");
    setSecAiPrompt("");
    setSecQuestions([]);
  };

  const handleEditSection = (index: number) => {
    const sec = formSections[index];
    setEditingSectionIndex(index);
    setSecType(sec.type);
    setSecName(sec.name);
    setSecTimeLimit(sec.timeLimit ? String(sec.timeLimit) : "");
    setSecPicCount(sec.config?.picCount ? String(sec.config.picCount) : "2");
    setSecWordCount(sec.config?.wordCount ? String(sec.config.wordCount) : "");
    setSecAiPrompt(sec.config?.aiPromptOverride || "");
    setSecQuestions(sec.questionIds || []);
  };

  const handleDeleteSection = (index: number) => {
    setFormSections(formSections.filter((_, i) => i !== index));
    if (editingSectionIndex === index) {
      setEditingSectionIndex(null);
    }
    showToast("success", "Đã xóa phần thi!");
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= formSections.length) return;
    const updated = [...formSections];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setFormSections(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formName.trim()) return showToast("error", "Vui lòng điền đủ mã và tên đề!");
    
    let payload: any = {
      id: formId.trim(),
      name: formName.trim(),
      moduleType: formModule,
      status: formStatus,
    };

    if (formModule === "interactive") {
      payload.testCode = formTestCode.trim() || undefined;
      payload.centerId = formCenterId.trim() || undefined;
      payload.sections = formSections;
      // Gather all questionIds from sections to support backward compatibility query
      payload.questionIds = Array.from(new Set(formSections.map(s => s.questionIds).flat()));
    } else {
      payload.questionIds = formQuestions.split(",").map(q => q.trim()).filter(Boolean);
    }

    try {
      const res = await fetch("/api/test-papers", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast("success", isEditing ? "Cập nhật đề thi thành công!" : "Tạo đề thi thành công!");
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const activeQuestions = formModule === "yle" ? yleQIds : interactiveQIds;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-lg border-2 flex items-center gap-3 animate-slide-left ${toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-800 border-red-300"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Global Config */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-indigo-200 dark:border-indigo-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
            <Settings className="w-6 h-6" /> Cài đặt Hiển thị Web
          </h2>
          <button onClick={handleSaveConfig} className="btn-3d-blue px-4 py-2 font-black text-sm flex items-center gap-2">
            <Save className="w-4 h-4" /> LƯU CÀI ĐẶT
          </button>
        </div>
        
        {config && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* YLE Module Config */}
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-800">
              <h3 className="font-black text-amber-800 dark:text-amber-400 mb-3">🏆 Cambridge YLE Module</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <input type="radio" checked={config.yleMode === "random"} onChange={() => setConfig({...config, yleMode: "random"})} /> 
                  Ngẫu nhiên (chọn 1 đề published bất kỳ)
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <input type="radio" checked={config.yleMode === "fixed"} onChange={() => setConfig({...config, yleMode: "fixed"})} /> 
                  Cố định 1 đề cụ thể
                </label>
                {config.yleMode === "fixed" && (
                  <select 
                    value={config.yleFixedTestId} 
                    onChange={e => setConfig({...config, yleFixedTestId: e.target.value})}
                    className="w-full mt-2 bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Chọn đề thi --</option>
                    {papers.filter(p => p.moduleType === "yle").map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id}) - {p.status}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Interactive Module Config */}
            <div className="bg-sky-50 dark:bg-sky-950/30 p-4 rounded-2xl border-2 border-sky-200 dark:border-sky-800">
              <h3 className="font-black text-sky-800 dark:text-sky-400 mb-3">🎤 Interactive Speaking Module</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <input type="radio" checked={config.interactiveMode === "random"} onChange={() => setConfig({...config, interactiveMode: "random"})} /> 
                  Ngẫu nhiên (chọn 1 đề published bất kỳ)
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <input type="radio" checked={config.interactiveMode === "fixed"} onChange={() => setConfig({...config, interactiveMode: "fixed"})} /> 
                  Cố định 1 đề cụ thể
                </label>
                {config.interactiveMode === "fixed" && (
                  <select 
                    value={config.interactiveFixedTestId} 
                    onChange={e => setConfig({...config, interactiveFixedTestId: e.target.value})}
                    className="w-full mt-2 bg-white dark:bg-slate-800 border-2 border-sky-300 dark:border-sky-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Chọn đề thi --</option>
                    {papers.filter(p => p.moduleType === "interactive").map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id}) - {p.status}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Build Đề */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 dark:border-slate-800 p-6 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Plus className="w-5 h-5" /> {isEditing ? `Sửa đề: ${formId}` : "Tạo Đề Mới"}
            </h3>
            {isEditing && (
              <button onClick={resetForm} className="btn-3d-gray px-3 py-1 text-xs font-black">Hủy Sửa</button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Mã đề (ID) *</label>
                <input required value={formId} onChange={e => setFormId(e.target.value)} disabled={isEditing} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold text-sm" placeholder="TEST_01" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Trạng thái</label>
                <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold text-sm">
                  <option value="draft">Nháp (Draft)</option>
                  <option value="published">Xuất bản (Published)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-black text-slate-500 mb-1">Tên đề thi *</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold text-sm" placeholder="Đề thi 01..." />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-black text-slate-500 mb-1">Thuộc Module</label>
                <select value={formModule} onChange={e => {setFormModule(e.target.value as any); setFormQuestions("");}} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold text-xs">
                  <option value="yle">Cambridge YLE (MCQ)</option>
                  <option value="interactive">Bài Test Tương Tác</option>
                </select>
              </div>
              
              {formModule === "interactive" && (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1">Mã phòng thi</label>
                    <input value={formTestCode} onChange={e => setFormTestCode(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold text-xs" placeholder="MID_TERM_01" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1">Mã Trung tâm</label>
                    <input value={formCenterId} onChange={e => setFormCenterId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold text-xs" placeholder="CENTER_A" />
                  </div>
                </>
              )}
            </div>

            {formModule === "yle" ? (
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 flex items-center justify-between">
                  <span>Chọn các câu hỏi vào đề (Tick để chọn)</span>
                  <span className="text-indigo-500">{formQuestions.split(",").filter(Boolean).length} / {activeQuestions.length}</span>
                </label>
                
                <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeQuestions.map(qid => {
                    const isChecked = formQuestions.split(",").map(s => s.trim()).includes(qid);
                    return (
                      <label key={qid} className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-colors ${isChecked ? "bg-indigo-100 dark:bg-indigo-900 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-100" : "bg-white dark:bg-slate-700 border-transparent text-slate-600 dark:text-slate-300"}`}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            let current = formQuestions.split(",").map(s => s.trim()).filter(Boolean);
                            if (e.target.checked) current.push(qid);
                            else current = current.filter(id => id !== qid);
                            setFormQuestions(current.join(", "));
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold truncate">{qid}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Cấu hình Sections dành riêng cho Đề thi tương tác */
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 flex items-center gap-1">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Danh sách phần thi (Sections) ({formSections.length})
                  </label>
                  
                  {formSections.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                      Chưa có phần thi nào. Hãy thêm ở bảng phía dưới!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {formSections.map((sec, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                                #{idx + 1} {sec.type}
                              </span>
                              <span className="text-xs font-black truncate text-slate-800 dark:text-slate-100">{sec.name}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
                              {sec.questionIds.length} câu hỏi {sec.timeLimit ? ` | Hạn: ${sec.timeLimit}s` : ""}
                              {sec.config?.picCount ? ` | Số ảnh: ${sec.config.picCount}` : ""}
                              {sec.config?.aiPromptOverride ? " | Có custom AI Story" : ""}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <button type="button" onClick={() => moveSection(idx, "up")} disabled={idx === 0} className="p-1 text-slate-400 hover:text-indigo-500 disabled:opacity-30">
                              ▲
                            </button>
                            <button type="button" onClick={() => moveSection(idx, "down")} disabled={idx === formSections.length - 1} className="p-1 text-slate-400 hover:text-indigo-500 disabled:opacity-30">
                              ▼
                            </button>
                            <button type="button" onClick={() => handleEditSection(idx)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDeleteSection(idx)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-form Thêm/Sửa Section */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-indigo-200 dark:border-indigo-900 p-3 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                    <span>{editingSectionIndex !== null ? `✍️ Sửa Phần Thi #${editingSectionIndex + 1}` : "➕ Thêm Phần Thi"}</span>
                    {editingSectionIndex !== null && (
                      <button type="button" onClick={() => {
                        setEditingSectionIndex(null);
                        setSecName("Khởi động (Warm-up)");
                        setSecQuestions([]);
                        setSecAiPrompt("");
                      }} className="text-[10px] text-slate-400 underline font-bold">Hủy sửa</button>
                    )}
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-0.5">Loại phần thi</label>
                      <select value={secType} onChange={e => {
                        const val = e.target.value as any;
                        setSecType(val);
                        if (val === "warmup") setSecName("Khởi động (Warm-up)");
                        else if (val === "picture") setSecName("Miêu tả tranh (Picture Description)");
                        else if (val === "reading") setSecName("Tập đọc câu chuyện (Reading)");
                        else if (val === "writing") setSecName("Đánh vần từ vựng (Spelling)");
                        else if (val === "custom_speaking") setSecName("Hội thoại tự do (Speaking)");
                      }} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 text-xs font-bold">
                        <option value="warmup">Warm-up (Khởi động)</option>
                        <option value="picture">Picture (Tả tranh)</option>
                        <option value="reading">Reading (Tập đọc)</option>
                        <option value="writing">Writing (Spelling)</option>
                        <option value="custom_speaking">Speaking (Tự do)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-0.5">Thời gian tối đa (giây)</label>
                      <input type="number" value={secTimeLimit} onChange={e => setSecTimeLimit(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1 text-xs font-bold" placeholder="Không giới hạn" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-0.5">Tên hiển thị phần thi *</label>
                    <input value={secName} onChange={e => setSecName(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1 text-xs font-bold" placeholder="Nhập tên..." />
                  </div>

                  {secType === "picture" && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-0.5">Số lượng tranh cần tả trong phần thi</label>
                      <select value={secPicCount} onChange={e => setSecPicCount(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1 text-xs font-bold">
                        <option value="1">1 Bức tranh (Mô tả)</option>
                        <option value="2">2 Bức tranh (Mô tả + Tìm điểm khác biệt)</option>
                        <option value="3">3 Bức tranh</option>
                      </select>
                    </div>
                  )}

                  {secType === "reading" && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-0.5">Giới hạn số từ câu chuyện</label>
                        <input type="number" value={secWordCount} onChange={e => setSecWordCount(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1 text-xs font-bold" placeholder="Mặc định (40-50 từ)" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-0.5 flex items-center justify-between">
                          <span>Custom AI Prompt cho story</span>
                        </label>
                        <textarea value={secAiPrompt} onChange={e => setSecAiPrompt(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1 text-xs font-bold h-12 resize-none" placeholder="Ví dụ: Tạo câu chuyện dài hơn (khoảng 80-100 từ) và hài hước hơn..." />
                      </div>
                    </div>
                  )}

                  {(secType === "picture" || secType === "warmup" || secType === "custom_speaking") && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1">
                        Chọn câu hỏi riêng cho phần thi này ({secQuestions.length})
                      </label>
                      <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-2 h-28 overflow-y-auto grid grid-cols-2 gap-1.5">
                        {activeQuestions.map(qid => {
                          const isChecked = secQuestions.includes(qid);
                          return (
                            <label key={qid} className={`flex items-center gap-1.5 p-1.5 rounded-lg border-2 cursor-pointer transition-colors ${isChecked ? "bg-indigo-50 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100" : "bg-white dark:bg-slate-700 border-transparent text-slate-600 dark:text-slate-300"}`}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setSecQuestions([...secQuestions, qid]);
                                  else setSecQuestions(secQuestions.filter(id => id !== qid));
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-[10px] font-bold truncate">{qid}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button type="button" onClick={handleAddSection} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-black transition-colors shadow-sm">
                    {editingSectionIndex !== null ? "💾 LƯU CẬP NHẬT PHẦN THI" : "➕ THÊM PHẦN THI NÀY"}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="btn-3d-blue w-full py-3 font-black mt-2">
              {isEditing ? "CẬP NHẬT ĐỀ THI" : "TẠO ĐỀ THI"}
            </button>
          </form>
        </div>

        {/* Danh sách đề */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 dark:border-slate-800 p-6 shadow-lg h-[680px] flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Database className="w-5 h-5" /> Quản Lý Đề ({papers.length})
            </h3>
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-500 bg-slate-100 dark:bg-slate-800 rounded-full">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {papers.map(p => (
              <div key={p.id} className="border-2 border-slate-100 dark:border-slate-700 p-3 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md text-xs mr-2">{p.id}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${p.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{p.status}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-500 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.name}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded">Module: {p.moduleType}</span>
                  {p.testCode && <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded">Mã thi: {p.testCode}</span>}
                  {p.centerId && <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">Trung tâm: {p.centerId}</span>}
                  {p.moduleType === "interactive" && p.sections && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">{p.sections.length} phần thi</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
