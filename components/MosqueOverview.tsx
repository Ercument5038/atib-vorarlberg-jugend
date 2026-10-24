"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpRight, MapPin, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as ThreeTypes from "three";
import { useSiteSettings } from "@/components/SiteSettings";
import { districts, MAP_SIZE, mosques, type Mosque } from "@/lib/mosques";
import { translations } from "@/lib/translations";

type Copy = (typeof translations)["de" | "tr"]["mosques"];

type Relief = {
  nx: number;
  ny: number;
  step: number;
  elev: string;
  mask: string;
  snapIdx?: string;
  snapXY?: string;
};

// Straßen in Kartenkoordinaten: c = Klasse (1 Autobahn, 2 Hauptstraße, 3 sonstige), p = x,y,x,y,…
type Roads = { roads: { c: number; p: number[] }[] };

type MapApi = {
  focus: (mosque: Mosque) => void;
  reset: () => void;
  zoom: (factor: number) => void;
  pan: (dx: number, dz: number) => void;
  recolor: () => void;
};

const W = MAP_SIZE.width;
const H = MAP_SIZE.height;
const CX = W / 2;
const CY = H / 2;
const BASE = 6; // Sockel unter dem tiefsten Tal
const VSCALE = 1.9 / 88.8; // 1 Karteneinheit ≈ 88,8 m, Höhe 1,9-fach überhöht

