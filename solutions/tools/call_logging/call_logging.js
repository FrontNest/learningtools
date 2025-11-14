function copyTable() {
  const table = document.getElementById('myTable');
  let tableText = '';

  // Bejárja a táblázatot
  for (let i = 0; i < table.rows.length; i++) {
      const label = table.rows[i].cells[0].innerText; // Az első cella tartalmazza a labelt
      const input = table.rows[i].cells[1].querySelector('input, textarea'); // Második cella: input vagy textarea

      // Csak a kitöltött mezőket másoljuk
      if (input && input.value.trim()) {
          tableText += `${label} ${input.value}\n`; // Ha van érték, hozzáadjuk a labelt és az értéket
      }
  }

  // Vágólapra másolás
  navigator.clipboard.writeText(tableText).then(() => {
      showConfirmation(); // Visszaigazoló üzenet megjelenítése
  }).catch(err => {
      console.error('Hiba a vágólapra másoláskor: ', err);
  });

  // Beviteli mezők visszaállítása alapállapotra
  resetInputs();
}

// Visszaigazoló üzenet megjelenítése
function showConfirmation() {
  const confirmation = document.createElement('div');
  confirmation.innerText = 'Az adatok vágólapra másolva';
  confirmation.style.position = 'fixed';
  confirmation.style.top = '50%';
  confirmation.style.left = '50%';
  confirmation.style.transform = 'translate(-50%, -50%)';
  confirmation.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  confirmation.style.color = 'white';
  confirmation.style.padding = '20px';
  confirmation.style.borderRadius = '5px';
  confirmation.style.zIndex = '1000';
  document.body.appendChild(confirmation);

  // Üzenet eltüntetése
  setTimeout(() => {
      confirmation.remove();
  }, 3000); // 3 másodperc után eltűnik

  // Eltüntetjük a visszaigazoló üzenetet, ha a felhasználó elnavigál, frissít, vagy Ctrl+V-t nyom
  window.addEventListener('beforeunload', () => confirmation.remove());
  document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'v') {
          confirmation.remove();
      }
  });
}

// Beviteli mezők alaphelyzetbe állítása, méret visszaállítása
function resetInputs() {
  const inputs = document.querySelectorAll('#myTable input, #myTable textarea');
  inputs.forEach(input => {
      input.value = input.defaultValue; // Visszaállítjuk az alapértelmezett értéket
      input.style.width = '100%'; // Eredeti szélesség beállítása
      if (input.tagName.toLowerCase() === 'textarea') {
          input.style.height = 'auto'; // Eredeti magasság beállítása
          input.rows = 3; // Textarea eredeti sorainak száma
      }
  });
  
  // Kurzort az első beviteli mezőbe állítjuk
  const firstInput = document.querySelector('#myTable input');
  if (firstInput) {
      firstInput.focus();
  }
}

// Ctrl+S billentyűkombináció figyelése
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 's') {
      event.preventDefault(); // Megakadályozza az alapértelmezett mentési funkciót
      copyTable(); // Meghívja a vágólapra másolás funkciót
  }
});

// Add event listener for button click
const copyButton = document.getElementById('copyButton'); // Ensure you have a button with this ID
if (copyButton) {
  copyButton.addEventListener('click', copyTable);
}

// Add event listener for Enter key on input fields
/*const inputs = document.querySelectorAll('#myTable input, #myTable textarea');
inputs.forEach(input => {
  input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission if inside a form
      copyTable(); // Call the copy function
    }
  });
}); */
