document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector("nav ul");
    if (toggle) {
        toggle.addEventListener("click", () => {
            menu.style.display = menu.style.display === "flex" ? "none" : "flex";
        });
    }
});