from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api.v1.router import api_router
from app.core.database import Base, async_session, engine

DEFAULT_CATEGORIES = [
    {"name": "Food", "icon": "utensils"},
    {"name": "Shopping", "icon": "shopping-bag"},
    {"name": "Travel", "icon": "plane"},
    {"name": "Transportation", "icon": "car"},
    {"name": "Education", "icon": "book-open"},
    {"name": "Healthcare", "icon": "heart-pulse"},
    {"name": "Entertainment", "icon": "tv"},
    {"name": "Bills", "icon": "file-text"},
    {"name": "Rent", "icon": "home"},
    {"name": "Subscriptions", "icon": "repeat"},
    {"name": "Salary", "icon": "briefcase"},
    {"name": "Freelance", "icon": "laptop"},
    {"name": "Other", "icon": "more-horizontal"},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    async with engine.begin() as conn:
        # Import all models so they are registered with Base
        import app.models  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)

    # Seed default categories if they don't exist
    from app.models.categories import Category

    async with async_session() as session:
        result = await session.execute(
            select(Category).where(Category.is_default == True)  # noqa: E712
        )
        existing = result.scalars().all()
        if not existing:
            for cat_data in DEFAULT_CATEGORIES:
                category = Category(
                    name=cat_data["name"],
                    icon=cat_data["icon"],
                    is_default=True,
                    user_id=None,
                )
                session.add(category)
            await session.commit()

    yield


app = FastAPI(
    title="SpendSense AI API",
    description="Personal finance management platform powered by AI",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to SpendSense AI API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
