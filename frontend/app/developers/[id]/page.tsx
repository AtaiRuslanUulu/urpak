"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";

interface Developer {
  id: number;
  name: string;
  description: string;
  website?: string;
  logo_url?: string;
  created_at?: string;
}

interface Project {
  id: number;
  name: string;
  city: string;
  address: string;
  price_per_m2: number;
  completion_date: string;
  main_image_url?: string;
  images?: Array<{
    url: string;
    caption?: string;
  }>;
}

type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'price' | 'completion';

export default function DeveloperDetailPage() {
  const { id } = useParams();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterCity, setFilterCity] = useState<string>('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
  const USD_TO_KGS = 85;

  useEffect(() => {
    async function load() {
      try {
        const devRes = await fetch(`${API_BASE}/api/developers/${id}/`);
        const projRes = await fetch(`${API_BASE}/api/projects/?developer=${id}`);

        if (!devRes.ok || !projRes.ok) {
          throw new Error('Ошибка загрузки данных');
        }

        const devData = await devRes.json();
        const projData = await projRes.json();

        setDeveloper(devData);
        setProjects(projData);
      } catch (err) {
        console.error("Ошибка загрузки:", err);
        setError("Не удалось загрузить информацию о застройщике");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, API_BASE]);

  // Фильтрация и сортировка проектов
  const filteredAndSortedProjects = projects
    .filter(p => !filterCity || p.city === filterCity)
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price_per_m2 - b.price_per_m2;
          break;
        case 'completion':
          comparison = new Date(a.completion_date).getTime() - new Date(b.completion_date).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const cities = [...new Set(projects.map(p => p.city))];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getSortLabel = (field: SortField) => {
    const labels = {
      name: 'Название',
      price: 'Цена',
      completion: 'Дата сдачи'
    };
    return labels[field];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto py-12 px-4 max-w-6xl">
          <div className="animate-pulse">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-slate-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-8 bg-slate-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-96"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-40 bg-slate-200 rounded mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto py-12 px-4 max-w-6xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {error || "Застройщик не найден"}
            </h1>
            <div className="space-x-4">
              <Link
                href="/developers"
                className="text-orange-500 hover:text-orange-600 underline"
              >
                ← Вернуться к списку застройщиков
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
      <main className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Хлебные крошки */}
        <nav className="mb-6 text-sm text-slate-600">
          <Link href="/developers" className="hover:text-orange-500">
            Застройщики
          </Link>
          <span className="mx-2">→</span>
          <span className="text-slate-900">{developer.name}</span>
        </nav>

        {/* Информация о застройщике */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Логотип */}
            <div className="flex-shrink-0">
              {developer.logo_url ? (
                <Image
                  src={developer.logo_url}
                  alt={developer.name}
                  width={100}
                  height={100}
                  className="rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-25 h-25 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-3xl">
                  {developer.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Основная информация */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                {developer.name}
              </h1>
              <p className="text-slate-600 leading-relaxed mb-6">
                {developer.description}
              </p>

              {/* Статистика */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg">
                  <span className="font-semibold text-lg">{projects.length}</span>
                  <span className="text-sm ml-1">проектов</span>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                  <span className="font-semibold text-lg">{cities.length}</span>
                  <span className="text-sm ml-1">городов</span>
                </div>
                {developer.created_at && (
                  <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                    <span className="text-sm">На рынке с </span>
                    <span className="font-semibold">{new Date(developer.created_at).getFullYear()}</span>
                  </div>
                )}
              </div>

              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row gap-3">
                {developer.website && (
                  <a
                    href={
                      developer.website.startsWith("http")
                        ? developer.website
                        : `https://${developer.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-center"
                  >
                    Перейти на сайт
                  </a>
                )}
                <Link
                  href="/contacts"
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-center"
                >
                  Связаться
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Проекты */}
        {projects.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-8">
            {/* Заголовок и управление */}
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">
                Проекты ({filteredAndSortedProjects.length})
              </h2>

              {/* Фильтры и сортировка */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Фильтр по городу */}
                {cities.length > 1 && (
                  <div className="flex-1">
                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    >
                      <option value="">Все города</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Сортировка */}
                <div className="flex gap-2">
                  {['name', 'price', 'completion'].map((field) => (
                    <button
                      key={field}
                      onClick={() => handleSort(field as SortField)}
                      className={`px-4 py-2 rounded-lg border font-medium transition whitespace-nowrap ${
                        sortField === field
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {getSortLabel(field as SortField)} {getSortIcon(field as SortField)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Сетка проектов */}
            {filteredAndSortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedProjects.map((project) => (
                  <Link href={`/projects/${project.id}`} key={project.id}>
                    <article className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all h-full flex flex-col">
                      {/* Изображение проекта */}
                      <div className="mb-4">
                        {project.main_image_url || (project.images && project.images.length > 0) ? (
                          <Image
                            src={project.main_image_url || project.images![0].url}
                            alt={project.name}
                            width={300}
                            height={200}
                            className="rounded-lg object-cover w-full h-40"
                          />
                        ) : (
                          <div className="w-full h-40 bg-slate-200 rounded-lg flex items-center justify-center">
                            <span className="text-slate-400">Нет изображения</span>
                          </div>
                        )}
                      </div>

                      {/* Контент */}
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                          {project.name}
                        </h3>

                        <div className="space-y-1 text-sm text-slate-600 mb-4">
                          <p>{project.city}</p>
                          <p className="line-clamp-1">{project.address}</p>
                          <p>Сдача: {formatDate(project.completion_date)}</p>
                        </div>

                        {/* Цена */}
                        <div className="mt-auto pt-3 border-t border-slate-200">
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900">
                              {formatPriceKGS(project.price_per_m2)}
                            </div>
                            <div className="text-sm text-slate-500">
                              {formatPriceUSD(project.price_per_m2)} за м²
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Проекты не найдены
                </h3>
                <p className="text-slate-600 mb-4">
                  {filterCity ? `Нет проектов в городе "${filterCity}"` : "У этого застройщика пока нет проектов"}
                </p>
                {filterCity && (
                  <button
                    onClick={() => setFilterCity('')}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                  >
                    Показать все проекты
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Призыв к действию */}
        <div className="mt-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 md:p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-2">
            Заинтересовались проектами {developer.name}?
          </h3>
          <p className="text-orange-100 mb-4">
            Свяжитесь с нами для получения подробной консультации
          </p>
          <Link
            href="/contacts"
            className="inline-block px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition"
          >
            Получить консультацию
          </Link>
        </div>
      </main>
    </div>
  );
}
