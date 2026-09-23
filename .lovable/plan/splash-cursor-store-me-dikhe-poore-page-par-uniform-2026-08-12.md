# Splash cursor: store me dikhe + poore page par uniform

## Problem (verified)

`.splash-cursor-layer` par `z-index: 1` set hai (src/styles.css:1097). Lekin:

- Har `section` bhi `position:relative; z-index:1` hai (styles.css:385) aur unka apna background hai — isliye hero ke baad wale sections (About/"Who I am" se neeche) canvas ko dhak lete hain. Effect sirf wahin dikhta hai jahan page ka plain background hai, isi wajah se "who am i" section ke neeche ajeeb lagta hai.
- Store overlay `z-index: 200/201` par full-screen opaque hai (styles.css:779-787), isliye store kholte hi splash effect poora chhup jata hai.

## Fix (sirf presentation layer)

- `.splash-cursor-layer` ko content ke upar le jana: `z-index: 8990` — yaani nav (100), store overlay (200/201), aur template modals (300) ke upar, par theme-wipe (8999) aur loader (99999) ke neeche.
- `pointer-events: none` waise hi rahega, to nav/buttons/store sab normal click hote rahenge.
- Blend: `mix-blend-mode: screen` rakhenge (dark backgrounds par sirf rangeen splash dikhta hai, content readable rehta hai). Light theme me screen blend fade ho jata hai, isliye light theme ke liye `mix-blend-mode: multiply`-jaisa alternative `[data-theme="light"] .splash-cursor-layer` par set karenge taki dono themes me effect dikhe.
- Canvas ek hi baar `src/routes/index.tsx` par mount hai (portfolio + store dono usi page par hain), so koi extra mount ki zaroorat nahi.

## Verify

- Playwright: home page par mouse move karke canvas ke upar splash render hone ka screenshot, About section ke upar bhi.
- Store overlay khol ke wahi check — effect visible ho aur store ke buttons click hote rahen.
