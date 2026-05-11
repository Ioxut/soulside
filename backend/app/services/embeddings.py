from functools import lru_cache
from langchain_huggingface import HuggingFaceEmbeddings


@lru_cache(maxsize=1)
def get_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def embed_text(text: str) -> list[float]:
    embeddings = get_embeddings()
    return embeddings.embed_query(text)


def embed_texts(texts: list[str]) -> list[list[float]]:
    embeddings = get_embeddings()
    return embeddings.embed_documents(texts)
