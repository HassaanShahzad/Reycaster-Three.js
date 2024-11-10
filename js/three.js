import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

let controls;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  2000
);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const colorPicker = document.createElement("input");
colorPicker.type = "color";
colorPicker.style.position = "absolute";
colorPicker.style.top = "10px";
colorPicker.style.left = "10px";
colorPicker.style.zIndex = "100";
document.body.appendChild(colorPicker);

let selectedColor = 0xff0000;
colorPicker.addEventListener("input", (event) => {
  selectedColor = parseInt(event.target.value.replace("#", "0x"));
});

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load("./model/bracelet.glb", function (gltf) {
  const model = gltf.scene;
  model.scale.set(0.9, 0.9, 0.9);
  model.position.set(2, 0, -55);

  model.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: "whitesmoke",
        roughness: 0.4,
        metalness: 0.3,
      });
      child.castShadow = true;
    }
  });

  scene.add(model);

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("./texture/floor1.jpeg");

  const planeGeometry = new THREE.PlaneGeometry(300, 300);
  const planeMaterial = new THREE.MeshStandardMaterial({ map: texture });
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

  planeMesh.position.set(0, -0.4, 0);
  planeMesh.rotation.set(-Math.PI / 2, 0, 0);
  planeMesh.receiveShadow = true;
  planeMesh.userData.isClickable = false;
  scene.add(planeMesh);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function onPointerClick(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
      const firstIntersected = intersects[0].object;

      if (firstIntersected.userData.isClickable !== false) {
        firstIntersected.traverse((child) => {
          if (child.isMesh) {
            child.material.color.setHex(selectedColor);
          }
        });
      }
    }
  }
  let env = new RGBELoader();

  env.load("./env.hdr", (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = environmentMap;
    scene.environment = environmentMap;
    scene.background = null;
  });

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("click", onPointerClick);

  function render() {
    raycaster.setFromCamera(pointer, camera);
    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
  }

  window.requestAnimationFrame(render);
});

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.position.set(-100, 50, 20);
directionalLight.castShadow = true;

directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.left = -150;
directionalLight.shadow.camera.right = 150;
directionalLight.shadow.camera.top = 150;
directionalLight.shadow.camera.bottom = -150;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 300;

scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

camera.position.set(5, 55, 10);

function animate() {
  renderer.render(scene, camera);
  controls.update();
}

window.addEventListener("resize", onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = false;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 20;
controls.maxDistance = 250;

animate();
