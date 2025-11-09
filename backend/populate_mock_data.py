import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta, timezone
import uuid
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

# Mock data with images
food_images = [
    "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxUaGFpJTIwZm9vZHxlbnwwfHx8fDE3NjI3MDE5ODV8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1637806930600-37fa8892069d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxUaGFpJTIwZm9vZHxlbnwwfHx8fDE3NjI3MDE5ODV8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1627308595186-e6bb36712645?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwzfHxUaGFpJTIwZm9vZHxlbnwwfHx8fDE3NjI3MDE5ODV8MA&ixlib=rb-4.1.0&q=85",
    "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg",
    "https://images.pexels.com/photos/162993/food-thai-spicy-asian-162993.jpeg",
]

hotel_images = [
    "https://images.unsplash.com/photo-1570006919168-e4cddea4b99d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxUaGFpbGFuZCUyMHJlc29ydHxlbnwwfHx8fDE3NjI3MDE5OTB8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1684262206285-f853809d7473?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxUaGFpbGFuZCUyMHJlc29ydHxlbnwwfHx8fDE3NjI3MDE5OTB8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1729717949948-56b52db111dd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHxUaGFpbGFuZCUyMHJlc29ydHxlbnwwfHx8fDE3NjI3MDE5OTB8MA&ixlib=rb-4.1.0&q=85",
    "https://images.pexels.com/photos/3355777/pexels-photo-3355777.jpeg",
    "https://images.pexels.com/photos/13337944/pexels-photo-13337944.jpeg",
]

spa_images = [
    "https://images.unsplash.com/photo-1696841212541-449ca29397cc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxzcGElMjBtYXNzYWdlfGVufDB8fHx8MTc2MjcwMTk5NXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxzcGElMjBtYXNzYWdlfGVufDB8fHx8MTc2MjcwMTk5NXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1620733723572-11c53f73a416?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxzcGElMjBtYXNzYWdlfGVufDB8fHx8MTc2MjcwMTk5NXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxzcGElMjBtYXNzYWdlfGVufDB8fHx8MTc2MjcwMTk5NXww&ixlib=rb-4.1.0&q=85",
    "https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg",
]

partners = [
    {"id": str(uuid.uuid4()), "name": "The Deck Bangkok", "description": "Riverside fine dining", "category": "food", "sponsored": True, "image": food_images[0]},
    {"id": str(uuid.uuid4()), "name": "Blue Elephant", "description": "Royal Thai cuisine", "category": "food", "sponsored": False, "image": food_images[1]},
    {"id": str(uuid.uuid4()), "name": "Gaggan Anand", "description": "Progressive Indian", "category": "food", "sponsored": True, "image": food_images[2]},
    {"id": str(uuid.uuid4()), "name": "Sra Bua", "description": "Modern Thai cuisine", "category": "food", "sponsored": False, "image": food_images[3]},
    {"id": str(uuid.uuid4()), "name": "Le Du", "description": "Contemporary Thai", "category": "food", "sponsored": False, "image": food_images[4]},
    
    {"id": str(uuid.uuid4()), "name": "Mandarin Oriental", "description": "Luxury riverside hotel", "category": "hotel", "sponsored": True, "image": hotel_images[0]},
    {"id": str(uuid.uuid4()), "name": "Chiang Mai Resort", "description": "Mountain retreat", "category": "hotel", "sponsored": False, "image": hotel_images[1]},
    {"id": str(uuid.uuid4()), "name": "Phuket Beach Villa", "description": "Beachfront paradise", "category": "hotel", "sponsored": True, "image": hotel_images[2]},
    {"id": str(uuid.uuid4()), "name": "Bangkok Boutique", "description": "City center comfort", "category": "hotel", "sponsored": False, "image": hotel_images[3]},
    {"id": str(uuid.uuid4()), "name": "Krabi Cliff Resort", "description": "Cliffside views", "category": "hotel", "sponsored": False, "image": hotel_images[4]},
    
    {"id": str(uuid.uuid4()), "name": "Oasis Spa Bangkok", "description": "Traditional Thai massage", "category": "spa", "sponsored": True, "image": spa_images[0]},
    {"id": str(uuid.uuid4()), "name": "Divana Virtue Spa", "description": "Holistic wellness", "category": "spa", "sponsored": False, "image": spa_images[1]},
    {"id": str(uuid.uuid4()), "name": "Asia Herb Association", "description": "Herbal therapy spa", "category": "spa", "sponsored": True, "image": spa_images[2]},
    {"id": str(uuid.uuid4()), "name": "Let's Relax Spa", "description": "Affordable luxury", "category": "spa", "sponsored": False, "image": spa_images[3]},
    {"id": str(uuid.uuid4()), "name": "CHI Spa", "description": "Asian healing traditions", "category": "spa", "sponsored": False, "image": spa_images[4]},
]

async def populate_data():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Clear existing data
    print("Clearing existing data...")
    await db.partners.delete_many({})
    await db.raffles.delete_many({})
    await db.users.delete_many({})
    
    # Insert partners
    print("Inserting partners...")
    for partner in partners:
        partner['createdAt'] = datetime.now(timezone.utc)
        await db.partners.insert_one(partner)
    
    # Create raffles
    print("Inserting raffles...")
    raffles = []
    for i, partner in enumerate(partners):
        raffle = {
            "id": str(uuid.uuid4()),
            "title": f"Win {partner['name']} Experience!",
            "description": f"Win an amazing {partner['description']} experience at {partner['name']}. Perfect for foodies and travelers!",
            "image": partner.get("image"),
            "category": partner["category"],
            "partnerId": partner["id"],
            "partnerName": partner["name"],
            "prizesAvailable": 3,
            "prizesRemaining": 3,
            "ticketCost": 10,
            "drawDate": datetime.now(timezone.utc) + timedelta(days=7 + i),
            "active": True,
            "totalEntries": 0,
            "createdAt": datetime.now(timezone.utc)
        }
        raffles.append(raffle)
    
    await db.raffles.insert_many(raffles)
    
    # Create admin user
    print("Creating admin user...")
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@winwai.com",
        "name": "WinWai Admin",
        "tickets": 1000,
        "role": "admin",
        "dailyStreak": 10,
        "lastLogin": datetime.now(timezone.utc),
        "createdAt": datetime.now(timezone.utc)
    }
    await db.users.insert_one(admin_user)
    
    print(f"\nMock data populated successfully!")
    print(f"- {len(partners)} partners")
    print(f"- {len(raffles)} raffles")
    print(f"- 1 admin user")
    print(f"\nAdmin credentials:")
    print(f"  Email: admin@winwai.com")
    print(f"  Role: admin")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_data())
