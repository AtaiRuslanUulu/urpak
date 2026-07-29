# backend/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Developer, Project, ProjectImage, Apartment


class ModerationMixin:
    """Массовое одобрение/снятие с публикации для моделей с is_approved."""
    actions = ["approve", "unapprove"]

    @admin.action(description="Одобрить выбранные")
    def approve(self, request, queryset):
        self.message_user(request, f"Одобрено: {queryset.update(is_approved=True)}")

    @admin.action(description="Снять с публикации")
    def unapprove(self, request, queryset):
        self.message_user(request, f"Снято с публикации: {queryset.update(is_approved=False)}")


@admin.register(Developer)
class DeveloperAdmin(ModerationMixin, admin.ModelAdmin):
    list_display = ("name", "logo_preview", "website", "is_approved")
    list_editable = ("is_approved",)
    list_filter = ("is_approved",)
    fields = ("name", "logo", "logo_url", "description", "website", "contact_phone", "is_approved")
    readonly_fields = ("logo_url",)
    search_fields = ("name",)

    def logo_preview(self, obj):
        url = obj.logo.url if obj.logo else obj.logo_url
        if url:
            return format_html('<img src="{}" style="height:32px;border-radius:50%;" />', url)
        return "—"
    logo_preview.short_description = "Лого"


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1
    fields = ("image", "url", "caption", "position")
    readonly_fields = ("url",)


@admin.register(Project)
class ProjectAdmin(ModerationMixin, admin.ModelAdmin):
    list_display = (
        "name",
        "developer",
        "city",
        "completion_date",
        "price_per_m2",
        "is_approved",
    )
    list_editable = ("is_approved",)
    list_filter = ("is_approved", "city", "developer")
    fields = (
        "name",
        "developer",
        "city",
        "address",
        "completion_date",
        "price_per_m2",
        "main_image",
        "main_image_url",
        "description",
        "is_approved",
    )
    readonly_fields = ("main_image_url",)
    search_fields = ("name", "city", "developer__name")
    inlines = [ProjectImageInline]


@admin.register(Apartment)
class ApartmentAdmin(ModerationMixin, admin.ModelAdmin):
    list_display = (
        "project",
        "apartment_number",
        "rooms",
        "floor",
        "size_m2",
        "price",
        "status",
        "is_approved",
    )
    list_editable = ("is_approved",)
    list_filter = ("is_approved", "status", "rooms", "project")
    search_fields = ("apartment_number", "project__name")
