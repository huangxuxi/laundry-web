// script.js
// ===== DATA MASTER ITEM =====
const ITEM_CATALOG = [
  { nama: 'Atasan Batik',    hargaDefault: 35000, satuan: 'pcs', layananKhusus: [] },
  { nama: 'Atasan Brukat',   hargaDefault: 35000, satuan: 'pcs', layananKhusus: [] },
  { nama: 'Atasan Jas',      hargaDefault: 35000, satuan: 'pcs', layananKhusus: [] },
  { nama: 'Atasan Kemeja',   hargaDefault: 35000, satuan: 'pcs', layananKhusus: [] },
  { nama: 'Bed Cover', satuan: 'pcs', hargaDefault: 0, layananKhusus: [
    { nama: 'Bed Cover Kecil',           harga: 25000, satuan: 'pcs' },
    { nama: 'Bed Cover Sedang',          harga: 35000, satuan: 'pcs' },
    { nama: 'Bed Cover Besar',           harga: 45000, satuan: 'pcs' },
    { nama: 'Bed Cover Jumbo',           harga: 55000, satuan: 'pcs' },
    { nama: 'Bed Cover Express',         harga: 70000, satuan: 'pcs' },
    { nama: 'Bed Cover Kecil Express',   harga: 50000, satuan: 'pcs' },
    { nama: 'Bed Cover Jumbo Express',   harga: 90000, satuan: 'pcs' },
  ]},
  { nama: 'Blouse', satuan: 'pcs', hargaDefault: 0, layananKhusus: [
    { nama: 'Blouse',         harga: 25000, satuan: 'pcs' },
    { nama: 'Blouse Setelan', harga: 40000, satuan: 'pcs' },
  ]},
  { nama: 'Boneka', satuan: 'pcs', hargaDefault: 0, layananKhusus: [
    { nama: 'Boneka A', harga: 10000, satuan: 'pcs' },
    { nama: 'Boneka B', harga: 15000, satuan: 'pcs' },
    { nama: 'Boneka C', harga: 20000, satuan: 'pcs' },
    { nama: 'Boneka D', harga: 35000, satuan: 'pcs' },
    { nama: 'Boneka E', harga: 45000, satuan: 'pcs' },
    { nama: 'Boneka F', harga: 50000, satuan: 'pcs' },
  ]},
  { nama: 'Bantal',  hargaDefault: 35000, satuan: 'pcs', layananKhusus: [] },
  { nama: 'Jaket dan Jubah', satuan: 'pcs', hargaDefault: 0, layananKhusus: [
    { nama: 'Jaket Treatment', harga: 35000, satuan: 'pcs' },
    { nama: 'Jubah',           harga: 35000, satuan: 'pcs' },
    { nama: 'Jubah Brukat',    harga: 45000, satuan: 'pcs' },
  ]},
  { nama: 'Karpet', hargaDefault: 15000, satuan: 'kg', layananKhusus: [] },
];

// ===== LAYANAN UMUM (kg-based) =====
const LAYANAN_UMUM_DEFAULT = [
  { id: 101, nama: 'Cuci Basah',                    satuan: 'kg',  harga:  4000, itemFilter: '', deskripsi: 'Cuci basah standar' },
  { id: 102, nama: 'Cuci Kering',                   satuan: 'kg',  harga:  5000, itemFilter: '', deskripsi: 'Cuci tanpa setrika' },
  { id: 103, nama: 'Cuci Setrika',                  satuan: 'kg',  harga:  8000, itemFilter: '', deskripsi: 'Cuci dan disetrika rapi' },
  { id: 104, nama: 'Cuci Kering Express 24 Jam',    satuan: 'kg',  harga: 10000, itemFilter: '', deskripsi: 'Selesai dalam 24 jam' },
  { id: 105, nama: 'Cuci Kering Express 5 Jam',     satuan: 'kg',  harga: 15000, itemFilter: '', deskripsi: 'Selesai dalam 5 jam' },
  { id: 106, nama: 'Cuci Setrika Express Exclusive',satuan: 'kg',  harga: 20000, itemFilter: '', deskripsi: 'Express cuci + setrika eksklusif' },
];

// ===== STATE =====
let orders = JSON.parse(localStorage.getItem('km_orders') || '[]');
let layananList = JSON.parse(localStorage.getItem('km_layanan') || 'null') || JSON.parse(JSON.stringify(LAYANAN_UMUM_DEFAULT));
let editLayananId = null;
let currentStatusId = null;
let currentAntarId = null;
let chartDash = null, chartRekap = null, chartPie = null;
let metodeBayar = '';
let waktuBayar = '';

// Helper functions
function saveData() {
  localStorage.setItem('km_orders', JSON.stringify(orders));
  localStorage.setItem('km_layanan', JSON.stringify(layananList));
}

function rupiah(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID');
}

function tglFormat(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function genId() {
  return 'INV-' + Date.now().toString(36).toUpperCase();
}

function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.innerHTML = (type === 'success' ? '✓ ' : '✕ ') + msg;
  t.className = 'show ' + type;
  setTimeout(() => t.className = '', 3000);
}

function statusLabel(s) {
  const statusMap = { diproses: 'Diproses', selesai: 'Siap Antar', terkirim: 'Selesai' };
  return statusMap[s] || s;
}

function statusBadge(s) {
  const badgeMap = { diproses: 'badge-c3', selesai: 'badge-c4', terkirim: 'badge-gray' };
  return badgeMap[s] || 'badge-gray';
}

// ===== NAVIGATION =====
function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (el) el.classList.add('active');
  const titles = {
    dashboard: 'Dashboard',
    'input-pesanan': 'Input Pesanan Baru',
    'pesanan-aktif': 'Daftar Pesanan Aktif',
    'siap-antar': 'Daftar Siap Antar',
    rekap: 'Rekapitulasi Pendapatan',
    layanan: 'Layanan & Harga',
    pelanggan: 'Data Pelanggan'
  };
  document.getElementById('page-title').textContent = titles[id] || id;
  if (id === 'dashboard') renderDashboard();
  if (id === 'pesanan-aktif') renderPesananAktif();
  if (id === 'siap-antar') renderSiapAntar();
  if (id === 'rekap') renderRekap();
  if (id === 'layanan') renderLayanan();
  if (id === 'pelanggan') renderPelanggan();
  if (id === 'input-pesanan') initInputForm();
}

