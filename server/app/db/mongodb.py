"""
MongoDB database connection and utilities
"""
from app.core.config import settings
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
load_dotenv()


class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

mongodb = MongoDB()


async def connect_to_mongo():
    """Connect to MongoDB"""
    # print(f"🔄 Connecting to MongoDB at {settings.MONGODB_URL}")
    mongodb.client = AsyncIOMotorClient(settings.MONGODB_URL)
    mongodb.db = mongodb.client[settings.MONGODB_DB_NAME]
    
    # Test connection
    try:
        await mongodb.client.admin.command('ping')
        print(f"✅ Connected to MongoDB database: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    if mongodb.client:
        print("🔄 Closing MongoDB connection")
        mongodb.client.close()
        print("✅ MongoDB connection closed")

def get_database():
    """Get MongoDB database instance"""
    return mongodb.db
