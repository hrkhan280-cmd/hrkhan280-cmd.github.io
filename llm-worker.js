import * as webllm from "https://esm.run/@mlc-ai/web-llm";

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
let engine = null;
let enginePromise = null;

function getEngine() {
  if (!("gpu" in navigator)) {
    return Promise.reject(new Error("WebGPU isn't available in this browser"));
  }
  if (enginePromise) return enginePromise;

  enginePromise = webllm.CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (report) => {
      self.postMessage({ type: "progress", text: report.text || "Loading model…" });
    }
  }).then((e) => {
    engine = e;
    return e;
  }).catch((err) => {
    enginePromise = null;
    throw err;
  });

  return enginePromise;
}

self.onmessage = async (e) => {
  const { id, type, prompt } = e.data;

  if (type === "init") {
    try {
      await getEngine();
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", error: err.message });
    }
    return;
  }

  if (type === "generate") {
    try {
      const eng = await getEngine();
      const reply = await eng.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 700
      });
      const text = reply.choices[0].message.content;
      self.postMessage({ id, type: "result", text });
    } catch (err) {
      self.postMessage({ id, type: "error", error: err.message });
    }
  }
};
