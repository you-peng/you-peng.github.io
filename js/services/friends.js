console.log('[Friends Service] 已加载');

if (!window.utils) {
  window.utils = {};
}

utils.friends = {
  // Stellar 主题会调用这个方法
  render(el) {
    console.log('[Friends] Stellar render 被调用');
    if (!el) {
      console.log('[Friends] 元素为空');
      return;
    }
    
    const api = el.dataset.api;
    console.log('[Friends] API:', api);
    
    if (!api) {
      console.log('[Friends] API 地址为空，尝试从配置获取');
      const serviceConfig = ctx?.services?.friends;
      if (serviceConfig && serviceConfig.api) {
        el.dataset.api = serviceConfig.api;
        console.log('[Friends] 从配置获取 API:', serviceConfig.api);
      } else {
        console.log('[Friends] 无法获取 API 地址');
        return;
      }
    }

    this.load(el);
  },

  async load(el) {
    const api = el.dataset.api;
    const defaultAvatar = Config?.avatar || 'https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/avatar/round/3442075.svg';
    
    el.innerHTML = '<div class="loading loading-text">加载中...</div>';

    try {
      const response = await fetch(api, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Friends] 获取数据成功:', data);
      
      const items = data.content || data;
      
      if (!items || items.length === 0) {
        el.innerHTML = '<div class="friends-empty">暂无好友数据</div>';
        return;
      }

      let html = '';
      for (const item of items) {
        let friendData = item;
        
        if (item.body) {
          try {
            const jsonMatch = item.body.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              friendData = JSON.parse(jsonMatch[0]);
              console.log('[Friends] 解析 body JSON 成功:', friendData);
            }
          } catch (e) {
            console.log('[Friends] 解析 body JSON 失败:', e.message);
          }
        }

        let description = friendData.description || '';
        if (description) {
          description = description.trim();
          if (description.startsWith('"') && description.endsWith('"')) {
            description = description.slice(1, -1);
          } else if (description.startsWith("'") && description.endsWith("'")) {
            description = description.slice(1, -1);
          } else if (description.startsWith('""') && description.endsWith('""')) {
            description = description.slice(2, -2);
          }
        }

        const avatar = friendData.avatar || friendData.avatar_url || item.user?.avatar_url || item.icon || defaultAvatar;
        const name = friendData.name || friendData.title || item.title || item.login || '未知';
        const url = friendData.url || friendData.link || item.html_url || item.url || '#';

        html += `
          <div class="grid-cell friend-card">
            <a class="card-link" target="_blank" rel="external nofollow noopener noreferrer" href="${url}">
              <div class="friend-avatar">
                <img src="${avatar}" onerror="javascript:this.removeAttribute('data-src');this.src='${defaultAvatar}';" />
                <span class="friend-name">${name}</span>
              </div>
              <div class="friend-content">
                ${description ? `<div class="friend-desc">${description}</div>` : ''}
                ${friendData.posts && friendData.posts.length > 0 ? `
                  <div class="friend-posts">
                    ${friendData.posts.map(post => `
                      <div class="post-item">
                        <span class="post-title">${post.title}</span>
                        <span class="post-date">${post.published}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            </a>
          </div>
        `;
      }

      el.innerHTML = `<div class="grid-box">${html}</div>`;
      
      if (window.wrapLazyloadImages) {
        window.wrapLazyloadImages(el);
      }
      
    } catch (error) {
      console.error('[Friends] 加载失败:', error.message);
      el.innerHTML = `<div class="friends-error">加载失败: ${error.message}</div>`;
    }
  }
};

// Stellar 主题服务初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Friends] DOMContentLoaded');
  
  // 查找所有友链容器
  const els = document.querySelectorAll('.users-wrap, .ds-friends, .service-friends');
  console.log('[Friends] 找到', els.length, '个友链元素');
  
  els.forEach((el, index) => {
    console.log('[Friends] 元素', index, ':', el);
    console.log('[Friends] 元素 dataset:', el.dataset);
    
    // 如果元素没有 API 属性，尝试从子元素获取
    if (!el.dataset.api) {
      const dataApi = el.querySelector('[data-api]');
      if (dataApi) {
        el.dataset.api = dataApi.dataset.api;
        console.log('[Friends] 从子元素获取 API:', el.dataset.api);
      } else if (ctx?.services?.friends?.api) {
        el.dataset.api = ctx.services.friends.api;
        console.log('[Friends] 从配置获取 API:', ctx.services.friends.api);
      }
    }
    
    if (el.dataset.api) {
      utils.friends.load(el);
    }
  });
});

// 兼容旧版本的自动初始化
setTimeout(() => {
  const els = document.querySelectorAll('.users-wrap, .ds-friends, .service-friends');
  els.forEach(el => {
    if (el.dataset.api && !el.querySelector('.friend-card')) {
      utils.friends.load(el);
    }
  });
}, 500);