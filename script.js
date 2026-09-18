/* =====================================================
   NOCTYX V5.0 — AUTH + REPORT PANEL
   ===================================================== */

// ============================
// STORAGE
// ============================
const STORAGE_KEY = 'noctyx_users';
const SESSION_KEY = 'noctyx_session';

// ============================
// STATE
// ============================
let currentUser = null;
let loginCaptchaText = '';
let regCaptchaText = '';

// ============================
// DOM REFS
// ============================
const authWrapper = document.getElementById('authWrapper');
const dashboard = document.getElementById('dashboard');
const workspace = document.getElementById('workspace');
const consoleBody = document.getElementById('consoleBody');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const toastIcon = document.getElementById('toastIcon');

// ============================
// USER STORAGE
// ============================
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function saveSession(username) {
    localStorage.setItem(SESSION_KEY, username);
}

function getSession() {
    return localStorage.getItem(SESSION_KEY);
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// ============================
// CAPTCHA GENERATOR
// ============================
function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function initCaptcha() {
    loginCaptchaText = generateCaptcha();
    regCaptchaText = generateCaptcha();
    document.getElementById('loginCaptchaCode').textContent = loginCaptchaText;
    document.getElementById('regCaptchaCode').textContent = regCaptchaText;
    document.getElementById('loginCaptcha').value = '';
    document.getElementById('regCaptcha').value = '';
}

// ============================
// TAB SWITCH
// ============================
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(target + 'Form').classList.add('active');
        hideError('loginError');
        hideError('regError');
        initCaptcha();
    });
});

document.getElementById('switchToRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('[data-tab="register"]').click();
});

document.getElementById('switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('[data-tab="login"]').click();
});

// ============================
// CAPTCHA REFRESH
// ============================
document.getElementById('loginCaptchaRefresh').addEventListener('click', () => {
    loginCaptchaText = generateCaptcha();
    document.getElementById('loginCaptchaCode').textContent = loginCaptchaText;
    document.getElementById('loginCaptcha').value = '';
});

document.getElementById('regCaptchaRefresh').addEventListener('click', () => {
    regCaptchaText = generateCaptcha();
    document.getElementById('regCaptchaCode').textContent = regCaptchaText;
    document.getElementById('regCaptcha').value = '';
});

// ============================
// ERROR HANDLER
// ============================
function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = '⚠️ ' + msg;
    el.classList.add('show');
}

function hideError(id) {
    const el = document.getElementById(id);
    el.classList.remove('show');
}

// ============================
// REGISTER
// ============================
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    hideError('regError');

    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    const captcha = document.getElementById('regCaptcha').value.trim().toUpperCase();

    // Validasi
    if (username.length < 3) {
        showError('regError', 'Username minimal 3 karakter!');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('regError', 'Email tidak valid!');
        return;
    }
    if (password.length < 6) {
        showError('regError', 'Password minimal 6 karakter!');
        return;
    }
    if (password !== password2) {
        showError('regError', 'Konfirmasi password tidak cocok!');
        return;
    }
    if (captcha !== regCaptchaText) {
        showError('regError', 'Captcha salah! Coba lagi.');
        regCaptchaText = generateCaptcha();
        document.getElementById('regCaptchaCode').textContent = regCaptchaText;
        document.getElementById('regCaptcha').value = '';
        return;
    }

    const users = getUsers();
    if (users[username]) {
        showError('regError', 'Username sudah terdaftar!');
        return;
    }

    // Simpan user baru
    users[username] = {
        id: Date.now(),
        username,
        email,
        password: btoa(password), // Simple encode
        role: 'USER',
        limit: 5,
        emails: [],
        reportsSent: 0,
        joinedAt: new Date().toISOString()
    };
    saveUsers(users);

    addLog(`User baru terdaftar: ${username}`, 'success');
    showToast('Register berhasil! Silakan login.', 'success');

    // Auto switch ke login
    document.querySelector('[data-tab="login"]').click();
    document.getElementById('loginUsername').value = username;
    document.getElementById('loginPassword').value = '';
});

