"""Наполнение справочников, добавленных под расширенный набор параметров."""
from django.db import migrations

SEED = {
    "BuildingStage": [
        "Сдан в эксплуатацию", "Строится", "Котлован", "ПСО",
    ],
    "Line": ["Первая", "Вторая", "Третья"],
    "WallMaterial": [
        "Панель", "Кирпич", "Монолит", "Блок", "Дерево", "Саман", "Смешанный",
    ],
    "Heating": [
        "Центральное", "Автономное", "Электрическое", "Печное", "На газе", "Нет",
    ],
    "Sewerage": ["центральное", "септик", "нет"],
    "FurnitureOption": ["Да", "Нет", "Частично"],
    "Document": [
        "Красная", "Договор купли/продажи", "Технический паспорт",
        "Свидетельство о праве собственности", "Доверенность",
    ],
    "PaymentCondition": [
        "Наличные", "Ипотека", "Рассрочка", "Обмен", "Материнский капитал",
    ],
}


def seed(apps, schema_editor):
    for model_name, names in SEED.items():
        model = apps.get_model("agency", model_name)
        for position, name in enumerate(names):
            model.objects.get_or_create(name=name, defaults={"position": position})


def unseed(apps, schema_editor):
    for model_name, names in SEED.items():
        model = apps.get_model("agency", model_name)
        model.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("agency", "0003_buildingstage_document_furnitureoption_heating_line_and_more"),
    ]

    operations = [migrations.RunPython(seed, unseed)]
