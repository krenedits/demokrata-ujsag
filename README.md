# Demokrata Újság Archívum

Ez a projekt a **Demokrata Újság** (1989-1998) digitális archívumát tartalmazza. Az alkalmazás lehetővé teszi az újság oldalainak böngészését évek és lapszámok szerint, valamint keresést biztosít a cikkek címei és szerzői alapján.

## 🚀 Technológiai Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Routing:** React Router 7
- **Állapotkezelés:** URL alapú (deep linking támogatással)
- **Styling:** Vanilla CSS
- **Biztonság:** DOMPurify az XSS védelem érdekében

## 📂 Projekt Struktúra

- `src/components/ImageGallery`: A fő galéria komponens és alalkatrészei.
- `src/hooks`: Egyedi hook-ok (pl. smooth scroll).
- `public/images`: Az újság képei évfolyamok szerint csoportosítva.
- `src/fileList.json`: Automatikusan generált metaadat állomány.

## 🛠️ Fejlesztői Scriptek

### Adatok generálása

A projekt két scriptet használ az adatstruktúra felépítéséhez:

1. **`jsonCreatorScript.js`**: Beolvassa a `public/images` mappát és legenerálja az alap `fileList.json`-t.
   ```bash
   node jsonCreatorScript.js
   ```

2. **`createArticles.js`**: Beolvassa a `Demokrata.csv` fájlt és összefűzi a cikkadatokat a `fileList.json`-nal.
   ```bash
   node createArticles.js
   ```

### Futtatás

```bash
# Függőségek telepítése
yarn install

# Fejlesztői szerver indítása
yarn dev

# Production build készítése
yarn build
```

## ✨ Főbb Funkciók

- **Évválasztó:** Gyors navigáció az évfolyamok között.
- **Szűrés:** Keresés szerzőre vagy cikk címére.
- **Nagyítás:** Képek megtekintése teljes méretben, billentyűzet navigációval (nyilak).
- **Megosztható linkek:** Az aktuális nézet és a kiválasztott kép az URL-ben tárolódik.

## 📜 Történet

1989 októberétől a versegyházi MDF kiadásában indult a Demokrata Újság, amelyet 1998-as megszűnéséig Horváth Lajos és Krenedits Sándor vezetett. Ez az oldal ennek a fontos helytörténeti és országos jelentőségű lapnak állít emléket.

---
Készítette: Krenedits Sándor & AI asszisztens
