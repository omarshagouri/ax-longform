# AmpCoreX Long Form — Card Lab service

A completely separate 16:9 authoring service for long-form cards.

- Canvas: 1920x1080
- FPS: 30
- Existing Card Builder contract retained: `POST /render-beat`
- Card IDs: `VC-LF-*`
- Cards are fetched live from this repo (`video-service/Cards`) so a card edit does not require a service redeploy.

Required Cloud Run env vars:
- `LONGFORM_RENDER_API_KEY`
- `GITHUB_TOKEN` (required if the repo is private)
- `GH_USER=omarshagouri`
- `GH_REPO=ax-longform`
- `GH_BRANCH=main`
- `CARDS_DIR=video-service/Cards`