function goInputPesanan() {
  const navItems = document.querySelectorAll('.nav-item');
  showPage('input-pesanan', navItems[1]);
}

function updateDate() {
  const now = new Date();
  const formatted = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('topbar-date').textContent = formatted;
}

function updateBadges() {
  document.getElementById('badge-aktif').textContent = orders.filter(o => o.status === 'diproses').length;
  document.getElementById('badge-antar').textContent = orders.filter(o => o.status === 'selesai').length;
}

// ===== DASHBOARD =====
function renderDashboard() {
  const today = todayStr();
  const todayOrders = orders.filter(o => o.tglMasuk === today);
  const aktifHariIni = todayOrders.filter(o => ['diproses', 'selesai'].includes(o.status));
  const antarSemua = orders.filter(o => o.status === 'selesai');
  const pendapatanHariIni = todayOrders.filter(o => o.statusBayar === 'lunas').reduce((s, o) => s + (o.total || 0), 0);
  const pelangganHariIni = new Set(todayOrders.map(o => o.hp)).size;

  document.getElementById('stat-aktif').textContent = aktifHariIni.length;
  document.getElementById('stat-antar').textContent = antarSemua.length;
  document.getElementById('stat-hari-ini').textContent = rupiah(pendapatanHariIni);
  document.getElementById('stat-pelanggan').textContent = pelangganHariIni;

  const tl = document.getElementById('dash-timeline');
  const todaySorted = [...todayOrders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  if (todaySorted.length === 0) {
    tl.innerHTML = '<li><div class="empty-state"><p>Belum ada pesanan hari ini</p></div></li>';
  } else {
    tl.innerHTML = todaySorted.map(o => `
      <li>
        <div class="tl-dot" style="background:${o.status === 'selesai' ? 'var(--c4)' : o.status === 'terkirim' ? 'var(--text3)' : 'var(--c3)'}"></div>
        <div class="tl-content">
          <div class="tl-title">${o.nama} — ${o.layanan}</div>
          <div class="tl-time">${o.id} · ${o.item || 'Umum'}</div>
        </div>
        <span class="badge ${statusBadge(o.status)}">${statusLabel(o.status)}</span>
      </li>
    `).join('');
  }

  const tbody = document.getElementById('dash-tbody');
  if (aktifHariIni.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Tidak ada pesanan aktif hari ini</p></div></td></tr>';
  } else {
    tbody.innerHTML = aktifHariIni.map(o => `
      <tr>
        <td style="font-family:var(--mono);font-size:11px;color:var(--c3)">${o.id}</td>
        <td>${o.nama}</td>
        <td style="color:var(--text2)">${o.item || '—'}</td>
        <td>${o.layanan}</td>
        <td style="font-family:var(--mono);color:var(--c4)">${rupiah(o.total)}</td>
        <td><span class="badge ${statusBadge(o.status)}">${statusLabel(o.status)}</span></td>
      </tr>
    `).join('');
  }

  // Chart 7 hari
  const last7 = [];
  const labels7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    labels7.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
    last7.push(orders.filter(o => o.tglMasuk === ds && o.statusBayar === 'lunas').reduce((s, o) => s + (o.total || 0), 0));
  }
  const ctx = document.getElementById('chartDashboard').getContext('2d');
  if (chartDash) chartDash.destroy();
  chartDash = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels7, datasets: [{ data: last7, backgroundColor: 'rgba(134,216,248,0.5)', borderColor: '#86D8F8', borderWidth: 1, borderRadius: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8899bb', font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: '#8899bb', font: { size: 10 }, callback: v => 'Rp' + (v / 1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
  updateBadges();
}

// ===== MULTI-SERVICE ROW SYSTEM =====
let serviceRowCounter = 0;

function buildLayananOptions(itemNama) {
  const itemData = ITEM_CATALOG.find(it => it.nama === itemNama);
  let opts = '<option value="">-- Pilih Layanan --</option>';
  if (itemData && itemData.layananKhusus && itemData.layananKhusus.length > 0) {
    opts += `<optgroup label="Layanan ${itemNama}">`;
    itemData.layananKhusus.forEach((l, i) => {
      opts += `<option value="k_${i}_${itemNama}">${l.nama} — ${rupiah(l.harga)}</option>`;
    });
    opts += '</optgroup>';
    const layananUmum = layananList.filter(l => !l.itemFilter);
    if (layananUmum.length) {
      opts += `<optgroup label="Layanan Umum (kg)">`;
      layananUmum.forEach(l => { opts += `<option value="u_${l.id}">${l.nama} — ${rupiah(l.harga)}/${l.satuan}</option>`; });
      opts += '</optgroup>';
    }
  } else if (itemData && itemData.hargaDefault > 0) {
    opts += `<option value="flat_${itemNama}">${itemNama} — ${rupiah(itemData.hargaDefault)} per pcs</option>`;
    const layananUmum = layananList.filter(l => !l.itemFilter);
    if (layananUmum.length) {
      opts += `<optgroup label="Layanan Umum (kg)">`;
      layananUmum.forEach(l => { opts += `<option value="u_${l.id}">${l.nama} — ${rupiah(l.harga)}/${l.satuan}</option>`; });
      opts += '</optgroup>';
    }
  } else {
    layananList.forEach(l => { opts += `<option value="u_${l.id}">${l.nama} — ${rupiah(l.harga)}/${l.satuan}</option>`; });
  }
  return opts;
}

function tambahServiceRow(data) {
  const rid = ++serviceRowCounter;
  const container = document.getElementById('service-rows-container');
  const rowEl = document.createElement('div');
  rowEl.className = 'service-row';
  rowEl.id = 'srow-' + rid;
  rowEl.innerHTML = `
    <div class="service-row-header">
      <span class="service-row-num">Layanan #${rid}</span>
      <button class="btn btn-danger btn-sm" onclick="hapusServiceRow(${rid})" title="Hapus layanan ini" style="padding:4px 8px">✕</button>
    </div>
    <div class="form-grid form-grid-3">
      <div class="form-group">
        <label class="form-label">Jenis Item <span style="color:var(--text3);font-weight:400;text-transform:none">(opsional)</span></label>
        <select class="form-select" id="srow-item-${rid}" onchange="onRowItemChange(${rid})">
          <option value="">-- Pilih atau Kosongkan --</option>
          ${ITEM_CATALOG.map(it => `<option value="${it.nama}">${it.nama}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Jenis Layanan *</label>
        <select class="form-select" id="srow-layanan-${rid}" onchange="hitungRowHarga(${rid})">
          ${buildLayananOptions('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Berat (kg) / Qty *</label>
        <input class="form-input" id="srow-berat-${rid}" type="number" min="0.1" step="0.1" placeholder="0.0" oninput="hitungRowHarga(${rid})">
      </div>
      <div class="form-group">
        <label class="form-label">Harga Satuan</label>
        <input class="form-input" id="srow-hargasat-${rid}" type="text" readonly style="opacity:0.6;cursor:not-allowed">
      </div>
      <div class="form-group">
        <label class="form-label">Subtotal</label>
        <input class="form-input" id="srow-subtotal-${rid}" type="text" readonly style="font-weight:700;color:var(--c4)">
      </div>
    </div>
  `;
  container.appendChild(rowEl);

  // If pre-filling from data
  if (data) {
    if (data.item) document.getElementById(`srow-item-${rid}`).value = data.item;
    onRowItemChange(rid, data.layananVal);
    if (data.berat) document.getElementById(`srow-berat-${rid}`).value = data.berat;
    hitungRowHarga(rid);
  }
  updateGrandTotal();
}

function hapusServiceRow(rid) {
  const rows = document.querySelectorAll('.service-row');
  if (rows.length <= 1) { toast('Minimal harus ada 1 layanan!', 'error'); return; }
  document.getElementById('srow-' + rid).remove();
  renumberServiceRows();
  updateGrandTotal();
}

function renumberServiceRows() {
  document.querySelectorAll('.service-row').forEach((el, idx) => {
    const num = el.querySelector('.service-row-num');
    if (num) num.textContent = `Layanan #${idx + 1}`;
  });
}

function onRowItemChange(rid, preselectLayananVal) {
  const itemNama = document.getElementById(`srow-item-${rid}`).value;
  const selLay = document.getElementById(`srow-layanan-${rid}`);
  selLay.innerHTML = buildLayananOptions(itemNama);
  if (preselectLayananVal) selLay.value = preselectLayananVal;
  hitungRowHarga(rid);
}

function hitungRowHarga(rid) {
  const val = document.getElementById(`srow-layanan-${rid}`).value;
  const berat = parseFloat(document.getElementById(`srow-berat-${rid}`).value) || 0;
  const lay = getLayananData(val);
  if (lay) {
    document.getElementById(`srow-hargasat-${rid}`).value = rupiah(lay.harga) + '/' + lay.satuan;
    const sub = lay.harga * berat;
    document.getElementById(`srow-subtotal-${rid}`).value = rupiah(sub);
  } else {
    document.getElementById(`srow-hargasat-${rid}`).value = '';
    document.getElementById(`srow-subtotal-${rid}`).value = '';
  }
  updateGrandTotal();
}

function updateGrandTotal() {
  let grand = 0;
  document.querySelectorAll('.service-row').forEach(el => {
    const rid = el.id.replace('srow-', '');
    const val = document.getElementById(`srow-layanan-${rid}`).value;
    const berat = parseFloat(document.getElementById(`srow-berat-${rid}`).value) || 0;
    const lay = getLayananData(val);
    if (lay) grand += lay.harga * berat;
  });
  document.getElementById('inp-grand-total').textContent = rupiah(grand);
  // Update QRIS nominal
  const qEl = document.getElementById('qris-nominal');
  if (qEl) qEl.textContent = grand > 0 ? rupiah(grand) : '—';
}

function getServiceRows() {
  const rows = [];
  document.querySelectorAll('.service-row').forEach(el => {
    const rid = el.id.replace('srow-', '');
    const itemNama = document.getElementById(`srow-item-${rid}`).value;
    const layVal = document.getElementById(`srow-layanan-${rid}`).value;
    const berat = parseFloat(document.getElementById(`srow-berat-${rid}`).value) || 0;
    const lay = getLayananData(layVal);
    rows.push({ itemNama, layVal, berat, lay });
  });
  return rows;
}

// ===== FUNGSI FORM INPUT =====
function initInputForm() {
  metodeBayar = '';
  waktuBayar = '';
  document.querySelectorAll('.pay-option').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.pay-step').forEach(el => el.classList.remove('active'));

  const today = todayStr();
  const est = new Date();
  est.setDate(est.getDate() + 3);
  document.getElementById('inp-tgl-masuk').value = today;
  document.getElementById('inp-tgl-selesai').value = est.toISOString().split('T')[0];

  // Clear and init service rows
  serviceRowCounter = 0;
  document.getElementById('service-rows-container').innerHTML = '';
  tambahServiceRow();

  document.getElementById('inp-grand-total').textContent = 'Rp0';
  const qEl = document.getElementById('qris-nominal');
  if (qEl) qEl.textContent = '—';
}

function getLayananData(val) {
  if (!val) return null;
  if (val.startsWith('u_')) {
    const id = parseInt(val.replace('u_', ''));
    return layananList.find(l => l.id === id);
  }
  if (val.startsWith('k_')) {
    const parts = val.split('_');
    const idx = parseInt(parts[1]);
    const itemNama = parts.slice(2).join('_');
    const itemData = ITEM_CATALOG.find(it => it.nama === itemNama);
    if (itemData) return itemData.layananKhusus[idx] ? { ...itemData.layananKhusus[idx], id: val } : null;
  }
  if (val.startsWith('flat_')) {
    const itemNama = val.replace('flat_', '');
    const itemData = ITEM_CATALOG.find(it => it.nama === itemNama);
    if (itemData) return { nama: itemNama, harga: itemData.hargaDefault, satuan: itemData.satuan };
  }
  return null;
}

// Legacy stubs (kept for backward compat if called elsewhere)
function hitungHarga() { updateGrandTotal(); }
function onItemChange() {}

function pilihMetodeBayar(m) {
  metodeBayar = m;
  document.querySelectorAll('.pay-step').forEach(el => el.classList.remove('active'));
  document.getElementById('opt-tunai').classList.toggle('selected', m === 'tunai');
  document.getElementById('opt-nontunai').classList.toggle('selected', m === 'nontunai');
  if (m === 'tunai') {
    document.getElementById('step-tunai').classList.add('active');
    waktuBayar = '';
    document.getElementById('opt-lunas').classList.remove('selected');
    document.getElementById('opt-cod').classList.remove('selected');
  }
  if (m === 'nontunai') {
    document.getElementById('step-nontunai').classList.add('active');
    waktuBayar = 'lunas';
  }
}

function pilihWaktuBayar(w) {
  waktuBayar = w;
  document.getElementById('opt-lunas').classList.toggle('selected', w === 'lunas');
  document.getElementById('opt-cod').classList.toggle('selected', w === 'cod');
}

function simpanPesanan() {
  const nama = document.getElementById('inp-nama').value.trim();
  const hp = document.getElementById('inp-hp').value.trim();
  const alamat = document.getElementById('inp-alamat').value.trim();
  const tglMasuk = document.getElementById('inp-tgl-masuk').value;
  const tglSelesai = document.getElementById('inp-tgl-selesai').value;
  const catatan = document.getElementById('inp-catatan').value.trim();

  if (!nama || !hp || !alamat || !tglMasuk || !tglSelesai) {
    toast('Lengkapi semua field wajib (Pelanggan & Tanggal)!', 'error'); return;
  }
  if (!metodeBayar) { toast('Pilih metode pembayaran!', 'error'); return; }
  if (metodeBayar === 'tunai' && !waktuBayar) { toast('Pilih waktu pembayaran (Lunas/COD)!', 'error'); return; }

  const rows = getServiceRows();
  // Validate all rows
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.lay) { toast(`Layanan #${i+1}: Pilih jenis layanan!`, 'error'); return; }
    if (!r.berat || r.berat <= 0) { toast(`Layanan #${i+1}: Berat/Qty harus lebih dari 0!`, 'error'); return; }
  }

  const total = rows.reduce((s, r) => s + (r.lay.harga * r.berat), 0);
  const statusBayarFinal = (metodeBayar === 'nontunai' || waktuBayar === 'lunas') ? 'lunas' : 'cod';

  // Build layanan summary string
  const layananSummary = rows.length === 1
    ? rows[0].lay.nama
    : rows.map((r, i) => `${r.lay.nama}`).join(', ');

  const itemSummary = rows.length === 1
    ? (rows[0].itemNama || '—')
    : rows.map(r => r.itemNama || 'Umum').join(', ');

  const order = {
    id: genId(), nama, hp, alamat,
    item: itemSummary,
    layanan: layananSummary,
    // Keep first row's satuan/berat for legacy display compatibility
    satuan: rows[0].lay.satuan || 'kg',
    berat: rows[0].berat,
    tglMasuk, tglSelesai,
    metodeBayar, statusBayar: statusBayarFinal, waktuBayar,
    total, catatan,
    status: 'diproses',
    jumlahDiterima: statusBayarFinal === 'lunas' ? total : 0,
    createdAt: Date.now(),
    // Multi-service detail
    serviceItems: rows.map(r => ({
      item: r.itemNama || '—',
      layanan: r.lay.nama,
      berat: r.berat,
      satuan: r.lay.satuan || 'kg',
      harga: r.lay.harga,
      subtotal: r.lay.harga * r.berat
    }))
  };
  orders.push(order);
  saveData();
  toast('Pesanan berhasil disimpan!');
  showInvoice(order);
  resetForm();
  updateBadges();
}

