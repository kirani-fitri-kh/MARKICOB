/* =========================================================
   LILY OF LIES — GIFT & LETTER STUDIO
   app.js — vanilla JS, no framework, no external deps
========================================================= */
(function(){
"use strict";

/* ---------------------------------------------------------
   0. CONSTANTS & DUMMY DATA
--------------------------------------------------------- */
const WA_NUMBER = "6281234567890"; // nomor WhatsApp admin (dummy)
const SHIPPING_COST = 10000;
const LOW_STOCK_THRESHOLD = 3;
const CATEGORY_LABELS = {
  stationery:"Stationery", hiasan:"Hiasan", blindbox:"Blind Box", buket:"Buket", letter:"Letter & Keepsakes"
};
const VOUCHERS = {
  "LILY10": { type:"percent", value:10, label:"Diskon 10%" },
  "NEWMEMORY": { type:"flat", value:15000, label:"Potongan Rp15.000" }
};

const DEFAULT_PRODUCTS = [
  { id:1, name:"Notebook Vintage Rose", category:"stationery", price:45000, stock:15, icon:"📓",
    desc:"Notebook bersampul vintage bermotif mawar dengan kertas dot-grid lembut, cocok untuk journaling harian atau mencatat ide-ide manis." },
  { id:2, name:"Pulpen Gel Pastel Set (5pcs)", category:"stationery", price:35000, stock:20, icon:"🖊️",
    desc:"Satu set berisi 5 pulpen gel warna pastel lembut dengan tinta halus dan tahan lama, teman setia menulis surat maupun tugas harian." },
  { id:3, name:"Pembatas Buku Bunga Kering", category:"stationery", price:15000, stock:0, icon:"🔖",
    desc:"Pembatas buku laminasi berisi bunga kering asli — unik, estetik, dan tak ada satupun yang sama persis." },
  { id:4, name:"Sticker Pack Aesthetic Diary", category:"stationery", price:18000, stock:30, icon:"✨",
    desc:"Kumpulan stiker aesthetic bertema bunga dan bintang untuk mempercantik diary, planner, maupun laptop kesayanganmu." },
  { id:5, name:"Planner Mingguan Dreamy", category:"stationery", price:52000, stock:2, icon:"🗒️",
    desc:"Planner mingguan dengan ilustrasi dreamy pastel, membantu menyusun jadwal sekaligus jadi teman semangat sepanjang minggu." },
  { id:6, name:"Lampu Tidur Bulan Mini", category:"hiasan", price:85000, stock:10, icon:"🌙",
    desc:"Lampu tidur meja berbentuk bulan sabit dengan cahaya hangat yang menenangkan, cocok menemani malam-malam tenangmu." },
  { id:7, name:"Lampu Gantung String Fairy Lights", category:"hiasan", price:60000, stock:12, icon:"🪔",
    desc:"Lampu gantung LED berbentuk untaian bintang, mudah dipasang untuk mempercantik dinding kamar maupun area belajar." },
  { id:8, name:"Keychain Bunga Resin", category:"hiasan", price:22000, stock:25, icon:"🔑",
    desc:"Gantungan kunci resin bermotif bunga asli yang diawetkan — cantik, ringan, dan tahan lama dibawa ke mana saja." },
  { id:9, name:"Jam Meja Mini Klasik", category:"hiasan", price:75000, stock:1, icon:"🕰️",
    desc:"Jam meja mini bergaya klasik elegan, mempercantik meja belajar sekaligus menemani rutinitasmu tetap tepat waktu." },
  { id:10, name:"Cermin Kecil Bingkai Bunga", category:"hiasan", price:40000, stock:8, icon:"🪞",
    desc:"Cermin kecil dengan bingkai bunga estetik, pas diletakkan di meja rias maupun rak buku sebagai sentuhan manis." },
  { id:11, name:"Blind Box Fantasy Garden", category:"blindbox", price:95000, stock:14, icon:"🌸",
    desc:"Blind box bertema taman fantasi berisi karakter-karakter imut serba misteri — kejutan menyenangkan di setiap kotaknya." },
  { id:12, name:"Blind Box Cry Baby Series", category:"blindbox", price:98000, stock:0, icon:"😢",
    desc:"Blind box tema Cry Baby yang ekspresif dan menggemaskan, favorit para kolektor figur unik." },
  { id:13, name:"Blind Box Dark Academia", category:"blindbox", price:98000, stock:9, icon:"📚",
    desc:"Blind box bertema Dark Academia dengan nuansa klasik misterius, cocok untuk pecinta estetika akademik vintage." },
  { id:14, name:"Blind Box Doll Whisper", category:"blindbox", price:99000, stock:6, icon:"🎎",
    desc:"Blind box tema boneka misterius dengan desain lembut nan artistik, tiap seri membawa ekspresi berbeda." },
  { id:15, name:"Buket Stationery Pastel", category:"buket", price:120000, stock:6, icon:"💐",
    desc:"Buket unik berisi rangkaian alat tulis pastel — pulpen, sticky notes, hingga pensil — hadiah anti-mainstream yang tetap berguna." },
  { id:16, name:"Buket Blind Box Surprise", category:"buket", price:150000, stock:5, icon:"🎁",
    desc:"Rangkaian buket berisi beberapa blind box mini, memadukan kejutan koleksi dengan keindahan buket hadiah." },
  { id:17, name:"Buket Dry Flower Lavender", category:"buket", price:110000, stock:7, icon:"🌾",
    desc:"Buket bunga kering lavender yang tahan lama dan wangi lembut, cocok untuk hadiah maupun dekorasi ruangan." },
  { id:18, name:"Jar of Mood", category:"letter", price:48000, stock:11, icon:"🫙",
    desc:"Toples berisi puluhan kartu mood harian mungil untuk menemani dan merayakan setiap suasana hatimu." },
  { id:19, name:"Motivation Jar", category:"letter", price:48000, stock:4, icon:"🌟",
    desc:"Toples berisi puluhan kartu motivasi harian untuk menyemangati harimu, satu kartu satu semangat baru." },
  { id:20, name:"Secret Letter Box — For Me 10 Years Later", category:"letter", price:55000, stock:3, icon:"✉️",
    desc:"Kotak surat rahasia untuk kamu tulis hari ini dan buka kembali sepuluh tahun mendatang — kapsul waktu penuh kenangan." }
];

/* ---------------------------------------------------------
   1. STATE (localStorage-backed)
--------------------------------------------------------- */
let PRODUCTS = [];
let cart = [];               // [{id, qty}]
let currentUser = null;      // {name, email}
let isAdmin = false;
let ratingsDB = {};           // {productId: [flowers,...]}
let reviewsDB = {};           // {productId: [{user,text,date}]}
let activeCategory = "all";
let checkoutVoucher = null;   // {code, type, value}
let currentModalProductId = null;

function loadState(){
  try{
    const savedStock = JSON.parse(localStorage.getItem("lol_stock") || "{}");
    PRODUCTS = DEFAULT_PRODUCTS.map(p => ({ ...p, stock: (savedStock[p.id] !== undefined ? savedStock[p.id] : p.stock) }));
  }catch(e){ PRODUCTS = DEFAULT_PRODUCTS.map(p=>({...p})); }

  try{ cart = JSON.parse(localStorage.getItem("lol_cart") || "[]"); }catch(e){ cart = []; }
  try{ currentUser = JSON.parse(localStorage.getItem("lol_user") || "null"); }catch(e){ currentUser = null; }
  isAdmin = localStorage.getItem("lol_admin_session") === "true";
  try{ ratingsDB = JSON.parse(localStorage.getItem("lol_ratings") || "{}"); }catch(e){ ratingsDB = {}; }
  try{ reviewsDB = JSON.parse(localStorage.getItem("lol_reviews") || "{}"); }catch(e){ reviewsDB = {}; }
}

function saveStock(){
  const map = {};
  PRODUCTS.forEach(p => map[p.id] = p.stock);
  localStorage.setItem("lol_stock", JSON.stringify(map));
}
function saveCart(){ localStorage.setItem("lol_cart", JSON.stringify(cart)); }
function saveUser(){ localStorage.setItem("lol_user", JSON.stringify(currentUser)); }
function saveRatings(){ localStorage.setItem("lol_ratings", JSON.stringify(ratingsDB)); }
function saveReviews(){ localStorage.setItem("lol_reviews", JSON.stringify(reviewsDB)); }

/* ---------------------------------------------------------
   2. HELPERS
--------------------------------------------------------- */
function formatRupiah(n){
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}
function getProduct(id){ return PRODUCTS.find(p => p.id === Number(id)); }
function stockStatus(stock){
  if(stock <= 0) return "out";
  if(stock <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}
function stockLabel(stock){
  if(stock <= 0) return "Stok Habis";
  if(stock <= LOW_STOCK_THRESHOLD) return `Stok Menipis (${stock})`;
  return `Stok Tersedia (${stock})`;
}
function avgRating(id){
  const arr = ratingsDB[id] || [];
  if(!arr.length) return 0;
  return arr.reduce((a,b)=>a+b,0) / arr.length;
}
function flowerRatingStatic(avg){
  let html = '<span class="flower-rating" aria-label="Rating produk">';
  for(let i=1;i<=5;i++){
    html += `<span class="${i <= Math.round(avg) ? "" : "muted"}">✿</span>`;
  }
  html += "</span>";
  return html;
}
function flowerRatingInteractive(id, current){
  let html = `<span class="flower-rating interactive" data-pid="${id}">`;
  for(let i=1;i<=5;i++){
    html += `<button type="button" class="${i<=current?"filled":""}" data-flower="${i}">✿</button>`;
  }
  html += "</span>";
  return html;
}
function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function trackEvent(name, params){
  // DUMMY ANALYTICS — dalam produksi, ini akan terkirim ke Google Analytics sungguhan.
  try{ if(typeof gtag === "function") gtag("event", name, params || {}); }catch(e){}
  console.log("[Analytics:dummy]", name, params || {});
}
function toast(msg, type){
  const el = document.createElement("div");
  el.className = "toast" + (type ? " " + type : "");
  el.textContent = msg;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(()=>{ el.style.opacity = "0"; el.style.transition = "opacity .3s ease"; setTimeout(()=>el.remove(), 320); }, 2600);
}
function openModal(id){ const m = document.getElementById(id); m.hidden = false; document.body.style.overflow = "hidden"; }
function closeModalById(id){ const m = document.getElementById(id); m.hidden = true; if(!anyModalOpen()) document.body.style.overflow = ""; }
function anyModalOpen(){
  return ["productModal","checkoutModal","confirmModal","loginModal","adminPanel"].some(id=>{
    const el = document.getElementById(id); return el && !el.hidden;
  }) || document.getElementById("cartDrawer").classList.contains("open");
}

/* ---------------------------------------------------------
   3. PRODUCT GRID + FILTER + SEARCH
--------------------------------------------------------- */
function getFilteredProducts(){
  const search = document.getElementById("navSearchInput").value.trim().toLowerCase();
  const cat = document.getElementById("filterCategory").value;
  const priceRange = document.getElementById("filterPrice").value;
  const sortBy = document.getElementById("sortBy").value;

  let list = PRODUCTS.filter(p=>{
    if(cat !== "all" && p.category !== cat) return false;
    if(search && !p.name.toLowerCase().includes(search) && !CATEGORY_LABELS[p.category].toLowerCase().includes(search)) return false;
    if(priceRange !== "all"){
      const [min,max] = priceRange.split("-").map(Number);
      if(p.price < min || p.price > max) return false;
    }
    return true;
  });

  switch(sortBy){
    case "price-asc": list.sort((a,b)=>a.price-b.price); break;
    case "price-desc": list.sort((a,b)=>b.price-a.price); break;
    case "rating-desc": list.sort((a,b)=>avgRating(b.id)-avgRating(a.id)); break;
    case "name-asc": list.sort((a,b)=>a.name.localeCompare(b.name)); break;
    default: break;
  }
  return list;
}

function productCardHtml(p){
  const status = stockStatus(p.stock);
  const badge = status === "out" ? '<span class="card-badge out">Stok Habis</span>'
              : status === "low" ? `<span class="card-badge low">Sisa ${p.stock}</span>` : "";
  const avg = avgRating(p.id);
  return `
  <article class="product-card" data-id="${p.id}" tabindex="0">
    <div class="card-media">
      ${p.icon}
      ${badge}
      <div class="card-info-overlay">
        <strong>${escapeHtml(p.name)}</strong>
        <span>${stockLabel(p.stock)}</span>
        <span>${avg ? avg.toFixed(1)+" ✿ rata-rata rating" : "Belum ada rating"}</span>
      </div>
    </div>
    <div class="card-body">
      <span class="card-cat">${CATEGORY_LABELS[p.category]}</span>
      <h3 class="card-name">${escapeHtml(p.name)}</h3>
      <span class="card-flowers">${flowerRatingStatic(avg)} <span style="color:#9a9aa5;font-size:.78rem;">(${(ratingsDB[p.id]||[]).length})</span></span>
      <span class="card-price">${formatRupiah(p.price)}</span>
      <div class="card-actions">
        <button class="btn btn-line btn-detail" data-id="${p.id}">Detail</button>
        <button class="btn btn-primary btn-quickadd" data-id="${p.id}" ${p.stock<=0?"disabled":""}>+ Keranjang</button>
      </div>
    </div>
  </article>`;
}

function renderGrid(){
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("emptyState");
  const list = getFilteredProducts();
  document.getElementById("resultCount").textContent = `Menampilkan ${list.length} dari ${PRODUCTS.length} produk`;
  if(!list.length){
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.innerHTML = list.map(productCardHtml).join("");
}

function renderRecommend(){
  // Rekomendasi: produk dengan rating tertinggi & masih tersedia, fallback ke produk acak
  const grid = document.getElementById("recommendGrid");
  let pool = PRODUCTS.filter(p=>p.stock>0);
  pool.sort((a,b)=> avgRating(b.id) - avgRating(a.id));
  let picks = pool.slice(0,4);
  if(picks.length < 4){
    const rest = PRODUCTS.filter(p=>!picks.includes(p)).slice(0,4-picks.length);
    picks = picks.concat(rest);
  }
  grid.innerHTML = picks.map(productCardHtml).join("");
}

/* ---------------------------------------------------------
   4. PRODUCT DETAIL MODAL
--------------------------------------------------------- */
let modalQty = 1;

function openProductModal(id){
  const p = getProduct(id);
  if(!p) return;
  currentModalProductId = p.id;
  modalQty = 1;
  renderProductModalBody();
  openModal("productModal");
  trackEvent("view_item", { item_id:p.id, item_name:p.name, price:p.price });
}

function renderProductModalBody(){
  const p = getProduct(currentModalProductId);
  if(!p) return;
  const status = stockStatus(p.stock);
  const avg = avgRating(p.id);
  const myFlowerPick = 0; // pemilihan baru tiap kali buka (rating disimpan agregat)
  const reviews = reviewsDB[p.id] || [];
  const related = PRODUCTS.filter(x=>x.category===p.category && x.id!==p.id).slice(0,4);
  const relatedPool = related.length ? related : PRODUCTS.filter(x=>x.id!==p.id).slice(0,4);

  document.getElementById("productModalBody").innerHTML = `
    <div class="pm-grid">
      <div class="pm-media">${p.icon}</div>
      <div class="pm-info">
        <span class="pm-cat">${CATEGORY_LABELS[p.category]}</span>
        <h2 class="pm-name">${escapeHtml(p.name)}</h2>
        <div class="pm-rating-row">
          ${flowerRatingStatic(avg)}
          <span class="pm-rating-num">${avg? avg.toFixed(1) : "0.0"} dari ${(ratingsDB[p.id]||[]).length} penilaian</span>
        </div>
        <p class="pm-desc">${escapeHtml(p.desc)}</p>
        <div class="pm-price">${formatRupiah(p.price)}</div>
        <div class="pm-stock ${status}">${stockLabel(p.stock)}</div>
        <div class="pm-qty-row">
          <div class="qty-control">
            <button type="button" id="pmQtyMinus">−</button>
            <span id="pmQtyVal">${modalQty}</span>
            <button type="button" id="pmQtyPlus">+</button>
          </div>
          <span style="font-size:.85rem;color:#7a7a86;">Maks. sesuai stok tersedia</span>
        </div>
        <div class="pm-actions">
          <button class="btn btn-primary" id="pmAddCartBtn" ${p.stock<=0?"disabled":""}>🧺 Tambah ke Keranjang</button>
          <button class="btn btn-ghost" id="pmBuyNowBtn" ${p.stock<=0?"disabled":""}>Beli Sekarang</button>
        </div>

        <h4 class="pm-section-title">Beri Rating (gunakan bunga ✿)</h4>
        ${flowerRatingInteractive(p.id, myFlowerPick)}

        <h4 class="pm-section-title">Ulasan Produk (${reviews.length})</h4>
        <form class="review-form" id="reviewForm">
          <textarea id="reviewText" rows="2" placeholder="${currentUser ? 'Tulis ulasanmu tentang produk ini...' : 'Masuk sebagai pengguna untuk menulis ulasan...'}" ${currentUser?"":"disabled"}></textarea>
          <button type="submit" class="btn btn-line btn-sm" style="align-self:flex-end;" ${currentUser?"":"disabled"}>Kirim Ulasan</button>
        </form>
        <div id="reviewList">
          ${ reviews.length ? reviews.slice().reverse().map(r=>`
            <div class="review-item">
              <div class="rv-head"><span class="rv-user">${escapeHtml(r.user)}</span><span class="rv-date">${r.date}</span></div>
              <p>${escapeHtml(r.text)}</p>
            </div>`).join("") : '<p class="no-review">Belum ada ulasan. Jadilah yang pertama!</p>' }
        </div>
      </div>
    </div>

    <h4 class="pm-section-title">Rekomendasi Lainnya</h4>
    <div class="recommend-mini-grid">
      ${relatedPool.map(r=>`
        <div class="mini-card" data-id="${r.id}">
          <div class="mini-icon">${r.icon}</div>
          <div class="mini-name">${escapeHtml(r.name)}</div>
          <div class="mini-price">${formatRupiah(r.price)}</div>
        </div>`).join("")}
    </div>
  `;

  // Bind events inside modal
  document.getElementById("pmQtyMinus").onclick = ()=>{ if(modalQty>1){ modalQty--; document.getElementById("pmQtyVal").textContent = modalQty; } };
  document.getElementById("pmQtyPlus").onclick = ()=>{ if(modalQty<p.stock){ modalQty++; document.getElementById("pmQtyVal").textContent = modalQty; } else { toast("Jumlah melebihi stok tersedia","err"); } };
  document.getElementById("pmAddCartBtn").onclick = ()=>{ addToCart(p.id, modalQty); };
  document.getElementById("pmBuyNowBtn").onclick = ()=>{ addToCart(p.id, modalQty, true); };

  document.querySelectorAll('#productModalBody .flower-rating.interactive button').forEach(btn=>{
    btn.onclick = ()=>{
      if(!currentUser){ toast("Masuk sebagai pengguna untuk memberi rating","err"); openModal("loginModal"); return; }
      const val = Number(btn.dataset.flower);
      ratingsDB[p.id] = ratingsDB[p.id] || [];
      ratingsDB[p.id].push(val);
      saveRatings();
      toast("Terima kasih atas rating-mu! ✿","ok");
      renderProductModalBody();
      renderGrid();
    };
  });

  document.getElementById("reviewForm").onsubmit = (e)=>{
    e.preventDefault();
    if(!currentUser){ toast("Masuk sebagai pengguna untuk menulis ulasan","err"); openModal("loginModal"); return; }
    const text = document.getElementById("reviewText").value.trim();
    if(!text){ toast("Ulasan tidak boleh kosong","err"); return; }
    reviewsDB[p.id] = reviewsDB[p.id] || [];
    reviewsDB[p.id].push({ user:currentUser.name, text, date:new Date().toLocaleDateString("id-ID") });
    saveReviews();
    toast("Ulasan berhasil dikirim","ok");
    renderProductModalBody();
  };

  document.querySelectorAll("#productModalBody .mini-card").forEach(card=>{
    card.onclick = ()=> openProductModal(Number(card.dataset.id));
  });
}

/* ---------------------------------------------------------
   5. CART
--------------------------------------------------------- */
function cartQtyTotal(){ return cart.reduce((a,c)=>a+c.qty,0); }
function updateCartBadges(){
  const n = cartQtyTotal();
  document.getElementById("cartCount").textContent = n;
  document.getElementById("tabCartCount").textContent = n;
}

function addToCart(id, qty, goCheckoutAfter){
  const p = getProduct(id);
  if(!p || p.stock<=0) { toast("Maaf, stok produk ini habis","err"); return; }
  qty = qty || 1;
  const existing = cart.find(c=>c.id===id);
  const currentQty = existing ? existing.qty : 0;
  if(currentQty + qty > p.stock){
    toast(`Stok tidak mencukupi. Sisa stok: ${p.stock}`,"err");
    return;
  }
  if(existing){ existing.qty += qty; } else { cart.push({ id, qty }); }
  saveCart();
  updateCartBadges();
  renderCartDrawer();
  toast(`${p.name} ditambahkan ke keranjang`,"ok");
  trackEvent("add_to_cart", { item_id:p.id, item_name:p.name, quantity:qty, value:p.price*qty });
  if(goCheckoutAfter){ closeModalById("productModal"); openCart(); setTimeout(openCheckout, 250); }
}

function updateCartQty(id, delta){
  const item = cart.find(c=>c.id===id);
  const p = getProduct(id);
  if(!item || !p) return;
  const newQty = item.qty + delta;
  if(newQty <= 0){ removeCartItem(id); return; }
  if(newQty > p.stock){ toast(`Stok tidak mencukupi. Sisa stok: ${p.stock}`,"err"); return; }
  item.qty = newQty;
  saveCart();
  updateCartBadges();
  renderCartDrawer();
}

function removeCartItem(id){
  cart = cart.filter(c=>c.id!==id);
  saveCart();
  updateCartBadges();
  renderCartDrawer();
  toast("Produk dihapus dari keranjang","");
}

function cartSubtotal(){
  return cart.reduce((sum,c)=>{ const p = getProduct(c.id); return sum + (p ? p.price*c.qty : 0); },0);
}
function computeDiscount(subtotal, voucher){
  if(!voucher) return 0;
  if(voucher.type==="percent") return Math.round(subtotal * voucher.value/100);
  return Math.min(voucher.value, subtotal);
}

function renderCartDrawer(){
  const wrap = document.getElementById("cartItems");
  if(!cart.length){
    wrap.innerHTML = '<div class="cart-empty">Keranjangmu masih kosong ✦<br>Yuk pilih hadiah spesialmu.</div>';
  }else{
    wrap.innerHTML = cart.map(c=>{
      const p = getProduct(c.id);
      if(!p) return "";
      return `
      <div class="cart-item" data-id="${p.id}">
        <div class="ci-media">${p.icon}</div>
        <div class="ci-body">
          <div class="ci-name">${escapeHtml(p.name)}</div>
          <div class="ci-price">${formatRupiah(p.price)} x ${c.qty}</div>
          <div class="ci-row">
            <div class="qty-control">
              <button type="button" class="ci-minus" data-id="${p.id}">−</button>
              <span>${c.qty}</span>
              <button type="button" class="ci-plus" data-id="${p.id}">+</button>
            </div>
            <button class="ci-remove" data-id="${p.id}">Hapus</button>
          </div>
        </div>
      </div>`;
    }).join("");
  }
  const subtotal = cartSubtotal();
  const discount = computeDiscount(subtotal, checkoutVoucher);
  document.getElementById("cartTotalText").textContent = formatRupiah(subtotal - discount);

  wrap.querySelectorAll(".ci-minus").forEach(b=> b.onclick = ()=>updateCartQty(Number(b.dataset.id), -1));
  wrap.querySelectorAll(".ci-plus").forEach(b=> b.onclick = ()=>updateCartQty(Number(b.dataset.id), 1));
  wrap.querySelectorAll(".ci-remove").forEach(b=> b.onclick = ()=>removeCartItem(Number(b.dataset.id)));
}

function openCart(){
  document.getElementById("cartOverlay").hidden = false;
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartDrawer").setAttribute("aria-hidden","false");
  renderCartDrawer();
}
function closeCart(){
  document.getElementById("cartOverlay").hidden = true;
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartDrawer").setAttribute("aria-hidden","true");
}

/* ---------------------------------------------------------
   6. VOUCHER
--------------------------------------------------------- */
function tryApplyVoucher(code, msgElId){
  const msgEl = document.getElementById(msgElId);
  code = code.trim().toUpperCase();
  if(!code){ checkoutVoucher = null; msgEl.textContent=""; renderCartDrawer(); renderCheckoutSummary(); return; }
  if(VOUCHERS[code]){
    checkoutVoucher = { code, ...VOUCHERS[code] };
    msgEl.textContent = `Voucher "${code}" diterapkan — ${VOUCHERS[code].label} 🎉`;
    msgEl.className = "voucher-msg ok";
  }else{
    checkoutVoucher = null;
    msgEl.textContent = "Kode voucher tidak valid";
    msgEl.className = "voucher-msg err";
  }
  renderCartDrawer();
  renderCheckoutSummary();
}

/* ---------------------------------------------------------
   7. CHECKOUT
--------------------------------------------------------- */
function openCheckout(){
  if(!cart.length){ toast("Keranjang masih kosong","err"); return; }
  closeCart();
  renderCheckoutSummary();
  openModal("checkoutModal");
  trackEvent("begin_checkout", { value: cartSubtotal(), items: cart.length });
}

function renderCheckoutSummary(){
  const wrap = document.getElementById("checkoutSummaryItems");
  wrap.innerHTML = cart.map(c=>{
    const p = getProduct(c.id);
    if(!p) return "";
    return `<div class="summary-item-row"><span>${escapeHtml(p.name)} x${c.qty}</span><span>${formatRupiah(p.price*c.qty)}</span></div>`;
  }).join("");

  const subtotal = cartSubtotal();
  const discount = computeDiscount(subtotal, checkoutVoucher);
  const total = Math.max(0, subtotal - discount + (subtotal>0?SHIPPING_COST:0));

  document.getElementById("ckSubtotal").textContent = formatRupiah(subtotal);
  document.getElementById("ckShipping").textContent = formatRupiah(subtotal>0?SHIPPING_COST:0);
  const discLine = document.getElementById("ckDiscountLine");
  if(discount>0){ discLine.hidden = false; document.getElementById("ckDiscount").textContent = "-"+formatRupiah(discount); }
  else{ discLine.hidden = true; }
  document.getElementById("ckTotal").textContent = formatRupiah(total);
}

function validateCheckoutForm(){
  let valid = true;
  const name = document.getElementById("ckName").value.trim();
  const phone = document.getElementById("ckPhone").value.trim();
  const address = document.getElementById("ckAddress").value.trim();

  const setErr = (rowId, errId, msg)=>{
    document.getElementById(rowId).parentElement.classList.toggle("invalid", !!msg);
    document.getElementById(errId).textContent = msg || "";
  };

  if(name.length < 3){ setErr("ckName","errName","Nama minimal 3 karakter"); valid=false; }
  else setErr("ckName","errName","");

  const phoneClean = phone.replace(/[^0-9]/g,"");
  if(phoneClean.length < 9 || !/^0/.test(phoneClean)){ setErr("ckPhone","errPhone","Masukkan nomor WhatsApp yang valid (awali 0)"); valid=false; }
  else setErr("ckPhone","errPhone","");

  if(address.length < 10){ setErr("ckAddress","errAddress","Alamat terlalu singkat, mohon lengkapi"); valid=false; }
  else setErr("ckAddress","errAddress","");

  return valid;
}

function generateOrderNumber(){
  const d = new Date();
  return "LOL-" + d.getFullYear().toString().slice(2) + (d.getMonth()+1).toString().padStart(2,"0") + d.getDate().toString().padStart(2,"0")
    + "-" + Math.floor(1000+Math.random()*9000);
}

function processPayment(e){
  e.preventDefault();
  if(!validateCheckoutForm()){ toast("Mohon lengkapi data dengan benar","err"); return; }

  // Pastikan stok masih cukup di detik terakhir
  for(const c of cart){
    const p = getProduct(c.id);
    if(!p || p.stock < c.qty){ toast(`Stok "${p?p.name:'produk'}" tidak lagi mencukupi`, "err"); return; }
  }

  const btn = document.getElementById("payNowBtn");
  btn.disabled = true;
  btn.textContent = "Memproses Pembayaran...";

  const method = document.querySelector('input[name="payMethod"]:checked').value;
  const name = document.getElementById("ckName").value.trim();
  const phone = document.getElementById("ckPhone").value.trim();
  const address = document.getElementById("ckAddress").value.trim();
  const note = document.getElementById("ckNote").value.trim();
  const subtotal = cartSubtotal();
  const discount = computeDiscount(subtotal, checkoutVoucher);
  const total = Math.max(0, subtotal - discount + SHIPPING_COST);
  const orderNo = generateOrderNumber();
  const itemsSnapshot = cart.map(c=>{ const p=getProduct(c.id); return { name:p.name, qty:c.qty, price:p.price }; });

  // Simulasi proses pembayaran (delay singkat agar terasa nyata)
  setTimeout(()=>{
    // Kurangi stok
    cart.forEach(c=>{
      const p = getProduct(c.id);
      if(p) p.stock = Math.max(0, p.stock - c.qty);
    });
    saveStock();

    // Simpan order (opsional, untuk histori sederhana)
    try{
      const orders = JSON.parse(localStorage.getItem("lol_orders")||"[]");
      orders.push({ orderNo, name, phone, address, note, method, items:itemsSnapshot, total, date:new Date().toISOString() });
      localStorage.setItem("lol_orders", JSON.stringify(orders));
    }catch(err){}

    trackEvent("purchase", { transaction_id: orderNo, value: total, shipping: SHIPPING_COST, payment_method: method });

    // Kosongkan cart & voucher
    cart = []; saveCart(); updateCartBadges(); renderCartDrawer();
    checkoutVoucher = null;

    // Reset tombol & tutup checkout
    btn.disabled = false;
    btn.textContent = "Bayar Sekarang";
    closeModalById("checkoutModal");
    document.getElementById("checkoutForm").reset();

    // Notifikasi & konfirmasi
    showPaymentConfirmation(orderNo, name, method, total, itemsSnapshot, address, note);
    renderGrid();
    renderRecommend();
    if(!document.getElementById("adminPanel").hidden) renderAdminTable();
  }, 1200);
}

function showPaymentConfirmation(orderNo, name, method, total, items, address, note){
  document.getElementById("orderNumberText").textContent = orderNo;

  const itemLines = items.map(it=>`- ${it.name} x${it.qty} (${formatRupiah(it.price*it.qty)})`).join("%0A");
  const waText = `Halo Lily of Lies! ✦%0A%0ASaya ingin konfirmasi pesanan:%0A*No. Pesanan:* ${orderNo}%0A*Nama:* ${encodeURIComponent(name)}%0A*Metode Bayar:* ${encodeURIComponent(method)}%0A%0A*Detail Pesanan:*%0A${itemLines}%0A%0A*Total: ${formatRupiah(total)}*%0A*Alamat:* ${encodeURIComponent(address)}${note?("%0A*Catatan:* "+encodeURIComponent(note)):""}%0A%0AMohon diproses ya, terima kasih! 💌`;
  document.getElementById("waConfirmBtn").href = `https://wa.me/${WA_NUMBER}?text=${waText}`;

  openModal("confirmModal");
  toast("Pembayaran berhasil diproses! Notifikasi telah dikirim.","ok");
}

/* ---------------------------------------------------------
   8. LOGIN (User & Admin)
--------------------------------------------------------- */
function refreshAccountUI(){
  const label = document.getElementById("accountLabel");
  if(isAdmin){ label.textContent = "Admin"; }
  else if(currentUser){ label.textContent = currentUser.name; }
  else{ label.textContent = "Masuk"; }
}

function openLoginFlow(){
  if(isAdmin){ renderAdminTable(); openModal("adminPanel"); return; }
  // reset form visibility
  document.getElementById("loginTabs").hidden = !!currentUser;
  document.getElementById("userLoginForm").hidden = true;
  document.getElementById("adminLoginForm").hidden = true;
  document.getElementById("loggedInView").hidden = !currentUser;
  if(currentUser){
    document.getElementById("loggedInName").textContent = currentUser.name;
    document.getElementById("loggedInRole").textContent = "pengguna";
  }else{
    document.getElementById("userLoginForm").hidden = false;
  }
  openModal("loginModal");
}

function bindLoginEvents(){
  document.querySelectorAll(".login-tab").forEach(tab=>{
    tab.onclick = ()=>{
      document.querySelectorAll(".login-tab").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.getElementById("userLoginForm").hidden = target !== "user";
      document.getElementById("adminLoginForm").hidden = target !== "admin";
    };
  });

  document.getElementById("userLoginForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = document.getElementById("userNameInput").value.trim();
    const email = document.getElementById("userEmailInput").value.trim();
    if(name.length<2 || !email.includes("@")){ toast("Mohon isi nama dan email dengan benar","err"); return; }
    currentUser = { name, email };
    saveUser();
    refreshAccountUI();
    closeModalById("loginModal");
    toast(`Selamat datang, ${name}! 🌷`,"ok");
    if(currentModalProductId) renderProductModalBody();
  });

  document.getElementById("adminLoginForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const u = document.getElementById("adminUserInput").value.trim();
    const pass = document.getElementById("adminPassInput").value.trim();
    const errEl = document.getElementById("errAdminLogin");
    if(u === "admin" && pass === "admin123"){
      isAdmin = true;
      localStorage.setItem("lol_admin_session","true");
      errEl.textContent = "";
      refreshAccountUI();
      closeModalById("loginModal");
      renderAdminTable();
      openModal("adminPanel");
      toast("Berhasil masuk sebagai Admin","ok");
    }else{
      errEl.textContent = "Username atau password salah";
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", ()=>{
    currentUser = null;
    localStorage.removeItem("lol_user");
    refreshAccountUI();
    closeModalById("loginModal");
    toast("Berhasil keluar","");
  });

  document.getElementById("adminLogoutBtn").addEventListener("click", ()=>{
    isAdmin = false;
    localStorage.removeItem("lol_admin_session");
    refreshAccountUI();
    closeModalById("adminPanel");
    toast("Keluar dari mode Admin","");
  });
}

/* ---------------------------------------------------------
   9. ADMIN PANEL
--------------------------------------------------------- */
function renderAdminTable(){
  const body = document.getElementById("adminTableBody");
  body.innerHTML = PRODUCTS.map(p=>{
    const status = stockStatus(p.stock);
    const pillClass = status === "out" ? "out" : status === "low" ? "low" : "ok";
    const pillText = status === "out" ? "Habis" : status === "low" ? "Menipis" : "Aman";
    return `
    <tr data-id="${p.id}">
      <td>${p.icon} ${escapeHtml(p.name)}</td>
      <td>${CATEGORY_LABELS[p.category]}</td>
      <td>${formatRupiah(p.price)}</td>
      <td><strong>${p.stock}</strong></td>
      <td><span class="status-pill ${pillClass}">${pillText}</span></td>
      <td>
        <div class="stock-input-row">
          <input type="number" min="1" value="5" id="stockAdd${p.id}">
          <button class="btn btn-line btn-sm" data-add-id="${p.id}">Tambah</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  body.querySelectorAll("[data-add-id]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = Number(btn.dataset.addId);
      const input = document.getElementById("stockAdd"+id);
      const amount = Math.max(1, parseInt(input.value,10) || 0);
      const p = getProduct(id);
      p.stock += amount;
      saveStock();
      toast(`Stok "${p.name}" bertambah ${amount} (kini ${p.stock})`,"ok");
      renderAdminTable();
      renderGrid();
      renderRecommend();
      if(currentModalProductId === id) renderProductModalBody();
    };
  });

  renderAdminAlert();
}

function renderAdminAlert(){
  const alertEl = document.getElementById("adminAlert");
  const outItems = PRODUCTS.filter(p=>p.stock<=0);
  const lowItems = PRODUCTS.filter(p=>p.stock>0 && p.stock<=LOW_STOCK_THRESHOLD);
  if(!outItems.length && !lowItems.length){ alertEl.hidden = true; return; }
  alertEl.hidden = false;
  let msg = "";
  if(outItems.length) msg += `⚠️ Stok Habis: ${outItems.map(p=>p.name).join(", ")}. `;
  if(lowItems.length) msg += `🟠 Stok Menipis: ${lowItems.map(p=>p.name+" ("+p.stock+")").join(", ")}.`;
  alertEl.textContent = msg;
}

/* ---------------------------------------------------------
   10. NAVIGATION / UI GENERAL
--------------------------------------------------------- */
function setActiveCategory(cat){
  activeCategory = cat;
  document.getElementById("filterCategory").value = cat;
  document.querySelectorAll(".cat-chip").forEach(c=> c.classList.toggle("active", c.dataset.cat === cat));
  renderGrid();
}

function bindNavAndFilters(){
  document.querySelectorAll(".cat-chip").forEach(chip=>{
    chip.onclick = ()=> setActiveCategory(chip.dataset.cat);
  });
  document.getElementById("filterCategory").addEventListener("change", (e)=>{
    setActiveCategory(e.target.value);
  });
  document.getElementById("filterPrice").addEventListener("change", renderGrid);
  document.getElementById("sortBy").addEventListener("change", renderGrid);
  document.getElementById("resetFilterBtn").addEventListener("click", ()=>{
    document.getElementById("navSearchInput").value = "";
    document.getElementById("filterPrice").value = "all";
    document.getElementById("sortBy").value = "default";
    setActiveCategory("all");
  });

  let searchTimer;
  document.getElementById("navSearchInput").addEventListener("input", (e)=>{
    clearTimeout(searchTimer);
    searchTimer = setTimeout(()=>{
      renderGrid();
      const term = e.target.value.trim();
      if(term) trackEvent("search", { search_term: term });
    }, 250);
  });

  document.querySelectorAll("[data-scroll]").forEach(link=>{
    link.addEventListener("click", (e)=>{
      const href = link.getAttribute("href");
      if(href && href.startsWith("#")){
        e.preventDefault();
        const target = document.querySelector(href);
        if(target){ target.scrollIntoView({ behavior:"smooth", block:"start" }); }
        document.getElementById("navLinks").classList.remove("open-mobile");
      }
    });
  });

  document.querySelectorAll("[data-cat-link]").forEach(link=>{
    link.addEventListener("click", (e)=>{
      e.preventDefault();
      setActiveCategory(link.dataset.catLink);
      document.getElementById("produk").scrollIntoView({ behavior:"smooth" });
    });
  });

  document.getElementById("hamburgerBtn").addEventListener("click", ()=>{
    document.getElementById("navLinks").classList.toggle("open-mobile");
    const nl = document.getElementById("navLinks");
    if(nl.classList.contains("open-mobile")){
      nl.style.cssText = "display:flex;position:fixed;top:64px;left:0;right:0;background:var(--bg);flex-direction:column;padding:1.2rem 1.6rem;gap:1rem;box-shadow:0 12px 24px rgba(30,42,68,0.12);";
    }else{
      nl.style.cssText = "";
    }
  });
}

function bindProductGridEvents(){
  document.body.addEventListener("click", (e)=>{
    const detailBtn = e.target.closest(".btn-detail");
    if(detailBtn){ openProductModal(Number(detailBtn.dataset.id)); return; }

    const addBtn = e.target.closest(".btn-quickadd");
    if(addBtn){ addToCart(Number(addBtn.dataset.id), 1); return; }

    const card = e.target.closest(".product-card");
    if(card && !e.target.closest("button")){ openProductModal(Number(card.dataset.id)); return; }
  });

  // Sentuhan (touch) untuk menampilkan info produk di mobile
  document.body.addEventListener("touchstart", (e)=>{
    const card = e.target.closest(".product-card");
    document.querySelectorAll(".product-card.touched").forEach(c=>{ if(c!==card) c.classList.remove("touched"); });
    if(card) card.classList.toggle("touched");
  }, { passive:true });
}

function bindModalCloseEvents(){
  document.querySelectorAll("[data-close]").forEach(btn=>{
    btn.addEventListener("click", ()=> closeModalById(btn.dataset.close));
  });
  document.querySelectorAll(".modal-overlay").forEach(overlay=>{
    overlay.addEventListener("click", (e)=>{ if(e.target === overlay) closeModalById(overlay.id); });
  });
  document.getElementById("closeConfirmBtn").addEventListener("click", ()=> closeModalById("confirmModal"));
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      ["productModal","checkoutModal","confirmModal","loginModal","adminPanel"].forEach(id=>{
        const el = document.getElementById(id);
        if(el && !el.hidden) closeModalById(id);
      });
      if(document.getElementById("cartDrawer").classList.contains("open")) closeCart();
    }
  });
}

function bindCartEvents(){
  document.getElementById("cartTriggerBtn").addEventListener("click", openCart);
  document.getElementById("mobileCartBtn").addEventListener("click", openCart);
  document.getElementById("closeCartBtn").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);
  document.getElementById("goCheckoutBtn").addEventListener("click", openCheckout);
  document.getElementById("applyVoucherCartBtn").addEventListener("click", ()=>{
    tryApplyVoucher(document.getElementById("voucherInputCart").value, "voucherMsgCart");
  });
}

function bindCheckoutEvents(){
  document.getElementById("checkoutForm").addEventListener("submit", processPayment);
  document.getElementById("applyVoucherCkBtn").addEventListener("click", ()=>{
    tryApplyVoucher(document.getElementById("voucherInputCheckout").value, "voucherMsgCk");
  });
  ["ckName","ckPhone","ckAddress"].forEach(id=>{
    document.getElementById(id).addEventListener("blur", validateCheckoutForm);
  });
}

function bindFaq(){
  document.querySelectorAll(".faq-item").forEach(item=>{
    item.querySelector(".faq-q").addEventListener("click", ()=>{
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(i=>i.classList.remove("open"));
      if(!wasOpen) item.classList.add("open");
    });
  });
}

function bindLoginTrigger(){
  document.getElementById("loginTriggerBtn").addEventListener("click", openLoginFlow);
}

/* ---------------------------------------------------------
   11. NAVBAR SHADOW ON SCROLL (subtle UX polish)
--------------------------------------------------------- */
function bindScrollEffects(){
  const nav = document.getElementById("navbar");
  window.addEventListener("scroll", ()=>{
    nav.style.boxShadow = window.scrollY > 10 ? "0 6px 20px rgba(30,42,68,0.1)" : "none";
  }, { passive:true });

  // Fade-in on scroll for sections
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.style.opacity = "1";
        entry.target.style.transform = "none";
      }
    });
  }, { threshold:0.08 });
  document.querySelectorAll(".section, .cat-strip").forEach(sec=>{
    sec.style.opacity = "0.001";
    sec.style.transform = "translateY(16px)";
    sec.style.transition = "opacity .5s ease, transform .5s ease";
    observer.observe(sec);
  });
}

/* ---------------------------------------------------------
   12. INIT
--------------------------------------------------------- */
function init(){
  loadState();
  refreshAccountUI();
  updateCartBadges();
  renderGrid();
  renderRecommend();
  renderCartDrawer();

  bindNavAndFilters();
  bindProductGridEvents();
  bindModalCloseEvents();
  bindCartEvents();
  bindCheckoutEvents();
  bindLoginEvents();
  bindLoginTrigger();
  bindFaq();
  bindScrollEffects();

  trackEvent("page_view", { page_title:"Lily of Lies - Beranda" });
}

document.addEventListener("DOMContentLoaded", init);
})();
