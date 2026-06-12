/* ===========================================================
   BELLA — keycaps3d.js
   Teclas de acrílico REAIS renderizadas com Three.js (PBR).
   Cada botão do menu é um bloco sólido de acrílico translúcido
   (MeshPhysicalMaterial com transmission, IOR 1.49 = acrílico)
   com o ícone extrudado em 3D encapsulado no meio da espessura.
   O clique move a tecla fisicamente para baixo com mola real.
   Fallback: se WebGL falhar, o menu mantém a versão CSS.
   =========================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
/* ambiente de estúdio próprio (softboxes), sem RoomEnvironment:
   reflexos largos e suaves de produto, não “janelas” duras */

const S = {
  renderer: null, scene: null, camera: null, grid: null,
  keys: [],                 // { cell, group, baseX, baseY, press, vel, target, holdK, shadowMat, glowMat, introY, introV }
  iconGeoCache: new Map(),
  blockGeo: null, blockMat: null, iconMat: null,
  panel: null, shadowTex: null, glowTex: null,
  raf: 0, lastT: 0, ro: null, failed: false,
};

/* tecla de acrílico assentada numa bancada branca única (referência):
   bloco menor, quase frontal, protraindo da superfície branca */
const KEY = { size: 98, thick: 30, radius: 24, tilt: -0.16, travel: 7 };

/* ---------- infra ---------- */
function ensureRenderer() {
  if (S.renderer) return true;
  if (S.failed) return false;
  try {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.domElement.className = 'keys-canvas';
    S.renderer = r;

    S.scene = new THREE.Scene();
    S.scene.background = null;

    /* iluminação de estúdio: softboxes próprios para reflexos largos
       e suaves + luzes coloridas que atravessam o material */
    const pmrem = new THREE.PMREMGenerator(r);
    S.scene.environment = pmrem.fromScene(makeStudioEnv(), 0.08).texture;

    const warm = new THREE.PointLight(0xffb3dd, 2.6, 0, 0);
    warm.position.set(-260, 320, 420);
    const cool = new THREE.PointLight(0xb18cff, 2.2, 0, 0);
    cool.position.set(420, -380, 360);
    const fill = new THREE.DirectionalLight(0xffffff, 0.85);
    fill.position.set(0.2, 0.6, 1);
    S.scene.add(warm, cool, fill, new THREE.AmbientLight(0xffffff, 0.55));

    S.camera = new THREE.OrthographicCamera(0, 100, 0, -100, -3000, 3000);
    S.camera.position.z = 900;

    /* tudo que não é luz vive aqui — varrido por inteiro a cada remontagem */
    S.root = new THREE.Group();
    S.scene.add(S.root);

    buildSharedAssets();
    return true;
  } catch (e) {
    console.warn('[keycaps3d] WebGL indisponível — mantendo fallback CSS.', e);
    S.failed = true;
    return false;
  }
}

/* estúdio fotográfico: softbox no teto, painéis rosa/lilás nas laterais */
function makeStudioEnv() {
  const env = new THREE.Scene();
  env.background = new THREE.Color('#efeaf8');
  const panel = (w, h, color, intensity, x, y, z, rx, ry) => {
    const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    mat.color.set(color).multiplyScalar(intensity);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    env.add(m);
  };
  panel(14, 9, '#ffffff', 18, 0, 9, 0, Math.PI / 2, 0);       // softbox principal (teto)
  panel(8, 5, '#ffffff', 9, 0, 4, -9, 0.5, 0);                // rebatedor frontal alto
  panel(6, 12, '#ffd2ec', 5, -10, 1, 0, 0, Math.PI / 2);      // painel rosa à esquerda
  panel(6, 12, '#c9b1ff', 4.6, 10, 1, 0, 0, -Math.PI / 2);    // painel lilás à direita
  panel(20, 20, '#e8e2f2', 2.2, 0, -6, 0, -Math.PI / 2, 0);   // piso claro
  return env;
}

