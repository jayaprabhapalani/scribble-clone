from typing import Dict,List
from fastapi import WebSocket
import asyncio
import json
from redis_client import pubsub_r

class ConnectionManager:
    def __init__(self): 
        self.active_connections: Dict[int,Dict[int,WebSocket]]={} # room_id -> { player_id: websocket }
        self.listener_tasks={} #room_id -> asynico.Task ( for pub/sub)
        
    async def connect(self, room_id:int,player_id:int , websocket:WebSocket):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id]={}

        self.active_connections[room_id][player_id]=websocket

        # start listener if not already running
        if room_id not in self.listener_tasks or self.listener_tasks[room_id].done():
            self.listener_tasks[room_id]=asyncio.create_task(self.listen_to_channel(room_id))
        
    
    def disconnect(self,room_id:int,player_id:int):
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(player_id,None)
        #delete room if empty    
        if room_id in self.active_connections and not self.active_connections[room_id]:
            del self.active_connections[room_id]
            # pub/sub --> last player left-> cancel listener
            task=self.listener_tasks.pop(room_id,None)
            if task:
                task.cancel()
    
    #pub/sub listener
    async def listen_to_channel(self,room_id:int): 
        print(f"[PUBSUB] Started listener for room {room_id}")
        async with pubsub_r.pubsub() as ps:
            await ps.subscribe(f'room:{room_id}')
            async for message in ps.listen():
                if message["type"]=="message":
                    try:
                        data=json.loads(message["data"])
                        exclude_id=data.pop("exclude_id",None)
                        print(f"[PUBSUB] room {room_id} got event={data.get('event')} exclude={exclude_id} connections={list(self.active_connections.get(room_id,{}).keys())}")
                        await self.broadcast(room_id,data,exclude=exclude_id)
                    except Exception as e:
                        print(f"[PUBSUB] Error: {e}")
            
    async def send_personal_message(self,websocket:WebSocket,message:dict):
        await websocket.send_json(message)
        
    async def broadcast(self,room_id:int,message:dict,exclude:int=None):
        if room_id not in self.active_connections:
            return
        
        dead = []
        for pid,ws in list(self.active_connections.get(room_id,{}).items()):
           if exclude is not None and int(pid) == int(exclude):
               continue
           try:
               await ws.send_json(message)
           except Exception:
               dead.append(pid)
        
        for pid in dead:
            self.active_connections[room_id].pop(pid, None)


manager=ConnectionManager()