const decode = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function drawMosqueIcon(canvas: HTMLCanvasElement) {
  const g = canvas.getContext("2d");
  if (!g) return;
  g.clearRect(0, 0, 128, 128);
  g.fillStyle = cssVar("--mosque-halo");
  g.strokeStyle = cssVar("--mosque-edge");
  g.lineWidth = 6;
  g.beginPath();
  g.arc(64, 64, 54, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.font = "68px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("\u{1F54C}", 64, 70);
}

function MosqueMap({
  copy,
  name,
  active,
  setActive,
  selected,
  onSelect,
  focus,
}: {
  copy: Copy;
  name: (mosque: Mosque) => string;
  active: string | null;
  setActive: (id: string | null) => void;
  selected: Mosque | null;
  onSelect: (mosque: Mosque | null) => void;
  focus: { mosque: Mosque; at: number } | null;
}) {
  const { theme } = useSiteSettings();
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<MapApi | null>(null);
  const activeRef = useRef(active);
  const selectRef = useRef(onSelect);
  const setActiveRef = useRef(setActive);
  const copyRef = useRef(copy);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [hint, setHint] = useState<string | null>(null);
  const [tip, setTip] = useState<{ id: string; x: number; y: number; w: number } | null>(null);

  useEffect(() => {
    activeRef.current = active;
    selectRef.current = onSelect;
    setActiveRef.current = setActive;
    copyRef.current = copy;
  });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      let THREE: typeof ThreeTypes;
      let OrbitControls: typeof import("three/addons/controls/OrbitControls.js").OrbitControls;
      let relief: Relief;
      // Straßen sind nur Zierde: fehlen sie, bleibt die Karte ohne
      const roadsRequest: Promise<Roads | null> = fetch("/data/vorarlberg-strassen.json")
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);
      try {
        const [three, controlsModule, response] = await Promise.all([
          import("three"),
          import("three/addons/controls/OrbitControls.js"),
          fetch("/data/vorarlberg-relief.json"),
        ]);
        THREE = three;
        OrbitControls = controlsModule.OrbitControls;
        relief = await response.json();
      } catch {
        if (!disposed) setStatus("error");
        return;
      }
      if (disposed) return;

      let renderer: ThreeTypes.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setStatus("error");
        return;
      }

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const DEM_W = relief.nx;
      const DEM_H = relief.ny;
      const STEP = relief.step;
      const ELEV = new Uint16Array(decode(relief.elev).buffer);
      const MASK = decode(relief.mask);
      const maskAt = (i: number) => (MASK[i >> 3] >> (7 - (i & 7))) & 1;
      const elevToY = (e: number) => BASE + Math.max(0, e - 380) * VSCALE;
      const heightAt = (x: number, y: number) => {
        const gx = Math.min(DEM_W - 1.001, Math.max(0, x / STEP));
        const gy = Math.min(DEM_H - 1.001, Math.max(0, y / STEP));
        const c = Math.floor(gx);
        const r = Math.floor(gy);
        const fx = gx - c;
        const fy = gy - r;
        const e = (rr: number, cc: number) => ELEV[rr * DEM_W + cc];
        return elevToY(e(r, c) * (1 - fx) * (1 - fy) + e(r, c + 1) * fx * (1 - fy) + e(r + 1, c) * (1 - fx) * fy + e(r + 1, c + 1) * fx * fy);
      };
      const toWorld = (x: number, y: number) => new THREE.Vector3(x - CX, heightAt(x, y), y - CY);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      const canvas = renderer.domElement;
      canvas.setAttribute("aria-hidden", "true");
      el.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 10, 5000);
      const HOME = new THREE.Vector3(40, 1480, 560);
      const HOME_TARGET = new THREE.Vector3(0, 0, 30);
      camera.position.copy(HOME);

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 220;
      controls.maxDistance = 1650;
      controls.maxPolarAngle = Math.PI * 0.4;
      controls.target.copy(HOME_TARGET);
      // Steuerung wie bei Google Maps: Linksziehen verschiebt, Rechtsziehen dreht, Zoomen selbst gesteuert
      controls.enableZoom = false;
      controls.panSpeed = 0.6;
      controls.screenSpacePanning = false;
      controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
      controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_PAN };
      // Am Handy scrollt ein Finger weiter die Seite
      canvas.style.touchAction = "pan-y";

      const hemi = new THREE.HemisphereLight(0xffffff, 0x0b4f5a, 0.75 * Math.PI);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xffffff, 0.85 * Math.PI);
      sun.position.set(-700, 650, -250);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -600, right: 600, top: 700, bottom: -700, near: 100, far: 2500 });
      scene.add(sun);

      const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShadowMaterial({ opacity: 0.22 }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Gelände aus echten Höhendaten: Gitter, nur Dreiecke innerhalb von Vorarlberg
      const land = new THREE.Group();
      scene.add(land);
      const N = DEM_W * DEM_H;
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      for (let r = 0; r < DEM_H; r++) {
        for (let c = 0; c < DEM_W; c++) {
          const i = r * DEM_W + c;
          pos[i * 3] = c * STEP - CX;
          pos[i * 3 + 1] = elevToY(ELEV[i]);
          pos[i * 3 + 2] = r * STEP - CY;
        }
      }
      // Randpunkte auf die geglättete Landesgrenze ziehen, damit die Kante weich verläuft
      if (relief.snapIdx && relief.snapXY) {
        const si = new Uint32Array(decode(relief.snapIdx).buffer);
        const sxy = new Float32Array(decode(relief.snapXY).buffer);
        for (let j = 0; j < si.length; j++) {
          const i = si[j];
          const X = sxy[j * 2];
          const Y = sxy[j * 2 + 1];
          pos[i * 3] = X - CX;
          pos[i * 3 + 1] = heightAt(X, Y);
          pos[i * 3 + 2] = Y - CY;
        }
      }
      const index: number[] = [];
      const edges = new Map<number, { a: number; b: number; n: number }>();
      const addEdge = (a: number, b: number) => {
        const key = a < b ? a * N + b : b * N + a;
        const edge = edges.get(key);
        if (edge) edge.n++;
        else edges.set(key, { a, b, n: 1 });
      };
      const tri = (a: number, b: number, c: number) => {
        index.push(a, b, c);
        addEdge(a, b);
        addEdge(b, c);
        addEdge(c, a);
      };
      for (let r = 0; r < DEM_H - 1; r++) {
        for (let c = 0; c < DEM_W - 1; c++) {
          const m = (r * (DEM_W - 1) + c) * 2;
          const a = r * DEM_W + c;
          const b = a + 1;
          const cc = a + DEM_W;
          const d = cc + 1;
          if (maskAt(m)) tri(a, d, b);
          if (maskAt(m + 1)) tri(a, cc, d);
        }
      }
      const terrainGeometry = new THREE.BufferGeometry();
      terrainGeometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const colorAttribute = new THREE.BufferAttribute(col, 3);
      terrainGeometry.setAttribute("color", colorAttribute);
      terrainGeometry.setIndex(index);
      terrainGeometry.computeVertexNormals();
      const terrainMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });

      // Straßen als dezente Textur: helle Linien über emissiveMap, damit sie auf jeder Geländefarbe aufhellen
      const uv = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) {
        uv[i * 2] = (pos[i * 3] + CX) / W;
        uv[i * 2 + 1] = 1 - (pos[i * 3 + 2] + CY) / H;
      }
      terrainGeometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      let roadTexture: ThreeTypes.CanvasTexture | null = null;
      roadsRequest.then((data) => {
        if (disposed || !data?.roads?.length) return;
        const TEX = 3; // Pixel pro Karteneinheit
        const roadCanvas = document.createElement("canvas");
        roadCanvas.width = Math.round(W * TEX);
        roadCanvas.height = Math.round(H * TEX);
        const g = roadCanvas.getContext("2d");
        if (!g) return;
        g.fillStyle = "#000";
        g.fillRect(0, 0, roadCanvas.width, roadCanvas.height);
        g.lineJoin = "round";
        g.lineCap = "round";
        const styles: Record<number, [number, string]> = { 1: [2.4, "#fff"], 2: [1.7, "#bbb"], 3: [1.2, "#888"] };
        for (const cls of [3, 2, 1]) {
          const [width, color] = styles[cls];
          g.lineWidth = width;
          g.strokeStyle = color;
          g.beginPath();
          for (const road of data.roads) {
            if (road.c !== cls) continue;
            g.moveTo(road.p[0] * TEX, road.p[1] * TEX);
            for (let k = 2; k < road.p.length; k += 2) g.lineTo(road.p[k] * TEX, road.p[k + 1] * TEX);
          }
          g.stroke();
        }
        roadTexture = new THREE.CanvasTexture(roadCanvas);
        roadTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        terrainMaterial.emissiveMap = roadTexture;
        terrainMaterial.emissive.set(cssVar("--mosque-road"));
        terrainMaterial.needsUpdate = true;
      });
      const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
      terrain.castShadow = true;
      terrain.receiveShadow = true;
      land.add(terrain);

      // Seitenwände entlang des Randes
      const wallPositions: number[] = [];
      edges.forEach(({ a, b, n }) => {
        if (n !== 1) return;
        const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
        const bx = pos[b * 3], by = pos[b * 3 + 1], bz = pos[b * 3 + 2];
        wallPositions.push(ax, ay, az, bx, 0, bz, bx, by, bz, ax, ay, az, ax, 0, az, bx, 0, bz);
      });
      const wallGeometry = new THREE.BufferGeometry();
      wallGeometry.setAttribute("position", new THREE.Float32BufferAttribute(wallPositions, 3));
      wallGeometry.computeVertexNormals();
      const wallMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      const walls = new THREE.Mesh(wallGeometry, wallMaterial);
      walls.castShadow = true;
      land.add(walls);

      // Moscheen: Stab + Schild + Pulsring
      const iconCanvas = document.createElement("canvas");
      iconCanvas.width = iconCanvas.height = 128;
      const iconTexture = new THREE.CanvasTexture(iconCanvas);
      iconTexture.colorSpace = THREE.SRGBColorSpace;
      const poleMaterial = new THREE.MeshStandardMaterial();
      const poleGeometry = new THREE.CylinderGeometry(1.4, 1.4, 34, 8);
      const ringGeometry = new THREE.RingGeometry(9, 12, 40);
      const spriteMaterial = new THREE.SpriteMaterial({ map: iconTexture, depthTest: true });
      const markers = mosques.map((mosque, i) => {
        const group = new THREE.Group();
        const p = toWorld(mosque.x, mosque.y);
        group.position.copy(p);
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 17;
        pole.castShadow = true;
        group.add(pole);
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(34, 34, 1);
        sprite.position.y = 50;
        sprite.userData.id = mosque.id;
        group.add(sprite);
        const ring = new THREE.Mesh(
          ringGeometry,
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.6;
        group.add(ring);
        scene.add(group);
        return { mosque, i, group, sprite, ring, s: 1, y0: p.y };
      });

      // Farben aus den CSS-Variablen, damit Hell- und Dunkelmodus passen
      const recolor = () => {
        const tint = new THREE.Color();
        const stops = (
          [
            [380, cssVar("--mosque-g1")],
            [900, cssVar("--mosque-g2")],
            [1700, cssVar("--mosque-g3")],
            [2500, cssVar("--mosque-deep")],
            [2900, "#cfe9ee"],
            [3300, "#ffffff"],
          ] as const
        ).map(([e, c]) => [e, new THREE.Color(c)] as const);
        for (let i = 0; i < N; i++) {
          const e = ELEV[i];
          let k = 0;
          while (k < stops.length - 2 && e > stops[k + 1][0]) k++;
          const [e0, c0] = stops[k];
          const [e1, c1] = stops[k + 1];
          tint.copy(c0).lerp(c1, Math.min(1, Math.max(0, (e - e0) / (e1 - e0))));
          col[i * 3] = tint.r;
          col[i * 3 + 1] = tint.g;
          col[i * 3 + 2] = tint.b;
        }
        colorAttribute.needsUpdate = true;
        wallMaterial.color.set(cssVar("--mosque-deep"));
        // Ohne Straßentextur würde die Emission das ganze Gelände aufhellen
        terrainMaterial.emissive.set(roadTexture ? cssVar("--mosque-road") : "#000000");
        poleMaterial.color.set(cssVar("--mosque-edge"));
        drawMosqueIcon(iconCanvas);
        iconTexture.needsUpdate = true;
      };
      recolor();

      // Auf schmalen Bildschirmen weiter weg, damit ganz Vorarlberg hineinpasst
      let fit = 1;
      const home = () => HOME.clone().sub(HOME_TARGET).multiplyScalar(fit).add(HOME_TARGET);
      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        fit = Math.max(1, 0.95 / camera.aspect);
        controls.maxDistance = 1650 * fit;
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(el);
      resize();
      camera.position.copy(home());

      // Hover / Tippen
      const ray = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const setPointer = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(pointer, camera);
      };
      const pick = (e: PointerEvent): string | null => {
        setPointer(e.clientX, e.clientY);
        const hit = ray.intersectObjects(markers.map((m) => m.sprite))[0];
        return hit ? (hit.object.userData.id as string) : null;
      };
      let down: { x: number; y: number } | null = null;
      let grabbing = false;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || down) return;
        const id = pick(e);
        canvas.style.cursor = id ? "pointer" : "grab";
        if (id !== activeRef.current) setActiveRef.current(id);
      };
      const onDown = (e: PointerEvent) => {
        down = { x: e.clientX, y: e.clientY };
        if (e.pointerType === "mouse") {
          grabbing = true;
          canvas.style.cursor = "grabbing";
        }
      };
      const onUp = (e: PointerEvent) => {
        if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) {
          const id = pick(e);
          setActiveRef.current(id);
          const mosque = mosques.find((m) => m.id === id);
          if (mosque) selectRef.current(mosque);
        }
        down = null;
      };
      const onWindowUp = () => {
        if (!grabbing) return;
        grabbing = false;
        canvas.style.cursor = "grab";
      };
      const onLeave = () => {
        if (!down) setActiveRef.current(null);
      };

      let hintTimer: number | undefined;
      const showHint = (text: string) => {
        setHint(text);
        window.clearTimeout(hintTimer);
        hintTimer = window.setTimeout(() => setHint(null), 1400);
      };
      const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 1) showHint(copyRef.current.hintTouch);
      };

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BASE);
      const groundPoint = (clientX: number, clientY: number) => {
        setPointer(clientX, clientY);
        const hit = new THREE.Vector3();
        const terrainHit = ray.intersectObject(terrain)[0];
        if (terrainHit) hit.copy(terrainHit.point);
        else if (!ray.ray.intersectPlane(plane, hit)) hit.copy(controls.target);
        return hit;
      };
      const zoomAround = (point: ThreeTypes.Vector3, factor: number) => {
        const distance = camera.position.distanceTo(controls.target);
        const f = Math.min(controls.maxDistance / distance, Math.max(controls.minDistance / distance, factor));
        camera.position.sub(point).multiplyScalar(f).add(point);
        controls.target.sub(point).multiplyScalar(f).add(point);
      };
      // Weiches Zoomen: Wunsch sammeln, pro Bild einen Teil davon ausführen
      const zoomAnim = { pending: 0, anchor: new THREE.Vector3() };
      let fly: { t0: number; p0: ThreeTypes.Vector3; q0: ThreeTypes.Vector3; p1: ThreeTypes.Vector3; q1: ThreeTypes.Vector3 } | null = null;
      const queueZoom = (clientX: number, clientY: number, logFactor: number) => {
        fly = null;
        zoomAnim.anchor.copy(groundPoint(clientX, clientY));
        zoomAnim.pending += logFactor;
      };
      const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
      // Mausrad allein scrollt die Seite; Zoomen nur mit Strg/Cmd (Touchpad-Pinch schickt ebenfalls ctrlKey)
      const onWheel = (e: WheelEvent) => {
        if (!e.ctrlKey && !e.metaKey) {
          showHint(isMac ? copyRef.current.hintZoomMac : copyRef.current.hintZoom);
          return;
        }
        e.preventDefault();
        const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        queueZoom(e.clientX, e.clientY, Math.max(-0.6, Math.min(0.6, dy * 0.0022)));
      };
      const onDoubleClick = (e: MouseEvent) => {
        e.preventDefault();
        queueZoom(e.clientX, e.clientY, e.shiftKey ? 0.7 : -0.7);
      };
      const onContextMenu = (e: Event) => e.preventDefault();

      // Pinch mit zwei Fingern
      const touches = new Map<number, { x: number; y: number }>();
      let pinch: { d: number; anchor: ThreeTypes.Vector3 } | null = null;
      const onTouchDown = (e: PointerEvent) => {
        if (e.pointerType !== "touch") return;
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size === 2) {
          const [a, b] = [...touches.values()];
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), anchor: groundPoint((a.x + b.x) / 2, (a.y + b.y) / 2) };
          fly = null;
        }
      };
      const onTouchMovePointer = (e: PointerEvent) => {
        if (!touches.has(e.pointerId)) return;
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && touches.size === 2) {
          const [a, b] = [...touches.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 0) {
            zoomAround(pinch.anchor, pinch.d / d);
            pinch.d = d;
          }
        }
      };
      const onTouchUp = (e: PointerEvent) => {
        touches.delete(e.pointerId);
        if (touches.size < 2) pinch = null;
      };

      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("pointerdown", onTouchDown);
      canvas.addEventListener("pointermove", onTouchMovePointer);
      canvas.addEventListener("pointerup", onTouchUp);
      canvas.addEventListener("pointercancel", onTouchUp);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      canvas.addEventListener("dblclick", onDoubleClick);
      canvas.addEventListener("contextmenu", onContextMenu);
      el.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("pointerup", onWindowUp);

      const flyTo = (position: ThreeTypes.Vector3, target: ThreeTypes.Vector3) => {
        fly = { t0: performance.now(), p0: camera.position.clone(), q0: controls.target.clone(), p1: position, q1: target };
      };
      api.current = {
        focus: (mosque) => {
          const p = toWorld(mosque.x, mosque.y);
          flyTo(p.clone().add(new THREE.Vector3(90, 360, 380)), p);
        },
        reset: () => flyTo(home(), HOME_TARGET.clone()),
        zoom: (factor) => {
          fly = null;
          zoomAnim.anchor.copy(controls.target);
          zoomAnim.pending += Math.log(factor);
        },
        pan: (dx, dz) => {
          fly = null;
          const step = camera.position.distanceTo(controls.target) * 0.12;
          const forward = new THREE.Vector3().subVectors(controls.target, camera.position).setY(0).normalize();
          const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
          const move = right.multiplyScalar(dx * step).add(forward.multiplyScalar(-dz * step));
          camera.position.add(move);
          controls.target.add(move);
        },
        recolor,
      };

      const start = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
      const back = (t: number) => {
        const x = Math.min(1, Math.max(0, t));
        const c = 1.7;
        return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
      };
      const tipPoint = new THREE.Vector3();
      let raf = 0;
      let visible = true;
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(tick);
        if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      }, { rootMargin: "100px" });
      const tick = (now: number) => {
        raf = 0;
        if (!visible) return;
        const t = reduce ? 99 : (now - start) / 1000;
        // Land wächst aus dem Boden, Kamera schwenkt ein
        land.scale.y = 0.02 + 0.98 * ease(t / 1.2);
        if (!fly && t < 2.2) {
          const k = ease(t / 2.2);
          camera.position.copy(home()).add(new THREE.Vector3(-420 * (1 - k), 500 * (1 - k), 200 * (1 - k)));
        }
        if (fly) {
          const k = ease((now - fly.t0) / 900);
          camera.position.lerpVectors(fly.p0, fly.p1, k);
          controls.target.lerpVectors(fly.q0, fly.q1, k);
          if (k >= 1) fly = null;
        }
        const act = activeRef.current;
        markers.forEach((m) => {
          const td = t - 1.1 - m.i * 0.1;
          const drop = back(td / 0.7);
          m.group.visible = td > 0;
          m.group.position.y = m.y0 * land.scale.y + (td < 0.5 ? (1 - Math.min(1, td / 0.5)) * 120 : 0);
          const on = m.mosque.id === act;
          // Marker bleiben beim Reinzoomen etwa gleich groß auf dem Bildschirm
          m.group.scale.setScalar(Math.min(1, Math.max(0.22, camera.position.distanceTo(m.group.position) / 1400)));
          m.s += ((on ? 1.5 : 1) - m.s) * 0.18;
          const hop = reduce ? 0 : on ? Math.abs(Math.sin(now / 180)) * 6 : Math.sin(now / 900 + m.i) * 1.5;
          m.sprite.scale.setScalar(42 * m.s * Math.max(0.01, drop));
          m.sprite.position.y = 50 + hop;
          const period = on ? 1.2 : 3.2;
          const phase = reduce ? 0 : ((now / 1000 + m.i * 0.27) % period) / period;
          m.ring.scale.setScalar(1 + phase * (on ? 3 : 2));
          (m.ring.material as ThreeTypes.MeshBasicMaterial).opacity = !reduce && td > 0.7 ? (1 - phase) * (on ? 0.9 : 0.45) : 0;
        });
        if (Math.abs(zoomAnim.pending) > 0.0005) {
          const step = zoomAnim.pending * 0.22;
          zoomAround(zoomAnim.anchor, Math.exp(step));
          zoomAnim.pending -= step;
        } else zoomAnim.pending = 0;
        // Verschieben begrenzen: ganz rausgezoomt bleibt Vorarlberg in der Mitte, reingezoomt erreicht man jede Ecke
        const frac = Math.min(1, Math.max(0, (controls.maxDistance - camera.position.distanceTo(controls.target)) / (controls.maxDistance - controls.minDistance)));
        const lx = W * 0.5 * frac + 25;
        const lz = H * 0.5 * frac + 25;
        const tx = Math.max(-lx, Math.min(lx, controls.target.x));
        const tz = Math.max(-lz + 30, Math.min(lz + 30, controls.target.z));
        if (tx !== controls.target.x || tz !== controls.target.z) {
          const dx = tx - controls.target.x;
          const dz = tz - controls.target.z;
          controls.target.x += dx;
          controls.target.z += dz;
          camera.position.x += dx;
          camera.position.z += dz;
        }
        controls.update();
        renderer.render(scene, camera);
        // Schild an der aktiven Moschee
        const marker = markers.find((m) => m.mosque.id === act);
        if (marker && marker.group.visible) {
          marker.sprite.getWorldPosition(tipPoint);
          tipPoint.y += 26 * marker.s * marker.group.scale.y;
          tipPoint.project(camera);
          const x = ((tipPoint.x + 1) / 2) * el.clientWidth;
          const y = ((1 - tipPoint.y) / 2) * el.clientHeight;
          setTip((prev) => (prev && prev.id === act && Math.abs(prev.x - x) < 0.5 && Math.abs(prev.y - y) < 0.5 ? prev : { id: marker.mosque.id, x, y, w: el.clientWidth }));
        } else setTip((prev) => (prev ? null : prev));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      visibilityObserver.observe(el);
      setStatus("ready");

      cleanup = () => {
        window.clearTimeout(hintTimer);
        cancelAnimationFrame(raf);
        visibilityObserver.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("pointerup", onWindowUp);
        el.removeEventListener("touchmove", onTouchMove);
        controls.dispose();
        scene.traverse((object) => {
          const mesh = object as ThreeTypes.Mesh;
          mesh.geometry?.dispose();
          const material = mesh.material as ThreeTypes.Material | undefined;
          material?.dispose?.();
        });
        iconTexture.dispose();
        roadTexture?.dispose();
        renderer.dispose();
        canvas.remove();
        api.current = null;
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  // Farben nach dem Theme-Wechsel neu lesen (data-theme wird im Provider gesetzt)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => api.current?.recolor());
    return () => window.cancelAnimationFrame(frame);
  }, [theme, status]);

  useEffect(() => {
    if (focus && status === "ready") api.current?.focus(focus.mosque);
  }, [focus, status]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const map = api.current;
    if (!map) return;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => map.pan(-1, 0),
      ArrowRight: () => map.pan(1, 0),
      ArrowUp: () => map.pan(0, -1),
      ArrowDown: () => map.pan(0, 1),
      "+": () => map.zoom(0.7),
      "=": () => map.zoom(0.7),
      "-": () => map.zoom(1.4),
      "0": () => map.reset(),
    };
    const action = actions[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  };

  const tipMosque = tip ? mosques.find((m) => m.id === tip.id) : null;

  return (
    <div className="mosque-stage">
      <div
        ref={host}
        className="mosque-gl"
        role="application"
        aria-label={copy.mapLabel}
        aria-describedby="mosque-map-help"
        tabIndex={status === "ready" ? 0 : -1}
        onKeyDown={onKeyDown}
      />
      <p id="mosque-map-help" className="sr-only">{copy.controls} {copy.keyboard}</p>
      {status === "loading" && <p className="mosque-map-status" role="status">{copy.loading}</p>}
      {status === "error" && <p className="mosque-map-status" role="status">{copy.noWebgl}</p>}
      {status === "ready" && (
        <div className="mosque-zoom">
          <button type="button" onClick={() => api.current?.zoom(0.7)} aria-label={copy.zoomIn} title={copy.zoomIn}><Plus size={20} /></button>
          <button type="button" onClick={() => api.current?.zoom(1.4)} aria-label={copy.zoomOut} title={copy.zoomOut}><Minus size={20} /></button>
          <button type="button" onClick={() => api.current?.reset()} aria-label={copy.reset} title={copy.reset}><RotateCcw size={18} /></button>
        </div>
      )}
      {hint && <div className="mosque-gesture" role="status">{hint}</div>}
      {selected && <MosquePopup key={selected.id} mosque={selected} copy={copy} name={name} onClose={() => onSelect(null)} />}
      {tip && tipMosque && tip.id !== selected?.id && (
        <div className="mosque-tip" style={{ left: Math.min(Math.max(tip.x, 110), Math.max(110, tip.w - 110)), top: tip.y }} aria-hidden="true">
          {name(tipMosque)}
          <small>{tipMosque.address}, {tipMosque.town}</small>
        </div>
      )}
    </div>
  );
}