function buildSharedAssets() {
  /* bloco de acrílico: material físico com transmissão real de luz */
  S.blockGeo = new RoundedBoxGeometry(KEY.size, KEY.size, KEY.thick, 5, KEY.radius);
  S.glowGeo = new THREE.PlaneGeometry(KEY.size * 0.86, KEY.size * 0.86);
  S.keyShadowGeo = new THREE.PlaneGeometry(KEY.size * 1.5, KEY.size * 0.75);
  S.blockMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1,
    thickness: KEY.thick * 0.38,
    roughness: 0.05,
    metalness: 0,
    ior: 1.49,                                    // índice de refração do acrílico (PMMA)
    attenuationColor: new THREE.Color('#ee78c4'), // a luz fica rosa ao atravessar a massa
    attenuationDistance: 11,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    specularIntensity: 1,
    envMapIntensity: 0.55,
  });
  if ('dispersion' in S.blockMat) S.blockMat.dispersion = 2.2; // aberração cromática nas arestas

  /* ícone: “porcelana” branca dentro do acrílico */
  S.iconMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.2, metalness: 0,
    emissive: 0xffffff, emissiveIntensity: 0.42, envMapIntensity: 0.6,
  });

  /* sombra de contato: gradiente radial (fotografia de produto) */
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 128;
  const sg = sc.getContext('2d');
  const grad = sg.createRadialGradient(128, 64, 8, 128, 64, 120);
  grad.addColorStop(0, 'rgba(96,60,140,0.55)');
  grad.addColorStop(0.55, 'rgba(110,80,160,0.22)');
  grad.addColorStop(1, 'rgba(110,80,160,0)');
  sg.save(); sg.translate(128, 64); sg.scale(1, 0.5); sg.translate(-128, -64);
  sg.fillStyle = grad; sg.fillRect(-80, -80, 416, 288); sg.restore();
  S.shadowTex = new THREE.CanvasTexture(sc);

  /* sombra da bancada: retângulo arredondado desfocado (sombra de card) */
  const bc = document.createElement('canvas'); bc.width = bc.height = 256;
  const bg2 = bc.getContext('2d');
  bg2.filter = 'blur(14px)';
  bg2.fillStyle = 'rgba(96, 66, 140, 0.6)';
  roundRect(bg2, 44, 48, 168, 164, 44); bg2.fill();
  S.slabShadowTex = new THREE.CanvasTexture(bc);

  /* núcleo de cor no fundo do bloco: acrílico tingido na massa,
     gradiente rosa→roxo da referência. PRECISA ser opaco — objetos
     transparentes não aparecem no passe de transmissão do three.js. */
  const gc = document.createElement('canvas'); gc.width = gc.height = 256;
  const gg = gc.getContext('2d');
  const lin = gg.createLinearGradient(10, 0, 246, 256);
  lin.addColorStop(0, '#ff93d3');
  lin.addColorStop(0.55, '#f17fd0');
  lin.addColorStop(1, '#9f63f2');
  gg.fillStyle = lin;
  roundRect(gg, 4, 4, 248, 248, 56); gg.fill();
  /* vinheta: a cor adensa nas bordas como num bloco tingido na massa */
  const vin = gg.createRadialGradient(128, 118, 60, 128, 128, 170);
  vin.addColorStop(0, 'rgba(255,255,255,0.14)');
  vin.addColorStop(0.6, 'rgba(214,120,220,0)');
  vin.addColorStop(1, 'rgba(124,62,200,0.38)');
  gg.fillStyle = vin;
  roundRect(gg, 4, 4, 248, 248, 56); gg.fill();
  S.glowTex = new THREE.CanvasTexture(gc);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------- ícones: SVG do sprite → malha 3D extrudada ---------- */
function iconGeometry(iconId) {
  if (S.iconGeoCache.has(iconId)) return S.iconGeoCache.get(iconId);
  const sym = document.getElementById(iconId);
  if (!sym) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sym.getAttribute('viewBox')}">${sym.innerHTML}</svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes = [];
  for (const p of data.paths) {
    if (p.userData?.style?.fill === 'none') continue;
    for (const sh of SVGLoader.createShapes(p)) {
      if (Math.abs(THREE.ShapeUtils.area(sh.getPoints(12))) > 0.25) shapes.push(sh);
    }
  }
  if (!shapes.length) return null;
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 2.6, bevelEnabled: true, bevelThickness: 0.7, bevelSize: 0.7,
    bevelSegments: 2, curveSegments: 10,
  });
  geo.center();
  geo.rotateX(Math.PI); // SVG é y-para-baixo; espelha mantendo winding válido
  /* normaliza para caber em ~52% da tecla */
  geo.computeBoundingBox();
  const bb = geo.boundingBox, w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y;
  const k = (KEY.size * 0.46) / Math.max(w, h);
  geo.scale(k, k, k * 2.4);
  geo.center();
  S.iconGeoCache.set(iconId, geo);
  return geo;
}

