from fastapi import FastAPI,WebSocket
from database import engine,Base
from websockets_conn.router import websocket_endpoint

from rooms.router import router as rooms_router
from leaderboard.router import router as leaderboard_router


app=FastAPI(title="Scribble")


#include routers
app.include_router(rooms_router)
app.include_router(leaderboard_router)


#create table
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        

@app.get("/")
async def root():
    return {"message":"Server is runnig"}  

@app.websocket("/ws/{room_id}/{player_id}")
async def ws_route(websocket:WebSocket,room_id:int,player_id:int):
    await websocket_endpoint(websocket,room_id,player_id)      