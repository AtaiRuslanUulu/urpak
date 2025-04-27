from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.http import HttpResponse
from backend.views import DeveloperViewSet, ProjectViewSet, ApartmentViewSet, home

router = DefaultRouter()
router.register(r"developers", DeveloperViewSet)
router.register(r"projects", ProjectViewSet)
router.register(r"apartments", ApartmentViewSet)

def home(request):
    return HttpResponse("<h1>Welcome to Real Estate API</h1>")

urlpatterns = [
    path("", home),
    path("api/", include(router.urls)),
]
