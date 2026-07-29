# backend/serializers.py
from django.core.validators import URLValidator
from rest_framework import serializers
import re

from .models import Apartment, Developer, Project, ProjectImage


# =========================
# Read-only serializers (витрина)
# =========================

class DeveloperSerializer(serializers.ModelSerializer):
    """Краткая информация о застройщике для списков/внутренних вложений."""
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Developer
        fields = [
            "id",
            "name",
            "logo_url",
            "description",
            "website",
            "contact_phone",   # ← показываем телефон/WhatsApp, если указан
        ]

    def get_logo_url(self, obj):
        if obj.logo:
            return obj.logo.url
        return obj.logo_url or None


class ProjectImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectImage
        fields = ["url", "caption", "position"]

    def get_url(self, obj):
        if obj.image:
            return obj.image.url
        return obj.url or None


class ApartmentSerializer(serializers.ModelSerializer):
    """
    Отдаём квартиры в проекте (для таблиц/листингов).
    Включаем статус и номер квартиры — они нужны на фронте.
    """
    class Meta:
        model = Apartment
        fields = ["id", "floor", "rooms", "size_m2", "price", "status", "apartment_number"]


class ProjectSerializer(serializers.ModelSerializer):
    """
    Краткая карточка проекта для списков, с изображениями и кратким девелопером.
    """
    images = ProjectImageSerializer(many=True, read_only=True)
    developer = DeveloperSerializer(read_only=True)
    main_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "name", "developer", "city", "address",
            "completion_date", "price_per_m2", "main_image_url", "description", "images"
        ]

    def get_main_image_url(self, obj):
        if obj.main_image:
            return obj.main_image.url
        return obj.main_image_url or None


class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    Детальная карточка проекта, включая квартиры.
    """
    images = ProjectImageSerializer(many=True, read_only=True)
    developer = DeveloperSerializer(read_only=True)
    apartments = ApartmentSerializer(many=True, read_only=True)
    main_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "name", "developer", "city", "address",
            "completion_date", "price_per_m2", "main_image_url",
            "description", "images", "apartments"
        ]

    def get_main_image_url(self, obj):
        if obj.main_image:
            return obj.main_image.url
        return obj.main_image_url or None


class DeveloperDetailSerializer(serializers.ModelSerializer):
    """
    Детальная карточка застройщика со списком его проектов.
    """
    projects = ProjectSerializer(many=True, read_only=True)
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Developer
        fields = [
            "id",
            "name",
            "logo_url",
            "description",
            "website",
            "contact_phone",
            "projects",
        ]

    def get_logo_url(self, obj):
        if obj.logo:
            return obj.logo.url
        return obj.logo_url or None


class ApartmentDetailSerializer(serializers.ModelSerializer):
    """
    Детальная карточка квартиры, включает краткий проект.
    """
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = Apartment
        fields = "__all__"


# =========================
# Submit serializers (публичные формы, мягкая валидация)
# =========================

_PHONE_RE = re.compile(r"^[\d\+\-\(\)\s]{5,32}$")  # очень мягкая проверка


class DeveloperSubmitSerializer(serializers.ModelSerializer):
    """
    Партнёры отправляют минимум:
    - name (обязателен)
    - website/logo_url/contact_phone — опционально, валидируем только если есть
    - description — опционально
    """
    contact_phone = serializers.CharField(
        required=False, allow_blank=True, max_length=32
    )

    class Meta:
        model = Developer
        fields = ["name", "description", "website", "logo_url", "contact_phone"]

    def validate_website(self, v):
        if v:
            URLValidator()(v)
        return v

    def validate_logo_url(self, v):
        if v:
            URLValidator()(v)
        return v

    def validate_contact_phone(self, v):
        if v and not _PHONE_RE.match(v):
            raise serializers.ValidationError("Укажите телефон/WhatsApp в свободном формате (+996 ...).")
        return v


class ProjectSubmitSerializer(serializers.ModelSerializer):
    """
    Проект: мягкая валидация.
    Обязательное: name, developer (id), city.
    Остальное — опционально.
    """
    developer = serializers.PrimaryKeyRelatedField(queryset=Developer.objects.all())
    address = serializers.CharField(required=False, allow_blank=True)
    main_image_url = serializers.URLField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Project
        fields = [
            "name",
            "developer",
            "city",
            "address",
            "completion_date",
            "price_per_m2",
            "main_image_url",
            "description",
        ]

    def validate_main_image_url(self, v):
        if v:
            URLValidator()(v)
        return v

    def validate_price_per_m2(self, v):
        if v is not None and v < 0:
            raise serializers.ValidationError("Цена за м² не может быть отрицательной.")
        return v


class ApartmentSubmitSerializer(serializers.ModelSerializer):
    """
    Квартира: требуем только rooms, size_m2, price, project.
    Остальное — мягко и опционально.
    """
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    floor = serializers.IntegerField(required=False, allow_null=True)
    apartment_number = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=[("available", "available"), ("reserved", "reserved"), ("sold", "sold")],
        required=False,
        default="available",
    )

    class Meta:
        model = Apartment
        fields = [
            "project",
            "rooms",
            "size_m2",
            "price",
            "floor",
            "status",
            "apartment_number",
        ]

    def validate_rooms(self, v):
        if v <= 0 or v > 10:
            raise serializers.ValidationError("Комнат должно быть от 1 до 10.")
        return v

    def validate_size_m2(self, v):
        if v <= 0 or v > 1000:
            raise serializers.ValidationError("Площадь должна быть > 0 и ≤ 1000 м².")
        return v

    def validate_price(self, v):
        if v < 0 or v > 10_000_000:
            raise serializers.ValidationError("Цена вне разумных пределов.")
        return v
