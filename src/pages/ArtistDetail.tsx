import { useRequest } from 'ahooks';
import { useParams } from 'react-router-dom';
import request from '../api/request';
import { useState ,useRef, useEffect} from 'react';
import {type Song} from '../store/usePlayerStore'
import SongList from '../components/SongList'
interface ArtistDetailInter{
    name:string; //歌手名
    id:number;      //歌手ID
    desc:string;    //歌手描述
    coverUrl:string | '';  //封面
    work:string;
}

export default function ArtistDetail(){
    const {id} = useParams()
    const [artistDetails,setArtistDetails] = useState<ArtistDetailInter>();
    const observerRef = useRef<HTMLDivElement>(null)
    const [allHasMore,setAllHasMore] = useState(true) //是否还有更多
    const [isLoadingMore,setIsLoadingMore] = useState(false) //互斥锁
    const [allData,setAllData] = useState<Song[]|[]>([])
    const {} = useRequest(
        ()=> request.get(`/artist/detail?id=${id}`),
        {
        onSuccess:(res:any)=>{
            const artist = res?.data?.artist;            
            if(!artist) return;
            const resDate = {
                id: artist?.id,
                name: artist?.name,
                coverUrl: artist?.cover || artist?.avatar || '', 
                desc: artist?.briefDesc || '',
                work: res?.data?.identify?.imageDesc || '',
            };
            setArtistDetails(resDate);            
         },
         onError:(err)=>{
            console.error(err);
         }
       }
    ) 
    const [activeTab,setActiveTab] = useState<'hot'|'all'|'mv'|'desc'|'album'>('hot')
    // 热门50首
    const { loading: hotLoading, data: hotData } = useRequest(
        async () => {
            const res: any = await request.get(`/artist/top/song?id=${id}`);
            const rawSongs = res?.songs || [];
            const resDate: Song[] = rawSongs.map((item: any) => ({
                id: item?.id, 
                name: item?.name,
                artist: item?.ar[0]?.name,
                cover: item?.al?.picUrl ? `${item.al.picUrl}?param=80y80` : '',
                audioUrl: '',
                duration: item?.dt,
                fee: item?.fee,
                trialEnd: null,
                isVip:item?.fee === 1,
            }));
            return resDate; 
        },
        {
            ready: activeTab === 'hot',
            cacheKey: `hot-${id}`,
            onError: (e) => {
                console.error(e);
            }
        }
    );
    //所有歌曲
    const { loading: allLoading,run } = useRequest(
        async (pageNum:number) => {
            const offset = pageNum * 30;
            const res: any = await request.get(`/artist/songs?id=${id}&limit=30&offset=${offset}`);
            const rawSongs = res?.songs || [];
            const resDate: Song[] = rawSongs.map((item: any) => ({
                id: item?.id, 
                name: item?.name,
                artist: item?.ar[0]?.name,
                cover: item?.al?.picUrl ? `${item.al.picUrl}?param=80y80` : '',
                audioUrl: '',
                duration: item?.dt,
                fee: item?.fee,
                trialEnd: null,
                isVip:item?.fee === 1
            }));
            return {resDate,hasMore:res?.more || false}
        },
        {
            manual:true,
            cacheKey: `all-${id}`,
            onSuccess:({resDate,hasMore},params)=>{
                const currentPage = params[0];

                if(currentPage === 0){
                    setAllData(resDate);
                }else{
                    setAllData((prev)=>[...prev,...resDate]);
                }
                setAllHasMore(hasMore);
                setIsLoadingMore(false);
            },
            onError: (e) => {
                setIsLoadingMore(false)
                console.error(e);
            },
            onBefore:()=>{
                setIsLoadingMore(true);
            },
        }
    );
    useEffect(()=>{
        if(activeTab === 'all' && allData.length === 0){
            run(0);
        }
    },[activeTab])
    //所有专辑
    const {loading:albumLoading} = useRequest(
      ()=> request.get(`/artist/album?id=${id}`),
      {
        ready : activeTab === 'album',
        cacheKey: `album-${id}`,
        onSuccess:(res:any)=>{
            console.log('专辑',res);
            
        },
        onError:(e)=>{
            console.error(e);
            
        },
    });
    //所有mv
    const {loading:mvLoading} = useRequest(
      ()=> request.get(`/artist/mv?id=${id}`),
      {
        ready : activeTab === 'mv',
        cacheKey: `mv-${id}`,
        onSuccess:()=>{

        },
        onError:(e)=>{
            console.error(e);
            
        },
    });
   useEffect(()=>{
     if(!observerRef.current)return;
     const observer = new IntersectionObserver(
        (entries)=>{
            if(entries[0].isIntersecting && !isLoadingMore && activeTab === 'all' && allHasMore){
                const nextPage = Math.floor(allData.length / 30);
                run(nextPage);
            }
         },{
            root:null,
            rootMargin:'100px',
            threshold:0.1
        })
            observer.observe(observerRef.current);
        
        return ()=>observer.disconnect();
   }, [activeTab, isLoadingMore, allHasMore, allData.length])
    return (
        <div className="w-full min-h-screen bg-[#121212] text-white">
            <div className="w-full pt-4 pb-4 px-6 flex flex-col items-start justify-center">
                <div className="flex items-center gap-3"> {/* 间距从 gap-5 缩小到 gap-3 */}
                    <button
                        onClick={() => window.history.back()}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-3xl font-bold tracking-wider text-white">
                        {artistDetails?.name || '歌手名字'}
                    </h1>
                </div>
                <p className="text-zinc-400 mt-1 text-xs ml:[44px]">
                   {artistDetails?.work}
                </p>
            </div>         
            <div className="w-full h:[400px] relative bg-zinc-900">
                <img
                    src={artistDetails?.coverUrl || 'https://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'}
                    alt={artistDetails?.name}
                    className="w-full h-full object-cover object-top"
                />
            </div>
            <div className="sticky top-0 z-40 bg-[#121212] px-6 py-3 border-b border-zinc-800">
                <div className="flex gap-8 text-sm font-medium">
                    {[
                        { key: 'hot', label: '热门作品' },
                        { key: 'all', label: '所有作品' },
                        { key: 'album', label: '所有专辑' },
                        { key: 'mv', label: '相关MV' },
                        { key: 'desc', label: '艺人介绍' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`pb-1 border-b-2 transition-colors ${
                                activeTab === tab.key
                                    ? 'text-red-500 font-bold border-red-500'
                                    : 'text-zinc-400 border-transparent hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 内容区域 */}
            <div className="px-6 py-6 pb-24">
                {/* 热门作品 */}
                {activeTab === 'hot' && (
                    <div>
                        {hotLoading ? <div className="text-zinc-500">正在加载热门歌曲...</div> : (
                            <SongList songs={hotData||[]} hideTabs = {true}/>
                        )}
                    </div>
                )}
                {/* 所有作品 */}
                {activeTab === 'all' && (
                    <div>
                            <SongList songs={allData||[]} hideTabs = {true}/>
                    </div>
                )}

                {/* 所有专辑 */}
                {activeTab === 'album' && (
                    <div>
                        {albumLoading ? <div className="text-zinc-500">正在加载专辑...</div> : (
                            <div>所有专辑</div>
                        )}
                    </div>
                )}

                {/* 相关MV */}
                {activeTab === 'mv' && (
                    <div>
                        {mvLoading ? <div className="text-zinc-500">正在加载MV...</div> : (
                            <div>相关MV</div>
                        )}
                    </div>
                )}

                {/* 艺人介绍 */}
                {activeTab === 'desc' && (
                    <div>{artistDetails?.desc}</div>
                )}
            <div 
                ref={observerRef} 
                className="h-10 w-full flex justify-center items-center mt-4"
            >
                {activeTab === 'all' && allLoading && <span>加载中...</span>}
                {activeTab === 'all' && !allHasMore && allData.length > 0 && <span>到底啦～</span>}
                
                {/* {activeTab === 'album' && albumLoading && <span>加载中...</span>} */}
                {/* {activeTab === 'album' && !albumHasMore && albumList.length > 0 && <span>到底啦～</span>} */}
            </div>
            </div>
        </div>
    );
}