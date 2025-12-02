"""
Tile rendering service with AQI colormap
"""
import logging
from io import BytesIO
from typing import Tuple

import numpy as np
from app.core.config import settings
from PIL import Image

logger = logging.getLogger(__name__)


def apply_aqi_colormap(data: np.ndarray, mask: np.ndarray = None) -> np.ndarray:
    """
    Apply AQI colormap to PM2.5 data
    
    Args:
        data: PM2.5 data array
        mask: Optional mask array
        
    Returns:
        RGBA array with AQI colors applied
    """
    # Create RGBA array
    rgba = np.zeros((*data.shape, 4), dtype=np.uint8)
    
    # Apply colors for each AQI breakpoint
    for bp in settings.AQI_BREAKPOINTS:
        mask_range = (data >= bp["pm_min"]) & (data <= bp["pm_max"])
        rgba[mask_range] = bp["color"]
    
    # Handle values > 500
    rgba[data > 500] = (126, 0, 35, 255)
    
    # Handle nodata/mask
    if mask is not None:
        rgba[mask == 0, 3] = 0  # Set alpha to 0 for masked pixels
    
    return rgba


def create_tile_png(
    data: np.ndarray,
    mask: np.ndarray = None,
    colormap: str = "aqi",
    vmin: float = 0,
    vmax: float = 150
) -> bytes:
    """
    Create PNG tile from data
    
    Args:
        data: Tile data array
        mask: Optional mask array
        colormap: Colormap name ('aqi' or matplotlib colormap)
        vmin: Minimum value for rescaling
        vmax: Maximum value for rescaling
        
    Returns:
        PNG image bytes
    """
    if colormap.lower() == 'aqi':
        rgba_uint8 = apply_aqi_colormap(data, mask)
    else:
        # Use matplotlib colormap
        import matplotlib.pyplot as plt
        data_normalized = np.clip((data - vmin) / (vmax - vmin), 0, 1)
        colormap_obj = plt.get_cmap(colormap)
        rgba = colormap_obj(data_normalized)
        rgba_uint8 = (rgba * 255).astype(np.uint8)
        
        # Handle mask
        if mask is not None:
            rgba_uint8[..., 3] = np.where(mask == 0, 0, 255)
    
    # Create PIL image and save to bytes
    pil_img = Image.fromarray(rgba_uint8, mode='RGBA')
    buf = BytesIO()
    pil_img.save(buf, format='PNG')
    
    return buf.getvalue()


def create_transparent_tile() -> bytes:
    """
    Create transparent PNG tile
    
    Returns:
        PNG image bytes
    """
    transparent = Image.new('RGBA', (settings.TILE_SIZE, settings.TILE_SIZE), (0, 0, 0, 0))
    buf = BytesIO()
    transparent.save(buf, format='PNG')
    return buf.getvalue()
