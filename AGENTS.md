# Leitfaden für Coding-Agenten

## Projektüberblick

Dieses Repository enthält die deutsch-türkische Website der **ATIB Jugend Vorarlberg**. Es handelt sich um eine einseitige, responsive Next.js-Anwendung mit Veranstaltungen, Vorstand, Kontaktmöglichkeiten und einer interaktiven 3D-Karte der ATIB-Moscheen in Vorarlberg.

Die Anwendung besitzt weder eine eigene Datenbank noch API-Routen, Authentifizierung oder ein CMS. Inhalte und Moscheedaten liegen direkt im TypeScript-Quelltext. Die Seite wird beim Build statisch vorgerendert; Sprache, Theme, Navigation, Formular und Karte laufen anschließend im Browser.

Die Projekt- und Codekommentare sind überwiegend auf Deutsch. Neue erklärende Kommentare sollten daher ebenfalls auf Deutsch verfasst werden. Sichtbare Inhalte müssen grundsätzlich in Deutsch und Türkisch gepflegt werden.

## Technologie-Stack und zentrale Konfiguration

- **Next.js 16 mit App Router** und **React 19** als Anwendungs- und Rendering-Grundlage.
- **TypeScript 6** mit `strict: true`, `noEmit: true` und Bundler-Modulauflösung.
- **Three.js** für die interaktive 3D-Reliefkarte; die Module werden erst im Browser dynamisch importiert.
- **lucide-react** für Icons und **next/image** für Bilder.
- **next/font/google** stellt Inter und Geist als CSS-Variablen bereit.
- Ein einziges globales Stylesheet enthält Design-Tokens, Komponentenstyles, Dark-Theme und responsive Regeln. Es gibt kein CSS-Framework und kein CSS-Modulsystem.
- **ESLint 9** mit `eslint-config-next/core-web-vitals` und `eslint-config-next/typescript`.

Wichtige Dateien:

| Datei | Aufgabe |
| --- | --- |
| `package.json` | npm-Skripte und direkte Abhängigkeiten |
| `package-lock.json` | Lockfile Version 3; für reproduzierbare Installationen mit npm verwenden |
| `next.config.ts` | Next.js-Konfiguration; AVIF und WebP sind als Bildformate aktiviert |
| `tsconfig.json` | Strikte TypeScript-Regeln und Alias `@/*` für den Projektroot |
| `eslint.config.mjs` | Next.js-/TypeScript-Lintregeln sowie Ignorierregeln für Build-Artefakte |
| `.gitignore` | Ignoriert unter anderem `node_modules/`, `.next/`, `.tools/`, `out/` und `next-env.d.ts` |

Es ist keine Node.js-Version über `engines`, `.nvmrc` oder eine vergleichbare Datei festgelegt. Es gibt außerdem keinen Formatter wie Prettier und kein separates Formatierungsskript.

## Installation, Entwicklung und Prüfung

Im Projektroot ausführen:

```bash
npm ci                 # Abhängigkeiten anhand des Lockfiles installieren
npm run dev            # Next.js-Entwicklungsserver starten
npm run lint           # ESLint über das Repository laufen lassen
npx tsc --noEmit       # Zusätzlicher, eigenständiger Typecheck
npm run build          # Optimierten Produktions-Build erstellen
npm run start          # Produktions-Build mit dem Next.js-Server ausliefern
```

`npm run build` führt ebenfalls TypeScript-Prüfungen aus. Der separate Typecheck ist hilfreich, wenn ohne vollständigen Build gearbeitet wird. Der Build erzeugt `.next/`; dieses Verzeichnis nicht bearbeiten oder versionieren.

Aktuell sind `/` und die interne Not-found-Seite statisch vorgerendert. Daraus folgt nicht, dass das Projekt als reiner Datei-Export konfiguriert ist: `next.config.ts` enthält kein `output: "export"`, und der dokumentierte Produktionsmodus ist `next start`.

## Codeorganisation

### `app/`

