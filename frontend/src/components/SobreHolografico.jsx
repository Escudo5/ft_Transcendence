import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ¿Puede este navegador dibujar en 3D?
 *
 * Se pregunta con un lienzo de mentira y se tira, que es barato y no deja
 * nada montado. Si aquí sale que no, ni se intenta crear la escena. */
function hayWebGL() {
  try {
    const lienzo = document.createElement('canvas');
    return !!(window.WebGLRenderingContext
      && (lienzo.getContext('webgl2') || lienzo.getContext('webgl')));
  } catch {
    return false;
  }
}

const TAU = Math.PI * 2;
const PACK_WIDTH = 3.3;
const PACK_HEIGHT = 4.7;
const TEAR_V = 1 - 127 / 1384;
const TEAR_Y = (TEAR_V - 0.5) * PACK_HEIGHT;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (a, b, value) => {
  const t = clamp((value - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const FOUR = [
  [[0, 0.534], [0.632, 0], [1, 0], [0.333, 0.534]],
  [[0, 0.534], [1, 0.534], [1, 0.74], [0, 0.74]],
  [[0.649, 0.534], [1, 0.534], [1, 1], [0.649, 1]],
];
const TWO = [
  [[0, 0], [1, 0], [1, 0.27], [0.45, 0.27]],
  [[1, 0.27], [1, 0.5], [0.06, 0.8], [0.06, 0.63]],
  [[0, 0.74], [0.95, 0.74], [0.85, 1], [0, 1]],
];

function canvas(width, height) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return [element, element.getContext('2d')];
}

function polygon(context, points, map) {
  context.beginPath();
  points.forEach((point, index) => {
    const [x, y] = map(point);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
}

function draw42(context, centerX, centerY, width, color) {
  const height = width / 1.411;
  const x0 = centerX - width / 2;
  const y0 = centerY - height / 2;
  const four = (point) => [x0 + point[0] * width * 0.5534, y0 + point[1] * height];
  const two = (point) => [x0 + (0.6311 + point[0] * 0.3689) * width, y0 + point[1] * height];
  context.fillStyle = color;
  FOUR.forEach((points) => { polygon(context, points, four); context.fill(); });
  TWO.forEach((points) => { polygon(context, points, two); context.fill(); });
}

function spaced(context, text, centerX, y, spacing) {
  context.textAlign = 'left';
  const widths = [...text].map((character) => context.measureText(character).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * (text.length - 1);
  let x = centerX - total / 2;
  [...text].forEach((character, index) => {
    context.fillText(character, x, y);
    x += widths[index] + spacing;
  });
}

function holoPatch(context, x, y, radius, brightness = 1) {
  const glow = context.createRadialGradient(x, y, radius * 0.1, x, y, radius * 1.6);
  glow.addColorStop(0, `rgba(170,255,255,${0.45 * brightness})`);
  glow.addColorStop(0.55, `rgba(120,160,255,${0.16 * brightness})`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = glow;
  context.beginPath();
  context.arc(x, y, radius * 1.6, 0, TAU);
  context.fill();
  for (let index = 0; index < 24; index += 1) {
    const angle = index / 24 * TAU;
    const length = index % 2 ? radius * 0.55 : radius;
    context.fillStyle = `hsla(${185 + index * 9},100%,68%,${0.85 * brightness})`;
    context.beginPath();
    context.moveTo(x + Math.cos(angle - 0.06) * length, y + Math.sin(angle - 0.06) * length);
    context.lineTo(x + Math.cos(angle + 0.06) * length, y + Math.sin(angle + 0.06) * length);
    context.lineTo(x, y);
    context.fill();
  }
  context.strokeStyle = `rgba(235,245,255,${0.9 * brightness})`;
  context.lineWidth = radius * 0.08;
  context.beginPath();
  context.arc(x, y, radius * 1.15, 0, TAU);
  context.stroke();
}

function createPackTexture() {
  const [image, context] = canvas(1024, 1384);
  const background = context.createLinearGradient(0, 0, 0, image.height);
  background.addColorStop(0, '#090c15');
  background.addColorStop(0.48, '#11151f');
  background.addColorStop(1, '#070910');
  context.fillStyle = background;
  context.fillRect(0, 0, image.width, image.height);

  context.globalAlpha = 0.055;
  context.fillStyle = '#ffffff';
  for (let index = -1; index < 6; index += 1) {
    const start = index * 270 - 160;
    context.beginPath();
    context.moveTo(start, 0);
    context.lineTo(start + 130, 0);
    context.lineTo(start - 430, image.height);
    context.lineTo(start - 560, image.height);
    context.closePath();
    context.fill();
  }
  context.globalAlpha = 1;

  for (let y = 170; y < 1210; y += 34) {
    for (let x = 48; x < 980; x += 34) {
      context.fillStyle = Math.random() < 0.03 ? 'rgba(110,231,255,.55)' : 'rgba(160,180,215,.18)';
      context.beginPath();
      context.arc(x, y, Math.random() < 0.03 ? 2.1 : 1.1, 0, TAU);
      context.fill();
    }
  }

  holoPatch(context, 512, 545, 330, 0.1);
  context.save();
  context.shadowColor = 'rgba(0,0,0,.65)';
  context.shadowBlur = 42;
  context.shadowOffsetY = 18;
  const plate = context.createLinearGradient(0, 325, 0, 765);
  plate.addColorStop(0, '#ffffff');
  plate.addColorStop(1, '#e4e9f3');
  context.fillStyle = plate;
  context.roundRect(192, 325, 640, 440, 26);
  context.fill();
  context.restore();
  draw42(context, 512, 536, 536, '#090c12');

  holoPatch(context, 846, 808, 86);
  context.fillStyle = '#f3f6ff';
  context.font = '700 46px monospace';
  spaced(context, 'MADRID', 512, 886, 20);
  context.fillStyle = '#6ee7ff';
  context.fillRect(442, 910, 140, 2);
  context.fillStyle = 'rgba(205,222,250,.9)';
  context.font = '700 21px monospace';
  spaced(context, 'NEXT GEN COLLECTION', 512, 956, 9);
  context.textAlign = 'center';
  context.font = '700 17px monospace';
  context.fillStyle = 'rgba(220,232,255,.92)';
  context.fillText('3 CARTAS  ·  1 HOLOGRAFICA  ·  FOIL', 512, 1128);
  context.font = '400 14px monospace';
  context.fillStyle = 'rgba(170,190,220,.6)';
  context.fillText('SERIE LIMITADA  ·  Nº 0042 / ∞', 512, 1160);
  context.textAlign = 'left';
  context.fillText('42 MADRID', 64, 178);
  context.textAlign = 'right';
  context.fillText('NGC·2042', 960, 178);
  context.fillStyle = 'rgba(255,255,255,.3)';
  context.fillRect(64, 196, 150, 1);
  context.fillRect(810, 196, 150, 1);

  context.strokeStyle = 'rgba(160,220,255,.9)';
  context.lineWidth = 3;
  context.setLineDash([16, 11]);
  context.beginPath();
  context.moveTo(26, 127.5);
  context.lineTo(998, 127.5);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = 'rgba(6,8,12,.55)';
  context.roundRect(322, 52, 380, 44, 22);
  context.fill();
  context.strokeStyle = 'rgba(110,231,255,.5)';
  context.lineWidth = 1.5;
  context.stroke();
  context.fillStyle = '#aef0ff';
  context.font = '700 17px monospace';
  context.textAlign = 'center';
  context.fillText('DESLIZA PARA ABRIR', 512, 82);

  const texture = new THREE.CanvasTexture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createEmissionTexture() {
  const [image, context] = canvas(1024, 1384);
  context.fillStyle = '#000000';
  context.fillRect(0, 0, image.width, image.height);
  holoPatch(context, 846, 808, 86);
  context.fillStyle = 'rgba(110,231,255,.95)';
  context.fillRect(442, 910, 140, 2);
  context.strokeStyle = 'rgba(110,231,255,.9)';
  context.lineWidth = 3;
  context.setLineDash([16, 11]);
  context.beginPath();
  context.moveTo(26, 127.5);
  context.lineTo(998, 127.5);
  context.stroke();
  context.setLineDash([]);
  context.strokeStyle = 'rgba(110,231,255,.7)';
  context.lineWidth = 2;
  context.roundRect(322, 52, 380, 44, 22);
  context.stroke();
  const texture = new THREE.CanvasTexture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createStripTexture() {
  const [image, context] = canvas(1024, 150);
  context.fillStyle = '#07080d';
  context.fillRect(0, 0, image.width, image.height);
  context.fillStyle = 'rgba(255,255,255,.1)';
  for (let x = 4; x < image.width; x += 7) context.fillRect(x, 3, 2, image.height - 6);
  context.strokeStyle = 'rgba(160,220,255,.95)';
  context.lineWidth = 4;
  context.setLineDash([16, 11]);
  context.beginPath();
  context.moveTo(26, 127);
  context.lineTo(image.width - 26, 127);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = '#aef0ff';
  context.font = '700 18px monospace';
  context.textAlign = 'center';
  context.fillText('DESLIZA PARA ABRIR', image.width / 2, 75);
  const texture = new THREE.CanvasTexture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBumpTexture() {
  const [image, context] = canvas(512, 512);
  context.fillStyle = '#808080';
  context.fillRect(0, 0, 512, 512);
  for (let index = 0; index < 1000; index += 1) {
    const length = 15 + Math.random() * 110;
    const angle = Math.random() * TAU;
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    context.strokeStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${0.04 + Math.random() * 0.07})`;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    context.stroke();
  }
  return new THREE.CanvasTexture(image);
}

function createRingsTexture() {
  const [image, context] = canvas(1024, 1024);
  const glow = context.createRadialGradient(512, 512, 0, 512, 512, 512);
  glow.addColorStop(0, 'rgba(130,205,255,.3)');
  glow.addColorStop(0.65, 'rgba(60,120,255,.035)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 1024, 1024);
  for (let radius = 88; radius <= 470; radius += 54) {
    context.strokeStyle = `rgba(140,220,255,${clamp(0.34 - radius * 0.0005, 0.04, 0.34)})`;
    context.beginPath();
    context.arc(512, 512, radius, 0, TAU);
    context.stroke();
  }
  return new THREE.CanvasTexture(image);
}

function buildShell(start, end, widthSegments, heightSegments, yOffset = 0) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const rows = heightSegments + 1;
  for (let side = 0; side < 2; side += 1) {
    for (let xIndex = 0; xIndex <= widthSegments; xIndex += 1) {
      for (let yIndex = 0; yIndex <= heightSegments; yIndex += 1) {
        const u = xIndex / widthSegments;
        const v = start + (end - start) * yIndex / heightSegments;
        const edge = smoothstep(0, 0.025, v) * smoothstep(1, 0.975, v);
        const center = Math.pow(Math.max(Math.sin(Math.PI * u), 0), 0.65);
        const body = smoothstep(0.055, 0.22, v) * smoothstep(0.945, 0.78, v);
        const volume = 0.055 * edge * (1 - body) * center + 0.4 * body * center;
        const crimp = edge * (1 - body) * center * 0.02 * Math.pow(Math.sin(u * Math.PI * 46), 2);
        const wrinkle = body * 0.011 * (Math.sin(u * 23 + v * 31) * 0.5 + Math.sin(u * 41 - v * 17) * 0.3);
        const offset = side ? -1 : 1;
        positions.push((u - 0.5) * PACK_WIDTH, (v - 0.5) * PACK_HEIGHT - yOffset, offset * (volume + crimp + wrinkle));
        uvs.push(u, v);
      }
    }
    const offset = side * (widthSegments + 1) * rows;
    for (let xIndex = 0; xIndex < widthSegments; xIndex += 1) {
      for (let yIndex = 0; yIndex < heightSegments; yIndex += 1) {
        const a = offset + xIndex * rows + yIndex;
        const b = a + 1;
        const c = offset + (xIndex + 1) * rows + yIndex + 1;
        const d = offset + (xIndex + 1) * rows + yIndex;
        indices.push(...(side ? [a, c, d, a, b, c] : [a, d, c, a, c, b]));
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.addGroup(0, indices.length / 2, 0);
  geometry.addGroup(indices.length / 2, indices.length / 2, 1);
  return geometry;
}

export default function SobreHolografico({ onOpen, onProgress }) {
  const mountRef = useRef(null);
  const callbacksRef = useRef({ onOpen, onProgress });
  callbacksRef.current = { onOpen, onProgress };
  const [sinWebGL, setSinWebGL] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    /* ⚠️ Nacho, 14/09: red de seguridad, no tocamos nada del sobre.
     *
     * Si el navegador no puede con WebGL, `new THREE.WebGLRenderer()` lanza
     * una excepción DENTRO de este efecto y React desmonta el árbol entero:
     * la tienda de sobres se queda EN BLANCO. Y como arrastrar la tira es
     * ahora la única forma de abrir un sobre, se cae el bucle central del
     * juego sin decir por qué.
     *
     * En un Mac del campus con Chrome no va a pasar. Pero pasa con la
     * aceleración por hardware desactivada, en una máquina virtual o en un
     * navegador viejo, y no queremos descubrirlo el día de la evaluación.
     * Si no hay 3D, más abajo se enseña un botón normal y se abre igual. */
    if (!hayWebGL()) {
      setSinWebGL(true);
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04050b);
    scene.fog = new THREE.Fog(0x04050b, 9, 18);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(0.8, 0.45, 8.8);
    // Segunda red: hay navegadores que dicen que sí y luego fallan al crear
    // el contexto de verdad (sin memoria de vídeo, drivers, muchas pestañas
    // con 3D abiertas). Aquí todavía no se ha creado nada en la tarjeta
    // gráfica, solo objetos de JavaScript, así que se puede salir sin liberar.
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (fallo) {
      console.warn('No se ha podido crear el sobre en 3D, se abrirá con botón:', fallo);
      setSinWebGL(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.2;
    controls.maxDistance = 13;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.maxPolarAngle = Math.PI * 0.74;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed = 0.7;

    const texture = createPackTexture();
    const emission = createEmissionTexture();
    const stripTexture = createStripTexture();
    const backTexture = texture.clone();
    backTexture.repeat.x = -1;
    backTexture.offset.x = 1;
    backTexture.needsUpdate = true;
    const backEmission = emission.clone();
    backEmission.repeat.x = -1;
    backEmission.offset.x = 1;
    backEmission.needsUpdate = true;
    const backStripTexture = stripTexture.clone();
    backStripTexture.repeat.x = -1;
    backStripTexture.offset.x = 1;
    backStripTexture.needsUpdate = true;
    const bump = createBumpTexture();
    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
    bump.repeat.set(3, 4);
    const foil = {
      metalness: 0.92,
      roughness: 0.34,
      clearcoat: 1,
      clearcoatRoughness: 0.16,
      iridescence: 1,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [140, 520],
      envMapIntensity: 1.25,
      bumpMap: bump,
      bumpScale: 0.35,
    };
    const frontMaterial = new THREE.MeshPhysicalMaterial({ ...foil, map: texture, emissiveMap: emission, emissive: 0xffffff, emissiveIntensity: 0.85 });
    const backMaterial = new THREE.MeshPhysicalMaterial({ ...foil, map: backTexture, emissiveMap: backEmission, emissive: 0xffffff, emissiveIntensity: 0.85 });
    const stripFront = new THREE.MeshPhysicalMaterial({ ...foil, map: stripTexture, transparent: true, emissiveMap: emission, emissive: 0xffffff, emissiveIntensity: 0.85 });
    const stripBack = new THREE.MeshPhysicalMaterial({ ...foil, map: backStripTexture, transparent: true, emissiveMap: backEmission, emissive: 0xffffff, emissiveIntensity: 0.85 });
    const bodyGeometry = buildShell(0, TEAR_V, 100, 120);
    const stripGeometry = buildShell(TEAR_V, 1, 100, 18, TEAR_Y);
    const body = new THREE.Mesh(bodyGeometry, [frontMaterial, backMaterial]);
    const strip = new THREE.Mesh(stripGeometry, [stripFront, stripBack]);
    const stripGroup = new THREE.Group();
    stripGroup.position.y = TEAR_Y;
    stripGroup.add(strip);
    const pack = new THREE.Group();
    pack.add(body, stripGroup);
    const openingGuide = new THREE.Mesh(
      new THREE.PlaneGeometry(PACK_WIDTH * 0.96, 0.018),
      new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    openingGuide.position.set(0, TEAR_Y + 0.035, 0.14);
    pack.add(openingGuide);
    scene.add(pack);

    const rings = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 15),
      new THREE.MeshBasicMaterial({ map: createRingsTexture(), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    rings.rotation.x = -Math.PI / 2;
    rings.position.y = -2.62;
    scene.add(rings);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0x8fa5c9, 0x05060a, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(3.5, 6, 5.5);
    scene.add(key);
    const cyan = new THREE.DirectionalLight(0x6fd6ff, 3.2);
    cyan.position.set(-5.5, 2.5, -4.5);
    scene.add(cyan);
    const pink = new THREE.DirectionalLight(0xff8fc8, 2.4);
    pink.position.set(5.5, -1.5, -4);
    scene.add(pink);

    const stripPositions = stripGeometry.attributes.position;
    const stripUvs = stripGeometry.attributes.uv;
    const stripBase = Float32Array.from(stripPositions.array);
    let progress = 0;
    let dragging = false;
    let startX = 0;
    let opened = false;
    let frame = 0;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerPosition = (event) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    };
    const onTearStrip = () => {
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(strip, false).length > 0;
    };
    const updateStrip = (tear, time) => {
      const progressFront = tear * 1.22;
      for (let index = 0; index < stripPositions.count; index += 1) {
        const u = stripUvs.getX(index);
        const v = stripUvs.getY(index);
        const vertical = (v - TEAR_V) / (1 - TEAR_V);
        let x = stripBase[index * 3];
        let y = stripBase[index * 3 + 1];
        let z = stripBase[index * 3 + 2];
        const localProgress = clamp((progressFront - u) / 0.16, 0, 1);
        const eased = localProgress * localProgress * (3 - 2 * localProgress);
        if (eased > 0) {
          const wobble = Math.sin(u * 9 + time * 7) * 0.05 * eased + Math.sin(u * 33 + time * 13) * 0.02 * eased;
          const angle = eased * 1.5 + eased * 0.4 * vertical * vertical + wobble;
          const nextY = y * Math.cos(angle) - z * Math.sin(angle);
          z = y * Math.sin(angle) + z * Math.cos(angle) + eased * 0.02;
          y = nextY;
        }
        stripPositions.setXYZ(index, x, y, z);
      }
      stripPositions.needsUpdate = true;
      stripGeometry.computeVertexNormals();
    };
    const updateProgress = (next) => {
      progress = clamp(next, 0, 1);
      updateStrip(progress, performance.now() * 0.001);
      stripFront.opacity = stripBack.opacity = 1 - smoothstep(0.55, 1, progress);
      callbacksRef.current.onProgress(progress);
      if (progress > 0.985 && !opened) {
        opened = true;
        callbacksRef.current.onOpen();
      }
    };
    const pointerDown = (event) => {
      if (opened) return;
      pointerPosition(event);
      if (!onTearStrip()) return;
      controls.enabled = false;
      dragging = true;
      startX = event.clientX;
      renderer.domElement.style.cursor = 'ew-resize';
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const pointerMove = (event) => {
      if (dragging) {
        updateProgress((event.clientX - startX) / Math.max(window.innerWidth * 0.42, 260));
      } else if (!opened) {
        pointerPosition(event);
        renderer.domElement.style.cursor = onTearStrip() ? 'ew-resize' : 'grab';
      }
    };
    const pointerUp = () => {
      if (!dragging) return;
      dragging = false;
      controls.enabled = true;
      renderer.domElement.style.cursor = 'grab';
      if (progress < 0.985) updateProgress(0);
    };
    renderer.domElement.addEventListener('pointerdown', pointerDown, true);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('pointercancel', pointerUp);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    window.addEventListener('resize', resize);
    resize();
    const animate = () => {
      const time = performance.now() * 0.001;
      pack.position.y = 0.1 + Math.sin(time * 0.9) * 0.1;
      pack.rotation.y = 0.42 + Math.sin(time * 0.45) * 0.12;
      pack.rotation.z = Math.sin(time * 0.5) * 0.03;
      rings.rotation.z = time * 0.05;
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      controls.dispose();
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', pointerDown, true);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointercancel', pointerUp);
      bodyGeometry.dispose();
      stripGeometry.dispose();
      frontMaterial.dispose();
      backMaterial.dispose();
      stripFront.dispose();
      stripBack.dispose();
      texture.dispose();
      emission.dispose();
      backTexture.dispose();
      backEmission.dispose();
      stripTexture.dispose();
      backStripTexture.dispose();
      bump.dispose();
      openingGuide.geometry.dispose();
      openingGuide.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  /* Sin 3D, pero el sobre TIENE que poder abrirse igual.
   *
   * Ojo: este return va DESPUÉS de todos los hooks, nunca antes. Un `return`
   * por delante de un hook fue lo que tiró el chat entero el 10/09.
   *
   * Los estilos van aquí dentro a propósito, para no tocar el styles.css de
   * Sergio por un caso que casi nunca se va a dar. */
  if (sinWebGL) {
    return (
      <div
        className="holo-pack"
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '1.4rem', textAlign: 'center', cursor: 'auto',
        }}
      >
        <p style={{ maxWidth: '32ch', lineHeight: 1.5, opacity: 0.75 }}>
          Tu navegador no puede dibujar el sobre en 3D, pero puedes abrirlo
          igualmente.
        </p>
        <button
          type="button"
          onClick={() => callbacksRef.current.onOpen?.()}
          style={{
            padding: '0.9rem 2.2rem', fontSize: '1.15rem', cursor: 'pointer',
            borderRadius: '50px', color: '#fff',
            backgroundColor: 'var(--surface-raised)',
            border: '2px solid #6ee7ff',
            boxShadow: '0 0 14px rgba(110,231,255,0.35)',
          }}
        >
          Abrir sobre
        </button>
      </div>
    );
  }

  return <div ref={mountRef} className="holo-pack" aria-label="Sobre holográfico. Arrastra la tira superior para abrirlo." />;
}
