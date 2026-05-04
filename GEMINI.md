# MRT (My Recovery Toolkit) - Gemini CLI Mandates

These instructions are foundational mandates for the Gemini CLI. They take absolute precedence over general workflows and establish the constraints for all AI operations within this workspace.

## Core Directives
1. **Strictly adhere to the existing codebase.** Do not pull patterns, file names, or architectural decisions from outside this repository.
2. **Spec-Driven Development:** Read the `/docs/specs` and `/docs/projects` directories for feature requirements before implementing changes. Never proceed with any feature that lacks a spec file.
3. **Ask Before Acting:** If required context, files, or patterns are unclear or missing, STOP and ask for clarification before writing code.

## Security & Zero-Knowledge Encryption Boundary (CRITICAL)
- **Zero-Knowledge Policy:** Client-side AES-GCM zero-knowledge encryption is the absolute boundary. Plain text sensitive data (Journals, Workbook Answers, Service notes) NEVER leaves the client device.
- **Keys:** Derived via PBKDF2 (PIN + Salt).
- **Encryption Handling Rules:**
  - Encrypt data BEFORE any Firestore write (always respect the `src/lib/crypto.ts` pipeline).
  - Decrypt data ONLY at the UI/render boundary.
  - NEVER store decrypted sensitive data in global state, React Query cache, or context.
  - NEVER log decrypted sensitive data to the console.
- **AI Integration (Gemini):** AI requests MUST NOT include raw sensitive content unless explicitly approved and sanitized. Never send encrypted blobs or raw sensitive user data to Gemini. Treat AI responses as untrusted input and validate before use.

## Data Flow & Offline-First Rules
- **TanStack Query** wraps ALL Firestore operations (`src/hooks/`). All server state MUST flow through TanStack Query (`useQuery`/`useMutation`). It is the single source of truth for remote data.
- **Offline-First:** All writes must succeed without network connectivity. Mutations must support optimistic updates, handle rollback on failure, and sync safely when the connection resumes.
- **Firestore:** No magic strings; rely on established collection names. Use Firestore `Timestamp` for backend storage only. Always convert using `.toDate()` before UI usage.

## Coding Standards & Code Quality
- **Tech Stack:** React 19, Vite, Tailwind CSS v4, TypeScript, Firebase 12.
- **Type Safety:** ZERO `any` types. Use `unknown` and cast via interfaces. Use `import type { }` for type-only imports.
- **Cleanups:** Delete unused imports immediately. Prefix intentionally unused variables with `_`.
- **Safety Checks:** Use guard clauses before Firebase calls (`if (!user) return;`). Provide fallbacks for optional/legacy fields (`entry.moodScore ?? 0`).

## UX & Personas
- **UX Rules:** Prioritize speed and low cognitive load. Maximize responsiveness in critical flows (especially crisis/urge interactions). Minimize re-renders.
- **Personas:** When reviewing any UI change, ask "how does this feel for David in an acute crisis state?" (David: High anxiety, acute crisis, max 3 taps per flow).

## Testing & Validation
- **Quality Checks:** `npm run lint` (zero warnings allowed), `npm run test`, `npm run check` (full pipeline).
- **Anti-Regression:** Do not break existing features while adding new ones. Ensure compatibility with existing encryption, Firestore schema, and React Query logic.
