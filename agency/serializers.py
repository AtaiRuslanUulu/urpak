# agency/serializers.py
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from .models import (
    DICTIONARY_MODELS, Agent, CuratorAssignment, Deal, Listing, ListingImage,
)

User = get_user_model()

# Поля, которые видит только вошедший агент.
AGENT_ONLY_FIELDS = ("owner_phone", "address", "internal_note", "sale_reason")


def dictionary_serializer(model_cls):
    """Собирает одинаковый сериализатор для любого справочника."""
    meta = type("Meta", (), {"model": model_cls, "fields": ["id", "name"]})
    return type(f"{model_cls.__name__}Serializer", (serializers.ModelSerializer,), {"Meta": meta})


def dictionary_write_serializer(model_cls):
    """То же самое, но с полями, которые правит руководитель."""
    meta = type("Meta", (), {
        "model": model_cls,
        "fields": ["id", "name", "position", "is_active"],
    })
    return type(
        f"{model_cls.__name__}WriteSerializer",
        (serializers.ModelSerializer,),
        {"Meta": meta},
    )


# Один источник правды: ключи те же, что в DICTIONARY_MODELS, поэтому новый
# справочник достаточно добавить в модель — он сам появится в выдаче и в CRUD.
DICTIONARY_SERIALIZERS = {
    key: dictionary_serializer(model) for key, model in DICTIONARY_MODELS.items()
}

PropertyTypeSerializer = DICTIONARY_SERIALIZERS["property_types"]
DistrictSerializer = DICTIONARY_SERIALIZERS["districts"]
SeriesSerializer = DICTIONARY_SERIALIZERS["series"]
ComplexSerializer = DICTIONARY_SERIALIZERS["complexes"]
ConditionSerializer = DICTIONARY_SERIALIZERS["conditions"]
ListingStatusSerializer = DICTIONARY_SERIALIZERS["statuses"]
BuildingStageSerializer = DICTIONARY_SERIALIZERS["stages"]
LineSerializer = DICTIONARY_SERIALIZERS["lines"]
WallMaterialSerializer = DICTIONARY_SERIALIZERS["wall_materials"]
HeatingSerializer = DICTIONARY_SERIALIZERS["heatings"]
SewerageSerializer = DICTIONARY_SERIALIZERS["sewerages"]
FurnitureOptionSerializer = DICTIONARY_SERIALIZERS["furniture_options"]
DocumentSerializer = DICTIONARY_SERIALIZERS["documents"]
PaymentConditionSerializer = DICTIONARY_SERIALIZERS["payment_conditions"]


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ["id", "full_name", "phone", "whatsapp", "telegram"]


class AgentWriteSerializer(serializers.ModelSerializer):
    """Заводит учётку и профиль агента одним запросом."""

    username = serializers.CharField(source="user.username", max_length=150)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Agent
        fields = [
            "id", "username", "password", "full_name", "phone", "whatsapp",
            "telegram", "is_active", "is_manager",
        ]

    def validate_username(self, value):
        value = value.strip()
        taken = User.objects.filter(username__iexact=value)
        if self.instance:
            taken = taken.exclude(pk=self.instance.user_id)
        if taken.exists():
            raise serializers.ValidationError("Такой логин уже занят.")
        return value

    def validate_password(self, value):
        if not value:
            # На правке пустой пароль значит «не менять».
            if self.instance:
                return value
            raise serializers.ValidationError("Задайте пароль для входа.")
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, attrs):
        if not self.instance and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Задайте пароль для входа."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        username = validated_data.pop("user")["username"]
        password = validated_data.pop("password")
        user = User.objects.create_user(username=username, password=password)
        return Agent.objects.create(user=user, **validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)
        password = validated_data.pop("password", "")

        if user_data and user_data.get("username"):
            instance.user.username = user_data["username"]
        if password:
            instance.user.set_password(password)
        if user_data or password:
            instance.user.save()

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class AgentDetailSerializer(serializers.ModelSerializer):
    """Чтение агента для раздела управления."""
    username = serializers.CharField(source="user.username", read_only=True)
    listings_count = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = [
            "id", "username", "full_name", "phone", "whatsapp", "telegram",
            "is_active", "is_manager", "listings_count",
        ]

    def get_listings_count(self, obj):
        return obj.listings.filter(deleted_at__isnull=True).count()


class ProfileSerializer(serializers.ModelSerializer):
    """Агент правит собственные контакты, но не роль и не доступ."""

    class Meta:
        model = Agent
        fields = ["id", "full_name", "phone", "whatsapp", "telegram"]


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField()

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Текущий пароль указан неверно.")
        return value

    def validate_new_password(self, value):
        try:
            validate_password(value, self.context["request"].user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class CuratorAssignmentSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source="agent.full_name", read_only=True)

    class Meta:
        model = CuratorAssignment
        fields = ["id", "agent", "agent_name", "assigned_at"]


class ListingImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ListingImage
        fields = ["id", "url", "position"]

    def get_url(self, obj):
        return obj.image.url if obj.image else None


class ListingSerializer(serializers.ModelSerializer):
    """Чтение объекта. Агентские поля вырезаются для анонимов."""

    property_type = PropertyTypeSerializer(read_only=True)
    district = DistrictSerializer(read_only=True)
    complex = ComplexSerializer(read_only=True)
    series = SeriesSerializer(read_only=True)
    condition = ConditionSerializer(read_only=True)
    status = ListingStatusSerializer(read_only=True)
    curator = AgentSerializer(read_only=True)
    stage = BuildingStageSerializer(read_only=True)
    line = LineSerializer(read_only=True)
    wall_material = WallMaterialSerializer(read_only=True)
    heating = HeatingSerializer(read_only=True)
    sewerage = SewerageSerializer(read_only=True)
    furniture = FurnitureOptionSerializer(read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    payment_conditions = PaymentConditionSerializer(many=True, read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)
    curator_history = CuratorAssignmentSerializer(many=True, read_only=True)
    title = serializers.CharField(read_only=True)
    full_title = serializers.CharField(read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id", "title", "full_title", "deal_type",
            "property_type", "district", "complex", "series", "condition",
            "status", "curator",
            "stage", "line", "wall_material", "heating", "sewerage", "furniture",
            "documents", "payment_conditions",
            "rooms", "floor", "total_floors", "area_m2", "built_date",
            "has_gas", "has_electricity", "has_water", "has_topography",
            "price", "currency",
            "landmark", "description",
            "owner_phone", "address", "internal_note", "sale_reason",
            "is_urgent", "is_exclusive", "is_alternative", "is_barter",
            "images", "curator_history",
            "created_at", "updated_at", "deleted_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if not (request and request.user and request.user.is_authenticated):
            for field in AGENT_ONLY_FIELDS:
                data.pop(field, None)
        return data


class ListingWriteSerializer(serializers.ModelSerializer):
    """Создание и правка объекта: связи передаются идентификаторами."""

    class Meta:
        model = Listing
        fields = [
            "deal_type",
            "property_type", "district", "complex", "series", "condition",
            "status", "curator",
            "stage", "line", "wall_material", "heating", "sewerage", "furniture",
            "documents", "payment_conditions",
            "rooms", "floor", "total_floors", "area_m2", "built_date",
            "has_gas", "has_electricity", "has_water", "has_topography",
            "price", "currency",
            "landmark", "description",
            "owner_phone", "address", "internal_note", "sale_reason",
            "is_urgent", "is_exclusive", "is_alternative", "is_barter",
        ]

    M2M_FIELDS = ("documents", "payment_conditions")

    def to_internal_value(self, data):
        # multipart не умеет передать пустой список: когда агент снимает все
        # галочки, фронт шлёт ключ с пустой строкой — разворачиваем её в [].
        if hasattr(data, "getlist"):
            data = data.copy()
            for field in self.M2M_FIELDS:
                if data.getlist(field) == [""]:
                    data.setlist(field, [])
        return super().to_internal_value(data)

    def _actor(self):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        return user if (user and user.is_authenticated) else None

    def _save_instance(self, instance, validated_data):
        """Сохраняем вручную, чтобы модель успела записать историю куратора."""
        related = {
            field: validated_data.pop(field)
            for field in self.M2M_FIELDS
            if field in validated_data
        }
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance._history_actor = self._actor()
        instance.save()
        for field, value in related.items():
            getattr(instance, field).set(value)
        return instance

    def create(self, validated_data):
        return self._save_instance(Listing(), validated_data)

    def update(self, instance, validated_data):
        return self._save_instance(instance, validated_data)

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Цена не может быть отрицательной.")
        return value

    def validate_area_m2(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Площадь должна быть больше нуля.")
        return value

    def validate(self, attrs):
        floor = attrs.get("floor", getattr(self.instance, "floor", None))
        total = attrs.get("total_floors", getattr(self.instance, "total_floors", None))
        if floor is not None and total is not None and floor > total:
            raise serializers.ValidationError(
                {"floor": "Этаж не может быть больше этажности дома."}
            )
        return attrs


class DealSerializer(serializers.ModelSerializer):
    curator_name = serializers.CharField(source="curator.full_name", read_only=True)
    listing_title = serializers.CharField(source="listing.title", read_only=True)

    class Meta:
        model = Deal
        fields = [
            "id", "listing", "listing_title", "curator", "curator_name",
            "client_name", "deal_date", "amount", "commission", "currency",
            "is_paid", "note", "created_at",
        ]
