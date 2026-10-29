import { Suspense, useEffect, useMemo, useRef } from "react";
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

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// One timeline unit per section: each pose is reached as its section fills
// the viewport. The strike (section 04) is choreographed inline below.
const scrollPoses = [
  // 00 — hero
  {
    position: startPosition,
    rotation: [0.35, Math.PI * 0.72, -0.45],
    scale: 1,
  },
  // 01 — the form
  {
    position: detailPosition,
    rotation: [0.5, Math.PI * 1.25, 0.6],
    scale: 1.1,
  },
  // 02 — anatomy: stand the blade upright beside the parts list
  {
    position: [2.4, 0.1, 0],
    rotation: [0.15, Math.PI * 1.5, 1.35],
    scale: 1.05,
  },
  // 03 — the forge: a full spin through the fire light
  {
    position: [-2.1, -0.1, 0.4],
    rotation: [0.6, Math.PI * 3.5, 0.2],
    scale: 1,
  },
  // 05 — specifications: lay the blade across the top of the frame
  {
    position: [0.2, 1.7, -1.2],
    rotation: [0.1, Math.PI * 4, -0.05],
    scale: 1.15,
  },
  // 06 — the detail
  {
    position: [detailPosition[0] + 4, -0.1, 0.25],
    rotation: [0.5, Math.PI * 4.55, 0.1],
    scale: 1,
  },
];

function poseTo(timeline, target, pose, at, duration = 1, ease = "none") {
  timeline
    .to(
      target.position,
      {
        x: pose.position[0],
        y: pose.position[1],
        z: pose.position[2],
        duration,
        ease,
      },
      at,
    )
    .to(
      target.rotation,
      {
        x: pose.rotation[0],
        y: pose.rotation[1],
        z: pose.rotation[2],
        duration,
        ease,
      },
      at,
    )
    .to(
      target.scale,
      { x: pose.scale, y: pose.scale, z: pose.scale, duration, ease },
      at,
    );
}

