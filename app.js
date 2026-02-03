// Backend configuration - use relative paths for itsalive.co
const BACKEND_URL = '/api';

const STORAGE_KEY = 'edu:selectedResources';
const CLASSROOM_SESSION_KEY = 'edu:classroomSession';

const resources = [
  { id: 'r1', title: 'Khan Academy', type: 'Video', subject: 'Math', desc: 'Comprehensive math lessons', url: 'https://www.khanacademy.org', icon: 'https://www.google.com/s2/favicons?sz=64&domain=khanacademy.org' },
  { id: 'r2', title: 'Coursera', type: 'Course', subject: 'Computer Science', desc: 'University-level computer science courses', url: 'https://www.coursera.org', icon: 'https://www.google.com/s2/favicons?sz=64&domain=coursera.org' },
  { id: 'r3', title: 'MDN Web Docs', type: 'Docs', subject: 'Web Development', desc: 'Web development reference', url: 'https://developer.mozilla.org', icon: 'https://www.google.com/s2/favicons?sz=64&domain=developer.mozilla.org' },
  { id: 'r4', title: 'edX', type: 'Course', subject: 'Data Science', desc: 'Data science and analytics', url: 'https://www.edx.org', icon: 'https://www.google.com/s2/favicons?sz=64&domain=edx.org' },
  { id: 'r5', title: 'YouTube EDU', type: 'Video', subject: 'General', desc: 'Educational video collection', url: 'https://www.youtube.com/education', icon: 'https://www.google.com/s2/favicons?sz=64&domain=youtube.com' },
  { id: 'r6', title: 'Google Classroom', type: 'Platform', subject: 'Classroom', desc: 'Classroom management and assignments', url: 'https://classroom.google.com', icon: 'https://www.google.com/s2/favicons?sz=64&domain=classroom.google.com' },
  { id: 'r7', title: 'Quizlet', type: 'Practice', subject: 'Study Tools', desc: 'Flashcards and practice drills', url: 'https://quizlet.com', icon: 'https://www.google.com/s2/favicons?sz=64&domain=quizlet.com' },
  { id: 'r8', title: 'Codecademy', type: 'Interactive', subject: 'Computer Science', desc: 'Interactive coding lessons', url: 'https://www.codecademy.com', icon: 'https://www.google.com/s2/favicons?sz=64&domain=codecademy.com' },
  { id: 'r9', title: 'TED-Ed', type: 'Video', subject: 'General', desc: 'Short educational videos and lessons', url: 'https://ed.ted.com', icon: 'https://www.google.com/s2/favicons?sz=64&domain=ted.com' },
  { id: 'r10', title: 'Duolingo', type: 'Interactive', subject: 'Language', desc: 'Language learning platform', url: 'https://www.duolingo.com', icon: 'https://www.google.com/s2/favicons?sz=64&domain=duolingo.com' }
];

const CUSTOM_KEY = 'edu:customResources';

function loadCustomResources() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch { return []; }
}
function saveCustomResources(arr) { localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr)); }
function allResources() { return resources.concat(loadCustomResources()); }

function domainFromUrl(u){ try{ return (new URL(u)).hostname.replace(/^www\./,''); }catch(e){ return '' }}
function faviconFor(url){ const d = domainFromUrl(url); return d ? `https://www.google.com/s2/favicons?sz=64&domain=${d}` : '' }

function addCustomResource(obj){
  const cur = loadCustomResources();
  cur.push(obj);
  saveCustomResources(cur);
}

// ------------------ simple sign-in flow (client-side only) ------------------
const USER_KEY = 'edu:user';
function getCurrentUser(){
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}
function saveCurrentUser(u){ localStorage.setItem(USER_KEY, JSON.stringify(u)); }
function signOut(){ localStorage.removeItem(USER_KEY); renderUserArea(); }

function customStorageKey(){
  const u = getCurrentUser();
  return u && u.name ? `${CUSTOM_KEY}:${u.name}` : CUSTOM_KEY + ':guest';
}

