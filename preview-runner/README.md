# visudev

Preview Runner for [VisuDEV](https://github.com/iamthamanic/Visudevfigma): clone repo, build and run the app, expose a URL for the Live App / AppFlow view.

## Quick start

```bash
npx visudev-runner
```

Starts the runner on port 4000 (override with `PORT=4001 npx visudev-runner`).

## AppFlow

- **Local:** Run the VisuDEV app with `npm run dev` (in the repo). In dev mode the app uses `http://localhost:4000` by default. Start the runner in another terminal: `npx visudev-runner`. AppFlow will use it.
- **Deployed app:** Set `PREVIEW_RUNNER_URL` in Supabase (Edge Function secrets) to the runner’s public URL (e.g. `https://your-runner.example.com`). Run the runner on that server with `npx visudev-runner`.

## Env (optional)

- `PORT` – API port (default 4000)
- `USE_REAL_BUILD=1` – clone, build and run the app (default stub)
- `USE_DOCKER=1` – run each preview in a container
- `GITHUB_TOKEN` – for private repos
- `GITHUB_WEBHOOK_SECRET` – for webhook signature verification

## API

- `POST /start` – start a preview (body: `repo`, `branchOrCommit`, `projectId`)
- `GET /status/:runId` – status and `previewUrl`
- `POST /stop/:runId` – stop and free port
- `POST /refresh` – pull, rebuild, restart for a run
- `GET /health` – health check

Later this package will grow into the full local VisuDEV stack (`npx visudev`).
