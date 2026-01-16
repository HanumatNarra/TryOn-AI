"""Initialize the fashion advice vector database with sample data"""
import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document

# Load environment variables
load_dotenv()

# Sample fashion advice data
fashion_knowledge = [
    "For a job interview, wear professional attire like a tailored suit in navy or charcoal gray, paired with a crisp white shirt and polished dress shoes.",
    "Business casual includes dress pants or khakis with a button-down shirt or blouse. Add a blazer for a more polished look.",
    "For casual everyday wear, jeans with a t-shirt or sweater work great. Add sneakers or casual loafers for comfort.",
    "Color coordination tip: Navy pairs well with white, light blue, and burgundy. Black goes with almost anything.",
    "For summer, choose lightweight fabrics like cotton and linen in light colors to stay cool.",
    "Winter layering: Start with a base layer, add a sweater or fleece, and finish with a warm coat.",
    "Accessorize with a watch, belt, and minimal jewelry to complete your outfit without overdoing it.",
    "For formal events, a dark suit with a tie or a cocktail dress is appropriate.",
    "Smart casual combines elements of formal and casual - try chinos with a polo shirt or a casual dress.",
    "Denim can be dressed up with a blazer and dress shoes, or down with sneakers and a t-shirt.",
    "Neutral colors (black, white, gray, navy, beige) are versatile and easy to mix and match.",
    "For athletic wear, choose moisture-wicking fabrics and properly fitted shoes for your activity.",
   "A well-fitted blazer is a wardrobe essential that can elevate any outfit.",
    "For date night, choose an outfit that makes you feel confident and comfortable.",
    "Seasonal colors: Pastels for spring, bright colors for summer, earth tones for fall, and deep jewel tones for winter.",
    "For business presentations, stick to conservative colors and avoid flashy patterns.",
    "Weekend brunch: Go for smart casual - maybe chinos and a nice shirt or a casual dress.",
    "Traveling: Choose comfortable, wrinkle-resistant fabrics and layer for changing temperatures.",
    "For weddings, check the dress code - typically cocktail attire or formal wear is expected.",
    "Monochromatic outfits (different shades of the same color) create a sophisticated, streamlined look."
]

def initialize_vector_db():
    """Initialize vector database with fashion knowledge"""
    print("Initializing fashion advice vector database...")

    # Get OpenAI API key
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    # Create embeddings
    embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)

    # Create documents
    documents = [Document(page_content=text) for text in fashion_knowledge]

    # Create vector store
    persist_directory = "./fashion_advice_db"

    # Remove existing database if it exists
    if os.path.exists(persist_directory):
        import shutil
        shutil.rmtree(persist_directory)
        print(f"Removed existing database at {persist_directory}")

    # Create new database
    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=persist_directory
    )

    print(f"Vector database initialized successfully!")
    print(f"Total documents: {len(fashion_knowledge)}")
    print(f"Database location: {os.path.abspath(persist_directory)}")

    # Test the database
    test_query = "What should I wear for a job interview?"
    results = vectorstore.similarity_search(test_query, k=2)
    print(f"\nTest query: '{test_query}'")
    print(f"Top result: {results[0].page_content[:100]}...")

if __name__ == "__main__":
    initialize_vector_db()
