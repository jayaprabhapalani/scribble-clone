import asyncio
from shared_state import get_room_state,update_room_state,room_tasks,round_events
from words import get_random_word


MIN_PLAYERS=2

async def lobby_countdown(room_id:int,broadcast):
    for i in range(10,0,-1):
        await broadcast(room_id,{
            "type":"countdown",
            "value":i
        })
        await asyncio.sleep(1)
        
    # start game after countdown
    room_tasks[room_id]=asyncio.create_task(
        game_loop(room_id,broadcast)
    )    
        
   
# to avoid multiple countdowns
async def try_start_lobby(room_id:int,broadcast):
    room_state=await get_room_state
    
    if not room_state:
        return
    
    players=room_state["players"]
    
    if len(players)>= MIN_PLAYERS and room_tasks.get(room_id) is None:
        room_tasks[room_id]=asyncio.create_task(
            lobby_countdown(room_id,broadcast)
        )      
        
        
        
#game_loop

ROUND_TIME=30

async def game_loop(room_id:int,broadcast):
    while True:
        room_state=await get_room_state(room_id)
        
        if not room_state or len(room_state["players"])<2:
            break
        
        await run_round(room_id,broadcast)
        
async def run_round(room_id:int,broadcast):
    room_state=await get_room_state(room_id)
    
    players=room_state["players"]
    drawer_index=room_state.get("drawer_index",0)
    
    drawer_id=players[drawer_index]
    word=get_random_word()
    
    #update state
    room_state["drawer-id"]=drawer_id
    await update_room_state(room_id,room_state)
    
    #notify players
    await broadcast(room_id,{
        "type":"round_start",
        "drawer_id":drawer_id
    })  
    
    # send word only to drawer
    await send_word_drawer(drawer_id,word)
    
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
    await broadcast(room_id,{
        "type":"round_end",
        "word":word
    })  
    
    #move to the next drawer
    room_state["drawr_index"]=(drawer_id+1)%len(players)
    await update_room_state(room_id,room_state)      
        
        
async def send_word_to_drawer(drawer_id:int,word:str):
    print(f"send to drawer {drawer_id}:{word}")        