/* =====================================================
   WHYDIE PALL V1.0 — SCRIPT.JS (FULL FUNCTIONALITY)
   ===================================================== */

const STORAGE_KEY = 'noctyx_users';
const SESSION_KEY = 'noctyx_session';

let currentUser = null;
let loginCaptchaText = '';
let regCaptchaText = '';

// Element References
const authWrapper = document.getElementById('authWrapper');
const dashboard = document.getElementById('dashboard');
const workspace = document.getElementById('workspace');
const consoleBody = document.getElementById('consoleBody');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const toastIcon = document.getElementById('toastIcon');

// ============================
// LOCAL STORAGE MANAGEMENT
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

function saveSession(sessionData) { 
    localStorage.setItem(SESSION_KEY, sessionData); 
}

function getSession() { 
    return localStorage.getItem(SESSION_KEY); 
}

function clearSession() { 
    localStorage.removeItem(SESSION_KEY); 
}

// ============================
// CAPTCHA SYSTEM
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
    
    const loginCaptchaEl = document.getElementById('loginCaptchaCode');
    const regCaptchaEl = document.getElementById('regCaptchaCode');
    const loginCaptchaInput = document.getElementById('loginCaptcha');
    const regCaptchaInput = document.getElementById('regCaptcha');

    if (loginCaptchaEl) loginCaptchaEl.textContent = loginCaptchaText;
    if (regCaptchaEl) regCaptchaEl.textContent = regCaptchaText;
    if (loginCaptchaInput) loginCaptchaInput.value = '';
    if (regCaptchaInput) regCaptchaInput.value = '';
}

// ============================
// TAB & MODAL NAVIGATION
// ============================
function openLoginForm() {
    document.getElementById('menuBox').style.display = 'none';
    document.getElementById('welcomeText').style.display = 'none';
    document.getElementById('registerFormCard').classList.remove('active');
    document.getElementById('dashboardCard').classList.remove('active');
    document.getElementById('loginFormCard').classList.add('active');
}

function openRegisterForm() {
    document.getElementById('menuBox').style.display = 'none';
    document.getElementById('welcomeText').style.display = 'none';
    document.getElementById('loginFormCard').classList.remove('active');
    document.getElementById('dashboardCard').classList.remove('active');
    document.getElementById('registerFormCard').classList.add('active');
}

function closeAllForms() {
    document.getElementById('loginFormCard').classList.remove('active');
    document.getElementById('registerFormCard').classList.remove('active');
    document.getElementById('dashboardCard').classList.remove('active');
    document.getElementById('menuBox').style.display = 'flex';
    document.getElementById('welcomeText').style.display = 'block';
}

document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        
        const targetForm = document.getElementById(target + 'Form');
        if (targetForm) targetForm.classList.add('active');
        
        hideError('loginError');
        hideError('regError');
        initCaptcha();
    });
});

const switchReg = document.getElementById('switchToRegister');
if (switchReg) {
    switchReg.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = document.querySelector('[data-tab="register"]');
        if (tab) tab.click();
    });
}

const switchLog = document.getElementById('switchToLogin');
if (switchLog) {
    switchLog.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = document.querySelector('[data-tab="login"]');
        if (tab) tab.click();
    });
}

const loginRefresh = document.getElementById('loginCaptchaRefresh');
if (loginRefresh) {
    loginRefresh.addEventListener('click', () => {
        loginCaptchaText = generateCaptcha();
        document.getElementById('loginCaptchaCode').textContent = loginCaptchaText;
        document.getElementById('loginCaptcha').value = '';
    });
}

const regRefresh = document.getElementById('regCaptchaRefresh');
if (regRefresh) {
    regRefresh.addEventListener('click', () => {
        regCaptchaText = generateCaptcha();
        document.getElementById('regCaptchaCode').textContent = regCaptchaText;
        document.getElementById('regCaptcha').value = '';
    });
}

// ============================
// ERROR HANDLING
// ============================
function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = '[ERROR] ' + msg;
        el.classList.add('show');
    }
}

function hideError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
}

