function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function parseMusicURL(url) {
  url = url.trim();

  if (/^https:\/\/([a-z0-9-]+\.)*music\.163\.com/i.test(url)) {
    const idMatch = url.match(/[?&]id=(\d+)/);
    if (!idMatch) return null;
    return {
      server: Config.MusicProvider.NETEASE,
      type: 'song',
      id: idMatch[1],
    };
  }

  if (/^https:\/\/([a-z0-9-]+\.)*qq\.com/i.test(url)) {
    const newSongMatch = url.match(/songDetail\/([a-zA-Z0-9]+)/);
    if (newSongMatch) {
      return {
        server: Config.MusicProvider.QQ,
        type: 'song',
        id: newSongMatch[1],
      };
    }
    const oldSongMatch = url.match(/[?&]songid=(\d+)/);
    if (oldSongMatch) {
      return {
        server: Config.MusicProvider.QQ,
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
      server: Config.MusicProvider.APPLE,
      type: appleMatch[1],
      id: appleMatch[2],
    };
  }
  return null;
}

function renderMusicExtension(extension) {
  const musicUrl = extension.payload.url;
  const musicInfo = parseMusicURL(musicUrl);

  let providerLabel = '音乐';
  let content = '';

  if (!musicInfo) {
    content = `<a href="${musicUrl}" target="_blank">${musicUrl}</a>`;
  } else if (musicInfo.server === Config.MusicProvider.APPLE) {
    providerLabel = 'Apple Music';
    content = `
      <div class="ech0-apple-music">
        <iframe
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          frameborder="0"
          height="175"
          style="width:100%; display: block;"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          src="https://embed.music.apple.com/cn/${musicInfo.type}/${musicInfo.id}"
          loading="lazy"
        ></iframe>
      </div>
    `;
  } else if (musicInfo.server === Config.MusicProvider.NETEASE) {
    providerLabel = '网易云音乐';
    content = `<meting-js api="https://meting.soopy.cn/api?server=:server&type=:type&id=:id&auth=:auth&r=:r" server="netease" type="${musicInfo.type}" id="${musicInfo.id}" auto="${musicUrl}"></meting-js>`;
  } else if (musicInfo.server === Config.MusicProvider.QQ) {
    providerLabel = 'QQ 音乐';
    content = `<meting-js api="https://meting.soopy.cn/api?server=:server&type=:type&id=:id&auth=:auth&r=:r" server="tencent" type="${musicInfo.type}" id="${musicInfo.id}" auto="${musicUrl}"></meting-js>`;
  }

  return `
    <div class="ech0-extension-wrapper">
      <div class="ech0-extension-card">
        <div class="ech0-extension-body">
          ${content}
        </div>
      </div>
    </div>
  `;
}

function renderVideoExtension(extension) {
  const videoId = extension.payload.videoId;

  if (!videoId) return '';

  const isBilibili = videoId.startsWith('BV');
  const videoUrl = isBilibili
    ? `https://www.bilibili.com/video/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;

  let iframeHtml = '';
  if (isBilibili) {
    iframeHtml = `
      <iframe
        src="https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=${videoId}&as_wide=1&high_quality=1&danmaku=0"
        scrolling="no"
        border="0"
        frameborder="no"
        framespacing="0"
        allowfullscreen="true"
        loading="lazy"
        class="ech0-video-frame"
      ></iframe>
    `;
  } else {
    iframeHtml = `
      <iframe
        src="https://www.youtube.com/embed/${videoId}"
        frameborder="0"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        loading="lazy"
        class="ech0-video-frame"
      ></iframe>
    `;
  }

  const content = `
    <div class="ech0-video-wrap">
      ${iframeHtml}
    </div>
  `;

  return `
    <div class="ech0-extension-wrapper">
      <div class="ech0-extension-card">
        <div class="ech0-extension-body">
          ${content}
        </div>
      </div>
    </div>
  `;
}

function renderGalleryGrid(images) {
  const displayedImages = images.slice(0, 9);
  const extraCount = images.length > 9 ? images.length - 9 : 0;

  let itemsHtml = '';
  displayedImages.forEach((fileItem, idx) => {
    const imageUrl = Config.api.ech0.baseUrl + fileItem.file.url;
    const extraOverlay = extraCount > 0 && idx === 8
      ? `<div class="ech0-image-more-overlay">+${extraCount}</div>`
      : '';

    itemsHtml += `
      <div class="ech0-grid-image-item">
        <div class="ech0-image-frame">
          ${extraOverlay}
          <img src="${imageUrl}" data-original="${imageUrl}" alt="图片 ${idx + 1}" class="ech0-grid-image ech0-zoomable" loading="lazy" />
        </div>
      </div>
    `;
  });

  return `
    <div class="ech0-gallery-grid">
      ${itemsHtml}
    </div>
  `;
}

function renderGalleryHorizontal(images) {
  let itemsHtml = '';
  images.forEach((fileItem, idx) => {
    const imageUrl = Config.api.ech0.baseUrl + fileItem.file.url;
    let aspectStyle = '';
    if (fileItem.file.width && fileItem.file.height) {
      aspectStyle = `style="aspect-ratio: ${fileItem.file.width} / ${fileItem.file.height}; width: auto;"`;
    }

    itemsHtml += `
      <div class="ech0-horizontal-image-item" ${aspectStyle}>
        <div class="ech0-image-frame">
          <img src="${imageUrl}" data-original="${imageUrl}" alt="图片 ${idx + 1}" class="ech0-horizontal-image ech0-zoomable" loading="lazy" />
        </div>
      </div>
    `;
  });

  return `
    <div class="ech0-gallery-horizontal">
      <div class="ech0-horizontal-wrapper">
        ${itemsHtml}
      </div>
    </div>
  `;
}

function renderGalleryCarousel(images, echoId) {
  let slidesHtml = '';
  images.forEach((fileItem, idx) => {
    const imageUrl = Config.api.ech0.baseUrl + fileItem.file.url;
    slidesHtml += `
      <div class="ech0-carousel-slide">
        <img src="${imageUrl}" data-original="${imageUrl}" alt="图片 ${idx + 1}" loading="lazy" class="ech0-zoomable">
      </div>
    `;
  });

  let controlsHtml = '';
  if (images.length > 1) {
    let dotsHtml = '';
    images.forEach((_, idx) => {
      dotsHtml += `<button class="ech0-carousel-dot ${idx === 0 ? 'active' : ''}" data-echo="${echoId}" data-index="${idx}"></button>`;
    });

    controlsHtml = `
      <button class="ech0-carousel-btn ech0-carousel-prev" data-echo="${echoId}">&lt;</button>
      <button class="ech0-carousel-btn ech0-carousel-next" data-echo="${echoId}">&gt;</button>
      <div class="ech0-carousel-dots">
        ${dotsHtml}
      </div>
    `;
  }

  let maxHeight = 400;
  if (images[0] && images[0].file && images[0].file.width && images[0].file.height) {
    const ratio = images[0].file.width / images[0].file.height;
    if (ratio > 1.5) {
      maxHeight = 300;
    } else if (ratio < 0.6) {
      maxHeight = 450;
    } else {
      maxHeight = 400;
    }
  }

  return `
    <div class="ech0-gallery-carousel" id="ech0-carousel-${echoId}" style="max-height: ${maxHeight}px;">
      <div class="ech0-carousel-slides" style="transform: translateX(0)">
        ${slidesHtml}
      </div>
      ${controlsHtml}
    </div>
  `;
}

function initViewer() {
  if (!window.ViewerTool) {
    console.warn('ViewerTool 尚未加载，稍后重试');
    setTimeout(() => initViewer(), 500);
    return;
  }

  ViewerTool.init('.ech0-zoomable');
}

function renderImageGallery(images, layout, echoId) {
  if (layout === Config.ImageLayout.HORIZONTAL) {
    return renderGalleryHorizontal(images);
  }
  if (layout === Config.ImageLayout.GRID) {
    return renderGalleryGrid(images);
  }
  return renderGalleryCarousel(images, echoId);
}

const carouselState = {};

function setCarouselIndex(echoId, index) {
  const carousel = document.getElementById(`ech0-carousel-${echoId}`);
  if (!carousel) return;

  const slides = carousel.querySelector('.ech0-carousel-slides');
  const dots = carousel.querySelectorAll('.ech0-carousel-dot');

  const totalImages = carouselState[echoId]?.total || 0;
  let newIndex = index;
  
  if (newIndex < 0) newIndex = totalImages - 1;
  if (newIndex >= totalImages) newIndex = 0;

  carouselState[echoId].current = newIndex;
  
  slides.style.transform = `translateX(-${newIndex * 100}%)`;

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === newIndex);
  });
}

function initCarouselEvents() {
  document.querySelectorAll('.ech0-carousel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const echoId = e.currentTarget.getAttribute('data-echo');
      const isPrev = e.currentTarget.classList.contains('ech0-carousel-prev');
      const state = carouselState[echoId];
      if (!state) return;
      
      setCarouselIndex(echoId, state.current + (isPrev ? -1 : 1));
    });
  });

  document.querySelectorAll('.ech0-carousel-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      const echoId = e.currentTarget.getAttribute('data-echo');
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      setCarouselIndex(echoId, index);
    });
  });
}

function renderEchoItem(echo, index) {
  let imageFiles = [];
  if (echo.echo_files && echo.echo_files.length > 0) {
    imageFiles = echo.echo_files.filter(f => f.file.category === 'image');
  }

  const heightClasses = ['', 'ech0-card-tall', 'ech0-card-short'];
  const randomHeightClass = heightClasses[index % heightClasses.length];

  const hasImages = imageFiles.length > 0;
  const hasContent = echo.content && echo.content.trim().length > 0;
  const hasExtension = echo.extension !== null && echo.extension !== undefined;

  const layout = echo.layout || Config.ImageLayout.CAROUSEL;

  let contentHtml = '';
  if (hasContent) {
    contentHtml = `<div class="ech0-text">${echo.content}</div>`;
  }

  let imagesHtml = '';
  if (hasImages) {
    carouselState[echo.id] = {
      current: 0,
      total: imageFiles.length
    };

    imagesHtml = `
      <div class="ech0-images-wrapper">
        ${renderImageGallery(imageFiles, layout, echo.id)}
      </div>
    `;
  }

  let extensionHtml = '';
  if (hasExtension) {
    if (echo.extension.type === 'MUSIC') {
      extensionHtml = renderMusicExtension(echo.extension);
    } else if (echo.extension.type === 'VIDEO') {
      extensionHtml = renderVideoExtension(echo.extension);
    }
  }

  let bodyContent = '';
  if (layout === Config.ImageLayout.GRID || layout === Config.ImageLayout.HORIZONTAL || layout === Config.ImageLayout.STACK) {
    bodyContent = contentHtml + imagesHtml + extensionHtml;
  } else {
    bodyContent = imagesHtml + contentHtml + extensionHtml;
  }

  let avatarHtml = '';
  if (Config.user.avatar) {
    const avatarUrl = Config.api.ech0.baseUrl + Config.user.avatar;
    avatarHtml = `<img src="${avatarUrl}" alt="头像" />`;
  } else {
    avatarHtml = `<span>😺</span>`;
  }

  return `
    <div class="ech0-card ${randomHeightClass}">
      <div class="ech0-card-header">
        <div class="ech0-avatar">
          ${avatarHtml}
        </div>
        <div class="ech0-user-info">
          <div class="ech0-username">
            ${Config.user.username}
            <span class="ech0-verified">✓</span>
          </div>
          <div class="ech0-date">${formatDate(echo.created_at)}</div>
        </div>
      </div>

      <div class="ech0-card-content">
        ${bodyContent}
      </div>

      <div class="ech0-card-footer">
        <div class="ech0-tag">
          <span class="ech0-tag-icon">📝</span>
          <span>心迹</span>
        </div>
        <div class="ech0-actions">
          <button class="ech0-action-btn" onclick="scrollToComments()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:16px;fill:currentColor;">
              <path d="M256 32C114.6 32 0 125.1 0 240c0 47.6 19.9 91.2 52.9 126.3C38 405.7 7 439.1 6.5 439.5c-6.6 7-8.4 17.2-4.6 26S14.4 480 24 480c61.5 0 110-25.7 139.1-46.3C192 442.8 223.2 448 256 448c141.4 0 256-93.1 256-208S397.4 32 256 32zm0 368c-26.7 0-53.1-4.1-78.4-12.1l-22.7-7.2-19.5 13.8c-14.3 10.1-33.9 21.4-57.5 29 7.3-12.1 14.4-25.7 19.9-40.2l10.6-28.1-20.6-21.8C69.7 314.1 48 282.2 48 240c0-88.2 93.3-160 208-160s208 71.8 208 160-93.3 160-208 160z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderEchos(echos) {
  const container = document.getElementById('ech0-container');
  if (!container) return;

  if (echos.length === 0) {
    container.innerHTML = `
      <div class="ech0-empty">
        <p class="ech0-empty-text">还没有 Echo</p>
      </div>
    `;
    return;
  }

  const sortedEchos = [...echos].sort((a, b) => b.created_at - a.created_at);

  let html = '';
  sortedEchos.forEach((echo, index) => {
    html += renderEchoItem(echo, index);
  });
  container.innerHTML = html;

  initCarouselEvents();

  waitForImagesThenLayout(container);
}

function waitForImagesThenLayout(container) {
  const images = container.querySelectorAll('img');
  let loadedCount = 0;
  const totalImages = images.length;

  function checkAllLoaded() {
    loadedCount++;
    if (loadedCount >= totalImages) {
      layoutWaterfall(container);
      setTimeout(() => initViewer(), 100);
    }
  }

  if (totalImages === 0) {
    layoutWaterfall(container);
    setTimeout(() => initViewer(), 100);
  } else {
    images.forEach(img => {
      if (img.complete) {
        checkAllLoaded();
      } else {
        img.addEventListener('load', checkAllLoaded);
        img.addEventListener('error', checkAllLoaded);
      }
    });
    setTimeout(() => {
      layoutWaterfall(container);
      setTimeout(() => initViewer(), 100);
    }, 3000);
  }
}

function layoutWaterfall(container) {
  const cards = Array.from(container.children);
  if (cards.length === 0) return;

  cards.forEach(card => {
    card.style.position = 'relative';
    card.style.visibility = 'visible';
  });

  const gap = 20;
  const isMobile = window.innerWidth <= 768;
  const columns = isMobile ? 1 : 2;
  const columnWidth = (container.offsetWidth - gap * (columns - 1)) / columns;

  container.style.position = 'relative';
  container.style.height = '';

  const columnHeights = new Array(columns).fill(0);

  cards.forEach(card => {
    let minHeight = Math.min(...columnHeights);
    let minIndex = columnHeights.indexOf(minHeight);

    card.style.position = 'absolute';
    card.style.width = columnWidth + 'px';
    card.style.left = (minIndex * (columnWidth + gap)) + 'px';
    card.style.top = minHeight + 'px';

    columnHeights[minIndex] += card.offsetHeight + gap;
  });

  container.style.height = Math.max(...columnHeights) + 'px';

  const resizeHandler = () => {
    layoutWaterfall(container);
  };
  window.removeEventListener('resize', resizeHandler);
  window.addEventListener('resize', resizeHandler);
}

function scrollToComments() {
  const commentsSection = document.getElementById('comments');
  if (commentsSection) {
    commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}

async function fetchEchos() {
  const container = document.getElementById('ech0-container');
  if (!container) return;

  container.innerHTML = `
    <div class="ech0-empty">
      <p class="ech0-empty-text">加载中...</p>
    </div>
  `;

  try {
    const result = await ApiServices.Ech0Api.getEchos(1, Config.request.defaultPageSize);

    if (result.code === 1 && result.data) {
      renderEchos(result.data.items);
    } else {
      container.innerHTML = `
        <div class="ech0-empty">
          <p class="ech0-empty-text" style="color: #e74c3c;">加载失败：${result.msg || '未知错误'}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to fetch Echos:', error);
    container.innerHTML = `
      <div class="ech0-empty">
        <p class="ech0-empty-text" style="color: #e74c3c;">网络错误，请检查 Ech0 是否正在运行</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchEchos();
});