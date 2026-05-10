console.log('[欢迎页] 已加载');

(function() {
    let tries = 0;

    function init() {
        tries++;
        const widgets = document.querySelectorAll('.widget-wrapper.markdown');
        
        for (const widget of widgets) {
            const title = widget.querySelector('.widget-header .name');
            if (title && title.textContent.includes('欢迎来到我的博客')) {
                const body = widget.querySelector('.widget-body');
                console.log('[欢迎页] 找到 widget');
                loadData(body);
                return;
            }
        }
        
        if (tries < 100) {
            setTimeout(init, 100);
        }
    }

    async function loadData(widgetBody) {
        widgetBody.innerHTML = '<p>正在加载...</p>';

        try {
            const ipData = await ApiServices.CommonApi.getPublicIp();
            const ipv4 = ipData.ip;
            const locationData = await ApiServices.CommonApi.getLocation(ipv4);
            locationData.ip = ipv4;
            renderFull(locationData, widgetBody);
        } catch (error) {
            console.log('[欢迎页] 方案1失败，试方案2');
            try {
                const ipData = await ApiServices.CommonApi.getPublicIp();
                renderSimple(ipData.ip, widgetBody);
            } catch (error) {
                console.log('[欢迎页] 方案2失败，用固定内容');
                renderFallback(widgetBody);
            }
        }
    }

    function getFood(region) {
        if (!region) return '美食之旅即将开始！🍽️';
        if (region.includes('贵州') || region.includes('黔东南')) return '酸汤鱼就是开胃之王🐟';
        if (region.includes('四川')) return '火锅就是快乐源泉🔥';
        if (region.includes('广东')) return '早茶就是一天的开始🥟';
        if (region.includes('北京')) return '烤鸭就是经典中的经典🦆';
        if (region.includes('上海')) return '小笼包就是上海的味道🥢';
        return '美食之旅即将开始！🍽️';
    }

    function renderFull(data, widgetBody) {
        const ip = data.ip || '未知';
        const region = data.region || data.city || '未知';
        const country = data.country_name || '中国';
        const food = getFood(region);

        widgetBody.innerHTML = `
            <p>欢迎 ${country} ${region}的小伙伴 访问我的博客</p>
            <p>您的IP: ${buildIpBox(ip)}</p>
            <p>${food}</p>
            <p>关于我可以前往 <a href="/about">我的个人主页</a> 查看</p>
            <p>博客更新日志</p>
            <p>如果您觉得访问速度异常,不妨点击左下角邮件图标反馈给我</p>
        `;
        
        addIpEvents(widgetBody);
    }

    function renderSimple(ip, widgetBody) {
        widgetBody.innerHTML = `
            <p>欢迎访问我的博客</p>
            <p>您的IP: ${buildIpBox(ip)}</p>
            <p>关于我可以前往 <a href="/about">我的个人主页</a> 查看</p>
            <p>博客更新日志</p>
            <p>如果您觉得访问速度异常,不妨点击左下角邮件图标反馈给我</p>
        `;
        
        addIpEvents(widgetBody);
    }

    function renderFallback(widgetBody) {
        widgetBody.innerHTML = `
            <p>欢迎访问我的博客！👋</p>
            <p>关于我可以前往 <a href="/about">我的个人主页</a> 查看</p>
        `;
    }

    function buildIpBox(ip) {
        return `
            <span class="ip-box" data-ip="${ip}" title="点击复制，鼠标悬停可看完整IP"
                  style="display:inline-block;position:relative;cursor:pointer;">
                <span class="ip-text">${ip}</span>
                <span class="ip-mask" style="position:absolute;top:0;left:0;right:0;bottom:0;
                    background:rgba(255,235,180,0.95);border-radius:4px;transition:opacity 0.25s;"></span>
            </span>
        `;
    }

    function addIpEvents(widgetBody) {
        const ipBox = widgetBody.querySelector('.ip-box');
        if (!ipBox) return;
        
        const ipMask = ipBox.querySelector('.ip-mask');
        
        ipBox.addEventListener('mouseenter', () => ipMask.style.opacity = '0');
        ipBox.addEventListener('mouseleave', () => ipMask.style.opacity = '1');
        
        ipBox.addEventListener('click', () => {
            const fullIp = ipBox.getAttribute('data-ip');
            const ipText = ipBox.querySelector('.ip-text');
            const originalText = ipText.textContent;
            
            navigator.clipboard.writeText(fullIp).then(() => {
                ipText.textContent = '已复制！';
                ipMask.style.opacity = '0';
                setTimeout(() => {
                    ipText.textContent = originalText;
                    ipMask.style.opacity = '1';
                }, 1000);
            });
        });
    }

    console.log('[欢迎页] 初始化中');
    init();
})();