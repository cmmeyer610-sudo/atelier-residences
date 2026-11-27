import {warmShaders} from './shader-warmup.js';
import {createSpatialIndex} from './spatial-index.js';
import {createCommandPalette} from './command-palette.js';
import {createViewCube,axisCamera} from './view-cube.js';
import {createPhotoMode} from './photo-mode.js';
import {viewImages,stillCredit,previewCredit} from './image-policy.js';
import {createReviewUI} from './review-ui.js';
import {createStudio} from './studio.js';
import {applyLensShift} from './r3-state.js';
import {createExperience} from './experience.js';
import {nightScene} from './viewer-state.js';
import {createRenderLab} from './render-lab.js';
import {prepareRealism,applyRealism} from './realism-state.js';
import {createFinishStudio} from './finish-studio.js';
import {fetchJSONAsset,loadFailureMessage} from './load-errors.js';
import {initAssetStore,chunkedAsset,fetchAssetBytes,downloadChunkedAsset} from './asset-store.js';
import {versionModelAssets} from './cache-policy.js';
import {castsArchitecturalShadow,textureAnisotropyLimit} from './render-policy.js';
import {lightingProfile} from './lighting-profiles.js';
import {prepareAppearance,applyAppearance} from './appearance-state.js';
import * as THREE from './vendor/three/build/three.module.min.js';
import {OrbitControls} from './vendor/three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from './vendor/three/examples/jsm/environments/RoomEnvironment.js';
import {MeshoptDecoder} from './vendor/meshopt/meshopt_decoder.module.js';
import {FT,toWeb,sceneCategory,sceneLabel,sceneClips,categoryForTag,meshVisibility,adaptiveFov} from './scene-contract.js';

