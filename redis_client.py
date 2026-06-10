import redis.asyncio as redis
import asyncio
import json

r=redis.Redis(host="localhost",port=6379,decode_responses=True) # connection 1 — normal operations

# connection 2 -pub/sub only
pubsub_r=redis.Redis(host="localhost", port=6379, decode_responses=True) # subscribe, listen, publish
