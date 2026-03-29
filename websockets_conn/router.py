from fastapi import WebSocket,WebSocketDisconnect
from websockets_conn.manager import manager
from shared_state import get_room_state,update_room_state,delete_room_state,round_events
from game.service import try_start_lobby

async def websocket_endpoint(websocket:WebSocket,room_id:int,player_id:int):
    # moment -1 connect
    await manager.connect(room_id,player_id=player_id,websocket=websocket)
    
    try:
        #get the room state form redis
        room_state=await get_room_state(room_id)
        
        if not room_state:
            await websocket.close()
            return
        
        #send catchup payload to this player
        await manager.send_personal_message(websocket,{
            "event":"init",
            "data":room_state
        })
        
        #broadcast join to others (exclude self optional)
        await manager.broadcast(room_id,{
            "event":"join",
            "player_id":player_id
        },exclude=player_id)
        
        
        #moment-2 message loop
        while True:
            data=await websocket.receive_json()
            
            event_type=data.get("event")
            
            #DRAW EVENT
            if event_type=="draw":
                draw_data=data.get("data")
                
                room_state=await get_room_state(room_id)
                room_state["canvas_event"].append(draw_data)
                
                await update_room_state(room_id,room_state)
                
                await manager.broadcast(room_id,{
                    "event":"draw",
                    "data":draw_data
                },exclude=player_id) # dont send to drawer
             
            # GUESS EVENT
            elif event_type=="guess":
                guess=data.get("data").strip().lower()
                
                room_state=await get_room_state(room_id)
                
                correct_word=room_state.get("current_word")
                
                drawer_id=room_state.get("drawer_id")
                
                if guess.strip().lower()==correct_word:
                   
                    #update score
                    for player in room_state["players"]:
                        if player["id"]==player_id and not player["is_guessed"]:
                            player["score"]+=10
                            player["is_guessed"]=True
                    
                    guessers=[p for p in room_state["players"] if p["id"]!= drawer_id]    
                    
                    #ONLY end round if all guessed
                    if all(p["is_guessed"] for p in guessers) :
                        #end round 
                        round_events[room_id].set()  
                            
                    await update_room_state(room_id,room_state)
                    
                    await manager.broadcast(room_id,{
                        "event":"correct_guess",
                        "player_id":player_id
                    }) 
                else:
                    await manager.broadcast(room_id,{
                        "event":"guess",
                        "player_id":player_id,
                        "guess":guess
                    },exclude=drawer_id)  
    #moment-3 disconnet                             
    except WebSocketDisconnect:
        manager.disconnect(room_id,player_id)
        
        room_state=await get_room_state(room_id)
        
        if room_state:
            room_state["players"]=[
                p for p in room_state["players"]
                if p["id"] != player_id
            ]
            
            # delete room if empty
            if not room_state["players"]:
                await delete_room_state(room_id)
            else:
                await update_room_state(room_id,room_state)
            
        await manager.broadcast(room_id,{
            "event":"leave",
            "player_id":player_id
        })    
        
        