- `app/layout.tsx`: Root Layout, deutsche Standard-Metadaten, Inter-/Geist-Schriften und globaler `SiteSettingsProvider`. Das Dokument startet mit `lang="de"` und `data-theme="light"`.
- `app/page.tsx`: Die gesamte Startseite als Client Component. Sie setzt Moscheeübersicht, Hero, Vorwort, Aktivitäten, Vernetzung, Team, Kontakt und Footer aus den gemeinsamen Komponenten und Inhaltsobjekten zusammen.
- `app/globals.css`: Sämtliche Styles. Die wichtigsten responsiven Breakpoints sind 1180, 900 und 640 Pixel. Farben und Themes werden über CSS Custom Properties gesteuert.

Es gibt derzeit keine weiteren App-Routen, Layouts, Server Actions oder Route Handler.

### `components/`

- `SiteSettings.tsx`: Context und Hook für Sprache (`de`/`tr`) und Theme (`light`/`dark`). Die Auswahl wird unter `atib-language` beziehungsweise `atib-theme` in `localStorage` gespeichert. Nach dem Laden werden `<html lang>` und `data-theme` aktualisiert.
- `Header.tsx`: Desktop- und Mobilnavigation, Sprachwahl und Theme-Schalter. Die mobile Navigation verwaltet auch den Scroll-Lock des `<body>`.
- `MosqueOverview.tsx`: Größte Fachkomponente. Sie enthält die Three.js-Szene, Relief- und Markerdarstellung, Kamera- und Zoomsteuerung, Touch-/Maus-/Tastaturinteraktion, Popup, Theme-Anpassung sowie die Bezirksliste als zugängliche Alternative zur Karte.
- `ContactForm.tsx`: Validiert die Pflichtfelder über native Formularattribute und erzeugt eine `mailto:`-URL an `vlbg.jugend@atib.at`.
- `Reveal.tsx`: Einmalige Einblendanimation über `IntersectionObserver`.

Alle interaktiven Komponenten tragen `"use client"`. Browser-APIs müssen in Client Components und gegebenenfalls in Effekten beziehungsweise Event-Handlern bleiben, damit das statische Vorrendern weiter funktioniert.

### `lib/`

- `translations.ts`: Vollständige deutsche und türkische UI-Texte, Navigationslabels, Alternativtexte, Formulartexte und Moschee-Hilfstexte.
- `content.ts`: Deutsch-türkische Aktivitäten- und Teamdaten. Bilder liegen unter `/images/...` und verweisen damit auf `public/images/`.
- `lib/mosques.ts`: Typen, Bezirksschlüssel, Kartengröße und die 13 Moscheedatensätze. `x`/`y` sind keine geografischen Koordinaten, sondern Positionen im 640 × 984,7 großen Koordinatensystem der Reliefdaten. Foto, Öffnungszeiten und Telefon sind optionale Felder.

### `public/` und Projektroot

- `public/images/`: Lokal ausgelieferte Logo-, Team-, Veranstaltungs- und Galeriebilder.
- `public/data/vorarlberg-relief.json`: Base64-kodierte Höhen-, Masken- und optionalen Grenzdaten. `MosqueOverview.tsx` lädt diese Datei per `fetch("/data/vorarlberg-relief.json")` und erzeugt daraus das Gelände.
- Die beiden PDF-Dateien zur Saison 2026 liegen im Projektroot und werden von der Anwendung nicht importiert. Sie befinden sich nicht in `public/` und sind daher nicht automatisch Website-Assets.
- `.tools/` enthält lokale Werkzeuge, ist ignoriert und gehört nicht zur Anwendung oder ihrem Build.

## Wichtige Verhaltensweisen und Datenflüsse

### Sprache und Theme

`SiteSettingsProvider` umgibt die gesamte Anwendung. Komponenten lesen Sprache und Theme über `useSiteSettings()` und wählen Texte mit `translations[language]`. Es gibt keine sprachspezifischen URLs und keine serverseitige Locale-Erkennung. Gespeicherte Einstellungen werden erst nach dem Mount im Browser übernommen.