// ============================
// LOGIN
// ============================
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    hideError('loginError');

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const captcha = document.getElementById('loginCaptcha').value.trim().toUpperCase();

    if (!username || !password) {
        showError('loginError', 'Isi username dan password!');
        return;
    }
    if (captcha !== loginCaptchaText) {
        showError('loginError', 'Captcha salah! Coba lagi.');
        loginCaptchaText = generateCaptcha();
        document.getElementById('loginCaptchaCode').textContent = loginCaptchaText;
        document.getElementById('loginCaptcha').value = '';
        return;
    }

    const users = getUsers();
    const user = users[username];

    if (!user) {
        showError('loginError', 'Akun tidak ditemukan. Belum mendaftar? Register sekarang.');
        return;
    }

    if (user.password !== btoa(password)) {
        showError('loginError', 'Password salah!');
        return;
    }

    // Login sukses
    currentUser = user;
    saveSession(username);
    addLog(`Login berhasil: ${username}`, 'success');
    showToast(`Selamat datang, ${username}!`, 'success');
    showDashboard();
});

// ============================
// LOGOUT
// ============================
document.getElementById('logoutBtn').addEventListener('click', () => {
    clearSession();
    currentUser = null;
    dashboard.style.display = 'none';
    authWrapper.style.display = 'flex';
    initCaptcha();
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    addLog('Logout berhasil.', 'warn');
    showToast('Logout berhasil!', 'success');
});

// ============================
// SHOW DASHBOARD
// ============================
function showDashboard() {
    authWrapper.style.display = 'none';
    dashboard.style.display = 'flex';
    updateInfoPanel();
    renderPlaceholder();
}

// ============================
// UPDATE INFO PANEL
// ============================
function updateInfoPanel() {
    if (!currentUser) return;
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userId').textContent = currentUser.id;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('reportCount').textContent = `${currentUser.reportsSent || 0} email`;
    document.getElementById('emailCount').textContent = `${currentUser.emails?.length || 0} terdaftar`;
    document.getElementById('userLimit').textContent = `${currentUser.limit}/5`;
}

function saveCurrentUser() {
    const users = getUsers();
    users[currentUser.username] = currentUser;
    saveUsers(users);
}

// ============================
// LOG SYSTEM
// ============================
function addLog(msg, type = 'info') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString('id-ID');
    line.textContent = `[${time}] ${msg}`;
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

document.getElementById('clearLog').addEventListener('click', () => {
    consoleBody.innerHTML = '';
    addLog('Console cleared.', 'info');
});

// ============================
// TOAST
// ============================
function showToast(msg, type = 'success') {
    toastMsg.textContent = msg;
    toastIcon.textContent = type === 'success' ? '✓' : '✕';
    toastIcon.style.color = type === 'success' ? '#00ff88' : '#ff3366';
    toast.style.borderColor = type === 'success' ? '#00f0ff' : '#ff3366';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================
// MENU HANDLERS (DASHBOARD)
// ============================
document.querySelectorAll('.neon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const menu = btn.dataset.menu;
        addLog(`Opening menu: ${menu}`, 'info');
        renderWorkspace(menu);
    });
});

// ============================
// RENDER WORKSPACE
// ============================
function renderWorkspace(menu) {
    switch (menu) {
        case 'gmail': renderGmailManager(); break;
        case 'report': renderGasReport(); break;
        case 'progress': renderProgress(); break;
        case 'stats': renderStats(); break;
        case 'session': renderSession(); break;
        case 'role': renderRole(); break;
        case 'limit': renderLimit(); break;
        case 'donasi': renderDonasi(); break;
        case 'qris': renderQris(); break;
        case 'owner': renderOwner(); break;
        case 'akun': renderAkun(); break;
        case 'referral': renderReferral(); break;
        default: renderPlaceholder();
    }
}

