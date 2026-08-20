# agency/models.py
"""Модели базы объектов агентства недвижимости.

Живут отдельно от `backend` (новостройки/застройщики): у вторички и аренды
другой набор полей и нет модерации.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


# ─── Справочники ──────────────────────────────────────────────────────────────

class DictionaryModel(models.Model):
    """Общая база для справочников: агентство правит их само в админке."""
    name = models.CharField("Название", max_length=120, unique=True)
    position = models.PositiveSmallIntegerField("Порядок", default=0)
    is_active = models.BooleanField("Активен", default=True)

    class Meta:
        abstract = True
        ordering = ["position", "name"]

    def __str__(self):
        return self.name


class PropertyType(DictionaryModel):
    class Meta(DictionaryModel.Meta):
        abstract = False
        ordering = ["position", "name"]
        verbose_name = "Тип объекта"
        verbose_name_plural = "Типы объектов"


class District(DictionaryModel):
    class Meta(DictionaryModel.Meta):
        abstract = False
        ordering = ["position", "name"]
        verbose_name = "Район"
        verbose_name_plural = "Районы"


class Series(DictionaryModel):
    class Meta(DictionaryModel.Meta):
        abstract = False
        ordering = ["position", "name"]
        verbose_name = "Серия дома"
        verbose_name_plural = "Серии домов"


class Complex(DictionaryModel):
    """Жилой комплекс."""
    class Meta(DictionaryModel.Meta):
        abstract = False
        ordering = ["position", "name"]
        verbose_name = "ЖК"
        verbose_name_plural = "ЖК"


class Condition(DictionaryModel):
    class Meta(DictionaryModel.Meta):
        abstract = False
        ordering = ["position", "name"]
        verbose_name = "Состояние"
        verbose_name_plural = "Состояния"


class ListingStatus(DictionaryModel):
    class Meta(DictionaryModel.Meta):
        abstract = False
        ordering = ["position", "name"]
        verbose_name = "Статус объекта"
        verbose_name_plural = "Статусы объектов"


# ─── Агенты ───────────────────────────────────────────────────────────────────

class Agent(models.Model):
    """Риелтор агентства. Он же «куратор» объекта."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="agent",
        verbose_name="Пользователь",
    )
    full_name = models.CharField("ФИО", max_length=160)
    phone = models.CharField("Телефон", max_length=32, blank=True)
    is_active = models.BooleanField("Работает", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["full_name"]
        verbose_name = "Агент"
        verbose_name_plural = "Агенты"

    def __str__(self):
        return self.full_name or self.user.get_username()


# ─── Объекты ──────────────────────────────────────────────────────────────────

class ListingQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.filter(deleted_at__isnull=False)


class Listing(models.Model):
    """Вариант — объект в базе агентства (продажа или аренда)."""

    DEAL_SALE = "sale"
    DEAL_RENT = "rent"
    DEAL_TYPES = [
        (DEAL_SALE, "Продажа"),
        (DEAL_RENT, "Аренда"),
    ]

    CURRENCY_USD = "USD"
    CURRENCY_KGS = "KGS"
    CURRENCIES = [
        (CURRENCY_USD, "$"),
        (CURRENCY_KGS, "сом"),
    ]

    deal_type = models.CharField(
        "Тип сделки", max_length=8, choices=DEAL_TYPES, default=DEAL_SALE, db_index=True
    )

    property_type = models.ForeignKey(
        PropertyType, on_delete=models.PROTECT, related_name="listings",
        verbose_name="Тип объекта",
    )
    district = models.ForeignKey(
        District, on_delete=models.PROTECT, related_name="listings",
        null=True, blank=True, verbose_name="Район",
    )
    complex = models.ForeignKey(
        Complex, on_delete=models.PROTECT, related_name="listings",
        null=True, blank=True, verbose_name="ЖК",
    )
    series = models.ForeignKey(
        Series, on_delete=models.PROTECT, related_name="listings",
        null=True, blank=True, verbose_name="Серия",
    )
    condition = models.ForeignKey(
        Condition, on_delete=models.PROTECT, related_name="listings",
        null=True, blank=True, verbose_name="Состояние",
    )
    status = models.ForeignKey(
        ListingStatus, on_delete=models.PROTECT, related_name="listings",
        null=True, blank=True, verbose_name="Статус",
    )
    curator = models.ForeignKey(
        Agent, on_delete=models.PROTECT, related_name="listings",
        null=True, blank=True, verbose_name="Куратор",
    )

    rooms = models.PositiveSmallIntegerField(
        "Комнат", null=True, blank=True, help_text="0 — студия",
    )
    floor = models.SmallIntegerField("Этаж", null=True, blank=True)
    total_floors = models.SmallIntegerField("Этажность", null=True, blank=True)
    area_m2 = models.DecimalField("Площадь, м²", max_digits=8, decimal_places=2,
                                  null=True, blank=True)

    price = models.DecimalField("Цена", max_digits=12, decimal_places=2)
    currency = models.CharField("Валюта", max_length=3, choices=CURRENCIES,
                                default=CURRENCY_USD)

    # Публичные поля
    landmark = models.CharField("Ориентир", max_length=255, blank=True)
    description = models.TextField("Описание", blank=True)

    # Агентские поля: не отдаются анонимным пользователям
    owner_phone = models.CharField("Телефон собственника", max_length=32, blank=True)
    address = models.CharField("Точный адрес", max_length=255, blank=True)
    internal_note = models.TextField("Внутренняя заметка", blank=True)

    # Метки — вкладки в интерфейсе
    is_urgent = models.BooleanField("Срочно", default=False)
    is_exclusive = models.BooleanField("Эксклюзив", default=False)
    is_alternative = models.BooleanField("Альтернатива", default=False)
    is_barter = models.BooleanField("Бартер", default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="created_listings", verbose_name="Кем создан",
    )
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField("Дата изменения", auto_now=True)

    deleted_at = models.DateTimeField("Удалён", null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="deleted_listings", verbose_name="Кем удалён",
    )

    objects = ListingQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Объект"
        verbose_name_plural = "Объекты"

    def __str__(self):
        return f"{self.title} (ID:{self.pk})"

    @property
    def title(self):
        """Заголовок карточки: «Квартира, 104 серия, Южный / 4-ком, 3-этаж»."""
        head = ", ".join(
            part for part in [
                self.property_type.name if self.property_type_id else "",
                self.series.name if self.series_id else "",
                self.complex.name if self.complex_id else "",
                self.district.name if self.district_id else "",
            ] if part
        )
        tail_parts = []
        if self.rooms is not None:
            tail_parts.append("студия" if self.rooms == 0 else f"{self.rooms}-ком")
        if self.area_m2 is not None:
            # 88.50 → «88.5», 40.00 → «40»: как в карточках у агентства
            area = f"{self.area_m2:.2f}".rstrip("0").rstrip(".")
            tail_parts.append(f"{area} м2")
        if self.floor is not None:
            tail_parts.append(f"{self.floor}-этаж")
        tail = ", ".join(tail_parts)
        return f"{head} / {tail}" if head and tail else head or tail

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self, user=None):
        self.deleted_at = timezone.now()
        self.deleted_by = user if (user and user.is_authenticated) else None
        self.save(update_fields=["deleted_at", "deleted_by", "updated_at"])

    def restore(self):
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=["deleted_at", "deleted_by", "updated_at"])


