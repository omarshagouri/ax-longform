# ax-longform

AmpCoreX long-form video system, completely isolated from the working Shorts stack.

## Repository layout

- `card-service/` — live Card Lab service used while designing `VC-LF-*` cards. Keeps the existing `/render-beat` contract so the current Card Builder only needs a new endpoint URL and LF card IDs.
- `video-service/` — Remotion 1920x1080 chapter renderer for production.
- `video-service/Cards/` — single source of truth for long-form card templates.

## Hard separation from Shorts

This repo does not call, import, deploy over, or modify `ax-cards`, `ax-render`, or `ax-video`.

Long-form naming:
- Cards: `VC-LF-###`
- Card Lab Cloud Run service: recommended `ax-longform-card`
- Video Cloud Run service: recommended `ax-longform-video`

## Start here

Deploy only `card-service` first. Test `VC-LF-001` in the existing Card Builder. Do not deploy `video-service` until the landscape card system is visually locked.