// ============================
// AUTHENTICATION LOGIC
// ============================
function handleAuth(type) {
    let username = "";
    if (type === 'login') {
        const input = document.getElementById('loginUsername');
        username = input ? input.value : "";
    } else {
        const input = document.getElementById('regUsername');
        username = input ? input.value : "";
    }

    if (!username.trim()) {
        username = "User";
    }

    document.getElementById('loginFormCard').classList.remove('active');
    document.getElementById('registerFormCard').classList.remove('active');
    
    const dashUser = document.getElementById('dashUser');
    if (dashUser) dashUser.innerText = username;
    
    const dashCard = document.getElementById('dashboardCard');
    if (dashCard) dashCard.classList.add('active');
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideError('regError');

        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const password2 = document.getElementById('regPassword2').value;
        const captchaInput = document.getElementById('regCaptcha');
        const captcha = captchaInput ? captchaInput.value.trim().toUpperCase() : '';

        if (username.length < 3) return showError('regError', 'Username minimal 3 karakter!');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('regError', 'Email tidak valid!');
        if (password.length < 6) return showError('regError', 'Password minimal 6 karakter!');
        if (password !== password2) return showError('regError', 'Konfirmasi password tidak cocok!');
        if (captchaInput && captcha !== regCaptchaText) {
            showError('regError', 'Captcha salah! Coba lagi.');
            regCaptchaText = generateCaptcha();
            document.getElementById('regCaptchaCode').textContent = regCaptchaText;
            captchaInput.value = '';
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

        const loginTab = document.querySelector('[data-tab="login"]');
        if (loginTab) loginTab.click();
        
        const loginUserEl = document.getElementById('loginUsername');
        if (loginUserEl) loginUserEl.value = username;
        
        const loginPassEl = document.getElementById('loginPassword');
        if (loginPassEl) loginPassEl.value = '';
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideError('loginError');

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const captchaInput = document.getElementById('loginCaptcha');
        const captcha = captchaInput ? captchaInput.value.trim().toUpperCase() : '';

        if (!username || !password) return showError('loginError', 'Isi username dan password!');
        if (captchaInput && captcha !== loginCaptchaText) {
            showError('loginError', 'Captcha salah! Coba lagi.');
            loginCaptchaText = generateCaptcha();
            document.getElementById('loginCaptchaCode').textContent = loginCaptchaText;
            captchaInput.value = '';
            return;
        }

        // OWNER BYPASS LOGIC
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
            addLog(`Login OWNER: whydie`, 'success');
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
}

// ============================
// LOGOUT
// ============================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        clearSession();
        currentUser = null;
        if (dashboard) dashboard.style.display = 'none';
        if (authWrapper) authWrapper.style.display = 'flex';
        initCaptcha();
        
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
        
        addLog('Logout berhasil.', 'warn');
        showToast('Logout berhasil!', 'success');
    });
}

// ============================
// DASHBOARD & INTERFACE CONTROL
// ============================
function showDashboard() {
    if (authWrapper) authWrapper.style.display = 'none';
    if (dashboard) dashboard.style.display = 'flex';
    updateInfoPanel();
    renderPlaceholder();

    const menuGrid = document.querySelector('.menu-grid');
    const existingOwnerBtn = document.getElementById('ownerPanelBtn');
    
    if (currentUser && currentUser.role === 'OWNER' && !existingOwnerBtn && menuGrid) {
        const ownerBtn = document.createElement('button');
        ownerBtn.className = 'neon-btn btn-gold';
        ownerBtn.id = 'ownerPanelBtn';
        ownerBtn.innerHTML = '<span class="btn-text">Owner Panel</span>';
        ownerBtn.addEventListener('click', () => renderWorkspace('ownerpanel'));
        menuGrid.insertBefore(ownerBtn, menuGrid.firstChild);
    } else if (currentUser && currentUser.role !== 'OWNER' && existingOwnerBtn) {
        existingOwnerBtn.remove();
    }
}

function updateInfoPanel() {
    if (!currentUser) return;
    const userNameEl = document.getElementById('userName');
    const userIdEl = document.getElementById('userId');
    const userRoleEl = document.getElementById('userRole');
    const reportCountEl = document.getElementById('reportCount');
    const emailCountEl = document.getElementById('emailCount');
    const userLimitEl = document.getElementById('userLimit');

    if (userNameEl) userNameEl.textContent = currentUser.username;
    if (userIdEl) userIdEl.textContent = currentUser.id;
    if (userRoleEl) userRoleEl.textContent = currentUser.role;
    if (reportCountEl) reportCountEl.textContent = `${currentUser.reportsSent || 0} email`;
    if (emailCountEl) emailCountEl.textContent = `${currentUser.emails?.length || 0} terdaftar`;
    if (userLimitEl) userLimitEl.textContent = currentUser.isOwner ? 'Unlimited' : `${currentUser.limit}/5`;
}

