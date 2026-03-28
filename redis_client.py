import redis.asyncio as redis
import asyncio
import json

r=redis.Redis(host="localhost",port=6379,decode_responses=True)