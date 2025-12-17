import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { handleAddToy } from '@/api/toy'
import { ArrowLeft, QrCode } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function AddDevice() {
  const [sn, setSn] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleScan = (data: any) => {
    if (data && data[0] && data[0].format === 'qr_code') {
      const scannedValue = data[0].rawValue
      const regex = /^[a-zA-Z0-9&]+$/
      
      if (regex.test(scannedValue)) {
        // 假设二维码格式为 "sn&password" 或只有 sn
        const parts = scannedValue.split('&')
        if (parts.length >= 2) {
          setSn(parts[0])
          setPassword(parts[1])
        } else {
          setSn(scannedValue)
        }
        setShowScanner(false)
        toast({
          title: '扫码成功',
        })
      } else {
        toast({
          variant: 'destructive',
          title: '二维码格式错误',
        })
      }
    }
  }

  const handleError = (err: any) => {
    console.error(err)
    toast({
      variant: 'destructive',
      title: '扫码失败',
      description: '请重试或手动输入',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sn || !password) {
      toast({
        variant: 'destructive',
        title: '请填写完整信息',
      })
      return
    }

    setLoading(true)
    try {
      await handleAddToy({ sn, password })
      toast({
        title: '添加成功',
      })
      navigate('/devices')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '添加失败',
        description: error.data || '请检查SN和Password是否正确',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/devices')}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-xl font-bold">添加玩具</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-md space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sn">SN</Label>
                <Input
                  id="sn"
                  placeholder="请输入SN"
                  value={sn}
                  onChange={(e) => setSn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  className="flex-1"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  扫描二维码
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? '添加中...' : '添加'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>扫描二维码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showScanner && (
              <div className="relative">
                <Scanner
                  onError={handleError}
                  onScan={handleScan}
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setShowScanner(false)}
              className="w-full"
            >
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

