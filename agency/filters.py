# agency/filters.py
import django_filters as df
from django.db.models import Q

from .models import Listing


class ListingFilter(df.FilterSet):
    """Фильтры панели поиска: имена параметров = поля формы на фронте."""

    id = df.NumberFilter(field_name="pk")
    q = df.CharFilter(method="filter_keywords", label="Ключевые слова")

    price_min = df.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = df.NumberFilter(field_name="price", lookup_expr="lte")
    area_min = df.NumberFilter(field_name="area_m2", lookup_expr="gte")
    area_max = df.NumberFilter(field_name="area_m2", lookup_expr="lte")

    tab = df.CharFilter(method="filter_tab", label="Секция")

    class Meta:
        model = Listing
        fields = [
            "deal_type", "property_type", "district", "complex", "series",
            "condition", "status", "curator", "rooms", "floor",
        ]

    def filter_keywords(self, queryset, name, value):
        value = (value or "").strip()
        if not value:
            return queryset

        condition = (
            Q(description__icontains=value)
            | Q(landmark__icontains=value)
            | Q(complex__name__icontains=value)
            | Q(series__name__icontains=value)
            | Q(district__name__icontains=value)
        )
        # Точный адрес — агентское поле, по нему ищем только вошедшим,
        # иначе адрес можно восстановить перебором через поиск.
        if self._is_agent():
            condition |= Q(address__icontains=value)

        return queryset.filter(condition)

    def filter_tab(self, queryset, name, value):
        if value == "mine":
            if not self._is_agent():
                return queryset.none()
            return queryset.filter(curator__user=self.request.user)
        if value == "exclusive":
            return queryset.filter(is_exclusive=True)
        if value == "alternative":
            return queryset.filter(is_alternative=True)
        if value == "barter":
            return queryset.filter(is_barter=True)
        return queryset

    def _is_agent(self):
        user = getattr(self.request, "user", None)
        return bool(user and user.is_authenticated)
