def mask_word(word: str) -> str:
    return " ".join("_" if ch != " " else " " for ch in word)