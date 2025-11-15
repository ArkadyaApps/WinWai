from fastapi import FastAPI, APIRouter, HTTPException, Request, Header, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os
import logging
import uuid
import random
import string
import requests
import hashlib
import secrets
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Currency conversion rates to USD (approximate rates)
CURRENCY_RATES = {
    'USD': 1.0,
    'THB': 0.028,      # Thai Baht
    'EUR': 1.09,       # Euro
    'GBP': 1.27,       # British Pound
    'MAD': 0.10,       # Moroccan Dirham
    'JPY': 0.0067,     # Japanese Yen
    'CNY': 0.14,       # Chinese Yuan
    'INR': 0.012,      # Indian Rupee
    'SGD': 0.74,       # Singapore Dollar
    'MYR': 0.22,       # Malaysian Ringgit
    'VND': 0.000039,   # Vietnamese Dong
}

def convert_to_usd(amount: float, from_currency: str) -> float:
    """Convert amount from given currency to USD"""
    if from_currency not in CURRENCY_RATES:
        # Default to THB if currency not found
        return amount * CURRENCY_RATES['THB']
    return amount * CURRENCY_RATES[from_currency]

def calculate_minimum_draw_date(prize_value_usd: float, created_at: datetime) -> datetime:
    """Calculate minimum draw date based on prize value tier"""
    if prize_value_usd <= 15:
        # 1-15 USD: next day
        return created_at + timedelta(days=1)
    elif prize_value_usd <= 25:
        # 16-25 USD: 3 days
        return created_at + timedelta(days=3)
    else:
        # 26+ USD: 1 week
        return created_at + timedelta(days=7)

def get_extension_period(prize_value_usd: float) -> timedelta:
    """Get extension period based on prize value tier"""
    if prize_value_usd <= 15:
        return timedelta(days=1)
    elif prize_value_usd <= 25:
        return timedelta(days=3)
    else:
        return timedelta(days=7)

def generate_voucher_reference() -> str:
    """Generate unique voucher reference like #WW-2024-12345"""
    year = datetime.now().year
    # Random 5-digit number
    random_num = random.randint(10000, 99999)
    return f"WW-{year}-{random_num}"

def generate_verification_code(length: int = 8) -> str:
    """Generate random verification code for physical prizes"""
    # Mix of uppercase letters and numbers
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

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
    phone: Optional[str] = None
    password_hash: Optional[str] = None  # For email/password auth
    tickets: int = Field(default=50)  # Starting bonus
    role: str = Field(default="user")  # user or admin
    dailyStreak: int = Field(default=0)
    lastLogin: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resetToken: Optional[str] = None  # For password reset
    resetTokenExpiry: Optional[datetime] = None

class Partner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    logo: Optional[str] = None
    photo: Optional[str] = None  # Main photo/image of the business
    category: str  # food, hotel, spa
    sponsored: bool = Field(default=False)
    contactInfo: Optional[str] = None
    # Contact details
    email: Optional[str] = None
    whatsapp: Optional[str] = None  # WhatsApp number
    line: Optional[str] = None  # LINE ID
    # Location details
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Raffle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image: Optional[str] = None
    category: str  # food, hotel, spa, shopping, entertainment
    partnerId: str
    partnerName: Optional[str] = None
    location: Optional[str] = None  # bangkok, chiang-mai, phuket, online, etc
    address: Optional[str] = None
    prizesAvailable: int
    prizesRemaining: int
    ticketCost: int = Field(default=10)  # Tickets required to enter
    prizeValue: float = Field(default=0.0)  # Total value of prize in local currency (shown publicly)
    prizeValueUSD: float = Field(default=0.0)  # Prize value converted to USD (for raffle drawer)
    currency: str = Field(default='THB')  # Currency code: THB, USD, EUR, MAD, etc
    gamePrice: float = Field(default=0.0)  # Minimum total tickets needed to trigger draw
    drawDate: datetime  # Initial planned draw date
    minimumDrawDate: Optional[datetime] = None  # Earliest possible draw date (based on value tier)
    lastExtensionDate: Optional[datetime] = None  # Last time draw was extended
    validityMonths: int = Field(default=3)  # Prize validity in months (default 3)
    active: bool = Field(default=True)
    totalEntries: int = Field(default=0)
    totalTicketsCollected: int = Field(default=0)  # Total tickets spent on entries
    drawStatus: str = Field(default='pending')  # pending, eligible, drawn, cancelled
    isDigitalPrize: bool = Field(default=False)  # True for gift cards, recharge, streaming, etc
    secretCodes: List[str] = Field(default_factory=list)  # Secret codes for digital prizes (admin uploaded)
    usedSecretCodes: List[str] = Field(default_factory=list)  # Track which codes have been assigned
    language: str = Field(default='en')  # Content language: en, th, fr, ar
    allowedCountries: List[str] = Field(default_factory=lambda: ['TH'])  # Country codes allowed to play (default: Thailand only)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    drawnAt: Optional[datetime] = None  # When the draw was performed

