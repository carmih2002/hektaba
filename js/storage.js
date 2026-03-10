// ============================================================
//  STORAGE  –  Memory cache synced to Firestore
// ============================================================

const Storage = (() => {
  let cache = [];
  let uid   = null;

  function docRef() {
    return db.collection('users').doc(uid);
  }

  // Called once after login – loads user's exercises from Firestore
  async function init(userId) {
    uid = userId;
    try {
      const snap = await docRef().get();
      cache = snap.exists ? (snap.data().exercises || []) : [];
    } catch (e) {
      console.error('Storage.init error:', e);
      cache = [];
    }
  }

  // Sync cache to Firestore (fire-and-forget)
  function sync() {
    if (!uid) return;
    docRef().set({ exercises: cache }).catch(e => console.error('sync error:', e));
  }

  function getAll() {
    return cache;
  }

  function getById(id) {
    return cache.find(e => e.id === id) || null;
  }

  function create(name, language, words, direction = 'word-to-trans') {
    const exercise = {
      id: Date.now().toString(),
      name,
      language,
      direction,
      words,
      createdAt: Date.now(),
      emoji: randomEmoji()
    };
    cache.push(exercise);
    sync();
    return exercise;
  }

  function update(id, data) {
    const idx = cache.findIndex(e => e.id === id);
    if (idx === -1) return null;
    cache[idx] = { ...cache[idx], ...data };
    sync();
    return cache[idx];
  }

  function remove(id) {
    cache = cache.filter(e => e.id !== id);
    sync();
  }

  function toggleStar(exerciseId, wordIndex) {
    const ex = cache.find(e => e.id === exerciseId);
    if (!ex || !ex.words[wordIndex]) return false;
    ex.words[wordIndex].starred = !ex.words[wordIndex].starred;
    sync();
    return ex.words[wordIndex].starred;
  }

  const EMOJIS = ['📖','🌟','🎒','🦋','🌈','🎯','🚀','🎨','🌸','⚡','🦄','🎪','🏆','🎭','🌙'];
  function randomEmoji() {
    return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  }

  return { init, getAll, getById, create, update, remove, toggleStar };
})();
