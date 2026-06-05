from typing import Dict,List
from fastapi import WebSocket
import asyncio
import json
from redis_client import redis

class ConnectionManager:
    def __init__(self): 
        self.active_connections: Dict[int,Dict[int,WebSocket]]={} # room_id -> { player_id: websocket }
        self.listener_tasks={} #room_id -> asynico.Task ( for pub/sub)
        
    async def connect(self, room_id:int,player_id:int , websocket:WebSocket):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id]={}
            
            # pub/sub --> first player on this server -> start listener
            self.listener_tasks[room_id]=asyncio.create_task(self.listen_to_channel(room_id))     
            
        self.active_connections[room_id][player_id]=websocket
        
    
    def disconnect(self,room_id:int,player_id:int):
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(player_id,None)
        #delete room if empty    
        if not self.active_connections[room_id]:
            del self.active_connections[room_id]
            # pub/sub --> last player left-> cancel listener
            task=self.listener_tasks.pop(room_id,None)
            if task:
                task.cancel()
    
    #pub/sub listener
    async def listen_to_channel(self,room_id:int): 
        async with redis.pubsub() as ps:
            await ps.subscribe(f'room:{room_id}')
            async for message in ps.listen():
                if message["type"]=="message":
                    data=json.loads(message["data"])
                    exclude_id=data.pop("exclude_id",None)
                    await self.broadcast(room_id,data,exclude=exclude_id)           
            
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