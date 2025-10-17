"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HiMenu, HiX } from "react-icons/hi";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || "/favicon.ico";

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`text-sm ${active ? "text-fg" : "text-muted hover:text-fg"}`}
        onClick={() => setOpen(false)}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 items-center justify-between px-4 md:px-6 max-w-6xl">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={LOGO_URL}
            alt="URPAK.KG"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-base font-semibold">URPAK.KG</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/" label="Главная" />
          <NavLink href="/projects" label="Новостройки" />
          <NavLink href="/developers" label="Застройщики" />
          <NavLink href="/contacts" label="Контакты" />
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
            onClick={() => setOpen((v) => !v)}
            aria-label="Меню"
          >
            {open ? <HiX size={20} /> : <HiMenu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border bg-card">
          <div className="px-4 md:px-6 py-3 max-w-6xl mx-auto">
            <ul className="flex flex-col gap-3">
              <li><NavLink href="/" label="Главная" /></li>
              <li><NavLink href="/projects" label="Новостройки" /></li>
              <li><NavLink href="/developers" label="Застройщики" /></li>
              <li><NavLink href="/contacts" label="Контакты" /></li>
            </ul>
          </div>
        </nav>
      )}
    </header>
  );
}
