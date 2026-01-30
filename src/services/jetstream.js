export class JetstreamManager {
  constructor(filterTags = []) {
    this.instances = [
      'wss://jetstream1.us-west.bsky.network/subscribe',
      'wss://jetstream2.us-west.bsky.network/subscribe',
      'wss://jetstream1.us-east.bsky.network/subscribe',
      'wss://jetstream2.us-east.bsky.network/subscribe'
    ];
    this.currentInstanceIndex = 0;
    this.url = `${this.instances[0]}?wantedCollections=app.bsky.feed.post`;

    this.ws = null;
    this.filterTags = filterTags.map(t => t.toLowerCase().replace(/^#/, ''));
    this.onMessageCallback = null;
    this.isConnected = false;
    this.shouldReconnect = false;

    // Simple blocklist for inappropriate content commonly found in firehose
    // This helps keep the word cloud "cleaner" for education events
    this.blocklist = [
      'nsfw', 'porn', 'xxx', 'hentai', 'onlyfans',
      'nude', 'mature', '18+', 'sexual', 'lewd',
      'femboy', 'furry', 'yiff', 'hazbin', 'vtuber', // Common spam sources
      'ass', 'trump', 'politics'
    ];
  }

  setFilterTags(tags) {
    this.filterTags = tags.map(t => t ? t.toLowerCase().replace(/^#/, '') : '').filter(t => t.length > 0);
  }

  connect(onMessage) {
    this.onMessageCallback = onMessage;
    this.shouldReconnect = true;

    // Update URL based on current instance
    this.url = `${this.instances[this.currentInstanceIndex]}?wantedCollections=app.bsky.feed.post`;

    console.log(`Connecting to Jetstream (${this.instances[this.currentInstanceIndex]})...`);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Jetstream connected');
      this.isConnected = true;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.processEvent(data);
      } catch (e) {
        console.error('Error parsing Jetstream message', e);
      }
    };

    this.ws.onclose = () => {
      console.log('Jetstream disconnected');
      this.isConnected = false;
      if (this.shouldReconnect) {
        // Automatically switch to next instance
        this.rotateInstance();
        setTimeout(() => this.connect(this.onMessageCallback), 2000);
      }
    };

    this.ws.onerror = (err) => {
      console.error('Jetstream error:', err);
      // onclose will handle reconnection
    };
  }

  rotateInstance() {
    this.currentInstanceIndex = (this.currentInstanceIndex + 1) % this.instances.length;
    console.log(`Switching to Jetstream instance: ${this.instances[this.currentInstanceIndex]}`);
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }

  processEvent(event) {
    if (event.kind !== 'commit' || !event.commit || event.commit.operation !== 'create') return;

    const record = event.commit.record;
    if (!record || !record.text) return;

    // strict language filtering
    if (!record.langs || !record.langs.some(l => l.startsWith('fr'))) return;

    let tags = new Set();

    if (record.facets) {
      for (const facet of record.facets) {
        const features = facet.features || [];
        for (const feature of features) {
          if (feature.$type === 'app.bsky.richtext.facet#tag' && feature.tag) {
            tags.add(feature.tag.toLowerCase());
          }
        }
      }
    } else {
      const matches = record.text.match(/#[a-z0-9_]+/gi);
      if (matches) {
        matches.forEach(m => tags.add(m.substring(1).toLowerCase()));
      }
    }

    if (tags.size === 0) return;

    const foundTagsArray = Array.from(tags);
    let matchFound = false;

    // Strict Filter Logic
    if (this.filterTags.length > 0) {
      matchFound = foundTagsArray.some(t => this.filterTags.includes(t));
    } else {
      matchFound = false; // Do not show firehose if no filter tags set
    }

    if (matchFound) {
      // Clean tags against blocklist before emitting
      const cleanTags = foundTagsArray.filter(t => !this.blocklist.some(b => t.includes(b)));

      if (this.onMessageCallback) {
        this.onMessageCallback({
          tags: cleanTags,
          text: record.text,
          lang: record.langs ? record.langs[0] : 'en',
          timestamp: new Date()
        });
      }
    }
  }
}
