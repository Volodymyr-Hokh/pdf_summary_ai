"""
LCEL map-reduce summarization pipeline.

Note: load_summarize_chain / MapReduceDocumentsChain are deprecated since
langchain 0.1.0.  We use the modern LCEL approach:
  map_chain = prompt | llm | StrOutputParser()
  summaries = await map_chain.abatch(chunks, config={"max_concurrency": 3})
"""
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter

TEXT_MODEL = "gpt-5.4-2026-03-05"

MAP_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert document analyst. Summarize the following section of a document "
            "concisely and accurately. Preserve key facts, numbers, table data, and important details.",
        ),
        ("human", "{text}"),
    ]
)

REDUCE_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert document analyst. You have been given summaries of consecutive "
            "sections of a document. Combine them into one coherent, well-structured summary "
            "using the following Markdown format:\n\n"
            "## Overview\n"
            "<2-3 sentence overview of the entire document>\n\n"
            "## Key Points\n"
            "<Bulleted list of the most important points>\n\n"
            "## Tables & Data Highlights\n"
            "<Any notable quantitative data, tables, or statistics (omit section if none)>",
        ),
        ("human", "{summaries}"),
    ]
)


async def summarize(docs: list[Document]) -> str:
    """Run map-reduce summarization over a list of LangChain Documents."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=10_000, chunk_overlap=500)
    chunks = splitter.split_documents(docs)

    llm = ChatOpenAI(model=TEXT_MODEL, temperature=0)

    # Map phase — parallel with rate-limit guard
    map_chain = MAP_PROMPT | llm | StrOutputParser()
    chunk_inputs = [{"text": c.page_content} for c in chunks]
    chunk_summaries: list[str] = await map_chain.abatch(
        chunk_inputs, config={"max_concurrency": 3}
    )

    # Reduce phase
    reduce_chain = REDUCE_PROMPT | llm | StrOutputParser()
    final_summary: str = await reduce_chain.ainvoke(
        {"summaries": "\n\n---\n\n".join(chunk_summaries)}
    )

    return final_summary
