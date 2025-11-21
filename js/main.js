/* -------------------------------
   Вкладки
---------------------------------*/
const sectionButtons = document.querySelectorAll("#top-tabs .section-btn");
const tabContents = document.querySelectorAll(".tab-content");

sectionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        tabContents.forEach(tab => tab.style.display = "none");
        document.getElementById(target).style.display = target === "artifacts-tab" ? "flex" : "block";
        sectionButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

/* -------------------------------
   Вкладка одежды
---------------------------------*/
const classColumn = document.getElementById("class-column");
const setsColumn = document.getElementById("sets-column");
const detailsColumn = document.getElementById("details-column");

const classes = ["combat", "science", "mixed"];
const classNames = {combat:"Боевой", science:"Научный", mixed:"Комбинированный"};

let currentSet = null;
let currentVariantIndex = 0;
let currentImageIndex = 0;

const rankContainer = document.createElement("div");
const photoContainer = document.createElement("div");
const desc = document.createElement("p");
const statsContainer = document.createElement("div");

detailsColumn.innerHTML = "<h3>Детали комплекта</h3>";
detailsColumn.appendChild(rankContainer);
detailsColumn.appendChild(photoContainer);
detailsColumn.appendChild(desc);
detailsColumn.appendChild(statsContainer);

function setActive(element, container) {
    Array.from(container.children).forEach(el => el.classList.remove("active"));
    element.classList.add("active");
}

// Кнопки классов
classes.forEach(cls => {
    const btn = document.createElement("button");
    btn.classList.add("selection-btn");
    btn.textContent = classNames[cls];
    btn.addEventListener("click", () => {
        setActive(btn, classColumn);
        loadClassSets(cls);
    });
    classColumn.appendChild(btn);
});

// Загрузка комплектов
function loadClassSets(classType) {
    fetch(`data/${classType}.json`)
        .then(res => res.json())
        .then(data => showSets(data))
        .catch(err => console.error("Ошибка загрузки JSON:", err));
}

// Показ комплектов
function showSets(sets) {
    setsColumn.innerHTML = "<h3>Комплекты</h3>";
    sets.forEach(set => {
        const card = document.createElement("div");
        card.classList.add("set-card");
        card.textContent = set.name;
        card.addEventListener("click", () => {
            setActive(card, setsColumn);
            showSetDetails(set);
        });
        setsColumn.appendChild(card);
    });
    currentSet = null;
    currentVariantIndex = 0;
    currentImageIndex = 0;
    rankContainer.innerHTML = "";
    photoContainer.innerHTML = "";
    desc.textContent = "";
    statsContainer.innerHTML = "";
}

// Показ деталей комплекта
function showSetDetails(set){
    currentSet = set;
    currentVariantIndex = 0;
    currentImageIndex = 0;
    renderSet();
}

function renderSet(){
    if(!currentSet) return;
    const variant = currentSet.variants[currentVariantIndex];

    rankContainer.innerHTML = "";
    photoContainer.innerHTML = "";
    statsContainer.innerHTML = "";

    // Ранги
    currentSet.variants.forEach((v,i)=>{
        const btn = document.createElement("button");
        btn.classList.add("rank-btn");
        btn.textContent = v.rank;
        btn.addEventListener("click", ()=>{
            currentVariantIndex = i;
            currentImageIndex = 0;
            setActive(btn, rankContainer);
            renderSet();
        });
        rankContainer.appendChild(btn);
        if(i===currentVariantIndex) setActive(btn, rankContainer);
    });

    // Фото + стрелки
    const photoNavContainer = document.createElement("div");
    photoNavContainer.style.display = "flex";
    photoNavContainer.style.alignItems = "center";
    photoNavContainer.style.justifyContent = "center";
    photoNavContainer.style.gap = "8px";

    const prevBtn = document.createElement("button");
    prevBtn.classList.add("nav-btn");
    prevBtn.textContent = "<";
    prevBtn.addEventListener("click", prevImage);

    const nextBtn = document.createElement("button");
    nextBtn.classList.add("nav-btn");
    nextBtn.textContent = ">";
    nextBtn.addEventListener("click", nextImage);

    const img = document.createElement("img");
    img.src = variant.images[currentImageIndex];
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "5px";

    photoNavContainer.appendChild(prevBtn);
    photoNavContainer.appendChild(img);
    photoNavContainer.appendChild(nextBtn);
    photoContainer.appendChild(photoNavContainer);

    // Описание
    desc.textContent = `${currentSet.name} (${variant.rank}) - ${variant.description}`;

    // Характеристики
    const statsTitle = document.createElement("h4");
    statsTitle.textContent = "Характеристики:";
    statsContainer.appendChild(statsTitle);

    const statsList = document.createElement("ul");
    for(const key in variant.stats){
        const li = document.createElement("li");
        li.textContent = `${key}: ${variant.stats[key]}`;
        statsList.appendChild(li);
    }
    statsContainer.appendChild(statsList);
}

