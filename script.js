const $ = id => document.getElementById(id);
const toastEl = $('toast');

let currentUser = null;

// ==================== STORAGE ====================
function getUsers() {
  try { return JSON.parse(localStorage.getItem('wp_users') || '{}'); }
  catch { return {}; }
}
function saveUsers(u) { localStorage.setItem('wp_users', JSON.stringify(u)); }
function saveSession(s) { localStorage.setItem('wp_session', s); }
function getSession() { return localStorage.getItem('wp_session'); }
function clearSession() { localStorage.removeItem('wp_session'); }

// ==================== TOAST ====================
function toast(msg, type = 'success') {
  toastEl.textContent = msg;
  toastEl.className = 'toast show ' + type;
  setTimeout(() => toastEl.className = 'toast', 3000);
}

// ==================== LOG ====================
function addLog(msg, type = 'info') {
  const box = $('consoleBody');
  if (!box) return;
  const line = document.createElement('div');
  line.className = 'log ' + type;
  line.textContent = `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

// ==================== MODAL ====================
$('showLogin').onclick = () => $('loginModal').classList.add('active');
$('showRegister').onclick = () => $('registerModal').classList.add('active');
document.querySelectorAll('.modal-close, [data-close]').forEach(b => {
  b.onclick = () => b.closest('.modal').classList.remove('active');
});
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
});

function showErr(id, msg) {
  const el = $(id);
  el.textContent = '⚠ ' + msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ==================== REGISTER ====================
$('doRegister').onclick = () => {
  const u = $('regUsername').value.trim();
  const em = $('regEmail').value.trim();
  const p = $('regPassword').value;
  const p2 = $('regPassword2').value;

  if (u.length < 3) return showErr('regError', 'Username minimal 3 karakter');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return showErr('regError', 'Email tidak valid');
  if (p.length < 6) return showErr('regError', 'Password minimal 6 karakter');
  if (p !== p2) return showErr('regError', 'Konfirmasi password tidak cocok');

  const users = getUsers();
  if (users[u]) return showErr('regError', 'Username sudah terdaftar');

  users[u] = {
    id: Date.now(),
    username: u,
    email: em,
    password: btoa(p),
    role: 'USER',
    limit: 5,
    emails: [],
    reportsSent: 0,
    joinedAt: new Date().toISOString()
  };
  saveUsers(users);
  toast('Register berhasil! Silakan login');
  $('registerModal').classList.remove('active');
  $('loginModal').classList.add('active');
  $('loginUsername').value = u;
};

// ==================== LOGIN ====================
$('doLogin').onclick = () => {
  const u = $('loginUsername').value.trim();
  const p = $('loginPassword').value;

  if (!u || !p) return showErr('loginError', 'Isi username & password');

  if (u === 'pianbr' && p === 'nailong213') {
    currentUser = {
      id: 'OWNER-' + Date.now(),
      username: 'pianbr',
      email: 'owner@pianbr.local',
      role: 'OWNER',
      limit: 9999,
      emails: [],
      reportsSent: 0,
      joinedAt: new Date().toISOString(),
      isOwner: true
    };
    saveSession('__OWNER__');
    toast('Selamat datang, Owner!');
    showDashboard();
    return;
  }

  const users = getUsers();
  const user = users[u];
  if (!user) return showErr('loginError', 'Akun tidak ditemukan. Belum mendaftar? Register sekarang.');
  if (user.password !== btoa(p)) return showErr('loginError', 'Password salah');

  currentUser = user;
  saveSession(u);
  toast('Login berhasil');
  showDashboard();
};

// ==================== LOGOUT ====================
$('logoutBtn').onclick = () => {
  clearSession();
  currentUser = null;
  $('dashView').style.display = 'none';
  $('authView').style.display = 'flex';
};

// ==================== DASHBOARD ====================
function saveCurrentUser() {
  if (currentUser.isOwner) return;
  const users = getUsers();
  users[currentUser.username] = currentUser;
  saveUsers(users);
}

function showDashboard() {
  $('authView').style.display = 'none';
  $('dashView').style.display = 'flex';
  $('dashUser').textContent = currentUser.username;
  $('dashId').textContent = currentUser.id;
  $('dashRole').textContent = currentUser.role;
  $('dashReport').textContent = (currentUser.reportsSent || 0) + ' email';
  $('dashEmail').textContent = (currentUser.emails?.length || 0) + ' terdaftar';
  $('dashLimit').textContent = currentUser.isOwner ? '∞' : currentUser.limit + '/5';

  if (currentUser.role === 'OWNER') {
    document.querySelectorAll('.owner-only').forEach(b => b.style.display = 'block');
  } else {
    document.querySelectorAll('.owner-only').forEach(b => b.style.display = 'none');
  }

  renderWorkspace('home');
}

// ==================== MENU ====================
document.querySelectorAll('.menu-btn').forEach(b => {
  b.onclick = () => renderWorkspace(b.dataset.menu);
});

function renderWorkspace(menu) {
  const ws = $('workspace');
  switch (menu) {
    case 'home':
      ws.innerHTML = '<div class="ws-placeholder"><div class="ws-icon">◇</div><p>Pilih menu di atas untuk memulai</p></div>';
      break;

    case 'gmail': {
      let list = currentUser.emails.length
        ? `<div class="info-row" style="display:block;margin-bottom:10px"><div style="font-size:11px;color:var(--cyan);margin-bottom:6px">EMAIL TERDAFTAR:</div>${currentUser.emails.map((e, i) => `<div style="font-size:12px;padding:4px 0;word-break:break-all">${i + 1}. ${e.email}</div>`).join('')}</div>`
        : '<div class="info-row" style="display:block;margin-bottom:10px;font-size:12px;color:var(--dim)">Belum ada email terdaftar.</div>';

      ws.innerHTML = `
        <div class="form-group"><label>GMAIL MANAGER</label>
          <div style="font-size:11px;color:var(--dim);line-height:1.7;padding:10px;background:var(--input);border-radius:8px;margin-bottom:10px">
            Format: <b style="color:var(--cyan)">email@gmail.com|app_password</b><br>
            App password 16 digit dari Google Account → Security → App Passwords.<br>
            Setiap email baru = <b style="color:var(--green)">+5 limit report</b>
          </div>
        </div>
        ${list}
        <div class="form-group"><label>EMAIL & APP PASSWORD</label>
          <input type="text" id="gmailInput" placeholder="email@gmail.com|abcdefghijklmnop">
        </div>
        <button class="btn-main solid" id="addGmailBtn">TAMBAH EMAIL</button>
        <button class="btn-outline" id="clearEmailsBtn" style="margin-top:8px">HAPUS SEMUA EMAIL</button>
      `;
      $('addGmailBtn').onclick = addGmail;
      $('clearEmailsBtn').onclick = () => {
        if (!confirm('Hapus semua email?')) return;
        currentUser.emails = [];
        saveCurrentUser();
        toast('Semua email dihapus');
        renderWorkspace('gmail');
        updateDash();
      };
      break;
    }

    case 'report': {
      if (!currentUser.emails.length) {
        ws.innerHTML = '<div class="info-row" style="display:block;color:var(--red);border-color:rgba(239,68,68,.3)">Belum ada sender email. Tambah di Gmail Manager dulu.</div>';
        return;
      }
      ws.innerHTML = `
        <div class="form-group"><label>GAS REPORT</label>
          <div style="font-size:11px;color:var(--dim);line-height:1.7;padding:10px;background:var(--input);border-radius:8px;margin-bottom:10px">
            Kirim report ke banyak email tujuan. Pisahkan dengan koma atau enter.
          </div>
        </div>
        <div class="form-group"><label>EMAIL TUJUAN</label>
          <textarea id="targetEmails" placeholder="report1@gmail.com, report2@gmail.com"></textarea>
        </div>
        <div class="form-group"><label>SUBJECT</label>
          <input type="text" id="subjectInput" placeholder="Report — Fake Account">
        </div>
        <div class="form-group"><label>ISI PESAN</label>
          <textarea id="messageInput" placeholder="Tulis isi report..."></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group"><label>KIRIM PER EMAIL</label><input type="number" id="countInput" value="3" min="1" max="50"></div>
          <div class="form-group"><label>DELAY (detik)</label><input type="number" id="delayInput" value="2" min="1" max="10"></div>
        </div>
        <button class="btn-main solid" id="sendReportBtn">SEND REPORT</button>
      `;
      $('sendReportBtn').onclick = sendReport;
      break;
    }

    case 'progress':
      ws.innerHTML = `
        <div class="form-group"><label>PROGRESS REPORT</label>
          <div style="font-size:12px;line-height:2;padding:12px;background:var(--input);border-radius:8px">
            <b>User:</b> ${currentUser.username}<br>
            <b>Report Terkirim:</b> ${currentUser.reportsSent || 0}<br>
            <b>Email Terdaftar:</b> ${currentUser.emails.length}<br>
            <b>Limit:</b> ${currentUser.isOwner ? '∞' : currentUser.limit}<br>
            <b>Role:</b> ${currentUser.role}
          </div>
        </div>`;
      break;

    case 'stats':
      ws.innerHTML = `
        <div class="form-group"><label>STATISTIK EMAIL</label>
          <div style="font-size:12px;line-height:2;padding:12px;background:var(--input);border-radius:8px">
            <b>Total Email:</b> ${currentUser.emails.length}<br>
            <b>Total Report:</b> ${currentUser.reportsSent || 0}<br>
            <b>Limit:</b> ${currentUser.isOwner ? '∞' : currentUser.limit}<br>
            <b>Bergabung:</b> ${new Date(currentUser.joinedAt).toLocaleString('id-ID')}
          </div>
        </div>`;
      break;

    case 'session':
      ws.innerHTML = `
        <div class="form-group"><label>SESSION</label>
          <div style="font-size:12px;line-height:2;padding:12px;background:var(--input);border-radius:8px;word-break:break-all">
            <b>ID:</b> ${currentUser.id}<br>
            <b>Username:</b> ${currentUser.username}<br>
            <b>Email:</b> ${currentUser.email}<br>
            <b>Status:</b> <span style="color:var(--green)">Aktif</span>
          </div>
        </div>`;
      break;

    case 'role':
      ws.innerHTML = `
        <div class="form-group"><label>UP ROLE</label>
          <div style="font-size:12px;line-height:2;padding:12px;background:var(--input);border-radius:8px">
            <b>Role lo:</b> ${currentUser.role}<br><br>
            USER → VIP : Rp 10.000<br>
            VIP → PREMIUM : Rp 25.000<br>
            PREMIUM → OWNER : Rp 100.000<br><br>
            Chat owner untuk upgrade.
          </div>
        </div>`;
      break;

    case 'limit':
      ws.innerHTML = `
        <div class="form-group"><label>MY LIMIT</label>
          <div style="font-size:12px;line-height:2;padding:12px;background:var(--input);border-radius:8px">
            <b>Limit Tersisa:</b> ${currentUser.isOwner ? '∞' : currentUser.limit}<br>
            <b>Email Terdaftar:</b> ${currentUser.emails.length}<br><br>
            Setiap email baru = +5 limit
          </div>
        </div>`;
      break;

    case 'donasi':
      ws.innerHTML = `
        <div class="form-group"><label>DONASI</label>
          <div style="font-size:12px;line-height:2;padding:12px;background:var(--input);border-radius:8px">
            Support biar terus berkembang:<br>
            <a href="https://saweria.co/why01" target="_blank" style="color:var(--cyan)">saweria.co/why01</a>
          </div>
        </div>`;
      break;

    case 'qris':
      ws.innerHTML = `
        <div class="form-group"><label>QRIS PAYMENT</label>
          <div style="padding:12px;background:var(--input);border-radius:8px;text-align:center">
            <img src="https://cdn.phototourl.com/member/2026-10-01-4a545d73-7363-4386-ae36-8ba663294866.jpg" style="max-width:220px;background:#fff;padding:6px;border-radius:8px" onerror="this.style.display='none'">
            <p style="font-size:11px;color:var(--dim);margin-top:8px">Scan QRIS untuk donasi</p>
          </div>
        </div>`;
      break;

    case 'owner':
      ws.innerHTML = `
        <div class="form-group"><label>CHAT OWNER</label>
          <div style="font-size:12px;line-height:2;padding:12px;background:var(--input);border-radius:8px">
            Telegram: <a href="https://t.me/Pianbr" target="_blank" style="color:var(--cyan)">@Pianbr</a>
          </div>
        </div>`;
      break;

    case 'ownerpanel':
      if (currentUser.role !== 'OWNER') {
        ws.innerHTML = '<div class="info-row" style="display:block;color:var(--red);border-color:rgba(239,68,68,.3)">Akses ditolak. Halaman ini khusus Owner.</div>';
        return;
      }
      renderOwnerPanel();
      break;
  }
}

// ==================== OWNER PANEL ====================
function renderOwnerPanel() {
  const ws = $('workspace');
  const users = getUsers();
  const list = Object.values(users);

  let totalEmails = 0, totalReports = 0;
  list.forEach(u => {
    totalEmails += u.emails?.length || 0;
    totalReports += u.reportsSent || 0;
  });

  let rows = '';
  if (!list.length) {
    rows = '<div class="owner-empty">Belum ada user yang terdaftar.</div>';
  } else {
    list.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
    list.forEach(u => {
      const roleClass = u.role === 'OWNER' ? 'owner' : u.role === 'VIP' ? 'vip' : '';
      rows += `
        <div class="owner-user-row">
          <div class="owner-user-info">
            <div class="owner-user-name">${u.username}</div>
            <div class="owner-user-meta">${u.email} • ${u.emails?.length || 0} sender • ${u.reportsSent || 0} report</div>
            <div class="owner-user-role ${roleClass}">${u.role} • ${new Date(u.joinedAt).toLocaleDateString('id-ID')}</div>
          </div>
          <button class="owner-del-btn" onclick="deleteUser('${u.username}')">HAPUS</button>
        </div>
      `;
    });
  }

  ws.innerHTML = `
    <div class="form-group"><label>OWNER PANEL</label>
      <div style="font-size:11px;color:var(--gold);line-height:1.7;padding:10px;background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.2);border-radius:8px;margin-bottom:12px">
        Selamat datang, Owner! Di sini lo bisa liat semua user yang daftar ke web lo.
      </div>
    </div>

    <div class="owner-stat-grid">
      <div class="owner-stat">
        <div class="owner-stat-num">${list.length}</div>
        <div class="owner-stat-label">TOTAL USER</div>
      </div>
      <div class="owner-stat">
        <div class="owner-stat-num">${totalEmails}</div>
        <div class="owner-stat-label">SENDER EMAIL</div>
      </div>
      <div class="owner-stat">
        <div class="owner-stat-num">${totalReports}</div>
        <div class="owner-stat-label">TOTAL REPORT</div>
      </div>
    </div>

    <div class="form-group"><label>DAFTAR USER TERDAFTAR</label>
      <div class="owner-user-list">${rows}</div>
    </div>
  `;
}

window.deleteUser = function(username) {
  if (currentUser.role !== 'OWNER') return;
  if (!confirm(`Hapus user "${username}"?`)) return;
  const users = getUsers();
  delete users[username];
  saveUsers(users);
  toast(`User "${username}" dihapus`);
  renderOwnerPanel();
};

function updateDash() {
  $('dashReport').textContent = (currentUser.reportsSent || 0) + ' email';
  $('dashEmail').textContent = (currentUser.emails?.length || 0) + ' terdaftar';
  $('dashLimit').textContent = currentUser.isOwner ? '∞' : currentUser.limit + '/5';
}

// ==================== ADD GMAIL ====================
function addGmail() {
  const input = $('gmailInput').value.trim();
  const parts = input.split('|');
  if (parts.length !== 2) return toast('Format salah: email|app_password', 'error');
  const [email, appPass] = parts.map(s => s.trim());
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Email tidak valid', 'error');
  if (appPass.length !== 16) return toast('App password harus 16 digit', 'error');
  if (currentUser.emails.find(e => e.email === email)) return toast('Email sudah terdaftar', 'error');

  currentUser.emails.push({ email, appPassword: appPass });
  currentUser.limit += 5;
  saveCurrentUser();
  updateDash();
  toast('Email ditambahkan! +5 limit');
  renderWorkspace('gmail');
}

// ==================== SEND REPORT ====================
async function sendReport() {
  const raw = $('targetEmails').value.trim();
  const subj = $('subjectInput').value.trim();
  const msg = $('messageInput').value.trim();
  const cnt = parseInt($('countInput').value);
  const dly = parseInt($('delayInput').value) * 1000;

  if (!raw || !subj || !msg) return toast('Isi semua field!', 'error');

  const targets = raw.split(/[\s,;\n]+/).map(s => s.trim()).filter(Boolean);
  const valid = targets.filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (!valid.length) return toast('Tidak ada email valid', 'error');

  const btn = $('sendReportBtn');
  btn.disabled = true; btn.textContent = 'MENGIRIM...';

  addLog(`Mulai report: ${valid.length} target × ${cnt}x`, 'info');
  let ok = 0, fail = 0;

  for (let t = 0; t < valid.length; t++) {
    for (let i = 0; i < cnt; i++) {
      const sender = currentUser.emails[i % currentUser.emails.length];
      try {
        const r = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderEmail: sender.email,
            appPassword: sender.appPassword,
            targetEmail: valid[t],
            subject: subj,
            message: msg
          })
        });
        const ct = r.headers.get('content-type');
        if (!ct || !ct.includes('json')) throw new Error('Server error ' + r.status);
        const d = await r.json();
        if (d.success) { ok++; addLog(`OK → ${valid[t]}`, 'success'); }
        else { fail++; addLog(`GAGAL → ${d.error}`, 'failed'); }
      } catch (e) {
        fail++;
        addLog(`ERROR: ${e.message}`, 'failed');
      }
      if (i < cnt - 1) await new Promise(r => setTimeout(r, dly));
    }
    if (t < valid.length - 1) await new Promise(r => setTimeout(r, dly));
  }

  currentUser.reportsSent = (currentUser.reportsSent || 0) + ok;
  saveCurrentUser();
  updateDash();

  btn.disabled = false; btn.textContent = 'SEND REPORT';
  addLog(`SELESAI: ${ok} sukses, ${fail} gagal`, 'info');
  toast(`Selesai! ${ok} terkirim`);
}

$('clearLog').onclick = () => { $('consoleBody').innerHTML = ''; addLog('Console cleared'); };

// ==================== INIT ====================
const session = getSession();
if (session === '__OWNER__') {
  currentUser = {
    id: 'OWNER-' + Date.now(),
    username: 'pianbr',
    email: 'owner@pianbr.local',
    role: 'OWNER',
    limit: 9999,
    emails: [],
    reportsSent: 0,
    joinedAt: new Date().toISOString(),
    isOwner: true
  };
  showDashboard();
} else if (session) {
  const users = getUsers();
  if (users[session]) {
    currentUser = users[session];
    showDashboard();
  } else clearSession();
    }
