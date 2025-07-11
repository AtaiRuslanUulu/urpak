"use client";

import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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

export default function Developers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'projects' | 'newest'>('name');

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
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'projects':
          return (b.projects?.length || 0) - (a.projects?.length || 0);
        case 'newest':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        default:
          return 0;
      }
    });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="w-full max-w-7xl mx-auto px-4 py-14">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
              {error}
            </h1>
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

      <main className="w-full max-w-7xl mx-auto px-4 py-14">
        {/* Заголовок с статистикой */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-800 mb-4">
            Застройщики Кыргызстана
          </h1>
          <p className="text-slate-600 text-lg">
            {loading ? "Загрузка..." : `${developers.length} проверенных застройщиков`}
          </p>
        </div>

        {/* Поиск и фильтры */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          {/* Поиск */}
          <div className="flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Поиск по названию или описанию..."
              className="
                w-full px-5 py-3 rounded-full shadow
                border border-slate-300
                text-slate-800 placeholder:text-slate-400
                focus:border-orange-500 focus:ring-2 focus:ring-orange-400/20
                outline-none transition
              "
            />
          </div>

          {/* Сортировка */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">Сортировка:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'projects' | 'newest')}
              className="
                px-4 py-2 rounded-lg border border-slate-300
                text-slate-700 bg-white
                focus:border-orange-500 focus:ring-2 focus:ring-orange-400/20
                outline-none transition
              "
            >
              <option value="name">По алфавиту</option>
              <option value="projects">По количеству проектов</option>
              <option value="newest">Сначала новые</option>
            </select>
          </div>
        </div>

        {/* Результаты поиска */}
        {search && (
          <div className="mb-6 text-center">
            <p className="text-slate-600">
              Найдено: <span className="font-semibold">{processedDevelopers.length}</span> застройщиков
            </p>
          </div>
        )}

        {/* Сетка застройщиков */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-2xl p-6 flex flex-col items-center"
                >
                  <div className="w-24 h-24 rounded-full bg-slate-200 mb-4" />
                  <div className="w-32 h-6 bg-slate-200 rounded mb-2" />
                  <div className="w-40 h-4 bg-slate-200 rounded mb-4" />
                  <div className="w-20 h-8 bg-slate-200 rounded-full" />
                </div>
              ))
            : processedDevelopers.length > 0
            ? processedDevelopers.map((dev) => (
                <motion.div
                  key={dev.id}
                  variants={itemVariants}
                  whileHover={{
                    y: -6,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                  }}
                  className="bg-white rounded-2xl p-6 flex flex-col items-center cursor-pointer transition-all duration-300 hover:shadow-xl border border-slate-100"
                >
                  <Link
                    href={`/developers/${dev.id}`}
                    className="w-full flex flex-col items-center text-center"
                  >
                    {/* Логотип */}
                    <div className="relative mb-4">
                      {dev.logo_url ? (
                        <Image
                          src={dev.logo_url}
                          alt={dev.name}
                          width={96}
                          height={96}
                          className="rounded-full object-cover border-2 border-slate-200 hover:border-orange-300 transition-colors"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 mb-4 flex items-center justify-center text-white font-bold text-2xl">
                          {dev.name.charAt(0)}
                        </div>
                      )}

                      {/* Индикатор количества проектов */}
                      {dev.projects && dev.projects.length > 0 && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                          {dev.projects.length}
                        </div>
                      )}
                    </div>

                    {/* Название */}
                    <h2 className="text-lg font-semibold text-slate-800 mb-2 hover:text-orange-600 transition-colors">
                      {dev.name}
                    </h2>

                    {/* Описание */}
                    <p className="text-center text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                      {dev.description}
                    </p>

                    {/* Мета-информация */}
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {dev.projects && dev.projects.length > 0 && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                          {dev.projects.length} проектов
                        </span>
                      )}
                      {dev.website && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          Есть сайт
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Кнопки действий */}
                  <div className="flex gap-2 w-full">
                    <Link
                      href={`/developers/${dev.id}`}
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm text-center hover:bg-slate-200 transition-colors font-medium"
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
                        className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm text-center hover:bg-orange-600 transition-colors font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Сайт
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            : (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">🏗️</div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    Застройщики не найдены
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Попробуйте изменить поисковый запрос или очистить фильтры
                  </p>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Очистить поиск
                    </button>
                  )}
                </div>
              )}
        </motion.div>

        {/* Призыв к действию */}
        {!loading && developers.length > 0 && (
          <div className="mt-16 text-center bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Не нашли нужного застройщика?
            </h2>
            <p className="text-orange-100 mb-6">
              Свяжитесь с нами, и мы поможем найти идеального партнера для вашего проекта
            </p>
            <Link
              href="/contacts"
              className="inline-block px-8 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Связаться с нами
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
