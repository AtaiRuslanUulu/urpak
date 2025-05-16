from rest_framework import serializers
from .models import Developer, Project, ProjectImage, Apartment

class DeveloperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Developer
        fields = ["id", "name", "logo_url", "description", "website"]


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ["url", "caption", "position"]


class ProjectSerializer(serializers.ModelSerializer):
    images = ProjectImageSerializer(many=True, read_only=True)
    developer = DeveloperSerializer(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "name", "developer", "city", "address",
            "completion_date", "price_per_m2", "main_image_url", "images"
        ]


class ApartmentSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = Apartment
        fields = "__all__"
