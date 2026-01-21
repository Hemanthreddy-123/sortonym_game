import json
import re
import random
from datetime import timedelta
import uuid

from django.http import HttpRequest, JsonResponse
from django.db import transaction
from django.utils import timezone
from django.views import View

from .auth import (
    create_session_token,
    OtpDispatchError,
    OtpVerifyError,
    get_session_times,
    hash_session_token,
    dispatch_otp,
    verify_otp_via_gateway,
    verify_password,
)
from .models import AppUser, AppUserMember, AuthSession, OtpChallenge, Word, SortonymWords, HackathonGameround, GameResults


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


def _get_session(request: HttpRequest) -> AuthSession | None:
    token = _get_bearer_token(request)
    if not token:
        return None

    token_hash = hash_session_token(token)
    return (
        AuthSession.objects.select_related('user', 'member')
        .filter(token_hash=token_hash, revoked_at__isnull=True, expires_at__gt=timezone.now())
        .first()
    )


def _json_body(request: HttpRequest) -> dict:
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return {}


class HealthView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        try:
            # Test database connection
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            # Check if we have basic data
            word_count = Word.objects.count()
            
            return JsonResponse({
                'status': 'ok',
                'database': 'connected',
                'words': word_count
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'database': 'disconnected',
                'error': str(e)
            }, status=500)


class ApiLoginView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        username_raw = (payload.get('username') or '').strip()
        password = (payload.get('password') or '').strip()

        if not username_raw or not password:
            return JsonResponse({'error': 'Please enter username and password.'}, status=400)

        members_qs = AppUserMember.objects.select_related('user').filter(user__is_active=True)
        if '@' in username_raw:
            members_qs = members_qs.filter(email__iexact=username_raw)
        else:
            phone = _normalize_phone(username_raw)
            if not phone:
                return JsonResponse({'error': 'Please enter username and password.'}, status=400)
            members_qs = members_qs.filter(phone=phone)

        members = list(members_qs)
        if not members:
            return JsonResponse({'error': 'Invalid username or password.'}, status=401)

        matched_user: AppUser | None = None
        matched_member: AppUserMember | None = None
        for member in members:
            user = member.user
            if verify_password(
                password,
                salt_b64=user.password_salt_b64,
                password_hash_b64=user.password_hash_b64,
                iterations=user.password_iterations,
            ):
                matched_user = user
                matched_member = member
                break

        if matched_user is None:
            return JsonResponse({'error': 'Invalid username or password.'}, status=401)

        user = matched_user

        raw_token = create_session_token()
        times = get_session_times()
        AuthSession.objects.create(
            user=user,
            member=matched_member,
            token_hash=hash_session_token(raw_token),
            created_at=times.created_at,
            expires_at=times.expires_at,
        )

        return JsonResponse(
            {
                'token': raw_token,
                'expires_at': times.expires_at.isoformat(),
                'user': {
                    'id': user.id,
                    'username': user.username,
                },
            }
        )


class ApiMeView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        session = _get_session(request)
        if session is None or not session.user.is_active:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        if session.member is None:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        return JsonResponse(
            {
                'user': {
                    'id': session.user.id,
                    'username': session.user.username,
                    'team_no': session.user.team_no,
                },
                'member': {
                    'id': session.member.id,
                    'member_id': session.member.member_id,
                    'name': session.member.name,
                    'email': session.member.email,
                    'phone': session.member.phone,
                },
            }
        )


class ApiLogoutView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        session = _get_session(request)
        if session is None:
            return JsonResponse({'ok': True})

        session.revoked_at = timezone.now()
        session.save(update_fields=['revoked_at'])
        return JsonResponse({'ok': True})


