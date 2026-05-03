import os
import json
import chromadb
from chromadb.utils import embedding_functions 
from typing import List, Dict, Any
import hashlib

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH_ABS = os.path.join(SCRIPT_DIR, "legal_db")

EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# Initialize the ChromaDB native embedding function
embeddings_function_native = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name=EMBEDDING_MODEL_NAME
)

client = chromadb.PersistentClient(path=DB_PATH_ABS)
collection = client.get_or_create_collection(
    name="ethiopian_law",
    embedding_function=embeddings_function_native,
    metadata={"hnsw:space": "cosine"}  # Using cosine similarity for better relevance
)

def create_legal_chunks(text: str, source: str, chunk_size: int = 512, overlap: int = 50) -> List[Dict[str, Any]]:
    #Create overlapping chunks for better context preservation in legal documents
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append({
            "content": chunk,
            "metadata": {
                "source": source,
                "chunk_index": i // (chunk_size - overlap),
                "word_count": len(chunk.split())
            }
        })
    
    return chunks

def clear_collection():
    #Clear the entire collection by deleting all documents
    try:
        results = collection.get(include=[])
        if results and results['ids']:
            collection.delete(ids=results['ids'])
            print(f" Cleared {len(results['ids'])} documents from collection.")
        else:
            print("Collection is already empty.")
    except Exception as e:
        print(f"Error clearing collection: {e}")
        # Fallback: try to delete with a where clause that matches all documents
        try:
            collection.delete(where={"source": {"$ne": ""}})
            print("Collection cleared using fallback method.")
        except:
            print("Could not clear collection. Proceeding with ingestion anyway.")

def generate_doc_id(content: str, index: int) -> str:
    #Generate a unique document ID using MD5 hash
    content_hash = hashlib.md5(content.encode()).hexdigest()[:8]
    return f"doc_{index}_{content_hash}"

def clean_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
    #Clean metadata to ensure all values are ChromaDB compatible
    cleaned_metadata = {}
    for key, value in metadata.items():
        if value is None:
            cleaned_metadata[key] = None
        elif isinstance(value, (str, int, float, bool)):
            cleaned_metadata[key] = value
        elif isinstance(value, list):
            # Convert list to comma-separated string
            cleaned_metadata[key] = ", ".join([str(item) for item in value])
        elif isinstance(value, dict):
            # Convert dict to JSON string
            cleaned_metadata[key] = json.dumps(value)
        else:
            # Convert any other type to string
            cleaned_metadata[key] = str(value)
    
    return cleaned_metadata

def ingest_documents_from_json(
    documents: List[Dict[str, Any]], 
    clear_existing: bool = False, 
    batch_size: int = 50
) -> None:
    """
    Ingests legal documents from a list of dictionaries into a ChromaDB collection.
    Args:
        documents: A list of dictionaries, where each dict represents a document chunk
                   with 'content' and 'metadata'.
        clear_existing: If True, clears the collection before ingestion.
        batch_size: The number of documents to ingest in each batch.
    """
    if not documents:
        print("No documents to ingest.")
        return

    if clear_existing:
        print("Clearing existing collection...")
        clear_collection()

    doc_ids = []
    contents = []
    metadatas = []
    
    # Generate unique IDs for each document chunk
    for i, doc in enumerate(documents):
        doc_id = generate_doc_id(doc["content"], i)
        doc_ids.append(doc_id)
        contents.append(doc["content"])
        
        # Clean metadata to ensure ChromaDB compatibility
        cleaned_metadata = clean_metadata(doc["metadata"])
        metadatas.append(cleaned_metadata)
    
    # Ingest documents in batches
    successful_ingestions = 0
    for i in range(0, len(contents), batch_size):
        batch_ids = doc_ids[i:i + batch_size]
        batch_contents = contents[i:i + batch_size]
        batch_metadatas = metadatas[i:i + batch_size]
        
        print(f"✅ Ingesting batch {i//batch_size + 1}/{(len(contents)-1)//batch_size + 1}...")
        
        try:
            collection.add(
                documents=batch_contents,
                metadatas=batch_metadatas,
                ids=batch_ids
            )
            successful_ingestions += len(batch_contents)
        except Exception as e:
            print(f"❌ Error ingesting batch {i//batch_size + 1}: {e}")
            # Try to ingest documents one by one to identify the problematic one
            for j, (content, metadata, doc_id) in enumerate(zip(batch_contents, batch_metadatas, batch_ids)):
                try:
                    collection.add(
                        documents=[content],
                        metadatas=[metadata],
                        ids=[doc_id]
                    )
                    successful_ingestions += 1
                except Exception as single_error:
                    print(f"❌ Failed to ingest document {j} in batch: {single_error}")
                    print(f"Problematic content preview: {content[:100]}...")
                    print(f"Problematic metadata: {metadata}")
    
    print(f"🎉 Successfully ingested {successful_ingestions}/{len(contents)} documents into ChromaDB.")

