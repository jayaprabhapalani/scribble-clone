from rooms.schema import joinRoom,CreateRoom
from rooms.model import Room
from players.model import Player
from shared_state import rooms
from utils.security import hash_password,verify_password
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

async def create_room(data:CreateRoom,db:AsyncSession):
    hashed_password=None
    
    if data.is_private:
        hashed_password=hash_password(data.password)
    
    room=Room(
        name=data.name,
        is_private=data.is_private,
        password=hashed_password,
        status="waiting",
        max_players=data.max_players
    )  
    
    db.add(room)
    await db.commit()
    await db.refresh(room)
    
    #in-memory update
    room[room.id]={
        "players":[],
        "canvas_event":[],
        "guess_word":"",
        "timer":None,
        "status":room.status,
        "max_players":room.max_players
    }
    
    return room  
    
async def get_room_by_id(room_id:int,db:AsyncSession):
    result=await db.execute(select(Room).where(Room.id==room_id))
    room=result.scalar_one_or_none()
    
    if not room:
        raise HTTPException(status_code=404,detail="Room not Found")
    
    return room
    
async def join_room(data:joinRoom,db:AsyncSession):
    room=await get_room_by_id(data.room_id,db)
    
    #password check
    if room.is_private:
        if not data.password:
            raise HTTPException(status_code=404,detail="Password required")
        
        if not verify_password(data.password,room.password):
            raise HTTPException(status_code=401,detail="Incorrect password")
        
    #get in-memory room
    in_memory_room=room.get(room.id)
    
    if not in_memory_room:
        raise HTTPException(500,"Room not initialized in memory")
    
    #player limit check
    if len(in_memory_room["players"])>=room.max_players:
        raise HTTPException(400,"Room is full")    
        
    #create player (DB)
    player=Player(
        name=data.user_name,
        room_id=room.id,
        score=0,
        is_guessed=False,
        role="guesser"
    )  
     
    db.add(player)
    await db.commit()
    await db.refresh(player)
    
    #add to in-memory players list
    
    in_memory_room["players"].append({
        "id":player.id,
        "name":player.name,
        "score":player.score,
        "is_guessed":player.is_guessed,
        "role":player.role
    })
    
    return player    