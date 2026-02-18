document.addEventListener("DOMContentLoaded", () => {
  // --- 1. HANDLING URL PARAMETER (GUEST NAME) ---
  const urlParams = new URLSearchParams(window.location.search);
  const guestNameParam = urlParams.get("to");
  const guestNameElement = document.getElementById("guest-name");

  if (guestNameParam) {
    // Decode URI untuk menangani spasi (%20)
    guestNameElement.textContent = decodeURIComponent(guestNameParam);
  } else {
    guestNameElement.textContent = "Tamu Undangan";
  }

  // --- 2. OPENING ANIMATION ---
  const btnOpen = document.getElementById("btn-open");
  const openingCover = document.getElementById("opening-cover");
  const mainContent = document.getElementById("main-content");
  const musicBtn = document.getElementById("music-btn");
  const bgMusic = document.getElementById("bg-music");
  let isMusicPlaying = false;

  btnOpen.addEventListener("click", () => {
    // Scroll to top first to ensure good UX
    window.scrollTo(0, 0);

    // Animate Cover Out
    openingCover.style.opacity = "0";
    setTimeout(() => {
      openingCover.style.display = "none";

      // Show Main Content
      mainContent.classList.remove("hidden");
      // Trigger reflow
      void mainContent.offsetWidth;
      mainContent.style.opacity = "1";

      // Show Music Button
      musicBtn.classList.remove("hidden");
      musicBtn.classList.add("flex");
      musicBtn.classList.add("animate-pulse-slow");

      // Play Music
      playMusic();

      // Trigger Animation for first section
      checkScroll();
    }, 1000);
  });

  // --- 3. MUSIC CONTROL ---
  function playMusic() {
    bgMusic
      .play()
      .then(() => {
        isMusicPlaying = true;
        musicBtn.innerHTML = '<i class="fas fa-compact-disc fa-spin"></i>';
      })
      .catch((e) => {
        console.log("Autoplay blocked by browser");
        isMusicPlaying = false;
        musicBtn.innerHTML = '<i class="fas fa-music"></i>';
        musicBtn.classList.remove("animate-pulse-slow");
      });
  }

  musicBtn.addEventListener("click", () => {
    if (isMusicPlaying) {
      bgMusic.pause();
      isMusicPlaying = false;
      musicBtn.innerHTML = '<i class="fas fa-play"></i>';
      musicBtn.classList.remove("animate-pulse-slow");
    } else {
      bgMusic.play();
      isMusicPlaying = true;
      musicBtn.innerHTML = '<i class="fas fa-compact-disc fa-spin"></i>';
    }
  });

  // --- 4. SCROLL ANIMATION (INTERSECTION OBSERVER) ---
  const observerOptions = {
    threshold: 0.15, // Muncul saat 15% elemen terlihat
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);

  const fadeElements = document.querySelectorAll(".fade-in-up");
  fadeElements.forEach((el) => observer.observe(el));

  // Fallback for direct load (in case observer misses)
  function checkScroll() {
    fadeElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add("visible");
      }
    });
  }

  // --- 5. COUNTDOWN TIMER ---
  // Set target date: 24 Maret tahun ini/depan
  const now = new Date();
  let targetYear = now.getFullYear();
  let targetDate = new Date(`March 24, ${targetYear} 08:00:00`);

  // Jika tanggal sudah lewat, targetkan tahun depan
  if (now > targetDate) {
    targetYear++;
    targetDate = new Date(`March 24, ${targetYear} 08:00:00`);
  }

  const timer = setInterval(() => {
    const current = new Date().getTime();
    const diff = targetDate - current;

    if (diff < 0) {
      clearInterval(timer);
      document.getElementById("countdown").innerHTML = "<h3 class='text-2xl text-wd-gold'>Acara Telah Dimulai</h3>";
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    const makeBox = (num, label) => `
          <div class="flex flex-col items-center bg-wd-cream/10 backdrop-blur-md border border-wd-gold/30 rounded-lg p-3 w-20 md:w-24">
              <span class="text-3xl md:text-4xl font-display text-wd-gold">${num}</span>
              <span class="text-xs font-sans text-wd-cream uppercase tracking-wider mt-1">${label}</span>
          </div>
      `;

    document.getElementById("countdown").innerHTML = makeBox(d, "Hari") + makeBox(h, "Jam") + makeBox(m, "Menit") + makeBox(s, "Detik");
  }, 1000);

  // --- 6. FITUR SALIN REKENING (COPY TO CLIPBOARD) ---
  // Fungsi ini harus di-expose ke global scope atau dipanggil via event listener
  window.copyToClipboard = function (elementId, value) {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        showToast("Nomor berhasil disalin!");
      })
      .catch((err) => {
        console.error("Gagal menyalin: ", err);
        showToast("Gagal menyalin, coba manual.");
      });
  };

  function showToast(message) {
    const toast = document.getElementById("toast");
    const toastText = toast.querySelector("span");

    toastText.textContent = message;
    toast.classList.remove("opacity-0", "translate-y-10", "pointer-events-none");

    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-10", "pointer-events-none");
    }, 3000);
  }

  // --- 7. FITUR UCAPAN (GUEST BOOK - REALTIME) ---
  const wishesForm = document.getElementById("wishes-form");
  const wishesList = document.getElementById("wishes-list");

  // Masukkan URL Google Script kamu di sini
  const scriptURL = "https://script.google.com/macros/s/AKfycbyOgtwuFp8fj2vM4dVvyPTOHiM7yNgZu1n4vz3s_uSEIs8zOzNIdRZjhJi7vVU_JlIxZg/exec";

  // A. Fungsi Mengambil Data dari Google Sheet (Load saat refresh)
  async function loadWishes() {
    wishesList.innerHTML = '<div class="text-center text-gray-500 text-xs py-4"><i class="fas fa-spinner fa-spin"></i> Memuat ucapan...</div>';

    try {
      const response = await fetch(scriptURL);
      const data = await response.json();

      wishesList.innerHTML = ""; // Bersihkan loading

      if (data.length === 0) {
        wishesList.innerHTML = '<div class="text-center text-gray-400 italic text-sm py-4">Belum ada ucapan. Jadilah yang pertama!</div>';
      } else {
        data.forEach((wish) => {
          addWishToDOM(wish.name, wish.message, wish.date);
        });
      }
    } catch (error) {
      console.error("Gagal memuat:", error);
      wishesList.innerHTML = '<div class="text-center text-red-400 text-xs py-4">Gagal memuat ucapan.</div>';
    }
  }

  // B. Fungsi Menambah Item ke Layar (Helper)
  function addWishToDOM(name, message, date) {
    const item = document.createElement("div");
    item.className = "border-b border-wd-gold/20 pb-4 last:border-0 animation-fade";
    item.innerHTML = `
          <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-wd-gold/20 text-wd-gold flex items-center justify-center text-xs font-bold font-sans">
                  ${getInitials(name)}
              </div>
              <div>
                  <h4 class="font-bold text-wd-green-dark text-sm font-sans">${escapeHtml(name)}</h4>
                  <p class="text-gray-400 text-[10px] mb-1"><i class="far fa-clock"></i> ${date}</p>
                  <p class="text-gray-600 text-sm font-serif italic">"${escapeHtml(message)}"</p>
              </div>
          </div>
      `;
    wishesList.appendChild(item); // Tambah ke bawah (karena data dari server sudah di-reverse/urutkan)
  }

  // Helper Functions
  function getInitials(name) {
    return name
      ? name
          .match(/(\b\S)?/g)
          .join("")
          .match(/(^\S|\S$)?/g)
          .join("")
          .toUpperCase()
      : "A";
  }

  function escapeHtml(text) {
    return text ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";
  }

  // C. Event Listener Submit (Kirim Data)
  wishesForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const submitBtn = wishesForm.querySelector("button");
    const originalBtnText = submitBtn.innerHTML;
    const nameInput = document.getElementById("sender-name");
    const msgInput = document.getElementById("sender-message");

    // Loading State
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

    // Format Tanggal Lokal untuk Tampilan Langsung (Instant Feedback)
    const now = new Date();
    const dateString = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

    fetch(scriptURL, { method: "POST", body: new FormData(wishesForm) })
      .then((response) => {
        // Tambahkan ucapan user sendiri ke layar (paling atas)
        // Kita gunakan prepend agar muncul paling atas sebelum refresh
        const item = document.createElement("div");
        item.className = "border-b border-wd-gold/20 pb-4 last:border-0 animation-fade";
        item.innerHTML = `
                  <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-full bg-wd-gold/20 text-wd-gold flex items-center justify-center text-xs font-bold font-sans">
                          ${getInitials(nameInput.value)}
                      </div>
                      <div>
                          <h4 class="font-bold text-wd-green-dark text-sm font-sans">${escapeHtml(nameInput.value)}</h4>
                          <p class="text-gray-400 text-[10px] mb-1"><i class="far fa-clock"></i> ${dateString}</p>
                          <p class="text-gray-600 text-sm font-serif italic">"${escapeHtml(msgInput.value)}"</p>
                      </div>
                  </div>
              `;
        wishesList.prepend(item);

        // Reset Form
        wishesForm.reset();
        showToast("Ucapan berhasil terkirim!");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      })
      .catch((error) => {
        console.error("Error!", error.message);
        showToast("Gagal mengirim ucapan.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      });
  });

  // PANGGIL FUNGSI LOAD SAAT HALAMAN DIBUKA
  loadWishes();

  // Render awal saat load
  renderWishes();
});
