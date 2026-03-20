from pydantic import BaseModel,ConfigDict

class PlayerResponse(BaseModel):
    id:int
    name:str
    score:int
    is_guessed:bool
    role:str
    
    model_config=ConfigDict(from_attributes=True)