function renderPlaceholder() {
    workspace.innerHTML = `
        <div class="workspace-placeholder">
            <div class="placeholder-icon">◈</div>
            <p>Pilih menu di atas untuk memulai</p>
        </div>
    `;
}

// ============================
// GMAIL MANAGER
// ============================
function renderGmailManager() {
    let emailListHTML = '';
    if (currentUser.emails.length > 0) {
        emailListHTML = `
            <div class="info-box">
                <strong>📮 Email Terdaftar:</strong><br>
                ${currentUser.emails.map((e, i) => `${i + 1}. <code>${e.email}</code>`).join('<br>')}
            </div>
        `;
    } else {
        emailListHTML = `<div class="info-box">📭 Belum ada email terdaftar.</div>`;
    }

    workspace.innerHTML = `
        <div class="form-group">
            <label>➕ GMAIL MANAGER</label>
            <div class="info-box">
                Tambah email pengirim dengan format:<br>
                <strong>email@gmail.com|app_password</strong><br><br>
                <strong>Cara dapet App Password:</strong><br>
                1. Buka myaccount.google.com/apppasswords<br>
                2. Pilih Mail → Other → Generate<br>
                3. Copy 16 digit password<br><br>
                ⚠️ Setiap email baru = <strong>+5 limit report</strong>!
            </div>
        </div>
        ${emailListHTML}
        <div class="form-group">
            <label>Email & App Password</label>
            <input type="text" id="gmailInput" placeholder="email@gmail.com|abcdefghijklmnop" />
        </div>
        <button class="action-btn" id="addGmailBtn">TAMBAH EMAIL</button>
        <button class="action-btn secondary" id="clearEmailsBtn">HAPUS SEMUA EMAIL</button>
    `;

    document.getElementById('addGmailBtn').addEventListener('click', addGmail);
    document.getElementById('clearEmailsBtn').addEventListener('click', () => {
        currentUser.emails = [];
        saveCurrentUser();
        updateInfoPanel();
        renderGmailManager();
        addLog('Semua email dihapus.', 'warn');
        showToast('Semua email dihapus!', 'success');
    });
}

function addGmail() {
    const input = document.getElementById('gmailInput').value.trim();
    const parts = input.split('|');

    if (parts.length !== 2) {
        addLog('Format salah. Gunakan email|app_password', 'failed');
        showToast('Format salah!', 'failed');
        return;
    }

    const [email, appPassword] = parts.map(s => s.trim());

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addLog('Email tidak valid.', 'failed');
        showToast('Email tidak valid!', 'failed');
        return;
    }

    if (appPassword.length !== 16) {
        addLog('App Password harus 16 digit.', 'failed');
        showToast('App Password harus 16 digit!', 'failed');
        return;
    }

    if (currentUser.emails.find(e => e.email === email)) {
        addLog('Email sudah terdaftar.', 'warn');
        showToast('Email sudah terdaftar!', 'failed');
        return;
    }

    currentUser.emails.push({ email, appPassword });
    currentUser.limit += 5;
    saveCurrentUser();
    updateInfoPanel();
    renderGmailManager();
    addLog(`Email ditambahkan: ${email} (+5 limit)`, 'success');
    showToast('Email berhasil ditambahkan! +5 limit', 'success');
}

