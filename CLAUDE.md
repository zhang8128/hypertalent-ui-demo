# CLAUDE.md

This file provides guidance to Claude Code when working with the HyperTalent frontend.

## Build & Run Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # ESLint
npm start            # Start production server
```

## Tech Stack

- Next.js 14 (App Router, `app/` directory)
- React 18, TypeScript
- Tailwind CSS 4 with shadcn/ui components (`components/ui/`)
- Lucide React icons

## Project Structure

```
hypertalent-ui-demo/
├── app/                    # Next.js App Router (layout.tsx, page.tsx)
├── components/             # Feature components
│   ├── ui/                 # shadcn/ui primitives (Button, Dialog, etc.)
│   ├── talent-selector.tsx # Talent picker with file upload + discovery trigger
│   ├── talent-profile-manager.tsx  # Full profile CRUD with doc upload
│   ├── talent-profile-modal.tsx    # Profile detail/edit modal with docs tab
│   ├── file-upload-zone.tsx        # Drag-and-drop file upload zone
│   └── ...
├── services/
│   ├── api-client.ts       # Centralized API client (all backend calls)
│   └── export-service.ts   # CSV/Sheet export helpers
├── lib/
│   ├── s3-upload.ts        # Shared S3 upload utility (uploadFileToS3, formatFileSize, getFileIcon)
│   ├── upload-constants.ts # Accepted MIME types, max file size
│   └── utils.ts            # cn() Tailwind merge helper
├── types/
│   └── talent.ts           # TalentProfile, UploadedFile, TalentDocument types
└── .env.production         # NEXT_PUBLIC_API_URL (CloudFront endpoint)
```

## Key Patterns

### API Client
All backend calls go through `services/api-client.ts`. It handles base URL resolution from `NEXT_PUBLIC_API_URL` and provides typed methods for every endpoint.

### S3 Upload Flow
1. Component calls `apiClient.getPresignedUploadUrl()` or `apiClient.getTalentDocUploadUrl()` to get presigned POST data
2. Component delegates to `uploadFileToS3()` from `lib/s3-upload.ts` which handles the XHR POST with progress callbacks
3. Each component manages its own state (files list, uploading status) but shares the upload mechanics

### SSE Streaming
The discovery pipeline uses Server-Sent Events. The API client opens an EventSource connection to the backend's `/api/discovery/stream` endpoint. CloudFront (not API Gateway) fronts this to avoid the 30-second timeout.

### Environment
- `NEXT_PUBLIC_API_URL` — backend API base URL (CloudFront distribution in production)
