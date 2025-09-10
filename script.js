/* ---------------------------------------------------------
 * 옷입히기 게임 – 순수 JS 컨트롤러
 * - 카테고리별 아이템 등록
 * - 탭/썸네일 렌더링
 * - 단일 선택(헤어/눈/입/상의/겉옷)
 * - 다중 선택(소품) + 베이스 소품 맨 아래 고정
 * - 레이어 합성 프리뷰
 * - JPG 내보내기(1080x1080)
 * --------------------------------------------------------- */

/** 기본 바디 이미지 (좌측 프리뷰 맨 아래) */
const BASE_BODY_SRC = "assets/base.png";

/** 아이템 등록 (이미지 파일만 추가하고 src 경로 맞추면 자동 반영) */
const ITEMS = {
  eyes: [
    { id: "eyes_1", name: "눈 A", src: "assets/eyes/eyes_1.png" },
    { id: "eyes_2", name: "눈 B", src: "assets/eyes/eyes_2.png" },
    { id: "eyes_3", name: "눈 A", src: "assets/eyes/eyes_3.png" },
    { id: "eyes_4", name: "눈 B", src: "assets/eyes/eyes_4.png" },
    { id: "eyes_5", name: "눈 B", src: "assets/eyes/eyes_5.png" },
  ],
  mouth: [
    { id: "mouth_1", name: "입 A", src: "assets/mouth/mouth_1.png" },
    { id: "mouth_2", name: "입 B", src: "assets/mouth/mouth_2.png" },
    { id: "mouth_3", name: "입 A", src: "assets/mouth/mouth_3.png" },
    { id: "mouth_4", name: "입 B", src: "assets/mouth/mouth_4.png" },
  ],
  hair: [
    { id: "hair_1", name: "헤어 A", src: "assets/hair/hair_1.png" },
    { id: "hair_2", name: "헤어 B", src: "assets/hair/hair_2.png" },
    { id: "hair_3", name: "헤어 A", src: "assets/hair/hair_3.png" },
    { id: "hair_4", name: "헤어 B", src: "assets/hair/hair_4.png" },
    { id: "hair_5", name: "헤어 A", src: "assets/hair/hair_5.png" },
    { id: "hair_6", name: "헤어 B", src: "assets/hair/hair_6.png" },
    { id: "hair_7", name: "헤어 B", src: "assets/hair/hair_7.png" },
  ],
  top: [
    { id: "top_1", name: "상의 A", src: "assets/top/top_1.png" },
    { id: "top_2", name: "상의 A", src: "assets/top/top_2.png" },
    { id: "top_3", name: "상의 A", src: "assets/top/top_3.png" },
    { id: "top_4", name: "상의 A", src: "assets/top/top_4.png" },
    { id: "top_5", name: "상의 A", src: "assets/top/top_5.png" },
    { id: "top_6", name: "상의 A", src: "assets/top/top_6.png" },
    { id: "top_7", name: "상의 A", src: "assets/top/top_7.png" },
  ],
  jacket: [
    { id: "jacket_1", name: "겉옷 A", src: "assets/jacket/jacket_1.png" },
    { id: "jacket_2", name: "겉옷 A", src: "assets/jacket/jacket_2.png" },
    { id: "jacket_3", name: "겉옷 A", src: "assets/jacket/jacket_3.png" },
    { id: "jacket_4", name: "겉옷 A", src: "assets/jacket/jacket_4.png" },
    { id: "jacket_5", name: "겉옷 A", src: "assets/jacket/jacket_5.png" },
  ],
  accessory: [
    { id: "acc_1", name: "소품1", src: "assets/accessory/acc_1.png" }, // 맨 아래 고정
    { id: "acc_2", name: "소품2", src: "assets/accessory/acc_2.png" },
    { id: "acc_3", name: "소품3", src: "assets/accessory/acc_3.png" },
    { id: "acc_4", name: "소품4", src: "assets/accessory/acc_4.png" },
    { id: "acc_5", name: "소품4", src: "assets/accessory/acc_5.png" },
    { id: "acc_6", name: "소품4", src: "assets/accessory/acc_6.png" },
    { id: "acc_7", name: "소품4", src: "assets/accessory/acc_7.png" },
    { id: "acc_8", name: "소품4", src: "assets/accessory/acc_8.png" },
  ],
};

