import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "winwai")

async def seed_raffles():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Clear existing raffles
    await db.raffles.delete_many({})
    await db.partners.delete_many({})
    
    # Create mock partners
    partners = [
        {
            "id": "partner-1",
            "name": "Central Department Store",
            "description": "Leading retail chain in Thailand",
            "logoUrl": "https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/central_logo.png",
            "category": "Shopping",
            "isActive": True,
            "createdAt": datetime.now(timezone.utc)
        },
        {
            "id": "partner-2",
            "name": "Siam Paragon",
            "description": "Premium shopping center",
            "logoUrl": "https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/siam_logo.png",
            "category": "Shopping",
            "isActive": True,
            "createdAt": datetime.now(timezone.utc)
        },
        {
            "id": "partner-3",
            "name": "Grab Thailand",
            "description": "Ride-hailing and delivery service",
            "logoUrl": "https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/grab_logo.png",
            "category": "Transport",
            "isActive": True,
            "createdAt": datetime.now(timezone.utc)
        }
    ]
    
    await db.partners.insert_many(partners)
    print(f"✅ Created {len(partners)} partners")
    
    # Create mock raffles
    now = datetime.now(timezone.utc)
    raffles = [
        {
            "id": "raffle-1",
            "title": "500 THB Central Gift Card",
            "description": "Win a 500 THB gift card to use at any Central Department Store location in Thailand!",
            "partnerId": "partner-1",
            "prizeValue": 500,
            "ticketCost": 10,
            "prizesAvailable": 10,
            "prizesRemaining": 6,
            "totalEntries": 45,
            "active": True,
            "drawDate": (now + timedelta(days=3)),
            "image": "https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/gift_card.png",
            "category": "Shopping",
            "location": "Bangkok",
            "createdAt": now
        },
        {
            "id": "raffle-2",
            "title": "1000 THB Siam Paragon Voucher",
            "description": "Exclusive voucher for Siam Paragon - one of Bangkok's premier shopping destinations!",
            "partnerId": "partner-2",
            "prizeValue": 1000,
            "ticketCost": 20,
            "maxEntries": 50,
            "currentEntries": 23,
            "active": True,
            "drawDate": (now + timedelta(days=5)).isoformat(),
            "imageUrl": "https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/voucher.png",
            "category": "Shopping",
            "location": "Bangkok",
            "createdAt": now,
            "updatedAt": now
        },
        {
            "id": "raffle-3",
            "title": "200 THB Grab Credit",
            "description": "Free ride credits for Grab - perfect for your daily commute or weekend trips!",
            "partnerId": "partner-3",
            "prizeValue": 200,
            "ticketCost": 5,
            "maxEntries": 200,
            "currentEntries": 156,
            "active": True,
            "drawDate": (now + timedelta(days=2)).isoformat(),
            "imageUrl": "https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/grab_credit.png",
            "category": "Transport",
            "location": "Bangkok",
            "createdAt": now,
            "updatedAt": now
        },
        {
            "id": "raffle-4",
            "title": "300 THB Central Food Hall Voucher",
            "description": "Enjoy delicious food at Central Food Hall with this special voucher!",
            "partnerId": "partner-1",
            "prizeValue": 300,
            "ticketCost": 8,
            "maxEntries": 150,
            "currentEntries": 87,
            "active": True,
            "drawDate": (now + timedelta(days=4)).isoformat(),
            "imageUrl": "https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/food_voucher.png",
            "category": "Food",
            "location": "Bangkok",
            "createdAt": now,
            "updatedAt": now
        },
        {
            "id": "raffle-5",
            "title": "2000 THB Siam Shopping Spree",
            "description": "Grand prize! Shop till you drop at Siam Paragon with this mega voucher!",
            "partnerId": "partner-2",
            "prizeValue": 2000,
            "ticketCost": 50,
            "maxEntries": 30,
            "currentEntries": 12,
            "active": True,
            "drawDate": (now + timedelta(days=7)).isoformat(),
            "imageUrl": "https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/mega_voucher.png",
            "category": "Shopping",
            "location": "Bangkok",
            "createdAt": now,
            "updatedAt": now
        }
    ]
    
    await db.raffles.insert_many(raffles)
    print(f"✅ Created {len(raffles)} raffles")
    
    client.close()
    print("\n🎉 Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_raffles())
