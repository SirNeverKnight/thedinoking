from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.api.auth import auth_router
from app.api.rooms import rooms_router
from app.api.leaderboard import leaderboard_router
from app.websockets.router import ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup DB schema initialization
    await init_db()
    yield
    # Shutdown cleanups if any

app = FastAPI(
    title="The Dino King API & Realtime Server",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include HTTP REST Routers
app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(leaderboard_router)

# Include WebSocket Router
app.include_router(ws_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "The Dino King Engine",
        "version": "1.0.0",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
