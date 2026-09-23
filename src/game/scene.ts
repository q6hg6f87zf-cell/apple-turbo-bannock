import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  BUILDINGS,
  SITES,
  findPath,
  walkable,
  type Point,
  type SiteId,
} from "./world";
import { objective, enemyTurn, type Save, type Outcome } from "./engine";

export class IroncladScene {
  private renderer: T.WebGLRenderer;
  private scene = new T.Scene();
  private camera = new T.PerspectiveCamera(38, 1, 0.1, 160);
  private player = new T.Group();
  private robot = new T.Group();
  private gun = new T.Group();
  private plates = new T.Group();
  private enemies = new Map<string, T.Group>();
  private markers = new Map<SiteId, T.Group>();
  private lamps: T.Mesh[] = [];
  private ray = new T.Raycaster();
  private ground = new T.Plane(new T.Vector3(0, 1, 0), 0);
  private path: Point[] = [];
  private destination: SiteId | null = null;
  private frame = 0;
  private previous = 0;
  private time = 0;
  private keys = new Set<string>();
  private observer: ResizeObserver;
  private state: Save;
  private paused = false;
  private attackTime = 0;
  private hitTime = 0;
  private struckEnemy: T.Group | null = null;
  private labels: { sprite: T.Sprite; life: number }[] = [];
  private enemyRing = new T.Mesh(
    new T.RingGeometry(0.7, 0.78, 32),
    new T.MeshBasicMaterial({
      color: "#e8bb78",
      side: T.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  );
  private beam: T.Mesh;
  private ring: T.Mesh;
  private moving = false;
  private materials = new Map<string, T.MeshStandardMaterial>();
  private staticBoxes = new Map<string, T.BufferGeometry[]>();
  private reduced = false;
  private focus = new T.Vector3();
  private temp = new T.Vector3();
  private aim = new T.Vector3();
  private pointerStart = { x: 0, y: 0 };
  constructor(
    private host: HTMLElement,
    state: Save,
    private arrive: (position: Point, id: SiteId | null) => void,
    private error: (s: string) => void,
  ) {
    this.state = state;
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.setClearColor("#1b2929");
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Ironclad. Tap the street to move, or use the destination buttons. Arrow keys and WASD also move.",
    );
    this.renderer.domElement.setAttribute("role", "img");
    this.host.append(this.renderer.domElement);
    this.scene.fog = new T.FogExp2("#243230", 0.018);
    this.scene.add(new T.HemisphereLight("#d5e4dc", "#3b3028", 2.3));
    const sun = new T.DirectionalLight("#ffdc9d", 4);
    sun.position.set(-15, 25, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -30,
      right: 30,
      top: 30,
      bottom: -30,
      near: 1,
      far: 75,
    });
    sun.shadow.bias = -0.001;
    this.scene.add(sun);
    this.buildWorld();
    this.player = this.human(false);
    this.player.position.set(state.position.x, 0, state.position.z);
    this.scene.add(this.player);
    this.robot = this.tyrone();
    this.robot.position.set(2, 0, 11);
    this.scene.add(this.robot);
    for (const id of ["scout", "warden"]) {
      const site = SITES.find((s) => s.id === id)!;
      const enemy = this.human(true);
      enemy.position.set(site.x, 0, site.z);
      if (id === "warden") enemy.scale.setScalar(1.5);
      this.scene.add(enemy);
      this.enemies.set(id, enemy);
    }
    this.beam = new T.Mesh(
      new T.BoxGeometry(0.07, 0.07, 1),
      new T.MeshBasicMaterial({ color: "#9dfaf1" }),
    );
    this.beam.visible = false;
    this.scene.add(this.beam);
    this.ring = new T.Mesh(
      new T.RingGeometry(0.4, 0.48, 40),
      new T.MeshBasicMaterial({
        color: "#e9c185",
        side: T.DoubleSide,
        transparent: true,
        opacity: 0.85,
      }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.04;
    this.ring.visible = false;
    this.scene.add(this.ring);
    this.enemyRing.rotation.x = -Math.PI / 2;
    this.enemyRing.visible = false;
    this.scene.add(this.enemyRing);
    this.focus.copy(this.player.position);
    this.update(state);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.renderer.domElement.addEventListener("pointerdown", this.pointerDown);
    this.renderer.domElement.addEventListener("pointerup", this.pointerUp);
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
    window.addEventListener("blur", this.blur);
    document.addEventListener("visibilitychange", this.visibility);
    this.frame = requestAnimationFrame(this.loop);
  }
  private mat(color: string, glow = false) {
    const key = color + glow;
    if (!this.materials.has(key))
      this.materials.set(
        key,
        new T.MeshStandardMaterial({
          color,
          roughness: 0.85,
          metalness: 0.15,
          emissive: glow ? color : "#000000",
          emissiveIntensity: glow ? 1.7 : 0,
        }),
      );
    return this.materials.get(key)!;
  }
  private box(
    parent: T.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    glow = false,
  ) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), this.mat(color, glow));
    m.position.set(x, y, z);
    m.castShadow = !glow;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  private staticBox(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
  ) {
    const g = new T.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    const list = this.staticBoxes.get(color) ?? [];
    list.push(g);
    this.staticBoxes.set(color, list);
  }
  private label(text: string, color = "#edd8ac", width = 5) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 80;
    const c = canvas.getContext("2d")!;
    c.fillStyle = "#101b19dd";
    c.fillRect(0, 0, 512, 80);
    c.strokeStyle = color;
    c.strokeRect(1, 1, 510, 78);
    c.font = "600 25px monospace";
    c.fillStyle = color;
    c.textAlign = "center";
    c.fillText(text, 256, 49);
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    const sprite = new T.Sprite(
      new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true }),
    );
    sprite.scale.set(width, (width * 80) / 512, 1);
    return sprite;
  }
  private buildWorld() {
    this.staticBox(0, -0.35, -2, 34, 0.6, 43, "#303b35");
    this.staticBox(0, -0.03, -2, 10, 0.12, 39, "#494b40");
    for (let z = -19; z < 17; z += 2) {
      this.staticBox(-4.9, 0.06, z, 0.28, 0.17, 1.8, "#87806a");
      this.staticBox(4.9, 0.06, z, 0.28, 0.17, 1.8, "#87806a");
      this.staticBox(-1, 0.06, z, 0.12, 0.08, 1.9, "#a49a7d");
      this.staticBox(1, 0.06, z, 0.12, 0.08, 1.9, "#a49a7d");
      this.staticBox(0, 0.015, z, 2.6, 0.07, 0.22, "#262d29");
    }
    for (const b of BUILDINGS) {
      this.staticBox(b.x, b.h / 2, b.z, b.w, b.h, b.d, "#39443c");
      this.staticBox(b.x, b.h, b.z, b.w + 0.3, 0.25, b.d + 0.3, "#727762");
      this.staticBox(b.x, 0.45, b.z, b.w + 0.4, 0.9, b.d + 0.4, "#626651");
      const front = b.x < 0 ? b.x + b.w / 2 : b.x - b.w / 2;
      for (let z = b.z - b.d / 2 + 0.7; z < b.z + b.d / 2; z += 1.5) {
        this.staticBox(front, 2.6, z, 0.12, 1.25, 0.85, "#26342f");
        this.staticBox(
          front + (b.x < 0 ? 0.09 : -0.09),
          2.6,
          z,
          0.07,
          0.75,
          0.57,
          "#bf9e64",
        );
      }
      for (let x = b.x - b.w / 2 + 0.1; x < b.x + b.w / 2; x += 1.3)
        this.staticBox(
          x,
          b.h / 2,
          b.z + b.d / 2 + 0.05,
          0.08,
          b.h,
          0.1,
          "#717564",
        );
      this.staticBox(b.x, b.h + 0.5, b.z, 1.7, 1, 1.5, "#454f45");
      this.staticBox(b.x - 1.5, b.h + 1.5, b.z - 1, 0.5, 3, 0.5, "#566458");
      const sign = this.label(b.label, "#d6ba83", 4.4);
      sign.position.set(b.x, b.h + 1, b.z + 1);
      this.scene.add(sign);
    }
    // Workshop awning and lit entrance.
    this.staticBox(-5.2, 2.4, -5, 2.5, 0.15, 3.5, "#986f42");
    for (const z of [-6.5, -3.5])
      this.staticBox(-4.1, 1.1, z, 0.1, 2.2, 0.1, "#ad9567");
    // Heavy gate, upper gantry and repeated support ribs.
    for (const x of [-5, 5]) this.staticBox(x, 3, -20, 2, 6, 2, "#606654");
    this.staticBox(0, 6, -20, 12, 1.2, 2, "#606654");
    for (let x = -4; x <= 4; x += 1.3)
      this.staticBox(x, 6.9, -20, 0.15, 0.7, 1.7, "#a58e64");
    const gateSign = this.label("IRONCLAD / NORTH GATE", "#e8c591", 6);
    gateSign.position.set(0, 7.4, -20);
    this.scene.add(gateSign);
    for (let z = -16; z < 15; z += 8)
      for (const x of [-4.6, 4.6]) {
        this.staticBox(x, 1.9, z, 0.12, 3.8, 0.12, "#272f2a");
        const bulb = this.box(
          this.scene,
          x,
          3.8,
          z,
          0.3,
          0.35,
          0.3,
          "#edb56b",
          true,
        );
        this.lamps.push(bulb);
      }
    for (const p of [
      { x: -4, z: 7 },
      { x: 3.7, z: 6 },
      { x: -3.9, z: -12 },
    ]) {
      this.staticBox(p.x, 0.4, p.z, 0.9, 0.8, 0.8, "#7e7052");
      this.staticBox(p.x, 0.7, p.z, 1, 0.1, 0.9, "#b29865");
    }
    this.staticBox(4, 1, -10, 0.8, 2, 0.6, "#51695f");
    this.staticBox(4, 2.8, -10, 0.07, 2, 0.07, "#bdc4a2");
    for (let i = 0; i < 55; i++) {
      const x = Math.sin(i * 78.1) * 12,
        z = Math.cos(i * 22.4) * 18;
      if (Math.abs(x) > 5)
        this.staticBox(x, 0.08, z, 0.2 + (i % 3) * 0.13, 0.16, 0.23, "#78806a");
    }
    for (const [color, geoms] of this.staticBoxes) {
      const merged = mergeGeometries(geoms);
      const mesh = new T.Mesh(merged, this.mat(color));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      geoms.forEach((g) => g.dispose());
    }
    this.staticBoxes.clear();
    for (const site of SITES) {
      const group = new T.Group();
      group.position.set(site.x, 0, site.z);
      group.userData.site = site.id;
      const marker = new T.Mesh(
        new T.OctahedronGeometry(0.19),
        new T.MeshBasicMaterial({ color: site.color }),
      );
      marker.position.y = 2.8;
      group.add(marker);
      const text = this.label(site.name.toUpperCase(), site.color, 3.5);
      text.position.y = 3.3;
      group.add(text);
      this.scene.add(group);
      this.markers.set(site.id, group);
    }
  }
  private human(enemy: boolean) {
    const g = new T.Group();
    const body = enemy ? "#727968" : "#2d3b3b";
    this.box(g, 0, 1, 0, 0.52, 0.7, 0.32, body);
    this.box(g, 0, 0.65, 0, 0.6, 0.22, 0.4, enemy ? "#414a3e" : "#654f39");
    this.box(g, 0, 1.55, 0, 0.32, 0.34, 0.32, enemy ? "#899584" : "#b3946e");
    this.box(g, 0, 1.74, 0, 0.42, 0.1, 0.39, "#25322e");
    this.box(
      g,
      0,
      1.57,
      0.18,
      0.28,
      0.055,
      0.035,
      enemy ? "#f88966" : "#ced3b2",
      enemy,
    );
    this.box(g, -0.16, 0.31, 0, 0.2, 0.6, 0.23, "#26302d");
    this.box(g, 0.16, 0.31, 0, 0.2, 0.6, 0.23, "#26302d");
    this.box(g, -0.16, 0.07, 0.07, 0.24, 0.14, 0.4, "#141f1c");
    this.box(g, 0.16, 0.07, 0.07, 0.24, 0.14, 0.4, "#141f1c");
    this.box(g, -0.37, 1, 0, 0.2, 0.6, 0.24, body);
    this.box(g, 0.37, 1, 0.15, 0.2, 0.55, 0.24, body);
    if (!enemy) {
      this.box(g, 0, 1.32, 0.18, 0.56, 0.15, 0.08, "#c68d4e");
      this.box(g, -0.2, 1.03, 0.21, 0.12, 0.5, 0.06, "#c68d4e");
      this.box(g, 0, 1, -0.26, 0.4, 0.5, 0.22, "#726949");
      const rifle = new T.Group();
      rifle.position.set(0.36, 0.91, 0.35);
      g.add(rifle);
      this.box(rifle, 0, 0, 0.05, 0.13, 0.17, 0.75, "#303a33");
      this.box(rifle, 0, 0, -0.35, 0.18, 0.21, 0.24, "#96734b");
      this.box(rifle, 0, 0, 0.58, 0.08, 0.09, 0.37, "#9eaa93");
      this.gun = new T.Group();
      rifle.add(this.gun);
      for (let z = 0; z < 0.5; z += 0.13)
        this.box(this.gun, 0, 0.03, z, 0.22, 0.2, 0.065, "#70d9cd", true);
      this.box(this.gun, 0, 0.17, 0.12, 0.12, 0.14, 0.25, "#a7c6ad");
      this.plates = new T.Group();
      g.add(this.plates);
      this.box(this.plates, -0.37, 1.26, 0, 0.3, 0.24, 0.44, "#beaa78");
      this.box(this.plates, 0.37, 1.26, 0, 0.3, 0.24, 0.44, "#beaa78");
      this.box(this.plates, 0, 1.03, 0.21, 0.38, 0.4, 0.12, "#899984");
    } else {
      this.box(g, 0.38, 0.99, 0.5, 0.19, 0.21, 1, "#303c34");
      this.box(g, -0.38, 1.28, 0, 0.33, 0.25, 0.5, "#9b9b75");
      this.box(g, 0.38, 1.28, 0, 0.33, 0.25, 0.5, "#9b9b75");
    }
    return g;
  }
  private tyrone() {
    const g = new T.Group();
    const wheel = new T.Mesh(
      new T.CylinderGeometry(0.31, 0.31, 0.26, 16),
      this.mat("#171f1b"),
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.y = 0.33;
    g.add(wheel);
    this.box(g, 0, 0.72, 0, 0.15, 0.4, 0.17, "#777e69");
    this.box(g, 0, 1.03, 0, 0.64, 0.55, 0.43, "#9f8c61");
    this.box(g, 0, 1.48, 0, 0.64, 0.43, 0.48, "#807d59");
    this.box(g, 0, 1.49, 0.25, 0.51, 0.3, 0.04, "#182e25");
    this.box(g, 0, 1.49, 0.28, 0.32, 0.055, 0.02, "#82d6aa", true);
    this.box(g, 0, 1.4, 0.28, 0.2, 0.03, 0.02, "#82d6aa", true);
    this.box(g, -0.46, 1.05, 0, 0.2, 0.15, 0.2, "#7d836a");
    this.box(g, 0.46, 1.05, 0, 0.2, 0.15, 0.2, "#7d836a");
    this.box(g, -0.56, 0.88, 0.08, 0.12, 0.4, 0.12, "#a5986c");
    this.box(g, 0.56, 0.88, 0.08, 0.12, 0.4, 0.12, "#a5986c");
    this.box(g, 0.2, 1.85, 0, 0.04, 0.4, 0.04, "#b4ad7b");
    return g;
  }
  update(s: Save) {
    const prev = this.state;
    this.state = s;
    this.reduced = s.settings.reducedMotion;
    this.gun.visible = s.coil;
    this.plates.visible = s.armour;
    this.enemies.get("scout")!.visible = ["wake", "patrol"].includes(s.stage);
    this.enemies.get("warden")!.visible = !["decision", "complete"].includes(
      s.stage,
    );
    const target = objective(s).target;
    for (const [id, m] of this.markers) {
      m.children[1].visible = id === target;
      m.visible =
        !(id === "cache" && s.cache) &&
        !(id === "scout" && !["wake", "patrol"].includes(s.stage)) &&
        !(id === "warden" && ["decision", "complete"].includes(s.stage));
    }
    if (s.ending === "broadcast")
      for (const lamp of this.lamps) lamp.material = this.mat("#76d4cc", true);
    if (prev.battle && !s.battle && s.position.z === 12) {
      this.path = [];
      this.destination = null;
      this.player.position.set(s.position.x, 0, s.position.z);
      this.focus.copy(this.player.position);
    }
    this.enemyRing.visible = !!s.battle;
    if (s.battle) {
      const telegraph = enemyTurn(s.battle);
      const target = this.enemies.get(s.battle.enemy)!;
      this.enemyRing.position.set(target.position.x, 0.09, target.position.z);
      this.enemyRing.scale.setScalar(s.battle.enemy === "warden" ? 1.5 : 1);
      this.enemyRing.material.color.set(
        telegraph.incoming ? "#fa8268" : "#79e6cf",
      );
      this.path = [];
      this.destination = null;
      const e = this.enemies.get(s.battle.enemy)!;
      this.player.lookAt(e.position);
      e.lookAt(this.player.position);
    }
  }
  setPaused(v: boolean) {
    this.paused = v;
    this.keys.clear();
  }
  travel(id: SiteId) {
    if (this.state.battle || this.paused) return;
    const site = SITES.find((p) => p.id === id)!;
    const approach = id === "scout" || id === "warden" ? 2 : 1;
    this.moveTo({ x: site.x, z: site.z + approach }, id);
  }
  private moveTo(p: Point, id: SiteId | null) {
    if (!walkable(p)) return;
    this.path = findPath(this.player.position, p);
    this.destination = id;
    this.ring.position.set(p.x, 0.06, p.z);
    this.ring.visible = true;
    if (!this.path.length) {
      this.destination = null;
      this.arrive({ x: this.player.position.x, z: this.player.position.z }, id);
    }
  }
  private floatText(text: string, at: T.Vector3, color: string) {
    const sprite = this.label(text, color, 3.8);
    sprite.position.copy(at);
    sprite.position.y += 2.8;
    this.scene.add(sprite);
    this.labels.push({ sprite, life: 1.4 });
  }
  flash(out: Outcome) {
    this.hitTime = 0.32;
    if (out.incoming)
      this.floatText(
        `−${out.incoming} HEALTH`,
        this.player.position,
        "#ffa38b",
      );
    else if (out.kind === "guard")
      this.floatText("BRACED", this.player.position, "#dce6bb");
    if (out.kind === "upgrade")
      this.floatText("GEAR UPGRADED", this.player.position, "#8ff1d4");
    if (out.kind === "heal")
      this.floatText("MEDKIT", this.player.position, "#8ff1d4");
    if (out.damage) {
      this.attackTime = 0.32;
      const e = this.enemies.get(
        this.state.battle?.enemy ??
          (this.state.stage === "decision" ? "warden" : "scout"),
      )!;
      this.struckEnemy = e;
      this.floatText(
        `−${out.damage}${out.text.includes("INTERRUPTED") ? " / INTERRUPTED" : ""}`,
        e.position,
        "#f1cc8b",
      );
      this.temp.copy(this.player.position).add(new T.Vector3(0.2, 1, 0));
      this.aim.copy(e.position).add(new T.Vector3(0, 1, 0));
      this.beam.position.copy(this.temp).lerp(this.aim, 0.5);
      this.beam.scale.z = this.temp.distanceTo(this.aim);
      this.beam.lookAt(this.aim);
      this.beam.visible = true;
    }
  }
  private resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  private pointerDown = (e: PointerEvent) => {
    this.pointerStart = { x: e.clientX, y: e.clientY };
  };
  private pointerUp = (e: PointerEvent) => {
    if (
      this.paused ||
      this.state.battle ||
      Math.hypot(
        e.clientX - this.pointerStart.x,
        e.clientY - this.pointerStart.y,
      ) > 15
    )
      return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(
      new T.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    const hit = this.ray.intersectObjects([...this.markers.values()], true)[0];
    if (hit) {
      let obj: T.Object3D | null = hit.object;
      while (obj && !obj.userData.site) obj = obj.parent;
      if (obj) {
        this.travel(obj.userData.site);
        return;
      }
    }
    if (this.ray.ray.intersectPlane(this.ground, this.temp))
      this.moveTo(
        { x: Math.round(this.temp.x), z: Math.round(this.temp.z) },
        null,
      );
  };
  private keyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.closest("input,textarea,dialog")) return;
    if (
      [
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(e.code)
    ) {
      e.preventDefault();
      this.keys.add(e.code);
    }
  };
  private keyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };
  private blur = () => {
    this.keys.clear();
  };
  private visibility = () => {
    this.keys.clear();
    this.previous = 0;
  };
  private contextLost = (e: Event) => {
    e.preventDefault();
    this.error(
      "The graphics session was interrupted. Your last completed action is saved. Reload to continue.",
    );
  };
  private loop = (now: number) => {
    this.frame = requestAnimationFrame(this.loop);
    const dt = this.previous ? Math.min((now - this.previous) / 1000, 0.25) : 0;
    this.previous = now;
    if (document.hidden) return;
    this.time += dt;
    if (!this.paused && !this.state.battle) {
      if (this.keys.size) {
        let x = 0,
          z = 0;
        if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) {
          x -= 0.857;
          z += 0.514;
        }
        if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) {
          x += 0.857;
          z -= 0.514;
        }
        if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) {
          x -= 0.514;
          z -= 0.857;
        }
        if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) {
          x += 0.514;
          z += 0.857;
        }
        const l = Math.hypot(x, z) || 1;
        const p = {
          x: this.player.position.x + (x / l) * dt * 4,
          z: this.player.position.z + (z / l) * dt * 4,
        };
        this.path = [];
        this.destination = null;
        if (walkable(p)) {
          this.player.lookAt(p.x, 0, p.z);
          this.player.position.set(p.x, 0, p.z);
          this.moving = true;
        }
      } else if (this.path.length) {
        // Consume distance across waypoints so travel speed does not depend on FPS.
        let remaining = dt * 5;
        this.moving = true;
        while (this.path.length && remaining > 0) {
          const p = this.path[0];
          const d = Math.hypot(
            p.x - this.player.position.x,
            p.z - this.player.position.z,
          );
          this.player.lookAt(p.x, 0, p.z);
          if (d <= remaining) {
            this.player.position.set(p.x, 0, p.z);
            remaining -= d;
            this.path.shift();
            if (!this.path.length) {
              const id = this.destination;
              this.destination = null;
              this.moving = false;
              this.ring.visible = false;
              this.arrive({ x: p.x, z: p.z }, id);
            }
          } else {
            this.player.position.x +=
              ((p.x - this.player.position.x) / d) * remaining;
            this.player.position.z +=
              ((p.z - this.player.position.z) / d) * remaining;
            remaining = 0;
          }
        }
      } else if (this.moving) {
        this.moving = false;
        this.arrive(
          { x: this.player.position.x, z: this.player.position.z },
          null,
        );
      }
    }
    const gait =
      this.moving && !this.paused && !this.reduced
        ? Math.sin(this.time * 11) * 0.16
        : 0;
    this.player.children[5].rotation.x = gait;
    this.player.children[6].rotation.x = -gait;
    this.player.children[7].position.z = 0.07 + gait * 0.3;
    this.player.children[8].position.z = 0.07 - gait * 0.3;
    this.player.position.y =
      this.moving && !this.paused && !this.reduced
        ? Math.abs(Math.sin(this.time * 11)) * 0.055
        : 0;
    if (this.state.stage !== "wake") {
      this.temp.set(
        this.player.position.x - 1.2,
        0,
        this.player.position.z + 1,
      );
      this.robot.position.lerp(this.temp, 1 - Math.exp(-dt * 4));
      this.robot.rotation.y = this.player.rotation.y;
    }
    if (!this.reduced) this.robot.rotation.z = Math.sin(this.time * 2) * 0.025;
    this.focus.lerp(this.player.position, 1 - Math.exp(-dt * 5));
    const distance = this.camera.aspect < 0.75 ? 1.35 : 1;
    this.camera.position.set(
      this.focus.x + 10 * distance,
      this.focus.y + 16 * distance,
      this.focus.z + 17 * distance,
    );
    this.camera.lookAt(this.focus.x, 0, this.focus.z - 2);
    if (!this.reduced)
      for (const m of this.markers.values())
        m.children[0].rotation.y = this.time * 0.8;
    for (let i = this.labels.length - 1; i >= 0; i--) {
      const label = this.labels[i];
      label.life -= dt;
      if (!this.reduced) label.sprite.position.y += dt * 0.6;
      label.sprite.material.opacity = Math.min(1, Math.max(0, label.life * 2));
      if (label.life <= 0) {
        this.scene.remove(label.sprite);
        label.sprite.material.map?.dispose();
        label.sprite.material.dispose();
        this.labels.splice(i, 1);
      }
    }
    this.hitTime = Math.max(0, this.hitTime - dt);
    if (this.struckEnemy)
      this.struckEnemy.rotation.z = !this.reduced
        ? Math.sin(this.hitTime * 25) * this.hitTime * 0.3
        : 0;
    this.gun.position.z = !this.reduced ? -this.hitTime * 0.16 : 0;
    this.attackTime = Math.max(0, this.attackTime - dt);
    this.beam.visible = this.attackTime > 0;
    this.renderer.render(this.scene, this.camera);
  };
  getPosition() {
    return { x: this.player.position.x, z: this.player.position.z };
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
    window.removeEventListener("blur", this.blur);
    document.removeEventListener("visibilitychange", this.visibility);
    this.renderer.domElement.removeEventListener(
      "pointerdown",
      this.pointerDown,
    );
    this.renderer.domElement.removeEventListener("pointerup", this.pointerUp);
    this.renderer.domElement.removeEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        if (
          !Array.isArray(o.material) &&
          o.material instanceof T.MeshBasicMaterial
        )
          o.material.dispose();
      }
      if (o instanceof T.Sprite) {
        o.material.map?.dispose();
        o.material.dispose();
      }
    });
    this.materials.forEach((m) => m.dispose());
    (this.beam.material as T.Material).dispose();
    (this.ring.material as T.Material).dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
