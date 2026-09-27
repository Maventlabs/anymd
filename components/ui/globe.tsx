"use client";
import { useEffect, useRef, useState } from "react";
import { Color, Scene, Fog, PerspectiveCamera, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "@/data/globe.json";

declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: ThreeElements["mesh"] & {
      new (): ThreeGlobe;
    };
  }
}

extend({ ThreeGlobe: ThreeGlobe });

const RING_PROPAGATION_SPEED = 3;
const aspect = 1.2;
const cameraZ = 300;

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

export function Globe({ globeConfig, data }: WorldProps) {
  const globeRef = useRef<ThreeGlobe | null>(null);
  const groupRef = useRef<never>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const defaultProps = {
    pointSize: 1,
    atmosphereColor: "#FAFAFA",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
    globeColor: "#1d072e",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  useEffect(() => {
    if (!globeRef.current && groupRef.current) {
      globeRef.current = new ThreeGlobe();
      (groupRef.current as unknown as { add: (globe: ThreeGlobe) => void }).add(
        globeRef.current
      );
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!globeRef.current || !isInitialized) return;

    const globeMaterial = globeRef.current.globeMaterial() as unknown as {
      color: Color;
      emissive: Color;
      emissiveIntensity: number;
      shininess: number;
    };
    globeMaterial.color = new Color(globeConfig.globeColor);
    globeMaterial.emissive = new Color(globeConfig.emissive);
    globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
    globeMaterial.shininess = globeConfig.shininess || 0.9;
  }, [
    isInitialized,
    globeConfig.globeColor,
    globeConfig.emissive,
    globeConfig.emissiveIntensity,
    globeConfig.shininess,
  ]);

  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data) return;

    const arcs = data;
    const points: Array<{
      size: number;
      order: number;
      color: string;
      lat: number;
      lng: number;
    }> = [];
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.startLat,
        lng: arc.startLng,
      });
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.endLat,
        lng: arc.endLng,
      });
    }

    const filteredPoints = points.filter(
      (v, i, a) =>
        a.findIndex((v2) =>
          (["lat", "lng"] as const).every((k) => v2[k] === v[k])
        ) === i
    );

    const features = (countries as { features: object[] }).features;

    globeRef.current
      .hexPolygonsData(features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .showAtmosphere(defaultProps.showAtmosphere)
      .atmosphereColor(defaultProps.atmosphereColor)
      .atmosphereAltitude(defaultProps.atmosphereAltitude)
      .hexPolygonColor((data: object, index = 0) =>
        LAND_FILLS[(index as number) % LAND_FILLS.length]
      );

    globeRef.current
      .arcsData(data)
      .arcStartLat((d) => (d as unknown as { startLat: number }).startLat * 1)
      .arcStartLng((d) => (d as unknown as { startLng: number }).startLng * 1)
      .arcEndLat((d) => (d as unknown as { endLat: number }).endLat * 1)
      .arcEndLng((d) => (d as unknown as { endLng: number }).endLng * 1)
      .arcColor((e: object) => (e as unknown as { color: string }).color)
      .arcAltitude((e) => (e as unknown as { arcAlt: number }).arcAlt * 1)
      .arcStroke(() => [0.32, 0.28, 0.3][Math.round(Math.random() * 2)])
      .arcDashLength(defaultProps.arcLength)
      .arcDashInitialGap((e) => (e as unknown as { order: number }).order * 1)
      .arcDashGap(15)
      .arcDashAnimateTime(() => defaultProps.arcTime);

    globeRef.current
      .pointsData(filteredPoints)
      .pointColor((e) => (e as unknown as { color: string }).color)
      .pointsMerge(true)
      .pointAltitude(0.0)
      .pointRadius(2);

    globeRef.current
      .ringsData([])
      .ringColor(() => defaultProps.polygonColor)
      .ringMaxRadius(defaultProps.maxRings)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod(
        (defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings
      );
  }, [
    isInitialized,
    data,
    defaultProps.pointSize,
    defaultProps.showAtmosphere,
    defaultProps.atmosphereColor,
    defaultProps.atmosphereAltitude,
    defaultProps.polygonColor,
    defaultProps.arcLength,
    defaultProps.arcTime,
    defaultProps.rings,
    defaultProps.maxRings,
  ]);

  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data) return;

    const interval = setInterval(() => {
      if (!globeRef.current) return;

      const newNumbersOfRings = genRandomNumbers(
        0,
        data.length,
        Math.floor((data.length * 4) / 5)
      );

      const ringsData = data
        .filter((d, i) => newNumbersOfRings.includes(i))
        .map((d) => ({
          lat: d.startLat,
          lng: d.startLng,
          color: d.color,
        }));

      globeRef.current.ringsData(ringsData);
    }, 1300);

    return () => {
      clearInterval(interval);
    };
  }, [isInitialized, data]);

  return <group ref={groupRef} />;
}

