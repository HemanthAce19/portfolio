# Hemanth Pandiyaraj · Portfolio

My personal site: who I am, what I have built, and the tests that prove it works.

![Screenshot of the portfolio home page](docs/screenshot.png)

## Highlights

- **Interactive hero.** A canvas animation of a spine-leaf network fabric with packets routed leaf to spine to leaf. Hovering a switch lights up its links.
- **Typed content layer.** Every project, role and skill is data in [`lib/content.ts`](lib/content.ts), checked by TypeScript in strict mode. Components only render.
- **Typography-led dark design.** A serif display face, one accent colour and hairline rules. No cards, gradients or stock effects.
- **Accessible by default.** Semantic landmarks, visible focus states, AA contrast, and support for `prefers-reduced-motion`.
- **Zero UI dependencies.** Next.js, React and TypeScript only. No component kit, no CSS framework, no animation library.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router), statically prerendered |
| Language | TypeScript, strict mode |
| Styling | Plain CSS with custom properties |
| Animation | Canvas 2D API |
| Hosting | Vercel |

## Project structure

```
app/
  layout.tsx          Metadata and the HTML shell
  page.tsx            Page composition
  globals.css         Design tokens and all styles
components/
  FabricCanvas.tsx    Animated network hero (client component)
  ProjectCard.tsx     Project case-study row
lib/
  content.ts          Typed site content
public/               Static assets, including the resume PDF
```

## Getting started

Requires Node.js 20 or later.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Check types without emitting files |

## Editing content

All copy lives in `lib/content.ts`. To add a project, append an object to the `projects` array. The `Project` type tells you which fields are required.

## Design tokens

Defined at the top of `app/globals.css`.

| Token | Purpose |
|-------|---------|
| `--bg`, `--ink`, `--muted` | Page background, text, secondary text |
| `--line` | Hairline rules between rows and sections |
| `--accent` | The single accent colour, used for links, packets and proof numbers |
| `--serif`, `--sans`, `--mono` | Display, body and label typefaces |
| `--section` | Vertical rhythm between sections |

## Deployment

The site deploys to Vercel on every push to `main`. No environment variables are needed.

## Licence

The code is available under the MIT licence. The written content and resume are my own and are not licensed for reuse.
