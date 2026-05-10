function formatSidebarDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
}

function parseSidebarMusicURL(url) {
  url = url.trim();

  if (/^https:\/\/([a-z0-9-]+\.)*music\.163\.com/i.test(url)) {
    const idMatch = url.match(/[?&]id=(\d+)/);
    if (!idMatch) return null;
    return {
      server: 'netease',
      type: 'song',
      id: idMatch[1],
    };
  }

  if (/^https:\/\/([a-z0-9-]+\.)*qq\.com/i.test(url)) {
    const newSongMatch = url.match(/songDetail\/([a-zA-Z0-9]+)/);
    if (newSongMatch) {
      return {
        server: 'tencent',
        type: 'song',
        id: newSongMatch[1],
      };
    }
    const oldSongMatch = url.match(/[?&]songid=(\d+)/);
    if (oldSongMatch) {
      return {
        server: 'tencent',
        type: 'song',
        id: oldSongMatch[1],
      };
    }
    return null;
  }

  if (/^https:\/\/music\.apple\.com/i.test(url)) {
    const appleMatch = url.match(/\/(song|album)\/[^/]+\/(\d+)/);
    if (!appleMatch) return null;
    return {
      server: 'apple',
      type: appleMatch[1],
      id: appleMatch[2],
    };
  }
  return null;
}

function renderSidebarMusicExtension(extension) {
  const musicUrl = extension.payload.url;
  const musicInfo = parseSidebarMusicURL(musicUrl);

  let content = '';

  if (!musicInfo) {
    content = `<a href="${musicUrl}" target="_blank" class="memos-ext-link">点击播放音乐</a>`;
  } else if (musicInfo.server === 'apple') {
    content = `
      <div class="memos-ext-player">
        <iframe
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          frameborder="0"
          height="60"
          style="width:100%; display: block;"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          src="https://embed.music.apple.com/cn/${musicInfo.type}/${musicInfo.id}"
          loading="lazy"
        ></iframe>
      </div>
    `;
  } else if (musicInfo.server === 'netease') {
    content = `<div class="memos-ext-player"><meting-js server="netease" type="${musicInfo.type}" id="${musicInfo.id}" fixed="false" autoplay="false"></meting-js></div>`;
  } else if (musicInfo.server === 'tencent') {
    content = `<div class="memos-ext-player"><meting-js server="tencent" type="${musicInfo.type}" id="${musicInfo.id}" fixed="false" autoplay="false"></meting-js></div>`;
  }

  return `
    <div class="memos-extension memos-music">
      <div class="memos-ext-header">
        <span class="memos-icon">🎵</span>
        <span class="memos-ext-label">音乐</span>
      </div>
      ${content}
    </div>
  `;
}

function renderSidebarVideoExtension(extension) {
  const videoId = extension.payload.videoId;

  if (!videoId) return '';

  const isBilibili = videoId.startsWith('BV');
  let iframeHtml = '';
  
  if (isBilibili) {
    iframeHtml = `
      <div class="memos-video-wrap">
        <iframe
          src="https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=${videoId}&as_wide=1&high_quality=1&danmaku=0"
          scrolling="no"
          border="0"
          frameborder="no"
          framespacing="0"
          allowfullscreen="true"
          loading="lazy"
          class="memos-video-frame"
        ></iframe>
      </div>
    `;
  } else {
    iframeHtml = `
      <div class="memos-video-wrap">
        <iframe
          src="https://www.youtube.com/embed/${videoId}"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          loading="lazy"
          class="memos-video-frame"
        ></iframe>
      </div>
    `;
  }

  return `
    <div class="memos-extension memos-video">
      <div class="memos-ext-header">
        <span class="memos-icon">🎬</span>
        <span class="memos-ext-label">视频</span>
      </div>
      ${iframeHtml}
    </div>
  `;
}

const sidebarCarouselState = {};

function setSidebarCarouselIndex(echoId, index) {
  const carousel = document.getElementById(`memos-carousel-${echoId}`);
  if (!carousel) return;

  const slides = carousel.querySelector('.memos-carousel-slides');
  const dots = carousel.querySelectorAll('.memos-carousel-dot');

  const totalImages = sidebarCarouselState[echoId]?.total || 0;
  let newIndex = index;
  
  if (newIndex < 0) newIndex = totalImages - 1;
  if (newIndex >= totalImages) newIndex = 0;

  sidebarCarouselState[echoId].current = newIndex;
  
  slides.style.transform = `translateX(-${newIndex * 100}%)`;

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === newIndex);
  });
}

function initSidebarCarouselEvents() {
  document.querySelectorAll('.memos-carousel-btn').forEach(btn => {
    btn.removeEventListener('click', sidebarCarouselClickHandler);
    btn.addEventListener('click', sidebarCarouselClickHandler);
  });

  document.querySelectorAll('.memos-carousel-dot').forEach(dot => {
    dot.removeEventListener('click', sidebarCarouselDotHandler);
    dot.addEventListener('click', sidebarCarouselDotHandler);
  });
}

function sidebarCarouselClickHandler(e) {
  const echoId = e.currentTarget.getAttribute('data-echo');
  const isPrev = e.currentTarget.classList.contains('memos-carousel-prev');
  const state = sidebarCarouselState[echoId];
  if (!state) return;
  
  setSidebarCarouselIndex(echoId, state.current + (isPrev ? -1 : 1));
}

function sidebarCarouselDotHandler(e) {
  const echoId = e.currentTarget.getAttribute('data-echo');
  const index = parseInt(e.currentTarget.getAttribute('data-index'));
  setSidebarCarouselIndex(echoId, index);
}

