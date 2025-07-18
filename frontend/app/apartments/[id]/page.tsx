"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";

interface Developer {
  id: number;
  name: string;
  website?: string;
  logo_url?: string;
}

interface Project {
  id: number;
  name: string;
  developer: Developer;
  city: string;
  address: string;
  completion_date: string;
  price_per_m2: number;
  main_image_url?: string;
  images?: Array<{
    url: string;
    caption?: string;
  }>;
}

interface Apartment {
  id: number;
  project: Project;
  rooms: number;
  size_m2: number;
  price: number;
  floor?: number;
  status?: string;
  apartment_number?: string;
  is_available?: boolean;
}

export default function ApartmentDetailPage() {
  const { id } = useParams();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
  const API_URL = `${API_BASE}/api/apartments/${id}/`;

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setApartment)
      .catch((err) => {
        console.error("Ошибка загрузки квартиры:", err);
        setError("Не удалось загрузить информацию о квартире");
      })
      .finally(() => setLoading(false));
  }, [API_URL]);

  const formatPrice = (price: number) =>
    price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string = "available") => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "reserved": return "bg-yellow-100 text-yellow-800";
      case "sold": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string = "available") => {
    switch (status) {
      case "available": return "Доступна";
      case "reserved": return "Забронирована";
      case "sold": return "Продана";
      default: return "Неизвестно";
    }
  };

  // Простой калькулятор ипотеки
  const [loanAmount, setLoanAmount] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  useEffect(() => {
    if (apartment) {
      const amount = apartment.price * 0.8; // 80% кредита
      const payment = apartment.price * 0.2; // 20% первоначальный взнос
      const monthly = amount * 0.01; // упрощенный расчет ~1% в месяц

      setLoanAmount(amount);
      setDownPayment(payment);
      setMonthlyPayment(monthly);
    }
  }, [apartment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto py-12 px-4 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-6"></div>
            <div className="bg-white rounded-2xl p-8">
              <div className="h-64 bg-slate-200 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto py-12 px-4 max-w-4xl">
          <div className="text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
              {error || "Квартира не найдена"}
            </h1>
            <div className="space-x-4">
              <Link
                href="/projects"
                className="text-orange-500 hover:text-orange-600 underline"
              >
                ← Вернуться к проектам
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto py-12 px-4 max-w-4xl">
        {/* Хлебные крошки */}
        <nav className="mb-6 text-sm text-slate-600">
          <Link href="/projects" className="hover:text-orange-500">
            Проекты
          </Link>
          <span className="mx-2">→</span>
          <Link href={`/projects/${apartment.project.id}`} className="hover:text-orange-500">
            {apartment.project.name}
          </Link>
          <span className="mx-2">→</span>
          <span className="text-slate-800">
            Квартира {apartment.apartment_number || `#${apartment.id}`}
          </span>
        </nav>

        {/* Основная информация */}
        <div className="bg-white rounded-2xl shadow-sm mb-8">
          {/* Изображение проекта */}
          {apartment.project.main_image_url && (
            <div className="relative">
              <Image
                src={apartment.project.main_image_url}
                alt={apartment.project.name}
                width={800}
                height={400}
                className="w-full h-64 object-cover rounded-t-2xl"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(apartment.status)}`}>
                  {getStatusText(apartment.status)}
                </span>
              </div>
            </div>
          )}

          <div className="p-8">
            {/* Заголовок */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {apartment.rooms}-комнатная квартира
              </h1>
              <p className="text-slate-600 text-lg">
                в проекте {apartment.project.name}
              </p>
            </div>

            {/* Основные характеристики */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {apartment.rooms}
                </div>
                <div className="text-slate-600 text-sm">комнат</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {apartment.size_m2}
                </div>
                <div className="text-slate-600 text-sm">м²</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {apartment.floor || "—"}
                </div>
                <div className="text-slate-600 text-sm">этаж</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {Math.round(apartment.price / apartment.size_m2)}
                </div>
                <div className="text-slate-600 text-sm">$/м²</div>
              </div>
            </div>

            {/* Цена */}
            <div className="bg-orange-50 rounded-xl p-6 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {formatPrice(apartment.price)}
                </div>
                <div className="text-slate-600">
                  Общая стоимость квартиры
                </div>
              </div>
            </div>

            {/* Информация о проекте */}
            <div className="bg-slate-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                О проекте
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Адрес:</span>
                  <span className="text-slate-800 font-medium">{apartment.project.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Город:</span>
                  <span className="text-slate-800 font-medium">{apartment.project.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Срок сдачи:</span>
                  <span className="text-slate-800 font-medium">
                    {formatDate(apartment.project.completion_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Застройщик:</span>
                  <Link
                    href={`/developers/${apartment.project.developer.id}`}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    {apartment.project.developer.name}
                  </Link>
                </div>
              </div>
            </div>

            {/* Калькулятор ипотеки */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                💰 Калькулятор ипотеки
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {formatPrice(downPayment)}
                  </div>
                  <div className="text-slate-600 text-sm">Первоначальный взнос (20%)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {formatPrice(loanAmount)}
                  </div>
                  <div className="text-slate-600 text-sm">Сумма кредита</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {formatPrice(monthlyPayment)}
                  </div>
                  <div className="text-slate-600 text-sm">Ежемесячный платеж*</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500 text-center">
                * Приблизительный расчет. Точные условия уточняйте в банке.
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowContactForm(true)}
                className="flex-1 bg-orange-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                💬 Связаться с застройщиком
              </button>
              <Link
                href={`/projects/${apartment.project.id}`}
                className="flex-1 bg-slate-100 text-slate-700 py-4 px-6 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-center"
              >
                🏢 Смотреть другие квартиры
              </Link>
            </div>
          </div>
        </div>

        {/* Форма связи */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Связаться с застройщиком
              </h3>
              <p className="text-slate-600 mb-6">
                Оставьте свои контакты, и представитель {apartment.project.developer.name} свяжется с вами
              </p>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-400/20 outline-none"
                />
                <input
                  type="tel"
                  placeholder="Номер телефона"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-400/20 outline-none"
                />
                <textarea
                  placeholder="Сообщение (необязательно)"
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-400/20 outline-none resize-none"
                />
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Отправить
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Отменить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
