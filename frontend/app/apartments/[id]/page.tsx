"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Developer {
  id: number;
  name: string;
  website?: string;
  logo_url?: string;
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
  images?: Array<{ url: string; caption?: string }>;
}

interface Apartment {
  id: number;
  project: Project;
  rooms: number;
  size_m2: number;
  price: number;
  floor?: number;
  status?: string;
  apartment_number?: string;
}

export default function ApartmentDetailPage() {
  const params = useParams() as { id?: string };
  const id = params?.id;

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";

  const USD_TO_KGS = 85;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/apartments/${id}/`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Apartment) => {
        if (!cancelled) setApartment(data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Ошибка загрузки квартиры:", err);
          setError("Не удалось загрузить информацию о квартире");
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id, API_BASE]);

  const formatPriceKGS = (price: number) =>
    `${Math.round(price * USD_TO_KGS).toLocaleString("ru-RU")} сом`;
  const formatPriceUSD = (price: number) =>
    `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });

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

  const loan = useMemo(() => {
    const price = apartment?.price ?? 0;
    const down = Math.round(price * 0.2);
    const loanAmount = Math.round(price - down);
    const monthly = Math.round(loanAmount * 0.01); // упрощённо ~1%/мес
    return { down, loanAmount, monthly };
  }, [apartment?.price]);

  if (!id) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-lg font-semibold">Некорректный адрес страницы</h1>
        <Link href="/projects" className="btn-secondary mt-4">← К проектам</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-12">
        <div className="animate-pulse">
          <div className="mb-6 h-6 w-3/4 rounded bg-accent" />
          <div className="card">
            <div className="mb-6 h-64 w-full rounded-xl bg-accent" />
            <div className="space-y-3">
              <div className="h-4 w-1/2 rounded bg-accent" />
              <div className="h-4 w-1/3 rounded bg-accent" />
              <div className="h-4 w-1/4 rounded bg-accent" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="container max-w-4xl py-16 text-center">
        <h1 className="text-2xl font-semibold">{error || "Квартира не найдена"}</h1>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link href="/projects" className="btn-secondary">← К проектам</Link>
          <button onClick={() => window.location.reload()} className="btn-primary">Попробовать снова</button>
        </div>
      </div>
    );
  }

  const mainImage =
    apartment.project.main_image_url ||
    (apartment.project.images?.length ? apartment.project.images[0].url : "") ||
    "";

  return (
    <div className="container max-w-4xl py-8">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/projects" className="hover:underline">Проекты</Link>
        <span className="mx-2">→</span>
        <Link href={`/projects/${apartment.project.id}`} className="hover:underline">
          {apartment.project.name}
        </Link>
        <span className="mx-2">→</span>
        <span className="text-fg">Квартира {apartment.apartment_number || `#${apartment.id}`}</span>
      </nav>

      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={apartment.project.name}
            width={1600}
            height={900}
            className="h-64 w-full object-cover md:h-80"
          />
        ) : (
          <div className="h-64 w-full bg-accent md:h-80" />
        )}
        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-2xl font-semibold md:text-3xl">
              {apartment.rooms}-комнатная квартира
            </h1>
            <p className="text-muted">в проекте {apartment.project.name}</p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            <div className="rounded-xl bg-accent p-4 text-center">
              <div className="mb-1 text-2xl font-semibold text-fg">{apartment.rooms}</div>
              <div className="text-xs text-muted">комнат</div>
            </div>
            <div className="rounded-xl bg-accent p-4 text-center">
              <div className="mb-1 text-2xl font-semibold text-fg">{apartment.size_m2}</div>
              <div className="text-xs text-muted">м²</div>
            </div>
            <div className="rounded-xl bg-accent p-4 text-center">
              <div className="mb-1 text-2xl font-semibold text-fg">{apartment.floor ?? "—"}</div>
              <div className="text-xs text-muted">этаж</div>
            </div>
            <div className="rounded-xl bg-accent p-4 text-center">
              <div className="mb-1 text-2xl font-semibold text-fg">
                {Math.round((apartment.price / Math.max(apartment.size_m2, 1)) * USD_TO_KGS).toLocaleString("ru-RU")}
              </div>
              <div className="text-xs text-muted">сом/м²</div>
            </div>
          </div>

          <div className="mb-8 rounded-xl bg-orange-50 p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-[hsl(var(--primary))]">
              {formatPriceKGS(apartment.price)}
            </div>
            <div className="text-muted">Общая стоимость • {formatPriceUSD(apartment.price)}</div>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <div className="card">
              <h3 className="mb-3 text-sm font-semibold">О проекте</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Адрес</span>
                  <span className="text-right">{apartment.project.address}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Город</span>
                  <span>{apartment.project.city}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Срок сдачи</span>
                  <span>{formatDate(apartment.project.completion_date)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Застройщик</span>
                  <Link
                    href={`/developers/${apartment.project.developer.id}`}
                    className="text-primary hover:underline"
                  >
                    {apartment.project.developer.name}
                  </Link>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="mb-3 text-sm font-semibold">Ипотечный калькулятор</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-accent p-3">
                  <div className="text-muted">Первоначальный взнос</div>
                  <div className="mt-1 font-semibold">{formatPriceKGS(loan.down)}</div>
                </div>
                <div className="rounded-xl bg-accent p-3">
                  <div className="text-muted">Сумма кредита</div>
                  <div className="mt-1 font-semibold">{formatPriceKGS(loan.loanAmount)}</div>
                </div>
                <div className="rounded-xl bg-accent p-3 col-span-2">
                  <div className="text-muted">Платёж в мес. (≈1%)</div>
                  <div className="mt-1 text-lg font-semibold">
                    {formatPriceKGS(loan.monthly)} <span className="text-xs text-muted">в мес.</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted">
                Расчёт упрощённый, для ориентира. Точные условия уточняйте у банка/застройщика.
              </div>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(apartment.status)}`}>
              {getStatusText(apartment.status)}
            </span>

            <div className="flex gap-3">
              <button onClick={() => setShowContactForm(true)} className="btn-primary">
                Связаться с застройщиком
              </button>
              <Link href={`/projects/${apartment.project.id}`} className="btn-secondary">
                Другие квартиры
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showContactForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-2 text-xl font-semibold">Связаться с застройщиком</h3>
            <p className="mb-4 text-sm text-muted">
              Оставьте контакты, и представитель {apartment.project.developer.name} свяжется с вами.
            </p>
            <form className="space-y-3">
              <input type="text" placeholder="Ваше имя" className="input" />
              <input type="tel" placeholder="Номер телефона" className="input" />
              <textarea placeholder="Сообщение (необязательно)" rows={3} className="input" />
              <div className="flex gap-2 pt-1">
                <button type="button" className="btn-primary flex-1">Отправить заявку</button>
                <button type="button" onClick={() => setShowContactForm(false)} className="btn-secondary flex-1">
                  Отменить
                </button>
              </div>
            </form>
            <div className="mt-3 text-center text-xs text-muted">
              Форма в разработке. Данные не отправляются.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
