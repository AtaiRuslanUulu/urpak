"use client";

import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Project {
  id: number;
  name: string;
  city: string;
  price_per_m2: number;
  completion_date: string;
  address: string;
  images: string;
  developer: { id: number; name: string; logo: string };
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = "http://127.0.0.1:8000/api/projects/";

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-6">
          Новостройки Кыргызстана
        </h1>
        <p className="text-lg text-gray-600 text-center mb-10">
          Выберите лучший вариант для покупки жилья
        </p>

        {loading ? (
          <p className="text-center text-gray-500 text-lg">Загрузка...</p>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform"
              >
                {/* Project Image */}
                <Image
                  src={project.images || "/images/default-building.jpg"}
                  alt={project.name}
                  width={600}
                  height={400}
                  className="w-full h-56 object-cover"
                />

                {/* Project Info */}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {project.name}
                  </h2>
                  <p className="text-gray-800 text-sm">📍 {project.city}</p>
                  <p className="text-gray-800 font-medium mt-2">
                    💰 от {project.price_per_m2} $/м²
                  </p>
                  <p className="text-sm text-gray-800 mt-1">
                    🏗 Завершение:{" "}
                    {new Date(project.completion_date).toLocaleDateString("ru-RU")}
                  </p>
                  <p className="text-sm text-gray-800 mt-1">
                    📌 {project.address}
                  </p>

                  {/* Developer Info */}
                  <div className="mt-4 flex items-center">
                    <Image
                      src={project.developer.logo || "/images/default-logo.png"}
                      alt={project.developer.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <span className="ml-3 text-gray-800">{project.developer.name}</span>
                  </div>

                  {/* Buttons */}
                  <div className="mt-4 flex gap-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex-1 text-center px-4 py-2 bg-blue-600 text-gray-800 rounded-full text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Подробнее
                    </Link>
                    <Link
                      href={`/developers/${project.developer.id}`}
                      className="flex-1 text-center px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300 transition"
                    >
                      О застройщике
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">Нет доступных новостроек.</p>
        )}
      </main>
    </div>
  );
}
