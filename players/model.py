from database import Base
from sqlalchemy import Column,Integer,String,Boolean,ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import Enum
from enum import Enum as PyEnum

#player role option
class PlayerRole(PyEnum):
    DRAWER="drawer"
    GUESSER="guesser"

class Player(Base):
    __tablename__="players"
    
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,nullable=False)
    
    role=Column(Enum(PlayerRole),default=PlayerRole.GUESSER)
    score=Column(Integer,default=0)
    is_guessed=Column(Boolean,default=False) 
    
    room_id=Column(Integer,ForeignKey("rooms.id")) 
    room=relationship("Room",back_populates="players")
    
      