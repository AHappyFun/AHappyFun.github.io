/*!
 * Magazine Theme — 文章球体 (Three.js)
 * 深空科技风：球面按经纬度(UV)切成一片片曲面格子，每篇文章一格。
 * 格子 = 暗色玻璃 + 霓虹描边；悬停时格子沿法线放大悬浮、霓虹增强。
 * 背景：星点 + 轨道环 + 外圈网格笼。拖动旋转、点击跳转。
 * 文章数量变化时，格子行列数自动调整。
 */
import * as THREE from 'three';

(function () {
  'use strict';

  const container = document.getElementById('heroSphere');
  const mount = document.getElementById('heroSphereCanvas');
  const loading = document.getElementById('heroSphereLoading');
  if (!container || !mount) return;

  // ---- 读取文章数据（index.ejs 内联 JSON）----
  const dataEl = document.getElementById('sphere-posts-data');
  let postData = [];
  try {
    postData = dataEl ? JSON.parse(dataEl.textContent || '[]') : [];
  } catch (e) {
    postData = [];
  }
  if (!postData.length) {
    container.style.display = 'none';
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- 霓虹配色：按分类散列 --- */
  const NEON = [
    '#22d3ee', '#818cf8', '#c084fc', '#e879f9',
    '#f472b6', '#34d399', '#fbbf24', '#38bdf8'
  ];

  function hashIndex(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function neonFor(post) {
    const key = (post.categories && post.categories.length)
      ? post.categories.join(',').toLowerCase()
      : ('uncat-' + post.title.toLowerCase());
    return NEON[hashIndex(key) % NEON.length];
  }

  /* --- 布局：经纬度格子（列数≈2×行数，格子近似方形）--- */
  const N = postData.length;
  const COLS = Math.max(1, Math.ceil(Math.sqrt(2 * N)));
  const ROWS = Math.max(1, Math.ceil(N / COLS));
  const BAND_TOP = 0.12;   // 极冠占比（避开两极文字挤压）
  const BAND_H = 1 - 2 * BAND_TOP;
  const GAP = 0.05;        // 格子间隙比例

  /* --- 渲染器 --- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (err) {
    container.classList.add('hero-sphere--fallback');
    if (loading) loading.textContent = '当前浏览器不支持 WebGL，已回退到文章列表。';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45, mount.clientWidth / mount.clientHeight, 0.1, 100
  );

  const SPHERE_RADIUS = 3.0;

  /* --- 自适应取景：球约占视口 65%，四周留出太空空间，避免"被球包住" --- */
  const VERT_FOV = 40;
  const SPHERE_FILL = 0.65;

  function updateCamera() {
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    if (!w || !h) return;
    const aspect = w / h;
    const halfV = THREE.MathUtils.degToRad(VERT_FOV / 2);
    const halfH = Math.atan(Math.tan(halfV) * aspect);
    const minHalf = Math.min(halfV, halfH);
    const dist = SPHERE_RADIUS / Math.sin(minHalf * SPHERE_FILL);
    camera.fov = VERT_FOV;
    camera.aspect = aspect;
    camera.position.set(0, SPHERE_RADIUS * 0.12, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  updateCamera();

  // 灯光：让打底的深色球有点立体感
  scene.add(new THREE.AmbientLight(0x8899ff, 0.35));
  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(4, 6, 8);
  scene.add(dir);

  const group = new THREE.Group();
  group.rotation.x = 0.1;
  scene.add(group);

  /* --- 深色打底球（略小于格子球，避免 z-fighting，提供球体轮廓）--- */
  const base = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS * 0.985, COLS * 8, ROWS * 6),
    new THREE.MeshLambertMaterial({ color: 0x101a3a })
  );
  group.add(base);

  /* --- 星点 --- */
  const starField = (function makeStars() {
    const count = 360;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const rad = 6 + Math.random() * 9;
      pos[i * 3] = rad * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = rad * Math.cos(ph) * 0.7;
      pos[i * 3 + 2] = rad * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      color: 0x9fd8ff, size: 0.05, transparent: true,
      opacity: 0.75, sizeAttenuation: true, depthWrite: false
    });
    return new THREE.Points(g, m);
  })();
  scene.add(starField);

  /* --- 轨道环 --- */
  function makeRing(colorHex) {
    const g = new THREE.RingGeometry(SPHERE_RADIUS * 1.28, SPHERE_RADIUS * 1.286, 160);
    const m = new THREE.MeshBasicMaterial({
      color: colorHex, transparent: true, opacity: 0.45,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    return new THREE.Mesh(g, m);
  }
  const ring1 = makeRing(0x22d3ee);
  ring1.rotation.x = 1.15;
  ring1.rotation.z = 0.5;
  const ring2 = makeRing(0xe879f9);
  ring2.rotation.x = 2.0;
  ring2.rotation.z = 1.2;
  ring2.scale.setScalar(1.06);
  scene.add(ring1, ring2);

  /* --- 外圈网格笼（科技结构感）--- */
  const cage = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_RADIUS * 1.08, 26, 16),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.06, depthWrite: false
    })
  );
  group.add(cage);

  /* --- 格子：独立球面切片网格 --- */
  const TILE_TEX = 192;

  function makeTileGeometry(r, c) {
    const cellU = 1 / COLS;
    const cellV = BAND_H / ROWS;
    const u0 = c * cellU + cellU * GAP;
    const u1 = (c + 1) * cellU - cellU * GAP;
    const theta0 = Math.PI * (BAND_TOP + r * cellV + cellV * GAP);
    const theta1 = Math.PI * (BAND_TOP + (r + 1) * cellV - cellV * GAP);
    const phi0 = u0 * 2 * Math.PI;
    const phi1 = u1 * 2 * Math.PI;

    const SEG = 12;
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let iy = 0; iy <= SEG; iy++) {
      const t = iy / SEG;
      const theta = theta0 + t * (theta1 - theta0);
      for (let ix = 0; ix <= SEG; ix++) {
        const s = ix / SEG;
        const phi = phi0 + s * (phi1 - phi0);
        const x = -SPHERE_RADIUS * Math.cos(phi) * Math.sin(theta);
        const y = SPHERE_RADIUS * Math.cos(theta);
        const z = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
        positions.push(x, y, z);
        uvs.push(s, 1 - t); // 切片顶部(theta0) -> 纹理顶部，保证文字正向
      }
    }
    for (let iy = 0; iy < SEG; iy++) {
      for (let ix = 0; ix < SEG; ix++) {
        // a=左上, b=右上, cIdx=左下, d=右下；与 three.js SphereGeometry 一致：
        // (右上, 左上, 右下), (左上, 左下, 右下) —— 保证所有三角形法线朝外
        const a = iy * (SEG + 1) + ix;
        const b = a + 1;
        const cIdx = a + (SEG + 1);
        const d = cIdx + 1;
        indices.push(b, a, d, a, cIdx, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }

  function tileCenterNormal(r, c) {
    const cellU = 1 / COLS;
    const cellV = BAND_H / ROWS;
    const theta = Math.PI * (BAND_TOP + (r + 0.5) * cellV);
    const phi = (c + 0.5) * cellU * 2 * Math.PI;
    return new THREE.Vector3(
      -Math.cos(phi) * Math.sin(theta),
      Math.cos(theta),
      Math.sin(phi) * Math.sin(theta)
    );
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function wrapText(c, text, maxWidth) {
    const tokens = String(text).split(/\s+/);
    const lines = [];
    let cur = '';
    tokens.forEach(function (tk) {
      const test = cur ? cur + ' ' + tk : tk;
      if (c.measureText(test).width <= maxWidth) { cur = test; return; }
      if (cur) lines.push(cur);
      cur = tk;
    });
    if (cur) lines.push(cur);
    const out = [];
    lines.forEach(function (line) {
      if (c.measureText(line).width <= maxWidth) { out.push(line); return; }
      let cur2 = '';
      for (const ch of line) {
        if (c.measureText(cur2 + ch).width <= maxWidth) { cur2 += ch; continue; }
        out.push(cur2);
        cur2 = ch;
      }
      if (cur2) out.push(cur2);
    });
    return out;
  }

  function fitTileTitle(c, title, maxW, maxH) {
    const base = Math.round(TILE_TEX * 0.15);
    const min = Math.round(TILE_TEX * 0.08);
    let lines = [title];
    for (let size = base; size >= min; size -= 2) {
      c.font = '700 ' + size + 'px Inter, "Noto Sans SC", sans-serif';
      lines = wrapText(c, title, maxW).slice(0, 4);
      const lh = size * 1.22;
      if (lines.length > 0 && lines.length * lh <= maxH) {
        return { size: size, lines: lines, lh: lh };
      }
    }
    c.font = '700 ' + min + 'px Inter, "Noto Sans SC", sans-serif';
    return { size: min, lines: wrapText(c, title, maxW).slice(0, 4), lh: min * 1.22 };
  }

  // 每格单独一张画布，悬停时重绘出"霓虹增强"
  function paintTile(mesh, hover) {
    const ud = mesh.userData;
    const cv = ud.canvas;
    const w = cv.width;
    const h = cv.height;
    const ctx = cv.getContext('2d');
    const neon = ud.neon;

    ctx.clearRect(0, 0, w, h);

    const pad = w * 0.1;
    const radius = w * 0.1;

    // 暗色玻璃底
    roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, radius);
    ctx.fillStyle = hover ? 'rgba(24, 36, 72, 0.96)' : 'rgba(12, 18, 42, 0.92)';
    ctx.fill();

    const grad = ctx.createLinearGradient(pad, pad, w - pad, h - pad);
    grad.addColorStop(0, hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = grad;
    ctx.fill();

    // 霓虹描边 + 辉光
    ctx.save();
    ctx.shadowColor = neon;
    ctx.shadowBlur = hover ? 20 : 8;
    ctx.lineWidth = hover ? 3 : 1.5;
    ctx.strokeStyle = neon;
    roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, radius);
    ctx.stroke();
    ctx.restore();

    const inner = w - pad * 2;

    // 分类小标签（左上角，霓虹色）
    if (ud.post.categories && ud.post.categories.length) {
      ctx.font = '600 ' + Math.round(w * 0.072) + 'px Inter, "Noto Sans SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = hover ? '#ffffff' : neon;
      const label = ud.post.categories[0];
      if (ctx.measureText(label).width <= inner * 0.8) {
        ctx.fillText(label, pad + inner * 0.07, pad + inner * 0.13);
      }
      ctx.shadowBlur = 0;
    }

    // 标题（白色 + 阴影，最多 4 行）
    const maxW = inner * 0.84;
    const maxH = inner * 0.6;
    const st = fitTileTitle(ctx, ud.post.title, maxW, maxH);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = hover ? 9 : 5;
    ctx.fillStyle = '#ffffff';
    let ty = pad + inner * 0.56 - (st.lines.length - 1) * st.lh / 2;
    st.lines.forEach(function (ln, i) {
      ctx.fillText(ln, pad + inner * 0.5, ty + i * st.lh);
    });
    ctx.shadowBlur = 0;
  }

  const tiles = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      if (idx >= N) continue;
      const post = postData[idx];
      const canvas = document.createElement('canvas');
      canvas.width = TILE_TEX;
      canvas.height = TILE_TEX;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const mesh = new THREE.Mesh(makeTileGeometry(r, c), mat);
      mesh.userData = {
        post: post,
        neon: neonFor(post),
        canvas: canvas,
        normal: tileCenterNormal(r, c),
        phase: idx * 0.7,
        hoverAmt: 0
      };
      group.add(mesh);
      tiles.push(mesh);
      paintTile(mesh, false);
    }
  }

  /* --- 交互：悬停放大悬浮 / 点击 / 拖动 --- */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredTile = null;
  let pointerClientX = 0;
  let pointerClientY = 0;

  const tip = document.createElement('div');
  tip.className = 'hero-sphere__tip';
  tip.setAttribute('role', 'tooltip');
  container.appendChild(tip);

  function updatePointerFromEvent(e) {
    const rect = mount.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    pointerClientX = e.clientX;
    pointerClientY = e.clientY;
  }

  function setHoverTile(tile) {
    if (tile === hoveredTile) return;
    if (hoveredTile) {
      paintTile(hoveredTile, false);
      hoveredTile.material.map.needsUpdate = true;
    }
    hoveredTile = tile;
    if (tile) {
      paintTile(tile, true);
      tile.material.map.needsUpdate = true;
    }
  }

  function pick(e) {
    updatePointerFromEvent(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(tiles, false);
    const tile = hits.length ? hits[0].object : null;
    setHoverTile(tile);

    if (tile) {
      const cRect = container.getBoundingClientRect();
      tip.textContent = tile.userData.post.title;
      tip.style.left = (pointerClientX - cRect.left) + 'px';
      tip.style.top = (pointerClientY - cRect.top) + 'px';
      tip.style.opacity = '1';
      renderer.domElement.style.cursor = 'pointer';
    } else {
      tip.style.opacity = '0';
      renderer.domElement.style.cursor = 'grab';
    }
  }

  function pickLeave() {
    setHoverTile(null);
    tip.style.opacity = '0';
    renderer.domElement.style.cursor = 'grab';
  }

  const canvasEl = renderer.domElement;
  canvasEl.style.cursor = 'grab';
  canvasEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;

  canvasEl.addEventListener('pointerdown', function (e) {
    dragging = true;
    moved = false;
    lastX = e.clientX;
    lastY = e.clientY;
    try { canvasEl.setPointerCapture(e.pointerId); } catch (err) {}
  });

  canvasEl.addEventListener('pointermove', function (e) {
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      group.rotation.y += dx * 0.005;
      group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + dy * 0.003, -0.7, 0.7);
      lastX = e.clientX;
      lastY = e.clientY;
    } else {
      pick(e);
    }
  });

  canvasEl.addEventListener('pointerleave', function () {
    if (!dragging) pickLeave();
  });

  canvasEl.addEventListener('pointerup', function (e) {
    const wasDrag = moved;
    dragging = false;
    if (!wasDrag) {
      pick(e);
      if (hoveredTile && hoveredTile.userData.post.path) {
        window.location.href = hoveredTile.userData.post.path;
      }
    }
  });

  /* --- 动画循环 --- */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = performance.now();
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!dragging && !hoveredTile && !reduceMotion) {
      group.rotation.y += dt * 0.12;
    }
    group.position.y = reduceMotion ? 0 : Math.sin(t * 0.001) * 0.06;

    ring1.rotation.z += dt * 0.06;
    ring2.rotation.z -= dt * 0.05;
    starField.rotation.y += dt * 0.008;

    tiles.forEach(function (mesh) {
      const ud = mesh.userData;
      const target = (mesh === hoveredTile) ? 1 : 0;
      ud.hoverAmt += (target - ud.hoverAmt) * 0.12;

      const floatY = reduceMotion ? 0 : Math.sin(t * 0.0012 + ud.phase) * 0.025;
      const lift = ud.hoverAmt * 0.4;
      // 切片几何顶点本身已经位于 SPHERE_RADIUS 上；这里只叠加漂浮和悬停抬升。
      // 再加一次球体半径会把卡片推到约 2R，导致边缘卡片超出取景范围。
      mesh.position.copy(ud.normal).multiplyScalar(floatY + lift);
      mesh.scale.setScalar(1 + ud.hoverAmt * 0.12);
    });

    renderer.render(scene, camera);
  }

  animate();
  if (loading) loading.style.display = 'none';
  container.classList.add('hero-sphere--ready');

  /* --- 自适应窗口：沿用同一套取景逻辑 --- */
  window.addEventListener('resize', updateCamera);
})();
