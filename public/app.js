// ============================================================
// SplitBill Bukber — Ramadan Companion App
// (c) 2026 Muhammad Ketsar Ali Abi Wahid. All rights reserved.
// Crafted for Mayar Vibecoding Competition — Ramadan 2026
// ============================================================

let friends = [];
let parsedItems = [];
let splitResults = {};
let currentStep = 1;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    startCountdown();
    loadHistory();
    loadTheme();
    renderPrayerTimes();
    renderDoas();
    checkPaymentReturn();
});

// ===== PARTICLES =====
function createParticles() {
    const c = document.getElementById('particles');
    if (!c) return;
    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 4 + 's';
        p.style.animationDuration = (3 + Math.random() * 3) + 's';
        p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
        c.appendChild(p);
    }
}

// ===== COUNTDOWN (Maghrib-based from API if available) =====
let maghribTime = null;

function startCountdown() {
    function update() {
        const now = new Date();
        let iftarTarget;

        if (maghribTime) {
            // Use actual Maghrib time from API
            const [h, m] = maghribTime.split(':').map(Number);
            iftarTarget = new Date(now);
            iftarTarget.setHours(h, m, 0, 0);
        } else {
            // Fallback: 18:11 WIB (approx Jakarta Maghrib)
            iftarTarget = new Date(now);
            iftarTarget.setHours(18, 11, 0, 0);
        }

        const bar = document.getElementById('countdown-bar');
        const timer = document.getElementById('countdown-timer');
        const loc = document.getElementById('countdown-location');

        if (now >= iftarTarget) {
            timer.textContent = 'Waktunya Berbuka!';
            bar.classList.add('iftar-time');
            loc.textContent = 'Selamat berbuka puasa';
        } else {
            bar.classList.remove('iftar-time');
            const d = iftarTarget - now;
            timer.textContent = `${pad(Math.floor(d/3600000))}:${pad(Math.floor((d%3600000)/60000))}:${pad(Math.floor((d%60000)/1000))}`;
        }
    }
    update();
    setInterval(update, 1000);
}

function pad(n) { return n.toString().padStart(2, '0'); }

// ===== PAGE NAVIGATION =====
window.switchPage = function(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    const hero = document.getElementById('hero-section');
    if (hero) hero.style.display = (page === 'split' && currentStep === 1) ? '' : 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ===== THEME =====
window.toggleThemePanel = function() {
    document.getElementById('theme-panel').classList.toggle('hidden');
    document.getElementById('theme-overlay').classList.toggle('hidden');
};

window.setTheme = function(theme) {
    document.body.className = '';
    if (theme !== 'dark') document.body.classList.add('theme-' + theme);
    document.querySelectorAll('.theme-opt').forEach(o => o.classList.toggle('active', o.dataset.theme === theme));
    localStorage.setItem('splitbill_theme', theme);
    const tc = theme === 'light' ? '#f5f7fa' : theme === 'ramadan' ? '#060d08' : '#030014';
    document.querySelector('meta[name="theme-color"]').content = tc;
    toggleThemePanel();
};

function loadTheme() {
    const saved = localStorage.getItem('splitbill_theme') || 'dark';
    document.body.className = '';
    if (saved !== 'dark') document.body.classList.add('theme-' + saved);
    document.querySelectorAll('.theme-opt').forEach(o => o.classList.toggle('active', o.dataset.theme === saved));
}

// ===== STEP NAVIGATION =====
function goToStep(step) {
    const steps = [document.getElementById('step-upload'), document.getElementById('step-split'), document.getElementById('step-pay')];
    steps.forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
    steps[step - 1].classList.remove('hidden');
    steps[step - 1].classList.add('active');
    document.querySelectorAll('.p-step').forEach((ps, i) => {
        ps.classList.remove('active', 'completed');
        if (i + 1 === step) ps.classList.add('active');
        else if (i + 1 < step) ps.classList.add('completed');
    });
    document.getElementById('pf-1').style.width = step >= 2 ? '100%' : '0%';
    document.getElementById('pf-2').style.width = step >= 3 ? '100%' : '0%';
    const hero = document.getElementById('hero-section');
    if (hero) hero.style.display = step > 1 ? 'none' : '';
    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== TAB SWITCHER =====
window.switchInputTab = function(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-c').forEach(c => c.classList.remove('active'));
    if (tab === 'scan') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('tab-scan').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('tab-manual').classList.add('active');
    }
};

// ===== FILE UPLOAD =====
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('receipt-upload');
if (dropZone) {
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); });
}
if (fileInput) fileInput.addEventListener('change', e => { if (e.target.files.length) handleFile(e.target.files[0]); });

