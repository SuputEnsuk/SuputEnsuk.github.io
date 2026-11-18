// ==========================================================================
// Portfolio Core Script (Loads content dynamically from config.js)
// Supports Story-style Single Row Carousel + "ดูทั้งหมด" Grid Toggle
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  // 1. ตรวจสอบว่ามี CONFIG หรือไม่
  if (typeof CONFIG === 'undefined') {
    console.error('ไม่พบไฟล์ config.js กรุณาตรวจสอบว่ามีไฟล์ config.js อยู่ในโฟลเดอร์');
    return;
  }

  // --------------------------------------------------------------------------
  // 2. Helper แปลงลิงก์วิดีโอ & รูปภาพ (Google Drive & YouTube) ให้อัตโนมัติ
  // --------------------------------------------------------------------------
  function extractDriveId(url) {
    if (!url) return '';
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }

  function normalizeVideoUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = rawUrl.trim();

    // กรณีเป็น Google Drive: เปลี่ยน /view เป็น /preview ให้อัตโนมัติ
    if (url.includes('drive.google.com')) {
      const fileId = extractDriveId(url);
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
      return url.replace(/\/view(\?.*)?$/, '/preview');
    }

    // กรณีเป็น YouTube: แปลงเป็น Embed URL ให้อัตโนมัติ
    const ytWatchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (ytWatchMatch && ytWatchMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytWatchMatch[1]}?controls=1&rel=0`;
    }

    const ytShortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (ytShortMatch && ytShortMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytShortMatch[1]}?controls=1&rel=0`;
    }

    return url;
  }

  // แปลงลิงก์รูปภาพจาก Google Drive ให้เป็น Direct Image CDN URL อัตโนมัติ
  function normalizeImageUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = rawUrl.trim();

    const fileId = extractDriveId(url);
    if (fileId) {
      // ดึงรูปภาพความละเอียดสูงผ่าน Google High-Res Thumbnail CDN โดยตรง
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`;
    }

    return url;
  }

  // --------------------------------------------------------------------------
  // 3. แสดงผลข้อมูลส่วนตัว (Profile) จาก CONFIG
  // --------------------------------------------------------------------------
  if (CONFIG.profile) {
    const brandNameEl = document.getElementById('brandName');
    const footerBrandEl = document.getElementById('footerBrand');
    const heroTitleEl = document.getElementById('heroTitle');
    const heroHighlightEl = document.getElementById('heroHighlight');
    if (CONFIG.profile.brandName) {
      if (brandNameEl) brandNameEl.textContent = CONFIG.profile.brandName;
      if (footerBrandEl) footerBrandEl.textContent = CONFIG.profile.brandName;
    }
    if (CONFIG.profile.heroTitle && heroTitleEl) heroTitleEl.textContent = CONFIG.profile.heroTitle;
    if (CONFIG.profile.heroHighlight && heroHighlightEl) heroHighlightEl.textContent = CONFIG.profile.heroHighlight;
  }

  // --------------------------------------------------------------------------
  // 4. แสดงผลงาน Scripting (วิดีโอ) จาก CONFIG
  // --------------------------------------------------------------------------
  const scriptVideosContainer = document.getElementById('scriptVideosContainer');
  if (scriptVideosContainer && Array.isArray(CONFIG.scriptVideos)) {
    if (CONFIG.scriptVideos.length === 0) {
      scriptVideosContainer.innerHTML = `
        <div class="empty-state-card">
          <span class="empty-icon">🎬</span>
          <p class="empty-text">ยังไม่มีคลิปวิดีโอในรายการ</p>
          <span class="empty-sub mono-meta">เปิดไฟล์ config.js แล้วใส่ลิงก์คลิปวิดีโอในช่อง scriptVideos ได้เลยครับ</span>
        </div>
      `;
    } else {
      scriptVideosContainer.innerHTML = CONFIG.scriptVideos.map((video) => {
        const embedUrl = normalizeVideoUrl(video.videoUrl);
        return `
          <article class="media-card">
            <div class="video-frame">
              <iframe 
                src="${embedUrl}" 
                title="${video.title || 'Roblox Script Showcase'}"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
              </iframe>
            </div>
            <div class="media-info">
              <h3 class="media-title">${video.title || 'ระบบสคริปต์'}</h3>
            </div>
          </article>
        `;
      }).join('');
    }
  }

  // --------------------------------------------------------------------------
  // 5. แสดงผลงาน Game UI/UX (รูปภาพ) จาก CONFIG
  // --------------------------------------------------------------------------
  const uiuxImagesContainer = document.getElementById('uiuxImagesContainer');
  if (uiuxImagesContainer && Array.isArray(CONFIG.uiuxImages)) {
    uiuxImagesContainer.innerHTML = CONFIG.uiuxImages.map((item, index) => {
      const finalImageUrl = normalizeImageUrl(item.imageUrl);
      const driveId = extractDriveId(item.imageUrl);
      const fallbackAttr = driveId 
        ? `onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/d/${driveId}';"` 
        : '';

      // หากมี imageUrl ให้แสดงภาพจริง (รองรับลิงก์ Google Drive อัตโนมัติ 100%)
      const contentHtml = finalImageUrl 
        ? `<img src="${finalImageUrl}" alt="${item.title || 'Roblox UI Design'}" loading="lazy" referrerpolicy="no-referrer" ${fallbackAttr}>`
        : getMockupUiHtml(index);

      return `
        <article class="media-card">
          <div class="image-frame">
            ${contentHtml}
          </div>
          <div class="media-info">
            <h3 class="media-title">${item.title || 'ผลงานดีไซน์ UI'}</h3>
          </div>
        </article>
      `;
    }).join('');
  }

  // Fallback UI Frame สวยงาม เมื่อผู้ใช้ยังไม่ได้ใส่รูปจริง
  function getMockupUiHtml(idx) {
    if (idx % 4 === 0) {
      return `
        <div class="mock-ui-preview hud-style">
          <div class="ui-preview-top">
            <div class="mock-stat-bar"><span class="stat-badge hp">HP</span><div class="bar-bg"><div class="bar-fill hp" style="width: 80%;"></div></div></div>
            <div class="mock-stat-bar"><span class="stat-badge stamina">STAMINA</span><div class="bar-bg"><div class="bar-fill stamina" style="width: 65%;"></div></div></div>
          </div>
          <div class="mock-ui-center">
            <span class="mock-game-logo">GAME HUD LAYOUT</span>
            <span class="mock-level-pill mono-meta">LEVEL 42 · 14,500 COINS</span>
          </div>
        </div>
      `;
    } else if (idx % 4 === 1) {
      return `
        <div class="mock-ui-preview store-style">
          <div class="mock-store-grid">
            <div class="store-item-tile"><div class="item-icon">⚡</div><span class="item-name mono-meta">2X SPEED</span><span class="item-price mono-meta">R$ 250</span></div>
            <div class="store-item-tile featured"><div class="item-icon">👑</div><span class="item-name mono-meta">VIP PASS</span><span class="item-price mono-meta">R$ 499</span></div>
            <div class="store-item-tile"><div class="item-icon">🎒</div><span class="item-name mono-meta">+50 SLOTS</span><span class="item-price mono-meta">R$ 150</span></div>
          </div>
        </div>
      `;
    } else if (idx % 4 === 2) {
      return `
        <div class="mock-ui-preview inventory-style">
          <div class="mock-inv-header mono-meta">BACKPACK INVENTORY [16/30]</div>
          <div class="mock-slot-grid">
            <div class="inv-slot active">⚔️</div>
            <div class="inv-slot">🛡️</div>
            <div class="inv-slot">🧪</div>
            <div class="inv-slot">💎</div>
            <div class="inv-slot">🏹</div>
            <div class="inv-slot">🪙</div>
            <div class="inv-slot empty"></div>
            <div class="inv-slot empty"></div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="mock-ui-preview quest-style">
          <div class="mock-quest-box">
            <div class="quest-title mono-meta">ACTIVE QUEST: DEFEAT BANDIT LEADER</div>
            <div class="quest-progress"><div class="quest-bar"><div class="quest-fill" style="width: 70%;"></div></div><span class="quest-ratio mono-meta">7 / 10 DEFEATED</span></div>
            <div class="quest-reward mono-meta">REWARD: +500 EXP · 250 COINS</div>
          </div>
        </div>
      `;
    }
  }

  // --------------------------------------------------------------------------
  // 6. ฟังก์ชันควบคุม Carousel (เลื่อนซ้าย-ขวา) และปุ่ม "ดูทั้งหมด" (Toggle Grid)
  // --------------------------------------------------------------------------
  function setupCarousel(containerId, prevBtnId, nextBtnId, toggleBtnId) {
    const container = document.getElementById(containerId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    const toggleBtn = document.getElementById(toggleBtnId);
    if (!container) return;

    const wrapper = container.closest('.carousel-wrapper');
    const scrollAmount = 340; // ระยะการเลื่อนในแต่ละครั้ง

    // เลื่อนไปทางซ้าย
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }

    // เลื่อนไปทางขวา
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }

    // ปุ่มสลับระหว่าง "แสดงแถวเดียว (Carousel)" และ "ดูทั้งหมด (Grid)"
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isGrid = container.classList.toggle('grid-mode');
        if (wrapper) wrapper.classList.toggle('in-grid-mode', isGrid);
        toggleBtn.classList.toggle('active', isGrid);

        const btnText = toggleBtn.querySelector('.btn-text') || toggleBtn;
        btnText.textContent = isGrid ? 'แสดงแถวเดียว ⊟' : 'ดูทั้งหมด ⊞';
      });
    }
  }

  // ติดตั้ง Carousel สำหรับทั้งสองส่วน
  setupCarousel('scriptVideosContainer', 'scriptsPrevBtn', 'scriptsNextBtn', 'toggleScriptsViewBtn');
  setupCarousel('uiuxImagesContainer', 'uiuxPrevBtn', 'uiuxNextBtn', 'toggleUiuxViewBtn');

  // --------------------------------------------------------------------------
  // 7. จัดการข้อมูลติดต่อจาก CONFIG
  // --------------------------------------------------------------------------
  if (CONFIG.contacts) {
    const discord = CONFIG.contacts.discord || {};
    const discordDisplay = document.getElementById('discordUsernameDisplay');
    const copyDiscordBtn = document.getElementById('copyDiscordBtn');
    const copyBtnText = document.getElementById('copyBtnText');

    if (discordDisplay && discord.username) {
      discordDisplay.textContent = discord.username;
    }

    if (copyDiscordBtn && copyBtnText) {
      copyDiscordBtn.addEventListener('click', async () => {
        const textToCopy = discord.copyValue || discord.username || 'bxng_dev';
        try {
          await navigator.clipboard.writeText(textToCopy);
          const originalText = copyBtnText.textContent;
          copyBtnText.textContent = 'คัดลอกแล้ว! ✓';
          copyDiscordBtn.style.backgroundColor = '#10b981';
          
          setTimeout(() => {
            copyBtnText.textContent = originalText;
            copyDiscordBtn.style.backgroundColor = '';
          }, 2000);
        } catch {
          prompt('คัดลอก Discord Username:', textToCopy);
        }
      });
    }

    // Roblox Link
    const robloxLink = document.getElementById('robloxLink');
    if (robloxLink && CONFIG.contacts.roblox && CONFIG.contacts.roblox.url) {
      robloxLink.href = CONFIG.contacts.roblox.url;
    }

    // GitHub Link
    const githubLink = document.getElementById('githubLink');
    const githubDisplay = document.getElementById('githubDisplay');
    if (githubLink && CONFIG.contacts.github && CONFIG.contacts.github.url) {
      githubLink.href = CONFIG.contacts.github.url;
      if (githubDisplay) {
        githubDisplay.textContent = CONFIG.contacts.github.url.replace(/^https?:\/\//, '');
      }
    }

    // Email Link
    const emailLink = document.getElementById('emailLink');
    const emailDisplay = document.getElementById('emailDisplay');
    if (emailLink && CONFIG.contacts.email) {
      emailLink.href = `mailto:${CONFIG.contacts.email}`;
      if (emailDisplay) {
        emailDisplay.textContent = CONFIG.contacts.email;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 8. สลับธีม สว่าง / มืด (Dark / Light Theme)
  // --------------------------------------------------------------------------
  const themeToggle = document.getElementById('themeToggle');
  const htmlRoot = document.documentElement;

  const savedTheme = localStorage.getItem('bxng_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme) {
    htmlRoot.setAttribute('data-theme', savedTheme);
  } else if (prefersDark) {
    htmlRoot.setAttribute('data-theme', 'dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = htmlRoot.getAttribute('data-theme');
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      htmlRoot.setAttribute('data-theme', nextTheme);
      localStorage.setItem('bxng_theme', nextTheme);
    });
  }

  // --------------------------------------------------------------------------
  // 9. แสดงปี ค.ศ. ใน Footer อัตโนมัติ
  // --------------------------------------------------------------------------
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

});
