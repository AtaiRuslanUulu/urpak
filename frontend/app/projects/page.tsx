"use client";

import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Developer {
  id: number;
  name: string;
}

interface ProjectImage {
  url: string;
  caption?: string;
  position: number;
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
  images: ProjectImage[];
}

type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'price' | 'completion';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterDeveloper, setFilterDeveloper] = useState<string>('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
  const API_URL = `${API_BASE}/api/projects/`;
  const USD_TO_KGS = 85;

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Project[]) => setProjects(data))
      .catch((err) => {
        console.error("Ошибка загрузки проектов:", err);
        setError("Не удалось загрузить проекты");
      })
      .finally(() => setLoading(false));
  }, [API_URL]);

  const cities = [...new Set(projects.map(p => p.city))].sort();
  const developers = [...new Set(projects.map(p => p.developer.name))].sort();

  const processedProjects = projects
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                           p.city.toLowerCase().includes(search.toLowerCase()) ||
                           p.developer.name.toLowerCase().includes(search.toLowerCase());
      const matchesCity = !filterCity || p.city === filterCity;
      const matchesDeveloper = !filterDeveloper || p.developer.name === filterDeveloper;
      return matchesSearch && matchesCity && matchesDeveloper;
    })
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

  const clearFilters = () => {
    setSearch("");
    setFilterCity("");
    setFilterDeveloper("");
    setShowFilters(false);
  };

  const hasActiveFilters = search || filterCity || filterDeveloper;
  const activeFiltersCount = [search, filterCity, filterDeveloper].filter(Boolean).length;

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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="w-full max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 mb-4">{error}</h1>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Попробовать снова
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2">
            Новостройки Кыргызстана
          </h1>
          <p className="text-slate-600">
            {loading ? "Загрузка..." : `${processedProjects.length} из ${projects.length} проектов`}
          </p>
        </div>

        {/* Главная строка: поиск + сортировка + фильтры */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Поиск */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по проектам..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
                  />
                  <svg className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Сортировка */}
              <div className="flex gap-2">
                {['name', 'price', 'completion'].map((field) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field as SortField)}
                    className={`px-4 py-3 rounded-lg border font-medium transition whitespace-nowrap ${
                      sortField === field
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {getSortLabel(field as SortField)} {getSortIcon(field as SortField)}
                  </button>
                ))}
              </div>

              {/* Кнопка фильтров */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-lg border font-medium transition flex items-center gap-2 ${
                  activeFiltersCount > 0
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                Фильтры
                {activeFiltersCount > 0 && (
                  <span className="bg-white text-orange-500 text-xs px-2 py-1 rounded-full font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Дополнительные фильтры */}
          {showFilters && (
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Город
                  </label>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Все города</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Застройщик
                  </label>
                  <select
                    value={filterDeveloper}
                    onChange={(e) => setFilterDeveloper(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Все застройщики</option>
                    {developers.map(dev => (
                      <option key={dev} value={dev}>{dev}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                    >
                      Очистить всё
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Карточки проектов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <div className="w-full h-48 bg-slate-200 rounded-lg mb-4" />
                  <div className="w-3/4 h-5 bg-slate-200 rounded mb-2" />
                  <div className="w-1/2 h-4 bg-slate-200 rounded mb-4" />
                  <div className="w-full h-6 bg-slate-200 rounded" />
                </div>
              ))
            : processedProjects.length > 0
            ? processedProjects.map((proj) => (
                <Link href={`/projects/${proj.id}`} key={proj.id}>
                  <article className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-orange-200 transition-all p-6 h-full flex flex-col">
                    {/* Изображение */}
                    <div className="mb-4">
                      {proj.main_image_url || (proj.images && proj.images.length > 0) ? (
                        <Image
                          src={proj.main_image_url || proj.images[0].url}
                          alt={proj.name}
                          width={300}
                          height={200}
                          className="rounded-lg object-cover w-full h-48"
                        />
                      ) : (
                        <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                          Нет изображения
                        </div>
                      )}
                    </div>

                    {/* Контент */}
                    <div className="flex-1 flex flex-col">
                      <h2 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                        {proj.name}
                      </h2>

                      <div className="space-y-1 text-sm text-slate-600 mb-4">
                        <p>{proj.city}</p>
                        <p>{proj.developer.name}</p>
                        <p>Сдача: {new Date(proj.completion_date).toLocaleDateString("ru-RU")}</p>
                      </div>

                      {/* Цена */}
                      <div className="mt-auto pt-3 border-t border-slate-100">
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900">
                            {formatPriceKGS(proj.price_per_m2)}
                          </div>
                          <div className="text-sm text-slate-500">
                            {formatPriceUSD(proj.price_per_m2)} за м²
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))
            : (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Проекты не найдены
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Попробуйте изменить параметры поиска
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                      Очистить фильтры
                    </button>
                  )}
                </div>
              )}
        </div>
      </main>
    </div>
  );
}
