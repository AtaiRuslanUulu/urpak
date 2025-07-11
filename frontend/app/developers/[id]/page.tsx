"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

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

export default function DeveloperDetailPage() {
  const { id } = useParams();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'completion'>('name');
  const [filterCity, setFilterCity] = useState<string>('');

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

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
    .filter(p => !filterCity || p.city.toLowerCase().includes(filterCity.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price_per_m2 - b.price_per_m2;
        case 'completion':
          return new Date(a.completion_date).getTime() - new Date(b.completion_date).getTime();
        default:
          return 0;
      }
    });

  // Уникальные города для фильтра
  const cities = [...new Set(projects.map(p => p.city))];

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
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl p-6">
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
            <div className="text-6xl mb-4">🏗️</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
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
      <main className="container mx-auto py-12 px-4 max-w-6xl">
        {/* Хлебные крошки */}
        <nav className="mb-6 text-sm text-slate-600">
          <Link href="/developers" className="hover:text-orange-500">
            Застройщики
          </Link>
          <span className="mx-2">→</span>
          <span className="text-slate-800">{developer.name}</span>
        </nav>

        {/* Информация о застройщике */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Логотип */}
            <div className="flex-shrink-0">
              {developer.logo_url ? (
                <Image
                  src={developer.logo_url}
                  alt={developer.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-30 h-30 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-4xl">
                  {developer.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Основная информация */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-800 mb-4">
                {developer.name}
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                {developer.description}
              </p>

              {/* Статистика */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">
                  <span className="font-semibold text-xl">{projects.length}</span>
                  <span className="text-sm ml-1">проектов</span>
                </div>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                  <span className="font-semibold text-xl">{cities.length}</span>
                  <span className="text-sm ml-1">городов</span>
                </div>
                {developer.created_at && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                    <span className="text-sm">На рынке с </span>
                    <span className="font-semibold">{new Date(developer.created_at).getFullYear()}</span>
                  </div>
                )}
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-4">
                {developer.website && (
                  <a
                    href={
                      developer.website.startsWith("http")
                        ? developer.website
                        : `https://${developer.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    Перейти на сайт
                  </a>
                )}
                <Link
                  href="/contacts"
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Связаться
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Проекты */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              Проекты ({projects.length})
            </h2>

            {/* Фильтры и сортировка */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Фильтр по городу */}
              {cities.length > 1 && (
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-400/20 outline-none"
                >
                  <option value="">Все города</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              )}

              {/* Сортировка */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'completion')}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-400/20 outline-none"
              >
                <option value="name">По алфавиту</option>
                <option value="price">По цене</option>
                <option value="completion">По дате сдачи</option>
              </select>
            </div>
          </div>

          {/* Сетка проектов */}
          {filteredAndSortedProjects.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredAndSortedProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
                  }}
                  className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-orange-300 transition-all cursor-pointer"
                >
                  <Link href={`/projects/${project.id}`}>
                    {/* Изображение проекта */}
                    {project.main_image_url || (project.images && project.images.length > 0) ? (
                      <Image
                        src={project.main_image_url || project.images![0].url}
                        alt={project.name}
                        width={400}
                        height={240}
                        className="rounded-lg object-cover w-full h-40 mb-4"
                      />
                    ) : (
                      <div className="w-full h-40 bg-slate-200 rounded-lg mb-4 flex items-center justify-center">
                        <span className="text-slate-500">🏢</span>
                      </div>
                    )}

                    {/* Информация о проекте */}
                    <h3 className="text-lg font-semibold text-slate-800 mb-2 hover:text-orange-600 transition-colors">
                      {project.name}
                    </h3>

                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center">
                        <span className="w-16 font-medium">Город:</span>
                        <span>{project.city}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-16 font-medium">Адрес:</span>
                        <span className="truncate">{project.address}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-16 font-medium">Сдача:</span>
                        <span>{formatDate(project.completion_date)}</span>
                      </div>
                    </div>

                    {/* Цена */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-sm">Цена за м²:</span>
                        <span className="text-lg font-bold text-orange-600">
                          {formatPrice(project.price_per_m2)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Проекты не найдены
              </h3>
              <p className="text-slate-600 mb-4">
                {filterCity ? `Нет проектов в городе "${filterCity}"` : "У этого застройщика пока нет проектов"}
              </p>
              {filterCity && (
                <button
                  onClick={() => setFilterCity('')}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Показать все проекты
                </button>
              )}
            </div>
          )}
        </div>

        {/* Призыв к действию */}
        <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-2">
            Заинтересовались проектами {developer.name}?
          </h3>
          <p className="text-orange-100 mb-4">
            Свяжитесь с нами для получения подробной консультации
          </p>
          <Link
            href="/contacts"
            className="inline-block px-8 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            Получить консультацию
          </Link>
        </div>
      </main>
    </div>
  );
}
