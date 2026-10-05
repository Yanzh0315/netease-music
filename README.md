🎵 仿网易云音乐（React + TypeScript）

简介 -== 一个基于 React 18 + TypeScript + Zustand + Tailwind CSS 开发的仿网易云音乐 Web 应用。

**线上预览地址**：（等你部署后填上去，非常重要！）
*   **GitHub 仓库**：（填你自己的仓库地址）

🛠️ 技术栈
*   **前端框架**：React 18 + TypeScript + Vite
*   **状态管理**：Zustand + Immer
*   **样式方案**：Tailwind CSS
*   **网络请求**：Axios + ahooks (useRequest)
*   **路由**：React Router v6
*   **音频控制**：HTML5 Audio + useRef 原生控制

这个项目里我认为最难的是状态管理和数据流设计。比如播放器的 URL 有 20 分钟有效期，所以列表里不能存 URL，只能存歌曲的身份信息，播的时候再请求。这让我理解了 Zustand 这种全局 store 和组件 useState 的分工，以及'数据从 API 到 UI 的完整链路'应该怎么设计。"

开发日志：
Day 3 - 真实数据接入、搜索与分页
一、前后端数据格式对接（数据转换层）
 问题痛点：
后端接口返回的原始数据（RawPlaylist/SearchResult）字段与前端组件需要的字段不一致（如后端用 picUrl/artists，前端组件需要 cover/artist），直接渲染会导致白屏或数据缺失。
 解决方案：
在 useEffect 或请求回调中建立“数据转换层”。

定义 RawPlaylist（后端格式）和 Playlist（前端视图格式）两个接口。

在请求成功后，使用 .map() 将原始数据映射为前端需要的结构。
 知识收获：

掌握了 TS 泛型 request.get<RawPlaylist[]> 的应用。

理解前后端分离架构中，前端在数据层做“适配”的常见模式。

二、搜索接口与分页加载（limit & offset）
 问题痛点：
搜索“周杰伦”有上千条结果，一次性渲染会直接导致页面卡死。需要实现“加载更多”实现渐进式渲染。
解决方案：
使用 limit（每页数量）和 offset（跳过数量）实现分页。

offset = pageNum * limit。

核心状态切换：当 pageNum === 0 时（新搜索），用 setSongs(formatted) 覆盖旧数据；当 pageNum > 0 时，用 setSongs(prev => [...prev, ...formatted]) 拼接新数据。

利用后端返回的 hasMore 字段控制“加载更多”按钮的显隐。
 知识收获：

彻底掌握了前端分页的底层逻辑：“第一页覆盖，后续页拼接”。

理解了 hasMore 对用户体验的作用（防止无限请求）。

三、状态驱动 UI 与 Bug 修复（isSearching 开关）
 问题痛点：
搜索成功后，搜索结果瞬间消失被切回了推荐歌单；搜索框输入文字后未显示“清除按钮”。
 解决方案：
使用 isSearching 作为视图切换的开关。

Bug 修复：发现 finally { setIsSearching(false) } 是罪魁祸首。由于 finally 无论成功失败都会执行，导致拿到数据后立刻被切回首页。将其移除，只在请求出错时重置状态。

UI 交互：利用状态条件渲染 {keywords !== '' && <button onClick={handleClear}>✕</button>}，点击清除按钮后重置所有状态（setKeywords('')、setIsSearching(false)），实现一键返回首页。
 知识收获：

深刻理解了 React “UI 是状态的映射”哲学。

了解了 finally 在所有情况下都会执行的特性和避坑方式。

四、TS 防御性编程与可选链（?.）
 问题痛点：
请求过程中频繁报错 Cannot read properties of undefined (reading '0')，因为部分歌曲数据缺少歌手或专辑字段。
 解决方案：
使用可选链 ?. 和逻辑或 || 进行数据兜底。
例如：item.artists?.map((a: any) => a.name).join(' ') || '未知歌手'。
 知识收获：

培养了“后端数据不可信”的防御性编程思维。

熟练运用 ?. 和 || 处理不完整的嵌套数据。

