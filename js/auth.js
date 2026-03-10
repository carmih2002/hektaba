// ============================================================
//  AUTH  –  Login / Register screen + auth state listener
// ============================================================

(function () {
  let authMode = 'login'; // 'login' | 'register'

  function $(id) { return document.getElementById(id); }

  function setMode(mode) {
    authMode = mode;
    $('tab-login').classList.toggle('active', mode === 'login');
    $('tab-register').classList.toggle('active', mode === 'register');
    $('btn-auth-submit').textContent = mode === 'login' ? 'כניסה' : 'הרשמה';
    $('auth-password-confirm-wrap').classList.toggle('hidden', mode === 'login');
    clearError();
  }

  function showError(msg) {
    const el = $('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function clearError() {
    $('auth-error').classList.add('hidden');
  }

  function setLoading(on) {
    $('btn-auth-submit').disabled = on;
    $('btn-auth-submit').textContent = on ? '...' : (authMode === 'login' ? 'כניסה' : 'הרשמה');
  }

  function translateError(code) {
    const map = {
      'auth/user-not-found':       'אימייל לא קיים במערכת',
      'auth/wrong-password':       'סיסמה שגויה',
      'auth/invalid-credential':   'אימייל או סיסמה שגויים',
      'auth/email-already-in-use': 'האימייל כבר רשום במערכת',
      'auth/weak-password':        'הסיסמה חייבת להכיל לפחות 6 תווים',
      'auth/invalid-email':        'כתובת אימייל לא תקינה',
      'auth/too-many-requests':    'יותר מדי ניסיונות, נסה שוב מאוחר יותר',
    };
    return map[code] || 'שגיאה, נסה שוב';
  }

  async function handleSubmit() {
    const email    = $('auth-email').value.trim();
    const password = $('auth-password').value;
    clearError();

    if (!email || !password) { showError('נא למלא אימייל וסיסמה'); return; }

    if (authMode === 'register') {
      const confirm = $('auth-password-confirm').value;
      if (password !== confirm) { showError('הסיסמאות אינן תואמות'); return; }
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        await auth.createUserWithEmailAndPassword(email, password);
      }
    } catch (e) {
      showError(translateError(e.code));
      setLoading(false);
    }
  }

  // ---- auth state listener ----
  auth.onAuthStateChanged(async user => {
    if (user) {
      // Show loading while fetching data
      $('auth-loading').classList.remove('hidden');
      $('auth-card').classList.add('hidden');

      await Storage.init(user.uid);

      // Update user bar
      const emailShort = user.email.split('@')[0];
      $('user-display').textContent = emailShort;

      // Show home
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      renderHome();
    } else {
      // Show auth screen
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      $('screen-auth').classList.add('active');
      $('auth-loading').classList.add('hidden');
      $('auth-card').classList.remove('hidden');
    }
  });

  // ---- event listeners ----
  document.addEventListener('DOMContentLoaded', () => {
    $('tab-login').addEventListener('click',    () => setMode('login'));
    $('tab-register').addEventListener('click', () => setMode('register'));
    $('btn-auth-submit').addEventListener('click', handleSubmit);

    [$('auth-email'), $('auth-password'), $('auth-password-confirm')].forEach(el => {
      el.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });
    });

    $('btn-logout').addEventListener('click', () => {
      auth.signOut();
    });

    // forgot password
    $('btn-forgot').addEventListener('click', async () => {
      const email = $('auth-email').value.trim();
      if (!email) { showError('הכנס אימייל תחילה'); return; }
      try {
        await auth.sendPasswordResetEmail(email);
        clearError();
        $('auth-error').textContent = '📧 קישור לאיפוס נשלח לאימייל!';
        $('auth-error').classList.remove('hidden');
        $('auth-error').style.color = '#2f9e44';
      } catch(e) {
        showError(translateError(e.code));
      }
    });
  });

})();
