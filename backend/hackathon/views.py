import json
import re
import random
import requests
import os

from django.http import HttpRequest, JsonResponse
from django.views import View
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from .auth import (
    ExternalAuthError,
    create_signed_otp_challenge,
    create_signed_session,
    is_success_response,
    load_signed_otp_challenge,
    load_signed_session,
    post_form_json,
    require_env,
)
from .models import SortonymWord, GameResult

SYSTEM_NAME = 'isl'
REGISTER_ROLE = 'isl_user'


def _normalize_phone(raw: str) -> str:
    return re.sub(r'\D+', '', (raw or '').strip())


def _get_bearer_token(request: HttpRequest) -> str | None:
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None

    prefix = 'Bearer '
    if not auth_header.startswith(prefix):
        return None

    token = auth_header[len(prefix) :].strip()
    return token or None


def _get_session_payload(request: HttpRequest) -> dict | None:
    token = _get_bearer_token(request)
    if not token:
        return None
    try:
        return load_signed_session(token)
    except ExternalAuthError:
        return None


def _json_body(request: HttpRequest) -> dict:
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return {}


def _external_error_message(result: dict, default: str) -> str:
    return result.get('error') or result.get('message') or default


def _external_success_message(result: dict) -> str | None:
    message = (result.get('message') or result.get('status') or '').strip()
    return message or None


def _post_external_or_error(
    *,
    url_env: str,
    payload: dict[str, str],
    failure_status: int,
    failure_default_message: str,
) -> tuple[dict | None, JsonResponse | None]:
    try:
        url = require_env(url_env)
    except ExternalAuthError as exc:
        return None, JsonResponse({'error': str(exc)}, status=500)

    try:
        result = post_form_json(url=url, payload=payload)
    except ExternalAuthError as exc:
        return None, JsonResponse({'error': str(exc)}, status=502)

    if not is_success_response(result):
        message = _external_error_message(result, failure_default_message)
        return None, JsonResponse({'error': message}, status=failure_status)

    return result, None


class HealthView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        return JsonResponse({'status': 'ok'})


class ApiLoginView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        username_raw = (payload.get('username') or '').strip()
        password = (payload.get('password') or '').strip()

        if not username_raw or not password:
            return JsonResponse({'error': 'Please enter username and password.'}, status=400)

        # ADMIN OVERRIDE FOR TESTING
        if username_raw == 'admin.test@sortonym.com':
            if password == 'Admin@12345':
                # Mock successful result
                result = {
                    'status': 'success',
                    'message': 'Admin Login Successful',
                    'display_name': 'Sortonym Admin',
                    'phone_number': '1234567890',
                    'user_id': 99999,
                    'is_admin': True
                }
                
                session_payload = {'email': username_raw}
                session_payload.update(result)
                raw_token, expires_at = create_signed_session(payload=session_payload)

                return JsonResponse(
                    {
                        'token': raw_token,
                        'expires_at': expires_at.isoformat(),
                        'user': {
                            'id': 99999,
                            'username': username_raw,
                        },
                    }
                )
            else:
                return JsonResponse({'error': 'Invalid admin password'}, status=401)

        result, error = _post_external_or_error(
            url_env='LOGIN_THROUGH_PASSWORD_URL',
            payload={
                'email': username_raw,
                'password': password,
                'system_name': SYSTEM_NAME,
            },
            failure_status=401,
            failure_default_message='Invalid username or password.',
        )
        if error:
            return error

        session_payload = {'email': username_raw}
        session_payload.update(result or {})
        raw_token, expires_at = create_signed_session(payload=session_payload)

        return JsonResponse(
            {
                'token': raw_token,
                'expires_at': expires_at.isoformat(),
                'user': {
                    'id': None,
                    'username': username_raw,
                },
            }
        )


class ApiForgotPasswordView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        email = (payload.get('email') or '').strip()
        password = (payload.get('password') or '').strip()

        if not email or not password:
            return JsonResponse({'error': 'Please enter email and password.'}, status=400)

        result, error = _post_external_or_error(
            url_env='FORGET_PASSWORD_URL',
            payload={
                'email': email,
                'password': password,
                'system_name': SYSTEM_NAME,
            },
            failure_status=400,
            failure_default_message='Unable to reset password.',
        )
        if error:
            return error

        return JsonResponse({'ok': True, 'message': _external_success_message(result or {})})


class ApiRegisterView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        display_name = (payload.get('display_name') or '').strip()
        email = (payload.get('email') or '').strip()
        phone_number = _normalize_phone(payload.get('phone_number') or '')
        password = (payload.get('password') or '').strip()

        if not display_name or not email or not phone_number or not password:
            return JsonResponse({'error': 'Please fill all required fields.'}, status=400)

        result, error = _post_external_or_error(
            url_env='REGISTER_URL',
            payload={
                'display_name': display_name,
                'email': email,
                'phone_number': phone_number,
                'password': password,
                'system_name': SYSTEM_NAME,
                'role': REGISTER_ROLE,
            },
            failure_status=400,
            failure_default_message='Unable to create account.',
        )
        if error:
            return error

        return JsonResponse({'ok': True, 'message': _external_success_message(result or {})})


