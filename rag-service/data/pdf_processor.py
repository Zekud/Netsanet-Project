import os
import json
import re
import pdfplumber
import time 
from typing import List, Dict, Any
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field 
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()
google_api_key = os.getenv("GOOGLE_API_KEY")
llm = ChatGoogleGenerativeAI(
    google_api_key=google_api_key,
    model="gemini-2.5-flash",
    temperature=0.3
)

class ArticleData(BaseModel):
    article_number: str = Field(description="The number of the article, e.g., '1' or '34A'.")
    summary: str = Field(description="A concise one-sentence summary of the article's content.")
    topics: List[str] = Field(description="A list of 3-5 relevant keywords for the article.")

# Parser for the LLM output
json_parser = JsonOutputParser(pydantic_object=ArticleData)

def create_summarization_chain():
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """You are a highly skilled legal assistant. Your task is to analyze a legal article and extract key information.

Instructions:
1.  Identify the article number and title.
2.  Provide a concise, single-sentence summary of the article's main point.
3.  Extract 3-5 keywords or topics that accurately describe the article's content.
4.  If the text is not a legal article or does not contain meaningful content, return 'None' for all fields.

Format the output as a JSON object with the keys 'article_number', 'summary', and 'topics'."""),
        ("human", "Analyze the following text from a legal document:\n\n---\n\n{text}\n\n---\n\n{format_instructions}")
    ])
    
    return prompt_template | llm | json_parser

def process_pdfs_to_json(pdf_folder: str = "pdfs", output_folder: str = "data") -> None:
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_dir_abs = os.path.join(script_dir, pdf_folder)
    output_dir_abs = os.path.join(script_dir, output_folder)
    
    summarization_chain = create_summarization_chain()

    if not os.path.exists(pdf_dir_abs):
        print(f"PDF folder not found at: {pdf_dir_abs}")
        return
        
    if not os.path.exists(output_dir_abs):
        os.makedirs(output_dir_abs)
        print(f"Created output folder: {output_dir_abs}")

    pdf_files = [f for f in os.listdir(pdf_dir_abs) if f.endswith(".pdf")]
    
    if not pdf_files:
        print(f"No PDF files found in {pdf_dir_abs}.")
        return

    print(f"Found {len(pdf_files)} PDF files to process...")

    for pdf_file in pdf_files:
        full_pdf_path = os.path.join(pdf_dir_abs, pdf_file)
        full_text = ""
        
        try:
            with pdfplumber.open(full_pdf_path) as pdf:
                print(f"⏳ Extracting text from '{pdf_file}'...")
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        full_text += text + "\n"
            
            article_pattern = re.compile(r'(?:Article|Chapter|Section)\s+[\w\d.-]+\s*.-?\s*.*?(?=(?:Article|Chapter|Section)\s+[\w\d.-]+\s*.-?\s*|\Z)', re.DOTALL | re.IGNORECASE)
            
            processed_documents = []
            
            chunks = article_pattern.findall(full_text)
            
            if not chunks:
                print(f"No articles or sections found in '{pdf_file}'. Processing as a single document.")
                try:
                    llm_output = summarization_chain.invoke({
                        "text": full_text,
                        "format_instructions": json_parser.get_format_instructions()
                    })
                    if llm_output:
                        processed_documents.append({
                            "content": full_text,
                            "source": os.path.splitext(pdf_file)[0].replace('_', ' ').title(),
                            "summary": llm_output.get("summary", "No summary available."),
                            "topics": llm_output.get("topics", [])
                        })
                        time.sleep(10) 
                except Exception as e:
                    print(f" Error processing full document for '{pdf_file}': {e}")
            else:
                for chunk_text in chunks:
                    try:
                        llm_output = summarization_chain.invoke({
                            "text": chunk_text,
                            "format_instructions": json_parser.get_format_instructions()
                        })
                        
                        if llm_output and llm_output.get("summary") != "None":
                            processed_documents.append({
                                "content": chunk_text,
                                "source": os.path.splitext(pdf_file)[0].replace('_', ' ').title(),
                                "article_number": llm_output.get("article_number", None),
                                "summary": llm_output.get("summary", "No summary available."),
                                "topics": llm_output.get("topics", [])
                            })
                        time.sleep(10) # Added a 10-second delay between each API call to prevent rate limiting.
                    except Exception as e:
                        print(f" Error processing chunk for '{pdf_file}': {e}")

            if processed_documents:
                output_filename = os.path.splitext(pdf_file)[0] + ".json"
                output_path = os.path.join(output_dir_abs, output_filename)
                
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(processed_documents, f, ensure_ascii=False, indent=2)
                
                print(f"Successfully processed and saved {len(processed_documents)} chunks to: {output_path}")
            else:
                print(f"No valid documents or chunks found for '{pdf_file}'. Skipping JSON creation.")

        except Exception as e:
            print(f" Error processing {pdf_file}: {e}")

if __name__ == "__main__":
    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")
        print("Created 'pdfs' folder. Please place your PDF files inside and then run this script.")
    else:
        process_pdfs_to_json()