Day 4 音乐播放实战
一、全局播放器状态设计（Zustand）
💡 踩坑现场：
Discover.tsx 里点歌，Layout.tsx 里要播放。两个完全不同的组件，数据怎么传？

🛠️ 怎么填坑：
建了一个 usePlayerStore.ts 全局仓库，核心状态：

currentSong：当前歌曲信息（含 audioUrl、duration、fee、trialEnd）

isPlaying：是否正在播放

playSong(song)：切歌并自动播放

togglePlay()：播放/暂停切换

🧠 领悟：
Zustand 不是 useState。它像一个公司公告板，Discover 往里贴数据（用 getState().playSong()），Layout 盯着公告板（用 usePlayerStore((s) => s.currentSong) 订阅）。

二、音频播放的核心：两个 useEffect
💡 踩坑现场：
怎么让 <audio> 标签真的响起来？

🛠️ 怎么填坑：
在 Layout.tsx 里挂载 <audio ref={audioRef} />，然后用两个 Effect 分工：

Effect 1：监听 currentSong 变化 → 换 src + 重置进度

Effect 2：监听 isPlaying 变化 → play() 或 pause()

🚨 必踩的坑：

必须加 .catch() 兜底，浏览器会拦截非用户触发的播放。

audioRef.current 首次为 null，每个 Effect 里都要加 if (!audioRef.current) return;。

三、VIP 试听限制（最难的 Bug）
💡 踩坑现场：
想实现"VIP 歌只能听 30 秒，超时自动暂停+弹窗"。尝试了几次，弹窗死活不出来。

🛠️ 排查全过程：

坑 1：fee 一直是 undefined
数据从 /search → formatted → songs → playSong → Zustand → Layout，任何一层漏了字段，终点就是 undefined。

修复：在 formatted 里补上 fee: item.fee。

坑 2：fee 其实不在 song 里，在 singSongs 里

搜索结果里 song.fee 可能不准。

播放接口 singSongs.data[0].fee 才是最终答案。

修复：从 singSongs 里取，而不是从 song 里取。

坑 3：> 改成 >=
试听片段本身只有 30 秒，currentTime 到不了 30 以上，> 永远不成立。

修复：改成 >=，再加 onEnded 兜底。

 数据链路总结：

字段	来源
name / artist / cover	搜索结果 song
audioUrl / duration	播放接口 singSongs
fee / trialEnd	播放接口 singSongs
四、进度条性能优化（经典场景）
 踩坑现场：
音频每秒触发 4 次 onTimeUpdate。如果用 useState 存 currentTime，整个 Layout 每秒重渲染 4 次，卡成 PPT。

怎么填坑：
用 useRef 拿到进度条 DOM，直接改 style.width：

typescript
const percent = (audio.currentTime / audio.duration) * 100;
progressRef.current.style.width = `${percent}%`;
零重渲染，丝滑流畅。



Day 5-6 歌词功能实战
这两天的主题只有一个：歌词。从接口请求、数据解析、到面板 UI，每一步都是新的挑战。中途一度卡到"觉得什么都不会"，但最后跑通了。记录一下。

一、播放队列的 bug 修复
💡 踩坑现场：
删除播放列表里的歌时，如果删的是正在播放的那首，音乐不会停，还在继续播。清空队列后，界面还在播放。

🧠 根本原因：
playlist 变了，但 currentSong 没变。Layout 的 Effect 只监听 currentSong，它没变就什么都不做，音频照旧播。

🛠️ 怎么填坑：
理清一个核心分工：

Store：只改数据。删除时判断"删的是不是当前歌"，是就切换 currentSong（换下一首或设 null）。

Layout：只做副作用。监听 currentSong 变化，是 null 就 pause() + 清空 src。

Store 里绝不能操作 DOM（audio.pause()、document.querySelector）。 副作用必须在组件里。

🚨 踩的语法坑：

在 set 回调里又调 set（不能嵌套）。

字段名大小写不统一（playList vs playlist）。

对象字面量里写 state.isPlaying: false（键名不能带 state.）。

二、歌词接口与 LRC 解析
🎯 侦察数据：
请求 /lyric?id=xxx，返回的 res.lrc.lyric 是一段字符串：

