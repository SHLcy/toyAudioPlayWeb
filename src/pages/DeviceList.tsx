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
const COMMON_URLS_KEY = 'audio_common_urls'
const SELECTED_TOYS_KEY = 'audio_selected_toys'
const LAST_AUDIO_CONTENT_KEY = 'audio_last_content'
const CONTENT_TYPE_KEY = 'audio_content_type'

export default function DeviceList() {
  const [toys, setToys] = useState<Toy[]>([])
  const [loading, setLoading] = useState(true)
  const [audioDialogOpen, setAudioDialogOpen] = useState(false)
  const [audioContent, setAudioContent] = useState('')
  const [selectedToys, setSelectedToys] = useState<string[]>([])
  const [pushing, setPushing] = useState(false)
  const [commonPhrases, setCommonPhrases] = useState<string[]>([])
  const [commonUrls, setCommonUrls] = useState<string[]>([])
  const [contentType, setContentType] = useState<'text' | 'url'>('text')
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
    // Load common URLs from localStorage
    const savedUrls = localStorage.getItem(COMMON_URLS_KEY)
    if (savedUrls) {
      try {
        const urls = JSON.parse(savedUrls)
        if (Array.isArray(urls)) {
          setCommonUrls(urls)
        }
      } catch (e) {
        console.error('Failed to parse common URLs:', e)
      }
    }
  }, [])

  // Load previously selected toys and content when dialog opens
  useEffect(() => {
    if (audioDialogOpen && toys.length > 0) {
      // Load previously selected toys
      const savedSelectedToys = localStorage.getItem(SELECTED_TOYS_KEY)
      if (savedSelectedToys) {
        try {
          const savedIds = JSON.parse(savedSelectedToys)
          if (Array.isArray(savedIds)) {
            // Only select toys that still exist
            const validIds = savedIds.filter((id: string) =>
              toys.some((toy) => toy.id === id)
            )
            if (validIds.length > 0) {
              setSelectedToys(validIds)
            }
          }
        } catch (e) {
          console.error('Failed to parse selected toys:', e)
        }
      }
      
      // Load last input content
      const lastContent = localStorage.getItem(LAST_AUDIO_CONTENT_KEY)
      if (lastContent) {
        setAudioContent(lastContent)
      }
      
      // Load last content type
      const savedContentType = localStorage.getItem(CONTENT_TYPE_KEY)
      if (savedContentType === 'text' || savedContentType === 'url') {
        setContentType(savedContentType)
      }
    }
  }, [audioDialogOpen, toys])

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

  const saveCommonUrl = (url: string) => {
    if (!url.trim()) return
    
    setCommonUrls((prev) => {
      // Remove if already exists
      const filtered = prev.filter((u) => u !== url)
      // Add to the beginning and keep only 5
      const updated = [url, ...filtered].slice(0, 5)
      // Save to localStorage
      localStorage.setItem(COMMON_URLS_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const handleSelectCommonUrl = (url: string) => {
    setAudioContent(url)
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
          content_type: contentType,
          content: audioContent,
        })
      )

      await Promise.all(promises)
      // Save to common phrases only for text content
      if (contentType === 'text') {
        saveCommonPhrase(audioContent.trim())
      } else if (contentType === 'url') {
        // Save to common URLs for URL content
        saveCommonUrl(audioContent.trim())
      }
      // Save selected toys to localStorage
      localStorage.setItem(SELECTED_TOYS_KEY, JSON.stringify(selectedToys))
      // Save last input content
      localStorage.setItem(LAST_AUDIO_CONTENT_KEY, audioContent.trim())
      // Save content type
      localStorage.setItem(CONTENT_TYPE_KEY, contentType)
      toast({
        title: '音频推送成功',
      })
      setAudioDialogOpen(false)
      // Keep audioContent and selectedToys for next time
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

      <Dialog 
        open={audioDialogOpen} 
        onOpenChange={(open) => {
          setAudioDialogOpen(open)
          // Save selected toys, content and content type when dialog closes
          if (!open) {
            if (selectedToys.length > 0) {
              localStorage.setItem(SELECTED_TOYS_KEY, JSON.stringify(selectedToys))
            }
            if (audioContent.trim()) {
              localStorage.setItem(LAST_AUDIO_CONTENT_KEY, audioContent.trim())
            }
            localStorage.setItem(CONTENT_TYPE_KEY, contentType)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>播放音频</DialogTitle>
            <DialogDescription>
              输入要播放的内容，并选择要推送的玩具
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">内容</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={contentType === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContentType('text')}
                  >
                    文本
                  </Button>
                  <Button
                    type="button"
                    variant={contentType === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContentType('url')}
                  >
                    URL
                  </Button>
                </div>
              </div>
              <Textarea
                id="content"
                placeholder={contentType === 'url' ? '请输入URL地址' : '请输入要播放的内容'}
                value={audioContent}
                onChange={(e) => setAudioContent(e.target.value)}
                rows={4}
              />
              {contentType === 'text' && commonPhrases.length > 0 && (
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
              {contentType === 'url' && commonUrls.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">常用URL</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonUrls.map((url, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectCommonUrl(url)}
                        className="text-xs"
                      >
                        {url.length > 30 ? `${url.substring(0, 30)}...` : url}
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

