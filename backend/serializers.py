# backend/serializers.py
from rest_framework import serializers
from .models import Developer, Project, ProjectImage, Apartment


class DeveloperSerializer(serializers.ModelSerializer):
    """Краткая информация о застройщике для списков"""
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Developer
        fields = ["id", "name", "logo_url", "description", "website"]

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
    """Сериализатор квартиры без проекта (для списка в проекте)"""
    class Meta:
        model = Apartment
        fields = ["id", "floor", "rooms", "size_m2", "price", "status", "apartment_number"]


class ProjectSerializer(serializers.ModelSerializer):
    """Краткая информация о проекте для списков"""
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
    """Детальная информация о проекте + квартиры"""
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
    """Детальная информация о застройщике + его проекты"""
    projects = ProjectSerializer(many=True, read_only=True)
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Developer
        fields = ["id", "name", "logo_url", "description", "website", "projects"]

    def get_logo_url(self, obj):
        if obj.logo:
            return obj.logo.url
        return obj.logo_url or None


class ApartmentDetailSerializer(serializers.ModelSerializer):
    """Детальная информация о квартире + проект"""
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = Apartment
        fields = "__all__"
