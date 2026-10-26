# ⚔️ Cinematic 3D — Katana Showcase

> A scroll-driven, cinematic 3D product showcase built with React, Three.js, and GSAP. A fully textured katana sword model floats in a moody, particle-filled environment and responds to scroll with smooth, choreographed animations.

---

## 📸 Overview

This is a **single-page cinematic landing experience** that presents a 3D katana sword model in a premium, editorial-style layout. As the user scrolls, the sword moves, rotates, and scales through three choreographed stages — creating an immersive storytelling experience entirely in the browser.

### Key Features

| Feature | Description |
|---|---|
| **3D Model Rendering** | Loads a `.obj` katana model with PBR textures (base color, metallic, roughness, normal, height maps) using Three.js |
| **Scroll-Driven Animation** | GSAP `ScrollTrigger` scrubs through a multi-stage timeline — the sword transitions between three poses as the user scrolls |
| **Intro Animation** | On page load, the sword flies in from off-screen with rotation and scale easing (`power3.out`) |
| **Ash Particles** | 500 floating particles drift organically using sine/cosine wave functions, creating a cinematic atmosphere |
| **Cinematic Lighting** | Combines ambient, directional, and colored point lights (blue + warm gold) with an HDR studio environment |
| **Editorial Typography** | Three scroll-snap sections with eyebrow text, large serif headings, and muted body copy |
| **Responsive Design** | CSS clamp-based typography and breakpoint adjustments for mobile |

---

## 🏗️ Tech Stack

| Technology | Role |
|---|---|
| [React 19](https://react.dev) | UI framework |
| [Vite 8](https://vitejs.dev) | Build tool & dev server |
| [Three.js](https://threejs.org) (`r186`) | 3D rendering engine |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | React renderer for Three.js |
| [@react-three/drei](https://github.com/pmndrs/drei) | Helper components (Environment) |
| [GSAP 3](https://gsap.com) + ScrollTrigger | Scroll-driven & intro animations |
| [@gsap/react](https://gsap.com/docs/v3/GSAP/gsap.utils/useGSAP/) | React hook for GSAP lifecycle |

---

## 📂 Project Structure

```
cinematic-3d/
├── public/
│   ├── Objs/              # Alternative OBJ model + textures
│   │   ├── katana.obj
│   │   └── texture/
│   ├── bg01.jpg            # Background image for the page
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   └── katana/         # Primary katana model + PBR textures
│   │       ├── katana.obj
│   │       ├── katana_Material.001_BaseColor.png
│   │       ├── katana_Material.001_Height.png
│   │       ├── katana_Material.001_Metallic.png
│   │       ├── katana_Material.001_Normal.png
│   │       └── katana_Material.001_Roughness.png
│   ├── App.jsx             # Main component (3D scene + HTML sections)
│   ├── App.css             # All styling (nav, sections, typography)
│   ├── index.css           # Base/reset styles
│   └── main.jsx            # React entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## 🧩 Architecture

### Component Breakdown

```
App (root)
├── Canvas (react-three-fiber)
│   └── Scene
│       ├── Lights (ambient + directional + 2 point lights)
│       ├── AshParticles (500 drifting points)
│       ├── Katana (OBJ model + PBR material + GSAP timelines)
│       └── Environment (HDR studio preset)
├── Nav (top bar)
├── Hero Section ("Forged in Silence")
├── Middle Section ("Every Angle Tells a Story")
└── End Section ("Crafted to Be Remembered")
```

### Animation Stages (Scroll-Driven)

| Stage | Scroll Position | Sword Behavior |
|---|---|---|
| **Intro** | Page load | Flies in from far away (`z: -100`) with rotation + scale up |
| **Stage 1** | 0% – 33% | Rests on the left side, subtle rotation |
| **Stage 2** | 33% – 66% | Sweeps across to the right, rotates ~225°, scales up to 1.1x |
| **Stage 3** | 66% – 100% | Settles in a final detail pose on the right side |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd cinematic-3d

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview   # Preview the production build
```

---

## 🎨 Customization

### Swap the 3D Model

1. Replace the `.obj` file and texture PNGs in `src/assets/katana/`
2. Update the import paths at the top of `App.jsx`
3. Adjust the `scale` factor in the `useMemo` block (currently `5.5 / maxDimension`)
4. Tune `startPosition`, `detailPosition`, and all rotation values in the GSAP timeline

### Adjust Lighting

In the `Scene` component, modify:
- `ambientLight intensity` — overall brightness
- `directionalLight` — main shadow-casting light
- `pointLight` colors — `#348cff` (blue rim) and `#95730d` (warm gold fill)

### Particle Count

Change the `count` variable inside `AshParticles` (default: `500`).

---

## 🤖 ChatGPT Prompt — Better Animation for the 3D Object

Copy and paste the following prompt into ChatGPT to get tailored, production-ready animation improvements:

---

> **Prompt:**
>
> I have a cinematic 3D product showcase website built with **React**, **@react-three/fiber** (Three.js), and **GSAP ScrollTrigger**. The site displays a single 3D katana sword model (`.obj` format with PBR textures: base color, metallic, roughness, normal, and height maps) inside a `<Canvas>` element.
>
> **Current Setup:**
> - The page is `300vh` tall with three `100vh` scroll sections (Hero, Detail 1, Detail 2).
> - The 3D canvas is `position: fixed` so the sword stays on screen while HTML content scrolls over it.
> - On page load, the sword flies in from off-screen using a GSAP `fromTo` tween (position from `z: -100`, rotation easing, scale from `0.2` to `1`).
> - A GSAP `ScrollTrigger`-scrubbed timeline moves the sword through 3 stages as the user scrolls: it rotates, repositions, and slightly scales up.
> - There are 500 floating ash particles (buffer geometry points) that drift using sine/cosine waves in `useFrame`.
> - Lighting: ambient light, one directional light, one blue point light, one warm gold point light, and an HDR studio environment from `@react-three/drei`.
>
> **What I need from you:**
> Give me **specific, code-ready GSAP animation improvements** for the sword and particles. For each suggestion, provide:
> 1. The exact GSAP `.to()` / `.fromTo()` call or `useFrame` logic
> 2. Where it fits in the existing timeline (stage number or separate timeline)
> 3. What visual effect it creates
>
> **Ideas I'm open to (but feel free to suggest others):**
> - More dramatic intro (blade unsheathing, spark flash, screen shake)
> - Per-stage lighting color shifts (animate point light colors/intensity via GSAP)
> - Sword "breathing" idle animation (subtle hover/rotation while no scroll)
> - Particle reactions (particles scatter away from the blade, accelerate on fast scroll)
> - Camera movement (animate camera position/fov alongside sword movement)
> - Material animation (animate metalness, roughness, emissive glow over scroll)
> - Text-synchronized reveals (fade in/parallax HTML sections synced to sword pose)
> - Slow-motion rotation freeze-frame at certain scroll points
>
> Please write the code using:
> - `gsap` and `ScrollTrigger` for scroll-driven animations
> - `useFrame` from `@react-three/fiber` for per-frame effects
> - `useGSAP` from `@gsap/react` for lifecycle management
> - `useRef` to reference Three.js objects
>
> Keep the existing animation structure intact and layer improvements on top.

---

## 📄 License

This project is proprietary to **Meptics**. All rights reserved.
