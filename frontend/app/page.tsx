"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import Header from "@/components/Header";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      <Header />

      <main className="relative flex flex-col items-center justify-center flex-1 text-center pt-20 px-4">
        {/* Фоновое изображение */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="Hero background"
            fill
            className="object-cover z-0"
          />
          <div className="absolute inset-0 bg-black opacity-40" />
        </div>

        {/* Текст и кнопки */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-lg">
            Найдите квартиру мечты в Кыргызстане
          </h1>
          <p className="mt-4 text-base sm:text-xl text-white drop-shadow">
            Вся новая недвижимость и застройщики в одном месте.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-xl text-base sm:text-lg font-semibold shadow-lg"
              onClick={() => router.push("/projects")}
            >
              Смотреть новостройки
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="w-full sm:w-auto px-6 py-3 bg-white text-orange-500 rounded-xl text-base sm:text-lg font-semibold shadow-lg border border-orange-500"
              onClick={() => router.push("/developers")}
            >
              Все застройщики
            </motion.button>
          </div>
        </motion.div>

        {/* Секция популярных проектов */}
        <section className="relative z-10 mt-20 max-w-6xl w-full px-4">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Популярные проекты
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { src: "/images/panorama_park.jpg", title: "Panorama Park" },
              { src: "/images/epos.jpg", title: "EPOS" },
              { src: "/images/gravity.jpg", title: "Gravity" },
            ].map((project, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <Image
                  src={project.src}
                  alt={project.title}
                  width={600}
                  height={400}
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {project.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
