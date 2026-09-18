"""RAG implementation using ChromaDB and local SentenceTransformers."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions

logger = logging.getLogger(__name__)

# Directory to store ChromaDB data locally
CHROMA_DATA_PATH = Path("./chroma_data").resolve()

# Embedding model: intfloat/multilingual-e5-base (multilingual, good for hi/te/mr/en)
# E5 requires "query: " or "passage: " prefix, but the default sentence-transformers
# pipeline handles it decently without, or we can just use it directly. For this
# hackathon, default encoding is fine.
MODEL_NAME = "intfloat/multilingual-e5-base"

_chroma_client = None
_collection = None
_embedding_function = None


def get_chroma_client():
    """Lazy initialize ChromaDB client and collection."""
    global _chroma_client, _collection, _embedding_function
    if _chroma_client is None:
        logger.info("Initializing ChromaDB at %s", CHROMA_DATA_PATH)
        _chroma_client = chromadb.PersistentClient(path=str(CHROMA_DATA_PATH))
        
        logger.info("Loading embedding model: %s", MODEL_NAME)
        # Device is automatically selected by sentence_transformers (CPU in this case)
        _embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=MODEL_NAME
        )
        
        _collection = _chroma_client.get_or_create_collection(
            name="financial_literacy",
            embedding_function=_embedding_function,
        )
        logger.info("ChromaDB and model initialized successfully.")
    return _collection


def seed_database():
    """Seed the database with sample financial literacy content."""
    collection = get_chroma_client()
    
    # Check if already seeded
    if collection.count() > 0:
        logger.info("Database already seeded with %d documents.", collection.count())
        return

    logger.info("Seeding database with sample content...")
    
    # Sample documents covering English, Hindi, Telugu, Marathi context
    docs = [
        {
            "id": "doc_en_1",
            "text": "A simple way to start saving is the 50-30-20 rule: 50% of income for needs (food, rent, medicine), 30% for wants (clothes, festivals), and 20% for savings. Even saving small amounts regularly builds a strong habit.",
            "source": "financial_literacy_basics.md"
        },
        {
            "id": "doc_en_2",
            "text": "PMJDY (Pradhan Mantri Jan Dhan Yojana) provides zero-balance bank accounts with a RuPay debit card and Rs 2 lakh accident insurance. Women can open accounts at any bank branch or Banking Correspondent with just an Aadhaar card.",
            "source": "government_schemes_pmjdy.md"
        },
        {
            "id": "doc_en_3",
            "text": "Sukanya Samriddhi Yojana (SSY) is a government-backed savings scheme targeted at the parents of girl children. It encourages parents to build a fund for the future education and marriage expenses of their female child.",
            "source": "government_schemes_ssy.md"
        },
        {
            "id": "doc_hi_1",
            "text": "50-30-20 नियम बचत का एक आसान तरीका है: अपनी आय का 50% जरूरतों (भोजन, किराया) के लिए, 30% इच्छाओं (कपड़े, त्योहार) के लिए और 20% बचत के लिए रखें। छोटी बचत भी भविष्य में काम आती है।",
            "source": "financial_literacy_basics_hi.md"
        },
        {
            "id": "doc_hi_2",
            "text": "प्रधानमंत्री जन धन योजना (PMJDY) के तहत शून्य बैलेंस खाता खोला जा सकता है। इसमें रूपे (RuPay) डेबिट कार्ड और 2 लाख रुपये का दुर्घटना बीमा मिलता है। आधार कार्ड से यह खाता खुलवाया जा सकता है।",
            "source": "government_schemes_pmjdy_hi.md"
        },
    ]

    ids = [d["id"] for d in docs]
    documents = [d["text"] for d in docs]
    metadatas = [{"source": d["source"]} for d in docs]

    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
    )
    logger.info("Successfully seeded %d documents.", len(docs))


def rag_search(query: str, n_results: int = 2) -> str:
    """
    Search the ChromaDB index for relevant content.
    Returns JSON formatted string for the LLM to consume.
    """
    try:
        collection = get_chroma_client()
        # For intfloat/multilingual-e5-base, prefixing queries is recommended for best results
        # but the wrapper does standard encoding. We'll pass the query directly.
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
        )
        
        formatted_results = []
        if results and results['documents'] and len(results['documents']) > 0:
            for idx, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][idx] if results['metadatas'] else {}
                formatted_results.append({
                    "content": doc,
                    "source": meta.get("source", "unknown")
                })
        
        return json.dumps({
            "results": formatted_results,
            "query": query
        })
    except Exception as e:
        logger.error("Error during RAG search: %s", e)
        return json.dumps({"error": str(e), "query": query})
