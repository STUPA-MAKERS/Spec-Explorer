# Deploy

The explorer runs as one container (`deploy/Dockerfile`). The container serves the API and
the frontend on port 8000 and has no state on disk.

```sh
git submodule update --init
docker build -f deploy/Dockerfile -t spec-explorer .
docker run --rm -p 8000:8000 -e GITHUB_TOKEN=<token> spec-explorer
```

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `GITHUB_TOKEN` | none | Optional. A read-only token. Without it, GitHub allows 60 API requests per hour. The server sends it only to `api.github.com` and never to the browser. |
| `STATIC_DIR` | `/app/static` | The folder of the built frontend. |

## Host

The host is `specs.workflow.reutlingen.university`. Caddy terminates TLS and sends each request
to the OAuth2 proxy, which sends it to port 8000 of the container. The explorer has no login of
its own, so the OAuth2 proxy is the only access gate.
