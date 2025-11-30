const editBtn = document.getElementById('edit-btn');
const content = document.getElementById('content');

editBtn.addEventListener('click', () => {
    if (!content.isContentEditable) {
        content.contentEditable = "true";
        content.focus();
        editBtn.textContent = "Сохранить";
        editBtn.style.backgroundColor = "#d48800"; // чуть темнее при сохранении
    } else {
        content.contentEditable = "false";
        editBtn.textContent = "Редактировать";
        editBtn.style.backgroundColor = "#ffb000";
        localStorage.setItem('wikiContent', content.innerHTML);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const savedContent = localStorage.getItem('wikiContent');
    if (savedContent) {
        content.innerHTML = savedContent;
    }
});
