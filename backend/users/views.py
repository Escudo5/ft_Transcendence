import requests
#from django.shortcuts import render
from django.http import JsonResponse
from .models import CustomUser

# def my_perfil_42(request):
#     CLIENT_ID   = 'u-s4t2ud-2ca0585bb0ecbf9397bde57f369447e7bb9a9da2aa35c1aea492a9f7b1c58694'
#     CLIENT_SECRET = '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'

#     url_token = "https://api.intra.42.fr/oauth/token"
#     credenciales = {
#         "grant_type": "client_credentials",
#         "client_id": CLIENT_ID,
#         "client_secret": CLIENT_SECRET,
#     }
#     respuesta_token = requests.post(url_token, data=credenciales).json()
#     token_de_acceso = respuesta_token.get("access_token")
#     if not token_de_acceso:
#         return JsonResponse({"error": "No se pudo obtener el token de 42", "detalles_de_la_intra": respuesta_token}, status=400)
#     tu_login = "pablalva" 
#     url_perfil = f"https://api.intra.42.fr/v2/users/pablalva"
    
#     cabeceras = {"Authorization": f"Bearer {token_de_acceso}"}
#     datos_perfil_json = requests.get(url_perfil, headers=cabeceras).json()
    
#     # Mostrar resultado final en el navegador
#     #To do intentar meter mi perfil en la vase de datos como inicio depues hacerlo con todos
#     last_login = datos_perfil_json.get("updated_at")
#     username = datos_perfil_json.get("login")
#     first_name = datos_perfil_json.get("first_name")
#     last_name = datos_perfil_json.get("last_name")
#     email = datos_perfil_json.get("email")
#     is_staff = datos_perfil_json.get("staff?")
#     is_active = datos_perfil_json.get("active?")
#     date_joined = datos_perfil_json.get("created_at")
#     id_42 = datos_perfil_json.get("id")
#     profile_image = datos_perfil_json.get("image",{}).get("versions",{}).get("medium")
#     elo = 0
#     status = "offline"
#     is_alumni = datos_perfil_json.get("alumni?")
    
#     Usuario = CustomUser()
#     Usuario.elo = elo
#     Usuario.estado = status
#     Usuario.id_42 = id_42
#     Usuario.is_alumni = is_alumni
#     Usuario.profile_image = profile_image
#     Usuario.last_login = last_login
#     Usuario.is_superuser = False
#     Usuario.username = username
#     Usuario.first_name = first_name
#     Usuario.last_name = last_name
#     Usuario.email = email
#     Usuario.is_staff = is_staff
#     Usuario.is_active = is_active
#     Usuario.date_joined = date_joined
#     Usuario.id_42 = id_42
#     Usuario.profile_image = profile_image
#     Usuario.save()
#     print("aaaaaaaaaaaa")
#     print(profile_image)
#     return JsonResponse(datos_perfil_json)