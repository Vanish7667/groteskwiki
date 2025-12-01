const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

const btnDZ = document.getElementById("btn-dayzone");
const btnNX = document.getElementById("btn-newhorizon");

let mapScale = 0.04;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;

let currentMap = null;
let tilesCache = {};
let tilesQueue = [];
let mapData = [];

const maps = {
    "DZ": { folder: "images/map/tiles_DZ", tilesX: 20, tilesY: 20, tileSize: 512, json: "data/map/radiation/DZ_Rad.json" },
    "NX": { folder: "images/map/tiles_NX", tilesX: 40, tilesY: 40, tileSize: 512, json: "data/map/radiation/NX_Rad.json" }
};

const mapScaleLimits = {
    "DZ": { min: 0.1, max: 4 },
    "NX": { min: 0.05, max: 4 }
};

let radiationFilters = {
    green: true,
    yellow: true,
    orange: true,
    red: true
};

let showRadiation = true;

// -----------------------
// Панель фильтров (HTML элементы)
const filterGreen = document.getElementById('filter-green');
const filterYellow = document.getElementById('filter-yellow');
const filterOrange = document.getElementById('filter-orange');
const filterRed = document.getElementById('filter-red');

const toggleRadiation = document.getElementById('toggle-radiation');
const levelsDiv = document.getElementById('radiation-levels');

// Управление включением/выключением радиации
toggleRadiation.addEventListener('click', () => {
    showRadiation = !showRadiation;
    toggleRadiation.textContent = `Радиация: ${showRadiation ? 'Вкл' : 'Выкл'}`;
});

// Фильтры по уровням радиации
filterGreen.addEventListener('change', e => radiationFilters.green = e.target.checked);
filterYellow.addEventListener('change', e => radiationFilters.yellow = e.target.checked);
filterOrange.addEventListener('change', e => radiationFilters.orange = e.target.checked);
filterRed.addEventListener('change', e => radiationFilters.red = e.target.checked);

// Кнопка для открытия/скрытия уровней радиации отдельно
const levelToggleBtn = document.createElement('button');
levelToggleBtn.textContent = 'Уровни ▼';
levelToggleBtn.style.marginTop = '5px';
levelToggleBtn.onclick = () => {
    levelsDiv.style.display = levelsDiv.style.display === 'flex' ? 'none' : 'flex';
};
toggleRadiation.parentNode.insertBefore(levelToggleBtn, levelsDiv);

// -----------------------
// Кнопки карты
btnDZ.onclick = () => loadMap("DZ");
btnNX.onclick = () => loadMap("NX");

// -----------------------
// Загрузка карты
function loadMap(mapKey){
    currentMap = mapKey;
    tilesCache = {};
    tilesQueue = [];
    mapData = [];

    // Загружаем радиацию
    fetch(maps[mapKey].json+"?v="+Date.now())
        .then(res=>res.json())
        .then(data=>{
            mapData = data.zone.map(z=>{
                const coords = z.position.split(",").map(Number);
                return { x: coords[0], z: coords[2], radius: z.radius, damage: z.damage };
            });
        });

    // Создаём очередь тайлов
    const mapInfo = maps[mapKey];
    for(let ty=0; ty<mapInfo.tilesY; ty++){
        for(let tx=0; tx<mapInfo.tilesX; tx++){
            tilesQueue.push({tx,ty});
        }
    }
}

// -----------------------
// Отрисовка тайлов и карты
function getVisibleTiles(){
    const mapInfo = maps[currentMap];
    const visible=[];
    for(let ty=0;ty<mapInfo.tilesY;ty++){
        for(let tx=0;tx<mapInfo.tilesX;tx++){
            const tileLeft = tx*mapInfo.tileSize*mapScale + offsetX;
            const tileTop = ty*mapInfo.tileSize*mapScale + offsetY;
            const tileRight = tileLeft+mapInfo.tileSize*mapScale;
            const tileBottom = tileTop+mapInfo.tileSize*mapScale;
            if(tileRight<0||tileBottom<0||tileLeft>canvas.width||tileTop>canvas.height) continue;
            visible.push({tx,ty,x:tileLeft,y:tileTop});
        }
    }
    return visible;
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!currentMap) return;

    const mapInfo = maps[currentMap];
    for(let i=0;i<3&&tilesQueue.length;i++){
        const vt = tilesQueue.shift();
        const key = `${vt.tx}_${vt.ty}`;
        if(!tilesCache[key]){
            const offCanvas=document.createElement('canvas');
            offCanvas.width=mapInfo.tileSize;
            offCanvas.height=mapInfo.tileSize;
            const img=new Image();
            img.src=`${mapInfo.folder}/tile_${vt.tx}_${vt.ty}.png`;
            img.onload=()=>{offCanvas.getContext('2d').drawImage(img,0,0);tilesCache[key]=offCanvas;};
        }
    }

    const visibleTiles = getVisibleTiles();
    visibleTiles.forEach(vt=>{
        const tile=tilesCache[`${vt.tx}_${vt.ty}`];
        if(!tile) return;
        ctx.drawImage(tile, vt.x, vt.y, mapInfo.tileSize*mapScale, mapInfo.tileSize*mapScale);
    });

    if(showRadiation) drawRadiation();

    requestAnimationFrame(draw);
}

