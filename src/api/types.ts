export type AudioQuality = '320kbps' | '160kbps' | '96kbps';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  duration: number; // in seconds
  image: string;
  audioUrl?: string;
  encryptedMediaUrl?: string;
  quality?: AudioQuality;
  year?: number | string;
  language?: string;
  hasLyrics?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  image: string;
  year?: number | string;
  songCount: number;
  songs?: Track[];
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  followerCount?: string | number;
  fanCount?: string | number;
  bio?: string;
  role?: string;
  topSongs?: Track[];
  topAlbums?: Album[];
  singles?: Album[];
}

export interface Playlist {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  songCount: number;
  songs?: Track[];
}

export interface HomeFeedSection {
  id: string;
  title: string;
  subtitle?: string;
  type: 'track' | 'album' | 'playlist' | 'mixed';
  items: Array<Track | Album | Playlist | Artist>;
}

export interface SearchResults {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}
