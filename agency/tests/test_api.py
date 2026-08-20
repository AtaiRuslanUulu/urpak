# agency/tests/test_api.py
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from agency.models import (
    Agent, Condition, District, Listing, ListingStatus, PropertyType, Series,
)

User = get_user_model()

LIST_URL = "/api/agency/listings/"
DELETED_URL = "/api/agency/listings/deleted/"


class AgencyApiTestCase(APITestCase):
    """Общая заготовка: два агента и по объекту у каждого."""

    def setUp(self):
        # Справочники уже наполнены миграцией — берём существующие записи.
        self.flat, _ = PropertyType.objects.get_or_create(name="Квартира")
        self.house, _ = PropertyType.objects.get_or_create(name="Дом")
        self.south, _ = District.objects.get_or_create(name="Южный")
        self.center, _ = District.objects.get_or_create(name="Центр")
        self.series_104, _ = Series.objects.get_or_create(name="104 серия")
        self.euro, _ = Condition.objects.get_or_create(name="Евроремонт")
        self.actual, _ = ListingStatus.objects.get_or_create(name="Актуально")

        self.user = User.objects.create_user("aibek", password="secret123")
        self.agent = Agent.objects.create(user=self.user, full_name="Айбек Ибраев")

        self.other_user = User.objects.create_user("nurbek", password="secret123")
        self.other_agent = Agent.objects.create(user=self.other_user, full_name="Нурбек")

        self.listing = Listing.objects.create(
            deal_type=Listing.DEAL_SALE,
            property_type=self.flat,
            district=self.south,
            series=self.series_104,
            condition=self.euro,
            status=self.actual,
            curator=self.agent,
            rooms=4,
            floor=3,
            total_floors=5,
            area_m2=Decimal("88.50"),
            price=Decimal("75000"),
            landmark="рядом со школой №61",
            description="Светлая квартира",
            owner_phone="+996700112233",
            address="ул. Ахунбаева, 112, кв. 45",
            internal_note="Собственник торгуется до 72к",
        )
        self.other_listing = Listing.objects.create(
            deal_type=Listing.DEAL_SALE,
            property_type=self.house,
            district=self.center,
            curator=self.other_agent,
            rooms=2,
            floor=1,
            area_m2=Decimal("40.00"),
            price=Decimal("120000"),
        )

    def login(self, user=None):
        self.client.force_authenticate(user=user or self.user)

    def ids(self, response):
        results = response.data["results"] if "results" in response.data else response.data
        return [item["id"] for item in results]