function loadCustomResources(){
  // prefer per-user storage, fallback to global
  try {
    const key = customStorageKey();
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}
function saveCustomResources(arr) { localStorage.setItem(customStorageKey(), JSON.stringify(arr)); }

function requireSignIn(actionFn){
  const u = getCurrentUser();
  if (!u) { showSignInModal(actionFn); return false; }
  return true;
}

function renderUserArea(){
  const area = document.getElementById('user-area');
  const u = getCurrentUser();
  const classroom = getClassroomSession();
  area.innerHTML = '';
  
  // Show Classroom connection status
  if (classroom && classroom.user) {
    const chip = document.createElement('div');
    chip.className = 'user-chip';
    const userEmail = classroom.user.email || 'Connected';
    chip.innerHTML = `<span class="user-name">🎓 ${escapeHtml(userEmail)}</span> <button id="classroom-disconnect-btn">Disconnect</button>`;
    area.appendChild(chip);
    area.querySelector('#classroom-disconnect-btn').addEventListener('click', disconnectClassroom);
  } else if (u && u.name) {
    const chip = document.createElement('div');
    chip.className = 'user-chip';
    chip.innerHTML = `<span class="user-name">${escapeHtml(u.name)}</span> <button id="signout-btn">Sign out</button>`;
    area.appendChild(chip);
    area.querySelector('#signout-btn').addEventListener('click', ()=>{ signOut(); });
  } else {
    const btn = document.createElement('button');
    btn.className = 'signin-btn';
    btn.id = 'signin-btn';
    btn.textContent = 'Sign in';
    btn.addEventListener('click', ()=> showSignInModal());
    area.appendChild(btn);
  }
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

function showSignInModal(onSuccess){
  if (document.getElementById('signin-modal')) return;
  const overlay = document.createElement('div');
  overlay.id = 'signin-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>Sign in</h3>
      <input id="si-name" placeholder="Name" />
      <input id="si-email" placeholder="Email (optional)" />
      <div class="modal-actions"><button id="si-submit">Sign in</button><button id="si-cancel" class="secondary">Cancel</button></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#si-cancel').addEventListener('click', ()=> overlay.remove());
  overlay.querySelector('#si-submit').addEventListener('click', ()=>{
    const name = overlay.querySelector('#si-name').value.trim();
    const email = overlay.querySelector('#si-email').value.trim();
    if (!name) { alert('Please enter a name to sign in.'); return; }
    const user = { name, email };
    saveCurrentUser(user);
    renderUserArea();
    overlay.remove();
    if (typeof onSuccess === 'function') onSuccess();
  });
}

// ============= Classroom OAuth Integration =============
function getClassroomSession() {
  try { return JSON.parse(localStorage.getItem(CLASSROOM_SESSION_KEY) || 'null'); } catch { return null; }
}
function saveClassroomSession(sess) { localStorage.setItem(CLASSROOM_SESSION_KEY, JSON.stringify(sess)); }
function clearClassroomSession() { localStorage.removeItem(CLASSROOM_SESSION_KEY); }

// Check for OAuth callback (sessionToken in URL params)
function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const sessionToken = params.get('sessionToken');
  const user = params.get('user');
  
  if (sessionToken && user) {
    try {
      const userData = JSON.parse(decodeURIComponent(user));
      const session = { sessionToken, user: userData, connectedAt: new Date().toISOString() };
      saveClassroomSession(session);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      renderUserArea();
      return true;
    } catch (e) {
      console.warn('Failed to parse OAuth callback:', e);
    }
  }
  return false;
}

// Connect to Google Classroom
function connectClassroom() {
  const loginUrl = `${BACKEND_URL}/auth-login`;
  window.location.href = loginUrl;
}

// Disconnect from Google Classroom
function disconnectClassroom() {
  clearClassroomSession();
  renderUserArea();
}

// initialize user area on load
document.addEventListener('DOMContentLoaded', ()=> {
  handleOAuthCallback();
  renderUserArea();
});

function removeCustomResource(id){
  const cur = loadCustomResources();
  const updated = cur.filter(r => r.id !== id);
  saveCustomResources(updated);
  // also remove from selected if present
  const saved = getSaved();
  const newSaved = saved.filter(sid => sid !== id);
  if (newSaved.length !== saved.length) saveSelected(newSaved);
}

function getSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveSelected(ids) { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); }

function unique(values) { return Array.from(new Set(values)).sort(); }