function resetForm() {
  ['inp-nama', 'inp-hp', 'inp-alamat', 'inp-catatan'].forEach(id => document.getElementById(id).value = '');
  metodeBayar = '';
  waktuBayar = '';
  document.querySelectorAll('.pay-option').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.pay-step').forEach(el => el.classList.remove('active'));
  const today = todayStr();
  const est = new Date();
  est.setDate(est.getDate() + 3);
  document.getElementById('inp-tgl-masuk').value = today;
  document.getElementById('inp-tgl-selesai').value = est.toISOString().split('T')[0];
  // Re-init service rows
  serviceRowCounter = 0;
  document.getElementById('service-rows-container').innerHTML = '';
  tambahServiceRow();
  document.getElementById('inp-grand-total').textContent = 'Rp0';
  const qEl = document.getElementById('qris-nominal');
  if (qEl) qEl.textContent = '—';
}

// ===== INVOICE =====
function showInvoice(o) {
  document.getElementById('inv-nomor').textContent = 'No. Invoice: ' + o.id;
  document.getElementById('inv-tanggal').textContent = 'Tanggal: ' + tglFormat(o.tglMasuk) + '   Estimasi Selesai: ' + tglFormat(o.tglSelesai);
  document.getElementById('inv-nama').textContent = o.nama;
  document.getElementById('inv-hp').textContent = 'HP: ' + o.hp;
  document.getElementById('inv-alamat').textContent = 'Alamat: ' + o.alamat;

  // Render rows: use serviceItems if present, otherwise legacy single row
  if (o.serviceItems && o.serviceItems.length > 0) {
    document.getElementById('inv-items').innerHTML = o.serviceItems.map(s => `
      <tr>
        <td>${s.item || '—'}</td>
        <td>${s.layanan}</td>
        <td>${s.berat} ${s.satuan}</td>
        <td>${rupiah(s.harga)}</td>
        <td><strong>${rupiah(s.subtotal)}</strong></td>
      </tr>
    `).join('');
  } else {
    const hargaSatuan = o.total / (o.berat || 1);
    document.getElementById('inv-items').innerHTML = `
      <tr><td>${o.item || '—'}</td><td>${o.layanan}</td><td>${o.berat} ${o.satuan}</td>
      <td>${rupiah(Math.round(hargaSatuan))}</td><td><strong>${rupiah(o.total)}</strong></td></tr>
    `;
  }

  document.getElementById('inv-total-val').textContent = rupiah(o.total);

  let bayarInfo = '';
  if (o.metodeBayar === 'nontunai') bayarInfo = '📱 Pembayaran Non-Tunai (QRIS) — Lunas';
  else if (o.statusBayar === 'lunas') bayarInfo = '💵 Tunai — Sudah Lunas';
  else bayarInfo = '🚚 Tunai — COD (Bayar Saat Diantar)';
  document.getElementById('inv-bayar-info').textContent = bayarInfo;

  const sisa = (o.total || 0) - (o.jumlahDiterima || 0);
  document.getElementById('inv-sisa-info').textContent = sisa > 0 ? 'Sisa Tagihan: ' + rupiah(sisa) : '';
  document.getElementById('inv-catatan').textContent = o.catatan ? 'Catatan: ' + o.catatan : '';
  document.getElementById('invoice-preview').classList.add('show');
}

