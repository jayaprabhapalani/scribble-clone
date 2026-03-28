from typing import Dict,List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # room_id -> { player_id: websocket }
        self.active_connections: Dict[int,Dict[int,WebSocket]]={}
        
    async def connect(self, room_id:int,player_id:int , websocket:WebSocket):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id]={}
            
        self.active_connections[room_id][player_id]=websocket
        
    
    def disconnect(self,room_id:int,player_id:int):
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(player_id,None)
        #delete room if empty    
        if not self.active_connections[room_id]:
            del self.active_connections[room_id]
            
    async def send_personal_message(self,websocket:WebSocket,message:dict):
        await websocket.send_json(message)
        
    async def broadcast(self,room_id:int,message:dict,exclude:int=None):
        if room_id not in self.active_connections:
            return
        
        #exclude the drawer to avoid the Drawer receives their own draw event
        for pid,ws in self.active_connections.get(room_id,{}).items():
           if pid!=exclude:
               await ws.send_json(message)                       


manager=ConnectionManager()