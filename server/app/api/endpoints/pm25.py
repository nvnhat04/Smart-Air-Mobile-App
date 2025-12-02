"""
PM2.5 API endpoints
"""
import logging
from typing import Optional

from app.services import (create_tile_png, create_transparent_tile,
                          get_aqi_category, get_available_dates,
                          get_tif_file_path, pm25_to_aqi)
from fastapi import APIRouter, HTTPException, Query
from rio_tiler.io import Reader
from starlette.responses import Response

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dates")
async def get_pm25_dates():
    """Get list of available PM2.5 dates"""
    try:
        dates = get_available_dates()
        return {
            "count": len(dates),
            "dates": dates
        }
    except Exception as e:
        logger.error(f"Error getting available dates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/point")
async def get_pm25_point(
    lon: float = Query(..., description="Longitude"),
    lat: float = Query(..., description="Latitude"),
    date: Optional[str] = Query(None, description="Date in YYYYMMDD format")
):
    """Get PM2.5 and AQI value at a specific coordinate"""
    try:
        import rasterio
        from rasterio.transform import rowcol
        
        tif_path = get_tif_file_path(date)
        abs_path = str(tif_path.resolve())
        
        logger.info(f"Point query: lon={lon}, lat={lat}, date={date}, file={tif_path.name}")
        
        with rasterio.open(abs_path) as src:
            try:
                row, col = rowcol(src.transform, lon, lat)
                
                # Check bounds
                if row < 0 or row >= src.height or col < 0 or col >= src.width:
                    return {
                        "lon": lon,
                        "lat": lat,
                        "pm25": None,
                        "aqi": None,
                        "category": None,
                        "message": "Coordinates out of bounds"
                    }
                
                # Read pixel value
                value = src.read(1)[row, col]
                
                # Check for nodata
                if src.nodata is not None and value == src.nodata:
                    value = None
                
                pm25_value = float(value) if value is not None else None
                aqi_value = pm25_to_aqi(pm25_value) if pm25_value is not None else None
                category = get_aqi_category(aqi_value)
                
                return {
                    "lon": lon,
                    "lat": lat,
                    "pm25": pm25_value,
                    "aqi": aqi_value,
                    "category": category,
                    "date": date,
                    "unit": "μg/m³"
                }
                
            except Exception as e:
                logger.error(f"Error converting coordinates: {e}")
                return {
                    "lon": lon,
                    "lat": lat,
                    "pm25": None,
                    "aqi": None,
                    "category": None,
                    "error": str(e)
                }
                
    except FileNotFoundError as e:
        logger.error(f"File not found for date {date}: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting PM2.5 point value: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tiles/{z}/{x}/{y}.png")
async def get_pm25_tile(
    z: int,
    x: int,
    y: int,
    date: Optional[str] = Query(None, description="Date in YYYYMMDD format"),
    colormap_name: str = Query("aqi", description="Colormap name"),
    rescale: Optional[str] = Query(None, description="Min,Max rescaling values")
):
    """Get PM2.5 tile with AQI colormap"""
    try:
        tif_path = get_tif_file_path(date)
        abs_path = str(tif_path.resolve())
        
        logger.info(f"Tile request: z={z}, x={x}, y={y}, date={date}, colormap={colormap_name}")
        
        # Read tile using rio-tiler
        with Reader(abs_path) as src:
            img = src.tile(x, y, z)
            
            # Check if tile has data
            if img.data.size == 0:
                png_bytes = create_transparent_tile()
                return Response(content=png_bytes, media_type="image/png")
            
            data = img.data[0]
            mask = img.mask[0] if img.mask is not None else None
            
            # Parse rescale for non-AQI colormaps
            vmin, vmax = 0, 150
            if rescale:
                vmin, vmax = map(float, rescale.split(','))
            
            # Create PNG tile
            png_bytes = create_tile_png(data, mask, colormap_name, vmin, vmax)
            return Response(content=png_bytes, media_type="image/png")
            
    except FileNotFoundError as e:
        logger.error(f"File not found for date {date}: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting PM2.5 tile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
