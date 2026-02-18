document.addEventListener("DOMContentLoaded", () => {
  // 1. SETUP VARIABEL
  const cover = document.getElementById("opening-cover");
  const main = document.getElementById("main-content");
  const btnOpen = document.getElementById("btn-open");
  const musicBtn = document.getElementById("music-btn");
  const bgMusic = document.getElementById("bg-music");
  const guestName = new URLSearchParams(window.location.search).get("to");

  // Set Nama Tamu
  if (guestName) {
    document.getElementById("guest-name").textContent = decodeURIComponent(guestName);
  }

  // 2. BUKA UNDANGAN
  btnOpen.addEventListener("click", () => {
    // Efek visual buka
    cover.style.transform = "translateY(-100%)";
    cover.style.opacity = "0";

    // Tampilkan konten utama
    main.classList.remove("hidden");
    setTimeout(() => {
      main.style.opacity = "1";
      initObserver(); // Mulai animasi scroll setelah buka

      // Play Musik
      bgMusic
        .play()
        .then(() => {
          musicBtn.classList.remove("hidden");
        })
        .catch((err) => {
          // Auto-play biasanya diblokir browser, tampilkan tombol play manual
          musicBtn.classList.remove("hidden");
          musicBtn.innerHTML = '<i class="fas fa-play"></i>';
          musicBtn.classList.remove("animate-spin-slow");
        });
    }, 500);
  });

  // 3. KONTROL MUSIK
  let isPlaying = true;
  musicBtn.addEventListener("click", () => {
    if (isPlaying) {
      bgMusic.pause();
      musicBtn.innerHTML = '<i class="fas fa-play"></i>';
      musicBtn.classList.remove("animate-spin-slow");
    } else {
      bgMusic.play();
      musicBtn.innerHTML = '<i class="fas fa-music"></i>';
      musicBtn.classList.add("animate-spin-slow");
    }
    isPlaying = !isPlaying;
  });

  // 4. ANIMASI SCROLL (INTERSECTION OBSERVER)
  function initObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 },
    );

    document.querySelectorAll(".fade-in-up").forEach((el) => observer.observe(el));
  }

  // 5. COUNTDOWN
  const targetDate = new Date("March 24, 2026 08:00:00").getTime();
  setInterval(() => {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff < 0) return;

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const itemClass = "flex flex-col items-center bg-dn-navy/50 border border-gold-foil/20 rounded p-4 w-20 md:w-24 backdrop-blur-sm";
    const numClass = "text-3xl md:text-4xl leading-none text-white";
    const labelClass = "text-[10px] uppercase tracking-widest text-gray-400 mt-2";

    document.getElementById("countdown").innerHTML = `
      <div class="${itemClass}"><span class="${numClass}">${d}</span><span class="${labelClass}">Hari</span></div>
      <div class="${itemClass}"><span class="${numClass}">${h}</span><span class="${labelClass}">Jam</span></div>
      <div class="${itemClass}"><span class="${numClass}">${m}</span><span class="${labelClass}">Menit</span></div>
    `;
  }, 1000);

  // 6. CLIPBOARD COPY
  window.copyToClipboard = (id, val) => {
    navigator.clipboard.writeText(val).then(() => {
      const toast = document.getElementById("toast");
      toast.classList.remove("opacity-0", "-translate-y-10");
      setTimeout(() => toast.classList.add("opacity-0", "-translate-y-10"), 2000);
    });
  };

  // 7. WISHES SYSTEM (MOCKUP + GOOGLE SHEETS INTEGRATION PLACEHOLDER)
  const wishesList = document.getElementById("wishes-list");
  const form = document.getElementById("wishes-form");

  // URL Google Script Anda (Ganti dengan URL asli)
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOgtwuFp8fj2vM4dVvyPTOHiM7yNgZu1n4vz3s_uSEIs8zOzNIdRZjhJi7vVU_JlIxZg/exec";

  const addWishToDom = (name, msg, date = "Baru saja") => {
    const div = document.createElement("div");
    div.className = "p-4 bg-dn-midnight/60 border-l-2 border-gold-foil rounded-r animate-float";
    div.style.animationDuration = Math.random() * 2 + 3 + "s"; // Random float speed
    div.innerHTML = `
        <div class="flex justify-between items-end mb-2">
           <h4 class="font-display text-gold-pale text-lg">${name}</h4>
           <span class="text-[10px] text-gray-500 font-main">${date}</span>
        </div>
        <p class="text-gray-300 font-main text-sm leading-relaxed">"${msg}"</p>
     `;
    wishesList.prepend(div);
  };

  // Load Initial (Fetch from API)
  fetch(SCRIPT_URL)
    .then((r) => r.json())
    .then((data) => {
      wishesList.innerHTML = "";
      if (data.length) data.forEach((d) => addWishToDom(d.name, d.message, d.date));
      else wishesList.innerHTML = '<p class="text-center text-gray-500 text-xs">Jadilah yang pertama mengirim ucapan.</p>';
    })
    .catch(() => {
      // Mock data jika fetch gagal/belum setup
      addWishToDom("Budi Santoso", "Selamat menempuh hidup baru bro Ilal!");
      addWishToDom("Siti Aminah", "Semoga samawa ya Mirna cantik.");
    });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector("button");
    const name = document.getElementById("sender-name").value;
    const msg = document.getElementById("sender-message").value;

    btn.textContent = "Mengirim...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("message", msg);

    fetch(SCRIPT_URL, { method: "POST", body: formData })
      .then(() => {
        addWishToDom(name, msg);
        form.reset();
        btn.textContent = "Kirim Ucapan";
        btn.disabled = false;
      })
      .catch((err) => {
        console.error(err);
        // Fallback offline mode untuk demo
        addWishToDom(name, msg);
        form.reset();
        btn.textContent = "Kirim Ucapan";
        btn.disabled = false;
      });
  });
});