// Навигация фото
function nextImage(){
    if(!currentSet) return;
    const variant = currentSet.variants[currentVariantIndex];
    currentImageIndex = (currentImageIndex + 1) % variant.images.length;
    renderSet();
}
function prevImage(){
    if(!currentSet) return;
    const variant = currentSet.variants[currentVariantIndex];
    currentImageIndex = (currentImageIndex - 1 + variant.images.length) % variant.images.length;
    renderSet();
}

/* -------------------------------
   Вкладка артефактов
---------------------------------*/
let artifactActive = null;

const artifactListEl = document.getElementById("artifact-list");
const artifactSearch = document.getElementById("artifact-search");
const selectedArtifactsList = document.getElementById("selected-artifacts");
const resultDiv = document.getElementById("calculation-result");
const artifactPropertiesDiv = document.getElementById("artifact-properties");
const saveButton = document.getElementById("save-build");
const loadButton = document.getElementById("load-build");
const clearButton = document.getElementById("clear-build");
const artifactModal = document.getElementById("artifact-modal");
const openModalBtn = document.getElementById("confirm-artifact");
const modalCloseBtn = document.querySelector(".modal-content .close");

const tierValueEl = document.getElementById("tier-value");
const copiesValueEl = document.getElementById("copies-value");
const tierUpBtn = document.getElementById("tier-up");
const tierDownBtn = document.getElementById("tier-down");
const copiesUpBtn = document.getElementById("copies-up");
const copiesDownBtn = document.getElementById("copies-down");

let selectedArtifacts = [];
let allArtifacts = [];

const maxTier = 4;
const minTier = 1;

// Загрузка артефактов
fetch("data/artefact/art.json")
    .then(res=>res.json())
    .then(data=>{ allArtifacts = data; populateArtifactModal(allArtifacts); });

// Модальное окно
openModalBtn.onclick = ()=>{ artifactModal.style.display = "flex"; };
modalCloseBtn.onclick = ()=>{ artifactModal.style.display = "none"; };
window.onclick = e=>{ if(e.target===artifactModal) artifactModal.style.display="none"; };

// Поиск артефактов
artifactSearch.addEventListener("input", ()=>{
    const query = artifactSearch.value.toLowerCase();
    Array.from(artifactListEl.children).forEach(item=>{
        const name = item.dataset.name.toLowerCase();
        item.style.display = name.includes(query) ? "flex" : "none";
    });
});

// Очистка сборки
clearButton.addEventListener("click", ()=>{
    selectedArtifacts = [];
    artifactActive = null;
    updateSelectedList();
});

// Сохранение сборки
saveButton.addEventListener("click", ()=>{
    if(selectedArtifacts.length>0){
        localStorage.setItem("savedBuild", JSON.stringify(selectedArtifacts));
        alert("Сборка сохранена!");
    } else alert("Нет артефактов для сохранения.");
});

