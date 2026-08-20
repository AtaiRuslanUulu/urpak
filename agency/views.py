# agency/views.py
from django.db.models import Max
from rest_framework import filters as drf_filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import (
    AllowAny, SAFE_METHODS, BasePermission, IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .filters import ListingFilter
from .models import (
    Agent, Complex, Condition, Deal, District, Listing, ListingImage,
    ListingStatus, PropertyType, Series,
)
from .serializers import (
    AgentSerializer, ComplexSerializer, ConditionSerializer, DealSerializer,
    DistrictSerializer, ListingSerializer, ListingStatusSerializer,
    ListingWriteSerializer, PropertyTypeSerializer, SeriesSerializer,
)

LISTING_RELATIONS = (
    "property_type", "district", "complex", "series", "condition", "status",
    "curator",
)


class IsAgentOrReadOnly(BasePermission):
    """Смотреть может любой (агент показывает базу клиенту), менять — только вошедший."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


class ListingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAgentOrReadOnly]
    filter_backends = [DjangoFilterBackend, drf_filters.OrderingFilter]
    filterset_class = ListingFilter
    ordering_fields = ["created_at", "price", "area_m2"]
    ordering = ["-created_at"]
    queryset = Listing.objects.all()

    def get_queryset(self):
        base = (
            Listing.objects
            .select_related(*LISTING_RELATIONS, "curator__user")
            .prefetch_related("images")
        )
        # `restore` и `deleted` работают с корзиной, остальное — с живыми объектами.
        if self.action in ("restore", "deleted"):
            return base.dead()
        return base.alive()

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ListingWriteSerializer
        return ListingSerializer

    def _read_response(self, instance, http_status=status.HTTP_200_OK):
        serializer = ListingSerializer(instance, context=self.get_serializer_context())
        return Response(serializer.data, status=http_status)

    def _attach_images(self, listing):
        """Файлы приходят multipart'ом под ключом `images`."""
        files = self.request.FILES.getlist("images")
        if not files:
            return
        top = listing.images.aggregate(top=Max("position"))["top"]
        start = 0 if top is None else top + 1
        ListingImage.objects.bulk_create([
            ListingImage(listing=listing, image=f, position=start + offset)
            for offset, f in enumerate(files)
        ])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        listing = serializer.save(created_by=request.user)
        self._attach_images(listing)
        return self._read_response(listing, status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        listing = serializer.save()
        self._attach_images(listing)
        return self._read_response(listing)

    def destroy(self, request, *args, **kwargs):
        """Удаление всегда мягкое: объект уезжает в раздел «Удалённые»."""
        listing = self.get_object()
        listing.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def deleted(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = ListingSerializer(
            page if page is not None else queryset,
            many=True,
            context=self.get_serializer_context(),
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def restore(self, request, pk=None):
        listing = self.get_object()
        listing.restore()
        return self._read_response(listing)

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"images/(?P<image_id>\d+)",
        permission_classes=[IsAuthenticated],
    )
    def remove_image(self, request, pk=None, image_id=None):
        listing = self.get_object()
        deleted, _ = listing.images.filter(pk=image_id).delete()
        if not deleted:
            return Response({"detail": "Фото не найдено."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DealViewSet(viewsets.ModelViewSet):
    """Счета — внутренний учёт комиссий, наружу не показываем."""
    permission_classes = [IsAuthenticated]
    serializer_class = DealSerializer
    filter_backends = [DjangoFilterBackend, drf_filters.OrderingFilter]
    filterset_fields = ["curator", "is_paid", "currency", "listing"]
    ordering_fields = ["deal_date", "commission", "amount"]
    ordering = ["-deal_date"]
    queryset = Deal.objects.select_related("curator", "listing").all()


class DictionariesView(APIView):
    """Все справочники одним запросом — фронту нужно заполнить селекты фильтров."""
    permission_classes = [AllowAny]

    def get(self, request):
        def items(model_cls, serializer_cls):
            return serializer_cls(
                model_cls.objects.filter(is_active=True), many=True
            ).data

        return Response({
            "property_types": items(PropertyType, PropertyTypeSerializer),
            "districts": items(District, DistrictSerializer),
            "series": items(Series, SeriesSerializer),
            "complexes": items(Complex, ComplexSerializer),
            "conditions": items(Condition, ConditionSerializer),
            "statuses": items(ListingStatus, ListingStatusSerializer),
            "agents": AgentSerializer(
                Agent.objects.filter(is_active=True), many=True
            ).data,
            "deal_types": [
                {"id": value, "name": label} for value, label in Listing.DEAL_TYPES
            ],
            "currencies": [
                {"id": value, "name": label} for value, label in Listing.CURRENCIES
            ],
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        agent = getattr(request.user, "agent", None)
        return Response({
            "id": request.user.id,
            "username": request.user.get_username(),
            "is_staff": request.user.is_staff,
            "agent": AgentSerializer(agent).data if agent else None,
        })