Bei neuen Texten beide Sprachzweige synchron erweitern und auf dieselbe Datenstruktur achten. Auch `activities` und `team` in `lib/content.ts` besitzen getrennte deutsche und türkische Arrays. Fest eingebaute Zahlen oder Texte, etwa die Anzahl von 13 Moscheen in `translations.ts`, müssen bei Datenänderungen mitaktualisiert werden.

Für neue Theme-Farben die CSS-Variablen in `:root` und `:root[data-theme="dark"]` gemeinsam pflegen. Die Three.js-Karte liest ihre `--mosque-*`-Variablen nach einem Theme-Wechsel erneut aus; dort keine unabhängigen, nur für ein Theme passenden Farben einführen.

### 3D-Moscheekarte

Three.js und `OrbitControls` werden innerhalb eines Effekts dynamisch geladen. Die Karte benötigt WebGL und die Reliefdatei. Bei Lade- oder WebGL-Fehlern erscheint ein lokalisierter Hinweis; die vollständige Moscheeliste darunter bleibt unabhängig davon verfügbar und muss erhalten bleiben.

Beim Hinzufügen oder Verschieben einer Moschee müssen `lib/mosques.ts`, die Kartenkoordinaten und die sichtbaren Zahlen beziehungsweise Hilfstexte zusammenpassen. Adressen und optionale Kontaktdaten nur aus bestätigten Quellen übernehmen. Die Quellenangaben und bestehenden Hinweise zur Datenlage nicht unbeachtet entfernen.

Änderungen an der Szene müssen die bestehende Ressourcenfreigabe beachten: Animationen, Observer und Events werden beim Cleanup beendet; Geometrien, Materialien, Texturen und Renderer werden freigegeben. Die Karte berücksichtigt `prefers-reduced-motion`, pausiert außerhalb des sichtbaren Bereichs und begrenzt das Pixel Ratio.

### Kontaktformular und externe Dienste

Das Kontaktformular sendet keine Daten an einen Server. Es öffnet lediglich das lokale E-Mail-Programm mit vorbereitetem Betreff und Text; der Benutzer muss die Nachricht dort selbst absenden. Entsprechende Status- und Datenschutztexte nicht so ändern, dass sie eine serverseitige Übertragung behaupten.

Routenlinks öffnen Google Maps in einem neuen Tab. Instagram und TikTok sind ebenfalls externe Links. Die bestehenden `rel="noreferrer"`-Angaben bei solchen Links beibehalten. Die Anwendung benötigt für diese Funktionen keine API-Schlüssel.

## Code- und Änderungskonventionen

- Funktionale React-Komponenten und Hooks verwenden; wiederverwendbare Komponenten werden als benannte Exporte angelegt. App-Routen verwenden die von Next.js erwarteten Default-Exports.
- Importe aus dem Projektroot mit `@/...` schreiben, passend zum vorhandenen Alias.
- Dem vorhandenen TypeScript-Stil folgen: doppelte Anführungszeichen, Semikolons, explizite Typen dort, wo sie die öffentliche Datenstruktur oder komplexe Props klarmachen. `any` und unnötige TypeScript-/ESLint-Ausnahmen vermeiden.
- Keine zusätzliche State-, CSS-, Test- oder Backend-Bibliothek voraussetzen. Neue Abhängigkeiten nur einführen, wenn die Aufgabe sie tatsächlich erfordert.
- Bilder über `next/image` einbinden. Bei `fill` den positionierten Elterncontainer und passende `sizes`-Angaben beibehalten. Neue lokale Assets in `public/` ablegen und mit `/...` referenzieren.
- Globale CSS-Regeln bewusst ändern: Viele Selektoren werden von mehreren Abschnitten verwendet, und spätere Regeln ergänzen beziehungsweise überschreiben frühere. Responsive und Dark-Theme-Auswirkungen mitprüfen.
- Lokalisierbare ARIA-Labels, Statusmeldungen und Alternativtexte in `translations.ts` pflegen. Fokusführung, Tastatursteuerung, reduzierte Bewegung und die nichtgrafische Moscheeliste nicht beschädigen.
- Anker-IDs wie `#moscheen`, `#vorwort`, `#aktivitaeten`, `#team` und `#kontakt` bleiben auch in der türkischen Ansicht gleich.

