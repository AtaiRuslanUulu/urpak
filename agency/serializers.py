# agency/serializers.py
from rest_framework import serializers

from .models import (
    Agent, BuildingStage, Complex, Condition, CuratorAssignment, Deal, District,
    Document, FurnitureOption, Heating, Line, Listing, ListingImage,
    ListingStatus, PaymentCondition, PropertyType, Series, Sewerage, WallMaterial,
)

# Поля, которые видит только вошедший агент.
AGENT_ONLY_FIELDS = ("owner_phone", "address", "internal_note", "sale_reason")


def dictionary_serializer(model_cls):
    """Собирает одинаковый сериализатор для любого справочника."""
    meta = type("Meta", (), {"model": model_cls, "fields": ["id", "name"]})
    return type(f"{model_cls.__name__}Serializer", (serializers.ModelSerializer,), {"Meta": meta})


PropertyTypeSerializer = dictionary_serializer(PropertyType)
DistrictSerializer = dictionary_serializer(District)
SeriesSerializer = dictionary_serializer(Series)
ComplexSerializer = dictionary_serializer(Complex)
ConditionSerializer = dictionary_serializer(Condition)
ListingStatusSerializer = dictionary_serializer(ListingStatus)
BuildingStageSerializer = dictionary_serializer(BuildingStage)
LineSerializer = dictionary_serializer(Line)
WallMaterialSerializer = dictionary_serializer(WallMaterial)
HeatingSerializer = dictionary_serializer(Heating)
SewerageSerializer = dictionary_serializer(Sewerage)
FurnitureOptionSerializer = dictionary_serializer(FurnitureOption)
DocumentSerializer = dictionary_serializer(Document)
PaymentConditionSerializer = dictionary_serializer(PaymentCondition)


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ["id", "full_name", "phone", "whatsapp", "telegram"]


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
