# backend/views.py
from django.shortcuts import render
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Developer, Project, Apartment
from .serializers import (
    DeveloperSerializer, DeveloperDetailSerializer,
    ProjectSerializer, ProjectDetailSerializer,
    ApartmentSerializer, ApartmentDetailSerializer
)

def home(request):
    return render(request, "index.html")

class DeveloperViewSet(viewsets.ModelViewSet):
    queryset = Developer.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DeveloperDetailSerializer
        return DeveloperSerializer
    
    def get_queryset(self):
        if self.action == 'retrieve':
            # Для детальной страницы загружаем проекты
            return Developer.objects.prefetch_related(
                'projects__images',
                'projects__developer'
            )
        return Developer.objects.all()

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related('developer').prefetch_related('images')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["city", "developer", "completion_date"]
    search_fields = ["name", "city", "address"]
    ordering_fields = ["price_per_m2", "completion_date"]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer
    
    def get_queryset(self):
        if self.action == 'retrieve':
            # Для детальной страницы загружаем все связанные данные
            return Project.objects.select_related('developer').prefetch_related(
                'images',
                'apartments'
            )
        return Project.objects.select_related('developer').prefetch_related('images')

class ApartmentViewSet(viewsets.ModelViewSet):
    queryset = Apartment.objects.select_related('project__developer')
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["project", "rooms", "floor", "size_m2"]
    ordering_fields = ["price", "size_m2"]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ApartmentDetailSerializer
        return ApartmentSerializer
