# Generated migration for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hackathon', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='sortonymword',
            index=models.Index(fields=['word'], name='hackathon_sorton_word_idx'),
        ),
        migrations.AddIndex(
            model_name='gameresult',
            index=models.Index(fields=['player_email', '-score'], name='hackathon_game_email_score_idx'),
        ),
        migrations.AddIndex(
            model_name='gameresult',
            index=models.Index(fields=['created_at'], name='hackathon_game_created_idx'),
        ),
        migrations.AddIndex(
            model_name='lobby',
            index=models.Index(fields=['code'], name='hackathon_lobby_code_idx'),
        ),
        migrations.AddIndex(
            model_name='lobby',
            index=models.Index(fields=['status'], name='hackathon_lobby_status_idx'),
        ),
    ]
