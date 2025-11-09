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
    {"id": str(uuid.uuid4()), "name": "The Deck Bangkok", "description": "Riverside fine dining", "category": "food", "sponsored": True, "image": food_images[0], "location": "bangkok", "address": "Arun Residence, Maharat Road, Bangkok"},
    {"id": str(uuid.uuid4()), "name": "Blue Elephant", "description": "Royal Thai cuisine", "category": "food", "sponsored": False, "image": food_images[1], "location": "bangkok", "address": "233 South Sathorn Road, Bangkok"},
    {"id": str(uuid.uuid4()), "name": "Gaggan Anand", "description": "Progressive Indian", "category": "food", "sponsored": True, "image": food_images[2], "location": "bangkok", "address": "68/1 Soi Langsuan, Bangkok"},
    {"id": str(uuid.uuid4()), "name": "Khao Soi House", "description": "Northern Thai specialties", "category": "food", "sponsored": False, "image": food_images[3], "location": "chiang-mai", "address": "Old City, Chiang Mai"},
    {"id": str(uuid.uuid4()), "name": "Patong Seafood", "description": "Fresh beach dining", "category": "food", "sponsored": False, "image": food_images[4], "location": "phuket", "address": "Patong Beach Road, Phuket"},
    
    {"id": str(uuid.uuid4()), "name": "Mandarin Oriental", "description": "Luxury riverside hotel", "category": "hotel", "sponsored": True, "image": hotel_images[0], "location": "bangkok", "address": "48 Oriental Avenue, Bangkok"},
    {"id": str(uuid.uuid4()), "name": "137 Pillars House", "description": "Colonial-style boutique hotel", "category": "hotel", "sponsored": False, "image": hotel_images[1], "location": "chiang-mai", "address": "2 Soi 1 Nawatgate Road, Chiang Mai"},
    {"id": str(uuid.uuid4()), "name": "The Naka Island", "description": "Private island resort", "category": "hotel", "sponsored": True, "image": hotel_images[2], "location": "phuket", "address": "32 Moo 5 Tambol Paklok, Phuket"},
    {"id": str(uuid.uuid4()), "name": "Hilton Pattaya", "description": "Beachfront luxury tower", "category": "hotel", "sponsored": False, "image": hotel_images[3], "location": "pattaya", "address": "333/101 Moo 9, Pattaya"},
    {"id": str(uuid.uuid4()), "name": "Rayavadee Resort", "description": "Secluded beach paradise", "category": "hotel", "sponsored": False, "image": hotel_images[4], "location": "krabi", "address": "214 Moo 2 Tambon Ao-Nang, Krabi"},
    
    {"id": str(uuid.uuid4()), "name": "Oasis Spa Bangkok", "description": "Traditional Thai massage", "category": "spa", "sponsored": True, "image": spa_images[0], "location": "bangkok", "address": "88 Soi Sukhumvit 31, Bangkok"},
    {"id": str(uuid.uuid4()), "name": "Oasis Spa Chiang Mai", "description": "Lanna-style wellness", "category": "spa", "sponsored": False, "image": spa_images[1], "location": "chiang-mai", "address": "4 Samlan Road Soi 6, Chiang Mai"},
    {"id": str(uuid.uuid4()), "name": "Let's Relax Phuket", "description": "Beachside spa treatments", "category": "spa", "sponsored": True, "image": spa_images[2], "location": "phuket", "address": "Patong Beach, Phuket"},
    {"id": str(uuid.uuid4()), "name": "The Pattaya Spa", "description": "Ocean view wellness", "category": "spa", "sponsored": False, "image": spa_images[3], "location": "pattaya", "address": "Beach Road, Pattaya"},
    {"id": str(uuid.uuid4()), "name": "Krabi Spa Village", "description": "Nature-inspired healing", "category": "spa", "sponsored": False, "image": spa_images[4], "location": "krabi", "address": "Ao Nang Beach, Krabi"},
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
            "description": f"Win an amazing {partner['description']} experience at {partner['name']}. Located at {partner.get('address', 'Thailand')}. Perfect for foodies and travelers!",
            "image": partner.get("image"),
            "category": partner["category"],
            "partnerId": partner["id"],
            "partnerName": partner["name"],
            "location": partner.get("location", "bangkok"),
            "address": partner.get("address", ""),
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
    
    # Create admin users
    print("Creating admin users...")
    admin_users = [
        {
            "id": str(uuid.uuid4()),
            "email": "artteabnc@gmail.com",
            "name": "Art Tea Admin",
            "password": "winwanadmin",  # In production, this should be hashed
            "tickets": 1000,
            "role": "admin",
            "dailyStreak": 10,
            "lastLogin": datetime.now(timezone.utc),
            "createdAt": datetime.now(timezone.utc),
            "permissions": ["manage_raffles", "draw_winners", "manage_users", "view_analytics", "manage_partners"]
        },
        {
            "id": str(uuid.uuid4()),
            "email": "netcorez13@gmail.com",
            "name": "Netcore Admin",
            "password": "winwanadmin",
            "tickets": 1000,
            "role": "admin",
            "dailyStreak": 10,
            "lastLogin": datetime.now(timezone.utc),
            "createdAt": datetime.now(timezone.utc),
            "permissions": ["manage_raffles", "draw_winners", "manage_users", "view_analytics", "manage_partners"]
        },
        {
            "id": str(uuid.uuid4()),
            "email": "arkadyaproperties@gmail.com",
            "name": "Arkadya Admin",
            "password": "winwanadmin",
            "tickets": 1000,
            "role": "admin",
            "dailyStreak": 10,
            "lastLogin": datetime.now(timezone.utc),
            "createdAt": datetime.now(timezone.utc),
            "permissions": ["manage_raffles", "draw_winners", "manage_users", "view_analytics", "manage_partners"]
        }
    ]
    
    for admin in admin_users:
        await db.users.insert_one(admin)
    
    print(f"\n✅ Mock data populated successfully!")
    print(f"- {len(partners)} partners with real addresses")
    print(f"- {len(raffles)} raffles across 5 Thai cities")
    print(f"- {len(admin_users)} admin users")
    print(f"\n👥 Admin Credentials:")
    print(f"  1. artteabnc@gmail.com")
    print(f"  2. netcorez13@gmail.com")
    print(f"  3. arkadyaproperties@gmail.com")
    print(f"  Password: winwanadmin (for all)")
    print(f"\n🔐 Admin Permissions:")
    print(f"  - Manage Raffles")
    print(f"  - Draw Winners")
    print(f"  - Manage Users")
    print(f"  - View Analytics")
    print(f"  - Manage Partners")
    print(f"\n📍 Locations:")
    print(f"  - Bangkok: 3 raffles")
    print(f"  - Chiang Mai: 3 raffles")
    print(f"  - Phuket: 3 raffles")
    print(f"  - Pattaya: 3 raffles")
    print(f"  - Krabi: 3 raffles")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_data())
