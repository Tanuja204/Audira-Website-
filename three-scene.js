const THREE = window.THREE;
const canvas = document.querySelector("canvas.hero-model-canvas");
const card = document.querySelector(".hero-product-card");
const frame = document.querySelector(".hero-product-frame");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionEnabled = document.documentElement.dataset.motion
  ? document.documentElement.dataset.motion === "on"
  : !reducedMotion;

if (canvas && card && frame) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.12, 8.5);

    scene.add(new THREE.HemisphereLight(0xffe6ce, 0x171312, 2.2));

    const keyLight = new THREE.DirectionalLight(0xffd5aa, 3.6);
    keyLight.position.set(-3.5, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xc87945, 28, 12);
    rimLight.position.set(3.2, 1.3, 2.2);
    scene.add(rimLight);

    const model = new THREE.Group();
    scene.add(model);

    const bandMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x191817,
      roughness: 0.29,
      metalness: 0.25,
      clearcoat: 0.72,
      clearcoatRoughness: 0.24,
    });
    const copperMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb8794e,
      roughness: 0.24,
      metalness: 0.83,
      clearcoat: 0.8,
      clearcoatRoughness: 0.19,
    });
    const cushionMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111110,
      roughness: 0.78,
      metalness: 0.03,
    });

    const arcPoints = [
      new THREE.Vector3(-1.38, -0.75, 0),
      new THREE.Vector3(-1.42, 0.28, 0),
      new THREE.Vector3(-1.12, 1.23, 0),
      new THREE.Vector3(-0.54, 1.72, 0),
      new THREE.Vector3(0, 1.85, 0),
      new THREE.Vector3(0.54, 1.72, 0),
      new THREE.Vector3(1.12, 1.23, 0),
      new THREE.Vector3(1.42, 0.28, 0),
      new THREE.Vector3(1.38, -0.75, 0),
    ];
    const headbandCurve = new THREE.CatmullRomCurve3(arcPoints);
    model.add(new THREE.Mesh(new THREE.TubeGeometry(headbandCurve, 80, 0.135, 14, false), bandMaterial));

    const trimPoints = arcPoints.slice(1, -1).map((point) => new THREE.Vector3(point.x, point.y - 0.105, point.z + 0.018));
    const trimCurve = new THREE.CatmullRomCurve3(trimPoints);
    model.add(new THREE.Mesh(new THREE.TubeGeometry(trimCurve, 70, 0.027, 8, false), copperMaterial));

    const cupBase = new THREE.CylinderGeometry(0.58, 0.64, 0.34, 64, 1);
    const cupOuter = new THREE.CylinderGeometry(0.52, 0.56, 0.12, 64, 1);
    const cupFace = new THREE.CylinderGeometry(0.41, 0.47, 0.055, 64, 1);
    const cupInset = new THREE.CylinderGeometry(0.2, 0.2, 0.025, 48, 1);

    function orientFace(mesh, x, y, z) {
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(x, y, z);
      return mesh;
    }

    for (const side of [-1, 1]) {
      const cup = new THREE.Group();
      cup.position.set(side * 1.38, -0.76, 0);
      cup.rotation.y = side * -0.11;
      cup.rotation.z = side * 0.045;
      model.add(cup);

      const back = new THREE.Mesh(cupBase, bandMaterial);
      orientFace(back, 0, 0, 0);
      cup.add(back);

      const metal = new THREE.Mesh(cupOuter, copperMaterial);
      orientFace(metal, 0, 0, 0.19);
      cup.add(metal);

      const face = new THREE.Mesh(cupFace, bandMaterial);
      orientFace(face, 0, 0, 0.275);
      cup.add(face);

      const cushion = new THREE.Mesh(
        new THREE.TorusGeometry(0.435, 0.09, 14, 64),
        cushionMaterial,
      );
      cushion.position.z = 0.31;
      cup.add(cushion);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.027, 10, 64), copperMaterial);
      rim.position.z = 0.31;
      cup.add(rim);

      const medallion = new THREE.Mesh(cupInset, copperMaterial);
      orientFace(medallion, 0, 0, 0.317);
      cup.add(medallion);

      const hinge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.13, 32),
        copperMaterial,
      );
      hinge.position.set(-side * 0.04, 0.47, 0);
      cup.add(hinge);
    }

    function resize() {
      const bounds = frame.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / bounds.height;
      camera.updateProjectionMatrix();
    }

    let active = true;
    let pointerX = 0;
    let pointerY = 0;
    let animationFrame = 0;
    document.addEventListener("audira:motion", (event) => {
      motionEnabled = event.detail.enabled;
      if (!motionEnabled) {
        pointerX = 0;
        pointerY = 0;
        model.rotation.set(0, 0, 0);
        model.position.y = 0;
      }
      if (active && !document.hidden && !animationFrame) animationFrame = requestAnimationFrame(render);
    });
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) {
        resize();
        if (motionEnabled && !animationFrame && !document.hidden) animationFrame = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    });
    observer.observe(card);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(frame);
    resize();

    card.addEventListener("pointermove", (event) => {
      if (!motionEnabled) return;
      const bounds = card.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.5;
      pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.34;
      if (!animationFrame && active) animationFrame = requestAnimationFrame(render);
    });
    card.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
    });

    function render(time = 0) {
      animationFrame = 0;
      if (!active) return;
      model.rotation.y += ((pointerX + (motionEnabled ? Math.sin(time * 0.00032) * 0.07 : 0)) - model.rotation.y) * 0.035;
      model.rotation.x += ((motionEnabled ? pointerY : 0) - model.rotation.x) * 0.035;
      model.position.y = motionEnabled ? Math.sin(time * 0.00055) * 0.045 : 0;
      renderer.render(scene, camera);
      if (motionEnabled && !document.hidden) {
        animationFrame = requestAnimationFrame(render);
      }
      card.classList.add("has-3d");
    }

    renderer.render(scene, camera);
    card.classList.add("has-3d");
    if (motionEnabled && !document.hidden) animationFrame = requestAnimationFrame(render);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else if (active && motionEnabled && !animationFrame) {
        animationFrame = requestAnimationFrame(render);
      }
    });
    window.addEventListener("pagehide", () => {
      observer.disconnect();
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrame);
      renderer.dispose();
    }, { once: true });
  } catch (error) {
    console.error("AUDIRA 3D product scene could not be initialized.", error);
  }
}
