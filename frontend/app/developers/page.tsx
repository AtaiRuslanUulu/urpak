"use client";

import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Developer {
  id: number;
  name: string;
  description: string;
  website?: string;
  logo_url: string;
  created_at?: string;
  projects?: Array<{
    id: number;
    name: string;
    city: string;
  }>;
}

type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'projects' | 'newest';

export default function Developers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";
  const API_URL = `${API_BASE}/api/developers/`;

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setDevelopers)
      .catch((err) => {
        console.error("Ошибка загрузки застройщиков:", err);
        setError("Не удалось загрузить застройщиков");
      })
      .finally(() => setLoading(false));
  }, [API_URL]);

  // Фильтрация и сортировка
  const processedDevelopers = developers
    .filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'projects':
          comparison = (a.projects?.length || 0) - (b.projects?.length || 0);
          break;
        case 'newest':
          comparison = new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getSortLabel = (field: SortField) => {
    const labels = {
      name: 'Название',
      projects: 'Проекты',
      newest: 'Новые'
    };
    return labels[field];
  };

  const clearSearch = () => {
    setSearch("");
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
            Застройщики Кыргызстана
          </h1>
          <p className="text-slate-600">
            {loading ? "Загрузка..." : `${processedDevelopers.length} из ${developers.length} застройщиков`}
          </p>
        </div>

        {/* Поиск и сортировка */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Поиск */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск застройщиков..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
                  />
                  <svg className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Сортировка */}
              <div className="flex gap-2">
                {['name', 'projects', 'newest'].map((field) => (
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
            </div>

            {/* Результаты и очистка */}
            {search && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <span className="text-sm text-slate-600">
                  Найдено: {processedDevelopers.length} застройщиков
                </span>
                <button
                  onClick={clearSearch}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Очистить поиск
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Сетка застройщиков */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-slate-200 mb-4" />
                    <div className="w-32 h-5 bg-slate-200 rounded mb-2" />
                    <div className="w-40 h-4 bg-slate-200 rounded mb-4" />
                    <div className="w-20 h-6 bg-slate-200 rounded" />
                  </div>
                </div>
              ))
            : processedDevelopers.length > 0
            ? processedDevelopers.map((dev) => (
                <div key={dev.id} className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-orange-200 transition-all p-6 flex flex-col items-center text-center h-full">
                  <Link href={`/developers/${dev.id}`} className="w-full flex flex-col items-center flex-1">
                    {/* Логотип */}
                    <div className="relative mb-4">
                      {dev.logo_url ? (
                        <Image
                          src={dev.logo_url}
                          alt={dev.name}
                          width={80}
                          height={80}
                          className="rounded-full object-cover border-2 border-slate-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                          {dev.name.charAt(0)}
                        </div>
                      )}

                      {/* Индикатор количества проектов */}
                      {dev.projects && dev.projects.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {dev.projects.length}
                        </div>
                      )}
                    </div>

                    {/* Название */}
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">
                      {dev.name}
                    </h2>

                    {/* Описание */}
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed flex-1">
                      {dev.description}
                    </p>

                    {/* Мета-информация */}
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {dev.projects && dev.projects.length > 0 && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                          {dev.projects.length} проектов
                        </span>
                      )}
                      {dev.website && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          Сайт
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Кнопки действий */}
                  <div className="flex gap-2 w-full mt-auto">
                    <Link
                      href={`/developers/${dev.id}`}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm text-center hover:bg-slate-200 transition-colors font-medium"
                    >
                      Подробнее
                    </Link>

                    {dev.website && (
                      <a
                        href={
                          dev.website.startsWith("http")
                            ? dev.website
                            : `https://${dev.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 rounded-lg bg-orange-500 text-white text-sm text-center hover:bg-orange-600 transition-colors font-medium"
                      >
                        Сайт
                      </a>
                    )}
                  </div>
                </div>
              ))
            : (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Застройщики не найдены
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Попробуйте изменить поисковый запрос
                  </p>
                  {search && (
                    <button
                      onClick={clearSearch}
                      className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                      Очистить поиск
                    </button>
                  )}
                </div>
              )}
        </div>

        {/* Призыв к действию */}
        {!loading && developers.length > 0 && (
          <div className="mt-12 text-center bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 md:p-8 text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-3">
              Не нашли нужного застройщика?
            </h2>
            <p className="text-orange-100 mb-4 md:mb-6">
              Свяжитесь с нами, и мы поможем найти идеального партнера для вашего проекта
            </p>
            <Link
              href="/contacts"
              className="inline-block px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition"
            >
              Связаться с нами
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
