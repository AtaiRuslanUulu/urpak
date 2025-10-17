// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city) params.set("city", city);
    router.push(`/projects${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="relative">
      <div className="hero-spot-a" />
      <div className="hero-spot-b" />

      <section className="container mx-auto max-w-6xl py-16 md:py-24">
        <div className="mx-auto text-center max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Найдите квартиру мечты в Кыргызстане
          </h1>
          <p className="text-muted md:text-base mb-8">
            Новостройки и проверенные застройщики — в одном месте. Умный поиск, фильтры и понятные карточки проектов.
          </p>

          <div className="rounded-2xl border border-border bg-card p-4 mb-6">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <input
                  className="input pl-10"
                  placeholder="Поиск по названию, застройщику…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M21 21l-4.2-4.2M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <select
                className="select md:w-48"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="">Все города</option>
                <option value="Бишкек">Бишкек</option>
                <option value="Ош">Ош</option>
                <option value="Кара-Балта">Кара-Балта</option>
                <option value="Каракол">Каракол</option>
              </select>

              <button onClick={handleSearch} className="btn btn-primary">
                Найти
              </button>
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-muted">
              <span>Популярные запросы:</span>
              {["бизнес-класс", "с отделкой", "ипотека", "1-комн"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQ(tag);
                    setTimeout(handleSearch, 0);
                  }}
                  className="rounded-full bg-accent px-2 py-1 transition hover:opacity-90"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Link href="/projects" className="btn btn-primary">
              Смотреть новостройки
            </Link>
            <Link href="/developers" className="btn btn-secondary">
              Все застройщики
            </Link>
          </div>
        </div>
      </section>

      {/* ПРОМО-СЛОТЫ: три крупные карточки */}
      <section className="container mx-auto max-w-6xl pb-10">
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Link
              key={i}
              href="/contacts"
              className="group flex flex-col justify-between rounded-2xl border-2 border-dashed border-border bg-card/60 p-6 hover:bg-card transition"
            >
              <div className="mb-4 h-40 rounded-xl bg-accent/60 grid place-items-center">
                <span className="text-muted text-sm">Место для вашего проекта</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Ваш проект</h3>
                  <p className="text-muted text-sm">Разместить рекламу на главной</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-accent text-sm group-hover:opacity-80">
                  Разместить
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Преимущества */}
      <section className="container mx-auto max-w-6xl pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card text-center">
            <h3 className="text-sm font-semibold">Проверенные застройщики</h3>
            <p className="mt-1 text-sm text-muted">
              Собираем базу компаний и проектов по всему Кыргызстану.
            </p>
          </div>
          <div className="card text-center">
            <h3 className="text-sm font-semibold">Умные фильтры</h3>
            <p className="mt-1 text-sm text-muted">
              Быстрый поиск по цене, сроку сдачи, локации и параметрам квартиры.
            </p>
          </div>
          <div className="card text-center">
            <h3 className="text-sm font-semibold">Честная визуализация</h3>
            <p className="mt-1 text-sm text-muted">
              Актуальные фото и планировки, понятные карточки объектов.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