text
[00:00.00] 作词 : 梨冻紧/Wiz_H张子豪
[00:30.60] 我没转身
[00:31.71] 一直走一直梦
...
🛠️ 解析思路：

按 \n 切成数组。

遍历每一行，用正则提取时间和文本：

regex
/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/
时间转秒数：分钟 * 60 + 秒 + 毫秒 / 100。

过滤掉空行。

最终输出结构：

typescript
interface LyricLine {
  time: number;   // 秒
  text: string;
}
🧠 为什么用 useState<LyricLine[]>([]) 而不是 useState([])？
useState([]) 会被 TS 推断成 never[]，报"无法赋值"的红线。加上泛型 LyricLine[] 才能正确存数据。

三、歌词高亮逻辑
🎯 需求：
播放音乐时，歌词列表里当前唱到的那一行高亮。

🛠️ 实现思路：
在 <audio> 的 onTimeUpdate 里：

拿到 audio.currentTime。

遍历 parsedLyrics，找到最后一个 time <= currentTime 的索引。

setActiveLyricIndex(idx)。

🚨 两个细节：

数组里 time 是递增的，可以加 break 提前结束循环。

每秒触发 4 次 setState，性能一般但歌词几十行勉强能跑。以后优化可以用 useRef 缓存上次索引。

四、歌词面板 UI 设计
🛠️ 组件拆分：
把歌词面板做成独立组件 LyricPanel.tsx，通过 props 从 Layout 接收数据。

Props 类型：

typescript
interface LyricPanelProps {
  parsed: LyricLine[];
  activeLyricIndex: number;
  currentSong: Song | null;
  onClose: () => void;
}
🎨 布局的关键：

text
┌────────────────────────────┐  top-16
│ [header 区域，不被遮挡]      │
├────────────────────────────┤
│  ✕         歌名             │  ← 关闭按钮右上角，歌名居中
│            歌手             │
├────────────────────────────┤
│                            │
│         歌词滚动区           │  ← flex-1 overflow-y-auto
│         当前行大而亮         │
│         其他行小而暗         │
│                            │
└────────────────────────────┘  bottom-20
│ [footer 播放条，完整可见]    │
核心类名：

fixed top-16 bottom-20 z-40 —— 避开 header 和 footer，而不是用 inset-0 全覆盖。

flex flex-col —— 上下固定区 + 中间滚动区。

flex-1 overflow-y-auto —— 只有歌词列表滚动。

字号层次：当前行 text-2xl font-bold text-white，其他行 text-zinc-500 text-lg。

🧠 关键顿悟：
全屏面板不要用 inset-0。用 top-16 bottom-20 精确"让出"上下两块区域，header 和 footer 就能完整显示。

🎯 状态总结
功能	状态
播放/暂停/进度条	✅
VIP 试听限制	✅
播放队列增删	✅
队列删除同步停播	✅
歌词请求 + LRC 解析	✅
歌词高亮	🚧 逻辑待完成
歌词自动滚动	🚧 待开发
歌词面板打开/关闭	✅


Day 7-8 歌单功能实战
这两天的主题是歌单。从"点击首页卡片"到"跳转详情页"再到"播放整个歌单"，踩了一堆坑，也真正把"路由传参"和"数据流"两件事想明白了。

一、歌单详情页的路由与跳转
💡 踩坑现场：
首页的歌单卡片点了没反应。路由配了，但页面空白。

🛠️ 排查过程：

<link> 写成了小写 —— 这是 HTML 原生标签，不是 React Router 的 <Link>。小写标签只认 href，不认 to。大小写是命。

PlaylistDetail 没 import —— App.tsx 里用了它，但顶部没 import，TS 找不到，页面白屏。

key 要跟着"最外层元素"走 —— 卡片原来最外层是 <div>，key 在 <div> 上。改成 <Link> 包裹后，key 要移到 <Link> 上。

🧠 学到什么：

HTML 原生标签全小写，React 组件全大写。

.map() 里最外层元素必须加 key。

组件没 import 时，控制台不报错，只是页面空白，要靠红波浪线排查。

