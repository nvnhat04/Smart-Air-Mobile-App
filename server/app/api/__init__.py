"""
API router initialization
"""
from fastapi import APIRouter

from .endpoints import pm25

api_router = APIRouter()

# Include PM2.5 endpoints
api_router.include_router(pm25.router, prefix="/pm25", tags=["PM2.5"])