class ApiOtpRequestView(View):
    OTP_TTL = timedelta(minutes=5)

    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        channel = (payload.get('channel') or '').strip().lower()
        phone = _normalize_phone(payload.get('phone') or payload.get('username') or '')
        email = (payload.get('email') or payload.get('username') or '').strip()
        team_no_raw = payload.get('team_no')

        if channel not in {'whatsapp', 'email'}:
            return JsonResponse({'error': 'Invalid OTP channel.'}, status=400)

        if channel == 'whatsapp' and not phone:
            return JsonResponse({'error': 'Please enter mobile number.'}, status=400)
        if channel == 'email' and not email:
            return JsonResponse({'error': 'Please enter email id.'}, status=400)

        if channel == 'whatsapp':
            members_qs = (
                AppUserMember.objects.select_related('user')
                .filter(phone=phone)
                .filter(user__is_active=True)
            )
        else:
            members_qs = (
                AppUserMember.objects.select_related('user')
                .filter(email__iexact=email)
                .filter(user__is_active=True)
            )

        if team_no_raw is not None and str(team_no_raw).strip() != '':
            try:
                team_no = int(team_no_raw)
            except (TypeError, ValueError):
                return JsonResponse({'error': 'Invalid team number.'}, status=400)
            members_qs = members_qs.filter(user__team_no=team_no)

        members = list(members_qs)
        if not members:
            if channel == 'whatsapp':
                return JsonResponse({'error': 'Mobile number not registered.'}, status=404)
            return JsonResponse({'error': 'Email id not registered.'}, status=404)

        if len(members) > 1:
            identifier_label = 'mobile number' if channel == 'whatsapp' else 'email id'
            teams = []
            for m in members:
                teams.append({'team_no': m.user.team_no, 'username': m.user.username})
            teams = sorted(teams, key=lambda t: (t['team_no'] is None, t['team_no'] or 0))
            return JsonResponse(
                {
                    'error': f'Multiple team accounts found for this {identifier_label}. Please select team number.',
                    'teams': teams,
                },
                status=409,
            )

        member = members[0]

        identifier = phone if channel == 'whatsapp' else (member.email or email)

        try:
            dispatch_otp(channel=channel, identifier=identifier, display_name=member.name)
        except OtpDispatchError as exc:
            return JsonResponse({'error': str(exc)}, status=502)

        now = timezone.now()
        expires_at = now + self.OTP_TTL

        with transaction.atomic():
            OtpChallenge.objects.filter(
                member=member,
                identifier=identifier,
                consumed_at__isnull=True,
                expires_at__gt=now,
            ).update(consumed_at=now)

            challenge = OtpChallenge.objects.create(
                identifier=identifier,
                member=member,
                created_at=now,
                expires_at=expires_at,
            )

        return JsonResponse({'challenge_id': challenge.id, 'expires_at': expires_at.isoformat()})


class ApiOtpVerifyView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        payload = _json_body(request)
        challenge_id = payload.get('challenge_id')
        otp = (payload.get('otp') or '').strip()

        if not challenge_id or not otp:
            return JsonResponse({'error': 'Please enter OTP.'}, status=400)

        try:
            challenge_id_int = int(challenge_id)
        except (TypeError, ValueError):
            return JsonResponse({'error': 'Invalid OTP request.'}, status=400)

        challenge = (
            OtpChallenge.objects.select_related('member', 'member__user')
            .filter(id=challenge_id_int)
            .first()
        )
        if challenge is None or not challenge.is_valid() or challenge.member is None:
            return JsonResponse({'error': 'Invalid or expired OTP.'}, status=401)

        try:
            ok = verify_otp_via_gateway(identifier=challenge.identifier, otp=otp)
        except OtpVerifyError as exc:
            return JsonResponse({'error': str(exc)}, status=502)

        if not ok:
            return JsonResponse({'error': 'Invalid or expired OTP.'}, status=401)

        now = timezone.now()

        with transaction.atomic():
            updated = OtpChallenge.objects.filter(id=challenge.id, consumed_at__isnull=True).update(consumed_at=now)
            if updated != 1:
                return JsonResponse({'error': 'Invalid or expired OTP.'}, status=401)

            member = challenge.member
            user = member.user

            raw_token = create_session_token()
            times = get_session_times()
            AuthSession.objects.create(
                user=user,
                member=member,
                token_hash=hash_session_token(raw_token),
                created_at=times.created_at,
                expires_at=times.expires_at,
            )

        return JsonResponse(
            {
                'token': raw_token,
                'expires_at': times.expires_at.isoformat(),
                'user': {'id': user.id, 'username': user.username},
            }
        )

