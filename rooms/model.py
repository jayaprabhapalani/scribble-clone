from database import Base
from sqlalchemy import Column,Integer,String,Boolean
from sqlalchemy.orm import relationship


class Room(Base):
    __tablename__="rooms"
    
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,nullable=False)
    status=Column(String,default="waiting")
    is_private=Column(Boolean,default=False)
    password=Column(String,nullable=True)
    max_players=Column(Integer,default=5,max=16,min=2)
    
    # relationship
    players=relationship("Player",back_populates="room")

    
    
   
    
    