function sortResources(arr, mode = 'typeThenSubject') {
  const copy = [...arr];
  if (mode === 'type') copy.sort((a,b)=> a.type.localeCompare(b.type) || a.subject.localeCompare(b.subject));
  else if (mode === 'subject') copy.sort((a,b)=> a.subject.localeCompare(b.subject) || a.type.localeCompare(b.type));
  else if (mode === 'subjectThenType') copy.sort((a,b)=> a.subject.localeCompare(b.subject) || a.type.localeCompare(b.type));
  else copy.sort((a,b)=> a.type.localeCompare(b.type) || a.subject.localeCompare(b.subject));
  return copy;
}

function renderHome() {
  const root = document.getElementById('home-view');
  root.innerHTML = '';
  const saved = getSaved();

  const heading = document.createElement('div');
  heading.className = 'section-header';
  heading.innerHTML = `<h2>Selected Resources</h2><div class="actions"><button id="edit-btn">Edit Selection</button><button id="clear-btn">Clear</button></div>`;
  root.appendChild(heading);

  const list = document.createElement('div');
  list.className = 'cards';
  if (saved.length === 0) {
    list.innerHTML = '<p class="muted">No resources selected. Go to Dashboard to choose resources.</p>';
  } else {
    // build resource objects for saved ids and sort by type then subject
    const savedResources = saved.map(id => allResources().find(x => x.id === id)).filter(Boolean);
    const sorted = sortResources(savedResources, 'typeThenSubject');

    function stringToHslColor(str, s=60, l=72){
      let hash = 0; for (let i=0;i<str.length;i++) hash = str.charCodeAt(i) + ((hash<<5)-hash);
      const h = Math.abs(hash) % 360;
      return { css: `hsl(${h}, ${s}%, ${l}%)`, h, s, l };
    }
    function textColorForLightness(l){ return l > 60 ? '#111' : '#fff'; }

    sorted.forEach(r => {
      const col = stringToHslColor(r.title || r.url);
      const headerStyle = `background:${col.css}; color:${textColorForLightness(col.l)}`;
      const card = document.createElement('article');
      card.className = 'card card-hero';
      const pill = r.type ? `<div class="pill">${escapeHtml(r.type)}</div>` : '';
      card.innerHTML = `
        <div class="card-top" style="${headerStyle}">
          <div class="icon-wrap"><img src="${r.icon || faviconFor(r.url)}" class="hero-icon" alt="${r.title} icon"></div>
        </div>
        <div class="card-body">
          ${pill}
          <h3 class="hero-title">${escapeHtml(r.title)}</h3>
          <p class="hero-desc">${escapeHtml(r.desc)}</p>
          <div class="card-actions">
            <button class="btn open-internal" data-id="${r.id}">Open</button>
          </div>
        </div>
      `;
      list.appendChild(card);
      // wire internal Open button to in-site assignments page
      const openBtn = card.querySelector('.open-internal');
      if (openBtn) openBtn.addEventListener('click', ()=>{ location.hash = '#assignments-' + r.id; showView('assignments'); renderAssignments(r.id); });
    });
  }
  root.appendChild(list);

  document.getElementById('edit-btn').addEventListener('click', () => { location.hash = '#dashboard'; showView('dashboard'); renderDashboard(); });
  document.getElementById('clear-btn').addEventListener('click', () => { saveSelected([]); renderHome(); });
}

