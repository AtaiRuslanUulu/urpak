"use client";

import Header from "@/components/Header";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Developer {
  id: number;
  name: string;
  description: string;
  website?: string;
  logo: string;
}

export default function Developers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [search, setSearch] = useState("");

  /** 1️⃣ Берём базовый URL из env‑переменной.
   *    Если её нет (локальная разработка) — localhost */
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";

  const API_URL = `${API_BASE}/api/developers/`;

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then(setDevelopers)
      .catch((err) =>
        console.error("Ошибка загрузки застройщиков:", err.message)
      );
  }, [API_URL]); // 2️⃣ добавили зависимость

  const filtered = developers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="container mx-auto py-12 px-4 grow">
        <h1 className="text-4xl font-bold text-center mb-8">
          Застройщики Кыргызстана
        </h1>

        {/* Search */}
        <div className="flex justify-center mb-8">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Поиск застройщика…"
            className="w-full max-w-md px-4 py-2 border rounded-lg shadow-sm
                       focus:outline-none focus:ring focus:border-orange-500"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filtered.length ? (
            filtered.map((dev) => (
              <motion.div
                key={dev.id}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center
                           transition hover:shadow-lg"
              >
                {dev.logo ? (
                  <Image
                    src={dev.logo}
                    alt={dev.name}
                    width={120}
                    height={120}
                    className="rounded-full mb-4 object-cover border"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gray-200 mb-4 flex items-center justify-center">
                    no logo
                  </div>
                )}

                <h2 className="text-xl font-semibold">{dev.name}</h2>
                <p className="text-sm text-center mt-2">
                  {dev.description?.slice(0, 100)}…
                </p>

                {dev.website && (
                  <a
                    href={
                      dev.website.startsWith("http")
                        ? dev.website
                        : `https://${dev.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-full text-sm
                               hover:bg-orange-600"
                  >
                    Перейти на сайт
                  </a>
                )}
              </motion.div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-600">
              Застройщики не найдены
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