// 항상 최상단에 올 프레임(투명 PNG) 2장
const OVERLAY_FRAMES = [
  "assets/frames/frame_outer.png",
  "assets/frames/frame_inner.png"
];


// 최소 1개를 항상 유지할 카테고리
const REQUIRED_CATS = ["eyes", "mouth", "hair", "top"];
const TOGGLEABLE_CATS = ["jacket"];                       // 재클릭 시 해제 허용

function mountOverlayFrames() {
  const stageInnerEl = document.querySelector(".stage-inner");
  // 기존 프레임 제거 후 다시 삽입(중복 방지)
  stageInnerEl.querySelectorAll(".overlay-frame").forEach(el => el.remove());

  OVERLAY_FRAMES.forEach(src => {
    const img = document.createElement("img");
    img.className = "overlay-frame";
    img.alt = "";
    img.src = src;
    stageInnerEl.appendChild(img);   // layers 위에 겹침 (z-index:10)
  });
}


// 각 카테고리의 첫 번째 아이템을 기본으로 보장
function ensureRequiredSelected() {
  for (const cat of REQUIRED_CATS) {
    const list = ITEMS[cat] || [];
    if (!list.length) continue;
    // 현재 선택이 없거나, 선택된 id가 목록에 없으면 1번(첫 항목)으로
    if (!selected[cat] || !list.some(it => it.id === selected[cat])) {
      selected[cat] = list[0].id;
    }
  }
}

const EXCLUSIVE_CATS = ["eyes", "mouth", "hair", "top", "jacket"];
const MULTI_CAT = "accessory";
const ACCESSORY_BASE_IDS = ["acc_4", "acc_7"]; // ← 두 개 이상 OK


/** DOM */
const layersEl = document.getElementById("layers");
const itemGridEl = document.getElementById("itemGrid");
const tabsEls = document.querySelectorAll(".tab");
const saveBtn = document.getElementById("saveBtn");

/** 상태 */
let currentCat = "eyes";
let selected = { eyes: null, mouth: null, hair: null, top: null, jacket: null };
let accessories = []; // 선택 순서 유지 (베이스는 항상 0번)

// 홈 버튼: 브라우저 뒤로가기, 없으면 fallback으로 이동
const homeBtn = document.getElementById("homeBtn");
if (homeBtn) {
  homeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.history.length > 1) {
      window.history.back();
    } else if (document.referrer) {
      location.assign(document.referrer);
    } else {
      const fb = homeBtn.dataset.fallback || "/";
      location.assign(fb);
    }
  });
}

/** Utils */
function findItemById(id) {
  for (const cat of Object.keys(ITEMS)) {
    const it = ITEMS[cat].find((x) => x.id === id);
    if (it) return it;
  }
  return null;
}

/** 그리기 순서: 기본 바디(고정) → 눈 → 입 → 상의 → 겉옷 → 헤어 → 액세서리들 */
function computeDrawOrder() {
  const order = [];
  const DRAW_ORDER = ["eyes", "mouth", "top", "jacket", "hair"];
  for (const cat of DRAW_ORDER) {
    const id = selected[cat];
    if (id) order.push(id);
  }
  accessories.forEach((id) => order.push(id));
  return order;
}

function reorderAccessories() {
  // BASE -> 나머지(선택 순서 유지)
  const bases = ACCESSORY_BASE_IDS.filter(id => accessories.includes(id));
  const others = accessories.filter(id => !ACCESSORY_BASE_IDS.includes(id));
  // 혹시 모를 중복 제거
  const seen = new Set();
  accessories = [...bases, ...others].filter(id => (seen.has(id) ? false : seen.add(id)));
}


