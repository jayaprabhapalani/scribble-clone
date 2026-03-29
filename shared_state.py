import json
from redis_client import r
import asyncio

round_events={}     # room_id -> asyncio.Event
room_tasks = {}     # room_id -> asyncio.Task

# room={} --- it will be lost when we restart the server again
# so we're gonna use redis to avoid this
""" round_events → control flow (when to stop round)
    room_tasks → execution control (what is running)
    Redis → game data"""

async def create_room_state(room_id:int,max_player:int):
    room_data={
        "players":[],
        "canvas_event":[],
        "status":"waiting",
        "max_players":max_player,
        "drawer_id":None,
        "drawer_index":0,
        "current_word":None,
        "max_rounds":3
    }
    
    await r.set(f"room:{room_id}",json.dumps(room_data))
    
    #initialize control structure
    round_events[room_id]=asyncio.Event()
    room_tasks[room_id]=None
    
    
async def get_room_state(room_id:int):
    data=await r.get(f"room:{room_id}")    
    return json.loads(data) if data else None

async def update_room_state(room_id:int,data:dict):
    await r.set(f"room:{room_id}",json.dumps(data))
    
    
async def delete_room_state(room_id:int):
    await r.delete(f"room:{room_id}")
    
    #cleanup event
    round_events.pop(room_id,None)
    #cancel running task if exists
    task=room_tasks.pop(room_id,None)
    if task:
        task.cancel()