class GameStartView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        session = _get_session(request)
        if not session:
            return JsonResponse({"error": "Unauthorized"}, status=401)

        anchor = SortonymWords.objects.order_by("?").first()
        if not anchor:
            return JsonResponse({"error": "No words available"}, status=404)

        related = (
            [{"word": w, "type": "synonym"} for w in anchor.get_synonyms()] +
            [{"word": w, "type": "antonym"} for w in anchor.get_antonyms()]
        )

        if len(related) != 8:
            return JsonResponse({"error": "Invalid word data"}, status=500)

        random.shuffle(related)

        # 👇 Frontend only needs id + word + type
        words_out = [
            {
                "id": i,                # virtual id (frontend only)
                "word": r["word"],
                "type": r["type"]
            }
            for i, r in enumerate(related)
        ]

        game = GameResults.objects.create(
            game_id=str(uuid.uuid4()),
            game_name="Sortonym",
            player_id=str(session.user.id),
            start_time=timezone.now(),
            absolute_score=0,
            duration=0,
            words_played=0,
            percentage_score="0",
            game_session_data=json.dumps({
                "anchor_id": anchor.word_id,
                "words": words_out   # 🔑 store words for validation
            }),
        )

        return JsonResponse({
            "round_id": game.game_id,
            "anchor_word": anchor.anchor_word,
            "anchor_id": anchor.word_id,
            "words": words_out,
            "time_limit": 60
        })
    
# Add this to your Django views.py for debugging

class DebugGameView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        session = _get_session(request)
        if not session:
            return JsonResponse({"error": "Unauthorized"}, status=401)
        
        # Get all active games for this user
        active_games = GameResults.objects.filter(
            player_id=str(session.user.id),
            end_time__isnull=True
        ).order_by('-start_time')
        
        games_list = []
        for game in active_games:
            games_list.append({
                "game_id": game.game_id,
                "start_time": game.start_time.isoformat(),
                "absolute_score": game.absolute_score,
            })
        
        return JsonResponse({
            "active_games": games_list,
            "count": len(games_list)
        })

