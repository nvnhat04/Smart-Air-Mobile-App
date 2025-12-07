#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server with uvicorn
uvicorn app.main:app --host 0.0.0.0 --port $PORT
