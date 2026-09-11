# Project working agreements

- Keep `main` for owner-selected stable releases. Work on `feature/*` or `fix/*`
  branches from `develop`; integrate tested changes into `develop`.
- Commit after each significant change, as requested by the owner.
- This is a self-hosted Debian/Ubuntu site behind Cloudflare, based on the
  install/update workflow in `../Mark-wedding-site`. Do not convert hosting to
  Workers or Sites or add a database without a reason from the user’s task.
- All venue addresses and schedule facts belong in `src/data/schedule.ts`.
  Preserve uncertainty; do not invent apartment departure times or transport.
- Keep payment administration out of public assets. `docs/PLANNING.md` holds the
  supplied booking note and source references.
- Preserve system light/dark mode, reduced motion, keyboard access, and the
  manual clipboard fallback for insecure origins or denied permissions.
- Run `npm run check` for schedule or UI logic changes. For deployment changes,
  run Bash syntax checks and ShellCheck when available. Do not claim a VM or
  Docker test ran when that runtime was unavailable.
- VM updates must preserve `.env`, refuse local/diverged changes, and check the
  new container before reporting success. Never reset a VM checkout silently.
