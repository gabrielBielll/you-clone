import type { 
  YouTubeSearchResponse,
  YouTubeVideoResponse,
  YouTubeCommentThreadResponse 
} from '../../types/youtube';

/**
 * PORTA (Contrato) do Hexágono
 * O núcleo da nossa aplicação exige isso. Ele não quer saber de Axios ou YouTube API.
 */
export interface IYoutubeRepository {
  searchVideos(
    query: string,
    pageToken?: string,
    videoDuration?: 'any' | 'long' | 'medium' | 'short'
  ): Promise<YouTubeSearchResponse>;

  getVideosDuration(videoIds: string[]): Promise<YouTubeVideoResponse>;

  getVideoDetails(videoId: string): Promise<YouTubeVideoResponse>;

  getVideoComments(
    videoId: string,
    pageToken?: string
  ): Promise<YouTubeCommentThreadResponse>;
}
