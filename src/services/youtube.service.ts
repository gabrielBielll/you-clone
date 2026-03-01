import api from './api'
import type { 
  YouTubeSearchResponse,
  YouTubeVideoResponse,
  YouTubeCommentThreadResponse 
} from '../types/youtube'

export const YoutubeService = {
  /**
   * Busca vídeos por um termo de pesquisa
   */
  async searchVideos(query: string, pageToken?: string, videoDuration?: 'any' | 'long' | 'medium' | 'short'): Promise<YouTubeSearchResponse> {
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

    const { data } = await api.get<YouTubeSearchResponse>('/search', { params })
    return data
  },

  /**
   * Busca os detalhes em Batch (lote) para Vários Videos (útil para descobrir as durações na listagem)
   */
  async getVideosDuration(videoIds: string[]): Promise<YouTubeVideoResponse> {
    const { data } = await api.get<YouTubeVideoResponse>('/videos', {
      params: {
        part: 'contentDetails',
        id: videoIds.join(',') // "id1,id2,id3"
      }
    })
    return data
  },

  /**
   * Busca os detalhes e estatísticas de um vídeo específico
   */
  async getVideoDetails(videoId: string): Promise<YouTubeVideoResponse> {
    const { data } = await api.get<YouTubeVideoResponse>('/videos', {
      params: {
        part: 'snippet,statistics',
        id: videoId
      }
    })
    return data
  },

  /**
   * Busca os comentários principais de um vídeo
   */
  async getVideoComments(videoId: string, pageToken?: string): Promise<YouTubeCommentThreadResponse> {
    const { data } = await api.get<YouTubeCommentThreadResponse>('/commentThreads', {
      params: {
        part: 'snippet',
        videoId: videoId,
        maxResults: 20,
        order: 'relevance', // Ordem padrão do YT é por relevância (likes/engajamento)
        pageToken
      }
    })
    return data
  }
}