function renderDashboard() {
  const root = document.getElementById('dashboard-view');
  root.innerHTML = '';
  const heading = document.createElement('div');
  heading.className = 'section-header';
  heading.innerHTML = `<h2>Resource Dashboard</h2><div class="actions"><button id="save-btn">Save Selection</button></div>`;
  root.appendChild(heading);

  // filters (include custom resources)
  const types = unique(allResources().map(r=>r.type));
  const subjects = unique(allResources().map(r=>r.subject));

  const controls = document.createElement('div');
  controls.className = 'filters';
  controls.innerHTML = `
    <label>Type: <select id="filter-type"><option value="all">All</option>${types.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></label>
    <label>Subject: <select id="filter-subject"><option value="all">All</option>${subjects.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></label>
    <label>Sort: <select id="sort-mode"><option value="typeThenSubject">Type → Subject</option><option value="subjectThenType">Subject → Type</option><option value="type">Type</option><option value="subject">Subject</option></select></label>
  `;
  root.appendChild(controls);

  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-container';
  const saved = getSaved();

  function renderTable() {
    tableContainer.innerHTML = '';
    const ft = document.getElementById('filter-type').value;
    const fs = document.getElementById('filter-subject').value;
    const sortMode = document.getElementById('sort-mode').value;

    let list = allResources().slice();
    if (ft !== 'all') list = list.filter(r => r.type === ft);
    if (fs !== 'all') list = list.filter(r => r.subject === fs);
    list = sortResources(list, sortMode);

    // determine which types to show as columns
    const typesToShow = ft === 'all' ? unique(list.map(r=>r.type)) : [ft];

    const table = document.createElement('table');
    table.className = 'resource-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    typesToShow.forEach(t => { const th = document.createElement('th'); th.textContent = t; headRow.appendChild(th); });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    // single row with columns per type
    const bodyRow = document.createElement('tr');
    typesToShow.forEach(t => {
      const td = document.createElement('td');
      const items = list.filter(r => r.type === t);
      if (items.length === 0) td.innerHTML = '<div class="muted">—</div>';
      else {
        const ul = document.createElement('div');
        ul.className = 'cell-list';
        items.forEach(r => {
          const item = document.createElement('label');
          item.className = 'resource-item';
          const checked = saved.includes(r.id) ? 'checked' : '';
          item.innerHTML = `<input type="checkbox" value="${r.id}" ${checked} /> <img src="${r.icon || faviconFor(r.url)}" class="res-icon" alt="${r.title} icon"> <span class="item-title">${r.title}</span> <span class="item-sub">${r.subject}</span><div class="desc">${r.desc}</div>`;
          // if this resource is custom, add a remove button
          const isCustom = loadCustomResources().some(cr => cr.id === r.id);
          if (isCustom) {
            const del = document.createElement('button');
            del.className = 'remove-btn';
            del.textContent = 'Remove';
            del.addEventListener('click', (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              if (!confirm(`Delete "${r.title}"?`)) return;
              removeCustomResource(r.id);
              renderDashboard();
            });
            item.appendChild(del);
          }
          ul.appendChild(item);
        });
        td.appendChild(ul);
      }
      bodyRow.appendChild(td);
    });
    tbody.appendChild(bodyRow);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
  }

  root.appendChild(tableContainer);

  // Add simple form to create a new resource (title, url, description)
  const addForm = document.createElement('div');
  addForm.className = 'add-form';
  addForm.innerHTML = `
    <details>
      <summary>Add new resource</summary>
      <div class="add-row">
        <input id="new-title" placeholder="Name (required)" />
        <input id="new-url" placeholder="URL (required)" />
        <input id="new-desc" placeholder="Short description" />
        <button id="add-new-btn">Add resource</button>
      </div>
    </details>
  `;
  root.appendChild(addForm);

  root.querySelector('#add-new-btn').addEventListener('click', (e)=>{
    e.preventDefault();
    // require sign-in to add custom resources
    if (!requireSignIn()) return;
    const name = root.querySelector('#new-title').value.trim();
    const url = root.querySelector('#new-url').value.trim();
    const desc = root.querySelector('#new-desc').value.trim();
    if (!name || !url) { alert('Please provide a Name and URL.'); return; }
    const id = 'c' + Date.now();
    const icon = faviconFor(url);
    const obj = { id, title: name, type: 'Custom', subject: 'General', desc, url, icon };
    addCustomResource(obj);
    // re-render dashboard to include new resource
    renderDashboard();
  });

  // attach filter listeners
  controls.querySelectorAll('select').forEach(sel => sel.addEventListener('change', renderTable));

  document.getElementById('save-btn').addEventListener('click', () => {
    // require sign-in to save selections
    if (!requireSignIn()) return;
    const checked = Array.from(root.querySelectorAll('input[type=checkbox]:checked')).map(i => i.value);
    saveSelected(checked);
    location.hash = '#home';
    showView('home');
    renderHome();
  });

  renderTable();
}

