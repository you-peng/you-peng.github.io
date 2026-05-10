console.log('[Link Guard] 安全验证组件已加载');

(function() {
    'use strict';

    let hasRedirected = false;

    function safeRedirect(url) {
        if (!hasRedirected) {
            hasRedirected = true;
            window.location.href = url;
        }
    }

    function getCurrentDomain() {
        return window.location.hostname.replace('www.', '');
    }

    function getUrlDomain(url) {
        try {
            if (url.startsWith('/')) {
                url = window.location.origin + url;
            } else if (url.startsWith('./') || url.startsWith('../')) {
                url = new URL(url, window.location.href).href;
            }
            const domain = new URL(url).hostname.replace('www.', '');
            return domain;
        } catch {
            return null;
        }
    }

    function isExternalUrl(url) {
        if (!url || url.startsWith('#') || url.startsWith('javascript:')) {
            return false;
        }
        const currentDomain = getCurrentDomain();
        const targetDomain = getUrlDomain(url);
        if (!targetDomain) {
            return false;
        }
        return targetDomain !== currentDomain;
    }

    const DEFAULT_CONFIG = {
        title: '即将离开本站',
        description: '您即将访问一个外部链接，请确认链接安全后继续访问。',
        buttonText: '继续访问',
        cancelText: '返回',
        debug: true,
        excludeSelectors: [],
        includeSelectors: ['a'],
        checkTwikoo: true,
        whitelist: {
            domains: [
                'github.com',
                'gitee.com',
                // 'bilibili.com',
                'api.iconify.design',
                'gcore.jsdelivr.net',
                'unpkg.com',
                'deepseek.com'
            ],
            prefixes: [],
            contains: [
                'localhost',
                '127.0.0.1'
            ]
        }
    };

    let config = Object.assign({}, DEFAULT_CONFIG);

    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    async function loadConfig() {
        try {
            const response = await fetch('/link-guard.json');
            if (response.ok) {
                const data = await response.json();
                if (data.whitelist) {
                    config.whitelist = data.whitelist;
                }
                if (data.config) {
                    deepMerge(config, data.config);
                }
                if (config.debug) {
                    console.log('[Link Guard] JSON 配置加载成功', config);
                }
            }
        } catch (e) {
            if (config.debug) {
                console.log('[Link Guard] JSON 配置加载失败', e);
            }
        }

        if (typeof window.LinkGuardConfig === 'object') {
            if (window.LinkGuardConfig.whitelist) {
                config.whitelist = window.LinkGuardConfig.whitelist;
            }
            if (window.LinkGuardConfig.config) {
                deepMerge(config, window.LinkGuardConfig.config);
            }
            if (config.debug) {
                console.log('[Link Guard] 合并 window.LinkGuardConfig');
            }
        }
    }

    function isInternalLink(url) {
        try {
            const currentHost = window.location.host;
            const linkHost = new URL(url, window.location.origin).host;
            return linkHost === currentHost || url.startsWith('/') || url.startsWith('#');
        } catch (e) {
            return false;
        }
    }

    function isInWhitelist(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            const hostname = urlObj.hostname;
            const fullUrl = urlObj.href;

            for (const domain of config.whitelist.domains) {
                if (hostname === domain || hostname.endsWith('.' + domain)) {
                    if (config.debug) {
                        console.log('[Link Guard] 域名白名单匹配:', domain);
                    }
                    return true;
                }
            }

            for (const prefix of config.whitelist.prefixes) {
                if (fullUrl.startsWith(prefix)) {
                    if (config.debug) {
                        console.log('[Link Guard] 前缀白名单匹配:', prefix);
                    }
                    return true;
                }
            }

            for (const contain of config.whitelist.contains) {
                if (fullUrl.includes(contain)) {
                    if (config.debug) {
                        console.log('[Link Guard] 包含白名单匹配:', contain);
                    }
                    return true;
                }
            }

            return false;
        } catch (e) {
            return false;
        }
    }

    function createModal(targetUrl) {
        const existingModal = document.getElementById('link-guard-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHtml = `
            <div id="link-guard-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 40px 20px;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(8px);
                z-index: 9999;">
                <div style="
                    background: var(--card);
                    border-radius: 24px;
                    padding: 48px;
                    max-width: 600px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    position: relative;
                    z-index: 10000;">
                    <div style="font-size: 64px; margin-bottom: 24px;">⚠️</div>
                    <h1 style="font-size: 28px; margin: 0 0 16px 0; color: var(--text);">${config.title}</h1>
                    <p style="color: var(--text-secondary); margin: 0 0 32px 0; line-height: 1.6;">${config.description}</p>
                    <div style="
                        background: var(--block);
                        padding: 16px 24px;
                        border-radius: 12px;
                        margin-bottom: 32px;
                        text-align: left;
                        word-break: break-all;">
                        <span style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary);">目标网址：</span>
                        <span style="color: var(--link); font-family: 'Menlo', 'Monaco', monospace; font-size: 14px;">${targetUrl}</span>
                    </div>
                    <div style="display: flex; gap: 16px; justify-content: center;">
                        <button id="link-guard-cancel" style="
                            padding: 14px 32px;
                            border: none;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s;
                            background: var(--block);
                            color: var(--text);">${config.cancelText}</button>
                        <button id="link-guard-continue" style="
                            padding: 14px 32px;
                            border: none;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;">${config.buttonText}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const continueBtn = document.getElementById('link-guard-continue');
        const cancelBtn = document.getElementById('link-guard-cancel');
        const modal = document.getElementById('link-guard-modal');

        if (continueBtn) {
            continueBtn.addEventListener('click', function() {
                closeModal();
                window.open(targetUrl, '_blank');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                closeModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    function closeModal() {
        const modal = document.getElementById('link-guard-modal');
        if (modal) {
            modal.remove();
        }
    }

    function handleLinkClick(event) {
        const target = event.target.closest('a');
        if (!target) return;

        const href = target.getAttribute('href');
        if (!href) return;

        if (href.startsWith('#')) return;

        for (const selector of config.excludeSelectors) {
            if (target.matches(selector)) {
                if (config.debug) {
                    console.log('[Link Guard] 链接被排除:', href);
                }
                return;
            }
        }

        if (isInternalLink(href)) {
            if (config.debug) {
                console.log('[Link Guard] 内部链接，直接打开:', href);
            }
            return;
        }

        if (isInWhitelist(href)) {
            if (config.debug) {
                console.log('[Link Guard] 白名单链接，直接打开:', href);
            }
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (config.debug) {
            console.log('Opening external link:', href);
        }

        createModal(href);
    }

    async function init() {
        await loadConfig();
        document.addEventListener('click', handleLinkClick, true);

        if (config.checkTwikoo) {
            const observer = new MutationObserver(function(mutations) {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0 && config.debug) {
                        console.log('[Link Guard] 检测到 DOM 变化');
                    }
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        if (config.debug) {
            console.log('[Link Guard] 已初始化，配置:', config);
        }
    }

    window.LinkGuard = {
        config: config,
        isInternalLink: isInternalLink,
        isInWhitelist: isInWhitelist,
        createModal: createModal,
        closeModal: closeModal
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