/* ---------- montagem ---------- */
function mount() {
  const grid = document.getElementById('catGrid');
  if (!grid) return;
  if (!ensureRenderer()) return;

  S.grid = grid;
  grid.appendChild(S.renderer.domElement);
  grid.classList.add('gl-on');

  buildScene();
  /* aguarda layout do grid antes de medir as células */
  requestAnimationFrame(() => {
    try { layout(); startIntro(); }
    catch (e) { console.error('[keycaps3d] layout falhou:', e?.message, e?.stack); }
  });

  S.ro?.disconnect();
  S.ro = new ResizeObserver(() => { layout(); requestRender(); });
  S.ro.observe(grid);
}

function buildScene() {
  /* limpa TUDO da montagem anterior (grid é recriado pelo app.js):
     o root é varrido por inteiro — nada sobrevive órfão na cena */
  for (const k of S.keys) { k.glowMat.dispose(); k.shadowMat.dispose(); }
  S.keys = [];
  if (S.panel) { S.panel.geometry.dispose(); S.panel.material.dispose(); }
  if (S.panelShadow) { S.panelShadow.geometry.dispose(); S.panelShadow.material.dispose(); }
  S.panel = S.panelShadow = null;
  S.root.clear();

  const cells = S.grid.querySelectorAll('.key-cell');
  cells.forEach(cell => {
    const iconId = cell.dataset.icon;
    const group = new THREE.Group();

    const block = new THREE.Mesh(S.blockGeo, S.blockMat);

    /* núcleo de cor opaco no fundo da massa (visível através do vidro);
       alphaTest recorta os cantos sem sair do passe de transmissão */
    const glowMat = new THREE.MeshBasicMaterial({ map: S.glowTex, toneMapped: false, alphaTest: 0.5 });
    const glow = new THREE.Mesh(S.glowGeo, glowMat);
    glow.position.z = -KEY.thick * 0.34;

    /* ícone encapsulado no meio da espessura (o “2,5mm da base” do spec);
       levemente acima do centro para ler nítido através da superfície */
    const iGeo = iconGeometry(iconId);
    if (iGeo) {
      const icon = new THREE.Mesh(iGeo, S.iconMat);
      icon.position.z = KEY.thick * 0.1;
      group.add(icon);
    }

    group.add(glow, block);
    group.rotation.x = KEY.tilt; // vista de produto: face superior + parede frontal

    /* sombra de contato projetada na base */
    const shadowMat = new THREE.MeshBasicMaterial({
      map: S.shadowTex, transparent: true, opacity: 0.55,
      depthWrite: false, toneMapped: false,
    });
    const shadow = new THREE.Mesh(S.keyShadowGeo, shadowMat);

    S.root.add(shadow, group);

    const key = {
      cell, group, shadow, glowMat, shadowMat,
      baseX: 0, baseY: 0, press: 0, vel: 0, target: 0,
      introY: -14, introV: 0, introDelay: S.keys.length * 70, introT: 0, started: false,
    };
    S.keys.push(key);
    bindPress(key);
  });
}

function bindPress(key) {
  const down = () => {
    key.target = 1;
    navigator.vibrate?.(8);
    requestRender();
  };
  const up = () => {
    if (key.target === 1) { key.target = 0; navigator.vibrate?.(4); requestRender(); }
  };
  key.cell.addEventListener('pointerdown', down, { passive: true });
  key.cell.addEventListener('pointerup', up, { passive: true });
  key.cell.addEventListener('pointercancel', up, { passive: true });
  key.cell.addEventListener('pointerleave', up, { passive: true });
}

