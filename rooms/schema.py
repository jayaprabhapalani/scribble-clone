from pydantic import BaseModel,ConfigDict,model_validator,Field
from datetime import datetime
from typing import List,Optional
from players.schema import PlayerResponse

class CreateRoom(BaseModel):
    name:str
    is_private:bool=False
    password:Optional[str]=None
    max_players:int=Field(
        default=5,
        ge=2, # min players
        le=12 # max players 
        
    )
    
    #validation logic for password
    @model_validator(mode="after")
    def validate_password(self):
        if self.is_private and not self.password:
            raise ValueError("Private rooms must have a password")
        
        if not self.is_private and self.password:
            raise ValueError("Public rooms should not have a password")
        
        return self
    
    
class RoomResponse(BaseModel):
    id:int
    name:str
    status:str
    is_private:bool
    players:List[PlayerResponse]
    
    model_config=ConfigDict(from_attributes=True)
        
class joinRoom(BaseModel):
    user_name:str
    room_id:int
    password:Optional[str]=None
    
    
            
        