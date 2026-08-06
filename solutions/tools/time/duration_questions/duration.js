function pad(n) {
    return n.toString().padStart(2, '0');
  }
  
  function minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${pad(h)}:${pad(m)}`;
  }
  
  function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }
  
  function randomTimeBetween(min = 360, max = 1080) {
    const mins = Math.floor(Math.random() * (max - min)) + min;
    return minutesToTime(mins);
  }
  
  function randomDuration(min = 20, max = 200) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

    function normalize24Time(value) {
      const trimmed = (value || '').trim();
      const match = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
      if (!match) return null;

      const h = Number(match[1]);
      const m = Number(match[2]);
      if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        return null;
      }

      return `${pad(h)}:${pad(m)}`;
    }

    function setupDesktop24HourInputs() {
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      if (isMobile) return;

      ["a1", "a2", "a3"].forEach((id) => {
        const input = document.getElementById(id);
        input.type = "text";
        input.inputMode = "numeric";
        input.placeholder = "HH:MM";
        input.pattern = "^([01]\\d|2[0-3]):[0-5]\\d$";
        input.maxLength = 5;

        input.addEventListener("input", () => {
          const digits = input.value.replace(/\D/g, "").slice(0, 4);

          if (digits.length >= 3) {
            input.value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
            return;
          }

          if (digits.length === 2) {
            input.value = `${digits}:`;
            return;
          }

          input.value = digits;
        });

        input.addEventListener("blur", () => {
          const normalized = normalize24Time(input.value);
          if (normalized) {
            input.value = normalized;
          }
        });
      });
    }
  
  function generateQuestions() {
    const q1Start = randomTimeBetween();
    const q1DurationMin = randomDuration();
    const q1Arrival = minutesToTime(timeToMinutes(q1Start) + q1DurationMin);
  
    const q2Train = randomTimeBetween();
    const q2WalkMin = randomDuration();
    const q2Leave = minutesToTime(timeToMinutes(q2Train) - q2WalkMin);
  
    let q3StartMin, q3EndMin;
    do {
      q3StartMin = timeToMinutes(randomTimeBetween());
      const dur = randomDuration();
      q3EndMin = q3StartMin + dur;
    } while (q3EndMin > 1439); // max 23:59
    const q3Start = minutesToTime(q3StartMin);
    const q3End = minutesToTime(q3EndMin);
    const q3Duration = q3EndMin - q3StartMin;
    const q3DurationStr = minutesToTime(q3Duration);
  
    document.getElementById("q1").textContent =
      `1. Ha a lány ${q1Start}-kor indul el otthonról, és ${minutesToTime(q1DurationMin)} percet utazik az iskoláig. Mikor ér oda? (óra:perc)`;
  
    document.getElementById("q2").textContent =
      `2. Ha a fiú vonata ${q2Train}-kor indul az állomásról, és a fiúnak ${minutesToTime(q2WalkMin)} perc kell, hogy az állomásra érjen. Mikor kell elindulnia?`;
  
    document.getElementById("q3").textContent =
      `3. Ha a focimeccs ${q3Start}-kor kezdődik, és ${q3End}-kor ér véget. Mennyi ideig tartott? (óra:perc formátum, tehát, ha pl 85 perc, akkor 01:25-öt írj be)`;
  
    // Tároljuk a helyes válaszokat
    window.currentAnswers = {
      q1Arrival,
      q2Leave,
      q3DurationStr
    };
  
    // Mezők és eredmények törlése
    document.getElementById("a1").value = '';
    document.getElementById("a2").value = '';
    document.getElementById("a3").value = '';
    document.getElementById("results").innerHTML = '';
  }
  
  document.getElementById("testForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const a1 = normalize24Time(document.getElementById("a1").value);
    const a2 = normalize24Time(document.getElementById("a2").value);
    const a3 = normalize24Time(document.getElementById("a3").value);

    if (!a1 || !a2 || !a3) {
      document.getElementById("results").innerHTML = "Kérlek, 24 órás formátumban add meg az időt: HH:MM";
      return;
    }
  
    const res = [];
    res.push(`1. ${a1 === window.currentAnswers.q1Arrival ? "✔️" : `❌ Helyes válasz: ${window.currentAnswers.q1Arrival}`}`);
    res.push(`2. ${a2 === window.currentAnswers.q2Leave ? "✔️" : `❌ Helyes válasz: ${window.currentAnswers.q2Leave}`}`);
    res.push(`3. ${a3 === window.currentAnswers.q3DurationStr ? "✔️" : `❌ Helyes válasz: ${window.currentAnswers.q3DurationStr}`}`);
  
    document.getElementById("results").innerHTML = res.join("<br>");
  });
  
  document.getElementById("generateNew").addEventListener("click", generateQuestions);

  setupDesktop24HourInputs();
  
  // Első betöltéskor generáljon kérdéseket
  generateQuestions();
  