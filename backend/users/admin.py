from datetime import timedelta

from django.contrib import admin
from django.db.models import Q
from django.utils import timezone

from .models import CustomUser
from django.contrib.auth.admin import UserAdmin


class ConectadoFilter(admin.SimpleListFilter):
    """
    ⚠️ Nacho, 18/09. Filtrar por el campo `estado` a secas ENGAÑA.

    `estado` solo guarda lo último que la persona hizo a propósito: entrar o
    cerrar sesión. Pero nadie cierra sesión, cierran la pestaña. Así que en
    la base hay gente marcada como 'online' que se fue hace tres días.

    Este filtro aplica la misma regla que la web (CustomUser.estado_real):
    cuenta como conectado quien no ha cerrado sesión Y ha dado señales de
    vida en los últimos MINUTOS_PARA_DESCONECTAR minutos.

    El número sale del modelo, no está copiado aquí: si algún día se cambia,
    el panel y la web siguen diciendo lo mismo.
    """

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
    # 1. Columnas en la vista de lista
    #
    # ⚠️ Nacho, 18/09, cambios pedidos por el equipo:
    #   + 'id'          la de PostgreSQL. Es el identificador de NUESTRA web
    #                   y la tiene todo el mundo. La de la Intra no vale para
    #                   esto: quien se registra por correo no tiene id_42.
    #   + 'conectado'   la verdad sobre el estado (ver el método de abajo)
    #   + 'ultima_actividad'  para ver CUÁNDO fue la última señal de vida
    #   - 'nombre_mostrado'   quitada, ya está la columna de usuario
    #   - 'estado'      quitada: el campo a secas engaña, lo sustituye
    #                   'conectado', que aplica la misma regla que la web
    list_display = (
        'id', 'username', 'email', 'first_name', 'last_name',
        'conectado', 'ultima_actividad', 'is_staff'
    )

    # 2. Filtros laterales
    #
    # ⚠️ 'estado' se cambia por ConectadoFilter por el mismo motivo: filtrar
    # por el campo guardado sacaría gente "en línea" que se fue hace días.
    list_filter = (ConectadoFilter, 'is_staff', 'is_superuser', 'is_active')

    # 3. Búsqueda
    #
    # ⚠️ Quitado 'id_42' a petición del equipo (18/09). El campo SIGUE en el
    # modelo, y tiene que seguir: es la llave con la que el login de 42
    # encuentra a la persona (views.py:79). Lo que se quita es enseñarlo en
    # el panel, porque como identificador de la web no sirve: las cuentas de
    # correo y contraseña no lo tienen.
    search_fields = ('username', 'first_name', 'last_name', 'email', 'nombre_mostrado')

    # 4. Organización de secciones dentro del formulario de edición
    #
    # ⚠️ OJO CON ESTA FICHA: la Intra pisa estos campos en CADA login con 42
    # (users/views.py:98-104), no solo al crear la cuenta:
    #
    #     first_name · last_name · email · profile_image · is_alumni · estado
    #
    # Si los cambias aquí, parece que se ha guardado y vuelven solos al valor
    # de la Intra la próxima vez que esa persona entre, sin dar ningún error.
    # Se dejan editables porque las cuentas de correo y contraseña sí los
    # necesitan, pero que nadie corrija un nombre aquí creyendo que se queda.
    fieldsets = UserAdmin.fieldsets + (
        ('Datos de 42 / Intra', {
            # ⚠️ Decisión del equipo del 18/09: fuera del panel 'id_42' y
            # 'is_alumni'. Los dos SIGUEN en el modelo y los sigue rellenando
            # la Intra en cada login; lo que no se quiere es enseñarlos aquí.
            # (id_42 hace falta sí o sí: es como el login de 42 encuentra a
            # la persona, views.py:79.)
            'fields': ('profile_image',)
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
    #
    #   ultima_actividad -> la escribe users/middleware.py en cada petición.
    #                       A mano no significa nada.
    #
    #   profile_image    -> ⚠️ Nacho, 18/09. Su único origen es la Intra, que
    #                       lo reescribe en cada login; el registro por correo
    #                       no lo rellena nunca. Editarlo aquí era engañarse.
    #                       La foto propia se sube desde el perfil (campo
    #                       'avatar', ese sí se puede tocar).
    #
    # (id_42 ya no hace falta ponerlo aquí: desde el 18/09 no sale en la
    #  ficha, así que no hay forma de tocarlo desde el panel.)
    readonly_fields = ('ultima_actividad', 'profile_image')

    # 6. ¿Está conectado de verdad?
    #
    # El campo `estado` NO sirve para esto y por eso no está en las columnas:
    # solo cambia al entrar y al cerrar sesión, y nadie cierra sesión, cierran
    # la pestaña. Alguien que se fue el martes sigue ahí marcado como 'online'.
    #
    # `estado_real` (en el modelo) es el que cruza las dos cosas: el estado
    # guardado Y la última señal de vida. Es exactamente lo mismo que ve la
    # gente en la web, así que el panel y la página nunca se contradicen.
    @admin.display(description='Conectado', boolean=True)
    def conectado(self, usuario):
        return usuario.estado_real != 'offline'