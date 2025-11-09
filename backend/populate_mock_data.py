import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta, timezone
import uuid
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

# Mock data
partners = [
    {"id": str(uuid.uuid4()), "name": "The Deck Bangkok", "description": "Riverside fine dining", "category": "food", "sponsored": True},
    {"id": str(uuid.uuid4()), "name": "Blue Elephant", "description": "Royal Thai cuisine", "category": "food", "sponsored": False},
    {"id": str(uuid.uuid4()), "name": "Gaggan Anand", "description": "Progressive Indian", "category": "food", "sponsored": True},
    {"id": str(uuid.uuid4()), "name": "Sra Bua", "description": "Modern Thai cuisine", "category": "food", "sponsored": False},
    {"id": str(uuid.uuid4()), "name": "Le Du", "description": "Contemporary Thai", "category": "food", "sponsored": False},
    
    {"id": str(uuid.uuid4()), "name": "Mandarin Oriental", "description": "Luxury riverside hotel", "category": "hotel", "sponsored": True},
    {"id": str(uuid.uuid4()), "name": "Chiang Mai Resort", "description": "Mountain retreat", "category": "hotel", "sponsored": False},
    {"id": str(uuid.uuid4()), "name": "Phuket Beach Villa", "description": "Beachfront paradise", "category": "hotel", "sponsored": True},
    {"id": str(uuid.uuid4()), "name": "Bangkok Boutique", "description": "City center comfort", "category": "hotel", "sponsored": False},
    {"id": str(uuid.uuid4()), "name": "Krabi Cliff Resort", "description": "Cliffside views", "category": "hotel", "sponsored": False},
    
    {"id": str(uuid.uuid4()), "name": "Oasis Spa Bangkok", "description": "Traditional Thai massage", "category": "spa", "sponsored": True},
    {"id": str(uuid.uuid4()), "name": "Divana Virtue Spa", "description": "Holistic wellness", "category": "spa", "sponsored": False},
    {"id": str(uuid.uuid4()), "name": "Asia Herb Association", "description": "Herbal therapy spa", "category": "spa", "sponsored": True},
    {"id": str(uuid.uuid4()), "name": "Let's Relax Spa", "description": "Affordable luxury", "category": "spa", "sponsored": False},
    {"id": str(uuid.uuid4()), "name": "CHI Spa", "description": "Asian healing traditions", "category": "spa", "sponsored": False},
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