function MosquePopup({ mosque, copy, name, onClose }: { mosque: Mosque; copy: Copy; name: (mosque: Mosque) => string; onClose: () => void }) {
  const { language } = useSiteSettings();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const hours = mosque.openingHours?.[language];
  const fullAddress = `${mosque.address}, ${mosque.postalCode} ${mosque.town}`;

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mosque-pop" role="dialog" aria-labelledby={`mosque-pop-${mosque.id}`}>
      <div className="mosque-pop-image">
        {mosque.image ? (
          <Image src={mosque.image} alt={`${copy.photoAlt} ${name(mosque)}`} fill sizes="340px" />
        ) : (
          <>
            <span className="mosque-pop-emoji" aria-hidden="true">{"\u{1F54C}"}</span>
            <span className="mosque-pop-note">{copy.photoPending}</span>
          </>
        )}
        <button ref={closeRef} type="button" className="mosque-pop-close" onClick={onClose} aria-label={copy.close}>
          <X size={20} />
        </button>
      </div>
      <div className="mosque-pop-body">
        <div>
          <h3 id={`mosque-pop-${mosque.id}`}>{name(mosque)}</h3>
          <p className="mosque-pop-district">{copy.districts[mosque.district]}</p>
        </div>
        <dl>
          <div>
            <dt>{copy.address}</dt>
            <dd>{fullAddress}</dd>
          </div>
          <div>
            <dt>{copy.openingHours}</dt>
            <dd className={hours ? undefined : "is-empty"}>{hours ?? copy.pending}</dd>
          </div>
          {mosque.phone && (
            <div>
              <dt>{copy.phone}</dt>
              <dd><a href={`tel:${mosque.phone.replace(/\s/g, "")}`}>{mosque.phone}</a></dd>
            </div>
          )}
          {mosque.website && (
            <div>
              <dt>{copy.website}</dt>
              <dd>
                <a href={mosque.website} target="_blank" rel="noreferrer">
                  {mosque.website.replace(/^https?:\/\//, "")}
                  <span className="sr-only"> {copy.newTab}</span>
                </a>
              </dd>
            </div>
          )}
        </dl>
        <a
          className="button button-primary mosque-route"
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${fullAddress}, ${copy.country}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          {copy.route} <ArrowUpRight size={18} aria-hidden="true" />
          <span className="sr-only">{copy.newTab}</span>
        </a>
      </div>
    </div>
  );
}

export function MosqueOverview() {
  const { language } = useSiteSettings();
  const copy = translations[language].mosques;
  const [active, setActive] = useState<string | null>(null);
  const [selected, setSelected] = useState<Mosque | null>(null);
  const [focus, setFocus] = useState<{ mosque: Mosque; at: number } | null>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const name = useCallback((mosque: Mosque) => `${copy.namePrefix} ${mosque.town}`, [copy.namePrefix]);

  const select = useCallback((mosque: Mosque | null) => {
    setSelected(mosque);
    if (mosque) setFocus({ mosque, at: Date.now() });
    else {
      const target = returnFocus.current ?? stageRef.current?.querySelector<HTMLButtonElement>(".mosque-gl");
      target?.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, []);

  const showOnMap = (mosque: Mosque, button: HTMLButtonElement) => {
    returnFocus.current = button;
    setActive(mosque.id);
    select(mosque);
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.top < 80 || rect.bottom > window.innerHeight) stage.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className="mosque-overview" id="moscheen" aria-labelledby="mosques-title">
      <div className="container">
        <div className="section-kicker"><span>{copy.kicker}</span><span>{copy.aside}</span></div>
        <div className="mosque-heading">
          <h2 id="mosques-title">{copy.title1}<br /><em>{copy.title2}</em></h2>
          <div className="mosque-heading-copy">
            <p>{copy.intro}</p>
            <dl className="mosque-stats" aria-label={copy.statsLabel}>
              {copy.stats.map(([value, label]) => (
                <div key={label}><dd>{value}</dd><dt>{label}</dt></div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="container mosque-layout">
        <div className="mosque-map-col" ref={stageRef}>
          <MosqueMap copy={copy} name={name} active={active} setActive={setActive} selected={selected} onSelect={select} focus={focus} />
          <div className="mosque-map-footer">
            <p className="mosque-controls mosque-controls-pointer">{copy.controls}</p>
            <p className="mosque-controls mosque-controls-touch">{copy.controlsTouch}</p>
            <a className="text-link mosque-list-link" href="#moscheen-liste">{copy.listAction} <ArrowDown size={18} aria-hidden="true" /></a>
          </div>
        </div>

        <div className="mosque-list-wrap" id="moscheen-liste">
          <div className="mosque-list-head">
            <h3>{copy.listTitle}</h3>
            <p>{copy.listIntro}</p>
          </div>
          <div className="mosque-list">
            {districts.map((district) => {
              const items = mosques.filter((m) => m.district === district);
              return (
                <div className="mosque-group" key={district}>
                  <h4><span>{copy.districts[district]}</span><span>{items.length}</span></h4>
                  <ul>
                    {items.map((mosque) => (
                      <li key={mosque.id}>
                        <button
                          type="button"
                          className={active === mosque.id || selected?.id === mosque.id ? "is-active" : ""}
                          aria-pressed={selected?.id === mosque.id}
                          onMouseEnter={() => setActive(mosque.id)}
                          onMouseLeave={() => setActive(null)}
                          onFocus={() => setActive(mosque.id)}
                          onBlur={() => setActive(null)}
                          onClick={(e) => showOnMap(mosque, e.currentTarget)}
                        >
                          <span className="mosque-emoji" aria-hidden="true">{"\u{1F54C}"}</span>
                          <span>
                            <span className="mosque-name">{name(mosque)}</span>
                            <span className="mosque-address">{mosque.address}, {mosque.postalCode} {mosque.town}</span>
                          </span>
                          <MapPin className="mosque-go" size={18} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="container mosque-sources">{copy.sources}</p>
    </section>
  );
}
