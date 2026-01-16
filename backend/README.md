# TryOn.AI Backend

FastAPI-based backend for virtual wardrobe and AI styling platform.

## Features

- AI-powered fashion advice using OpenAI GPT
- Virtual try-on functionality
- Wardrobe management
- Outfit suggestions based on weather and occasion
- Vector-based fashion knowledge base using Chroma
- Rate limiting and security features

## Tech Stack

- **Framework**: FastAPI
- **AI/ML**: OpenAI, LangChain
- **Database**: Supabase (PostgreSQL)
- **Vector Store**: ChromaDB
- **Caching**: Redis
- **Deployment**: Docker, Uvicorn

## Setup

### Prerequisites

- Python 3.11+
- Virtual environment (venv)
- Access to environment variables (see `.env.example`)

### Installation

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Copy the root `.env.example` to `.env` in the project root and fill in the required values:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# OpenAI
OPENAI_API_KEY=sk-...

# RapidAPI (for virtual try-on)
RAPIDAPI_KEY=your-rapidapi-key

# Weather API (Optional)
WEATHER_API_KEY=your-weather-key

# Environment
ENVIRONMENT=development
```

## Running the Application

### Development Mode

```bash
# From the backend directory
cd backend

# Run with auto-reload
uvicorn app.main:app --reload --port 8000

# Or from project root
cd ..
uvicorn backend.app.main:app --reload --port 8000
```

### Production Mode

```bash
# Using Docker
docker build -t tryon-ai-backend .
docker run -p 8000:8000 --env-file ../.env tryon-ai-backend

# Using Docker Compose (from project root)
cd ..
docker-compose up backend
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── routes/              # API route modules (future modularization)
│   ├── models/              # Pydantic models and schemas
│   ├── services/            # Business logic services
│   └── utils/               # Utility functions
├── requirements.txt         # Python dependencies
├── Dockerfile              # Docker configuration
└── README.md              # This file
```

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Wardrobe Management
- `POST /upload-item` - Upload clothing item
- `GET /wardrobe` - Get user's wardrobe items

### Virtual Try-On
- `POST /tryon` - Generate virtual try-on image

### Fashion Advice
- `POST /chat` - Chat with AI fashion assistant
- `POST /suggestions` - Get outfit suggestions

## Development

### Code Quality

```bash
# Run linting
flake8 app/

# Run type checking
mypy app/

# Run tests
pytest
```

### Adding New Routes

For future modularization, create route files in `app/routes/` and import them in `app/main.py`.

## Deployment

See the root `deploy.sh` script for automated deployment.

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in uvicorn command
2. **Environment variables not found**: Ensure `.env` file is in project root
3. **Database connection errors**: Verify Supabase credentials
4. **OpenAI API errors**: Check API key and rate limits

## License

MIT
