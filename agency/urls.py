# agency/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import DealViewSet, DictionariesView, ListingViewSet, MeView

router = DefaultRouter()
router.register("listings", ListingViewSet, basename="listing")
router.register("deals", DealViewSet, basename="deal")

urlpatterns = [
    path("dictionaries/", DictionariesView.as_view(), name="agency-dictionaries"),
    path("auth/login/", TokenObtainPairView.as_view(), name="agency-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="agency-refresh"),
    path("auth/me/", MeView.as_view(), name="agency-me"),
    path("", include(router.urls)),
]
