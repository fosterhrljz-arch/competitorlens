# CompetitorLens V1.5

This directory is the complete standalone project. Provide complete English and Simplified Chinese UI localization. Keep original research and quotations unchanged. Documentation may include English and Chinese launch/configuration instructions.

## Non-negotiable product rules

- Never generate or simulate real traffic, demographics, revenue, market share, or audience sizes.
- Keep fictional records marked `demo` and fictional sources marked `Demo`, including exports and imports.
- Label inferred opportunity claims, expose their basis, and explain limitations.
- Treat missing information as unknown, never as absent.
- Preserve full evidence, source methods, audience mappings, and opportunity history in schema-4 backups. Accept schema-1, schema-2, and schema-3 backups without changing legacy notes.
- Never copy competitor-wide research into audience-specific fields or silently apply an old validation decision to new evidence.
- Preserve research runs, finding classifications, exact quotations, and confidence explanations. Never turn a URL or keyword match into a verified claim.
- Collection uses a bounded public-only local service; keep its token, origin, DNS, redirect, robots, and size checks intact.
- Keep core workflows offline-capable. Make network access explicit and user initiated.
- Never silently overwrite unreadable browser storage.

## Working conventions

- Explain the purpose and risk before file changes, commands, or external account actions.
- Keep the architecture simple: React components, pure domain helpers, versioned local storage.
- Use native controls and the V1.2 blue, purple, green, orange, and neutral design tokens. Keep mobile and print layouts usable.
- Run `npm run build` after source changes. The portable bundle must run after the root element exists and must have no external script or style dependencies.
- Run `npm test` for domain/import/export changes and `npm run test:e2e` for meaningful workflow changes.
- Keep generated screenshots and temporary test artifacts outside the source tree.
- Package the prebuilt `CompetitorLens.html`, README, source, lockfile, and tests. Exclude `node_modules` and test result folders.
- Do not create an AgentGit session, Git remote, deployment, or external account integration unless requested.

- AI keys belong only to the local service credential vault; never serialize them into frontend storage, reports, logs, exports, or backups.
- A save is successful only after read-back verification. Preserve failed-save recovery data and drafts.
