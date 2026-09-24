import hashlib
import secrets

from django.conf import settings
from django.db import models


class ClaveApi(models.Model):
    """
    La llave que necesita un programa para pedirnos datos.

    Es lo mismo que el CLIENT_SECRET que tenéis vosotros en el .env para
    hablar con la API de 42: un código largo que demuestra quién eres
    cuando no hay navegador ni sesión de por medio.

    ⚠️ LA CLAVE NO SE GUARDA. Igual que con las contraseñas, guardamos
    solo su HUELLA, que es un resumen del que no se puede volver atrás.
    Así, si alguien se llevara la base de datos entera, no se llevaría ni
    una sola clave utilizable.

    La contrapartida es que la clave se enseña UNA VEZ, al crearla, y no
    hay forma de recuperarla. Es exactamente lo que hacen GitHub y la
    propia Intra de 42: "guárdala ahora, no la volverás a ver".

    Se guarda también el PREFIJO (los primeros caracteres) en claro. Eso
    no sirve para entrar, solo para que en la lista puedas distinguir
    cuál es cuál cuando tengas varias.
    """

    LARGO_CLAVE = 40

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='claves_api',
    )
    # Para acordarse de para qué era: "bot de Discord", "script del ranking"
    nombre = models.CharField(max_length=60)

    # El resumen irreversible de la clave. Es por donde se busca al recibir
    # una petición: se resume la clave que llega y se compara con esta.
    huella = models.CharField(max_length=64, unique=True, db_index=True)

    # Los primeros caracteres, en claro. Solo para reconocerla en la lista.
    prefijo = models.CharField(max_length=8)

    # Se puede desactivar sin borrarla, para cortar el grifo y poder
    # volver atrás si fue un error.
    activa = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    ultimo_uso = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.nombre} ({self.prefijo}…) de {self.usuario}'

    # -----------------------------------------------------------------
    @staticmethod
    def resumir(clave_en_claro):
        """
        Convierte una clave en su huella.

        Se usa SHA-256 a secas, sin la sal que llevan las contraseñas. Y
        no es un descuido: la sal existe para que no se puedan probar
        contraseñas comunes ("123456", "password") contra una lista
        preparada. Aquí la clave son 40 caracteres al azar, así que
        adivinarla probando es imposible de todas formas.

        Además hace falta que la huella sea SIEMPRE la misma para poder
        buscarla en una sola consulta cuando llega una petición. Con sal
        habría que comparar contra todas las claves, una por una.
        """
        return hashlib.sha256(clave_en_claro.encode()).hexdigest()

    @classmethod
    def crear(cls, usuario, nombre):
        """
        Crea una clave nueva. Devuelve (objeto, clave_en_claro).

        La clave en claro se devuelve UNA VEZ y no se guarda en ninguna
        parte. Quien la pide tiene que copiarla en ese momento.
        """
        # token_urlsafe usa el generador de números aleatorios del sistema
        # operativo, el mismo que se usa para cosas de seguridad de verdad.
        # No vale un random normal: ese es predecible si sabes por dónde va.
        clave = secrets.token_urlsafe(cls.LARGO_CLAVE)
        objeto = cls.objects.create(
            usuario=usuario,
            nombre=nombre,
            huella=cls.resumir(clave),
            prefijo=clave[:8],
        )
        return objeto, clave
