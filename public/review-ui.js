import {viewImages} from './image-policy.js';

// Review pass: workflow state and progressive disclosure, independent of GPU access.
export function createReviewUI(h) {
  const $ = id => document.getElementById(id);
  const body = document.body;
  const modes = ['explore', 'present', 'analyze'];
  let mode = 'explore', quietTimer, guideStep = 0, captionPinned = true;
  const byMode = {
    'walk-tool': ['explore'], 'focus-tool': ['explore', 'analyze'],
    'plan-toggle': ['explore', 'present', 'analyze'],
    'camera-toggle': ['present', 'analyze'], 'director-toggle': ['present'],
    'save-image': ['present'],
    'filmstrip-toggle': ['present'], 'tour-button': ['present'], 'light-study': ['present'],
    'rotate-button': ['present'], 'present-button': ['present'], 'photo-open': ['present']
  };
  const changeMode = next => {
    if (!modes.includes(next)) return;
    h.releaseTools();
    mode = next; body.dataset.workspaceMode = mode;
    for (const button of document.querySelectorAll('[data-workflow]')) {
      const active = button.dataset.workflow === mode;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('active', active);
    }
    for (const [id, workflows] of Object.entries(byMode)) {
      const element = $(id);
      if (!element) continue;
      element.toggleAttribute('data-workflow-hidden', !workflows.includes(mode));
    }
    document.querySelector('.tour-options').toggleAttribute('data-workflow-hidden', mode !== 'present');
    document.querySelector('.visibility-panel').toggleAttribute('data-workflow-hidden', mode !== 'analyze');
    if (mode !== 'present' && !$('filmstrip').hidden) $('filmstrip-toggle').click();
    for (const panel of ['plan', 'camera']) {
      if (byMode[panel + '-toggle'].includes(mode)) continue;
      $(panel + '-panel').hidden = true;
      $(panel + '-toggle').setAttribute('aria-expanded', 'false');
    }
    h.resize(); refresh(); document.dispatchEvent(new CustomEvent('atelier:workflow',{detail:mode}));
  };
  document.querySelectorAll('[data-workflow]').forEach(button => {
    button.addEventListener('click', () => changeMode(button.dataset.workflow));
  });
  $('appearance-open').addEventListener('click', () => {
    const open = !body.classList.contains('appearance-open');
    body.classList.toggle('appearance-open', open);
    $('appearance-open').setAttribute('aria-expanded', String(open));
    h.resize();
  });
  $('appearance-close').addEventListener('click', () => {
    body.classList.remove('appearance-open');
    $('appearance-open').setAttribute('aria-expanded', 'false');
    $('appearance-open').focus(); h.resize();
  });
  const caption = document.querySelector('.active-scene-card');
  const captionButton = $('caption-reveal');
  function quietCaption() {
    if (captionPinned || caption.contains(document.activeElement)) return;
    caption.classList.add('caption-quiet'); caption.inert = true;
    captionButton.setAttribute('aria-expanded', 'false');
  }
  function revealCaption() {
    clearTimeout(quietTimer); caption.classList.remove('caption-quiet'); caption.inert = false;
    captionButton.setAttribute('aria-expanded', 'true');
    if (!captionPinned) quietTimer = setTimeout(quietCaption, 3000);
  }
  captionButton.addEventListener('pointerenter', revealCaption);
  captionButton.addEventListener('focus', revealCaption);
  captionButton.addEventListener('click', () => {
    captionPinned = !captionPinned;
    captionButton.setAttribute('aria-pressed', String(captionPinned));
    if (captionPinned) revealCaption(); else quietCaption();
  });
  caption.addEventListener('focusin', () => clearTimeout(quietTimer));
  caption.addEventListener('focusout', revealCaption);
  function refresh() {
    const s = h.state(), scene = s.scenes[s.activeIndex];
    const live = h.viewMode() === 'live' && !!s.root && !s.loading;
    body.classList.toggle('live-ready', live);
    body.dataset.viewFormat = h.viewMode();
    const missing = scene && !viewImages(s.model, 'rendered')[scene.name];
    $('view-availability').textContent = missing
      ? 'Current image unavailable for this angle. Choose another scene or Live 3D.' : '';
    $('view-availability').hidden = !missing;
    for (const [id, format] of [['rendered-view', 'rendered'], ['reference-view', 'reference']]) {
      const available = !!scene && !!viewImages(s.model, format)[scene.name];
      $(id).title = available ? (format === 'rendered' ? 'Current design: saved image' : 'Earlier design: reference image')
        : 'No ' + (format === 'rendered' ? 'current' : 'earlier') + ' image for this angle';
    }
    for (const id of ['walk-tool', 'focus-tool', 'measure-tool', 'section-tool']) {
      $(id).hidden = !live; $(id).disabled = !live;
    }
    if (!live) {
      document.querySelector('.visibility-panel').hidden = true;
      if (body.classList.contains('appearance-open')) $('appearance-close').click();
    } else document.querySelector('.visibility-panel').hidden = false;
    $('appearance-open').disabled = !live;
  }
  const steps = [
    ['Explore the architecture', 'Drag to orbit, scroll to zoom, and right-drag to pan. A saved image stays visible while the model opens.', 'viewport'],
    ['Choose a perspective', 'Pick a room, exterior, plan, or detail from Perspectives. Your chosen angle also travels with a shared link.', 'scene-search'],
    ['Step inside', 'In Explore, choose Walk for room-by-room movement. Use WASD or arrows and drag to look. Escape returns to orbit.', 'walk-tool']
  ];
  function showGuide() {
    const [title, text, target] = steps[guideStep];
    $('quick-guide').hidden = false;
    $('guide-step').textContent = `${guideStep + 1} / ${steps.length}`;
    $('guide-title').textContent = title; $('guide-copy').textContent = text;
    $('guide-next').textContent = guideStep === 2 ? 'Start exploring' : 'Next';
    document.querySelectorAll('.guide-target').forEach(e => e.classList.remove('guide-target'));
    const element = $(target);
    if (element && !element.hidden && !element.disabled) element.classList.add('guide-target');
  }
  function closeGuide() {
    $('quick-guide').hidden = true;
    document.querySelectorAll('.guide-target').forEach(e => e.classList.remove('guide-target'));
    try { localStorage.setItem('atelier-quick-guide-v4', 'seen'); } catch {}
  }
  $('guide-next').addEventListener('click', () => guideStep === 2 ? closeGuide() : (guideStep++, showGuide()));
  $('guide-dismiss').addEventListener('click', closeGuide);
  $('quick-start-open').addEventListener('click', () => {
    $('help-dialog').close(); changeMode('explore'); guideStep = 0; showGuide();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('quick-guide').hidden) closeGuide();
  });
  document.addEventListener('atelier:scene', () => { refresh(); revealCaption(); });
  caption.addEventListener('pointerenter', () => clearTimeout(quietTimer));
  caption.addEventListener('pointerleave', revealCaption);
  changeMode('explore'); revealCaption();
  return {refresh, revealCaption, changeMode};
}
