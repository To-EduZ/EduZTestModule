"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Upload,
  Database,
  Loader2,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Trash2,
  PenTool,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";

interface CambridgeQuestionData {
  _id?: string;
  id: string;
  section: "language-use" | "listening";
  part: number;
  taskNumber: number;
  questionNumberInTask: number;
  type: string;
  testingFocus: string;
  dialogue?: string;
  passage?: string;
  gapLabel?: string;
  audioText?: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  images?: string[];
  createdAt?: string;
}

export default function YLEImport() {
  const [questions, setQuestions] = useState<CambridgeQuestionData[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");

  const [qId, setQId] = useState("");
  const [section, setSection] = useState<"language-use" | "listening">("language-use");
  const [part, setPart] = useState("1");
  const [taskNumber, setTaskNumber] = useState("1");
  const [questionNumberInTask, setQuestionNumberInTask] = useState("1");
  const [type, setType] = useState("dialogue-mcq");
  const [testingFocus, setTestingFocus] = useState("");
  const [dialogue, setDialogue] = useState("");
  const [passage, setPassage] = useState("");
  const [gapLabel, setGapLabel] = useState("");
  const [audioText, setAudioText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState("A, B, C");
  const [correctAnswer, setCorrectAnswer] = useState("");
  
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeImageFile, setAnalyzeImageFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const analyzeInputRef = useRef<HTMLInputElement>(null);

  const fetchQuestions = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/cambridge-questions");
      const json = await res.json();
      if (json.success && json.data) {
        setQuestions(json.data);
      }
    } catch (err: any) {
      setListError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const resetForm = () => {
    setQId("");
    setSection("language-use");
    setPart("1");
    setTaskNumber("1");
    setQuestionNumberInTask("1");
    setType("dialogue-mcq");
    setTestingFocus("");
    setDialogue("");
    setPassage("");
    setGapLabel("");
    setAudioText("");
    setQuestionText("");
    setOptions("A, B, C");
    setCorrectAnswer("");
    setImageFiles([null, null, null]);
    setImagePreviews([null, null, null]);
    setIsEditing(false);
    setEditingId("");
  };

  const handleEdit = (q: CambridgeQuestionData) => {
    setIsEditing(true);
    setEditingId(q.id);
    
    setQId(q.id);
    setSection(q.section);
    setPart(String(q.part));
    setTaskNumber(String(q.taskNumber));
    setQuestionNumberInTask(String(q.questionNumberInTask));
    setType(q.type);
    setTestingFocus(q.testingFocus || "");
    setDialogue(q.dialogue || "");
    setPassage(q.passage || "");
    setGapLabel(q.gapLabel || "");
    setAudioText(q.audioText || "");
    setQuestionText(q.questionText || "");
    setOptions(q.options ? q.options.join(", ") : "");
    setCorrectAnswer(q.correctAnswer || "");
    
    const previews = [null, null, null] as (string | null)[];
    if (q.images) {
      for (let i = 0; i < q.images.length; i++) {
        previews[i] = q.images[i];
      }
    }
    setImagePreviews(previews);
    setImageFiles([null, null, null]);
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa câu hỏi YLE này?")) return;
    try {
      const res = await fetch(`/api/cambridge-questions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showToast("success", "Đã xóa thành công!");
        fetchQuestions();
        if (isEditing && editingId === id) resetForm();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qId.trim()) return showToast("error", "ID không được để trống");
    if (!questionText.trim()) return showToast("error", "Question Text không được để trống");
    if (!correctAnswer.trim()) return showToast("error", "Correct Answer không được để trống");

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      const parsedOptions = options.split(",").map(s => s.trim()).filter(Boolean);
      
      const payload: any = {
        id: qId.trim(),
        section,
        part: Number(part),
        taskNumber: Number(taskNumber),
        questionNumberInTask: Number(questionNumberInTask),
        type,
        testingFocus: testingFocus.trim(),
        questionText: questionText.trim(),
        options: parsedOptions,
        correctAnswer: correctAnswer.trim(),
      };
      
      if (dialogue.trim()) payload.dialogue = dialogue.trim();
      if (passage.trim()) payload.passage = passage.trim();
      if (gapLabel.trim()) payload.gapLabel = gapLabel.trim();
      if (audioText.trim()) payload.audioText = audioText.trim();
      
      // Preserve existing images in edit mode if not overridden
      if (isEditing) {
        payload.images = imagePreviews.filter(Boolean);
      }

      formData.append("questionData", JSON.stringify(payload));
      
      imageFiles.forEach((file, idx) => {
        if (file) {
          formData.append(`image_${idx}`, file);
        }
      });

      const res = await fetch("/api/cambridge-questions", {
        method: isEditing ? "PUT" : "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("success", "Lưu câu hỏi thành công!");
      resetForm();
      fetchQuestions();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoAnalyze = async () => {
    if (!analyzeImageFile) return showToast("error", "Hãy chọn ảnh/PDF đề bài để AI phân tích!");
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", analyzeImageFile);
      
      const res = await fetch("/api/cambridge-questions/analyze", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      const d = json.data;
      setQId(d.id || "");
      setSection(d.section || "language-use");
      setPart(String(d.part || 1));
      setTaskNumber(String(d.taskNumber || 1));
      setQuestionNumberInTask(String(d.questionNumberInTask || 1));
      setType(d.type || "dialogue-mcq");
      setTestingFocus(d.testingFocus || "");
      setDialogue(d.dialogue || "");
      setPassage(d.passage || "");
      setGapLabel(d.gapLabel || "");
      setAudioText(d.audioText || "");
      setQuestionText(d.questionText || "");
      setOptions(d.options ? d.options.join(", ") : "");
      setCorrectAnswer(d.correctAnswer || "");
      
      showToast("success", "AI đã phân tích xong! Hãy kiểm tra lại dữ liệu bên dưới.");
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-lg border-2 flex items-center gap-3 animate-slide-left ${toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-800 border-red-300"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Intro */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-200 dark:border-amber-800 p-6 flex flex-col md:flex-row gap-6 shadow-xl">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
            <Database className="w-6 h-6" /> Số Hóa Đề Thi Cambridge YLE
          </h2>
          <p className="text-sm font-semibold text-slate-500 mb-4">
            Module này dùng cho bài test đánh giá năng lực đầu vào theo chuẩn Cambridge (MCQ, Gapped text, Listening Image).
          </p>
          
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border-2 border-amber-200">
            <h3 className="text-sm font-black text-amber-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Dùng AI Phân Tích Đề Bài
            </h3>
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                accept="image/*,application/pdf"
                className="text-sm flex-1 bg-white dark:bg-slate-800 p-2 rounded-xl border-2"
                onChange={e => setAnalyzeImageFile(e.target.files?.[0] || null)}
                ref={analyzeInputRef}
              />
              <button 
                onClick={handleAutoAnalyze}
                disabled={isAnalyzing}
                className="btn-3d-orange px-4 py-2 font-black text-sm whitespace-nowrap"
              >
                {isAnalyzing ? "Đang xử lý..." : "AI Phân Tích"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORM */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800">
              {isEditing ? `📝 Sửa câu hỏi: ${qId}` : "➕ Thêm câu hỏi YLE mới"}
            </h3>
            {isEditing && (
              <button onClick={resetForm} className="btn-3d-gray px-3 py-1 text-xs font-black">Hủy Sửa</button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Mã câu hỏi (ID) *</label>
                <input required value={qId} onChange={e => setQId(e.target.value)} disabled={isEditing} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold" placeholder="VD: LU_P1_01" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Section *</label>
                <select value={section} onChange={e => setSection(e.target.value as any)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold">
                  <option value="language-use">Language Use</option>
                  <option value="listening">Listening</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Part *</label>
                <input required type="number" value={part} onChange={e => setPart(e.target.value)} className="w-full bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Task No. *</label>
                <input required type="number" value={taskNumber} onChange={e => setTaskNumber(e.target.value)} className="w-full bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Ques in Task *</label>
                <input required type="number" value={questionNumberInTask} onChange={e => setQuestionNumberInTask(e.target.value)} className="w-full bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Dạng bài (Type) *</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 font-bold">
                  <option value="dialogue-mcq">Dialogue MCQ (LU P1,P2)</option>
                  <option value="gapped-text">Gapped Text (LU P3)</option>
                  <option value="listening-image">Listening Image (L P1)</option>
                  <option value="listening-mcq">Listening MCQ (L P2)</option>
                  <option value="listening-detail">Listening Detail (L P3)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Testing Focus *</label>
                <input required value={testingFocus} onChange={e => setTestingFocus(e.target.value)} className="w-full bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold" placeholder="VD: Lexis, Grammar" />
              </div>
            </div>

            {/* Conditional fields based on type */}
            {type === "dialogue-mcq" && (
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Dialogue</label>
                <textarea value={dialogue} onChange={e => setDialogue(e.target.value)} rows={2} className="w-full bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold" placeholder="A: Hello _____ \nB: Hi" />
              </div>
            )}
            
            {type === "gapped-text" && (
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 mb-1">Passage</label>
                  <textarea value={passage} onChange={e => setPassage(e.target.value)} rows={2} className="w-full bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold" placeholder="I like __(1)__" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">Gap Label</label>
                  <input value={gapLabel} onChange={e => setGapLabel(e.target.value)} className="w-full bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold" placeholder="(1)" />
                </div>
              </div>
            )}
            
            {section === "listening" && (
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Audio Text (TTS)</label>
                <textarea value={audioText} onChange={e => setAudioText(e.target.value)} rows={2} className="w-full bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold" placeholder="Kịch bản nghe..." />
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1">Câu hỏi (Question Text) *</label>
              <input required value={questionText} onChange={e => setQuestionText(e.target.value)} className="w-full bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold" placeholder="VD: Chọn từ thích hợp điền vào chỗ trống" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Options (Cách nhau dấu phẩy) *</label>
                <input required value={options} onChange={e => setOptions(e.target.value)} className="w-full bg-slate-50 border-2 rounded-xl px-3 py-2 font-bold" placeholder="A, B, C" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">Correct Answer *</label>
                <input required value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)} className="w-full bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-xl px-3 py-2 font-bold" placeholder="VD: A" />
              </div>
            </div>
            
            {type === "listening-image" && (
              <div className="bg-sky-50 border-2 border-sky-200 p-4 rounded-2xl">
                <label className="block text-xs font-black text-sky-800 mb-2">3 Hình ảnh cho đáp án (Tùy chọn tải lên)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0,1,2].map(idx => (
                    <div key={idx} className="flex flex-col gap-1 items-center">
                      <div className="w-full aspect-square bg-white border-2 border-sky-200 rounded-xl overflow-hidden relative flex items-center justify-center">
                        {imagePreviews[idx] ? (
                          <Image src={imagePreviews[idx]!} alt={`Opt ${idx}`} fill className="object-cover" />
                        ) : <ImageIcon className="w-6 h-6 text-sky-200" />}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="w-full text-[10px]"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const newFiles = [...imageFiles]; newFiles[idx] = f; setImageFiles(newFiles);
                            const newPreviews = [...imagePreviews]; newPreviews[idx] = URL.createObjectURL(f); setImagePreviews(newPreviews);
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-3d-blue w-full py-3 font-black mt-4 flex items-center justify-center gap-2 text-lg">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {isEditing ? "LƯU CẬP NHẬT" : "TẢI LÊN DATA"}
            </button>
          </form>
        </div>

        {/* LIST */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-200 p-6 shadow-lg max-h-[800px] flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5" /> Ngân Hàng YLE ({questions.length})
            </h3>
            <button onClick={fetchQuestions} className="p-2 text-slate-400 hover:text-indigo-500 bg-slate-100 rounded-full">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {loadingList ? (
              <p className="text-center text-slate-400 py-10 font-bold">Đang tải...</p>
            ) : questions.length === 0 ? (
              <p className="text-center text-slate-400 py-10 font-bold">Chưa có câu hỏi YLE nào.</p>
            ) : (
              questions.map(q => (
                <div key={q.id} className="border-2 border-slate-100 p-3 rounded-2xl hover:border-indigo-200 bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md text-xs">{q.id}</span>
                      <span className="ml-2 text-xs font-bold text-slate-500">{q.section} - P{q.part}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(q)} className="p-1.5 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100"><PenTool className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(q.id)} className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-700 line-clamp-2">{q.questionText}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 line-clamp-1">Type: {q.type} | Ans: <span className="text-emerald-600">{q.correctAnswer}</span></p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
