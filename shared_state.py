from fastapi import WebSocket
from players.model import Player
import json
from redis_client import r

class InMemoryPlayer:
    def __init__(self,db_palyer:Player,websocket:WebSocket):
        self.id=db_palyer.id
        self.name=db_palyer.name
        self.score=db_palyer.score
        self.is_guessed=db_palyer.is_guessed
        self.role=db_palyer.role
        
        #runtime
        self.websocket=websocket
        

# class InMemoryPlayer:
#     def __init__(self,db_palyer:Player,websocket:WebSocket):
#         self.db_palyer=db_palyer
#         #runtime
#         self.websocket=websocket 
    # @property
    # def name(self):
    #     return self.db_player.name       


# room={} --- it will be lost when we restart the server again
# so we're gonna use redis to avoid this

def create_room_state(room_id:int,max_player:int):
    room_data={
        "players":[],
        "canvas_event":[],
        "status":"waiting",
        "max_palyers":max_player
    }
    
    r.set(f"room:{room_id}",json.dumps(room_data))
    
    
def get_room_state(room_id:int):
    data=r.get(f"room:{room_id}")    
    return json.loads(data) if data else None

def update_room_state(room_id:int,data:dict):
    r.set(f"room:{room_id}",json.dumps(data))
    
