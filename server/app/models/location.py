"""
Location tracking models
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class LocationRecord(BaseModel):
    """Location record model"""
    user_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    aqi: Optional[int] = Field(None, ge=0, le=500)
    pm25: Optional[float] = Field(None, ge=0, le=1000, description="PM2.5 concentration in µg/m³")
    address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "674d8e5c3f2a1b4d5e6f7g8h",
                "latitude": 21.0285,
                "longitude": 105.8542,
                "aqi": 141,
                "pm25": 84.6,
                "address": "Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội",
                "timestamp": "2024-12-05T10:30:00"
            }
        }


class LocationRecordCreate(BaseModel):
    """Schema for creating a location record"""
    user_id: str
    latitude: float = Field(..., ge=-90, le=90, alias="lat")
    longitude: float = Field(..., ge=-180, le=180, alias="lng")
    aqi: Optional[int] = Field(None, ge=0, le=500)
    pm25: Optional[float] = Field(None, ge=0, le=1000, description="PM2.5 concentration in µg/m³")
    address: Optional[str] = None

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "user_id": "674d8e5c3f2a1b4d5e6f7g8h",
                "lat": 21.0285,
                "lng": 105.8542,
                "aqi": 141,
                "pm25": 84.6,
                "address": "Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội"
            }
        }


class LocationRecordResponse(BaseModel):
    """Location record response"""
    id: str = Field(alias="_id")
    user_id: str
    latitude: float
    longitude: float
    aqi: Optional[int] = None
    pm25: Optional[float] = None
    address: Optional[str] = None
    timestamp: datetime

    class Config:
        populate_by_name = True


class LocationHistoryStats(BaseModel):
    """Statistics for location history"""
    total_records: int
    date_range: dict
    avg_aqi: Optional[float] = None
    max_aqi: Optional[int] = None
    min_aqi: Optional[int] = None
    avg_pm25: Optional[float] = None
    max_pm25: Optional[float] = None
    min_pm25: Optional[float] = None
    most_visited_location: Optional[str] = None
    unique_locations: int

    class Config:
        json_schema_extra = {
            "example": {
                "total_records": 150,
                "date_range": {
                    "start": "2024-11-20",
                    "end": "2024-12-05"
                },
                "avg_aqi": 95.5,
                "max_aqi": 180,
                "min_aqi": 45,
                "avg_pm25": 57.3,
                "max_pm25": 108.0,
                "min_pm25": 27.0,
                "most_visited_location": "Phường Dịch Vọng, Quận Cầu Giấy",
                "unique_locations": 12
            }
        }
