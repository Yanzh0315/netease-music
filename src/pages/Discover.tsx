import {useEffect, useState} from 'react';
import request from '../api/request';
import { usePlayerStore } from '../store/usePlayerStore';
import {Link} from  "react-router-dom";
import {handleImageError} from '../utils/imageErrorHandler';
import displayArtist from '../utils/displayArtist';
//后端接口数据格式
interface RawPlaylist  {
    id:number;
    name:string;
    picUrl:string;
    playCount:number;
}
//前端组件数据格式
interface Playlist  {
    id:number;
    name:string;
    cover:string;
    playCount:number;
}

export default function Discover(){
    //请求数据
    const [data,setDate] = useState<Playlist[] | null>(null)
    const [loading,setLoading] = useState(true)
    const [error,setError] = useState<Error | null>(null)
    //搜索
    const [keywords,setKeywords] = useState('')
    //搜索结果
    const [songs,setSongs] = useState<any[]>([])
    //搜索状态
    const [isSearching,setIsSearching] = useState(false)
    const [page,setPage] = useState(0)
    const [hasMore,setHasMore] = useState(true)
    const addSong = usePlayerStore((s)=>s.addSong)
    //推荐歌单
    useEffect(()=>{
       const fetchData = async() =>{
            try{
                const res :any = await request.get<RawPlaylist[]>('/personalized')                
                const rawList : RawPlaylist[] = res.result
                const formattedList = rawList.map((item: RawPlaylist)=>({
                    id:item.id,
                    name:item.name,
                    cover:item.picUrl
                    ? `${item.picUrl}?param=400y400`
                    :'',
                    playCount:item.playCount,
                }))                               
                setDate(formattedList)
                setLoading(false)
            } catch(err){
                console.log('请求出错',err)
                setError(err as Error)
                setLoading(false)
            }
        }
        fetchData()
    },[])
    //搜索和分页显示
    const handleSearch = async(pageNum = 0)=>{
        if(!keywords.trim()) return ;
        setIsSearching(true);
        //分页
        const limit = 30;
        const offset = pageNum * limit
        try{
                const res: any = await request.get(`/search?keywords=${keywords}&type=1&limit=${limit}&offset=${offset}`); 
                                //防御性判断
                if(!res.result || !res.result.songs){
                    setLoading(false);
                    return;
                }
                const rawList = res.result.songs;
                const formatted = rawList.map((item:any)=>({
                id:item.id,
                name:item.name,
                artist: displayArtist(item.artists),
                cover: item.artists?.[0]?.img1v1Url 
                ? `${item.artists[0].img1v1Url}?param=80y80` 
                : '',                
                }));   

                
                if(pageNum === 0){
                    setSongs(formatted);
                } else{
                    setSongs(prev =>[...prev,...formatted]);
                }
                setPage(pageNum);
                setHasMore(res.result.hasMore)
            
             } catch(err){
            console.error(err)
            }     
    }
    //清除输入框
    const handleClear = ()=>{
        setKeywords('');
        setIsSearching(false);
        setSongs([]);
        setPage(0);
        setHasMore(true)
    }
    //播放音乐
    const playSing = async(song:any)=>{
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
    if(loading) return <div>加载中：......</div>
    if(error) return <div>出错了:{error.message}</div>

    return (
        <>
        <div className="pt-6 pb-6"> 
         <div className='mb-6 flex gap-2 items-center'>
            <div className='relative flex-1'> 
                <input 
                type="text" 
                placeholder='搜索歌曲'
                value={keywords}
                onChange={(e)=>setKeywords(e.target.value)}
                onKeyDown={(e)=>e.key === 'Enter' && handleSearch(0)}
      
                className='w-full py-2 pl-4 pr-12 rounded bg-zinc-800 text-white outline-none'    
                />
    
                {keywords.trim() !== '' && (
                <button
                    onClick={handleClear}  
                    className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-600 transition-colors cursor-pointer text-sm'
                >
                    ✕
                </button>
                )}
            </div>
            <button 
            onClick={()=>handleSearch(0)}
            className='px-5 py-2 bg-red-500 text-white rounded cursor-pointer hover:bg-red-600 transition-colors whitespace-nowrap shrink-0'>搜索</button>
         </div>
        </div>
        {isSearching ?(
            <ul className='space-y-1'>
                {songs.map((item, index) => (
<li
  key={item.id}
  className='group relative flex items-center gap-4 p-2 rounded hover:bg-zinc-800 cursor-pointer transition-colors'
>
  {/* 序号 */}
  <span className='w-6 text-center text-zinc-500 text-sm flex-shrink:0'>{index + 1}</span>
  
  {/* 封面 */}
  <img
    src={item.cover}
    alt={item.name}
    loading="lazy"
    onError={handleImageError}
    className='w-10 h-10 rounded object-cover flex-shrink:0'
  />
  
  {/* 歌名 + 歌手 */}
  <div className="flex-1 min-w-0">
    <p className="text-white text-sm truncate">{item.name}</p>
    <p className="text-zinc-400 text-xs mt-0.5 truncate">{item.artist}</p>
  </div>

  {/* 👇 按钮组：固定在右侧，hover 时显示 */}
  <div className="absolute right-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
    
    {/* 播放按钮（实心三角） */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        playSing(item);
      }}
      className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
      title="播放"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2.5v11l9-5.5-9-5.5z" />
      </svg>
    </button>

    {/* 添加队列按钮（加号） */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        addSong({
          id: item.id,
          name: item.name,
          artist: item.artist,
          cover: item.cover,
          fee: item.fee,
          audioUrl: '',
          trialEnd: null,
          duration: item.duration,
        });
      }}
      className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
      title="添加到队列"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="8" y1="3" x2="8" y2="13" />
        <line x1="3" y1="8" x2="13" y2="8" />
      </svg>
    </button>

  </div>
</li>
    ))}

        {hasMore && (
         <li className="flex justify-center pt-4">
            <button 
            onClick={() => handleSearch(page + 1)} 
            className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
            >
            加载更多
            </button>
         </li>
        )}
    
        </ul>
        ) : (       
        <div className = 'grid grid-cols-4 gap-4'>
            {data?.map(item =>(
              <Link to={`/playlist/${item.id}`} key={item.id}>
                <div 
                 key={item.id} 
                className="group cursor-pointer" 
                    >
                <div className="relative rounded-lg overflow-hidden">     
                <img 
                src={item.cover} 
                alt={item.name}
                loading="lazy" 
                onError={handleImageError} 
                className="w-full aspect-square object-cover" 
                />
                <div className="absolute top-2 right-2 text-white text-xs bg-black/50 px-2 py-1 rounded"> 
                🎧 {item.playCount}
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ▶️ 播放
                </div>
                </div>
                <p className="text-sm text-zinc-300 mt-2 line-clamp-2">{item.name}</p>
                </div>
              </Link>
            ))}

        </div>
        )}
        </>
    )
}
