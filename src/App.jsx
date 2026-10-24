import { Suspense, useMemo, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Environment, Stars } from "@react-three/drei";
import {
  Box3,
  MeshStandardMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import katanaModelUrl from "./assets/katana/katana.obj?url";
import katanaBaseColorUrl from "./assets/katana/katana_Material.001_BaseColor.png";
import katanaHeightUrl from "./assets/katana/katana_Material.001_Height.png";
import katanaMetallicUrl from "./assets/katana/katana_Material.001_Metallic.png";
import katanaNormalUrl from "./assets/katana/katana_Material.001_Normal.png";
import katanaRoughnessUrl from "./assets/katana/katana_Material.001_Roughness.png";
import "./App.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const katanaTextureUrls = [
  katanaBaseColorUrl,
  katanaHeightUrl,
  katanaMetallicUrl,
  katanaNormalUrl,
  katanaRoughnessUrl,
];

const startRotation = [0.45, 0.9, 0.7];
const startPosition = [1.3, -0.35, -0.6];

function Katana({ pageRef }) {
  const katanaRef = useRef(null);
  const introTimelineRef = useRef(null);

  const obj = useLoader(OBJLoader, katanaModelUrl);

  const [baseColor, heightMap, metallicMap, normalMap, roughnessMap] =
    useLoader(TextureLoader, katanaTextureUrls);

  const model = useMemo(() => {
    // Clone the OBJ so we can safely adjust it.
    const clone = obj.clone(true);

    const bounds = new Box3().setFromObject(clone);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    // Give the sword a consistent display size.
    const scale = maxDimension > 0 ? 5.5 / maxDimension : 1;

    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    clone.traverse((child) => {
      if (!child.isMesh) return;

      if (baseColor) {
        baseColor.colorSpace = SRGBColorSpace;
      }

      child.material = new MeshStandardMaterial({
        map: baseColor,
        metalness: 1.2,
        roughness: 0.45,
        metalnessMap: metallicMap,
        roughnessMap,
        normalMap,
        bumpMap: heightMap,
        bumpScale: 0.018,
      });

      child.castShadow = true;
      child.receiveShadow = true;
    });

    return clone;
  }, [obj, baseColor, heightMap, metallicMap, normalMap, roughnessMap]);

  // The timeline is created only after the katana has loaded.
  useGSAP(
    () => {
      const sword = katanaRef.current;

      if (!sword || !pageRef.current) return;

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      introTimelineRef.current = intro;

      intro
        .fromTo(
          sword.position,
          {
            x: 4.5,
            y: 1.5,
            z: -5,
            opacity: 0,
          },
          {
            x: startPosition[0],
            y: startPosition[1],
            z: startPosition[2],
            opacity: 1,
            duration: 1.2,
          },
          0,
        )
        .fromTo(
          sword.rotation,
          {
            x: -1.2,
            y: 0.4,
            z: 1.2,
          },
          {
            x: startRotation[0],
            y: startRotation[1],
            z: startRotation[2],
            duration: 1.2,
          },
          0,
        )
        .fromTo(
          sword.scale,
          { x: 0.2, y: 0.2, z: 0.2 },
          { x: 1, y: 1, z: 1, duration: 1.2 },
          0,
        );

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: pageRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Stage 1: turn the blade toward the viewer.
      timeline
        .to(
          sword.rotation,
          {
            y: Math.PI * 0.7,
            z: -0.2,
            duration: 1,
          },
          0,
        )

        // Stage 2: move the sword forward and enlarge it.
        .to(
          sword.position,
          {
            x: 1.1,
            y: 0.2,
            z: 1.2,
            duration: 1,
          },
          1,
        )
        .to(
          sword.scale,
          {
            x: 1.45,
            y: 1.45,
            z: 1.45,
            duration: 1,
          },
          1,
        )

        // Stage 3: rotate into a dramatic final pose.
        .to(
          sword.rotation,
          {
            x: 0.25,
            y: Math.PI * 1.5,
            z: 0.55,
            duration: 1,
          },
          2,
        )
        .to(
          sword.position,
          {
            x: 0,
            y: -0.15,
            z: 0,
            duration: 1,
          },
          2,
        );
    },
    { scope: pageRef, dependencies: [model] },
  );

  return (
    <group ref={katanaRef} position={startPosition} rotation={startRotation}>
      <primitive object={model} />
    </group>
  );
}

function Scene({ pageRef }) {
  return (
    <>
      <color attach="background" args={["#05060b"]} />

      <ambientLight intensity={0.8} />

      <directionalLight position={[-4, 5, 5]} intensity={3} color="#dbeaff" />

      <pointLight position={[-3, 0, 2]} intensity={35} color="#348cff" />

      <pointLight position={[3, 2, -2]} intensity={25} color="#8e54ff" />

      <Stars radius={55} depth={35} count={1200} factor={2} fade speed={0.25} />

      <Suspense fallback={null}>
        <Katana pageRef={pageRef} />
        <Environment preset="studio" />
      </Suspense>
    </>
  );
}

export default function App() {
  const pageRef = useRef(null);

  return (
    <main ref={pageRef} className="katana-page">
      <div className="katana-canvas">
        <Canvas
          camera={{ position: [0, 0, 7], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
        >
          <Scene pageRef={pageRef} />
        </Canvas>
      </div>

      <nav className="katana-nav">
        <a href="#hero">KATANA / 001</a>
        <span>THE ART OF THE BLADE</span>
      </nav>

      <section id="hero" className="katana-section">
        <div className="katana-copy">
          <p className="eyebrow">PRECISION. BALANCE. LEGACY.</p>
          <h1>
            FORGED
            <br />
            IN <span>SILENCE.</span>
          </h1>
          <p>
            An exploration of form, craftsmanship, and the timeless geometry of
            the katana.
          </p>
        </div>
        <span className="scroll-label">↓ &nbsp; SCROLL TO EXPLORE</span>
      </section>

      <section className="katana-section katana-middle">
        <div className="katana-copy">
          <p className="eyebrow">01 — THE FORM</p>
          <h2>EVERY ANGLE TELLS A STORY.</h2>
          <p>Follow the blade as it turns through light, shadow, and space.</p>
        </div>
      </section>

      <section className="katana-section katana-end">
        <div className="katana-copy">
          <p className="eyebrow">02 — THE DETAIL</p>
          <h2>CRAFTED TO BE REMEMBERED.</h2>
          <p>One model. Endless perspectives.</p>
          <a className="katana-button" href="#hero">
            BACK TO THE BEGINNING ↑
          </a>
        </div>
      </section>
    </main>
  );
}
