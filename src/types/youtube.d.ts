export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: YouTubeThumbnail;
    medium: YouTubeThumbnail;
    high: YouTubeThumbnail;
  };
  channelTitle: string;
}

export interface YouTubeStatistics {
  viewCount: string;
  likeCount: string;
  dislikeCount?: string; // Opting to include it as optional in type just in case we mock it later
  favoriteCount: string;
  commentCount: string;
}

export interface YouTubeSearchItem {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: YouTubeVideoSnippet;
  duration?: string;
  isShort?: boolean;
}

export interface YouTubeVideoItem {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: YouTubeVideoSnippet;
  // This property will be dynamically injected by our application
  // after fetching contentDetails in batch
  duration?: string;
  isShort?: boolean;
}

export interface YouTubeVideoDetails {
  id: string;
  snippet: YouTubeVideoSnippet;
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
  contentDetails: {
    duration: string;
  };
}

export interface YouTubeSearchResponse {
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
}

export interface YouTubeVideoResponse {
  items: YouTubeVideoItem[];
}

export interface YouTubeCommentSnippet {
  videoId: string;
  textDisplay: string;
  textOriginal: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelUrl: string;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
}

export interface YouTubeCommentItem {
  id: string;
  snippet: {
    topLevelComment: {
      id: string;
      snippet: YouTubeCommentSnippet;
    };
    canReply: boolean;
    totalReplyCount: number;
    isPublic: boolean;
  };
}

export interface YouTubeCommentThreadResponse {
  items: YouTubeCommentItem[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}
