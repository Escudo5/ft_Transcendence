from datetime import timedelta

from django.contrib import admin
from django.db.models import Q
from django.utils import timezone

from .models import CustomUser
from django.contrib.auth.admin import UserAdmin


class ConectadoFilter(admin.SimpleListFilter):
    # ⚠️ Filtrar por `estado` a secas ENGAÑA: nadie cierra sesión, cierran la
    # pestaña, y queda gente en 'online' de hace días. Esto usa estado_real.

    title = 'conectado de verdad'
    parameter_name = 'conectado'

    def lookups(self, request, model_admin):
        return [('si', 'En línea'), ('no', 'Desconectado')]

    def queryset(self, request, queryset):
        limite = timezone.now() - timedelta(minutes=CustomUser.MINUTOS_PARA_DESCONECTAR)
        if self.value() == 'si':
            return queryset.exclude(estado='offline').filter(ultima_actividad__gte=limite)
        if self.value() == 'no':
            return queryset.filter(
                Q(estado='offline') | Q(ultima_actividad=None) | Q(ultima_actividad__lt=limite)
            )
        return queryset


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):

    list_display = (
        'id', 'username', 'email', 'first_name', 'last_name',
        'conectado', 'ultima_actividad', 'is_staff'
    )

    # 2. Filtros laterales

    list_filter = (ConectadoFilter, 'is_staff', 'is_superuser', 'is_active')

    # 3. Búsqueda
    search_fields = ('username', 'first_name', 'last_name', 'email', 'nombre_mostrado')

    # 4. Organización de secciones dentro del formulario de edición

    fieldsets = UserAdmin.fieldsets + (
        ('Datos de 42 / Intra', {
            'fields': ('profile_image',)
        }),
        ('Perfil Personalizado', {
            'fields': ('nombre_mostrado', 'bio', 'avatar')
        }),
        ('Estado y Actividad', {
            'fields': ('estado', 'ultima_actividad', 'ultimo_regalo_diario')
        }),
    )

    # 5. Campos de solo lectura
    readonly_fields = ('ultima_actividad', 'profile_image')

    # 6. ¿Está conectado de verdad?

    @admin.display(description='Conectado', boolean=True)
    def conectado(self, usuario):
        return usuario.estado_real != 'offline'