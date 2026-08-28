import { Track, Album, Artist, Playlist, HomeFeedSection, SearchResults, AudioQuality } from './types';
import { decryptMediaUrl } from './decrypt';

const DIRECT_API_URL = 'https://www.jiosaavn.com/api.php?_format=json&_marker=0&api_version=4&ctx=web6dot0';

// Default public CORS proxy list
const PROXY_CANDIDATES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?url=',
  'https://thingproxy.freeboard.io/fetch/'
];

export class JioSaavnClient {
  private customProxy: string = '';

  constructor(customProxy?: string) {
    if (customProxy) {
      this.customProxy = customProxy.trim();
    }
  }

  setProxy(proxy: string) {
    this.customProxy = proxy.trim();
  }

  private cleanText(str?: string | null): string {
    if (!str) return '';
    return str
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]*>?/gm, '')
      .trim();
  }

  private upgradeImage(url?: string | null): string {
    if (!url) return 'https://placehold.co/500x500/161129/9333EA?text=Kur+Music';
    return url
      .replace('150x150', '500x500')
      .replace('50x50', '500x500')
      .replace(/^http:\/\//i, 'https://');
  }

  private async fetchApi<T>(params: Record<string, string | number>): Promise<T> {
    const url = new URL(DIRECT_API_URL);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    const targetUrl = url.toString();

    // If user configured a custom proxy or Cloudflare Worker
    const proxyList = this.customProxy 
      ? [this.customProxy, ...PROXY_CANDIDATES] 
      : [...PROXY_CANDIDATES];

    let lastError: Error | null = null;

    for (const proxy of proxyList) {
      try {
        let requestUrl = targetUrl;
        if (proxy) {
          if (proxy.includes('?url=') || proxy.endsWith('/fetch/')) {
            requestUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
          } else if (proxy.endsWith('/')) {
            requestUrl = `${proxy}?${url.searchParams.toString()}`;
          } else {
            requestUrl = `${proxy}/api.php?${url.searchParams.toString()}`;
          }
        }

        const res = await fetch(requestUrl, {
          headers: {
            'Accept': 'application/json, text/plain, */*'
          }
        });

        if (!res.ok) continue;

        const text = await res.text();
        // Sometimes proxies wrap JSON in HTML or wrap in quotes
        const trimmed = text.trim();
        const jsonStart = trimmed.indexOf('{');
        const arrayStart = trimmed.indexOf('[');
        const start = jsonStart !== -1 && arrayStart !== -1 ? Math.min(jsonStart, arrayStart) : Math.max(jsonStart, arrayStart);
        
        if (start === -1) continue;
        const validJson = trimmed.slice(start);
        return JSON.parse(validJson) as T;
      } catch (err) {
        lastError = err as Error;
      }
    }

    throw lastError || new Error('All CORS proxies failed to connect to JioSaavn API');
  }

  formatTrack(raw: any, preferredQuality: AudioQuality = '320kbps'): Track {
    const encryptedMediaUrl = raw.more_info?.encrypted_media_url || raw.encrypted_media_url;
    let audioUrl = raw.more_info?.vlink || raw.media_preview_url;

    if (encryptedMediaUrl) {
      const decrypted = decryptMediaUrl(encryptedMediaUrl, preferredQuality);
      if (decrypted) {
        audioUrl = decrypted;
      }
    }

    return {
      id: String(raw.id),
      title: this.cleanText(raw.title || raw.song),
      artist: this.cleanText(raw.more_info?.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') || raw.subtitle || raw.more_info?.singers || 'Unknown Artist'),
      artistId: raw.more_info?.artistMap?.primary_artists?.[0]?.id,
      album: this.cleanText(raw.more_info?.album || raw.album || ''),
      albumId: raw.more_info?.album_id || raw.albumid,
      duration: parseInt(raw.more_info?.duration || raw.duration || '0', 10),
      image: this.upgradeImage(raw.image),
      audioUrl: audioUrl ? audioUrl.replace(/^http:\/\//i, 'https://') : undefined,
      encryptedMediaUrl,
      year: raw.year || raw.more_info?.year,
      language: raw.language,
      hasLyrics: raw.more_info?.has_lyrics === 'true' || Boolean(raw.has_lyrics)
    };
  }

  async getHomeFeed(languages = 'hindi,english'): Promise<HomeFeedSection[]> {
    try {
      const data = await this.fetchApi<any>({
        __call: 'webapi.getLaunchData',
        languages
      });

      const sections: HomeFeedSection[] = [];

      if (data.new_trending && Array.isArray(data.new_trending)) {
        sections.push({
          id: 'trending',
          title: '🔥 Trending Now',
          subtitle: 'Hottest releases and charts right now',
          type: 'mixed',
          items: data.new_trending.map((item: any) => 
            item.type === 'song' ? this.formatTrack(item) : this.formatAlbum(item)
          )
        });
      }

      if (data.charts && Array.isArray(data.charts)) {
        sections.push({
          id: 'charts',
          title: '📈 Top Charts',
          subtitle: 'Most played playlists & song charts',
          type: 'playlist',
          items: data.charts.map((item: any) => this.formatPlaylist(item))
        });
      }

      if (data.top_playlists && Array.isArray(data.top_playlists)) {
        sections.push({
          id: 'top-playlists',
          title: '✨ Curated Playlists',
          subtitle: 'Hand-picked for your vibe',
          type: 'playlist',
          items: data.top_playlists.map((item: any) => this.formatPlaylist(item))
        });
      }

      if (data.new_albums && Array.isArray(data.new_albums)) {
        sections.push({
          id: 'new-albums',
          title: '💿 Brand New Albums',
          subtitle: 'Fresh albums hot off the press',
          type: 'album',
          items: data.new_albums.map((item: any) => this.formatAlbum(item))
        });
      }

      return sections;
    } catch (err) {
      console.warn('Live JioSaavn feed error, falling back to curated essentials:', err);
      return this.getFallbackSeedFeed();
    }
  }

  async search(query: string): Promise<SearchResults> {
    if (!query.trim()) {
      return { tracks: [], albums: [], artists: [], playlists: [] };
    }

    try {
      const data = await this.fetchApi<any>({
        __call: 'search.getResults',
        q: query,
        p: 1,
        n: 20
      });

      const tracks: Track[] = [];
      const albums: Album[] = [];
      const artists: Artist[] = [];
      const playlists: Playlist[] = [];

      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item.type === 'song') {
            tracks.push(this.formatTrack(item));
          } else if (item.type === 'album') {
            albums.push(this.formatAlbum(item));
          } else if (item.type === 'artist') {
            artists.push(this.formatArtist(item));
          } else if (item.type === 'playlist') {
            playlists.push(this.formatPlaylist(item));
          }
        }
      }

      return { tracks, albums, artists, playlists };
    } catch (err) {
      console.error('Search API error:', err);
      return { tracks: [], albums: [], artists: [], playlists: [] };
    }
  }

  async getAlbum(albumId: string): Promise<Album | null> {
    try {
      const data = await this.fetchApi<any>({
        __call: 'content.getAlbumDetails',
        albumid: albumId
      });

      if (!data || (!data.id && !data.title)) return null;

      const songs: Track[] = (data.songs || data.list || []).map((s: any) => this.formatTrack(s));

      return {
        id: String(data.id || albumId),
        title: this.cleanText(data.title || data.name),
        artist: this.cleanText(data.primary_artists || data.artist || 'Various Artists'),
        artistId: data.primary_artists_id,
        image: this.upgradeImage(data.image),
        year: data.year,
        songCount: songs.length,
        songs
      };
    } catch (err) {
      console.error('Album fetch error:', err);
      return null;
    }
  }

  async getArtist(artistId: string): Promise<Artist | null> {
    try {
      const data = await this.fetchApi<any>({
        __call: 'artist.getArtistPageDetails',
        artistId,
        artist_id: artistId
      });

      if (!data) return null;

      const topSongs: Track[] = (data.topSongs || []).map((s: any) => this.formatTrack(s));
      const topAlbums: Album[] = (data.topAlbums || []).map((a: any) => this.formatAlbum(a));

      return {
        id: String(data.artistId || artistId),
        name: this.cleanText(data.name),
        image: this.upgradeImage(data.image),
        followerCount: data.follower_count || data.fan_count,
        bio: this.cleanText(data.bio?.[0]?.text || data.bio),
        topSongs,
        topAlbums
      };
    } catch (err) {
      console.error('Artist fetch error:', err);
      return null;
    }
  }

  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    try {
      const data = await this.fetchApi<any>({
        __call: 'playlist.getDetails',
        listid: playlistId
      });

      if (!data) return null;

      const songs: Track[] = (data.songs || data.list || []).map((s: any) => this.formatTrack(s));

      return {
        id: String(data.id || playlistId),
        title: this.cleanText(data.title || data.listname),
        subtitle: this.cleanText(data.subtitle || data.description),
        image: this.upgradeImage(data.image),
        songCount: songs.length,
        songs
      };
    } catch (err) {
      console.error('Playlist fetch error:', err);
      return null;
    }
  }

  async getLyrics(songId: string): Promise<string | null> {
    try {
      const data = await this.fetchApi<any>({
        __call: 'lyrics.getLyrics',
        lyrics_id: songId
      });
      return data.lyrics ? this.cleanText(data.lyrics) : null;
    } catch {
      return null;
    }
  }

  private formatAlbum(raw: any): Album {
    return {
      id: String(raw.id),
      title: this.cleanText(raw.title || raw.name),
      artist: this.cleanText(raw.more_info?.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') || raw.subtitle || raw.header_desc || ''),
      image: this.upgradeImage(raw.image),
      year: raw.year || raw.more_info?.year,
      songCount: parseInt(raw.more_info?.song_count || '0', 10)
    };
  }

  private formatPlaylist(raw: any): Playlist {
    return {
      id: String(raw.id || raw.listid),
      title: this.cleanText(raw.title || raw.listname),
      subtitle: this.cleanText(raw.subtitle || raw.header_desc || raw.description || ''),
      image: this.upgradeImage(raw.image),
      songCount: parseInt(raw.more_info?.song_count || raw.list_count || '0', 10)
    };
  }

  private formatArtist(raw: any): Artist {
    return {
      id: String(raw.id || raw.artistid),
      name: this.cleanText(raw.title || raw.name),
      image: this.upgradeImage(raw.image),
      role: raw.role,
      followerCount: raw.more_info?.follower_count
    };
  }

  /**
   * Curated offline/fallback seed tracks so the player starts instantly with stunning music even without a proxy
   */
  getFallbackSeedFeed(): HomeFeedSection[] {
    const seedTracks: Track[] = [
      {
        id: 'kesariya',
        title: 'Kesariya',
        artist: 'Pritam, Arijit Singh, Amitabh Bhattacharya',
        album: 'Brahmastra',
        duration: 268,
        image: 'https://c.saavncdn.com/191/Kesariya-From-Brahmastra-Hindi-2022-20220717092820-500x500.jpg',
        audioUrl: 'https://aac.saavncdn.com/191/0c353932c6bb495fe0e6e885c42a7367_320.mp4',
        year: 2022,
        hasLyrics: true
      },
      {
        id: 'chaleya',
        title: 'Chaleya',
        artist: 'Anirudh Ravichander, Arijit Singh, Shilpa Rao',
        album: 'Jawan',
        duration: 200,
        image: 'https://c.saavncdn.com/026/Chaleya-From-Jawan-Hindi-2023-20230814014337-500x500.jpg',
        audioUrl: 'https://aac.saavncdn.com/026/bb1a0d8e8576449ee7d5ba09890a2a11_320.mp4',
        year: 2023,
        hasLyrics: true
      },
      {
        id: 'heeriye',
        title: 'Heeriye (feat. Arijit Singh)',
        artist: 'Jasleen Royal, Arijit Singh, Dulquer Salmaan',
        album: 'Heeriye',
        duration: 194,
        image: 'https://c.saavncdn.com/022/Heeriye-feat-Arijit-Singh-Hindi-2023-20230928050405-500x500.jpg',
        audioUrl: 'https://aac.saavncdn.com/022/0458df589b9e64e101f37e42d7ce2f46_320.mp4',
        year: 2023,
        hasLyrics: true
      },
      {
        id: 'apna_bana_le',
        title: 'Apna Bana Le',
        artist: 'Sachin-Jigar, Arijit Singh, Amitabh Bhattacharya',
        album: 'Bhediya',
        duration: 261,
        image: 'https://c.saavncdn.com/815/Bhediya-Hindi-2022-20221207194017-500x500.jpg',
        audioUrl: 'https://aac.saavncdn.com/815/ea22998a44d82b43b355811776dbdc99_320.mp4',
        year: 2022,
        hasLyrics: true
      }
    ];

    return [
      {
        id: 'trending-hits',
        title: '🔥 Chartbusters & Trending Hits',
        subtitle: 'All-time favorite hits ready to stream instantly in 320kbps',
        type: 'track',
        items: seedTracks
      }
    ];
  }
}

export const jioSaavnClient = new JioSaavnClient();
