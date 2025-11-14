// main_script.js BCK


// Egységesített logika az iframe tartalmának frissítésére

document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.profile-info a, .side-nav-links a'); // Navigációs linkek
    const iframe = document.getElementById('mainFrame'); // Az iframe elem

    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault(); // Alapértelmezett link viselkedés megakadályozása
            const targetUrl = link.getAttribute('href'); // Cél URL lekérése
            iframe.src = targetUrl; // Az iframe tartalmának frissítése
        });
    });
});


