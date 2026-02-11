import json
import re
import random
import requests
import os
import io
import wordfreq
import base64
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from django.http import HttpRequest, JsonResponse
from django.views import View
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction

from .models import SortonymWord, GameResult, Lobby

SYSTEM_NAME = 'isl'
REGISTER_ROLE = 'isl_user'

# Fallback words to ensure game always starts if API/DB fails
FALLBACK_WORDS_LIST = [
    {
        "word": "happy",
        "synonyms": "joyful,cheerful,content,delighted,glad,ecstatic,elated,jubilant,merry,sunny",
        "antonyms": "sad,unhappy,miserable,depressed,gloomy,sorrowful,dejected,downcast,melancholy,glum"
    },
    {
        "word": "fast",
        "synonyms": "quick,rapid,swift,speedy,brisk,hasty,fleet,express,nimble,velocity",
        "antonyms": "slow,sluggish,leisurely,crawling,gradual,delayed,plodding,laggard,torpid,late"
    },
    {
        "word": "love",
        "synonyms": "adoration,affection,passion,devotion,fondness,tenderness,warmth,attachment,cherishing,worship",
        "antonyms": "hate,hatred,loathing,detestation,dislike,animosity,hostility,abhorrence,aversion,scorn"
    },
    {
        "word": "big",
        "synonyms": "huge,large,giant,enormous,massive,colossal,gigantic,immense,mammoth,vast",
        "antonyms": "small,tiny,little,miniature,minute,microscopic,petite,diminutive,compact,slight"
    },
    {
        "word": "hot",
        "synonyms": "boiling,scorching,searing,warm,heated,burning,sizzling,fiery,torrid,tropical",
        "antonyms": "cold,freezing,chilly,icy,frigid,frosty,glacial,cool,nippy,polar"
    },
    {
        "word": "brave",
        "synonyms": "courageous,fearless,bold,heroic,valiant,daring,plucky,intrepid,gallant,stouthearted",
        "antonyms": "cowardly,fearful,timid,afraid,scared,gutless,spineless,craven,shy,nervous"
    }
]

def _normalize_phone(raw: str) -> str:
    return re.sub(r'\D+', '', (raw or '').strip())

def _json_body(request: HttpRequest) -> dict:
    try:
        if not request.body:
            return {}
        return json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
        return {}

def _get_player_info(request: HttpRequest) -> dict:
    email = 'guest@sortonym.com'
    name = 'Guest'
    
    # 1. Try to get info from Authorization Header (JWT)
    auth_header = request.headers.get('Authorization', '')
    if 'Bearer ' in auth_header:
        try:
            token = auth_header.split(' ')[1]
            # Decode JWT payload (no signature verification for now, just extraction)
            payload_part = token.split('.')[1]
            padded = payload_part + '=' * (4 - len(payload_part) % 4)
            decoded_bytes = base64.b64decode(padded)
            jwt_payload = json.loads(decoded_bytes)
            
            if 'email' in jwt_payload:
                email = jwt_payload['email']
            if 'name' in jwt_payload:
                name = jwt_payload['name']
            
            # If we found an email in token, return immediately
            if email != 'guest@sortonym.com':
                 return {'email': email, 'name': name}
        except Exception as e:
            print(f"JWT Decode Error: {e}")
            pass

    # 2. Fallback to Request Body
    try:
        payload = _json_body(request)
        if payload:
            email = payload.get('email') or payload.get('player_email') or email
            # Support all possible name keys including displayName from join page
            name = payload.get('name') or payload.get('player_name') or payload.get('displayName') or name
            if name == 'Guest' and email != 'guest@sortonym.com':
                 name = email.split('@')[0]
    except Exception:
        pass
        
    uid = email
    if email == 'guest@sortonym.com' and name and name != 'Guest':
        # Generate unique ID for guests based on name to prevent lobby overlap
        # Using a normalized name as part of the ID string
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', name.lower().strip())
        uid = f"guest_{safe_name}"

    return {'email': email, 'name': name, 'uid': uid}

