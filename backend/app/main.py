from fastapi import FastAPI, UploadFile, File, Form, Body, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI
import base64
import json
import re
import os
import requests
import io
from dotenv import load_dotenv
import uuid
from supabase import create_client
from pydantic import BaseModel, Field
from langchain_openai import OpenAIEmbeddings, OpenAI as LCOpenAI
from langchain_community.vectorstores import Chroma
import logging
from typing import Optional, List, Dict
import time
import asyncio
from datetime import datetime
import random

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables with validation
def get_required_env_var(var_name: str) -> str:
    """Get required environment variable or raise error"""
    value = os.getenv(var_name)
    if not value:
        raise ValueError(f"Missing required environment variable: {var_name}")
    return value

def get_optional_env_var(var_name: str, default: str = None) -> str:
    """Get optional environment variable with fallback"""
    return os.getenv(var_name, default)

# Check if we're in development mode
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_DEVELOPMENT = ENVIRONMENT == "development"

# Load environment variables with different requirements based on environment
if IS_DEVELOPMENT:
    # In development, allow fallbacks for optional services
    SUPABASE_URL = get_optional_env_var("SUPABASE_URL", "https://your-project.supabase.co")
    SUPABASE_SERVICE_KEY = get_optional_env_var("SUPABASE_SERVICE_KEY", "your-service-key")
    OPENAI_API_KEY = get_required_env_var("OPENAI_API_KEY")  # Still required for AI features
    RAPIDAPI_KEY = get_optional_env_var("RAPIDAPI_KEY", "your-rapidapi-key")
    WEATHER_API_KEY = get_optional_env_var("WEATHER_API_KEY", None)