function saveCurrentUser() {
    if (!currentUser || currentUser.isOwner) return;
    const users = getUsers();
    users[currentUser.username] = currentUser;
    saveUsers(users);
}

// ============================
// CONSOLE LOG SYSTEM
// ============================
function addLog(msg, type = 'info') {
    if (!consoleBody) return;
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString('id-ID');
    line.textContent = `[${time}] ${msg}`;
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

const clearLogBtn = document.getElementById('clearLog');
if (clearLogBtn) {
    clearLogBtn.addEventListener('click', () => {
        if (consoleBody) consoleBody.innerHTML = '';
        addLog('Console cleared.', 'info');
    });
}

// ============================
// TOAST NOTIFICATIONS
// ============================
function showToast(msg, type = 'success') {
    if (!toast || !toastMsg || !toastIcon) return;
    toastMsg.textContent = msg;
    toastIcon.textContent = type === 'success' ? 'OK' : 'X';
    toastIcon.style.color = type === 'success' ? '#00ff88' : '#ff3366';
    toast.style.borderColor = type === 'success' ? '#00f0ff' : '#ff3366';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================
// MENU ROUTING & WORKSPACE
// ============================
document.querySelectorAll('.neon-btn[data-menu]').forEach(btn => {
    btn.addEventListener('click', () => {
        addLog(`Opening menu: ${btn.dataset.menu}`, 'info');
        renderWorkspace(btn.dataset.menu);
    });
});

function renderWorkspace(menu) {
    if (!workspace) return;
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
    if (!workspace) return;
    workspace.innerHTML = `
        <div class="workspace-placeholder">
            <p>Pilih menu di atas untuk memulai</p>
        </div>
    `;
}

// ============================
// GMAIL MANAGER
// ============================
function renderGmailManager() {
    let emailListHTML = '';
    if (currentUser.emails && currentUser.emails.length > 0) {
        emailListHTML = `
            <div class="info-box">
                <strong>Email Terdaftar:</strong><br>
                ${currentUser.emails.map((e, i) => `${i + 1}. <code>${e.email}</code>`).join('<br>')}
            </div>
        `;
    } else {
        emailListHTML = `<div class="info-box">Belum ada email terdaftar.</div>`;
    }

    workspace.innerHTML = `
        <div class="form-group">
            <label>GMAIL MANAGER</label>
            <div class="info-box">
                Tambah email pengirim dengan format:<br>
                <strong>email@gmail.com|app_password</strong><br><br>
                <strong>Cara dapet App Password:</strong><br>
                1. Buka myaccount.google.com/apppasswords<br>
                2. Pilih Mail -> Other -> Generate<br>
                3. Copy 16 digit password<br><br>
                Setiap email baru = <strong>+5 limit report</strong>!
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
// GAS REPORT ENGINE
// ============================
function renderGasReport() {
    if (!currentUser.emails || currentUser.emails.length === 0) {
        workspace.innerHTML = `
            <div class="info-box" style="border-color:#ff3366; color:#ff3366;">
                Belum daftar email! Tambah dulu di <strong>Gmail Manager</strong>.
            </div>
        `;
        return;
    }

    workspace.innerHTML = `
        <div class="form-group">
            <label>GAS REPORT</label>
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
        <button class="action-btn" id="sendReportBtn">GAS REPORT KE SEMUA!</button>
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
    btn.textContent = 'MENGIRIM...';

    addLog(`Target: ${validEmails.length} email x ${countPerEmail}x`, 'info');

    let totalSuccess = 0;
    let totalFailed = 0;

    for (let t = 0; t < validEmails.length; t++) {
        const targetEmail = validEmails[t];
        addLog(`Target ${t + 1}/${validEmails.length}: ${targetEmail}`, 'info');

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
                    addLog(`  [SUCCESS] [${i + 1}/${countPerEmail}] Terkirim ke ${targetEmail}`, 'success');
                } else {
                    totalFailed++;
                    addLog(`  [FAILED] [${i + 1}/${countPerEmail}] Gagal: ${data.error}`, 'failed');
                }
            } catch (err) {
                totalFailed++;
                addLog(`  [ERROR] [${i + 1}/${countPerEmail}] Error: ${err.message}`, 'failed');
            }

            if (i < countPerEmail - 1) await new Promise(r => setTimeout(r, delay));
        }
        if (t < validEmails.length - 1) await new Promise(r => setTimeout(r, delay));
    }

    currentUser.reportsSent = (currentUser.reportsSent || 0) + totalSuccess;
    saveCurrentUser();
    updateInfoPanel();

    btn.disabled = false;
    btn.textContent = 'GAS REPORT KE SEMUA!';
    addLog(`SELESAI! ${totalSuccess} sukses, ${totalFailed} gagal`, 'info');
    showToast(`Selesai! ${totalSuccess} terkirim`, 'success');
}

