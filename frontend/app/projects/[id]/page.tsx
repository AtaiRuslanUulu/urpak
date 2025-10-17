// app/projects/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface ProjectImage {
  url: string;
  caption?: string;
  position: number;
}

interface Developer {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
}

interface Apartment {
  id: number;
  floor: number;
  rooms: number;
  size_m2: number;
  price: number;
  status?: string;
  apartment_number?: string;
}

interface Project {
  id: number;
  name: string;
  developer: Developer;
  city: string;
  address: string;
  completion_date: string;
  price_per_m2: number;
  description?: string;
  main_image_url?: string;
  images: ProjectImage[];
  apartments: Apartment[];
}

export default function ProjectDetailPage() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";
  const API_URL = id ? `${API_BASE}/api/projects/${id}/` : null;

  const USD_TO_KGS = 85;

  useEffect(() => {
    if (!API_URL) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(API_URL, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Project) => {
        if (!cancelled) setProject(data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Ошибка загрузки проекта:", err);
          setError("Не удалось загрузить проект");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  const formatPriceKGS = (price: number) =>
    `${Math.round(price * USD_TO_KGS).toLocaleString("ru-RU")} сом`;

  const formatPriceUSD = (price: number) =>
    `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string = "available") => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      case "sold":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string = "available") => {
    switch (status) {
      case "available":
        return "Доступна";
      case "reserved":
        return "Забронирована";
      case "sold":
        return "Продана";
      default:
        return "Неизвестно";
    }
  };

  if (!id) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-lg font-semibold">Некорректный адрес страницы</h1>
        <Link href="/projects" className="btn-secondary mt-4">
          ← К списку проектов
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-12 max-w-6xl">
        <div className="animate-pulse">
          <div className="h-7 w-3/4 rounded bg-accent mb-3" />
          <div className="h-4 w-1/2 rounded bg-accent mb-2" />
          <div className="h-4 w-2/3 rounded bg-accent mb-4" />
          <div className="h-48 w-full rounded-2xl bg-accent" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-semibold">{error || "Проект не найден"}</h1>
        <Link href="/projects" className="btn-secondary mt-4">
          ← Вернуться к списку проектов
        </Link>
      </div>
    );
  }

  const mainImage =
    project.main_image_url ||
    (project.images?.length ? project.images[0].url : "") ||
    "";

  return (
    <div className="container py-12 max-w-6xl">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/projects" className="hover:underline">
          Новостройки
        </Link>
        <span className="mx-2">→</span>
        <span className="text-fg">{project.name}</span>
      </nav>

      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold mb-4">{project.name}</h1>

            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <span className="w-32 text-sm text-muted">Город:</span>
                <span className="text-fg">{project.city}</span>
              </div>
              <div className="flex items-center">
                <span className="w-32 text-sm text-muted">Адрес:</span>
                <span className="text-fg">{project.address}</span>
              </div>
              <div className="flex items-center">
                <span className="w-32 text-sm text-muted">Срок сдачи:</span>
                <span className="text-fg">{formatDate(project.completion_date)}</span>
              </div>
              <div className="flex items-center">
                <span className="w-32 text-sm text-muted">Цена за м²:</span>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold text-fg">
                    {formatPriceKGS(project.price_per_m2)} /м²
                  </span>
                  <span className="text-xs text-muted">
                    ({formatPriceUSD(project.price_per_m2)} /м²)
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-3">Застройщик</h3>
              <Link
                href={`/developers/${project.developer.id}`}
                className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-accent"
              >
                {project.developer.logo_url ? (
                  <Image
                    src={project.developer.logo_url}
                    alt={project.developer.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-muted text-xs">
                    logo
                  </div>
                )}
                <div>
                  <p className="font-medium">{project.developer.name}</p>
                  {project.developer.description && (
                    <p className="text-sm text-muted line-clamp-2">
                      {project.developer.description}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          </div>

          <div>
            {mainImage ? (
              <Image
                src={mainImage}
                alt={project.name}
                width={900}
                height={600}
                className="h-[400px] w-full cursor-pointer rounded-2xl object-cover transition hover:opacity-90"
                onClick={() => setSelectedImage(mainImage)}
              />
            ) : (
              <div className="flex h-[400px] w-full items-center justify-center rounded-2xl bg-accent text-muted">
                Нет изображений
              </div>
            )}
          </div>
        </div>

        {project.description && (
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-3">О проекте</h3>
            <p className="leading-relaxed text-muted">{project.description}</p>
          </div>
        )}
      </div>

      {project.images?.length > 0 && (
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-6 text-xl font-semibold">Галерея проекта</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.images.map((img) => (
              <button
                key={img.position}
                className="group overflow-hidden rounded-xl"
                onClick={() => setSelectedImage(img.url)}
              >
                <Image
                  src={img.url}
                  alt={img.caption || project.name}
                  width={800}
                  height={600}
                  className="h-48 w-full rounded-xl object-cover transition-transform group-hover:scale-[1.02]"
                />
                {img.caption && (
                  <p className="mt-2 text-center text-sm text-muted">{img.caption}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {project.apartments?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Доступные квартиры ({project.apartments.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm text-muted">Квартира</th>
                  <th className="px-4 py-3 text-left text-sm text-muted">Этаж</th>
                  <th className="px-4 py-3 text-left text-sm text-muted">Комнат</th>
                  <th className="px-4 py-3 text-left text-sm text-muted">Площадь</th>
                  <th className="px-4 py-3 text-left text-sm text-muted">Цена</th>
                  <th className="px-4 py-3 text-left text-sm text-muted">Статус</th>
                  <th className="px-4 py-3 text-left text-sm text-muted">Действия</th>
                </tr>
              </thead>
              <tbody>
                {project.apartments.map((apt) => (
                  <tr key={apt.id} className="border-b border-border transition hover:bg-accent">
                    <td className="px-4 py-4">
                      <span className="font-medium">{apt.apartment_number || `#${apt.id}`}</span>
                    </td>
                    <td className="px-4 py-4 text-muted">{apt.floor}</td>
                    <td className="px-4 py-4 text-muted">{apt.rooms}</td>
                    <td className="px-4 py-4 text-muted">{apt.size_m2} м²</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{formatPriceKGS(apt.price)}</span>
                        <span className="text-xs text-muted">({formatPriceUSD(apt.price)})</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                          apt.status || "available"
                        )}`}
                      >
                        {getStatusText(apt.status || "available")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/apartments/${apt.id}`} className="text-sm text-primary hover:underline">
                        Подробнее →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            <Image
              src={selectedImage}
              alt="Увеличенное изображение"
              width={1600}
              height={900}
              className="max-h-[90vh] w-auto max-w-full rounded-xl object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="btn-secondary absolute right-4 top-4 h-9 px-3"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
