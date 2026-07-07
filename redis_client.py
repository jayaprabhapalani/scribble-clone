import os
import redis.asyncio as redis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

if REDIS_URL:
    r = redis.from_url(REDIS_URL, decode_responses=True)
    pubsub_r = redis.from_url(REDIS_URL, decode_responses=True)
else:
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    pubsub_r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
