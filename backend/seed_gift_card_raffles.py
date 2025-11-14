"""
Seed script to create mock raffles with gift cards
Run with: python seed_gift_card_raffles.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_gift_card_raffles():
    """Create mock raffles with popular gift cards in Thailand"""
    
    # First, get or create a generic partner for gift cards
    partner = await db.partners.find_one({"name": "Gift Card Store"})
    
    if not partner:
        partner_id = str(uuid.uuid4())
        partner = {
            "id": partner_id,
            "name": "Gift Card Store",
            "description": "Your one-stop shop for digital gift cards",
            "category": "shopping",
            "location": "online",
            "sponsored": False,
            "featured": False,
            "createdAt": datetime.now(timezone.utc)
        }
        await db.partners.insert_one(partner)
        print(f"✅ Created Gift Card Store partner")
    else:
        partner_id = partner['id']
    
    # Define gift card raffles
    gift_card_raffles = [
        {
            "title": "Netflix Premium 3-Month Subscription",
            "description": "Win 3 months of Netflix Premium! Enjoy unlimited streaming of movies, TV shows, and original content. Perfect for your entertainment needs.",
            "category": "entertainment",
            "image": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80",
            "prizesAvailable": 10,
            "ticketCost": 5,
            "prizeValue": 900,  # ~฿300/month
            "gamePrice": 50,
        },
        {
            "title": "True Money Wallet ฿500",
            "description": "Win ฿500 True Money e-Wallet credit! Use for mobile top-ups, bill payments, online shopping, and more. Instant digital delivery.",
            "category": "shopping",
            "image": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80",
            "prizesAvailable": 20,
            "ticketCost": 3,
            "prizeValue": 500,
            "gamePrice": 30,
        },
        {
            "title": "Lazada Voucher ฿1,000",
            "description": "Shop till you drop with a ฿1,000 Lazada voucher! Thailand's #1 online shopping platform. Get anything from fashion to electronics.",
            "category": "shopping",
            "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
            "prizesAvailable": 15,
            "ticketCost": 8,
            "prizeValue": 1000,
            "gamePrice": 80,
        },
        {
            "title": "Shopee Coins 2,000 Points",
            "description": "Boost your Shopee shopping with 2,000 coins! Use for discounts on millions of products. Instant credit to your Shopee account.",
            "category": "shopping",
            "image": "https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80",
            "prizesAvailable": 25,
            "ticketCost": 4,
            "prizeValue": 400,
            "gamePrice": 40,
        },
        {
            "title": "AIS Mobile Top-Up ฿300",
            "description": "Win ฿300 AIS mobile credit! Keep connected with Thailand's leading mobile network. Perfect for calls, data, and more.",
            "category": "shopping",
            "image": "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80",
            "prizesAvailable": 30,
            "ticketCost": 2,
            "prizeValue": 300,
            "gamePrice": 20,
        },
        {
            "title": "Spotify Premium 6-Month Subscription",
            "description": "Music lover? Win 6 months of Spotify Premium! Enjoy ad-free music, offline listening, and unlimited skips.",
            "category": "entertainment",
            "image": "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&q=80",
            "prizesAvailable": 12,
            "ticketCost": 6,
            "prizeValue": 600,  # ~฿100/month
            "gamePrice": 60,
        },
        {
            "title": "Grab Food Voucher ฿500",
            "description": "Satisfy your cravings! Win a ฿500 Grab Food voucher. Order from thousands of restaurants across Thailand.",
            "category": "food",
            "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
            "prizesAvailable": 20,
            "ticketCost": 5,
            "prizeValue": 500,
            "gamePrice": 50,
        },
        {
            "title": "dtac Happy Mobile Credit ฿200",
            "description": "Stay connected with ฿200 dtac mobile credit! Use for calls, SMS, or mobile internet packages.",
            "category": "shopping",
            "image": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
            "prizesAvailable": 30,
            "ticketCost": 2,
            "prizeValue": 200,
            "gamePrice": 20,
        },
        {
            "title": "LINE Man Voucher ฿400",
            "description": "Get ฿400 LINE Man credit for food delivery, grocery shopping, or courier services. Fast and convenient!",
            "category": "food",
            "image": "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80",
            "prizesAvailable": 18,
            "ticketCost": 4,
            "prizeValue": 400,
            "gamePrice": 40,
        },
        {
            "title": "Google Play Gift Card ฿500",
            "description": "Unlock premium apps, games, movies & more! Win a ฿500 Google Play gift card. Works on all Android devices.",
            "category": "entertainment",
            "image": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
            "prizesAvailable": 15,
            "ticketCost": 5,
            "prizeValue": 500,
            "gamePrice": 50,
        },
        {
            "title": "Central Online Voucher ฿800",
            "description": "Shop at Central Department Store online with an ฿800 voucher! Fashion, beauty, home & lifestyle products.",
            "category": "shopping",
            "image": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
            "prizesAvailable": 12,
            "ticketCost": 7,
            "prizeValue": 800,
            "gamePrice": 70,
        },
        {
            "title": "Steam Wallet Code ฿500",
            "description": "Gamers rejoice! Win a ฿500 Steam Wallet code. Buy the latest games, DLC, and in-game items.",
            "category": "entertainment",
            "image": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
            "prizesAvailable": 10,
            "ticketCost": 5,
            "prizeValue": 500,
            "gamePrice": 50,
        },
    ]
    
    # Insert raffles
    for raffle_data in gift_card_raffles:
        raffle_id = str(uuid.uuid4())
        draw_date = datetime.now(timezone.utc) + timedelta(days=7)  # Draw in 7 days
        
        raffle = {
            "id": raffle_id,
            "title": raffle_data["title"],
            "description": raffle_data["description"],
            "image": raffle_data.get("image"),
            "category": raffle_data["category"],
            "partnerId": partner_id,
            "partnerName": "Gift Card Store",
            "location": "online",
            "prizesAvailable": raffle_data["prizesAvailable"],
            "prizesRemaining": raffle_data["prizesAvailable"],
            "ticketCost": raffle_data["ticketCost"],
            "prizeValue": raffle_data["prizeValue"],
            "gamePrice": raffle_data["gamePrice"],
            "drawDate": draw_date,
            "validityMonths": 3,
            "active": True,
            "totalEntries": 0,
            "language": "en",
            "allowedCountries": ["TH"],  # Thailand only by default
            "createdAt": datetime.now(timezone.utc)
        }
        
        # Check if raffle already exists
        existing = await db.raffles.find_one({"title": raffle["title"]})
        if not existing:
            await db.raffles.insert_one(raffle)
            print(f"✅ Created raffle: {raffle['title']}")
        else:
            print(f"⏭️  Raffle already exists: {raffle['title']}")
    
    print(f"\n🎉 Gift card raffles seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_gift_card_raffles())
