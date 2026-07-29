# backend/admin.py
from django.contrib import admin
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
    list_display = ("name", "website", "created_at", "is_approved")
    list_editable = ("is_approved",)
    list_filter = ("is_approved",)
    fields = ("name", "logo_url", "description", "website", "contact_phone", "is_approved")
    search_fields = ("name",)


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1


@admin.register(Project)
class ProjectAdmin(ModerationMixin, admin.ModelAdmin):
    list_display = ("name", "developer", "city", "completion_date", "price_per_m2", "is_approved")
    list_editable = ("is_approved",)
    fields = (
        "name",
        "developer",
        "city",
        "address",
        "completion_date",
        "price_per_m2",
        "main_image_url",
        "description",
        "is_approved",
    )
    search_fields = ("name", "city", "developer__name")
    list_filter = ("is_approved", "city", "developer")
    inlines = [ProjectImageInline]


@admin.register(Apartment)
class ApartmentAdmin(ModerationMixin, admin.ModelAdmin):
    list_display = (
        "project",
        "rooms",
        "size_m2",
        "floor",
        "price",
        "status",
        "apartment_number",
        "is_approved",
    )
    list_editable = ("is_approved",)
    list_filter = ("is_approved", "status", "project__developer")
    search_fields = ("project__name", "apartment_number")
