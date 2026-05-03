import re
from typing import List, Dict, Any

def get_legal_doc_chunks(text: str, source: str) -> List[Dict[str, Any]]:
    """
    Splits a legal document text into chunks based on legal divisions like Articles or Chapters.
    This is a more robust chunking strategy for legal documents than fixed-size chunking.
    
    Args:
        text: The full text content of the legal document.
        source: The source of the document (e.g., "Ethiopian Constitution").
        
    Returns:
        A list of dictionaries, where each dictionary represents a chunk with its content and metadata.
    """
    
    chunks = []
    # Use regex to find all "Article" or "Chapter" headings
    # (?=...) is a positive lookahead to include the delimiter in the split result
    articles = re.split(r'((?:Article|Chapter|Section)\s+\d+[\.\:]?\s*)', text, flags=re.IGNORECASE)

    # The first element will be empty if the text starts with a delimiter, so we slice from 1
    if articles and articles[0].strip() == '':
        articles = articles[1:]

    # Pair the headings with their content
    for i in range(0, len(articles), 2):
        if i + 1 < len(articles):
            heading = articles[i].strip()
            content = articles[i+1].strip()
            
            # Simple summary for reference metadata
            summary = content[:200] + "..." if len(content) > 200 else content
            
            chunks.append({
                "content": content,
                "metadata": {
                    "source": source,
                    "title": heading,
                    "summary": summary
                }
            })
    
    if not chunks and text:
        # Fallback to a single chunk if no clear divisions are found
        chunks.append({
            "content": text,
            "metadata": {
                "source": source,
                "title": f"Summary of {source}",
                "summary": text[:200] + "..." if len(text) > 200 else text
            }
        })
            
    return chunks

def create_overlapping_chunks(text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
    """
    Create overlapping chunks from text for better context preservation.
    
    Args:
        text: The text to chunk.
        chunk_size: The size of each chunk in words.
        overlap: The number of words to overlap between chunks.
        
    Returns:
        A list of text chunks.
    """
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
    
    return chunks
