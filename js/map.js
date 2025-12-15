document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("mapCanvas");
    const ctx = canvas.getContext("2d");

    const btns = document.querySelectorAll(".map-buttons button");
    const toggleRadiation = document.getElementById("toggle-radiation");
    const toggleLevels = document.getElementById("toggle-levels");
    const levelsDiv = document.getElementById("radiation-levels");
    const levelCheckboxes = levelsDiv.querySelectorAll("input[type=checkbox]");

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

    let radiationFilters = { green: true, yellow: true, orange: true, red: true };
    let showRadiation = true;

    // -----------------------
    // Кнопки выбора карты
    btns.forEach(btn => {
        btn.onclick = () => loadMap(btn.dataset.map);
    });

    // Вкл/выкл радиации
    toggleRadiation.addEventListener('click', () => {
        showRadiation = !showRadiation;
        toggleRadiation.textContent = `Радиация: ${showRadiation ? 'Вкл' : 'Выкл'}`;
    });

    // Показ/скрытие уровней
    toggleLevels.addEventListener('click', () => {
        levelsDiv.style.display = levelsDiv.style.display === 'flex' ? 'none' : 'flex';
    });

    // Фильтры по уровням радиации
    levelCheckboxes.forEach(cb => {
        cb.addEventListener('change', e => {
            radiationFilters[e.target.dataset.filter] = e.target.checked;
        });
    });

    // -----------------------
    function loadMap(mapKey) {
        if (!maps[mapKey]) return;

        currentMap = mapKey;
        tilesCache = {};
        tilesQueue = [];
        mapData = [];

        const mapInfo = maps[mapKey];

        // Загружаем радиацию
        fetch(mapInfo.json + "?v=" + Date.now())
            .then(res => res.json())
            .then(data => {
                mapData = data.zone.map(z => {
                    const coords = z.position.split(",").map(Number);
                    return { x: coords[0], z: coords[2], radius: z.radius, damage: z.damage };
                });
            });

        // Очередь тайлов
        for (let ty = 0; ty < mapInfo.tilesY; ty++) {
            for (let tx = 0; tx < mapInfo.tilesX; tx++) {
                tilesQueue.push({ tx, ty });
            }
        }

        mapScale = mapScaleLimits[mapKey].min;
        offsetX = 0;
        offsetY = 0;
    }

    // -----------------------
    function getVisibleTiles() {
        if (!currentMap) return [];
        const mapInfo = maps[currentMap];
        const visible = [];
        for (let ty = 0; ty < mapInfo.tilesY; ty++) {
            for (let tx = 0; tx < mapInfo.tilesX; tx++) {
                const tileLeft = tx * mapInfo.tileSize * mapScale + offsetX;
                const tileTop = ty * mapInfo.tileSize * mapScale + offsetY;
                const tileRight = tileLeft + mapInfo.tileSize * mapScale;
                const tileBottom = tileTop + mapInfo.tileSize * mapScale;

                if (tileRight < 0 || tileBottom < 0 || tileLeft > canvas.width || tileTop > canvas.height) continue;
                visible.push({ tx, ty, x: tileLeft, y: tileTop });
            }
        }
        return visible;
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!currentMap) return;

        const mapInfo = maps[currentMap];

        // Загружаем тайлы по 3 за кадр
        for (let i = 0; i < 3 && tilesQueue.length; i++) {
            const vt = tilesQueue.shift();
            const key = `${vt.tx}_${vt.ty}`;
            if (!tilesCache[key]) {
                const offCanvas = document.createElement('canvas');
                offCanvas.width = mapInfo.tileSize;
                offCanvas.height = mapInfo.tileSize;
                const img = new Image();
                img.src = `${mapInfo.folder}/tile_${vt.tx}_${vt.ty}.png`;
                img.onload = () => {
                    offCanvas.getContext('2d').drawImage(img, 0, 0);
                    tilesCache[key] = offCanvas;
                };
            }
        }

        // Отрисовка тайлов
        getVisibleTiles().forEach(vt => {
            const tile = tilesCache[`${vt.tx}_${vt.ty}`];
            if (!tile) return;
            ctx.drawImage(tile, vt.x, vt.y, mapInfo.tileSize * mapScale, mapInfo.tileSize * mapScale);
        });

        // Радиоактивные зоны
        if (showRadiation) drawRadiation();

        requestAnimationFrame(draw);
    }

    function drawRadiation() {
        if (!mapData || !currentMap) return;
        const mapInfo = maps[currentMap];

        mapData.forEach(pt => {
            const steps = [
                { dist: 0, val: pt.damage },
                { dist: pt.radius * 0.2, val: pt.damage * 0.7 },
                { dist: pt.radius * 0.5, val: pt.damage * 0.4 },
                { dist: pt.radius * 0.8, val: pt.damage * 0.2 },
                { dist: pt.radius, val: 0 }
            ];

            const screenX = offsetX + pt.x * mapScale;
            const screenY = offsetY + (mapInfo.tilesY * mapInfo.tileSize - pt.z) * mapScale;

            for (let i = 1; i < steps.length; i++) {
                const innerR = steps[i - 1].dist * mapScale;
                const outerR = steps[i].dist * mapScale;
                const color = getRadiationColor(steps[i].val);
                if (!radiationFilters[color]) continue;

                ctx.beginPath();
                ctx.arc(screenX, screenY, outerR, 0, Math.PI * 2);
                ctx.arc(screenX, screenY, innerR, 0, Math.PI * 2, true);
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.4;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
    }

    function getRadiationColor(value) {
        if (value <= 200) return 'green';
        if (value <= 400) return 'yellow';
        if (value <= 600) return 'orange';
        return 'red';
    }

    // -----------------------
    // Перетаскивание
    canvas.onmousedown = e => { dragging = true; dragStartX = e.clientX - offsetX; dragStartY = e.clientY - offsetY; };
    canvas.onmouseup = () => { dragging = false; };
    canvas.onmouseleave = () => { dragging = false; };
    canvas.onmousemove = e => {
        if (dragging) {
            offsetX = e.clientX - dragStartX;
            offsetY = e.clientY - dragStartY;
            clampOffset();
        }
    };

    // -----------------------
    // Зум
    canvas.onwheel = e => {
        e.preventDefault();
        if (!currentMap) return;

        const scaleAmount = e.deltaY * -0.001;
        const newScale = mapScale * (1 + scaleAmount);

        const limits = mapScaleLimits[currentMap];
        const clampedScale = Math.min(Math.max(newScale, limits.min), limits.max);

        // Масштабирование относительно центра канваса
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        offsetX -= (centerX - offsetX) * (clampedScale / mapScale - 1);
        offsetY -= (centerY - offsetY) * (clampedScale / mapScale - 1);

        mapScale = clampedScale;
        clampOffset();
    };

    // -----------------------
    function clampOffset() {
        if (!currentMap) return;
        const mapInfo = maps[currentMap];
        const mapWidth = mapInfo.tilesX * mapInfo.tileSize * mapScale;
        const mapHeight = mapInfo.tilesY * mapInfo.tileSize * mapScale;

        if (mapWidth < canvas.width) offsetX = (canvas.width - mapWidth) / 2;
        else offsetX = Math.min(0, Math.max(offsetX, canvas.width - mapWidth));

        if (mapHeight < canvas.height) offsetY = (canvas.height - mapHeight) / 2;
        else offsetY = Math.min(0, Math.max(offsetY, canvas.height - mapHeight));
    }

    // -----------------------
    function resizeCanvas() {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.85;
        clampOffset();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    loadMap("DZ");
    draw();
});