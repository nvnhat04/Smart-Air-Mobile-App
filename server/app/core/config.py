"""
Application configuration and settings
"""
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # API Info
    APP_NAME: str = "SmartAQ PM2.5 API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "TiTiler-based tile server for PM2.5 GeoTIFF data"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    RELOAD: bool = True
    
    # CORS
    CORS_ORIGINS: list = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]
    
    # Data paths
    BASE_DIR: Path = Path(__file__).parent.parent.parent  # Go up to server/ directory
    TIF_DIR: Path = BASE_DIR / "data" / "tif_files"
    
    # PM2.5 Settings
    DEFAULT_COLORMAP: str = "aqi"
    DEFAULT_OPACITY: float = 0.6
    TILE_SIZE: int = 256
    MAX_ZOOM: int = 18
    
    # AQI Breakpoints (US EPA for PM2.5)
    AQI_BREAKPOINTS: list = [
        {"pm_min": 0.0, "pm_max": 25.0, "aqi_min": 0, "aqi_max": 50, "color": (0, 228, 0, 255), "level": "Good"},
        {"pm_min": 25.1, "pm_max": 50, "aqi_min": 51, "aqi_max": 100, "color": (255, 255, 0, 255), "level": "Moderate"},
        {"pm_min": 50.1, "pm_max": 80, "aqi_min": 101, "aqi_max": 150, "color": (255, 126, 0, 255), "level": "Unhealthy for Sensitive Groups"},
        {"pm_min": 80.1, "pm_max": 150, "aqi_min": 151, "aqi_max": 200, "color": (255, 0, 0, 255), "level": "Unhealthy"},
        {"pm_min": 150.1, "pm_max": 250, "aqi_min": 201, "aqi_max": 300, "color": (143, 63, 151, 255), "level": "Very Unhealthy"},
        {"pm_min": 250.1, "pm_max": 500, "aqi_min": 301, "aqi_max": 500, "color": (126, 0, 35, 255), "level": "Hazardous"}
    ]
    
    class Config:
        case_sensitive = True
        env_file = ".env"


# Global settings instance
settings = Settings()
