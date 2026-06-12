"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Database,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  BookOpen,
  PenTool,
  X,
  Trash2,
  Filter,
  Layers,
  ChevronRight,
  RefreshCw,
  HelpCircle
} from "lucide-react";

interface QuestionData {
  _id: string;
  id: string;
  level: "Starters" | "Movers" | "Flyers";
  part: number;
  type: string;
  imagePath: string;
  contextTags: string[];
  topic?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  examinerScript: string;
  evaluationCriteria: {
    expectedKeywords: string[];
    targetGrammar: string[];
  };
  questions?: {
    examinerScript: string;
    expectedKeywords: string[];
    targetGrammar: string[];
    topic?: string;
    level?: "Starters" | "Movers" | "Flyers";
    difficulty?: "Easy" | "Medium" | "Hard";
    groupCode?: string;
    groupName?: string;
  }[];
  createdAt: string;
}

interface SubQuestionInput {
  examinerScript: string;
  expectedKeywords: string;
  targetGrammar: string;
  topic?: string;
  level?: "Starters" | "Movers" | "Flyers" | "";
  difficulty?: "Easy" | "Medium" | "Hard" | "";
  groupCode?: string;
  groupName?: string;
}

export default function CambridgeImportPage() {
  // Questions list state
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  
  // Table level filter tab: "All" | "Starters" | "Movers" | "Flyers"
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");

  // Form states
  const [qId, setQId] = useState("");
  const [level, setLevel] = useState<"Starters" | "Movers" | "Flyers">("Starters");
  const [part, setPart] = useState("1");
  const [type, setType] = useState("Scene_Description");
  const [contextTypes, setContextTypes] = useState<{ _id?: string; key: string; name: string }[]>([]);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newTypeKey, setNewTypeKey] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeKey, setEditTypeKey] = useState("");
  const [editTypeName, setEditTypeName] = useState("");

  const [skillGroups, setSkillGroups] = useState<{ _id?: string; code: string; name: string; description?: string }[]>([]);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [newGroupCode, setNewGroupCode] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [examinerScript, setExaminerScript] = useState("");
  const [contextTags, setContextTags] = useState("");
  const [expectedKeywords, setExpectedKeywords] = useState("");
  const [targetGrammar, setTargetGrammar] = useState("");
  const [subQuestions, setSubQuestions] = useState<SubQuestionInput[]>([
    { examinerScript: "", expectedKeywords: "", targetGrammar: "", topic: "", level: "", difficulty: "", groupCode: "", groupName: "" }
  ]);
  const [teacherWish, setTeacherWish] = useState("");
  
  // Image file & preview states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleAddSubQuestion = () => {
    setSubQuestions(prev => [
      ...prev,
      { examinerScript: "", expectedKeywords: "", targetGrammar: "", topic: "", level: "", difficulty: "", groupCode: "", groupName: "" }
    ]);
  };

  const handleRemoveSubQuestion = (idx: number) => {
    if (subQuestions.length <= 1) {
      alert("Học liệu phải có ít nhất 1 câu hỏi con!");
      return;
    }
    setSubQuestions(prev => prev.filter((_, i) => i !== idx));
    if (sandboxSubQIndex >= subQuestions.length - 1) {
      setSandboxSubQIndex(0);
      setSandboxResult(null);
    }
  };

  // Sandbox states & handlers
  const [sandboxSubQIndex, setSandboxSubQIndex] = useState(0);
  const [sandboxInput, setSandboxInput] = useState("");
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<{
    matchedKeywords: string[];
    missedKeywords: string[];
    targetGrammarMatched: string[];
    aiResponse: string;
    stageComplete: boolean;
  } | null>(null);

  const handleRunSandbox = async () => {
    if (!sandboxInput.trim()) {
      alert("Vui lòng nhập câu trả lời học sinh mẫu để thử nghiệm!");
      return;
    }

    const targetSubQ = subQuestions[sandboxSubQIndex];
    if (!targetSubQ || !targetSubQ.examinerScript.trim()) {
      alert("Vui lòng thiết lập kịch bản câu hỏi tương ứng trong form trước khi thử nghiệm!");
      return;
    }

    setSandboxLoading(true);
    setSandboxResult(null);

    try {
      const expectedKeywordsList = targetSubQ.expectedKeywords.split(",").map(s => s.trim()).filter(Boolean);
      const targetGrammarList = targetSubQ.targetGrammar.split(",").map(s => s.trim()).filter(Boolean);

      const spokenLower = sandboxInput.toLowerCase();
      const matchedKeywords = expectedKeywordsList.filter(kw => spokenLower.includes(kw.toLowerCase()));
      const missedKeywords = expectedKeywordsList.filter(kw => !spokenLower.includes(kw.toLowerCase()));
      const targetGrammarMatched = targetGrammarList.filter(g => spokenLower.includes(g.toLowerCase()));

      const parsedQuestions = subQuestions
        .filter(q => q.examinerScript.trim() !== "")
        .map((q, idx) => ({
          examinerScript: q.examinerScript.trim(),
          expectedKeywords: q.expectedKeywords.split(",").map(s => s.trim()).filter(Boolean),
          targetGrammar: q.targetGrammar.split(",").map(s => s.trim()).filter(Boolean),
          topic: q.topic?.trim() || topic.trim() || "General",
          level: q.level || level || "Starters",
          difficulty: q.difficulty || (idx < 2 ? "Easy" : idx < 4 ? "Medium" : "Hard")
        }));

      const formData = new FormData();
      formData.append("stage", "picture");
      formData.append("text", sandboxInput.trim());
      formData.append("chatHistory", JSON.stringify([
        { id: "1", role: "ai", content: targetSubQ.examinerScript.trim(), stage: "picture" }
      ]));
      formData.append("context", JSON.stringify({
        pictureIndex: 0,
        subQuestionIndex: sandboxSubQIndex,
        questions: parsedQuestions
      }));

      const res = await fetch("/api/interactive-chat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi gọi API chấm điểm AI.");
      }

      setSandboxResult({
        matchedKeywords,
        missedKeywords,
        targetGrammarMatched,
        aiResponse: data.aiResponse || "",
        stageComplete: data.stageComplete || false
      });
    } catch (err: any) {
      console.error("Lỗi Sandbox:", err);
      alert("Lỗi kiểm thử AI: " + err.message);
    } finally {
      setSandboxLoading(false);
    }
  };

  // Load questions list on mount
  const fetchQuestions = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await fetch("/api/questions");
      if (!res.ok) {
        throw new Error("Không thể tải danh sách học liệu hiện tại!");
      }
      const json = await res.json();
      if (json.success && json.data) {
        setQuestions(json.data);
      }
    } catch (err: any) {
      console.error("Lỗi lấy danh sách học liệu:", err);
      setListError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchContextTypes = async () => {
    try {
      const res = await fetch("/api/context-types");
      const data = await res.json();
      if (data.success) {
        setContextTypes(data.data);
        if (data.data.length > 0 && !data.data.some((t: any) => t.key === type)) {
          setType(data.data[0].key);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách loại bối cảnh:", err);
    }
  };

  const fetchSkillGroups = async () => {
    try {
      const res = await fetch("/api/skill-groups");
      const data = await res.json();
      if (data.success) {
        setSkillGroups(data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách nhóm kỹ năng:", err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchContextTypes();
    fetchSkillGroups();
  }, []);

  // Auto-fill LEVEL based on QID prefix (only when creating a new question)
  useEffect(() => {
    if (!qId || isEditing) return;
    const prefix = qId.trim().toUpperCase().split("_")[0];
    if (prefix === "ST") setLevel("Starters");
    else if (prefix === "MV") setLevel("Movers");
    else if (prefix === "FL") setLevel("Flyers");
  }, [qId, isEditing]);

  // Auto-fill PART based on QID pattern (e.g. ST_P2_03 -> Part 2, only when creating a new question)
  useEffect(() => {
    if (!qId || isEditing) return;
    const match = qId.match(/_P(\d+)_/i);
    if (match) {
      setPart(match[1]);
    } else {
      setPart("1");
    }
  }, [qId, isEditing]);

  const handleCreateType = async () => {
    if (!newTypeKey.trim() || !newTypeName.trim()) {
      alert("Vui lòng điền đầy đủ Mã Key và Tên hiển thị!");
      return;
    }
    try {
      const res = await fetch("/api/context-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newTypeKey.trim(), name: newTypeName.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố khi thêm loại bối cảnh");
      }
      showToast("success", `Đã thêm loại bối cảnh '${newTypeName}' thành công!`);
      setNewTypeKey("");
      setNewTypeName("");
      fetchContextTypes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateType = async (id: string) => {
    if (!editTypeKey.trim() || !editTypeName.trim()) {
      alert("Vui lòng điền đầy đủ Mã Key và Tên hiển thị!");
      return;
    }
    try {
      const res = await fetch("/api/context-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, key: editTypeKey.trim(), name: editTypeName.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố khi cập nhật loại bối cảnh");
      }
      showToast("success", "Cập nhật loại bối cảnh thành công!");
      setEditingTypeId(null);
      fetchContextTypes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!window.confirm("Bé/Admin có chắc chắn muốn xóa loại bối cảnh này? Các câu hỏi cũ sử dụng loại này sẽ không bị ảnh hưởng, nhưng loại bối cảnh sẽ biến mất khỏi danh sách chọn!")) return;
    try {
      const res = await fetch(`/api/context-types?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố khi xóa loại bối cảnh");
      }
      showToast("success", "Đã xóa loại bối cảnh thành công!");
      fetchContextTypes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddSkillGroup = async () => {
    if (!newGroupCode.trim() || !newGroupName.trim()) {
      alert("Vui lòng nhập đầy đủ Mã nhóm và Tên nhóm kỹ năng!");
      return;
    }
    try {
      const res = await fetch("/api/skill-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: newGroupCode.trim(), 
          name: newGroupName.trim(),
          description: newGroupDesc.trim() 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố khi thêm nhóm kỹ năng");
      }
      showToast("success", `Đã thêm nhóm kỹ năng '${newGroupName}' thành công!`);
      setNewGroupCode("");
      setNewGroupName("");
      setNewGroupDesc("");
      fetchSkillGroups();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSkillGroup = async (code: string) => {
    if (!window.confirm(`Admin có chắc chắn muốn xóa nhóm kỹ năng '${code}'? Các câu hỏi đã lưu sẽ không bị mất dữ liệu, nhưng nhóm kỹ năng này sẽ biến mất khỏi danh sách chọn của câu hỏi con.`)) return;
    try {
      const res = await fetch(`/api/skill-groups?id=${code}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố khi xóa nhóm kỹ năng");
      }
      showToast("success", "Đã xóa nhóm kỹ năng thành công!");
      fetchSkillGroups();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Drag & Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isPdf = file.name.endsWith(".pdf") || file.type === "application/pdf";
      const isImg = file.type.startsWith("image/");
      
      if (!isPdf && !isImg) {
        showToast("error", "Vui lòng chọn tệp tin hình ảnh hoặc tệp PDF Cambridge nhé!");
        return;
      }
      setImageFile(file);
      if (isImg) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.name.endsWith(".pdf") || file.type === "application/pdf";
      const isImg = file.type.startsWith("image/");
      
      if (!isPdf && !isImg) {
        showToast("error", "Vui lòng chọn tệp tin hình ảnh hoặc tệp PDF Cambridge nhé!");
        return;
      }
      setImageFile(file);
      if (isImg) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    // Auto clear toast after 6 seconds
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // Reset form helper
  const resetForm = () => {
    setQId("");
    setLevel("Starters");
    setPart("1");
    if (contextTypes.length > 0) {
      setType(contextTypes[0].key);
    } else {
      setType("Scene_Description");
    }
    setTopic("");
    setDifficulty("Medium");
    setExaminerScript("");
    setContextTags("");
    setExpectedKeywords("");
    setTargetGrammar("");
    setTeacherWish("");
    setSubQuestions([
      { examinerScript: "", expectedKeywords: "", targetGrammar: "", topic: "", level: "", difficulty: "", groupCode: "", groupName: "" }
    ]);
    removeImage();
    setIsEditing(false);
    setEditingId("");
  };

  // Handle Edit question (Load into form)
  const handleEdit = (q: QuestionData) => {
    setIsEditing(true);
    setEditingId(q.id);
    setQId(q.id);
    setLevel(q.level);
    setPart(String(q.part));
    
    setType(q.type);
    if (q.type && !contextTypes.some(t => t.key === q.type)) {
      setContextTypes(prev => [...prev, { key: q.type, name: q.type.replace(/_/g, " ") }]);
    }
    
    setTopic(q.topic || "General");
    setDifficulty(q.difficulty || "Medium");
    setExaminerScript(q.examinerScript || "");
    setContextTags(q.contextTags ? q.contextTags.join(", ") : "");
    setExpectedKeywords(q.evaluationCriteria?.expectedKeywords ? q.evaluationCriteria.expectedKeywords.join(", ") : "");
    setTargetGrammar(q.evaluationCriteria?.targetGrammar ? q.evaluationCriteria.targetGrammar.join(", ") : "");
    setTeacherWish("");
    
    // Load sub-questions array
    if (q.questions && q.questions.length > 0) {
      const mapped: SubQuestionInput[] = q.questions.map((sub) => ({
        examinerScript: sub.examinerScript || "",
        expectedKeywords: sub.expectedKeywords ? sub.expectedKeywords.join(", ") : "",
        targetGrammar: sub.targetGrammar ? sub.targetGrammar.join(", ") : "",
        topic: sub.topic || "",
        level: (sub.level || "") as any,
        difficulty: (sub.difficulty || "") as any,
        groupCode: sub.groupCode || "",
        groupName: sub.groupName || ""
      }));
      setSubQuestions(mapped);
    } else {
      // Fallback
      const initial: SubQuestionInput[] = [
        {
          examinerScript: q.examinerScript || "",
          expectedKeywords: q.evaluationCriteria?.expectedKeywords ? q.evaluationCriteria.expectedKeywords.join(", ") : "",
          targetGrammar: q.evaluationCriteria?.targetGrammar ? q.evaluationCriteria.targetGrammar.join(", ") : "",
          topic: "",
          level: "",
          difficulty: "",
          groupCode: "",
          groupName: ""
        }
      ];
      setSubQuestions(initial);
    }

    setImageFile(null);
    setImagePreview(q.imagePath); // display current Cloudinary URL
    
    // Smooth scroll to top form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Delete question
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      `Bé/Admin có chắc chắn muốn xóa vĩnh viễn học liệu mã '${id}' không? Hành động này không thể hoàn tác! 🗑️`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/questions?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố khi xóa học liệu!");
      }
      showToast("success", `Đã xóa thành công học liệu mã '${id}' khỏi cơ sở dữ liệu! 🗑️`);
      fetchQuestions();
      
      // If we are currently editing this question, reset the form
      if (isEditing && editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      showToast("error", err.message || "Không thể xóa học liệu!");
    }
  };

  // AI Auto-digitalizer function
  const handleAutoDigitalize = async () => {
    if (!imageFile) {
      showToast("error", "Bé/Admin vui lòng chọn hoặc kéo thả một tệp hình ảnh trước nhé! 📸");
      return;
    }

    setIsAnalyzing(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("teacherWish", teacherWish.trim());

      console.log("🤖 Đang tải ảnh lên AI Vision API để phân tích tự động...");
      const res = await fetch("/api/questions/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp lỗi phân tích ảnh.");
      }

      if (data.success && data.data) {
        const item = data.data;
        setQId(item.id || "");
        setLevel(item.level || "Starters");
        setPart(item.part ? String(item.part) : "1");
        
        const receivedType = item.type || "Scene_Description";
        setType(receivedType);
        if (receivedType && !contextTypes.some(t => t.key === receivedType)) {
          setContextTypes(prev => [...prev, { key: receivedType, name: receivedType.replace(/_/g, " ") }]);
        }
        
        setTopic(item.topic || "General");
        setDifficulty(item.difficulty || "Medium");
        setContextTags(item.contextTags ? item.contextTags.join(", ") : "");
        
        // Auto fill sub questions list
        if (item.questions && item.questions.length > 0) {
          const mappedQuestions: SubQuestionInput[] = item.questions.map((sub: any) => ({
            examinerScript: sub.examinerScript || "",
            expectedKeywords: sub.expectedKeywords ? sub.expectedKeywords.join(", ") : "",
            targetGrammar: sub.targetGrammar ? sub.targetGrammar.join(", ") : "",
            topic: sub.topic || "",
            level: (sub.level || "") as any,
            difficulty: (sub.difficulty || "") as any,
            groupCode: sub.groupCode || "",
            groupName: sub.groupName || ""
          }));
          setSubQuestions(mappedQuestions);

          // Also set fallback top levels
          setExaminerScript(mappedQuestions[0]?.examinerScript || "");
          setExpectedKeywords(mappedQuestions[0]?.expectedKeywords || "");
          setTargetGrammar(mappedQuestions[0]?.targetGrammar || "");
        } else {
          setExaminerScript(item.examinerScript || "");
          setExpectedKeywords(item.expectedKeywords ? item.expectedKeywords.join(", ") : "");
          setTargetGrammar(item.targetGrammar ? item.targetGrammar.join(", ") : "");
          
          const initial: SubQuestionInput[] = [
            {
              examinerScript: item.examinerScript || "",
              expectedKeywords: item.expectedKeywords ? item.expectedKeywords.join(", ") : "",
              targetGrammar: item.targetGrammar ? item.targetGrammar.join(", ") : "",
              topic: "",
              level: "",
              difficulty: "",
              groupCode: "",
              groupName: ""
            }
          ];
          setSubQuestions(initial);
        }

        showToast("success", "AI đã phân tích ảnh bóc tách và tự động điền đầy đủ siêu dữ liệu cực chuẩn Cambridge! Bạn hãy kiểm tra lại và nhấn nút lưu nhé! ✨🤖");
      }
    } catch (err: any) {
      console.error("Lỗi tự động điền bằng AI:", err);
      showToast("error", err.message || "Trí tuệ Nhân tạo phân tích ảnh bóc tách thất bại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Form Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!qId.trim()) {
      showToast("error", "Bé/Admin ơi, hãy nhập mã ID duy nhất cho học liệu nhé!");
      return;
    }
    
    const filledQuestions = subQuestions.filter(q => q.examinerScript.trim() !== "");
    if (filledQuestions.length === 0) {
      showToast("error", "Admin vui lòng nhập ít nhất kịch bản cho 1 câu hỏi con!");
      return;
    }
    
    if (!imageFile && !imagePreview) {
      showToast("error", "Admin cần tải lên hình ảnh bóc tách cắt từ tệp PDF đề thi!");
      return;
    }

    const partNum = parseInt(part, 10);
    if (isNaN(partNum)) {
      showToast("error", "Phần thi (Part) phải là một số nguyên hợp lệ!");
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("id", qId.trim());
      formData.append("level", level);
      formData.append("part", part);
      
      formData.append("type", type || "Scene_Description");
      formData.append("topic", topic.trim() || "General");
      formData.append("difficulty", difficulty);
      formData.append("contextTags", contextTags.trim());
      
      const parsedSubQuestions = subQuestions.map((q, idx) => ({
        examinerScript: q.examinerScript.trim(),
        expectedKeywords: q.expectedKeywords.split(",").map(s => s.trim()).filter(Boolean),
        targetGrammar: q.targetGrammar.split(",").map(s => s.trim()).filter(Boolean),
        topic: q.topic?.trim() || topic.trim() || "General",
        level: q.level || level || "Starters",
        difficulty: q.difficulty || (idx < 2 ? "Easy" : idx < 4 ? "Medium" : "Hard"),
        groupCode: q.groupCode?.trim() || "",
        groupName: q.groupName?.trim() || ""
      }));
      formData.append("questions", JSON.stringify(parsedSubQuestions));
      
      // Top level fallbacks for backwards compatibility
      const firstQ = filledQuestions[0];
      formData.append("examinerScript", firstQ.examinerScript.trim());
      formData.append("expectedKeywords", firstQ.expectedKeywords.trim());
      formData.append("targetGrammar", firstQ.targetGrammar.trim());
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      console.log(isEditing ? "📤 Đang cập nhật dữ liệu học liệu..." : "📤 Đang gửi dữ liệu học liệu lên Cloudinary & MongoDB...");
      const res = await fetch("/api/questions", {
        method: isEditing ? "PUT" : "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố không xác định khi upload!");
      }

      if (isEditing) {
        showToast("success", `Cập nhật học liệu mã '${qId}' thành công! 🎉`);
      } else {
        showToast("success", `Số hóa học liệu mã '${qId}' lên Cloudinary và cơ sở dữ liệu MongoDB thành công! 🎉`);
      }
      resetForm();
      // Re-fetch questions list
      fetchQuestions();
    } catch (err: any) {
      console.error("Lỗi gửi import:", err);
      showToast("error", err.message || "Không thể đồng bộ học liệu lên đám mây!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter questions dynamically
  const filteredQuestions = questions.filter((q) => {
    if (selectedFilter === "All") return true;
    return q.level === selectedFilter;
  });

  const levelBadges: Record<string, string> = {
    Starters: "bg-pink-100 text-pink-700 border-pink-300",
    Movers: "bg-amber-100 text-amber-700 border-amber-300",
    Flyers: "bg-blue-100 text-blue-700 border-blue-300",
  };

  const levelAnimals: Record<string, string> = {
    Starters: "🦛",
    Movers: "🐒",
    Flyers: "🦁",
  };

  return (
    <div className="w-full min-h-screen pb-20 relative bg-pastel-bg dark:bg-dark-bg flex flex-col font-sans">
      {/* Decorative Bubble Backgrounds */}
      <div className="bubble-bg top-24 left-10 w-24 h-24 animate-float" style={{ animationDelay: "1s" }} />
      <div className="bubble-bg bottom-16 right-16 w-28 h-28 animate-float" style={{ animationDelay: "3s" }} />

      {/* Navigation Header */}
      <header className="w-full bg-white dark:bg-slate-900 border-b-4 border-slate-100 dark:border-slate-700 py-3 md:py-4 px-3 md:px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/dashboard">
            <button className="btn-3d-gray px-4 py-2.5 text-xs font-black flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              QUAY VỀ
            </button>
          </Link>

          <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 md:px-4 py-1 md:py-1.5 rounded-2xl shadow-inner">
            <Layers className="w-5 h-5 text-indigo-500" />
            <span className="text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Cambridge Digitalizer</span>
          </div>

          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700">
            <span className="text-lg">☁️</span>
          </div>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="max-w-6xl w-full mx-auto px-3 md:px-4 mt-6 md:mt-8 flex flex-col gap-6 md:gap-8 flex-1">
        
        {/* Banner Alert Toast */}
        {toast && (
          <div
            className={`w-full p-4 rounded-3xl border-2 shadow-md flex items-start gap-3 animate-bounce-subtle z-20 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-6 h-6 shrink-0 text-rose-600" />
            )}
            <div className="flex-1">
              <h4 className="font-black text-sm uppercase tracking-wide">
                {toast.type === "success" ? "Thành Công Rực Rỡ!" : "Úp! Có lỗi rồi Admin ơi:"}
              </h4>
              <p className="text-xs font-bold mt-0.5 leading-relaxed font-sans">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Title block */}
        <div className="text-center md:text-left bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-4 border-indigo-100 dark:border-indigo-900 rounded-3xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex items-center justify-center text-5xl shadow-md text-white animate-pulse">
            📚
          </div>
          <div>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block">
              Hệ thống nhập học liệu Số hóa PDF
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-1">
              Cambridge YLE Learning Bank Digitalizer
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1 leading-relaxed">
              Trang công cụ dành riêng cho Quản trị viên của <strong className="text-indigo-600">HUB Xanh Digital University</strong> để cắt bóc tách đề thi Cambridge gốc (.pdf) thành các câu hỏi AI tương tác sinh động, lưu trữ đám mây Cloudinary và đồng bộ MongoDB.
            </p>
          </div>
        </div>

        {/* Form and Preview Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Import Form (8 cols on large) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 md:p-8 shadow-xl lg:col-span-8 flex flex-col gap-4 md:gap-6">
            {isEditing && (
              <div className="bg-amber-50 dark:bg-slate-850 border-2 border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300 rounded-2xl p-4 flex items-center justify-between animate-bounce-subtle shadow-sm select-none">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Đang ở chế độ chỉnh sửa học liệu</h4>
                    <p className="text-[11px] font-bold mt-0.5 opacity-80">Mã ID đang sửa: <strong className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{editingId}</strong></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-3d-gray px-3 py-1.5 text-[10px] font-black uppercase tracking-wider hover:scale-105 active:translate-y-0.5 cursor-pointer"
                >
                  Hủy chỉnh sửa
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <PenTool className="w-6 h-6 text-indigo-500" />
                {isEditing ? "Cập Nhật Học Liệu & Kịch Bản AI ✏️" : "Siêu dữ liệu Học liệu & Kịch bản AI"}
              </h3>
              
              <button
                type="button"
                onClick={handleAutoDigitalize}
                disabled={isAnalyzing || isSubmitting || !imageFile}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  !imageFile
                    ? "btn-3d-gray opacity-60 cursor-not-allowed"
                    : "btn-3d-purple animate-pulse hover:scale-105 active:translate-y-0.5"
                }`}
                title={!imageFile ? "Vui lòng chọn hoặc kéo thả tệp hình ảnh trước" : "Bấm để AI tự động phân tích và điền siêu dữ liệu"}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang bóc tách... 🤖
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Tự động điền AI ✨
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Row 1: ID, Level (Part is auto-filled and hidden) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-slate-700 dark:text-slate-305 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="qId">
                    Question ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="qId"
                    type="text"
                    required
                    disabled={isEditing}
                    value={qId}
                    onChange={(e) => setQId(e.target.value)}
                    placeholder="Ví dụ: ST_P1_03"
                    className={`w-full rounded-2xl border-2 p-3 text-sm font-extrabold outline-none transition-colors ${
                      isEditing
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed font-sans"
                        : "border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900"
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-1">
                    {isEditing ? "Không thể thay đổi Mã ID khi đang chỉnh sửa" : "Mã duy nhất: Cấp độ_Phần_Số câu (Ví dụ: ST_P1_03)"}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-305 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="level">
                    Cấp độ (Level) <span className="text-rose-500">*</span>
                  </label>
                  {(() => {
                    const detectedPrefix = qId.trim().toUpperCase().split("_")[0];
                    const isLevelAutoFilled = ["ST", "MV", "FL"].includes(detectedPrefix);
                    return (
                      <>
                        <select
                          id="level"
                          value={level}
                          onChange={(e) => setLevel(e.target.value as any)}
                          className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 p-3 text-sm font-extrabold outline-none transition-colors bg-white dark:bg-slate-900 cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                          <option value="Starters">Starters 🦛</option>
                          <option value="Movers">Movers 🐒</option>
                          <option value="Flyers">Flyers 🦁</option>
                        </select>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-1">
                          {isLevelAutoFilled ? "Tự động chọn theo mã prefix ID (có thể chỉnh sửa thủ công)" : "Tự điền dựa trên tiền tố ID (ST, MV, FL)"}
                        </span>
                      </>
                    );
                  })()}
                </div>

              </div>

              {/* Row 2: Type, Topic & Difficulty */}
              {/* Row 2: Type, Topic & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-slate-700 dark:text-slate-305 font-extrabold text-xs uppercase tracking-wide text-left" htmlFor="type">
                      Loại bối cảnh <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTypeManager(true)}
                      className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      ⚙️ Quản lý danh mục
                    </button>
                  </div>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 p-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900 cursor-pointer"
                  >
                    {contextTypes.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.name}
                      </option>
                    ))}
                    {contextTypes.length === 0 && (
                      <option value="Scene_Description">Scene Description (Mô tả tranh bối cảnh)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-305 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="topic">
                    Chủ đề học liệu (Topic) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="topic"
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ví dụ: Family, Animals, School life..."
                    className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 p-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-305 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="difficulty">
                    Độ khó (Difficulty) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 p-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900 cursor-pointer"
                  >
                    <option value="Easy">Easy (Dễ)</option>
                    <option value="Medium">Medium (Trung bình)</option>
                    <option value="Hard">Hard (Khó)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Context Tags */}
              <div>
                <label className="block text-slate-700 dark:text-slate-305 font-extrabold text-xs uppercase tracking-wide mb-1.5" htmlFor="tags">
                  Từ khóa bối cảnh (Context Tags)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={contextTags}
                  onChange={(e) => setContextTags(e.target.value)}
                  placeholder="beach, animals, family, swimming, sunny"
                  className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 p-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-1">Cách nhau bằng dấu phẩy (,)</span>
              </div>

              {/* Row 4: Speaking Questions Editor (Dynamic Question blocks) */}
              <div className="flex flex-col gap-5 border-t border-slate-100 pt-5 mt-2">
                <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Danh sách Câu hỏi Speaking trên cùng Bối cảnh ({subQuestions.length} câu)
                </h4>
                
                {subQuestions.map((q, idx) => (
                  <div key={idx} className="bg-slate-50/50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-4 md:p-5 flex flex-col gap-4 shadow-sm relative pt-6">
                    <span className="absolute -top-3 left-4 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Câu hỏi {idx + 1}
                    </span>

                    {subQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubQuestion(idx)}
                        className="absolute top-2.5 right-2.5 text-rose-500 hover:text-rose-750 p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors cursor-pointer"
                        title="Xóa câu hỏi con này"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                    
                    <div>
                      <label className="block text-slate-700 dark:text-slate-305 font-extrabold text-xs mb-1.5">
                        Kịch bản của Giám khảo AI (English Question) {idx === 0 && <span className="text-rose-555">*</span>}
                      </label>
                      <input
                        type="text"
                        required={idx === 0}
                        value={q.examinerScript}
                        onChange={(e) => {
                          const updated = [...subQuestions];
                          updated[idx].examinerScript = e.target.value;
                          setSubQuestions(updated);
                        }}
                        placeholder={`Ví dụ câu hỏi ${idx + 1}: Where is the cat? / What is the boy doing?`}
                        className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 p-2.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wide mb-1.5">
                          Từ khóa chấm điểm (Expected Keywords)
                        </label>
                        <input
                          type="text"
                          value={q.expectedKeywords}
                          onChange={(e) => {
                            const updated = [...subQuestions];
                            updated[idx].expectedKeywords = e.target.value;
                            setSubQuestions(updated);
                          }}
                          placeholder="Từ khóa cách nhau bằng dấu phẩy (,)"
                          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 p-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wide mb-1.5">
                          Cấu trúc ngữ pháp đích (Target Grammar)
                        </label>
                        <input
                          type="text"
                          value={q.targetGrammar}
                          onChange={(e) => {
                            const updated = [...subQuestions];
                            updated[idx].targetGrammar = e.target.value;
                            setSubQuestions(updated);
                          }}
                          placeholder="Mẫu ngữ pháp cách nhau bằng dấu phẩy (,)"
                          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 p-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wide mb-1.5">
                          Chủ đề câu hỏi (Topic override)
                        </label>
                        <input
                          type="text"
                          value={q.topic || ""}
                          onChange={(e) => {
                            const updated = [...subQuestions];
                            updated[idx].topic = e.target.value;
                            setSubQuestions(updated);
                          }}
                          placeholder="Mặc định dùng chung"
                          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 p-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wide mb-1.5">
                          Cấp độ (Level override)
                        </label>
                        <select
                          value={q.level || ""}
                          onChange={(e) => {
                            const updated = [...subQuestions];
                            updated[idx].level = e.target.value as any;
                            setSubQuestions(updated);
                          }}
                          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 p-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900 cursor-pointer"
                        >
                          <option value="">Dùng chung</option>
                          <option value="Starters">Starters 🦛</option>
                          <option value="Movers">Movers 🐒</option>
                          <option value="Flyers">Flyers 🦁</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wide mb-1.5">
                          Độ khó (Difficulty override)
                        </label>
                        <select
                          value={q.difficulty || ""}
                          onChange={(e) => {
                            const updated = [...subQuestions];
                            updated[idx].difficulty = e.target.value as any;
                            setSubQuestions(updated);
                          }}
                          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 p-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900 cursor-pointer"
                        >
                          <option value="">Dùng chung</option>
                          <option value="Easy">Easy (Dễ)</option>
                          <option value="Medium">Medium (Trung bình)</option>
                          <option value="Hard">Hard (Khó)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-slate-600 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wide">
                            Nhóm kỹ năng
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowGroupManager(true)}
                            className="text-[9px] font-black text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5 transition-colors cursor-pointer"
                          >
                            ⚙️ Quản lý nhóm
                          </button>
                        </div>
                        <select
                          value={
                            skillGroups.some(g => g.code === q.groupCode && g.name === q.groupName)
                              ? `${q.groupCode}|${q.groupName}`
                              : (q.groupCode || q.groupName ? "custom" : "")
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...subQuestions];
                            if (val === "custom") {
                              if (!updated[idx].groupCode) updated[idx].groupCode = "custom";
                              if (!updated[idx].groupName) updated[idx].groupName = "Custom Category";
                            } else if (val === "") {
                              updated[idx].groupCode = "";
                              updated[idx].groupName = "";
                            } else {
                              const [code, name] = val.split("|");
                              updated[idx].groupCode = code;
                              updated[idx].groupName = name;
                            }
                            setSubQuestions(updated);
                          }}
                          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 p-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900 cursor-pointer"
                        >
                          <option value="">Không phân nhóm (Dùng chung)</option>
                          {skillGroups.map((g) => (
                            <option key={g.code} value={`${g.code}|${g.name}`}>
                              {g.code} - {g.name} {g.description ? `(${g.description})` : ""}
                            </option>
                          ))}
                          <option value="custom">Khác (Tự nhập...)</option>
                        </select>
                      </div>

                      {((q.groupCode || q.groupName) && !skillGroups.some(g => g.code === q.groupCode && g.name === q.groupName)) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-800/50 pt-2 mt-2 col-span-1 md:col-span-5 animate-fadeIn">
                          <div>
                            <label className="block text-slate-600 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wide mb-1.5">
                              Mã nhóm tùy chỉnh
                            </label>
                            <input
                              type="text"
                              value={q.groupCode || ""}
                              onChange={(e) => {
                                const updated = [...subQuestions];
                                updated[idx].groupCode = e.target.value;
                                setSubQuestions(updated);
                              }}
                              placeholder="Ví dụ: 1.1"
                              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 p-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wide mb-1.5">
                              Tên nhóm kỹ năng tùy chỉnh
                            </label>
                            <input
                              type="text"
                              value={q.groupName || ""}
                              onChange={(e) => {
                                const updated = [...subQuestions];
                                updated[idx].groupName = e.target.value;
                                setSubQuestions(updated);
                              }}
                              placeholder="Ví dụ: Vocabulary"
                              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 p-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSubQuestion}
                  className="btn-3d-indigo py-3 px-6 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 self-start hover:scale-[1.02] cursor-pointer mt-1"
                >
                  <span>+ Thêm câu hỏi con</span>
                </button>
              </div>

              {/* Mobile image selector (shows up here only on smaller screens) */}
              <div className="lg:hidden">
                <label className="block text-slate-700 font-extrabold text-xs uppercase tracking-wide mb-1.5">
                  Tệp học liệu PDF hoặc ảnh minh họa <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="btn-3d-gray py-3 px-4 text-xs font-black shrink-0"
                  >
                    Chọn ảnh hoặc PDF 📄
                  </button>
                  {imageFile && (
                    <div className="flex-1 flex items-center gap-2 truncate text-xs font-bold text-slate-600 bg-slate-50 border p-2 rounded-xl">
                      <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{imageFile.name}</span>
                      <button type="button" onClick={removeImage} className="text-rose-500 hover:text-rose-700 ml-auto shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action tactical 3D buttons */}
              <div className="flex gap-3 border-t border-slate-100 pt-5 mt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="btn-3d-gray px-6 py-4 text-sm font-black uppercase tracking-wider shrink-0 disabled:opacity-50"
                >
                  {isEditing ? "HỦY SỬA ❌" : "Xóa trắng 🗑️"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isEditing ? "btn-3d-yellow text-slate-800" : "btn-3d-green"
                  } ${
                    isSubmitting ? "brightness-95 shadow-none translate-y-[4px]" : "hover:scale-[1.01]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isEditing ? "ĐANG CẬP NHẬT DỮ LIỆU..." : "ĐANG TẢI LÊN CLOUDINARY & LƯU DB..."}
                    </>
                  ) : isEditing ? (
                    <>
                      <PenTool className="w-5 h-5" />
                      CẬP NHẬT HỌC LIỆU 💾
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      IMPORT INTO ASSET BANK 🚀
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT: Image drag-drop preview & guidelines (4 cols on large) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Image Preview Box */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 shadow-xl relative overflow-hidden">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ImageIcon className="w-4.5 h-4.5 text-indigo-500" />
                Học liệu gốc (Ảnh / PDF)
              </h4>

              {/* Drag and Drop Container */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={!imageFile ? triggerFileInput : undefined}
                className={`w-full min-h-[220px] rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center select-none cursor-pointer ${
                  imageFile
                    ? "border-emerald-200 bg-emerald-50/10"
                    : isDragActive
                    ? "border-indigo-400 bg-indigo-50/40 scale-98"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="w-full h-full flex flex-col items-center justify-center relative group">
                    <img
                      src={imagePreview}
                      alt="Xem trước hình bóc tách"
                      className="max-h-[200px] object-contain rounded-2xl shadow-sm border border-slate-100 bg-white"
                    />
                    
                    {/* Hover delete button overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={removeImage}
                        className="bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all font-black"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : imageFile ? (
                  <div className="w-full h-full flex flex-col items-center justify-center relative group p-4 bg-rose-50/20 rounded-2xl border border-rose-100 animate-pulse-slow">
                    <div className="text-6xl animate-bounce mb-3" style={{ animationDuration: "3s" }}>📕</div>
                    <span className="text-xs font-black text-rose-600 block uppercase tracking-wider">Tệp tài liệu PDF</span>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1 truncate max-w-[200px]">{imageFile.name}</span>
                    
                    {/* Hover delete button overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={removeImage}
                        className="bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all font-black"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 border border-slate-200">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-xs font-black text-slate-600 block">Kéo & Thả ảnh / PDF đề thi vào đây</span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">hoặc click để duyệt tệp tin</span>
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md px-2 py-0.5 mt-3 font-semibold uppercase">
                      Hỗ trợ PNG, JPG, WEBP, PDF
                    </span>
                  </div>
                )}
              </div>

              {imageFile && (
                <div className="mt-4 flex flex-col gap-3 text-left">
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span className="truncate max-w-[200px]">{imageFile.name}</span>
                    <span>{(imageFile.size / 1024).toFixed(1)} KB</span>
                  </div>

                  {/* Textarea for teacher wishes */}
                  <div className="mt-1">
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 font-sans">
                      Nguyện vọng / Định hướng sư phạm (Tùy chọn) 💡
                    </label>
                    <textarea
                      rows={3}
                      value={teacherWish}
                      onChange={(e) => setTeacherWish(e.target.value)}
                      placeholder="Ví dụ: Chỉ hỏi màu sắc; tạo 3 câu hỏi; hỏi về con mèo..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-xs font-bold text-slate-705 dark:text-slate-200 outline-none focus:border-indigo-400 bg-white dark:bg-slate-900 resize-none font-sans"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDigitalize}
                    disabled={isAnalyzing || isSubmitting}
                    className="btn-3d-purple w-full py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        AI ĐANG PHÂN TÍCH ẢNH... 🤖
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4.5 h-4.5" />
                        Tự động điền bằng AI ✨
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* AI Sandbox Evaluation Test Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-indigo-200 dark:border-indigo-900 p-4 md:p-6 shadow-xl relative overflow-hidden">
              <span className="absolute top-2 right-4 text-2xl animate-pulse">🧪</span>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b pb-2">
                <span>AI Sandbox - Thử nghiệm nhanh</span>
              </h4>
              
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-4">
                Nhập thử một câu trả lời mẫu của học sinh để chạy thử nghiệm chấm điểm AI và xem phản hồi của giám khảo.
              </p>

              <div className="flex flex-col gap-3">
                {/* Select subquestion to test against */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-550 dark:text-slate-450 mb-1">
                    Chọn câu hỏi cần test
                  </label>
                  <select
                    value={sandboxSubQIndex}
                    onChange={(e) => {
                      setSandboxSubQIndex(parseInt(e.target.value, 10));
                      setSandboxResult(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900 cursor-pointer"
                  >
                    {subQuestions.map((q, idx) => (
                      <option key={idx} value={idx} disabled={!q.examinerScript.trim()}>
                        Câu hỏi {idx + 1}: {q.examinerScript.trim() ? `${q.examinerScript.substring(0, 30)}...` : "(Trống)"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Details info box */}
                {subQuestions[sandboxSubQIndex]?.examinerScript.trim() && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div><strong>Script:</strong> "{subQuestions[sandboxSubQIndex].examinerScript}"</div>
                    {subQuestions[sandboxSubQIndex].expectedKeywords.trim() && (
                      <div><strong>Từ khóa chấm:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-bold">{subQuestions[sandboxSubQIndex].expectedKeywords}</span></div>
                    )}
                    {subQuestions[sandboxSubQIndex].targetGrammar.trim() && (
                      <div><strong>Ngữ pháp đích:</strong> <span className="text-indigo-600 dark:text-indigo-400 font-bold">{subQuestions[sandboxSubQIndex].targetGrammar}</span></div>
                    )}
                  </div>
                )}

                {/* User transcription input */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-550 dark:text-slate-450 mb-1">
                    Câu trả lời của học viên (Sample text)
                  </label>
                  <textarea
                    rows={2}
                    value={sandboxInput}
                    onChange={(e) => setSandboxInput(e.target.value)}
                    placeholder="Ví dụ: I can see a monkey climbing a tall tree."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-xs font-bold text-slate-750 dark:text-slate-200 outline-none focus:border-indigo-400 bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleRunSandbox}
                  disabled={sandboxLoading || !sandboxInput.trim() || !subQuestions[sandboxSubQIndex]?.examinerScript.trim()}
                  className="btn-3d-indigo w-full py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                >
                  {sandboxLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý AI...
                    </>
                  ) : (
                    <>
                      <span>Chạy thử nghiệm AI ⚡</span>
                    </>
                  )}
                </button>

                {/* Evaluation results */}
                {sandboxResult && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-1 flex flex-col gap-3">
                    <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kết quả phân tích từ AI:</h5>
                    
                    {/* Keyword Matches analysis */}
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-black text-slate-500 uppercase">So khớp Từ khóa (Expected Keywords)</div>
                      <div className="flex flex-wrap gap-1">
                        {sandboxResult.matchedKeywords.map((kw: string) => (
                          <span key={kw} className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>⭐</span> {kw}
                          </span>
                        ))}
                        {sandboxResult.missedKeywords.map((kw: string) => (
                          <span key={kw} className="bg-rose-50 dark:bg-rose-955/30 text-rose-500 dark:text-rose-450 border border-rose-200 dark:border-rose-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>❌</span> {kw}
                          </span>
                        ))}
                        {sandboxResult.matchedKeywords.length === 0 && sandboxResult.missedKeywords.length === 0 && (
                          <span className="text-[10px] font-bold text-slate-400 italic">Không có từ khóa yêu cầu</span>
                        )}
                      </div>
                    </div>

                    {/* Grammar Matches analysis */}
                    {sandboxResult.targetGrammarMatched.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[9px] font-black text-slate-505 uppercase">Cấu trúc khớp (Grammar Target)</div>
                        <div className="flex flex-wrap gap-1">
                          {sandboxResult.targetGrammarMatched.map((g: string) => (
                            <span key={g} className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 text-[9px] font-black px-2 py-0.5 rounded-full">
                              🎯 {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Response feedback bubble */}
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-black text-slate-550 uppercase">Phản hồi của Cô Lily AI</div>
                      <div className="relative bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-2xl p-3 text-slate-700 dark:text-slate-200 text-xs font-bold leading-relaxed shadow-inner">
                        <div className="absolute left-3 top-[-6px] w-0 h-0 border-b-[6px] border-b-slate-50 dark:border-b-slate-850 border-x-[5px] border-x-transparent" />
                        "{sandboxResult.aiResponse}"
                      </div>
                    </div>

                    {/* Kết quả đạt yêu cầu câu hỏi con */}
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border dark:border-slate-800 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Đạt yêu cầu câu hỏi này:</span>
                      {sandboxResult.missedKeywords.length === 0 ? (
                        <span className="text-emerald-600 font-extrabold uppercase">ĐẠT (PASSED) ✅</span>
                      ) : (
                        <span className="text-rose-500 font-extrabold uppercase">CHƯA ĐẠT (FAILED) ❌</span>
                      )}
                    </div>

                    {/* Stage status complete */}
                    <div className="flex flex-col gap-1 bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border dark:border-slate-800 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      <div className="flex justify-between items-center w-full">
                        <span>Hoàn thành chặng (Stage Complete):</span>
                        <span className={sandboxResult.stageComplete ? "text-emerald-600 font-extrabold uppercase" : "text-amber-600 font-extrabold uppercase"}>
                          {sandboxResult.stageComplete ? "Có (True) ✅" : "Chưa (False) ⏳"}
                        </span>
                      </div>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 normal-case leading-normal font-normal">
                        * Hoàn thành chặng khi đây là câu hỏi con cuối cùng (Câu hỏi 5) trong bối cảnh bức tranh.
                      </span>
                    </div>

                  </div>
                )}

              </div>
            </div>

            {/* Quick PDF Extraction Instruction Guidelines */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 shadow-xl">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                <HelpCircle className="w-4.5 h-4.5 text-amber-500" />
                Hướng dẫn cắt bóc tách từ PDF
              </h4>
              
              <ul className="text-xs font-bold text-slate-500 flex flex-col gap-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px] font-black text-amber-800 shrink-0">1</div>
                  <span>Sử dụng công cụ chụp màn hình (Snipping Tool / Lightshot) chụp sắc nét bức tranh mô tả cảnh hoặc Object Cards trong PDF đề thi Cambridge chuẩn.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px] font-black text-amber-800 shrink-0">2</div>
                  <span>Đặt tên ID học liệu tương ứng cấu trúc để dễ truy xuất (Ví dụ: <code>ST_P1_03</code> là Starters Part 1 Câu 03).</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px] font-black text-amber-800 shrink-0">3</div>
                  <span>Nhập kịch bản câu hỏi bản xứ và từ khóa dự kiến để giúp cô giáo AI có cơ sở tự động đánh giá phát âm cho học viên nhé!</span>
                </li>
              </ul>
            </div>

          </div>

        </section>

        {/* Live Question Bank Data Table */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-100 dark:border-slate-700 p-4 md:p-6 md:p-8 shadow-xl mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-500" />
                Ngân hàng Học liệu đã Số hóa ({filteredQuestions.length})
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Dữ liệu thời gian thực được đồng bộ trên cơ sở dữ liệu đám mây</p>
            </div>

            {/* Filter Tabs by Level */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/70 dark:border-slate-600 p-1.5 rounded-2xl shrink-0 flex-wrap">
              {["All", "Starters", "Movers", "Flyers"].map((tab) => {
                const isActive = selectedFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 bg-transparent hover:bg-slate-100"
                    }`}
                  >
                    {tab === "All" ? "Tất cả" : `${levelAnimals[tab]} ${tab}`}
                  </button>
                );
              })}
              
              {/* Refresh trigger button */}
              <button
                onClick={fetchQuestions}
                disabled={loadingList}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-4 h-4 ${loadingList ? "animate-spin text-indigo-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table container */}
          {loadingList ? (
            <div className="w-full py-16 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm font-extrabold text-slate-600 animate-pulse">Đang tải danh sách học liệu chuẩn...</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">Hệ thống đang truy vấn cơ sở dữ liệu MongoDB Atlas</p>
            </div>
          ) : listError ? (
            <div className="w-full py-12 flex flex-col items-center justify-center text-center bg-rose-50/50 border border-dashed border-rose-200 rounded-3xl">
              <span className="text-4xl mb-2">🛑</span>
              <h4 className="text-sm font-black text-rose-600 uppercase">Lỗi truy vấn dữ liệu!</h4>
              <p className="text-xs font-bold text-slate-500 max-w-sm mt-1">{listError}</p>
              <button
                onClick={fetchQuestions}
                className="mt-4 bg-white text-rose-600 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm active:translate-y-0.5 transition-transform"
              >
                Thử tải lại danh sách 🔄
              </button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="w-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/20">
              <span className="text-5xl mb-3 animate-bounce" style={{ animationDuration: "4s" }}>🏜️</span>
              <h4 className="text-sm font-black text-slate-700 uppercase">Kho học liệu cấp độ này đang trống!</h4>
              <p className="text-xs font-bold text-slate-400 max-w-xs mt-1">Admin hãy sử dụng form bên trên tải ảnh cắt PDF để bổ sung câu hỏi nhé! 🚀</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-400 font-extrabold">
                    <th className="py-4 px-4 text-xs font-black uppercase text-center w-16">STT</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-20">Ảnh bóc tách</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-24">Mã ID</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-24">Cấp độ</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-20 text-center">Độ khó</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-16 text-center">Part</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-32">Loại bối cảnh</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-28">Chủ đề</th>
                    <th className="py-4 px-4 text-xs font-black uppercase">Kịch bản Giám khảo AI</th>
                    <th className="py-4 px-4 text-xs font-black uppercase w-48">Tiêu chí chấm điểm</th>
                    <th className="py-4 px-4 text-xs font-black uppercase text-center w-36">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-600 dark:text-slate-350">
                  {filteredQuestions.map((q, idx) => {
                    return (
                      <tr key={q._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        
                        <td className="py-4 px-4 text-center font-extrabold text-slate-400 w-16">
                          {idx + 1}
                        </td>
                        
                        <td className="py-4 px-4 w-20">
                          <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex items-center justify-center group relative cursor-zoom-in">
                            <img
                              src={q.imagePath}
                              alt={q.id}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                            />
                            {/* Hover overlay static target link */}
                            <a
                              href={q.imagePath}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase"
                            >
                              XEM 🔗
                            </a>
                          </div>
                        </td>
                        
                        <td className="py-4 px-4 font-black text-slate-800 dark:text-slate-255 uppercase w-24">
                          {q.id}
                        </td>

                        <td className="py-4 px-4 w-24">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${levelBadges[q.level] || "bg-slate-100"}`}>
                            {levelAnimals[q.level]} {q.level}
                          </span>
                        </td>

                        <td className="py-4 px-4 w-20 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                            q.difficulty === "Easy"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                              : q.difficulty === "Hard"
                              ? "bg-rose-100 text-rose-700 border-rose-300"
                              : "bg-amber-100 text-amber-700 border-amber-300"
                          }`}>
                            {q.difficulty || "Medium"}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-extrabold text-slate-800 dark:text-slate-255 w-16">
                          {q.part}
                        </td>

                        <td className="py-4 px-4 text-slate-500 dark:text-slate-400 w-32 truncate max-w-[130px]" title={q.type || ""}>
                          {contextTypes.find(t => t.key === q.type)?.name || (q.type || "").replace(/_/g, " ")}
                        </td>

                        <td className="py-4 px-4 text-slate-750 dark:text-slate-350 font-black w-28 truncate max-w-[110px]" title={q.topic || "General"}>
                          {q.topic || "General"}
                        </td>

                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-xs md:max-w-sm" title={q.examinerScript}>
                          {q.questions && q.questions.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              <span className="truncate max-w-[200px]" title={q.questions[0].examinerScript}>
                                1. {q.questions[0].examinerScript}
                              </span>
                              {q.questions.length > 1 && (
                                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full w-max border border-indigo-100 dark:border-indigo-800">
                                  +{q.questions.length - 1} câu hỏi con
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="truncate max-w-[200px] block">"{q.examinerScript}"</span>
                          )}
                        </td>

                        <td className="py-4 px-4 w-48 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500 font-sans">
                          {(() => {
                            let keywordsShow: string[] = [];
                            let grammarShow: string[] = [];
                            if (q.questions && q.questions.length > 0) {
                              keywordsShow = q.questions[0].expectedKeywords || [];
                              grammarShow = q.questions[0].targetGrammar || [];
                            } else {
                              keywordsShow = q.evaluationCriteria?.expectedKeywords || [];
                              grammarShow = q.evaluationCriteria?.targetGrammar || [];
                            }
                            return (
                              <>
                                {keywordsShow.length > 0 && (
                                  <div>
                                    <strong className="text-slate-500">Keywords:</strong>{" "}
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">
                                      {keywordsShow.join(", ")}
                                    </span>
                                  </div>
                                )}
                                {grammarShow.length > 0 && (
                                  <div className="mt-1">
                                    <strong className="text-slate-500">Grammar:</strong>{" "}
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                                      {grammarShow.join(", ")}
                                    </span>
                                  </div>
                                )}
                                {q.contextTags && q.contextTags.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-0.5 items-center">
                                    <Tag className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="italic text-[9px] font-bold text-slate-400">
                                      {q.contextTags.join(", ")}
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </td>

                        <td className="py-4 px-4 w-36 text-center align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(q)}
                              className="btn-3d-yellow px-3 py-2 text-[10px] font-black flex items-center gap-1 hover:scale-105 active:translate-y-0.5 shadow-sm transition-transform cursor-pointer"
                              title="Sửa học liệu này"
                            >
                              ✏️ SỬA
                            </button>
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="btn-3d-pink px-3 py-2 text-[10px] font-black flex items-center gap-1 hover:scale-105 active:translate-y-0.5 shadow-sm transition-transform cursor-pointer"
                              title="Xóa học liệu này"
                            >
                              🗑️ XÓA
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showTypeManager && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-950 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-805 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  ⚙️ Quản lý Loại bối cảnh học liệu
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowTypeManager(false);
                    setEditingTypeId(null);
                    setNewTypeKey("");
                    setNewTypeName("");
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
                
                {/* List of current types */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh sách hiện tại ({contextTypes.length})</h4>
                  {contextTypes.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">Chưa có loại bối cảnh nào. Vui lòng thêm bên dưới.</p>
                  ) : (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                      {contextTypes.map((t) => (
                        <div key={t.key} className="p-3.5 flex items-center justify-between bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          {editingTypeId === t.key || (t._id && editingTypeId === t._id) ? (
                            // Editing mode
                            <div className="flex-1 flex flex-col gap-2 mr-3 col">
                              <input
                                type="text"
                                value={editTypeKey}
                                onChange={(e) => setEditTypeKey(e.target.value)}
                                placeholder="Mã key (ví dụ: Storytelling)"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 outline-none bg-white dark:bg-slate-900 focus:border-indigo-400"
                              />
                              <input
                                type="text"
                                value={editTypeName}
                                onChange={(e) => setEditTypeName(e.target.value)}
                                placeholder="Tên hiển thị (tiếng Việt)"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 outline-none bg-white dark:bg-slate-900 focus:border-indigo-400"
                              />
                              <div className="flex gap-2 justify-end mt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingTypeId(null)}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold text-slate-505 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateType(t._id || t.key)}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold text-white bg-indigo-500 hover:bg-indigo-600 cursor-pointer"
                                >
                                  Lưu
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Normal mode
                            <>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">{t.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">Key: {t.key}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTypeId(t._id || t.key);
                                    setEditTypeKey(t.key);
                                    setEditTypeName(t.name);
                                  }}
                                  className="text-xs font-black text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 transition-colors cursor-pointer"
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteType(t._id || t.key)}
                                  className="text-xs font-black text-rose-500 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                                >
                                  Xóa
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Add Form */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thêm loại bối cảnh mới</h4>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">Mã Key (Tiếng Anh, không dấu cách)</label>
                    <input
                      type="text"
                      value={newTypeKey}
                      onChange={(e) => setNewTypeKey(e.target.value)}
                      placeholder="Ví dụ: Roleplay_Scenario"
                      className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 p-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">Tên hiển thị (Tiếng Việt)</label>
                    <input
                      type="text"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="Ví dụ: Scenario đóng vai hội thoại"
                      className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 p-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateType}
                    className="mt-2 w-full rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white p-3 text-sm font-black transition-colors cursor-pointer text-center"
                  >
                    ＋ Thêm loại bối cảnh mới
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {showGroupManager && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-950 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-805 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  ⚙️ Quản lý Nhóm kỹ năng
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowGroupManager(false);
                    setNewGroupCode("");
                    setNewGroupName("");
                    setNewGroupDesc("");
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
                
                {/* List of current groups */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh sách hiện tại ({skillGroups.length})</h4>
                  {skillGroups.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">Chưa có nhóm kỹ năng nào. Vui lòng thêm bên dưới.</p>
                  ) : (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                      {skillGroups.map((g) => (
                        <div key={g.code} className="p-3.5 flex items-center justify-between bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">{g.code} - {g.name}</span>
                            {g.description && (
                              <span className="text-[10px] font-bold text-slate-505 dark:text-slate-400">{g.description}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteSkillGroup(g.code)}
                              className="text-xs font-black text-rose-500 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Add Form */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thêm nhóm kỹ năng mới</h4>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">Mã nhóm (ví dụ: 1.1, 1.2, 2.1)</label>
                    <input
                      type="text"
                      value={newGroupCode}
                      onChange={(e) => setNewGroupCode(e.target.value)}
                      placeholder="Ví dụ: 1.1"
                      className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 p-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">Tên nhóm kỹ năng (Tiếng Anh)</label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Ví dụ: Vocabulary & Pronunciation"
                      className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 p-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">Mô tả chi tiết (Tiếng Việt)</label>
                    <input
                      type="text"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="Ví dụ: Đánh giá từ vựng và phát âm"
                      className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 p-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 outline-none transition-colors bg-white dark:bg-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSkillGroup}
                    className="mt-2 w-full rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white p-3 text-sm font-black transition-colors cursor-pointer text-center"
                  >
                    ＋ Thêm nhóm kỹ năng mới
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
