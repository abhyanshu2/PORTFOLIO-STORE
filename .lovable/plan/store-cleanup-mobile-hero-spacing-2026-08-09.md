# Store cleanup + mobile hero spacing

## 1. Store: featured rails hatao
Trending, Best Sellers, New Arrivals aur Premium Collection ke chaar rails poori tarah remove. Sirf "All Templates" catalog (category filter + search ke saath) rahega. Cards par lage badges (TRENDING/NEW/etc.) waise hi rahenge.

## 2. My Products: sirf 8 boxes
15 products me se pehle 8 rakhe jayenge: NOTIQ, Habit Tracker, Expense Tracker, AI Assistant, URL Shortener, Chat App, Resume Builder, Portfolio Builder. Baaki 7 (Weather App, Music Player, QR Generator, Attendance System, Blogging Platform, E-Commerce Dashboard, Task Manager) hata denge.

## 3. Free Resources: 3 items hatao
Interview Questions, Cheat Sheets aur Resume Templates remove. Bacha: HTML Notes, CSS Notes, JavaScript Notes, React Notes.

## 4. Mobile hero spacing
Mobile (<=768px aur <=480px) par hero content nav ke neeche kaafi neeche baith raha hai — content upar shift hoga: hero ka top padding/min-height kam, hero number/title/desc ke beech ke gaps thode tight, taaki title fold me upar dikhe aur CTA buttons bina zyada scroll ke dikh jayein. Desktop layout unchanged.

## Technical
- `src/components/store/StoreOverlay.tsx`: `rails` useMemo aur uska render block delete.
- `src/data/store/myProducts.ts`: last 7 entries remove.
- `src/data/store/resources.ts`: 3 entries remove.
- `src/styles.css`: `@media(max-width:768px)` aur `(max-width:480px)` me `.hero` padding/min-height, `.hero-number`, `.hero-title`, `.hero-desc`, `.hero-ctas` ke margins tune; verify Playwright screenshot 394px width par.
