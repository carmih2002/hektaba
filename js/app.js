// ============================================================
//  APP  –  navigation, home, create/edit, detail screens
// ============================================================

// ---------- State ----------
let currentExerciseId = null;
let editingExerciseId  = null;
let selectedLanguage   = 'עברית';
let selectedDirection  = 'word-to-trans';
let wordRows           = [];  // [{word, translation}]

// ---------- Helpers ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function $(id) { return document.getElementById(id); }

// ---------- HOME SCREEN ----------
function renderHome() {
  showScreen('screen-home');
  const exercises = Storage.getAll();
  const grid      = $('exercises-list');
  const empty     = $('empty-state');

  grid.innerHTML = '';

  if (exercises.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  exercises.forEach(ex => {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.innerHTML = `
      <div class="exercise-emoji">${ex.emoji}</div>
      <div class="exercise-name">${escapeHtml(ex.name)}</div>
      <div class="exercise-meta">
        <span class="exercise-tag">🌐 ${escapeHtml(ex.language)}</span>
        <span class="exercise-tag">📝 ${ex.words.length} מילים</span>
      </div>
    `;
    card.addEventListener('click', () => openDetail(ex.id));
    grid.appendChild(card);
  });
}

// ---------- CREATE/EDIT SCREEN ----------
function openCreate(exerciseId = null) {
  editingExerciseId = exerciseId;
  wordRows = [];
  selectedLanguage = 'עברית';

  $('exercise-name').value = '';
  $('words-list').innerHTML = '';
  $('custom-language').classList.add('hidden');

  // reset language buttons
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.lang-btn[data-lang="עברית"]').classList.add('active');

  // reset direction buttons
  selectedDirection = 'word-to-trans';
  document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.dir-btn[data-dir="word-to-trans"]').classList.add('active');

  if (exerciseId) {
    const ex = Storage.getById(exerciseId);
    if (ex) {
      $('create-title').textContent = 'עריכת תרגיל';
      $('exercise-name').value = ex.name;
      selectedLanguage = ex.language;

      const langBtn = document.querySelector(`.lang-btn[data-lang="${ex.language}"]`);
      if (langBtn) {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        langBtn.classList.add('active');
      } else {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.lang-btn[data-lang="other"]').classList.add('active');
        $('custom-language').classList.remove('hidden');
        $('custom-language').value = ex.language;
      }

      // load saved direction
      const dir = ex.direction || 'word-to-trans';
      selectedDirection = dir;
      document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
      const dirBtn = document.querySelector(`.dir-btn[data-dir="${dir}"]`);
      if (dirBtn) dirBtn.classList.add('active');

      ex.words.forEach(w => addWordRow(w.word, w.translation));
    }
  } else {
    $('create-title').textContent = 'תרגיל חדש';
  }

  if (wordRows.length === 0) {
    addWordRow(); addWordRow(); addWordRow();
  }

  showScreen('screen-create');
  $('exercise-name').focus();
}

function addWordRow(word = '', translation = '') {
  const index = wordRows.length;
  const div = document.createElement('div');
  div.className = 'word-row';
  div.innerHTML = `
    <span class="word-num">${index + 1}</span>
    <input class="word-input" type="text" placeholder="מילה" value="${escapeHtml(word)}" autocomplete="off" />
    <span class="word-sep">→</span>
    <input class="trans-input" type="text" placeholder="תרגום / הסבר" value="${escapeHtml(translation)}" autocomplete="off" />
    <button class="btn-delete-word" title="מחק שורה">✕</button>
  `;
  div.querySelector('.btn-delete-word').addEventListener('click', () => {
    div.remove();
    renumberRows();
  });
  $('words-list').appendChild(div);
  wordRows.push(div);
}

function renumberRows() {
  $('words-list').querySelectorAll('.word-row').forEach((row, i) => {
    row.querySelector('.word-num').textContent = i + 1;
  });
}

function collectWords() {
  const rows = $('words-list').querySelectorAll('.word-row');
  const words = [];
  rows.forEach(row => {
    const word  = row.querySelector('.word-input').value.trim();
    const trans = row.querySelector('.trans-input').value.trim();
    if (word || trans) words.push({ word, translation: trans });
  });
  return words;
}

function saveExercise() {
  const name  = $('exercise-name').value.trim();
  const lang  = selectedLanguage === 'other'
    ? ($('custom-language').value.trim() || 'אחר')
    : selectedLanguage;
  const words = collectWords();

  if (!name) { alert('נא להכניס שם לתרגיל'); return; }
  if (words.length < 2) { alert('נא להוסיף לפחות 2 מילים'); return; }

  if (editingExerciseId) {
    Storage.update(editingExerciseId, { name, language: lang, words, direction: selectedDirection });
  } else {
    Storage.create(name, lang, words, selectedDirection);
  }
  renderHome();
}

// ---------- DETAIL SCREEN ----------
function openDetail(id) {
  currentExerciseId = id;
  const ex = Storage.getById(id);
  if (!ex) { renderHome(); return; }

  $('detail-title').textContent = ex.name;

  $('detail-stats').innerHTML = `
    <span class="stat-chip">🌐 ${escapeHtml(ex.language)}</span>
    <span class="stat-chip">📝 ${ex.words.length} מילים</span>
  `;

  const wordsList = $('detail-words-list');
  wordsList.innerHTML = '';
  ex.words.forEach((w, i) => {
    const row = document.createElement('div');
    row.className = 'detail-word-row' + (w.starred ? ' starred-row' : '');
    row.innerHTML = `
      <span class="detail-word-num">${i + 1}</span>
      <span class="detail-word-text">${escapeHtml(w.word)}</span>
      <span class="detail-word-sep">→</span>
      <span class="detail-word-trans">${escapeHtml(w.translation)}</span>
      <button class="btn-star-word${w.starred ? ' starred' : ''}" title="סמן בכוכב">${w.starred ? '★' : '☆'}</button>
    `;
    row.querySelector('.btn-star-word').addEventListener('click', () => {
      const isStarred = Storage.toggleStar(id, i);
      row.classList.toggle('starred-row', isStarred);
      const btn = row.querySelector('.btn-star-word');
      btn.classList.toggle('starred', isStarred);
      btn.textContent = isStarred ? '★' : '☆';
    });
    wordsList.appendChild(row);
  });

  showScreen('screen-detail');
}

// ---------- DELETE ----------
function confirmDelete(id) {
  const ex = Storage.getById(id);
  $('modal-message').textContent = `האם אתה בטוח שברצונך למחוק את "${ex?.name}"?`;
  $('modal-overlay').classList.remove('hidden');

  $('btn-modal-confirm').onclick = () => {
    Storage.remove(id);
    $('modal-overlay').classList.add('hidden');
    renderHome();
  };
}

// ---------- UTIL ----------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
//  EVENT LISTENERS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  // --- Home ---
  $('btn-new-exercise').addEventListener('click', () => openCreate());

  // --- Create screen ---
  $('btn-back-create').addEventListener('click', renderHome);
  $('btn-save-exercise').addEventListener('click', saveExercise);
  $('btn-add-word').addEventListener('click', () => addWordRow());

  // Language picker
  $('language-picker').addEventListener('click', e => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLanguage = btn.dataset.lang;
    if (selectedLanguage === 'other') {
      $('custom-language').classList.remove('hidden');
      $('custom-language').focus();
    } else {
      $('custom-language').classList.add('hidden');
    }
  });

  // Direction picker
  $('direction-picker').addEventListener('click', e => {
    const btn = e.target.closest('.dir-btn');
    if (!btn) return;
    document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDirection = btn.dataset.dir;
  });

  // Allow Enter in word inputs to add a new row
  $('words-list').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const allInputs = [...$('words-list').querySelectorAll('input')];
      const idx = allInputs.indexOf(e.target);
      if (idx === allInputs.length - 1) {
        addWordRow();
        setTimeout(() => {
          const inputs = $('words-list').querySelectorAll('input');
          inputs[inputs.length - 2].focus(); // first input of new row
        }, 50);
      } else {
        allInputs[idx + 1]?.focus();
      }
    }
  });

  // --- Detail screen ---
  $('btn-back-detail').addEventListener('click', renderHome);
  $('btn-edit-exercise').addEventListener('click', () => openCreate(currentExerciseId));
  $('btn-delete-exercise').addEventListener('click', () => confirmDelete(currentExerciseId));

  // Game cards
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const ex = Storage.getById(currentExerciseId);
      if (!ex || ex.words.length < 2) {
        alert('צריך לפחות 2 מילים כדי לשחק!');
        return;
      }
      Games.start(card.dataset.game, currentExerciseId);
    });
  });

  // --- Modal ---
  $('btn-modal-cancel').addEventListener('click', () => {
    $('modal-overlay').classList.add('hidden');
  });
  $('modal-overlay').addEventListener('click', e => {
    if (e.target === $('modal-overlay')) $('modal-overlay').classList.add('hidden');
  });

  // --- Results ---
  $('btn-results-home').addEventListener('click', renderHome);
  $('btn-results-games').addEventListener('click', () => openDetail(currentExerciseId));
  $('btn-results-again').addEventListener('click', () => {
    Games.start(Games.currentGame, currentExerciseId);
  });

  // renderHome() is called by auth.js after login
});
