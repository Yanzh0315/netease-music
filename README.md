🎵 仿网易云音乐（React + TypeScript）
一个基于 React 18 + TypeScript + Zustand + Tailwind CSS 开发的仿网易云音乐 Web 应用。

线上预览地址：intersting-music.netlify.app

GitHub 仓库：https://github.com/Yanzh0315/netease-music

前端代码部署地址:https://app.netlify.com/projects/intersting-music/overview

后端代码部署地址:[api-enhanced-production-9ca1.up.railway.app](https://api-enhanced-production-9ca1.up.railway.app/personalized)

🛠️ 技术栈
前端框架：React 18 + TypeScript + Vite

状态管理：Zustand + Immer

样式方案：Tailwind CSS

网络请求：Axios + ahooks (useRequest)

路由：React Router v6

音频控制：HTML5 Audio + useRef 原生控制

未来计划：完善接口，补充登录等接口逻辑

💡 项目核心认知：状态管理与数据流设计
这个项目里我认为最难的是状态管理和数据流设计。比如播放器的 URL 有 20 分钟有效期，所以列表里不能存 URL，只能存歌曲的身份信息，播的时候再请求。这让我理解了 Zustand 这种全局 store 和组件 useState 的分工，以及“数据从 API 到 UI 的完整链路”应该怎么设计。

核心原则：列表里存“身份”，播的时候换“钥匙”。

📝 开发日志与踩坑记录
Day 3 - 真实数据接入、搜索与分页
1. 前后端数据格式对接（数据转换层）
问题：后端返回的原始数据字段（picUrl, artists）与前端组件需要（cover, artist）不一致，直接渲染会白屏。

方案：在请求回调中建立“数据转换层”。定义 RawPlaylist 和 Playlist 接口，使用 .map() 将原始数据映射为前端视图结构。

收获：掌握 TS 泛型 request.get<RawPlaylist[]> 的应用，理解前端在数据层做“适配”的常见模式。

2. 搜索接口与分页加载（limit & offset）
问题：搜索“周杰伦”上千条结果，一次性渲染导致页面卡死。

方案：使用 limit 和 offset 实现分页。

offset = pageNum * limit。

状态切换：pageNum === 0 时用 setSongs(formatted) 覆盖；pageNum > 0 时用 setSongs(prev => [...prev, ...formatted]) 拼接。

利用后端 hasMore 字段控制“加载更多”按钮的显隐。

收获：彻底掌握前端分页底层逻辑：“第一页覆盖，后续页拼接”。

3. 状态驱动 UI 与 Bug 修复（isSearching 开关）
问题：搜索成功后结果瞬间消失被切回推荐歌单；输入框未显示“清除按钮”。

方案：

使用 isSearching 作为视图切换开关。

Bug 修复：移除 finally { setIsSearching(false) }。finally 无论成功失败都会执行，导致拿到数据后立刻被切回首页。改为只在请求出错时重置状态。

利用条件渲染 {keywords !== '' && <button onClick={handleClear}>✕</button>} 实现一键返回首页。

收获：深刻理解 React“UI 是状态的映射”哲学，以及 finally 的避坑方式。

4. TS 防御性编程与可选链（?.）
问题：频繁报错 Cannot read properties of undefined，因为部分歌曲缺少歌手或专辑字段。

方案：使用可选链 ?. 和逻辑或 || 兜底。例如：item.artists?.map((a: any) => a.name).join(' ') || '未知歌手'。

收获：培养“后端数据不可信”的防御性编程思维。

Day 4 - 音乐播放实战
1. 全局播放器状态设计（Zustand）
问题：Discover.tsx 点歌，Layout.tsx 播放，跨组件数据怎么传？

方案：建立 usePlayerStore.ts 全局仓库。

核心状态：currentSong、isPlaying、playSong(song)、togglePlay()。

领悟：Zustand 像一个公司公告板，Discover 往里贴数据（getState().playSong()），Layout 盯着公告板（usePlayerStore((s) => s.currentSong) 订阅）。

2. 音频播放的核心：两个 useEffect
方案：在 Layout.tsx 挂载 <audio ref={audioRef} />。

Effect 1：监听 currentSong 变化 → 换 src + 重置进度。

Effect 2：监听 isPlaying 变化 → play() 或 pause()。

必踩的坑：

必须加 .catch() 兜底，浏览器会拦截非用户触发的播放。

audioRef.current 首次为 null，每个 Effect 里都要加 if (!audioRef.current) return;。

3. VIP 试听限制（最难的 Bug）
问题：想实现“VIP 歌只能听 30 秒，超时自动暂停+弹窗”，但弹窗死活不出来。

排查过程：

坑 1：fee 一直是 undefined。数据从 /search → formatted → songs → playSong → Zustand → Layout，任何一层漏了字段，终点就是 undefined。

坑 2：fee 其实不在 song 里，在 singSongs 里。播放接口 singSongs.data[0].fee 才是最终答案。

坑 3：> 改成 >=。试听片段本身只有 30 秒，currentTime 到不了 30 以上，> 永远不成立。改成 >=，再加 onEnded 兜底。

数据链路总结：

name / artist / cover → 搜索结果 song

audioUrl / duration → 播放接口 singSongs

fee / trialEnd → 播放接口 singSongs

4. 进度条性能优化（经典场景）
问题：音频每秒触发 4 次 onTimeUpdate。用 useState 存 currentTime，整个 Layout 每秒重渲染 4 次，卡成 PPT。

方案：用 useRef 拿到进度条 DOM，直接改 style.width：

typescript
const percent = (audio.currentTime / audio.duration) * 100;
progressRef.current.style.width = `${percent}%`;
收获：零重渲染，丝滑流畅。

Day 5-6 - 歌词功能实战
1. 播放队列的 Bug 修复
问题：删除播放列表里的歌时，如果删的是正在播放的那首，音乐不会停；清空队列后，界面还在播放。

根本原因：playlist 变了，但 currentSong 没变。Layout 的 Effect 只监听 currentSong，它没变就什么都不做。

方案：

Store：只改数据。删除时判断“删的是不是当前歌”，是就切换 currentSong（换下一首或设 null）。

Layout：只做副作用。监听 currentSong 变化，是 null 就 pause() + 清空 src。

原则：Store 里绝不能操作 DOM，副作用必须在组件里。

语法坑：不能在 set 回调里又调 set；字段名大小写要统一；对象字面量里不能写 state.isPlaying: false。

2. 歌词接口与 LRC 解析
方案：请求 /lyric?id=xxx，解析 res.lrc.lyric 字符串。

按 \n 切成数组。

用正则提取时间和文本：/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/。

时间转秒数：分钟 * 60 + 秒 + 毫秒 / 100。

过滤空行，输出 interface LyricLine { time: number; text: string; }。

TS 技巧：必须用 useState<LyricLine[]>([])，否则会被推断成 never[]。

3. 歌词高亮与面板 UI
高亮逻辑：在 onTimeUpdate 里，遍历 parsedLyrics，找到最后一个 time <= currentTime 的索引，setActiveLyricIndex(idx)。

UI 布局关键：

全屏面板不要用 inset-0。用 fixed top-16 bottom-20 z-40 精确“让出”上下两块区域，header 和 footer 就能完整显示。

使用 flex flex-col + flex-1 overflow-y-auto 实现只有歌词列表滚动。

字号层次：当前行 text-2xl font-bold text-white，其他行 text-zinc-500 text-lg。

Day 7-8 - 歌单功能实战
1. 歌单详情页的路由与跳转
踩坑：

<link> 写成了小写（HTML 原生标签），必须用 React Router 的 <Link>。

PlaylistDetail 没 import，导致页面白屏。

.map() 里最外层元素必须加 key，且 key 要跟着“最外层元素”走。

收获：HTML 原生标签全小写，React 组件全大写；控制台不报错时，靠红波浪线排查。

2. URL 传参 vs onClick 传参
核心困惑：<Link> 没有 onClick，怎么把歌单 id 传给详情页？

顿悟：URL 就是“传参的载体”。

onClick 传参：数据在内存里传，刷新就丢。

<Link to="/playlist/123"> 传参：id 编码进 URL，刷新还在，还能分享。

详情页用 const { id } = useParams() 从 URL 里读出来。

3. 歌单数据的两个接口
/playlist/detail?id=xxx：歌单元信息 + 前 10 首（用于头部信息）。

/playlist/track/all?id=xxx：全部歌曲（用于歌曲列表）。

注意：coverImgId 不是 URL，coverImgUrl 才是；加 referrerPolicy="no-referrer" 绕过防盗链。

4. 数据转换、单位与类型坑
字段映射：接口返回 100 个字段，前端只用 7 个。在数据层做清洗，不要留到渲染层。

毫秒单位坑：dt 字段是毫秒，formatTime 按秒处理会显示成 4228:55。必须在数据转换时 duration: item.dt / 1000。

setPlayList vs addSong：

addSong(song)：往队列末尾追加一首，会去重。

setPlayList(songs)：整体替换队列。

不要在添加时就请求 URL（20 分钟有效期），播的时候再请求。

类型系统三个坑：

数组 state 初始值必须是 []，不是 null。
useState([]) 会被推断成 never[]，必须加泛型 useState<Song[]>([])。
接口类型和实现类型必须完全一致。