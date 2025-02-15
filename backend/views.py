from django.shortcuts import render
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Developer, Project, Apartment
from .serializers import DeveloperSerializer, ProjectSerializer, ApartmentSerializer

def home(request):
    return render(request, "index.html")

class DeveloperViewSet(viewsets.ModelViewSet):
    queryset = Developer.objects.all()
    serializer_class = DeveloperSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["city", "developer", "completion_date"]
    search_fields = ["name", "city", "address"]
    ordering_fields = ["price_per_m2", "completion_date"]


class ApartmentViewSet(viewsets.ModelViewSet):
    queryset = Apartment.objects.all()
    serializer_class = ApartmentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["project", "rooms", "floor", "size_m2"]
    ordering_fields = ["price", "size_m2"]