class ListingImage(models.Model):
    listing = models.ForeignKey(
        Listing, on_delete=models.CASCADE, related_name="images", verbose_name="Объект",
    )
    image = models.ImageField("Фото", upload_to="agency/listings/")
    position = models.PositiveSmallIntegerField("Порядок", default=0)

    class Meta:
        ordering = ["position", "id"]
        verbose_name = "Фото объекта"
        verbose_name_plural = "Фото объектов"

    def __str__(self):
        return f"Фото #{self.position} для ID:{self.listing_id}"


# ─── Счета (комиссии по сделкам) ──────────────────────────────────────────────

class Deal(models.Model):
    """Счёт по сделке: комиссия агентства и её оплата."""

    listing = models.ForeignKey(
        Listing, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="deals", verbose_name="Объект",
    )
    curator = models.ForeignKey(
        Agent, on_delete=models.PROTECT, related_name="deals",
        null=True, blank=True, verbose_name="Куратор",
    )
    client_name = models.CharField("Клиент", max_length=160)
    deal_date = models.DateField("Дата сделки")
    amount = models.DecimalField("Сумма сделки", max_digits=12, decimal_places=2)
    commission = models.DecimalField("Комиссия", max_digits=12, decimal_places=2)
    currency = models.CharField("Валюта", max_length=3, choices=Listing.CURRENCIES,
                                default=Listing.CURRENCY_USD)
    is_paid = models.BooleanField("Оплачен", default=False)
    note = models.TextField("Примечание", blank=True)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)

    class Meta:
        ordering = ["-deal_date", "-id"]
        verbose_name = "Счёт"
        verbose_name_plural = "Счета"

    def __str__(self):
        return f"{self.client_name} — {self.commission} {self.currency}"
