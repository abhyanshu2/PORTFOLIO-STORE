# Portfolio: naya Lanyard 3D ID card + photo logo

## Kya hoga

1. Uploaded project (portfolio + store) is project me import hoga — abhi yahan sirf blank template hai.
2. Purana ID card feature (jo theek kaam nahi kar raha) poori tarah hatega.
3. Uski jagah ReactBits ka **Lanyard** component lagega — hero section me right side, waise hi jaise aapki image me red mark hai (title/description ke bagal, right column).
4. Aapki passport photo teen jagah use hogi: browser tab icon, nav bar me "Abhyanshu." ke bagal chhota round logo, aur ID card ke face par.
5. ID card ke neeche **ABHYANSHU** naam dikhega.

## Details

**Purana card hatana**
- `BandCard.tsx` aur `HangingIdCard.tsx` delete.
- `Portfolio.tsx` se `id-card-wrap-new` block, lazy import aur "HIDE CARD / SHOW CARD" button hataya jayega.
- `styles.css` se purane `id-card-*` styles aur `idCardDropNew` animation hatengi.

**Naya Lanyard**
- `src/components/portfolio/Lanyard/` me `Lanyard.tsx` + `Lanyard.css` (`.lanyard-wrapper` styles diye gaye code ke mutabik).
- ReactBits repo se original `card.glb` aur `lanyard.png` download karke `src/assets/lanyard/` me rakhe jayenge.
- Card face par aapki photo `frontImage` prop se lagegi, `imageFit="cover"`.
- Usage: `<Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />`.
- Hero ke right column me render hoga, hero ki height ke hisaab se wrapper ko fit kiya jayega (100vh ki jagah container-fit) taaki layout na toote.
- Card ke neeche centered "ABHYANSHU" caption.

**Photo/logo**
- Passport photo square crop hoke: `public/favicon.png` (tab icon, `__root.tsx` ke links me set), nav logo ke liye chhota round avatar, aur card face texture.

**Technical**
- Dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, `meshline`, `@types/three`.
- `vite.config.ts` me `assetsInclude: ['**/*.glb']`.
- `src/global.d.ts` me `.glb`/`.png`/`meshline` module declarations + `meshLineGeometry`/`meshLineMaterial` JSX types.
- WebGL SSR-safe: Lanyard sirf client par lazy load hoga (`React.lazy` + mount gate), warna SSR crash hota hai.
- Baaki portfolio/store code, routes aur meta tags waise hi rahenge.
