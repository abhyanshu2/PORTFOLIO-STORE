# Book page photo upload fix + Splash cursor effect

## 1. Book (flip-book) me photo upload button kaam nahi karta — asli wajah

Live page par check kiya: `/templates/birthday-scrapbook/book` par 15 "add photo" buttons DOM me hain aur visible bhi hain, lekin **ek bhi clickable nahi** — har button ke center par `elementFromPoint` kisi doosre page ka element (H2 / paper-page div) return karta hai.

Kyun: har "leaf" ke andar do face hote hain (front + back, `backface-visibility: hidden`), aur saare leaves ek doosre ke upar absolutely stacked hain. Chrome in chhipe hue faces ko bhi hit-test karta hai, isliye upload button hamesha kisi invisible page ke neeche dab jata hai. Click kabhi button tak pahunchta hi nahi — isi liye photo picker khulta hi nahi.

Fix (sirf presentation layer):
- Har leaf ke front/back face par `pointer-events` sirf tab enable ho jab wo face actually saamne ho (front: leaf turned nahi; back: leaf turned hai), warna `pointer-events: none`.
- Jo leaves current spread ka hissa nahi hain (turned ho chuke ya abhi aage hain) unhe poora `pointer-events: none`.
- Mobile view me bhi wahi: sirf upar wali (current) page interactive rahegi, neeche wali preview page inert.
- Verify: Playwright se dobara `elementFromPoint` check + ek actual click karke file-input trigger confirm karna, desktop aur mobile dono par.

## 2. Splash cursor (fluid) effect

- Naya component `src/components/portfolio/SplashCursor.tsx` — aapka diya hua WebGL fluid code, TypeScript me typed aur SSR-safe (canvas/GL sirf `useEffect` ke andar, cleanup par animation loop + event listeners remove, taaki route change par leak na ho).
- Mount: portfolio home route par ek hi baar (`src/routes/index.tsx`), jisse portfolio aur store overlay dono par effect chale (store usi page ka overlay hai).
- Settings aapke snippet ke hisab se: `DENSITY_DISSIPATION 3.5`, `VELOCITY_DISSIPATION 2`, `PRESSURE 0.1`, `CURL 3`, `SPLAT_RADIUS 0.2`, `SPLAT_FORCE 6000`, `COLOR_UPDATE_SPEED 10`, `SHADING`, `RAINBOW_MODE false`, `COLOR "#ed7520"` (portfolio ka orange accent).
- Layering: canvas `position: fixed`, `pointer-events: none`, aur z-index aisa jo store modal/nav ke *neeche* rahe — taaki buttons aur modals par visual clutter na aaye lekin pura screen cover ho.
- Safety: agar browser me WebGL na ho to component chup-chaap kuch render nahi karega; mobile/touch par bhi kaam karega (touch handlers included).

## Technical notes

- Koi nayi dependency nahi (pure WebGL + React).
- Original snippet me `getWebGLContext` use-before-declare aur missing cleanup hai; usko sudhaar ke React 19 strict-mode-safe banaya jayega (double-mount par do canvas loops na chale).
- Book fix `src/routes/templates.birthday-scrapbook.book.tsx` tak simit hai; `PhotoFrame.tsx` ka `data-no-turn` logic waisa hi rahega.
- Verification: `bun run build` + Playwright par book page click test aur home page par canvas mount check.
