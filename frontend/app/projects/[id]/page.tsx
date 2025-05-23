// app/projects/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Image from "next/image";

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

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";
  const API_URL = `${API_BASE}/api/projects/${id}/`;

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then(setProject)
      .catch((err) => console.error("Ошибка загрузки проекта:", err))
      .finally(() => setLoading(false));
  }, [API_URL]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto py-12 px-4">
          <p>Загрузка проекта...</p>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto py-12 px-4">
          <p className="text-center text-lg text-slate-600">
            Проект не найден.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-slate-800">{project.name}</h1>

        <p className="mb-4 text-slate-600">
          Город: {project.city} — Адрес: {project.address}
        </p>

        <p className="mb-4 text-slate-600">
          Срок сдачи: {project.completion_date}
        </p>

        <p className="text-slate-700 mb-4">
          Цена: {project.price_per_m2.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })} /м²
        </p>

        <p className="mb-4 text-slate-600">
          Застройщик: <strong>{project.developer.name}</strong>
        </p>

        {/* Галерея */}
        {project.images.length > 0 && (
          <div className="overflow-x-auto whitespace-nowrap space-x-4 flex pb-4">
            {project.images.map((img) => (
              <Image
                key={img.position}
                src={img.url}
                alt={img.caption || project.name}
                width={320}
                height={180}
                className="rounded-lg inline-block object-cover flex-shrink-0"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
