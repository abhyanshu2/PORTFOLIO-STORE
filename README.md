# Portfolio Card Creator

pahla changes hai ke isma hum yeak id card ka featurse add kiya tha jo proper work nahi kr raha tumko usko remove kar do or hum new id card ka code tumko deta hai usko mera portfolio ma add karo exect position kaha pa add karna hai uska liya hum yeak image denga jaha red mark kiya hua hai image ka left side (import Lanyard from './Lanyard' <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} /> // Pass custom images for the card's front/back faces and/or the lanyard band. // frontImage and backImage render independently; imageFit keeps aspect ratio. // lanyardWidth widens the band so a custom band image has more room. <Lanyard position={[0,0,25]} gravity={[0,-40,0]} frontImage="/my-front.png" backImage="/my-back.png" imageFit="cover" lanyardImage="/my-band.png" lanyardWidth={1} /> /* IMPORTANT INFO BELOW

You MUST have the card.glb and lanyard.png files in your project and import them

these can be downloaded from the repo's files, under src/assets/lanyard

You can edit your card.glb file in this online .glb editor and change the texture:

https://modelviewer.dev/editor/

alternatively, pass the "frontImage" / "backImage" props to swap the card's faces at runtime

The png file is the texture for the lanyard's band and can be edited in any image editor

Your Vite configuration must be updated to include the following in vite.config.js: assetsInclude: ['**/*.glb']

For TS users, you might need these changes:

src/global.d.ts export { }; declare module '.glb'; declare module '.png'; declare module 'meshline' { export const MeshLineGeometry: any; export const MeshLineMaterial: any; } declare global { namespace JSX { interface IntrinsicElements { meshLineGeometry: any; meshLineMaterial: any; } } }

src/vite-env.d.ts /// <reference types="vite/client" /> declare module '.glb'; declare module '.png'; */

.lanyard-wrapper { position: relative; z-index: 0; width: 100%; height: 100vh; display: flex; justify-content: center; align-items: center; transform: scale(1); transform-origin: center; }

)

yea raha code ab 2 nd change hai ke jo image hum denga portfolio ka usma upar website ka name ka bagal ma logo hota hai oaha image hona chaiya mera hum apna image v deta hai usko id card pa v add kar dena yeak side ma or id card ka nicha mera name v hona chaiya ABHYANSHU

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1669602d-b407-470b-8b00-19561d9013e6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
