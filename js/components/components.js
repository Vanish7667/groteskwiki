/*
  Copyright (c) 2025 Vanish7667 and bartholomewlaw
  All Rights Reserved
*/

document.addEventListener('DOMContentLoaded', () => {
    const loadComponent = (selector, url) => {
        const el = document.querySelector(selector);
        if (!el) return;
        fetch(url)
            .then(res => res.text())
            .then(html => el.innerHTML = html)
            .then(() => {
                if (selector === '#nav') highlightActiveTab();
            })
            .catch(err => console.error(`Ошибка загрузки ${url}:`, err));
    };

    loadComponent('#footer', '/components/footer.html');
    loadComponent('#nav', '/components/nav.html');
    loadComponent('#garland', '/components/garland.html');

    function highlightActiveTab() {
        const path = window.location.pathname.split("/").pop();
        document.querySelectorAll('#nav a').forEach(a => {
            if (a.getAttribute('href') === path) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }
});