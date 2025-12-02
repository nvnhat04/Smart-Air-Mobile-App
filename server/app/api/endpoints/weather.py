"""
Weather API endpoints (optional - for caching OpenWeather data)
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/current")
async def get_current_weather(
    lon: float = Query(..., description="Longitude"),
    lat: float = Query(..., description="Latitude"),
):
    """
    Get current weather data (placeholder - client uses OpenWeather API directly)
    This endpoint can be used to cache weather data server-side if needed
    """
    return {
        "lon": lon,
        "lat": lat,
        "message": "Weather data fetched from OpenWeather API on client side",
        "note": "This endpoint can be implemented to cache weather data server-side"
    }
