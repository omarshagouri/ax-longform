# Long Form — Video service

Independent 16:9 Remotion renderer for long-form chapters.

Native format:
- 1920x1080
- 30 fps
- H.264
- cards `VC-LF-*` only

Endpoints:
- `GET /`
- `POST /render-video`
- `POST /build-and-render`
- `POST /render-chapter` (alias)

`/render-chapter` is the future long-form production path: one chapter in, one self-contained MP4 out. Full-video stitching will be added after card design is locked.