async function handleFile(file) {
    if (!file.type.startsWith('image/')) { showToast('Upload gambar yang valid'); return; }
    document.getElementById('preview-img').src = URL.createObjectURL(file);
    document.getElementById('image-preview').classList.remove('hidden');
    dropZone.style.display = 'none';
    const demo = document.querySelector('.demo-sec'); if (demo) demo.style.display = 'none';
    document.getElementById('loading').classList.remove('hidden');
    const fd = new FormData(); fd.append('receipt', file);
    try {
        const res = await fetch('/api/scan', { method: 'POST', body: fd });
        const r = await res.json();
        if (r.success && r.data && r.data.length > 0) {
            parsedItems = r.data.map(item => ({ ...item, price: parseFloat(item.price) || 0, assignedTo: 'Bagi Rata' }));
            showToast(parsedItems.length + ' item terbaca');
            transitionToStep2();
        } else { throw new Error(); }
    } catch (err) { showToast('Gagal membaca struk'); resetUploadUI(); }
}

function resetUploadUI() {
    if (dropZone) dropZone.style.display = '';
    const demo = document.querySelector('.demo-sec'); if (demo) demo.style.display = '';
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('image-preview').classList.add('hidden');
}

// ===== MANUAL ENTRY =====
window.addManualItem = function() {
    const ni = document.getElementById('manual-item-name'), pi = document.getElementById('manual-item-price');
    const name = ni.value.trim(), price = parseFloat(pi.value) || 0;
    if (!name || price <= 0) { showToast('Isi nama dan harga'); return; }
    parsedItems.push({ name, price, assignedTo: 'Bagi Rata' });
    ni.value = ''; pi.value = ''; ni.focus();
    renderManualPreview();
};
document.getElementById('manual-item-name')?.addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('manual-item-price').focus(); });
document.getElementById('manual-item-price')?.addEventListener('keypress', e => { if (e.key === 'Enter') addManualItem(); });

function renderManualPreview() {
    const c = document.getElementById('manual-items-preview'), btn = document.getElementById('btn-manual-next');
    c.innerHTML = parsedItems.map((item, i) => `<div class="manual-item"><span class="mi-name">${esc(item.name)}</span><span class="mi-price">Rp ${fmt(item.price)}</span><button class="mi-delete" onclick="removeManualItem(${i})">x</button></div>`).join('');
    btn.style.display = parsedItems.length > 0 ? 'flex' : 'none';
}
window.removeManualItem = function(i) { parsedItems.splice(i, 1); renderManualPreview(); };
window.manualToStep2 = function() { if (!parsedItems.length) { showToast('Tambah minimal 1 item'); return; } transitionToStep2(); };

// ===== DEMO =====
window.loadDemoData = function() {
    parsedItems = [
        { name: "Nasi Goreng Spesial", price: 28000, assignedTo: "Bagi Rata" },
        { name: "Mie Goreng Seafood", price: 32000, assignedTo: "Bagi Rata" },
        { name: "Ayam Bakar Madu", price: 35000, assignedTo: "Bagi Rata" },
        { name: "Es Teh Manis", price: 8000, assignedTo: "Bagi Rata" },
        { name: "Es Jeruk Segar", price: 12000, assignedTo: "Bagi Rata" },
        { name: "Kolak Pisang", price: 15000, assignedTo: "Bagi Rata" },
        { name: "Kurma Ajwa 3pcs", price: 18000, assignedTo: "Bagi Rata" },
        { name: "Air Mineral", price: 5000, assignedTo: "Bagi Rata" }
    ];
    friends = ["Budi", "Ani", "Saya"];
    showToast('Data demo dimuat');
    transitionToStep2();
};

function transitionToStep2() { goToStep(2); renderReceiptSummary(); renderFriends(); renderItems(); updateItemsTotal(); }

