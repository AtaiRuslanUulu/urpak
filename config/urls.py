from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from backend.views import DeveloperViewSet, ProjectViewSet, ApartmentViewSet, home
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r"developers", DeveloperViewSet)
router.register(r"projects", ProjectViewSet)
router.register(r"apartments", ApartmentViewSet)

urlpatterns = [
    path("", home),
    path('admin/', admin.site.urls),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
