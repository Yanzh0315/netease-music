import { useCallback, useEffect, useState, useRef } from 'react';
import request from '../api/request';
import { usePlayerStore, type Song } from '../store/usePlayerStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { handleImageError } from '../utils/imageErrorHandler';
import displayArtist from '../utils/displayArtist';
import FeatureCard from '../components/FeatureCard';
import { useAutoChangeCover } from '../hooks/useAutoChangeCover';
import { useRequest, useClickAway, useLocalStorageState } from 'ahooks';
import LikeButton from '../components/LikeButton'
export interface RawPlaylist {
    id: number;
    name: string;
    picUrl: string;
    playCount: number;
}
interface Playlist {
    id: number;
    name: string;
    cover: string;
    playCount: number;
}

export default function Discover() {
    // ==================== 状态管理 ====================
    const [data, setDate] = useState<Playlist[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    // 搜索相关
    const [keywords, setKeywords] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [songs, setSongs] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    
    // 历史记录 
    const [history, setHistory] = useLocalStorageState<string[]>('search-history', {
        defaultValue: [],
    });

    const searchWrapperRef = useRef<HTMLDivElement>(null);
    useClickAway(() => setIsFocused(false), searchWrapperRef);

    const addSong = usePlayerStore((s) => s.addSong);
    const [guessCovers, setGuessCovers] = useState<string[]>([]);
    const dynamicCover = useAutoChangeCover(guessCovers, 10000);
    
    const navigate = useNavigate();
    const location = useLocation();
    const navItems = [
        { label: '精选推荐', path: '/' },
        { label: '歌单广场', path: '/playlist-square' },
        { label:'歌手',path:'/artist'},
    ];

    // ==================== 核心逻辑 ====================
    
    // 1. 获取推荐歌单 
    const fetchPlaylists = () => {
        const fetchData = async () => {
            try {
                const res: any = await request.get<RawPlaylist[]>('/personalized');
                const rawList: RawPlaylist[] = res.result;
                const formattedList = rawList
                    .slice(0, 12)
                    .map((item: RawPlaylist) => ({
                        id: item.id,
                        name: item.name,
                        cover: item.picUrl ? `${item.picUrl}?param=400y400` : '',
                        playCount: item.playCount,
                    }));
                setDate(formattedList);
                setLoading(false);
            } catch (err) {
                console.log('请求出错', err);
                setError(err as Error);
                setLoading(false);
            }
        };
        fetchData();
    };

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const handleSearch = async (pageNum = 0, searchKeyword = keywords) => {
        const kw = searchKeyword.trim();
        if (!kw) return;
        
        setIsSearching(true);
        const limit = 30;
        const offset = pageNum * limit;

        try {
            const res: any = await request.get(
                `/cloudsearch?keywords=${kw}&type=1&limit=${limit}&offset=${offset}` 
            );
            console.log(res);
            
            if (!res.result || !res.result.songs) {
                setHasMore(false);
                return;
            }
            const rawList = res.result.songs;
            const formatted = rawList.map((item: any) => ({
                id: item.id,
                name: item.name,
                artist: displayArtist(item.ar),
                cover: item.al?.picUrl 
                ? `${item.al.picUrl}?param=80y80` 
                : '默认占位图URL' ,
                duration: item.dt,
            }));

            if (pageNum === 0) {
                setSongs(formatted);
            } else {
                setSongs((prev) => [...prev, ...formatted]);
            }
            setPage(pageNum);
            setHasMore(res.result.hasMore);
        } catch (err) {
            console.error(err);
        }
    };

    // 3. 搜索触发器 (回车或点击历史)
    const triggerSearch = (kw: string) => {
        const trimKw = kw.trim();
        if (!trimKw) return;
        setKeywords(trimKw);

        handleSearch(0, trimKw);

        setHistory((prev) => [trimKw, ...(prev || []).filter((i) => i !== trimKw)].slice(0, 10));
        setIsFocused(false);
    };

    // 清除输入框
    const handleClear = () => {
        setKeywords('');
        setIsSearching(false);
        setSongs([]);
        setPage(0);
        setHasMore(true);
    };

    // 播放单曲
    const playSing = async (song: any) => {
        try {
            const singSongs: any = await request.get(`/song/url?id=${song.id}`);
            const audioUrl = singSongs.data?.[0]?.url;
            const duration = singSongs.data?.[0]?.time;
            const freeTrialInfo = singSongs.data?.[0]?.freeTrialInfo;

            if (!audioUrl) {
                alert('版权受限，当前歌曲暂时无法播放');
                return;
            }
            usePlayerStore.getState().playSong({
                id: song.id,
                name: song.name,
                artist: song.artist,
                cover: song.cover,
                audioUrl,
                duration,
                fee: singSongs.data?.[0]?.fee,
                trialEnd: freeTrialInfo?.end ?? null,
                isVip:singSongs.data?.[0]?.fee === 1,
            });
        } catch (err) {
            console.log('请求错误', err);
        }
    };

    // 获取猜你喜欢 
    const { run } = useRequest(() => request.get('/personalized/newsong'), {
        manual: true,
        onSuccess: (res: any) => {
            const rawList = res.result || [];
            const cover = rawList.map((item: any) => item.picUrl).filter((url: string) => url);
            setGuessCovers(cover);

            const resDate: Song[] = rawList.map((item: any) => ({
                id: item.id,
                name: item.name,
                artist: displayArtist(item.song?.artists),
                cover: item?.picUrl ? `${item.picUrl}?param=80y80` : '',
                audioUrl: '',
                duration: item.song?.duration || 0,
                fee: item?.song?.fee || 0,
                trialEnd: null,
            }));
            usePlayerStore.getState().setPlayList(resDate);
        },
        onError: (err) => console.error('获取猜你喜欢失败:', err),
    });

    const handleGuessClick = useCallback(() => {
        run();
    }, [run]);

    if (loading) return <div>加载中：......</div>;
    if (error) return <div>出错了:{error.message}</div>;
    // ==================== 渲染 UI ====================
    return (
        <>
            {/* ===== 顶部：搜索框 ===== */}
            <div className="pt-6 pb-2 flex justify-start ml-6"> 
                <div
                    ref={searchWrapperRef}
                    // 👈 1. 用 onClick 代替 onFocus，点灰色背景也能展开
                    onClick={() => setIsFocused(true)}
                    className="relative flex items-center bg-zinc-800 border border-zinc-700 rounded-lg transition-all duration-300 ease-in-out"
                    // ❌ 删掉了 overflow-hidden
                    style={{ width: isFocused ? '250px' : '150px' }}
                >
                    <svg className="w-4 h-4 ml-3 text-zinc-400 flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>

                    <input
                        type="text"
                        placeholder="搜索歌曲"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') triggerSearch(keywords);
                        }}
                        className="flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder-zinc-500 w-full"
                    />

                    {keywords.trim() !== '' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // 👈 防止点击清空按钮时触发外层 onClick
                                handleClear();
                            }}
                            className="mr-2 w-4 h-4 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-600 transition-colors cursor-pointer text-[10px] flex-shrink:0"
                        >
                            ✕
                        </button>
                    )}

                    {/* 历史记录浮窗 */}
                    {isFocused && (
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden"
                        >
                            {history && history.length > 0 ? (
                                <>
                                    <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800">
                                        <span className="text-sm text-zinc-300 font-medium">历史搜索</span>
                                        <button
                                            onClick={() => setHistory([])}
                                            className="text-zinc-500 hover:text-red-400 text-sm transition-colors"
                                        >
                                            清空
                                        </button>
                                    </div>
                                    <div className="p-4 flex flex-wrap gap-3">
                                        {history.map((item) => (
                                            <span
                                                key={item}
                                                onClick={() => triggerSearch(item)}
                                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-md cursor-pointer transition-colors"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 text-sm text-zinc-500 text-center">
                                    暂无搜索历史
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isSearching ? (
                /* ===== 搜索结果列表 ===== */
                <ul className="space-y-1 mt-4">
                    {songs.map((item, index) => (
                        <li
                            key={item.id}
                            className="group relative flex items-center gap-4 p-2 rounded hover:bg-zinc-800 cursor-pointer transition-colors"
                        >
                            <span className="w-6 text-center text-zinc-500 text-sm flex-shrink:0">{index + 1}</span>
                            <img src={item.cover} alt={item.name} loading="lazy" onError={handleImageError} className="w-10 h-10 rounded object-cover flex-shrink:0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm truncate">{item.name}</p>
                                <p className="text-zinc-400 text-xs mt-0.5 truncate">{item.artist}</p>
                            </div>

                            <div className="absolute right-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); playSing(item); }} className="text-zinc-400 hover:text-white transition-colors cursor-pointer" title="播放">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5-9-5.5z" /></svg>
                                </button>
                                <button onClick={(e) => {
                                        e.stopPropagation();
                                        addSong({
                                            id: item.id, name: item.name, artist: item.artist, cover: item.cover,
                                            fee: item.fee, audioUrl: '', trialEnd: null, duration: item.duration,
                                            isVip:item.isVip,
                                        });
                                    }} className="text-zinc-400 hover:text-white transition-colors cursor-pointer" title="添加到队列">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <line x1="8" y1="3" x2="8" y2="13" />
                                        <line x1="3" y1="8" x2="13" y2="8" />
                                    </svg>
                                </button>
                                <LikeButton song = {item}/>
                            </div>
                        </li>
                    ))}

                    {hasMore && (
                        <li className="flex justify-center pt-4">
                            <button
                                onClick={() => handleSearch(page + 1, keywords)} 
                                className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
                            >
                                加载更多
                            </button>
                        </li>
                    )}
                </ul>
            ) : (
                /* ===== 推荐歌单视图 ===== */
                <>
                    <div className="flex items-center gap-8 mb-6 overflow-x-auto pb-2 border-b border-zinc-800">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => navigate(item.path)}
                                    className={`text-sm font-medium transition-colors cursor-pointer flex-shrink:0 whitespace-nowrap ${
                                        isActive ? 'text-red-500 font-bold' : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <FeatureCard title="猜你喜欢" subtitle="根据你的口味推荐" bgClass="bg-gradient-to-br from-amber-400 to-orange-500" cover={dynamicCover} onClick={handleGuessClick} />
                        <FeatureCard title="排行榜" subtitle="热门之选，潮流必备" bgClass="bg-gradient-to-br from-red-400 to-rose-600" cover="https://picsum.photos/202" onClick={() => navigate('/Toplist')} />
                        <FeatureCard title="歌单广场" subtitle="歌单潮音，一键畅享" bgClass="bg-gradient-to-br from-purple-400 to-indigo-500" cover="https://picsum.photos/203" onClick={() => navigate('/playlist-square')} />
                        <FeatureCard title="曲风" subtitle="流行、摇滚、民谣" bgClass="bg-gradient-to-br from-teal-400 to-emerald-500" cover="https://picsum.photos/202" onClick={() => navigate('/Genre')} />
                    </div>

                    <div className="flex items-center justify-between mb-4 mt-2">
                        <h2 className="text-white text-lg font-bold">热门歌单推荐</h2>
                        <div className="flex items-center gap-3 text-zinc-400">
                            <button className="hover:text-white transition-colors cursor-pointer flex items-center gap-1" title="换一批">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.29l5.62 5.62"/></svg>
                            </button>
                            <button className="hover:text-white transition-colors cursor-pointer flex items-center gap-1" title="查看全部">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                        {data?.map(item => (
                            <Link to={`/playlist/${item.id}`} key={item.id}>
                                <div className="group cursor-pointer">
                                    <div className="relative rounded-lg overflow-hidden">
                                        <img src={item.cover} alt={item.name} loading="lazy" onError={handleImageError} className="w-full aspect-square object-cover" />
                                        <div className="absolute top-2 right-2 text-white text-[10px] bg-black/50 px-1.5 py-0.5 rounded flex items-center gap-1">🎧 {item.playCount}</div>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                                                <svg width="12" height="12" viewBox="0 0 16 16" fill="white"><path d="M4 2.5v11l9-5.5-9-5.5z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-300 mt-2 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">{item.name}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}