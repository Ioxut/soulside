import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session
from app.models.document import SourceDocument, DocumentChunk
from app.services.embeddings import embed_texts


def ingest_pdf(file_path: str, filename: str, db: Session) -> SourceDocument:
    doc_record = SourceDocument(filename=filename)
    db.add(doc_record)
    db.flush()

    pdf = fitz.open(file_path)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    all_chunks = []
    page_map = []

    for page_num, page in enumerate(pdf, start=1):
        page_text = page.get_text("text").strip()
        if not page_text:
            continue
        chunks = splitter.split_text(page_text)
        for chunk in chunks:
            if chunk.strip():
                all_chunks.append(chunk.strip())
                page_map.append(page_num)

    pdf.close()

    if not all_chunks:
        db.rollback()
        raise ValueError("PDF-ul nu conține text extraibil")

    embeddings = embed_texts(all_chunks)

    for chunk_text, embedding, page_num in zip(all_chunks, embeddings, page_map):
        chunk = DocumentChunk(
            document_id=doc_record.id,
            page_number=page_num,
            content=chunk_text,
            embedding=embedding,
        )
        db.add(chunk)

    db.commit()
    db.refresh(doc_record)
    return doc_record
