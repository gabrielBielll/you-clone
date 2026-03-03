import type { IYoutubeRepository } from '../../domain/ports/IYoutubeRepository';
import type { 
  YouTubeSearchResponse,
  YouTubeVideoResponse,
  YouTubeCommentThreadResponse 
} from '../../types/youtube';
import api from '../../services/api';

/**
 * ADAPTADOR (Adapter Outbound) do Hexágono
 * Esta classe é "descartável". Se o YouTube mudar a API amanhã ou precisarmos
 * do Vimeo, nós só criamos um Adaptador novo e assinamos a Porta IYoutubeRepository!
 */
export class GoogleYoutubeAdapter implements IYoutubeRepository {
  
  async searchVideos(
    query: string, 
    pageToken?: string, 
    videoDuration?: 'any' | 'long' | 'medium' | 'short'
  ): Promise<YouTubeSearchResponse> {
    const params: any = {
      part: 'id,snippet',
      q: query,
      type: 'video', // we only want videos, not channels or playlists
      maxResults: 12,
      pageToken
    };

    if (videoDuration && videoDuration !== 'any') {
      params.videoDuration = videoDuration;
    }

    const { data } = await api.get<YouTubeSearchResponse>('/search', { params });
    return data;
  }

  async getVideosDuration(videoIds: string[]): Promise<YouTubeVideoResponse> {
    const { data } = await api.get<YouTubeVideoResponse>('/videos', {
      params: {
        part: 'contentDetails',
        id: videoIds.join(',') // "id1,id2,id3"
      }
    });
    return data;
  }

  async getVideoDetails(videoId: string): Promise<YouTubeVideoResponse> {
    const { data } = await api.get<YouTubeVideoResponse>('/videos', {
      params: {
        part: 'snippet,statistics',
        id: videoId
      }
    });
    return data;
  }

  async getVideoComments(
    videoId: string, 
    pageToken?: string
  ): Promise<YouTubeCommentThreadResponse> {
    const { data } = await api.get<YouTubeCommentThreadResponse>('/commentThreads', {
      params: {
        part: 'snippet',
        videoId: videoId,
        maxResults: 20,
        order: 'relevance',
        pageToken
      }
    });
    return data;
  }
}
