import { useEffect, useState,useRef } from 'react'
import request from '../api/request'
import { useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { Link } from 'react-router-dom'
interface ArtistDetail {
    name:string,
    id:number,
    imgUrl:string | '',
}

export default function Artist(){
    const navigate = useNavigate();
    const [artistList,setArtistList] = useState<ArtistDetail[]>([]);
    const [currentType,setCurrentType] = useState('-1');
    const [currentArea,setCurrentArea] = useState('-1');
    const [currentLetter,setCurrentLetter] = useState('');
    const [isloadingMore,setIsloadingMore] = useState(false);
    const observerRef = useRef<HTMLDivElement>(null);
    const [page,setPage] = useState(0);
    const [hasMore,setHasMore] = useState(true)
    const artistType = [
        {key:'-1',value:'全部'},
        {key:'1',value:'男歌手'},
        {key:'2',value:'女歌手'},
        {key:'3',value:'乐队'},
    ];
    const artistArea = [
        {key:'-1',value:'全部'},
        {key:'7',value:'华语'},
        {key:'96',value:'欧美'},
        {key:'8',value:'日本'},
        {key:'16',value:'韩国'},
        {key:'0',value:'其他'},
    ];
    const letterOptions = [
    { label: '热门', value: '-1' },
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b' },
    { label: 'C', value: 'c' },
    { label: 'D', value: 'd' },
    { label: 'E', value: 'e' },
    { label: 'F', value: 'f' },
    { label: 'G', value: 'g' },
    { label: 'H', value: 'h' },
    { label: 'I', value: 'i' },
    { label: 'J', value: 'j' },
    { label: 'K', value: 'k' },
    { label: 'L', value: 'l' },
    { label: 'M', value: 'm' },
    { label: 'N', value: 'n' },
    { label: 'O', value: 'o' },
    { label: 'P', value: 'p' },
    { label: 'Q', value: 'q' },
    { label: 'R', value: 'r' },
    { label: 'S', value: 's' },
    { label: 'T', value: 't' },
    { label: 'U', value: 'u' },
    { label: 'V', value: 'v' },
    { label: 'W', value: 'w' },
    { label: 'X', value: 'x' },
    { label: 'Y', value: 'y' },
    { label: 'Z', value: 'z' },
    { label: '#', value: '0' },
    ];
    const {run,loading}= useRequest(
        (pageNum:number)=>request.get(`/artist/list?type=${currentType}&area=${currentArea}&initial=${currentLetter}&limit=30&offset=${pageNum*30}`),
       {
        manual:true,
        debounceWait: 500,
        onSuccess:(res:any,params:[number])=>{            
            const currentPage = params[0];

            const resList = (res?.artists || []).map((item:any)=>({
                name:item?.name,
                id:item?.id,
                imgUrl:item?.picUrl,
             }));
             if(currentPage === 0){
                setArtistList(resList)
             }else{
                setArtistList((prev)=>[...prev,...resList])
             }

             setHasMore(res?.more || false);

             setIsloadingMore(false);
        },
        onError:(err)=>{
            console.error('请求错误',err);
            //开锁
            setIsloadingMore(false);
        }
       }
    );   
    useEffect(()=>{
        setArtistList([]);
        setPage(0);
        run(0);
    },[currentType,currentArea,currentLetter])

    useEffect(()=>{

        if(!observerRef.current || !hasMore)return;

        const observer = new IntersectionObserver(
            (entries)=>{
                if(entries[0].isIntersecting && !isloadingMore && !loading){
                    // 上锁
                    setIsloadingMore(true);
                    const nextPage = page + 1;
                    setPage(nextPage);
                    run(nextPage);
                }
            },
            {rootMargin:'100px',threshold:0.1}
        );
        observer.observe(observerRef.current)
        
        return ()=> observer.disconnect()
    },[hasMore,isloadingMore,loading,page,run])
    return(
       <div className="p-8 text-white min-h-screen">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">返回</span>
            </button>

            {/* 2. 地区筛选 */}
            <div className="flex flex-wrap gap-4 mb-4">
                {artistArea.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setCurrentArea(item.key)}
                        className={`px-6 py-1.5 rounded-md text-sm transition-colors ${
                            currentArea === item.key
                                ? 'bg-blue-500 text-white font-medium'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                    >
                        {item.value}
                    </button>
                ))}
            </div>

            {/* 3. 类型筛选 */}
            <div className="flex flex-wrap gap-4 mb-6">
                {artistType.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setCurrentType(item.key)}
                        className={`px-6 py-1.5 rounded-md text-sm transition-colors ${
                            currentType === item.key
                                ? 'bg-blue-500 text-white font-medium'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                    >
                        {item.value}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8 pb-4 border-b border-zinc-800">
                {letterOptions.map((item) => {
                    const letterValue = item.label === '热门' ? '' : item.value;
                    return (
                        <button
                            key={item.label}
                            onClick={() => setCurrentLetter(letterValue)}
                            className={`text-sm transition-colors ${
                                currentLetter === letterValue
                                    ? 'text-blue-500 font-bold scale-110'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* 5. 歌手网格列表 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {artistList.map((artist) => (
                    <Link to={`/artist/${artist.id}`} key={artist.id}>
                        <div key={artist.id} className="flex flex-col items-center group cursor-pointer">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 bg-zinc-800">
                            <img
                                src={artist.imgUrl ? `${artist.imgUrl}?param=200y200` : ''}
                                alt={artist.name}
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="mt-4 flex items-center gap-1 text-sm">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="text-zinc-300 group-hover:text-white transition-colors truncate max-w-120px">
                                {artist.name}
                            </span>
                        </div>
                    </div>
                    </Link>
                ))}
            </div>

            <div ref={observerRef} className="h-10 flex justify-center items-center mt-8">
                {loading && <span className="text-zinc-500 text-sm">正在加载...</span>}
            </div>
            {!hasMore && artistList.length > 0 && (
                <div className="text-center text-zinc-500 text-sm mt-4 mb-8">
                    已经到底啦～
                </div>
            )}

        </div>
    
    );
    
}