/** 레이어 렌더 */
function renderLayers() {
  layersEl.querySelectorAll('img[data-dyn="1"]').forEach((el) => el.remove());
  computeDrawOrder().forEach((id) => {
    const item = findItemById(id);
    if (!item) return;
    const img = document.createElement("img");
    img.className = "layer";
    img.dataset.dyn = "1";
    img.alt = item.name || id;
    img.src = item.src;
    layersEl.appendChild(img);
  });
}

/** 아이템 그리드 렌더 (현재 탭) */
function renderGrid() {
  const list = ITEMS[currentCat] || [];
  itemGridEl.innerHTML = "";

  list.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "thumb";
    btn.dataset.id = item.id;
    btn.dataset.cat = currentCat;
    btn.innerHTML = `<img loading="lazy" src="${item.src}" alt="${item.name}">`;

    if (currentCat === MULTI_CAT) {
      if (accessories.includes(item.id)) btn.classList.add("is-selected");
    } else {
      if (selected[currentCat] === item.id) btn.classList.add("is-selected");
    }

    btn.addEventListener("click", () => onThumbClick(item, currentCat));
    itemGridEl.appendChild(btn);
  });
}

/** 썸네일 클릭 */

function onThumbClick(item, cat) {
  if (cat === MULTI_CAT) {
    const i = accessories.indexOf(item.id);
    if (i >= 0) accessories.splice(i, 1);
    else accessories.push(item.id);
    reorderAccessories?.();
  } else {
    if (REQUIRED_CATS.includes(cat)) {
      // 필수 카테고리: 해제 금지, 교체만
      if (selected[cat] === item.id) return;
      selected[cat] = item.id;
    } else if (TOGGLEABLE_CATS.includes(cat)) {
      // 겉옷: 같은 걸 또 누르면 해제
      selected[cat] = (selected[cat] === item.id) ? null : item.id;
    } else {
      // 기타 단일 카테고리 기본 동작(필요 시 확장)
      selected[cat] = (selected[cat] === item.id) ? null : item.id;
    }
  }

  ensureRequiredSelected?.();  // 안전빵
  renderGrid();
  renderLayers();
}

/** 탭 이벤트 */
tabsEls.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabsEls.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    currentCat = tab.dataset.cat;
    renderGrid();
  });
});

/** JPG 저장(1080x1080) */
async function exportJPG() {
  try {
    const EXPORT_SIZE = 1080;
    const srcs = [BASE_BODY_SRC, ...computeDrawOrder().map((id) => findItemById(id)?.src).filter(Boolean),
        BASE_BODY_SRC,
    ...computeDrawOrder().map(id => findItemById(id)?.src).filter(Boolean),
    ...OVERLAY_FRAMES               // ✅ 마지막에 그려서 최상단
    ];
    const images = await Promise.all(srcs.map(loadImage));

    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");
    

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

    images.forEach((img) => ctx.drawImage(img, 0, 0, EXPORT_SIZE, EXPORT_SIZE));

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `dressup-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`;
    a.click();
  } catch (e) {
    alert("저장 중 오류가 발생했습니다.");
    console.error(e);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    img.src = src;
  });
}

/** 초기화 */
function init() {
  // 기본 탭 보정
  const firstTab = Array.from(tabsEls).find((t) => t.dataset.cat === currentCat);
  if (firstTab) {
    tabsEls.forEach((t) => t.classList.remove("is-active"));
    firstTab.classList.add("is-active");
  }
  ensureRequiredSelected();   // ✅ 기본 선택 보장
  mountOverlayFrames();              // ✅ 프레임 삽입

  renderGrid();
  renderLayers();
  if (saveBtn) saveBtn.addEventListener("click", exportJPG);
}

document.addEventListener("DOMContentLoaded", init);


