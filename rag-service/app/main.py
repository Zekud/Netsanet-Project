import logging
import time
import json
import asyncio
import os
import tempfile
from typing import Literal

from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.engine import ask_question

# Azure STT/TTS is optional — if the package isn't installed only /ask works
try:
    from app.azure_utils import transcribe_speech, transcribe_file_once, synthesize_speech, translate_text
    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False
    transcribe_speech = transcribe_file_once = synthesize_speech = translate_text = None  # type: ignore

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Ethiopian Legal AI Assistant",
    description="A RAG-powered AI assistant for querying Ethiopian legal documents with speech and translation capabilities."
)

# CORS middleware (dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for Request Bodies ---
class QueryRequest(BaseModel):
    query: str
    k: int = Field(default=5, ge=1, le=20, description="Number of relevant documents to return")

class TTSRequest(BaseModel):
    text: str
    language: Literal["en", "am"] = Field(default="en", description="Target language for speech synthesis (en or am)")

class TranslateRequest(BaseModel):
    text: str
    target_lang: Literal["en", "am"]

class TranslateResponse(BaseModel):
    translated_text: str

# --- API Endpoints ---
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/ask")
async def ask_stream(req: QueryRequest):
    try:
        if not req.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        logger.info(f"Received query: '{req.query[:100]}...' with k={req.k}")

        return StreamingResponse(
            ask_question(req.query, k=req.k),
            media_type="application/x-ndjson"
        )
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while processing your request")
    
@app.post("/translate", response_model=TranslateResponse, tags=["Translation"])
async def translate_text_endpoint(request: TranslateRequest):
    if not AZURE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Azure SDK not installed. Run: pip install azure-cognitiveservices-speech azure-core")
    try:
        translated_text = await translate_text(request.text, request.target_lang)
        return {"translated_text": translated_text}
    except Exception as e:
        logger.error(f"Translation API error: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during translation: {str(e)}")

@app.post("/speech-to-text/{language}")
async def speech_to_text(
    language: Literal["en", "am"],
    file: UploadFile = File(...),
    mode: str = Query("stream", regex="^(stream|file)$")
):
    if not AZURE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Azure SDK not installed.")
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")

    if mode == "stream":
        audio_queue = asyncio.Queue()

        async def stream_audio_to_queue():
            try:
                while True:
                    chunk = await file.read(4096)
                    if not chunk:
                        break
                    await audio_queue.put(chunk)
            finally:
                # signal end
                await audio_queue.put(None)

        streamer_task = asyncio.create_task(stream_audio_to_queue())

        try:
            logger.info(f"Starting streaming transcription for language={language}, content_type={file.content_type}")
            # transcribe_speech is the streaming function (alias)
            transcribed_text = await transcribe_speech(audio_queue, language, content_type=file.content_type)
            return {"text": transcribed_text}
        except Exception as e:
            logger.error(f"Error during transcription (stream): {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {str(e)}")
        finally:
            if not streamer_task.done():
                streamer_task.cancel()

    else:  # mode == "file"
        tmp_dir = tempfile.gettempdir()
        suffix = ""
        # try to derive suffix from content_type
        if file.content_type:
            if "mpeg" in file.content_type or "mp3" in file.content_type:
                suffix = ".mp3"
            elif "wav" in file.content_type:
                suffix = ".wav"
            elif "ogg" in file.content_type or "webm" in file.content_type:
                suffix = ".ogg"
        # create temp file
        tf = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=tmp_dir)
        tmp_path = tf.name
        try:
            # write entire content
            contents = await file.read()
            tf.write(contents)
            tf.flush()
            tf.close()
            logger.info(f"Starting file-based transcription for language={language}, temp_file={tmp_path}")
            text = await transcribe_file_once(tmp_path, language)
            return {"text": text}
        except Exception as e:
            logger.error(f"Error during transcription (file): {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to transcribe audio (file): {str(e)}")
        finally:
            # cleanup temp file
            try:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
            except Exception:
                logger.warning(f"Could not delete temp file {tmp_path}")

@app.post("/text-to-speech")
async def text_to_speech(req: TTSRequest):
    try:
        logger.info(f"Synthesizing speech for language: {req.language}")
        audio_bytes = await synthesize_speech(req.text, req.language)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        logger.error(f"Error during speech synthesis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to synthesize speech: {str(e)}")

@app.websocket("/translate-stream")
async def translate_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time translation between English and Amharic.
    Expects JSON: {"text": "...", "target_lang": "en|am"}
    Streams back a string with the translated text.
    """
    await websocket.accept()
    logger.info("Translation WebSocket connection established.")
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                text = payload.get("text")
                target_lang = payload.get("target_lang")

                if not text or not target_lang:
                    await websocket.send_text("Error: 'text' and 'target_lang' fields are required.")
                    continue

                if target_lang not in ["en", "am"]:
                    await websocket.send_text("Error: 'target_lang' must be either 'en' or 'am'.")
                    continue

                translated_text = await translate_text(text, target_lang)
                await websocket.send_text(translated_text)

            except json.JSONDecodeError:
                await websocket.send_text("Error: Invalid JSON format.")
            except Exception as e:
                logger.error(f"Error during WebSocket translation: {e}")
                await websocket.send_text(f"An error occurred: {e}")

    except WebSocketDisconnect:
        logger.info("Translation WebSocket connection closed.")
    except Exception as e:
        logger.error(f"An unexpected error occurred in the WebSocket: {e}")
        await websocket.close(code=1011, reason="An internal error occurred.")
