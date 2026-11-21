# MindGraph

Turn a topic, article, or captioned YouTube video into an interactive mind map.

> **Demo preview** · Screenshot or GIF placeholder

## Features

- Explore “How the Internet Works” immediately with the built-in demo.
- Generate a three-level map from a topic, pasted text, or YouTube captions.
- Pan, zoom, and select a node for its summary and three takeaways.
- Download the full map as a PNG or copy its Markdown outline.

## How it works

The workspace sends input to the App Router endpoint at `/api/generate-map`. For YouTube links, the server retrieves captions first. If captions are unavailable, paste notes or a transcript instead. The server asks Gemini for structured JSON and validates the resulting tree with Zod. The client spaces leaves vertically, centers parents over their children, and renders the map with React Flow.

## Local setup

Use Node.js 22 or later.

1. Run `npm install`.
2. Run `cp .env.example .env.local`. Set `GEMINI_API_KEY` to your Google Gemini API key for generation. The demo works without a key. Optionally set `GEMINI_MODEL` to a compatible model.
3. Run `npm run dev` and open http://localhost:3000.

For production, run `npm run build` followed by `npm start`.

## Tech stack

Next.js App Router, TypeScript, React, Tailwind CSS, React Flow, Gemini API, Zod, youtube-transcript, and html-to-image.

## License

MIT
