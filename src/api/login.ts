import request from '../lib/request'

export const handleRequestVerificationCode = (data: { identifier: string }): Promise<any> => {
  return request({
    method: 'post',
    url: '/v1/verification/token',
    data: data,
  })
}

export const handleLogin = (data: { username: string; verification_token: string }): Promise<any> => {
  return request({
    method: 'post',
    url: '/v1/auth/signin',
    data: data,
  })
}

