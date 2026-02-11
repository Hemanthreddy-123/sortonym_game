from django.core.management.base import BaseCommand
from hackathon.word_cache import word_cache


class Command(BaseCommand):
    help = 'Warm up the word cache for optimal performance'

    def handle(self, *args, **options):
        self.stdout.write('Starting word cache warm-up...')
        try:
            word_cache.warm_up_cache()
            self.stdout.write(self.style.SUCCESS('Word cache warm-up completed successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error warming up cache: {e}'))
