import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gray-800 text-white py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center px-6">
        <h1 className="text-2xl font-bold">URPAK.KG</h1>
        <nav>
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
      </div>
    </header>
  );
}
