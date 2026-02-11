import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from hackathon.models import Lobby

try:
    lobby = Lobby.objects.get(code='5255VP')
    print(f"Lobby Code: {lobby.code}")
    print(f"Status: {lobby.status}")
    print("\nIndividual Scores:")
    
    # Group scores by player
    player_totals = {}
    for r in lobby.results_data:
        p_id = r.get('player_id') or r.get('player_email') or r.get('player')
        name = r.get('player', 'Unknown')
        team = r.get('team', '?')
        score = r.get('score', 0)
        
        if p_id not in player_totals:
            player_totals[p_id] = {'name': name, 'team': team, 'total': 0}
        player_totals[p_id]['total'] += score

    team_totals = {'A': 0, 'B': 0}
    for p_id, data in player_totals.items():
        print(f"- {data['name']} (Team {data['team']}): {data['total']:.2f}")
        if data['team'] in team_totals:
            team_totals[data['team']] += data['total']

    print("\nTeam Totals:")
    print(f"Team A: {team_totals['A']:.2f}")
    print(f"Team B: {team_totals['B']:.2f}")
    
    winner = "Team A" if team_totals['A'] > team_totals['B'] else "Team B" if team_totals['B'] > team_totals['A'] else "Tie"
    print(f"\nWinner: {winner}")

except Lobby.DoesNotExist:
    print("Lobby not found.")