class ApiMeView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        session_payload = _get_session_payload(request)
        if session_payload is None:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        email = (session_payload.get('email') or '').strip() or None

        return JsonResponse(
            {
                'user': {
                    'id': None,
                    'username': email,
                },
                'member': {
                    'id': None,
                    'name': session_payload.get('display_name'),
                    'email': email,
                    'phone': session_payload.get('phone_number'),
                },
            }
        )


class ApiLogoutView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        return JsonResponse({'ok': True})


class ApiOtpRequestView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        channel = (payload.get('channel') or '').strip().lower()
        phone = _normalize_phone(payload.get('phone') or payload.get('username') or '')
        email = (payload.get('email') or payload.get('username') or '').strip()

        if channel not in {'whatsapp', 'email'}:
            return JsonResponse({'error': 'Invalid OTP channel.'}, status=400)

        if channel == 'whatsapp' and not phone:
            return JsonResponse({'error': 'Please enter mobile number.'}, status=400)
        if channel == 'email' and not email:
            return JsonResponse({'error': 'Please enter email id.'}, status=400)

        identifier = email if channel == 'email' else phone
        result, error = _post_external_or_error(
            url_env='SEND_OTP_URL',
            payload={
                'email': identifier,
                'type': channel,
                'system_name': SYSTEM_NAME,
            },
            failure_status=400,
            failure_default_message='Unable to request key',
        )
        if error:
            return error

        challenge_id, expires_at = create_signed_otp_challenge(email=identifier, channel=channel)
        return JsonResponse({'challenge_id': challenge_id, 'expires_at': expires_at.isoformat()})


class ApiOtpVerifyView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        challenge_id = payload.get('challenge_id')
        otp = (payload.get('otp') or '').strip()

        if not challenge_id or not otp:
            return JsonResponse({'error': 'Please enter OTP.'}, status=400)

        try:
            otp_payload = load_signed_otp_challenge(str(challenge_id))
        except ExternalAuthError as exc:
            return JsonResponse({'error': str(exc)}, status=401)

        email = (otp_payload.get('email') or '').strip()
        result, error = _post_external_or_error(
            url_env='VERIFY_OTP_URL',
            payload={
                'email': email,
                'otp': otp,
                'system_name': SYSTEM_NAME,
            },
            failure_status=401,
            failure_default_message='Invalid or expired OTP.',
        )
        if error:
            return error

        session_payload = {'email': email}
        session_payload.update(result or {})
        raw_token, expires_at = create_signed_session(payload=session_payload)

        return JsonResponse(
            {
                'token': raw_token,
                'expires_at': expires_at.isoformat(),
                'user': {'id': None, 'username': email},
            }
        )


LEVEL_CONFIG = {
    'easy': {'time': 90, 'pairs': 3, 'multiplier': 1.0},
    'medium': {'time': 60, 'pairs': 4, 'multiplier': 1.2},
    'hard': {'time': 45, 'pairs': 5, 'multiplier': 1.5},
}


