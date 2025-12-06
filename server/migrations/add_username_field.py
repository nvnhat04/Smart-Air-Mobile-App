"""
Migration script to add username field to existing users and create unique index
Run this script once to migrate existing database
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
parent_dir = str(Path(__file__).parent.parent)
sys.path.insert(0, parent_dir)

from datetime import datetime

from app.db.mongodb import (close_mongo_connection, connect_to_mongo,
                            get_database)


async def migrate_add_username():
    """Add username field to all existing users"""
    print("🚀 Starting migration: Add username field")
    
    try:
        await connect_to_mongo()
        db = get_database()
        
        # Get all users without username field
        users_without_username = await db.users.find({"username": {"$exists": False}}).to_list(length=None)
        
        print(f"📊 Found {len(users_without_username)} users without username")
        
        if len(users_without_username) == 0:
            print("✅ All users already have username field")
        else:
            # Update each user with a generated username
            for i, user in enumerate(users_without_username):
                # Generate username from email (part before @)
                email = user.get("email", "")
                base_username = email.split("@")[0].replace(".", "_").replace("-", "_")
                
                # Ensure username is unique by appending number if needed
                username = base_username
                counter = 1
                while await db.users.find_one({"username": username}):
                    username = f"{base_username}{counter}"
                    counter += 1
                
                # Update user
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {
                        "$set": {
                            "username": username,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                print(f"  ✓ Updated user {i+1}/{len(users_without_username)}: {email} -> {username}")
        
        # Create unique index on username field
        print("📝 Creating unique index on username field...")
        try:
            await db.users.create_index("username", unique=True)
            print("✅ Unique index created on username")
        except Exception as e:
            print(f"⚠️  Index might already exist: {e}")
        
        # Create index on email field (if not exists)
        print("📝 Creating unique index on email field...")
        try:
            await db.users.create_index("email", unique=True)
            print("✅ Unique index created on email")
        except Exception as e:
            print(f"⚠️  Index might already exist: {e}")
        
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(migrate_add_username())
