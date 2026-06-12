import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/edgeTts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text");
    const voice = searchParams.get("voice") || "en-US-AriaNeural";

    if (!text) {
      return NextResponse.json({ error: "Tham số 'text' không được để trống!" }, { status: 400 });
    }

    console.log(`🔊 [Server EdgeTTS Proxy] Đang lấy giọng đọc (${voice}) cho câu: "${text}"`);

    // Call the Edge TTS WebSocket collector helper
    const audioBuffer = await synthesizeSpeech(text, voice);

    // Stream back MP3 audio bytes to browser
    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for high performance
      },
    });

  } catch (err: any) {
    console.error("❌ Lỗi sinh âm thanh đọc mẫu phía Server (Edge TTS):", err);
    return NextResponse.json({ error: "Không thể kết nối với dịch vụ phát âm thanh mẫu!" }, { status: 500 });
  }
}
