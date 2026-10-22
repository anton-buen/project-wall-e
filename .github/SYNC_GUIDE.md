# GitHub Portfolio Sync Guide

## Overview

Editorial Automata automatically syncs your GitHub repositories to populate the portfolio sidebar. This guide shows you how to set it up and customize the content.

## Quick Setup (3 minutes)

### Step 1: Verify Username

Check that `scripts/fetch-github-repos.js` has your correct GitHub username:

```javascript
const GITHUB_USERNAME = 'anton-buen';
```

### Step 2: Run Sync

```bash
npm run sync:github
```

This creates `lib/data/portfolio-entries.json` with all your public repos.

### Step 3: Build & Run

```bash
npm run build
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) - your repos should now appear in the sidebar!

## What Gets Synced?

✅ **Included**:
- Public repositories
- Non-forked repositories
- Non-archived repositories

❌ **Excluded**:
- Private repositories (unless using GitHub token with `repo` scope)
- Forked repositories
- Archived repositories

## How Data is Extracted

### 1. Repository Title
Converted from kebab-case to Title Case:
- `project-wall-e` → "Project Wall E"
- `cognitive-alignment-engine` → "Cognitive Alignment Engine"

### 2. Summary/Description

**Priority order**:
1. First meaningful paragraph from README.md (>30 chars)
2. GitHub repository description
3. Fallback: "A {language} project"

**README Parsing Rules**:
- Skips headings (`#`), code blocks (` ``` `), badges, empty lines
- Removes markdown formatting (`**bold**`, `*italic*`, `[links]()`)
- Takes first substantial paragraph

### 3. Tech Tags

Extracted from GitHub's language statistics:

```
JavaScript → JAVASCRIPT
TypeScript → TYPESCRIPT
Python → PYTHON
Rust → RUST
... (see PORTFOLIO.md for full list)
```

Limits to top 5 languages by byte count.

### 4. Links

- `github_url`: Always populated with repo URL
- `live_url`: From GitHub repo homepage field (if set)

### 5. Year

Extracted from repository creation date.

## Customizing What Gets Synced

### Filter by Topics

Edit `scripts/fetch-github-repos.js`:

```javascript
const activeRepos = repos.filter(repo => 
  !repo.fork && 
  !repo.archived &&
  (repo.topics || []).includes('portfolio')  // Only sync repos with "portfolio" topic
);
```

Then add "portfolio" topic to repos in GitHub settings.

### Include Private Repos

1. Create GitHub Personal Access Token:
   - Go to [github.com/settings/tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Select `repo` scope
   - Copy token

2. Add to `.env.local`:

```env
GITHUB_TOKEN=ghp_your_token_here
```

3. Re-run sync:

```bash
npm run sync:github
```

### Exclude Specific Repos

```javascript
const activeRepos = repos.filter(repo => 
  !repo.fork && 
  !repo.archived &&
  !['repo-to-exclude', 'another-repo'].includes(repo.name)
);
```

## Improving Project Descriptions

The robot uses semantic matching on the `summary` field. Better descriptions = better matching.

### ❌ Bad README (Generic)

```markdown
# My Project

A web application.

## Installation
...
```

Result: "A web application" (robot won't know what it does)

### ✅ Good README (Descriptive)

```markdown
# My Project

> Real-time collaborative code editor with AI-powered suggestions and live pair programming features.

## Features
...
```

Result: Pills like "editor", "collaborative", "AI" will match correctly.

### Writing Tips

**First paragraph should answer**:
1. What does it do?
2. What problem does it solve?
3. What makes it unique?

**Include keywords** the robot should match:
- Technology names: "React", "TensorFlow", "PostgreSQL"
- Domain terms: "machine learning", "data pipeline", "API"
- Problem space: "sentiment analysis", "image processing", "real-time"

## Setting Homepage URLs

The sidebar shows a link icon for projects with `live_url`.

**In GitHub**:
1. Go to repo settings
2. Under "Website" section
3. Enter deployed URL (Vercel, Netlify, custom domain)
4. Re-run sync

## Automation

### Auto-sync on Deploy

For Vercel/Netlify, add build command:

```json
{
  "scripts": {
    "build": "npm run sync:github && next build"
  }
}
```

Every deployment pulls fresh data from GitHub.

### Weekly Sync with GitHub Actions

Create `.github/workflows/sync.yml`:

```yaml
name: Sync Portfolio

on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight
  workflow_dispatch:       # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - run: npm ci
      
      - name: Sync GitHub repos
        run: npm run sync:github
        
      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add lib/data/portfolio-entries.json
          git commit -m "chore: sync portfolio data" || exit 0
          git push
```

## Manual Overrides

After syncing, you can manually edit `lib/data/portfolio-entries.json`:

```json
{
  "id": "project-wall-e",
  "title": "Editorial Automata",  // Custom title
  "summary": "An AI-powered portfolio with autonomous organization...",  // Better description
  "tech_tags": ["TYPESCRIPT", "REACT", "NEXT"],  // Simplified tags
  "github_url": "https://github.com/anton-buen/project-wall-e",
  "live_url": "https://wall-e.example.com",  // Add if not in GitHub
  "year": 2026
}
```

**Important**: Manual edits are overwritten on next sync. To persist changes, either:
1. Update the GitHub repo (description, README, homepage)
2. Or edit the sync script to preserve manual changes

## Troubleshooting

### Sync returns 0 repos

**Check**:
- GitHub username is correct
- You have public repositories
- GitHub API is accessible

**Test API directly**:
```bash
curl https://api.github.com/users/anton-buen/repos
```

### Rate limit exceeded

**Without token**: 60 requests/hour
**With token**: 5,000 requests/hour

Add `GITHUB_TOKEN` to `.env.local` (see "Include Private Repos" above).

### Descriptions are cut off

Sync script limits summaries to 300 characters. Edit `processRepo()` in `scripts/fetch-github-repos.js`:

```javascript
summary: summary.slice(0, 500),  // Increase limit
```

### Missing tech tags

GitHub doesn't detect languages:
1. Add `.gitattributes` to repo
2. Or manually edit JSON after sync

### Build fails after sync

Ensure JSON is valid:

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('lib/data/portfolio-entries.json')))"
```

If invalid, fix syntax or re-run sync.

## Best Practices

1. ✅ Write descriptive README intros (3-4 sentences)
2. ✅ Set GitHub repo descriptions (subtitle in UI)
3. ✅ Add homepage URLs for deployed projects
4. ✅ Use GitHub topics for categorization
5. ✅ Re-sync after major repo changes
6. ✅ Commit `portfolio-entries.json` to git
7. ❌ Don't edit JSON manually (unless you have a process to preserve changes)

## Next Steps

- **Semantic Matching**: See how the robot matches pills in [CLAUDE.md](../CLAUDE.md)
- **Full Customization**: Read [PORTFOLIO.md](../PORTFOLIO.md) for advanced config
- **Supabase Sync**: Set up database sync for dynamic updates

---

Questions? Open an issue on GitHub.
