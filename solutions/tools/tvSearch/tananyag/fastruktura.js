// fastruktura.js
// Interaktív részletes nézet kezelése a fastruktura.xhtml-hez

document.addEventListener('DOMContentLoaded', function () {
    // Gyűjtsük be az összes részletes <div>-et (id: d1, d2, ...)
    const detailDivs = Array.from(document.querySelectorAll('div[id^="d"]'));
    // Gyűjtsük be az összes <a> bookmarkot a <pre> szekcióban
    const pre = document.querySelector('pre');
    const bookmarks = pre ? Array.from(pre.querySelectorAll('a[href^="#d"]')) : [];

    // Létrehozunk egy gombot az oldal tetejére
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Összes részletes mutatása/elrejtése';
    toggleBtn.style.margin = '1em';
    let allVisible = false;
    document.body.insertBefore(toggleBtn, document.body.firstChild);

    // Alapértelmezés: minden részletes div rejtve
    function hideAllDetails() {
        detailDivs.forEach(div => {
            div.style.display = 'none';
        });
    }
    function showAllDetails() {
        detailDivs.forEach(div => {
            div.style.display = 'block';
        });
    }
    hideAllDetails();

    // Gomb esemény: összes részletes div mutatása/elrejtése
    toggleBtn.addEventListener('click', function () {
        allVisible = !allVisible;
        if (allVisible) {
            showAllDetails();
        } else {
            hideAllDetails();
        }
    });

    // Bookmark események: csak a megfelelő div legyen látható
    bookmarks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            hideAllDetails();
            const targetDiv = document.getElementById(targetId);
            if (targetDiv) {
                targetDiv.style.display = 'block';
                // Görgessünk a részletes szekcióhoz
                targetDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            allVisible = false;
        });
    });
});