def get_words_from_wordfreq(difficulty='easy'):
    """
    Ultra-fast word selection using wordfreq library only - sub-second target.
    - Easy: 3 pairs (6 words total: 3 synonyms + 3 antonyms)
    - Medium: 4 pairs (8 words total: 4 synonyms + 4 antonyms)  
    - Hard: 5 pairs (10 words total: 5 synonyms + 5 antonyms)
    """
    difficulty = difficulty.lower()
    
    # Define word counts based on difficulty
    if difficulty == 'easy':
        pairs_needed = 3
        wordfreq_range = (500, 1500)  # Very common words
    elif difficulty == 'medium':
        pairs_needed = 4
        wordfreq_range = (1500, 4000)  # Common words
    else: # hard or daily
        pairs_needed = 5
        wordfreq_range = (4000, 8000)  # Less common words

    try:
        # Get random sample from wordfreq list for variety
        start, end = wordfreq_range
        # Fetch a larger slice (e.g., 500 words) and pick random starting point
        total_available = end - start
        random_offset = random.randint(0, max(0, total_available - 200))
        
        slice_start = start + random_offset
        word_list = wordfreq.top_n_list('en', end)[slice_start:slice_start+150]
        
        # Filter for suitable words - very strict for speed
        candidates = [
            word for word in word_list 
            if word.isalpha() and 4 <= len(word) <= 8  # Tight length range
        ][:12]  # Increased to 12 candidates
        
        # Ultra-fast parallel API calls with aggressive timeouts
        import concurrent.futures
        
        def fetch_word_data(word):
            try:
                # Extremely fast API calls
                with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                    syn_future = executor.submit(
                        requests.get, 
                        f'https://api.datamuse.com/words?rel_syn={word}', 
                        timeout=0.6
                    )
                    ant_future = executor.submit(
                        requests.get,
                        f'https://api.datamuse.com/words?rel_ant={word}',
                        timeout=0.6
                    )
                    
                    syn_res = syn_future.result(timeout=0.8).json()
                    ant_res = ant_future.result(timeout=0.8).json()
                
                syns = [w['word'] for w in syn_res[:15] if w['word'].isalpha() and len(w['word']) > 2]
                ants = [w['word'] for w in ant_res[:15] if w['word'].isalpha() and len(w['word']) > 2]
                
                # Filter out the word itself
                syns = [w for w in syns if w.lower() != word.lower()]
                ants = [w for w in ants if w.lower() != word.lower()]
                
                if len(syns) >= pairs_needed and len(ants) >= pairs_needed:
                    return {
                        'word': word,
                        'synonyms': ','.join(syns[:12]), # Store up to 12
                        'antonyms': ','.join(ants[:12])
                    }
            except:
                pass
            return None
        
        # Test all candidates simultaneously for maximum speed
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(fetch_word_data, word) for word in candidates]
            
            # Return first successful result immediately
            for future in concurrent.futures.as_completed(futures, timeout=1):
                result = future.result()
                if result:
                    return result
        
        return None
        
    except Exception as e:
        print(f"Word selection failed: {e}")
        return None

class HealthView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        return JsonResponse({'status': 'ok'})

