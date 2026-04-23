"""
Async PDF loading via LangChain PyMuPDFLoader.

Uses:
- extract_tables="markdown" for native table → Markdown conversion
- LLMImageBlobParser with gpt-4o for image-heavy PDFs (via aload())
- Falls back to text-only loading when no images are detected (cost optimisation)
- _has_images runs PyMuPDF (sync/CPU-bound) in a thread via asyncio.to_thread
"""
import asyncio

import fitz  # PyMuPDF
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_community.document_loaders.parsers import LLMImageBlobParser
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI


def _has_images_sync(file_path: str) -> bool:
    """Sync helper — runs in a thread executor."""
    with fitz.open(file_path) as doc:
        for page in doc:
            if page.get_images():
                return True
    return False


async def load_pdf(file_path: str) -> tuple[list[Document], int]:
    """
    Async PDF load.  Returns (documents, total_pages).

    Image detection is offloaded to a thread (CPU-bound PyMuPDF).
    LLMImageBlobParser makes async OpenAI calls through aload().
    """
    has_images = await asyncio.to_thread(_has_images_sync, file_path)

    if has_images:
        loader = PyMuPDFLoader(
            file_path,
            mode="page",
            extract_tables="markdown",
            images_inner_format="markdown-img",
            images_parser=LLMImageBlobParser(
                model=ChatOpenAI(model="gpt-4o", max_tokens=1024)
            ),
        )
    else:
        loader = PyMuPDFLoader(
            file_path,
            mode="page",
            extract_tables="markdown",
        )

    docs = await loader.aload()
    total_pages = docs[0].metadata.get("total_pages", len(docs)) if docs else 0
    return docs, total_pages
