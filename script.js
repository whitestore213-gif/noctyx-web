/* =====================================================
   NOCTYX V5.0 — SCRIPT.JS FULL + OWNER PANEL
   ===================================================== */

const STORAGE_KEY = 'noctyx_users';
const SESSION_KEY = 'noctyx_session';

let currentUser = null;
let loginCaptchaText = '';
let regCaptchaText = '';

const authWrapper = document.getElementById('authWrapper');
const dashboard = document.getElementById('dashboard');
const workspace = document.getElementById('workspace');
const consoleBody = document.getElementById('consoleBody');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const toastIcon = document.getElementById('toastIcon');

// ============================
// STORAGE
// ============================
function getUsers() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
}
function saveUsers(users) { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); }
function saveSession(s) { localStorage.setItem(SESSION_KEY, s); }
function getSession() { return localStorage.getItem(SESSION_KEY); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

// ============================
// CAPTCHA
// ============================
function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
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
// TAB
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
// ERROR
// ============================
function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = '⚠️ ' + msg;
    el.classList.add('show');
}
function hideError(id) {
    document.getElementById(id).classList.remove('show');
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

    if (username.length < 3) return showError('regError', 'Username minimal 3 karakter!');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('regError', 'Email tidak valid!');
    if (password.length < 6) return showError('regError', 'Password minimal 6 karakter!');
    if (password !== password2) return showError('regError', 'Konfirmasi password tidak cocok!');
    if (captcha !== regCaptchaText) {
        showError('regError', 'Captcha salah! Coba lagi.');
        regCaptchaText = generateCaptcha();
        document.getElementById('regCaptchaCode').textContent = regCaptchaText;
        document.getElementById('regCaptcha').value = '';
        return;
    }

    const users = getUsers();
    if (users[username]) return showError('regError', 'Username sudah terdaftar!');

    users[username] = {
        id: Date.now(),
        username, email,
        password: btoa(password),
        role: 'USER',
        limit: 5,
        emails: [],
        reportsSent: 0,
        joinedAt: new Date().toISOString()
    };
    saveUsers(users);

    addLog(`User baru: ${username}`, 'success');
    showToast('Register berhasil! Silakan login.', 'success');

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

    if (!username || !password) return showError('loginError', 'Isi username dan password!');
    if (captcha !== loginCaptchaText) {
        showError('loginError', 'Captcha salah! Coba lagi.');
        loginCaptchaText = generateCaptcha();
        document.getElementById('loginCaptchaCode').textContent = loginCaptchaText;
        document.getElementById('loginCaptcha').value = '';
        return;
    }

    // OWNER
    if (username === 'whydie' && password === 'nailong213') {
        currentUser = {
            id: 'OWNER-' + Date.now(),
            username: 'whydie',
            email: 'owner@noctyx.local',
            role: 'OWNER',
            limit: 9999,
            emails: [],
            reportsSent: 0,
            joinedAt: new Date().toISOString(),
            isOwner: true
        };
        saveSession('__OWNER__');
        addLog(`👑 Login OWNER: whydie`, 'success');
        showToast(`Selamat datang, Owner!`, 'success');
        showDashboard();
        return;
    }

    const users = getUsers();
    const user = users[username];
    if (!user) return showError('loginError', 'Akun tidak ditemukan. Belum mendaftar? Register sekarang.');
    if (user.password !== btoa(password)) return showError('loginError', 'Password salah!');

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
// DASHBOARD
// ============================
function showDashboard() {
    authWrapper.style.display = 'none';
    dashboard.style.display = 'flex';
    updateInfoPanel();
    renderPlaceholder();

    const menuGrid = document.querySelector('.menu-grid');
    const existingOwnerBtn = document.getElementById('ownerPanelBtn');
    
    if (currentUser.role === 'OWNER' && !existingOwnerBtn) {
        const ownerBtn = document.createElement('button');
        ownerBtn.className = 'neon-btn btn-gold';
        ownerBtn.id = 'ownerPanelBtn';
        ownerBtn.innerHTML = '<span class="btn-icon">👑</span><span class="btn-text">Owner Panel</span>';
        ownerBtn.addEventListener('click', () => renderWorkspace('ownerpanel'));
        menuGrid.insertBefore(ownerBtn, menuGrid.firstChild);
    } else if (currentUser.role !== 'OWNER' && existingOwnerBtn) {
        existingOwnerBtn.remove();
    }
}

function updateInfoPanel() {
    if (!currentUser) return;
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userId').textContent = currentUser.id;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('reportCount').textContent = `${currentUser.reportsSent || 0} email`;
    document.getElementById('emailCount').textContent = `${currentUser.emails?.length || 0} terdaftar`;
    document.getElementById('userLimit').textContent = currentUser.isOwner ? '∞' : `${currentUser.limit}/5`;
}

function saveCurrentUser() {
    if (currentUser.isOwner) return;
    const users = getUsers();
    users[currentUser.username] = currentUser;
    saveUsers(users);
}

// ============================
// LOG
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
// MENU
// ============================
document.querySelectorAll('.neon-btn[data-menu]').forEach(btn => {
    btn.addEventListener('click', () => {
        addLog(`Opening menu: ${btn.dataset.menu}`, 'info');
        renderWorkspace(btn.dataset.menu);
    });
});

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
        case 'ownerpanel': renderOwnerPanel(); break;
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
        addLog('Format salah.', 'failed');
        return showToast('Format salah!', 'failed');
    }

    const [email, appPassword] = parts.map(s => s.trim());

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Email tidak valid!', 'failed');
    if (appPassword.length !== 16) return showToast('App Password harus 16 digit!', 'failed');

    if (currentUser.emails.find(e => e.email === email)) return showToast('Email sudah terdaftar!', 'failed');

    currentUser.emails.push({ email, appPassword });
    currentUser.limit += 5;
    saveCurrentUser();
    updateInfoPanel();
    renderGmailManager();
    addLog(`Email ditambahkan: ${email} (+5 limit)`, 'success');
    showToast('Email berhasil! +5 limit', 'success');
}

