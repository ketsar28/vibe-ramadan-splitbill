// ============================================================
// Ramadan Companion App v2.0
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
    restoreState();
    initCitySearch();
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

// ===== COUNTDOWN (Maghrib-based from API) =====
let maghribTime = null;

function startCountdown() {
    // Set default location text immediately
    const loc = document.getElementById('countdown-location');
    const savedCity = localStorage.getItem('splitbill_city');
    if (savedCity) {
        try { loc.textContent = JSON.parse(savedCity).name; } catch(e) { loc.textContent = 'Jakarta (WIB)'; }
    } else {
        loc.textContent = 'Jakarta (WIB)';
    }

    function update() {
        const now = new Date();
        let iftarTarget;
        if (maghribTime) {
            const [h, m] = maghribTime.split(':').map(Number);
            iftarTarget = new Date(now); iftarTarget.setHours(h, m, 0, 0);
        } else {
            iftarTarget = new Date(now); iftarTarget.setHours(18, 11, 0, 0);
        }
        const bar = document.getElementById('countdown-bar');
        const timer = document.getElementById('countdown-timer');
        if (now >= iftarTarget) {
            timer.textContent = 'Waktunya Berbuka!';
            bar.classList.add('iftar-time');
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
const MORE_PAGES = ['zakat', 'kiblat', 'quran', 'tasbih', 'kalender', 'thr'];

window.switchPage = function(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    
    // Update bottom nav highlights
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.more-item').forEach(m => m.classList.remove('active'));
    
    if (MORE_PAGES.includes(page)) {
        // Highlight "Lainnya" button + the specific more-item
        const moreBtn = document.getElementById('nav-more-btn');
        if (moreBtn) moreBtn.classList.add('active');
        const moreItem = document.querySelector(`.more-item[data-page="${page}"]`);
        if (moreItem) moreItem.classList.add('active');
    } else {
        const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navBtn) navBtn.classList.add('active');
    }
    
    // Show hero only on home
    const hero = document.getElementById('hero-section');
    if (hero) hero.style.display = (page === 'home') ? '' : 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ===== MORE MENU =====
window.toggleMoreMenu = function() {
    document.getElementById('more-menu').classList.toggle('hidden');
    document.getElementById('more-overlay').classList.toggle('hidden');
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
    const themeColors = { dark: '#030014', light: '#f5f7fa', ramadan: '#060d08', ocean: '#020617', sunset: '#1c0a00' };
    document.querySelector('meta[name="theme-color"]').content = themeColors[theme] || '#030014';
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
    steps.forEach(s => { if(s) { s.classList.remove('active'); s.classList.add('hidden'); }});
    if (steps[step-1]) { steps[step-1].classList.remove('hidden'); steps[step-1].classList.add('active'); }
    document.querySelectorAll('.p-step').forEach((ps, i) => {
        ps.classList.remove('active', 'completed');
        if (i + 1 === step) ps.classList.add('active');
        else if (i + 1 < step) ps.classList.add('completed');
    });
    const pf1 = document.getElementById('pf-1'); if (pf1) pf1.style.width = step >= 2 ? '100%' : '0%';
    const pf2 = document.getElementById('pf-2'); if (pf2) pf2.style.width = step >= 3 ? '100%' : '0%';
    currentStep = step;
    saveState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== TAB SWITCHER =====
window.switchInputTab = function(tab) {
    document.querySelectorAll('#page-split .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#page-split .tab-c').forEach(c => c.classList.remove('active'));
    if (tab === 'scan') {
        document.querySelectorAll('#page-split .tab-btn')[0]?.classList.add('active');
        document.getElementById('tab-scan')?.classList.add('active');
    } else {
        document.querySelectorAll('#page-split .tab-btn')[1]?.classList.add('active');
        document.getElementById('tab-manual')?.classList.add('active');
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
    document.getElementById('loading')?.classList.add('hidden');
    document.getElementById('image-preview')?.classList.add('hidden');
}

// ===== MANUAL ENTRY =====
window.addManualItem = function() {
    const ni = document.getElementById('manual-item-name'), pi = document.getElementById('manual-item-price');
    const name = ni.value.trim(), price = parseFloat(pi.value.replace(/\./g, '')) || 0;
    if (!name || price <= 0) { showToast('Isi nama dan harga'); return; }
    parsedItems.push({ name, price, assignedTo: 'Bagi Rata' });
    ni.value = ''; pi.value = ''; ni.focus();
    renderManualPreview(); saveState();
};
document.getElementById('manual-item-name')?.addEventListener('keypress', e => { if (e.key === 'Enter') document.getElementById('manual-item-price').focus(); });
document.getElementById('manual-item-price')?.addEventListener('keypress', e => { if (e.key === 'Enter') addManualItem(); });

function renderManualPreview() {
    const c = document.getElementById('manual-items-preview'), btn = document.getElementById('btn-manual-next');
    if (!c) return;
    c.innerHTML = parsedItems.map((item, i) => `<div class="manual-item"><span class="mi-name">${esc(item.name)}</span><span class="mi-price">Rp ${fmt(item.price)}</span><button class="mi-delete" onclick="removeManualItem(${i})">x</button></div>`).join('');
    if (btn) btn.style.display = parsedItems.length > 0 ? 'flex' : 'none';
}
window.removeManualItem = function(i) { parsedItems.splice(i, 1); renderManualPreview(); saveState(); };
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
    const el = document.getElementById('summary-stats');
    if (el) el.innerHTML = `
        <div class="sum-v"><div class="sum-val">${parsedItems.length}</div><div class="sum-lbl">Item</div></div>
        <div class="sum-v"><div class="sum-val">Rp ${fmt(total)}</div><div class="sum-lbl">Total</div></div>
        <div class="sum-v"><div class="sum-val">Rp ${fmt(Math.round(avg))}</div><div class="sum-lbl">Rata-rata</div></div>`;
}

// ===== FRIENDS =====
window.addFriend = function() {
    const input = document.getElementById('friend-name'), name = input.value.trim();
    if (name && !friends.includes(name)) { friends.push(name); input.value = ''; renderFriends(); renderItems(); saveState(); }
    else if (friends.includes(name)) showToast('Nama sudah ada');
    input.focus();
};
document.getElementById('friend-name')?.addEventListener('keypress', e => { if (e.key === 'Enter') addFriend(); });
window.removeFriend = function(name) { friends = friends.filter(f => f !== name); parsedItems.forEach(i => { if (i.assignedTo === name) i.assignedTo = 'Bagi Rata'; }); renderFriends(); renderItems(); saveState(); };

function renderFriends() {
    const fc = document.getElementById('friend-count'); if (fc) fc.textContent = friends.length;
    const fl = document.getElementById('friends-list');
    if (fl) fl.innerHTML = friends.map(f => `<span class="tag">${esc(f)} <span class="remove" onclick="removeFriend('${esc(f)}')">&times;</span></span>`).join('');
}

// ===== ITEMS =====
function renderItems() {
    const c = document.getElementById('items-list');
    if (!c) return;
    const opts = `<option value="Bagi Rata">Bagi Rata</option>${friends.map(f => `<option value="${esc(f)}">${esc(f)}</option>`).join('')}`;
    c.innerHTML = parsedItems.map((item, i) => `<div class="item-row"><div class="item-number">${i+1}</div><div class="item-info"><div class="item-name">${esc(item.name)}</div><div class="item-price">Rp ${fmt(item.price)}</div></div><select class="item-assign" onchange="assignItem(${i},this.value)">${opts.replace(`value="${esc(item.assignedTo)}"`, `value="${esc(item.assignedTo)}" selected`)}</select><button class="item-delete" onclick="deleteItem(${i})">x</button></div>`).join('');
    updateItemsTotal(); renderReceiptSummary();
}
window.assignItem = (i, p) => { parsedItems[i].assignedTo = p; saveState(); };
window.deleteItem = function(i) { parsedItems.splice(i, 1); renderItems(); saveState(); };
function updateItemsTotal() { const el = document.getElementById('items-total-display'); if (el) el.textContent = 'Rp ' + fmt(parsedItems.reduce((s, i) => s + i.price, 0)); }

window.showAddItemInline = function() { const f = document.getElementById('inline-add-form'); if(f) { f.classList.toggle('hidden'); if (!f.classList.contains('hidden')) document.getElementById('inline-item-name')?.focus(); } };
window.addInlineItem = function() {
    const name = document.getElementById('inline-item-name')?.value.trim(), price = parseFloat(document.getElementById('inline-item-price')?.value.replace(/\./g, '')) || 0;
    if (!name || price <= 0) { showToast('Isi nama dan harga'); return; }
    parsedItems.push({ name, price, assignedTo: 'Bagi Rata' });
    document.getElementById('inline-item-name').value = ''; document.getElementById('inline-item-price').value = '';
    renderItems(); saveState();
};

// ===== CALCULATE =====
window.calculateSplit = function() {
    if (!friends.length) { showToast('Tambah minimal 1 teman'); return; }
    if (!parsedItems.length) { showToast('Tidak ada item'); return; }
    const taxP = parseFloat(document.getElementById('tax-percent')?.value) || 0;
    const svcP = parseFloat(document.getElementById('service-percent')?.value) || 0;
    const disc = parseFloat(document.getElementById('discount-amount')?.value) || 0;
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
    const pending = localStorage.getItem('splitbill_pending_pay');
    if (pending) {
        try {
            const data = JSON.parse(pending);
            if (Date.now() - data.time < 1800000) showPaymentSuccessModal(data.name, data.amount);
        } catch(e) {}
        localStorage.removeItem('splitbill_pending_pay');
    }
}

function showPaymentSuccessModal(name, amount) {
    const existing = document.querySelector('.payment-modal'); if (existing) existing.remove();
    const modal = document.createElement('div'); modal.className = 'payment-modal';
    modal.innerHTML = `<div class="pm-content"><div class="pm-icon">&#10004;</div><h2>Pembayaran Terkirim!</h2><p>${name ? 'Pembayaran untuk <strong>' + esc(name) + '</strong>' : 'Pembayaran Anda'} ${amount ? 'sebesar <strong>Rp ' + fmt(amount) + '</strong>' : ''} telah diproses oleh Mayar.</p><p class="pm-sub">Cek email untuk resi pembayaran.</p><button class="btn btn-primary btn-block" onclick="this.closest('.payment-modal').remove()">Tutup</button></div>`;
    document.body.appendChild(modal); launchConfetti();
}

// ===== MAYAR PAYMENT =====
window.payMayar = async function(name, amount) {
    if (amount <= 0) return;
    const btn = document.getElementById('btn-pay-' + sanitize(name));
    if (!btn) return;
    btn.textContent = 'Memproses...'; btn.disabled = true; btn.style.opacity = '.7';
    try {
        const res = await fetch('/api/pay', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ payerName: name, amount, description: 'Patungan Bukber - ' + name }) });
        const r = await res.json();
        if (r.success && r.link) {
            localStorage.setItem('splitbill_pending_pay', JSON.stringify({ name, amount, time: Date.now() }));
            btn.textContent = 'Link Siap'; btn.style.opacity = '1';
            btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
            window.open(r.link, '_blank');
            const onReturn = () => {
                if (document.visibilityState === 'visible') {
                    document.removeEventListener('visibilitychange', onReturn);
                    setTimeout(() => { showPaymentSuccessModal(name, amount); btn.textContent = 'Sudah Dibayar'; btn.disabled = true; localStorage.removeItem('splitbill_pending_pay'); }, 800);
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
        if (!c) return;
        if (!h.length) { c.innerHTML = '<p class="empty-hist">Belum ada riwayat.</p>'; return; }
        c.innerHTML = h.map(x => `<div class="history-card"><div class="hc-date">${x.date}</div><div class="hc-total">Rp ${fmt(x.total)}</div><div class="hc-people">${x.people} orang: ${x.friends.join(', ')}</div></div>`).join('');
    } catch(e) {}
}
window.toggleHistory = function() { document.getElementById('history-panel')?.classList.toggle('hidden'); document.getElementById('history-overlay')?.classList.toggle('hidden'); };
window.clearHistory = function() { localStorage.removeItem('splitbill_history'); loadHistory(); showToast('Riwayat dihapus'); };

// ===== RESET =====
window.resetApp = function() {
    friends = []; parsedItems = []; splitResults = {};
    goToStep(1); resetUploadUI();
    const mp = document.getElementById('manual-items-preview'); if (mp) mp.innerHTML = '';
    const btn = document.getElementById('btn-manual-next'); if (btn) btn.style.display = 'none';
    clearState();
    showToast('Fresh start!');
};

// ============================================================
// STATE PERSISTENCE — Auto-save split bill data
// ============================================================
function saveState() {
    try {
        localStorage.setItem('splitbill_state', JSON.stringify({
            friends, parsedItems, currentStep, timestamp: Date.now()
        }));
    } catch(e) {}
}

function restoreState() {
    try {
        const raw = localStorage.getItem('splitbill_state');
        if (!raw) return;
        const state = JSON.parse(raw);
        // Only restore if less than 24 hours old
        if (Date.now() - state.timestamp > 86400000) { clearState(); return; }
        if (state.friends?.length || state.parsedItems?.length) {
            friends = state.friends || [];
            parsedItems = state.parsedItems || [];
            if (state.currentStep > 1 && parsedItems.length > 0) {
                // Switch to split bill page and restore step
                switchPage('split');
                transitionToStep2();
                if (state.currentStep === 1) goToStep(1);
                showToast('Data sebelumnya dipulihkan');
            }
        }
    } catch(e) { clearState(); }
}

function clearState() {
    localStorage.removeItem('splitbill_state');
}

// ============================================================
// JADWAL SHOLAT — MyQuran v3 (Kemenag RI)
// ============================================================
let selectedCityId = null;
let selectedCityName = '';

function initCitySearch() {
    const input = document.getElementById('city-search-input');
    if (!input) return;

    // Load saved city
    const saved = localStorage.getItem('splitbill_city');
    if (saved) {
        try {
            const city = JSON.parse(saved);
            selectedCityId = city.id;
            selectedCityName = city.name;
            input.value = city.name;
            renderPrayerTimes(city.id);
        } catch(e) {}
    }

    let debounce;
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        const q = input.value.trim();
        if (q.length < 2) { hideCityResults(); return; }
        debounce = setTimeout(() => searchCities(q), 300);
    });

    // Close results on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.city-search')) hideCityResults();
    });
}