// ===== RECEIPT SUMMARY =====
function renderReceiptSummary() {
    const total = parsedItems.reduce((s, i) => s + i.price, 0);
    const avg = parsedItems.length ? total / parsedItems.length : 0;
    document.getElementById('summary-stats').innerHTML = `
        <div class="sum-v"><div class="sum-val">${parsedItems.length}</div><div class="sum-lbl">Item</div></div>
        <div class="sum-v"><div class="sum-val">Rp ${fmt(total)}</div><div class="sum-lbl">Total</div></div>
        <div class="sum-v"><div class="sum-val">Rp ${fmt(Math.round(avg))}</div><div class="sum-lbl">Rata-rata</div></div>`;
}

// ===== FRIENDS =====
window.addFriend = function() {
    const input = document.getElementById('friend-name'), name = input.value.trim();
    if (name && !friends.includes(name)) { friends.push(name); input.value = ''; renderFriends(); renderItems(); }
    else if (friends.includes(name)) showToast('Nama sudah ada');
    input.focus();
};
document.getElementById('friend-name')?.addEventListener('keypress', e => { if (e.key === 'Enter') addFriend(); });
window.removeFriend = function(name) { friends = friends.filter(f => f !== name); parsedItems.forEach(i => { if (i.assignedTo === name) i.assignedTo = 'Bagi Rata'; }); renderFriends(); renderItems(); };

function renderFriends() {
    document.getElementById('friend-count').textContent = friends.length;
    document.getElementById('friends-list').innerHTML = friends.map(f => `<span class="tag">${esc(f)} <span class="remove" onclick="removeFriend('${esc(f)}')">&times;</span></span>`).join('');
}

// ===== ITEMS =====
function renderItems() {
    const c = document.getElementById('items-list');
    const opts = `<option value="Bagi Rata">Bagi Rata</option>${friends.map(f => `<option value="${esc(f)}">${esc(f)}</option>`).join('')}`;
    c.innerHTML = parsedItems.map((item, i) => `<div class="item-row"><div class="item-number">${i+1}</div><div class="item-info"><div class="item-name">${esc(item.name)}</div><div class="item-price">Rp ${fmt(item.price)}</div></div><select class="item-assign" onchange="assignItem(${i},this.value)">${opts.replace(`value="${esc(item.assignedTo)}"`, `value="${esc(item.assignedTo)}" selected`)}</select><button class="item-delete" onclick="deleteItem(${i})">x</button></div>`).join('');
    updateItemsTotal(); renderReceiptSummary();
}
window.assignItem = (i, p) => { parsedItems[i].assignedTo = p; };
window.deleteItem = function(i) { parsedItems.splice(i, 1); renderItems(); };
function updateItemsTotal() { const el = document.getElementById('items-total-display'); if (el) el.textContent = 'Rp ' + fmt(parsedItems.reduce((s, i) => s + i.price, 0)); }

window.showAddItemInline = function() { const f = document.getElementById('inline-add-form'); f.classList.toggle('hidden'); if (!f.classList.contains('hidden')) document.getElementById('inline-item-name').focus(); };
window.addInlineItem = function() {
    const name = document.getElementById('inline-item-name').value.trim(), price = parseFloat(document.getElementById('inline-item-price').value) || 0;
    if (!name || price <= 0) { showToast('Isi nama dan harga'); return; }
    parsedItems.push({ name, price, assignedTo: 'Bagi Rata' });
    document.getElementById('inline-item-name').value = ''; document.getElementById('inline-item-price').value = '';
    renderItems();
};

