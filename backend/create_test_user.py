import os
import django
import sys

# Add project root to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

try:
    email = 'admin.test@sortonym.com'
    password = 'Admin@12345'
    
    # Check if user exists by username OR email
    if not User.objects.filter(username=email).exists() and not User.objects.filter(email=email).exists():
        # Using email as username is a common pattern for API-based auth
        user = User.objects.create_user(username=email, email=email, password=password)
        # Set first_name/last_name if needed
        user.first_name = 'Sortonym'
        user.last_name = 'Admin'
        user.save()
        print(f"SUCCESS: User '{email}' created.")
    else:
        print(f"INFO: User '{email}' already exists.")

except Exception as e:
    print(f"ERROR: {e}")