class ApiGameStartView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        session_payload = _get_session_payload(request)
        if session_payload is None:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        payload = _json_body(request)
        level = (payload.get('level') or 'easy').lower()
        
        # DAILY CHALLENGE VALIDATION
        if level == 'daily':
            email = (session_payload.get('email') or '').strip()
            phone = (session_payload.get('phone_number') or '').strip()
            
            # Check if played today
            today = timezone.now().date()
            query = Q(created_at__date=today) & (Q(player_email=email) | (Q(player_phone=phone) if phone else Q(pk__in=[])))
            
            if GameResult.objects.filter(query).exists():
                return JsonResponse({'error': 'You have already played the Daily Challenge today.'}, status=403)
                
            # Use 'hard' config for daily challenge
            config = LEVEL_CONFIG['hard']
        elif level not in LEVEL_CONFIG:
            level = 'easy'
            config = LEVEL_CONFIG[level]
        else:
            config = LEVEL_CONFIG[level]

        count = SortonymWord.objects.count()
        if count == 0:
            return JsonResponse({'error': 'No words available in database'}, status=500)

        random_index = random.randint(0, count - 1)
        word_obj = SortonymWord.objects.all()[random_index]

        # Parse synonyms/antonyms
        # Assuming comma separated strings in DB
        all_syns = [s.strip() for s in word_obj.synonyms.split(',') if s.strip()]
        all_ants = [a.strip() for a in word_obj.antonyms.split(',') if a.strip()]

        # Select by difficulty
        num_pairs = config['pairs']
        
        # Ensure we have enough words, else fallback to max available
        # Ideally database should have enough words for Hard mode
        safe_pairs = min(len(all_syns), len(all_ants), num_pairs)
        
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
        session_payload = _get_session_payload(request)
        if session_payload is None:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        email = (session_payload.get('email') or '').strip()
        player_name = session_payload.get('display_name') or email
        phone = (session_payload.get('phone_number') or '').strip()
        payload = _json_body(request)
        
        round_id = payload.get('roundId')
        synonym_ids = payload.get('synonyms', [])
        antonym_ids = payload.get('antonyms', [])
        time_taken = float(payload.get('timeTaken') or 0)
        level = (payload.get('level') or 'easy').lower()
        reason = payload.get('reason')

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
        
        # Scoring Logic
        # ID format: 'syn_Word' or 'ant_Word'.
        # We need to extract the word part.
        
        def extract_word(wid):
            # wid is like 'syn_Happy' or 'ant_Sad'
            if '_' in wid:
                return wid.split('_', 1)[1]
            return wid

        # Check Synonyms Box
        for wid in synonym_ids:
            w = extract_word(wid).strip().lower()
            if w in true_syns:
                correct_count += 1
                
        # Check Antonyms Box
        for wid in antonym_ids:
            w = extract_word(wid).strip().lower()
            if w in true_ants:
                correct_count += 1
        
        # Base Score: 1.0 point per correct word
        base_scores_val = correct_count * 1.0
        
        # Time Bonus: +0.1 point per second saved, but only for correct answers
        # Formula: (Remaining Time * 0.1) * (Correct Count / Total Expected)
        # Total Expected depends on level (pairs * 2)
        total_expected = config['pairs'] * 2
        # Avoid division by zero if something weird happens
        total_expected = max(total_expected, 1)

        time_limit = config['time']
        remaining = max(0, time_limit - time_taken)
        
        time_bonus = (remaining * 0.1) * (correct_count / float(total_expected))
        
        # Final Level Multiplier
        subtotal = base_scores_val + time_bonus
        total_score = subtotal * config['multiplier']
        
        # Save Result
        GameResult.objects.create(
            player_email=email,
            player_name=player_name,
            player_phone=phone,
            round_id=round_id,
            score=total_score,
            total_correct=correct_count,
            time_taken=time_taken
        )

        # --- Update Lobby Results for Team Game (Real-Time Sync) ---
        game_code = (payload.get('gameCode') or '').strip().upper()
        # Note: LOBBIES is defined later in this file, but available at runtime
        if game_code and game_code in LOBBIES:
            lobby = LOBBIES[game_code]
            
            # Identify player's team
            is_team_a = any(p['id'] == email for p in lobby['teams'].get('A', []))
            is_team_b = any(p['id'] == email for p in lobby['teams'].get('B', []))
            
            selected_team = 'A' if is_team_a else 'B' if is_team_b else None
            
            if selected_team:
                if 'results' not in lobby:
                    lobby['results'] = []
                
                round_num = payload.get('roundNumber')
                
                # Append result
                lobby['results'].append({
                    'player': player_name,
                    'player_email': email,
                    'team': selected_team,
                    'round': round_num,
                    'score': total_score,
                    'total_correct': correct_count,
                    'time_taken': time_taken,
                    'accuracy': correct_count, # Simplified
                    'timestamp': timezone.now().isoformat()
                })
        
        return JsonResponse({
            'score': total_score,
            'base_score': base_scores_val,
            'time_bonus': time_bonus,
            'total_correct': correct_count,
            'max_score': (total_expected + 30) * config['multiplier'] # Approx max
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
        payload = _json_body(request)
        token = payload.get('token')

        if not token:
            return JsonResponse({'error': 'Google token is required.'}, status=400)

        # Verify token with Google
        try:
            # We call Google's tokeninfo endpoint to verify the ID token
            # This handles signature verification and expiration checks
            response = requests.get(
                f'https://oauth2.googleapis.com/tokeninfo?id_token={token}',
                timeout=10
            )
            
            if response.status_code != 200:
                return JsonResponse({'error': 'Invalid Google token.'}, status=401)
                
            google_data = response.json()
            
            # Strict Audience Check (Security)
            client_id = os.getenv('GOOGLE_CLIENT_ID')
            if client_id and google_data.get('aud') != client_id:
                 return JsonResponse({'error': 'Invalid token audience (Client ID mismatch).'}, status=401)

            email = google_data.get('email')
            display_name = google_data.get('name') or google_data.get('given_name') or email.split('@')[0]

            if not email:
                return JsonResponse({'error': 'Email not provided by Google.'}, status=400)

            # In this system, we treat new and existing users seamlessly.
            # We create a session with the verified identity.
            session_payload = {
                'email': email,
                'display_name': display_name,
                'status': 'success',
                'google_auth': True
            }
            
            raw_token, expires_at = create_signed_session(payload=session_payload)

            return JsonResponse(
                {
                    'token': raw_token,
                    'expires_at': expires_at.isoformat(),
                    'user': {
                        'id': None,
                        'username': email,
                    },
                }
            )
        except requests.exceptions.RequestException as e:
            return JsonResponse({'error': f'Failed to verify token with Google: {str(e)}'}, status=502)
        except Exception as e:
            return JsonResponse({'error': 'An internal error occurred during Google Login.'}, status=500)


# --- TEAM LOBBY API (In-Memory for Real-Time Sync) ---

# Global in-memory store for active lobbies
# Format: { 'CODE': { code: 'CODE', host: 'email', hostName: 'name', players: [], teams: {A:[], B:[]}, settings: {...}, status: 'waiting' } }
LOBBIES = {}

@method_decorator(csrf_exempt, name='dispatch')
class ApiLobbyCreateView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        session_payload = _get_session_payload(request)
        if not session_payload:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        user_email = session_payload.get('email')
        user_name = session_payload.get('display_name') or user_email.split('@')[0]
        
        payload = _json_body(request)
        team_name = payload.get('teamName')
        
        # Generate Code
        code = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=6))
        
        # Init Lobby
        LOBBIES[code] = {
            'code': code,
            'host': user_email,
            'hostName': user_name,
            'teamName': team_name,
            'players': [{
                'id': user_email,
                'name': user_name,
                'picture': None,
                'isHost': True
            }],
            'teams': {
                'A': [],
                'B': []
            },
            'difficulty': 'MEDIUM',
            'status': 'WAITING',
            'created_at': timezone.now().isoformat()
        }
        
        return JsonResponse({'code': code, 'lobby': LOBBIES[code]})