// ============================
// PANEL MENU VIEWS
// ============================
function renderProgress() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>PROGRESS REPORT</label>
            <div class="info-box">
                <strong>User:</strong> ${currentUser.username}<br>
                <strong>ID:</strong> ${currentUser.id}<br>
                <strong>Report Terkirim:</strong> ${currentUser.reportsSent || 0}<br>
                <strong>Email Terdaftar:</strong> ${currentUser.emails?.length || 0}<br>
                <strong>Limit Tersisa:</strong> ${currentUser.isOwner ? 'Unlimited' : currentUser.limit}<br>
                <strong>Role:</strong> ${currentUser.role}
            </div>
        </div>
    `;
}

function renderStats() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>STATISTIK EMAIL</label>
            <div class="info-box">
                <strong>Total Email:</strong> ${currentUser.emails?.length || 0}<br>
                <strong>Total Report:</strong> ${currentUser.reportsSent || 0}<br>
                <strong>Limit:</strong> ${currentUser.isOwner ? 'Unlimited' : currentUser.limit}<br>
                <strong>Waktu:</strong> ${new Date().toLocaleString('id-ID')}
            </div>
        </div>
    `;
}

function renderSession() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>SESSION</label>
            <div class="info-box">
                <strong>Session ID:</strong> ${currentUser.id}<br>
                <strong>Username:</strong> ${currentUser.username}<br>
                <strong>Status:</strong> Aktif<br>
                <strong>Created:</strong> ${new Date(currentUser.joinedAt).toLocaleString('id-ID')}
            </div>
        </div>
    `;
}

function renderRole() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>UP ROLE</label>
            <div class="info-box">
                <strong>Role saat ini:</strong> ${currentUser.role}<br><br>
                <strong>Cara upgrade role:</strong><br>
                - USER -> VIP: Rp 10.000<br>
                - VIP -> PREMIUM: Rp 25.000<br>
                - PREMIUM -> OWNER: Rp 100.000<br><br>
                Chat owner untuk beli role.
            </div>
        </div>
    `;
}

function renderLimit() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>MY LIMIT</label>
            <div class="info-box">
                <strong>Limit Tersisa:</strong> ${currentUser.isOwner ? 'Unlimited' : currentUser.limit}<br>
                <strong>Email Terdaftar:</strong> ${currentUser.emails?.length || 0}<br><br>
                Tambah email = +5 limit
            </div>
        </div>
    `;
}

function renderDonasi() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>DONASI</label>
            <div class="info-box">
                Support bot ini agar terus berkembang:<br><br>
                <a href="#" style="color:#00f0ff;">https://saweria.co/yourusername</a><br><br>
                Terima kasih atas dukungannya.
            </div>
        </div>
    `;
}

function renderQris() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>QRIS PAYMENT</label>
            <div class="info-box">
                Scan QRIS di bawah untuk donasi:<br>
                Support bot ini agar terus berkembang.
            </div>
        </div>
        <div class="qris-container">
            <img 
                src="https://cdn.phototourl.com/free/2026-07-29-adadf748-ac85-4e5d-a25f-f98daf590771.png" 
                alt="QRIS Payment" 
                class="qris-image"
                onclick="window.open(this.src, '_blank')"
            />
            <p class="qris-hint">Tap gambar untuk buka di tab baru</p>
        </div>
        <a 
            href="https://cdn.phototourl.com/free/2026-07-29-adadf748-ac85-4e5d-a25f-f98daf590771.png" 
            download="qris-noctyx.png"
            class="action-btn"
            style="text-decoration:none; display:block; text-align:center; margin-top:14px;"
        >
            DOWNLOAD QRIS
        </a>
    `;
}

function renderOwner() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>CHAT OWNER</label>
            <div class="info-box">
                Klik link di bawah untuk chat owner:<br><br>
                <a href="https://t.me/mrwhy016" target="_blank" style="color:#00f0ff;">@mrwhy016</a>
            </div>
        </div>
    `;
}

