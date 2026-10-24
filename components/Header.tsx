"use client";

import Image from "next/image";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSiteSettings } from "@/components/SiteSettings";
import { translations } from "@/lib/translations";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, theme, setLanguage, toggleTheme } = useSiteSettings();
  const copy = translations[language];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const languageSwitch = (
    <div className="language-switch" role="group" aria-label={copy.languageLabel}>
      {(["de", "tr"] as const).map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={language === item}
          onClick={() => setLanguage(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="header-inner container">
        <a className="brand" href="#top" aria-label={copy.homeLabel} onClick={() => setOpen(false)}>
          <Image src="/images/logo.png" alt="" width={48} height={48} priority />
          <span className="brand-name">
            ATIB <span>{language === "de" ? "Jugend" : "Gençlik"}</span>
            <small>Vorarlberg</small>
          </span>
        </a>
        <nav className="desktop-nav" aria-label={copy.navigationLabel}>
          {copy.nav.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-settings">
          {languageSwitch}
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === "light" ? copy.darkMode : copy.lightMode}
            title={theme === "light" ? copy.darkMode : copy.lightMode}
            onClick={toggleTheme}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        <a className="header-cta" href="#kontakt">
          {copy.join} <ArrowUpRight size={17} strokeWidth={1.8} />
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? copy.closeMenu : copy.openMenu}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <div id="mobile-navigation" className={`mobile-menu${open ? " is-open" : ""}`} aria-hidden={!open}>
        <nav aria-label={copy.mobileNavigationLabel}>
          {copy.nav.map((link, index) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              <span>0{index + 1}</span>
              {link.label}
              <ArrowUpRight size={22} />
            </a>
          ))}
        </nav>
        <div className="mobile-menu-bottom">
          <div className="mobile-settings" aria-label={copy.settingsLabel}>
            {languageSwitch}
            <button className="mobile-theme-toggle" type="button" onClick={toggleTheme} tabIndex={open ? 0 : -1}>
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === "light" ? copy.dark : copy.light}</span>
            </button>
          </div>
          <p>{copy.statement}</p>
        </div>
      </div>
    </header>
  );
}
