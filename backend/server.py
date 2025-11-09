from fastapi import FastAPI, APIRouter, HTTPException, Request, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os
import logging
import uuid
import random
import requests
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    tickets: int = Field(default=50)  # Starting bonus
    role: str = Field(default="user")  # user or admin
    dailyStreak: int = Field(default=0)
    lastLogin: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Partner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    logo: Optional[str] = None
    category: str  # food, hotel, spa
    sponsored: bool = Field(default=False)
    contactInfo: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Raffle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image: Optional[str] = None
    category: str  # food, hotel, spa
    partnerId: str
    partnerName: Optional[str] = None
    prizesAvailable: int
    prizesRemaining: int
    ticketCost: int = Field(default=10)
    drawDate: datetime
    active: bool = Field(default=True)
    totalEntries: int = Field(default=0)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Entry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    raffleId: str
    raffleTitle: Optional[str] = None
    ticketsUsed: int
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Reward(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    raffleId: str
    raffleTitle: str
    prizeDetails: str
    partnerName: str
    claimStatus: str = Field(default="unclaimed")  # unclaimed, pending, claimed
    contactInfo: Optional[str] = None
    wonAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    claimedAt: Optional[datetime] = None

class UserSession(BaseModel):
    userId: str
    sessionToken: str
    expiresAt: datetime
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdRewardRequest(BaseModel):
    userId: str
    rewardType: str
    rewardAmount: int
    transactionId: str
    timestamp: int

class RaffleEntryRequest(BaseModel):
    raffleId: str
    ticketsToUse: int = Field(default=10)

class ClaimRewardRequest(BaseModel):
    rewardId: str
    contactInfo: str

class DrawWinnerRequest(BaseModel):
    raffleId: str

# Authentication Helper
async def get_current_user(authorization: Optional[str] = Header(None), session_token: Optional[str] = None) -> Optional[User]:
    token = None
    if session_token:
        token = session_token
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    if not token:
        return None
    
    session = await db.user_sessions.find_one({"sessionToken": token})
    if not session or datetime.now(timezone.utc) > session["expiresAt"].replace(tzinfo=timezone.utc):
        return None
    
    user = await db.users.find_one({"id": session["userId"]})
    if not user:
        return None
    
    return User(**user)

# Auth Endpoints
@api_router.post("/auth/session")
async def process_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get session data
    try:
        response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        response.raise_for_status()
        session_data = response.json()
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid session: {str(e)}")
    
    # Check if user exists
    user = await db.users.find_one({"email": session_data["email"]})
    
    if not user:
        # Create new user
        new_user = User(
            email=session_data["email"],
            name=session_data.get("name", session_data["email"].split("@")[0]),
            picture=session_data.get("picture"),
            tickets=100,  # Welcome bonus
            lastLogin=datetime.now(timezone.utc)
        )
        await db.users.insert_one(new_user.dict())
        user = new_user.dict()
    else:
        # Update last login
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"lastLogin": datetime.now(timezone.utc)}}
        )
    
    # Create session
    session_token = session_data.get("session_token") or str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = UserSession(
        userId=user["id"],
        sessionToken=session_token,
        expiresAt=expires_at
    )
    
    await db.user_sessions.insert_one(user_session.dict())
    
    return {
        "user": User(**user).dict(),
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        await db.user_sessions.delete_one({"sessionToken": token})
    return {"message": "Logged out successfully"}

# Raffle Endpoints
@api_router.get("/raffles", response_model=List[Raffle])
async def get_raffles(category: Optional[str] = None, active: bool = True):
    query = {"active": active}
    if category:
        query["category"] = category
    
    raffles = await db.raffles.find(query).sort("drawDate", 1).to_list(100)
    return [Raffle(**raffle) for raffle in raffles]

@api_router.get("/raffles/{raffle_id}", response_model=Raffle)
async def get_raffle(raffle_id: str):
    raffle = await db.raffles.find_one({"id": raffle_id})
    if not raffle:
        raise HTTPException(status_code=404, detail="Raffle not found")
    return Raffle(**raffle)

@api_router.post("/raffles/enter")
async def enter_raffle(entry_request: RaffleEntryRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get raffle
    raffle = await db.raffles.find_one({"id": entry_request.raffleId})
    if not raffle:
        raise HTTPException(status_code=404, detail="Raffle not found")
    
    raffle_obj = Raffle(**raffle)
    
    if not raffle_obj.active:
        raise HTTPException(status_code=400, detail="Raffle is not active")
    
    if raffle_obj.prizesRemaining <= 0:
        raise HTTPException(status_code=400, detail="No prizes remaining")
    
    if user.tickets < entry_request.ticketsToUse:
        raise HTTPException(status_code=400, detail="Insufficient tickets")
    
    # Deduct tickets
    new_balance = user.tickets - entry_request.ticketsToUse
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"tickets": new_balance}}
    )
    
    # Create entry
    entry = Entry(
        userId=user.id,
        raffleId=entry_request.raffleId,
        raffleTitle=raffle_obj.title,
        ticketsUsed=entry_request.ticketsToUse
    )
    await db.entries.insert_one(entry.dict())
    
    # Update raffle entry count
    await db.raffles.update_one(
        {"id": entry_request.raffleId},
        {"$inc": {"totalEntries": 1}}
    )
    
    return {"message": "Entered successfully", "newBalance": new_balance, "entryId": entry.id}

