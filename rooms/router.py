from fastapi import APIRouter,Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db

from rooms.schema import CreateRoom,joinRoom,RoomResponse
from rooms.service import create_room,join_room

router=APIRouter(prefix="/rooms",tags=["Rooms"])

@router.post("/",response_model=RoomResponse)
async def create_room_route(
    data:CreateRoom,
    db:AsyncSession=Depends(get_db)
):
    room=await create_room(data,db)
    return room

@router.post("/join")
async def join_room_route(
    data:joinRoom,
    db:AsyncSession=Depends(get_db)
):
    player=await join_room(data,db)
    
    return {
        "message":"Joined successfully",
        "player_id":player.id,
        "room_id":player.room_id
    }