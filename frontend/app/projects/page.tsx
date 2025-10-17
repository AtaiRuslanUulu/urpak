"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

type SortDirection = "asc" | "desc";
type SortField = "name" | "price" | "completion";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterDeveloper, setFilterDeveloper] = useState<string>("");

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";
  const API_URL = `${API_BASE}/api/projects/`;

  const USD_TO_KGS = 85;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(API_URL, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Project[]) => {
        if (!cancelled) setProjects(data || []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Ошибка загрузки проектов:", err);
          setError("Не удалось загрузить проекты");
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  const cities = useMemo(
    () => [...new Set(projects.map((p) => p.city).filter(Boolean))].sort(),
    [projects]
  );

  const developers = useMemo(
    () => [...new Set(projects.map((p) => p.developer?.name).filter(Boolean))].sort(),
    [projects]
  );

  const processedProjects = useMemo(() => {
    const filtered = projects.filter((p) => {
      const s = search.trim().toLowerCase();
      const matchesSearch =
        !s ||
        p.name.toLowerCase().includes(s) ||
        p.city.toLowerCase().includes(s) ||
        p.developer?.name.toLowerCase().includes(s);

      const matchesCity = !filterCity || p.city === filterCity;
      const matchesDeveloper = !filterDeveloper || p.developer?.name === filterDeveloper;

      return matchesSearch && matchesCity && matchesDeveloper;
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "price":
          cmp = (a.price_per_m2 ?? 0) - (b.price_per_m2 ?? 0);
          break;
        case "completion":
          cmp =
            new Date(a.completion_date).getTime() -
            new Date(b.completion_date).getTime();
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [projects, search, filterCity, filterDeveloper, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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

  const activeFiltersCount = [search, filterCity, filterDeveloper].filter(Boolean).length;

  if (error) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-xl font-semibold">{error}</h1>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Новостройки Кыргызстана</h1>
          <p className="mt-1 text-sm text-muted">
            {loading
              ? "Загрузка…"
              : `${processedProjects.length} из ${projects.length} проектов`}
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию, городу или застройщику…"
                className="input pl-10"
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

            <div className="flex gap-2">
              {(["name", "price", "completion"] as SortField[]).map((field) => {
                const active = sortField === field;
                const arrow = active ? (sortDirection === "asc" ? "↑" : "↓") : "";
                return (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={active ? "btn-primary" : "btn-secondary"}
                  >
                    {field === "name" ? "Название" : field === "price" ? "Цена" : "Дата сдачи"} {arrow}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={activeFiltersCount > 0 ? "btn-primary" : "btn-secondary"}
            >
              Фильтры{activeFiltersCount > 0 ? ` · ${activeFiltersCount}` : ""}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-muted">Город</label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="select"
                >
                  <option value="">Все города</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Застройщик</label>
                <select
                  value={filterDeveloper}
                  onChange={(e) => setFilterDeveloper(e.target.value)}
                  className="select"
                >
                  <option value="">Все застройщики</option>
                  {developers.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="btn-secondary">
                    Очистить всё
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[16/10] w-full rounded-xl bg-accent" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-1/2 bg-accent rounded" />
                  <div className="h-3 w-1/3 bg-accent rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : processedProjects.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <h3 className="text-lg font-semibold">Проекты не найдены</h3>
            <p className="mt-1 text-sm text-muted">Попробуйте изменить параметры поиска.</p>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="btn-primary mt-4">
                Очистить фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {processedProjects.map((proj) => {
              const imageSrc =
                proj.main_image_url ||
                (proj.images?.length ? proj.images[0].url : "") ||
                "";

              return (
                <Link key={proj.id} href={`/projects/${proj.id}`}>
                  <article className="card h-full">
                    <div className="mb-3 overflow-hidden rounded-xl">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={proj.name}
                          width={900}
                          height={560}
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="h-48 w-full bg-accent" />
                      )}
                    </div>

                    <h2 className="text-sm font-semibold">{proj.name}</h2>
                    <div className="mt-1 text-xs text-muted space-y-0.5">
                      <p>{proj.city}</p>
                      <p>{proj.developer?.name}</p>
                      <p>Сдача: {new Date(proj.completion_date).toLocaleDateString("ru-RU")}</p>
                    </div>

                    <div className="mt-3 border-t border-border pt-3">
                      <div className="text-right">
                        <div className="text-base font-semibold">
                          {formatPriceKGS(proj.price_per_m2)}
                        </div>
                        <div className="text-xs text-muted">
                          {formatPriceUSD(proj.price_per_m2)} за м²
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
