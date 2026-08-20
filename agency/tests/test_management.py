# agency/tests/test_management.py
"""Управление агентами и справочниками с сайта, без Django-админки."""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from agency.models import Agent, Complex, District, Listing, PropertyType

User = get_user_model()

AGENTS_URL = "/api/agency/agents/"
DISTRICTS_URL = "/api/agency/dictionaries/districts/"
PASSWORD_URL = "/api/agency/auth/password/"
ME_URL = "/api/agency/auth/me/"


class ManagementTestCase(APITestCase):
    def setUp(self):
        self.boss_user = User.objects.create_user("boss", password="Ag3ncyBoss!")
        self.boss = Agent.objects.create(
            user=self.boss_user, full_name="Директор", is_manager=True
        )

        self.agent_user = User.objects.create_user("realtor", password="Ag3ncyR3alt!")
        self.agent = Agent.objects.create(user=self.agent_user, full_name="Риелтор")

    def as_boss(self):
        self.client.force_authenticate(user=self.boss_user)

    def as_agent(self):
        self.client.force_authenticate(user=self.agent_user)


class AgentManagementTests(ManagementTestCase):
    def payload(self, **overrides):
        return {
            "username": "nurbek",
            "password": "N3wAg3ntPass!",
            "full_name": "Нурбек Осмонов",
            "phone": "+996700111222",
        } | overrides

    def test_manager_creates_agent_with_working_login(self):
        self.as_boss()
        response = self.client.post(AGENTS_URL, self.payload())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "nurbek")

        self.client.force_authenticate(user=None)
        login = self.client.post(
            "/api/agency/auth/login/",
            {"username": "nurbek", "password": "N3wAg3ntPass!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn("access", login.data)

    def test_regular_agent_cannot_create_agents(self):
        self.as_agent()
        response = self.client.post(AGENTS_URL, self.payload())
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_even_list_agents(self):
        self.assertEqual(
            self.client.get(AGENTS_URL).status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_duplicate_login_is_rejected(self):
        self.as_boss()
        response = self.client.post(AGENTS_URL, self.payload(username="realtor"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_weak_password_is_rejected(self):
        self.as_boss()
        response = self.client.post(AGENTS_URL, self.payload(password="123"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_password_is_required_on_create(self):
        self.as_boss()
        payload = self.payload()
        payload.pop("password")
        response = self.client.post(AGENTS_URL, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_password_on_edit_keeps_the_old_one(self):
        self.as_boss()
        response = self.client.patch(
            f"{AGENTS_URL}{self.agent.id}/",
            {"full_name": "Риелтор Риелторов", "password": ""},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.agent_user.refresh_from_db()
        self.assertTrue(self.agent_user.check_password("Ag3ncyR3alt!"))
        self.agent.refresh_from_db()
        self.assertEqual(self.agent.full_name, "Риелтор Риелторов")

    def test_manager_resets_password(self):
        self.as_boss()
        self.client.patch(f"{AGENTS_URL}{self.agent.id}/", {"password": "R3setPass99!"})
        self.agent_user.refresh_from_db()
        self.assertTrue(self.agent_user.check_password("R3setPass99!"))

    def test_delete_only_deactivates(self):
        """Уволенный агент не должен утащить за собой объекты и историю."""
        self.as_boss()
        response = self.client.delete(f"{AGENTS_URL}{self.agent.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.agent.refresh_from_db()
        self.assertFalse(self.agent.is_active)
        self.assertTrue(Agent.objects.filter(pk=self.agent.pk).exists())

    def test_deactivated_agent_disappears_from_dictionaries(self):
        self.agent.is_active = False
        self.agent.save()
        response = self.client.get("/api/agency/dictionaries/")
        names = [a["full_name"] for a in response.data["agents"]]
        self.assertNotIn("Риелтор", names)

    def test_superuser_without_agent_profile_is_a_manager(self):
        """Иначе первого руководителя было бы некому завести."""
        root = User.objects.create_superuser("root", password="R00tPass!")
        self.client.force_authenticate(user=root)
        response = self.client.post(AGENTS_URL, self.payload())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class DictionaryManagementTests(ManagementTestCase):
    def test_anyone_can_read_dictionary(self):
        District.objects.get_or_create(name="Центр")
        response = self.client.get(DISTRICTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_regular_agent_cannot_edit_dictionary(self):
        self.as_agent()
        response = self.client.post(DISTRICTS_URL, {"name": "Новый район"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_adds_and_renames_entry(self):
        self.as_boss()
        created = self.client.post(DISTRICTS_URL, {"name": "Новый район"})
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)

        renamed = self.client.patch(
            f"{DISTRICTS_URL}{created.data['id']}/", {"name": "Новый мкр"}
        )
        self.assertEqual(renamed.data["name"], "Новый мкр")

    def test_unused_entry_is_deleted_outright(self):
        self.as_boss()
        created = self.client.post("/api/agency/dictionaries/complexes/", {"name": "ЖК Тест"})
        response = self.client.delete(
            f"/api/agency/dictionaries/complexes/{created.data['id']}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Complex.objects.filter(name="ЖК Тест").exists())

    def test_used_entry_is_hidden_instead_of_deleted(self):
        """Удаление вместе с объектами — это потеря данных, так нельзя."""
        flat, _ = PropertyType.objects.get_or_create(name="Квартира")
        complex_, _ = Complex.objects.get_or_create(name="ЖК Занятый")
        Listing.objects.create(property_type=flat, complex=complex_, price=1000)

        self.as_boss()
        response = self.client.delete(
            f"/api/agency/dictionaries/complexes/{complex_.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        complex_.refresh_from_db()
        self.assertFalse(complex_.is_active)

    def test_unknown_dictionary_is_404(self):
        self.as_boss()
        response = self.client.get("/api/agency/dictionaries/wat/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ProfileTests(ManagementTestCase):
    def test_me_reports_manager_flag(self):
        self.as_agent()
        self.assertFalse(self.client.get(ME_URL).data["is_manager"])
        self.as_boss()
        self.assertTrue(self.client.get(ME_URL).data["is_manager"])

    def test_agent_edits_own_contacts(self):
        self.as_agent()
        response = self.client.patch(
            ME_URL, {"phone": "+996555000111", "telegram": "realtor_kg"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.agent.refresh_from_db()
        self.assertEqual(self.agent.phone, "+996555000111")
        self.assertEqual(self.agent.telegram, "realtor_kg")

    def test_agent_cannot_promote_self(self):
        self.as_agent()
        self.client.patch(ME_URL, {"is_manager": True})
        self.agent.refresh_from_db()
        self.assertFalse(self.agent.is_manager)

    def test_password_change_requires_the_current_one(self):
        self.as_agent()
        response = self.client.post(
            PASSWORD_URL, {"current_password": "wrong", "new_password": "Br4ndNewPass!"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", response.data)

    def test_password_change_works(self):
        self.as_agent()
        response = self.client.post(
            PASSWORD_URL,
            {"current_password": "Ag3ncyR3alt!", "new_password": "Br4ndNewPass!"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.agent_user.refresh_from_db()
        self.assertTrue(self.agent_user.check_password("Br4ndNewPass!"))

    def test_new_password_is_validated(self):
        self.as_agent()
        response = self.client.post(
            PASSWORD_URL, {"current_password": "Ag3ncyR3alt!", "new_password": "12345678"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", response.data)
