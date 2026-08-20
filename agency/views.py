# agency/views.py
from django.db.models import Max
from django.db.models.deletion import ProtectedError
from django.http import Http404
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
    DICTIONARY_MODELS, Agent, BuildingStage, Complex, Condition, Deal, District,
    Document, FurnitureOption, Heating, Line, Listing, ListingImage,
    ListingStatus, PaymentCondition, PropertyType, Series, Sewerage,
    WallMaterial, is_manager,
)
from .serializers import (
    AgentDetailSerializer, AgentSerializer, AgentWriteSerializer,
    BuildingStageSerializer, ComplexSerializer,
    ConditionSerializer, DealSerializer, DistrictSerializer, DocumentSerializer,
    FurnitureOptionSerializer, HeatingSerializer, LineSerializer,
    ListingSerializer, ListingStatusSerializer, ListingWriteSerializer,
    PasswordChangeSerializer, PaymentConditionSerializer, ProfileSerializer,
    PropertyTypeSerializer, SeriesSerializer, SewerageSerializer,
    WallMaterialSerializer, DICTIONARY_SERIALIZERS, dictionary_write_serializer,
)

LISTING_RELATIONS = (
    "property_type", "district", "complex", "series", "condition", "status",
    "curator", "stage", "line", "wall_material", "heating", "sewerage",
    "furniture",
)

LISTING_PREFETCH = (
    "images", "documents", "payment_conditions", "curator_history__agent",
)


class IsAgentOrReadOnly(BasePermission):
    """Смотреть может любой (агент показывает базу клиенту), менять — только вошедший."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


class IsManager(BasePermission):
    """Учётки и справочники правит только руководство агентства."""

    def has_permission(self, request, view):
        return is_manager(request.user)


class IsManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_manager(request.user)


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
            .prefetch_related(*LISTING_PREFETCH)
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
        payload = {
            key: DICTIONARY_SERIALIZERS[key](
                model.objects.filter(is_active=True), many=True
            ).data
            for key, model in DICTIONARY_MODELS.items()
        }
        payload["agents"] = AgentSerializer(
            Agent.objects.filter(is_active=True), many=True
        ).data
        payload["deal_types"] = [
            {"id": value, "name": label} for value, label in Listing.DEAL_TYPES
        ]
        payload["currencies"] = [
            {"id": value, "name": label} for value, label in Listing.CURRENCIES
        ]
        return Response(payload)


class DictionaryEntryViewSet(viewsets.ModelViewSet):
    """CRUD одного справочника. Какого именно — говорит `kind` в адресе."""
    permission_classes = [IsManagerOrReadOnly]
    pagination_class = None

    def get_model(self):
        model = DICTIONARY_MODELS.get(self.kwargs.get("kind"))
        if model is None:
            raise Http404("Такого справочника нет")
        return model

    def get_queryset(self):
        return self.get_model().objects.all()

    def get_serializer_class(self):
        return dictionary_write_serializer(self.get_model())

    def destroy(self, request, *args, **kwargs):
        """Значение, на которое ссылаются объекты, не удаляем, а скрываем."""
        entry = self.get_object()
        try:
            entry.delete()
        except ProtectedError:
            entry.is_active = False
            entry.save(update_fields=["is_active"])
            return Response(
                {"detail": "Значение используется в объектах — скрыто из списков."},
                status=status.HTTP_200_OK,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AgentViewSet(viewsets.ModelViewSet):
    """Агенты: читают все вошедшие, правит руководство."""
    queryset = Agent.objects.select_related("user").all()
    pagination_class = None

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsManager()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return AgentWriteSerializer
        return AgentDetailSerializer

    def _read_response(self, agent, http_status=status.HTTP_200_OK):
        return Response(AgentDetailSerializer(agent).data, status=http_status)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return self._read_response(serializer.save(), status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        return self._read_response(serializer.save())

    def destroy(self, request, *args, **kwargs):
        """Уволенного агента отключаем: его объекты и история должны остаться."""
        agent = self.get_object()
        agent.is_active = False
        agent.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Пароль изменён."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def _payload(self, request):
        agent = getattr(request.user, "agent", None)
        return {
            "id": request.user.id,
            "username": request.user.get_username(),
            "is_staff": request.user.is_staff,
            "is_manager": is_manager(request.user),
            "agent": AgentSerializer(agent).data if agent else None,
        }

    def get(self, request):
        return Response(self._payload(request))

    def patch(self, request):
        """Свои контакты агент правит сам, роль и логин — нет."""
        agent = getattr(request.user, "agent", None)
        if agent is None:
            return Response(
                {"detail": "У пользователя нет профиля агента."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ProfileSerializer(agent, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self._payload(request))
