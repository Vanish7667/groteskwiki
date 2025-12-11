document.addEventListener("DOMContentLoaded", () => {
  const jsonFiles = {
    "Скрытная": "data/gear/Secretive.json",
    "Научная": "data/gear/Scientific.json",
    "Боевая": "data/gear/Combat.json"
  };

  const categoriesEl = document.getElementById("categories-list");
  const kitsListEl = document.getElementById("kits-list");
  const kitTitleEl = document.getElementById("kit-title");
  const variantButtonsEl = document.getElementById("variant-buttons");
  const kitViewEl = document.getElementById("kit-view");
  const mainImageEl = document.getElementById("main-image");
  const imgPrevBtn = document.getElementById("img-prev");
  const imgNextBtn = document.getElementById("img-next");
  const kitDescEl = document.getElementById("kit-desc");
  const kitStatsEl = document.getElementById("kit-stats");
  const slotsContainerEl = document.getElementById("slots-container");

  let allKits = {};
  let currentCategory = null;
  let currentKit = null;
  let currentVariant = null;
  let currentImageIndex = 0;

  function populateCategories() {
    categoriesEl.innerHTML = "";
    Object.keys(jsonFiles).forEach(cat => {
      const btn = document.createElement("button");
      btn.textContent = cat;
      btn.className = "category-btn";
      btn.addEventListener("click", () => {
        Array.from(categoriesEl.children).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectCategory(cat);
      });
      categoriesEl.appendChild(btn);
    });
    categoriesEl.firstChild.classList.add("active");
    selectCategory(Object.keys(jsonFiles)[0]);
  }

  function selectCategory(cat) {
    currentCategory = cat;
    kitsListEl.innerHTML = "<p>Загрузка...</p>";
    fetch(jsonFiles[cat])
      .then(r => r.json())
      .then(data => {
        allKits[cat] = data.map(k => ({ name: k.name, variants: k.variants || [] }));
        populateKitsList(cat);
        if (allKits[cat].length > 0) selectKitByIndex(0);
      })
      .catch(err => {
        kitsListEl.innerHTML = "<p>Ошибка загрузки данных.</p>";
        console.error(err);
      });
  }

  function populateKitsList(cat) {
    kitsListEl.innerHTML = "";
    (allKits[cat] || []).forEach((kit, i) => {
      const btn = document.createElement("button");
      btn.textContent = kit.name;
      btn.className = "kit-btn";
      btn.addEventListener("click", () => {
        Array.from(kitsListEl.querySelectorAll(".kit-btn")).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectKitByIndex(i);
      });
      kitsListEl.appendChild(btn);
    });
  }

  function selectKitByIndex(index) {
    currentKit = allKits[currentCategory][index];
    if (!currentKit) return;
    kitTitleEl.textContent = currentKit.name;
    renderVariantButtons(currentKit);
    if (currentKit.variants.length > 0) selectVariant(currentKit.variants[0]);
    else { kitViewEl.classList.add("hidden"); variantButtonsEl.innerHTML = ""; }
  }

  function renderVariantButtons(kit) {
    variantButtonsEl.innerHTML = "";
    kit.variants.forEach((v, idx) => {
      const btn = document.createElement("button");
      btn.className = "variant-button";
      btn.textContent = v.rank || `Вариант ${idx+1}`;
      btn.addEventListener("click", () => {
        Array.from(variantButtonsEl.children).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectVariant(v);
      });
      variantButtonsEl.appendChild(btn);
    });
    if (variantButtonsEl.firstChild) variantButtonsEl.firstChild.classList.add("active");
    variantButtonsEl.setAttribute("aria-hidden", "false");
  }

  function selectVariant(variant) {
    currentVariant = variant;
    currentImageIndex = 0;
    kitViewEl.classList.remove("hidden");
    updateMainImage();
    kitDescEl.innerHTML = variant.description ? `<p>${variant.description}</p>` : "";
    kitStatsEl.innerHTML = "<h3>Характеристики:</h3>";
    const ul = document.createElement("ul");
    Object.entries(variant.stats || {}).forEach(([k,v]) => {
      const li = document.createElement("li");
      li.textContent = `${k}: ${v}`;
      ul.appendChild(li);
    });
    kitStatsEl.appendChild(ul);

    slotsContainerEl.innerHTML = "";
    (variant.slots || []).forEach(slot => {
      Object.keys(slot).filter(k => k !== "description" && k !== "images").forEach(key => {
        if (slot[key] === 1) {
          const wrap = document.createElement("div");
          wrap.className = "slot-circle";
          const img = document.createElement("img");
          img.src = slot.images?.[0] || "";
          img.alt = key;
          img.title = slot.description || key;
          wrap.appendChild(img);
          slotsContainerEl.appendChild(wrap);
        }
      });
    });
  }

  function updateMainImage() {
    if (!currentVariant?.images?.length) {
      mainImageEl.src = "";
      mainImageEl.alt = "";
      imgPrevBtn.style.visibility = "hidden";
      imgNextBtn.style.visibility = "hidden";
      return;
    }
    const imgs = currentVariant.images;
    if (currentImageIndex < 0) currentImageIndex = imgs.length - 1;
    if (currentImageIndex >= imgs.length) currentImageIndex = 0;
    mainImageEl.src = imgs[currentImageIndex];
    mainImageEl.alt = `${currentKit.name} — ${currentVariant.rank} (${currentImageIndex+1}/${imgs.length})`;
    imgPrevBtn.style.visibility = imgs.length > 1 ? "visible" : "hidden";
    imgNextBtn.style.visibility = imgs.length > 1 ? "visible" : "hidden";
  }

  imgPrevBtn.addEventListener("click", () => { currentImageIndex--; updateMainImage(); });
  imgNextBtn.addEventListener("click", () => { currentImageIndex++; updateMainImage(); });

  // Открытие изображения с масштабированием колесиком
  mainImageEl.addEventListener("click", () => {
    const src = currentVariant?.images?.[currentImageIndex];
    if (!src) return;

    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position:"fixed",
      top:"0",
      left:"0",
      width:"100%",
      height:"100%",
      backgroundColor:"rgba(0,0,0,0.92)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      zIndex:9999,
      cursor:"zoom-out",
      overflow:"hidden"
    });

    const img = document.createElement("img");
    img.src = src;
    Object.assign(img.style, {
      maxWidth:"94%",
      maxHeight:"94%",
      borderRadius:"8px",
      transform: "scale(1)",
      transition: "transform 0.1s"
    });

    let scale = 1;

    // Масштабирование колесиком
    overlay.addEventListener("wheel", (e) => {
      e.preventDefault();
      if(e.deltaY < 0) scale *= 1.1;
      else scale /= 1.1;

      if(scale < 0.2) scale = 0.2;
      if(scale > 5) scale = 5;

      img.style.transform = `scale(${scale})`;
    });

    overlay.appendChild(img);
    overlay.addEventListener("click",()=>overlay.remove());
    document.body.appendChild(overlay);
  });

  populateCategories();
});