// Загрузка сборки
loadButton.addEventListener("click", ()=>{
    const saved = localStorage.getItem("savedBuild");
    if(saved){
        selectedArtifacts = JSON.parse(saved);
        artifactActive = selectedArtifacts[selectedArtifacts.length-1] || null;
        updateSelectedList();
        alert("Сборка загружена!");
    } else alert("Нет сохранённых сборок.");
});

// Добавление артефакта
function addArtifact(name){
    const artifactData = allArtifacts.find(a=>a["Имя"]===name);
    if(!artifactData) return;
    const artifactId = Date.now() + Math.random();
    const art = {id:artifactId, name:name, tier:1, copies:1};
    selectedArtifacts.push(art);
    artifactActive = art;
    updateSelectedList();
}

// Обновление списка выбранных артефактов
function updateSelectedList(){
    selectedArtifactsList.innerHTML = "";
    selectedArtifacts.forEach(art=>{
        const li = document.createElement("li");
        li.classList.add("artifact-item");
        if(artifactActive && art.id===artifactActive.id) li.classList.add("active");

        const container = document.createElement("div");
        container.classList.add("artifact-container");
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.onclick = ()=>{
            artifactActive = art;
            showArtifactProperties(art);
            updateSelectedList();
        };

        const artData = allArtifacts.find(a=>a["Имя"]===art.name);
        const variant = artData["Варианты"].find(v => v["Тир"]===art.tier) || artData["Варианты"][0];

        const imgSmall = document.createElement("img");
        imgSmall.src = variant?.images?.[0] || "";
        imgSmall.style.width = "24px";
        imgSmall.style.height = "24px";
        imgSmall.style.borderRadius = "4px";
        imgSmall.style.marginRight = "6px";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = `${art.name} x${art.copies}`;
        nameSpan.style.flexGrow = "1";

        const deleteBtn = document.createElement("span");
        deleteBtn.textContent = "✖";
        deleteBtn.classList.add("delete-artifact-btn");
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.color = "red";
        deleteBtn.style.marginLeft = "6px";
        deleteBtn.onclick = e => {
            e.stopPropagation();
            selectedArtifacts = selectedArtifacts.filter(a => a.id !== art.id);
            if(artifactActive && artifactActive.id===art.id) artifactActive = null;
            updateSelectedList();
        };

        container.appendChild(imgSmall);
        container.appendChild(nameSpan);
        container.appendChild(deleteBtn);
        li.appendChild(container);
        selectedArtifactsList.appendChild(li);
    });

    const totalCopies = selectedArtifacts.reduce((sum, art) => sum + art.copies, 0);
    document.getElementById("artifact-count").textContent = `Количество артефактов: ${totalCopies}`;

    if(artifactActive) showArtifactProperties(artifactActive);
    else artifactPropertiesDiv.innerHTML="Выберите артефакт";

    calculateStats();
    updateControls();
}

// Свойства артефакта: фото справа
function showArtifactProperties(art){
    const data = allArtifacts.find(a => a["Имя"]===art.name);
    if(!data) return;
    const variant = data["Варианты"].find(v=>v["Тир"]===art.tier) || data["Варианты"][0];

    artifactPropertiesDiv.innerHTML = "";

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.justifyContent = "space-between";
    container.style.alignItems = "flex-start";

    const textDiv = document.createElement("div");
    const h4 = document.createElement("h4");
    h4.textContent = `${art.name} (Тир ${art.tier})`;
    textDiv.appendChild(h4);

    for(let key in variant){
        if(key!=="Имя" && key!=="Тир" && key!=="images"){
            const p = document.createElement("p");
            p.textContent = `${key}: ${variant[key]}`;
            const value = Number(variant[key]) || 0;
            if(value>0) p.style.color="green";
            else if(value<0) p.style.color="red";
            else p.style.color="gray";
            textDiv.appendChild(p);
        }
    }

    const imgBig = document.createElement("img");
    imgBig.src = variant?.images?.[0] || "";
    imgBig.style.width = "48px";
    imgBig.style.height = "48px";
    imgBig.style.borderRadius = "6px";

    container.appendChild(textDiv);
    container.appendChild(imgBig);

    artifactPropertiesDiv.appendChild(container);
    updateControls();
}

