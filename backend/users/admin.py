from django.contrib import admin
from .models import CustomUser
from django.contrib.auth.admin import UserAdmin
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    # 1. Columnas en la vista de lista
    list_display = (
        'username', 'email', 'first_name', 'last_name', 
        'nombre_mostrado', 'estado', 'is_staff'
    )

    # 2. Filtros laterales
    list_filter = ('estado', 'is_staff', 'is_superuser', 'is_active')

    # 3. Búsqueda por nombre, apellidos, usuario, correo e ID de 42
    search_fields = ('username', 'first_name', 'last_name', 'email', 'nombre_mostrado', 'id_42')

    # 4. Organización de secciones dentro del formulario de edición
    fieldsets = UserAdmin.fieldsets + (
        ('Datos de 42 / Intra', {
            'fields': ('id_42', 'profile_image')
        }),
        ('Perfil Personalizado', {
            'fields': ('nombre_mostrado', 'bio', 'avatar')
        }),
        # ⚠️ Nacho, 18/09: quitado 'last_login_date' de esta lista (lo demás,
        # de Pablo, igual). El campo ya no existe en el modelo, y el admin
        # habría reventado al abrir la ficha de cualquier usuario. Si quieres
        # el último acceso, Django lo trae en 'last_login' y sale arriba, en
        # la sección de fechas importantes que pone UserAdmin.
        ('Estado y Actividad', {
            'fields': ('estado', 'ultima_actividad', 'ultimo_regalo_diario')
        }),
    )

    # 5. Campos de solo lectura
    readonly_fields = ('ultima_actividad',)