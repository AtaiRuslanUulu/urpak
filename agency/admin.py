# agency/admin.py
from django.contrib import admin

from .models import (
    Agent, BuildingStage, Complex, Condition, CuratorAssignment, Deal, District,
    Document, FurnitureOption, Heating, Line, Listing, ListingImage,
    ListingStatus, PaymentCondition, PropertyType, Series, Sewerage, WallMaterial,
)


class DictionaryAdmin(admin.ModelAdmin):
    list_display = ("name", "position", "is_active")
    list_editable = ("position", "is_active")
    search_fields = ("name",)


for model in (
    PropertyType, District, Series, Complex, Condition, ListingStatus,
    BuildingStage, Line, WallMaterial, Heating, Sewerage, FurnitureOption,
    Document, PaymentCondition,
):
    admin.site.register(model, DictionaryAdmin)


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = (
        "full_name", "user", "phone", "whatsapp", "telegram", "is_manager",
        "is_active",
    )
    list_filter = ("is_active", "is_manager")
    search_fields = ("full_name", "phone", "user__username")
    autocomplete_fields = ("user",)


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1


class CuratorAssignmentInline(admin.TabularInline):
    model = CuratorAssignment
    extra = 0
    readonly_fields = ("agent", "assigned_by", "assigned_at")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        # История ведётся автоматически при смене куратора.
        return False


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
    inlines = [ListingImageInline, CuratorAssignmentInline]
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("deal_type", "property_type", "status", "curator", "stage")}),
        ("Расположение", {"fields": ("district", "complex", "series", "line",
                                     "landmark", "address")}),
        ("Параметры", {"fields": ("rooms", "floor", "total_floors", "area_m2",
                                  "condition", "wall_material", "built_date",
                                  "furniture", "has_topography")}),
        ("Коммуникации", {"fields": ("heating", "sewerage", "has_gas",
                                     "has_electricity", "has_water")}),
        ("Сделка", {"fields": ("price", "currency", "documents",
                               "payment_conditions", "sale_reason")}),
        ("Метки", {"fields": ("is_urgent", "is_exclusive", "is_alternative", "is_barter")}),
        ("Описание", {"fields": ("description", "owner_phone", "internal_note")}),
        ("Служебное", {"fields": ("created_by", "created_at", "updated_at",
                                  "deleted_at", "deleted_by")}),
    )
    filter_horizontal = ("documents", "payment_conditions")

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
