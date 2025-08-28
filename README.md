Inkwell — Sketch-to-UI Builder (Next.js + Tailwind)

Inkwell lets you describe or sketch a UI on the left and preview it on the right. You can generate either a renderable JSON UI schema or production-ready code (HTML/React/Tailwind) via local LLMs (Ollama) or fallbacks. It also supports saving generations to Postgres and viewing your last two on a profile page.

Quick Start (fastest — no model downloads)

1) Requirements
   - Node 20+ and npm
   - Docker + Docker Compose (optional: needed for Postgres/Redis)

2) Clone and install
```
git clone https://github.com/Sreesj/inkwell_scratch
cd inkwell_scratch
npm install
```

3) Env files
   - Create .env with a dev schema (avoids drift with any existing tables):
```
DATABASE_URL=postgresql://postgres:sreessj@localhost:5432/adorable?schema=inkwell
```
   - Copy the example and adjust .env.local as you wish (you can leave AI vars empty to use stub mode):
```
cp .env.local.example .env.local
```

4) Optional: start DB/Redis (profile page and persistence)
```
docker compose up -d      # Redis runs on host port 6380; Postgres on 5432
npx prisma migrate dev --name init
```

5) Run the app
```
npm run dev
```
Open http://localhost:3000. Without AI models, generation falls back to a local stub so you can click around immediately. The /profile page requires the DB running.

Enable AI (local, lightweight)

If you want real generations but have limited VRAM/bandwidth, use small models:

1) Install Ollama and start it
```
ollama --version
ollama serve
```

2) Pull small models (choose one thinking model, one optional vision model)
```
# Thinking (pick one)
ollama pull phi3:mini
# or
ollama pull qwen2.5:3b
# or
ollama pull llama3.2:3b

# Vision (optional, for sketch images)
ollama pull llava:7b
# or
ollama pull bakllava

# Embeddings (optional, for retrieval)
ollama pull nomic-embed-text
```

3) Update .env.local
```
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=phi3:mini           # or qwen2.5:3b / llama3.2:3b
OLLAMA_VISION_MODEL=llava:7b     # or bakllava
OLLAMA_EMBED_MODEL=nomic-embed-text
```
Restart the dev server if it’s already running.

Enable code generation (Magnus frontend)

To generate code (HTML/React/Tailwind) using heavylildude/magnus-frontend:

1) Pull the model (about 3.3 GB)
```
ollama pull heavylildude/magnus-frontend:latest
```

2) Update .env.local
```
OLLAMA_CODE_MODEL=heavylildude/magnus-frontend:latest
# Optional: default to code output
# OLLAMA_OUTPUT=code
```
Restart the dev server.

Remote Ollama (no large local downloads)

If you have a remote VM with Ollama and models:

- SSH tunnel (recommended):
```
ssh -N -L 11434:127.0.0.1:11434 user@your-vm
```
Set OLLAMA_BASE_URL=http://127.0.0.1:11434 locally. Or point OLLAMA_BASE_URL to your VM’s public IP if you’ve secured it.

App Overview

- src/components/UIBuilder.tsx — left prompt + right preview with pen overlay
- src/components/SketchOverlay.tsx — draw and export PNG overlay
- src/components/GeneratedUIRenderer.tsx — renders JSON UI schema
- src/components/CodePreview.tsx — renders code in an iframe
- src/lib/ai.ts — AI integration (Ollama-first with fallbacks/stub)
- src/lib/db.ts — Prisma client
- src/app/api/generate/route.ts — generate UI/code
- src/app/api/reprompt/route.ts — refine with sketch
- src/app/api/generations/recent/route.ts — last 2 generations
- src/app/profile/page.tsx — profile page showing recent generations

Ports

- App: 3000
- Postgres: 5432
- Redis (compose): 6380 (mapped to container 6379)
- Ollama: 11434

Common Tasks

- DB migration (dev):
```
npx prisma migrate dev --name init
```

- Build and run production:
```
npm run build
npm start
```

Troubleshooting

- Drift detected on Prisma:
  - Use a clean schema via `?schema=inkwell` in DATABASE_URL, then run `npx prisma migrate dev`.

- Redis 6379 already in use:
  - Our compose maps Redis to 6380; set `REDIS_URL=redis://localhost:6380`.

- No AI credits / don’t want downloads:
  - Leave AI envs empty; the app will serve a local stub so you can test the flow.

License

MIT
