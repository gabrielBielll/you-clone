import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { useYoutubeStore } from './useYoutubeStore'
import { container } from '../di'

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) { return store[key] || null; },
    setItem(key: string, value: string) { store[key] = value.toString(); },
    clear() { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the DI Container
vi.mock('../di', () => {
  return {
    container: {
      youtubeRepository: {
        searchVideos: vi.fn(),
        getVideoDetails: vi.fn(),
        getVideosDuration: vi.fn()
      }
    }
  }
})

describe('YouTube Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('searches for videos and updates state correctly', async () => {
    const store = useYoutubeStore()
    
    const mockResponse = {
      items: [{ id: { videoId: '123', kind: 'video' }, snippet: { title: 'Test Video' } }],
      nextPageToken: 'token_abc',
      pageInfo: { totalResults: 1, resultsPerPage: 1 }
    }
    
    ;(container.youtubeRepository.searchVideos as Mock).mockResolvedValue(mockResponse)
    // mock safe das durações vazias pra impedir undefined destructs
    ;(container.youtubeRepository.getVideosDuration as Mock).mockResolvedValue({ items: [] })

    await store.search('vuejs')

    expect(store.isLoading).toBe(false)
    expect(store.hasSearched).toBe(true)
    expect(store.searchQuery).toBe('vuejs')
    expect(store.videos.length).toBe(1)
    expect(store.nextPageToken).toBe('token_abc')
    expect(store.errorMessage).toBeNull()
  })

  it('handles load more logic appending to existing videos', async () => {
    const store = useYoutubeStore()
    
    // Set initial state
    store.searchQuery = 'vuejs'
    store.nextPageToken = 'token_abc'
    store.videos = [{ id: { videoId: '123', kind: 'video' }, snippet: { title: 'Test Video', channelTitle: 'Test', publishedAt: '2023-01-01', description: 'test', thumbnails: { default: { url: '', width: 1, height: 1}, medium: { url: '', width: 1, height: 1}, high: { url: '', width: 1, height: 1} } } }]
    
    const mockResponsePage2 = {
      items: [{ id: { videoId: '456', kind: 'video' }, snippet: { title: 'Test Video 2' } }],
      nextPageToken: undefined,
      pageInfo: { totalResults: 2, resultsPerPage: 1 }
    }
    
    ;(container.youtubeRepository.searchVideos as Mock).mockResolvedValue(mockResponsePage2)
    // mock batch
    ;(container.youtubeRepository.getVideosDuration as Mock).mockResolvedValue({ items: [] })

    await store.loadMore()

    // It should append as Normal Video (isShort=false default na falta de parse)
    expect(store.videos.length).toBe(2)
    expect(store.videos[1]?.id?.videoId).toBe('456')
    expect(store.nextPageToken).toBe(undefined)
  })

  it('handles API errors elegantly', async () => {
    const store = useYoutubeStore()
    
    const mockError = {
      response: { data: { error: { message: 'Quota Exceeded' } } }
    }
    
    ;(container.youtubeRepository.searchVideos as Mock).mockRejectedValue(mockError)

    await store.search('vuejs')

    expect(store.isLoading).toBe(false)
    expect(store.errorMessage).toBe('Quota Exceeded')
    expect(store.videos.length).toBe(0)
  })

  describe('Novas Funcionalidades (Shorts e Historico)', () => {
    it('deve converter corretamente ISO Duration de vídeo curto (Short)', () => {
      const store = useYoutubeStore();
      // 59 Segundos = Short
      const result = store.parseISODuration('PT59S');
      expect(result.duration).toBe('0:59');
      expect(result.isShort).toBe(true);
    });

    it('deve converter corretamente ISO Duration de vídeo longo', () => {
      const store = useYoutubeStore();
      // 1 hora, 5 minutos e 30 segundos
      const result = store.parseISODuration('PT1H5M30S');
      expect(result.duration).toBe('1:05:30');
      expect(result.isShort).toBe(false); // Maior que 65s
    });

    it('deve armazenar vídeos no Histórico Local limitando a 50 itens', () => {
      const store = useYoutubeStore();
      window.localStorage.clear();
      
      for (let i = 1; i <= 60; i++) {
          store.addToHistory({ id: { videoId: `vid-${i}`, kind: 'video' }, snippet: { title: `Video ${i}` } } as any);
      }

      const historyData = JSON.parse(window.localStorage.getItem('yt-history') || '[]');
      
      expect(historyData.length).toBe(50);
      expect(historyData[0].id.videoId).toBe('vid-60');
    });

    it('deve carregar History corretamente', () => {
      const store = useYoutubeStore();
      window.localStorage.clear();
      window.localStorage.setItem('yt-history', JSON.stringify([
        { id: { videoId: '123', kind: 'video' }, isShort: false, snippet: { title: 'v1' } },
        { id: { videoId: '456', kind: 'video' }, isShort: true, snippet: { title: 'v2' } }
      ]));

      store.loadHistory();

      expect(store.isViewingHistory).toBe(true);
      expect(store.activeCategory).toBe('Histórico');
      expect(store.videos.length).toBe(1); 
      expect(store.videos[0]?.id?.videoId).toBe('123');
      expect(store.shortVideos.length).toBe(1);
    });
  });
})
