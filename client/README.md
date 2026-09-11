# Adaptive English — Client

Vite + React client for the adaptive learning server. See the root `README.md` for full setup.

```bash
npm run dev      # http://localhost:5173 (proxies /api to http://localhost:4000)
npm run build    # production build in client/dist
npm run preview  # serve the build locally
```

Configuration (`client/.env`, optional — see `.env.example`):

- `VITE_API_URL` — API origin when the client is hosted separately from the server. Leave empty in development.
- `VITE_PROXY_TARGET` — backend used by the dev/preview proxy (default `http://localhost:4000`).

Google sign-in appears automatically when the server has `GOOGLE_CLIENT_ID` configured.
