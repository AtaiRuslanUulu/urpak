# agency/serializers.py
from rest_framework import serializers

from .models import (
    Agent, Complex, Condition, Deal, District, Listing, ListingImage,
    ListingStatus, PropertyType, Series,
)

# Поля, которые видит только вошедший агент.
AGENT_ONLY_FIELDS = ("owner_phone", "address", "internal_note")


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


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ["id", "full_name", "phone"]


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
    images = ListingImageSerializer(many=True, read_only=True)
    title = serializers.CharField(read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id", "title", "deal_type",
            "property_type", "district", "complex", "series", "condition",
            "status", "curator",
            "rooms", "floor", "total_floors", "area_m2", "price", "currency",
            "landmark", "description",
            "owner_phone", "address", "internal_note",
            "is_urgent", "is_exclusive", "is_alternative", "is_barter",
            "images", "created_at", "updated_at", "deleted_at",
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
            "rooms", "floor", "total_floors", "area_m2", "price", "currency",
            "landmark", "description",
            "owner_phone", "address", "internal_note",
            "is_urgent", "is_exclusive", "is_alternative", "is_barter",
        ]

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
