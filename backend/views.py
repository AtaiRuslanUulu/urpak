# backend/views.py
from django.db.models import Prefetch
from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from .models import Developer, Project, Apartment
from .serializers import (
    DeveloperSerializer, DeveloperDetailSerializer,
    ProjectSerializer, ProjectDetailSerializer,
    ApartmentSerializer, ApartmentDetailSerializer,
)


class DeveloperViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Витрина по застройщикам.
    - Списки: показываем только одобренных застройщиков.
    - Деталка: сам застройщик должен быть одобрен; подмешиваем ТОЛЬКО одобренные проекты (с картинками).
    """
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    # ВАЖНО: .queryset нужен роутеру на этапе регистрации
    # order_by обязателен: без него пагинация может терять и дублировать записи
    queryset = Developer.objects.filter(is_approved=True).order_by("name")

    def get_serializer_class(self):
        return DeveloperDetailSerializer if self.action == "retrieve" else DeveloperSerializer

    def get_queryset(self):
        base = Developer.objects.filter(is_approved=True).order_by("name")

        if self.action == "retrieve":
            approved_projects = (
                Project.objects.filter(is_approved=True)
                .prefetch_related("images")
                .select_related("developer")
            )
            return base.prefetch_related(
                Prefetch("projects", queryset=approved_projects),
            )

        return base


class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Витрина по проектам.
    - Списки: только одобренные проекты у одобренных застройщиков.
    - Деталка: проект одобрен; подмешиваем его изображения и ТОЛЬКО одобренные квартиры.
    """
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["city", "developer", "completion_date"]
    search_fields = ["name", "city", "address"]
    ordering_fields = ["price_per_m2", "completion_date"]
    ordering = ["completion_date"]

    # Нужен базовый queryset для роутера
    queryset = Project.objects.filter(is_approved=True, developer__is_approved=True).select_related("developer")

    def get_serializer_class(self):
        return ProjectDetailSerializer if self.action == "retrieve" else ProjectSerializer

    def get_queryset(self):
        base = (
            Project.objects
            .filter(is_approved=True, developer__is_approved=True)
            .select_related("developer")
        )

        if self.action == "retrieve":
            approved_apartments = Apartment.objects.filter(is_approved=True)
            return base.prefetch_related(
                "images",
                Prefetch("apartments", queryset=approved_apartments),
            )

        return base.prefetch_related("images")


class ApartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Витрина по квартирам.
    - Только одобренные квартиры из одобренных проектов у одобренных застройщиков.
    """
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["project", "rooms", "floor", "size_m2"]
    ordering_fields = ["price", "size_m2"]
    ordering = ["price"]

    # Нужен базовый queryset для роутера
    queryset = Apartment.objects.filter(
        is_approved=True,
        project__is_approved=True,
        project__developer__is_approved=True,
    ).select_related("project", "project__developer")

    def get_serializer_class(self):
        return ApartmentDetailSerializer if self.action == "retrieve" else ApartmentSerializer

    def get_queryset(self):
        return Apartment.objects.filter(
            is_approved=True,
            project__is_approved=True,
            project__developer__is_approved=True,
        ).select_related("project", "project__developer")