// ===== CALCULATE =====
window.calculateSplit = function() {
    if (!friends.length) { showToast('Tambah minimal 1 teman'); return; }
    if (!parsedItems.length) { showToast('Tidak ada item'); return; }

    const taxP = parseFloat(document.getElementById('tax-percent').value) || 0;
    const svcP = parseFloat(document.getElementById('service-percent').value) || 0;
    const disc = parseFloat(document.getElementById('discount-amount').value) || 0;
    const sub = parsedItems.reduce((s, i) => s + i.price, 0);
    const tax = sub * taxP / 100, svc = sub * svcP / 100;
    const grand = sub + tax + svc - disc;
    const ratio = sub > 0 ? grand / sub : 1;

    splitResults = {};
    friends.forEach(f => { splitResults[f] = { total: 0, items: [], shared: 0 }; });
    let sharedSub = 0; const sharedItems = [];
    parsedItems.forEach(item => {
        if (item.assignedTo === 'Bagi Rata') { sharedSub += item.price; sharedItems.push(item); }
        else if (splitResults[item.assignedTo]) { splitResults[item.assignedTo].total += item.price; splitResults[item.assignedTo].items.push(item); }
    });
    const sharedPP = sharedSub / friends.length;
    friends.forEach(f => { splitResults[f].shared = sharedPP; splitResults[f].total += sharedPP; splitResults[f].final = Math.ceil(splitResults[f].total * ratio); });

    goToStep(3); launchConfetti();

    document.getElementById('grand-total-card').innerHTML = `<div class="gt-label">Grand Total</div><div class="gt-value">Rp ${fmt(Math.ceil(grand))}</div><div class="gt-sub">${friends.length} orang | ~Rp ${fmt(Math.ceil(grand / friends.length))} / orang</div>`;

    let bd = `<div class="bd-title">Rincian Perhitungan</div><div class="bd-row"><span class="l">Subtotal (${parsedItems.length} item)</span><span class="v">Rp ${fmt(sub)}</span></div>`;
    if (taxP > 0) bd += `<div class="bd-row"><span class="l">Pajak (${taxP}%)</span><span class="v">+ Rp ${fmt(Math.ceil(tax))}</span></div>`;
    if (svcP > 0) bd += `<div class="bd-row"><span class="l">Service (${svcP}%)</span><span class="v">+ Rp ${fmt(Math.ceil(svc))}</span></div>`;
    if (disc > 0) bd += `<div class="bd-row disc"><span class="l">Diskon</span><span class="v">- Rp ${fmt(disc)}</span></div>`;
    bd += `<div class="bd-row hi"><span class="l"><strong>Grand Total</strong></span><span class="v"><strong>Rp ${fmt(Math.ceil(grand))}</strong></span></div>`;
    bd += `<div class="bd-row"><span class="l">Bagi Rata (${sharedItems.length} item)</span><span class="v">Rp ${fmt(Math.ceil(sharedPP))}/org</span></div>`;
    document.getElementById('breakdown-section').innerHTML = bd;

    document.getElementById('results-list').innerHTML = friends.map(f => {
        const r = splitResults[f];
        return `<div class="result-card"><div class="rc-head"><div class="rc-name">${esc(f)}</div><div class="rc-avatar">${f.charAt(0).toUpperCase()}</div></div><div class="rc-amount">Rp ${fmt(r.final)}</div><div class="rc-detail">${r.items.length > 0 ? 'Pribadi: ' + r.items.map(i=>i.name).join(', ') + '<br>' : ''}+ bagi rata (${sharedItems.length} item)${ratio !== 1 ? '<br>Termasuk pajak/service/diskon' : ''}</div><button class="btn btn-mayar" id="btn-pay-${sanitize(f)}" onclick="payMayar('${escJs(f)}',${r.final})">Bayar Rp ${fmt(r.final)}</button></div>`;
    }).join('');

    saveToHistory(grand, friends.length);
    showToast('Tagihan berhasil dihitung');
};

// ===== CONFETTI =====
function launchConfetti() {
    const c = document.getElementById('confetti-container'); c.innerHTML = '';
    const colors = ['#ff2a70','#6366f1','#00f2fe','#f59e0b','#10b981','#ec4899'];
    for (let i = 0; i < 45; i++) {
        const p = document.createElement('div'); p.className = 'confetti-piece';
        p.style.left = Math.random()*100+'%'; p.style.background = colors[Math.floor(Math.random()*colors.length)];
        p.style.animationDelay = Math.random()*1.5+'s'; p.style.animationDuration = (2+Math.random()*2)+'s';
        p.style.width = (5+Math.random()*6)+'px'; p.style.height = (5+Math.random()*6)+'px';
        p.style.borderRadius = Math.random()>.5?'50%':'1px';
        c.appendChild(p);
    }
    setTimeout(() => { c.innerHTML=''; }, 4000);
}