class ApiCertificateView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        player_name = request.GET.get('name', 'Player')
        score = request.GET.get('score', '0')
        level = request.GET.get('level', 'N/A')
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Simple Certificate Design
        p.setFont("Helvetica-Bold", 30)
        p.drawCentredString(300, 700, "CERTIFICATE OF ACHIEVEMENT")
        
        p.setFont("Helvetica", 18)
        p.drawCentredString(300, 650, "This is to certify that")
        
        p.setFont("Helvetica-Bold", 24)
        p.drawCentredString(300, 600, player_name.upper())
        
        p.setFont("Helvetica", 18)
        p.drawCentredString(300, 550, f"has successfully completed the Sortonym Challenge")
        p.drawCentredString(300, 520, f"Difficulty: {level.capitalize()}")
        p.drawCentredString(300, 490, f"Final Score: {score}")
        
        p.setFont("Helvetica-Oblique", 14)
        p.drawCentredString(300, 400, f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M')}")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        pdf_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        
        return JsonResponse({'certificate_base64': pdf_base64})


LEVEL_CONFIG = {
    'easy': {'time': 90, 'pairs': 3, 'multiplier': 1.0},
    'medium': {'time': 60, 'pairs': 4, 'multiplier': 1.2},
    'hard': {'time': 45, 'pairs': 5, 'multiplier': 1.5},
}


class ApiGameStartView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        player_info = _get_player_info(request)
        
        payload = _json_body(request)
        level = (payload.get('level') or 'easy').lower()
        exclude_words = payload.get('excludeWords', [])  # Get excluded words list
        
        # DAILY CHALLENGE VALIDATION
        if level == 'daily':
            email = player_info['email']
            
            # Check if played today
            today = timezone.now().date()
            if GameResult.objects.filter(player_email=email, created_at__date=today).exists():
                return JsonResponse({'error': 'You have already played the Daily Challenge today.'}, status=403)
                
            config = LEVEL_CONFIG['hard']
        elif level not in LEVEL_CONFIG:
            level = 'easy'
            config = LEVEL_CONFIG[level]
        else:
            config = LEVEL_CONFIG[level]

        word_obj = None
        
        # Try to get a unique word that's not in the exclude list
        max_attempts = 5
        for attempt in range(max_attempts):
            dynamic_data = get_words_from_wordfreq(level)
            
            if dynamic_data and dynamic_data['word'] not in exclude_words:
                try:
                    word_obj, _ = SortonymWord.objects.get_or_create(
                        word=dynamic_data['word'],
                        defaults={
                            'synonyms': dynamic_data['synonyms'],
                            'antonyms': dynamic_data['antonyms']
                        }
                    )
                    # Update synonyms/antonyms if they are empty or just to refresh
                    if not word_obj.synonyms or not word_obj.antonyms:
                         word_obj.synonyms = dynamic_data['synonyms']
                         word_obj.antonyms = dynamic_data['antonyms']
                         word_obj.save()
                    break  # Success, exit the loop
                except Exception as e:
                    print(f"Error saving dynamic word: {e}")
                    word_obj = None
                    continue  # Try next attempt
        
        # If wordfreq fails or save fails, use fallback words (also check exclude list)
        if not word_obj:
            available_fallbacks = [
                fallback for fallback in FALLBACK_WORDS_LIST 
                if fallback['word'] not in exclude_words
            ]
            
            if available_fallbacks:
                fallback = random.choice(available_fallbacks)
                try:
                    word_obj, _ = SortonymWord.objects.get_or_create(
                        word=fallback['word'],
                        defaults={
                            'synonyms': fallback['synonyms'],
                            'antonyms': fallback['antonyms']
                        }
                    )
                except Exception as e:
                    print(f"Error saving fallback word: {e}")
                    return JsonResponse({'error': 'Database error initializing game'}, status=500)
            else:
                # All fallback words are excluded, return error
                return JsonResponse({'error': 'No available words for this round'}, status=500)

        # Parse synonyms/antonyms
        all_syns = [s.strip() for s in word_obj.synonyms.split(',') if s.strip()]
        all_ants = [a.strip() for a in word_obj.antonyms.split(',') if a.strip()]

        num_pairs = config['pairs']
        safe_pairs = min(len(all_syns), len(all_ants), num_pairs)
        
        # If valid pairs are less than config but we have at least 1, just use what we have
        if safe_pairs < 1:
            # Should not happen with our fallback, but just in case
             return JsonResponse({'error': 'Word configuration error (no pairs)'}, status=500)

        start_syns = random.sample(all_syns, safe_pairs)
        start_ants = random.sample(all_ants, safe_pairs)

        game_words = []
        for w in start_syns:
            game_words.append({'id': f'syn_{w}', 'word': w})
        for w in start_ants:
            game_words.append({'id': f'ant_{w}', 'word': w})

        random.shuffle(game_words)

        return JsonResponse({
            'round_id': word_obj.id,
            'anchor_word': word_obj.word,
            'words': game_words,
            'time_limit': config['time'],
            'level': level 
        })


class ApiGameSubmitView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        player_info = _get_player_info(request)
        email = player_info['email']
        player_name = player_info['name']
        
        payload = _json_body(request)
        round_id = payload.get('roundId')
        synonym_ids = payload.get('synonyms', [])
        antonym_ids = payload.get('antonyms', [])
        time_taken = float(payload.get('timeTaken') or 0)
        level = (payload.get('level') or 'easy').lower()

        if level not in LEVEL_CONFIG:
            level = 'easy'
        config = LEVEL_CONFIG[level]
        
        try:
            word_obj = SortonymWord.objects.get(id=round_id)
        except SortonymWord.DoesNotExist:
            return JsonResponse({'error': 'Invalid round ID'}, status=400)

        true_syns = set(s.strip().lower() for s in word_obj.synonyms.split(','))
        true_ants = set(a.strip().lower() for a in word_obj.antonyms.split(','))

        correct_count = 0
        
        def extract_word(wid):
            if '_' in wid:
                return wid.split('_', 1)[1]
            return wid

        for wid in synonym_ids:
            w = extract_word(wid).strip().lower()
            if w in true_syns:
                correct_count += 1
                
        for wid in antonym_ids:
            w = extract_word(wid).strip().lower()
            if w in true_ants:
                correct_count += 1
        
        base_scores_val = correct_count * 1.0
        total_expected = config['pairs'] * 2
        total_expected = max(total_expected, 1)

        time_limit = config['time']
        remaining = max(0, time_limit - time_taken)
        
        time_bonus = (remaining * 0.1) * (correct_count / float(total_expected))
        
        subtotal = base_scores_val + time_bonus
        total_score = subtotal * config['multiplier']
        
        # Save Result
        GameResult.objects.create(
            player_email=email,
            player_name=player_name,
            round_id=round_id,
            score=total_score,
            total_correct=correct_count,
            time_taken=time_taken
        )

        # Multiplayer Sync
        game_code = (payload.get('gameCode') or '').strip().upper()
        if game_code:
            try:
                with transaction.atomic():
                    lobby = Lobby.objects.select_for_update().get(code=game_code)
                    results = list(lobby.results_data)
                    
                    # Identify player's team from players_data using unique uid
                    user_id = player_info['uid']
                    player_data = next((p for p in lobby.players_data if p['id'] == user_id), None)
                    
                    # If player not found in lobby players_data, they shouldn't be submitting to this lobby
                    if not player_data:
                        print(f"Warning: Submission from UID {user_id} not found in lobby {game_code}")
                        selected_team = payload.get('team', 'A') 
                    else:
                        selected_team = player_data.get('team', 'A')
                    
                    results.append({
                        'player': player_name,
                        'player_email': email,
                        'player_id': user_id,
                        'team': selected_team,
                        'score': total_score,
                        'total_correct': correct_count,
                        'time_taken': time_taken,
                        'timestamp': timezone.now().isoformat()
                    })
                    lobby.results_data = results
                    lobby.save()
            except Lobby.DoesNotExist:
                pass
        
        return JsonResponse({
            'score': total_score,
            'base_score': base_scores_val,
            'time_bonus': time_bonus,
            'total_correct': correct_count,
            'max_score': (total_expected + 30) * config['multiplier']
        })


class ApiLeaderboardView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        # Get top scores ordered by score descending
        # Fetching a larger limit (100) to ensure we can find 20 unique players
        
        period = request.GET.get('period')
        query = GameResult.objects.all()

        if period == 'today':
            query = query.filter(created_at__date=timezone.now().date())
            
        top_scores = query.order_by('-score')[:100]
        
        data = []
        seen_emails = set()
        
        for res in top_scores:
            if res.player_email in seen_emails:
                continue
                
            seen_emails.add(res.player_email)
            data.append({
                'player_email': res.player_email,
                'player_name': res.player_name or res.player_email.split('@')[0],
                'score': res.score,
                'total_correct': res.total_correct,
                'time_taken': res.time_taken,
                'date': res.created_at.strftime('%Y-%m-%d %H:%M')
            })
            
            if len(data) >= 20:
                break
            
        return JsonResponse({'leaderboard': data})


class ApiGoogleLoginView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        return JsonResponse({'error': 'Authentication is disabled'}, status=410)


# --- TEAM LOBBY API (In-Memory for Real-Time Sync) ---

# Global lobbies in-memory is removed in favor of the Lobby model

@method_decorator(csrf_exempt, name='dispatch')
class ApiLobbyCreateView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        try:
            print("ApiLobbyCreateView: POST received")
            try:
                player_info = _get_player_info(request)
                print(f"Player info parsed: {player_info}")
            except Exception as e:
                print(f"Error in _get_player_info: {e}")
                raise e

            user_email = player_info['email']
            user_name = player_info['name']
            user_id = player_info['uid'] # Unique ID (Email or guest_name)
            
            payload = _json_body(request)
            team_name = payload.get('teamName', 'Team A')
            
            # Generate Code
            code = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=6))
            print(f"Generated lobby code: {code}")
            
            # Init Lobby
            lobby = Lobby.objects.create(
                code=code,
                host_email=user_id, # Store unique ID as host identifier
                host_name=user_name,
                settings={'team_name': team_name, 'difficulty': 'MEDIUM'},
                players_data=[{
                    'id': user_id,
                    'name': user_name,
                    'team': None, # Host must also select team manually
                    'isHost': True
                }]
            )
            print("Lobby created successfully")
        except Exception as e:
            print(f"ApiLobbyCreateView ERROR: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': f'Internal Server Error: {str(e)}'}, status=500)
        
        return JsonResponse({
            'code': code, 
            'lobby': {
                'code': lobby.code,
                'host': lobby.host_email,
                'hostName': lobby.host_name,
                'status': lobby.status,
                'players': lobby.players_data
            }
        })


def _get_lobby_response(lobby):
    """Helper to format lobby data consistently for the frontend."""
    players = lobby.players_data
    teams = {'unassigned': []} # Always have an unassigned bucket
    
    # 1. Dynamically group players into teams (supports 2, 10, 22+ teams)
    for p in players:
        team_id = p.get('team')
        if not team_id:
            teams['unassigned'].append(p)
        else:
            if team_id not in teams:
                teams[team_id] = []
            teams[team_id].append(p)
    
    # 2. Identify all players who have been assigned to ANY team
    active_pids = [p.get('id') for p in players if p.get('team') is not None]
    
    # 3. Calculate completion map from actual submissions
    comp_map = {}
    for r in lobby.results_data:
        pid = r.get('player_id') or r.get('player_email')
        if pid:
            comp_map[pid] = comp_map.get(pid, 0) + 1
            
    # 4. Global synchronization: Everyone assigned to a team must finish 5 rounds
    all_finished = len(active_pids) > 0 and all(comp_map.get(pid, 0) >= 5 for pid in active_pids)
    
    return {
        'code': lobby.code,
        'host': lobby.host_email,
        'hostName': lobby.host_name,
        'status': lobby.status,
        'players': players,
        'teams': teams,
        'difficulty': lobby.settings.get('difficulty', 'MEDIUM'),
        'teamSize': lobby.settings.get('teamSize', '10'),
        'teamName': lobby.settings.get('team_name', 'Team Battle'),
        'results': lobby.results_data,
        'all_finished': all_finished
    }

@method_decorator(csrf_exempt, name='dispatch')
class ApiLobbyJoinView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        player_info = _get_player_info(request)
        user_id = player_info['uid']
        user_name = player_info['name']
        
        payload = _json_body(request)
        code = (payload.get('code') or '').upper().strip()
        display_name = (payload.get('displayName') or user_name).strip()
        
        if not display_name:
             return JsonResponse({'error': 'Name is required'}, status=400)
        
        try:
            with transaction.atomic():
                lobby = Lobby.objects.select_for_update().get(code=code)
                
                # Check Name Duplication (Case insensitive)
                players = list(lobby.players_data)
                for p in players:
                    # If names match but IDs differ, it's a duplicate
                    if p['name'].lower() == display_name.lower() and p['id'] != user_id:
                        return JsonResponse({'error': f'Name "{display_name}" is already taken'}, status=400)
                
                # Add player if not exists
                existing_player = next((p for p in players if p['id'] == user_id), None)
                if not existing_player:
                    players.append({
                        'id': user_id,
                        'name': display_name,
                        'team': None, # Default to None (Unassigned) - User MUST select team
                        'isHost': False,
                        'picture': player_info.get('picture')
                    })
                    lobby.players_data = players
                    lobby.save()
                else:
                    # Update name if changed?
                    if existing_player['name'] != display_name:
                        existing_player['name'] = display_name
                        lobby.players_data = players
                        lobby.save()
                
                return JsonResponse(_get_lobby_response(lobby))
        except Lobby.DoesNotExist:
            return JsonResponse({'error': 'Lobby not found'}, status=404)


class ApiLobbyStatusView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        code = request.GET.get('code', '').upper().strip()
        try:
            lobby = Lobby.objects.get(code=code)
        except Lobby.DoesNotExist:
            return JsonResponse({'error': 'Lobby not found'}, status=404)
            
        return JsonResponse(_get_lobby_response(lobby))


@method_decorator(csrf_exempt, name='dispatch')
class ApiLobbyUpdateView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        player_info = _get_player_info(request)
        user_id = player_info['uid']
        
        payload = _json_body(request)
        code = (payload.get('code') or '').upper().strip()
        action = payload.get('action') 
        
        try:
            with transaction.atomic():
                lobby = Lobby.objects.select_for_update().get(code=code)
                
                if action == 'join_team':
                    team = payload.get('team') # Can be 'A', 'B', '1', '2' ... '22'
                    if not team:
                        return JsonResponse({'error': 'Team name is required'}, status=400)
                    
                    players = list(lobby.players_data)
                    found = False
                    for p in players:
                        if p['id'] == user_id:
                            p['team'] = team
                            found = True
                            break
                    
                    if not found:
                         return JsonResponse({'error': 'Player not in lobby'}, status=403)
                         
                    lobby.players_data = players
                    lobby.save()
                    
                elif action == 'leave_team':
                    players = list(lobby.players_data)
                    for p in players:
                        if p['id'] == user_id:
                            p['team'] = None # Reset to unassigned
                            break
                    lobby.players_data = players
                    lobby.save()

                elif action == 'set_difficulty':
                    if lobby.host_email != user_id:
                        return JsonResponse({'error': 'Only host can change difficulty'}, status=403)
                    s = lobby.settings
                    s['difficulty'] = payload.get('difficulty')
                    lobby.settings = s
                    lobby.save()

                elif action == 'start_game':
                    if lobby.host_email != user_id:
                        return JsonResponse({'error': 'Only host can start game'}, status=403)
                    
                    # Dynamic Team Validation
                    assigned_teams = set(p.get('team') for p in lobby.players_data if p.get('team'))
                    unassigned_count = sum(1 for p in lobby.players_data if not p.get('team'))
                    
                    if len(assigned_teams) < 2:
                        return JsonResponse({'error': 'At least two teams are required to start the game'}, status=400)
                    
                    if unassigned_count > 0:
                         return JsonResponse({'error': f'All {unassigned_count} players must select a team'}, status=400)

                    lobby.status = 'STARTED'
                    lobby.results_data = [] # Critical for synchronization
                    lobby.save()
                
                return JsonResponse(_get_lobby_response(lobby))

        except Lobby.DoesNotExist:
            return JsonResponse({'error': 'Lobby not found'}, status=404)

#get results Api
class ApiGetResultsView(View):
    def get(self, request: HttpRequest, code) -> JsonResponse:
        try:
            lobby = Lobby.objects.get(code=code)
            return JsonResponse(_get_lobby_response(lobby))
        except Lobby.DoesNotExist:
            return JsonResponse({'error': 'Lobby not found'}, status=404)

class ApiGameScoreView(View):
    """Returns the latest score for the current player."""
    def get(self, request: HttpRequest) -> JsonResponse:
        player_info = _get_player_info(request)
        email = player_info['email']
        
        last_result = GameResult.objects.filter(player_email=email).order_by('-created_at').first()
        if not last_result:
            return JsonResponse({'error': 'No scores found'}, status=404)
            
        return JsonResponse({
            'score': last_result.score,
            'total_correct': last_result.total_correct,
            'time_taken': last_result.time_taken,
            'created_at': last_result.created_at
        })