class Voucher(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    voucherRef: str  # Unique reference like #WW-2024-001
    userId: str
    userName: str
    userEmail: str
    raffleId: str
    raffleTitle: str
    partnerId: str
    partnerName: str
    prizeValue: float
    currency: str
    isDigitalPrize: bool
    secretCode: Optional[str] = None  # For digital prizes (Netflix code, PIN, etc)
    verificationCode: str  # Random code for physical prizes or backup verification
    status: str = Field(default='active')  # active, redeemed, expired, cancelled
    validUntil: datetime  # Expiry date
    redeemedAt: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Partner contact info for redemption
    partnerEmail: Optional[str] = None
    partnerWhatsapp: Optional[str] = None
    partnerLine: Optional[str] = None
    partnerAddress: Optional[str] = None

class Winner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    raffleId: str
    entryId: str  # Which entry won
    voucherId: str  # Reference to voucher
    drawDate: datetime
    notified: bool = Field(default=False)
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

# Email/Password Auth Models
class EmailSignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    referralCode: Optional[str] = None

class EmailSignInRequest(BaseModel):
    email: EmailStr
    password: str

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    resetToken: str
    newPassword: str

# Password Helper Functions
def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == password_hash

def generate_reset_token() -> str:
    """Generate secure reset token"""
    return secrets.token_urlsafe(32)

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
@api_router.get("/auth/google/callback")
async def google_callback(code: str = None, error: str = None):
    """OAuth callback endpoint - redirects back to app with code"""
    from fastapi.responses import RedirectResponse
    
    if error:
        # Redirect back to app with error
        return RedirectResponse(url=f"com.winwai.raffle://oauth2redirect?error={error}")
    
    if code:
        # Redirect back to app with code - this is what WebBrowser expects
        return RedirectResponse(url=f"com.winwai.raffle://oauth2redirect?code={code}")
    
    return RedirectResponse(url="com.winwai.raffle://oauth2redirect?error=no_code")

@api_router.post("/auth/google/exchange")
async def google_exchange_code(request: Request):
    """Exchange authorization code for user info"""
    body = await request.json()
    code = body.get("code")
    
    if not code:
        raise HTTPException(status_code=400, detail="code required")
    
    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    if not client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not configured")
    if not client_secret:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_SECRET not configured")
    
    token_data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": "https://winwai.up.railway.app/auth/google/callback",
        "grant_type": "authorization_code"
    }
    
    try:
        # Get access token
        token_response = requests.post(token_url, data=token_data, timeout=10)
        token_response.raise_for_status()
        tokens = token_response.json()
        
        access_token = tokens.get("access_token")
        id_token = tokens.get("id_token")
        
        if not id_token:
            raise HTTPException(status_code=401, detail="No ID token received")
        
        # Verify ID token
        verify_response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}",
            timeout=10
        )
        verify_response.raise_for_status()
        token_info = verify_response.json()
        
        email = token_info.get("email")
        name = token_info.get("name", email.split("@")[0] if email else "User")
        picture = token_info.get("picture")
        
        if not email:
            raise HTTPException(status_code=401, detail="Email not found in token")
            
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to exchange code: {e}")
        raise HTTPException(status_code=401, detail=f"Failed to exchange code: {str(e)}")
    
    # Check if user exists
    user = await db.users.find_one({"email": email})
    
    if not user:
        # Create new user
        admin_emails = ["artteabnc@gmail.com", "netcorez13@gmail.com", "arkadyaproperties@gmail.com"]
        user_role = "admin" if email.lower() in admin_emails else "user"
        
        new_user = User(
            email=email,
            name=name,
            picture=picture,
            tickets=100,
            role=user_role,
            lastLogin=datetime.now(timezone.utc)
        )
        await db.users.insert_one(new_user.dict())
        user = new_user.dict()
        logging.info(f"Created new user: {email} with role: {user_role}")
    else:
        # Update last login
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"lastLogin": datetime.now(timezone.utc)}}
        )
        logging.info(f"User logged in: {email}")
    
    # Create session
    session_token = str(uuid.uuid4())
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

@api_router.post("/auth/google")
async def google_signin(request: Request):
    """Native Google OAuth sign-in - verifies ID token directly"""
    try:
        body = await request.json()
        id_token = body.get("id_token")
        
        if not id_token:
            logging.error("No id_token provided in request")
            raise HTTPException(status_code=400, detail="id_token required")
        
        logging.info(f"Verifying Google ID token (length: {len(id_token)})")
        
        # Verify Google ID token by calling Google's tokeninfo endpoint
        try:
            response = requests.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}",
                timeout=10
            )
            response.raise_for_status()
            token_info = response.json()
            
            logging.info(f"Token verification response: {token_info.keys()}")
            
            # Verify the token is valid
            if "error" in token_info:
                logging.error(f"Google returned error: {token_info.get('error')}")
                raise HTTPException(status_code=401, detail="Invalid Google ID token")
            
            # Extract user info from token
            email = token_info.get("email")
            name = token_info.get("name", email.split("@")[0] if email else "User")
            picture = token_info.get("picture")
            
            if not email:
                logging.error("No email in token_info")
                raise HTTPException(status_code=401, detail="Email not found in token")
            
            logging.info(f"Successfully verified token for: {email}")
                
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to verify Google token: {e}")
            raise HTTPException(status_code=401, detail=f"Failed to verify Google token: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Unexpected error in google_signin: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    # Check if user exists
    user = await db.users.find_one({"email": email})
    
    if not user:
        # Create new user
        # Check if email should be admin
        admin_emails = ["artteabnc@gmail.com", "netcorez13@gmail.com", "arkadyaproperties@gmail.com"]
        user_role = "admin" if email.lower() in admin_emails else "user"
        
        new_user = User(
            email=email,
            name=name,
            picture=picture,
            tickets=100,  # Welcome bonus
            role=user_role,
            lastLogin=datetime.now(timezone.utc)
        )
        await db.users.insert_one(new_user.dict())
        user = new_user.dict()
        logging.info(f"Created new user: {email} with role: {user_role}")
    else:
        # Update last login
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"lastLogin": datetime.now(timezone.utc)}}
        )
        logging.info(f"User logged in: {email}")
        
        # Remove MongoDB internal fields that might cause issues
        user.pop("_id", None)
    
    # Create session
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = UserSession(
        userId=user["id"],
        sessionToken=session_token,
        expiresAt=expires_at
    )
    
    await db.user_sessions.insert_one(user_session.dict())
    
    # Return user data directly without re-validation for existing users
    return {
        "user": user if isinstance(user, dict) and "id" in user else User(**user).dict(),
        "session_token": session_token
    }

