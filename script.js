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

  // --- 7. FITUR UCAPAN (GUEST BOOK - SIMULASI) ---
  /* CATATAN TEKNIS:
     Kode di bawah ini menggunakan ARRAY LOKAL (hilang saat refresh) untuk demo UI.
     Untuk menyimpan permanen (agar semua tamu bisa lihat), Anda harus menghubungkannya
     ke Google Sheets atau Database. Saya sertakan logika simulasinya.
  */

  const wishesForm = document.getElementById("wishes-form");
  const wishesList = document.getElementById("wishes-list");

  // Data Dummy Awal (Contoh)
  let wishesData = [{ name: "Admin", message: "Selamat menempuh hidup baru! Semoga samawa.", date: "Baru saja" }];

  // Fungsi Render List Ucapan
  function renderWishes() {
    wishesList.innerHTML = ""; // Bersihkan list

    if (wishesData.length === 0) {
      wishesList.innerHTML = '<div class="text-center text-gray-400 italic text-sm py-4">Belum ada ucapan.</div>';
      return;
    }

    wishesData.forEach((wish) => {
      // Buat elemen HTML untuk setiap ucapan
      const item = document.createElement("div");
      item.className = "border-b border-wd-gold/20 pb-4 last:border-0 animation-fade";
      item.innerHTML = `
              <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-wd-gold/20 text-wd-gold flex items-center justify-center text-xs font-bold font-sans">
                      ${getInitials(wish.name)}
                  </div>
                  <div>
                      <h4 class="font-bold text-wd-green-dark text-sm font-sans">${escapeHtml(wish.name)}</h4>
                      <p class="text-gray-400 text-[10px] mb-1"><i class="far fa-clock"></i> ${wish.date}</p>
                      <p class="text-gray-600 text-sm font-serif italic">"${escapeHtml(wish.message)}"</p>
                  </div>
              </div>
          `;
      wishesList.prepend(item); // Tambah di paling atas
    });
  }

  // Helper: Ambil inisial nama
  function getInitials(name) {
    return name
      .match(/(\b\S)?/g)
      .join("")
      .match(/(^\S|\S$)?/g)
      .join("")
      .toUpperCase();
  }

  // Helper: Mencegah XSS (Keamanan dasar)
  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // Event Listener Submit Form
  wishesForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("sender-name");
    const msgInput = document.getElementById("sender-message");
    const submitBtn = wishesForm.querySelector("button");
    const originalBtnText = submitBtn.innerHTML;

    // 1. Efek Loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

    const scriptURL = "https://script.google.com/macros/s/AKfycbycg2ah5TiOnN8fIHoNDixOC1ShGOTZO7AJG41BbrLmRfi1hrCKxZq1J9chi8x7laAm/exec";

    // 2. Kirim Data
    fetch(scriptURL, { method: "POST", body: new FormData(wishesForm) })
      .then((response) => {
        // --- SUKSES ---

        // A. Masukkan data baru ke Array Lokal (agar langsung muncul tanpa refresh)
        const newWish = {
          name: nameInput.value,
          message: msgInput.value,
          date: "Baru saja",
        };
        wishesData.push(newWish);

        // B. Render ulang list ucapan
        renderWishes();

        // C. Reset Form
        wishesForm.reset();

        // D. Tampilkan Notifikasi
        showToast("Ucapan berhasil terkirim!");

        // E. Kembalikan Tombol
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      })
      .catch((error) => {
        // --- ERROR ---
        console.error("Error:", error);
        showToast("Gagal mengirim ucapan. Cek koneksi internet.");

        // Kembalikan Tombol agar bisa coba lagi
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      });
  });

  // Render awal saat load
  renderWishes();
});