function closeInvoice() {
  document.getElementById('invoice-preview').classList.remove('show');
}

function downloadInvoicePDF() {
  window.print();
  toast('Gunakan opsi "Save as PDF" di dialog cetak browser');
}

// ===== PESANAN AKTIF =====
function renderPesananAktif() {
  const q = document.getElementById('search-aktif').value.toLowerCase();
  const fs = document.getElementById('filter-aktif-status').value;
  const fb = document.getElementById('filter-aktif-bayar').value;
  let list = orders.filter(o => o.status !== 'terkirim');
  if (q) list = list.filter(o => o.nama.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  if (fs) list = list.filter(o => o.status === fs);
  if (fb) list = list.filter(o => o.statusBayar === fb);
  list.sort((a, b) => b.createdAt - a.createdAt);
  const tbody = document.getElementById('tbody-aktif');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11"><div class="empty-state"><div class="empty-icon">📋</div><p>Tidak ada pesanan</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(o => {
    const sisa = (o.total || 0) - (o.jumlahDiterima || 0);
    return `
      <tr>
        <td style="font-family:var(--mono);font-size:11px;color:var(--c3)">${o.id}</td>
        <td><strong>${o.nama}</strong><br><span style="font-size:11px;color:var(--text2)">${o.hp}</span></td>
        <td style="color:var(--text2)">${o.item || '—'}</td>
        <td>${o.layanan}</td>
        <td style="font-family:var(--mono)">${o.berat} ${o.satuan}</td>
        <td style="font-family:var(--mono);color:var(--c4)">${rupiah(o.total)}</td>
        <td>
          <span class="badge ${o.statusBayar === 'lunas' ? 'badge-c4' : 'badge-c1'}">${o.statusBayar === 'lunas' ? 'Lunas' : 'COD'}</span>
          ${sisa > 0 ? `<br><span style="font-size:10px;color:var(--c5)">Sisa: ${rupiah(sisa)}</span>` : ''}
        </td>
        <td style="font-size:11px;color:var(--text2)">${tglFormat(o.tglMasuk)}</td>
        <td style="font-size:11px;color:var(--text2)">${tglFormat(o.tglSelesai)}</td>
        <td><span class="badge ${statusBadge(o.status)}">${statusLabel(o.status)}</span></td>
        <td><div style="display:flex;gap:5px">
          <button class="btn btn-ghost btn-sm" onclick="openModalStatus('${o.id}')">🔄</button>
          <button class="btn btn-ghost btn-sm" onclick="showInvoice(orders.find(x=>x.id==='${o.id}'))">🧾</button>
          <button class="btn btn-danger btn-sm" onclick="hapusOrder('${o.id}')">🗑</button>
        </div></td>
      </tr>
    `;
  }).join('');
}