class AgentOnlyFieldsTests(AgencyApiTestCase):
    def test_anonymous_does_not_see_agent_fields(self):
        response = self.client.get(f"{LIST_URL}{self.listing.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for field in ("owner_phone", "address", "internal_note"):
            self.assertNotIn(field, response.data)

    def test_agent_sees_agent_fields(self):
        self.login()
        response = self.client.get(f"{LIST_URL}{self.listing.id}/")
        self.assertEqual(response.data["owner_phone"], "+996700112233")
        self.assertEqual(response.data["address"], "ул. Ахунбаева, 112, кв. 45")
        self.assertEqual(response.data["internal_note"], "Собственник торгуется до 72к")

    def test_anonymous_cannot_find_listing_by_address(self):
        response = self.client.get(LIST_URL, {"q": "Ахунбаева"})
        self.assertEqual(self.ids(response), [])

        self.login()
        response = self.client.get(LIST_URL, {"q": "Ахунбаева"})
        self.assertEqual(self.ids(response), [self.listing.id])


class FilterTests(AgencyApiTestCase):
    def test_filter_by_id(self):
        response = self.client.get(LIST_URL, {"id": self.listing.id})
        self.assertEqual(self.ids(response), [self.listing.id])

    def test_filter_by_district_and_type(self):
        response = self.client.get(
            LIST_URL, {"district": self.south.id, "property_type": self.flat.id}
        )
        self.assertEqual(self.ids(response), [self.listing.id])

    def test_filter_by_rooms_and_floor(self):
        response = self.client.get(LIST_URL, {"rooms": 4, "floor": 3})
        self.assertEqual(self.ids(response), [self.listing.id])

    def test_filter_by_price_range(self):
        response = self.client.get(LIST_URL, {"price_min": 70000, "price_max": 80000})
        self.assertEqual(self.ids(response), [self.listing.id])

    def test_filter_by_area_range(self):
        response = self.client.get(LIST_URL, {"area_min": 80, "area_max": 100})
        self.assertEqual(self.ids(response), [self.listing.id])

    def test_filter_by_curator(self):
        response = self.client.get(LIST_URL, {"curator": self.other_agent.id})
        self.assertEqual(self.ids(response), [self.other_listing.id])

    def test_keyword_search_matches_landmark(self):
        response = self.client.get(LIST_URL, {"q": "школой"})
        self.assertEqual(self.ids(response), [self.listing.id])

    def test_rent_and_sale_are_separate(self):
        rental = Listing.objects.create(
            deal_type=Listing.DEAL_RENT,
            property_type=self.flat,
            district=self.center,
            price=Decimal("450"),
        )
        response = self.client.get(LIST_URL, {"deal_type": "rent"})
        self.assertEqual(self.ids(response), [rental.id])

        response = self.client.get(LIST_URL, {"deal_type": "sale"})
        self.assertNotIn(rental.id, self.ids(response))


class TabTests(AgencyApiTestCase):
    def test_mine_requires_login(self):
        response = self.client.get(LIST_URL, {"tab": "mine"})
        self.assertEqual(self.ids(response), [])

    def test_mine_returns_only_own_listings(self):
        self.login()
        response = self.client.get(LIST_URL, {"tab": "mine"})
        self.assertEqual(self.ids(response), [self.listing.id])

    def test_label_tabs(self):
        self.listing.is_exclusive = True
        self.listing.save()
        self.other_listing.is_barter = True
        self.other_listing.save()

        self.assertEqual(
            self.ids(self.client.get(LIST_URL, {"tab": "exclusive"})), [self.listing.id]
        )
        self.assertEqual(
            self.ids(self.client.get(LIST_URL, {"tab": "barter"})), [self.other_listing.id]
        )
        self.assertEqual(self.ids(self.client.get(LIST_URL, {"tab": "alternative"})), [])


class SoftDeleteTests(AgencyApiTestCase):
    def test_delete_moves_listing_to_trash(self):
        self.login()
        response = self.client.delete(f"{LIST_URL}{self.listing.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.listing.refresh_from_db()
        self.assertIsNotNone(self.listing.deleted_at)
        self.assertEqual(self.listing.deleted_by, self.user)

        self.assertNotIn(self.listing.id, self.ids(self.client.get(LIST_URL)))
        self.assertEqual(self.ids(self.client.get(DELETED_URL)), [self.listing.id])

    def test_restore_brings_listing_back(self):
        self.login()
        self.client.delete(f"{LIST_URL}{self.listing.id}/")
        response = self.client.post(f"{LIST_URL}{self.listing.id}/restore/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.listing.refresh_from_db()
        self.assertIsNone(self.listing.deleted_at)
        self.assertIn(self.listing.id, self.ids(self.client.get(LIST_URL)))

    def test_trash_is_hidden_from_anonymous(self):
        response = self.client.get(DELETED_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PermissionTests(AgencyApiTestCase):
    def payload(self):
        return {
            "deal_type": "sale",
            "property_type": self.flat.id,
            "district": self.center.id,
            "price": "50000",
        }

    def test_anonymous_cannot_create(self):
        response = self.client.post(LIST_URL, self.payload())
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_cannot_update_or_delete(self):
        self.assertEqual(
            self.client.patch(f"{LIST_URL}{self.listing.id}/", {"price": "1"}).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertEqual(
            self.client.delete(f"{LIST_URL}{self.listing.id}/").status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_agent_creates_listing(self):
        self.login()
        response = self.client.post(LIST_URL, self.payload())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = Listing.objects.get(pk=response.data["id"])
        self.assertEqual(created.created_by, self.user)

    def test_floor_cannot_exceed_total_floors(self):
        self.login()
        payload = self.payload() | {"floor": 9, "total_floors": 5}
        response = self.client.post(LIST_URL, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("floor", response.data)

    def test_deals_are_internal_only(self):
        self.assertEqual(
            self.client.get("/api/agency/deals/").status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.login()
        self.assertEqual(
            self.client.get("/api/agency/deals/").status_code, status.HTTP_200_OK
        )


class DictionariesTests(AgencyApiTestCase):
    def test_dictionaries_are_public_and_complete(self):
        response = self.client.get("/api/agency/dictionaries/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in (
            "property_types", "districts", "series", "complexes", "conditions",
            "statuses", "agents", "deal_types", "currencies",
        ):
            self.assertIn(key, response.data)

    def test_inactive_entries_are_hidden(self):
        District.objects.create(name="Закрытый район", is_active=False)
        response = self.client.get("/api/agency/dictionaries/")
        names = [d["name"] for d in response.data["districts"]]
        self.assertNotIn("Закрытый район", names)


class TitleTests(AgencyApiTestCase):
    def test_title_matches_card_format(self):
        self.assertEqual(
            self.listing.title,
            "Квартира, 104 серия, Южный / 4-ком, 88.5 м2, 3-этаж",
        )

    def test_studio_is_labelled(self):
        self.listing.rooms = 0
        self.assertIn("студия", self.listing.title)