// ============================
// GAS REPORT (MULTI TARGET)
// ============================
function renderGasReport() {
    if (currentUser.emails.length === 0) {
        workspace.innerHTML = `
            <div class="info-box" style="border-color:#ff3366; color:#ff3366;">
                ❌ Lo belum daftar email! Tambah dulu di <strong>Gmail Manager</strong>.
            </div>
        `;
        return;
    }

    workspace.innerHTML = `
        <div class="form-group">
            <label>⚡ GAS REPORT</label>
            <div class="info-box">
                Kirim report ke <strong>banyak email tujuan</strong> sekaligus.<br>
                Pisahkan dengan <strong>koma (,)</strong> atau <strong>enter</strong>.
            </div>
        </div>
        <div class="form-group">
            <label>EMAIL TUJUAN (BISA BANYAK)</label>
            <textarea id="targetEmails" placeholder="email1@gmail.com, email2@gmail.com" rows="3"></textarea>
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
                <label>KIRIM PER EMAIL</label>
                <input type="number" id="countInput" value="3" min="1" max="50" />
            </div>
            <div class="form-group">
                <label>DELAY (detik)</label>
                <input type="number" id="delayInput" value="2" min="1" max="10" />
            </div>
        </div>
        <button class="action-btn" id="sendReportBtn">🚀 GAS REPORT KE SEMUA!</button>
    `;

    document.getElementById('sendReportBtn').addEventListener('click', sendReport);
}