// -----------------------
// Радиоактивные кружки (donut)
function drawRadiation(){
    if(!mapData || !currentMap) return;
    const mapInfo = maps[currentMap];

    mapData.forEach(pt=>{
        const steps=[
            {dist:0,val:pt.damage},
            {dist:20,val:pt.damage*(1-20/200)},
            {dist:50,val:pt.damage*(1-50/200)},
            {dist:100,val:pt.damage*(1-100/200)},
            {dist:150,val:pt.damage*(1-150/200)},
            {dist:180,val:pt.damage*(1-180/200)},
            {dist:200,val:0}
        ];

        steps.forEach((s,i)=>{
            if(i===steps.length-1) return;
            const color=getRadiationColor(s.val);
            if(!radiationFilters[color]) return;

            const screenX = offsetX + pt.x*mapScale;
            const screenY = offsetY + (mapInfo.tilesY*mapInfo.tileSize - pt.z)*mapScale;
            const outerR = s.dist*mapScale;
            const innerR = i===0?0:steps[i-1].dist*mapScale;

            ctx.beginPath();
            ctx.arc(screenX,screenY,outerR,0,Math.PI*2);
            ctx.arc(screenX,screenY,innerR,0,Math.PI*2,true);
            ctx.fillStyle=color;
            ctx.globalAlpha=0.4;
            ctx.fill();
            ctx.globalAlpha=1;

            ctx.fillStyle='#fff';
            ctx.font='12px Share Tech Mono';
            ctx.textAlign='center';
            ctx.textBaseline='middle';
            ctx.fillText(Math.round(s.val),screenX,screenY - outerR + (outerR-innerR)/2);
        });
    });
}

function getRadiationColor(value){
    if(value<=200) return 'green';
    if(value<=400) return 'yellow';
    if(value<=600) return 'orange';
    return 'red';
}

// -----------------------
// Перетаскивание
canvas.onmousedown=e=>{dragging=true;dragStartX=e.clientX-offsetX;dragStartY=e.clientY-offsetY;};
canvas.onmouseup=()=>{dragging=false;};
canvas.onmouseleave=()=>{dragging=false;};
canvas.onmousemove=e=>{if(dragging){offsetX=e.clientX-dragStartX;offsetY=e.clientY-dragStartY;clampOffset();}};

// -----------------------
// Зум
canvas.onwheel=e=>{
    e.preventDefault();
    const scaleAmount=e.deltaY*-0.001;
    const newScale=mapScale*(1+scaleAmount);
    const mouseX=e.offsetX;
    const mouseY=e.offsetY;

    offsetX-=(mouseX-offsetX)*(newScale/mapScale-1);
    offsetY-=(mouseY-offsetY)*(newScale/mapScale-1);

    if(currentMap){
        const limits=mapScaleLimits[currentMap];
        mapScale=Math.min(Math.max(newScale,limits.min),limits.max);
    }
    clampOffset();
};

// -----------------------
// Ограничение смещения
function clampOffset(){
    if(!currentMap) return;
    const mapInfo=maps[currentMap];
    const mapWidth=mapInfo.tilesX*mapInfo.tileSize*mapScale;
    const mapHeight=mapInfo.tilesY*mapInfo.tileSize*mapScale;

    if(mapWidth<canvas.width) offsetX=(canvas.width-mapWidth)/2;
    else offsetX=Math.min(0,Math.max(offsetX,canvas.width-mapWidth));

    if(mapHeight<canvas.height) offsetY=(canvas.height-mapHeight)/2;
    else offsetY=Math.min(0,Math.max(offsetY,canvas.height-mapHeight));
}

// -----------------------
// Resize
function resizeCanvas(){
    canvas.width=window.innerWidth*0.9;
    canvas.height=window.innerHeight*0.9;
    clampOffset();
}

// -----------------------
// Инициализация
window.addEventListener('resize',resizeCanvas);
window.addEventListener('load',()=>{
    resizeCanvas();
    loadMap("DZ");
    draw();
});
