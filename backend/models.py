# backend/models.py
from django.db import models

class Developer(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    logo_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL логотипа (для старых записей)"
    )
    logo = models.ImageField(
        upload_to="developers/logos/",
        blank=True,
        null=True,
        help_text="Загрузить логотип (автоматически уйдёт на S3)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Project(models.Model):
    name = models.CharField(max_length=255)
    developer = models.ForeignKey(
        Developer,
        on_delete=models.CASCADE,
        related_name="projects"
    )
    city = models.CharField(max_length=100)
    address = models.TextField()
    completion_date = models.DateField()
    price_per_m2 = models.DecimalField(max_digits=10, decimal_places=2)
    main_image_url = models.URLField(
        blank=True,
        null=True,
        help_text="URL главного фото (для старых записей)"
    )
    main_image = models.ImageField(
        upload_to="projects/main/",
        blank=True,
        null=True,
        help_text="Загрузить главное фото проекта"
    )
    # Добавляем описание проекта
    description = models.TextField(
        blank=True, 
        null=True,
        help_text="Подробное описание проекта"
    )

    def __str__(self):
        return self.name

class ProjectImage(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="images"
    )
    url = models.URLField("S3 URL", blank=True)
    image = models.ImageField(
        upload_to="projects/gallery/",
        blank=True,
        null=True,
        help_text="Загрузить фото для галереи"
    )
    caption = models.CharField(max_length=255, blank=True)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return f"{self.project.name} — img #{self.position}"

class Apartment(models.Model):
    APARTMENT_STATUS = [
        ('available', 'В наличии'),
        ('reserved', 'Забронирована'),
        ('sold', 'Продана'),
    ]
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="apartments"
    )
    floor = models.IntegerField()
    rooms = models.IntegerField()
    size_m2 = models.DecimalField(max_digits=6, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Добавляем новые поля
    status = models.CharField(
        max_length=20,
        choices=APARTMENT_STATUS,
        default='available'
    )
    apartment_number = models.CharField(
        max_length=10,
        blank=True,
        help_text="Номер квартиры (например, 42, 12А)"
    )
    
    # Для обратной совместимости
    @property
    def is_available(self):
        return self.status == 'available'

    def __str__(self):
        return f"{self.rooms}-комн. ({self.size_m2} м²) в {self.project.name}"

    class Meta:
        ordering = ['floor', 'apartment_number']
