# Lernen

Lern-Tracker für das Wintersemester 2026/27 – als installierbare Web-App (PWA), gehostet über GitHub Pages: https://benevhm.github.io/lernen/

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html` | Die komplette App (Oberfläche, Logik, Styles) |
| `sw.js` | Service Worker: offline nutzbar, lädt Updates automatisch |
| `manifest.webmanifest` | Name, Icon, Vollbild-Modus für den Home-Bildschirm |
| `version.json` | Aktuelle Versionsnummer – die App prüft sie und zeigt „Neue Version da“ |
| `icons/` | App-Icons (Home-Bildschirm, Android, Browser) |

## Daten

Die Aufgaben liegen **nicht** in diesem Repo, sondern in `tasks.json` im privaten Repo `benevhm/lernen-daten`. Diese Datei ist die einzige Quelle der Wahrheit:

- Ein **externer Claude-Check-in** liest und bearbeitet `tasks.json` jeden Sonntag direkt im Repo (neue Aufgaben einstellen, bestehende anpassen).
- Die App liest und schreibt dieselbe Datei über die GitHub Contents API (`GET` + `PUT` mit `sha`). Zugriff über ein Fine-grained Personal Access Token, das nur `lernen-daten` sehen darf (Contents: Read and write). Das Token wird beim ersten Start eingegeben und nur im `localStorage` des Geräts gespeichert.

```json
{ "v": 1, "updated": "2026-10-18T18:00:00Z", "tasks": [
  { "id": "cg-kw43-1", "title": "Kapitel 3 lesen", "detail": "optional", "course": "CG",
    "due": "2026-10-21", "done": false, "doneAt": null, "by": "claude", "prio": true, "week": "KW43" }
] }
```

`course`: `CG`, `BF`, `GOE`, `PC` (Februar-Prüfungen) · `STAT`, `POWI`, `ACC`, `FISK` (April-Prüfungen) · `ORGA`. `by`: `"claude"` oder `"ich"` (nur eigene Aufgaben sind in der App löschbar). Details zum Format im README von `lernen-daten`.

### Wie die App mit Änderungen von außen umgeht

- Lokal liegen nur ein Cache der zuletzt gelesenen `tasks.json` (sofortige Anzeige, auch offline) und eine Warteschlange eigener Änderungen (abhaken, hinzufügen, löschen).
- Beim Öffnen und beim Zurückkehren in die App wird neu geladen.
- Beim Schreiben wird nie die ganze Datei überschrieben: Die App lädt den aktuellen Stand, wendet ihre Änderungen einzeln (per `id`) darauf an und schickt die `sha` mit. Bei `409`/`422` lädt sie neu und versucht es erneut – Aufgaben vom Check-in gehen so nicht verloren.
- Unbekannte Felder in Aufgaben bleiben unangetastet.

## Neue Version veröffentlichen

1. Änderungen in `index.html` (bzw. den anderen Dateien) machen.
2. Versionsnummer an **zwei** Stellen erhöhen – beide müssen gleich sein:
   - `const APP_VERSION = '…'` oben im Script in `index.html`
   - `"v"` in `version.json` (dazu kurz in `"note"` beschreiben, was neu ist)
3. Committen und pushen:
   ```bash
   git add -A && git commit -m "Beschreibung" && git push
   ```
4. Nach ca. 1 Minute ist die Version auf GitHub Pages live. Die App zeigt beim nächsten Öffnen „Neue Version da → Aktualisieren“.

Wird nur `sw.js` geändert, zusätzlich `CACHE` in `sw.js` hochzählen.

## Lokal testen

Auf `localhost` lässt sich die API-Adresse per `?api=<url>` umbiegen (z. B. auf einen lokalen Proxy). Auf GitHub Pages wird das ignoriert.
