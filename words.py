import random

WORDS=[
     "apple",
    "car",
    "house",
    "tree",
    "dog",
    "cat",
    "river",
    "mountain",
    "phone",
    "computer",
    "book",
    "chair",
    "sun",
    "moon",
    "star"
]

def get_random_word()-> str:
    return random.choice(WORDS)