@api_router.get("/raffles/categories/list")
async def get_categories():
    return {
        "categories": [
            {"id": "food", "name": "Food & Dining", "icon": "🍽️"},
            {"id": "hotel", "name": "Hotel Stays", "icon": "🏨"},
            {"id": "spa", "name": "Spa & Wellness", "icon": "💆"}
        ]
    }

# User Endpoints
@api_router.get("/users/me/tickets")
async def get_my_tickets(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"tickets": user.tickets}

@api_router.get("/users/me/entries")
async def get_my_entries(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    entries = await db.entries.find({"userId": user.id}).sort("timestamp", -1).to_list(100)
    return [Entry(**entry) for entry in entries]

# Rewards Endpoints
@api_router.post("/rewards/verify-ad")
async def verify_ad_reward(reward_request: AdRewardRequest):
    # Check for duplicate transaction
    existing = await db.ad_rewards.find_one({"transactionId": reward_request.transactionId})
    if existing:
        raise HTTPException(status_code=400, detail="Reward already claimed")
    
    # Verify timestamp is recent (within 5 minutes)
    current_timestamp = int(datetime.now().timestamp() * 1000)
    if abs(current_timestamp - reward_request.timestamp) > 300000:
        raise HTTPException(status_code=400, detail="Reward expired")
    
    # Award tickets (10 tickets per ad)
    tickets_to_award = 10
    
    result = await db.users.update_one(
        {"id": reward_request.userId},
        {"$inc": {"tickets": tickets_to_award}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Record the reward
    await db.ad_rewards.insert_one({
        "userId": reward_request.userId,
        "transactionId": reward_request.transactionId,
        "tickets": tickets_to_award,
        "timestamp": datetime.now(timezone.utc)
    })
    
    # Get new balance
    user = await db.users.find_one({"id": reward_request.userId})
    
    return {
        "success": True,
        "ticketsAwarded": tickets_to_award,
        "newBalance": user["tickets"] if user else 0
    }

@api_router.get("/rewards/my-rewards")
async def get_my_rewards(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    rewards = await db.rewards.find({"userId": user.id}).sort("wonAt", -1).to_list(100)
    return [Reward(**reward) for reward in rewards]

@api_router.post("/rewards/claim")
async def claim_reward(claim_request: ClaimRewardRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    reward = await db.rewards.find_one({"id": claim_request.rewardId, "userId": user.id})
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    await db.rewards.update_one(
        {"id": claim_request.rewardId},
        {"$set": {
            "claimStatus": "pending",
            "contactInfo": claim_request.contactInfo
        }}
    )
    
    return {"message": "Claim submitted successfully"}

# Admin Endpoints
@api_router.post("/admin/draw-winner")
async def draw_winner(draw_request: DrawWinnerRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get raffle
    raffle = await db.raffles.find_one({"id": draw_request.raffleId})
    if not raffle:
        raise HTTPException(status_code=404, detail="Raffle not found")
    
    # Get all entries
    entries = await db.entries.find({"raffleId": draw_request.raffleId}).to_list(10000)
    if not entries:
        raise HTTPException(status_code=400, detail="No entries for this raffle")
    
    # Randomly select winner(s)
    prizes_to_award = min(raffle["prizesRemaining"], len(entries))
    winners = random.sample(entries, prizes_to_award)
    
    # Create rewards
    rewards_created = []
    for winner_entry in winners:
        reward = Reward(
            userId=winner_entry["userId"],
            raffleId=draw_request.raffleId,
            raffleTitle=raffle["title"],
            prizeDetails=raffle["description"],
            partnerName=raffle.get("partnerName", "WinWai")
        )
        await db.rewards.insert_one(reward.dict())
        rewards_created.append(reward.id)
    
    # Update raffle
    await db.raffles.update_one(
        {"id": draw_request.raffleId},
        {"$set": {
            "prizesRemaining": raffle["prizesRemaining"] - prizes_to_award,
            "active": raffle["prizesRemaining"] - prizes_to_award <= 0
        }}
    )
    
    return {
        "message": f"Drew {prizes_to_award} winner(s)",
        "winners": [w["userId"] for w in winners],
        "rewardsCreated": rewards_created
    }

@api_router.get("/admin/users")
async def get_all_users(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find().to_list(1000)
    return [User(**u) for u in users]

@api_router.post("/admin/raffles")
async def create_raffle(raffle: Raffle, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    raffle.prizesRemaining = raffle.prizesAvailable
    await db.raffles.insert_one(raffle.dict())
    return raffle

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
