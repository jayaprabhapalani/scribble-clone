import json
from redis_client import r

# room={} --- it will be lost when we restart the server again
# so we're gonna use redis to avoid this

async def create_room_state(room_id:int,max_player:int):
    room_data={
        "players":[],
        "canvas_event":[],
        "status":"waiting",
        "max_players":max_player,
        "drawer_id":None
    }
    
    await r.set(f"room:{room_id}",json.dumps(room_data))
    
    
async def get_room_state(room_id:int):
    data=await r.get(f"room:{room_id}")    
    return json.loads(data) if data else None

async def update_room_state(room_id:int,data:dict):
    await r.set(f"room:{room_id}",json.dumps(data))
    
async def delete_room_state(room_id:int):
    await r.delete(f"room:{room_id}")