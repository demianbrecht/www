(function() {
  const MEDIUM_FEED_URL = 'https://medium.com/feed/@demianbrecht';
  const DEVTO_API_URL = 'https://dev.to/api/articles?username=demianbrecht&per_page=5';
  const CORSPROXY_URL = 'https://corsproxy.io/?';
  const MAX_POSTS = 5;

  // Add articles here to pin them to the top
  const PINNED_ARTICLES = [
    // { title: 'Example Article Title', source: 'Medium' },
    {title: "Inner Sourcing: What's this?", source: "Medium"}
  ];

  // GitHub achievements (manually maintained)
  // Run `make achievements` to see instructions for updating
  const GITHUB_ACHIEVEMENTS = [
    { name: 'Pull Shark', tier: 'x3', description: 'Opened pull requests that have been merged' },
    { name: 'Starstruck', tier: 'x2', description: 'Created a repository that has many stars' },
    { name: 'Pair Extraordinaire', tier: null, description: 'Coauthored commits on merged pull requests' },
    { name: 'Quickdraw', tier: null, description: 'Closed an issue or pull request within 5 minutes of opening' },
    { name: 'Arctic Code Vault Contributor', tier: null, description: 'Contributed code to repositories archived in the 2020 Arctic Code Vault' },
    { name: 'Mars 2020 Contributor', tier: null, description: 'Contributed code to repositories used in the Mars 2020 Helicopter Mission' },
  ];

  // Pinned repositories (manually maintained - just the names)
  const PINNED_REPOS = ['django-declarative-apis', 'sanction', 'django-sanction'];
  const GITHUB_USERNAME = 'demianbrecht';

  const CACHE_KEY = 'demianbrecht_posts';
  const REPOS_CACHE_KEY = 'demianbrecht_repos';
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

  function getCachedPosts() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { timestamp, posts } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      // Restore date objects
      return posts.map(post => ({ ...post, date: new Date(post.date) }));
    } catch (e) {
      return null;
    }
  }

  function cachePosts(posts) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        posts: posts
      }));
    } catch (e) {
      // Storage full or unavailable
    }
  }

  function extractMediumPublication(item) {
    const url = item.querySelector('link')?.textContent || '';
    // Match medium.com/publication-name/ or publication.medium.com
    const pubMatch = url.match(/medium\.com\/([^/@][^/]+)\//);
    if (pubMatch) {
      return pubMatch[1].replace(/-/g, ' ');
    }
    const subdomainMatch = url.match(/\/\/([^.]+)\.medium\.com/);
    if (subdomainMatch && subdomainMatch[1] !== 'www') {
      return subdomainMatch[1].replace(/-/g, ' ');
    }
    return null;
  }

  async function fetchMediumPosts() {
    try {
      const response = await fetch(CORSPROXY_URL + encodeURIComponent(MEDIUM_FEED_URL));
      if (!response.ok) throw new Error('Medium fetch failed');

      const xml = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      const items = doc.querySelectorAll('item');
      return Array.from(items).map(item => ({
        title: item.querySelector('title')?.textContent || '',
        url: item.querySelector('link')?.textContent || '',
        date: new Date(item.querySelector('pubDate')?.textContent || 0),
        source: 'Medium',
        publication: extractMediumPublication(item)
      }));
    } catch (e) {
      console.error('Medium fetch error:', e);
      return [];
    }
  }

  async function fetchDevtoPosts() {
    try {
      const response = await fetch(DEVTO_API_URL);
      if (!response.ok) throw new Error('Dev.to fetch failed');

      const articles = await response.json();

      return articles.map(article => ({
        title: article.title,
        url: article.url,
        date: new Date(article.published_at),
        source: 'Dev.to',
        publication: null
      }));
    } catch (e) {
      console.error('Dev.to fetch error:', e);
      return [];
    }
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function renderPosts(posts) {
    const container = document.getElementById('posts-container');

    if (!posts.length) {
      container.innerHTML = '<p class="posts-error">Unable to load posts.</p>';
      return;
    }

    const pinIcon = `<svg class="pin-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/></svg>`;

    const html = `
      <ul class="posts-list">
        ${posts.map(post => `
          <li class="post-item${post.pinned ? ' is-pinned' : ''}">
            <a href="${post.url}" class="post-link" target="_blank" rel="noopener">
              <div class="post-title">${post.pinned ? pinIcon : ''}${post.title}</div>
              <div class="post-meta">
                <span class="post-date">${formatDate(post.date)}</span>
                <span class="post-source">${post.source}${post.publication ? ` / ${post.publication}` : ''}</span>
              </div>
            </a>
          </li>
        `).join('')}
      </ul>
    `;

    container.innerHTML = html;
  }

  function normalizeTitle(title) {
    return title
      .trim()
      .toLowerCase()
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
  }

  function isPinned(title, source) {
    const normalized = normalizeTitle(title);
    return PINNED_ARTICLES.some(pinned =>
      normalizeTitle(pinned.title) === normalized && pinned.source === source
    );
  }

  function deduplicateByTitle(posts) {
    const seen = new Set();
    return posts.filter(post => {
      const normalized = normalizeTitle(post.title);
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }

  function getCachedRepos() {
    try {
      const cached = localStorage.getItem(REPOS_CACHE_KEY);
      if (!cached) return null;
      const { timestamp, repos } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(REPOS_CACHE_KEY);
        return null;
      }
      return repos;
    } catch (e) {
      return null;
    }
  }

  function cacheRepos(repos) {
    try {
      localStorage.setItem(REPOS_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        repos: repos
      }));
    } catch (e) {}
  }

  async function fetchRepoData(repoName) {
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}`);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        name: data.name,
        description: data.description || '',
        language: data.language || '',
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        url: data.html_url
      };
    } catch (e) {
      return null;
    }
  }

  function renderReposHTML(repos) {
    const container = document.getElementById('repos-container');
    if (!container) return;

    const starIcon = `<svg class="repo-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>`;
    const forkIcon = `<svg class="repo-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>`;

    const html = `
      <div class="repos-grid">
        ${repos.map(repo => `
          <a href="${repo.url}" class="repo-card" target="_blank" rel="noopener">
            <div class="repo-header">
              <span class="repo-name">${repo.name}</span>
            </div>
            <p class="repo-description">${repo.description}</p>
            <div class="repo-meta">
              ${repo.language ? `<span class="repo-language"><span class="language-dot"></span>${repo.language}</span>` : ''}
              <span class="repo-stat">${starIcon}${repo.stars}</span>
              <span class="repo-stat">${forkIcon}${repo.forks}</span>
            </div>
          </a>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  async function loadRepos() {
    const container = document.getElementById('repos-container');
    if (!container) return;

    const cached = getCachedRepos();
    if (cached) {
      renderReposHTML(cached);
      return;
    }

    const repos = await Promise.all(PINNED_REPOS.map(fetchRepoData));
    const validRepos = repos.filter(r => r !== null);

    if (validRepos.length) {
      cacheRepos(validRepos);
      renderReposHTML(validRepos);
    }
  }

  function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    const html = `
      <ul class="achievements-list">
        ${GITHUB_ACHIEVEMENTS.map(achievement => `
          <li class="achievement-item" data-tooltip="${achievement.description}">
            <span class="achievement-name">${achievement.name}</span>
            ${achievement.tier ? `<span class="achievement-tier">${achievement.tier}</span>` : ''}
          </li>
        `).join('')}
      </ul>
    `;

    container.innerHTML = html;
  }

  async function loadPosts() {
    // Check cache first
    const cachedPosts = getCachedPosts();
    if (cachedPosts) {
      renderPosts(cachedPosts);
      return;
    }

    const results = await Promise.allSettled([
      fetchMediumPosts(),
      fetchDevtoPosts()
    ]);

    const mediumPosts = results[0].status === 'fulfilled' ? results[0].value : [];
    const devtoPosts = results[1].status === 'fulfilled' ? results[1].value : [];

    const allPosts = deduplicateByTitle(
      [...mediumPosts, ...devtoPosts].sort((a, b) => b.date - a.date)
    ).map(post => ({
      ...post,
      pinned: isPinned(post.title, post.source)
    })).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.date - a.date;
    }).slice(0, MAX_POSTS);

    cachePosts(allPosts);
    renderPosts(allPosts);
  }

  function init() {
    loadRepos();
    renderAchievements();
    loadPosts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
