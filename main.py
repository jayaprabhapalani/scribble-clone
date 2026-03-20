from fastapi import FastAPI
from database import engine,Base

from rooms.router import router as rooms_router


app=FastAPI(title="Scribble")


#include routers
app.include_router(rooms_router)


#create table
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        

@app.get("/")
async def root():
    return {"message":"Server is runnig"}        