import { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

const axiosInstance = axios.create({
  timeout: 8000,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  // All requests use JSON format
  config.headers['Content-Type'] = 'application/json'
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  } else {
    if (
      config.url === '/v1/auth/signin' ||
      config.url === '/v1/verification/token' ||
      config.url === '/v1/auth/supported_login_types'
    ) {
      return config
    } else {
      return new Promise(() => {})
    }
  }
  return config
})

const request = async <T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.request<T>(config)
    return Promise.resolve({
      status: response.status,
      data: response.data,
    })
  } catch (error: any) {
    if (error.response?.status === 403) {
      localStorage.setItem('token', '')
      window.location.reload()
      return Promise.reject(error)
    }
    return Promise.reject({
      status: error.response?.status,
      data: error.response?.data?.message,
      code: error.response?.data?.code,
    })
  }
}

export default request

