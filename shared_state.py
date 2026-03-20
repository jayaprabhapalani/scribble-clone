from fastapi import WebSocket
from players.model import Player

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


room={}
