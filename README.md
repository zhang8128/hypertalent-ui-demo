# Hypertalent UI

Next.js frontend for the DealHunter talent deal discovery platform.

## Live Deployment

**Production**: https://prod.d3szz4d7l7jwf4.amplifyapp.com

## Tech Stack

- **Framework**: Next.js 14.2.16 (Static Export)
- **UI Components**: Radix UI + shadcn/ui patterns
- **Styling**: TailwindCSS 4.1.9
- **Forms**: React Hook Form + Zod validation
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, this points to the AWS API Gateway endpoint.

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build

```bash
npm run build
```

This generates a static export in the `out/` directory.

## Project Structure

```
hypertalent-ui-demo/
├── app/                    # Next.js app router
│   └── page.tsx            # Main dashboard page
├── components/
│   ├── ui/                 # Reusable UI primitives (button, card, dialog, etc.)
│   ├── tools/              # Tool-specific result panels
│   ├── ai-deal-discovery-engine.tsx    # Multi-agent deal orchestration
│   ├── hyper-computer-terminal.tsx     # AI chat interface
│   ├── results-panel.tsx               # Dynamic right panel
│   ├── talent-selector.tsx             # Talent profile selection
│   ├── talent-profile-manager.tsx      # Profile CRUD
│   ├── pipeline-management-dashboard.tsx  # CRM pipeline view
│   ├── deal-evaluation-interface.tsx   # Deal scoring
│   └── outreach-generation-system.tsx  # Outreach creation
├── services/
│   └── api-client.ts       # Type-safe API client
├── types/
│   └── deal.ts             # TypeScript interfaces
└── public/                 # Static assets
```

## Key Components

| Component | Description |
|-----------|-------------|
| `ai-deal-discovery-engine` | Orchestrates multi-agent deal discovery workflow |
| `hyper-computer-terminal` | Interactive AI chat with agent simulation |
| `talent-profile-manager` | Full talent profile CRUD with document uploads |
| `pipeline-management-dashboard` | CRM-style deal pipeline with drag-and-drop |
| `deal-evaluation-interface` | Deal scoring and compatibility analysis |
| `outreach-generation-system` | AI-generated outreach templates |

## API Integration

The frontend communicates with the FastAPI backend via `services/api-client.ts`. Key endpoints:

- `POST /api/chat/start` - Start chat session with talent files
- `POST /api/chat/message` - Send message to AI assistant
- `POST /api/deals/search` - Async deal search
- `GET /api/deals/status/{id}` - Check search status
- `POST /api/talents` - Create/update talent profiles

See the [API Reference](../documentation/api-reference.md) for full documentation.

## Deployment

The frontend is deployed to AWS Amplify via GitHub Actions. See [Deployment Guide](../documentation/deployment.md) for details.

```bash
# Manual build for deployment
npm run build
# Output is in out/ directory (static export)
```
