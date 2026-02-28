from django.contrib import admin
from .models import Usuario, Ejercicio, Rutina, RutinaEjercicio, Progreso

admin.site.register(Usuario)
admin.site.register(Ejercicio)
admin.site.register(Rutina)
admin.site.register(RutinaEjercicio)
admin.site.register(Progreso)