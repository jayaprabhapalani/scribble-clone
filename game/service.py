import asyncio
from shared_state import get_room_state,update_room_state,room_tasks,round_events
from words import get_random_word
from websockets_conn.manager import manager


MIN_PLAYERS=2

async def lobby_countdown(room_id:int):
    for i in range(10,0,-1):
        room_state=await get_room_state(room_id)
        
        if not room_state or len(room_state["players"])<MIN_PLAYERS:
            return # stop countdown
        
        await manager.broadcast(room_id,{
            "type":"countdown",
            "value":i
        })
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
            await manager.broadcast(room_id,{
                "event":"game_end"
            })
            break
        
        await run_round(room_id)
        round_count+=1
        
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
    await manager.broadcast(room_id,{
        "type":"round_start",
        "drawer_id":drawer_id
    })  
    
    # send word only to drawer
    await send_word_to_drawer(room_id,drawer_id,word)
    
    #reset  round event
    round_events[room_id].clear()
    
    #wait for guess or timeout
    try:
        await asyncio.wait_for(
            round_events[room_id].wait(),
            timeout=ROUND_TIME   
        )
    except asyncio.TimeoutError:
        pass
    
    #round ended
    await manager.broadcast(room_id,{
        "type":"round_end",
        "word":word
    })  
    
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