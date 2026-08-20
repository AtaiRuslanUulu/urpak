# agency/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    AgentViewSet, DealViewSet, DictionariesView, DictionaryEntryViewSet,
    ListingViewSet, MeView, PasswordChangeView,
)

router = DefaultRouter()
router.register("listings", ListingViewSet, basename="listing")
router.register("deals", DealViewSet, basename="deal")
router.register("agents", AgentViewSet, basename="agent")

dictionary_list = DictionaryEntryViewSet.as_view({"get": "list", "post": "create"})
dictionary_detail = DictionaryEntryViewSet.as_view({
    "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy",
})

urlpatterns = [
    path("dictionaries/", DictionariesView.as_view(), name="agency-dictionaries"),
    path("dictionaries/<str:kind>/", dictionary_list, name="agency-dictionary-list"),
    path(
        "dictionaries/<str:kind>/<int:pk>/",
        dictionary_detail,
        name="agency-dictionary-detail",
    ),
    path("auth/login/", TokenObtainPairView.as_view(), name="agency-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="agency-refresh"),
    path("auth/me/", MeView.as_view(), name="agency-me"),
    path("auth/password/", PasswordChangeView.as_view(), name="agency-password"),
    path("", include(router.urls)),
]
