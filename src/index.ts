/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
import * as BABYLON from 'babylonjs';
import * as ZapparBabylon from '@zappar/zappar-babylonjs';
import * as SnapshotManager from '@zappar/webgl-snapshot';
import beard from '../assets/beard.glb';
import helmet from '../assets/helmet.glb';
import 'babylonjs-loaders';
import './index.sass';

// The SDK is supported on many different browsers, but there are some that
// don't provide camera access. This function detects if the browser is supported
// For more information on support, check out the readme over at
// https://www.npmjs.com/package/@zappar/zappar-babylonjs
if (ZapparBabylon.browserIncompatible()) {
  // The browserIncompatibleUI() function shows a full-page dialog that informs the user
  // they're using an unsupported browser, and provides a button to 'copy' the current page
  // URL so they can 'paste' it into the address bar of a compatible alternative.
  ZapparBabylon.browserIncompatibleUI();

  // If the browser is not compatible, we can avoid setting up the rest of the page
  // so we throw an exception here.
  throw new Error('Unsupported browser');
}

// Setup BabylonJS in the usual way
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
});

export const scene = new BABYLON.Scene(engine);
// eslint-disable-next-line no-unused-vars
const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

// Setup a Zappar camera instead of one of Babylon's cameras
export const camera = new ZapparBabylon.Camera('ZapparCamera', scene);

// Request the necessary permission from the user
ZapparBabylon.permissionRequestUI().then((granted) => {
  if (granted) camera.start(true);
  else ZapparBabylon.permissionDeniedUI();
});

const faceTracker = new ZapparBabylon.FaceTrackerLoader().load();
const trackerTransformNode = new ZapparBabylon.FaceTrackerTransformNode('tracker', camera, faceTracker, scene);

trackerTransformNode.setEnabled(false);
faceTracker.onVisible.bind(() => {
  trackerTransformNode.setEnabled(true);
});
faceTracker.onNotVisible.bind(() => {
  trackerTransformNode.setEnabled(false);
});

const headMaskMesh = new ZapparBabylon.HeadMaskMeshLoader('mask', scene).load();
headMaskMesh.parent = trackerTransformNode;
// headMaskMesh.material!.disableColorWrite = false;
BABYLON.SceneLoader.ImportMesh(null, '', beard, scene, (meshes) => {
  const mesh = meshes[0];
  mesh.rotationQuaternion = null;
  mesh.rotation.y = Math.PI;
  mesh.parent = trackerTransformNode;
  mesh.scaling = new BABYLON.Vector3(0.42, 0.42, 0.42);
  mesh.position = new BABYLON.Vector3(0, -0.45, -0.62);
});

BABYLON.SceneLoader.ImportMesh(null, '', helmet, scene, (meshes) => {
  const mesh = meshes[0];
  mesh.rotationQuaternion = null;
  mesh.rotation.y = Math.PI;
  mesh.parent = trackerTransformNode;
  mesh.scaling = new BABYLON.Vector3(0.07, 0.07, 0.1);
  mesh.position = new BABYLON.Vector3(0, -0.15, 0);
});

// Get a reference to the 'Snapshot' button so we can attach a 'click' listener
const btn = document.getElementById('snapshot') || document.createElement('div');

btn.addEventListener('click', () => {
  // Convert canvas data to url
  const url = canvas.toDataURL('image/jpeg', 0.8);

  // Take snapshot
  SnapshotManager.promptImage({
    data: url,
  });
});

window.addEventListener('resize', () => {
  engine.resize();
});

// Set up our render loop
engine.runRenderLoop(() => {
  headMaskMesh.updateFromFaceAnchorTransformNode(trackerTransformNode);
  camera.updateFrame();
  scene.render();
});