function layout() {
  if (!S.grid || !S.grid.isConnected) return;
  const w = S.grid.clientWidth, h = S.grid.scrollHeight;
  if (!w || !h) return;
  S.renderer.setSize(w, h, false);
  S.camera.left = 0; S.camera.right = w; S.camera.top = 0; S.camera.bottom = -h;
  S.camera.updateProjectionMatrix();

  if (S.panel) {
    S.root.remove(S.panel, S.panelShadow);
    S.panel.geometry.dispose(); S.panel.material.dispose();
    S.panelShadow.geometry.dispose(); S.panelShadow.material.dispose();
    S.panel = S.panelShadow = null;
  }
  /* A BANCADA: um único slab branco espesso onde todas as teclas assentam.
     Extrusão com bevel = bordas almofadadas de acrílico branco fosco. */
  const m = 8;                 // margem do slab dentro do canvas
  const r = 42, pw = w - m * 2, ph = h - m * 2;
  const shape = new THREE.Shape();
  shape.moveTo(r, 0); shape.lineTo(pw - r, 0);
  shape.absarc(pw - r, -r, r, Math.PI / 2, 0, true);
  shape.lineTo(pw, -(ph - r));
  shape.absarc(pw - r, -(ph - r), r, 0, -Math.PI / 2, true);
  shape.lineTo(r, -ph);
  shape.absarc(r, -(ph - r), r, -Math.PI / 2, Math.PI, true);
  shape.lineTo(0, -r);
  shape.absarc(r, -r, r, Math.PI, Math.PI / 2, true);
  const slabDepth = 16, slabBevel = 8;
  const slabGeo = new THREE.ExtrudeGeometry(shape, {
    depth: slabDepth, bevelEnabled: true, bevelThickness: slabBevel,
    bevelSize: slabBevel, bevelSegments: 4, curveSegments: 12,
  });
  S.panel = new THREE.Mesh(slabGeo, new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.55, metalness: 0, envMapIntensity: 0.5,
  }));
  /* face frontal do slab encosta no plano traseiro das teclas */
  const slabFront = -KEY.thick / 2 - 1;
  S.panel.position.set(m, -m, slabFront - slabDepth - slabBevel);

  /* sombra ambiente da bancada sobre a página (contorno + queda) */
  const psMat = new THREE.MeshBasicMaterial({
    map: S.slabShadowTex, transparent: true, opacity: 0.55,
    depthWrite: false, toneMapped: false,
  });
  S.panelShadow = new THREE.Mesh(new THREE.PlaneGeometry(pw * 1.42, ph * 1.42), psMat);
  S.panelShadow.position.set(w / 2, -(h / 2) - 18, slabFront - slabDepth - slabBevel * 2 - 20);
  S.root.add(S.panelShadow, S.panel);

  const gRect = S.grid.getBoundingClientRect();
  for (const k of S.keys) {
    const slot = k.cell.querySelector('.key-slot');
    const rc = (slot || k.cell).getBoundingClientRect();
    k.baseX = rc.left - gRect.left + rc.width / 2;
    k.baseY = rc.top - gRect.top + rc.height / 2 - 4;
    k.group.position.set(k.baseX, -k.baseY, 0);
    /* sombra do acrílico projetada na bancada branca */
    k.shadow.position.set(k.baseX, -(k.baseY + KEY.size * 0.5), slabFront + 0.5);
  }
  requestRender();
}

/* ---------- física da mola (switch mecânico) ---------- */
function startIntro() {
  S.lastT = performance.now();
  for (const k of S.keys) { k.started = false; k.introT = 0; k.introY = -14; k.introV = 0; }
  requestRender();
}

function step(dt) {
  let active = false;
  for (const k of S.keys) {
    /* entrada: as teclas assentam na bancada com mola */
    if (k.introY !== 0 || k.introV !== 0) {
      k.introT += dt * 1000;
      if (k.introT >= k.introDelay) {
        k.started = true;
        const a = -260 * k.introY - 18 * k.introV;
        k.introV += a * dt; k.introY += k.introV * dt;
        if (Math.abs(k.introY) < 0.05 && Math.abs(k.introV) < 0.05) { k.introY = 0; k.introV = 0; }
      }
      active = true;
    }
    /* curso da tecla: mola rígida na descida, retorno elástico subamortecido */
    const stiff = k.target === 1 ? 1400 : 420;
    const damp = k.target === 1 ? 70 : 13.5;
    const a = stiff * (k.target - k.press) - damp * k.vel;
    k.vel += a * dt; k.press += k.vel * dt;
    if (Math.abs(k.press - k.target) < 0.001 && Math.abs(k.vel) < 0.001) {
      k.press = k.target; k.vel = 0;
    } else active = true;

    const dy = k.press * KEY.travel + k.introY;
    k.group.position.y = -(k.baseY + dy);
    /* compressão óptica: a luz interna intensifica ao pressionar */
    k.glowMat.color.setScalar(1 + k.press * 0.18);
    /* a sombra aperta e escurece quando a tecla aproxima da bancada */
    k.shadowMat.opacity = 0.55 + k.press * 0.18;
    k.shadow.scale.setScalar(1 - k.press * 0.05);
  }
  return active;
}

/* ---------- render sob demanda ---------- */
function requestRender() {
  if (S.raf) return;
  S.lastT = performance.now();
  const loop = (t) => {
    const dt = Math.min((t - S.lastT) / 1000, 0.05);
    S.lastT = t;
    const active = step(dt);
    if (S.grid?.isConnected) S.renderer.render(S.scene, S.camera);
    S.raf = active ? requestAnimationFrame(loop) : 0;
  };
  S.raf = requestAnimationFrame(loop);
}

/* ---------- API pública ---------- */
window.BellaKeycaps = { mount };
window.__KC = S; // debug
/* o app.js pode já ter renderizado o menu antes deste módulo carregar */
mount();
