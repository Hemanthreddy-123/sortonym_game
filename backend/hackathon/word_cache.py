import json
import time
import random
import threading
from typing import Dict, List, Optional
from django.core.cache import cache
from django.conf import settings
import requests
import wordfreq

class WordCache:
    """
    High-performance word caching system with pre-populated cache and async fetching.
    Reduces API calls from 2+ per game to near-zero after initial warmup.
    """
    
    CACHE_TIMEOUT = 86400  # 24 hours
    PREPOPULATE_COUNT = 100  # Number of words to pre-populate per difficulty
    LOCK_TIMEOUT = 30  # Seconds
    
    def __init__(self):
        self._lock = threading.Lock()
        self._cache_key_prefix = "word_cache_"
        self._difficulty_keys = {
            'easy': f"{self._cache_key_prefix}easy",
            'medium': f"{self._cache_key_prefix}medium", 
            'hard': f"{self._cache_key_prefix}hard"
        }
    
    def _get_cache_key(self, difficulty: str) -> str:
        return self._difficulty_keys.get(difficulty, self._difficulty_keys['easy'])
    
    def _fetch_word_data(self, word: str) -> Optional[Dict]:
        """Fetch synonyms and antonyms for a single word with optimized API calls."""
        try:
            # Make parallel requests to Datamuse API
            import concurrent.futures
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                syn_future = executor.submit(
                    requests.get, 
                    f'https://api.datamuse.com/words?rel_syn={word}', 
                    timeout=3
                )
                ant_future = executor.submit(
                    requests.get,
                    f'https://api.datamuse.com/words?rel_ant={word}',
                    timeout=3
                )
                
                syn_res = syn_future.result().json()
                ant_res = ant_future.result().json()
            
            # Filter and process results
            syns = [w['word'] for w in syn_res if w['word'].isalpha() and len(w['word']) > 2]
            ants = [w['word'] for w in ant_res if w['word'].isalpha() and len(w['word']) > 2]
            
            # Filter out the anchor word itself
            syns = [w for w in syns if w.lower() != word.lower()]
            ants = [w for w in ants if w.lower() != word.lower()]
            
            # Ensure minimum quality threshold
            if len(syns) >= 3 and len(ants) >= 3:
                return {
                    'word': word,
                    'synonyms': ','.join(syns[:12]),
                    'antonyms': ','.join(ants[:12]),
                    'cached_at': time.time()
                }
        except Exception as e:
            print(f"Error fetching word data for {word}: {e}")
        
        return None
    
    def _get_words_from_wordfreq(self, difficulty: str, count: int = 50) -> List[str]:
        """Get candidate words from wordfreq based on difficulty."""
        difficulty = difficulty.lower()
        
        # Define frequency ranges
        if difficulty == 'easy':
            start, end = 1000, 4000
        elif difficulty == 'medium':
            start, end = 4000, 10000
        else:  # hard
            start, end = 10000, 25000
        
        try:
            pool = wordfreq.top_n_list('en', end)[start:]
            filtered_pool = [
                w for w in pool 
                if w.isalpha() and len(w) > 3
            ]
            return random.sample(filtered_pool, min(count, len(filtered_pool)))
        except Exception as e:
            print(f"Error getting words from wordfreq: {e}")
            return []
    
    def _populate_difficulty_cache(self, difficulty: str):
        """Populate cache with words for a specific difficulty level."""
        cache_key = self._get_cache_key(difficulty)
        
        # Check if already populated
        cached_data = cache.get(cache_key)
        if cached_data and len(cached_data) >= self.PREPOPULATE_COUNT // 2:
            return
        
        # Get candidate words
        candidate_words = self._get_words_from_wordfreq(difficulty, self.PREPOPULATE_COUNT * 2)
        
        # Fetch word data in parallel
        valid_words = []
        import concurrent.futures
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_word = {
                executor.submit(self._fetch_word_data, word): word 
                for word in candidate_words[:self.PREPOPULATE_COUNT]
            }
            
            for future in concurrent.futures.as_completed(future_to_word, timeout=30):
                try:
                    word_data = future.result()
                    if word_data:
                        valid_words.append(word_data)
                        if len(valid_words) >= self.PREPOPULATE_COUNT:
                            break
                except Exception as e:
                    word = future_to_word[future]
                    print(f"Error processing {word}: {e}")
        
        # Update cache
        if valid_words:
            cache.set(cache_key, valid_words, self.CACHE_TIMEOUT)
            print(f"Populated {len(valid_words)} words for {difficulty} difficulty")
    
    def get_cached_word(self, difficulty: str) -> Optional[Dict]:
        """Get a random word from cache, populating cache if necessary."""
        cache_key = self._get_cache_key(difficulty)
        
        # Try to get from cache first
        cached_words = cache.get(cache_key)
        
        if not cached_words:
            # Cache is empty, populate it
            with threading.Lock():
                # Double-check after acquiring lock
                cached_words = cache.get(cache_key)
                if not cached_words:
                    self._populate_difficulty_cache(difficulty)
                    cached_words = cache.get(cache_key)
        
        if cached_words and len(cached_words) > 0:
            # Return a random word from cache
            return random.choice(cached_words)
        
        return None
    
    def add_word_to_cache(self, word_data: Dict, difficulty: str):
        """Add a new word to the cache."""
        cache_key = self._get_cache_key(difficulty)
        cached_words = cache.get(cache_key) or []
        
        # Add new word if not already present
        if not any(w['word'] == word_data['word'] for w in cached_words):
            cached_words.append(word_data)
            cache.set(cache_key, cached_words, self.CACHE_TIMEOUT)
    
    def warm_up_cache(self):
        """Warm up cache for all difficulty levels. Call this on server startup."""
        print("Warming up word cache...")
        for difficulty in ['easy', 'medium', 'hard']:
            try:
                self._populate_difficulty_cache(difficulty)
            except Exception as e:
                print(f"Error warming up {difficulty} cache: {e}")
        print("Word cache warm-up complete")

# Global instance
word_cache = WordCache()
