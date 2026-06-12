"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Sparkles, RefreshCw } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing: boolean;
  sentence: string;
}

export default function AudioRecorder({
  onRecordingComplete,
  isProcessing,
  sentence,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

  const cleanupAudioResources = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch((err) => console.warn("Lỗi đóng AudioContext:", err));
      audioContextRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    analyserRef.current = null;
    mediaRecorderRef.current = null;
  };

  const startRecording = async () => {
    try {
      setMicError(null);
      audioChunksRef.current = [];
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const options = { mimeType: "audio/webm" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        onRecordingComplete(audioBlob);
        cleanupAudioResources();
      };

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      recorder.start(100);
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      drawVisualizer();

    } catch (err: any) {
      console.error("Lỗi truy cập Microphone:", err);
      setMicError(
        "Bé ơi, ứng dụng chưa được cấp quyền dùng Microphone rồi. Con hãy nhấn cho phép ở góc màn hình hoặc nhờ ba mẹ giúp nhé! 🎤"
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const bufferLength = dataArray.length;

    const draw = () => {
      if (!isRecording) return;

      animationFrameIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray as any);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(250, 248, 245, 0.8)";
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        const percent = barHeight / 255;
        const baseHeight = percent * (height * 0.75);

        const r = Math.floor(16 + percent * 100);
        const g = Math.floor(185 - percent * 50);
        const b = Math.floor(129 + percent * 126);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        const yPos = (height - baseHeight) / 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, yPos, barWidth - 4, baseHeight + 5, 8);
        } else {
          ctx.rect(x, yPos, barWidth - 4, baseHeight + 5);
        }
        ctx.fill();

        x += barWidth;
      }
    };

    draw();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-white rounded-3xl border-4 border-amber-200/60 shadow-xl relative overflow-hidden">
      <div className="absolute top-2 left-4 w-12 h-12 rounded-full bg-yellow-100/50 -z-10 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-2 right-6 w-16 h-16 rounded-full bg-blue-100/50 -z-10 animate-float" style={{ animationDelay: "3s" }} />

      <div className="text-center z-10 w-full">
        {!isRecording && !isProcessing && (
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
              Bé đã sẵn sàng chưa nào?
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Nhấn chiếc Mic to màu xanh lá và đọc to câu ở trên nhé!
            </p>
          </div>
        )}

        {isRecording && (
          <div className="mb-4">
            <h3 className="text-xl font-extrabold text-rose-500 animate-pulse flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping inline-block" />
              Cô giáo AI đang lắng nghe con nói...
            </h3>
            <span className="text-2xl font-black text-slate-700 font-mono mt-1 block">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}

        {isProcessing && (
          <div className="mb-4 flex flex-col items-center justify-center py-2">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
            <h3 className="text-lg font-extrabold text-blue-600 animate-pulse">
              Đang chấm điểm phát âm...
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1 px-4 text-center">
              Cô giáo AI đang lắng nghe thật kỹ và chuẩn bị tặng sao vàng cho con đấy! 🚀
            </p>
          </div>
        )}

        <div
          className={`w-full max-w-md h-32 mx-auto mb-6 rounded-2xl border-2 border-slate-100 bg-slate-50/50 overflow-hidden flex items-center justify-center transition-all ${isRecording ? "scale-100 opacity-100 shadow-inner" : "scale-95 opacity-40 pointer-events-none"
            }`}
        >
          {isRecording ? (
            <canvas ref={canvasRef} width={450} height={120} className="w-full h-full block" />
          ) : (
            <div className="flex flex-col items-center text-slate-400 gap-1 select-none">
              <Mic className="w-8 h-8 opacity-40" />
              <span className="text-xs font-bold font-sans">Sóng âm thanh sẽ xuất hiện ở đây khi con nói</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 z-20 relative">
          {!isRecording && !isProcessing && (
            <button
              onClick={startRecording}
              className="btn-3d-green w-28 h-28 flex-col rounded-full hover:scale-105"
              aria-label="Bắt đầu thu âm"
            >
              <Mic className="w-10 h-10 animate-bounce" style={{ animationDuration: "1.5s" }} />
              <span className="text-xs font-black uppercase tracking-wider block mt-1">NÓI NGAY</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="btn-3d-pink w-28 h-28 flex-col rounded-full hover:scale-105 animate-pulse"
              aria-label="Dừng thu âm"
            >
              <Square className="w-10 h-10 fill-white" />
              <span className="text-xs font-black uppercase tracking-wider block mt-1">XONG RỒI</span>
            </button>
          )}

          {isProcessing && (
            <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-slate-200 flex flex-col items-center justify-center text-slate-400 shadow-inner">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-wider block mt-1">ĐANG TÍNH</span>
            </div>
          )}
        </div>

        {micError && (
          <div className="mt-6 mx-auto max-w-md p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-600 text-sm font-bold text-left flex items-start gap-2 shadow-sm animate-bounce-subtle">
            <span className="text-xl inline-block -mt-1">⚠️</span>
            <span>{micError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
