import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { handleRequestVerificationCode, handleLogin } from '@/api/login'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleGetCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast({
        variant: 'destructive',
        title: '请输入正确的手机号',
      })
      return
    }

    try {
      // Format phone number with country code (+86 for China)
      const identifier = `+86${phone}`
      await handleRequestVerificationCode({ identifier })
      toast({
        title: '验证码已发送',
      })
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '发送验证码失败',
        description: error.data || '请稍后重试',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !code) {
      toast({
        variant: 'destructive',
        title: '请填写完整信息',
      })
      return
    }

    setLoading(true)
    try {
      // Format phone number with country code (+86 for China) as username
      const username = `+86${phone}`
      // Use the verification code entered by user as verification_token
      const response = await handleLogin({ 
        username, 
        verification_token: code 
      })
      // Save token to localStorage
      const token = response.data?.token || response.data?.access_token || response.data?.data?.token
      if (token) {
        localStorage.setItem('token', token)
        toast({
          title: '登录成功',
        })
        // Navigate to home page
        navigate('/')
      } else {
        toast({
          variant: 'destructive',
          title: '登录失败',
          description: '未获取到 token',
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '登录失败',
        description: error.data || '请检查验证码是否正确',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">登录</h1>
          <p className="mt-2 text-sm text-muted-foreground">使用手机号登录</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">验证码</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                type="text"
                placeholder="请输入验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGetCode}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}秒` : '获取验证码'}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
      </div>
    </div>
  )
}

