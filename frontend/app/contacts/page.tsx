"use client";

import { useState } from "react";

export default function ContactsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-16">
      <main className="w-full max-w-5xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Свяжитесь с нами
        </h1>
        <p className="text-muted mb-12 text-lg">
          Готовы помочь найти идеальную недвижимость в Кыргызстане
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-left">
          {/* Левая колонка — форма */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">Напишите нам</h2>

            <div className="bg-accent/20 border border-accent rounded-lg p-4 mb-6">
              <p className="text-accent-foreground text-sm">
                📧 Форма находится в разработке. Пока свяжитесь с нами по телефону или email.
              </p>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block font-medium mb-2">Ваше имя *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Введите ваше имя"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Телефон</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+996 XXX XXX XXX"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Сообщение *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Расскажите, чем мы можем помочь..."
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition resize-none"
                />
              </div>

              <button
                type="button"
                disabled
                className="w-full bg-muted text-foreground/50 py-3 px-6 rounded-lg font-semibold cursor-not-allowed"
              >
                Форма находится в разработке
              </button>
            </form>
          </div>

          {/* Правая колонка — контакты */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col justify-center">
            <h2 className="text-2xl font-semibold mb-6 text-center lg:text-left">
              Контактная информация
            </h2>

            <div className="space-y-6 text-sm">
              <div>
                <p className="font-semibold">Телефон</p>
                <p className="text-muted">+996 XXX XXX XXX</p>
              </div>

              <div>
                <p className="font-semibold">Email</p>
                <p className="text-muted">info@urpak.kg</p>
              </div>

              <div>
                <p className="font-semibold">Адрес</p>
                <p className="text-muted">г. Бишкек, Кыргызстан</p>
              </div>

              <div>
                <p className="font-semibold">Время работы</p>
                <p className="text-muted">Пн–Пт: 9:00 – 18:00</p>
                <p className="text-muted">Сб: 10:00 – 16:00</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