// ============================
// GAS REPORT
// ============================
function renderGasReport() {
    if (currentUser.emails.length === 0) {
        workspace.innerHTML = `
            <div class="info-box" style="border-color:#ff3366; color:#ff3366;">
                ❌ Lo belum daftar email! Tambah dulu di <strong>Gmail Manager</strong>.
            </div>
        `;
        addLog('Gagal buka report: email belum terdaftar.', 'failed');
        return;
    }

    workspace.innerHTML = `
        <div class="form-group">
            <label>⚡ GAS REPORT</label>
            <div class="info-box">
                Kirim report ke email target. Lo bisa isi <strong>email tujuan</strong>, <strong>subject</strong>, dan <strong>isi pesan</strong> sendiri.
            </div>
        </div>
        <div class="form-group">
            <label>EMAIL TUJUAN</label>
            <input type="email" id="targetEmail" placeholder="target@gmail.com" />
        </div>
        <div class="form-group">
            <label>SUBJECT</label>
            <input type="text" id="subjectInput" placeholder="Penting - Verifikasi Akun" />
        </div>
        <div class="form-group">
            <label>ISI PESAN</label>
            <textarea id="messageInput" placeholder="Tulis pesan report di sini..."></textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>JUMLAH KIRIM</label>
                <input type="number" id="countInput" value="5" min="1" max="50" />
            </div>
            <div class="form-group">
                <label>DELAY (detik)</label>
                <input type="number" id="delayInput" value="2" min="1" max="10" />
            </div>
        </div>
        <button class="action-btn" id="sendReportBtn">🚀 GAS REPORT!</button>
    `;

    document.getElementById('sendReportBtn').addEventListener('click', sendReport);
}

async function sendReport() {
    const targetEmail = document.getElementById('targetEmail').value.trim();
    const subject = document.getElementById('subjectInput').value.trim();
    const message = document.getElementById('messageInput').value.trim();
    const count = parseInt(document.getElementById('countInput').value);
    const delay = parseInt(document.getElementById('delayInput').value) * 1000;

    if (!targetEmail || !subject || !message) {
        showToast('Isi semua field!', 'failed');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
        showToast('Email target tidak valid!', 'failed');
        return;
    }

    const btn = document.getElementById('sendReportBtn');
    btn.disabled = true;
    btn.textContent = '⏳ MENGIRIM...';

    addLog(`Memulai report ke ${targetEmail} (${count}x)`, 'info');

    let success = 0;
    let failed = 0;

    for (let i = 0; i < count; i++) {
        const sender = currentUser.emails[i % currentUser.emails.length];
        addLog(`[${i + 1}/${count}] Mengirim dari ${sender.email}...`, 'info');

        try {
            const resp = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderEmail: sender.email,
                    appPassword: sender.appPassword,
                    targetEmail,
                    subject,
                    message
                })
            });

            const data = await resp.json();

            if (data.success) {
                success++;
                addLog(`✅ [${i + 1}/${count}] Terkirim!`, 'success');
            } else {
                failed++;
                addLog(`❌ [${i + 1}/${count}] Gagal: ${data.error}`, 'failed');
            }
        } catch (err) {
            failed++;
            addLog(`❌ [${i + 1}/${count}] Error: ${err.message}`, 'failed');
        }

        if (i < count - 1) {
            await new Promise(r => setTimeout(r, delay));
        }
    }

    currentUser.reportsSent = (currentUser.reportsSent || 0) + success;
    saveCurrentUser();
    updateInfoPanel();

    btn.disabled = false;
    btn.textContent = '🚀 GAS REPORT!';

    addLog(`🏁 Selesai! Sukses: ${success}, Gagal: ${failed}`, 'info');
    showToast(`Selesai! ✅ ${success} terkirim`, 'success');
}

// ============================
// MENU LAINNYA
// ============================
function renderProgress() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>📊 PROGRESS REPORT</label>
            <div class="info-box">
                <strong>User:</strong> ${currentUser.username}<br>
                <strong>ID:</strong> ${currentUser.id}<br>
                <strong>Report Terkirim:</strong> ${currentUser.reportsSent || 0}<br>
                <strong>Email Terdaftar:</strong> ${currentUser.emails?.length || 0}<br>
                <strong>Limit Tersisa:</strong> ${currentUser.limit}<br>
                <strong>Role:</strong> ${currentUser.role}
            </div>
        </div>
    `;
}

function renderStats() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>📈 STATISTIK EMAIL</label>
            <div class="info-box">
                <strong>Total Email:</strong> ${currentUser.emails.length}<br>
                <strong>Total Report:</strong> ${currentUser.reportsSent || 0}<br>
                <strong>Limit Tersisa:</strong> ${currentUser.limit}<br>
                <strong>Waktu:</strong> ${new Date().toLocaleString('id-ID')}
            </div>
        </div>
    `;
}

