import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { handleFetchToys } from '@/api/toy'
import { Plus, LogOut, Volume2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { handlePushAudio as pushAudioAPI } from '@/api/toy'

interface Toy {
  id: string
  name?: string
  sn?: string
  [key: string]: any
}

const COMMON_PHRASES_KEY = 'audio_common_phrases'

export default function DeviceList() {
  const [toys, setToys] = useState<Toy[]>([])
  const [loading, setLoading] = useState(true)
  const [audioDialogOpen, setAudioDialogOpen] = useState(false)
  const [audioContent, setAudioContent] = useState('')
  const [selectedToys, setSelectedToys] = useState<string[]>([])
  const [pushing, setPushing] = useState(false)
  const [commonPhrases, setCommonPhrases] = useState<string[]>([])
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    fetchToys()
    // Load common phrases from localStorage
    const savedPhrases = localStorage.getItem(COMMON_PHRASES_KEY)
    if (savedPhrases) {
      try {
        const phrases = JSON.parse(savedPhrases)
        if (Array.isArray(phrases)) {
          setCommonPhrases(phrases)
        }
      } catch (e) {
        console.error('Failed to parse common phrases:', e)
      }
    }
  }, [])

  const fetchToys = async () => {
    try {
      setLoading(true)
      const response = await handleFetchToys()
      // Ensure we always have an array
      let toysData = response.data
      // Handle different response structures
      if (Array.isArray(toysData)) {
        setToys(toysData)
      } else if (toysData && Array.isArray(toysData.toys)) {
        setToys(toysData.toys)
      } else if (toysData && Array.isArray(toysData.data)) {
        setToys(toysData.data)
      } else {
        // If data is not an array, default to empty array
        console.warn('Unexpected response structure:', toysData)
        setToys([])
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '获取玩具列表失败',
        description: error.data || '请稍后重试',
      })
      setToys([]) // Ensure toys is always an array even on error
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleToggleToy = (toyId: string) => {
    setSelectedToys((prev) =>
      prev.includes(toyId)
        ? prev.filter((id) => id !== toyId)
        : [...prev, toyId]
    )
  }

  const saveCommonPhrase = (phrase: string) => {
    if (!phrase.trim()) return
    
    setCommonPhrases((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p !== phrase)
      // Add to the beginning and keep only 5
      const updated = [phrase, ...filtered].slice(0, 5)
      // Save to localStorage
      localStorage.setItem(COMMON_PHRASES_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const handleSelectCommonPhrase = (phrase: string) => {
    setAudioContent(phrase)
  }

  const handlePushAudio = async () => {
    if (!audioContent.trim()) {
      toast({
        variant: 'destructive',
        title: '请输入内容',
      })
      return
    }

    if (selectedToys.length === 0) {
      toast({
        variant: 'destructive',
        title: '请至少选择一个玩具',
      })
      return
    }

    setPushing(true)
    try {
      const promises = selectedToys.map((toyId) =>
        pushAudioAPI(toyId, {
          content_type: 'text',
          content: audioContent,
        })
      )

      await Promise.all(promises)
      // Save to common phrases
      saveCommonPhrase(audioContent.trim())
      toast({
        title: '音频推送成功',
      })
      setAudioDialogOpen(false)
      setAudioContent('')
      setSelectedToys([])
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '音频推送失败',
        description: error.data || '请稍后重试',
      })
    } finally {
      setPushing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">玩具列表</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setAudioDialogOpen(true)}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              播放音频
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-4 flex justify-end">
          <Button onClick={() => navigate('/add-device')}>
            <Plus className="mr-2 h-4 w-4" />
            添加玩具
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : toys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无玩具，请添加玩具
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {toys.map((toy) => (
              <div
                key={toy.id}
                className="rounded-lg border bg-card p-4 shadow-sm"
              >
                <h3 className="font-semibold">{toy.name || '未命名玩具'}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  SN: {toy.sn || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={audioDialogOpen} onOpenChange={setAudioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>播放音频</DialogTitle>
            <DialogDescription>
              输入要播放的内容，并选择要推送的玩具
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                placeholder="请输入要播放的内容"
                value={audioContent}
                onChange={(e) => setAudioContent(e.target.value)}
                rows={4}
              />
              {commonPhrases.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">常用语句</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonPhrases.map((phrase, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectCommonPhrase(phrase)}
                        className="text-xs"
                      >
                        {phrase.length > 20 ? `${phrase.substring(0, 20)}...` : phrase}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>选择玩具</Label>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {toys.map((toy) => (
                  <div key={toy.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`toy-${toy.id}`}
                      checked={selectedToys.includes(toy.id)}
                      onCheckedChange={() => handleToggleToy(toy.id)}
                    />
                    <Label
                      htmlFor={`toy-${toy.id}`}
                      className="cursor-pointer font-normal"
                    >
                      {toy.name || toy.sn || '未命名玩具'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setAudioDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handlePushAudio} disabled={pushing}>
                {pushing ? '推送中...' : '发布'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

