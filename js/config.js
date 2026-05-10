if (typeof Config === 'undefined') {
  const Config = {
    api: {
      ech0: {
        baseUrl: 'http://81.68.194.190:6277',
        timeout: 8000
      },
      memos: {
        baseUrl: 'http://81.68.194.190:6277',
        timeout: 8000
      }
    },

    MusicProvider: {
      NETEASE: 'netease',
      QQ: 'tencent',
      APPLE: 'apple'
    },

    ImageLayout: {
      GRID: 'GRID',
      HORIZONTAL: 'HORIZONTAL',
      WATERFALL: 'WATERFALL',
      STACK: 'STACK',
      CAROUSEL: 'CAROUSEL'
    },

    user: {
      username: 'EaseJi',
      avatar: null
    },

    avatar: 'https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/avatar/round/3442075.svg',

    request: {
      defaultPageSize: 20,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.Config = Config;
  }
}