## Tests und manuelle Qualitätssicherung

Es gibt derzeit **keine automatisierten Tests**, kein Test-Framework und kein `test`-Skript. Auch CI-Konfigurationen sind nicht vorhanden. Daher sind mindestens folgende Prüfungen nach Änderungen erforderlich:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Zusätzlich im Browser die betroffenen Abläufe prüfen, insbesondere:

- Deutsch/Türkisch wechseln und die Persistenz nach einem Reload kontrollieren.
- Hell-/Dunkelmodus einschließlich der Three.js-Farben prüfen.
- Mobile Navigation, Sprach-/Theme-Schalter und Scroll-Verhalten auf schmalen Viewports prüfen.
- Kontaktformular mit Pflichtfeldern und erzeugtem `mailto:`-Entwurf prüfen; kein erfolgreicher Serverversand ist zu erwarten.
- Moscheeauswahl über Karte und Liste, Popup-Schließen, Route, Zoom, Ziehen und Tastatursteuerung prüfen.
- Touch-Gesten, `prefers-reduced-motion` und das Verhalten bei nicht verfügbarem WebGL beziehungsweise fehlender Reliefdatei berücksichtigen, wenn diese Bereiche geändert wurden.

Neue Testinfrastruktur sollte nicht als vorhanden dokumentiert oder angenommen werden. Falls sie später hinzugefügt wird, gehören Skript und Aufruf in diesen Leitfaden.

## Build, Deployment und Betrieb

Für einen klassischen Node.js-/Next.js-Betrieb lautet der vorhandene Ablauf:

```bash
npm ci
npm run build
npm run start
```

Eine Hosting-Plattform, Docker-Konfiguration, CI/CD-Pipeline oder Deployment-Dokumentation ist im Repository nicht definiert. Es gibt außerdem keine `vercel.json`, kein Static-Export-Setup und keine projektspezifischen Umgebungsvariablen. Deployment-Annahmen daher nicht erfinden; die Zielplattform muss den verwendeten Next.js-Produktionsmodus unterstützen.

`public/` wird von Next.js direkt ausgeliefert. `.next/` ist ein Build-Artefakt, während `.tools/` ausschließlich lokal ist. Für die Anwendung wurden keine Environment-Dateien oder Laufzeit-Secrets gefunden.

## Sicherheit und Datenschutz

- Keine Secrets in Quelltext, `public/` oder clientseitige Umgebungsvariablen aufnehmen. Alles im Browser verwendete ist öffentlich sichtbar.
- Formulardaten werden aktuell nicht auf der Website gespeichert oder an einen eigenen Server übertragen; sie verbleiben bis zum Öffnen des E-Mail-Programms im Browser. Dieses Verhalten bei Änderungen transparent halten.
- In `localStorage` werden nur Sprache und Theme gespeichert, keine Formulardaten oder personenbezogenen Profile.
- Team-, Adress- und Kontaktdaten sind öffentliche Website-Inhalte. Änderungen sorgfältig auf Richtigkeit und Veröffentlichbarkeit prüfen.
- Benutzerdefinierte HTML-Ausgabe oder `dangerouslySetInnerHTML` wird nicht verwendet. Neue dynamische Inhalte nicht ohne tatsächlichen Bedarf über unsichere HTML-Pfade einführen.
- Externe Karten-, Social-Media- und E-Mail-Ziele sowie die bestehenden Quellenangaben sind Teil des sichtbaren Daten- und Privacy-Verhaltens und sollten bei Änderungen mitbewertet werden.
