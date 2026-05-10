if (typeof ApiServices === 'undefined') {
  const ApiServices = (function() {
    const ech0ApiBase = Config.api.ech0.baseUrl;
    const memosApiBase = Config.api.memos.baseUrl;
    const defaultTimeout = Config.api.ech0.timeout;
    const defaultPageSize = Config.request.defaultPageSize;

    async function request(url, options = {}) {
      const {
        method = 'GET',
        headers = {},
        body = null,
        timeout = defaultTimeout,
        baseUrl = ''
      } = options;

      const fullUrl = baseUrl ? `${baseUrl}${url}` : url;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(fullUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...headers
          },
          body: body ? JSON.stringify(body) : null,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }

    const Ech0Api = {
      async getEchos(page = 1, pageSize = defaultPageSize) {
        return request('/api/echo/query', {
          method: 'POST',
          body: { page, pageSize },
          baseUrl: ech0ApiBase,
          timeout: Config.api.ech0.timeout
        });
      }
    };

    const MemosApi = {
      async getMemos(page = 1, pageSize = defaultPageSize) {
        return request('/api/echo/query', {
          method: 'POST',
          body: { page, pageSize },
          baseUrl: memosApiBase,
          timeout: Config.api.memos.timeout
        });
      }
    };

    const CommonApi = {
      async getPublicIp() {
        const apis = [
          'https://api.myip.com',
          'https://httpbin.org/ip',
          'https://api.ipify.org?format=json'
        ];
        
        for (const api of apis) {
          try {
            const result = await request(api, { timeout: 5000 });
            if (result && (result.ip || result.origin)) {
              return { ip: result.ip || result.origin };
            }
          } catch (error) {
            console.log(`[CommonApi] Failed to fetch IP from ${api}:`, error.message);
          }
        }
        throw new Error('Failed to get public IP');
      },

      async getLocation(ipv4) {
        const apis = [
          `https://freegeoip.app/json/${ipv4}`,
          `https://ipapi.co/${ipv4}/json/`
        ];
        
        for (const api of apis) {
          try {
            const result = await request(api, { timeout: 5000 });
            if (result && (result.region_name || result.region || result.city)) {
              return {
                ip: ipv4,
                region: result.region_name || result.region,
                city: result.city,
                country_name: result.country_name || result.country_code || '中国'
              };
            }
          } catch (error) {
            console.log(`[CommonApi] Failed to fetch location from ${api}:`, error.message);
          }
        }
        throw new Error('Failed to get location');
      }
    };

    return {
      Ech0Api,
      MemosApi,
      CommonApi
    };
  })();

  if (typeof window !== 'undefined') {
    window.ApiServices = ApiServices;
  }
}