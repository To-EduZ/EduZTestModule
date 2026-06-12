import { Communicate } from "edge-tts-universal";

/**
 * Synthesizes speech using Microsoft Edge Neural TTS via the robust edge-tts-universal library.
 * @param text The input text to read aloud.
 * @param voice Microsoft voice code (e.g., 'en-US-AriaNeural', 'en-GB-SoniaNeural').
 * @param rate Speed percentage offset (e.g. 0 for normal, -10 for slower, +10 for faster).
 * @returns A promise resolving to a Buffer of MP3 audio bytes.
 */
export async function synthesizeSpeech(
  text: string,
  voice: string = "en-US-AriaNeural",
  rate: number = 0
): Promise<Buffer> {
  const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;
  
  // Initialize standard isomorphic Communicate stream with automatic GEC security signing
  const communicate = new Communicate(text, {
    voice,
    rate: rateStr,
  });

  const chunks: Buffer[] = [];
  
  // Asynchronously harvest binary audio frames
  for await (const chunk of communicate.stream()) {
    if (chunk.type === "audio" && chunk.data) {
      chunks.push(chunk.data);
    }
  }

  if (chunks.length === 0) {
    throw new Error("Zero audio chunks received from Edge TTS synthesis.");
  }

  return Buffer.concat(chunks);
}
