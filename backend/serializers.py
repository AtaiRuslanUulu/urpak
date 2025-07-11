# backend/serializers.py
from rest_framework import serializers
from .models import Developer, Project, ProjectImage, Apartment

class DeveloperSerializer(serializers.ModelSerializer):
    """Краткая информация о застройщике для списков"""
    class Meta:
        model = Developer
        fields = ["id", "name", "logo_url", "description", "website"]

class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ["url", "caption", "position"]

class ApartmentSerializer(serializers.ModelSerializer):
    """Сериализатор квартиры без проекта (для списка в проекте)"""
    class Meta:
        model = Apartment
        fields = ["id", "floor", "rooms", "size_m2", "price"]

class ProjectSerializer(serializers.ModelSerializer):
    """Краткая информация о проекте для списков"""
    images = ProjectImageSerializer(many=True, read_only=True)
    developer = DeveloperSerializer(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "name", "developer", "city", "address",
            "completion_date", "price_per_m2", "main_image_url", "images"
        ]

class ProjectDetailSerializer(serializers.ModelSerializer):
    """Детальная информация о проекте + квартиры"""
    images = ProjectImageSerializer(many=True, read_only=True)
    developer = DeveloperSerializer(read_only=True)
    apartments = ApartmentSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "name", "developer", "city", "address",
            "completion_date", "price_per_m2", "main_image_url", 
            "images", "apartments"
        ]

class DeveloperDetailSerializer(serializers.ModelSerializer):
    """Детальная информация о застройщике + его проекты"""
    projects = ProjectSerializer(many=True, read_only=True)
    
    class Meta:
        model = Developer
        fields = ["id", "name", "logo_url", "description", "website", "projects"]

class ApartmentDetailSerializer(serializers.ModelSerializer):
    """Детальная информация о квартире + проект"""
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = Apartment
        fields = "__all__"
