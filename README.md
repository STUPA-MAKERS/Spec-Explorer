# Spec-Explorer

A read-only web app that shows the specs of the public repositories of STUPA-MAKERS, at any
branch, tag or commit, with their references.

The rules of the app are in [specs/](specs/README.md).

## Layout

| Path | What it holds |
| --- | --- |
| `backend/` | The server: Python 3.13, FastAPI. It reads GitHub, builds the index of a commit and serves the API and the frontend. |
| `frontend/` | The Angular 20 app. It includes the ui-kit as the submodule `frontend/vendor/ui-kit`. |
| `deploy/` | The container and how to run it. |
| `scripts/check_specs.py` | The format check of `specs/`. |

## Develop

```sh
git submodule update --init

cd backend
python3.13 -m venv .venv && .venv/bin/pip install -e '.[dev]'
.venv/bin/uvicorn app.main:app --port 8000

cd frontend
npm ci
npm start            # http://localhost:4200, /api goes to port 8000
```

## Checks

- `python3 scripts/check_specs.py` (`--write` updates the index of `specs/README.md`)
- `backend/`: `ruff check .`, `ruff format --check .`, `basedpyright`, `pytest --cov`
- `frontend/`: `npm run typecheck`, `npx jest --coverage`, `npm run build`

## License

GPL-3.0-or-later, see [LICENSE](LICENSE).
