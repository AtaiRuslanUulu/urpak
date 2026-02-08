from django.contrib import admin
from .models import Developer, Project, ProjectImage, Apartment

@admin.register(Developer)
class DeveloperAdmin(admin.ModelAdmin):
    list_display = ("name", "website")
    fields = ("name", "logo_url", "description", "website")


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1


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
        "main_image_url",
        "description",
    )
    inlines = [ProjectImageInline]


@admin.register(Apartment)
class ApartmentAdmin(admin.ModelAdmin):
    list_display = ("project", "apartment_number", "rooms", "floor", "size_m2", "price", "status")
    list_filter = ("status", "rooms", "project")
    search_fields = ("apartment_number", "project__name")
