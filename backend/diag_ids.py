import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from hackathon.models import Lobby

lobbies = Lobby.objects.filter(status='STARTED').order_by('-id')[:2]
for l in lobbies:
    print(f"Lobby Code: {l.code}")
    print(f"Status: {l.status}")
    players = l.players_data
    results = l.results_data
    
    comp_map = {}
    for r in results:
        pid = r.get('player_id') or r.get('player_email')
        comp_map[pid] = comp_map.get(pid, 0) + 1
        
    print(f"Keys in comp_map: {list(comp_map.keys())}")
    print(f"IDs in lobby players: {[p.get('id') for p in players]}")
    print("-" * 30)