else:
    # In production, all variables are required
    SUPABASE_URL = get_required_env_var("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = get_required_env_var("SUPABASE_SERVICE_KEY")
    OPENAI_API_KEY = get_required_env_var("OPENAI_API_KEY")
    RAPIDAPI_KEY = get_required_env_var("RAPIDAPI_KEY")
    WEATHER_API_KEY = get_required_env_var("WEATHER_API_KEY")

# Initialize FastAPI app
app = FastAPI(
    title="TryOn.AI API",
    description="AI-powered virtual wardrobe and styling platform",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

# Security middleware
security = HTTPBearer(auto_error=False)

# Rate limiting
class RateLimiter:
    def __init__(self, max_requests: int = 100, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        # Remove old requests
        self.requests[client_id] = [req_time for req_time in self.requests[client_id] 
                                  if now - req_time < self.window_seconds]
        
        if len(self.requests[client_id]) >= self.max_requests:
            return False
        
        self.requests[client_id].append(now)
        return True

rate_limiter = RateLimiter(max_requests=1000, window_seconds=3600)

# Logging middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        logger.info(f"Incoming request: {request.method} {request.url}")
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        logger.info(f"Request processed in {process_time:.4f}s - Status: {response.status_code}")
        
        return response

app.add_middleware(LoggingMiddleware)

# CORS configuration - Production ready
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize clients
if SUPABASE_URL != "https://your-project.supabase.co" and SUPABASE_SERVICE_KEY != "your-service-key":
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
else:
    logger.warning("Supabase credentials not properly configured, some features may not work")
    supabase = None

client = OpenAI(api_key=OPENAI_API_KEY)

# Pydantic models for request/response validation
class WeatherRequest(BaseModel):
    city: Optional[str] = "New York"
    country: Optional[str] = "US"
    lat: Optional[float] = None
    lon: Optional[float] = None

class WeatherResponse(BaseModel):
    temp: Optional[float] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    error: Optional[str] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    user_id: Optional[str] = Field(None, min_length=1)
    conversation_id: Optional[str] = Field(None, min_length=1)

class ChatResponse(BaseModel):
    response: str
    error: Optional[str] = None
    conversation_id: Optional[str] = None

# Utility functions
def validate_image_file(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    max_size = 10 * 1024 * 1024  # 10MB
    
    # Handle WebP files that might be detected as application/octet-stream
    if file.content_type == "application/octet-stream":
        # Check file extension
        if file.filename and file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            file.content_type = "image/jpeg" if file.filename.lower().endswith(('.jpg', '.jpeg')) else "image/png" if file.filename.lower().endswith('.png') else "image/webp"
    
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}. Only JPEG, PNG, and WebP are allowed.")
    
    # Read file content to check size
    content = file.file.read()
    file.file.seek(0)  # Reset file pointer
    
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    
    return True

def get_client_id(request: Request) -> str:
    """Get client identifier for rate limiting"""
    return request.client.host if request.client else "unknown"

# API endpoints
@app.get("/api/weather", response_model=WeatherResponse)
async def get_weather(
    request: Request,
    city: str = "New York", 
    country: str = "US", 
    lat: Optional[float] = None, 
    lon: Optional[float] = None
):
    """Get weather information for outfit suggestions"""
    # Rate limiting
    client_id = get_client_id(request)
    if not rate_limiter.is_allowed(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        # Check if weather API key is properly configured
        if WEATHER_API_KEY is None:
            logger.warning("Weather API key not properly configured, returning fallback data")
            return WeatherResponse(
                temp=72.0,
                description="partly cloudy",
                icon="02d"
            )
        
        if lat is not None and lon is not None:
            url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=imperial&appid={WEATHER_API_KEY}"
        else:
            url = f"http://api.openweathermap.org/data/2.5/weather?q={city},{country}&units=imperial&appid={WEATHER_API_KEY}"
        
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        if "main" in data:
            return WeatherResponse(
                temp=data["main"]["temp"],
                description=data["weather"][0]["description"],
                icon=data["weather"][0]["icon"]
            )
        
        return WeatherResponse(error=data.get("message", "Could not fetch weather"))
        
    except requests.RequestException as e:
        logger.error(f"Weather API error: {e}")
        return WeatherResponse(error="Weather service unavailable")
    except Exception as e:
        logger.error(f"Unexpected error in weather endpoint: {e}")
        return WeatherResponse(error="Internal server error")

@app.post("/describe-clothing")
async def describe_clothing(
    request: Request,
    image: UploadFile = File(...)
):
    """Describe clothing item using AI vision"""
    # Rate limiting
    client_id = get_client_id(request)
    if not rate_limiter.is_allowed(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        # Validate image
        validate_image_file(image)
        
        # Check if OpenAI API key is properly configured
        if OPENAI_API_KEY == "your_openai_api_key_here":
            logger.warning("OpenAI API key not properly configured")
            raise HTTPException(
                status_code=503, 
                detail="AI service not configured. Please set OPENAI_API_KEY in your environment variables."
            )
        
        # Read image data
        img_bytes = await image.read()
        img_b64 = base64.b64encode(img_bytes).decode()

        # Prepare prompt for clothing description
        prompt = """
        Analyze this clothing item and provide a detailed description in JSON format.
        Return ONLY a JSON object with these fields:
        - item_name: A concise name for the clothing item
        - description: A detailed description including color, style, material, fit, and any notable features
        - category: One of these categories: "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"
        
        Focus on fashion-relevant details that would help someone understand what this item looks like.
        Choose the most appropriate category based on the item type.
        """
        
        # Call OpenAI Vision API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
            {
                "role": "user",
                "content": [
                        {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_b64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300,
            temperature=0.3
        )
        
        # Parse response
        content = response.choices[0].message.content.strip()
        logger.info(f"LLM RAW OUTPUT: '{content}'")
        
        # Try to extract JSON from response
        try:
            # Look for JSON in the response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                # If no JSON found, create a structured response
                result = {
                    "item_name": "Clothing Item",
                    "description": content
                }
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            # Return a fallback response
            return {
                "item_name": "Clothing Item",
                "description": content
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in describe-clothing: {e}")
        raise HTTPException(status_code=500, detail="Failed to process image")

# Add this global variable for conversation storage (in production, use Redis or database)
conversation_store: Dict[str, List[Dict[str, str]]] = {}

@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: Request,
    chat_request: ChatRequest
):
    """Chat with AI fashion assistant with conversation context"""
    # Rate limiting
    client_id = get_client_id(request)
    if not rate_limiter.is_allowed(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        # Get or create conversation ID
        conversation_id = chat_request.conversation_id or str(uuid.uuid4())
        
        # Get conversation history
        conversation_history = conversation_store.get(conversation_id, [])
        
        # Get user's actual wardrobe data from database
        user_wardrobe_context = ""
        if chat_request.user_id:
            try:
                # Query the user's actual wardrobe items
                wardrobe_response = supabase.table("wardrobe").select("item_name, description, category").eq("user_id", chat_request.user_id).execute()
                
                if wardrobe_response.data:
                    user_wardrobe_context = "\n\nYour Wardrobe Items:\n"
                    for item in wardrobe_response.data:
                        user_wardrobe_context += f"- {item.get('item_name', 'Unknown')} ({item.get('category', 'Uncategorized')}): {item.get('description', 'No description')}\n"
                else:
                    user_wardrobe_context = "\n\nYour wardrobe appears to be empty. You can add items using the 'Add Item' feature."
            except Exception as e:
                logger.error(f"Error fetching user wardrobe: {e}")
                user_wardrobe_context = "\n\nUnable to access your wardrobe data at the moment."
        
        # Initialize vector store for general fashion knowledge context
        embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

        # Check if the vector store directory exists, if not create it
        persist_directory = "./fashion_advice_db"
        if not os.path.exists(persist_directory):
            os.makedirs(persist_directory)

        # Initialize LLM with specific model
        llm = LCOpenAI(
            openai_api_key=OPENAI_API_KEY,
            model_name="gpt-3.5-turbo-instruct",  # Use a specific, reliable model
            temperature=0.7,
            max_tokens=800,
            request_timeout=30  # Add timeout to prevent hanging
        )

        # Try to use vector store for additional context, but don't fail if it's empty
        general_context = ""
        try:
            vectorstore = Chroma(
                persist_directory=persist_directory,
                embedding_function=embeddings
            )
            docs = vectorstore.similarity_search(chat_request.message, k=3)
            if docs:
                general_context = "\n".join([doc.page_content for doc in docs])
        except Exception as ve:
            logger.warning(f"Vector store not available, proceeding without it: {ve}")
            general_context = ""
        
        # Build conversation context
        conversation_context = ""
        if conversation_history:
            conversation_context = "\n\nPrevious conversation:\n"
            for msg in conversation_history[-5:]:  # Keep last 5 messages for context
                conversation_context += f"User: {msg['user']}\nAssistant: {msg['assistant']}\n"
        
        prompt = f"""
        You are a helpful AI fashion assistant. Use this context to provide accurate fashion advice:
        
        USER'S ACTUAL WARDROBE: {user_wardrobe_context}
        
        General Fashion Knowledge: {general_context}
        
        {conversation_context}
        
        Current User Question: {chat_request.message}
        
        IMPORTANT: Always base your responses on the user's ACTUAL wardrobe items first. If they ask about specific items they own, reference what's actually in their wardrobe. Only use general fashion knowledge to supplement or when they don't have specific items.
        
        RESPONSE FORMATTING:
        - If providing multiple suggestions or options, use clear numbered lists (1, 2, 3...)
        - Separate each numbered item with blank lines for better readability
        - Use clear paragraph breaks between different suggestions
        - Structure complex responses with proper visual hierarchy
        
        Provide helpful, accurate fashion advice based on their actual wardrobe, conversation history, and your knowledge.
        Keep responses concise but informative.
        If the user is asking a follow-up question, reference the previous conversation context.
        """
        
        response = llm.invoke(prompt)
        response_text = response.strip()
        
        # Store conversation in memory
        conversation_history.append({
            "user": chat_request.message,
            "assistant": response_text,
            "timestamp": str(datetime.now())
        })
        
        # Keep only last 10 messages to prevent memory bloat
        if len(conversation_history) > 10:
            conversation_history = conversation_history[-10:]
        
        conversation_store[conversation_id] = conversation_history
        
        return ChatResponse(
            response=response_text,
            conversation_id=conversation_id
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return ChatResponse(
            response="I'm sorry, I'm having trouble processing your request right now.", 
            error=str(e)
        )



@app.post("/virtual-try-on")
async def virtual_try_on(
    request: Request,
    user_id: str = Form(...),
    avatar_image: UploadFile = File(...),
    clothing_image: UploadFile = File(...),
    clothing_item_name: str = Form(...),
    as_image: str = Form("false")
):
    """Virtual try-on endpoint that combines user photo with clothing item"""
    # Rate limiting
    client_id = get_client_id(request)
    if not rate_limiter.is_allowed(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        # Validate both images
        validate_image_file(avatar_image)
        validate_image_file(clothing_image)
        
        # Check if OpenAI API key is properly configured
        if OPENAI_API_KEY == "your_openai_api_key_here":
            logger.warning("OpenAI API key not properly configured")
            raise HTTPException(
                status_code=503, 
                detail="AI service not configured. Please set OPENAI_API_KEY in your environment variables."
            )
        
        # Check if RapidAPI key is properly configured
        if not RAPIDAPI_KEY or RAPIDAPI_KEY == "your-rapidapi-key":
            logger.warning("RapidAPI key not properly configured")
            raise HTTPException(
                status_code=503, 
                detail="Virtual try-on service not configured. Please set RAPIDAPI_KEY in your environment variables."
            )
        
        # Get the correct URLs from the database
        if supabase is None:
            raise HTTPException(status_code=503, detail="Database not configured")

        try:
            # Get user's photo URL from users table
            user_response = supabase.table("users").select("photo_url").eq("id", user_id).execute()
            if not user_response.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_photo_url = user_response.data[0].get("photo_url")
            if not user_photo_url:
                raise HTTPException(status_code=400, detail="User photo not found. Please upload a photo first.")

            # Get the selected clothing item's image URL from wardrobe table
            # We need to find the clothing item by name - try multiple approaches
            wardrobe_response = None
            
            # First try exact match on item_name
            wardrobe_response = supabase.table("wardrobe").select("image_url, description, item_name").eq("item_name", clothing_item_name).execute()
            
            # If no exact match, try partial match on item_name
            if not wardrobe_response.data:
                wardrobe_response = supabase.table("wardrobe").select("image_url, description, item_name").ilike("item_name", f"%{clothing_item_name}%").execute()
            
            # If still no match, try matching key words in item_name
            if not wardrobe_response.data:
                # Split the clothing item name into words and search for any that match
                words = clothing_item_name.lower().split()
                for word in words:
                    if len(word) > 3:  # Only search for words longer than 3 characters
                        wardrobe_response = supabase.table("wardrobe").select("image_url, description, item_name").ilike("item_name", f"%{word}%").execute()
                        if wardrobe_response.data:
                            break
            
            # If still no match, try searching in description as fallback
            if not wardrobe_response.data:
                wardrobe_response = supabase.table("wardrobe").select("image_url, description, item_name").ilike("description", f"%{clothing_item_name}%").execute()
            
            # If still no match, get all wardrobe items for debugging
            if not wardrobe_response.data:
                all_items = supabase.table("wardrobe").select("item_name, description").execute()
                logger.error(f"Clothing item '{clothing_item_name}' not found. Available items: {[{'item_name': item['item_name'], 'description': item['description']} for item in all_items.data]}")
                raise HTTPException(status_code=404, detail=f"Clothing item '{clothing_item_name}' not found in wardrobe")
            
            clothing_image_url = wardrobe_response.data[0].get("image_url")
            actual_description = wardrobe_response.data[0].get("description")
            actual_item_name = wardrobe_response.data[0].get("item_name")
            if not clothing_image_url:
                raise HTTPException(status_code=400, detail=f"Image not found for clothing item '{clothing_item_name}'")

            logger.info(f"Found user photo URL: {user_photo_url}")
            logger.info(f"Found clothing image URL: {clothing_image_url}")
            logger.info(f"Matched clothing item: '{actual_item_name}' (description: '{actual_description}') for search term: '{clothing_item_name}'")

            # Download the images from the URLs
            import httpx
            
            # Download user photo
            async with httpx.AsyncClient() as client:
                user_response = await client.get(user_photo_url)
                user_response.raise_for_status()
                avatar_bytes = user_response.content
                
                # Download clothing image
                clothing_response = await client.get(clothing_image_url)
                clothing_response.raise_for_status()
                clothing_bytes = clothing_response.content

            logger.info(f"Downloaded user photo: {len(avatar_bytes)} bytes")
            logger.info(f"Downloaded clothing image: {len(clothing_bytes)} bytes")

        except Exception as db_error:
            logger.error(f"Database error: {db_error}")
            raise HTTPException(status_code=500, detail="Failed to retrieve user or clothing data")
        
        # Convert to base64
        avatar_b64 = base64.b64encode(avatar_bytes).decode()
        clothing_b64 = base64.b64encode(clothing_bytes).decode()
        
        try:
            # Use the correct RapidAPI virtual try-on service with /try-on-url endpoint
            # This endpoint expects URLs, not file uploads, as shown in the manual test
            url = "https://try-on-diffusion.p.rapidapi.com/try-on-url"
            
            # Prepare the payload with the correct URLs using form-urlencoded format
            payload = f"avatar_image_url={user_photo_url}&clothing_image_url={clothing_image_url}"
            
            headers = {
                'x-rapidapi-host': 'try-on-diffusion.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            logger.info(f"Sending request to RapidAPI /try-on-url")
            logger.info(f"Avatar image URL: {user_photo_url}")
            logger.info(f"Clothing image URL: {clothing_image_url}")
            logger.info(f"Clothing item name: {clothing_item_name}")
            
            response = requests.post(url, data=payload, headers=headers)
            response.raise_for_status()
            
            logger.info(f"RapidAPI response status: {response.status_code}, content length: {len(response.content)}")
            logger.info(f"RapidAPI response headers: {dict(response.headers)}")
            
            # Check if the response is actually an image
            content_type = response.headers.get('content-type', '')
            if 'image' not in content_type.lower():
                logger.warning(f"RapidAPI returned non-image content: {content_type}")
                # Try to parse as JSON to see what we got
                try:
                    error_data = response.json()
                    logger.error(f"RapidAPI error response: {error_data}")
                except:
                    logger.error(f"RapidAPI returned non-JSON, non-image content: {response.text[:200]}")
            
            # The RapidAPI returns the image directly, not JSON
            result_image_bytes = response.content
            
            # Validate that we actually got an image
            if len(result_image_bytes) < 1000:  # Too small to be a real image
                logger.error(f"RapidAPI returned suspiciously small response: {len(result_image_bytes)} bytes")
                raise Exception("RapidAPI returned invalid response - too small to be an image")
            
            logger.info(f"RapidAPI returned valid virtual try-on result: {len(result_image_bytes)} bytes")
            
            # Save the generated image to Supabase storage if configured
            result_image_url = None
            if supabase is not None:
                try:
                    # Generate a unique filename
                    import uuid
                    filename = f"{uuid.uuid4().hex[:8]}.jpg"
                    # Use the existing folder structure: tryon-results/tryon-results/{user_id}/
                    file_path = f"tryon-results/{user_id}/{filename}"
                    
                    # Upload to Supabase storage
                    upload_result = supabase.storage.from_("tryon-results").upload(
                        file_path, 
                        result_image_bytes,
                        {"content-type": "image/jpeg"}
                    )
                    
                    # Check if upload was successful (fix the error checking)
                    if not hasattr(upload_result, 'error') or upload_result.error is None:
                        # Get public URL - fix the response handling
                        try:
                            public_url_response = supabase.storage.from_("tryon-results").get_public_url(file_path)
                            
                            # Handle different response formats
                            if hasattr(public_url_response, 'data') and hasattr(public_url_response.data, 'public_url'):
                                result_image_url = public_url_response.data.public_url
                            elif hasattr(public_url_response, 'public_url'):
                                result_image_url = public_url_response.public_url
                            elif isinstance(public_url_response, str):
                                result_image_url = public_url_response
                            else:
                                # Construct the URL manually if needed
                                result_image_url = f"https://hcbkgzcpgahwbzmmlnzk.supabase.co/storage/v1/object/public/tryon-results/{file_path}"
                            
                            # Save to tryon_history table
                            history_data = {
                                "user_id": user_id,
                                "clothing_item_name": clothing_item_name,
                                "result_image_url": result_image_url,
                                "avatar_image_url": user_photo_url,
                                "clothing_image_url": clothing_image_url,
                                "created_at": "now()"
                            }
                            
                            supabase.table("tryon_history").insert(history_data).execute()
                            
                            logger.info(f"Virtual try-on result saved to database for {clothing_item_name}")
                        except Exception as url_error:
                            logger.warning(f"Failed to get public URL: {url_error}")
                            # Try to construct URL manually
                            result_image_url = f"https://hcbkgzcpgahwbzmmlnzk.supabase.co/storage/v1/object/public/tryon-results/{file_path}"
                            
                            # Save to tryon_history table with manual URL
                            history_data = {
                                "user_id": user_id,
                                "clothing_item_name": clothing_item_name,
                                "result_image_url": result_image_url,
                                "avatar_image_url": user_photo_url,
                                "clothing_image_url": clothing_image_url,
                                "created_at": "now()"
                            }
                            
                            supabase.table("tryon_history").insert(history_data).execute()
                            
                            logger.info(f"Virtual try-on result saved to database for {clothing_item_name} with manual URL")
                    else:
                        logger.warning(f"Failed to upload try-on result to storage: {upload_result.error}")
                        
                except Exception as db_error:
                    logger.warning(f"Failed to save try-on result to database: {db_error}")
            
            # Return the actual image data as a blob response
            logger.info(f"Virtual try-on completed for {clothing_item_name} - returning {len(result_image_bytes)} bytes")
            
            # Return the image directly as a response
            from fastapi.responses import Response
            return Response(
                content=result_image_bytes,
                media_type="image/jpeg",
                headers={
                    "Content-Disposition": f"attachment; filename=tryon_{clothing_item_name}.jpg",
                    "X-Clothing-Item": clothing_item_name,
                    "X-User-ID": user_id,
                    "X-Result-URL": result_image_url or "",
                    "X-Fallback": "true"
                }
            )
                
        except Exception as api_error:
            logger.error(f"RapidAPI error: {api_error}")
            # Fallback to a placeholder image
            fallback_image = base64.b64decode("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwCdABmX/9k=")
            
            from fastapi.responses import Response
            return Response(
                content=fallback_image,
                media_type="image/jpeg",
                headers={
                    "Content-Disposition": f"attachment; filename=tryon_fallback_{clothing_item_name}.jpg",
                    "X-Clothing-Item": clothing_item_name,
                    "X-User-ID": user_id,
                    "X-Fallback": "true"
                }
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in virtual try-on: {e}")
        raise HTTPException(status_code=500, detail="Failed to process virtual try-on request")

@app.get("/api/outfit-of-the-day")
async def get_outfit_of_the_day(
    request: Request,
    user_id: str = Query(..., description="User ID to get personalized outfit")
):
    """Get AI-generated outfit of the day based on user's wardrobe and weather"""
    # Rate limiting
    client_id = get_client_id(request)
    if not rate_limiter.is_allowed(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        # Check if Supabase is properly configured
        if supabase is None:
            logger.warning("Supabase not configured, returning fallback outfit")
            return {
                "outfit": {
                    "top": "Classic White T-Shirt",
                    "bottom": "Dark Blue Jeans",
                    "outerwear": "Light Jacket"
                },
                "weather": "Unknown",
                "reasoning": "Service unavailable"
            }
        
        # Get user's actual wardrobe items
        wardrobe_response = supabase.table("wardrobe").select("item_name, description, category, image_url").eq("user_id", user_id).execute()
        
        if not wardrobe_response.data:
            return {
                "outfit": {
                    "top": "Add items to your wardrobe",
                    "bottom": "to get personalized suggestions",
                    "outerwear": "Use the Add Item feature"
                },
                "weather": "Unknown",
                "reasoning": "No wardrobe items found"
            }
        
        # Get weather for outfit suggestions
        weather_response = await get_weather(request)
        
        if weather_response.error:
            # Use default weather for outfit selection
            temperature = 70  # Default to moderate temperature
            description = "moderate"
        else:
            temperature = weather_response.temp
            description = weather_response.description
        
        # Categorize wardrobe items
        tops = [item for item in wardrobe_response.data if item.get('category') == 'Tops']
        bottoms = [item for item in wardrobe_response.data if item.get('category') == 'Bottoms']
        outerwear = [item for item in wardrobe_response.data if item.get('category') == 'Outerwear']
        dresses = [item for item in wardrobe_response.data if item.get('category') == 'Dresses']
        
        # Smart outfit selection based on weather and available items
        outfit = {}
        outfit_details = {}
        reasoning = []
        
        # Helper function to get random item from list
        def get_random_item(items):
            if not items:
                return None
            return items[random.randint(0, len(items) - 1)]
        
        # Temperature-based logic with randomization
        if temperature < 50:  # Cold weather
            if outerwear:
                selected_outerwear = get_random_item(outerwear)
                outfit['outerwear'] = selected_outerwear['item_name']
                outfit_details['outerwear'] = {
                    'name': selected_outerwear['item_name'],
                    'image_url': selected_outerwear['image_url'],
                    'description': selected_outerwear['description']
                }
                reasoning.append(f"It's chilly at {temperature}°F, so we've layered this outfit with your {selected_outerwear['item_name']} for warmth")
            else:
                outfit['outerwear'] = "Warm layer needed"
                outfit_details['outerwear'] = None
                reasoning.append(f"Cold weather detected but you don't have outerwear in your wardrobe yet")

            if tops:
                selected_top = get_random_item(tops)
                outfit['top'] = selected_top['item_name']
                outfit_details['top'] = {
                    'name': selected_top['item_name'],
                    'image_url': selected_top['image_url'],
                    'description': selected_top['description']
                }
            else:
                outfit['top'] = "Warm top needed"
                outfit_details['top'] = None

            if bottoms:
                selected_bottom = get_random_item(bottoms)
                outfit['bottom'] = selected_bottom['item_name']
                outfit_details['bottom'] = {
                    'name': selected_bottom['item_name'],
                    'image_url': selected_bottom['image_url'],
                    'description': selected_bottom['description']
                }
            else:
                outfit['bottom'] = "Warm bottom needed"
                outfit_details['bottom'] = None
                
        elif temperature < 70:  # Moderate weather
            if tops:
                selected_top = get_random_item(tops)
                outfit['top'] = selected_top['item_name']
                outfit_details['top'] = {
                    'name': selected_top['item_name'],
                    'image_url': selected_top['image_url'],
                    'description': selected_top['description']
                }
                reasoning.append(f"Perfect {temperature}°F weather for your {selected_top['item_name']}")
            else:
                outfit['top'] = "Moderate weather top needed"
                outfit_details['top'] = None

            if bottoms:
                selected_bottom = get_random_item(bottoms)
                outfit['bottom'] = selected_bottom['item_name']
                outfit_details['bottom'] = {
                    'name': selected_bottom['item_name'],
                    'image_url': selected_bottom['image_url'],
                    'description': selected_bottom['description']
                }
            else:
                outfit['bottom'] = "Moderate weather bottom needed"
                outfit_details['bottom'] = None

            if outerwear and temperature < 65:
                selected_outerwear = get_random_item(outerwear)
                outfit['outerwear'] = selected_outerwear['item_name']
                outfit_details['outerwear'] = {
                    'name': selected_outerwear['item_name'],
                    'image_url': selected_outerwear['image_url'],
                    'description': selected_outerwear['description']
                }
                reasoning.append(f"Added your {selected_outerwear['item_name']} for an extra layer")
            else:
                outfit['outerwear'] = "None needed"
                outfit_details['outerwear'] = None
                
        else:  # Hot weather
            if tops:
                selected_top = get_random_item(tops)
                outfit['top'] = selected_top['item_name']
                outfit_details['top'] = {
                    'name': selected_top['item_name'],
                    'image_url': selected_top['image_url'],
                    'description': selected_top['description']
                }
                reasoning.append(f"Warm {temperature}°F day calls for your {selected_top['item_name']}")
            else:
                outfit['top'] = "Light top needed"
                outfit_details['top'] = None

            if bottoms:
                selected_bottom = get_random_item(bottoms)
                outfit['bottom'] = selected_bottom['item_name']
                outfit_details['bottom'] = {
                    'name': selected_bottom['item_name'],
                    'image_url': selected_bottom['image_url'],
                    'description': selected_bottom['description']
                }
            else:
                outfit['bottom'] = "Light bottom needed"
                outfit_details['bottom'] = None

            outfit['outerwear'] = "None needed"
            outfit_details['outerwear'] = None
            reasoning.append("No jacket needed in this warm weather")
        
        # Add weather context
        weather_context = f"{temperature}°F, {description}"

        # Create natural-sounding reasoning
        reasoning_text = ". ".join(reasoning)
        if reasoning_text and not reasoning_text.endswith('.'):
            reasoning_text += "."

        return {
            "outfit": outfit,
            "outfit_details": outfit_details,
            "weather": weather_context,
            "reasoning": reasoning_text,
            "wardrobe_count": len(wardrobe_response.data),
            "categories_available": list(set([item.get('category') for item in wardrobe_response.data if item.get('category')]))
        }
        
    except Exception as e:
        logger.error(f"Error in outfit-of-the-day: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate outfit")

@app.get("/api/tryon-history")
async def get_tryon_history(
    request: Request,
    user_id: str,
    limit: int = 10
):
    """Get user's try-on history"""
    # Rate limiting
    client_id = get_client_id(request)
    if not rate_limiter.is_allowed(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        # Check if Supabase is properly configured
        if supabase is None:
            logger.warning("Supabase not configured, returning empty history")
            return {"history": []}
        
        # Fetch try-on history from Supabase
        response = supabase.table("tryon_history").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        
        return {"history": response.data}
        
    except Exception as e:
        logger.error(f"Error fetching try-on history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

@app.get("/api/wardrobe")
async def get_user_wardrobe(user_id: str):
    """Get user's wardrobe items for chat integration"""
    try:
        # Get user's actual wardrobe items
        wardrobe_response = supabase.table("wardrobe").select(
            "id, item_name, description, category, image_url, date_added"
        ).eq("user_id", user_id).execute()
        
        if not wardrobe_response.data:
            return []
        
        return wardrobe_response.data
        
    except Exception as e:
        logger.error(f"Error fetching user wardrobe: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch wardrobe items")

@app.post("/api/outfit-suggestions")
async def get_outfit_suggestions(
    request: Request,
    user_id: str = Body(..., embed=True),
    occasions: List[str] = Body(..., embed=True),
    weather_consideration: bool = Body(True, embed=True)
):
    """Get AI-powered outfit suggestions for specific occasions"""
    # Rate limiting
    client_id = get_client_id(request)
    if not rate_limiter.is_allowed(client_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        # Check if Supabase is properly configured
        if supabase is None:
            logger.warning("Supabase not configured, returning fallback suggestions")
            return {"suggestions": [], "error": "Service unavailable"}
        
        # Get user's actual wardrobe items
        wardrobe_response = supabase.table("wardrobe").select("item_name, description, category, image_url").eq("user_id", user_id).execute()
        
        if not wardrobe_response.data:
            return {"suggestions": [], "error": "No wardrobe items found"}
        
        # Get weather if requested
        weather_context = ""
        if weather_consideration:
            try:
                weather_response = await get_weather(request)
                if not weather_response.error:
                    weather_context = f"Current weather: {weather_response.temp}°F, {weather_response.description}. "
            except Exception as e:
                logger.warning(f"Weather fetch failed: {e}")
                weather_context = "Weather information unavailable. "
        
        # Categorize wardrobe items
        wardrobe_by_category = {}
        for item in wardrobe_response.data:
            category = item.get('category', 'Uncategorized')
            if category not in wardrobe_by_category:
                wardrobe_by_category[category] = []
            wardrobe_by_category[category].append(item)
        
        # Define occasion-specific requirements
        occasion_requirements = {
            'business': {
                'style': 'formal',
                'required_categories': ['Tops', 'Bottoms'],
                'optional_categories': ['Outerwear', 'Shoes'],
                'color_preferences': ['neutral', 'professional'],
                'description': 'Professional business attire suitable for meetings and office environments',
                'inappropriate_items': ['shorts', 'jeans', 't-shirts', 'sweatshirts', 'cargo pants'],
                'preferred_items': ['dress pants', 'slacks', 'chinos', 'button-down shirts', 'polo shirts', 'blazers']
            },
            'date': {
                'style': 'elegant',
                'required_categories': ['Tops', 'Bottoms'],
                'optional_categories': ['Outerwear', 'Shoes', 'Accessories'],
                'color_preferences': ['romantic', 'stylish'],
                'description': 'Elegant and attractive outfit perfect for romantic evenings',
                'inappropriate_items': ['shorts', 'cargo pants', 'sweatshirts', 'workout clothes'],
                'preferred_items': ['dress pants', 'chinos', 'button-down shirts', 'polo shirts', 'blazers']
            },
            'casual': {
                'style': 'comfortable',
                'required_categories': ['Tops', 'Bottoms'],
                'optional_categories': ['Outerwear', 'Shoes'],
                'color_preferences': ['versatile', 'comfortable'],
                'description': 'Comfortable and stylish casual wear for everyday activities',
                'inappropriate_items': ['suit jackets', 'dress pants'],
                'preferred_items': ['jeans', 'chinos', 'polo shirts', 't-shirts', 'sweatshirts']
            },
            'weekend': {
                'style': 'relaxed',
                'required_categories': ['Tops', 'Bottoms'],
                'optional_categories': ['Outerwear', 'Shoes'],
                'color_preferences': ['casual', 'comfortable'],
                'description': 'Relaxed weekend wear for leisure activities and social gatherings',
                'inappropriate_items': ['suit jackets', 'dress pants', 'formal shirts'],
                'preferred_items': ['jeans', 'chinos', 'polo shirts', 't-shirts', 'sweatshirts']
            },
            'evening': {
                'style': 'sophisticated',
                'required_categories': ['Tops', 'Bottoms'],
                'optional_categories': ['Outerwear', 'Shoes', 'Accessories'],
                'color_preferences': ['elegant', 'dramatic'],
                'description': 'Sophisticated evening wear for formal events and special occasions',
                'inappropriate_items': ['shorts', 'cargo pants', 'sweatshirts', 'workout clothes'],
                'preferred_items': ['dress pants', 'slacks', 'button-down shirts', 'polo shirts', 'blazers']
            },
            'workout': {
                'style': 'athletic',
                'required_categories': ['Tops', 'Bottoms'],
                'optional_categories': ['Shoes', 'Accessories'],
                'color_preferences': ['energetic', 'comfortable'],
                'description': 'Performance athletic wear for gym workouts and physical activities',
                'inappropriate_items': ['dress pants', 'blazers', 'formal shirts', 'dress shoes'],
                'preferred_items': ['athletic shorts', 'workout pants', 'performance shirts', 'tank tops']
            },
            'travel': {
                'style': 'versatile',
                'required_categories': ['Tops', 'Bottoms'],
                'optional_categories': ['Outerwear', 'Shoes'],
                'color_preferences': ['versatile', 'comfortable'],
                'description': 'Versatile travel wear that is comfortable and easy to mix and match',
                'inappropriate_items': ['suit jackets', 'formal dress pants'],
                'preferred_items': ['chinos', 'jeans', 'polo shirts', 'button-down shirts', 'blazers']
            }
        }
        
        suggestions = []
        
        for occasion_id in occasions:
            if occasion_id not in occasion_requirements:
                continue
                
            req = occasion_requirements[occasion_id]
            
            # Create intelligent outfit combination
            outfit_items = []
            reasoning = []
            style_tips = []
            
            # Select required items
            for category in req['required_categories']:
                if category in wardrobe_by_category and wardrobe_by_category[category]:
                    # Pick the best item for this occasion
                    best_item = select_best_item_for_occasion(
                        wardrobe_by_category[category], 
                        req['style'], 
                        req['color_preferences'],
                        req.get('inappropriate_items', []),
                        req.get('preferred_items', [])
                    )
                    if best_item:
                        outfit_items.append(best_item)
                        reasoning.append(f"Selected {best_item['item_name']} for {category.lower()}")
            
            # Add optional items if available
            for category in req['optional_categories']:
                if category in wardrobe_by_category and wardrobe_by_category[category]:
                    if len(outfit_items) < 4:  # Limit total items
                        best_item = select_best_item_for_occasion(
                            wardrobe_by_category[category], 
                            req['style'], 
                            req['color_preferences'],
                            req.get('inappropriate_items', []),
                            req.get('preferred_items', [])
                        )
                        if best_item:
                            outfit_items.append(best_item)
                            reasoning.append(f"Added {best_item['item_name']} for {category.lower()}")
            
            # Generate intelligent style tips
            style_tips = generate_style_tips(req['style'], outfit_items, weather_context)
            
            # Create suggestion
            if outfit_items:
                suggestions.append({
                    "id": f"{occasion_id}_{len(suggestions)}",
                    "occasion": req['description'],
                    "items": outfit_items,
                    "reasoning": " | ".join(reasoning),
                    "style_tips": style_tips,
                    "style": req['style'],
                    "weather_considered": weather_consideration
                })
        
        return {
            "suggestions": suggestions,
            "wardrobe_count": len(wardrobe_response.data),
            "categories_available": list(wardrobe_by_category.keys())
        }
        
    except Exception as e:
        logger.error(f"Error in outfit suggestions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate outfit suggestions")

def select_best_item_for_occasion(items: List[dict], style: str, color_preferences: List[str], inappropriate_items: List[str] = None, preferred_items: List[str] = None) -> Optional[dict]:
    """Select the best item for a specific occasion and style"""
    if not items:
        return None
    
    # Score items based on style and color preferences
    scored_items = []
    for item in items:
        score = 0
        item_name = item.get('item_name', '').lower()
        description = item.get('description', '').lower()
        category = item.get('category', '').lower()
        
        # Style scoring with stronger penalties for inappropriate items
        if style == 'formal':
            # Strong positive scoring for formal items
            if any(word in item_name or word in description for word in ['blazer', 'suit', 'dress', 'shirt', 'polo', 'button-down', 'oxford']):
                score += 8  # Increased bonus for formal tops
            elif any(word in item_name or word in description for word in ['dress pants', 'slacks', 'chinos', 'trousers', 'pants']):
                score += 8  # Increased bonus for formal bottoms
            elif any(word in item_name or word in description for word in ['pants', 'trousers']):
                score += 5
            
            # Strong negative scoring for casual/inappropriate items
            if any(word in item_name or word in description for word in ['shorts', 'jeans', 'sweatshirt', 'hoodie', 't-shirt', 'cargo', 'athletic', 'tank', 'sports']):
                score -= 15  # Much stronger penalty for athletic/sports items
            elif any(word in item_name or word in description for word in ['casual', 'relaxed', 'loose']):
                score -= 8
                
        elif style == 'elegant':
            # Similar to formal but with some flexibility
            if any(word in item_name or word in description for word in ['blazer', 'suit', 'dress', 'shirt', 'polo', 'button-down']):
                score += 4
            elif any(word in item_name or word in description for word in ['dress pants', 'slacks', 'chinos', 'trousers']):
                score += 4
            elif any(word in item_name or word in description for word in ['pants', 'trousers']):
                score += 2
            
            # Penalize very casual items
            if any(word in item_name or word in description for word in ['shorts', 'cargo', 'sweatshirt', 'hoodie']):
                score -= 8
            elif any(word in item_name or word in description for word in ['jeans', 't-shirt']):
                score -= 3
                
        elif style == 'casual':
            # Good scoring for casual items
            if any(word in item_name or word in description for word in ['jeans', 't-shirt', 'sweatshirt', 'hoodie', 'polo', 'shorts']):
                score += 3
            elif any(word in item_name or word in description for word in ['casual', 'relaxed', 'comfortable']):
                score += 2
            
            # Slight penalty for very formal items
            if any(word in item_name or word in description for word in ['suit', 'dress pants', 'blazer']):
                score -= 2
                
        elif style == 'athletic':
            # Strong positive scoring for athletic items
            if any(word in item_name or word in description for word in ['gym', 'workout', 'athletic', 'sports', 'performance', 'moisture-wicking']):
                score += 5
            elif any(word in item_name or word in description for word in ['shorts', 'pants', 'shirt', 'tank']):
                score += 2
            
            # Strong penalty for formal items
            if any(word in item_name or word in description for word in ['blazer', 'suit', 'dress', 'dress pants']):
                score -= 8
                
        elif style == 'comfortable':
            # Good scoring for comfortable items
            if any(word in item_name or description for word in ['comfortable', 'relaxed', 'soft', 'breathable']):
                score += 3
            elif any(word in item_name or description for word in ['cotton', 'blend', 'stretch']):
                score += 1
            
            # Penalty for restrictive items
            if any(word in item_name or description for word in ['tight', 'restrictive', 'stiff']):
                score -= 3
        
        # Category-specific scoring for formal occasions
        if style == 'formal' and category == 'bottoms':
            # Strong preference for pants over shorts
            if 'shorts' in item_name or 'shorts' in description:
                score -= 15  # Very strong penalty for shorts in formal settings
            elif 'pants' in item_name or 'pants' in description:
                score += 8
            elif 'dress' in item_name or 'dress' in description:
                score += 10
        
        if style == 'formal' and category == 'tops':
            # Strong preference for business-appropriate tops
            if any(word in item_name or word in description for word in ['athletic', 'tank', 'sports', 'workout', 'gym']):
                score -= 20  # Very strong penalty for athletic tops in formal settings
            elif any(word in item_name or word in description for word in ['polo', 'shirt', 'button-down', 'oxford']):
                score += 10  # Strong bonus for business-appropriate tops
        
        # Color preference scoring
        if 'neutral' in color_preferences:
            if any(word in item_name or word in description for word in ['black', 'white', 'gray', 'navy', 'beige', 'brown', 'charcoal']):
                score += 3
        if 'professional' in color_preferences:
            if any(word in item_name or word in description for word in ['navy', 'black', 'gray', 'white', 'charcoal']):
                score += 3
        if 'romantic' in color_preferences:
            if any(word in item_name or word in description for word in ['red', 'pink', 'purple', 'rose', 'burgundy']):
                score += 2
        if 'versatile' in color_preferences:
            if any(word in item_name or word in description for word in ['black', 'white', 'gray', 'navy', 'beige']):
                score += 2
        
        # Additional context-based scoring
        if 'business' in item_name or 'business' in description:
            if style == 'formal':
                score += 3
            elif style == 'casual':
                score -= 1
        
        if 'casual' in item_name or 'casual' in description:
            if style == 'formal':
                score -= 3
            elif style == 'casual':
                score += 2
        
        # Use occasion-specific inappropriate and preferred items
        if inappropriate_items:
            for inappropriate in inappropriate_items:
                if inappropriate.lower() in item_name or inappropriate.lower() in description:
                    score -= 12  # Very strong penalty for inappropriate items
        
        if preferred_items:
            for preferred in preferred_items:
                if preferred.lower() in item_name or preferred.lower() in description:
                    score += 8  # Strong bonus for preferred items
        
        scored_items.append((score, item))
    
    # Return the highest scored item
    if scored_items:
        scored_items.sort(key=lambda x: x[0], reverse=True)
        # Log the scoring for debugging
        logger.info(f"Item scoring for {style} style: {[(item['item_name'], score) for score, item in scored_items[:3]]}")
        return scored_items[0][1]
    
    return items[0] if items else None

def generate_style_tips(style: str, items: List[dict], weather_context: str) -> List[str]:
    """Generate intelligent style tips based on style and items"""
    tips = []
    
    # Style-specific tips
    if style == 'formal':
        tips.extend([
            "Keep accessories minimal and professional",
            "Ensure proper fit - not too tight or loose",
            "Choose classic colors for timeless appeal"
        ])
    elif style == 'casual':
        tips.extend([
            "Layer pieces for added dimension",
            "Mix textures for visual interest",
            "Don't be afraid to add personality with accessories"
        ])
    elif style == 'athletic':
        tips.extend([
            "Prioritize comfort and mobility",
            "Choose moisture-wicking fabrics when possible",
            "Ensure proper fit for performance"
        ])
    elif style == 'elegant':
        tips.extend([
            "Focus on sophisticated color combinations",
            "Pay attention to fabric quality and texture",
            "Balance bold pieces with classic staples"
        ])
    elif style == 'sophisticated':
        tips.extend([
            "Choose refined, high-quality materials",
            "Opt for timeless silhouettes",
            "Let one statement piece be the focal point"
        ])
    elif style == 'versatile':
        tips.extend([
            "Select pieces that work for multiple occasions",
            "Focus on neutral colors as a base",
            "Add personality with accessories and layering"
        ])
    
    # Weather-specific tips
    if weather_context:
        if 'cold' in weather_context.lower():
            tips.append("Layer appropriately for warmth")
        elif 'hot' in weather_context.lower():
            tips.append("Choose breathable, lightweight fabrics")
        elif 'rain' in weather_context.lower():
            tips.append("Consider water-resistant outerwear")
    
    # General tips
    tips.extend([
        "Ensure colors complement each other",
        "Check that proportions work together",
        "Consider the occasion's dress code"
    ])
    
    return tips[:5]  # Limit to 5 tips

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "timestamp": time.time()}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "TryOn.AI API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)