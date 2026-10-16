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

播放器核心交互与状态管理进阶
这两天的主题是播放器深度交互与状态管理。从进度条拖拽、音量条控制，到播放模式切换和倍速调节，功能趋于完善。这不仅考验了 DOM 操作与数学计算能力，更深刻体现了 React “状态驱动 UI”与“性能优化”的思想。

一、音乐进度条与音量条拖拽（核心交互）
🎯 功能需求：

进度条：支持点击跳转、拖拽定位，与音频播放实时双向同步。

音量条：支持垂直拖拽调节音量，并持久化保存。

🛠️ 技术实现：

数学计算核心：利用 getBoundingClientRect() 获取轨道坐标，计算鼠标相对位置百分比。

进度条（水平）：(e.clientX - rect.left) / rect.width

音量条（垂直）：(rect.bottom - e.clientY) / rect.height（注意 Y 轴反向计算）

拖拽事件链：onMouseDown 触发后，将 mousemove 和 mouseup 绑定到 document 上，避免鼠标拖拽出元素范围导致拖拽失效。

零重渲染性能优化：拖拽过程中坚决不用 useState，而是用 useRef 直接获取 DOM 并修改 style.width / style.height。这避免了 React 高频重渲染，实现丝滑拖动。

防冲突机制：用 isDraggingRef 作为开关。拖拽时屏蔽 onTimeUpdate 的进度更新，防止音频播放进度和鼠标拖拽进度“打架”。

🚨 踩坑与收获：

单位换算：百分比是 0~1 的小数，而 CSS width 需要 %，必须乘 100。

拖拽生命周期：mouseup 时一定要记得解绑 document 上的事件监听，并正式赋值 audio.currentTime 或 setVolume，实现最终数据落地。

二、播放顺序控制（顺序 / 随机 / 单曲循环）
🎯 功能需求：

提供顺序播放、随机播放、单曲循环三种模式，并持久化用户选择。

🛠️ 技术实现：

全局状态：在 Zustand 中定义 playMode: 'order' | 'random' | 'loop'，并加入 persist 持久化。

改造切歌逻辑：重构 nextSong，根据 playMode 分支判断。随机模式使用 Math.random() 选取不同索引；顺序模式到末尾自动回到第一首。

区分手动切歌与自动切歌：在 <audio> 的 onEnded 事件中，如果是单曲循环则重置 currentTime = 0 并重新播放；如果是手动点击“下一首”，即使是单曲循环也切到下一首（打破循环）。

🚨 踩坑与收获：

随机播放的“伪随机”陷阱：简单 Math.random() 会导致用户连续听到同一首歌。未来优化可引入 Fisher-Yates 洗牌算法，在切换到随机模式时打乱整个播放列表，保证公平性。

三、音乐速度倍率控制（0.5x - 2.0x）
🎯 功能需求：

提供 0.5x、0.75x、1.0x、1.25x、1.5x、2.0x 倍速调节，且切换歌曲后倍速不重置。

🛠️ 技术实现：

全局状态：Zustand 新增 playbackRate，持久化保存。

同步到音频：useEffect 监听 playbackRate 和 currentSong?.id，设置 audioRef.current.playbackRate。

解决切歌重置 Bug：在 <audio> 标签上使用 onLoadedMetadata 事件，当音频元数据加载完成时，重新从 Zustand 获取最新倍速并赋值，确保切歌后倍速依然生效。

🚨 踩坑与收获：

React 合成事件命名：onLoadedMetadata 是 React 的合成事件，在 MDN 上需要搜索原生事件名 loadedmetadata（全小写）。

闭包陷阱：在 onLoadedMetadata 回调中，直接使用组件作用域里的 playbackRate 可能是旧值，必须用 usePlayerStore.getState().playbackRate 获取实时状态。

🎯 面试高频话术总结（可直接用于简历与面试）
关于进度条与性能优化：

“为了做到零重渲染，我放弃 useState 而使用 useRef 直接操作 DOM 的 style.width，配合 document 全局事件监听和 isDraggingRef 解决冲突，实现了丝滑的拖拽体验。”

关于状态管理与持久化：

“我使用 Zustand 管理全局播放状态。为了提升用户体验，我将音量、倍速、播放模式等加入了 persist 持久化。在切歌时通过 onLoadedMetadata 重新同步倍速，解决了音频加载导致状态重置的问题。”

我遇到过 Zustand persist 中间件造成的缓存污染问题。在开发‘每日推荐’功能时，由于后端返回的歌手字段是对象数组，我早期直接将这个脏数据持久化到了 LocalStorage。后来我在代码里修复了数据清洗逻辑，把对象转成了字符串，但页面依然白屏。

我通过 React 的报错堆栈排查，发现是 Zustand 在应用启动时读取了 LocalStorage 里的旧数据，覆盖了当前正确的初始状态。

我的解决方案是：修改 persist 的 name 字段强制弃用旧缓存，并在全局状态的定义中加上 version 版本号与 migrate 迁移函数。 当数据结构发生变更时，migrate 函数会自动丢弃或转换旧版本的数据，确保代码升级时用户端不会白屏。这次经历让我深刻理解了前端缓存策略的鲁棒性设计。”
关于播放模式：

“播放模式的难点在于区分‘手动点击下一首’和‘自然播放结束’。在 onEnded 中我针对单曲循环做了特殊处理，而在 nextSong 中针对随机模式进行了去重优化。”

