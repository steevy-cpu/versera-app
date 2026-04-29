import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function runWithGemini(prompt: string) {
  const startTime = Date.now();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const latency = Date.now() - startTime;

  return {
    output: text,
    model: "gemini-2.5-flash",
    provider: "google",
    latencyMs: latency,
    tokenCount: response.usageMetadata?.totalTokenCount ?? 0,
  };
}
