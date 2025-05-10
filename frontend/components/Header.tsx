"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HiMenu, HiX } from "react-icons/hi";

export default function Header() {
  const [open, setOpen] = useState(false);
  const LOGO_URL =
    process.env.NEXT_PUBLIC_LOGO_URL || "/favicon.ico"; // fallback на иконку из public/

  return (
    <header className="bg-gray-800 text-white py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center px-6">
        {/* Logo + Title */}
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src={LOGO_URL}
            alt="URPAK.KG Logo"
            width={40}
            height={40}
            className="rounded-full overflow-hidden"
          />
          <span className="text-2xl font-bold">URPAK.KG</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:block">
          <ul className="flex space-x-6 text-lg">
            <li>
              <Link href="/" className="hover:text-orange-400 transition">
                Главная
              </Link>
            </li>
            <li>
              <Link href="/projects" className="hover:text-orange-400 transition">
                Новостройки
              </Link>
            </li>
            <li>
              <Link href="/developers" className="hover:text-orange-400 transition">
                Застройщики
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="hover:text-orange-400 transition">
                Контакты
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-2xl focus:outline-none"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <HiX /> : <HiMenu />}
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <nav className="md:hidden bg-gray-800">
          <ul className="flex flex-col px-6 py-4 space-y-4 text-lg">
            {[
              ["/", "Главная"],
              ["/projects", "Новостройки"],
              ["/developers", "Застройщики"],
              ["/contacts", "Контакты"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="hover:text-orange-400 transition"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