二、URL 传参 vs onClick 传参
💡 核心困惑：
<Link> 没有 onClick，怎么把歌单 id 传给详情页？

🧠 顿悟：
URL 就是"传参的载体"。

onClick 传参：数据在内存里传，刷新就丢。

<Link to="/playlist/123"> 传参：id 编码进 URL，刷新还在，还能分享给别人。

详情页用 const { id } = useParams() 从 URL 里读出来。

类比：

onClick = 打电话（一对一）

Link = 发地址（复制给别人也能找到）

三、歌单数据的两个接口
🎯 关键认知：

接口	返回什么	用在哪
/playlist/detail?id=xxx	歌单元信息（名字、封面、创建者）+ 前 10 首	头部信息
/playlist/track/all?id=xxx	全部歌曲（完整数据）	歌曲列表
为什么要两个？
网易云在 /playlist/detail 里只给前 10 首（节省流量），完整列表必须调 /playlist/track/all。

🚨 踩坑：coverImgId 不是 URL
coverImgId 是数字 ID（109951171971759090），coverImgUrl 才是图片地址。

加 referrerPolicy="no-referrer" 绕过网易云图片的防盗链。

四、数据转换与字段映射
💡 踩坑：
歌单接口返回 50 个字段，但渲染列表只需要 7 个。

🛠️ 做法：
在数据转换时，只保留需要的字段：

typescript
const formatted = res.songs.map((item) => ({
  id: item.id,
  name: item.name,
  artist: item.ar?.map((a) => a.name).join(' ') || '未知歌手',
  cover: item.al?.picUrl,
  duration: item.dt / 1000,   // 毫秒转秒
  fee: item.fee,
}));
🧠 领悟：

接口返回 100 个字段，前端只用 7 个，剩下 93 个是噪音。

数据清洗应该发生在"数据层"，不是渲染层。

五、handlePlay 括号丢失事件
💡 踩坑现场：
添加 handlePlay 后，页面全黑，TS 报 () => void 不是有效的 JSX 元素类型。

🔍 原因：
handlePlay 函数少了一个 }，导致 return 被包进了 handlePlay 里，PlaylistDetail 组件没有 return。

🧠 学到什么：

每个函数有开有闭，return 要写在正确的作用域里。

TS 的实时检查一直在，之前的"没报错"只是没看到。

报错 () => void 时，去看函数末尾括号有没有丢。

六、formatTime 的毫秒单位坑
💡 踩坑现场：
歌曲时长显示成 4228:55，明显不对。

🔍 原因：
dt 字段是毫秒，formatTime 按秒处理。
240000 毫秒被当成 240000 秒，出来是 4000 多分钟。

🛠️ 修复：
数据转换时就除以 1000：

typescript
duration: item.dt / 1000,   // 统一成秒
🧠 学到什么：

时间戳字段必须搞清楚单位。

单位转换应该发生在数据层，不是每次用的时候都换算。

七、setPlayList vs addSong 的语义区别
💡 核心困惑：
点"播放歌单"，为什么不能直接用 addSong 循环 165 次？

🧠 顿悟：

addSong(song)：往队列末尾追加一首，会去重。

setPlayList(songs)：整体替换队列，把当前队列清空，换成新的。

"替换整个队列"是一个新动作，不能复用 addSong。

另外：不要在添加时就请求 URL。

URL 只有 20 分钟有效期。

添加时请求好，等用户 20 分钟后再播，URL 已经失效了。

正确做法：列表里只存"身份信息"（id、name、cover），播的时候再请求 URL。

记住这句话：

列表里存"身份"，播的时候换"钥匙"。

八、类型系统的三个坑
① 数组 state 的初始值必须是 []，不是 null

typescript
const [playlist, setPlaylist] = useState<Song[]>([]);   // ✅
const [playlist, setPlaylist] = useState<Song[]>(null); // ❌ 类型不对
② useState([]) 会被推断成 never[]
必须加泛型 useState<Song[]>([])。

③ 接口类型和实现类型必须完全一致

接口说 Song[] | null，实现里就得处理 null。如果一个地方宽松，另一个地方严格，TS 就懵。

