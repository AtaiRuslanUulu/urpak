from rest_framework import serializers
from .models import Developer, Project, Apartment

class DeveloperSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Developer
        fields = ["id", "name", "logo", "description", "website"]

    def get_logo(self, obj):
        request = self.context.get("request")
        if obj.logo and request:
            return request.build_absolute_uri(obj.logo.url).replace("http://", "https://")
        return None

class ProjectSerializer(serializers.ModelSerializer):
    developer = DeveloperSerializer()

    class Meta:
        model = Project
        fields = ["id", "name", "developer", "city", "address", "completion_date", "price_per_m2", "images"]


class ApartmentSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)

    class Meta:
        model = Apartment
        fields = "__all__"
