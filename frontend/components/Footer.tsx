export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card text-center sm:text-left">
      <div className="container mx-auto max-w-6xl px-4 py-12 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Логотип / Описание */}
        <div className="flex flex-col items-center sm:items-start">
          <div className="text-xl font-semibold mb-2">URPAK.KG</div>
          <p className="text-sm text-muted leading-relaxed max-w-xs">
            Новостройки и проверенные застройщики Кыргызстана — всё в одном месте.
          </p>
        </div>

        {/* Разделы */}
        <div>
          <div className="text-sm font-semibold mb-3">Разделы</div>
          <ul className="space-y-2 text-sm text-muted">
            <li><a href="/" className="hover:text-foreground transition">Главная</a></li>
            <li><a href="/projects" className="hover:text-foreground transition">Новостройки</a></li>
            <li><a href="/developers" className="hover:text-foreground transition">Застройщики</a></li>
            <li><a href="/contacts" className="hover:text-foreground transition">Контакты</a></li>
          </ul>
        </div>

        {/* Контакты */}
        <div>
          <div className="text-sm font-semibold mb-3">Контакты</div>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <a href="mailto:info@urpak.kg" className="hover:text-foreground transition">
                info@urpak.kg
              </a>
            </li>
            <li>
              <a href="tel:+996221611099" className="hover:text-foreground transition">
                +996 221 611 099
              </a>
            </li>
            <li>Бишкек, Кыргызстан</li>
          </ul>
        </div>

        {/* Соцсети */}
        <div>
          <div className="text-sm font-semibold mb-3">Мы в соцсетях</div>
          <div className="flex justify-center sm:justify-start gap-3">
            <a
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:bg-accent hover:text-foreground transition"
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:bg-accent hover:text-foreground transition"
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram
            </a>
          </div>
        </div>
      </div>

      {/* Нижняя часть */}
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} <span className="font-medium text-foreground">URPAK.KG</span>. Все права защищены.
      </div>
    </footer>
  );
}
