from django.contrib import admin
from django.utils.html import format_html
from .models import Developer, Project, ProjectImage, Apartment


@admin.register(Developer)
class DeveloperAdmin(admin.ModelAdmin):
    list_display = ("name", "logo_preview", "website")
    fields = ("name", "logo", "logo_url", "description", "website")
    readonly_fields = ("logo_url",)

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
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "developer",
        "city",
        "completion_date",
        "price_per_m2",
    )
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
    )
    readonly_fields = ("main_image_url",)
    inlines = [ProjectImageInline]


@admin.register(Apartment)
class ApartmentAdmin(admin.ModelAdmin):
    list_display = ("project", "apartment_number", "rooms", "floor", "size_m2", "price", "status")
    list_filter = ("status", "rooms", "project")
    search_fields = ("apartment_number", "project__name")