async function sendReport() {
    const targetRaw = document.getElementById('targetEmails').value.trim();
    const subject = document.getElementById('subjectInput').value.trim();
    const message = document.getElementById('messageInput').value.trim();
    const countPerEmail = parseInt(document.getElementById('countInput').value);
    const delay = parseInt(document.getElementById('delayInput').value) * 1000;

    if (!targetRaw || !subject || !message) return showToast('Isi semua field!', 'failed');

    const targetEmails = targetRaw.split(/[\s,;\n]+/).map(e => e.trim()).filter(e => e.length > 0);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = targetEmails.filter(e => emailRegex.test(e));

    if (validEmails.length === 0) return showToast('Tidak ada email target yang valid!', 'failed');

    const btn = document.getElementById('sendReportBtn');
    btn.disabled = true;
    btn.textContent = '⏳ MENGIRIM...';

    addLog(`📧 Target: ${validEmails.length} email × ${countPerEmail}x`, 'info');

    let totalSuccess = 0;
    let totalFailed = 0;

    for (let t = 0; t < validEmails.length; t++) {
        const targetEmail = validEmails[t];
        addLog(`🎯 Target ${t + 1}/${validEmails.length}: ${targetEmail}`, 'info');

        for (let i = 0; i < countPerEmail; i++) {
            const sender = currentUser.emails[i % currentUser.emails.length];
            try {
                const resp = await fetch('/api/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        senderEmail: sender.email,
                        appPassword: sender.appPassword,
                        targetEmail, subject, message
                    })
                });

                const contentType = resp.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Server error (${resp.status})`);
                }

                const data = await resp.json();
                if (data.success) {
                    totalSuccess++;
                    addLog(`  ✅ [${i + 1}/${countPerEmail}] Terkirim ke ${targetEmail}`, 'success');
                } else {
                    totalFailed++;
                    addLog(`  ❌ [${i + 1}/${countPerEmail}] Gagal: ${data.error}`, 'failed');
                }
            } catch (err) {
                totalFailed++;
                addLog(`  ❌ [${i + 1}/${countPerEmail}] Error: ${err.message}`, 'failed');
            }

            if (i < countPerEmail - 1) await new Promise(r => setTimeout(r, delay));
        }
        if (t < validEmails.length - 1) await new Promise(r => setTimeout(r, delay));
    }

    currentUser.reportsSent = (currentUser.reportsSent || 0) + totalSuccess;
    saveCurrentUser();
    updateInfoPanel();

    btn.disabled = false;
    btn.textContent = '🚀 GAS REPORT KE SEMUA!';
    addLog(`🏁 SELESAI! ✅ ${totalSuccess} sukses, ❌ ${totalFailed} gagal`, 'info');
    showToast(`Selesai! ✅ ${totalSuccess} terkirim`, 'success');
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
                <strong>Limit Tersisa:</strong> ${currentUser.isOwner ? '∞' : currentUser.limit}<br>
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
                <strong>Limit:</strong> ${currentUser.isOwner ? '∞' : currentUser.limit}<br>
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
                <strong>Limit Tersisa:</strong> ${currentUser.isOwner ? '∞' : currentUser.limit}<br>
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
                Scan QRIS di bawah buat donasi:<br>
                Support bot ini biar terus berkembang 🙏
            </div>
        </div>
        <div class="qris-container">
            <img 
                src="https://cdn.phototourl.com/free/2026-07-29-adadf748-ac85-4e5d-a25f-f98daf590771.png" 
                alt="QRIS Payment" 
                class="qris-image"
                onclick="window.open(this.src, '_blank')"
            />
            <p class="qris-hint">👆 Tap gambar buat buka di tab baru</p>
        </div>
        <a 
            href="https://cdn.phototourl.com/free/2026-07-29-adadf748-ac85-4e5d-a25f-f98daf590771.png" 
            download="qris-noctyx.png"
            class="action-btn"
            style="text-decoration:none; display:block; text-align:center; margin-top:14px;"
        >
            📥 DOWNLOAD QRIS
        </a>
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
                <strong>Limit:</strong> ${currentUser.isOwner ? '∞' : currentUser.limit}
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
                💡 Setiap 1 teman join = +5 limit!
            </div>
        </div>
    `;
}

