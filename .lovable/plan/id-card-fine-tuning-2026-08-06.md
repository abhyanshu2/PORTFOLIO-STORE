# ID card fine-tuning

## Kya change hoga

1. **ID card aur upar shift** — `.id-card-wrap-new` ka `top:20px` se aur kam (negative ya near-zero) kiya jayega taaki card navbar ke bilkul neeche se shuru ho.
2. **Lanyard strip patla** — `<Lanyard lanyardWidth={1.6} />` ko ~`0.9` ya `1.0` kiya jayega.
3. **Card ke neeche "ABHYANSHU" text hatao** — `.id-card-name` div remove kiya jayega.
4. **Card ka size thoda badao** — `.id-card-wrap-new` ki width/height badhayi jayegi (e.g. `460px x 820px`) taaki 3D card bhi proportionally bada dikhe.

## Technical

- `src/components/portfolio/Portfolio.tsx`: `lanyardWidth` kam karna aur `.id-card-name` div remove karna.
- `src/styles.css`: `.id-card-wrap-new` ki `top`, `width`, `height` adjust karna.
