# Recording a demo GIF for GitHub

A short demo GIF in the README is one of the highest-impact steps for stars and GitHub discovery.

## Recommended specs

| Setting | Value |
|---------|--------|
| Resolution | 1280×720 or 1200×675 |
| Length | 10–20 seconds |
| Format | GIF or WebP (GitHub supports both) |
| Max size | Under 5 MB (use [ezgif.com](https://ezgif.com/optimize) to compress) |
| Output path | `docs/demo.gif` |

## Suggested script (15 seconds)

1. Open app → show Microservices template (2s)
2. Open AI panel → paste quick prompt "E-Commerce Payment" → Generate (5s)
3. Canvas updates with new diagram (3s)
4. Click Simulate → highlight flow (3s)
5. Copy share link (2s)

## Tools (Windows)

- [ScreenToGif](https://www.screentogif.com/)
- [ShareX](https://getsharex.com/) → capture → convert to GIF
- OBS Studio → export short clip → convert on ezgif.com

## After recording

1. Save as `docs/demo.gif`
2. In `README.md`, uncomment:
   ```markdown
   ![DevWorkflow Canvas demo](docs/demo.gif)
   ```
3. Commit and push
