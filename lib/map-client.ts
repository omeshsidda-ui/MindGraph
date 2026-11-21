import { FreeLLM, Gemini, Groq, modelSpec, type Provider } from "freelm";

let client: FreeLLM | undefined;

export function getMapClient() {
  if (client) return client;
  const providers: Provider[] = [];
  if (process.env.GEMINI_API_KEY) {
    providers.push(
      new Gemini(process.env.GEMINI_API_KEY, {
        models: [modelSpec("gemini-3.5-flash-lite", ["chat", "fast"])],
      }),
    );
  }
  if (process.env.GROQ_API_KEY) {
    providers.push(
      new Groq(process.env.GROQ_API_KEY, {
        models: [modelSpec("openai/gpt-oss-20b", ["chat", "fast"])],
      }),
    );
  }

  // Keep provider cooldowns across requests handled by this warm instance.
  client = providers.length
    ? new FreeLLM(providers, { wait: false, persist: false })
    : FreeLLM.fromEnv({ keyless: "auto" });
  return client;
}
