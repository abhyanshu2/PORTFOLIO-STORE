# Birthday Scrapbook template ko store me add karna

Aapka uploaded template (editable birthday photo-collage scrapbook, 2 pages) portfolio project ke andar live demo ke roop me chalega, store me "Golden Glow" ki jagah lega, preview modal me asli screenshots dikhenge, aur Buy Now seedha WhatsApp par jayega.

## 1. Template code project me lana

- Zip se sirf app files li jayengi (`.git` / `.workspace` / lockfiles / ui components jo pehle se hain — skip).
- Nayi jagah:
  - `src/components/templates/birthday-scrapbook/` → `Chrome.tsx`, `EditableText.tsx`, `PhotoFrame.tsx`
  - `src/lib/scrapbook-store.ts` (localStorage-based editing state)
- Template ke andar ke imports naye paths par update honge.

## 2. Live demo routes

- `src/routes/templates.birthday-scrapbook.tsx` → collage page (zip ka `index.tsx`)
- `src/routes/templates.birthday-scrapbook.book.tsx` → book page (zip ka `book.tsx`)
- Dono routes par apna `head()` metadata (title/description/og) — portfolio ke home page se alag.
- Template ka andar ka nav (`SiteNav`) in nayi paths par point karega.

## 3. Styling isolation

- Scrapbook ka theme block (fonts `--font-script/display/caption/note`, maroon tokens, `maroon-bg`, `grain`, `tag-red`, `paper-page` utilities) `src/styles.css` ke end me append hoga — portfolio ke existing tokens chhue bina.
- Google Fonts (Pinyon Script, Italiana, Jost, Lora) `src/routes/__root.tsx` ke links array me add honge.
- Portfolio ka global reset scrapbook pages par side-effect na kare, iske liye demo pages ko ek wrapper class me rakh ke check kiya jayega.

## 4. Screenshots

- Live demo chalne ke baad Playwright se 3 asli screenshots liye jayenge (collage desktop, collage mobile, book page).
- Ye images Lovable CDN par upload hongi (`src/assets/*.asset.json`) — repo me binary nahi rahega.

## 5. Store integration

- `Template` type me do optional fields: `images?: string[]` (asli screenshot URLs) aur `demoUrl?: string`.
- `Golden Glow` entry replace hogi: naam "Birthday Scrapbook — Photo Collage", real description, features (apni photos upload, har caption editable, 2 pages, mobile+desktop, browser me save), price wahi rakha jaye ya aap batayein (default ₹199), badge `trending`.
- `StoreOverlay` preview modal: agar `images` hain to monogram placeholder ki jagah asli image gallery + clickable thumbnails render honge; warna purana monogram fallback.
- Card aur modal me "Live Demo ↗" button jo `/templates/birthday-scrapbook` naye tab me khole.
- "Buy Now via WhatsApp" pehle se `buildWhatsAppUrl(name)` use karta hai — product name naye naam ke saath WhatsApp (+91 6206358342) par pre-filled message ke saath jayega; verify karke rakha jayega.

## Technical notes

- Naye dependencies ki zarurat nahi (template sirf React + Tailwind + TanStack Router use karta hai).
- `src/routeTree.gen.ts` khud generate hoga — manually edit nahi hoga.
- Verification: `bun run build` pass, demo routes Playwright se load-check, aur WhatsApp link URL check.
