from fastapi import APIRouter
from sqlalchemy import select
from database import SessionLocal
from players.model import Player

router=APIRouter()

@router.get("/leaderboard")
async def get_leaderboard():
    async with SessionLocal() as db:
        result = await db.execute(
            select(Player.name,Player.score)
            .order_by(Player.score.desc())
            .limit(10)
        )
        
        rows=result.all()
        
        #convert to clean json
        leaderboard=[
            {"rank":idx+1 ,"name":row.name, "score":row.score } 
            for idx,row in enumerate(rows)
        ]
        
        return leaderboard