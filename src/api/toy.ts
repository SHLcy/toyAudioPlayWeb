import request from '../lib/request'

export const handleFetchToys = (): Promise<any> => {
  return request({
    method: 'get',
    url: '/v1/toys',
  })
}

export const handleAddToy = (data: { sn: string; password: string }): Promise<any> => {
  return request({
    method: 'post',
    url: '/v1/toys/pair',
    data: data,
  })
}

export const handlePushAudio = (toyId: string, data: { content_type: string; content: string }): Promise<any> => {
  return request({
    method: 'post',
    url: `/v1/toys/${toyId}/push_audio`,
    data: data,
  })
}