async function searchCities(keyword) {
    const container = document.getElementById('city-results');
    if (!container) return;
    container.classList.remove('hidden');
    container.innerHTML = '<div class="city-loading">Mencari...</div>';

    try {
        const res = await fetch('/api/cities?q=' + encodeURIComponent(keyword));
        const data = await res.json();
        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(c => `<div class="city-option" onclick="selectCity('${c.id}','${esc(c.lokasi)}')">${c.lokasi}</div>`).join('');
        } else {
            container.innerHTML = '<div class="city-loading">Tidak ditemukan</div>';
        }
    } catch(e) {
        container.innerHTML = '<div class="city-loading">Gagal mencari</div>';
    }
}

window.selectCity = function(id, name) {
    selectedCityId = id;
    selectedCityName = name;
    document.getElementById('city-search-input').value = name;
    hideCityResults();
    localStorage.setItem('splitbill_city', JSON.stringify({ id, name }));
    renderPrayerTimes(id);
    // Update countdown location
    const loc = document.getElementById('countdown-location');
    if (loc) loc.textContent = name;
    showToast('Kota diganti: ' + name);
};

function hideCityResults() {
    const c = document.getElementById('city-results');
    if (c) c.classList.add('hidden');
}

async function renderPrayerTimes(cityId) {
    const container = document.getElementById('prayer-list');
    const dateEl = document.getElementById('jadwal-date');
    const locEl = document.getElementById('jadwal-location');

    if (!container) return;
    container.innerHTML = '<div class="prayer-card"><div class="pr-left"><span class="pr-name">Memuat jadwal...</span></div></div>';

    try {
        const params = cityId ? `?cityId=${cityId}` : '';
        const res = await fetch('/api/prayer-times' + params);
        const data = await res.json();

        if (!data.success) throw new Error();

        const jadwal = data.jadwal;
        maghribTime = jadwal.maghrib;

        // Update location display
        const locText = `${data.lokasi}${data.provinsi ? ', ' + data.provinsi : ''}`;
        const locP = document.getElementById('jadwal-location');
        if (locP) locP.textContent = 'Waktu sholat hari ini — ' + locText;
        const cdLoc = document.getElementById('countdown-location');
        if (cdLoc && !selectedCityName) cdLoc.textContent = locText;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const prayers = [
            { name: 'Imsak', time: jadwal.imsak, icon: '&#9789;' },
            { name: 'Subuh', time: jadwal.subuh, icon: '&#9790;' },
            { name: 'Terbit', time: jadwal.terbit, icon: '&#9788;' },
            { name: 'Dhuha', time: jadwal.dhuha, icon: '&#9728;' },
            { name: 'Dzuhur', time: jadwal.dzuhur, icon: '&#9788;' },
            { name: 'Ashar', time: jadwal.ashar, icon: '&#9788;' },
            { name: 'Maghrib', time: jadwal.maghrib, icon: '&#9790;' },
            { name: 'Isya', time: jadwal.isya, icon: '&#9733;' }
        ];

        let nextIdx = -1;
        for (let i = 0; i < prayers.length; i++) {
            const [h, m] = prayers[i].time.split(':').map(Number);
            if (h * 60 + m > currentMinutes) { nextIdx = i; break; }
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

        if (dateEl) dateEl.textContent = jadwal.tanggal || now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    } catch (err) {
        console.error('Failed to fetch prayer times:', err);
        container.innerHTML = '<div class="prayer-card"><div class="pr-left"><span class="pr-name">Gagal memuat. Periksa koneksi internet.</span></div></div>';
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
}

// ============================================================
// DOA HARIAN RAMADAN
// ============================================================
function renderDoas() {
    const doas = [
        { title: 'Doa Niat Puasa', arabic: '\u0646\u064E\u0648\u064E\u064A\u0652\u062A\u064F \u0635\u064E\u0648\u0652\u0645\u064E \u063A\u064E\u062F\u064D \u0639\u064E\u0646\u0652 \u0623\u064E\u062F\u064E\u0627\u0621\u0650 \u0641\u064E\u0631\u0652\u0636\u0650 \u0634\u064E\u0647\u0652\u0631\u0650 \u0631\u064E\u0645\u064E\u0636\u064E\u0627\u0646\u064E \u0647\u064E\u0630\u064E\u0627 \u0627\u0644\u0633\u064E\u0651\u0646\u064E\u0629\u0650 \u0644\u0650\u0644\u0647\u0650 \u062A\u064E\u0639\u064E\u0627\u0644\u064E\u0649', latin: "Nawaitu shauma ghadin 'an ada-i fardhi syahri ramadhaana haadzas sanati lillahi ta'aala", meaning: 'Saya berniat puasa esok hari untuk menunaikan kewajiban di bulan Ramadan tahun ini karena Allah Ta\'ala.' },
        { title: 'Doa Buka Puasa', arabic: '\u0627\u064E\u0644\u0644\u0651\u064E\u0647\u064F\u0645\u064E\u0651 \u0644\u064E\u0643\u064E \u0635\u064F\u0645\u0652\u062A\u064F \u0648\u064E\u0639\u064E\u0644\u064E\u0649 \u0631\u0650\u0632\u0652\u0642\u0650\u0643\u064E \u0623\u064E\u0641\u0652\u0637\u064E\u0631\u0652\u062A\u064F \u0628\u0650\u0631\u064E\u062D\u0652\u0645\u064E\u062A\u0650\u0643\u064E \u064A\u064E\u0627 \u0623\u064E\u0631\u0652\u062D\u064E\u0645\u064E \u0627\u0644\u0631\u064E\u0651\u0627\u062D\u0650\u0645\u0650\u064A\u0646\u064E', latin: "Allahumma laka shumtu wa 'ala rizqika afthartu birahmatika ya arhamar rahimin", meaning: 'Ya Allah, untuk-Mu aku berpuasa, dan dengan rezeki-Mu aku berbuka. Dengan rahmat-Mu, wahai Yang Maha Pengasih dari semua yang pengasih.' },
        { title: 'Doa Setelah Makan', arabic: '\u0627\u064E\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u064E\u0651\u0630\u0650\u064A \u0623\u064E\u0637\u0652\u0639\u064E\u0645\u064E\u0646\u064E\u0627 \u0648\u064E\u0633\u064E\u0642\u064E\u0627\u0646\u064E\u0627 \u0648\u064E\u062C\u064E\u0639\u064E\u0644\u064E\u0646\u064E\u0627 \u0645\u064F\u0633\u0652\u0644\u0650\u0645\u0650\u064A\u0646\u064E', latin: "Alhamdulillahilladzi ath'amana wa saqana wa ja'alana muslimin", meaning: 'Segala puji bagi Allah yang telah memberi kami makan dan minum serta menjadikan kami orang-orang Islam.' },
        { title: 'Doa Lailatul Qadar', arabic: '\u0627\u064E\u0644\u0644\u0651\u064E\u0647\u064F\u0645\u064E\u0651 \u0625\u0650\u0646\u064E\u0651\u0643\u064E \u0639\u064E\u0641\u064F\u0648\u064C\u0651 \u062A\u064F\u062D\u0650\u0628\u064F\u0651 \u0627\u0644\u0652\u0639\u064E\u0641\u0652\u0648\u064E \u0641\u064E\u0627\u0639\u0652\u0641\u064F \u0639\u064E\u0646\u064E\u0651\u0627', latin: "Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anna", meaning: 'Ya Allah, sesungguhnya Engkau Maha Pemaaf, Engkau menyukai maaf, maka maafkanlah kami.' },
        { title: 'Doa Qunut (Witir)', arabic: '\u0627\u064E\u0644\u0644\u0651\u064E\u0647\u064F\u0645\u064E\u0651 \u0627\u0647\u0652\u062F\u0650\u0646\u064E\u0627 \u0641\u0650\u064A\u0645\u064E\u0646\u0652 \u0647\u064E\u062F\u064E\u064A\u0652\u062A\u064E \u0648\u064E\u0639\u064E\u0627\u0641\u0650\u0646\u064E\u0627 \u0641\u0650\u064A\u0645\u064E\u0646\u0652 \u0639\u064E\u0627\u0641\u064E\u064A\u0652\u062A\u064E', latin: "Allahummahdina fiman hadait, wa 'afina fiman 'afait", meaning: 'Ya Allah, berilah kami petunjuk di antara orang yang Engkau beri petunjuk, dan berilah kami keselamatan di antara orang yang Engkau beri keselamatan.' }
    ];

    const el = document.getElementById('doa-list');
    if (el) el.innerHTML = doas.map(d => `
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

// Tab switcher for Zakat
window.switchZakatTab = function(tab) {
    document.querySelectorAll('.zakat-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#page-zakat .tab-c').forEach(c => c.classList.remove('active'));
    if (tab === 'mal') {
        document.querySelectorAll('.zakat-tabs .tab-btn')[0]?.classList.add('active');
        document.getElementById('tab-zakat-mal')?.classList.add('active');
    } else {
        document.querySelectorAll('.zakat-tabs .tab-btn')[1]?.classList.add('active');
        document.getElementById('tab-zakat-fitrah')?.classList.add('active');
    }
};

window.calculateZakat = function() {
    const hargasBeras = document.getElementById('zakat-harta')?.value.replace(/\./g, '');
    const harta = parseFloat(hargasBeras) || 0;
    const utangInput = document.getElementById('zakat-hutang')?.value.replace(/\./g, '');
    const hutang = parseFloat(utangInput) || 0;
    const bersih = harta - hutang;
    const result = document.getElementById('zakat-result');
    if (!result) return;
    if (harta <= 0) { showToast('Masukkan jumlah harta'); return; }
    result.classList.remove('hidden');
    if (bersih < NISAB) {
        result.innerHTML = `<div class="zr-label">Status Zakat</div><div class="zr-value" style="-webkit-text-fill-color:var(--t2);font-size:1.2rem;">Belum Wajib Zakat</div><div class="zr-note">Harta bersih Anda (Rp ${fmt(bersih)}) belum mencapai nisab (Rp ${fmt(NISAB)}).</div>`;
    } else {
        const zakatAmt = Math.ceil(bersih * ZAKAT_RATE);
        result.innerHTML = `<div class="zr-label">Zakat yang Harus Dibayar</div><div class="zr-value">Rp ${fmt(zakatAmt)}</div><div class="zr-note">2,5% x Rp ${fmt(bersih)} (harta bersih)</div><button class="btn btn-mayar" id="btn-pay-zakat" onclick="payZakatMayar(${zakatAmt},'Zakat Mal')">Bayar Zakat Rp ${fmt(zakatAmt)}</button>`;
    }
};

// Zakat Fitrah
window.calculateZakatFitrah = function() {
    const jiwa = parseInt(document.getElementById('zakat-jiwa')?.value) || 1;
    const hb = document.getElementById('zakat-beras')?.value.replace(/\./g, '');
    const hargaBeras = parseFloat(hb) || 15000;
    const beratPerJiwa = 2.5; // kg
    const total = Math.ceil(jiwa * beratPerJiwa * hargaBeras);
    const result = document.getElementById('zakat-fitrah-result');
    if (!result) return;
    if (jiwa <= 0) { showToast('Masukkan jumlah jiwa'); return; }
    result.classList.remove('hidden');
    result.innerHTML = `<div class="zr-label">Zakat Fitrah yang Harus Dibayar</div><div class="zr-value">Rp ${fmt(total)}</div><div class="zr-note">${jiwa} jiwa x ${beratPerJiwa} kg x Rp ${fmt(hargaBeras)}/kg</div><button class="btn btn-mayar" id="btn-pay-zakat-fitrah" onclick="payZakatMayar(${total},'Zakat Fitrah')">Bayar Zakat Fitrah Rp ${fmt(total)}</button>`;
};

window.payZakatMayar = async function(amount, zakatType) {
    const btnId = zakatType === 'Zakat Fitrah' ? 'btn-pay-zakat-fitrah' : 'btn-pay-zakat';
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.textContent = 'Memproses...'; btn.disabled = true; btn.style.opacity = '.7';
    try {
        const res = await fetch('/api/pay', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ payerName: 'Pembayar ' + zakatType, amount, description: 'Pembayaran ' + zakatType }) });
        const r = await res.json();
        if (r.success && r.link) {
            localStorage.setItem('splitbill_pending_pay', JSON.stringify({ name: zakatType, amount, time: Date.now() }));
            btn.textContent = 'Link Siap'; btn.style.opacity = '1';
            btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
            window.open(r.link, '_blank');
            const onReturn = () => {
                if (document.visibilityState === 'visible') {
                    document.removeEventListener('visibilitychange', onReturn);
                    setTimeout(() => { showPaymentSuccessModal(zakatType, amount); btn.textContent = 'Sudah Dibayar'; btn.disabled = true; localStorage.removeItem('splitbill_pending_pay'); }, 800);
                }
            };
            document.addEventListener('visibilitychange', onReturn);
            showToast('Halaman pembayaran dibuka di tab baru');
        } else throw new Error();
    } catch (e) {
        btn.textContent = 'Gagal - Coba Lagi'; btn.style.opacity = '1'; btn.disabled = false;
        btn.onclick = () => payZakatMayar(amount, zakatType);
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

// ===== ARAH KIBLAT =====
let kiblatInitialized = false;
function initKiblat() {
    if (kiblatInitialized) return;
    kiblatInitialized = true;
    const degreesEl = document.getElementById('kiblat-degrees');
    
    if (!navigator.geolocation) {
        degreesEl.textContent = 'Perangkat tidak mendukung geolokasi';
        return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude * Math.PI / 180;
        const lon = pos.coords.longitude * Math.PI / 180;
        const kaabaLat = 21.4225 * Math.PI / 180;
        const kaabaLon = 39.8262 * Math.PI / 180;
        const dLon = kaabaLon - lon;
        const y = Math.sin(dLon) * Math.cos(kaabaLat);
        const x = Math.cos(lat) * Math.sin(kaabaLat) - Math.sin(lat) * Math.cos(kaabaLat) * Math.cos(dLon);
        let qiblaDeg = Math.atan2(y, x) * 180 / Math.PI;
        qiblaDeg = (qiblaDeg + 360) % 360;
        
        degreesEl.textContent = `Arah Kiblat: ${qiblaDeg.toFixed(1)}° dari Utara`;

        const arrow = document.getElementById('compass-arrow');
        const compass = document.getElementById('compass');

        function handleOrientation(e) {
            let heading = e.alpha;
            if (typeof e.webkitCompassHeading !== 'undefined') heading = e.webkitCompassHeading;
            else heading = 360 - heading;
            
            if (compass) compass.style.transform = `rotate(${-heading}deg)`;
            if (arrow) arrow.style.transform = `rotate(${qiblaDeg - heading}deg)`;
        }

        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            const infoBox = document.querySelector('.kiblat-info-box');
            const permBtn = document.createElement('button');
            permBtn.className = 'btn btn-primary btn-block';
            permBtn.textContent = 'Aktifkan Kompas';
            permBtn.style.marginTop = '12px';
            permBtn.onclick = () => {
                DeviceOrientationEvent.requestPermission().then(r => {
                    if (r === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        permBtn.remove();
                    }
                });
            };
            if (infoBox) infoBox.appendChild(permBtn);
        } else if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
            degreesEl.textContent += ' (kompas tidak tersedia di perangkat ini)';
        }
    }, () => {
        degreesEl.textContent = 'Izinkan akses lokasi untuk menentukan arah kiblat';
    });
}

// ===== AL-QURAN & HADITS =====
let surahListLoaded = false;
let haditsBookListLoaded = false;
let currentHaditsPage = 1;
let currentHaditsBook = '';

function initQuranPage() {
    if (!surahListLoaded) loadSurahList();
    if (!haditsBookListLoaded) loadHaditsBookList();
}

// ----- QURAN: Load surah list -----
async function loadSurahList() {
    const select = document.getElementById('surah-select');
    if (!select) return;
    try {
        const res = await fetch('/api/quran/surat');
        const data = await res.json();
        if (data.code === 200 && data.data) {
            data.data.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.nomor;
                opt.textContent = `${s.nomor}. ${s.namaLatin} (${s.nama}) — ${s.jumlahAyat} ayat`;
                select.appendChild(opt);
            });
            surahListLoaded = true;
        }
    } catch {
        select.innerHTML = '<option value="">Gagal memuat daftar surah</option>';
    }
}

// ----- QURAN: Load surah detail -----
let currentSurahData = null;
let currentAyatPage = 1;
const AYAT_PER_PAGE = 10;

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
}

window.loadSurahDetail = async function(nomor) {
    const el = document.getElementById('surah-content');
    if (!nomor || !el) return;
    el.innerHTML = '<div class="quran-loading">Memuat surah...</div>';
    try {
        const res = await fetch(`/api/quran/surat/${nomor}`);
        const data = await res.json();
        if (data.code === 200 && data.data) {
            currentSurahData = data.data;
            currentAyatPage = 1;
            renderSurahPage();
        } else throw new Error();
    } catch {
        el.innerHTML = '<p style="text-align:center;color:var(--t3);padding:32px 0">Gagal memuat surah. Periksa koneksi internet.</p>';
    }
};

function renderSurahPage() {
    const el = document.getElementById('surah-content');
    const s = currentSurahData;
    if (!el || !s) return;
    
    const totalAyat = s.ayat.length;
    const totalPages = Math.ceil(totalAyat / AYAT_PER_PAGE);
    const start = (currentAyatPage - 1) * AYAT_PER_PAGE;
    const end = Math.min(start + AYAT_PER_PAGE, totalAyat);
    const pageAyats = s.ayat.slice(start, end);
    
    let html = '';
    
    // Show header on first page only
    if (currentAyatPage === 1) {
        const cleanDesc = stripHtml(s.deskripsi);
        html += `
            <div class="surah-header">
                <div class="surah-title">${esc(s.namaLatin)}</div>
                <div class="surah-nama-arab">${s.nama}</div>
                <div class="surah-info">${esc(s.arti)} · ${esc(s.tempatTurun)} · ${s.jumlahAyat} Ayat</div>
                <p class="surah-desc">${cleanDesc.substring(0, 300)}${cleanDesc.length > 300 ? '...' : ''}</p>
            </div>
        `;
    }
    
    // Ayat navigation header
    if (totalPages > 1) {
        html += `<div class="ayat-page-header">Ayat ${start + 1}–${end} dari ${totalAyat}</div>`;
    }
    
    // Render ayats
    pageAyats.forEach(a => {
        html += `
            <div class="ayat-card">
                <div class="ayat-number">${a.nomorAyat}</div>
                <div class="ayat-body">
                    <div class="ayat-arab">${a.teksArab}</div>
                    <div class="ayat-latin">${esc(a.teksLatin)}</div>
                    <div class="ayat-indo">${esc(a.teksIndonesia)}</div>
                </div>
            </div>
        `;
    });
    
    // Pagination
    if (totalPages > 1) {
        html += '<div class="ayat-pagination">';
        if (currentAyatPage > 1) {
            html += `<button class="btn btn-outline btn-sm" onclick="goAyatPage(${currentAyatPage - 1})">← Sebelumnya</button>`;
        }
        html += `<span class="ayat-page-info">Halaman ${currentAyatPage} / ${totalPages}</span>`;
        if (currentAyatPage < totalPages) {
            html += `<button class="btn btn-outline btn-sm" onclick="goAyatPage(${currentAyatPage + 1})">Selanjutnya →</button>`;
        }
        html += '</div>';
    }
    
    el.innerHTML = html;
}

window.goAyatPage = function(page) {
    currentAyatPage = page;
    renderSurahPage();
    const el = document.getElementById('surah-content');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ----- HADITS: Load book list -----
async function loadHaditsBookList() {
    const select = document.getElementById('hadits-book-select');
    if (!select) return;
    try {
        const res = await fetch('/api/hadith/books');
        const data = await res.json();
        if (data.success && data.data) {
            data.data.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.dataset.total = b.total;
                opt.textContent = `${b.name} (${b.total.toLocaleString('id-ID')} hadits)`;
                select.appendChild(opt);
            });
            haditsBookListLoaded = true;
        }
    } catch {
        select.innerHTML = '<option value="">Gagal memuat daftar kitab</option>';
    }
}

// ----- HADITS: Load page of hadiths -----
window.loadHaditsPage = async function(page) {
    const select = document.getElementById('hadits-book-select');
    const content = document.getElementById('hadits-content');
    const nav = document.getElementById('hadits-nav');
    if (!select || !content) return;
    
    const bookId = select.value;
    if (!bookId) return;
    
    const selectedOpt = select.options[select.selectedIndex];
    const totalHadits = parseInt(selectedOpt.dataset.total) || 100;
    const perPage = 10;
    currentHaditsPage = page;
    currentHaditsBook = bookId;
    
    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, totalHadits);
    const totalPages = Math.ceil(totalHadits / perPage);
    
    content.innerHTML = '<div class="quran-loading">Memuat hadits...</div>';
    
    try {
        const res = await fetch(`/api/hadith/${bookId}?range=${start}-${end}`);
        const data = await res.json();
        if (data.code === 200 && data.data) {
            const hadiths = data.data.hadiths;
            let html = `<div class="hadits-book-header">${esc(data.data.name)} — Halaman ${page} dari ${totalPages}</div>`;
            
            hadiths.forEach(h => {
                html += `
                    <div class="hadits-item">
                        <div class="hadits-num">Hadits No. ${h.number}</div>
                        <div class="hadits-arab-text">${h.arab}</div>
                        <div class="hadits-indo-text">${esc(h.id)}</div>
                    </div>
                `;
            });
            
            content.innerHTML = html;
            
            // Pagination nav
            let navHtml = '';
            if (page > 1) {
                navHtml += `<button class="btn btn-outline btn-sm" onclick="loadHaditsPage(${page - 1})">← Sebelumnya</button>`;
            }
            navHtml += `<span class="hadits-page-info">${start}–${end} dari ${totalHadits.toLocaleString('id-ID')}</span>`;
            if (page < totalPages) {
                navHtml += `<button class="btn btn-outline btn-sm" onclick="loadHaditsPage(${page + 1})">Selanjutnya →</button>`;
            }
            if (nav) nav.innerHTML = navHtml;
            
            window.scrollTo({ top: content.offsetTop - 80, behavior: 'smooth' });
        } else throw new Error();
    } catch {
        content.innerHTML = '<p style="text-align:center;color:var(--t3);padding:32px 0">Gagal memuat hadits. Periksa koneksi internet.</p>';
    }
};

window.switchQuranTab = function(tab) {
    document.querySelectorAll('#page-quran .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#page-quran .tab-c').forEach(c => c.classList.remove('active'));
    
    if (tab === 'quran') {
        document.querySelector('#page-quran .tab-btn:first-child').classList.add('active');
        document.getElementById('tab-quran').classList.add('active');
    } else {
        document.querySelector('#page-quran .tab-btn:last-child').classList.add('active');
        document.getElementById('tab-hadits').classList.add('active');
    }
};

// ============================================================
// TASBIH DIGITAL
// ============================================================
let tasbihData = { count: 0, target: 33, type: 'subhanallah' };
const dzikirList = {
    'subhanallah': { arab: 'سُبْحَانَ ٱللَّٰهِ', latin: 'Subhanallah' },
    'alhamdulillah': { arab: 'ٱلْحَمْدُ لِلَّٰهِ', latin: 'Alhamdulillah' },
    'allahuakbar': { arab: 'ٱللَّٰهُ أَكْبَرُ', latin: 'Allahu Akbar' },
    'lailahaillallah': { arab: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', latin: 'Laa Ilaaha Illallah' },
    'astagfirullah': { arab: 'أَسْتَغْفِرُ ٱللَّٰهَ', latin: 'Astagfirullah' }
};

function initTasbih() {
    try { 
        const saved = localStorage.getItem('srm_tasbih');
        if (saved) tasbihData = JSON.parse(saved);
    } catch(e) {}
    
    document.getElementById('tasbih-dzikir-select').value = tasbihData.type || 'subhanallah';
    updateTasbihUI();
}

window.changeDzikir = function() {
    const v = document.getElementById('tasbih-dzikir-select').value;
    tasbihData.type = v;
    tasbihData.count = 0;
    saveTasbih();
    updateTasbihUI();
};

window.setTasbihTarget = function(t, btn) {
    tasbihData.target = t;
    document.querySelectorAll('.tasbih-target-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    saveTasbih();
    updateTasbihUI();
}

window.incrementTasbih = function() {
    tasbihData.count++;
    if (tasbihData.target > 0 && tasbihData.count === tasbihData.target) {
        if('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
        showToast(`Alhamdulillah, target ${tasbihData.target} tercapai`);
    } else {
        if('vibrate' in navigator) navigator.vibrate(20);
    }
    saveTasbih();
    updateTasbihUI();
}

window.resetTasbih = function() {
    tasbihData.count = 0;
    saveTasbih();
    updateTasbihUI();
}

function saveTasbih() {
    localStorage.setItem('srm_tasbih', JSON.stringify(tasbihData));
}

function updateTasbihUI() {
    const d = dzikirList[tasbihData.type];
    if (d) {
        document.getElementById('tasbih-arab').textContent = d.arab;
        document.getElementById('tasbih-latin').textContent = d.latin;
    }
    document.getElementById('tasbih-count').textContent = tasbihData.count;
    document.getElementById('tasbih-target-text').textContent = tasbihData.target === 0 ? 'Tak Terbatas' : tasbihData.target;
    
    let pct = 0;
    if (tasbihData.target > 0) {
        pct = (tasbihData.count / tasbihData.target) * 100;
        if (pct > 100) pct = 100;
    }
    document.getElementById('tasbih-progress-bar').style.width = pct + '%';
    
    // update target buttons
    document.querySelectorAll('.tasbih-target-btn').forEach(b => {
        b.classList.remove('active');
        if (parseInt(b.textContent) === tasbihData.target || (b.textContent === 'Tak Terbatas' && tasbihData.target === 0)) {
            b.classList.add('active');
        }
    });
}

// ============================================================
// KALENDER HIJRIYAH (Local Computation — no API needed)
// ============================================================
let calCurrentYear = new Date().getFullYear();
let calCurrentMonth = new Date().getMonth() + 1;

// Hijri date converter (Kuwaiti algorithm)
function gregorianToHijri(gYear, gMonth, gDay) {
    let d = new Date(gYear, gMonth - 1, gDay);
    let jd = Math.floor((d.getTime() / 86400000) + 2440587.5);
    let l = jd - 1948440 + 10632;
    let n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    let hMonth = Math.floor((24 * l) / 709);
    let hDay = l - Math.floor((709 * hMonth) / 24);
    let hYear = 30 * n + j - 30;
    return { year: hYear, month: hMonth, day: hDay };
}

const hijriMonthNames = [
    'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir',
    'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Syaban',
    'Ramadan', 'Syawal', 'Dzulqaidah', 'Dzulhijjah'
];

// Important Islamic dates (Hijri month, day, name)
const islamicEvents = [
    [1, 1, 'Tahun Baru Islam'], [1, 10, 'Hari Asyura'],
    [3, 12, 'Maulid Nabi Muhammad SAW'], [7, 27, 'Isra Mi\'raj'],
    [8, 15, 'Nisfu Sya\'ban'], [9, 1, 'Awal Ramadan'],
    [9, 17, 'Nuzulul Quran'], [10, 1, 'Idul Fitri'],
    [10, 2, 'Idul Fitri (Hari ke-2)'], [12, 10, 'Idul Adha'],
    [12, 8, 'Hari Tarwiyah'], [12, 9, 'Wukuf di Arafah']
];

function initKalender() {
    renderKalenderContainer();
}

window.prevMonth = function() {
    calCurrentMonth--;
    if (calCurrentMonth < 1) { calCurrentMonth = 12; calCurrentYear--; }
    renderKalenderContainer();
}

window.nextMonth = function() {
    calCurrentMonth++;
    if (calCurrentMonth > 12) { calCurrentMonth = 1; calCurrentYear++; }
    renderKalenderContainer();
}

function renderKalenderContainer() {
    const grid = document.getElementById('cal-days-grid');
    const monthName = document.getElementById('cal-month');
    const yearText = document.getElementById('cal-year');
    if (!grid) return;

    const d = new Date(calCurrentYear, calCurrentMonth - 1, 1);
    monthName.textContent = d.toLocaleString('id-ID', { month: 'long' });
    yearText.textContent = calCurrentYear;

    const daysInMonth = new Date(calCurrentYear, calCurrentMonth, 0).getDate();
    const firstDayIndex = d.getDay(); // 0=Sunday
    const today = new Date();

    let html = '';
    for (let i = 0; i < firstDayIndex; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    let todayHijri = null;
    let monthEvents = [];

    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = (i === today.getDate() && calCurrentMonth === (today.getMonth() + 1) && calCurrentYear === today.getFullYear());
        const h = gregorianToHijri(calCurrentYear, calCurrentMonth, i);
        const hijriStr = `${h.day} ${hijriMonthNames[h.month - 1]} ${h.year} H`;

        // Check for Islamic events
        const evt = islamicEvents.find(e => e[0] === h.month && e[1] === h.day);
        let evtClass = evt ? ' event-day' : '';
        let evtDot = evt ? '<span class="event-dot"></span>' : '';

        if (evt) monthEvents.push({ day: i, hijriDay: h.day, hijriMonth: hijriMonthNames[h.month - 1], name: evt[2] });
        if (isToday) todayHijri = h;

        html += `<div class="calendar-day${isToday ? ' today' : ''}${evtClass}" title="${hijriStr}">
            <span class="cal-masehi">${i}</span>
            <span class="cal-hijri">${h.day}</span>
            ${evtDot}
        </div>`;
    }
    grid.innerHTML = html;

    // Hijri info for today
    const hijriSection = document.getElementById('cal-today-hijri');
    if (todayHijri) {
        hijriSection.innerHTML = `
            <div class="calendar-hijri-date">${todayHijri.day} ${hijriMonthNames[todayHijri.month - 1]} ${todayHijri.year} Hijriyah</div>
            <div class="calendar-masehi-date">${today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        `;
    } else {
        const h = gregorianToHijri(calCurrentYear, calCurrentMonth, 1);
        hijriSection.innerHTML = `
            <div class="calendar-hijri-date">${h.day} ${hijriMonthNames[h.month - 1]} ${h.year} Hijriyah</div>
            <div class="calendar-masehi-date">${new Date(calCurrentYear, calCurrentMonth - 1, 1).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        `;
    }

    // Render events
    const eventsContainer = document.getElementById('cal-events');
    if (eventsContainer) {
        if (monthEvents.length > 0) {
            eventsContainer.innerHTML = '<h4 style="margin:0 0 10px;font-size:.85rem;color:var(--t2);">📅 Hari Besar Islam bulan ini:</h4>' +
                monthEvents.map(e => `
                    <div class="calendar-event-item">
                        <span class="event-day-badge">${e.day}</span>
                        <div>
                            <div class="event-name">${e.name}</div>
                            <div class="event-hijri">${e.hijriDay} ${e.hijriMonth}</div>
                        </div>
                    </div>
                `).join('');
        } else {
            eventsContainer.innerHTML = '<p style="text-align:center;color:var(--t3);font-size:.82rem;">Tidak ada hari besar Islam di bulan ini.</p>';
        }
    }
}

// ============================================================
// REALTIME CURRENCY FORMATTER
// ============================================================
function formatCurrencyInput(val) {
    if (!val) return "";
    let numberString = val.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    let sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    let ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    
    if (ribuan) {
        let separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }
    rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
    return rupiah;
}

// Make real-time format for anything with class `currency-input`
document.addEventListener('input', function(e) {
    if(e.target && e.target.classList.contains('c-input')) {
        const rawString = e.target.value.replace(/\./g, '');
        e.target.dataset.val = rawString;
        e.target.value = formatCurrencyInput(rawString);
    }
});


// ===== ENHANCED SWITCH PAGE (robust handling) =====
const _origSwitchPage = window.switchPage;
window.switchPage = function(page) {
    console.log('[App] Switching to:', page);
    try {
        _origSwitchPage(page);
        
        // Dynamic initialization with error safety
        if (page === 'kiblat' && typeof initKiblat === 'function') initKiblat();
        if (page === 'quran' && typeof initQuranPage === 'function') initQuranPage();
        if (page === 'tasbih' && typeof initTasbih === 'function') initTasbih();
        if (page === 'kalender' && typeof initKalender === 'function') initKalender();
        
    } catch (err) {
        console.error('[App] SwitchPage Error:', err);
    }
};

