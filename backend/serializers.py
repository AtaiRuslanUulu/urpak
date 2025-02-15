from rest_framework import serializers
from .models import Developer, Project, Apartment

class DeveloperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Developer
        fields = ["id", "name", "logo","description", "website"]

class ProjectSerializer(serializers.ModelSerializer):
    developer = DeveloperSerializer()  # Вложенный сериализатор

    class Meta:
        model = Project
        fields = ["id", "name", "developer", "city", "address", "completion_date", "price_per_m2", "images"]


class ApartmentSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = Apartment
        fields = "__all__"
