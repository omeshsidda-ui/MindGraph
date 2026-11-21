# MindGraph

Turn a topic, article, or captioned YouTube video into an interactive mind map.

> **Demo preview** · Screenshot or GIF placeholder

## Features

- Explore “How the Internet Works” immediately with the built-in demo.
- Generate a three-level map from a topic, pasted text, or YouTube captions.
- Pan, zoom, and select a node for its summary and three takeaways.
- Download the full map as a PNG or copy its Markdown outline.

## How it works

The workspace sends input to the App Router endpoint at `/api/generate-map`. For YouTube links, the server retrieves captions first. If captions are unavailable, paste notes or a transcript instead. The server uses `FreeLLM.fromEnv({ keyless: "auto" })` to route requests to public providers when no keys are configured, or to providers such as Gemini and Groq when their keys are present. Zod validates each tree, with one retry for malformed output. Generation and caption retrieval share a 20-second deadline. The client spaces leaves vertically, centers parents over their children, and renders the map with React Flow.

## Local setup

Use Node.js 22 or later.

1. Run `npm install`.
2. Optionally copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` or `GROQ_API_KEY`. You can skip this step for keyless routing.
3. Run `npm run dev` and open http://localhost:3000.

For production, run `npm run build` followed by `npm start`.

## Deploy on Vercel Hobby

1. Push your main branch with `git push -u origin main`.
2. In your Vercel Hobby workspace, select **Add New → Project**, connect GitHub, and import **MindGraph**.
3. Select **Next.js**, keep the repository root and default install/build settings, and leave environment variables empty.
4. Click **Deploy**. Open the production URL and enter a topic or select **Try Demo**. Share the production URL so anyone can try it without a login or API keys.

Public provider availability varies. When generation is busy or times out, **Load Demo Map** opens the bundled example. Once the page has loaded, both demo buttons work offline with zero network calls. The in-memory limiter allows 10 generation requests per IP per hour on each warm function instance. Cold starts reset the counter and parallel instances keep independent counts.

## Tech stack

Next.js App Router, TypeScript, React, Tailwind CSS, React Flow, freelm, Zod, youtube-transcript, and html-to-image.

## License

MIT

### Free-tier generation in production

Set either or both server-side secrets in Vercel under **Settings → Environment Variables → Production**, then redeploy. Visitors use the same workspace without credentials. Use free-tier projects or organizations to stay within free quotas. On a paid account these model IDs can incur charges.

| Variable | Selected model | Provider documentation |
| --- | --- | --- |
| `GEMINI_API_KEY` | `gemini-3.5-flash-lite` | [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| `GROQ_API_KEY` | `openai/gpt-oss-20b` | [Groq free-plan limits](https://console.groq.com/docs/rate-limits) |

With both keys, freelm can route around provider failures within the shared deadline. The model list stays fixed to avoid discovery delays and unexpected model selections. With neither key, the default keyless pool remains available.