// ============================
// OWNER PANEL
// ============================
function renderOwnerPanel() {
    if (currentUser.role !== 'OWNER') {
        workspace.innerHTML = `
            <div class="info-box" style="border-color:#ff3366; color:#ff3366;">
                ❌ Akses ditolak! Halaman ini khusus Owner.
            </div>
        `;
        return;
    }

    const users = getUsers();
    const userList = Object.values(users);
    
    let totalEmails = 0;
    let totalReports = 0;
    userList.forEach(u => {
        totalEmails += u.emails?.length || 0;
        totalReports += u.reportsSent || 0;
    });

    let userRows = '';
    if (userList.length === 0) {
        userRows = '<div class="owner-empty">📭 Belum ada user terdaftar.</div>';
    } else {
        userList.forEach(u => {
            userRows += `
                <div class="owner-user-row">
                    <div class="owner-user-info">
                        <div class="owner-user-name">👤 ${u.username}</div>
                        <div class="owner-user-meta">📧 ${u.email} • 📮 ${u.emails?.length || 0} email • 📊 ${u.reportsSent || 0} report</div>
                        <div class="owner-user-role">🎭 ${u.role} • 📅 ${new Date(u.joinedAt).toLocaleDateString('id-ID')}</div>
                    </div>
                    <div class="owner-user-actions">
                        <button class="owner-action-btn" onclick="ownerResetPassword('${u.username}')" title="Reset Password">🔑</button>
                        <button class="owner-action-btn danger" onclick="ownerDeleteUser('${u.username}')" title="Hapus User">🗑️</button>
                    </div>
                </div>
            `;
        });
    }

    workspace.innerHTML = `
        <div class="form-group">
            <label>👑 OWNER PANEL</label>
            <div class="info-box" style="border-color:rgba(255,184,0,0.4); background:rgba(255,184,0,0.05);">
                <strong style="color:#ffb800;">⚡ Selamat datang, Owner whydie!</strong><br>
                Panel kontrol penuh buat manage semua user di NOCTYX V5.0.
            </div>
        </div>

        <div class="owner-stats">
            <div class="owner-stat-card">
                <div class="owner-stat-num">${userList.length}</div>
                <div class="owner-stat-label">TOTAL USER</div>
            </div>
            <div class="owner-stat-card">
                <div class="owner-stat-num">${totalEmails}</div>
                <div class="owner-stat-label">TOTAL EMAIL</div>
            </div>
            <div class="owner-stat-card">
                <div class="owner-stat-num">${totalReports}</div>
                <div class="owner-stat-label">TOTAL REPORT</div>
            </div>
        </div>

        <div class="form-group" style="margin-top:20px;">
            <label>📋 DAFTAR USER TERDAFTAR</label>
            <div class="owner-user-list">
                ${userRows}
            </div>
        </div>

        <button class="action-btn secondary" onclick="ownerClearAllUsers()" style="border-color:rgba(255,51,102,0.4); color:#ff3366;">
            🗑️ HAPUS SEMUA USER
        </button>
    `;
}

function ownerDeleteUser(username) {
    if (currentUser.role !== 'OWNER') return;
    if (!confirm(`Yakin mau hapus user "${username}"?`)) return;
    const users = getUsers();
    delete users[username];
    saveUsers(users);
    addLog(`🗑️ Owner hapus user: ${username}`, 'warn');
    showToast(`User "${username}" dihapus!`, 'success');
    renderOwnerPanel();
}

function ownerResetPassword(username) {
    if (currentUser.role !== 'OWNER') return;
    const newPass = prompt(`Password baru buat "${username}":`);
    if (!newPass || newPass.length < 6) return showToast('Password minimal 6 karakter!', 'failed');
    const users = getUsers();
    if (!users[username]) return;
    users[username].password = btoa(newPass);
    saveUsers(users);
    addLog(`🔑 Owner reset password: ${username}`, 'warn');
    showToast(`Password "${username}" direset!`, 'success');
}

function ownerClearAllUsers() {
    if (currentUser.role !== 'OWNER') return;
    if (!confirm('⚠️ HAPUS SEMUA USER? Tidak bisa dibatalkan!')) return;
    localStorage.removeItem(STORAGE_KEY);
    addLog('🗑️ Owner hapus semua user.', 'warn');
    showToast('Semua user dihapus!', 'success');
    renderOwnerPanel();
}

// ============================
// INIT
// ============================
window.addEventListener('DOMContentLoaded', () => {
    initCaptcha();
    const session = getSession();
    
    if (session === '__OWNER__') {
        currentUser = {
            id: 'OWNER-' + Date.now(),
            username: 'whydie',
            email: 'owner@noctyx.local',
            role: 'OWNER',
            limit: 9999,
            emails: [],
            reportsSent: 0,
            joinedAt: new Date().toISOString(),
            isOwner: true
        };
        showDashboard();
        addLog(`👑 Auto-login OWNER: whydie`, 'success');
        return;
    }
    
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