function renderAkun() {
    workspace.innerHTML = `
        <div class="form-group">
            <label>CEK AKUN</label>
            <div class="info-box">
                <strong>ID:</strong> ${currentUser.id}<br>
                <strong>Username:</strong> ${currentUser.username}<br>
                <strong>Email:</strong> ${currentUser.email}<br>
                <strong>Role:</strong> ${currentUser.role}<br>
                <strong>Report:</strong> ${currentUser.reportsSent || 0}<br>
                <strong>Email Terdaftar:</strong> ${currentUser.emails?.length || 0}<br>
                <strong>Limit:</strong> ${currentUser.isOwner ? 'Unlimited' : currentUser.limit}
            </div>
        </div>
    `;
}

function renderReferral() {
    const refLink = `${window.location.origin}?ref=${currentUser.username}`;
    workspace.innerHTML = `
        <div class="form-group">
            <label>REFERRAL</label>
            <div class="info-box">
                <strong>Link Referral Anda:</strong><br>
                <code>${refLink}</code><br><br>
                Setiap 1 teman join = +5 limit!
            </div>
        </div>
    `;
}

// ============================
// OWNER PANEL MANAGEMENT
// ============================
function renderOwnerPanel() {
    if (currentUser.role !== 'OWNER') {
        workspace.innerHTML = `
            <div class="info-box" style="border-color:#ff3366; color:#ff3366;">
                Akses ditolak! Halaman ini khusus Owner.
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
        userRows = '<div class="owner-empty">Belum ada user terdaftar.</div>';
    } else {
        userList.forEach(u => {
            userRows += `
                <div class="owner-user-row">
                    <div class="owner-user-info">
                        <div class="owner-user-name">User: ${u.username}</div>
                        <div class="owner-user-meta">Email: ${u.email} | ${u.emails?.length || 0} email terdaftar | ${u.reportsSent || 0} report</div>
                        <div class="owner-user-role">Role: ${u.role} | Joined: ${new Date(u.joinedAt).toLocaleDateString('id-ID')}</div>
                    </div>
                    <div class="owner-user-actions">
                        <button class="owner-action-btn" onclick="ownerResetPassword('${u.username}')" title="Reset Password">RESET</button>
                        <button class="owner-action-btn danger" onclick="ownerDeleteUser('${u.username}')" title="Hapus User">HAPUS</button>
                    </div>
                </div>
            `;
        });
    }

    workspace.innerHTML = `
        <div class="form-group">
            <label>OWNER PANEL</label>
            <div class="info-box" style="border-color:rgba(255,184,0,0.4); background:rgba(255,184,0,0.05);">
                <strong style="color:#ffb800;">Selamat datang, Owner whydie!</strong><br>
                Panel kontrol penuh untuk manage semua user di Whydie Pall V1.
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
            <label>DAFTAR USER TERDAFTAR</label>
            <div class="owner-user-list">
                ${userRows}
            </div>
        </div>

        <button class="action-btn secondary" onclick="ownerClearAllUsers()" style="border-color:rgba(255,51,102,0.4); color:#ff3366;">
            HAPUS SEMUA USER
        </button>
    `;
}

function ownerDeleteUser(username) {
    if (!currentUser || currentUser.role !== 'OWNER') return;
    if (!confirm(`Yakin mau hapus user "${username}"?`)) return;
    const users = getUsers();
    delete users[username];
    saveUsers(users);
    addLog(`Owner hapus user: ${username}`, 'warn');
    showToast(`User "${username}" dihapus!`, 'success');
    renderOwnerPanel();
}

function ownerResetPassword(username) {
    if (!currentUser || currentUser.role !== 'OWNER') return;
    const newPass = prompt(`Password baru untuk "${username}":`);
    if (!newPass || newPass.length < 6) return showToast('Password minimal 6 karakter!', 'failed');
    const users = getUsers();
    if (!users[username]) return;
    users[username].password = btoa(newPass);
    saveUsers(users);
    addLog(`Owner reset password: ${username}`, 'warn');
    showToast(`Password "${username}" direset!`, 'success');
}

function ownerClearAllUsers() {
    if (!currentUser || currentUser.role !== 'OWNER') return;
    if (!confirm('HAPUS SEMUA USER? Tidak bisa dibatalkan!')) return;
    localStorage.removeItem(STORAGE_KEY);
    addLog('Owner hapus semua user.', 'warn');
    showToast('Semua user dihapus!', 'success');
    renderOwnerPanel();
}

// ============================
// APPLICATION INITIALIZATION
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
        addLog(`Auto-login OWNER: whydie`, 'success');
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