class GameSubmitView(View):
    def post(self, request: HttpRequest) -> JsonResponse:
        session = _get_session(request)
        if not session:
            return JsonResponse({"error": "Unauthorized"}, status=401)

        payload = _json_body(request)
        print("SUBMIT PAYLOAD:", payload)  # 🔍 DEBUG

        # Handle both snake_case and camelCase versions
        round_id = payload.get("roundId") or payload.get("round_id")
        synonym_ids = payload.get("synonyms", [])
        antonym_ids = payload.get("antonyms", [])
        
        # Handle timeTaken/time_taken
        time_taken = payload.get("timeTaken") or payload.get("time_taken")
        if time_taken is not None:
            time_taken = float(time_taken)
        else:
            time_taken = 60
            
        reason = payload.get("reason")

        if not round_id:
            return JsonResponse({"error": "Missing roundId"}, status=400)

        game = GameResults.objects.filter(
            game_id=round_id,
            player_id=str(session.user.id),
            end_time__isnull=True
        ).first()

        if not game:
            return JsonResponse({"error": "Invalid or completed round"}, status=400)

        session_data = json.loads(game.game_session_data or "{}")
        anchor_id = session_data.get("anchor_id")
        words = session_data.get("words", [])

        if not anchor_id or not words:
            return JsonResponse({"error": "Corrupted game session"}, status=400)

        anchor = SortonymWords.objects.filter(word_id=anchor_id).first()
        if not anchor:
            return JsonResponse({"error": "Invalid anchor"}, status=400)

        synonyms = [s.lower() for s in anchor.get_synonyms()]
        antonyms = [a.lower() for a in anchor.get_antonyms()]
        id_map = {w["id"]: w for w in words}

        score = 0
        correct = 0

        # Calculate correct answers
        for wid in synonym_ids:
            w = id_map.get(wid)
            if w and w["type"] == "synonym" and w["word"].lower() in synonyms:
                score += 1
                correct += 1

        for wid in antonym_ids:
            w = id_map.get(wid)
            if w and w["type"] == "antonym" and w["word"].lower() in antonyms:
                score += 1
                correct += 1

        # Add time bonus if not time expired
        if reason != "TIME_EXPIRED":
            time_bonus = max(0, (60 - time_taken) * 0.1)
            score += time_bonus
        else:
            time_bonus = 0

        score = round(score, 2)

        # Update game record
        game.absolute_score = score
        game.duration = int(time_taken)
        game.words_played = len(synonym_ids) + len(antonym_ids)
        game.end_time = timezone.now()

        # Calculate percentage
        if game.words_played > 0:
            percentage = (score / 8) * 100  # Max score is 8 for words + time bonus
        else:
            percentage = 0
        game.percentage_score = f"{round(percentage, 2)}"
        game.save()

        return JsonResponse({
            "score": score,
            "total_correct": correct,
            "base_score": correct,
            "time_bonus": round(time_bonus, 2),
            "correct_synonyms": sum(1 for wid in synonym_ids if id_map.get(wid) and id_map[wid]["type"] == "synonym" and id_map[wid]["word"].lower() in synonyms),
            "correct_antonyms": sum(1 for wid in antonym_ids if id_map.get(wid) and id_map[wid]["type"] == "antonym" and id_map[wid]["word"].lower() in antonyms),
        })

class GameScoreView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        session = _get_session(request)
        if session is None or not session.user.is_active:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            # Get user's game statistics from the gamesession table
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COALESCE(SUM(total_score), 0) as total_score,
                        COUNT(*) as rounds_played,
                        COALESCE(MAX(total_score), 0) as best_round_score,
                        COALESCE(AVG(total_score), 0) as average_score
                    FROM hackathon_gamesession 
                    WHERE user_id = %s AND is_completed = 1
                """, [session.user.id])
                
                result = cursor.fetchone()
                if result:
                    total_score, rounds_played, best_round_score, average_score = result
                else:
                    total_score = rounds_played = best_round_score = average_score = 0
            
            return JsonResponse({
                'total_score': float(total_score),
                'rounds_played': rounds_played,
                'best_round_score': float(best_round_score),
                'average_score': float(average_score)
            })
        except Exception as e:
            return JsonResponse({
                'total_score': 0,
                'rounds_played': 0,
                'best_round_score': 0,
                'average_score': 0
            })


class LeaderboardView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        session = _get_session(request)
        if session is None or not session.user.is_active:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            # Get top 10 players by total score from gamesession table
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        u.team_no,
                        m.name,
                        SUM(gs.total_score) as total_score,
                        COUNT(gs.id) as rounds_played,
                        MAX(gs.total_score) as best_round
                    FROM hackathon_gamesession gs
                    JOIN hackathon_appuser u ON gs.user_id = u.id
                    LEFT JOIN hackathon_appusermember m ON gs.member_id = m.id
                    WHERE gs.is_completed = 1
                    GROUP BY u.id, u.team_no, m.name
                    ORDER BY total_score DESC
                    LIMIT 10
                """)
                
                results = cursor.fetchall()
            
            leaderboard = []
            for i, (team_no, name, total_score, rounds_played, best_round) in enumerate(results, 1):
                leaderboard.append({
                    'rank': i,
                    'team_no': team_no,
                    'name': name or f'Team {team_no}',
                    'total_score': float(total_score or 0),
                    'rounds_played': rounds_played,
                    'best_round': float(best_round or 0)
                })
            
            return JsonResponse({'leaderboard': leaderboard})
        except Exception as e:
            return JsonResponse({'leaderboard': []})
