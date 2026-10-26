import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
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
const startPosition = [2.8, -0.2, -0.6];
const detailPosition = [-1.5, 1, -0.3];

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
        roughness: 0.2,
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
            x: 43.2,
            y: 10.5,
            z: -100,
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

      // Stage 1: start on the left for the opening section.
      timeline
        .to(
          sword.rotation,
          {
            x: 0.35,
            y: Math.PI * 0.72,
            z: -0.45,
            duration: 1,
          },
          0,
        )
        .to(
          sword.position,
          {
            x: startPosition[0],
            y: startPosition[1],
            z: startPosition[2],
            duration: 0.7,
          },
          0,
        )

        // Stage 2: move across the scene as the detail section begins.
        .to(
          sword.rotation,
          {
            x: 0.5,
            y: Math.PI * 1.25,
            z: 0.6,
            duration: 1,
          },
          1,
        )
        .to(
          sword.position,
          {
            x: detailPosition[0],
            y: detailPosition[1],
            z: detailPosition[2],
            duration: 1,
          },
          1,
        )
        .to(
          sword.scale,
          {
            x: 1.1,
            y: 1.1,
            z: 1.1,
            duration: 1,
          },
          1,
        )

        // Stage 3: settle on the right for the final detail pose.
        .to(
          sword.rotation,
          {
            x: 0.5,
            y: Math.PI * 1.55,
            z: 0.1,
            duration: 1,
          },
          2,
        )
        .to(
          sword.position,
          {
            x: detailPosition[0] + 4,
            y: -0.1,
            z: 0.25,
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

function AshParticles() {
  const pointsRef = useRef(null);

  const { positions, basePositions } = useMemo(() => {
    const count = 500;
    const positionsArray = new Float32Array(count * 3);
    const baseArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const radius = 8 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.9;
      const z = radius * Math.sin(phi) * Math.sin(theta);

      positionsArray[i3] = x;
      positionsArray[i3 + 1] = y;
      positionsArray[i3 + 2] = z;

      baseArray[i3] = x;
      baseArray[i3 + 1] = y;
      baseArray[i3 + 2] = z;
    }

    return { positions: positionsArray, basePositions: baseArray };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const { array } = pointsRef.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < array.length; i += 3) {
      const driftX = Math.sin(time * 0.9 + i * 0.18) * 0.12;
      const driftY = Math.cos(time * 0.7 + i * 0.14) * 0.12;
      const driftZ = Math.sin(time * 1.1 + i * 0.11) * 0.12;

      array[i] = basePositions[i] + driftX;
      array[i + 1] = basePositions[i + 1] + driftY;
      array[i + 2] = basePositions[i + 2] + driftZ;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += 0.012;
    pointsRef.current.rotation.x = Math.sin(time * 0.25) * 0.15;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#f7f7f5"
        size={0.08}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}

function Scene({ pageRef }) {
  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight position={[-4, 5, 5]} intensity={3} color="#dbeaff" />

      <pointLight position={[-3, 0, 2]} intensity={35} color="#348cff" />

      <pointLight position={[3, 2, -2]} intensity={25} color="#95730d" />

      <AshParticles />

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
          gl={{ antialias: true, alpha: true }}
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
