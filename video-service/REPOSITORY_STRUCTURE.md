# AmpCoreX video-service structure

```text
video-service/
├── Animations/                 # ALL animation source and animation-specific QA
│   ├── registry.tsx            # Shared animation registry and core definitions
│   ├── continuous.tsx          # Continuous-motion visuals
│   ├── editorial.tsx           # Story-driven editorial visuals
│   ├── testing/                # Preview render and stress tests
│   └── README.md               # Visual IDs and usage
├── Cards/                      # VC-LF-### Python card design sources
├── src/
│   ├── cards/generated/        # Generated, build-consumed card definitions
│   ├── registry.ts             # Public asset dispatch
│   ├── AnimationPreview.tsx    # Animation preview composition
│   └── ...                     # Remotion video and UI implementation
├── scripts/                    # Non-animation card/build/deploy scripts
├── server/                     # Cloud Run API, assembly and validation
├── public/                     # Static backgrounds and images
├── Dockerfile
└── package.json
```

## Cleanliness conventions
- Animation source, animation testing and animation docs live under **Animations/**; card design sources remain under **Cards/**.
- `src/cards/generated/allCards.ts` remains generated in its current path because the runtime imports it; do not move without adjusting the generator.
- Generic assembly/audio/visual-plan validators remain in `server/`, alongside the code they test.
- GitHub workflows remain under `.github/workflows/` because GitHub Actions requires this location.
- Repository-wide policy snapshots are under `visual-policy/`. These are **not** animation assets and currently cannot control production.
- Historical deployment/setup notes remain where they are until reference audits show they can be safely consolidated.
- No production asset IDs, catalog IDs, interfaces, or Make endpoints should change during a file-layout cleanup.
- Old paths should be removed after imports and CI have been updated together, rather than kept as two independently editable versions.
