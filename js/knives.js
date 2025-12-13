const list = document.getElementById("knifeList");
const view = document.getElementById("knifeView");

fetch("data/knives.json")
    .then(res => res.json())
    .then(knives => {

        knives.forEach((knife, index) => {
            const item = document.createElement("div");
            item.className = "knife-item";
            item.textContent = knife.name;

            item.addEventListener("click", () => {
                document.querySelectorAll(".knife-item")
                    .forEach(el => el.classList.remove("active"));

                item.classList.add("active");

                view.innerHTML = `
                    <h2 class="knife-title">${knife.name}</h2>
                    <img src="${knife.image}" alt="${knife.name}">
                    <div class="knife-desc">${knife.description}</div>
                `;
            });

            list.appendChild(item);

            if (index === 0) item.click();
        });

    })
    .catch(err => {
        view.innerHTML = "<p>Ошибка загрузки данных</p>";
        console.error(err);
    });