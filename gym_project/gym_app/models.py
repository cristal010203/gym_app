from django.db import models

# Tabla de usuarios
class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=45)
    tipo_cuenta = models.CharField(max_length=45, default='free')
    fecha_registro = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.nombre


# Tabla de ejercicios
class Ejercicio(models.Model):
    id_ejercicio = models.AutoField(primary_key=True)
    nombre_ejercicio = models.CharField(max_length=45)
    descripcion_ejercicio = models.TextField(null=True, blank=True)
    musculo_principal = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre_ejercicio


# Tabla de rutinas
class Rutina(models.Model):
    id_rutina = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    nombre_rutina = models.CharField(max_length=100)
    descripcion_rutina = models.TextField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.nombre_rutina} - {self.usuario.nombre}"


# Relación entre rutinas y ejercicios
class RutinaEjercicio(models.Model):
    rutina = models.ForeignKey(Rutina, on_delete=models.CASCADE)
    ejercicio = models.ForeignKey(Ejercicio, on_delete=models.CASCADE)
    series = models.PositiveIntegerField()
    repeticiones = models.PositiveIntegerField()
    peso = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.rutina.nombre_rutina} - {self.ejercicio.nombre_ejercicio}"


# Tabla de progresos
class Progreso(models.Model):
    id_progreso = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    ejercicio = models.ForeignKey(Ejercicio, on_delete=models.CASCADE)
    fecha = models.DateField()
    peso_usado = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    repeticiones_realizadas = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.usuario.nombre} - {self.ejercicio.nombre_ejercicio} ({self.fecha})"