// ===== PAYMENT SUCCESS DETECTION =====
function checkPaymentReturn() {
    // Check if there was a pending payment (user returned from Mayar tab)
    const pending = localStorage.getItem('splitbill_pending_pay');
    if (pending) {
        try {
            const data = JSON.parse(pending);
            // If payment was initiated less than 30 minutes ago
            if (Date.now() - data.time < 1800000) {
                showPaymentSuccessModal(data.name, data.amount);
            }
        } catch(e) {}
        localStorage.removeItem('splitbill_pending_pay');
    }
}

function showPaymentSuccessModal(name, amount) {
    const existing = document.querySelector('.payment-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="pm-content">
            <div class="pm-icon">&#10004;</div>
            <h2>Pembayaran Terkirim!</h2>
            <p>${name ? 'Pembayaran untuk <strong>' + esc(name) + '</strong>' : 'Pembayaran Anda'} ${amount ? 'sebesar <strong>Rp ' + fmt(amount) + '</strong>' : ''} telah diproses oleh Mayar.</p>
            <p class="pm-sub">Cek email untuk resi pembayaran.</p>
            <button class="btn btn-primary btn-block" onclick="this.closest('.payment-modal').remove()">Tutup</button>
        </div>
    `;
    document.body.appendChild(modal);
    launchConfetti();
}

// ===== MAYAR PAYMENT =====
window.payMayar = async function(name, amount) {
    if (amount <= 0) return;
    const btn = document.getElementById('btn-pay-' + sanitize(name));
    if (!btn) return;
    btn.textContent = 'Memproses...'; btn.disabled = true; btn.style.opacity = '.7';

    try {
        const res = await fetch('/api/pay', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ payerName: name, amount, description: 'Patungan Bukber - ' + name })
        });
        const r = await res.json();
        if (r.success && r.link) {
            // Save pending payment info
            localStorage.setItem('splitbill_pending_pay', JSON.stringify({ name, amount, time: Date.now() }));

            btn.textContent = 'Link Siap'; btn.style.opacity = '1';
            btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';

            // Open Mayar in new tab
            const payWindow = window.open(r.link, '_blank');

            // Listen for when user comes back to this tab
            const onReturn = () => {
                if (document.visibilityState === 'visible') {
                    document.removeEventListener('visibilitychange', onReturn);
                    setTimeout(() => {
                        showPaymentSuccessModal(name, amount);
                        btn.textContent = 'Sudah Dibayar';
                        btn.disabled = true;
                        localStorage.removeItem('splitbill_pending_pay');
                    }, 800);
                }
            };
            document.addEventListener('visibilitychange', onReturn);

            showToast('Halaman pembayaran dibuka di tab baru');
        } else throw new Error();
    } catch (e) {
        btn.textContent = 'Gagal - Coba Lagi'; btn.style.opacity = '1';
        btn.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
        btn.disabled = false; btn.onclick = () => payMayar(name, amount);
        showToast('Gagal membuat link pembayaran');
    }
};

// ===== SHARING (ASCII only) =====
window.shareViaWhatsApp = function() { window.open('https://wa.me/?text=' + encodeURIComponent(buildShareText()), '_blank'); };
window.copyShareText = function() {
    const t = buildShareText();
    navigator.clipboard.writeText(t).then(() => showToast('Disalin')).catch(() => {
        const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        showToast('Disalin');
    });
};
function buildShareText() {
    const grand = Object.values(splitResults).reduce((s,r) => s + r.final, 0);
    let t = '*SplitBill Bukber*\n================================\nTotal: Rp ' + fmt(grand) + '\n' + friends.length + ' orang patungan\n\n';
    friends.forEach(f => { const r = splitResults[f]; t += '- *' + f + '*: Rp ' + fmt(r.final) + '\n'; });
    t += '\n================================\n(c) 2026 Muhammad Ketsar Ali Abi Wahid';
    return t;
}

// ===== HISTORY =====
function saveToHistory(gt, pc) {
    try {
        const h = JSON.parse(localStorage.getItem('splitbill_history') || '[]');
        h.unshift({ date: new Date().toLocaleString('id-ID'), total: Math.ceil(gt), people: pc, friends: [...friends] });
        if (h.length > 20) h.length = 20;
        localStorage.setItem('splitbill_history', JSON.stringify(h));
        loadHistory();
    } catch(e) {}
}
function loadHistory() {
    try {
        const h = JSON.parse(localStorage.getItem('splitbill_history') || '[]');
        const c = document.getElementById('history-list');
        if (!h.length) { c.innerHTML = '<p class="empty-hist">Belum ada riwayat.</p>'; return; }
        c.innerHTML = h.map(x => `<div class="history-card"><div class="hc-date">${x.date}</div><div class="hc-total">Rp ${fmt(x.total)}</div><div class="hc-people">${x.people} orang: ${x.friends.join(', ')}</div></div>`).join('');
    } catch(e) {}
}
window.toggleHistory = function() { document.getElementById('history-panel').classList.toggle('hidden'); document.getElementById('history-overlay').classList.toggle('hidden'); };
window.clearHistory = function() { localStorage.removeItem('splitbill_history'); loadHistory(); showToast('Riwayat dihapus'); };

// ===== RESET =====
window.resetApp = function() { friends = []; parsedItems = []; splitResults = {}; goToStep(1); resetUploadUI(); const mp = document.getElementById('manual-items-preview'); if (mp) mp.innerHTML = ''; const btn = document.getElementById('btn-manual-next'); if (btn) btn.style.display = 'none'; showToast('Fresh start!'); };

// ============================================================
// JADWAL SHOLAT — from Aladhan API via server proxy
// ============================================================
async function renderPrayerTimes() {
    const container = document.getElementById('prayer-list');
    const dateEl = document.getElementById('hijri-date');

    // Show loading state
    container.innerHTML = '<div class="prayer-card"><div class="pr-left"><span class="pr-name">Memuat jadwal...</span></div></div>';

    try {
        const res = await fetch('/api/prayer-times');
        const data = await res.json();

        if (!data.success) throw new Error();

        const timings = data.timings;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Save Maghrib time for countdown
        maghribTime = timings.Maghrib;

        const prayers = [
            { name: 'Subuh', time: timings.Subuh, icon: '&#9790;' },
            { name: 'Dzuhur', time: timings.Dzuhur, icon: '&#9788;' },
            { name: 'Ashar', time: timings.Ashar, icon: '&#9788;' },
            { name: 'Maghrib', time: timings.Maghrib, icon: '&#9790;' },
            { name: 'Isya', time: timings.Isya, icon: '&#9733;' }
        ];

        // Find next prayer
        let nextIdx = -1;
        for (let i = 0; i < prayers.length; i++) {
            const [h, m] = prayers[i].time.split(':').map(Number);
            const mins = h * 60 + m;
            if (mins > currentMinutes) { nextIdx = i; break; }
        }

        container.innerHTML = prayers.map((p, i) => `
            <div class="prayer-card ${i === nextIdx ? 'active-prayer' : ''}">
                <div class="pr-left">
                    <span class="pr-icon">${p.icon}</span>
                    <span class="pr-name">${p.name}</span>
                </div>
                <span class="pr-time">${p.time}</span>
            </div>
        `).join('');

        // Date display (Hijri + Masehi)
        if (data.date) {
            const hijri = data.date.hijri;
            const greg = data.date.gregorian;
            dateEl.textContent = `${hijri?.day || ''} ${hijri?.month?.en || ''} ${hijri?.year || ''} H / ${greg?.weekday?.en || ''}, ${greg?.day || ''} ${greg?.month?.en || ''} ${greg?.year || ''}`;
        } else {
            dateEl.textContent = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }

    } catch (err) {
        console.error('Failed to fetch prayer times:', err);
        // Fallback: show message
        container.innerHTML = '<div class="prayer-card"><div class="pr-left"><span class="pr-name">Gagal memuat. Periksa koneksi internet.</span></div></div>';
        dateEl.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
}

// ============================================================
// DOA HARIAN RAMADAN
// ============================================================
function renderDoas() {
    const doas = [
        {
            title: 'Doa Niat Puasa',
            arabic: '\u0646\u064E\u0648\u064E\u064A\u0652\u062A\u064F \u0635\u064E\u0648\u0652\u0645\u064E \u063A\u064E\u062F\u064D \u0639\u064E\u0646\u0652 \u0623\u064E\u062F\u064E\u0627\u0621\u0650 \u0641\u064E\u0631\u0652\u0636\u0650 \u0634\u064E\u0647\u0652\u0631\u0650 \u0631\u064E\u0645\u064E\u0636\u064E\u0627\u0646\u064E \u0647\u064E\u0630\u064E\u0627 \u0627\u0644\u0633\u064E\u0651\u0646\u064E\u0629\u0650 \u0644\u0650\u0644\u0647\u0650 \u062A\u064E\u0639\u064E\u0627\u0644\u064E\u0649',
            latin: "Nawaitu shauma ghadin 'an ada-i fardhi syahri ramadhaana haadzas sanati lillahi ta'aala",
            meaning: 'Saya berniat puasa esok hari untuk menunaikan kewajiban di bulan Ramadan tahun ini karena Allah Ta\'ala.'
        },
        {
            title: 'Doa Buka Puasa',
            arabic: '\u0627\u064E\u0644\u0644\u0651\u064E\u0647\u064F\u0645\u064E\u0651 \u0644\u064E\u0643\u064E \u0635\u064F\u0645\u0652\u062A\u064F \u0648\u064E\u0639\u064E\u0644\u064E\u0649 \u0631\u0650\u0632\u0652\u0642\u0650\u0643\u064E \u0623\u064E\u0641\u0652\u0637\u064E\u0631\u0652\u062A\u064F \u0628\u0650\u0631\u064E\u062D\u0652\u0645\u064E\u062A\u0650\u0643\u064E \u064A\u064E\u0627 \u0623\u064E\u0631\u0652\u062D\u064E\u0645\u064E \u0627\u0644\u0631\u064E\u0651\u0627\u062D\u0650\u0645\u0650\u064A\u0646\u064E',
            latin: "Allahumma laka shumtu wa 'ala rizqika afthartu birahmatika ya arhamar rahimin",
            meaning: 'Ya Allah, untuk-Mu aku berpuasa, dan dengan rezeki-Mu aku berbuka. Dengan rahmat-Mu, wahai Yang Maha Pengasih dari semua yang pengasih.'
        },
        {
            title: 'Doa Setelah Makan',
            arabic: '\u0627\u064E\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0623\u064E\u0637\u0652\u0639\u064E\u0645\u064E\u0646\u064E\u0627 \u0648\u064E\u0633\u064E\u0642\u064E\u0627\u0646\u064E\u0627 \u0648\u064E\u062C\u064E\u0639\u064E\u0644\u064E\u0646\u064E\u0627 \u0645\u064F\u0633\u0652\u0644\u0650\u0645\u0650\u064A\u0646\u064E',
            latin: "Alhamdulillahilladzi ath'amana wa saqana wa ja'alana muslimin",
            meaning: 'Segala puji bagi Allah yang telah memberi kami makan dan minum serta menjadikan kami orang-orang Islam.'
        },
        {
            title: 'Doa Lailatul Qadar',
            arabic: '\u0627\u064E\u0644\u0644\u0651\u064E\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u064E\u0651\u0643\u064E \u0639\u064E\u0641\u064F\u0648\u064C\u0651 \u062A\u064F\u062D\u0650\u0628\u064F\u0651 \u0627\u0644\u0652\u0639\u064E\u0641\u0652\u0648\u064E \u0641\u064E\u0627\u0639\u0652\u0641\u064F \u0639\u064E\u0646\u064E\u0651\u0627',
            latin: "Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anna",
            meaning: 'Ya Allah, sesungguhnya Engkau Maha Pemaaf, Engkau menyukai maaf, maka maafkanlah kami.'
        },
        {
            title: 'Doa Qunut (Witir)',
            arabic: '\u0627\u064E\u0644\u0644\u0651\u064E\u0647\u064F\u0645\u064E\u0651 \u0627\u0647\u0652\u062F\u0650\u0646\u064E\u0627 \u0641\u0650\u064A\u0645\u064E\u0646\u0652 \u0647\u064E\u062F\u064E\u064A\u0652\u062A\u064E \u0648\u064E\u0639\u064E\u0627\u0641\u0650\u0646\u064E\u0627 \u0641\u0650\u064A\u0645\u064E\u0646\u0652 \u0639\u064E\u0627\u0641\u064E\u064A\u0652\u062A\u064E',
            latin: "Allahummahdina fiman hadait, wa 'afina fiman 'afait",
            meaning: 'Ya Allah, berilah kami petunjuk di antara orang yang Engkau beri petunjuk, dan berilah kami keselamatan di antara orang yang Engkau beri keselamatan.'
        }
    ];

    document.getElementById('doa-list').innerHTML = doas.map(d => `
        <div class="doa-card">
            <div class="doa-title">${d.title}</div>
            <div class="doa-arabic">${d.arabic}</div>
            <div class="doa-latin">${d.latin}</div>
            <div class="doa-meaning">${d.meaning}</div>
        </div>
    `).join('');
}

// ============================================================
// KALKULATOR ZAKAT
// ============================================================
const NISAB_EMAS_GRAM = 85;
const HARGA_EMAS_PER_GRAM = 1_500_000;
const NISAB = NISAB_EMAS_GRAM * HARGA_EMAS_PER_GRAM;
const ZAKAT_RATE = 0.025;

window.calculateZakat = function() {
    const harta = parseFloat(document.getElementById('zakat-harta').value) || 0;
    const hutang = parseFloat(document.getElementById('zakat-hutang').value) || 0;
    const bersih = harta - hutang;
    const result = document.getElementById('zakat-result');
    if (harta <= 0) { showToast('Masukkan jumlah harta'); return; }
    result.classList.remove('hidden');
    if (bersih < NISAB) {
        result.innerHTML = `<div class="zr-label">Status Zakat</div><div class="zr-value" style="-webkit-text-fill-color:var(--t2);font-size:1.2rem;">Belum Wajib Zakat</div><div class="zr-note">Harta bersih Anda (Rp ${fmt(bersih)}) belum mencapai nisab (Rp ${fmt(NISAB)}).</div>`;
    } else {
        const zakatAmt = Math.ceil(bersih * ZAKAT_RATE);
        result.innerHTML = `<div class="zr-label">Zakat yang Harus Dibayar</div><div class="zr-value">Rp ${fmt(zakatAmt)}</div><div class="zr-note">2,5% x Rp ${fmt(bersih)} (harta bersih)</div><button class="btn btn-mayar" id="btn-pay-zakat" onclick="payZakatMayar(${zakatAmt})">Bayar Zakat Rp ${fmt(zakatAmt)}</button>`;
    }
};

window.payZakatMayar = async function(amount) {
    const btn = document.getElementById('btn-pay-zakat');
    if (!btn) return;
    btn.textContent = 'Memproses...'; btn.disabled = true; btn.style.opacity = '.7';
    try {
        const res = await fetch('/api/pay', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ payerName: 'Pembayar Zakat', amount, description: 'Pembayaran Zakat Mal' }) });
        const r = await res.json();
        if (r.success && r.link) {
            localStorage.setItem('splitbill_pending_pay', JSON.stringify({ name: 'Zakat Mal', amount, time: Date.now() }));
            btn.textContent = 'Link Siap'; btn.style.opacity = '1';
            btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
            window.open(r.link, '_blank');
            const onReturn = () => {
                if (document.visibilityState === 'visible') {
                    document.removeEventListener('visibilitychange', onReturn);
                    setTimeout(() => {
                        showPaymentSuccessModal('Zakat Mal', amount);
                        btn.textContent = 'Sudah Dibayar';
                        btn.disabled = true;
                        localStorage.removeItem('splitbill_pending_pay');
                    }, 800);
                }
            };
            document.addEventListener('visibilitychange', onReturn);
            showToast('Halaman pembayaran dibuka di tab baru');
        } else throw new Error();
    } catch (e) {
        btn.textContent = 'Gagal - Coba Lagi'; btn.style.opacity = '1'; btn.disabled = false;
        btn.onclick = () => payZakatMayar(amount);
        showToast('Gagal membuat link pembayaran');
    }
};

// ===== TOAST =====
function showToast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== UTILS =====
function fmt(n) { return Math.round(n).toLocaleString('id-ID'); }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function escJs(s) { return s.replace(/'/g, "\\'").replace(/"/g, '\\"'); }
function sanitize(s) { return s.replace(/[^a-zA-Z0-9]/g, '_'); }