function hapusOrder(id) {
  if (!confirm('Hapus pesanan ini?')) return;
  orders = orders.filter(o => o.id !== id);
  saveData();
  renderPesananAktif();
  updateBadges();
  toast('Pesanan dihapus');
}

function openModalStatus(id) {
  currentStatusId = id;
  const o = orders.find(x => x.id === id);
  document.getElementById('modal-status-info').innerHTML = `<strong>${o.nama}</strong> — ${o.layanan}<br><span style="color:var(--text2)">Invoice: ${o.id}</span>`;
  document.getElementById('ms-status').value = o.status;
  document.getElementById('modal-status').classList.add('show');
}

function updateStatus() {
  const o = orders.find(x => x.id === currentStatusId);
  if (!o) return;
  o.status = document.getElementById('ms-status').value;
  saveData();
  document.getElementById('modal-status').classList.remove('show');
  renderPesananAktif();
  updateBadges();
  toast('Status diperbarui');
}

// ===== SIAP ANTAR =====
function renderSiapAntar() {
  const q = document.getElementById('search-antar').value.toLowerCase();
  let list = orders.filter(o => o.status === 'selesai');
  if (q) list = list.filter(o => o.nama.toLowerCase().includes(q));
  const el = document.getElementById('antar-list');
  if (list.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🚚</div><p>Tidak ada pesanan siap antar</p></div>';
    return;
  }
  el.innerHTML = list.map(o => {
    const sisa = (o.total || 0) - (o.jumlahDiterima || 0);
    return `
      <div class="antar-card">
        <div style="width:40px;height:40px;border-radius:50%;background:rgba(149,193,31,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🧺</div>
        <div class="antar-info">
          <div class="antar-name">${o.nama}</div>
          <div class="antar-detail">${o.alamat} · ${o.hp}</div>
          <div class="antar-detail" style="margin-top:3px">${o.item || '—'} · ${o.layanan} · ${o.berat} ${o.satuan}</div>
          ${sisa > 0 ? `<div class="sisa-alert">⚠ Sisa tagihan COD: ${rupiah(sisa)}</div>` : ''}
        </div>
        <span class="badge ${o.statusBayar === 'cod' ? 'badge-c1' : 'badge-c4'}" style="margin-right:8px">${o.statusBayar === 'cod' ? 'COD' : 'Lunas'}</span>
        <span class="antar-total">${rupiah(o.total)}</span>
        <button class="btn btn-success btn-sm" onclick="openModalAntar('${o.id}')">✓ Antar</button>
      </div>
    `;
  }).join('');
}

function openModalAntar(id) {
  currentAntarId = id;
  const o = orders.find(x => x.id === id);
  const sisa = (o.total || 0) - (o.jumlahDiterima || 0);
  document.getElementById('modal-antar-info').innerHTML = `
    <strong>${o.nama}</strong><br>${o.alamat}<br>
    <span style="color:var(--text2)">Total Tagihan: ${rupiah(o.total)}</span>`;
  const codDiv = document.getElementById('modal-antar-cod');
  if (o.statusBayar === 'cod' || sisa > 0) {
    codDiv.style.display = 'block';
    document.getElementById('ma-jumlah').value = sisa > 0 ? sisa : o.total;
    document.getElementById('sisa-cod-info').innerHTML = `<div class="sisa-alert">Sisa yang harus ditagih: ${rupiah(sisa > 0 ? sisa : o.total)}</div>`;
  } else {
    codDiv.style.display = 'none';
  }
  document.getElementById('modal-antar').classList.add('show');
}

