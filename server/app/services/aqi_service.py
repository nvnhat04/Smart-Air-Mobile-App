"""
AQI calculation and conversion utilities
"""
from typing import Optional

from app.core.config import settings


def pm25_to_aqi(pm25: float) -> Optional[int]:
    """
    Convert PM2.5 concentration to AQI using US EPA standard
    
    Args:
        pm25: PM2.5 concentration in μg/m³
        
    Returns:
        AQI value or None if out of range
    """
    if pm25 is None:
        return None
    
    for bp in settings.AQI_BREAKPOINTS:
        if bp["pm_min"] <= pm25 <= bp["pm_max"]:
            aqi = ((bp["aqi_max"] - bp["aqi_min"]) / (bp["pm_max"] - bp["pm_min"])) * (pm25 - bp["pm_min"]) + bp["aqi_min"]
            return round(aqi)
    
    # If PM2.5 > 500.4, return max AQI
    return 500 if pm25 > 500.4 else None


def get_aqi_category(aqi: Optional[int]) -> Optional[dict]:
    """
    Get AQI category information
    
    Args:
        aqi: AQI value
        
    Returns:
        Dictionary with level, label, and color information
    """
    if aqi is None:
        return None
    
    categories = {
        (0, 50): {"level": "Good", "label": "Tốt", "color": "#00e400"},
        (51, 100): {"level": "Moderate", "label": "Trung bình", "color": "#ffff00"},
        (101, 150): {"level": "Unhealthy for Sensitive Groups", "label": "Nhạy cảm", "color": "#ff7e00"},
        (151, 200): {"level": "Unhealthy", "label": "Không tốt", "color": "#ff0000"},
        (201, 300): {"level": "Very Unhealthy", "label": "Rất xấu", "color": "#8f3f97"},
    }
    
    for (low, high), info in categories.items():
        if low <= aqi <= high:
            return info
    
    # Hazardous
    return {"level": "Hazardous", "label": "Nguy hại", "color": "#7e0023"}
