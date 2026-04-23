from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import documents, health

app = FastAPI(
    title="PDF Summary AI",
    description="Upload PDFs and receive AI-generated summaries",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:80", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(documents.router)