function Katana({ pageRef, strikeRef }) {
  // scrollRef follows the page, motionRef carries the intro and strike
  // animations, idleRef adds the breathing float and mouse parallax.
  const scrollRef = useRef(null);
  const motionRef = useRef(null);
  const idleRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

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

  useEffect(() => {
    const handleMove = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  useFrame((state, delta) => {
    const idle = idleRef.current;
    if (!idle || prefersReducedMotion) return;

    const time = state.clock.elapsedTime;
    const ease = 1 - Math.exp(-delta * 3);

    idle.position.y = Math.sin(time * 1.1) * 0.08;
    idle.rotation.x +=
      (pointer.current.y * 0.12 + Math.sin(time * 0.6) * 0.03 - idle.rotation.x) *
      ease;
    idle.rotation.y +=
      (pointer.current.x * 0.25 - idle.rotation.y) * ease;
    idle.rotation.z = Math.cos(time * 0.8) * 0.03;
  });

  // The timelines are created only after the katana has loaded.
  useGSAP(
    () => {
      const sword = scrollRef.current;
      const motion = motionRef.current;

      if (!sword || !motion || !pageRef.current) return;

      gsap
        .timeline({ defaults: { ease: "power3.out", duration: 1.4 } })
        .from(motion.position, { x: 40, y: 10.5, z: -100 }, 0)
        .from(motion.rotation, { x: -1.6, y: -0.5, z: 0.5 }, 0)
        .from(motion.scale, { x: 0.2, y: 0.2, z: 0.2 }, 0);

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: pageRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Sections 00–03: hero → form → anatomy → forge.
      poseTo(timeline, sword, scrollPoses[0], 0, 0.4);
      poseTo(timeline, sword, scrollPoses[1], 0.4, 0.6);
      poseTo(timeline, sword, scrollPoses[2], 1);
      poseTo(timeline, sword, scrollPoses[3], 2, 1, "power1.inOut");

      // Section 04: the strike — wind up high, then cut down diagonally.
      timeline
        .to(
          sword.position,
          { x: 2.6, y: 1.9, z: 0.2, duration: 0.55, ease: "power2.out" },
          3,
        )
        .to(
          sword.rotation,
          { x: 0.2, y: Math.PI * 3.5, z: 1.4, duration: 0.55, ease: "power2.out" },
          3,
        )
        .to(
          sword.position,
          { x: -0.6, y: -1.4, z: 0.6, duration: 0.45, ease: "power4.in" },
          3.55,
        )
        .to(
          sword.rotation,
          { x: 0.4, y: Math.PI * 3.6, z: -1.3, duration: 0.45, ease: "power4.in" },
          3.55,
        );

      // Sections 05–06: specifications → final detail.
      poseTo(timeline, sword, scrollPoses[4], 4);
      poseTo(timeline, sword, scrollPoses[5], 5);

      strikeRef.current = () => {
        if (prefersReducedMotion) return;

        gsap
          .timeline({ defaults: { overwrite: "auto" } })
          .to(motion.rotation, {
            x: -0.35,
            z: 0.7,
            duration: 0.28,
            ease: "power2.out",
          })
          .to(
            motion.position,
            { x: 0.4, y: 0.5, duration: 0.28, ease: "power2.out" },
            0,
          )
          .to(motion.rotation, {
            x: 0.4,
            z: -1.5,
            duration: 0.16,
            ease: "power4.in",
          })
          .to(
            motion.position,
            { x: -0.5, y: -0.4, duration: 0.16, ease: "power4.in" },
            "<",
          )
          .to(motion.rotation, {
            x: 0,
            z: 0,
            duration: 1.1,
            ease: "elastic.out(1, 0.5)",
          })
          .to(
            motion.position,
            { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.5)" },
            "<",
          );
      };

      return () => {
        strikeRef.current = null;
      };
    },
    { scope: pageRef, dependencies: [model] },
  );

  return (
    <group ref={scrollRef} position={startPosition} rotation={startRotation}>
      <group ref={motionRef}>
        <group ref={idleRef}>
          <primitive object={model} />
        </group>
      </group>
    </group>
  );
}

function ForgeLight() {
  const lightRef = useRef(null);

  // Glow the blade with fire light while the forge section is on screen.
  useGSAP(() => {
    if (!lightRef.current) return;

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#forge",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      })
      .to(lightRef.current, { intensity: 70, duration: 1, ease: "power1.in" })
      .to(lightRef.current, { intensity: 0, duration: 1, ease: "power1.out" });
  });

  useFrame((state) => {
    if (!lightRef.current || lightRef.current.intensity === 0) return;
    // A little flicker, like embers.
    const t = state.clock.elapsedTime;
    lightRef.current.position.y = -1.5 + Math.sin(t * 9) * 0.15;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[-2, -1.5, 2.5]}
      intensity={0}
      distance={12}
      color="#ff6a1f"
    />
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

function Scene({ pageRef, strikeRef }) {
  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight position={[-4, 5, 5]} intensity={3} color="#dbeaff" />

      <pointLight position={[-3, 0, 2]} intensity={35} color="#348cff" />

      <pointLight position={[3, 2, -2]} intensity={25} color="#95730d" />

      <ForgeLight />

      <AshParticles />

      <Suspense fallback={null}>
        <Katana pageRef={pageRef} strikeRef={strikeRef} />
        <Environment preset="studio" />
      </Suspense>
    </>
  );
}

const anatomy = [
  ["KISSAKI", "The tip", "A curved point shaped to pierce and open the cut."],
  ["HAMON", "The temper line", "The wave of hardened steel left by clay and quench."],
  ["TSUBA", "The guard", "Balances the blade and protects the hand."],
  ["TSUKA", "The handle", "Ray skin and silk wrap for a grip that never slips."],
];

const forgeSteps = [
  ["01", "SMELT", "Iron sand and charcoal become tamahagane over three days."],
  ["02", "FOLD", "The steel is hammered and folded until it holds thousands of layers."],
  ["03", "QUENCH", "Clay-coated, heated, and plunged into water in a single breath."],
  ["04", "POLISH", "Weeks of stones reveal the grain and the hamon."],
];

const specs = [
  ["BLADE LENGTH", "71.2", "cm"],
  ["CURVATURE", "1.8", "cm sori"],
  ["WEIGHT", "1.12", "kg"],
  ["LAYERS", "32,768", "folds"],
];

const sectionCount = 7;

export default function App() {
  const pageRef = useRef(null);
  const strikeRef = useRef(null);
  const slashRef = useRef(null);
  const counterRef = useRef(null);

  const playSlash = () => {
    const slash = slashRef.current;
    if (!slash || prefersReducedMotion) return;

    gsap
      .timeline()
      .set(slash, { autoAlpha: 1 })
      .fromTo(
        slash.querySelector(".slash-line"),
        { scaleX: 0, rotation: -24, transformOrigin: "100% 50%" },
        { scaleX: 1, rotation: -24, duration: 0.22, ease: "power4.in" },
      )
      .fromTo(
        slash.querySelector(".slash-flash"),
        { opacity: 0.35 },
        { opacity: 0, duration: 0.6, ease: "power2.out" },
        ">-0.05",
      )
      .to(slash, { autoAlpha: 0, duration: 0.4 }, "<0.15");
  };

  const strike = () => {
    strikeRef.current?.();
    gsap.delayedCall(0.28, playSlash);
  };

  useGSAP(
    () => {
      // Hero copy on load.
      gsap.from("#hero .katana-copy > *, .katana-nav, .scroll-label", {
        y: 40,
        autoAlpha: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.4,
      });

      // Reveal every other section's copy as it scrolls into view.
      gsap.utils.toArray(".katana-section:not(#hero)").forEach((section) => {
        gsap.from(section.querySelectorAll(".reveal"), {
          y: 50,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // The scrolled cut lands as the strike section settles.
      ScrollTrigger.create({
        trigger: "#strike",
        start: "top 20%",
        onEnter: playSlash,
      });

      gsap.to(".progress-fill", {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: pageRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            if (!counterRef.current) return;
            const index = Math.min(
              sectionCount,
              Math.round(self.progress * (sectionCount - 1)) + 1,
            );
            counterRef.current.textContent = String(index).padStart(2, "0");
          },
        },
      });
    },
    { scope: pageRef },
  );

  return (
    <main ref={pageRef} className="katana-page">
      <div className="katana-canvas">
        <Canvas
          camera={{ position: [0, 0, 7], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene pageRef={pageRef} strikeRef={strikeRef} />
        </Canvas>
      </div>

      <div ref={slashRef} className="slash" aria-hidden="true">
        <span className="slash-flash" />
        <span className="slash-line" />
      </div>

      <nav className="katana-nav">
        <a href="#hero">KATANA / 001</a>
        <div className="katana-links">
          <a href="#anatomy">ANATOMY</a>
          <a href="#forge">FORGE</a>
          <a href="#strike">STRIKE</a>
          <a href="#specs">SPECS</a>
        </div>
        <span className="nav-tagline">THE ART OF THE BLADE</span>
      </nav>

      <div className="progress" aria-hidden="true">
        <span ref={counterRef}>01</span>
        <div className="progress-track">
          <div className="progress-fill" />
        </div>
        <span>{String(sectionCount).padStart(2, "0")}</span>
      </div>

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

      <section id="form" className="katana-section katana-right">
        <div className="katana-copy">
          <p className="eyebrow reveal">01 — THE FORM</p>
          <h2 className="reveal">EVERY ANGLE TELLS A STORY.</h2>
          <p className="reveal">
            Follow the blade as it turns through light, shadow, and space.
          </p>
        </div>
      </section>

      <section id="anatomy" className="katana-section">
        <div className="katana-copy">
          <p className="eyebrow reveal">02 — THE ANATOMY</p>
          <h2 className="reveal">FOUR PARTS. ONE SOUL.</h2>
          <ul className="anatomy-list">
            {anatomy.map(([name, label, text]) => (
              <li key={name} className="reveal">
                <span className="anatomy-name">{name}</span>
                <div>
                  <strong>{label}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="forge" className="katana-section katana-right">
        <div className="katana-copy">
          <p className="eyebrow reveal">03 — THE FORGE</p>
          <h2 className="reveal">BORN OF FIRE AND WATER.</h2>
          <ol className="forge-steps">
            {forgeSteps.map(([index, title, text]) => (
              <li key={index} className="reveal">
                <span>{index}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="strike" className="katana-section">
        <div className="katana-copy">
          <p className="eyebrow reveal">04 — THE STRIKE</p>
          <h2 className="reveal">
            ONE BREATH.
            <br />
            ONE CUT.
          </h2>
          <p className="reveal">
            Iaijutsu teaches that the draw and the cut are a single motion.
            Nothing wasted, nothing hesitant.
          </p>
          <button
            type="button"
            className="katana-button reveal"
            onClick={strike}
          >
            DRAW THE BLADE ⟶
          </button>
        </div>
      </section>

      <section id="specs" className="katana-section katana-specs">
        <div className="katana-copy">
          <p className="eyebrow reveal">05 — SPECIFICATIONS</p>
          <h2 className="reveal">MEASURED IN MILLIMETRES.</h2>
          <dl className="spec-grid">
            {specs.map(([label, value, unit]) => (
              <div key={label} className="reveal">
                <dt>{label}</dt>
                <dd>
                  {value}
                  <small>{unit}</small>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="detail" className="katana-section katana-end">
        <div className="katana-copy">
          <p className="eyebrow reveal">06 — THE DETAIL</p>
          <h2 className="reveal">CRAFTED TO BE REMEMBERED.</h2>
          <p className="reveal">One model. Endless perspectives.</p>
          <a className="katana-button reveal" href="#hero">
            BACK TO THE BEGINNING ↑
          </a>
        </div>
      </section>
    </main>
  );
}
