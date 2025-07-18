// app/projects/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";

interface ProjectImage {
  url: string;
  caption?: string;
  position: number;
}

interface Developer {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
}

interface Apartment {
  id: number;
  floor: number;
  rooms: number;
  size_m2: number;
  price: number;
  status?: string;
  apartment_number?: string;
}

interface Project {
  id: number;
  name: string;
  developer: Developer;
  city: string;
  address: string;
  completion_date: string;
  price_per_m2: number;
  description?: string;
  main_image_url?: string;
  images: ProjectImage[];
  apartments: Apartment[];
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
  const API_URL = `${API_BASE}/api/projects/${id}/`;

  // Курс доллара к сому (можно вынести в переменную окружения)
  const USD_TO_KGS = 87.5; // 1 USD = 85 KGS (примерно)

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setProject)
      .catch((err) => {
        console.error("Ошибка загрузки проекта:", err);
        setError("Не удалось загрузить проект");
      })
      .finally(() => setLoading(false));
  }, [API_URL]);

  const formatPriceKGS = (price: number) =>
    `${Math.round(price * USD_TO_KGS).toLocaleString("ru-RU")} сом`;

  const formatPriceUSD = (price: number) =>
    `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto py-12 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
            <div className="h-48 bg-slate-200 rounded mb-4"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto py-12 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
              {error || "Проект не найден"}
            </h1>
            <Link
              href="/projects"
              className="text-orange-500 hover:text-orange-600 underline"
            >
              ← Вернуться к списку проектов
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto py-12 px-4 max-w-6xl">
        {/* Хлебные крошки */}
        <nav className="mb-6 text-sm text-slate-600">
          <Link href="/projects" className="hover:text-orange-500">
            Новостройки
          </Link>
          <span className="mx-2">→</span>
          <span className="text-slate-800">{project.name}</span>
        </nav>

        {/* Основная информация */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Левая колонка - информация */}
            <div>
              <h1 className="text-3xl font-bold mb-4 text-slate-800">
                {project.name}
              </h1>

              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span className="font-medium text-slate-600 w-32">Город:</span>
                  <span className="text-slate-800">{project.city}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-slate-600 w-32">Адрес:</span>
                  <span className="text-slate-800">{project.address}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-slate-600 w-32">Срок сдачи:</span>
                  <span className="text-slate-800">{formatDate(project.completion_date)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-slate-600 w-32">Цена за м²:</span>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-orange-600">
                      {formatPriceKGS(project.price_per_m2)} /м²
                    </span>
                    <span className="text-sm text-slate-500">
                      ({formatPriceUSD(project.price_per_m2)} /м²)
                    </span>
                  </div>
                </div>
              </div>

              {/* Застройщик */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-800">
                  Застройщик
                </h3>
                <Link
                  href={`/developers/${project.developer.id}`}
                  className="flex items-center space-x-3 hover:bg-slate-50 p-3 rounded-lg transition"
                >
                  {project.developer.logo_url ? (
                    <Image
                      src={project.developer.logo_url}
                      alt={project.developer.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-slate-500 text-xs">logo</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-800">
                      {project.developer.name}
                    </p>
                    {project.developer.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {project.developer.description}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            </div>

            {/* Правая колонка - главное изображение */}
            <div>
              {project.main_image_url ? (
                <Image
                  src={project.main_image_url}
                  alt={project.name}
                  width={600}
                  height={400}
                  className="rounded-2xl object-cover w-full h-[400px] cursor-pointer hover:opacity-90 transition"
                  onClick={() => setSelectedImage(project.main_image_url!)}
                />
              ) : project.images.length > 0 ? (
                <Image
                  src={project.images[0].url}
                  alt={project.name}
                  width={600}
                  height={400}
                  className="rounded-2xl object-cover w-full h-[400px] cursor-pointer hover:opacity-90 transition"
                  onClick={() => setSelectedImage(project.images[0].url)}
                />
              ) : (
                <div className="w-full h-[400px] bg-slate-200 rounded-2xl flex items-center justify-center">
                  <span className="text-slate-500">Нет изображений</span>
                </div>
              )}
            </div>
          </div>

          {/* Описание проекта */}
          {project.description && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-3 text-slate-800">
                О проекте
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {project.description}
              </p>
            </div>
          )}
        </div>

        {/* Галерея изображений */}
        {project.images.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-6 text-slate-800">
              Галерея проекта
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.images.map((img) => (
                <div
                  key={img.position}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedImage(img.url)}
                >
                  <Image
                    src={img.url}
                    alt={img.caption || project.name}
                    width={400}
                    height={300}
                    className="rounded-xl object-cover w-full h-48"
                  />
                  {img.caption && (
                    <p className="text-sm text-slate-600 mt-2 text-center">
                      {img.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Квартиры */}
        {project.apartments && project.apartments.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-800">
              Доступные квартиры ({project.apartments.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">
                      Квартира
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">
                      Этаж
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">
                      Комнат
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">
                      Площадь
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">
                      Цена
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">
                      Статус
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {project.apartments.map((apt) => (
                    <tr
                      key={apt.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-800">
                          {apt.apartment_number || `#${apt.id}`}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {apt.floor}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {apt.rooms}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {apt.size_m2} м²
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">
                            {formatPriceKGS(apt.price)}
                          </span>
                          <span className="text-sm text-slate-500">
                            ({formatPriceUSD(apt.price)})
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                          {getStatusText(apt.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Link
                          href={`/apartments/${apt.id}`}
                          className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                        >
                          Подробнее →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Модальное окно для изображений */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <Image
                src={selectedImage}
                alt="Увеличенное изображение"
                width={1200}
                height={800}
                className="rounded-lg object-contain max-h-[90vh] max-w-full"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
