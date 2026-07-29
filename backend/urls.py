from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DeveloperViewSet, ProjectViewSet, ApartmentViewSet
from .views_submit import (
    SubmitDeveloperView,
    SubmitProjectView,
    SubmitApartmentView,
)

router = DefaultRouter()
router.register("developers", DeveloperViewSet)
router.register("projects", ProjectViewSet)
router.register("apartments", ApartmentViewSet)

urlpatterns = [
    # Публичные формы (POST)
    path("submit/developer/", SubmitDeveloperView.as_view(), name="submit-developer"),
    path("submit/project/", SubmitProjectView.as_view(), name="submit-project"),
    path("submit/apartment/", SubmitApartmentView.as_view(), name="submit-apartment"),

    # Витрина и остальное API (как было)
    path("", include(router.urls)),
]
