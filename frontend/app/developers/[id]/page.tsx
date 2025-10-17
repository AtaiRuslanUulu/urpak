"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  images?: Array<{ url: string; caption?: string }>;
}

type SortDirection = "asc" | "desc";
type SortField = "name" | "price" | "completion";

export default function DeveloperDetailPage() {
  const params = useParams() as { id?: string };
  const id = params?.id;

  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterCity, setFilterCity] = useState<string>("");

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";

  const USD_TO_KGS = 85;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [devRes, projRes] = await Promise.all([
          fetch(`${API_BASE}/api/developers/${id}/`, { cache: "no-store" }),
          fetch(`${API_BASE}/api/projects/?developer=${id}`, { cache: "no-store" }),
        ]);
        if (!devRes.ok || !projRes.ok) throw new Error("HTTP");
        const devData: Developer = await devRes.json();
        const projData: Project[] = await projRes.json();
        if (!cancelled) {
          setDeveloper(devData);
          setProjects(projData || []);
        }
      } catch (e) {
        if (!cancelled) setError("Не удалось загрузить информацию о застройщике");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, API_BASE]);

  const cities = useMemo(
    () => [...new Set(projects.map((p) => p.city).filter(Boolean))],
    [projects]
  );

  const filteredAndSortedProjects = useMemo(() => {
    const filtered = projects.filter((p) => !filterCity || p.city === filterCity);
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
  }, [projects, filterCity, sortField, sortDirection]);

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
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });

  const getSortIcon = (field: SortField) =>
    sortField !== field ? "" : sortDirection === "asc" ? "↑" : "↓";

  if (!id) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-lg font-semibold">Некорректный адрес страницы</h1>
        <Link href="/developers" className="btn-secondary mt-4">← К списку застройщиков</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-12 max-w-6xl">
        <div className="animate-pulse">
          <div className="mb-8 flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-accent" />
            <div className="flex-1">
              <div className="mb-2 h-7 w-64 rounded bg-accent" />
              <div className="h-4 w-96 rounded bg-accent" />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card">
                <div className="mb-3 h-40 w-full rounded-xl bg-accent" />
                <div className="mb-2 h-4 w-2/3 rounded bg-accent" />
                <div className="h-3 w-1/2 rounded bg-accent" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-semibold">{error || "Застройщик не найден"}</h1>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link href="/developers" className="btn-secondary">← К списку застройщиков</Link>
          <button onClick={() => window.location.reload()} className="btn-primary">Попробовать снова</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/developers" className="hover:underline">Застройщики</Link>
        <span className="mx-2">→</span>
        <span className="text-fg">{developer.name}</span>
      </nav>

      <div className="mb-6 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="flex-shrink-0">
            {developer.logo_url ? (
              <Image
                src={developer.logo_url}
                alt={developer.name}
                width={100}
                height={100}
                className="rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-3xl font-bold text-muted">
                {developer.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="mb-3 text-2xl font-semibold md:text-3xl">{developer.name}</h1>
            <p className="mb-6 text-muted leading-relaxed">{developer.description}</p>

            <div className="mb-6 flex flex-wrap gap-3">
              <div className="rounded-lg bg-orange-100 px-3 py-2 text-orange-800">
                <span className="text-lg font-semibold">{projects.length}</span>
                <span className="ml-1 text-sm">проектов</span>
              </div>
              <div className="rounded-lg bg-blue-100 px-3 py-2 text-blue-800">
                <span className="text-lg font-semibold">{cities.length}</span>
                <span className="ml-1 text-sm">городов</span>
              </div>
              {developer.created_at && (
                <div className="rounded-lg bg-green-100 px-3 py-2 text-green-800">
                  <span className="text-sm">На рынке с </span>
                  <span className="font-semibold">{new Date(developer.created_at).getFullYear()}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {developer.website && (
                <a
                  href={developer.website.startsWith("http") ? developer.website : `https://${developer.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-center"
                >
                  Перейти на сайт
                </a>
              )}
              <Link href="/contacts" className="btn-secondary text-center">
                Связаться
              </Link>
            </div>
          </div>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold md:text-2xl">
              Проекты ({filteredAndSortedProjects.length})
            </h2>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {cities.length > 1 && (
                <div className="flex-1">
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
              )}

              <div className="flex gap-2">
                {(["name", "price", "completion"] as SortField[]).map((field) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={sortField === field ? "btn-primary" : "btn-secondary"}
                  >
                    {field === "name" ? "Название" : field === "price" ? "Цена" : "Дата сдачи"} {getSortIcon(field)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredAndSortedProjects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedProjects.map((project) => {
                const img =
                  project.main_image_url ||
                  (project.images?.length ? project.images[0].url : "") ||
                  "";
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <article className="card h-full p-4 hover:shadow-md transition">
                      <div className="mb-4 overflow-hidden rounded-xl">
                        {img ? (
                          <Image
                            src={img}
                            alt={project.name}
                            width={900}
                            height={560}
                            className="h-40 w-full rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-40 w-full rounded-xl bg-accent" />
                        )}
                      </div>

                      <h3 className="text-base font-semibold">{project.name}</h3>
                      <div className="mt-1 text-xs text-muted space-y-0.5">
                        <p>{project.city}</p>
                        <p className="line-clamp-1">{project.address}</p>
                        <p>Сдача: {formatDate(project.completion_date)}</p>
                      </div>

                      <div className="mt-3 border-t border-border pt-3">
                        <div className="text-right">
                          <div className="text-base font-semibold">
                            {formatPriceKGS(project.price_per_m2)}
                          </div>
                          <div className="text-xs text-muted">
                            {formatPriceUSD(project.price_per_m2)} за м²
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold">Проекты не найдены</h3>
              <p className="mt-1 text-sm text-muted">
                {filterCity ? `Нет проектов в городе «${filterCity}»` : "У этого застройщика пока нет проектов"}
              </p>
              {filterCity && (
                <button onClick={() => setFilterCity("")} className="btn-primary mt-4">
                  Показать все проекты
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-center text-white md:p-8">
        <h3 className="mb-2 text-xl font-bold">Заинтересовались проектами {developer.name}?</h3>
        <p className="mb-4 text-orange-100">Свяжитесь с нами для получения подробной консультации</p>
        <Link href="/contacts" className="btn bg-white text-orange-600 hover:bg-orange-50">
          Получить консультацию
        </Link>
      </div>
    </div>
  );
}
