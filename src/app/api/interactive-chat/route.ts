import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { callGemini, safeJsonParse } from "@/lib/geminiClient";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
  try {
    const developMode = req.headers.get("x-develop-mode") === "true";
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const textInput = formData.get("text") as string | null;
    const stage = formData.get("stage") as string;
    const chatHistoryRaw = formData.get("chatHistory") as string || "[]";
    const contextRaw = formData.get("context") as string || "{}";
    const mode = formData.get("mode") as string || "practice"; // test vs practice

    const chatHistory = JSON.parse(chatHistoryRaw);
    const context = JSON.parse(contextRaw);

    let transcribedText = textInput || "";

    // 1. Transcribe audio if provided
    if (audioFile && audioFile.size > 0) {
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
      
      const transcription = await groq.audio.transcriptions.create({
        model: "whisper-large-v3",
        file: file,
        language: "en",
      });
      transcribedText = (transcription.text || "").trim();
      console.log(`📝 [Groq Whisper] Transcribed text: "${transcribedText}"`);
    }

    if (!transcribedText && chatHistory.length > 0) {
      return NextResponse.json({ error: "Không nhận diện được giọng nói." }, { status: 400 });
    }

    // 2. Calculate reading accuracy if in reading stage
    let readingAccuracy = 100;
    if (stage === "reading" && transcribedText) {
      const referenceStory = context.referenceStory || "Max is a happy little monkey who lives in a very tall coconut tree in the jungle. He loves to eat sweet yellow bananas every morning. Today, Max looks down and sees a small green frog sitting on a leaf in the pond. The frog is jumping up and down and singing a funny song. Max waves hello and laughs happily!";
      const storyWords = referenceStory.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/).filter(Boolean);
      const spokenWords = transcribedText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/).filter(Boolean);
      
      let matchedCount = 0;
      const tempSpoken = [...spokenWords];
      storyWords.forEach((word: string) => {
        const index = tempSpoken.indexOf(word);
        if (index !== -1) {
          matchedCount++;
          tempSpoken.splice(index, 1);
        }
      });
      readingAccuracy = Math.round((matchedCount / storyWords.length) * 100);
      console.log(`🎯 [Reading Accuracy] Matched ${matchedCount}/${storyWords.length} words. Accuracy: ${readingAccuracy}%`);
    }

    // 3. Construct prompt for Gemini 2.5 Flash
    let stageInstructions = "";
    
    if (stage === "warmup") {
      const aiMessageCount = chatHistory.filter((m: any) => m.role === "ai" || m.role === "assistant").length;
      stageInstructions = `
We are in the Warm-up stage.
The child's response: "${transcribedText}".
Number of AI messages sent in warmup so far: ${aiMessageCount}.

Follow this exact flow:
1. If number of AI messages sent so far is 0: Ask the child: "Hello! Welcome to the English test. What's your name?"
   Set "stageComplete" to false.
2. If number of AI messages sent so far is 1 (the child just answered their name): Greet the child warmly, comment on their name "${transcribedText}", and ask: "How old are you?"
   Set "stageComplete" to false.
3. If number of AI messages sent so far is 2 (the child just answered their age): Praise the child's age, and ask: "What is your favorite animal?"
   Set "stageComplete" to false.
4. If number of AI messages sent so far is 3 or more (the child just answered their favorite animal): Praise the child's favorite animal, and complete Warm-up by returning EXACTLY this sentence in "aiResponse": "Great job! Let's look at a picture now."
   Set "stageComplete" to true.`;
    } else if (stage === "picture") {
      const pictureIndex = context.pictureIndex || 0;
      const subQuestionIndex = typeof context.subQuestionIndex === "number" ? context.subQuestionIndex : 0;
      const questions = context.questions || [];
      const attemptsCount = typeof context.attemptsCount === "number" ? context.attemptsCount : 0;
      const keywordsMentioned = context.keywordsMentioned || [];

      if (transcribedText === "[NEW_PICTURE]") {
        stageInstructions = `
We are in the Picture Description/Differences stage for Picture ${pictureIndex + 1}.
Here is the questions array for this picture:
${JSON.stringify(questions)}

The UI has just transitioned to this new picture.
Your task:
1. Greet the new picture enthusiastically (e.g., "Look at this new picture!").
2. Ask the FIRST question in the questions array: "${questions[0]?.examinerScript || "What do you see?"}".
3. Set "stageComplete" to false.
4. Set "nextSubQuestionIndex" to 0.
`;
      } else {
        stageInstructions = `
We are in the Picture Description/Differences stage for Picture ${pictureIndex + 1}.
Here is the questions array for this picture:
${JSON.stringify(questions)}

The child is currently at question index: ${subQuestionIndex}.
The number of times the child has already answered this question incorrectly: ${attemptsCount}.
The child has already mentioned these keywords in previous turns: ${JSON.stringify(keywordsMentioned)}.
Child's response: "${transcribedText}".

Your tasks:
1. Check if the child's response answers the question at index ${subQuestionIndex}. 
   - CRITICAL RULE: Be very generous and flexible. The child is a young learner (6-10 years old) and might make minor grammatical/pronunciation mistakes or use synonyms (e.g., they say "teachers teaching" in response to "What is the teacher doing?", or they say "slash room" instead of "classroom"). If the child's response semantically addresses the question, you MUST mark it as successfully answered.
   - EXPECTED KEYWORDS RULE: The expectedKeywords list of each question is for scoring reference only. You MUST NOT require the child to say the exact expected keywords to pass. As long as their response semantically answers or references the question's topic, mark it as answered.
   - CRITICAL WRONG ANSWER RULE: If the child's response does NOT correctly answer the question:
     - If attemptsCount is 0 (first incorrect attempt): You MUST keep "nextSubQuestionIndex" at the current index (${subQuestionIndex}). Do NOT advance. In "aiResponse", encourage the child, provide a specific and helpful hint (gợi ý) to guide them (without stating the exact answer, e.g. describe the object/action or its traits based on the question's expectedKeywords), and ask the question again.
     - If attemptsCount >= 1 (second incorrect attempt): You MUST NOT keep asking or prompting for the same question. Force this question to be completed immediately! Force "nextSubQuestionIndex" to advance to the next index (${subQuestionIndex + 1}). In "aiResponse", reveal the correct answer clearly (e.g. "That's okay! It is a [expected keyword]!") and then transition to ask the next question at questions[nextSubQuestionIndex].examinerScript (or if stageComplete is true, transition to the next picture/stage).
2. Check if the child's response also answers any of the subsequent questions (indices ${subQuestionIndex + 1}, ${subQuestionIndex + 2}, etc.) in the questions array (this is "real-time pacing" / answering questions in advance).
   - CRITICAL REAL-TIME PACING & ADVANCE ANSWERING RULE: If the child's response has *already* answered or mentioned the actions, objects, or details of any subsequent questions (e.g., they mentioned the boy is swinging or the girl is sliding in their first description), you MUST include those subsequent question indices in the "answeredIndices" array so they are marked as answered in advance. 
   - CRITICAL PAST KEYWORD RULE: You MUST ALSO check if any future questions ask for keywords that are already in the "keywordsMentioned" list. If a future question asks about something the child ALREADY mentioned in the past, you MUST skip that question by including its index in the "answeredIndices" array. It is extremely annoying to the child to be asked a question they have already answered. Be very proactive in marking them as answered!
3. Identify all questions from index ${subQuestionIndex} onwards that the child has successfully answered in this turn.
4. Output their indices in the "answeredIndices" array (e.g., [0] or [0, 1]).
5. Collect all keywords that were matched in the child's response from the expectedKeywords lists of the answered questions. Output them in the "keywordsHit" array. Matches can be semantic or word-level.
6. Determine the "nextSubQuestionIndex": the index of the first unanswered question (e.g., if current is 0 and the child successfully answered 0, next is 1; if they also answered 1, next is 2).
   - CRITICAL RULE: If the current question at ${subQuestionIndex} was answered or skipped due to attemptsCount >= 1, nextSubQuestionIndex MUST be strictly greater than ${subQuestionIndex} (e.g., ${subQuestionIndex} + 1). You MUST NOT repeat the same index if it was answered or skipped.
7. If all questions in the array have been answered (meaning nextSubQuestionIndex >= questions.length), or if the questions array is empty (questions.length is 0), you MUST set "stageComplete" to true.
8. Formulate a cute, encouraging examiner comment (1-2 sentences with emojis) in "aiResponse":
   - CRITICAL RULE: You MUST NOT ask any question that has already been answered, and you MUST NOT re-ask the question that was just answered in this turn.
   - CRITICAL SCRIPT RULE: If stageComplete is false, you MUST ask the question specified in questions[nextSubQuestionIndex].examinerScript. You are allowed to paraphrase/rephrase it slightly to make it sound more friendly or fit the conversation context, but you MUST NOT create entirely custom questions, change the main topic, or ask about unrelated details. Stick strictly to the original question's intent.
   - If stageComplete is false: congratulate/praise the child's answer and then ask the question at questions[nextSubQuestionIndex].examinerScript (either the exact text or paraphrased as described above). Double check that you are asking the question at the NEW nextSubQuestionIndex, not the old one.
   - If stageComplete is true:
     - If pictureIndex is 0: the response MUST end with exactly: "Great job with the first picture! Now let's look at a second picture."
     - If pictureIndex is 1: the response MUST end with exactly: "Excellent! You did a great job with both pictures. Now, let's read a short story together."`;
      }
    } else if (stage === "reading") {
      stageInstructions = `
The child has finished reading the story aloud.
1. Praise the child's reading skills warmly.
2. The response MUST end with exactly: "Fantastic reading! You read the story beautifully. Let's answer a quick question about it now!"
3. Set "stageComplete" to true.`;
    } else {
      stageInstructions = `
The test is ending.
1. Praise the child for their hard work.
2. Say: "You did amazingly well today! Goodbye and see you next time!"
3. Set "stageComplete" to true.`;
    }

    const geminiPrompt = `You are a friendly, encouraging AI English teacher for young learners.
Your job is to talk to a primary student (6-10 years old) in simple English, using short sentences (1-2 sentences) and fun emojis.

Current stage of the exam: "${stage}"
Interactive Mode: "${mode}" (practice/test)
- In "practice" mode, be extra conversational, warm, and guiding.
- In "test" mode, be standard, structured, and examiner-like.

Chat History so far:
${JSON.stringify(chatHistory)}

Child's latest response: "${transcribedText}"

Stage-specific Instructions:
${stageInstructions}

You MUST return a JSON object with the following fields:
{
  "aiResponse": "Your response to the child in English (1-2 sentences with emojis)",
  "stageComplete": true or false,
  "nextSubQuestionIndex": number (only applicable for "picture" stage),
  "answeredIndices": [number] (indices of questions answered in this turn, only for "picture" stage),
  "keywordsHit": ["keyword1", "keyword2"] (list of expected keywords that were found/matched in the child's response, only for "picture" stage)
}`;

    console.log("🤖 [OpenRouter Gemini 2.5 Flash] Querying Gemini model for interactive-chat...");
    const rawContent = await callGemini([{ role: "user", content: geminiPrompt }], { 
      responseFormat: "json_object",
      useAdaptiveModels: true
    });
    const parsedData = safeJsonParse(rawContent);
    console.log("✅ [OpenRouter Gemini 2.5 Flash] Response parsed:", parsedData);

    let finalNextSubQuestionIndex = typeof parsedData.nextSubQuestionIndex === "number" ? parsedData.nextSubQuestionIndex : undefined;
    let finalStageComplete = parsedData.stageComplete || false;
    let finalAiResponse = parsedData.aiResponse || "";

    if (stage === "picture") {
      const pictureIndex = context.pictureIndex || 0;
      const subQuestionIndex = typeof context.subQuestionIndex === "number" ? context.subQuestionIndex : 0;
      const questions = context.questions || [];
      const attemptsCount = typeof context.attemptsCount === "number" ? context.attemptsCount : 0;

      // If attemptsCount >= 1 and the AI failed to advance, force progression programmatically
      if (attemptsCount >= 1 && (finalNextSubQuestionIndex === undefined || finalNextSubQuestionIndex === subQuestionIndex)) {
        console.warn("⚠️ LLM failed to advance subQuestionIndex on final attempt. Forcing progression programmatically.");
        finalNextSubQuestionIndex = subQuestionIndex + 1;
        if (finalNextSubQuestionIndex >= questions.length) {
          finalStageComplete = true;
        }

        const currentQ = questions[subQuestionIndex];
        const correctWord = currentQ?.evaluationCriteria?.expectedKeywords?.[0] || "correct answer";
        
        let nextPrompt = "";
        if (finalStageComplete) {
          if (pictureIndex === 0) {
            nextPrompt = "Great job with the first picture! Now let's look at a second picture.";
          } else {
            nextPrompt = "Excellent! You did a great job with both pictures. Now, let's read a short story together.";
          }
        } else {
          const nextQ = questions[finalNextSubQuestionIndex];
          nextPrompt = nextQ?.examinerScript || "Let's check the next question.";
        }

        finalAiResponse = `That's okay! It is a ${correctWord}. 🌟 ${nextPrompt}`;
      }
    }

    return NextResponse.json({
      success: true,
      transcribedText,
      aiResponse: finalAiResponse,
      stageComplete: finalStageComplete,
      nextSubQuestionIndex: finalNextSubQuestionIndex,
      answeredIndices: Array.isArray(parsedData.answeredIndices) ? parsedData.answeredIndices : undefined,
      keywordsHit: Array.isArray(parsedData.keywordsHit) ? parsedData.keywordsHit : undefined,
      readingAccuracy: stage === "reading" ? readingAccuracy : undefined,
    });

  } catch (error: any) {
    console.error("❌ Lỗi API interactive-chat:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi: " + error.message },
      { status: 500 }
    );
  }
}
