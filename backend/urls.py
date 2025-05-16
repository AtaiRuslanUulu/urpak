from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeveloperViewSet, ProjectViewSet, ApartmentViewSet

router = DefaultRouter()
router.register("developers", DeveloperViewSet)
router.register("projects", ProjectViewSet)
router.register("apartments", ApartmentViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