const $=id=>document.getElementById(id);
const escapeHTML=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 'grid':'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
 'settings':'M4 6h16M4 12h16M4 18h16M9 3v6m6 0v6m-5 0v6',
 'walk':'M13 4h.01m-4 6 3-3 4 4h3m-8-2-1 6-4 5m4-5 5 1 2 4',
 'focus':'M7 3H3v4m14-4h4v4M3 17v4h4m14-4v4h-4M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
 'measure':'M3 15 15 3l6 6L9 21zm5-5 2 2m1-5 2 2m1-5 2 2',
 'section':'M3 5h18v14H3zm9 0v14m4-12 3 3m-3 1 3 3m-3 1 2 2',
 'star':'m12 3 2.8 5.9 6.5 1-4.7 4.6 1.1 6.5-5.7-3.1-5.7 3.1 1.1-6.5-4.7-4.6 6.5-1z',
 'plan':'M4 3h16v18H4zm0 9h16m-8-9v9m3 0v9',
 'camera':'M3 8h4l2-3h6l2 3h4v12H3zm12 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
 'light':'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2m10-10 2-2',
 'help':'M9.1 9a3 3 0 1 1 5.1 2.1C13 12 12 12.5 12 15M12 18h.01',
 'close':'M6 6l12 12M6 18 18 6',
 'search':'M21 21l-5-5M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0',
 'download':'M12 3v12M7 10l5 5 5-5M4 15v5h16v-5',
 'orbit':'M19.5 6.5c3 3 1.5 8-3.5 11s-11 3-13 0S2 9.5 7 6.5s11-3 13 0M12 3v3m0 12v3M3 12h3m12 0h3',
 'pan':'M8 13V5a1.5 1.5 0 0 1 3 0v7-9a1.5 1.5 0 0 1 3 0v9-7a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7c0 4-3 7-7 7-2 0-4-1-5-3l-4-6a1.5 1.5 0 0 1 2-2z',
 'reset':'M3 10a9 9 0 1 1 2 8M3 4v6h6',
 'fit':'M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5M9 9h6v6H9z',
 'fullscreen':'M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5',
 'chevron-left':'m14 6-6 6 6 6',
 'chevron-right':'m10 6 6 6-6 6',
 'chevron-down':'m6 9 6 6 6-6',
 'play':'m8 5 11 7-11 7z',
 'pause':'M8 5v14M16 5v14',
 'layers':'m12 3 10 5-10 5L2 8zm-9 9 9 5 9-5M3 16l9 5 9-5',
 'mouse':'M12 3c-4 0-6 3-6 6v6a6 6 0 0 0 12 0V9c0-3-2-6-6-6M12 3v7',
 'link':'m10 13 4-4M8 15l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m4 2 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0',
 'arrow-up-right':'M6 18 18 6M6 6h12v12',
 'check':'m5 12 4 4 10-10',
 'info':'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 'area':'M4 4h16v16H4zM4 10h6V4M14 20v-6h6',
 'bed':'M3 18V9h18v9M3 15h18M5 9V5h14v4M3 18v3m18-3v3',
 'bath':'M3 12h18v3c0 3-3 5-9 5s-9-2-9-5zm2 0V5a3 3 0 0 1 6 0M5 20v2m14-2v2',
 'car':'m4 10 2-6h12l2 6M3 10h18v9H3zm3 9v2m12-2v2M6 14h2m8 0h2'
};
function icon(name,classes=''){const inner=(name==='help'?'<circle cx="12" cy="12" r="10"/>':'')+`<path d="${paths[name]||paths.layers}"/>`;return `<svg class="icon ${classes}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{if(el.querySelector(':scope > .icon'))return;el.insertAdjacentHTML('afterbegin',icon(el.dataset.icon));});}
hydrateIcons();

const state={catalog:null,model:null,pendingModel:null,scenes:[],activeIndex:0,filter:'all',search:'',meshes:[],root:null,loading:false,sequence:0,controller:null,camera:null,controls:null,navigation:'orbit',display:'materials',overrides:{site:null,roof:null,furniture:null,structure:null},cuts:true,auto:false,dirty:false,frame:0,lastTime:0,renderCount:0,webglError:null};
let renderer,world,sun,hemi,environment,buildingBox,pmrem,renderLab;
let viewMode="live",tourTimer=null,tourSequence=[],tourPosition=0;
let finishStudio,experience,studio,reviewUI,photoMode,viewCube,commandPalette;let capturingView=false,photoLock=null;
const spatialIndex=createSpatialIndex(()=>{state.lastDiagnostics=0;writeDiagnostics();});
let appearanceVariant=new URL(location.href).searchParams.get('look')==='baseline'?'baseline':'tuned';
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const clay=new THREE.MeshStandardMaterial({color:'#e8e4d8',roughness:0.85,metalness:0,side:THREE.DoubleSide});
const clayGlass=new THREE.MeshStandardMaterial({color:'#bdd1ca',transparent:true,opacity:0.22,roughness:.15,side:THREE.DoubleSide,depthWrite:false});
const wire=new THREE.MeshBasicMaterial({color:'#54724b',wireframe:true,transparent:true,opacity:.65});
const numberFormat=new Intl.NumberFormat('en-US');
const bytes=b=>b>=1024*1024?(b/1024/1024).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
function setupRenderer(){
  try{
    renderer=new THREE.WebGLRenderer({canvas:$('viewport'),antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.setClearColor('#e8ece4');
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
    world=new THREE.Scene();world.background=new THREE.Color('#e8ece4');
    hemi=new THREE.HemisphereLight('#fffdf5','#a4b399',1.8);world.add(hemi);
    sun=new THREE.DirectionalLight('#fff7e7',3);sun.castShadow=true;sun.shadow.mapSize.set(innerWidth>900?4096:2048,innerWidth>900?4096:2048);sun.shadow.bias=-.00022;sun.shadow.normalBias=.003;world.add(sun,sun.target);
    pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();environment=pmrem.fromScene(room,.04).texture;room.dispose();world.environment=environment;world.environmentIntensity=.75;
    renderLab=createRenderLab({renderer,world,sun,hemi,defaultEnvironment:environment,box:()=>buildingBox,render:requestRender,changed:()=>photoMode?.invalidate()});
    new ResizeObserver(resize).observe($('viewer-frame'));
    $('viewport').addEventListener('webglcontextlost',event=>{event.preventDefault();state.webglError='The graphics context was interrupted. Reload the model to continue.';showError(state.webglError,'3D graphics paused');});
    $('viewport').addEventListener('webglcontextrestored',()=>location.reload());
    return true;
  }catch(e){state.webglError='Interactive 3D requires WebGL 2. Try a current browser with hardware acceleration enabled, or use the model downloads.';return false;}
}
function createControls(){
  state.controls?.dispose();
  const c=new OrbitControls(state.camera,$('viewport'));c.enableDamping=true;c.dampingFactor=.11;c.minDistance=.12;c.maxDistance=400;c.minZoom=.08;c.maxZoom=80;c.maxPolarAngle=Math.PI-.001;c.screenSpacePanning=true;c.zoomSpeed=.8;c.panSpeed=.8;c.rotateSpeed=.6;c.autoRotate=state.auto;c.autoRotateSpeed=.7;
  c.mouseButtons.LEFT=state.navigation==='pan'?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;
  c.touches.ONE=state.navigation==='pan'?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE;
  c.addEventListener('change',()=>{photoMode?.motion();requestRender();});c.addEventListener('start',()=>renderLab?.movement(true));c.addEventListener('end',()=>renderLab?.movement(false));c.addEventListener('start',()=>{state.dirty=true;$('active-scene-note').textContent='Free orbit · reset to the saved camera';});
  state.controls=c;return c;
}
function resize(){
  if(!renderer)return;const {width,height}=$('viewer-frame').getBoundingClientRect();if(width<1||height<1)return;
  renderer.setSize(width,height,false);renderLab?.resize();updateProjection(width/height);requestRender();
}
function updateProjection(aspect){
  if(!state.camera)return;const scene=state.scenes[state.activeIndex];
  if(state.camera.isPerspectiveCamera){state.camera.aspect=aspect;state.camera.fov=state.camera.userData.customFov??adaptiveFov(scene?.fov||53,aspect);}
  else{const h=state.camera.userData.sourceHeight/Math.min(1,aspect);state.camera.left=-h*aspect/2;state.camera.right=h*aspect/2;state.camera.top=h/2;state.camera.bottom=-h/2;}
  state.camera.updateProjectionMatrix();studio?.projection(state.camera);
}
function requestRender(){if(state.warmingShaders||state.frame||!renderer||!state.camera||document.hidden||viewMode!=='live')return;state.frame=requestAnimationFrame(renderFrame);}
function renderFrame(time){
  state.frame=0;if(state.warmingShaders||document.hidden||viewMode!=='live')return;const delta=state.lastTime?Math.min((time-state.lastTime)/1000,.06):1/60;state.lastTime=time;
  const changed=!capturingView&&state.controls?.enabled?state.controls.update(delta):false;const walking=!capturingView&&experience?.tick(delta);renderLab?.frame(delta*1000,!!(changed||walking||studio?.playing||state.auto));if(changed&&state.dirty)renderLab?.refreshLights(state.camera);
  if(renderer&&state.camera&&world){if(viewMode==="live"){renderCurrent();finishPoster();state.renderCount++;}const d=state.camera.position.clone().sub(state.controls.target);$('compass-arrow').style.transform=`rotate(${Math.atan2(d.x,d.z)*180/Math.PI}deg)`;}
  viewCube?.update();if(changed||walking)photoMode?.motion();writeDiagnostics();experience?.afterRender();studio?.afterRender();if(state.auto||changed||walking)requestRender();
}
function writeDiagnostics(){
  const now=performance.now();if(now-(state.lastDiagnostics||0)<350)return;state.lastDiagnostics=now;const camera=state.camera,cuts=renderer?.clippingPlanes||[];const detail={model:state.model?.id,pending:state.pendingModel?.id,loading:state.loading,scene:state.scenes[state.activeIndex]?.name,sceneIndex:state.activeIndex,sceneCount:state.scenes.length,cameraType:camera?.type,cameraPosition:camera?.position.toArray(),target:state.controls?.target.toArray(),visibleMeshes:state.visibleMeshCount||0,totalMeshes:state.meshes.length,clippingPlanes:cuts.map(p=>({normal:p.normal.toArray(),constant:p.constant})),display:state.display,renderedTriangles:renderLab?.stats.lastTriangles||renderer?.info.render.triangles||0,renderCalls:renderLab?.stats.lastCalls||renderer?.info.render.calls||0,renderCount:state.renderCount,error:state.webglError,release:'5.0',shaderWarmup:state.shaderWarmup||'idle',picking:spatialIndex.stats,photo:photoMode?.stats,studio:{camera:studio?.cameraExtras(),navigationFloors:studio?.navigation?.floors.length||0,tour:studio?.tourStats},walking:experience?.walking,section:experience?.section,viewMode,renderLab:renderLab?.stats};
  $('viewer-diagnostics').value=JSON.stringify(detail);$('viewer-diagnostics').textContent=JSON.stringify(detail);$('viewer-diagnostics').dataset.model=state.model?.id||'';
}
function configureTextureFiltering(root){
 const limit=textureAnisotropyLimit(renderer?.capabilities.getMaxAnisotropy()),textures=new Set();
 root.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))for(const value of Object.values(m))if(value?.isTexture)textures.add(value);});
 for(const state of root.userData.appearanceStates||[])for(const variant of[state.original,state.tuned])for(const value of Object.values(variant))if(value?.isTexture)textures.add(value);
 for(const texture of textures){texture.anisotropy=limit;texture.needsUpdate=true;}
}
function annotateModel(root,model){
  const prefix=model.metadataPrefix;const walk=(o,parent={})=>{
    const u=o.userData||{},meta={tag:u[prefix+'_tag']??u.tag??parent.tag??'',owner:u[prefix+'_root_assembly']??u.root_assembly??parent.owner??o.name,defaultVisible:u[prefix+'_default_visible']??u.default_visible??parent.defaultVisible??true,details:u[prefix]??parent.details??{}};
    if(o.isMesh){o.userData.viewerMeta=meta;o.userData.originalMaterial=o.material;o.castShadow=(Array.isArray(o.material)?o.material:[o.material]).every(castsArchitecturalShadow);o.receiveShadow=true;state.meshes.push(o);}
    for(const child of o.children)walk(child,meta);
  };walk(root);
  root.updateMatrixWorld(true);buildingBox=new THREE.Box3();
  for(const m of state.meshes){const tag=m.userData.viewerMeta.tag;if(categoryForTag(tag,m.userData.viewerMeta.owner)!=='site'&&!/REFERENCE|HOLD.*NOT BASE|NOT installed/i.test(tag)){m.geometry.computeBoundingBox();const box=m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);buildingBox.union(box);}}
  if(buildingBox.isEmpty())buildingBox.setFromObject(root);
  const center=buildingBox.getCenter(new THREE.Vector3());const size=buildingBox.getSize(new THREE.Vector3());const span=Math.max(size.x,size.z,25);
  sun.target.position.copy(center);sun.position.copy(center).add(new THREE.Vector3(-span*.85,span*1.7,span*.85));const cam=sun.shadow.camera;cam.left=-span*.8;cam.right=span*.8;cam.top=span*.8;cam.bottom=-span*.8;cam.near=.1;cam.far=span*5;cam.updateProjectionMatrix();sun.shadow.needsUpdate=true;renderer.shadowMap.needsUpdate=true;
}
function applyLighting(category=sceneCategory(state.scenes[state.activeIndex]||{name:''})){
 if(!renderer||!world||!buildingBox)return;
 renderLab?.apply(category,state.scenes[state.activeIndex]||{},state.camera);photoMode?.invalidate();requestRender();
}
function renderCurrent(){studio?.projection(state.camera);if(renderLab)renderLab.render(state.camera);else renderer.render(world,state.camera);}
function refreshAppearance(){
 applyAppearance(state.root?.userData.appearanceStates,appearanceVariant);applyRealism(state.root?.userData.realismStates,appearanceVariant==='tuned');finishStudio?.reapply();applyLighting();updateLink();
 if(!state.root&&state.scenes.length)applyStaticScene(state.activeIndex);
}
function disposeRoot(root){
  if(!root)return;if(root===state.root){photoMode?.stop('Photo mode stopped because the model changed.');spatialIndex.detach();finishStudio?.detach();}const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);const m=o.userData.originalMaterial||o.material;(Array.isArray(m)?m:[m]).forEach(x=>materials.add(x));}});
  for(const m of materials)for(const v of Object.values(m))if(v?.isTexture)textures.add(v);
  for(const a of root.userData.appearanceStates||[])for(const variant of [a.original,a.tuned])for(const v of Object.values(variant))if(v?.isTexture)textures.add(v);
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures){t.dispose();const data=t.source?.data;if(data&&typeof data.close==='function')data.close();}
  root.removeFromParent();
}
function setPoster(model,sceneName){
 const image=model.renderImages?.[sceneName]||model.referenceImages?.[sceneName]||model.thumbnail;
 const current=!!model.renderImages?.[sceneName],exact=current||!!model.referenceImages?.[sceneName];
 const poster=$('loading-poster');poster.hidden=!image;poster.classList.remove('poster-done');
 if(image){poster.src=image;poster.alt='Saved view of '+model.name;}
 $('poster-credit').hidden=!image;$('poster-credit').textContent=(current?'Current design':exact?'Earlier design reference':'Saved model overview · different angle')+' · opening interactive model';
}
function finishPoster(){const p=$('loading-poster');if(p.hidden||p.classList.contains('poster-done'))return;p.classList.add('poster-done');$('poster-credit').hidden=true;setTimeout(()=>{if(p.classList.contains('poster-done'))p.hidden=true;},450);}
function notifyScene(){reviewUI?.refresh();document.dispatchEvent(new Event('atelier:scene'));}
function startLoading(model){
  setPoster(model,model.sourceScene||model.previewScene);
  state.warmingShaders=false;state.shaderWarmup='idle';state.loading=true;state.pendingModel=model;if(finishStudio){finishStudio.pause();$('finish-toggle').disabled=true;}$('loading-title').textContent=model.name;$('loading-detail').textContent='Loading 3D geometry and materials';$('loading-size').textContent=(model.glbBytes?bytes(model.glbBytes)+' · ':'')+'one residence loads at a time';$('loading-progress').style.width='3%';$('loading-overlay').style.backgroundImage=model.thumbnail?'linear-gradient(var(--loader-scrim),var(--loader-scrim)),url("'+model.thumbnail+'")':'';$('loading-overlay').style.backgroundSize='cover';$('loading-overlay').classList.remove('hidden');$('loading-overlay').setAttribute('aria-hidden','false');$('error-overlay').hidden=true;$('render-status').textContent='Loading '+model.name;writeDiagnostics();
}
function showError(message,title='The model couldn’t load'){
  state.loading=false;for(const id of ['orbit-mode','pan-mode','display-style','rotate-button','fit-view'])$(id).disabled=true;document.querySelector('.visibility-options').inert=true;$('retry-button').hidden=false;$('loading-overlay').classList.add('hidden');$('loading-overlay').setAttribute('aria-hidden','true');$('error-overlay').hidden=false;$('error-title').textContent=title;$('error-detail').textContent=message;let check=$('deployment-check-link');if(new URL(location.href).searchParams.get('debug')==='1'&&!check){check=document.createElement('a');check.id='deployment-check-link';check.href='deployment-check.html';check.textContent='Check deployment files';$('error-detail').after(check);}const m=state.pendingModel||state.model;$('error-image').hidden=!m?.thumbnail;if(m?.thumbnail)$('error-image').src=m.thumbnail;$('render-status').textContent='3D unavailable · see model files and notes';writeDiagnostics();
}
async function fetchModelBuffer(url,signal){return fetchAssetBytes(url,{signal,onProgress:(size,total,progress)=>{$('loading-progress').style.width=Math.min(80,3+(size/total)*77)+'%';$('loading-detail').textContent='Opening model · '+Math.min(100,Math.round(size/total*100))+'%'+(progress?.cachedBytes?' · '+bytes(progress.cachedBytes)+' reused':'');}});}
async function selectModel(model,desiredScene=null){
  $('scene-disclosure').hidden=true;
  if(!model)return;const requestedScene=desiredScene;desiredScene=desiredScene||model.sourceScene||null;let sceneList=null,parsedRoot=null;const sequence=++state.sequence;state.controller?.abort();state.controller=new AbortController();startLoading(model);stopTour();studio?.stop();renderLab?.detach();disposeRoot(state.root);state.root=null;state.meshes=[];state.auto=false;updateAutoButton();updateModelHeading(model);state.model=model;state.scenes=[];state.activeIndex=0;renderModels();renderSceneList();experience?.modelChanged();studio?.modelChanged();
  try{
    const scenes=await (model.scenes?Promise.resolve(model.scenes):fetchJSONAsset(model.scenesUrl,{signal:state.controller.signal,kind:'Saved scenes'}));sceneList=scenes;
    if(sequence!==state.sequence)return;
    state.scenes=scenes;state.activeIndex=Math.max(0,scenes.findIndex(s=>s.name===desiredScene||s.name.split(' ')[0]===desiredScene));setPoster(model,scenes[state.activeIndex]?.name);renderSceneList();experience?.availability();studio?.availability();
    const buffer=!renderer||!model.glbUrl||viewMode!=='live'?null:await fetchModelBuffer(model.glbUrl,state.controller.signal);
    if(sequence!==state.sequence)return;
    for(const saved of scenes)if(model.sceneCategories?.[saved.name])saved.viewerCategory=model.sceneCategories[saved.name];
    state.search='';state.filter='all';$('scene-search').value='';document.querySelectorAll('.scene-tab').forEach(b=>{b.classList.toggle('active',b.dataset.filter==='all');b.setAttribute('aria-pressed',String(b.dataset.filter==='all'));});
    if(!buffer){if(!requestedScene&&model.previewScene)desiredScene=model.previewScene;disposeRoot(state.root);state.root=null;state.meshes=[];state.model=model;state.pendingModel=null;state.scenes=scenes;state.activeIndex=Math.max(0,scenes.findIndex(s=>s.name===desiredScene||s.name.split(' ')[0]===desiredScene||sceneLabel(s)===desiredScene));state.loading=false;renderSceneList();renderModels();showError(model.glbUrl?state.webglError:'No browser preview is included for this model.',model.glbUrl?'3D graphics aren’t available':'Browser preview unavailable');if(scenes.length){applyStaticScene(state.activeIndex);setViewMode(viewMode==='reference'?'reference':'rendered',true);}else unavailableView();return;}
    $('loading-detail').textContent='Preparing materials and saved views';$('loading-progress').style.width='87%';
    const gltf=await loader.parseAsync(buffer,new URL('.',location.href).href);parsedRoot=gltf.scene;
    if(model.baselineMaterialsUrl){const baseline=await fetchJSONAsset(model.baselineMaterialsUrl,{signal:state.controller.signal,kind:'Original material states'});gltf.scene.userData.appearanceStates=await prepareAppearance(gltf,baseline);applyAppearance(gltf.scene.userData.appearanceStates,appearanceVariant);}
    if(sequence!==state.sequence){disposeRoot(gltf.scene);return;}
    disposeRoot(state.root);state.root=gltf.scene;parsedRoot=null;state.meshes=[];state.model=model;state.pendingModel=null;state.scenes=scenes;state.search='';state.filter='all';$('scene-search').value='';document.querySelectorAll('.scene-tab').forEach(b=>{b.classList.toggle('active',b.dataset.filter==='all');b.setAttribute('aria-pressed',String(b.dataset.filter==='all'));});
    state.root.userData.realismStates=prepareRealism(state.root);applyRealism(state.root.userData.realismStates,appearanceVariant==='tuned');annotateModel(state.root,model);renderLab?.attach(state.root);configureTextureFiltering(state.root);world.add(state.root);finishStudio?.attach(state.root,model);$('finish-toggle').disabled=false;
    const preferred=desiredScene||model.sourceScene;const index=preferred?scenes.findIndex(s=>s.name===preferred||s.name.split(' ')[0]===preferred||sceneLabel(s)===preferred):0;
    if(!state.scenes.length){state.scenes=defaultViews(buildingBox);model.sceneCount=state.scenes.length;$('scene-count').textContent=model.sceneCount;}state.loading=false;state.warmingShaders=true;state.webglError=null;for(const id of ['orbit-mode','pan-mode','display-style','rotate-button','fit-view'])$(id).disabled=false;document.querySelector('.visibility-options').inert=false;document.querySelector('.visibility-panel').hidden=false;$('viewport').setAttribute('aria-label','3D house model. Drag to orbit, scroll to zoom, and right-drag to pan.');applyScene(Math.max(0,index),false);renderModels();renderSceneList();resize();$('loading-detail').textContent='Warming up this view’s shaders';$('loading-progress').style.width='94%';state.shaderWarmup=await warmShaders(renderer,world,state.camera,()=>sequence===state.sequence);if(sequence!==state.sequence)return;state.warmingShaders=false;spatialIndex.attach(state.root);$('loading-progress').style.width='100%';$('loading-overlay').classList.add('hidden');$('loading-overlay').setAttribute('aria-hidden','true');updateStatus();updateDrawers();requestRender();
  }catch(error){if(parsedRoot)disposeRoot(parsedRoot);if(error.name==='AbortError'||sequence!==state.sequence)return;state.warmingShaders=false;console.error('Model load failed',error);state.model=model;state.pendingModel=null;disposeRoot(state.root);state.root=null;state.meshes=[];state.scenes=sceneList||[];state.activeIndex=0;renderModels();renderSceneList();showError(loadFailureMessage(error),error.status===404?'Deployment files are missing':'The model couldn’t load');if(state.scenes.length){applyStaticScene(0);setViewMode('rendered',true);toast('Saved images are available. Choose Live 3D to retry the model.');}}
}
function updateStatus(){if(!state.loading)$('render-status').textContent=state.model.name+' · '+bytes(state.model.glbBytes)+' web model';}
function updateModelHeading(model){
  $('model-title').textContent=model.name;$('type-badge').textContent=model.status||'Plan-derived model';
  const specs=[];specs.push(model.sceneCount+' perspectives',model.materialCount+' materials',model.lightCount?model.lightCount+' authored lights':'Emissive lighting');if(model.area)specs.push(icon('area')+numberFormat.format(model.area)+' ft²'+(model.residences===2?' / unit':''));if(model.beds)specs.push(icon('bed')+model.beds+' beds');if(model.baths)specs.push(icon('bath')+model.baths+' baths');if(model.cars)specs.push(icon('car')+model.cars+'-car garage');$('model-specs').innerHTML=specs.map(s=>'<span>'+s+'</span>').join('');
  $('model-scope').textContent=model.scope;$('builder-link').hidden=!model.sourceUrl;if(model.sourceUrl)$('builder-link').href=model.sourceUrl;$('scene-count').textContent=model.sceneCount;$('error-image').hidden=!model.thumbnail;if(model.thumbnail)$('error-image').src=model.thumbnail;
  document.title=model.name+' — ATELIER';$('project-number').textContent='NO. '+model.number;$('model-tagline').textContent=model.tagline.toUpperCase();
}
function renderModels(){
  if (!state.catalog) return;
  const query = $('model-search').value.toLowerCase().trim();
  const active = (state.pendingModel || state.model)?.id;
  const rows = state.catalog.models.filter(model =>
    [model.name, model.location, model.status, model.scope].join(' ').toLowerCase().includes(query));
  $('model-list').innerHTML = rows.map(model => {
    const selected = model.id === active;
    const name = escapeHTML(model.name);
    const location = escapeHTML(model.location || model.status || 'Residential model');
    const image = model.thumbnail
      ? `<img src="${escapeHTML(model.thumbnail)}" alt="" loading="lazy">`
      : icon('layers');
    return `<button class="model-card ${selected ? 'active' : ''}" data-model="${escapeHTML(model.id)}"
        aria-label="Open ${name} model" aria-current="${selected}">
      <span class="model-card-image">${image}</span>
      <span><strong class="model-card-title">${name}</strong><small class="model-card-sub">${location}</small></span>
    </button>`;
  }).join('') || '<p class="empty-list">No models match that search.</p>';
  $('model-list').querySelectorAll('[data-model]').forEach(button=>button.addEventListener('click',()=>{setDrawer('models',false);selectModel(state.catalog.models.find(m=>m.id===button.dataset.model));}));
}
function renderSceneList(){
 const filter=state.filter,query=state.search.toLowerCase().trim(),labels={exterior:'EXTERIOR VIEWS',interior:'ROOMS & SPACES',plans:'PLANS & SECTIONS',structure:'STRUCTURE'};let html='';
 for(const category of ['exterior','interior','plans','structure']){
  if(!['all','evening','favorites','details'].includes(filter)&&filter!==category&&!(filter==='plans'&&category==='structure'))continue;
  const rows=state.scenes.map((s,i)=>({s,i})).filter(({s})=>sceneCategory(s)===category&&s.name.toLowerCase().includes(query)&&(filter!=='evening'||nightScene(s))&&(filter!=='favorites'||experience?.isFavorite(s.name))&&(filter!=='details'||(s.revision==='R3'&&s.detail_focus)));
  if(!rows.length)continue;html+=`<h3 class="scene-group-title">${labels[category]}</h3>`;
  for(const {s,i}of rows){const active=i===state.activeIndex,image=state.model?.sceneThumbnails?.[s.name],star=experience?.isFavorite(s.name);html+=`<div class="scene-row"><button class="scene-card ${active?'active':''}" data-scene="${i}" aria-label="Scene ${escapeHTML(s.name)}" aria-current="${active?'true':'false'}">${image?`<img src="${escapeHTML(image)}" alt="" loading="lazy">`:`<span class="scene-number">${String(i+1).padStart(2,'0')}</span>`}<span><strong>${escapeHTML(sceneLabel(s))}</strong><small>${String(i+1).padStart(2,'0')} / ${s.perspective===false?'PARALLEL':'PERSPECTIVE'}${s.revision==='R3'&&s.detail_focus?' · NEW DETAIL':''}${image?' · '+previewCredit(state.model,s.name):''}${s.cut_axis||Number.isFinite(s.cut_ft)?' · CUT':''}</small></span></button><button class="favorite-scene" data-favorite="${i}" aria-label="Star ${escapeHTML(sceneLabel(s))}" aria-pressed="${!!star}">${star?'★':'☆'}</button></div>`;}
 }
 $('scene-list').innerHTML=html||`<p class="empty-list">${filter==='favorites'?'Star a perspective to build your own shortlist.':'No perspectives match. Try another space or filter.'}</p>`;
 $('scene-list').querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{stopTour();applyScene(Number(button.dataset.scene));if(innerWidth<=1000)setDrawer('scenes',false);}));
}
function applyScene(index,refresh=true){
  if(!state.scenes.length||state.loading)return;if(!state.root){applyStaticScene(index);setViewMode(viewMode,true);return;}state.activeIndex=(index+state.scenes.length)%state.scenes.length;const saved=state.scenes[state.activeIndex];state.overrides={site:null,roof:null,furniture:null,structure:null};state.cuts=true;state.dirty=false;state.auto=false;updateAutoButton();
  const eye=new THREE.Vector3(...toWeb(saved.eye_ft));const target=new THREE.Vector3(...toWeb(saved.target_ft));const rect=$('viewer-frame').getBoundingClientRect(),aspect=rect.width/rect.height;
  const camera=saved.perspective!==false?new THREE.PerspectiveCamera(adaptiveFov(saved.fov||53,aspect),aspect,.018,1500):new THREE.OrthographicCamera(-20,20,20,-20,.018,1500);
  const sourceUp=saved.up||[0,0,1];camera.up.set(sourceUp[0],sourceUp[2],sourceUp[1]).normalize();camera.position.copy(eye);camera.userData.sourceHeight=(saved.ortho_height_ft||80)*FT;
  if(camera.up.clone().cross(target.clone().sub(eye)).lengthSq()<1e-10)camera.up.set(0,0,-1);
  camera.lookAt(target);state.camera=camera;const c=createControls();c.target.copy(target);c.autoRotate=false;updateProjection(aspect);c.update();
  $('viewer-mode-label').textContent='INTERACTIVE 3D';document.querySelector('.view-compass').hidden=false;
  const category=sceneCategory(saved);applyLighting(category);$('exposure-adjust').disabled=false;$('look-reset').disabled=false;
  $('active-scene-name').textContent=sceneLabel(saved);$('active-scene-note').textContent=saved.generated?'Automatic overview · not a source camera':'Saved camera · free to explore';$('scene-category').textContent=({exterior:'EXTERIOR',interior:'ROOMS & SPACES',plans:'PLANS & SECTIONS',structure:'STRUCTURE'})[category];$('scene-index').textContent=String(state.activeIndex+1).padStart(2,'0')+' / '+state.scenes.length;$('projection-label').textContent=saved.perspective===false?'PARALLEL':'PERSPECTIVE';
  showSceneDisclosure(saved);updateVisibility();syncVisibilityInputs();finishStudio?.sceneChanged();if(refresh)renderSceneList();updateLink();setViewMode(viewMode,true);$('viewer-frame').classList.remove('scene-changing');void $('viewer-frame').offsetWidth;$('viewer-frame').classList.add('scene-changing');if(refresh)$('scene-list').querySelector('[aria-current=true]')?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});experience?.sceneChanged();studio?.sceneChanged();requestRender();
}
function showSceneDisclosure(scene){const note=state.model.sceneNotes?.[scene.name]||'';const el=$('scene-disclosure');el.hidden=!note;el.textContent=note;}
function applyStaticScene(index){
 state.activeIndex=(index+state.scenes.length)%state.scenes.length;
 const s=state.scenes[state.activeIndex],m=state.model,exact=m.sceneThumbnails?.[s.name],current=m.scenePreviewRevisions?.[s.name]==='R3',image=exact||m.thumbnail;
 $('error-overlay').dataset.fallback=image?'image':'text';$('error-image').hidden=!image;if(image)$('error-image').src=image;
 const label=exact?(current?'Current design image':'Earlier design reference'):'Current overview · different camera';
 $('error-title').textContent=label+' · '+sceneLabel(s);$('error-image').alt=label+' of '+m.name;
 $('error-detail').textContent=(exact&&!current?'This saved preview shows the previous model revision. ':!exact?'This current model overview uses a different camera. ':'Current supplied geometry review. ')+(renderer?'The interactive model is not loaded. Choose Live 3D to retry.':'Interactive exploration requires WebGL 2 and hardware acceleration.');
 $('active-scene-name').textContent=sceneLabel(s);$('active-scene-note').textContent=label;
 $('scene-index').textContent=String(state.activeIndex+1).padStart(2,'0')+' / '+state.scenes.length;
 $('scene-category').textContent=({exterior:'EXTERIOR',interior:'ROOMS & SPACES',plans:'PLANS & SECTIONS',structure:'STRUCTURE'})[sceneCategory(s)];
 $('render-status').textContent=label+' · live graphics unavailable';$('viewer-mode-label').textContent='SAVED PREVIEW';$('projection-label').textContent=exact?(s.perspective===false?'PARALLEL':'PERSPECTIVE'):'STATIC IMAGE';document.querySelector('.view-compass').hidden=true;
 for(const id of ['orbit-mode','pan-mode','display-style','rotate-button','fit-view','exposure-adjust','look-reset'])$(id).disabled=true;
 document.querySelector('.visibility-options').inert=true;document.querySelector('.visibility-panel').hidden=true;
 $('viewport').setAttribute('aria-label',label+'; live 3D is unavailable.');showSceneDisclosure(s);renderSceneList();updateLink();experience?.sceneChanged();studio?.sceneChanged();writeDiagnostics();
}

function updateVisibility(){
  if(!state.root)return;const saved=state.scenes[state.activeIndex];state.visibleMeshCount=0;for(const mesh of state.meshes){mesh.visible=meshVisibility(mesh.userData.viewerMeta,saved,state.overrides);if(mesh.visible)state.visibleMeshCount++;}
  renderer.clippingPlanes=[...(state.cuts?sceneClips(saved).map(p=>new THREE.Plane(new THREE.Vector3(...p.normal),p.constant)):[]),...(experience?.extraPlanes()||[])];
  renderer.shadowMap.needsUpdate=true;applyDisplay();photoMode?.invalidate();requestRender();
}
function syncVisibilityInputs(){
  const saved=state.scenes[state.activeIndex];for(const category of ['site','roof','furniture','structure']){
    const relevant=state.meshes.filter(m=>categoryForTag(m.userData.viewerMeta.tag,m.userData.viewerMeta.owner)===category);
    $('show-'+category).checked=relevant.some(m=>m.visible);$('show-'+category).disabled=!relevant.length;
  }
  const hasCut=sceneClips(saved).length>0;$('cut-plane-row').hidden=!hasCut;$('show-cut').checked=hasCut&&state.cuts;
}
function applyDisplay(){
  photoMode?.invalidate();
  if(!state.root)return;for(const mesh of state.meshes){const original=mesh.userData.originalMaterial;
    if(state.display==='materials')mesh.material=original;
    else if(state.display==='wireframe')mesh.material=wire;
    else{const materials=Array.isArray(original)?original:[original];mesh.material=materials.some(m=>m.transparent&&m.opacity<.6)?clayGlass:clay;}
  }
  requestRender();
}
function updateLink(){if(!state.model)return;const url=new URL(location.href);url.searchParams.set('model',state.model.id);url.searchParams.set('look',appearanceVariant);url.searchParams.set('view',viewMode);url.searchParams.set('scene',state.scenes[state.activeIndex]?.name.split(' ')[0]||'01');history.replaceState({},'',url);}
function setNavigation(mode){studio?.stop();experience?.releaseTool();state.navigation=mode;for(const v of ['orbit','pan']){$(v+'-mode').classList.toggle('active',v===mode);$(v+'-mode').setAttribute('aria-pressed',String(v===mode));}if(state.controls){state.controls.mouseButtons.LEFT=mode==='pan'?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;state.controls.touches.ONE=mode==='pan'?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE;}}
function updateAutoButton(){const b=$('rotate-button');b.setAttribute('aria-pressed',String(state.auto));b.innerHTML=icon(state.auto?'pause':'play')+(state.auto?'Pause orbit':'Auto orbit');if(state.controls)state.controls.autoRotate=state.auto;}
function fitBuilding(){
  if(!state.root||state.loading)return;applyScene(0);const size=buildingBox.getSize(new THREE.Vector3()),center=buildingBox.getCenter(new THREE.Vector3());center.y=Math.max(size.y*.3,center.y);const radius=Math.max(size.x,size.z,size.y)*.8;const aspect=$('viewer-frame').clientWidth/$('viewer-frame').clientHeight;
  if(!state.camera.isPerspectiveCamera){state.camera=new THREE.PerspectiveCamera(adaptiveFov(53,aspect),aspect,.018,1500);createControls();$('projection-label').textContent='PERSPECTIVE';}
  const distance=radius/Math.tan(THREE.MathUtils.degToRad(state.camera.fov*.5))*Math.max(1,1/aspect);
  state.camera.position.copy(center).add(new THREE.Vector3(-.5,.35,.9).normalize().multiplyScalar(distance));state.controls.target.copy(center);state.controls.update();state.dirty=true;$('active-scene-note').textContent='Fitted view · reset for the source camera';requestRender();
}
function setDrawer(which, open, restoreFocus = false) {
  const wasOpen = document.body.classList.contains(which + '-open');
  document.body.classList.toggle(which + '-open', open);
  if (open) document.body.classList.remove((which === 'models' ? 'scenes' : 'models') + '-open');
  updateDrawers();
  if (open && !wasOpen) $(which === 'models' ? 'model-search' : 'scene-search').focus({preventScroll: true});
  if (!open && wasOpen && restoreFocus) $(which === 'models' ? 'models-toggle' : 'scenes-toggle').focus({preventScroll: true});
}
function updateDrawers(){
  const body = document.body;
  if (innerWidth > 760) body.classList.remove('models-open');
  if (innerWidth > 1000) body.classList.remove('scenes-open');
  const modelsOpen = body.classList.contains('models-open');
  const scenesOpen = body.classList.contains('scenes-open');
  $('models-toggle').setAttribute('aria-expanded', String(modelsOpen));
  $('scenes-toggle').setAttribute('aria-expanded', String(scenesOpen));
  $('drawer-scrim').hidden = !modelsOpen && !scenesOpen;
  $('model-sidebar').inert = scenesOpen || (innerWidth <= 760 && !modelsOpen);
  $('scene-sidebar').inert = modelsOpen || (innerWidth <= 1000 && !scenesOpen);
  document.querySelector('.topbar').inert = !!photoLock || modelsOpen || scenesOpen;
  document.querySelector('.model-heading').inert = modelsOpen || scenesOpen;
  document.querySelector('.viewer-column').inert = modelsOpen || scenesOpen;
}
async function openDialog(id){studio?.stop();experience?.stopWalk();stopTour();if(document.fullscreenElement&&!document.fullscreenElement.contains($(id)))await document.exitFullscreen();setDrawer('models',false);setDrawer('scenes',false);$(id).showModal();}
function prepareDownloads(){
 const m=state.pendingModel||state.model;if(!m)return;$('downloads-title').textContent=m.name+' model files';
 $('download-list').innerHTML=m.files.length?m.files.map(f=>`<a class="download-row" href="${escapeHTML(f.href)}" ${f.external?'target="_blank" rel="noopener noreferrer"':'download'}><span class="file-kind">${escapeHTML(f.format||'FILE')}</span><span><strong>${escapeHTML(f.label)}</strong><small>${escapeHTML(f.description||'Included in this package')}</small></span><span class="file-size">${f.bytes?bytes(f.bytes):''}</span>${icon('download')}</a>`).join(''):'<p>No downloadable files are included for this model.</p>';openDialog('downloads-dialog');
}
function prepareNotes(){const m=state.pendingModel||state.model;if(!m)return;$('notes-title').textContent=m.name;$('notes-scope').textContent=m.scope;
 $('notes-options').innerHTML=[...(m.sources||[]).map(s=>'<li><strong>Source:</strong> '+(s.url?`<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.label)}</a>`:escapeHTML(s.label))+'</li>'),...(m.assumptions||m.selectedOptions||[]).map(s=>'<li>'+escapeHTML(s)+'</li>')].join('');document.querySelector('.dialog-links').hidden=true;openDialog('notes-dialog');}
function unavailableView(){
 $('active-scene-name').textContent='No saved camera supplied';$('active-scene-note').textContent='See model notes and available downloads';$('scene-index').textContent='0 / 0';$('scene-category').textContent='MODEL STATUS';$('viewer-mode-label').textContent='PREVIEW UNAVAILABLE';$('projection-label').textContent='';for(const id of ['orbit-mode','pan-mode','display-style','rotate-button','fit-view','exposure-adjust','look-reset'])$(id).disabled=true;document.querySelector('.visibility-panel').hidden=true;document.querySelector('.view-compass').hidden=true;updateLink();
}
function defaultViews(box){const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z)*1.8;return [['01 Front overview',[-.65,.45,1]],['02 Rear overview',[.65,.45,-1]],['03 Aerial overview',[.5,1,.5]],['04 Roof plan',[0,1,.00001]]].map(([name,v])=>({name,eye_ft:[(c.x+v[0]*d)/FT,(c.z+v[2]*d)/FT,(c.y+v[1]*d)/FT],target_ft:[c.x/FT,c.z/FT,c.y/FT],perspective:name!=='04 Roof plan',ortho_height_ft:d/FT,fov:53,generated:true}));}
function normalizeModel(raw){const m=versionModelAssets(raw);return {...m,scope:m.description||m.scope||'',glbUrl:m.glb||m.glbUrl,sceneCount:m.scenes?.length||m.sceneCount||0,scenes:m.scenes||(!m.scenesUrl?[]:undefined),sceneThumbnails:m.sceneThumbnails||{},metadataPrefix:m.metadataPrefix||m.id.replaceAll('-','_'),files:Array.isArray(m.downloads)?m.downloads:Object.entries(m.downloads||{}).map(([key,f])=>({label:key,format:key.toUpperCase(),href:f.url,...f})),sourceUrl:[m.sourceUrl,...(m.sources||[]).map(s=>s.url)].find(url=>/^https?:\/\//i.test(url||''))||''};}

$('model-search').addEventListener('input',renderModels);
$('scene-search').addEventListener('input',event=>{state.search=event.target.value;renderSceneList();});
document.querySelectorAll('.scene-tab').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;document.querySelectorAll('.scene-tab').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderSceneList();}));
$('orbit-mode').addEventListener('click',()=>setNavigation('orbit'));$('pan-mode').addEventListener('click',()=>setNavigation('pan'));
$('reset-view').addEventListener('click',()=>applyScene(state.activeIndex));$('restore-scene').addEventListener('click',()=>applyScene(state.activeIndex));$('fit-view').addEventListener('click',fitBuilding);
$('appearance-look').addEventListener('change',e=>{appearanceVariant=e.target.value;$('exposure-adjust').value='0';$('exposure-value').textContent='0 EV';refreshAppearance();});
$('exposure-adjust').addEventListener('input',()=>{$('exposure-value').textContent=Number($('exposure-adjust').value).toFixed(1)+' EV';applyLighting();});
$('lighting-preset').addEventListener('change',()=>applyLighting());
$('look-reset').addEventListener('click',()=>{$('exposure-adjust').value='0';$('exposure-value').textContent='0 EV';applyLighting();});
$('previous-scene').addEventListener('click',()=>applyScene(state.activeIndex-1));$('next-scene').addEventListener('click',()=>applyScene(state.activeIndex+1));
$('display-style').addEventListener('change',e=>{state.display=e.target.value;applyDisplay();});
for(const category of ['site','roof','furniture','structure'])$('show-'+category).addEventListener('change',e=>{state.overrides[category]=e.target.checked;updateVisibility();});
const cutRow=document.createElement('label');cutRow.id='cut-plane-row';cutRow.hidden=true;cutRow.innerHTML='<input id="show-cut" type="checkbox" checked><span>Scene section cut</span>';document.querySelector('.visibility-options').append(cutRow);
$('show-cut').addEventListener('change',e=>{state.cuts=e.target.checked;updateVisibility();});
$('rotate-button').addEventListener('click',()=>{if(state.loading||!state.controls)return;studio?.stop();experience?.releaseTool();state.auto=!state.auto;updateAutoButton();requestRender();});
$('fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('workbench').requestFullscreen();}catch{toast('Full screen is not available in this browser.');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen-button').setAttribute('aria-label',document.fullscreenElement?'Exit full screen':'Enter full screen');resize();});
$('help-button').addEventListener('click',()=>openDialog('help-dialog'));$('downloads-button').addEventListener('click',prepareDownloads);$('details-button').addEventListener('click',prepareNotes);
document.querySelectorAll('.dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
for (const drawer of ['models', 'scenes']) {
  $(drawer + '-toggle').addEventListener('click', () => setDrawer(drawer, !document.body.classList.contains(drawer + '-open'), true));
  $(drawer + '-close').addEventListener('click', () => setDrawer(drawer, false, true));
}
function closeDrawers() {
  setDrawer('models', false, true);
  setDrawer('scenes', false, true);
}
$('drawer-scrim').addEventListener('click', closeDrawers);
$('retry-button').addEventListener('click',()=>{const m=state.pendingModel||state.model;if(m)selectModel(m,state.scenes[state.activeIndex]?.name);else location.reload();});
window.addEventListener('resize',updateDrawers);
document.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]')) return;
  if (event.key === 'Escape') closeDrawers();
  if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) return;
  if (event.key === 'ArrowRight') { stopTour(); applyScene(state.activeIndex + 1); }
  if (event.key === 'ArrowLeft') { stopTour(); applyScene(state.activeIndex - 1); }
  if (event.key.toLowerCase() === 'r') applyScene(state.activeIndex);
  if (event.key.toLowerCase() === 'f') fitBuilding();
});
window.addEventListener('popstate',()=>{const p=new URL(location.href).searchParams;const m=state.catalog?.models.find(x=>x.id===p.get('model'));if(m)selectModel(m,p.get('scene'));});

function freezePhoto(active){
 if(active&&!photoLock){stopTour();studio?.stop();experience?.releaseTool();state.auto=false;updateAutoButton();photoLock={controls:state.controls,enabled:state.controls?.enabled};if(state.controls)state.controls.enabled=false;document.querySelector('.app-shell').inert=true;document.querySelector('.topbar').inert=true;}
 else if(!active&&photoLock){document.querySelector('.app-shell').inert=false;document.querySelector('.topbar').inert=false;if(state.controls===photoLock.controls)state.controls.enabled=photoLock.enabled;photoLock=null;}
}
function selectAxis(axis){
 if(!state.root||state.loading||viewMode!=='live'){toast('Open Live 3D to use model orientation views.');return;}
 stopTour();studio?.stop();experience?.releaseTool();studio?.releaseCameraLock();state.auto=false;updateAutoButton();
 const rect=$('viewer-frame').getBoundingClientRect(),pose=axisCamera(buildingBox,axis,rect.width/rect.height);if(!pose)return;
 state.camera=pose.camera;const controls=createControls();controls.target.copy(pose.target);controls.update();updateProjection(rect.width/rect.height);state.dirty=true;
 $('projection-label').textContent=axis==='iso'?'PERSPECTIVE':'PARALLEL';$('active-scene-name').textContent=axis==='iso'?'Isometric model view':axis[0].toUpperCase()+axis.slice(1)+' model view';$('active-scene-note').textContent='Model source axes · R restores the saved camera';
 applyLighting();studio?.sceneChanged();notifyScene();requestRender();
}
async function boot(){
  $('appearance-look').value=appearanceVariant;setupRenderer();updateDrawers();
  finishStudio=createFinishStudio({openKitchen:()=>{const i=state.scenes.findIndex(s=>/kitchen/i.test(s.name)&&sceneCategory(s)==='interior');if(i<0)return false;applyScene(i);return true;},canvas:$('viewport'),root:()=>state.root,meshes:()=>state.meshes,world:()=>world,camera:()=>state.camera,scene:()=>state.scenes[state.activeIndex]?.name,sceneCategory:()=>sceneCategory(state.scenes[state.activeIndex]||{}),cameraRecord:()=>({position:state.camera?.position.toArray(),target:state.controls?.target.toArray(),fov:state.camera?.fov}),render:requestRender,display:applyDisplay,lock:locked=>{if(state.controls){state.controls.enabled=!locked;if(locked){state.auto=false;updateAutoButton();}}},capture:async()=>{renderCurrent();const image=await createImageBitmap($('viewport'));return image;}});
  experience=createExperience({state:()=>state,renderer:()=>renderer,world:()=>world,lab:()=>renderLab,box:()=>buildingBox,viewMode:()=>viewMode,setViewMode,selectModel,applyScene,renderScenes:renderSceneList,updateVisibility,render:requestRender,resize,toast,stopTour:()=>{stopTour();if(!studio?.internal)studio?.stop();},cameraExtras:()=>studio?.cameraExtras()||{},prepareFreeCamera:()=>studio?.releaseCameraLock(),stopOrbit:()=>{state.auto=false;updateAutoButton();},restoreView,cancelLoad});
  reviewUI=createReviewUI({state:()=>state,viewMode:()=>viewMode,resize,releaseTools:()=>{stopTour();experience?.releaseTool();studio?.stop();}});
  studio=createStudio({state:()=>state,lab:()=>renderLab,viewMode:()=>viewMode,rendererAvailable:()=>!!renderer,applyScene,selectModel,render:requestRender,toast,stopTour,stopOrbit:()=>{state.auto=false;updateAutoButton();},releasePrecision:()=>experience?.releaseTool(),ensureLive:async()=>{if(!renderer)return false;if(!state.root){viewMode='live';await selectModel(state.model,state.scenes[state.activeIndex]?.name);}if(state.root)setViewMode('live',true);return !!state.root;},pose:applyTourPose});
  photoMode=createPhotoMode({state:()=>state,renderer:()=>renderer,world:()=>world,viewMode:()=>viewMode,environment:()=>renderLab?.getEnvironmentTexture(),busy:()=>!!(studio?.playing||state.auto||experience?.walking),freeze:freezePhoto,render:requestRender,toast});
  viewCube=createViewCube({state:()=>state,viewMode:()=>viewMode,select:selectAxis});
  commandPalette=createCommandPalette({state:()=>state,selectModel,applyScene,workflow:mode=>reviewUI.changeMode(mode),photo:()=>photoMode.open(),axis:selectAxis,fit:fitBuilding,reset:()=>applyScene(state.activeIndex),toast,locked:()=>photoMode.exporting});
  document.addEventListener('atelier:workflow',event=>{if(event.detail!=='present')photoMode.close();});
  for(const type of ['input','change','click'])document.addEventListener(type,event=>{if(event.target.closest?.('#render-lab,#finish-studio,.appearance-controls'))photoMode.invalidate();});
  try{await initAssetStore();const response=await fetch('models.json',{cache:'no-cache'});if(!response.ok)throw new Error('Catalog unavailable');state.catalog=await response.json();state.catalog.models=state.catalog.models.map(normalizeModel);$('collection-count').textContent=state.catalog.models.length+' residences · '+state.catalog.models.reduce((n,m)=>n+m.sceneCount,0)+' perspectives';$('model-count').textContent=String(state.catalog.models.length);renderModels();
    const params=new URL(location.href).searchParams;experience?.renderGallery();const initial=state.catalog.models.find(m=>m.id===params.get('model'))||state.catalog.models[0];viewMode=['rendered','reference'].includes(params.get('view'))?params.get('view'):'live';await selectModel(initial,params.get('scene'));await experience.restoreInitial();
  }catch(error){console.error(error);showError(loadFailureMessage(error),'The collection could not be opened');}
}
boot();

let downloadController=null;document.addEventListener('click',async event=>{const a=event.target.closest?.('a[href]');if(!a||!chunkedAsset(a.href))return;event.preventDefault();if(downloadController){toast('A verified download is already in progress. Close Model files to cancel it.');return;}downloadController=new AbortController();a.setAttribute('aria-busy','true');const status=document.createElement('p');status.setAttribute('role','status');status.className='download-status';status.textContent='Preparing verified download…';a.after(status);try{await downloadChunkedAsset(a.href,{signal:downloadController.signal,onProgress:(n,total)=>{status.textContent='Assembling '+Math.round(n/total*100)+'% · original file is verified before saving';}});status.textContent='Verified file handed to your browser for saving.';}catch(e){status.textContent=e.name==='AbortError'?'Download cancelled.':e.message;toast(status.textContent);}finally{a.removeAttribute('aria-busy');downloadController=null;}});$('downloads-dialog').addEventListener('close',()=>downloadController?.abort());

$('error-image').addEventListener('error',()=>{$('error-image').hidden=true;});

function setViewMode(next,quiet=false){
 if(next!=='live')photoMode?.stop('Photo mode stopped because the view changed.');
 if(studio&&!studio.internal)studio.stop();
 if(next!=='reference')experience?.closeCompare();if(next!=='live')experience?.leaveLive();
 if(state.loading)return;const scene=state.scenes[state.activeIndex];if(!scene)return;
 let image=viewImages(state.model,next)[scene.name];
 if(next!=='live'&&!image){if(!quiet)toast('No '+(next==='reference'?'earlier render':'current model review')+' for this camera. Explore it in Live 3D.');next='live';}
 const syncButtons=()=>{for(const [id,mode] of [['live-view','live'],['rendered-view','rendered'],['reference-view','reference']]){const b=$(id);b.disabled=mode==='live'?!renderer:!viewImages(state.model,mode)[scene.name];b.classList.toggle('active',viewMode===mode&&(mode!=='live'||!!state.root));b.setAttribute('aria-pressed',String(b.classList.contains('active')));}};
 if(next==='live'&&!state.root){
  if(renderer&&!quiet){viewMode='live';selectModel(state.model,scene.name);return;}
  viewMode='live';$('rendered-image').hidden=true;$('rendered-credit').hidden=true;$('viewer-frame').classList.remove('is-rendered');$('error-overlay').hidden=false;syncButtons();updateLink();experience?.availability();studio?.availability();finishPoster();notifyScene();if(!quiet)toast('Live 3D requires WebGL 2 and hardware acceleration.');writeDiagnostics();return;
 }
 viewMode=next;const still=next!=='live';$('viewer-frame').classList.toggle('is-rendered',still);$('rendered-image').hidden=!still;$('rendered-credit').hidden=!still;
 if(still){
  image=viewImages(state.model,next)[scene.name];$('error-overlay').hidden=true;$('rendered-image').src=image;
  $('rendered-image').alt=state.model.name+' · '+sceneLabel(scene)+(next==='reference'?' · earlier design':' · current design image');
  $('rendered-credit').textContent=stillCredit(state.model,scene.name,next);
  $('active-scene-note').textContent=next==='reference'?'Earlier design · reference image':'Current design · fixed lighting and finishes';
  $('viewer-mode-label').textContent=next==='reference'?'EARLIER DESIGN':'CURRENT DESIGN IMAGE';
  $('render-status').textContent=next==='reference'?'Earlier design · reference image':'Current design · saved image';
  state.auto=false;updateAutoButton();
 }else{$('viewer-mode-label').textContent='LIVE 3D';$('active-scene-note').textContent='Current design · free to explore';document.querySelector('.view-compass').hidden=false;updateStatus();requestRender();}
 for(const id of ['orbit-mode','pan-mode','display-style','rotate-button','fit-view','exposure-adjust','look-reset','lighting-preset','appearance-look','finish-toggle','lab-toggle'])if($(id))$(id).disabled=still||!state.root;
 if(still){$('render-lab').hidden=true;$('lab-toggle').setAttribute('aria-expanded','false');if(!$('finish-studio').hidden)$('finish-close').click();}
 syncButtons();updateLink();experience?.availability();studio?.availability();if(still){experience?.stopWalk();finishPoster();if(state.frame){cancelAnimationFrame(state.frame);state.frame=0;}}notifyScene();state.lastDiagnostics=0;writeDiagnostics();
}
$('live-view').onclick=()=>setViewMode('live');$('rendered-view').onclick=()=>setViewMode('rendered');$('reference-view').onclick=()=>setViewMode('reference');
$('collection-collapse').onclick=()=>experience?.openCollection();
$('lab-toggle').onclick=()=>{const open=$('render-lab').hidden;$('render-lab').hidden=!open;$('lab-toggle').setAttribute('aria-expanded',String(open));};
function stopTour(){if(tourTimer)clearInterval(tourTimer);tourTimer=null;$('tour-button').setAttribute('aria-pressed','false');$('tour-button').innerHTML=icon('play')+'Scene tour';}
function startSceneTour(){
 studio?.stop();
 if(tourTimer){stopTour();return;}if(state.loading||!state.scenes.length)return;
 const pool=state.scenes.map((s,i)=>i).filter(i=>!['plans','structure'].includes(sceneCategory(state.scenes[i]))&&(viewMode==='live'||viewImages(state.model,viewMode)[state.scenes[i].name]));
 const selection=$('tour-selection').value;tourSequence=selection==='starred'?pool.filter(i=>experience?.isFavorite(state.scenes[i].name)):selection==='highlights'?pool.filter(i=>/hero|arrival|kitchen|living|primary|master|pool|courtyard|terrace|spa|night/i.test(state.scenes[i].name)).slice(0,12):pool;
 if(!tourSequence.length){toast(selection==='starred'?'Star a few scenes before starting this tour.':'No available perspectives in this tour.');return;}tourPosition=Math.max(0,tourSequence.indexOf(state.activeIndex));$('tour-button').setAttribute('aria-pressed','true');$('tour-button').innerHTML=icon('pause')+'Pause tour';tourTimer=setInterval(()=>{if(document.hidden||state.loading||document.querySelector('dialog[open]'))return;tourPosition=(tourPosition+1)%tourSequence.length;applyScene(tourSequence[tourPosition]);},Number($('tour-pace').value)*1000);
}
$('tour-button').onclick=startSceneTour;
for(const id of ['tour-pace','tour-selection'])$(id).onchange=()=>{if(tourTimer){stopTour();startSceneTour();}};
$('viewport').addEventListener('pointerdown',stopTour);
document.addEventListener('visibilitychange',()=>{if(document.hidden){state.auto=false;updateAutoButton();if(state.frame){cancelAnimationFrame(state.frame);state.frame=0;}}else{state.lastTime=0;requestRender();}});
$('save-image').onclick=async()=>{if(!state.model||state.loading)return;try{let blob;if(viewMode!=='live'){const r=await fetch(viewImages(state.model,viewMode)[state.scenes[state.activeIndex].name]);if(!r.ok)throw new Error('Image unavailable');blob=await r.blob();}else{renderCurrent();blob=await captureViewBlob(Number($('capture-scale').value));}if(!blob)throw new Error('Image unavailable');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=state.model.id+'-view-'+String(state.activeIndex+1).padStart(2,'0')+(viewMode!=='live'?'-'+viewMode+'.jpg':'.png');a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('View prepared for saving.');}catch{toast('This view could not be captured. Try again after the model finishes loading.');}};

async function restoreView(view){
 const model=state.catalog.models.find(m=>m.id===view.model);if(!model)return;viewMode=view.viewMode;
 if(state.model?.id!==view.model||(view.viewMode==='live'&&!state.root&&renderer))await selectModel(model,view.scene);
 else{const index=state.scenes.findIndex(s=>s.name===view.scene);if(index>=0)applyScene(index);}
 if(state.loading)return;
 $('lighting-preset').value=view.lighting;$('exposure-adjust').value=view.exposure;$('exposure-value').textContent=view.exposure.toFixed(1)+' EV';renderLab?.setSettings(view.lab);
 if(state.root&&view.camera){const c=view.camera,aspect=$('viewer-frame').clientWidth/$('viewer-frame').clientHeight;state.camera=c.perspective?new THREE.PerspectiveCamera(c.fov,aspect,.018,1500):new THREE.OrthographicCamera(-20,20,20,-20,.018,1500);state.camera.position.fromArray(c.position);state.camera.up.fromArray(c.up).normalize();state.camera.userData.customFov=c.fov;state.camera.userData.sourceHeight=c.orthoHeight;state.camera.userData.lensShift=c.lensShift||0;state.camera.userData.verticals=!!c.verticals;state.camera.lookAt(new THREE.Vector3(...c.target));$('projection-label').textContent=c.perspective?'PERSPECTIVE':'PARALLEL';createControls();state.controls.target.fromArray(c.target);updateProjection(aspect);state.controls.update();state.overrides={...view.layers};state.display=view.display;$('display-style').value=view.display;updateVisibility();syncVisibilityInputs();applyLighting();state.dirty=true;}
 studio?.restoreCamera(view.camera);setViewMode(state.root||view.viewMode==='reference'?view.viewMode:'rendered',true);$('active-scene-name').textContent=view.name;if(viewMode==='live')$('active-scene-note').textContent='Saved personal perspective · free to explore';requestRender();toast('Perspective restored.');
}
function cancelLoad(){
 ++state.sequence;state.controller?.abort();state.loading=false;state.pendingModel=null;$('loading-overlay').classList.add('hidden');$('loading-overlay').setAttribute('aria-hidden','true');
 if(state.scenes.length){applyStaticScene(state.activeIndex);setViewMode(viewMode==='reference'?'reference':'rendered',true);}else showError('Loading stopped. Choose a residence or use Try again.','Model loading paused');
 experience?.availability();studio?.availability();toast('Saved images remain available. Choose Live 3D to resume loading.');
}
async function captureViewBlob(scale=1){
 photoMode?.stop('Photo preview paused for the live viewer image.');
 const size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),factor=Math.min(Math.max(1,scale),4096/Math.max(size.x,size.y)),resume=studio?.suspendCapture();capturingView=true;renderLab?.beginCapture();
 try{renderer.setPixelRatio(1);renderer.setSize(Math.round(size.x*factor),Math.round(size.y*factor),false);renderLab?.resize();renderCurrent();const canvas=$('viewport'),rect=studio?.captureRect(canvas.width,canvas.height)||{x:0,y:0,width:canvas.width,height:canvas.height},output=document.createElement('canvas');output.width=Math.max(1,Math.round(rect.width));output.height=Math.max(1,Math.round(rect.height));output.getContext('2d').drawImage(canvas,rect.x,rect.y,rect.width,rect.height,0,0,output.width,output.height);return await new Promise(resolve=>output.toBlob(resolve,'image/png'));}
 finally{renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);renderLab?.resize();capturingView=false;renderLab?.endCapture();resume?.();requestRender();}
}
document.getElementById('close-render-lab').onclick=()=>{$('render-lab').hidden=true;$('lab-toggle').setAttribute('aria-expanded','false');};

function applyTourPose(pose){
 if(!state.root||!state.camera)return;const aspect=$('viewer-frame').clientWidth/$('viewer-frame').clientHeight;
 if(!!state.camera.isPerspectiveCamera!==pose.perspective){state.camera=pose.perspective?new THREE.PerspectiveCamera(pose.fov,aspect,.018,1500):new THREE.OrthographicCamera(-20,20,20,-20,.018,1500);state.camera.userData.sourceHeight=40;createControls();state.controls.enabled=false;}
 const camera=state.camera;camera.position.fromArray(pose.position);camera.up.fromArray(pose.up||[0,1,0]);camera.quaternion.fromArray(pose.quaternion);camera.userData.customFov=pose.fov;camera.userData.lensShift=pose.shift||0;camera.userData.verticals=!!pose.verticals;delete camera.userData.focalLength;if(camera.isPerspectiveCamera){camera.fov=pose.fov;camera.aspect=aspect;}state.controls.target.fromArray(pose.target);applyLensShift(camera,pose.shift||0);camera.updateMatrixWorld(true);state.dirty=true;renderLab?.refreshLights(camera);requestRender();
}