export function WebGLRendererConfig() {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(size.width, size.height);
    gl.setClearColor(0xffaaff, 0);
  }, [gl, size]);

  return null;
}

export function World(props: WorldProps) {
  const { globeConfig } = props;
  const scene = new Scene();
  scene.fog = new Fog(0xffffff, 400, 2000);
  return (
    <Canvas scene={scene} camera={new PerspectiveCamera(50, aspect, 180, 1800)}>
      <WebGLRendererConfig />
      <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
      <directionalLight
        color={globeConfig.directionalLeftLight}
        position={new Vector3(-400, 100, 400)}
      />
      <directionalLight
        color={globeConfig.directionalTopLight}
        position={new Vector3(-200, 500, 200)}
      />
      <pointLight
        color={globeConfig.pointLight}
        position={new Vector3(-200, 500, 200)}
        intensity={0.8}
      />
      <Globe {...props} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minDistance={cameraZ}
        maxDistance={cameraZ}
        autoRotateSpeed={1}
        autoRotate={true}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />
    </Canvas>
  );
}

export function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
  const arr: number[] = [];
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (arr.indexOf(r) === -1) arr.push(r);
  }

  return arr;
}

const PEN = "#C2402A";
const NAVY = "#0a1730";
const SLATE = "#5b7bb4";
const ROYAL = "#2f6df5";
const AMBER = "#e8a13c";

const ARC_COLORS = [PEN, ROYAL, NAVY, AMBER, SLATE, PEN, ROYAL, NAVY];

/* Soft regional fills so the light globe stays colorful, never flat gray. */
const LAND_FILLS = ["#9db8e8", "#f2b8a4", "#a9d6bc", "#f6e3a1", "#c6b5ec", "#93cbd9"];

const agentArcs: Position[] = [
  { order: 1, startLat: 37.77, startLng: -122.41, endLat: 40.71, endLng: -74.0, arcAlt: 0.28, color: ARC_COLORS[0] },
  { order: 2, startLat: 40.71, startLng: -74.0, endLat: 51.5, endLng: -0.12, arcAlt: 0.32, color: ARC_COLORS[1] },
  { order: 3, startLat: 51.5, startLng: -0.12, endLat: 52.52, endLng: 13.4, arcAlt: 0.2, color: ARC_COLORS[2] },
  { order: 4, startLat: 52.52, startLng: 13.4, endLat: 1.35, endLng: 103.82, arcAlt: 0.42, color: ARC_COLORS[3] },
  { order: 5, startLat: 1.35, startLng: 103.82, endLat: 35.68, endLng: 139.69, arcAlt: 0.3, color: ARC_COLORS[4] },
  { order: 6, startLat: 35.68, startLng: 139.69, endLat: -6.2, endLng: 106.84, arcAlt: 0.34, color: ARC_COLORS[5] },
  { order: 7, startLat: -6.2, startLng: 106.84, endLat: -33.87, endLng: 151.21, arcAlt: 0.3, color: ARC_COLORS[6] },
  { order: 8, startLat: -33.87, startLng: 151.21, endLat: 37.77, endLng: -122.41, arcAlt: 0.44, color: ARC_COLORS[7] },
];

export const agentGlobeConfig: GlobeConfig = {
  pointSize: 1.4,
  globeColor: "#c9d8f2",
  atmosphereColor: "#8fb4f5",
  atmosphereAltitude: 0.16,
  polygonColor: "rgba(10,23,48,0.9)",
  emissive: "#FAFAFA",
  emissiveIntensity: 0.35,
  shininess: 0.7,
  ambientLight: "#7c8fb0",
  directionalLeftLight: "#FAFAFA",
  directionalTopLight: "#FAFAFA",
  pointLight: "#C2402A",
  arcTime: 1800,
  arcLength: 0.85,
  rings: 2,
  maxRings: 6,
};

export function AgentGlobe() {
  return (
    <div className="size-full min-h-[320px]">
      <World globeConfig={agentGlobeConfig} data={agentArcs} />
    </div>
  );
}

export default World;
