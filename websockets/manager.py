from typing import Dict,List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        #room_id--> list of websockets
        self.active_connections: Dict[int,List[WebSocket]]={}
        
    async def connect(self, room_id:int,websocket:WebSocket):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id]=[]
            
        self.active_connections[room_id].append(websocket)
        
    
    def disconnect(self,room_id:int , websocket:WebSocket):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            
        if not self.active_connections[room_id]:
            del self.active_connections[room_id]
            
    async def send_personal_message(self,websocket:WebSocket,message:dict):
        await websocket.send_json(message)
        
    async def broadcast(self,room_id:int,message:dict):
        if room_id not in self.active_connections:
            return
        
        for connection in self.active_connections[room_id]:
            try:
                await connection.send_json(message)
            except:
                self.disconnect(room_id,connection)                           


manager=ConnectionManager()