import axios from 'axios'
import { getMainSiteUrl } from '../lib/utils'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = getMainSiteUrl()
    }
    return Promise.reject(error)
  }
)

export default client
