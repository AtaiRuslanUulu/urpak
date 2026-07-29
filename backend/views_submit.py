# backend/views_submit.py
from typing import List
import json

from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Developer, Project, ProjectImage, Apartment
from .serializers import (
    DeveloperSubmitSerializer,
    ProjectSubmitSerializer,
    ApartmentSubmitSerializer,
)


class PublicSubmitPermission(permissions.BasePermission):
    """
    Публичные формы: разрешаем только POST.
    Если позже понадобится закрыть — замените на IsAuthenticated
    или добавьте проверку токена.
    """
    def has_permission(self, request, view) -> bool:
        return request.method == "POST"


def _is_spam(request) -> bool:
    """
    Простейший honeypot: если пришло скрытое поле 'company' и оно непустое — считаем спамом.
    Возвращаем "успех", чтобы боты не понимали, что их отфильтровали.
    """
    data = request.data
    try:
        if isinstance(data, dict) and data.get("company"):
            return True
    except Exception:
        pass
    return False


# -------------------------
# 1️⃣  Добавление застройщика
# -------------------------
class SubmitDeveloperView(APIView):
    """
    POST /api/submit/developer/
    Тело (минимум): { "name": "..." }
    Допустимо: description, website, logo_url, contact_phone
    """
    permission_classes = [PublicSubmitPermission]
    authentication_classes: list = []  # отключаем CSRF для публичных форм

    def post(self, request, *args, **kwargs):
        if _is_spam(request):
            return Response({"ok": True}, status=status.HTTP_200_OK)

        serializer = DeveloperSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"ok": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = serializer.validated_data["name"].strip()
        defaults = {
            "description": serializer.validated_data.get("description", ""),
            "website": serializer.validated_data.get("website"),
            "logo_url": serializer.validated_data.get("logo_url"),
            "contact_phone": serializer.validated_data.get("contact_phone"),  # добавлено
        }

        dev, created = Developer.objects.get_or_create(name=name, defaults=defaults)

        if not created:
            updated_fields = []
            for f in ("description", "website", "logo_url", "contact_phone"):
                new_val = defaults.get(f)
                if new_val and not getattr(dev, f):
                    setattr(dev, f, new_val)
                    updated_fields.append(f)
            if updated_fields:
                dev.save(update_fields=updated_fields)

        return Response(
            {
                "ok": True,
                "created": created,
                "developer_id": dev.id,
                "message": "Заявка принята. Мы проверим данные и опубликуем.",
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# -------------------------
# 2️⃣  Добавление проекта
# -------------------------
class SubmitProjectView(APIView):
    """
    POST /api/submit/project/
    Пример:
    {
      "name": "ЖК Пример",
      "developer": 1,
      "city": "Бишкек",
      "address": "ул. ...",
      "completion_date": "2026-12-31",
      "price_per_m2": 850,
      "main_image_url": "https://...",
      "description": "Коротко о проекте",
      "images": [
        {"url": "https://...", "caption": "Фасад", "position": 0},
        {"url": "https://...", "caption": "", "position": 1}
      ]
    }
    """
    permission_classes = [PublicSubmitPermission]
    authentication_classes: list = []

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        if _is_spam(request):
            return Response({"ok": True}, status=status.HTTP_200_OK)

        data = request.data.copy()
        raw_images = data.pop("images", None)

        if isinstance(raw_images, str):
            try:
                raw_images = json.loads(raw_images)
            except Exception:
                raw_images = None

        serializer = ProjectSubmitSerializer(data=data)
        if not serializer.is_valid():
            return Response(
                {"ok": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project: Project = serializer.save()

        if isinstance(raw_images, list):
            bulk: List[ProjectImage] = []
            for i, img in enumerate(raw_images):
                if not isinstance(img, dict):
                    continue
                url = img.get("url")
                if not url:
                    continue
                bulk.append(
                    ProjectImage(
                        project=project,
                        url=url,
                        caption=(img.get("caption") or "")[:255],
                        position=img.get("position", i),
                    )
                )
            if bulk:
                ProjectImage.objects.bulk_create(bulk)

        return Response(
            {
                "ok": True,
                "project_id": project.id,
                "message": "Проект отправлен на модерацию. После проверки он появится на сайте.",
            },
            status=status.HTTP_201_CREATED,
        )


# -------------------------
# 3️⃣  Добавление квартиры
# -------------------------
class SubmitApartmentView(APIView):
    """
    POST /api/submit/apartment/
    {
      "project": 123,
      "rooms": 2,
      "size_m2": 56.4,
      "price": 62000,
      "floor": 7,
      "status": "available|reserved|sold",
      "apartment_number": "72A"
    }
    """
    permission_classes = [PublicSubmitPermission]
    authentication_classes: list = []

    def post(self, request, *args, **kwargs):
        if _is_spam(request):
            return Response({"ok": True}, status=status.HTTP_200_OK)

        serializer = ApartmentSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"ok": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        apt: Apartment = serializer.save()

        return Response(
            {
                "ok": True,
                "apartment_id": apt.id,
                "message": "Квартира добавлена и будет опубликована после проверки.",
            },
            status=status.HTTP_201_CREATED,
        )
