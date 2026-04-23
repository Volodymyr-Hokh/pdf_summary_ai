import asyncio
import os
import time
from datetime import datetime, timezone

import aiofiles
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import AsyncSessionLocal, get_db
from app.models import Document
from app.schemas import DocumentListResponse, DocumentResponse
from app.services.pdf_parser import load_pdf
from app.services.summarizer import summarize

router = APIRouter(prefix="/api/documents", tags=["documents"])


async def _process_document(doc_id: str, file_path: str) -> None:
    async with AsyncSessionLocal() as db:
        try:
            doc = await db.get(Document, doc_id)
            if not doc:
                return

            doc.status = "processing"
            await db.commit()

            start = time.perf_counter()

            lc_docs, total_pages = await load_pdf(file_path)

            if total_pages > settings.max_pages:
                raise ValueError(
                    f"PDF has {total_pages} pages, maximum allowed is {settings.max_pages}"
                )

            doc.page_count = total_pages
            await db.commit()

            final_summary = await summarize(lc_docs)

            elapsed = time.perf_counter() - start

            doc.status = "completed"
            doc.summary = final_summary
            doc.model_used = "gpt-5.4-2026-03-05"
            doc.processing_time_seconds = round(elapsed, 2)
            doc.completed_at = datetime.now(timezone.utc)
            await db.commit()

        except Exception as exc:
            await db.rollback()
            doc = await db.get(Document, doc_id)
            if doc:
                doc.status = "failed"
                doc.error_message = str(exc)
                await db.commit()
        finally:
            if os.path.exists(file_path):
                await asyncio.to_thread(os.remove, file_path)


@router.post("/upload", status_code=202, response_model=DocumentResponse)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb} MB",
        )

    filename = file.filename or "upload.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must have a .pdf extension")

    await asyncio.to_thread(os.makedirs, settings.upload_dir, exist_ok=True)

    doc = Document(filename=filename, file_size_bytes=len(content))
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    file_path = os.path.join(settings.upload_dir, f"{doc.id}.pdf")
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    background_tasks.add_task(_process_document, doc.id, file_path)

    return DocumentResponse.model_validate(doc)


@router.get("", response_model=DocumentListResponse)
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).order_by(Document.created_at.desc()).limit(5)
    )
    docs = result.scalars().all()
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in docs],
        total=len(docs),
    )


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(doc)
