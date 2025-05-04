from rest_framework.routers import DefaultRouter
from backend.views import DeveloperViewSet, ProjectViewSet, ApartmentViewSet

router = DefaultRouter()
router.register(r"developers", DeveloperViewSet, basename="developer")
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"apartments", ApartmentViewSet, basename="apartment")

urlpatterns = router.urls