function hitungSisaCOD() {
  const o = orders.find(x => x.id === currentAntarId);
  if (!o) return;
  const jumlah = parseFloat(document.getElementById('ma-jumlah').value) || 0;
  const sisa = o.total - (o.jumlahDiterima || 0) - jumlah;
  const el = document.getElementById('sisa-cod-info');
  if (sisa > 0) {
    el.innerHTML = `<div class="sisa-alert">⚠ Masih ada sisa tagihan: ${rupiah(sisa)} (akan tetap tercatat sebagai COD belum lunas)</div>`;
  } else if (sisa < 0) {
    el.innerHTML = `<div style="background:rgba(149,193,31,0.1);border:1px solid rgba(149,193,31,0.2);border-radius:var(--radius-sm);padding:8px 12px;font-size:12px;color:var(--c4);margin-top:8px">Kembalian: ${rupiah(Math.abs(sisa))}</div>`;
  } else {
    el.innerHTML = `<div style="background:rgba(149,193,31,0.1);border:1px solid rgba(149,193,31,0.2);border-radius:var(--radius-sm);padding:8px 12px;font-size:12px;color:var(--c4);margin-top:8px">✓ Pas / Lunas</div>`;
  }
}

function konfirmasiAntar() {
  const o = orders.find(x => x.id === currentAntarId);
  if (!o) return;
  let jumlahInput = parseFloat(document.getElementById('ma-jumlah').value) || 0;
  if (o.statusBayar === 'cod') {
    const remaining = o.total - (o.jumlahDiterima || 0);
    if (jumlahInput > remaining) {
      jumlahInput = remaining;
    }
    o.jumlahDiterima = (o.jumlahDiterima || 0) + jumlahInput;
    const sisa = o.total - o.jumlahDiterima;
    if (sisa <= 0) {
      o.statusBayar = 'lunas';
      o.jumlahDiterima = o.total;
    }
  }
  o.status = 'terkirim';
  o.tglDikirim = todayStr();
  saveData();
  document.getElementById('modal-antar').classList.remove('show');
  renderSiapAntar();
  updateBadges();
  toast('Pesanan berhasil diantarkan!');
}

