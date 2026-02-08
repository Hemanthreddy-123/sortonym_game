from django.contrib.auth.models import User

email = 'admin.test@sortonym.com'
password = 'Admin@12345'
    
if not User.objects.filter(username=email).exists() and not User.objects.filter(email=email).exists():
    User.objects.create_user(username=email, email=email, password=password)
    print("MEMBER_CREATED")
else:
    print("MEMBER_EXISTS")
