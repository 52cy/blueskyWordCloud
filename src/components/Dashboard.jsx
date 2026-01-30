import React, { useState, useEffect, useCallback, useRef } from 'react';
import { JetstreamManager } from '../services/jetstream';
import { fetchRecentPosts } from '../services/search';
import WordCloud from './WordCloud';
import './Dashboard.css';

const Dashboard = ({ session }) => {
    const [filterInput, setFilterInput] = useState('Clair2026');
    const [targetTags, setTargetTags] = useState(['clair2026']);
    const [tagCounts, setTagCounts] = useState({}); // Map<string, number>
    const [connected, setConnected] = useState(false);
    const [totalPosts, setTotalPosts] = useState(0);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const jetstreamRef = useRef(null);

    // Common stopwords to exclude (English + French basics since context is mixed)
    const STOPWORDS = new Set([
        'the', 'and', 'for', 'with', 'this', 'that', 'have', 'from', 'your', 'are', 'not', 'can', 'all', 'tim', 'was', 'were', 'will', 'what', 'who', 'when', 'where', 'why', 'how', 'but', 'out', 'about', 'more', 'right', 'wow', 'nice', 'great', 'love', 'day', 'time', 'see', 'get', 'one', 'good',
        'le', 'la', 'les', 'des', 'est', 'sont', 'une', 'pour', 'avec', 'dans', 'sur', 'par', 'pas', 'que', 'qui', 'aux', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'nous', 'vous', 'ils', 'elles', 'cette', 'cet', 'ces', 'mais', 'ou', 'et', 'donc', 'or', 'ni', 'car', 'tout', 'tous', 'toute', 'toutes', 'fait', 'faut', 'ce', 'se', 'comme', 'leur', 'bien', 'encore', 'aussi',
        'http', 'https', 'com', 'org', 'net', 'www', 'bluesky', 'bsky', 'app', 'social', 'live', 'youtu', 'youtube', 'twitch'
    ]);

    const extractWords = useCallback((text) => {
        if (!text) return [];
        // Remove URLs (standard http/https) and common www/domain patterns
        let cleanText = text.replace(/https?:\/\/[^\s]+/g, '');
        cleanText = cleanText.replace(/www\.[^\s]+/g, '');

        // Split by non-word chars (keep accents for French), INCLUDING SLASHES and dots to break domains
        const candidates = cleanText.split(/[\s,.!?;:()\[\]"{}_/|\\-]+/);

        return candidates
            .map(w => w.toLowerCase().replace(/^#/, '').trim())
            .filter(w =>
                w.length > 3 && // Filter short words
                !STOPWORDS.has(w) && // Filter stopwords
                !w.match(/^\d+$/) && // Filter strict numbers
                !w.startsWith('@') && // Exclude handles
                !w.includes('/') && // Extra safety against URL fragments
                !w.includes('.')    // Extra safety against domain fragments
            );
    }, []);

    useEffect(() => {
        // Initialize Jetstream
        jetstreamRef.current = new JetstreamManager(targetTags);

        const handleMessage = (event) => {
            setTotalPosts(prev => prev + 1);

            const { tags, text } = event;
            const textWords = extractWords(text);
            const normalizedTags = tags.map(t => t.toLowerCase().replace(/^#/, ''));

            // Combine hashtags and text words
            const allItems = [...normalizedTags, ...textWords];

            setTagCounts(prevCounts => {
                const newCounts = { ...prevCounts };

                allItems.forEach(item => {
                    // Filter logic:
                    if (targetTags.includes(item)) return;

                    newCounts[item] = (newCounts[item] || 0) + 1;
                });
                return newCounts;
            });
        };

        jetstreamRef.current.connect(handleMessage);
        setConnected(true);

        return () => {
            if (jetstreamRef.current) {
                jetstreamRef.current.disconnect();
            }
        };
    }, [extractWords]); // Stable dependency

    useEffect(() => {
        if (jetstreamRef.current) {
            jetstreamRef.current.setFilterTags(targetTags);
            // Reset counts when tag changes?
            setTagCounts({});
            setTotalPosts(0);
        }
    }, [targetTags]);


    const handleStart = async () => {
        const tags = filterInput.split(',')
            .map(s => s.trim().toLowerCase().replace(/^#/, ''))
            .filter(s => s.length > 0);

        setTargetTags(tags);

        // Fetch History for the PRIMARY tag (limit 100)
        if (tags.length > 0) {
            setIsLoadingHistory(true);
            const historicalBatches = await fetchRecentPosts(tags[0], session?.accessJwt);

            setTagCounts(prev => {
                const newCounts = { ...prev };
                let count = 0;

                console.log(`Target Tags for filter:`, tags);

                historicalBatches.forEach(batch => {
                    // Batch is now an object { tags: [], text: "" } based on search.js update
                    // Or search.js returns ARRAY of these objects.
                    // Let's align: fetchRecentPosts returns `data.posts.map(...)` -> Array of objects.
                    // Wait, `historicalBatches` in previous code was treated as `forEach(batchTags => ...)`
                    // My search.js update makes it return `[{tags:[], text:''}, ...]` directly.
                    // So `historicalBatches` IS the array of posts.

                    count++;
                    const { tags: postTags, text } = batch;
                    const textWords = extractWords(text);
                    const normalizedPostTags = postTags.map(t => t.toLowerCase().replace(/^#/, ''));
                    const allItems = [...normalizedPostTags, ...textWords];

                    allItems.forEach(item => {
                        // Strict filter: check exact match against target set
                        if (tags.includes(item)) {
                            return;
                        }
                        newCounts[item] = (newCounts[item] || 0) + 1;
                    });
                });

                setTotalPosts(prevTotal => prevTotal + count);
                return newCounts;
            });
            setIsLoadingHistory(false);
        }
    };

    // Prepare data for WordCloud
    // Convert dict to array, sort, slice top N
    const words = Object.keys(tagCounts)
        .filter(key => !targetTags.includes(key)) // Explicitly exclude target tags from the cloud
        .map(key => ({ text: key, value: tagCounts[key] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 300); // Increased limit to 300 to better fill the lighthouse shape

    const [isFullScreen, setIsFullScreen] = useState(false);

    // ... (rest of useEffects) ...

    return (
        <div className="dashboard">
            {/* CLAIR Logo Toggle */}
            <div
                className="fullscreen-toggle"
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Show Header" : "Full Screen Mode"}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 10000,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    height: '40px', // Reduced Size
                    opacity: 0.9
                }}
            >
                <img
                    src="/clair_logo.png"
                    alt="CLAIR Logo"
                    style={{
                        height: '100%',
                        width: 'auto',
                        objectFit: 'contain',
                        display: 'block'
                    }}
                />
            </div>

            {!isFullScreen && (
                <header className="header">
                    <div className="controls">
                        <input
                            type="text"
                            value={filterInput}
                            onChange={(e) => setFilterInput(e.target.value)}
                            placeholder="Enter hashtags (e.g. event2024, conf)"
                        />
                        <button onClick={handleStart}>Monitor</button>
                    </div>
                    <div className="stats">
                        <span className={`status ${connected ? 'live' : ''}`}>
                            {connected ? '● LIVE' : '○ DISCONNECTED'}
                        </span>
                        <span>Target: {targetTags.map(t => `#${t}`).join(', ')}</span>
                        <span>Posts: {totalPosts} {isLoadingHistory ? '(Backfilling...)' : ''}</span>
                    </div>
                </header>
            )}

            <main className="visualization-area" style={{
                height: isFullScreen ? '100vh' : 'calc(100vh - 80px)', // Adjust based on header height 
                padding: isFullScreen ? 0 : '1rem',
                transition: 'all 0.5s ease'
            }}>
                {words.length === 0 ? (
                    <div className="placeholder">
                        Waiting for activity on #{targetTags.join(', #')}...
                    </div>
                ) : (
                    <WordCloud
                        words={words}
                        width={window.innerWidth - (isFullScreen ? 20 : 40)}
                        height={isFullScreen ? window.innerHeight : 600}
                    />
                )}
            </main>
        </div>
    );
};

export default Dashboard;