function renderAssignments(resourceId){
  const root = document.getElementById('assignments-view');
  root.innerHTML = '';
  const res = allResources().find(r=>r.id === resourceId);
  if (!res) { root.innerHTML = '<p class="muted">Resource not found.</p>'; return; }

  // header with color box
  const col = (function(s){ let h=0; for (let i=0;i<s.length;i++) h = s.charCodeAt(i) + ((h<<5)-h); const H = Math.abs(h)%360; return {css:`hsl(${H},60%,72%)`, H}; })(res.title || res.url);
  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `<div style="display:flex;align-items:center;gap:12px"><div style="width:68px;height:68px;border-radius:12px;background:${col.css};display:flex;align-items:center;justify-content:center"><img src="${res.icon || faviconFor(res.url)}" style="width:44px;height:44px;border-radius:8px"/></div><div><h2 style="margin:0">${escapeHtml(res.title)}</h2><div class="muted">${escapeHtml(res.type)} • ${escapeHtml(res.subject)}</div></div></div><div class="actions"><button id="assign-back">Back</button></div>`;
  root.appendChild(header);

  const list = document.createElement('div');
  list.className = 'assign-list';
  root.appendChild(list);

  // Check if this is Google Classroom and we have a session token
  const classroom = getClassroomSession();
  const isClassroom = (res.title && res.title.toLowerCase().includes('classroom')) || (res.url && res.url.includes('classroom.google.com'));
  
  if (isClassroom && classroom) {
    // Fetch real Classroom assignments
    loadRealClassroomAssignments(resourceId, list);
  } else {
    // Show add form + local assignments
    const form = document.createElement('div');
    form.className = 'assign-form';
    form.innerHTML = `
      <div class="form-row"><label for="af-title">Title</label><input id="af-title" placeholder="Assignment title" /></div>
      <div class="form-row"><label for="af-course">Course</label><input id="af-course" placeholder="Course (optional)" /></div>
      <div class="form-row"><label for="af-due">Due date</label><input id="af-due" type="date" /></div>
      <div class="form-row"><button id="af-add">Add</button></div>
    `;
    root.appendChild(form);

    // Show connect button if Classroom resource but not connected
    if (isClassroom && !classroom) {
      const connectMsg = document.createElement('div');
      connectMsg.className = 'muted' ;
      connectMsg.style.marginBottom = '12px';
      connectMsg.innerHTML = `<button id="connect-classroom" style="background:#007bff;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">Connect Google Classroom</button>`;
      root.insertBefore(connectMsg, form);
      connectMsg.querySelector('#connect-classroom').addEventListener('click', connectClassroom);
    }

    const ASSIGN_KEY = 'edu:assignments';
    function loadAssignments(){ try { return JSON.parse(localStorage.getItem(ASSIGN_KEY) || '{}'); } catch { return {}; } }
    function saveAssignments(obj){ localStorage.setItem(ASSIGN_KEY, JSON.stringify(obj)); }

    function renderList(){
      list.innerHTML = '';
      const store = loadAssignments();
      const stored = store[resourceId] || [];
      // show stored items first (user-added)
      if (stored.length > 0){
        stored.forEach(a => {
          const it = document.createElement('div');
          it.className = 'assign-item' + (a.status === 'Completed' ? ' completed' : '');
          it.innerHTML = `<div class="ai-left"><div class="ai-title">${escapeHtml(a.title)}</div><div class="ai-course">${escapeHtml(a.course)}</div></div><div class="ai-right"><div class="ai-due">${escapeHtml(a.due)}</div><div class="ai-status">${escapeHtml(a.status)}</div><div class="ai-actions"><button class="ai-complete">${a.status==='Completed'?'Undo':'Complete'}</button><button class="ai-delete">Delete</button></div></div>`;
          // wire actions
          it.querySelector('.ai-complete').addEventListener('click', ()=>{
            a.status = a.status === 'Completed' ? 'Assigned' : 'Completed';
            saveAndRender();
          });
          it.querySelector('.ai-delete').addEventListener('click', ()=>{
            if (!confirm('Delete this assignment?')) return; 
            const s = loadAssignments();
            s[resourceId] = (s[resourceId]||[]).filter(x=>x.id !== a.id);
            saveAssignments(s);
            renderList();
          });
          list.appendChild(it);
        });
      } else {
        // no stored items — show empty state (removed suggested/sample tasks)
        const noMsg = document.createElement('div');
        noMsg.className = 'muted';
        noMsg.textContent = 'No assignments yet.';
        list.appendChild(noMsg);
      }
    }

    function saveAndRender(){
      const s = loadAssignments();
      s[resourceId] = s[resourceId] || [];
      saveAssignments(s);
      renderList();
    }

    // add handler
    form.querySelector('#af-add').addEventListener('click', ()=>{
      const title = form.querySelector('#af-title').value.trim();
      if (!title) { alert('Please enter a title'); return; }
      const course = form.querySelector('#af-course').value.trim();
      const due = form.querySelector('#af-due').value || '';
      const s = loadAssignments();
      s[resourceId] = s[resourceId] || [];
      const id = 'u' + Date.now();
      s[resourceId].push({ id, title, course, due, status: 'Assigned' });
      saveAssignments(s);
      form.querySelector('#af-title').value = '';
      form.querySelector('#af-course').value = '';
      form.querySelector('#af-due').value = '';
      renderList();
    });

    renderList();
  }

  document.getElementById('assign-back').addEventListener('click', ()=>{ location.hash = '#home'; showView('home'); renderHome(); });
}

