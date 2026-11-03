# Mercury Ai Analysis

Mercury Ai Analysis is a workspace for choosing and tracking frontier models. It ranks live model scores by the job you are doing, compares them on price and speed, and keeps a feed of AI news, papers, agent skills, and MCP servers.

## What you can do

- **Models.** Rank language, image, and speech models by coding, agents, general intelligence, math, speed, long context, or instruction following. Filter by release window, estimate request cost, and export the current ranking as CSV.
- **Compare.** Put up to four models side by side — scores, price, and speed — and keep a shortlist of favorites in the browser.
- **News.** Read recent lab and press coverage plus papers from public feeds.
- **Skills & Agents.** Browse highly starred agent skills and frameworks, and GitHub’s daily and weekly trending lists.
- **MCP.** Browse highly starred Model Context Protocol servers.

The interface is in English and Turkish. Model scores, prices, and latency come from [Artificial Analysis](https://artificialanalysis.ai/) and stay credited in the footer.

## Install

You do not need to clone the repository. The installer downloads a checksum-verified GitHub Release and keeps it under `~/.mercury-ai-analysis`.

```bash
curl -fsSL https://github.com/erdncyz/mercury-ai-analysis/releases/latest/download/install.sh | bash
mercury-ai-analysis up
```

Node.js is the only requirement. The app listens on http://127.0.0.1:4173.

Put API keys in `~/.mercury-ai-analysis/config/.env`. That file is kept when you update:

```bash
mercury-ai-analysis update
```

To install or roll back to an exact version:

```bash
curl -fsSL https://github.com/erdncyz/mercury-ai-analysis/releases/latest/download/install.sh | bash -s -- --version v1.0.0
```

A push to `main` bumps the package version from the commit message (`feat:` minor, breaking change major, everything else patch) and publishes the next release. The release commit itself is `chore(release): vX.Y.Z`.

## Stack

- Vite, React, and TypeScript
- Tailwind CSS v4
- Netlify Functions for the model API proxy, a six-hour cache, and the public feeds

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. During local development, Vite serves `/api/models` and `/api/pulse`.

Set these in `.env` (never commit the real file):

| Variable | Required | Purpose |
| --- | --- | --- |
| `ARTIFICIAL_ANALYSIS_API_KEY` | Yes, for live scores | Proxied server-side. The site falls back to a checked-in snapshot if the live request fails. |
| `GITHUB_TOKEN` | No | Raises the GitHub search limit for skills, agents, and MCP lists. A fine-grained token with no scopes is enough. |

Refresh the offline model snapshot:

```bash
npm run refresh-fallback
```

To run the Netlify functions locally:

```bash
npm run netlify:dev
```

## Deploy

`netlify.toml` already sends `/api/*` to the functions and falls back every other route to `index.html`.

1. Connect this repository to Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add `ARTIFICIAL_ANALYSIS_API_KEY`, and optionally `GITHUB_TOKEN`, in the site environment.

## Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/models` | Rankings |
| `/compare` | Side-by-side comparison |
| `/model/:slug` | One model |
| `/news` | News and papers |
| `/skills` | Skills, agents, and trending repositories |
| `/mcp` | MCP servers |
