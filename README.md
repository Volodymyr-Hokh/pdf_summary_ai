# PDF Summary AI

A full-stack web application that lets you upload large PDF documents (up to 50 MB / 100 pages) and receive AI-generated summaries powered by OpenAI via LangChain.

## Features

- **PDF Upload** — drag-and-drop or file picker with client-side validation
- **Intelligent Parsing** — LangChain `PyMuPDFLoader` with native Markdown table extraction; image-heavy pages are described by GPT-4o vision
- **AI Summarization** — LCEL map-reduce pipeline (parallel chunk summarization → combine) using `gpt-5.4-2026-03-05`
- **History** — last 5 processed documents with status tracking and real-time polling
- **Async Processing** — upload returns immediately; status is polled every 2 s

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy, Alembic, SQLite |
| AI Pipeline | LangChain, LangChain-OpenAI, PyMuPDF |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Infrastructure | Docker, nginx (reverse proxy + SPA serving) |

## Architecture

```
Browser
  │
  ▼
nginx :80
  ├── /api/*  ──────────────► FastAPI :8000
  │                              ├── POST /api/documents/upload
  │                              ├── GET  /api/documents
  │                              ├── GET  /api/documents/{id}
  │                              └── GET  /api/health
  │
  └── /*  (React SPA)        SQLite (named volume)
```

## Quick Start with Docker

### Prerequisites
- Docker + Docker Compose
- OpenAI API key

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Volodymyr-Hokh/pdf_summary_ai.git
cd pdf_summary_ai

# 2. Create your environment file
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY

# 3. Build and start
docker-compose up --build

# 4. Open http://localhost in your browser
```

The first build takes ~3–4 minutes (downloads Python/Node dependencies and compiles the React app).

## Local Development

### Backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env in the backend directory (or project root)
cp ../.env.example .env
# Set DATABASE_URL=sqlite:///./data/database.db and UPLOAD_DIR=./uploads

# Run migrations
alembic upgrade head

# Start the dev server
uvicorn app.main:app --reload --port 8000
# API docs available at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
# API calls are proxied to http://localhost:8000
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | **Required.** Your OpenAI API key |
| `DATABASE_URL` | `sqlite:////app/data/database.db` | SQLAlchemy connection string |
| `UPLOAD_DIR` | `/app/uploads` | Directory where uploaded PDFs are temporarily stored |
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload size in megabytes |
| `MAX_PAGES` | `100` | Maximum number of pages per document |

## API Documentation

Interactive Swagger UI is available at `http://localhost:8000/docs` when running the backend.

### Endpoints

#### `POST /api/documents/upload`

Upload a PDF for processing.

- **Content-Type**: `multipart/form-data`
- **Field**: `file` — the PDF file
- **Constraints**: PDF only, ≤ 50 MB, ≤ 100 pages
- **Returns**: `202 Accepted` with document object

```json
{
  "id": "3fa85f64-...",
  "filename": "report.pdf",
  "file_size_bytes": 1048576,
  "page_count": null,
  "status": "pending",
  "error_message": null,
  "summary": null,
  "model_used": null,
  "processing_time_seconds": null,
  "created_at": "2026-04-21T10:00:00Z",
  "completed_at": null
}
```

#### `GET /api/documents`

Returns the last 5 processed documents ordered by date descending.

```json
{
  "documents": [ /* array of document objects */ ],
  "total": 5
}
```

#### `GET /api/documents/{id}`

Returns a single document by ID. Poll this endpoint to track processing status.

**Status values**: `pending` → `processing` → `completed` | `failed`

#### `GET /api/health`

```json
{ "status": "ok", "timestamp": "2026-04-21T10:00:00Z" }
```

## Docker Details

```
docker-compose.yml
├── backend    — FastAPI app built from ./backend/Dockerfile
│               volumes: sqlite_data:/app/data, upload_data:/app/uploads
└── nginx      — multi-stage build (Node.js → React build → nginx serve)
                build context: project root (accesses both frontend/ and nginx/)
```

Uploaded PDFs are deleted after processing. Summaries are persisted in SQLite.
