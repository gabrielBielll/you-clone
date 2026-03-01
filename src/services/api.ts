import axios from 'axios'

const api = axios.create({
  baseURL: 'https://www.googleapis.com/youtube/v3',
})

// Interceptador para injetar a API KEY em todas as requisições
api.interceptors.request.use(config => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY

  if (!apiKey) {
    console.error('YouTube API Key is missing in .env')
  }

  config.params = {
    ...config.params,
    key: apiKey
  }

  return config
}, error => {
  return Promise.reject(error)
})

export default api
