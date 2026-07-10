import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

let groqClient: Groq | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return groqClient;
}

function getGemini(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return geminiClient;
}

type StreamCallback = (chunk: string) => void;

export async function streamCompletion(
  prompt: string,
  onChunk: StreamCallback
): Promise<string> {
  try {
    const groq = getGroq();
    const stream = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      stream: true,
      max_tokens: 512,
      temperature: 0.3,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (groqError) {
    console.warn("[Axiom AI] Groq failed, falling back to Gemini:", groqError);
  }

  const gemini = getGemini();
  const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContentStream(prompt);

  let fullText = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }
  return fullText;
}