// Fetch and display real Google Classroom assignments
async function loadRealClassroomAssignments(resourceId, listContainer) {
  const classroom = getClassroomSession();
  if (!classroom || !classroom.sessionToken) {
    listContainer.innerHTML = '<p class="muted">Not connected to Classroom. <button onclick="connectClassroom()">Connect</button></p>';
    return;
  }

  listContainer.innerHTML = '<p class="muted">Loading assignments...</p>';

  try {
    // Fetch courses
    const coursesRes = await fetch(`${BACKEND_URL}/courses?sessionToken=${classroom.sessionToken}`);
    if (!coursesRes.ok) throw new Error('Failed to fetch courses');
    const courses = await coursesRes.json();

    if (!courses || courses.length === 0) {
      listContainer.innerHTML = '<p class="muted">No courses found.</p>';
      return;
    }

    // Fetch assignments from each course
    const allWork = [];
    for (const course of courses) {
      try {
        const workRes = await fetch(`${BACKEND_URL}/coursework?courseId=${course.id}&sessionToken=${classroom.sessionToken}`);
        if (workRes.ok) {
          const work = await workRes.json();
          allWork.push(...work.map(w => ({ ...w, courseName: course.name, courseId: course.id })));
        }
      } catch (e) {
        console.warn(`Could not fetch work for course ${course.id}:`, e);
      }
    }

    if (allWork.length === 0) {
      listContainer.innerHTML = '<p class="muted">No assignments found.</p>';
      return;
    }

    // Display assignments
    listContainer.innerHTML = '';
    allWork.forEach(work => {
      const item = document.createElement('div');
      item.className = 'assign-item';
      const dueDate = work.dueDate ? `${work.dueDate.month}/${work.dueDate.day}` : 'No due date';
      const status = work.studentSubmission ? (work.studentSubmission.state || 'Assigned') : 'Assigned';
      item.innerHTML = `
        <div class="ai-left">
          <div class="ai-title">${escapeHtml(work.title)}</div>
          <div class="ai-course">${escapeHtml(work.courseName)}</div>
        </div>
        <div class="ai-right">
          <div class="ai-due">${escapeHtml(dueDate)}</div>
          <div class="ai-status">${escapeHtml(status)}</div>
        </div>
      `;
      listContainer.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading Classroom assignments:', error);
    listContainer.innerHTML = `<p class="muted" style="color:#d32f2f">Error loading assignments: ${escapeHtml(error.message)}</p>`;
  }
}

function showView(name) {
  document.getElementById('home-view').classList.toggle('hidden', name !== 'home');
  document.getElementById('dashboard-view').classList.toggle('hidden', name !== 'dashboard');
  document.getElementById('assignments-view').classList.toggle('hidden', name !== 'assignments');
  document.getElementById('nav-home').classList.toggle('active', name === 'home');
  document.getElementById('nav-dashboard').classList.toggle('active', name === 'dashboard');
}

window.addEventListener('hashchange', () => {
  const raw = location.hash.replace('#','') || 'home';
  if (raw.startsWith('assignments-')){
    showView('assignments');
    const id = raw.split('assignments-')[1];
    renderAssignments(id);
    return;
  }
  const h = raw;
  showView(h);
  if (h === 'home') renderHome();
  if (h === 'dashboard') renderDashboard();
});

// initial
if (!location.hash) location.hash = '#home';
showView(location.hash.replace('#',''));
renderHome();
