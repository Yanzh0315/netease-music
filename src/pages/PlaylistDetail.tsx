//歌单详情
import { useEffect, useState } from "react"
import { useParams, useNavigate } from 'react-router-dom';
import request from "../api/request";
import { usePlayerStore } from "../store/usePlayerStore";
import {type Song} from '../store/usePlayerStore'
 import {handleImageError} from '../utils/imageErrorHandler'
interface SingInformation {
    name:string;//歌单名
    coverImgUrl:string;//封面图URL
    nickName:string;//创建者昵称
    avatarUrl:string;//创建者头像地址
    playCount:number;//歌单播放量
    description:string;//歌单描述
    createTime:number;//歌单创建时间
    tags:string;//标签
}

export default function PlaylistDetail(){
    const {id} = useParams()
    const [singInformation,setSingInformation] = useState<SingInformation|null>(null)
    const [playList,setPlaylist] = useState<Song[]>([])
    const currentSong = usePlayerStore((s)=>s.currentSong)
    const formatTime = (seconds:number)=>{
    if(!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds/60).toString().padStart(2,'0');
    const s = Math.floor(seconds%60).toString().padStart(2,'0');
    return `${m}:${s}`    
        }
    const navigate = useNavigate(); 
    const setPlayList = usePlayerStore((s) => s.setPlayList)
    useEffect(()=>{
        if(!id) return;
        //获取歌单详情
        const getSingInformation = async () => {
          const res: any = await request.get(`/playlist/detail?id=${id}`);
          setSingInformation({
            name: res.playlist?.name,
            coverImgUrl: res.playlist?.coverImgUrl
              ? `${res.playlist.coverImgUrl}?param=400y400`
              : '',
            nickName: res.playlist?.creator?.nickname,
            avatarUrl: res.playlist?.creator?.avatarUrl
              ? `${res.playlist.creator.avatarUrl}?param=80y80`
              : '',
            playCount: res.playlist?.playCount,
            description: res.playlist?.description,
            createTime: res.playlist?.createTime,
            tags: res.playlist?.tags?.join(' ') || '',
          });
        };
         getSingInformation()
         //获取歌单所有歌曲
         const getAllSingSong = async()=>{
            const res : any = await request.get(`/playlist/track/all?id=${id}`)
            
            const formatted = res.songs.map((item:any)=>({
                id:item.id,
                name:item.name,
                artist:item.ar?.map((a: any) => a.name).join(' ') || '未知歌手',
                cover:item.al?.picUrl
                ? `${item.al.picUrl}?param=80y80`
                :'',
                duration:item.dt,
                fee:item.fee,
            }))
            setPlaylist(formatted)
        }
        getAllSingSong()
    },[id])
    //播放
    const handlePlay = async(song:Song)=>{
        try{
            const singSongs : any = await request.get(`/song/url?id=${song.id}`)
            const audioUrl = singSongs.data?.[0]?.url;
            const duration = singSongs.data?.[0]?.time;    
            const freeTrialInfo = singSongs.data?.[0]?.freeTrialInfo;
            
            if(!audioUrl){
                alert('版权受限，当前歌曲暂时无法播放')
                return
            }           
            usePlayerStore.getState().playSong({
                id:song.id,
                name:song.name,
                artist: song.artist,
                cover:song.cover,
                audioUrl,
                duration,
                fee:singSongs.data?.[0]?.fee,
                trialEnd: freeTrialInfo?.end ?? null
            });

        } catch(err){
            console.log('请求错误',err)
        }
    }
    //添加歌曲到队列
    const addSong = usePlayerStore.getState().addSong
  return (
    <div className="text-white">
        <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer px-8 pt-6"
         >
         <span className="text-lg">←</span>
        <span className="text-sm">返回</span>
        </button>

      <div className="flex gap-6 p-8">

        {/* 左侧大封面 */}
        <img 
          src={singInformation?.coverImgUrl} 
          alt={singInformation?.name}
          referrerPolicy="no-referrer"
          className="w-48 h-48 rounded-lg object-cover flex-shrink:0"
        />

        {/* 右侧信息 */}
        <div className="flex-1 min-w-0">

          {/* 小标签 "歌单" */}
          <div className="text-xs text-zinc-400 mb-1">歌单</div>

          {/* 大标题 */}
          <h1 className="text-3xl font-bold text-white mb-4 truncate">
            {singInformation?.name}
          </h1>

          {/* 创建者行 */}
          <div className="flex items-center gap-2 mb-4">
            <img 
              src={singInformation?.avatarUrl} 
              alt={singInformation?.nickName}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm text-zinc-300">{singInformation?.nickName}</span>
            <span className="text-xs text-zinc-500 ml-2">{singInformation?.tags}</span>  {/* TODO: 标签从哪来 */}
          </div>
          {/* 描述 */}
          <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
            简介：{singInformation?.description}
          </p>
          {/* 按钮行 */}
          <div className="flex items-center gap-2 mb-4">
            {/* 播放按钮 */}
            <button 
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-2"
            onClick={()=>setPlayList(playList)}
            >
              ▶ 播放
            </button>
            {/* 收藏、下载、分享、更多 */}
            <button className="w-9 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">♡</button>
            <button className="w-9 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">⬇</button>
            <button className="w-9 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">↗</button>
            <button className="w-9 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">⋯</button>
          </div>
        </div>
      </div>

    <div className="px-8">

  {/* ========== Tab 栏 ========== */}
  <div className="flex items-center gap-8 border-b border-zinc-800 mb-4">
    {/* 歌曲 tab（当前激活） */}
    <button 
      className="pb-3 text-white font-bold border-b-2 border-red-500 cursor-pointer"
    >
      歌曲 {playList?.length}
    </button>
    
    <button 
      className="pb-3 text-zinc-400 hover:text-white transition-colors cursor-pointer"
      onClick={() => { /* TODO: 切换到相似歌单 */ }}
    >
      相似歌单
    </button>
    
    {/* 评论 tab（待实现） */}
    <button 
      className="pb-3 text-zinc-400 hover:text-white transition-colors cursor-pointer"
      onClick={() => { /* TODO: 切换到评论 */ }}
    >
      评论
    </button>
    
    {/* 收藏者 tab（待实现） */}
    <button 
      className="pb-3 text-zinc-400 hover:text-white transition-colors cursor-pointer"
      onClick={() => { /* TODO: 切换到收藏者 */ }}
    >
      收藏者
    </button>
  </div>

  {/* ========== 歌曲列表 ========== */}
   <div>
    {playList?.map((song, index) => {
      const isCurrent = currentSong?.id === song.id;

      return (
        <div 
          key={song.id}
          className={`group relative flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors ${
            isCurrent ? 'bg-zinc-800' : 'hover:bg-zinc-800/60'
          }`}
        >
          {/* 序号 */}
          <span className={`w-6 text-center text-sm flex-shrink:0 ${
            isCurrent ? 'text-blue-400' : 'text-zinc-500'
          }`}>
            {index + 1}
          </span>

          {/* 小封面 */}
          <img 
            src={song.cover} 
            alt={song.name}
            loading="lazy"
            onError={handleImageError} 
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded object-cover flex-shrink:0"
          />

          {/* 歌名 + 歌手 */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm truncate ${
              isCurrent ? 'text-blue-400' : 'text-white'
            }`}>
              {song.name}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">{song.artist}</p>
          </div>

          {/* 时长（hover 时隐藏） */}
          <span className="text-xs text-zinc-500 flex-shrink:0 group-hover:opacity-0 transition-opacity">
            {formatTime(song.duration / 1000)}
          </span>

          {/* 操作按钮（hover 显示） */}
          <div className="absolute right-4 opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
            {/* 播放按钮 */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handlePlay(song)
              }}
              className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
            >
              ▶
            </button>
            <button 
            onClick={(e) => { e.stopPropagation();
                addSong({
                id:song.id,
                name:song.name,
                artist:song.artist,
                cover:song.cover,
                fee:song.fee,
                audioUrl:'',
                trialEnd:null,
                duration:song.duration
            })
             }}
            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
            >
                ＋
            </button>
            {/* 收藏 */}
            <button 
              className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
            >
              ♡
            </button>
            {/* 更多 */}
            <button 
              className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
            >
              ⋯
            </button>
          </div>

        </div>
      );
    })}
  </div>

    </div>

    </div>
  );
 }


