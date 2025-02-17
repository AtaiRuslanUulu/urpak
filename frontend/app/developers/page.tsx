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
  const API_URL = "http://127.0.0.1:8000/api/developers/";

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setDevelopers(data))
      .catch((error) => console.error("Ошибка загрузки застройщиков:", error));
  }, []);

  const filteredDevelopers = developers.filter((dev) =>
    dev.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">
          Застройщики Кыргызстана
        </h1>

        {/* Search Bar */}
        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="🔍 Поиск застройщика..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredDevelopers.length > 0 ? (
            filteredDevelopers.map((dev) => (
              <motion.div
                key={dev.id}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center transition-transform hover:shadow-lg"
              >
                {/* Developer Logo */}
                {dev.logo ? (
                  <Image
                    src={dev.logo}
                    alt={dev.name}
                    width={120}
                    height={120}
                    className="rounded-full mb-4 object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gray-200 mb-4 flex items-center justify-center text-gray-600">
                    No Logo
                  </div>
                )}

                {/* Developer Name */}
                <h2 className="text-xl font-semibold text-gray-800">{dev.name}</h2>

                {/* Developer Description */}
                <p className="text-gray-600 text-sm mt-2 text-center">
                  {dev.description?.slice(0, 100)}...
                </p>

                {/* Website Button */}
                {dev.website && (
                  <a
                    href={dev.website.startsWith("http") ? dev.website : `https://${dev.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block px-4 py-2 bg-orange-500 text-white rounded-full text-sm hover:bg-orange-600 transition-colors"
                  >
                    Перейти на сайт
                  </a>
                )}
              </motion.div>
            ))
          ) : (
            <p className="text-gray-600 text-lg col-span-full text-center">
              Застройщики не найдены.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
