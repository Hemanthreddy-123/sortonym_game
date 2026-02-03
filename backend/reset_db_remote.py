import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

print("Cleaning up remote database...")
with connection.cursor() as cursor:
    cursor.execute('SET FOREIGN_KEY_CHECKS = 0;')
    
    tables = ['hackathon_sortonymword', 'hackathon_gameresult']
    for table in tables:
        print(f"Dropping table {table}...")
        cursor.execute(f"DROP TABLE IF EXISTS {table};")
        
    print("Cleaning migration history...")
    cursor.execute("DELETE FROM django_migrations WHERE app='hackathon';")
    
    cursor.execute('SET FOREIGN_KEY_CHECKS = 1;')

print("Remote database cleanup complete.")
