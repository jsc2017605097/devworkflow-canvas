# Contributing to DevWorkflow Canvas

Thank you for helping make DevWorkflow Canvas better! 🎉

## How to contribute

1. **Fork** the repository
2. **Create** a branch: `git checkout -b feat/your-feature`
3. **Make** your changes with clear commits
4. **Run** checks locally:
   ```bash
   npm run lint
   npm run build
   ```
5. **Open** a Pull Request with a clear description and screenshots/GIF if UI changes

## Development setup

```bash
git clone https://github.com/jsc2017605097/devworkflow-canvas.git
cd devworkflow-canvas
npm install
cp .env.example .env
# Add GEMINI_API_KEY to .env
npm run dev
```

## Code guidelines

- Match existing TypeScript + React patterns
- Keep UI copy bilingual-friendly (EN/VI) where user-facing
- Do not commit `.env` or API keys
- Prefer small, focused PRs over large rewrites

## Reporting bugs

Use the [Bug report template](.github/ISSUE_TEMPLATE/bug_report.yml) and include:

- Steps to reproduce
- Expected vs actual behavior
- Node.js version
- Browser (if frontend issue)

## Feature requests

Open an issue with the [Feature request template](.github/ISSUE_TEMPLATE/feature_request.yml) and describe the use case.

## Adding a demo GIF

Place `docs/demo.gif` (recommended: 1280×720, &lt;5MB) and update the README demo section. This greatly helps discovery on GitHub.
