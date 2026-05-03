import os
import re
import chromadb
import json
import time
import logging
from typing import Iterator, Dict, List, Any
from chromadb.utils import embedding_functions 

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH_ABS = os.path.join(SCRIPT_DIR, "legal_db")

# Initialize ChromaDB client and collection
client = chromadb.PersistentClient(path=DB_PATH_ABS)
collection = client.get_or_create_collection(
    name="ethiopian_law",
    embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    ),
    metadata={"hnsw:space": "cosine"}
)

RELEVANCE_THRESHOLD = 0.4

def filter_documents_by_relevance(documents, metadatas, distances, threshold=0.4):
    """Filter documents based on relevance score"""
    relevant_docs = []
    for i, (doc, meta, distance) in enumerate(zip(documents, metadatas, distances)):
        # Convert distance to similarity score (1 - distance) for cosine
        similarity = 1 - distance
        if similarity >= threshold:
            relevant_docs.append({
                "content": doc,
                "metadata": meta,
                "score": similarity
            })
    return relevant_docs

def get_relevant_documents(query: str, n_results: int = 5) -> List[Dict]:
    """Retrieve the k most relevant legal document chunks for a query."""
    results = collection.query(
        query_texts=[query],
        n_results=n_results * 2,  # Get more results initially for filtering
        include=['documents', 'metadatas', 'distances']
    )
    relevant_docs = filter_documents_by_relevance(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
        RELEVANCE_THRESHOLD
    )
    relevant_docs.sort(key=lambda x: x["score"], reverse=True)
    return relevant_docs[:n_results]

def ask_question(query: str, k: int = 5) -> Iterator[str]:
    """
    Yields the k most relevant legal document chunks for the query as JSON strings.
    
    Args:
        query (str): The user's query about Ethiopian law
        k (int): Number of relevant documents to return (default: 5)
    """
    try:
        if not query or not isinstance(query, str):
            raise ValueError("Query must be a non-empty string")
            
        relevant_docs = get_relevant_documents(query, n_results=k)
        
        formatted_results = []
        for doc in relevant_docs:
            formatted_results.append({
                "content": doc["content"],
                "source": doc["metadata"].get("source", "Unknown Source"),
                "article_number": doc["metadata"].get("article_number", "N/A"),
                "topics": doc["metadata"].get("topics", [])
            })
        
        # Yield a single JSON object containing all results
        response_data = {
            "results": formatted_results,
            "message": f"Found {len(formatted_results)} relevant legal documents."
        }
        yield json.dumps(response_data) + "\n"
        
    except Exception as e:
        logger.error(f"Error in ask_question: {str(e)}")
        error_response = {
            "results": [],
            "message": f"An error occurred: {str(e)}"
        }
        yield json.dumps(error_response) + "\n"

def preprocess_legal_document(content: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Preprocess legal documents before ingestion."""
    cleaned_content = re.sub(r'\s+', ' ', content).strip()
    article_match = re.search(r'Article\s+(\d+[A-ZaZ]?)', cleaned_content)
    article_number = article_match.group(1) if article_match else None
    enhanced_metadata = {
        **metadata,
        "article_number": article_number,
        "word_count": len(cleaned_content.split()),
        "processed_timestamp": time.time(),
        "language": "en"
    }
    return {
        "content": cleaned_content,
        "metadata": enhanced_metadata
    }
