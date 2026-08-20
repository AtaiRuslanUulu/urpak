"""Стартовое наполнение справочников. Дальше агентство правит их в админке."""
from django.db import migrations

SEED = {
    "PropertyType": [
        "Квартира", "Дом", "Коммерция", "Участок", "Гараж",
    ],
    "District": [
        "Центр", "Южный", "Асанбай", "Западный", "Восточный", "Джал",
        "Верхний Джал", "Тунгуч", "Аламедин-1", "Кок-Жар", "Ортосай",
        "Филармония", "Мед. Академия", "Рабочий Городок", "Учкун", "Достук",
        "Кызыл-Аскер", "Ак-Орго", "Арча-Бешик", "Восток-5", "Моссовет",
    ],
    "Series": [
        "104 серия", "105 серия", "106 серия", "108 серия", "Элитка",
        "Полуэлитка", "Индивидуальная", "Хрущёвка", "Сталинка", "Малосемейка",
        "Общежитие",
    ],
    "Condition": [
        "Дизайнерский ремонт", "Евроремонт", "Хорошее", "Среднее", "ПСО",
        "Черновая отделка", "Требует ремонта",
    ],
    "ListingStatus": [
        "Актуально", "Задаток", "Продано", "Сдано", "Приостановлено",
        "Требует уточнения",
    ],
}


def seed(apps, schema_editor):
    for model_name, names in SEED.items():
        model = apps.get_model("agency", model_name)
        for position, name in enumerate(names):
            model.objects.get_or_create(
                name=name, defaults={"position": position},
            )


def unseed(apps, schema_editor):
    for model_name, names in SEED.items():
        model = apps.get_model("agency", model_name)
        model.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [("agency", "0001_initial")]

    operations = [migrations.RunPython(seed, unseed)]
