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
  logo_url?: string;
}

export default function Developers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [search, setSearch] = useState("");

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
  }, [API_URL]);

  const filtered = developers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-4 py-14">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-center text-slate-800 mb-12">
          Застройщики Кыргызстана
        </h1>

        <div className="flex justify-center mb-10">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Искать по названию…"
            className="w-full max-w-xl px-5 py-3 rounded-full shadow
                       border border-slate-300
                       focus:border-orange-500 focus:ring-orange-400/50
                       outline-none transition"
          />
        </div>

        <div className="grid gap-8
                        grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {filtered.length ? (
            filtered.map((dev) => (
              <motion.article
                key={dev.id}
                whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                className="bg-white rounded-2xl p-6 flex flex-col items-center"
              >
                {/* лого */}
                {dev.logo_url ? (
                  <Image
                    src={dev.logo_url}
                    alt={dev.name}
                    width={96}
                    height={96}
                    className="rounded-full object-cover border border-slate-200 mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 flex items-center justify-center text-sm text-slate-500">
                    no logo
                  </div>
                )}

                {/* имя */}
                <h2 className="text-lg font-semibold text-slate-800">
                  {dev.name}
                </h2>

                {/* описание */}
                <p className="text-center text-sm text-slate-600 mt-2 line-clamp-3">
                  {dev.description}
                </p>

                {/* ссылка */}
                {dev.website && (
                  <a
                    href={
                      dev.website.startsWith("http")
                        ? dev.website
                        : `https://${dev.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 px-5 py-2 rounded-full bg-orange-500
                               text-white text-sm hover:bg-orange-600
                               transition-colors"
                  >
                    Перейти на сайт
                  </a>
                )}
              </motion.article>
            ))
          ) : (
            <p className="col-span-full text-center text-lg text-slate-600">
              Застройщики не найдены
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
