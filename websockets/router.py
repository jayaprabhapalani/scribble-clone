from fastapi import WebSocket,WebSocketDisconnect
from websockets.manager import manager
from shared_state import get_room_state,update_room_state

async def websocket_endpoint(websocket:WebSocket,room_id:int,player_id:int):
    # moment -1 connect
    await manager.connect(room_id,websocket)
    
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
        
        #broadcast join to others
        await manager.broadcast(room_id,{
            "event":"join",
            "player_id":player_id
        })
        
        
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
                })
             
            # GUESS EVENT
            elif event_type=="guess":
                guess=data.get("data")
                
                room_state=await get_room_state(room_id)
                
                correct_word=room_state.get("current_word")
                
                if guess==correct_word:
                    #update score
                    for player in room_state["players"]:
                        if player["id"]==player_id:
                            player["score"]+=10
                            
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
                    })  
    #moment-3 disconnet                             
    except WebSocketDisconnect:
        manager.disconnect(room_id,websocket)
        
        room_state=await get_room_state(room_id)
        
        if room_state:
            room_state["players"]=[
                p for p in room_state["players"]
                if p["id"] != player_id
            ]
            
            await update_room_state(room_id,room_state)
            
        await manager.broadcast(room_id,{
            "event":"leave",
            "player_id":player_id
        })    
        
        