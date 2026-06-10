import asyncio
import json
from shared_state import get_room_state,update_room_state,room_tasks,round_events
from words import get_random_word
from websockets_conn.manager import manager
from database import SessionLocal
from players.model import Player
from sqlalchemy import update
from redis_client import r

MIN_PLAYERS=2

_lobby_lock=asyncio.Lock() # to avoid race condition

async def lobby_countdown(room_id:int):
    for i in range(10,0,-1):
        room_state=await get_room_state(room_id)
        
        if not room_state or len(room_state["players"])<MIN_PLAYERS:
            return # stop countdown
        
        await r.publish(f"room:{room_id}",json.dumps({
            "type":"countdown",
            "value":i
        }))
        await asyncio.sleep(1)
        
    # start game after countdown
    room_tasks[room_id]=asyncio.create_task(
        game_loop(room_id)
    )    
        
   
# to avoid multiple countdowns
async def try_start_lobby(room_id:int):
    room_state=await get_room_state(room_id)
    
    if not room_state:
        return
    
    players=room_state["players"]
    
    if len(players)>= MIN_PLAYERS and room_tasks.get(room_id) is None:
        # to stop race condition -- only one coroutine enters at a time for a room
        async with _lobby_lock:
            if room_tasks.get(room_id) is not None: 

                room_tasks[room_id]=asyncio.create_task(
                lobby_countdown(room_id)
                )      
        
        
        
#game_loop

ROUND_TIME=30

async def game_loop(room_id:int):
    round_count=0
    
    room_state=await get_room_state(room_id)
    max_rounds=room_state.get("max_rounds",3)
    
    while True:
        room_state=await get_room_state(room_id)
        
        if not room_state or len(room_state["players"])<2:
            break
        
        if round_count>=max_rounds:
            await r.publish(f"room:{room_id}",json.dumps({"event":"game_end"}))
            # save score in db
            await persist_scores(room_id)
            break
        
        await run_round(room_id)
        round_count+=1
        
    #cleanup
    room_tasks.pop(room_id,None)    
        
async def _tick_timer(room_id:int):
    for i in range(ROUND_TIME,0,-1):
        await r.publish(f"room:{room_id}",json.dumps({"type":"timer","value":i}))
        await asyncio.sleep(1)
        
async def run_round(room_id:int):
    room_state=await get_room_state(room_id)
    
    for player in room_state["players"]:
        player["is_guessed"]=False
    
    players=room_state["players"]
    drawer_index=room_state.get("drawer_index",0)
    
    drawer=players[drawer_index]
    drawer_id=drawer["id"]
    word=get_random_word()
    
    #update state
    room_state["drawer_id"]=drawer_id
    room_state["current_word"]=word
    await update_room_state(room_id,room_state)
    
    #notify players
    await r.publish(f"room:{room_id}",json.dumps({
        "type":"round_start",
        "drawer_id":drawer_id
    }))
    
    # send word only to drawer
    await send_word_to_drawer(room_id,drawer_id,word)
    
    #reset round event
    round_events[room_id].clear()
    
    timer_task=asyncio.create_task(_tick_timer(room_id))
    
    try:
        await asyncio.wait_for(round_events[room_id].wait(),timeout=ROUND_TIME)
    except asyncio.TimeoutError:
        pass
    finally:
        timer_task.cancel()
    
    #round ended
    await r.publish(f"room:{room_id}",json.dumps({
        "type":"round_end",
        "word":word
    }))
    
    #clear canvas
    room_state["canvas_event"]=[]
    
    #move to the next drawer
    room_state["drawer_index"]=(drawer_index+1) % len(players)
    
    await update_room_state(room_id,room_state)      
        
        
async def send_word_to_drawer(room_id:int,drawer_id:int,word:str):
    ws=manager.active_connections.get(room_id,{}).get(drawer_id)
    
    if ws:
        await ws.send_json({
            "event":"your_word",
            "word":word
        }) 
        
# to store the score in db when the game ends
async def persist_scores(room_id:int):
    room_state=await get_room_state(room_id)
    
    if not room_state:
        return
    
    async with SessionLocal() as db:
        for player in room_state["players"]:
            stmt=(
                update(Player)
                .where(Player.id==player["id"])
                .values(score=Player.score+player["score"])
            ) 
            await db.execute(stmt)   
        await db.commit()           