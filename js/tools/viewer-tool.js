/**
 * HexoBlog 图片预览器 - 基于 Viewer.js v1.11.6
 * 深色科技风格，功能完整的图片预览组件
 */

(function() {
  'use strict';

  const ViewerTool = {
    currentViewer: null,
    currentIndex: 0,
    imageUrls: [],
    imageCaptions: [],
    isThumbnailVisible: false,
    isPlaying: false,
    playInterval: null,
    keyHandler: null,
    imageTransform: null,
    domCache: {},

    init(selector, options = {}) {
      const images = this.getImages(selector);
      if (!images.length) {
        console.warn('未找到可放大的图片');
        return;
      }

      const imageUrls = [];
      const imageCaptions = [];

      images.forEach((img, imgIndex) => {
        const src = img.getAttribute('data-original') || img.src;
        const caption = img.getAttribute('alt') || img.getAttribute('title') || '';
        
        imageUrls.push(src);
        imageCaptions.push(caption);
        img.style.cursor = 'pointer';

        const newImg = img.cloneNode(true);
        img.parentNode.replaceChild(newImg, img);

        newImg.addEventListener('click', (e) => {
          e.preventDefault();
          this.openGallery(imageUrls, imageCaptions, imgIndex, options);
        });
      });

      return this;
    },

    getImages(selector) {
      if (typeof selector === 'string') {
        return Array.from(document.querySelectorAll(selector));
      }
      if (selector instanceof HTMLElement) {
        const imgs = Array.from(selector.querySelectorAll('img'));
        return imgs.length ? imgs : (selector.tagName === 'IMG' ? [selector] : []);
      }
      if (selector instanceof NodeList || Array.isArray(selector)) {
        return Array.from(selector);
      }
      return [];
    },

    openGallery(imageUrls, imageCaptions, initialIndex = 0, customOptions = {}) {
      this.resetState();
      this.imageUrls = imageUrls;
      this.imageCaptions = imageCaptions;
      this.currentIndex = initialIndex;

      this.createViewerModal();
    },

    resetState() {
      if (this.currentViewer) {
        this.closeViewer();
      }
      this.currentIndex = 0;
      this.imageUrls = [];
      this.imageCaptions = [];
      this.isThumbnailVisible = false;
      this.isPlaying = false;
      this.imageTransform = null;
      this.domCache = {};
    },

    createViewerModal() {
      this.loadCSS();
      const modal = document.createElement('div');
      modal.id = 'hexo-viewer-modal';
      modal.innerHTML = this.getModalTemplate();
      document.body.appendChild(modal);
      this.currentViewer = modal;

      this.cacheDOM();
      this.createBackdrop(this.imageUrls[this.currentIndex]);
      this.bindToolbarEvents();
      this.initThumbnails();
      this.initViewer();
      this.bindGlobalEvents();

      requestAnimationFrame(() => modal.classList.add('active'));
    },

    cacheDOM() {
      this.domCache = {
        modal: document.getElementById('hexo-viewer-modal'),
        toolbar: document.querySelector('.hexo-viewer-toolbar'),
        imageIndex: document.querySelector('.image-index'),
        mainImage: document.querySelector('.hexo-viewer-main-image'),
        imageContainer: document.querySelector('.hexo-viewer-image-container'),
        viewerMain: document.querySelector('.hexo-viewer-main'),
        caption: document.querySelector('.image-caption'),
        captionContainer: document.querySelector('.hexo-viewer-caption'),
        thumbnails: document.querySelector('.hexo-viewer-thumbnails'),
        thumbnailList: document.querySelector('.thumbnail-list'),
        prevArrow: document.querySelector('.prev-arrow'),
        nextArrow: document.querySelector('.next-arrow'),
        playBtn: document.querySelector('[data-action="play"]'),
        leftPreview: document.querySelector('.left-preview .edge-preview-image'),
        rightPreview: document.querySelector('.right-preview .edge-preview-image')
      };
    },

    createBackdrop(imageUrl) {
      const backdrop = document.createElement('div');
      backdrop.id = 'hexo-viewer-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        background-image: url('${imageUrl}');
        filter: blur(30px);
        opacity: 0.92;
        z-index: 9998;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(backdrop);
    },

    loadCSS() {
      if (document.getElementById('hexo-viewer-css')) return;
      const link = document.createElement('link');
      link.id = 'hexo-viewer-css';
      link.rel = 'stylesheet';
      link.href = '/css/viewer-tool.css';
      document.head.appendChild(link);
    },

    getModalTemplate() {
      return `
        <div class="hexo-viewer-container">
          <div class="hexo-viewer-toolbar">
            <div class="toolbar-left">
              <span class="image-index">${this.currentIndex + 1} / ${this.imageUrls.length}</span>
            </div>
            
            <div class="toolbar-center">
              <div class="toolbar-group desktop-only">
                <button class="toolbar-btn" data-action="zoomIn" title="放大">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                  </svg>
                </button>
                <button class="toolbar-btn" data-action="zoomOut" title="缩小">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    <path d="M7 9h5v1H7z"/>
                  </svg>
                </button>
              </div>

              <div class="toolbar-divider desktop-only"></div>

              <div class="toolbar-group desktop-only">
                <button class="toolbar-btn" data-action="oneToOne" title="1:1显示">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </button>
                <button class="toolbar-btn" data-action="fit" title="适应屏幕">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                </button>
                <button class="toolbar-btn" data-action="reset" title="重置">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                </button>
              </div>

              <div class="toolbar-divider desktop-only"></div>

              <div class="toolbar-group desktop-only">
                <button class="toolbar-btn" data-action="rotateLeft" title="向左旋转">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"/>
                  </svg>
                </button>
                <button class="toolbar-btn" data-action="rotateRight" title="向右旋转">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z"/>
                  </svg>
                </button>
              </div>

              <div class="toolbar-divider desktop-only"></div>

              <div class="toolbar-group desktop-only">
                <button class="toolbar-btn" data-action="flipHorizontal" title="水平翻转">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M9 6L5 9l4 3V6zm6 0v6l4-3-4-3z"/>
                    <path d="M12 3v18M4 3v18"/>
                  </svg>
                </button>
                <button class="toolbar-btn" data-action="flipVertical" title="垂直翻转">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M6 9H3l3-3 3 3H6zm0 6h3l-3 3-3-3h3z"/>
                    <path d="M3 12h18M3 6h18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="toolbar-right">
              <button class="toolbar-btn" data-action="play" title="播放幻灯片">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <button class="toolbar-btn grid-toggle" data-action="toggleThumbnails" title="缩略图">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
                </svg>
              </button>
              <button class="toolbar-btn close-btn" data-action="close" title="关闭">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="hexo-viewer-main">
            <div class="hexo-viewer-image-wrapper">
              <div class="hexo-viewer-edge-preview left-preview">
                <img class="edge-preview-image" alt="preview">
              </div>
              <div class="hexo-viewer-arrow prev-arrow">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                  <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                </svg>
              </div>
              <div class="hexo-viewer-image-container">
                <img class="hexo-viewer-main-image" alt="preview image">
              </div>
              <div class="hexo-viewer-arrow next-arrow">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </div>
              <div class="hexo-viewer-edge-preview right-preview">
                <img class="edge-preview-image" alt="preview">
              </div>
            </div>
          </div>

          <div class="hexo-viewer-caption">
            <span class="image-caption"></span>
          </div>

          <div class="hexo-viewer-thumbnails">
            <div class="thumbnail-list"></div>
          </div>
        </div>
      `;
    },

    initThumbnails() {
      const { thumbnailList } = this.domCache;
      if (!thumbnailList) return;

      thumbnailList.innerHTML = '';

      this.imageUrls.forEach((url, index) => {
        const item = document.createElement('div');
        item.className = 'thumbnail-item' + (index === this.currentIndex ? ' active' : '');
        item.dataset.index = index;

        const img = document.createElement('img');
        img.src = url;
        img.alt = `缩略图 ${index + 1}`;
        img.loading = 'lazy';

        item.appendChild(img);
        thumbnailList.appendChild(item);

        item.addEventListener('click', () => this.goToImage(index));
      });

      this.scrollThumbnailToActive(this.currentIndex);
    },

    scrollThumbnailToActive(index) {
      const { thumbnailList } = this.domCache;
      const activeItem = thumbnailList?.querySelector('.thumbnail-item.active');
      if (!activeItem) return;

      const containerWidth = thumbnailList.offsetWidth;
      const itemLeft = activeItem.offsetLeft;
      const itemWidth = activeItem.offsetWidth;
      thumbnailList.scrollTo({
        left: itemLeft - containerWidth / 2 + itemWidth / 2,
        behavior: 'smooth'
      });
    },

    initViewer() {
      const { mainImage, caption, captionContainer } = this.domCache;
      if (!mainImage) return;

      this.loadImage(this.imageUrls[this.currentIndex], (img) => {
        mainImage.src = img.src;
      });

      this.updateCaption(this.currentIndex);
      this.updateNavigation();
      this.setupImageInteractions(mainImage);
    },

    loadImage(url, callback) {
      const img = new Image();
      img.onload = () => callback(img);
      img.onerror = () => console.error('图片加载失败:', url);
      img.src = url;
    },

    updateCaption(index) {
      const { caption, captionContainer } = this.domCache;
      if (!caption || !captionContainer) return;

      const text = this.imageCaptions[index] || '';
      caption.textContent = text;
      captionContainer.classList.toggle('visible', !!text);
    },

    setupImageInteractions(imageEl) {
      let scale = 1;
      let rotation = 0;
      let flipHorizontal = 1;
      let flipVertical = 1;
      let translateX = 0, translateY = 0;
      let lastTranslateX = 0, lastTranslateY = 0;
      let isDragging = false;
      let hasMoved = false;
      let mouseStartX = 0, mouseStartY = 0;
      let isMouseDown = false;
      let touchStartX = 0, touchStartY = 0;
      let isTouchMode = false;
      let edgePreviewLoaded = false;

      const { leftPreview, rightPreview } = this.domCache;
      const containerWidth = () => this.domCache.imageContainer?.offsetWidth || window.innerWidth;
      const previewThreshold = 120;

      const applyTransform = (x = translateX, y = translateY) => {
        imageEl.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg) scaleX(${flipHorizontal}) scaleY(${flipVertical})`;
      };

      const resetTransform = () => {
        scale = 1;
        rotation = 0;
        flipHorizontal = 1;
        flipVertical = 1;
        translateX = translateY = lastTranslateX = lastTranslateY = 0;
        applyTransform();
      };

      const getPrevIndex = () => (this.currentIndex - 1 + this.imageUrls.length) % this.imageUrls.length;
      const getNextIndex = () => (this.currentIndex + 1) % this.imageUrls.length;

      const preloadEdgeImages = () => {
        if (edgePreviewLoaded) return;
        edgePreviewLoaded = true;
        
        const prevImg = new Image();
        prevImg.src = this.imageUrls[getPrevIndex()];
        
        const nextImg = new Image();
        nextImg.src = this.imageUrls[getNextIndex()];
      };

      const updateEdgePreview = (deltaX) => {
        if (!leftPreview || !rightPreview) return;

        if (deltaX > previewThreshold) {
          if (leftPreview.src !== this.imageUrls[getPrevIndex()]) {
            leftPreview.src = this.imageUrls[getPrevIndex()];
          }
          leftPreview.closest('.hexo-viewer-edge-preview')?.classList.add('visible');
          rightPreview.closest('.hexo-viewer-edge-preview')?.classList.remove('visible');
        } else if (deltaX < -previewThreshold) {
          if (rightPreview.src !== this.imageUrls[getNextIndex()]) {
            rightPreview.src = this.imageUrls[getNextIndex()];
          }
          rightPreview.closest('.hexo-viewer-edge-preview')?.classList.add('visible');
          leftPreview.closest('.hexo-viewer-edge-preview')?.classList.remove('visible');
        } else {
          leftPreview.closest('.hexo-viewer-edge-preview')?.classList.remove('visible');
          rightPreview.closest('.hexo-viewer-edge-preview')?.classList.remove('visible');
        }
      };

      const hideEdgePreviews = () => {
        leftPreview?.closest('.hexo-viewer-edge-preview')?.classList.remove('visible');
        rightPreview?.closest('.hexo-viewer-edge-preview')?.classList.remove('visible');
      };

      const handleWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 0.85 : 1.15;
        scale = Math.max(0.1, Math.min(10, scale * delta));
        applyTransform();
      };

      const handleClick = (e) => {
        e.preventDefault();
        if (hasMoved) {
          hasMoved = false;
          return;
        }
        if (Math.abs(scale - 1) < 0.05) {
          scale = 2;
        } else {
          scale = 1;
          translateX = translateY = lastTranslateX = lastTranslateY = 0;
        }
        applyTransform();
      };

      const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        isDragging = isMouseDown = true;
        hasMoved = false;
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
        translateX = e.clientX - lastTranslateX;
        translateY = e.clientY - lastTranslateY;
        imageEl.style.cursor = 'grabbing';
        imageEl.classList.add('dragging');
        preloadEdgeImages();
        e.preventDefault();
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;
        translateX = e.clientX - mouseStartX + lastTranslateX;
        translateY = e.clientY - mouseStartY + lastTranslateY;
        if (Math.abs(translateX - lastTranslateX) > 5 || Math.abs(translateY - lastTranslateY) > 5) {
          hasMoved = true;
        }
        applyTransform();
        updateEdgePreview(translateX - lastTranslateX);
      };

      const handleMouseUp = (e) => {
        if (!isDragging || !isMouseDown) return;
        
        const deltaX = e.clientX - mouseStartX;
        const deltaY = e.clientY - mouseStartY;
        const slideThreshold = 120;

        imageEl.classList.remove('dragging');

        if (hasMoved && Math.abs(deltaX) > slideThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
          this.goToImage(deltaX > 0 ? this.currentIndex - 1 : this.currentIndex + 1);
        } else {
          translateX = translateY = 0;
          lastTranslateX = lastTranslateY = 0;
          applyTransform();
        }

        hideEdgePreviews();
        isDragging = isMouseDown = false;
        imageEl.style.cursor = 'grab';
      };

      const handleTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        isTouchMode = isDragging = true;
        hasMoved = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        translateX = e.touches[0].clientX - lastTranslateX;
        translateY = e.touches[0].clientY - lastTranslateY;
        imageEl.classList.add('dragging');
        preloadEdgeImages();
      };

      const handleTouchMove = (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        translateX = e.touches[0].clientX - touchStartX + lastTranslateX;
        translateY = e.touches[0].clientY - touchStartY + lastTranslateY;
        if (Math.abs(translateX - lastTranslateX) > 5 || Math.abs(translateY - lastTranslateY) > 5) {
          hasMoved = true;
        }
        applyTransform();
        updateEdgePreview(translateX - lastTranslateX);
      };

      const handleTouchEnd = (e) => {
        if (!isTouchMode) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const slideThreshold = 120;

        imageEl.classList.remove('dragging');

        if (Math.abs(deltaX) > slideThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
          this.goToImage(deltaX > 0 ? this.currentIndex - 1 : this.currentIndex + 1);
        } else {
          if (!hasMoved && e.changedTouches.length === 1) {
            scale = Math.abs(scale - 1) < 0.05 ? 2 : 1;
          }
          translateX = translateY = 0;
          lastTranslateX = lastTranslateY = 0;
          applyTransform();
        }

        hideEdgePreviews();
        isDragging = hasMoved = isTouchMode = false;
      };

      imageEl.addEventListener('wheel', handleWheel, { passive: false });
      imageEl.addEventListener('click', handleClick);
      imageEl.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      imageEl.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      imageEl.addEventListener('touchend', handleTouchEnd, { passive: true });

      this.imageTransform = {
        getScale: () => scale,
        setScale: (s) => { scale = s; },
        getRotation: () => rotation,
        setRotation: (r) => { rotation = r; },
        getFlipHorizontal: () => flipHorizontal,
        setFlipHorizontal: (f) => { flipHorizontal = f; },
        getFlipVertical: () => flipVertical,
        setFlipVertical: (f) => { flipVertical = f; },
        reset: resetTransform,
        apply: () => applyTransform(),
        setTranslate: (x, y) => {
          translateX = x;
          translateY = y;
          lastTranslateX = x;
          lastTranslateY = y;
        }
      };
    },

    goToImage(index) {
      const len = this.imageUrls.length;
      index = ((index % len) + len) % len;
      this.currentIndex = index;

      const { mainImage, imageIndex, leftPreview, rightPreview } = this.domCache;

      this.loadImage(this.imageUrls[index], (img) => {
        if (mainImage) {
          mainImage.src = img.src;
          this.imageTransform?.reset();
        }
      });

      if (leftPreview) leftPreview.src = '';
      if (rightPreview) rightPreview.src = '';
      document.querySelectorAll('.thumbnail-item').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
        thumb.classList.toggle('playing', i === index && this.isPlaying);
      });

      if (imageIndex) {
        imageIndex.textContent = `${index + 1} / ${len}`;
      }

      this.updateCaption(index);
      this.updateNavigation();
      this.scrollThumbnailToActive(index);
      this.updateBackdrop(this.imageUrls[index]);
    },

    updateBackdrop(imageUrl) {
      const backdrop = document.getElementById('hexo-viewer-backdrop');
      if (backdrop) {
        backdrop.style.backgroundImage = `url('${imageUrl}')`;
      }
    },

    updateNavigation() {
      const { imageIndex } = this.domCache;
      if (imageIndex) {
        imageIndex.textContent = `${this.currentIndex + 1} / ${this.imageUrls.length}`;
      }
    },

    bindToolbarEvents() {
      const { toolbar, prevArrow, nextArrow, viewerMain } = this.domCache;

      toolbar?.addEventListener('click', (e) => {
        const btn = e.target.closest('.toolbar-btn');
        if (btn?.dataset.action) {
          this.handleToolbarAction(btn.dataset.action);
        }
      });

      prevArrow?.addEventListener('click', () => this.goToImage(this.currentIndex - 1));
      nextArrow?.addEventListener('click', () => this.goToImage(this.currentIndex + 1));

      viewerMain?.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.classList.contains('hexo-viewer-main-image') && 
            !target.closest('.hexo-viewer-image-container') &&
            !target.closest('.hexo-viewer-arrow')) {
          this.closeViewer();
        }
      });
    },

    handleToolbarAction(action) {
      const { playBtn } = this.domCache;

      switch (action) {
        case 'zoomIn':
          this.zoom(1.2);
          break;
        case 'zoomOut':
          this.zoom(0.8);
          break;
        case 'oneToOne':
          this.imageTransform?.setScale(1);
          this.imageTransform?.setTranslate(0, 0);
          this.imageTransform?.apply();
          break;
        case 'fit':
        case 'reset':
          this.imageTransform?.reset();
          break;
        case 'rotateLeft':
          this.rotate(-90);
          break;
        case 'rotateRight':
          this.rotate(90);
          break;
        case 'flipHorizontal':
          this.flip('horizontal');
          break;
        case 'flipVertical':
          this.flip('vertical');
          break;
        case 'play':
          this.toggleSlideShow();
          playBtn?.classList.toggle('active', this.isPlaying);
          break;
        case 'toggleThumbnails':
          this.toggleThumbnails();
          break;
        case 'close':
          this.closeViewer();
          break;
      }
    },

    zoom(factor) {
      if (!this.imageTransform) return;
      const newScale = Math.max(0.1, Math.min(10, this.imageTransform.getScale() * factor));
      this.imageTransform.setScale(newScale);
      this.imageTransform.apply();
    },

    rotate(angle) {
      if (!this.imageTransform) return;
      this.imageTransform.setRotation(this.imageTransform.getRotation() + angle);
      this.imageTransform.apply();
    },

    flip(axis) {
      if (!this.imageTransform) return;
      if (axis === 'horizontal') {
        this.imageTransform.setFlipHorizontal(this.imageTransform.getFlipHorizontal() * -1);
      } else {
        this.imageTransform.setFlipVertical(this.imageTransform.getFlipVertical() * -1);
      }
      this.imageTransform.apply();
    },

    toggleThumbnails() {
      const { thumbnails } = this.domCache;
      if (!thumbnails) return;
      this.isThumbnailVisible = !this.isThumbnailVisible;
      thumbnails.classList.toggle('visible', this.isThumbnailVisible);
    },

    toggleSlideShow() {
      if (this.isPlaying) {
        clearInterval(this.playInterval);
        this.isPlaying = false;
      } else {
        this.isPlaying = true;
        this.playInterval = setInterval(() => {
          this.goToImage(this.currentIndex + 1);
        }, 3000);
      }
    },

    bindGlobalEvents() {
      const handleKeydown = (e) => {
        if (!document.getElementById('hexo-viewer-modal')) {
          document.removeEventListener('keydown', handleKeydown);
          return;
        }

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.goToImage(this.currentIndex - 1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.goToImage(this.currentIndex + 1);
            break;
          case 'Escape':
            e.preventDefault();
            this.closeViewer();
            break;
        }
      };

      document.addEventListener('keydown', handleKeydown);
      this.keyHandler = handleKeydown;
    },

    closeViewer() {
      const { modal, leftPreview, rightPreview } = this.domCache;
      const backdrop = document.getElementById('hexo-viewer-backdrop');

      if (this.isPlaying) {
        clearInterval(this.playInterval);
        this.isPlaying = false;
      }

      if (leftPreview) leftPreview.src = '';
      if (rightPreview) rightPreview.src = '';

      if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
      }

      if (backdrop) {
        backdrop.style.opacity = '0';
        setTimeout(() => backdrop.remove(), 300);
      }

      if (this.keyHandler) {
        document.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
      }

      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }

      this.currentViewer = null;
      this.imageTransform = null;
      this.domCache = {};
    },

    openSingle(url, options = {}) {
      return this.openGallery([url], [''], 0, options);
    },

    openMultiple(urls, options = {}) {
      return this.openGallery(urls, Array(urls.length).fill(''), 0, options);
    },

    destroy() {
      this.closeViewer();
    }
  };

  if (typeof window !== 'undefined') {
    window.ViewerTool = ViewerTool;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewerTool;
  }
})();