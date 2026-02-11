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
    
    active_pids = [p.get('id') for p in players if p.get('team') is not None]
    
    comp_map = {}
    for r in results:
        pid = r.get('player_id') or r.get('player_email')
        comp_map[pid] = comp_map.get(pid, 0) + 1
        
    print("Players and their round counts:")
    for pid in active_pids:
        count = comp_map.get(pid, 0)
        print(f"  - {pid}: {count} rounds")
    
    all_done = len(active_pids) > 0 and all(comp_map.get(pid, 0) >= 5 for pid in active_pids)
    print(f"All Finished (Backend Logic): {all_done}")
    print("-" * 30)
