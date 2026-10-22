# Portfolio Data Management

This document explains how to manage your portfolio project data in Editorial Automata.

## Quick Start

The easiest way to populate your portfolio is to sync from GitHub:

```bash
npm run sync:github
```

This automatically:
- Fetches all your public repositories
- Extracts descriptions from README files
- Detects tech stack from GitHub language data
- Saves to `lib/data/portfolio-entries.json`

## Data Sources (Priority Order)

1. **Supabase** (if configured) - Cloud database
2. **Local JSON** (`lib/data/portfolio-entries.json`) - Synced from GitHub
3. **Mock Data** (in `app/page.tsx`) - Fallback for development

## Syncing Strategies

### Strategy 1: GitHub → Local JSON (Recommended)

**Best for**: Getting started, local development, static sites

```bash
npm run sync:github
```

**Pros**:
- No database setup required
- Version controlled with your code
- Fast builds (static JSON import)
- Works offline

**Cons**:
- Manual re-sync needed for updates
- No dynamic content without rebuild

**When to re-sync**:
- After creating new repositories
- After updating README files
- After archiving/unarchiving repos
- Before deployment

### Strategy 2: GitHub → Supabase

**Best for**: Dynamic updates, multi-site sync, realtime changes

```bash
npm run sync:supabase
```

**Pros**:
- Content updates without redeployment
- Realtime sync across devices
- Can edit directly in Supabase dashboard
- Support for unpublished/private projects

**Cons**:
- Requires Supabase account
- Additional complexity
- Database costs (free tier available)

**Setup**:

1. Create Supabase project
2. Add credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

3. Create table (SQL):

```sql
CREATE TABLE portfolio_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'system_ml',
  title TEXT NOT NULL,
  summary TEXT,
  tech_tags TEXT[],
  github_url TEXT,
  live_url TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE portfolio_entries ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access"
  ON portfolio_entries FOR SELECT
  USING (true);
```

4. Run sync:

```bash
npm run sync:supabase
```

### Strategy 3: Manual Editing

Edit `lib/data/portfolio-entries.json` directly:

```json
[
  {
    "id": "unique-project-id",
    "type": "system_ml",
    "title": "Project Name",
    "summary": "A detailed description of what this project does...",
    "tech_tags": ["PYTHON", "PYTORCH", "REACT"],
    "github_url": "https://github.com/username/repo",
    "live_url": "https://example.com",
    "year": 2025
  }
]
```

## Portfolio Entry Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (slug-format) |
| `type` | string | Yes | Category: `system_ml`, `web`, `tool`, etc. |
| `title` | string | Yes | Display name of the project |
| `summary` | string | Yes | 1-2 sentence description (used for semantic matching) |
| `tech_tags` | string[] | No | Tech stack (e.g., `["PYTHON", "REACT"]`) |
| `github_url` | string | No | GitHub repository link |
| `live_url` | string | No | Deployed project URL |
| `year` | number | No | Year created/published |

## Tech Tag Standards

Use UPPERCASE for consistency with the semantic matching system:

**Languages**
- `PYTHON`, `JAVASCRIPT`, `TYPESCRIPT`, `RUST`, `GO`, `JAVA`, `C++`, `RUBY`, `PHP`, `SWIFT`, `KOTLIN`, `C`, `HTML`, `CSS`, `SCSS`, `SHELL`

**Frameworks**
- `REACT`, `NEXT`, `VUE`, `SVELTE`, `ANGULAR`, `DJANGO`, `FLASK`, `FASTAPI`, `EXPRESS`, `RAILS`

**Tools & Platforms**
- `DOCKER`, `KUBERNETES`, `AWS`, `GCP`, `VERCEL`, `PYTORCH`, `TENSORFLOW`, `POSTGRES`, `MONGODB`, `REDIS`, `GRAPHQL`, `REST`

**Specialized**
- `WASM`, `WEBGL`, `THREEJS`, `OPENTYPE`, `TRANSFORMERS`, `LLM`, `ML`, `AI`, `BLOCKCHAIN`

## Customizing the Sync Script

Edit `scripts/fetch-github-repos.js` to change behavior:

### Filter Repositories

```javascript
// Only sync repos with specific topics
const activeRepos = repos.filter(repo => 
  !repo.fork && 
  !repo.archived &&
  repo.topics?.includes('portfolio')
);
```

### Custom Description Extraction

```javascript
function extractDescription(readmeContent) {
  // Look for a specific section
  const match = readmeContent.match(/## Description\s*\n\s*(.+)/);
  return match ? match[1] : null;
}
```

### Custom Categories

```javascript
function categorizeRepo(repo, readme) {
  const combined = `${repo.description} ${readme}`.toLowerCase();
  
  if (/web|frontend|ui|ux/.test(combined)) return 'web';
  if (/api|backend|server/.test(combined)) return 'api';
  if (/ml|ai|neural|model/.test(combined)) return 'system_ml';
  if (/cli|tool|utility/.test(combined)) return 'tool';
  
  return 'other';
}
```

## Semantic Matching Configuration

The robot uses **cosine similarity** on embeddings to match pills to projects.

### Adjusting the Threshold

Edit `lib/ai/matchmaker.ts`:

```typescript
// Default: 0.40 (balanced)
if (bestMatch && bestMatch.score >= 0.40) {
  return bestMatch.id;
}

// Strict (fewer matches): 0.50
// Lenient (more matches): 0.30
```

### Improving Match Quality

**Better Summaries = Better Matches**

❌ Bad: "A Python project"
✅ Good: "Machine learning pipeline for sentiment analysis using transformers"

**Add Keywords to Summaries**

If pills for "neural network" aren't matching, add that phrase to relevant project summaries.

**Tech Tags Don't Affect Matching**

Only the `summary` field is used for semantic routing. Tech tags are display-only.

## GitHub API Rate Limits

**Without Token**: 60 requests/hour
**With Token**: 5,000 requests/hour

Add a GitHub Personal Access Token to increase limits:

```env
GITHUB_TOKEN=ghp_your_token_here
```

Create token at: [github.com/settings/tokens](https://github.com/settings/tokens)
- No scopes needed for public repos
- `repo` scope needed for private repos

## Automation with GitHub Actions

Auto-sync on push to main:

`.github/workflows/portfolio-sync.yml`:

```yaml
name: Portfolio Sync

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Sync to Supabase
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: npm run sync:supabase
```

## Troubleshooting

### "No repositories found"

Check GitHub username in `scripts/fetch-github-repos.js`:

```javascript
const GITHUB_USERNAME = 'your-username';
```

### "Failed to fetch languages"

Temporary API issue - rerun sync after a few minutes.

### Pills not matching any projects

1. Check project summaries are detailed (>50 chars)
2. Lower threshold in `lib/ai/matchmaker.ts`
3. Add relevant keywords to summaries
4. Re-initialize matchmaker: reload page after updating JSON

### Build error: "Cannot find module portfolio-entries.json"

Run sync first:

```bash
npm run sync:github
```

Or create an empty file:

```bash
mkdir -p lib/data
echo "[]" > lib/data/portfolio-entries.json
```

## Best Practices

1. **Meaningful READMEs**: First paragraph should describe what the project does
2. **Consistent Naming**: Use kebab-case for repo names (they become IDs)
3. **Add Topics**: GitHub topics improve categorization
4. **Set Homepage**: Add live URLs to GitHub repo settings
5. **Archive Old Repos**: Archived repos are automatically excluded
6. **Regular Syncing**: Re-sync weekly or after major repo changes

---

**Next**: Check out [CLAUDE.md](./CLAUDE.md) for the AI system architecture
