from rooms.schema import joinRoom,CreateRoom
from rooms.model import Room
from players.model import Player
from shared_state import create_room_state,get_room_state,update_room_state
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

    
    #redis state
    create_room_state(room.id,room.max_players)
    
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
            raise HTTPException(status_code=400,detail="Password required")
        
        if not verify_password(data.password,room.password):
            raise HTTPException(status_code=401,detail="Incorrect password")
        
   #redis-state
    room_state=get_room_state(room.id)
    
    if not room_state:
        raise HTTPException(status_code=500,detail="Room state missing")
    
    #player limit check
    if len(room_state["players"])>=room.max_players:
        raise HTTPException(status_code=400,detail="Room is full")    
        
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
    
    #update redis
    room_state["players"].append({
        "id":player.id,
        "name":player.name,
        "score":0,
        "is_guessed":False,
        "role":"guesser"
    })
    
    update_room_state(room.id,room_state)

    
    return player    