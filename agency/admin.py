# agency/admin.py
from django.contrib import admin

from .models import (
    Agent, Complex, Condition, Deal, District, Listing, ListingImage,
    ListingStatus, PropertyType, Series,
)


class DictionaryAdmin(admin.ModelAdmin):
    list_display = ("name", "position", "is_active")
    list_editable = ("position", "is_active")
    search_fields = ("name",)


for model in (PropertyType, District, Series, Complex, Condition, ListingStatus):
    admin.site.register(model, DictionaryAdmin)


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "phone", "is_active")
    list_filter = ("is_active",)
    search_fields = ("full_name", "phone", "user__username")
    autocomplete_fields = ("user",)


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = (
        "id", "title", "deal_type", "price", "currency", "status", "curator",
        "created_at", "deleted_at",
    )
    list_filter = (
        "deal_type", "property_type", "district", "condition", "status",
        "is_urgent", "is_exclusive", "is_alternative", "is_barter",
    )
    search_fields = ("id", "description", "landmark", "address", "owner_phone")
    autocomplete_fields = ("complex", "series", "curator")
    inlines = [ListingImageInline]
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("deal_type", "property_type", "status", "curator")}),
        ("Расположение", {"fields": ("district", "complex", "series", "landmark", "address")}),
        ("Параметры", {"fields": ("rooms", "floor", "total_floors", "area_m2", "condition")}),
        ("Цена", {"fields": ("price", "currency")}),
        ("Метки", {"fields": ("is_urgent", "is_exclusive", "is_alternative", "is_barter")}),
        ("Описание", {"fields": ("description", "owner_phone", "internal_note")}),
        ("Служебное", {"fields": ("created_by", "created_at", "updated_at",
                                  "deleted_at", "deleted_by")}),
    )

    @admin.display(description="Заголовок")
    def title(self, obj):
        return obj.title


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = (
        "id", "client_name", "listing", "curator", "deal_date",
        "amount", "commission", "currency", "is_paid",
    )
    list_filter = ("is_paid", "currency", "curator")
    search_fields = ("client_name", "note")
    autocomplete_fields = ("listing", "curator")
    date_hierarchy = "deal_date"
