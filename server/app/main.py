"""
Main FastAPI application
"""
import logging

from app.api import api_router
from app.core.config import settings
from app.db.mongodb import close_mongo_connection, connect_to_mongo
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB on startup"""
    logger.info("🚀 Starting up application...")
    try:
        await connect_to_mongo()
        logger.info("✅ MongoDB connection established")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        # Continue without MongoDB - some endpoints may not work

@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection on shutdown"""
    logger.info("🔄 Shutting down application...")
    await close_mongo_connection()
    logger.info("✅ Application shutdown complete")

# Include API router
app.include_router(api_router)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "title": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "endpoints": {
            "pm25_dates": "/pm25/dates",
            "pm25_point": "/pm25/point",
            "pm25_tiles": "/pm25/tiles/{z}/{x}/{y}.png",
            "health": "/health",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    tif_count = len(list(settings.TIF_DIR.glob("PM25_*.tif"))) if settings.TIF_DIR.exists() else 0
    
    return {
        "status": "healthy",
        "tif_directory": str(settings.TIF_DIR),
        "tif_directory_exists": settings.TIF_DIR.exists(),
        "tif_files_count": tif_count
    }


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"TIF directory: {settings.TIF_DIR}")
    
    if settings.TIF_DIR.exists():
        tif_files = list(settings.TIF_DIR.glob("PM25_*.tif"))
        logger.info(f"Found {len(tif_files)} GeoTIFF files")
        for tif in tif_files[:5]:  # Log first 5 files
            logger.info(f"  - {tif.name}")
    else:
        logger.warning(f"TIF directory does not exist: {settings.TIF_DIR}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("Shutting down application")
