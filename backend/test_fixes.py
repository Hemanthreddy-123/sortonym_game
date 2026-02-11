import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"

def test_game_flow():
    print("\n--- Testing Game Flow (Start -> Submit) ---")
    start_url = f"{BASE_URL}/game/start"
    submit_url = f"{BASE_URL}/game/submit"
    
    # Start Game
    try:
        start_res = requests.post(start_url, json={"level": "easy"})
        if start_res.status_code != 200:
            print(f"❌ Start Game Failed: {start_res.status_code} - {start_res.text}")
            return
        
        data = start_res.json()
        round_id = data.get('round_id')
        anchor = data.get('anchor_word')
        print(f"✅ Game Started: ID={round_id}, Word='{anchor}'")
        
        if round_id == 0:
             print("⚠️ Warning: round_id is 0. This might be okay if it's the first word in DB, but usually means fallback/mock object if not fixed.")

        # Submit Game (Empty submission just to check ID validity)
        submit_payload = {
            "roundId": round_id,
            "synonyms": [],
            "antonyms": [],
            "timeTaken": 10,
            "level": "easy"
        }
        
        submit_res = requests.post(submit_url, json=submit_payload)
        if submit_res.status_code == 200:
             print(f"✅ Submit Success! Score: {submit_res.json().get('score')}")
        else:
             print(f"❌ Submit Failed: {submit_res.status_code} - {submit_res.text}")

    except Exception as e:
        print(f"❌ Exception: {e}")

def test_randomness():
    print("\n--- Testing Word Randomness (5 calls) ---")
    start_url = f"{BASE_URL}/game/start"
    words = []
    
    for i in range(5):
        try:
            res = requests.post(start_url, json={"level": "easy"})
            if res.status_code == 200:
                word = res.json().get('anchor_word')
                words.append(word)
                print(f"Call {i+1}: {word}")
            else:
                print(f"Call {i+1}: Failed ({res.status_code})")
            time.sleep(0.5) # small delay
        except Exception as e:
            print(f"Call {i+1}: Exception {e}")

    unique_words = set(words)
    print(f"\nUnique words: {len(unique_words)}/{len(words)}")
    if len(unique_words) > 1:
        print("✅ Randomness Verified (more than 1 unique word)")
    else:
        print("⚠️ Warning: All words are the same. Check if fallback is always triggered or randomization is broken.")

if __name__ == "__main__":
    test_game_flow()
    test_randomness()
