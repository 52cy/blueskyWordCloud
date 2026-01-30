export const fetchRecentPosts = async (tag, token) => {
    const cleanTag = tag.toLowerCase().replace(/^#/, '');

    const params = new URLSearchParams({
        q: `#${cleanTag} lang:fr`,
        limit: '100',
        sort: 'latest'
    });

    // Use relative path to trigger Vite proxy
    const url = `/xrpc/app.bsky.feed.searchPosts?${params.toString()}`;

    try {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
            console.error('Search API failed', response.statusText);
            return [];
        }

        const data = await response.json();
        if (!data.posts) return [];

        return data.posts.map(post => {
            // Extract hashtags from the post record text
            let tags = new Set();
            const text = post.record?.text || '';

            const matches = text.match(/#[a-z0-9_]+/gi);
            if (matches) {
                matches.forEach(m => tags.add(m.substring(1).toLowerCase()));
            }

            return {
                tags: Array.from(tags),
                text: text
            };
        });

    } catch (error) {
        console.error('Error fetching recent posts:', error);
        return [];
    }
};
