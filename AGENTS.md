<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Chatlybook Project Notes

## Project Overview

Chatlybook is a Next.js App Router application that turns uploaded PDFs into private, voice-searchable books.

- Users authenticate with Clerk.
- Users upload a PDF and optional cover image from the browser.
- The PDF is parsed client-side with `pdfjs-dist`, split into text segments, then persisted in MongoDB.
- Original PDF and cover assets are stored in Vercel Blob.
- Each book can be opened as a voice session powered by Vapi.
- During a call, Vapi invokes the protected `searchBook` tool, which retrieves relevant book segments and returns joined context text.
- Subscription limits gate how many books a user can upload and how many voice sessions they can start.

## Key Implementation Surfaces

- `components/UploadForm.tsx`: upload flow, PDF parsing trigger, blob upload, book creation, segment persistence.
- `lib/utils.ts`: PDF parsing, text segmentation helpers, regex escaping.
- `lib/actions/book.actions.ts`: book CRUD, segment persistence, segment retrieval with MongoDB text search and regex fallback.
- `app/api/upload/route.ts`: authenticated Vercel Blob upload token generation.
- `app/api/vapi/search-book/route.ts`: authenticated tool endpoint used by Vapi to retrieve context.
- `hooks/useVapi.ts`: Vapi session lifecycle, transcript handling, plan-limit enforcement.
- `lib/actions/session.actions.ts`: voice session persistence and billing-period limit checks.
- `database/models/*.ts`: `Book`, `BookSegment`, and `VoiceSession` schemas.

## Build And Validation Commands

- `npm install`: install dependencies.
- `npm run dev`: start the local Next.js dev server.
- `npm run lint`: run ESLint; this is the main automated validation currently wired in the repo.
- `npm run build`: production build validation for App Router, server actions, and route handlers.
- `npm run start`: run the production build locally after `npm run build`.

## Code Style Guidelines

- Keep changes minimal and local to the behavior being modified.
- Prefer server components by default in `app/`; add `"use client"` only for interactive UI or browser-only APIs.
- Keep mutations and data access in server actions or route handlers, not in presentation components.
- Use the existing `@/` import alias consistently.
- Preserve the current TypeScript-first style, explicit guards, and early returns for auth/error handling.
- Follow existing Tailwind utility patterns and current component structure instead of introducing a parallel design system.
- Reuse existing helpers such as `escapeRegex`, `serializeData`, subscription utilities, and model access patterns before adding new abstractions.
- When touching retrieval or parsing, keep ownership scoping (`clerkId`) and limit checks intact.

## Testing Instructions

There is no dedicated automated test suite configured yet.

- Run `npm run lint` after changes.
- Run `npm run build` for changes that affect routing, server actions, environment usage, or type boundaries.
- Manually smoke test the affected workflow in the browser.
- For upload/search work, validate this path end-to-end: sign in, upload a PDF, confirm `Book` and `BookSegment` records persist, open the book page, then trigger a Vapi search request.
- For subscription changes, verify both allowed and limit-reached paths.

## Security Considerations

- Treat `MONGODB_URI`, `BLOB_READ_WRITE_TOKEN`, Clerk secrets, and Vapi configuration as secrets; never hardcode or log them.
- All book, segment, and voice-session access must remain scoped to the authenticated Clerk user.
- Preserve auth checks in server actions and API routes; do not trust client-provided ownership fields.
- `escapeRegex` exists to prevent unsafe regex construction from user queries. Reuse it for any regex-based search paths.
- Blob uploads must stay behind the authenticated token-generation route and continue enforcing file type and size limits.
- Do not expose raw database internals or cross-user segment data in Vapi responses.
- Avoid broadening search queries, logs, or analytics payloads with full book contents unless explicitly required and reviewed.

## Working Assumptions For Future Changes

- PDF parsing currently happens in the browser, not on the server.
- Retrieval quality is intentionally simple today: MongoDB text search first, regex keyword fallback second.
- The app is multi-tenant by user ownership, not by shared libraries or organizations.
- Voice conversations depend on the Vapi assistant calling the `searchBook` tool with `bookId` and `query`.
- If a change affects upload, retrieval, or Vapi orchestration, update both this file and the README flow section.
