# FoloToy Dashboard New

一个全新的 FoloToy 设备管理前端项目。

## 功能特性

- ✅ 手机号登录（获取验证码）
- ✅ 设备列表展示
- ✅ 添加玩具（支持扫描二维码或手动输入SN和Key）
- ✅ 退出登录
- ✅ 播放音频功能（可选择多个设备推送）

## 技术栈

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI
- Axios

## 安装

```bash
npm install
```

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 项目结构

```
src/
├── api/          # API 接口
├── components/   # UI 组件
│   └── ui/       # 基础 UI 组件
├── lib/          # 工具函数
├── pages/        # 页面组件
│   ├── Login.tsx        # 登录页面
│   ├── DeviceList.tsx   # 设备列表页面
│   └── AddDevice.tsx    # 添加设备页面
├── router.tsx    # 路由配置
└── main.tsx      # 入口文件
```

## API 说明

### 登录
- 获取验证码: `POST /v1/verification/token`
- 登录: `POST /v1/auth/signin`

### 设备管理
- 获取设备列表: `GET /v1/toys`
- 添加设备: `POST /v1/toys/pair`
- 推送音频: `POST /v1/toys/{toy_id}/push_audio`

## 使用说明

1. 启动项目后，访问登录页面
2. 输入手机号并获取验证码
3. 输入验证码完成登录
4. 在设备列表页面可以：
   - 查看所有设备
   - 点击"播放音频"按钮推送音频到选中的设备
   - 添加新设备
   - 退出登录

