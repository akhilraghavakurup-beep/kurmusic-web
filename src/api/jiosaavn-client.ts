import { Track, Album, Artist, Playlist, HomeFeedSection, SearchResults, AudioQuality } from "./types";
import { decryptMediaUrl } from "./decrypt";

const DIRECT_API_URL = "https://www.jiosaavn.com/api.php?_format=json&_marker=0&api_version=4&ctx=web6dot0";

export class JioSaavnClient {
  private customProxy: string = "";

  constructor(customProxy?: string) {
    if (customProxy) {
      this.customProxy = customProxy.trim();
    }
  }

  setProxy(proxy: string) {
    this.customProxy = proxy.trim();
  }

  private cleanText(str?: string | null): string {
    if (!str) return "";
    return str
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/<[^>]*>?/gm, "")
      .trim();
  }

  private upgradeImage(url?: string | null): string {
    if (!url) return "https://placehold.co/500x500/161129/9333EA?text=Kur+Music";
    return url
      .replace("150x150", "500x500")
      .replace("50x50", "500x500")
      .replace(/^http:\/\//i, "https://");
  }

  private async fetchApi<T>(params: Record<string, string | number>, timeoutMs = 2000): Promise<T> {
    const url = new URL(DIRECT_API_URL);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    const targetUrl = url.toString();

    const proxyList = this.customProxy 
      ? [this.customProxy, "https://api.codetabs.com/v1/proxy?quest="] 
      : ["https://api.codetabs.com/v1/proxy?quest="];

    let lastError: Error | null = null;

    for (const proxy of proxyList) {
      try {
        let requestUrl = targetUrl;
        if (proxy) {
          if (proxy.includes("?quest=") || proxy.includes("?url=")) {
            requestUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
          } else {
            requestUrl = `${proxy}/api.php?${url.searchParams.toString()}`;
          }
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(requestUrl, {
          signal: controller.signal,
          headers: { "Accept": "application/json, text/plain, */*" }
        });
        clearTimeout(timer);

        if (!res.ok) continue;

        const text = await res.text();
        const trimmed = text.trim();
        const jsonStart = trimmed.indexOf("{");
        const arrayStart = trimmed.indexOf("[");
        const start = jsonStart !== -1 && arrayStart !== -1 ? Math.min(jsonStart, arrayStart) : Math.max(jsonStart, arrayStart);
        
        if (start === -1) continue;
        return JSON.parse(trimmed.slice(start)) as T;
      } catch (err) {
        lastError = err as Error;
      }
    }

    throw lastError || new Error("CORS proxy timed out");
  }

  formatTrack(raw: any, preferredQuality: AudioQuality = "320kbps"): Track {
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
      artist: this.cleanText(raw.more_info?.artistMap?.primary_artists?.map((a: any) => a.name).join(", ") || raw.subtitle || raw.more_info?.singers || "Various Artists"),
      artistId: raw.more_info?.artistMap?.primary_artists?.[0]?.id,
      album: this.cleanText(raw.more_info?.album || raw.album || ""),
      albumId: raw.more_info?.album_id || raw.albumid,
      duration: parseInt(raw.more_info?.duration || raw.duration || "0", 10),
      image: this.upgradeImage(raw.image),
      audioUrl: audioUrl ? audioUrl.replace(/^http:\/\//i, "https://") : undefined,
      encryptedMediaUrl,
      year: raw.year || raw.more_info?.year,
      language: raw.language,
      hasLyrics: raw.more_info?.has_lyrics === "true" || Boolean(raw.has_lyrics)
    };
  }

  formatAlbum(raw: any): Album {
    return {
      id: String(raw.id),
      title: this.cleanText(raw.title || raw.name),
      artist: this.cleanText(raw.more_info?.artistMap?.primary_artists?.map((a: any) => a.name).join(", ") || raw.subtitle || raw.header_desc || ""),
      image: this.upgradeImage(raw.image),
      year: raw.year || raw.more_info?.year,
      songCount: parseInt(raw.more_info?.song_count || "0", 10)
    };
  }

  formatPlaylist(raw: any): Playlist {
    return {
      id: String(raw.id || raw.listid),
      title: this.cleanText(raw.title || raw.listname),
      subtitle: this.cleanText(raw.subtitle || raw.header_desc || raw.description || ""),
      image: this.upgradeImage(raw.image),
      songCount: parseInt(raw.more_info?.song_count || raw.list_count || "0", 10)
    };
  }

  formatArtist(raw: any): Artist {
    return {
      id: String(raw.id || raw.artistid),
      name: this.cleanText(raw.title || raw.name),
      image: this.upgradeImage(raw.image),
      role: raw.role || "Artist",
      followerCount: raw.more_info?.follower_count
    };
  }

  async getHomeFeed(selectedLanguage = "malayalam"): Promise<HomeFeedSection[]> {
    const lang = (selectedLanguage || "malayalam").toLowerCase().trim();

    // 1. Check direct real JioSaavn API launch feed bundled in web app
    try {
      const base = (import.meta as any).env?.BASE_URL || "./";
      const cleanBase = base.endsWith("/") ? base : base + "/";
      const res = await fetch(`${cleanBase}data/feeds/${lang}.json`);
      if (res.ok) {
        const feed = (await res.json()) as HomeFeedSection[];
        if (Array.isArray(feed) && feed.length > 0) {
          return feed;
        }
      }
    } catch (e) {
      console.warn("Local feed fetch error:", e);
    }

    // 2. If custom proxy is set, fetch live from JioSaavn API
    if (this.customProxy) {
      try {
        const data = await this.fetchApi<any>({
          __call: "webapi.getLaunchData",
          languages: lang
        }, 2500);

        const sections: HomeFeedSection[] = [];
        if (data && typeof data === "object") {
          const modules = data.modules || {};
          for (const key of Object.keys(modules)) {
            const mod = modules[key];
            const items = data[key];
            if (!mod || !Array.isArray(items) || items.length === 0) continue;

            const title = mod.title || key;
            const mappedItems = items.map((item: any) => {
              if (item.type === "song") return this.formatTrack(item);
              if (item.type === "album") return this.formatAlbum(item);
              if (item.type === "playlist") return this.formatPlaylist(item);
              if (item.type === "artist" || item.type === "radio_station") return this.formatArtist(item);
              if (item.song || item.encrypted_media_url) return this.formatTrack(item);
              return this.formatAlbum(item);
            });

            sections.push({
              id: key,
              title: this.cleanText(title),
              subtitle: mod.subtitle ? this.cleanText(mod.subtitle) : undefined,
              type: "mixed",
              items: mappedItems
            });
          }
        }
        if (sections.length > 0) return sections;
      } catch (err) {
        console.warn("Live API launch data error:", err);
      }
    }

    // 3. Fallback to curated seed
    return this.getCuratedFeedForLanguage(lang);
  }

  async getMultiLanguageHomeFeed(languages: string[]): Promise<HomeFeedSection[]> {
    const langs = languages && languages.length > 0 ? languages : ["malayalam"];
    if (langs.length === 1) {
      return this.getHomeFeed(langs[0]);
    }

    const feeds = await Promise.all(langs.map((l) => this.getHomeFeed(l)));
    const combined: HomeFeedSection[] = [];
    const maxSections = Math.max(...feeds.map((f) => f.length));

    for (let i = 0; i < maxSections; i++) {
      for (let j = 0; j < feeds.length; j++) {
        const section = feeds[j][i];
        if (section) {
          const langName = langs[j].charAt(0).toUpperCase() + langs[j].slice(1);
          const hasLangInTitle = section.title.toLowerCase().includes(langs[j].toLowerCase());
          const displayTitle = hasLangInTitle ? section.title : `${section.title} (${langName})`;

          combined.push({
            ...section,
            id: `${langs[j]}-${section.id}-${i}`,
            title: displayTitle,
          });
        }
      }
    }

    return combined;
  }

  getCuratedMultiLanguageFeed(languages: string[]): HomeFeedSection[] {
    const langs = languages && languages.length > 0 ? languages : ["malayalam"];
    if (langs.length === 1) {
      return this.getCuratedFeedForLanguage(langs[0]);
    }

    const feeds = langs.map((l) => this.getCuratedFeedForLanguage(l));
    const combined: HomeFeedSection[] = [];
    const maxSections = Math.max(...feeds.map((f) => f.length));

    for (let i = 0; i < maxSections; i++) {
      for (let j = 0; j < feeds.length; j++) {
        const section = feeds[j][i];
        if (section) {
          const langName = langs[j].charAt(0).toUpperCase() + langs[j].slice(1);
          const hasLangInTitle = section.title.toLowerCase().includes(langs[j].toLowerCase());
          const displayTitle = hasLangInTitle ? section.title : `${section.title} (${langName})`;

          combined.push({
            ...section,
            id: `curated-${langs[j]}-${section.id}-${i}`,
            title: displayTitle,
          });
        }
      }
    }

    return combined;
  }

  async search(query: string): Promise<SearchResults> {
    if (!query.trim()) {
      return { tracks: [], albums: [], artists: [], playlists: [] };
    }

    try {
      const data = await this.fetchApi<any>({
        __call: "search.getResults",
        q: query,
        p: 1,
        n: 24
      }, 2000);

      const tracks: Track[] = [];
      const albums: Album[] = [];
      const artists: Artist[] = [];
      const playlists: Playlist[] = [];

      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item.type === "song") tracks.push(this.formatTrack(item));
          else if (item.type === "album") albums.push(this.formatAlbum(item));
          else if (item.type === "artist") artists.push(this.formatArtist(item));
          else if (item.type === "playlist") playlists.push(this.formatPlaylist(item));
        }
      }

      return { tracks, albums, artists, playlists };
    } catch {
      return { tracks: [], albums: [], artists: [], playlists: [] };
    }
  }

  async getAlbum(albumId: string): Promise<Album | null> {
    try {
      const data = await this.fetchApi<any>({
        __call: "content.getAlbumDetails",
        albumid: albumId
      }, 2500);

      if (!data || (!data.id && !data.title)) return null;
      const songs: Track[] = (data.songs || data.list || []).map((s: any) => this.formatTrack(s));

      return {
        id: String(data.id || albumId),
        title: this.cleanText(data.title || data.name),
        artist: this.cleanText(data.primary_artists || data.artist || "Various Artists"),
        artistId: data.primary_artists_id,
        image: this.upgradeImage(data.image),
        year: data.year,
        songCount: songs.length,
        songs
      };
    } catch {
      return null;
    }
  }

  async getArtist(artistId: string): Promise<Artist | null> {
    try {
      const data = await this.fetchApi<any>({
        __call: "artist.getArtistPageDetails",
        artistId,
        artist_id: artistId
      }, 2500);

      if (!data) return null;
      const topSongs: Track[] = (data.topSongs || []).map((s: any) => this.formatTrack(s));
      const topAlbums: Album[] = (data.topAlbums || []).map((a: any) => this.formatAlbum(a));

      return {
        id: String(data.artistId || artistId),
        name: this.cleanText(data.name),
        image: this.upgradeImage(data.image),
        followerCount: data.follower_count || data.fan_count,
        bio: this.cleanText(data.bio?.[0]?.text || data.bio),
        role: data.role || "Artist",
        topSongs,
        topAlbums
      };
    } catch {
      return null;
    }
  }

  async getPlaylist(playlistId: string): Promise<Playlist | null> {
    try {
      const data = await this.fetchApi<any>({
        __call: "playlist.getDetails",
        listid: playlistId
      }, 2500);

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
    } catch {
      return null;
    }
  }

  async getLyrics(songId: string): Promise<string | null> {
    try {
      const data = await this.fetchApi<any>({
        __call: "lyrics.getLyrics",
        lyrics_id: songId
      }, 1500);
      return data.lyrics ? this.cleanText(data.lyrics) : null;
    } catch {
      return null;
    }
  }

  getCuratedFeedForLanguage(language: string): HomeFeedSection[] {
    const lang = (language || "").toLowerCase();

    if (lang.includes("malayalam")) {
      const tracks: Track[] = [
        {
          id: "wBgCQQ_6",
          title: "Illuminati",
          artist: "Sushin Shyam, Dabzee",
          album: "Aavesham",
          duration: 193,
          image: "https://c.saavncdn.com/202/Aavesham-Original-Motion-Picture-Soundtrack-Malayalam-2024-20250910150630-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDy4AJUV3zW12nH7q/z0LLO0mtlQEI+xyHP12xSNxdpYBkdjy+oQ7CrFBw7tS9a8Gtq",
          year: 2024,
          hasLyrics: true
        },
        {
          id: "DUjOqjSk",
          title: "Kuthanthram",
          artist: "Sushin Shyam, Vedan",
          album: "Manjummel Boys",
          duration: 240,
          image: "https://c.saavncdn.com/934/Manjummel-Boys-Original-Motion-Picture-Soundtrack-Malayalam-2024-20250905071140-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyLeOfp7FaONIZB0cQvmiwvAs+36GiCzcedSh85B58ENd1ISJg9R/7ghw7tS9a8Gtq",
          year: 2024,
          hasLyrics: true
        },
        {
          id: "GUURlhr1",
          title: "Aasa Kooda",
          artist: "Sai Abhyankkar, Sai Smriti",
          album: "Think Indie",
          duration: 215,
          image: "https://c.saavncdn.com/772/Aasa-Kooda-From-Think-Indie-Tamil-2024-20251026074529-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyvIF+e0e4CLskqX0QEd9GXfk8O2sKESAWRBQdD2ABq+T3Pn08clP73Bw7tS9a8Gtq",
          year: 2024,
          hasLyrics: true
        },
        {
          id: "minnalvala",
          title: "Minnalvala",
          artist: "Jakes Bejoy, Sid Sriram",
          album: "Narivetta",
          duration: 234,
          image: "https://c.saavncdn.com/255/Aavesham-Malayalam-2024-20240410183321-500x500.jpg",
          audioUrl: "https://aac.saavncdn.com/255/737cf6be36814b73e528dcba46fe7a5a_320.mp4",
          year: 2024,
          hasLyrics: true
        },
        {
          id: "chalakudy",
          title: "Chalakudikaran Changathi",
          artist: "Kalabhavan Mani",
          album: "Chalakudikaran Changathi",
          duration: 290,
          image: "https://c.saavncdn.com/934/Manjummel-Boys-Original-Motion-Picture-Soundtrack-Malayalam-2024-20250905071140-500x500.jpg",
          audioUrl: "https://aac.saavncdn.com/255/737cf6be36814b73e528dcba46fe7a5a_320.mp4",
          year: 2018,
          hasLyrics: false
        }
      ];

      const playlists: Playlist[] = [
        {
          id: "malayalam_top50",
          title: "Malayalam Top 50 Chartbusters",
          subtitle: "Aavesham, Manjummel Boys, Premalu and viral Malayalam hits",
          image: "https://c.saavncdn.com/202/Aavesham-Original-Motion-Picture-Soundtrack-Malayalam-2024-20250910150630-500x500.jpg",
          songCount: 50,
          songs: tracks
        },
        {
          id: "malayalam_melodies",
          title: "Malayalam Heart Melodies",
          subtitle: "Soulful Malayalam romantic ballads and slow evening tracks",
          image: "https://c.saavncdn.com/934/Manjummel-Boys-Original-Motion-Picture-Soundtrack-Malayalam-2024-20250905071140-500x500.jpg",
          songCount: 40,
          songs: tracks
        }
      ];

      const artists: Artist[] = [
        {
          id: "sushin_shyam",
          name: "Sushin Shyam",
          image: "https://c.saavncdn.com/202/Aavesham-Original-Motion-Picture-Soundtrack-Malayalam-2024-20250910150630-500x500.jpg",
          followerCount: "4,500,000",
          role: "Music Director"
        },
        {
          id: "jakes_bejoy",
          name: "Jakes Bejoy",
          image: "https://c.saavncdn.com/934/Manjummel-Boys-Original-Motion-Picture-Soundtrack-Malayalam-2024-20250905071140-500x500.jpg",
          followerCount: "2,900,000",
          role: "Composer"
        },
        {
          id: "ks_harisankar",
          name: "K. S. Harisankar",
          image: "https://c.saavncdn.com/artists/K_S_Harisankar_500x500.jpg",
          followerCount: "3,800,000",
          role: "Playback Singer"
        }
      ];

      return [
        { id: "malayalam-trending", title: "🔥 Trending in Malayalam", subtitle: "Top Mollywood chartbusters & viral releases", type: "track", items: tracks },
        { id: "malayalam-charts", title: "📈 Malayalam Top Charts", subtitle: "Top 50 countdowns and trending mixes", type: "playlist", items: playlists },
        { id: "malayalam-artists", title: "🎙️ Top Malayalam Artists", subtitle: "Sushin Shyam, Jakes Bejoy, and KS Harisankar", type: "mixed", items: artists }
      ];
    }

    if (lang.includes("tamil")) {
      const tracks: Track[] = [
        {
          id: "ahQg3u9E",
          title: "Naa Ready",
          artist: "Thalapathy Vijay, Anirudh Ravichander, Asal Kolaar",
          album: "Leo",
          duration: 248,
          image: "https://c.saavncdn.com/415/Leo-Original-Motion-Picture-Soundtrack-English-2023-20231019170311-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyy5Mc1F8mZ/QlkSmsH1C7sSANVPXKK0fY5LDViob2w/TMiXEBX4o75xw7tS9a8Gtq",
          year: 2023,
          hasLyrics: true
        },
        {
          id: "or8LPjW6",
          title: "Hukum - Thalaivar Alappara",
          artist: "Anirudh Ravichander, Super Subu",
          album: "Jailer",
          duration: 207,
          image: "https://c.saavncdn.com/187/Jailer-Tamil-2023-20230728081443-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyCa9BqALWw+YYOsQ3AdSjkQm9SXuw3FNEiYiIUasbdqw22lsEKeQCxhw7tS9a8Gtq",
          year: 2023,
          hasLyrics: true
        },
        {
          id: "lkaNaSDX",
          title: "Badass",
          artist: "Anirudh Ravichander",
          album: "Leo",
          duration: 229,
          image: "https://c.saavncdn.com/415/Leo-Original-Motion-Picture-Soundtrack-English-2023-20231019170311-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyoZG2mOw3h7ai9/zSWJaYeZHLa80WZbRv04xZC8HDbXzmVkMe/g4DSRw7tS9a8Gtq",
          year: 2023,
          hasLyrics: true
        },
        {
          id: "AgeRwxTb",
          title: "Arabic Kuthu - Halamithi Habibo",
          artist: "Anirudh Ravichander, Jonita Gandhi",
          album: "Beast",
          duration: 279,
          image: "https://c.saavncdn.com/510/Beast-Tamil-2022-20220504184736-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyPgia5m7T7U4VLl0JRX9Gn4HEX+RKmDEyEYR6Up7jk21qN7/qcIWm7Bw7tS9a8Gtq",
          year: 2022,
          hasLyrics: true
        }
      ];

      const artists: Artist[] = [
        {
          id: "829474",
          name: "Anirudh Ravichander",
          image: "https://c.saavncdn.com/artists/Anirudh_Ravichander_004_20231114094750_500x500.jpg",
          followerCount: "24,200,000",
          role: "Rockstar"
        },
        {
          id: "455130",
          name: "A.R. Rahman",
          image: "https://c.saavncdn.com/artists/A_R_Rahman_500x500.jpg",
          followerCount: "28,100,000",
          role: "Maestro"
        }
      ];

      return [
        { id: "tamil-trending", title: "🔥 Trending in Tamil", subtitle: "Kollywood mass bangers and viral chartbusters", type: "track", items: tracks },
        { id: "tamil-artists", title: "🎙️ Top Tamil Artists", subtitle: "Anirudh Ravichander, AR Rahman, and hitmakers", type: "mixed", items: artists }
      ];
    }

    if (lang.includes("telugu")) {
      const tracks: Track[] = [
        {
          id: "O94kBTtw",
          title: "Chuttamalle",
          artist: "Anirudh Ravichander, Shilpa Rao",
          album: "Devara Part 1",
          duration: 222,
          image: "https://c.saavncdn.com/313/Devara-Part-1-Telugu-Telugu-2024-20240926171010-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyMaCcla+iAEnWKGhjucPDOQMuVXLGmbqF4ufcJUQKLmvyzYWZhzpVWBw7tS9a8Gtq",
          year: 2024,
          hasLyrics: true
        },
        {
          id: "ARuXdxyk",
          title: "Kurchi Madathapetti",
          artist: "Thaman S, Sahithi Chaganti, Sri Krishna",
          album: "Guntur Kaaram",
          duration: 216,
          image: "https://c.saavncdn.com/000/Guntur-Kaaram-Telugu-2023-20240126145901-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyAYSpkEihdkG4+AFn1gYNkJM9bhyDhDoC00is5zg9wSEUPgFYtzlXCxw7tS9a8Gtq",
          year: 2024,
          hasLyrics: true
        }
      ];

      return [
        { id: "telugu-trending", title: "🔥 Trending in Telugu", subtitle: "Tollywood blockbusters and high-energy hits", type: "track", items: tracks }
      ];
    }

    if (lang.includes("punjabi")) {
      const tracks: Track[] = [
        {
          id: "iMzGQX6_",
          title: "Softly",
          artist: "Karan Aujla, Ikky",
          album: "Making Memories",
          duration: 155,
          image: "https://c.saavncdn.com/538/Making-Memories-English-2023-20230818075015-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDylPKbH4mxv9RsiqsthjFzNjlEb0IXXzKLuIGA3M2W5VKuRNI5HSFTvRw7tS9a8Gtq",
          year: 2023,
          hasLyrics: true
        },
        {
          id: "DF6eazs2",
          title: "Winning Speech",
          artist: "Karan Aujla, Mxrci",
          album: "Winning Speech",
          duration: 227,
          image: "https://c.saavncdn.com/089/Winning-Speech-Punjabi-2024-20260626013220-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyCMtZFlbMw/kiw79qyhddKTpV1LazIsgEoqUsLYfgWRaiWPfEsIXJvRw7tS9a8Gtq",
          year: 2024,
          hasLyrics: true
        },
        {
          id: "M7k5t7vw",
          title: "Lover",
          artist: "Diljit Dosanjh, Intense",
          album: "MoonChild Era",
          duration: 190,
          image: "https://c.saavncdn.com/209/MoonChild-Era-Punjabi-2021-20240715073449-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyGOTkumhHZmw/mu/QxvmNpLjCOjWwfdp/8CCN8k0UWa0fySIRHPdMMhw7tS9a8Gtq",
          year: 2021,
          hasLyrics: true
        }
      ];

      return [
        { id: "punjabi-trending", title: "🔥 Trending in Punjabi", subtitle: "Karan Aujla, Diljit Dosanjh, and top Punjabi bangers", type: "track", items: tracks }
      ];
    }

    if (lang.includes("english")) {
      const tracks: Track[] = [
        {
          id: "pizXlfUB",
          title: "Blinding Lights",
          artist: "The Weeknd",
          album: "The Highlights",
          duration: 204,
          image: "https://c.saavncdn.com/396/The-Highlights-English-2021-20240207045714-500x500.jpg",
          encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDy8IXxuTNJ1oLbvDGDneZj5h25kdaKPCof228ruhJnw7PIr7uKBnaPmxw7tS9a8Gtq",
          year: 2020,
          hasLyrics: true
        }
      ];

      return [
        { id: "english-trending", title: "🔥 Trending Global & English", subtitle: "Global billboard anthems and international hits", type: "track", items: tracks }
      ];
    }

    // Default Hindi
    const tracks: Track[] = [
      {
        id: "CVeqCCYc",
        title: "Tauba Tauba",
        artist: "Karan Aujla",
        album: "Bad Newz",
        duration: 207,
        image: "https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg",
        encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyexyhGiurcXEpCNi8gBIelM0+/bASiAx59yNTLyuH4My32JGBcP+xKhw7tS9a8Gtq",
        year: 2024,
        hasLyrics: true
      },
      {
        id: "Q6l0a09y",
        title: "Aaj Ki Raat",
        artist: "Sachin-Jigar, Madhubanti Bagchi, Divya Kumar",
        album: "Stree 2",
        duration: 228,
        image: "https://c.saavncdn.com/373/Stree-2-Hindi-2024-20240828083834-500x500.jpg",
        encryptedMediaUrl: "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDygSgTiGhJt3+zZ4cvKaFwYkIiuteEJ4SDHJMa6CwaiwaWmlZJO7fcMxw7tS9a8Gtq",
        year: 2024,
        hasLyrics: true
      },
      {
        id: "kesariya",
        title: "Kesariya",
        artist: "Pritam, Arijit Singh, Amitabh Bhattacharya",
        album: "Brahmastra",
        duration: 268,
        image: "https://c.saavncdn.com/191/Kesariya-From-Brahmastra-Hindi-2022-20220717092820-500x500.jpg",
        audioUrl: "https://aac.saavncdn.com/191/0c353932c6bb495fe0e6e885c42a7367_320.mp4",
        year: 2022,
        hasLyrics: true
      },
      {
        id: "chaleya",
        title: "Chaleya",
        artist: "Anirudh Ravichander, Arijit Singh, Shilpa Rao",
        album: "Jawan",
        duration: 200,
        image: "https://c.saavncdn.com/026/Chaleya-From-Jawan-Hindi-2023-20230814014337-500x500.jpg",
        audioUrl: "https://aac.saavncdn.com/026/bb1a0d8e8576449ee7d5ba09890a2a11_320.mp4",
        year: 2023,
        hasLyrics: true
      }
    ];

    const artists: Artist[] = [
      {
        id: "459320",
        name: "Arijit Singh",
        image: "https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg",
        followerCount: "38,500,000",
        role: "Singer"
      },
      {
        id: "456323",
        name: "Pritam",
        image: "https://c.saavncdn.com/artists/Pritam_Chakraborty-20170711073326_500x500.jpg",
        followerCount: "19,800,000",
        role: "Composer"
      }
    ];

    return [
      { id: "hindi-trending", title: "🔥 Trending in Hindi", subtitle: "Latest Bollywood chartbusters & viral songs", type: "track", items: tracks },
      { id: "hindi-artists", title: "🎙️ Top Artists", subtitle: "Arijit Singh, Pritam, and top vocalists", type: "mixed", items: artists }
    ];
  }
}

export const jioSaavnClient = new JioSaavnClient();
