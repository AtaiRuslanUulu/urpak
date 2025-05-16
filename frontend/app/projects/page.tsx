"use client";

import Header from "@/components/Header";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
  images: ProjectImage[];
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";
  const API_URL = `${API_BASE}/api/projects/`;

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data: Project[]) => setProjects(data))
      .catch((err) => console.error("Ошибка загрузки проектов:", err))
      .finally(() => setLoading(false));
  }, [API_URL]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-4 py-14">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-center text-slate-800 mb-12">
          Новостройки Кыргызстана
        </h1>

        {/* Поиск */}
        <div className="flex justify-center mb-10">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Искать по названию…"
            className="
              w-full max-w-xl px-5 py-3 rounded-full shadow
              border border-slate-300
              text-slate-800 placeholder:text-slate-400
              focus:border-orange-500 focus:ring-orange-400/50
              outline-none transition
            "
          />
        </div>

        {/* Карточки */}
        <div className="grid gap-8 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {loading
            ? // skeleton-loading
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-2xl p-6 flex flex-col"
                >
                  <div className="w-full h-40 bg-slate-200 rounded mb-4" />
                  <div className="w-3/4 h-6 bg-slate-200 rounded mb-2" />
                  <div className="w-1/2 h-4 bg-slate-200 rounded mb-4" />
                  <div className="w-full h-8 bg-slate-200 rounded-full mt-auto" />
                </div>
              ))
            : filtered.length > 0
            ? filtered.map((proj) => (
                <motion.article
                  key={proj.id}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  }}
                  className="bg-white rounded-2xl p-6 flex flex-col"
                >
                  {/* Первое изображение */}
                  {proj.images.length > 0 ? (
                    <Image
                        src={proj.images[0].url}
                        alt={proj.images[0].caption || proj.name}
                        width={400}
                        height={240}
                        className="rounded-2xl object-cover mb-4"
                    />
                  ) : (
                    <div className="w-full h-40 bg-slate-200 rounded mb-4 flex items-center justify-center text-slate-500 text-sm">
                        no image
                    </div>
                  )}

                  {/* Название */}
                  <h2 className="text-xl font-semibold text-slate-800">
                    {proj.name}
                  </h2>
                  <p className="text-sm text-slate-600 mb-2">
                    Застройщик: <strong>{proj.developer.name}</strong>
                  </p>

                  {/* Цена */}
                  <p className="text-slate-700 mb-4">
                    Цена: {proj.price_per_m2.toLocaleString()} ₸/м²
                  </p>

                  {/* Кнопка */}
                  <a
                    href={`/projects/${proj.id}`}
                    className="mt-auto inline-block text-center px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                  >
                    Подробнее
                  </a>
                </motion.article>
              ))
            : (
                <p className="col-span-full text-center text-lg text-slate-600">
                  Проекты не найдены.
                </p>
              )}
        </div>
      </main>
    </div>
  );
}