@method_decorator(csrf_exempt, name='dispatch')
class ApiLobbyJoinView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        session_payload = _get_session_payload(request)
        if not session_payload:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
            
        user_email = session_payload.get('email')
        user_name = session_payload.get('display_name') or user_email.split('@')[0]
        
        payload = _json_body(request)
        code = (payload.get('code') or '').upper().strip()
        
        if code not in LOBBIES:
            return JsonResponse({'error': 'Lobby not found'}, status=404)
            
        lobby = LOBBIES[code]
        
        # Add player if not exists
        if not any(p['id'] == user_email for p in lobby['players']):
            lobby['players'].append({
                'id': user_email,
                'name': user_name,
                'picture': None,
                'isHost': False
            })
            
        return JsonResponse({'code': code, 'lobby': lobby})


class ApiLobbyStatusView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        code = request.GET.get('code', '').upper().strip()
        if code not in LOBBIES:
            return JsonResponse({'error': 'Lobby not found'}, status=404)
            
        return JsonResponse(LOBBIES[code])


@method_decorator(csrf_exempt, name='dispatch')
class ApiLobbyUpdateView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        session_payload = _get_session_payload(request)
        if not session_payload:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
            
        user_email = session_payload.get('email')
        
        payload = _json_body(request)
        code = (payload.get('code') or '').upper().strip()
        action = payload.get('action') 
        
        if code not in LOBBIES:
            return JsonResponse({'error': 'Lobby not found'}, status=404)
            
        lobby = LOBBIES[code]
        
        if action == 'join_team':
            team = payload.get('team') # 'A' or 'B'
            if team not in ['A', 'B']:
                return JsonResponse({'error': 'Invalid team'}, status=400)
                
            # Remove from both teams first
            lobby['teams']['A'] = [p for p in lobby['teams']['A'] if p['id'] != user_email]
            lobby['teams']['B'] = [p for p in lobby['teams']['B'] if p['id'] != user_email]
            
            # Add to target team
            player_data = next((p for p in lobby['players'] if p['id'] == user_email), None)
            if not player_data:
                # Fallback
                player_data = {'id': user_email, 'name': user_email.split('@')[0], 'picture': None}
                
            lobby['teams'][team].append(player_data)
            
        elif action == 'leave_team':
             lobby['teams']['A'] = [p for p in lobby['teams']['A'] if p['id'] != user_email]
             lobby['teams']['B'] = [p for p in lobby['teams']['B'] if p['id'] != user_email]
             
        elif action == 'set_difficulty':
            if lobby['host'] != user_email:
                return JsonResponse({'error': 'Only host can change difficulty'}, status=403)
            lobby['difficulty'] = payload.get('difficulty')

        elif action == 'start_game':
            if lobby['host'] != user_email:
                return JsonResponse({'error': 'Only host can start game'}, status=403)
            lobby['status'] = 'STARTED'
            
        return JsonResponse(lobby)
