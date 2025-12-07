"""
Location tracking endpoints
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.core.security import get_current_user
from app.db.mongodb import get_database
from app.models.location import (LocationHistoryStats, LocationRecordCreate,
                                 LocationRecordResponse)
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter()


@router.post('/save', response_model=LocationRecordResponse, status_code=status.HTTP_201_CREATED)
async def save_location(
    payload: LocationRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Save user location with AQI data
    
    Requires JWT authentication. User can only save their own location.
    """
    db = get_database()
    
    # Verify user is saving their own location
    if current_user["user_id"] != payload.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only save your own location"
        )
    
    # Create location record
    
    location_doc = {
        "user_id": payload.user_id,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "aqi": payload.aqi,
        "pm25": payload.pm25,
        "address": payload.address,
        "timestamp": datetime.now(timezone.utc)
    }
    
    # Insert into database
    result = await db.locations.insert_one(location_doc)
    
    return LocationRecordResponse(
        _id=str(result.inserted_id),
        user_id=location_doc["user_id"],
        latitude=location_doc["latitude"],
        longitude=location_doc["longitude"],
        aqi=location_doc["aqi"],
        pm25=location_doc["pm25"],
        address=location_doc["address"],
        timestamp=location_doc["timestamp"]
    )


@router.get('/history', response_model=List[LocationRecordResponse])
async def get_location_history(
    user_id: Optional[str] = Query(None, description="User ID to get history for"),
    days: int = Query(15, ge=1, le=90, description="Number of days to retrieve"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum records to return"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get location history for a user
    
    Requires JWT authentication. User can only get their own history.
    """
    db = get_database()
    
    # Use current user's ID if not specified
    target_user_id = user_id or current_user["user_id"]
    
    # Verify user is getting their own history
    if current_user["user_id"] != target_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own location history"
        )
    
    # Calculate date range
    vn_tz = timezone(timedelta(hours=7))  # UTC+7 Vietnam timezone
    cutoff_date = datetime.now(vn_tz) - timedelta(days=days)
    
    # Query database
    cursor = db.locations.find({
        "user_id": target_user_id,
        "timestamp": {"$gte": cutoff_date}
    }).sort("timestamp", -1).limit(limit)
    
    locations = await cursor.to_list(length=limit)
    
    return [
        LocationRecordResponse(
            _id=str(loc["_id"]),
            user_id=loc["user_id"],
            latitude=loc["latitude"],
            longitude=loc["longitude"],
            aqi=loc.get("aqi"),
            address=loc.get("address"),
            timestamp=loc["timestamp"]
        )
        for loc in locations
    ]


@router.get('/history/{user_id}', response_model=List[LocationRecordResponse])
async def get_user_location_history(
    user_id: str,
    days: int = Query(15, ge=1, le=90, description="Number of days to retrieve"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum records to return"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get location history for a specific user by ID
    
    Requires JWT authentication. User can only get their own history.
    """
    db = get_database()
    
    # Verify user is getting their own history
    if current_user["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own location history"
        )
    
    # Calculate date range
    vn_tz = timezone(timedelta(hours=7))  # UTC+7 Vietnam timezone
    cutoff_date = datetime.now(vn_tz) - timedelta(days=days)
    
    # Query database
    cursor = db.locations.find({
        "user_id": user_id,
        "timestamp": {"$gte": cutoff_date}
    }).sort("timestamp", -1).limit(limit)
    
    locations = await cursor.to_list(length=limit)
    
    return [
        LocationRecordResponse(
            _id=str(loc["_id"]),
            user_id=loc["user_id"],
            latitude=loc["latitude"],
            longitude=loc["longitude"],
            aqi=loc.get("aqi"),
            address=loc.get("address"),
            timestamp=loc["timestamp"]
        )
        for loc in locations
    ]


@router.get('/stats', response_model=LocationHistoryStats)
async def get_location_stats(
    days: int = Query(15, ge=1, le=90, description="Number of days for statistics"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get statistics for user's location history
    
    Requires JWT authentication.
    """
    db = get_database()
    user_id = current_user["user_id"]
    
    # Calculate date range
    vn_tz = timezone(timedelta(hours=7))  # UTC+7 Vietnam timezone
    cutoff_date = datetime.now(vn_tz) - timedelta(days=days)
    
    # Get all records for the period
    cursor = db.locations.find({
        "user_id": user_id,
        "timestamp": {"$gte": cutoff_date}
    })
    
    locations = await cursor.to_list(length=10000)
    
    if not locations:
        return LocationHistoryStats(
            total_records=0,
            date_range={"start": None, "end": None},
            avg_aqi=None,
            max_aqi=None,
            min_aqi=None,
            avg_pm25=None,
            max_pm25=None,
            min_pm25=None,
            most_visited_location=None,
            unique_locations=0
        )
    
    # Calculate statistics
    total_records = len(locations)
    
    # Date range
    timestamps = [loc["timestamp"] for loc in locations]
    start_date = min(timestamps).strftime("%Y-%m-%d")
    end_date = max(timestamps).strftime("%Y-%m-%d")
    
    # AQI statistics
    aqi_values = [loc["aqi"] for loc in locations if loc.get("aqi") is not None]
    avg_aqi = sum(aqi_values) / len(aqi_values) if aqi_values else None
    max_aqi = max(aqi_values) if aqi_values else None
    min_aqi = min(aqi_values) if aqi_values else None
    
    # PM2.5 statistics
    pm25_values = [loc["pm25"] for loc in locations if loc.get("pm25") is not None]
    avg_pm25 = sum(pm25_values) / len(pm25_values) if pm25_values else None
    max_pm25 = max(pm25_values) if pm25_values else None
    min_pm25 = min(pm25_values) if pm25_values else None
    
    # Most visited location
    address_counts = {}
    for loc in locations:
        addr = loc.get("address")
        if addr:
            address_counts[addr] = address_counts.get(addr, 0) + 1
    
    most_visited = max(address_counts.items(), key=lambda x: x[1])[0] if address_counts else None
    unique_locations = len(address_counts)
    
    return LocationHistoryStats(
        total_records=total_records,
        date_range={"start": start_date, "end": end_date},
        avg_aqi=round(avg_aqi, 1) if avg_aqi else None,
        max_aqi=max_aqi,
        min_aqi=min_aqi,
        avg_pm25=round(avg_pm25, 1) if avg_pm25 else None,
        max_pm25=round(max_pm25, 1) if max_pm25 else None,
        min_pm25=round(min_pm25, 1) if min_pm25 else None,
        most_visited_location=most_visited,
        unique_locations=unique_locations
    )


@router.delete('/history', status_code=status.HTTP_204_NO_CONTENT)
async def clear_location_history(
    days: Optional[int] = Query(None, ge=1, le=365, description="Clear records older than N days (optional)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Clear location history for current user
    
    If days parameter is provided, only records older than N days will be deleted.
    Otherwise, all records will be deleted.
    """
    db = get_database()
    user_id = current_user["user_id"]
    
    # Build query
    query = {"user_id": user_id}
    
    if days:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query["timestamp"] = {"$lt": cutoff_date}
    
    # Delete records
    result = await db.locations.delete_many(query)
    
    return {"deleted_count": result.deleted_count}
