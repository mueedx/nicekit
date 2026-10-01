# Change log

## 2026-10-01

- Shipped the ChatGPT Chat Export tool (Markdown, TXT, DOCX, PDF) at `/tools/chatgpt-export` with new `/api/chatgpt` and `/api/chatgpt/export` routes.
- Added a React Router turbo-stream decoder for public `chatgpt.com/share` conversations (`lib/chatgpt.ts`).
- Extracted shared chat renderers into `lib/chat-export.ts`; the DOCX/PDF exporters now consume a provider-agnostic `DocChat`.
- Added the ChatGPT brand mark, tools-registry entry, and a 12-case parser test suite.
- Updated `README.md`, `public/llms.txt`, and the tool section numbering.
