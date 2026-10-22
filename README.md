# Editorial Automata

> A developer portfolio with physics-based interactions and autonomous AI organization.

An experimental portfolio where a pixel-art robot agent autonomously organizes text tokens using semantic matching, delivering them to relevant projects or disposing of non-matching content. Built with Next.js, Matter.js physics, and Transformers.js for local ML inference.

## Features

- **Autonomous Robot Agent**: Pixel-art Wall-E inspired robot that picks up text pills, semantically matches them to projects, and delivers them
- **Physics-Based Interactions**: Full 2D physics simulation with Matter.js - tokens spawn and interact naturally
- **Semantic Routing**: Local ML-powered matching using Transformers.js embeddings (no API keys needed)
- **Kinetic Filing Cabinet**: macOS Dock-style cascade physics on hover with 5-tier mathematical ripple
- **GitHub Integration**: Automatically syncs your repositories with READMEs as project descriptions

## Tech Stack

- **Next.js 16** (App Router, React Server Components)
- **TypeScript** (Strict mode, full type safety)
- **Tailwind CSS 4** (Custom design system)
- **Matter.js** (2D physics engine)
- **Transformers.js** (Local ML embeddings)
- **Supabase** (PostgreSQL + Realtime)

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Sync Your GitHub Repositories

Fetch your repos and generate portfolio entries:

```bash
npm run sync:github
```

This will:
- Fetch all your public repositories from GitHub
- Parse README files for descriptions
- Extract tech tags from language statistics
- Save everything to `lib/data/portfolio-entries.json`

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your portfolio.

### 4. (Optional) Set Up Supabase

For cloud sync and multi-device access:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local`
3. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

4. Run the Supabase sync:

```bash
npm run sync:supabase
```

## Project Structure

```
project-wall-e/
├── app/
│   ├── page.tsx              # Main app entry with layout
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles & fonts
├── components/
│   ├── engine/
│   │   ├── CanvasCore.tsx    # Matter.js physics engine
│   │   ├── EngineWrapper.tsx # Client-side physics wrapper
│   │   └── PixelRobot.tsx    # 6-frame sprite animation
│   ├── ui/
│   │   ├── InputBar.tsx      # Text input for spawning pills
│   │   ├── LedgerItem.tsx    # Project cards with cascade physics
│   │   ├── ProjectSheet.tsx  # Full project detail overlay
│   │   ├── RobotMeta.tsx     # Robot status display
│   │   ├── TopControls.tsx   # Sound toggle control
│   │   └── Wordmark.tsx      # Header branding
│   └── Sidebar.tsx           # 40% sidebar with projects
├── lib/
│   ├── ai/
│   │   ├── matchmaker.ts     # Semantic routing engine
│   │   ├── qAgent.ts         # Q-learning locomotion
│   │   ├── stateMachine.ts   # Robot behavior state machine
│   │   └── transformers.ts   # Embeddings via Transformers.js
│   ├── data/
│   │   └── portfolio-entries.json  # Synced GitHub repos
│   ├── supabase/
│   │   └── client.ts         # Supabase client
│   ├── types/
│   │   └── database.ts       # TypeScript types
│   ├── utils/
│   │   └── sfx.ts           # ZzFX sound effects
│   └── events.ts            # Custom event system
└── scripts/
    ├── fetch-github-repos.js  # Local GitHub sync (no DB)
    └── sync-github-repos.js   # Full sync to Supabase
```

## How It Works

### Robot AI Flow

1. **Token Spawning**: User types text → spawns as physics-enabled pills
2. **Token Chasing**: Robot detects unsorted pills, applies force toward closest
3. **Pickup**: When within 80px, pill attaches to robot's bottom
4. **Semantic Routing**: Calls `routeToken()` to get embedding similarity scores
5. **Delivery**: 
   - Score ≥ 0.40 → delivers to sidebar project (x=5%, y=200)
   - Score < 0.40 → delivers to trash can (x=90%, y=90%)
6. **Cleanup**: Pill removed from physics world, robot returns to idle

### Semantic Matching

- Uses **Transformers.js** with `Xenova/all-MiniLM-L6-v2` model
- Runs entirely in browser (no API calls)
- Pre-computes project embeddings on load
- Matches tokens via cosine similarity
- Threshold: 0.40 (tuned for portfolio context)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run sync:github` | Fetch GitHub repos → local JSON |
| `npm run sync:supabase` | Fetch GitHub repos → Supabase |
| `npm run lint` | Run ESLint |

## Environment Variables

```env
# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# GitHub (optional - increases rate limit)
GITHUB_TOKEN=
```

## Design Philosophy

**Human-Centered Typography**
- Instrument Serif (42px) for name - warm, editorial
- 16px body text for bio - readable, conversational  
- DM Mono (11px) for data tokens - technical precision

**Physics as Metaphor**
- Pills spawn with natural scatter
- Robot has mass and friction - feels grounded
- Cascade interactions mirror real desk organization

**Autonomous Curation**
- Robot doesn't ask for instructions
- Matches content to context automatically
- Learns from your project corpus

## License

MIT

## Author

**Antonio Buenafe** ([@anton-buen](https://github.com/anton-buen))

---