// ===== REKAP =====
function renderRekap() {
  let list = [...orders];
  const dari = document.getElementById('filter-tgl-dari').value;
  const sampai = document.getElementById('filter-tgl-sampai').value;
  let layFilter = document.getElementById('filter-rekap-layanan').value;

  const sel = document.getElementById('filter-rekap-layanan');
  const curVal = sel.value;
  sel.innerHTML = '<option value="">Semua Layanan</option>' + layananList.map(l => `<option value="${l.nama}">${l.nama}</option>`).join('');
  sel.value = curVal;
  layFilter = sel.value;

  if (dari) list = list.filter(o => o.tglMasuk >= dari);
  if (sampai) list = list.filter(o => o.tglMasuk <= sampai);
  if (layFilter) list = list.filter(o => o.layanan === layFilter);

  const totalAll = list.reduce((s, o) => s + (o.total || 0), 0);
  const lunasList = list.filter(o => o.statusBayar === 'lunas');
  const lunasTotal = lunasList.reduce((s, o) => s + (o.total || 0), 0);
  const codBelumLunas = list.filter(o => o.statusBayar === 'cod');
  const codTotal = codBelumLunas.reduce((s, o) => {
    const sisa = (o.total || 0) - (o.jumlahDiterima || 0);
    return s + (sisa > 0 ? sisa : 0);
  }, 0);

  document.getElementById('rekap-total').textContent = rupiah(totalAll);
  document.getElementById('rekap-jumlah').textContent = list.length + ' transaksi';
  document.getElementById('rekap-lunas').textContent = rupiah(lunasTotal);
  document.getElementById('rekap-cod').textContent = rupiah(codTotal);
  document.getElementById('rekap-cod-sub').textContent = codBelumLunas.length + ' order belum lunas';

  const tbody = document.getElementById('tbody-rekap');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11"><div class="empty-state"><p>Tidak ada data</p></div></td></tr>';
    return;
  }
  const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);
  tbody.innerHTML = sorted.map(o => {
    const sisa = (o.total || 0) - (o.jumlahDiterima || 0);
    return `
      <tr>
        <td style="font-family:var(--mono);font-size:11px;color:var(--c3)">${o.id}</td>
        <td style="font-size:11px">${tglFormat(o.tglMasuk)}</td>
        <td>${o.nama}</td>
        <td style="color:var(--text2)">${o.item || '—'}</td>
        <td>${o.layanan}</td>
        <td style="font-family:var(--mono)">${o.berat} ${o.satuan}</td>
        <td style="font-family:var(--mono);color:var(--c4);font-weight:600">${rupiah(o.total)}</td>
        <td style="font-family:var(--mono);color:var(--c4)">${rupiah(o.jumlahDiterima || 0)}</td>
        <td style="font-family:var(--mono);color:${sisa > 0 ? 'var(--c5)' : 'var(--c4)'}">${sisa > 0 ? rupiah(sisa) : '—'}</td>
        <td><span class="badge ${o.statusBayar === 'lunas' ? 'badge-c4' : 'badge-c1'}">${o.statusBayar === 'lunas' ? 'Lunas' : 'COD'}</span></td>
        <td><span class="badge ${statusBadge(o.status)}">${statusLabel(o.status)}</span></td>
      </tr>
    `;
  }).join('');

  // Chart line
  const byDate = {};
  list.forEach(o => { if (!byDate[o.tglMasuk]) byDate[o.tglMasuk] = 0; byDate[o.tglMasuk] += (o.total || 0); });
  const sortedDates = Object.keys(byDate).sort();
  const ctx2 = document.getElementById('chartRekap').getContext('2d');
  if (chartRekap) chartRekap.destroy();
  chartRekap = new Chart(ctx2, {
    type: 'line',
    data: { labels: sortedDates.map(d => tglFormat(d)), datasets: [{ data: sortedDates.map(d => byDate[d]), borderColor: '#95C11F', backgroundColor: 'rgba(149,193,31,0.1)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#95C11F' }] },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8899bb', font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: '#8899bb', font: { size: 10 }, callback: v => 'Rp' + (v / 1000).toFixed(0) + 'k' }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });

  // Chart pie
  const byLay = {};
  list.forEach(o => { if (!byLay[o.layanan]) byLay[o.layanan] = 0; byLay[o.layanan] += (o.total || 0); });
  const pieColors = ['#86D8F8', '#95C11F', '#F7E731', '#F289B5', '#E31E24', '#a8e7fc'];
  const ctx3 = document.getElementById('chartLayananPie').getContext('2d');
  if (chartPie) chartPie.destroy();
  chartPie = new Chart(ctx3, {
    type: 'doughnut',
    data: { labels: Object.keys(byLay), datasets: [{ data: Object.values(byLay), backgroundColor: pieColors.slice(0, Object.keys(byLay).length), borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#8899bb', font: { size: 11 }, boxWidth: 12 } } } }
  });
}

function resetFilterRekap() {
  document.getElementById('filter-tgl-dari').value = '';
  document.getElementById('filter-tgl-sampai').value = '';
  document.getElementById('filter-rekap-layanan').value = '';
  renderRekap();
}

function eksporCSV() {
  const list = [...orders].sort((a, b) => b.createdAt - a.createdAt);
  const header = ['Invoice', 'Tanggal', 'Nama', 'HP', 'Alamat', 'Item', 'Layanan', 'Berat/Qty', 'Satuan', 'Total', 'Diterima', 'Sisa', 'Metode Bayar', 'Status Bayar', 'Status Order'];
  const rows = list.map(o => {
    const sisa = (o.total || 0) - (o.jumlahDiterima || 0);
    return [o.id, o.tglMasuk, o.nama, o.hp, o.alamat, o.item || '—', o.layanan, o.berat, o.satuan, o.total, o.jumlahDiterima || 0, sisa > 0 ? sisa : 0, o.metodeBayar || '—', o.statusBayar, o.status];
  });
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rekap-laundry-' + todayStr() + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast('Ekspor CSV berhasil!');
}

function eksporPDF() {
  const list = [...orders].sort((a, b) => b.createdAt - a.createdAt);
  const totalAll = list.reduce((s, o) => s + (o.total || 0), 0);
  const totalLunas = list.filter(o => o.statusBayar === 'lunas').reduce((s, o) => s + (o.total || 0), 0);
  const totalCOD = list.filter(o => o.statusBayar === 'cod').reduce((s, o) => { const sisa = (o.total || 0) - (o.jumlahDiterima || 0); return s + (sisa > 0 ? sisa : 0); }, 0);
  const rows = list.map(o => {
    const sisa = (o.total || 0) - (o.jumlahDiterima || 0);
    return `
      <tr>
        <td>${o.id}</td><td>${tglFormat(o.tglMasuk)}</td><td>${o.nama}</td>
        <td>${o.item || '—'}</td><td>${o.layanan}</td>
        <td>${o.berat} ${o.satuan}</td>
        <td style="text-align:right">${rupiah(o.total)}</td>
        <td style="text-align:right">${rupiah(o.jumlahDiterima || 0)}</td>
        <td style="text-align:right;color:${sisa > 0 ? '#c0392b' : '#27ae60'}">${sisa > 0 ? rupiah(sisa) : 'Lunas'}</td>
        <td>${o.statusBayar === 'lunas' ? 'Lunas' : 'COD'}</td>
      </tr>
    `;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Laporan Penerimaan Kas - The King Of Majapahit Treatment</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;color:#222;margin:30px;}
      h1{font-size:18px;margin:0;}h2{font-size:13px;color:#555;margin:4px 0 0;}
      .header{display:flex;align-items:center;gap:15px;border-bottom:2px solid #222;padding-bottom:12px;margin-bottom:16px;}
      .logo{width:44px;height:44px;background:linear-gradient(135deg,#F7E731,#F289B5);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;}
      .stats{display:flex;gap:20px;margin-bottom:16px;}
      .stat{background:#f5f5f5;padding:12px 18px;border-radius:6px;flex:1;text-align:center;}
      .stat-v{font-size:18px;font-weight:700;color:#222;margin:4px 0;}
      .stat-l{font-size:10px;color:#777;text-transform:uppercase;letter-spacing:0.4px;}
      table{width:100%;border-collapse:collapse;font-size:11px;}
      th{background:#222;color:#fff;padding:7px 8px;text-align:left;font-size:10px;}
      td{padding:6px 8px;border-bottom:1px solid #eee;}
      tr:nth-child(even){background:#f9f9f9;}
      .footer{margin-top:20px;font-size:10px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:12px;}
    </style>
  </head><body>
    <div class="header">
      <div class="logo">👑</div>
      <div><h1>The King Of Majapahit Treatment</h1><h2>Laporan Penerimaan Kas Laundry</h2>
        <p style="font-size:11px;color:#777;margin:3px 0 0">Periode: Semua s/d Semua &nbsp;|&nbsp; Dicetak: ${tglFormat(todayStr())}</p>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-l">Total Pendapatan</div><div class="stat-v">${rupiah(totalAll)}</div><div style="font-size:10px;color:#777">${list.length} transaksi</div></div>
      <div class="stat"><div class="stat-l">Sudah Lunas</div><div class="stat-v" style="color:#27ae60">${rupiah(totalLunas)}</div></div>
      <div class="stat"><div class="stat-l">COD Belum Lunas</div><div class="stat-v" style="color:#c0392b">${rupiah(totalCOD)}</div></div>
    </div>
    <table><thead><tr>
      <th>Invoice</th><th>Tanggal</th><th>Nama</th><th>Item</th><th>Layanan</th>
      <th>Qty</th><th style="text-align:right">Total</th><th style="text-align:right">Diterima</th><th style="text-align:right">Sisa</th><th>Status</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <div class="footer">Dokumen ini digenerate otomatis oleh sistem The King Of Majapahit Treatment &nbsp;|&nbsp; ${new Date().toLocaleString('id-ID')}</div>
  </body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => { win.print(); };
    toast('Buka tab baru untuk cetak/simpan PDF');
  } else {
    toast('Pop-up diblokir. Izinkan pop-up di browser.', 'error');
  }
}

// ===== LAYANAN =====
function renderLayanan() {
  const tbody = document.getElementById('tbody-layanan');
  tbody.innerHTML = layananList.map(l => `
    <tr>
      <td><strong>${l.nama}</strong></td>
      <td><span class="badge badge-gray">${l.itemFilter || 'Semua Item'}</span></td>
      <td><span class="badge badge-c3">Per ${l.satuan}</span></td>
      <td style="font-family:var(--mono);color:var(--c4)">${rupiah(l.harga)}</td>
      <td style="color:var(--text2);font-size:12px">${l.deskripsi || '—'}</td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" onclick="editLayanan(${l.id})">✏ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="hapusLayanan(${l.id})">🗑</button>
      </div></td>
    </tr>
  `).join('');
}

function openModalLayanan() {
  editLayananId = null;
  document.getElementById('modal-layanan-title').textContent = 'Tambah Layanan Baru';
  ['ml-nama', 'ml-harga', 'ml-deskripsi'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ml-satuan').value = 'kg';
  const selMlItem = document.getElementById('ml-item-filter');
  selMlItem.innerHTML = '<option value="">Semua Item (Layanan Umum)</option>' +
    ITEM_CATALOG.map(it => `<option value="${it.nama}">${it.nama}</option>`).join('');
  document.getElementById('modal-layanan').classList.add('show');
}

function editLayanan(id) {
  const l = layananList.find(x => x.id === id);
  if (!l) return;
  editLayananId = id;
  document.getElementById('modal-layanan-title').textContent = 'Edit Layanan';
  document.getElementById('ml-nama').value = l.nama;
  document.getElementById('ml-satuan').value = l.satuan;
  document.getElementById('ml-harga').value = l.harga;
  document.getElementById('ml-deskripsi').value = l.deskripsi || '';
  const selMlItem = document.getElementById('ml-item-filter');
  selMlItem.innerHTML = '<option value="">Semua Item (Layanan Umum)</option>' +
    ITEM_CATALOG.map(it => `<option value="${it.nama}">${it.nama}</option>`).join('');
  selMlItem.value = l.itemFilter || '';
  document.getElementById('modal-layanan').classList.add('show');
}

function simpanLayanan() {
  const nama = document.getElementById('ml-nama').value.trim();
  const satuan = document.getElementById('ml-satuan').value;
  const harga = parseFloat(document.getElementById('ml-harga').value);
  const deskripsi = document.getElementById('ml-deskripsi').value.trim();
  const itemFilter = document.getElementById('ml-item-filter').value;
  if (!nama || !harga) {
    toast('Nama dan harga wajib diisi!', 'error');
    return;
  }
  if (editLayananId) {
    const l = layananList.find(x => x.id === editLayananId);
    if (l) { l.nama = nama; l.satuan = satuan; l.harga = harga; l.deskripsi = deskripsi; l.itemFilter = itemFilter; }
  } else {
    layananList.push({ id: Date.now(), nama, satuan, harga, deskripsi, itemFilter });
  }
  saveData();
  closeModalLayanan();
  renderLayanan();
  // Refresh all service row dropdowns so new/edited layanan appears immediately
  refreshAllServiceRowDropdowns();
  toast(editLayananId ? 'Layanan diperbarui!' : 'Layanan ditambahkan!');
}

function refreshAllServiceRowDropdowns() {
  document.querySelectorAll('.service-row').forEach(el => {
    const rid = el.id.replace('srow-', '');
    const itemSel = document.getElementById(`srow-item-${rid}`);
    const laySel = document.getElementById(`srow-layanan-${rid}`);
    if (!itemSel || !laySel) return;
    const prevLayVal = laySel.value;
    const prevItemVal = itemSel.value;
    laySel.innerHTML = buildLayananOptions(prevItemVal);
    // Try to restore previous selection
    laySel.value = prevLayVal;
  });
}

function hapusLayanan(id) {
  if (!confirm('Hapus layanan ini?')) return;
  layananList = layananList.filter(l => l.id !== id);
  saveData();
  renderLayanan();
  refreshAllServiceRowDropdowns();
  toast('Layanan dihapus');
}

function closeModalLayanan() {
  document.getElementById('modal-layanan').classList.remove('show');
}

// ===== PELANGGAN =====
function renderPelanggan() {
  const q = document.getElementById('search-pelanggan').value.toLowerCase();
  const pelMap = {};
  orders.forEach(o => {
    if (!pelMap[o.hp]) pelMap[o.hp] = { nama: o.nama, hp: o.hp, alamat: o.alamat, orders: [] };
    pelMap[o.hp].orders.push(o);
  });
  let list = Object.values(pelMap);
  if (q) list = list.filter(p => p.nama.toLowerCase().includes(q) || p.hp.includes(q));
  const tbody = document.getElementById('tbody-pelanggan');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👥</div><p>Belum ada data pelanggan</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map((p, i) => {
    const total = p.orders.reduce((s, o) => s + (o.total || 0), 0);
    const rid = 'riwayat-' + i;
    const rRows = p.orders.map(o => `
      <tr style="background:var(--bg3)">
        <td style="font-family:var(--mono);font-size:11px;color:var(--c3)">${o.id}</td>
        <td>${tglFormat(o.tglMasuk)}</td>
        <td>${o.item || '—'} — ${o.layanan}</td>
        <td>${o.berat} ${o.satuan}</td>
        <td style="color:var(--c4)">${rupiah(o.total)}</td>
        <td><span class="badge ${statusBadge(o.status)}">${statusLabel(o.status)}</span></td>
      </tr>
    `).join('');
    return `
      <tr>
        <td><strong>${p.nama}</strong></td>
        <td style="font-family:var(--mono)">${p.hp}</td>
        <td style="font-size:12px;color:var(--text2)">${p.alamat}</td>
        <td style="font-family:var(--mono)">${p.orders.length}</td>
        <td style="font-family:var(--mono);color:var(--c4)">${rupiah(total)}</td>
        <td><span class="riwayat-toggle" onclick="toggleRiwayat('${rid}',this)">▼ Lihat (${p.orders.length})</span></td>
      </tr>
      <tr id="${rid}" style="display:none">
        <td colspan="6" style="padding:0">
          <table style="width:100%;font-size:12px">
            <thead><tr style="background:var(--bg4)"><th>Invoice</th><th>Tgl</th><th>Detail</th><th>Berat</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>${rRows}</tbody>
          </table>
        </td>
      </tr>
    `;
  }).join('');
}

function toggleRiwayat(id, el) {
  const row = document.getElementById(id);
  const show = row.style.display === 'none';
  row.style.display = show ? 'table-row' : 'none';
  el.textContent = show ? '▲ Sembunyikan' : ('▼ Lihat (' + el.textContent.match(/\d+/) + ')');
}

// Inisialisasi
updateDate();
setInterval(updateDate, 60000);
renderDashboard();
updateBadges();
