document.addEventListener("DOMContentLoaded", () => {
    const listContainer = document.getElementById("anomalies-list");

    const detailName = document.querySelector("#anomaly-detail h2");
    const detailImage = document.getElementById("anomaly-image");
    const detailVideo = document.getElementById("anomaly-video");
    const detailVideoSource = document.getElementById("anomaly-video-source");
    const detailDescription = document.getElementById("anomaly-description");

    // Загружаем JSON с реальными путями
    fetch("data/anomalies.json")
        .then(res => {
            if (!res.ok) throw new Error("Не удалось загрузить JSON");
            return res.json();
        })
        .then(data => {
            data.forEach((anomaly) => {
                const li = document.createElement("li");
                li.textContent = anomaly.name;

                li.addEventListener("click", () => {
                    // Снимаем активный класс
                    document.querySelectorAll(".anomaly-list li")
                        .forEach(el => el.classList.remove("active"));
                    li.classList.add("active");

                    // Заголовок и описание
                    detailName.textContent = anomaly.name;
                    detailDescription.textContent = anomaly.description;

                    // Скрываем оба элемента перед отображением
                    detailImage.style.display = "none";
                    detailVideo.style.display = "none";

                    // Если есть видео
                    if (anomaly.video) {
                        // Автоматически заменяем "image/" на "images/", если нужно
                        let videoPath = anomaly.video.replace(/^image\//, "images/");
                        detailVideoSource.src = videoPath;
                        detailVideo.load();
                        detailVideo.style.display = "block";
                        return;
                    }

                    // Если есть фото
                    if (anomaly.image) {
                        // Автоматически заменяем "image/" на "images/", если нужно
                        let imagePath = anomaly.image.replace(/^image\//, "images/");
                        detailImage.src = imagePath;
                        detailImage.alt = anomaly.name;
                        detailImage.style.display = "block";
                    }
                });

                listContainer.appendChild(li);
            });
        })
        .catch(err => console.error("Ошибка загрузки JSON:", err));
});