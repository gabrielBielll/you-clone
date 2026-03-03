import { defineStore } from 'pinia'
import { container } from '../di'
import type { YouTubeSearchItem, YouTubeVideoItem } from '../types/youtube'

export const useYoutubeStore = defineStore('youtube', {
  state: () => ({
    searchQuery: '',
    activeCategory: 'Tudo',
    isViewingHistory: false,
    videos: [] as YouTubeSearchItem[],
    shortVideos: [] as YouTubeSearchItem[], // Separated states
    currentVideoDetail: null as YouTubeVideoItem | null,
    
    // Pagination state
    nextPageToken: undefined as string | undefined,
    prevPageToken: undefined as string | undefined,
    nextShortPageToken: undefined as string | undefined,
    
    // UI state
    isLoading: false,
    isShortsLoading: false,
    hasSearched: false,
    errorMessage: null as string | null
  }),

  actions: {
    async search(query: string, category: string = 'Tudo') {
      this.isLoading = true
      this.errorMessage = null
      this.hasSearched = true
      this.searchQuery = query
      this.activeCategory = category
      this.isViewingHistory = false

      // Monta query enviada pra API anexando a categoria
      const apiQuery = category !== 'Tudo' && category !== 'Shorts' ? `${query} ${category}` : query;

      try {
        const data = await container.youtubeRepository.searchVideos(
          apiQuery,
          undefined,
          category === 'Shorts' ? 'short' : undefined
        )
        
        let fetchedVideos = data.items || []

        if (fetchedVideos.length > 0) {
          const videoIds = fetchedVideos
            .filter((item) => item.id.videoId)
            .map((item) => item.id.videoId)

          if (videoIds.length > 0) {
            try {
              const batchDetails = await container.youtubeRepository.getVideosDuration(videoIds);
              const durationsMap: Record<string, { duration: string, isShort: boolean }> = {};
              batchDetails.items.forEach((v: any) => {
                if (v.id && v.contentDetails?.duration) {
                  durationsMap[v.id] = this.parseISODuration(v.contentDetails.duration);
                }
              });

              fetchedVideos = fetchedVideos.map((item) => ({
                ...item,
                duration: durationsMap[item.id.videoId]?.duration || '',
                isShort: durationsMap[item.id.videoId]?.isShort || false
              }));
            } catch (e) {
              console.warn('Falhou buscar durações do video em Batch:', e)
            }
          }
        }

        // Divide array principal nativamente no state
        this.videos = fetchedVideos.filter(v => !v.isShort)
        this.shortVideos = fetchedVideos.filter(v => v.isShort)

        this.nextPageToken = data.nextPageToken
        this.nextShortPageToken = undefined // reset independent pagination token
      } catch (error: any) {
        const message = error.response?.data?.error?.message || '';
        if (message.includes('quota') || message.includes('exceeded')) {
          this.errorMessage = 'LIMITE_COTA';
        } else {
          this.errorMessage = message || 'Erro ao buscar vídeos. Verifique sua conexão e tente novamente.';
        }
        console.error('Erro na pesquisa:', error)
      } finally {
        this.isLoading = false
      }
    },

    async loadMore() {
      if (!this.nextPageToken || this.isLoading || this.isViewingHistory) return

      this.isLoading = true
      const apiQuery = this.activeCategory !== 'Tudo' && this.activeCategory !== 'Shorts' ? `${this.searchQuery} ${this.activeCategory}` : this.searchQuery;

      let newNormalVideosCount = 0;
      let newShortVideosCount = 0;

      try {
        // Força a API paginar silenciosamente até juntar vídeos suficientes!
        while (
          ((this.activeCategory !== 'Shorts' && newNormalVideosCount < 6) ||
           (this.activeCategory === 'Shorts' && newShortVideosCount < 12))
          && this.nextPageToken
        ) {
          const data = await container.youtubeRepository.searchVideos(
            apiQuery,
            this.nextPageToken,
            this.activeCategory === 'Shorts' ? 'short' : undefined
          )
          let fetchedVideos = data.items || []

          if (fetchedVideos.length > 0) {
            const videoIds = fetchedVideos.filter((item) => item.id.videoId).map((item) => item.id.videoId)

            if (videoIds.length > 0) {
              try {
                const batchDetails = await container.youtubeRepository.getVideosDuration(videoIds);
                const durationsMap: Record<string, { duration: string, isShort: boolean }> = {};
                batchDetails.items.forEach((v: any) => {
                  if (v.id && v.contentDetails?.duration) {
                    durationsMap[v.id] = this.parseISODuration(v.contentDetails.duration);
                  }
                });

                fetchedVideos = fetchedVideos.map((item) => ({
                  ...item,
                  duration: durationsMap[item.id.videoId]?.duration || '',
                  isShort: durationsMap[item.id.videoId]?.isShort || false
                }));
              } catch (e) {
                console.warn('Falhou ao buscar durações:', e)
              }
            }
          }

          const newNormal = fetchedVideos.filter(v => !v.isShort);
          const newShorts = fetchedVideos.filter(v => v.isShort);

          this.videos.push(...newNormal);
          
          // Absorve Shorts coletados acidentalmente sem duplicar
          const existingShortIds = new Set(this.shortVideos.map(v => v.id.videoId));
          newShorts.forEach(s => {
             if(!existingShortIds.has(s.id.videoId)) this.shortVideos.push(s);
          });

          newNormalVideosCount += newNormal.length;
          newShortVideosCount += newShorts.length;
          this.nextPageToken = data.nextPageToken;

          if(!this.nextPageToken) break;
        }
      } catch (error: any) {
        const message = error.response?.data?.error?.message || '';
        this.errorMessage = (message.includes('quota') || message.includes('exceeded')) ? 'LIMITE_COTA' : (message || 'Erro de conexão ao carregar mais vídeos');
      } finally {
        this.isLoading = false
      }
    },

    async loadMoreShorts() {
      if (this.isShortsLoading || this.isViewingHistory) return
      this.isShortsLoading = true

      const apiQuery = this.activeCategory !== 'Tudo' && this.activeCategory !== 'Shorts' ? `${this.searchQuery} ${this.activeCategory}` : this.searchQuery;

      try {
        // Envia flag 'short' para a pesquisa exclusiva de shorts e usa token independente
        const data = await container.youtubeRepository.searchVideos(apiQuery, this.nextShortPageToken, 'short')
        let fetchedVideos = data.items || []

        if (fetchedVideos.length > 0) {
          const videoIds = fetchedVideos.filter((item) => item.id.videoId).map((item) => item.id.videoId)

          if (videoIds.length > 0) {
            try {
              const batchDetails = await container.youtubeRepository.getVideosDuration(videoIds);
              const durationsMap: Record<string, { duration: string, isShort: boolean }> = {};
              batchDetails.items.forEach((v: any) => {
                if (v.id && v.contentDetails?.duration) {
                  durationsMap[v.id] = this.parseISODuration(v.contentDetails.duration);
                }
              });

              fetchedVideos = fetchedVideos.map((item) => ({
                ...item,
                duration: durationsMap[item.id.videoId]?.duration || '',
                isShort: true // já veio do bucket de shorts oficial, marca logo.
              }));
            } catch (e) {
              console.warn('Falhou ao buscar durações do shorts adicionais:', e)
            }
          }
        }

        const existingShortIds = new Set(this.shortVideos.map(v => v.id.videoId));
        const uniqueShorts = fetchedVideos.filter((v: YouTubeSearchItem) => !existingShortIds.has(v.id.videoId));

        this.shortVideos.push(...uniqueShorts);
        this.nextShortPageToken = data.nextPageToken;
      } catch (error: any) {
        console.error('Erro ao buscar carregar mais Shorts', error)
      } finally {
        this.isShortsLoading = false
      }
    },

    async loadVideoDetail(videoId: string) {
      this.isLoading = true
      this.errorMessage = null
      
      try {
        const response = await container.youtubeRepository.getVideoDetails(videoId)
        if (response.items && response.items.length > 0) {
          const videoRaw = response.items[0] as any;
          this.currentVideoDetail = {
            ...videoRaw,
            duration: videoRaw.contentDetails?.duration || '',
            statistics: videoRaw.statistics || { viewCount: '0', likeCount: '0', favoriteCount: '0', commentCount: '0' }
          } as any
        } else {
          this.errorMessage = 'Vídeo não encontrado.';
          this.currentVideoDetail = null
        }
      } catch (error: any) {
        const message = error.response?.data?.error?.message || '';
        this.errorMessage = (message.includes('quota') || message.includes('exceeded')) ? 'LIMITE_COTA' : (message || 'Erro de rede ao buscar detalhes');
        this.currentVideoDetail = null
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.errorMessage = null
    },

    addToHistory(video: YouTubeVideoItem) {
      if (!video || !video.id?.videoId) return;
      const historyStr = localStorage.getItem('yt-history');
      let history: YouTubeVideoItem[] = historyStr ? JSON.parse(historyStr) : [];
      
      // Remove se der match pra colocar de novo no topo mais recente
      history = history.filter(v => v.id.videoId !== video.id.videoId);
      history.unshift(video);
      
      // Limita os ultimos 50 assistidos
      if (history.length > 50) history.pop();
      localStorage.setItem('yt-history', JSON.stringify(history));
    },

    loadHistory() {
      this.isViewingHistory = true;
      this.activeCategory = 'Histórico';
      this.hasSearched = true;
      this.searchQuery = ''; // limpa o input de cima
      this.errorMessage = null;
      
      const historyStr = localStorage.getItem('yt-history');
      const allHistory: YouTubeSearchItem[] = historyStr ? JSON.parse(historyStr) : [];
      
      this.videos = allHistory.filter(v => !v.isShort);
      this.shortVideos = allHistory.filter(v => v.isShort);
      
      if (allHistory.length === 0) {
        this.errorMessage = 'Seu histórico está vazio. Assista a alguns vídeos primeiro!';
      }
      
      this.nextPageToken = undefined;
      this.nextShortPageToken = undefined;
    },

    // Util local do actions pra conversão do ISO da timeline do video
    parseISODuration(isoString: string): { duration: string, isShort: boolean } {
      const match = isoString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return { duration: '', isShort: false };
  
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
  
      const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
      // O limite oficial atual para um vídeo ser "Short" no YouTube é de 60 segundos. (damos margem de 5s).
      const isShort = totalSeconds <= 65; 

      let result = '';
      
      if (hours > 0) {
        result += `${hours}:`;
        result += `${minutes.toString().padStart(2, '0')}:`;
      } else {
        result += `${minutes}:`;
      }
      
      result += seconds.toString().padStart(2, '0');
      return { duration: result, isShort };
    }
  }
})
