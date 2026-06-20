"use client";

import React, { useEffect, useState } from "react";
import { Database, Plus, RefreshCw, Trash2, Edit3, Settings, CheckCircle2, AlertCircle, Save } from "lucide-react";

interface TestPaper {
  id: string;
  name: string;
  moduleType: "interactive" | "yle";
  status: "draft" | "published";
  questionIds: string[];
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
  const [formQuestions, setFormQuestions] = useState<string>("");

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
  };

  const handleEdit = (p: TestPaper) => {
    setIsEditing(true);
    setFormId(p.id);
    setFormName(p.name);
    setFormModule(p.moduleType);
    setFormStatus(p.status);
    setFormQuestions(p.questionIds.join(", "));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formName.trim()) return showToast("error", "Vui lòng điền đủ mã và tên đề!");
    
    const parsedQIds = formQuestions.split(",").map(q => q.trim()).filter(Boolean);
    const payload = {
      id: formId.trim(),
      name: formName.trim(),
      moduleType: formModule,
      status: formStatus,
      questionIds: parsedQIds
    };

    try {
      const res = await fetch("/api/test-papers", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast("success", isEditing ? "Cập nhật thành công!" : "Tạo đề thành công!");
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 dark:border-slate-800 p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
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
                <input required value={formId} onChange={e => setFormId(e.target.value)} disabled={isEditing} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold" placeholder="TEST_01" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Trạng thái</label>
                <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold">
                  <option value="draft">Nháp (Draft)</option>
                  <option value="published">Xuất bản (Published)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Tên đề thi *</label>
              <input required value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold" placeholder="Đề thi 01..." />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Thuộc Module</label>
              <select value={formModule} onChange={e => {setFormModule(e.target.value as any); setFormQuestions("");}} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 font-bold">
                <option value="yle">Cambridge YLE (MCQ)</option>
                <option value="interactive">Bài Test Tương Tác</option>
              </select>
            </div>

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

            <button type="submit" className="btn-3d-blue w-full py-3 font-black mt-2">
              {isEditing ? "CẬP NHẬT ĐỀ" : "TẠO ĐỀ THI"}
            </button>
          </form>
        </div>

        {/* Danh sách đề */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 dark:border-slate-800 p-6 shadow-lg h-[600px] flex flex-col">
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
                <p className="text-xs font-semibold text-slate-500 mt-1">Module: {p.moduleType} | {p.questionIds.length} câu hỏi</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