function renderSidebarImages(images, echoId) {
  if (!images || images.length === 0) return '';

  sidebarCarouselState[echoId] = {
    current: 0,
    total: images.length
  };

  let slidesHtml = '';
  images.forEach((fileItem, idx) => {
    const imageUrl = Config.api.ech0.baseUrl + fileItem.file.url;
    slidesHtml += `
      <div class="memos-carousel-slide">
        <img src="${imageUrl}" data-original="${imageUrl}" alt="图片 ${idx + 1}" loading="lazy" class="ech0-zoomable" />
      </div>
    `;
  });

  let controlsHtml = '';
  if (images.length > 1) {
    let dotsHtml = '';
    images.forEach((_, idx) => {
      dotsHtml += `<button class="memos-carousel-dot ${idx === 0 ? 'active' : ''}" data-echo="${echoId}" data-index="${idx}"></button>`;
    });

    controlsHtml = `
      <button class="memos-carousel-btn memos-carousel-prev" data-echo="${echoId}">&lt;</button>
      <button class="memos-carousel-btn memos-carousel-next" data-echo="${echoId}">&gt;</button>
      <div class="memos-carousel-dots">
        ${dotsHtml}
      </div>
    `;
  }

  return `
    <div class="memos-image-wrap">
      <div class="memos-carousel" id="memos-carousel-${echoId}">
        <div class="memos-carousel-slides">
          ${slidesHtml}
        </div>
        ${controlsHtml}
      </div>
    </div>
  `;
}

function renderSidebarEchoItem(echo) {
  let imageFiles = [];
  if (echo.echo_files && echo.echo_files.length > 0) {
    imageFiles = echo.echo_files.filter(f => f.file.category === 'image');
  }

  const hasImages = imageFiles.length > 0;
  const hasContent = echo.content && echo.content.trim().length > 0;
  const hasExtension = echo.extension !== null && echo.extension !== undefined;

  let contentHtml = '';
  if (hasContent) {
    contentHtml = `<div class="memos-content">${echo.content}</div>`;
  }

  let imagesHtml = '';
  if (hasImages) {
    imagesHtml = renderSidebarImages(imageFiles, echo.id);
  }

  let extensionHtml = '';
  if (hasExtension) {
    if (echo.extension.type === 'MUSIC') {
      extensionHtml = renderSidebarMusicExtension(echo.extension);
    } else if (echo.extension.type === 'VIDEO') {
      extensionHtml = renderSidebarVideoExtension(echo.extension);
    }
  }

  return `
    <div class="memos-item">
      ${imagesHtml}
      ${contentHtml}
      ${extensionHtml}
      <div class="memos-date">
        <span class="memos-icon">📅</span>
        ${formatSidebarDate(echo.created_at)}
      </div>
    </div>
  `;
}

function initViewerTool() {
  if (!window.ViewerTool) {
    console.warn('ViewerTool 尚未加载，稍后重试');
    setTimeout(() => initViewerTool(), 500);
    return;
  }

  ViewerTool.init('.ech0-zoomable');
}

function renderSidebarEchos(echos, container) {
  if (echos.length === 0) {
    container.innerHTML = `
      <div class="memos-empty">
        <p class="memos-empty-text">还没有心迹</p>
      </div>
    `;
    return;
  }

  const sortedEchos = [...echos].sort((a, b) => b.created_at - a.created_at);

  let html = '';
  sortedEchos.forEach(echo => {
    html += renderSidebarEchoItem(echo);
  });
  
  const listContainer = document.createElement('div');
  listContainer.className = 'memos-list';
  listContainer.innerHTML = html;
  container.innerHTML = '';
  container.appendChild(listContainer);

  initSidebarCarouselEvents();
  
  setTimeout(() => {
    initViewerTool();
  }, 100);
}

async function fetchSidebarEchos() {
  const container = document.getElementById('sidebar-echos-container');
  if (!container) return;
  
  const apiUrl = Config.api.ech0.baseUrl;
  const limit = 5;

  container.innerHTML = `
    <div class="memos-loading">
      <span class="loading loading-text">加载中...</span>
    </div>
  `;

  try {
    const response = await fetch(`${apiUrl}/api/echo/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ page: 1, pageSize: limit }),
      timeout: 8000
    });

    const result = await response.json();

    if (result.code === 1 && result.data) {
      renderSidebarEchos(result.data.items, container);
    } else {
      container.innerHTML = `
        <div class="memos-error">
          <p>加载失败：${result.msg || '未知错误'}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to fetch Echos:', error);
    container.innerHTML = `
      <div class="memos-error">
        <p>网络错误，请检查服务是否运行</p>
      </div>
    `;
  }
}

function loadMetingScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('meting-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'meting-script';
    script.src = 'https://fastly.jsdelivr.net/npm/meting@2.0.1/dist/Meting.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadAPlayerScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('aplayer-script')) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.id = 'aplayer-css';
    link.rel = 'stylesheet';
    link.href = 'https://fastly.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.id = 'aplayer-script';
    script.src = 'https://fastly.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function loadViewerToolScript() {
  return new Promise((resolve, reject) => {
    if (window.ViewerTool) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.id = 'viewer-tool-css';
    link.rel = 'stylesheet';
    link.href = '/css/viewer-tool.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.id = 'viewer-tool-script';
    script.src = '/js/tools/viewer-tool.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await Promise.all([
      loadAPlayerScript(),
      loadMetingScript(),
      loadViewerToolScript()
    ]);
  } catch (error) {
    console.warn('加载依赖脚本失败:', error);
  }
  
  await fetchSidebarEchos();
});
