<div align="center">
  <img src="public/brand/anymd-logo.png" alt="AnyMD by Mavent" width="520" />

  <p><strong>Turn a rough product idea into a clear brief and agent-ready Markdown.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.9" />
    <img src="https://img.shields.io/badge/Playwright-tested-2EAD33?logo=playwright&logoColor=white" alt="Tested with Playwright" />
    <img src="https://img.shields.io/badge/status-active_development-FFB000" alt="Active development" />
  </p>
</div>

## What is AnyMD?

AnyMD is a guided product-definition workspace. It helps turn an early idea into
two practical files:

- `prd.md` describes the product, scope, priorities, architecture, and delivery plan.
- `AGENTS.md` tells coding agents how to work on the project safely and consistently.

Instead of starting with a blank document, users move through a focused sequence
of clarification, skill matching, generation, review, and export.

## Product Flow

```mermaid
flowchart LR
    A[Describe the idea] --> B[Clarify goals and constraints]
    B --> C[Match relevant skills]
    C --> D[Generate structured documents]
    D --> E[Review or rebuild sections]
    E --> F[Copy or download Markdown]
```

## Highlights

- Guided clarification with conditional questions.
- Automatic skill recommendations from a structured catalog.
- Structured and raw Markdown previews.
- Focused section rebuilds without replacing the whole document.
- One-click copy and local Markdown downloads.
- Responsive layouts tested on desktop and mobile Chromium.
- Accessible navigation, status feedback, and keyboard interactions.
- Strict document validation before generated content reaches the UI.

<img src="docs/assets/anymd-home-desktop.png" alt="AnyMD idea workspace on desktop" width="100%" />

## Architecture

```mermaid
flowchart TB
    subgraph Browser
        UI[Next.js interface]
        State[In-memory draft state]
        Preview[Document preview and export]
    end

    subgraph Application
        Routes[App Router pages]
        Skills[Skills catalog API]
        Generate[Document generation API]
        Contract[Document contract validation]
    end

    Catalog[(Verified skill catalog)]
    Service[Configured generation service]

    UI --> State
    State --> Routes
    Routes --> Skills
    Routes --> Generate
    Skills --> Catalog
    Generate --> Service
    Service --> Contract
    Contract --> Preview
```

The browser keeps the active draft in memory. Server routes handle catalog access
and document generation, while a strict contract validates every generated bundle
before it is returned to the interface.

## Local Development

### Requirements

- Node.js 20 or newer
- npm

### Start the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Gates

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

| Command | Purpose |
|---|---|
| `npm test` | Run unit and route-handler tests |
| `npm run lint` | Check code quality with ESLint |
| `npm run typecheck` | Generate route types and run TypeScript checks |
| `npm run build` | Create a production build |
| `npm run test:e2e` | Test critical desktop and mobile journeys |

## Project Structure

```text
anymd/
├── app/              # Pages, metadata, and route handlers
├── components/       # Product journey and reusable interface pieces
├── data/             # Verified fallback catalog data
├── e2e/              # Browser journey tests
├── lib/              # Validation, generation, and domain logic
├── public/           # Brand and interface assets
└── tests/            # Unit and API tests
```

## Security

- Generated Markdown is rendered as text rather than injected as raw HTML.
- User-provided content is treated as untrusted input.
- Public errors are sanitized before they reach the browser.
- Content Security Policy and browser hardening headers are enabled.
- Sensitive local files are excluded from Git.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Keep changes
small, include tests for behavior changes, and run every quality gate above.

## License

No open-source license has been selected yet. Until a license file is added, no
license rights are granted beyond applicable law.
