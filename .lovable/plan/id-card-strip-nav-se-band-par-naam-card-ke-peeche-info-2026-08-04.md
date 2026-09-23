# ID card: strip nav se, band par naam, card ke peeche info

## Kya change hoga

1. **Strip upar se shuru hoga** — abhi card wrapper hero me `top:150px` par hai, isliye lanyard bahut neeche latakta hai. Wrapper ko nav ke bilkul neeche/peeche se start karaya jayega (top ~0, nav ke back se aata hua strip), height badhakar card wahi comfortable jagah par jhoolega jahan abhi hai. Nav ke upar strip na aaye isliye z-index nav se neeche rakha jayega.

2. **Nav ka photo logo hatega** — "Abhyanshu." ke bagal wala round avatar `<img>` remove, sirf text logo rahega. (Browser tab favicon photo wala rahega.)

3. **Card ke peeche (back face)** — mera naam aur kuch important info:
   - ABHYANSHU RAJ
   - Frontend Developer
   - React · Next.js · TypeScript
   - Vaishali, Bihar, India
   - contact/handle line
   Ye ek back-face image ke roop me banegi aur `backImage` prop se card ke doosre face par lagegi. Front par photo pehle jaisi rahegi.

4. **Strip (band) par ABHYANSHU** — band texture ko replace karke ek repeating "ABHYANSHU" wali strip banayi jayegi, jitni baar fit ho sake utni baar repeat, dono taraf padhne layak. Band ki width thodi badhayi jayegi taaki text saaf dikhe.

## Technical

- `src/components/portfolio/Portfolio.tsx`: nav logo `<img>` remove; `<Lanyard>` ko `backImage` aur `lanyardImage` props diye jayenge (naya band texture), `lanyardWidth` ~1.2.
- `src/styles.css`: `.id-card-wrap-new` ki `top`/`height`/`z-index` adjust; `.nav-logo-img` styles hata di jayengi. Mobile par card abhi ki tarah hidden rahega.
- Naye assets `public/lanyard/` me: `band-name.png` (repeating ABHYANSHU strip) aur `card-back.png` (naam + info). Dono program se generate honge, sRGB, card ke UV half ke aspect ke hisaab se.
- `Lanyard.tsx` ka logic waise ka waisa — sirf props se images pass hongi.
