// ==================== STATE ====================
let currentUser = null;
let loginCaptchaText = '';
let regCaptchaText = '';
let totalReports = 128; // contoh angka awal

// ==================== ELEMEN ====================
const authWrapper = document.getElementById('authWrapper');
const dashboard = document.getElementById('dashboard');
const toast = document.getElementById('toast');

// ==================== CAPTCHA ====================
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

// ==================== TAB SWITCH ====================
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(target + 'Form').classList.add('active');
        initCaptcha();
    });
});

document.getElementById('toRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('[data-tab="register"]').click();
});

document.getElementById('toLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('[data-tab="login"]').click();
});

// ==================== CAPTCHA REFRESH ====================
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

// ==================== TOAST ====================
function showToast(msg, type = 'success') {
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    setTimeout(() => toast.className = 'toast', 3000);
}

// ==================== ERROR ====================
function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
}

// ==================== REGISTER ====================
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();

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
        initCaptcha();
        return;
    }

    // Simpan user ke localStorage
    const users = JSON.parse(localStorage.getItem('whydie_users') || '{}');
    if (users[username]) return showError('regError', 'Username sudah terdaftar!');

    users[username] = { username, email, password: btoa(password) };
    localStorage.setItem('whydie_users', JSON.stringify(users));

    showToast('Register berhasil! Silakan login.');
    document.querySelector('[data-tab="login"]').click();
    document.getElementById('loginUsername').value = username;
    document.getElementById('loginPassword').value = '';
});

// ==================== LOGIN ====================
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const captcha = document.getElementById('loginCaptcha').value.trim().toUpperCase();

    if (captcha !== loginCaptchaText) {
        showError('loginError', 'Captcha salah! Coba lagi.');
        initCaptcha();
        return;
    }

    // Akun owner default
    if (username === 'whydie' && password === 'nailong213') {
        currentUser = { username: 'whydie', role: 'owner' };
        showToast('Selamat datang, Owner!');
        showDashboard();
        return;
    }

    // Cek user terdaftar
    const users = JSON.parse(localStorage.getItem('whydie_users') || '{}');
    const user = users[username];

    if (!user) return showError('loginError', 'Akun tidak ditemukan. Belum mendaftar? Register sekarang.');
    if (user.password !== btoa(password)) return showError('loginError', 'Password salah!');

    currentUser = user;
    showToast('Login berhasil!');
    showDashboard();
});

// ==================== DASHBOARD ====================
function showDashboard() {
    authWrapper.style.display = 'none';
    dashboard.style.display = 'block';
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('totalReport').textContent = totalReports;
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    currentUser = null;
    dashboard.style.display = 'none';
    authWrapper.style.display = 'flex';
    initCaptcha();
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    showToast('Logout berhasil.');
});

// ==================== SEND REPORT ====================
document.getElementById('sendReportBtn').addEventListener('click', () => {
    const target = document.getElementById('targetUrl').value.trim();
    if (!target) return showToast('Masukkan target URL dulu!', 'error');

    totalReports++;
    document.getElementById('totalReport').textContent = totalReports;
    showToast('Report terkirim! Total: ' + totalReports);
});

// ==================== INIT ====================
initCaptcha();