def process_data_files(data_folder: str = "../data") -> None:
    """
    Reads JSON files from the data folder and prepares documents for ingestion.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir_abs = os.path.join(script_dir, data_folder)
    
    if not os.path.exists(data_dir_abs):
        print(f"❌ Data folder not found at: {data_dir_abs}")
        return
    
    all_processed_chunks = []
    json_files = [f for f in os.listdir(data_dir_abs) if f.endswith(".json")]

    if not json_files:
        print(f"⚠️ No JSON files found in {data_dir_abs}.")
        return

    print(f"🔍 Found {len(json_files)} JSON files to process...")

    for filename in json_files:
        file_path = os.path.join(data_dir_abs, filename)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                if isinstance(data, list):
                    for item_index, item in enumerate(data):
                        if isinstance(item, dict) and 'content' in item:
                            content = item["content"]
                            source = item.get("source", "Unknown Source")                            
                            if not content or not content.strip():
                                print(f"⚠️ Skipping empty content in {filename}, item {item_index}")
                                continue
                                
                            # Create better chunks with overlap
                            chunks = create_legal_chunks(content, source)
                            
                            for chunk_index, chunk in enumerate(chunks):
                                chunk_metadata = {k: v for k, v in item.items() if k != "content"}
                                chunk_metadata.update(chunk["metadata"])
                                chunk_metadata["original_file"] = filename
                                chunk_metadata["item_index"] = item_index
                                chunk_metadata["chunk_index"] = chunk_index
                                
                                # Handle topics field - convert to comma-separated string
                                topics = chunk_metadata.get('topics')
                                if isinstance(topics, str):
                                    cleaned_topics = topics.strip()
                                    if cleaned_topics.startswith('[') and cleaned_topics.endswith(']'):
                                        try:
                                            topics_list = json.loads(cleaned_topics)
                                            chunk_metadata['topics'] = ", ".join([str(t) for t in topics_list])
                                        except json.JSONDecodeError:
                                            chunk_metadata['topics'] = cleaned_topics
                                    else:
                                        chunk_metadata['topics'] = cleaned_topics
                                elif isinstance(topics, list):
                                    chunk_metadata['topics'] = ", ".join([str(t) for t in topics])
                                elif topics is not None:
                                    chunk_metadata['topics'] = str(topics)
                                else:
                                    chunk_metadata['topics'] = ""
                                
                                all_processed_chunks.append({
                                    "content": chunk["content"], 
                                    "metadata": chunk_metadata
                                })
                        else:
                            print(f"⚠️ Skipping malformed item in {filename}, item {item_index}: {item}")
                else:
                    print(f"⚠️ Skipping {filename}: Expected a JSON array, but found a {type(data)}.")
        except json.JSONDecodeError as e:
            print(f"❌ Error decoding JSON from {filename}: {e}")
        except Exception as e:
            print(f"❌ An unexpected error occurred while processing {filename}: {e}")

    if all_processed_chunks:
        print(f"✅ Found {len(all_processed_chunks)} total chunks to process.")
        ingest_documents_from_json(all_processed_chunks, clear_existing=True, batch_size=50)
    else:
        print("❌ No valid processed JSON documents found to ingest. Please check your 'data' directory and JSON structure.")

if __name__ == "__main__":
    process_data_files()