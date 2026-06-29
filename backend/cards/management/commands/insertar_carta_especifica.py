import os
import time
import requests
from django.core.management.base import BaseCommand
from cards.models import Card
from cards.management.commands.poblar_catalogo import _obtener_headers_auth
import json

class Command(BaseCommand):
    help = 'este comando inserta en la base de datos de las cartas creadas la carta del login que se le mande por argumentos'
    def add_arguments(self,parser):
        parser.add_argument('login',type=str)
    def handle(self,*args,**options):
        headers = _obtener_headers_auth()
        if not headers:
            return
        url_user = f"{os.environ.get('BASE_API')}/users/{options['login']}"
        res_user = requests.get(url_user, headers=headers)
        user = res_user.json()
        print(json.dumps(user, indent=4, ensure_ascii=False))