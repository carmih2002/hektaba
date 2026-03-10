// ============================================================
//  GAMES  –  Flashcard, TypeWord, Scramble, MultipleChoice
// ============================================================

const Games = (() => {

  let currentGame = null;
  let exerciseId  = null;
  let direction   = 'word-to-trans'; // 'word-to-trans' | 'trans-to-word'
  let queue       = [];
  let queueIndex  = 0;
  let score       = 0;
  let wrongCount  = 0;

  // ---- helpers ----
  function $(id) { return document.getElementById(id); }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Update star button to reflect current word's starred state
  function updateStarBtn(btnId) {
    const item = queue[queueIndex];
    if (!item) return;
    const btn = $(btnId);
    const starred = !!item.starred;
    btn.textContent = starred ? '★' : '☆';
    btn.classList.toggle('starred', starred);
  }

  // Toggle star for current word and update button
  function toggleStarCurrent(btnId) {
    const item = queue[queueIndex];
    if (!item) return;
    const isStarred = Storage.toggleStar(exerciseId, item.originalIndex);
    item.starred = isStarred;          // keep queue in sync
    const btn = $(btnId);
    btn.textContent = isStarred ? '★' : '☆';
    btn.classList.toggle('starred', isStarred);
  }

  // Returns {question, answer, questionLabel, answerLabel} based on direction
  function getQA(item) {
    if (direction === 'word-to-trans') {
      return { question: item.word, answer: item.translation, questionLabel: 'מילה', answerLabel: 'תרגום' };
    } else {
      return { question: item.translation, answer: item.word, questionLabel: 'תרגום', answerLabel: 'מילה' };
    }
  }

  function updateProgress(screenPrefix, current, total) {
    $(`${screenPrefix}-progress`).textContent = `${current} / ${total}`;
    const pct = (current / total) * 100;
    $(`${screenPrefix}-bar`).style.width = pct + '%';
  }

  function showResults() {
    const total = queue.length;
    const pct   = total > 0 ? Math.round((score / total) * 100) : 0;
    let emoji, title, stars;

    if (pct === 100)      { emoji = '🏆'; title = 'מושלם לגמרי!';  stars = '⭐⭐⭐'; }
    else if (pct >= 80)   { emoji = '🎉'; title = 'כל הכבוד!';     stars = '⭐⭐⭐'; }
    else if (pct >= 60)   { emoji = '😊'; title = 'לא רע כלל!';    stars = '⭐⭐'; }
    else if (pct >= 40)   { emoji = '💪'; title = 'המשך לתרגל!';   stars = '⭐'; }
    else                  { emoji = '📖'; title = 'כדאי לחזור!';    stars = ''; }

    $('results-emoji').textContent = emoji;
    $('results-title').textContent = title;
    $('results-score').textContent = `${score} מתוך ${total} נכון (${pct}%)`;
    $('results-stars').textContent = stars;
    showScreen('screen-results');
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
  }

  // ====================================================
  //  PUBLIC: start
  // ====================================================
  function start(game, exId) {
    currentGame = game;
    exerciseId  = exId;
    const ex    = Storage.getById(exId);
    if (!ex) return;

    direction  = ex.direction || 'word-to-trans';
    queue      = shuffle(ex.words.map((w, i) => ({ ...w, originalIndex: i })));
    queueIndex = 0;
    score      = 0;
    wrongCount = 0;

    switch (game) {
      case 'flashcard':      startFlashcard();      break;
      case 'typeword':       startTypeWord();       break;
      case 'scramble':       startScramble();       break;
      case 'multiplechoice': startMultipleChoice(); break;
    }
  }

  // ====================================================
  //  FLASHCARD GAME
  // ====================================================
  let fcFlipped = false;

  function startFlashcard() {
    showScreen('screen-flashcard');
    renderFlashcard();
  }

  function renderFlashcard() {
    if (queueIndex >= queue.length) { showResults(); return; }

    const item = queue[queueIndex];
    const qa   = getQA(item);

    $('flashcard-word').textContent       = qa.question;
    $('flashcard-trans').textContent      = qa.answer;
    $('flashcard-front-label').textContent = qa.questionLabel;
    $('flashcard-back-label').textContent  = qa.answerLabel;

    const card = $('flashcard');
    card.classList.remove('flipped');
    fcFlipped = false;

    updateProgress('flashcard', queueIndex + 1, queue.length);
    updateStarBtn('btn-star-flashcard');
  }

  function initFlashcard() {
    const card = $('flashcard');

    card.addEventListener('click', () => {
      fcFlipped = !fcFlipped;
      card.classList.toggle('flipped', fcFlipped);
    });
    card.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        fcFlipped = !fcFlipped;
        card.classList.toggle('flipped', fcFlipped);
      }
    });

    $('btn-fc-correct').addEventListener('click', () => {
      score++;
      queueIndex++;
      renderFlashcard();
    });

    $('btn-fc-wrong').addEventListener('click', () => {
      wrongCount++;
      queueIndex++;
      renderFlashcard();
    });

    $('btn-star-flashcard').addEventListener('click', () => toggleStarCurrent('btn-star-flashcard'));
    $('btn-back-flashcard').addEventListener('click', () => showScreen('screen-detail'));
  }

  // ====================================================
  //  TYPE WORD GAME
  // ====================================================
  let twAnswered = false;

  function startTypeWord() {
    showScreen('screen-typeword');
    renderTypeWord();
  }

  function renderTypeWord() {
    if (queueIndex >= queue.length) { showResults(); return; }

    twAnswered = false;
    const item = queue[queueIndex];
    const qa   = getQA(item);

    $('typeword-hint').textContent       = qa.question;
    $('typeword-input').value            = '';
    $('typeword-input').className        = 'type-input';
    $('typeword-feedback').className     = 'type-feedback hidden';
    $('typeword-feedback').textContent   = '';
    $('btn-typeword-next').classList.add('hidden');
    $('btn-typeword-check').classList.remove('hidden');
    $('typeword-score').textContent      = score;
    $('typeword-wrong').textContent      = wrongCount;

    updateProgress('typeword', queueIndex + 1, queue.length);
    updateStarBtn('btn-star-typeword');
    setTimeout(() => $('typeword-input').focus(), 100);
  }

  function checkTypeWord() {
    if (twAnswered) return;
    const item    = queue[queueIndex];
    const qa      = getQA(item);
    const answer  = $('typeword-input').value.trim();
    const correct = qa.answer;
    const isOk    = normalizeAnswer(answer) === normalizeAnswer(correct);

    twAnswered = true;
    const fb    = $('typeword-feedback');
    const input = $('typeword-input');

    if (isOk) {
      score++;
      input.classList.add('correct');
      fb.className   = 'type-feedback correct';
      fb.textContent = '✅ מעולה! תשובה נכונה!';
    } else {
      wrongCount++;
      input.classList.add('wrong');
      fb.className   = 'type-feedback wrong';
      fb.textContent = `❌ לא נכון. התשובה הנכונה: ${correct}`;
    }
    fb.classList.remove('hidden');
    $('btn-typeword-check').classList.add('hidden');
    $('btn-typeword-next').classList.remove('hidden');
  }

  function initTypeWord() {
    $('btn-typeword-check').addEventListener('click', checkTypeWord);
    $('typeword-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (!twAnswered) checkTypeWord();
        else { queueIndex++; renderTypeWord(); }
      }
    });
    $('btn-typeword-next').addEventListener('click', () => { queueIndex++; renderTypeWord(); });
    $('btn-star-typeword').addEventListener('click', () => toggleStarCurrent('btn-star-typeword'));
    $('btn-back-typeword').addEventListener('click', () => showScreen('screen-detail'));
  }

  // ====================================================
  //  SCRAMBLE GAME
  // ====================================================
  let scPlaced   = [];
  let scLetters  = [];
  let scWord     = '';
  let scAnswered = false;

  function startScramble() {
    showScreen('screen-scramble');
    renderScramble();
  }

  function renderScramble() {
    if (queueIndex >= queue.length) { showResults(); return; }

    scAnswered = false;
    const item = queue[queueIndex];
    const qa   = getQA(item);

    // Always scramble the answer; hint shows the question
    scWord    = qa.answer.trim();
    scPlaced  = [];
    scLetters = shuffle(scWord.split(''));

    $('scramble-hint').textContent       = qa.question;
    $('scramble-feedback').className     = 'type-feedback hidden';
    $('scramble-feedback').textContent   = '';
    $('btn-scramble-next').classList.add('hidden');
    $('btn-scramble-check').classList.remove('hidden');
    $('scramble-score').textContent      = score;
    $('scramble-wrong').textContent      = wrongCount;

    renderScrambleTiles();
    updateProgress('scramble', queueIndex + 1, queue.length);
    updateStarBtn('btn-star-scramble');
  }

  function renderScrambleTiles() {
    const pool   = $('scramble-letters');
    const answer = $('scramble-answer');
    pool.innerHTML   = '';
    answer.innerHTML = '';

    scLetters.forEach((letter, i) => {
      if (letter !== null) {
        const tile = createTile(letter, 'pool', () => {
          if (scAnswered) return;
          scPlaced.push({ letter, idx: i });
          scLetters[i] = null;
          renderScrambleTiles();
        });
        pool.appendChild(tile);
      } else {
        const blank = document.createElement('div');
        blank.style.width = '40px'; blank.style.height = '40px';
        pool.appendChild(blank);
      }
    });

    scPlaced.forEach((item, pi) => {
      const tile = createTile(item.letter, 'placed', () => {
        if (scAnswered) return;
        scLetters[item.idx] = item.letter;
        scPlaced.splice(pi, 1);
        renderScrambleTiles();
      });
      answer.appendChild(tile);
    });
  }

  function createTile(letter, type, onClick) {
    const tile = document.createElement('div');
    tile.className   = `letter-tile ${type}`;
    tile.textContent = letter;
    tile.addEventListener('click', onClick);
    return tile;
  }

  function checkScramble() {
    if (scAnswered) return;
    const answer = scPlaced.map(p => p.letter).join('');
    const isOk   = normalizeAnswer(answer) === normalizeAnswer(scWord);
    scAnswered   = true;

    const fb = $('scramble-feedback');
    if (isOk) {
      score++;
      fb.className   = 'type-feedback correct';
      fb.textContent = '✅ מעולה! נכון!';
    } else {
      wrongCount++;
      fb.className   = 'type-feedback wrong';
      fb.textContent = `❌ לא נכון. התשובה הייתה: ${scWord}`;
    }
    fb.classList.remove('hidden');
    $('btn-scramble-check').classList.add('hidden');
    $('btn-scramble-next').classList.remove('hidden');
  }

  function initScramble() {
    $('btn-scramble-check').addEventListener('click', checkScramble);
    $('btn-scramble-clear').addEventListener('click', () => {
      if (scAnswered) return;
      scPlaced.forEach(item => { scLetters[item.idx] = item.letter; });
      scPlaced = [];
      renderScrambleTiles();
    });
    $('btn-scramble-next').addEventListener('click', () => { queueIndex++; renderScramble(); });
    $('btn-star-scramble').addEventListener('click', () => toggleStarCurrent('btn-star-scramble'));
    $('btn-back-scramble').addEventListener('click', () => showScreen('screen-detail'));
  }

  // ====================================================
  //  MULTIPLE CHOICE GAME
  // ====================================================
  function startMultipleChoice() {
    showScreen('screen-multiplechoice');
    renderMC();
  }

  function renderMC() {
    if (queueIndex >= queue.length) { showResults(); return; }

    const allWords = Storage.getById(exerciseId).words;
    const item     = queue[queueIndex];
    const qa       = getQA(item);

    $('mc-word').textContent  = qa.question;
    $('mc-score').textContent = score;
    $('mc-wrong').textContent = wrongCount;
    updateProgress('mc', queueIndex + 1, queue.length);
    updateStarBtn('btn-star-mc');

    // Pick 3 distractors from the same "answer" pool
    const answerKey = direction === 'word-to-trans' ? 'translation' : 'word';
    const otherWords = allWords.filter(w => w[answerKey] !== qa.answer);
    const wrongOpts  = shuffle(otherWords).slice(0, 3).map(w => w[answerKey]);
    const options    = shuffle([qa.answer, ...wrongOpts]);

    const container = $('mc-options');
    container.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className   = 'mc-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => onMCAnswer(btn, opt, qa.answer, container));
      container.appendChild(btn);
    });
  }

  function onMCAnswer(clicked, chosen, correct, container) {
    container.querySelectorAll('.mc-option').forEach(b => { b.disabled = true; });

    if (chosen === correct) {
      clicked.classList.add('correct');
      score++;
    } else {
      clicked.classList.add('wrong');
      wrongCount++;
      container.querySelectorAll('.mc-option').forEach(b => {
        if (b.textContent === correct) b.classList.add('correct');
      });
    }

    $('mc-score').textContent = score;
    $('mc-wrong').textContent = wrongCount;
    setTimeout(() => { queueIndex++; renderMC(); }, 1200);
  }

  function initMultipleChoice() {
    $('btn-star-mc').addEventListener('click', () => toggleStarCurrent('btn-star-mc'));
    $('btn-back-multiplechoice').addEventListener('click', () => showScreen('screen-detail'));
  }

  // ====================================================
  //  SHARED HELPERS
  // ====================================================
  function normalizeAnswer(str) {
    return str.trim().toLowerCase()
      .replace(/['".,!?]/g, '')
      .replace(/\s+/g, ' ');
  }

  // ====================================================
  //  INIT
  // ====================================================
  function init() {
    initFlashcard();
    initTypeWord();
    initScramble();
    initMultipleChoice();
  }

  return {
    start,
    init,
    get currentGame() { return currentGame; }
  };

})();

document.addEventListener('DOMContentLoaded', () => Games.init());