@api_router.post("/auth/session")
async def process_session(request: Request):
    """Legacy Emergent Auth endpoint - kept for backwards compatibility"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get session data
    auth_api_url = os.getenv('AUTH_API_URL', 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data')
    try:
        response = requests.get(
            auth_api_url,
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
        # Check if email should be admin
        admin_emails = ["artteabnc@gmail.com", "netcorez13@gmail.com", "arkadyaproperties@gmail.com"]
        user_role = "admin" if session_data["email"].lower() in admin_emails else "user"
        
        new_user = User(
            email=session_data["email"],
            name=session_data.get("name", session_data["email"].split("@")[0]),
            picture=session_data.get("picture"),
            tickets=100,  # Welcome bonus
            role=user_role,
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

# Email/Password Auth Endpoints
@api_router.post("/auth/email/signup")
async def email_signup(signup_request: EmailSignUpRequest):
    """Sign up with email and password"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": signup_request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password strength
    if len(signup_request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Create new user
    password_hash = hash_password(signup_request.password)
    welcome_tickets = 100  # Base welcome bonus
    
    # Process referral code if provided
    referrer_id = None
    if signup_request.referralCode:
        # Find referrer by referral code (first 8 chars of user ID)
        referrer = await db.users.find_one({"id": {"$regex": f"^{signup_request.referralCode.lower()}"}})
        if referrer:
            referrer_id = referrer["id"]
            welcome_tickets += 1  # Bonus ticket for being referred
    
    # Check if email should be admin
    admin_emails = ["artteabnc@gmail.com", "netcorez13@gmail.com", "arkadyaproperties@gmail.com"]
    user_role = "admin" if signup_request.email.lower() in admin_emails else "user"
    
    new_user = User(
        email=signup_request.email,
        name=signup_request.name,
        password_hash=password_hash,
        tickets=welcome_tickets,
        role=user_role,
        lastLogin=datetime.now(timezone.utc)
    )
    
    await db.users.insert_one(new_user.dict())
    
    # Give referrer their bonus ticket
    if referrer_id:
        await db.users.update_one(
            {"id": referrer_id},
            {"$inc": {"tickets": 1}}
        )
    
    # Create session
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = UserSession(
        userId=new_user.id,
        sessionToken=session_token,
        expiresAt=expires_at
    )
    
    await db.user_sessions.insert_one(user_session.dict())
    
    # Return user without password_hash
    user_dict = new_user.dict()
    user_dict.pop('password_hash', None)
    user_dict.pop('resetToken', None)
    user_dict.pop('resetTokenExpiry', None)
    
    return {
        "user": user_dict,
        "session_token": session_token
    }

@api_router.post("/auth/email/signin")
async def email_signin(signin_request: EmailSignInRequest):
    """Sign in with email and password"""
    # Find user
    user = await db.users.find_one({"email": signin_request.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user has password (might be OAuth-only user)
    if not user.get('password_hash'):
        raise HTTPException(status_code=401, detail="Please sign in with Google")
    
    # Verify password
    if not verify_password(signin_request.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"lastLogin": datetime.now(timezone.utc)}}
    )
    
    # Create session
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = UserSession(
        userId=user["id"],
        sessionToken=session_token,
        expiresAt=expires_at
    )
    
    await db.user_sessions.insert_one(user_session.dict())
    
    # Return user without sensitive fields
    user_dict = dict(user)
    user_dict.pop('password_hash', None)
    user_dict.pop('resetToken', None)
    user_dict.pop('resetTokenExpiry', None)
    user_dict.pop('_id', None)
    
    return {
        "user": user_dict,
        "session_token": session_token
    }

@api_router.post("/auth/change-password")
async def change_password(
    password_request: ChangePasswordRequest,
    authorization: Optional[str] = Header(None)
):
    """Change user password (requires authentication)"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get user from database with password_hash
    user_doc = await db.users.find_one({"id": user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has password (might be OAuth-only user)
    if not user_doc.get('password_hash'):
        raise HTTPException(status_code=400, detail="Cannot change password for OAuth accounts")
    
    # Verify current password
    if not verify_password(password_request.currentPassword, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Validate new password
    if len(password_request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Update password
    new_password_hash = hash_password(password_request.newPassword)
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Generate password reset token (email will be sent later when email server is configured)"""
    # Find user
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset link will be sent"}
    
    # Check if user has password (might be OAuth-only user)
    if not user.get('password_hash'):
        return {"message": "If the email exists, a reset link will be sent"}
    
    # Generate reset token
    reset_token = generate_reset_token()
    reset_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Save reset token
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "resetToken": reset_token,
            "resetTokenExpiry": reset_expiry
        }}
    )
    
    # TODO: Send email with reset link when email server is configured
    # For now, return the token (in production, this should be sent via email only)
    return {
        "message": "If the email exists, a reset link will be sent",
        "resetToken": reset_token,  # Remove this in production
        "email": request.email  # Remove this in production
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using reset token"""
    # Find user with matching email and token
    user = await db.users.find_one({
        "email": request.email,
        "resetToken": request.resetToken
    })
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check if token is expired
    if user.get('resetTokenExpiry'):
        expiry = user['resetTokenExpiry']
        if isinstance(expiry, datetime):
            if expiry.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Validate new password
    if len(request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Update password and clear reset token
    new_password_hash = hash_password(request.newPassword)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "password_hash": new_password_hash,
            "resetToken": None,
            "resetTokenExpiry": None
        }}
    )
    
    return {"message": "Password reset successfully"}

# Raffle Endpoints
@api_router.get("/raffles/locations/list")
async def get_raffle_locations():
    """Get unique locations from all active raffles"""
    try:
        # Get distinct locations from active raffles
        locations = await db.raffles.distinct("location", {"active": True, "location": {"$exists": True, "$ne": None, "$ne": ""}})
        # Filter out empty strings and None values, sort alphabetically
        unique_locations = sorted([loc for loc in locations if loc])
        return {"locations": unique_locations}
    except Exception as e:
        print(f"Error fetching locations: {e}")
        return {"locations": []}

@api_router.get("/raffles", response_model=List[Raffle])
async def get_raffles(category: Optional[str] = None, location: Optional[str] = None, active: bool = True):
    query = {"active": active}
    if category and category != 'all':
        query["category"] = category
    if location and location != 'all':
        query["location"] = location
    
    raffles = await db.raffles.find(query).sort("drawDate", 1).to_list(100)
    return [Raffle(**raffle) for raffle in raffles]

@api_router.get("/raffles/{raffle_id}", response_model=Raffle)
async def get_raffle(raffle_id: str):
    raffle = await db.raffles.find_one({"id": raffle_id})
    if not raffle:
        raise HTTPException(status_code=404, detail="Raffle not found")
    return Raffle(**raffle)

@api_router.get("/partners/{partner_id}", response_model=Partner)
async def get_partner(partner_id: str):
    """Get partner details by ID (public endpoint)"""
    partner = await db.partners.find_one({"id": partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return Partner(**partner)

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

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

@api_router.put("/users/me/profile")
async def update_profile(profile_update: UpdateProfileRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_data = {}
    if profile_update.name:
        update_data["name"] = profile_update.name
    if profile_update.email:
        # Check if email is already taken by another user
        existing_user = await db.users.find_one({"email": profile_update.email, "id": {"$ne": user.id}})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = profile_update.email
    if profile_update.phone is not None:
        update_data["phone"] = profile_update.phone
    
    if update_data:
        await db.users.update_one(
            {"id": user.id},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": user.id})
    return User(**updated_user)

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

@api_router.post("/admin/make-admins")
async def make_admins(request: dict):
    """Make specified users admins"""
    try:
        emails = request.get("emails", [])
        updated = 0
        found_users = []
        
        for email in emails:
            # Check if user exists first
            user = await db.users.find_one({"email": email})
            if user:
                result = await db.users.update_one(
                    {"email": email},
                    {"$set": {"role": "admin"}}
                )
                updated += result.modified_count
                found_users.append({"email": email, "id": user.get("id"), "current_role": user.get("role"), "updated": result.modified_count > 0})
            else:
                found_users.append({"email": email, "found": False})
        
        return {
            "success": True,
            "message": f"Updated {updated} user(s) to admin",
            "emails": emails,
            "details": found_users
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.get("/admin/check-user/{email}")
async def check_user(email: str):
    """Check if a user exists and their role"""
    try:
        user = await db.users.find_one({"email": email})
        if user:
            return {
                "found": True,
                "email": user.get("email"),
                "id": user.get("id"),
                "role": user.get("role"),
                "name": user.get("name")
            }
        return {"found": False, "email": email}
    except Exception as e:
        return {"error": str(e)}

@api_router.post("/admin/make-me-admin")
async def make_me_admin(current_user: dict = Depends(get_current_user)):
    """Make the current logged-in user an admin"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Try to update by email first (more reliable)
        result = await db.users.update_one(
            {"email": current_user["email"]},
            {"$set": {"role": "admin"}}
        )
        
        # If that didn't work, try by id
        if result.modified_count == 0:
            result = await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"role": "admin"}}
            )
        
        # Verify the update
        updated_user = await db.users.find_one({"email": current_user["email"]})
        
        return {
            "success": True,
            "message": f"User {current_user['email']} is now an admin",
            "updated": result.modified_count > 0,
            "current_role": updated_user.get("role") if updated_user else "not found",
            "matched": result.matched_count,
            "modified": result.modified_count
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.post("/admin/force-admin/{email}")
async def force_admin(email: str):
    """Emergency endpoint to force make a user admin - NO AUTH REQUIRED"""
    try:
        # Update by email
        result = await db.users.update_one(
            {"email": email},
            {"$set": {"role": "admin"}}
        )
        
        # Verify
        user = await db.users.find_one({"email": email})
        
        return {
            "success": True,
            "email": email,
            "matched": result.matched_count,
            "modified": result.modified_count,
            "current_role": user.get("role") if user else "user not found",
            "user_id": user.get("id") if user else None
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@api_router.post("/admin/seed-database")
async def seed_database():
    """Seed the database with mock data for testing"""
    try:
        # Clear existing data
        await db.raffles.delete_many({})
        await db.partners.delete_many({})
        
        # Create partners
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
                "description": "Ride-hailing service",
                "logoUrl": "https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/grab_logo.png",
                "category": "Transport",
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            }
        ]
        
        await db.partners.insert_many(partners)
        
        # Create raffles
        now = datetime.now(timezone.utc)
        raffles = [
            {
                "id": "raffle-1",
                "title": "Luxury Spa Day at Divana",
                "description": "Relax and rejuvenate with a full day spa package including massage, facial, and aromatherapy!",
                "partnerId": "partner-1",
                "prizeValue": 2500,
                "ticketCost": 25,
                "prizesAvailable": 5,
                "prizesRemaining": 3,
                "totalEntries": 45,
                "active": True,
                "drawDate": now + timedelta(days=3),
                "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
                "category": "spa",
                "location": "Bangkok",
                "createdAt": now
            },
            {
                "id": "raffle-2",
                "title": "Siam Paragon Restaurant Voucher",
                "description": "Dine at any premium restaurant in Siam Paragon with this exclusive 1000 THB voucher!",
                "partnerId": "partner-2",
                "prizeValue": 1000,
                "ticketCost": 15,
                "prizesAvailable": 10,
                "prizesRemaining": 6,
                "totalEntries": 23,
                "active": True,
                "drawDate": now + timedelta(days=5),
                "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
                "category": "food",
                "location": "Bangkok",
                "createdAt": now
            },
            {
                "id": "raffle-3",
                "title": "Weekend Stay at Anantara",
                "description": "2 nights luxury stay at Anantara Riverside Bangkok Resort with breakfast included!",
                "partnerId": "partner-3",
                "prizeValue": 8000,
                "ticketCost": 50,
                "prizesAvailable": 2,
                "prizesRemaining": 2,
                "totalEntries": 156,
                "active": True,
                "drawDate": now + timedelta(days=7),
                "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                "category": "hotel",
                "location": "Bangkok",
                "createdAt": now
            },
            {
                "id": "raffle-4",
                "title": "Street Food Tour Bangkok",
                "description": "Guided street food tour for 2 people exploring Bangkok's best local cuisine!",
                "partnerId": "partner-1",
                "prizeValue": 800,
                "ticketCost": 10,
                "prizesAvailable": 15,
                "prizesRemaining": 12,
                "totalEntries": 87,
                "active": True,
                "drawDate": now + timedelta(days=4),
                "image": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
                "category": "food",
                "location": "Bangkok",
                "createdAt": now
            },
            {
                "id": "raffle-5",
                "title": "Thai Massage Package",
                "description": "5 sessions of authentic Thai massage at premium spa in Sukhumvit!",
                "partnerId": "partner-2",
                "prizeValue": 1500,
                "ticketCost": 20,
                "prizesAvailable": 8,
                "prizesRemaining": 5,
                "totalEntries": 12,
                "active": True,
                "drawDate": now + timedelta(days=6),
                "image": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
                "category": "spa",
                "location": "Bangkok",
                "createdAt": now
            },
            {
                "id": "raffle-6",
                "title": "Chiang Mai Boutique Hotel",
                "description": "3 nights at charming boutique hotel in Old City Chiang Mai with daily breakfast!",
                "partnerId": "partner-3",
                "prizeValue": 4500,
                "ticketCost": 35,
                "prizesAvailable": 3,
                "prizesRemaining": 3,
                "totalEntries": 28,
                "active": True,
                "drawDate": now + timedelta(days=8),
                "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                "category": "hotel",
                "location": "Chiang Mai",
                "createdAt": now
            }
        ]
        
        await db.raffles.insert_many(raffles)
        
        return {
            "success": True,
            "message": "Database seeded successfully",
            "partners_created": len(partners),
            "raffles_created": len(raffles)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

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

@api_router.get("/rewards")
async def get_rewards(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    rewards = await db.rewards.find({"userId": user.id}).to_list(100)
    return [Reward(**r) for r in rewards]

@api_router.get("/vouchers", response_model=List[Voucher])
async def get_user_vouchers(authorization: Optional[str] = Header(None)):
    """Get all vouchers for the authenticated user"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    vouchers = await db.vouchers.find({"userId": user.id}).sort("issuedAt", -1).to_list(100)
    return [Voucher(**v) for v in vouchers]

@api_router.post("/vouchers/{voucher_id}/redeem")
async def redeem_voucher(voucher_id: str, authorization: Optional[str] = Header(None)):
    """Mark a voucher as redeemed"""
    user = await get_current_user(authorization=authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    voucher = await db.vouchers.find_one({"id": voucher_id, "userId": user.id})
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
    
    if voucher["isRedeemed"]:
        raise HTTPException(status_code=400, detail="Voucher already redeemed")
    
    # Check if expired
    if datetime.now(timezone.utc) > voucher["expiresAt"]:
        raise HTTPException(status_code=400, detail="Voucher has expired")
    
    # Mark as redeemed
    await db.vouchers.update_one(
        {"id": voucher_id},
        {"$set": {
            "isRedeemed": True,
            "redeemedAt": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Voucher redeemed successfully"}

# AdMob Server-Side Verification (SSV) Callback
@api_router.get("/admob/ssv-callback")
@api_router.post("/admob/ssv-callback")
async def admob_ssv_callback(request: Request):
    """
    AdMob Server-Side Verification callback endpoint.
    This endpoint receives notifications from AdMob when users complete rewarded ads.
    
    Query parameters from AdMob:
    - ad_network: The ad network (e.g., "5450213213286189855")
    - ad_unit: The ad unit ID
    - reward_amount: Amount of reward
    - reward_item: Type of reward
    - timestamp: Unix timestamp
    - transaction_id: Unique transaction ID
    - user_id: Custom user ID we provided (optional during AdMob verification)
    - custom_data: Custom JSON data (can contain user_id)
    - signature: HMAC-SHA256 signature for verification
    - key_id: Key ID for signature verification
    """
    
    # Get all query parameters
    params = dict(request.query_params)
    
    logger.info(f"AdMob SSV Callback received: {params}")
    
    # Extract important parameters
    user_id = params.get('user_id') or params.get('custom_data')
    transaction_id = params.get('transaction_id')
    reward_amount = params.get('reward_amount', '10')
    reward_item = params.get('reward_item', 'tickets')
    timestamp = params.get('timestamp')
    
    # If this is just AdMob's verification test (no user_id), return 200 OK
    if not user_id:
        logger.info("AdMob verification test received (no user_id) - returning OK")
        return Response(status_code=200, content="OK")
    
    # Validate transaction_id exists
    if not transaction_id:
        logger.warning(f"Missing transaction_id in SSV callback: {params}")
        # Still return 200 to prevent AdMob retries
        return Response(status_code=200, content="OK")
    
    try:
        # Check for duplicate transaction
        existing = await db.ad_rewards.find_one({"transactionId": transaction_id})
        if existing:
            logger.warning(f"Duplicate transaction ID: {transaction_id}")
            return Response(status_code=200, content="OK")  # Return 200 to avoid retries
        
        # Award tickets to user
        tickets_to_award = int(reward_amount) if reward_amount else 10
        
        result = await db.users.update_one(
            {"id": user_id},
            {"$inc": {"tickets": tickets_to_award}}
        )
        
        if result.modified_count == 0:
            logger.warning(f"User not found: {user_id} - recording anyway for audit")
        
        # Record the reward (even if user not found, for audit trail)
        await db.ad_rewards.insert_one({
            "userId": user_id,
            "transactionId": transaction_id,
            "tickets": tickets_to_award,
            "rewardItem": reward_item,
            "timestamp": datetime.now(timezone.utc),
            "adNetwork": params.get('ad_network'),
            "adUnit": params.get('ad_unit'),
            "verified": True,
            "userFound": result.modified_count > 0,
            "rawParams": params
        })
        
        logger.info(f"SSV: Awarded {tickets_to_award} tickets to user {user_id}, transaction {transaction_id}")
        
        # AdMob expects 200 OK response
        return Response(status_code=200, content="OK")
        
    except Exception as e:
        logger.error(f"Error processing SSV callback: {str(e)}")
        # Return 200 to prevent AdMob retries on server errors
        return Response(status_code=200, content="OK")

# Admin Endpoints
def generate_voucher_code() -> str:
    """Generate a unique voucher code"""
    import string
    import random as rand
    chars = string.ascii_uppercase + string.digits
    code = ''.join(rand.choice(chars) for _ in range(12))
    return f"WW-{code[:4]}-{code[4:8]}-{code[8:]}"

@api_router.post("/admin/process-automatic-draws")
async def process_automatic_draws(authorization: Optional[str] = Header(None)):
    """
    Automatic draw system that processes all raffles due for drawing.
    Can be called manually by admin or via scheduled task.
    """
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    results = {
        "processedRaffles": [],
        "drawnRaffles": [],
        "extendedRaffles": [],
        "errors": []
    }
    
    # Find all raffles that are due for drawing and not yet drawn
    raffles_due = await db.raffles.find({
        "drawStatus": {"$in": ["pending", "eligible"]},
        "drawDate": {"$lte": now},
        "active": True
    }).to_list(1000)
    
    for raffle in raffles_due:
        raffle_id = raffle["id"]
        raffle_title = raffle["title"]
        
        try:
            # Check if minimum draw date has passed
            minimum_draw_date = raffle.get("minimumDrawDate")
            if minimum_draw_date and now < minimum_draw_date.replace(tzinfo=timezone.utc):
                results["errors"].append({
                    "raffleId": raffle_id,
                    "title": raffle_title,
                    "error": "Minimum draw date not yet reached"
                })
                continue
            
            # Calculate total tickets collected
            total_tickets = raffle.get("totalTicketsCollected", 0)
            game_price = raffle.get("gamePrice", 0)
            
            # Check if threshold is met
            if total_tickets >= game_price:
                # Eligible for draw - proceed with drawing
                # Get all entries for this raffle
                entries = await db.entries.find({"raffleId": raffle_id}).to_list(10000)
                
                if not entries:
                    results["errors"].append({
                        "raffleId": raffle_id,
                        "title": raffle_title,
                        "error": "No entries found despite ticket count"
                    })
                    continue
                
                # Randomly select a winner
                winner_entry = random.choice(entries)
                winner_user = await db.users.find_one({"id": winner_entry["userId"]})
                
                if not winner_user:
                    results["errors"].append({
                        "raffleId": raffle_id,
                        "title": raffle_title,
                        "error": "Winner user not found"
                    })
                    continue
                
                # Get partner info for voucher
                partner = await db.partners.find_one({"id": raffle.get("partnerId")})
                
                # Create Voucher
                validity_months = raffle.get("validityMonths", 3)
                valid_until = now + timedelta(days=validity_months * 30)
                
                # Handle secret code for digital prizes
                secret_code = None
                if raffle.get("isDigitalPrize", False):
                    # Get an unused secret code
                    secret_codes = raffle.get("secretCodes", [])
                    used_codes = raffle.get("usedSecretCodes", [])
                    available_codes = [code for code in secret_codes if code not in used_codes]
                    
                    if available_codes:
                        secret_code = available_codes[0]
                        # Mark code as used
                        await db.raffles.update_one(
                            {"id": raffle_id},
                            {"$push": {"usedSecretCodes": secret_code}}
                        )
                    else:
                        # No codes available - this is an error condition
                        results["errors"].append({
                            "raffleId": raffle_id,
                            "title": raffle_title,
                            "error": "Digital prize but no secret codes available"
                        })
                        continue
                
                # Create voucher
                voucher = Voucher(
                    voucherRef=generate_voucher_reference(),
                    userId=winner_user["id"],
                    userName=winner_user.get("name", "User"),
                    userEmail=winner_user.get("email", ""),
                    raffleId=raffle_id,
                    raffleTitle=raffle_title,
                    partnerId=raffle.get("partnerId", ""),
                    partnerName=raffle.get("partnerName", "WinWai"),
                    prizeValue=raffle.get("prizeValue", 0),
                    currency=raffle.get("currency", "THB"),
                    isDigitalPrize=raffle.get("isDigitalPrize", False),
                    secretCode=secret_code,
                    verificationCode=generate_verification_code(),
                    validUntil=valid_until,
                    partnerEmail=partner.get("email") if partner else None,
                    partnerWhatsapp=partner.get("whatsapp") if partner else None,
                    partnerLine=partner.get("line") if partner else None,
                    partnerAddress=partner.get("address") if partner else None
                )
                await db.vouchers.insert_one(voucher.dict())
                
                # Create Winner record
                winner = Winner(
                    userId=winner_user["id"],
                    raffleId=raffle_id,
                    entryId=winner_entry["id"],
                    voucherId=voucher.id,
                    drawDate=now
                )
                await db.winners.insert_one(winner.dict())
                
                # Update raffle status
                await db.raffles.update_one(
                    {"id": raffle_id},
                    {"$set": {
                        "drawStatus": "drawn",
                        "drawnAt": now,
                        "prizesRemaining": raffle["prizesRemaining"] - 1,
                        "active": raffle["prizesRemaining"] - 1 > 0
                    }}
                )
                
                results["drawnRaffles"].append({
                    "raffleId": raffle_id,
                    "title": raffle_title,
                    "winnerId": winner_user["id"],
                    "winnerName": winner_user.get("name"),
                    "voucherId": voucher.id,
                    "voucherRef": voucher.voucherRef
                })
                
            else:
                # Threshold not met - extend the draw
                prize_value_usd = raffle.get("prizeValueUSD", 0)
                extension_period = get_extension_period(prize_value_usd)
                new_draw_date = now + extension_period
                
                await db.raffles.update_one(
                    {"id": raffle_id},
                    {"$set": {
                        "drawDate": new_draw_date,
                        "lastExtensionDate": now,
                        "drawStatus": "extended"
                    }}
                )
                
                results["extendedRaffles"].append({
                    "raffleId": raffle_id,
                    "title": raffle_title,
                    "currentTickets": total_tickets,
                    "requiredTickets": game_price,
                    "newDrawDate": new_draw_date.isoformat()
                })
            
            results["processedRaffles"].append(raffle_id)
            
        except Exception as e:
            results["errors"].append({
                "raffleId": raffle_id,
                "title": raffle.get("title", "Unknown"),
                "error": str(e)
            })
    
    return {
        "success": True,
        "message": f"Processed {len(results['processedRaffles'])} raffles",
        "results": results
    }

@api_router.post("/admin/draw-winner")
async def draw_winner(draw_request: DrawWinnerRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get raffle
    raffle = await db.raffles.find_one({"id": draw_request.raffleId})
    if not raffle:
        raise HTTPException(status_code=404, detail="Raffle not found")
    
    # Get partner info
    partner = await db.partners.find_one({"id": raffle.get("partnerId")})
    
    # Get all entries
    entries = await db.entries.find({"raffleId": draw_request.raffleId}).to_list(10000)
    if not entries:
        raise HTTPException(status_code=400, detail="No entries for this raffle")
    
    # Randomly select winner(s)
    prizes_to_award = min(raffle["prizesRemaining"], len(entries))
    winners = random.sample(entries, prizes_to_award)
    
    # Create rewards and vouchers
    rewards_created = []
    vouchers_created = []
    
    for winner_entry in winners:
        # Get winner user info
        winner_user = await db.users.find_one({"id": winner_entry["userId"]})
        if not winner_user:
            continue
            
        # Create reward
        reward = Reward(
            userId=winner_entry["userId"],
            raffleId=draw_request.raffleId,
            raffleTitle=raffle["title"],
            prizeDetails=raffle["description"],
            partnerName=raffle.get("partnerName", "WinWai")
        )
        await db.rewards.insert_one(reward.dict())
        rewards_created.append(reward.id)
        
        # Calculate expiry date based on validityMonths
        validity_months = raffle.get("validityMonths", 3)
        now = datetime.now(timezone.utc)
        valid_until = now + timedelta(days=validity_months * 30)  # Approximate months to days
        
        # Handle secret code for digital prizes
        secret_code = None
        if raffle.get("isDigitalPrize", False):
            secret_codes = raffle.get("secretCodes", [])
            used_codes = raffle.get("usedSecretCodes", [])
            available_codes = [code for code in secret_codes if code not in used_codes]
            if available_codes:
                secret_code = available_codes[0]
                # Mark code as used
                await db.raffles.update_one(
                    {"id": draw_request.raffleId},
                    {"$push": {"usedSecretCodes": secret_code}}
                )
        
        # Generate voucher
        voucher = Voucher(
            voucherRef=generate_voucher_reference(),
            userId=winner_entry["userId"],
            userName=winner_user.get("name", "User"),
            userEmail=winner_user.get("email", ""),
            raffleId=draw_request.raffleId,
            raffleTitle=raffle["title"],
            partnerId=raffle.get("partnerId", ""),
            partnerName=raffle.get("partnerName", "WinWai"),
            prizeValue=raffle.get("prizeValue", 0),
            currency=raffle.get("currency", "THB"),
            isDigitalPrize=raffle.get("isDigitalPrize", False),
            secretCode=secret_code,
            verificationCode=generate_verification_code(),
            validUntil=valid_until,
            partnerEmail=partner.get("email") if partner else None,
            partnerWhatsapp=partner.get("whatsapp") if partner else None,
            partnerLine=partner.get("line") if partner else None,
            partnerAddress=partner.get("address") if partner else None
        )
        await db.vouchers.insert_one(voucher.dict())
        vouchers_created.append(voucher.voucherRef)
    
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
        "rewardsCreated": rewards_created,
        "vouchersCreated": vouchers_created
    }

@api_router.get("/admin/users")
async def get_all_users(authorization: Optional[str] = Header(None), page: int = 1, limit: int = 20, q: Optional[str] = None, role: Optional[str] = None):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    skip = max(0, (page - 1) * limit)
    query: Dict = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    if role and role in ["user", "admin"]:
        query["role"] = role

    cursor = db.users.find(query).sort("createdAt", -1).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    return [User(**u) for u in users]

class CreateUserRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str
    role: str = "user"
    tickets: int = 0

@api_router.post("/admin/users")
async def create_user(request: CreateUserRequest, authorization: Optional[str] = Header(None)):
    """Admin endpoint to create a new user"""
    admin_user = await get_current_user(authorization=authorization)
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Validate email
    if not request.email or "@" not in request.email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Validate role
    if request.role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    
    # Validate password
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Create new user
    new_user = User(
        id=str(uuid.uuid4()),
        name=request.name,
        email=request.email,
        phone=request.phone,
        password_hash=hash_password(request.password),
        role=request.role,
        tickets=request.tickets,
        dailyStreak=0,
        lastLogin=datetime.now(timezone.utc),
        createdAt=datetime.now(timezone.utc)
    )
    
    await db.users.insert_one(new_user.dict())
    return new_user

@api_router.post("/admin/raffles")
async def create_raffle(raffle: Raffle, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    raffle.prizesRemaining = raffle.prizesAvailable
    # Convert prize value to USD for automatic raffle drawer
    raffle.prizeValueUSD = convert_to_usd(raffle.prizeValue, raffle.currency)
    await db.raffles.insert_one(raffle.dict())
    return raffle

# Admin Partner Management
@api_router.get("/admin/partners", response_model=List[Partner])
async def get_all_partners(authorization: Optional[str] = Header(None), page: int = 1, limit: int = 20, q: Optional[str] = None, category: Optional[str] = None):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    skip = max(0, (page - 1) * limit)
    query: Dict = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    if category and category in ["food", "hotel", "spa"]:
        query["category"] = category

    cursor = db.partners.find(query).sort("createdAt", -1).skip(skip).limit(limit)
    partners = await cursor.to_list(length=limit)
    return [Partner(**p) for p in partners]

@api_router.post("/admin/partners", response_model=Partner)
async def create_partner(partner: Partner, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.partners.insert_one(partner.dict())
    return partner

@api_router.put("/admin/partners/{partner_id}", response_model=Partner)
async def update_partner(partner_id: str, partner: Partner, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.partners.update_one(
        {"id": partner_id},
        {"$set": partner.dict(exclude={"id"})}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return partner

@api_router.delete("/admin/partners/{partner_id}")
async def delete_partner(partner_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.partners.delete_one({"id": partner_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"message": "Partner deleted successfully"}

# Admin User Management
class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    tickets: Optional[int] = None
    role: Optional[str] = None

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, user_update: UpdateUserRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {}
    if user_update.name:
        update_data["name"] = user_update.name
    if user_update.email:
        update_data["email"] = user_update.email
    if user_update.phone is not None:
        update_data["phone"] = user_update.phone
    if user_update.tickets is not None:
        update_data["tickets"] = user_update.tickets
    if user_update.role:
        update_data["role"] = user_update.role
    
    if update_data:
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"id": user_id})
    return User(**updated_user)

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Prevent deleting yourself
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

# Admin Raffle Management
@api_router.get("/admin/raffles", response_model=List[Raffle])
async def get_all_raffles_admin(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    raffles = await db.raffles.find().sort("createdAt", -1).to_list(1000)
    return [Raffle(**r) for r in raffles]

@api_router.put("/admin/raffles/{raffle_id}", response_model=Raffle)
async def update_raffle(raffle_id: str, raffle: Raffle, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Convert prize value to USD for automatic raffle drawer
    raffle.prizeValueUSD = convert_to_usd(raffle.prizeValue, raffle.currency)
    
    result = await db.raffles.update_one(
        {"id": raffle_id},
        {"$set": raffle.dict(exclude={"id"})}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Raffle not found")
    
    return raffle

@api_router.delete("/admin/raffles/{raffle_id}")
async def delete_raffle(raffle_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization=authorization)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.raffles.delete_one({"id": raffle_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Raffle not found")
    
    return {"message": "Raffle deleted successfully"}

# Serve static legal pages
@app.get("/terms", response_class=FileResponse)
async def terms_of_service():
    """Serve Terms of Service page"""
    return FileResponse("static/terms.html", media_type="text/html")

@app.get("/privacy", response_class=FileResponse)
async def privacy_policy():
    """Serve Privacy Policy page"""
    return FileResponse("static/privacy.html", media_type="text/html")

@app.get("/download", response_class=HTMLResponse)
async def download_page():
    """Serve app download page with QR code"""
    return FileResponse("static/download.html", media_type="text/html")

@app.get("/download-apk")
async def download_apk():
    """Serve APK file for download"""
    apk_path = Path("static/app.apk")
    if not apk_path.exists():
        raise HTTPException(status_code=404, detail="APK file not found. Please build the app first.")
    return FileResponse(
        path=str(apk_path),
        media_type="application/vnd.android.package-archive",
        filename="WinWaiRaffle.apk"
    )

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