function renderSession() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>🔑 SESSION</label>
            <div class="info-box">
                <strong>Session ID:</strong> ${currentUser.id}<br>
                <strong>Username:</strong> ${currentUser.username}<br>
                <strong>Email:</strong> ${currentUser.email}<br>
                <strong>Status:</strong> ✅ Aktif<br>
                <strong>Created:</strong> ${new Date(currentUser.joinedAt).toLocaleString('id-ID')}
            </div>
        </div>
    `;
}

function renderRole() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>🆙 UP ROLE</label>
            <div class="info-box">
                <strong>Role lo sekarang:</strong> ${currentUser.role}<br><br>
                <strong>Cara upgrade role:</strong><br>
                • USER → VIP: Rp 10.000<br>
                • VIP → PREMIUM: Rp 25.000<br>
                • PREMIUM → OWNER: Rp 100.000<br><br>
                💬 Chat owner untuk beli role.
            </div>
        </div>
    `;
}

function renderLimit() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>📋 MY LIMIT</label>
            <div class="info-box">
                <strong>Limit Tersisa:</strong> ${currentUser.limit}<br>
                <strong>Email Terdaftar:</strong> ${currentUser.emails.length}<br><br>
                💡 Tambah email = +5 limit
            </div>
        </div>
    `;
}

function renderDonasi() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>💚 DONASI</label>
            <div class="info-box">
                Support bot ini biar terus berkembang:<br><br>
                🔗 <a href="#" style="color:#00f0ff;">https://saweria.co/yourusername</a><br><br>
                Terima kasih atas dukungannya! 🙏
            </div>
        </div>
    `;
}

function renderQris() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>🚀 QRIS PAYMENT</label>
            <div class="info-box">
                Scan QRIS buat donasi:<br><br>
                🔗 <a href="#" style="color:#00f0ff;">https://qris.link/yourqris</a><br><br>
                Atau chat owner langsung.
            </div>
        </div>
    `;
}

function renderOwner() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>👑 CHAT OWNER</label>
            <div class="info-box">
                Klik link di bawah buat chat owner:<br><br>
                👤 <a href="https://t.me/OwnerUsername" style="color:#00f0ff;">@OwnerUsername</a>
            </div>
        </div>
    `;
}

function renderAkun() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>👤 CEK AKUN</label>
            <div class="info-box">
                <strong>ID:</strong> ${currentUser.id}<br>
                <strong>Username:</strong> ${currentUser.username}<br>
                <strong>Email:</strong> ${currentUser.email}<br>
                <strong>Role:</strong> ${currentUser.role}<br>
                <strong>Report:</strong> ${currentUser.reportsSent || 0}<br>
                <strong>Email Terdaftar:</strong> ${currentUser.emails.length}<br>
                <strong>Limit:</strong> ${currentUser.limit}
            </div>
        </div>
    `;
}

function renderReferral() {
    const refLink = `${window.location.origin}?ref=${currentUser.username}`;
    workspace.innerHTML = `
        <div class="form-group">
            <label>🎁 REFERRAL</label>
            <div class="info-box">
                <strong>Link Referral lo:</strong><br>
                <code>${refLink}</code><br><br>
                📊 Total Referral: 0<br>
                💡 Setiap 1 teman join = +5 limit!
            </div>
        </div>
    `;
}

// ============================
// INIT
// ============================
window.addEventListener('DOMContentLoaded', () => {
    initCaptcha();

    // Cek session otomatis
    const session = getSession();
    if (session) {
        const users = getUsers();
        if (users[session]) {
            currentUser = users[session];
            showDashboard();
            addLog(`Auto-login: ${session}`, 'success');
        } else {
            clearSession();
        }
    }
});