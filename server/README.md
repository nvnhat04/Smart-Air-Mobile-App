# SmartAQ PM2.5 API Server

FastAPI-based tile server for PM2.5 GeoTIFF data visualization with AQI colormap.

## Project Structure

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── api/
│   │   ├── __init__.py
│   │   └── endpoints/
│   │       ├── __init__.py
│   │       └── pm25.py      # PM2.5 endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py        # Configuration & settings
│   ├── models/              # Data models (Pydantic)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── aqi_service.py   # AQI calculation
│   │   ├── geotiff_service.py  # GeoTIFF file management
│   │   └── tile_service.py  # Tile rendering
│   └── utils/               # Utility functions
├── data/
│   └── tif_files/           # GeoTIFF data files
│       └── PM25_YYYYMMDD_3kmNRT.tif
├── scripts/
│   └── download_pm25.py     # Data download script
├── requirements.txt
├── run.py                   # Server entry point
├── .env                     # Environment variables
└── README.md
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file (optional):
```env
HOST=0.0.0.0
PORT=8000
DEBUG=True
TIF_DIR=data/tif_files
```

## Usage

### Start Server

```bash
# Method 1: Using run.py
python run.py

# Method 2: Using uvicorn directly
uvicorn app.main:app --reload --port 8000
```

### API Endpoints

- **Root**: `GET /` - API information
- **Health Check**: `GET /health` - Server health status
- **Available Dates**: `GET /pm25/dates` - List of available data dates
- **Point Query**: `GET /pm25/point?lon=105.8&lat=21.0&date=20251202` - Get PM2.5/AQI at coordinate
- **Tiles**: `GET /pm25/tiles/{z}/{x}/{y}.png?date=20251202&colormap_name=aqi` - Get map tiles
- **API Docs**: `GET /docs` - Interactive API documentation

### Download PM2.5 Data

```bash
# Download for specific date
python scripts/download_pm25.py 20251202

# Download from URL
python scripts/download_pm25.py --url "http://..."

# Download last 7 days
python scripts/download_pm25.py --last-n-days 7
```

## Features

- ✅ FastAPI with async support
- ✅ PM2.5 to AQI conversion (US EPA standard)
- ✅ Custom AQI colormap for tiles
- ✅ Support for multiple colormaps (matplotlib)
- ✅ CORS enabled for web apps
- ✅ Interactive API documentation (Swagger UI)
- ✅ Modular architecture for easy extension
- ✅ Type hints with Pydantic
- ✅ Logging and error handling

## Configuration

Edit `app/core/config.py` or use environment variables:

- `APP_NAME`: Application name
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `TIF_DIR`: Path to GeoTIFF files directory
- `DEFAULT_COLORMAP`: Default colormap (default: aqi)
- `CORS_ORIGINS`: Allowed CORS origins

## Development

### Adding New Endpoints

1. Create endpoint file in `app/api/endpoints/`
2. Define router and endpoints
3. Register in `app/api/__init__.py`

### Adding New Services

1. Create service file in `app/services/`
2. Implement service functions
3. Export in `app/services/__init__.py`

## Deployment

### Docker (Coming soon)

```bash
docker build -t smartaq-api .
docker run -p 8000:8000 -v ./data:/app/data smartaq-api
```

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## License

MIT License