// Обновление стрелок тир/копии
function updateControls(){
    const controls = [tierUpBtn, tierDownBtn, copiesUpBtn, copiesDownBtn];
    if(!artifactActive){
        controls.forEach(btn => btn.style.display="none");
        artifactPropertiesDiv.innerHTML = "Выберите артефакт";
    } else {
        controls.forEach(btn => btn.style.display="inline-block");
        tierValueEl.textContent = artifactActive.tier;
        copiesValueEl.textContent = artifactActive.copies;
    }
}

// Навигация стрелками
tierUpBtn.onclick = ()=>{ 
    if(!artifactActive) return;
    if(artifactActive.tier<maxTier) artifactActive.tier++; 
    updateSelectedList();
};
tierDownBtn.onclick = ()=>{ 
    if(!artifactActive) return;
    if(artifactActive.tier>minTier) artifactActive.tier--; 
    updateSelectedList();
};
copiesUpBtn.onclick = ()=>{ 
    if(!artifactActive) return;
    artifactActive.copies++; 
    updateSelectedList();
};
copiesDownBtn.onclick = ()=>{ 
    if(!artifactActive) return;
    if(artifactActive.copies>1) artifactActive.copies--; 
    updateSelectedList();
};

// Расчёт характеристик
function calculateStats(){
    const result={};
    let radiationOutput=0, radiationAccum=0;

    selectedArtifacts.forEach(art=>{
        const data = allArtifacts.find(a=>a["Имя"]===art.name);
        if(!data) return;
        const variant = data["Варианты"].find(v=>v["Тир"]===art.tier) || data["Варианты"][0];

        for(let key in variant){
            if(key!=="Имя" && key!=="Тир" && key!=="images"){
                const value = Number(variant[key]) || 0;
                const totalValue = value * art.copies;
                if(key==="Вывод радиации") radiationOutput+=totalValue;
                else if(key==="Накопление радиации") radiationAccum+=totalValue;
                else result[key]=(result[key]||0)+totalValue;
            }
        }
    });

    result["Радиация"]=radiationAccum-radiationOutput;
    displayResults(result);
}

// Результаты: только суммарные показатели
function displayResults(stats){
    resultDiv.innerHTML = "";
    for(let key in stats){
        const p = document.createElement("p");
        let color = stats[key] > 0 ? "green" : stats[key] < 0 ? "red" : "gray";
        if(key === "Температура") color = stats[key] < 0 ? "blue" : stats[key] > 0 ? "red" : "green";
        if(key === "Радиация") color = stats[key] > 0 ? "red" : stats[key] < 0 ? "green" : "gray";
        p.style.color = color;
        p.textContent = `${key}: ${stats[key]}`;
        resultDiv.appendChild(p);
    }
}

// Модальное окно: список артефактов с фото слева и названием по центру
function populateArtifactModal(artifacts){
    artifactListEl.innerHTML="";
    artifacts.forEach(a=>{
        const div = document.createElement("div");
        div.classList.add("artifact-item");
        div.dataset.name = a["Имя"];
        div.style.display="flex";
        div.style.alignItems="center";
        div.style.padding="4px 6px";

        const imgSmall = document.createElement("img");
        imgSmall.src = a["Варианты"]?.[0]?.images?.[0] || "";
        imgSmall.style.width="24px";
        imgSmall.style.height="24px";
        imgSmall.style.borderRadius = "4px";
        imgSmall.style.marginRight = "8px";

        const nameContainer = document.createElement("div");
        nameContainer.style.flexGrow = "1";
        nameContainer.style.display = "flex";
        nameContainer.style.justifyContent = "center"; // текст по центру
        nameContainer.textContent = a["Имя"];

        div.appendChild(imgSmall);
        div.appendChild(nameContainer);

        div.onclick = ()=>{ addArtifact(a["Имя"]); artifactModal.style.display="none"; };
        artifactListEl.appendChild(div);
    });
}
