import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import request from '../api/request';
interface IdTags {
  id: number | string;
  name: string;
}

interface Playlist {
  id: number;
  name: string;
  cover: string;
  playCount: number;
  tags: string[];
}

export default function PlaylistSquare() {
  const navigate = useNavigate();
  const [highquality, setHighquality] = useState<IdTags[]>([]);
  const [activeTagName, setActiveTagName] = useState<string>('');
  const [data, setData] = useState<Playlist[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpdataTime, setLastUpdataTime] = useState<number | null>(null); //游标
  const observerRef = useRef<HTMLDivElement>(null);
  const [showAllTags, setShowAllTags] = useState(false);
  // 统一数据格式化逻辑（首屏和加载更多共用）
  const formatData = (rawList: any[]): Playlist[] => {
    return rawList.map((item: any) => ({
      id: item.id,
      name: item.name,
      cover: item.coverImgUrl ? `${item.coverImgUrl}?param=400y400` : '',
      playCount: item.playCount,
      tags: item.tags || [],
    }));
  };

  // 1. 获取标签（标签只需加载一次）
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res: any = await request.get('/playlist/highquality/tags');
        const hotListData = res?.tags.map((item: any) => ({
          id: item.id,
          name: item.name,
        }));
        setHighquality(hotListData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTags();
  }, []);
  useEffect(() => {
    const fetchHighQuality = async () => {
      const catParam = !activeTagName 
        ? '?limit=12'
        : `?limit=12&cat=${encodeURIComponent(activeTagName)}`;

      try {
        const res: any = await request.get(`/top/playlist/highquality${catParam}`);
        setHasMore(res.more);
        setLastUpdataTime(res.lasttime);
        setData(formatData(res.playlists || []));
      } catch (err) {
        console.error('歌单获取错误', err);
      }
    };
    fetchHighQuality();
  }, [activeTagName]);
  // 3. 加载更多函数
  const loadMore = async () => {
    if (!hasMore || isLoadingMore || !lastUpdataTime) return;
    setIsLoadingMore(true);

    try {
      const catParam = !activeTagName 
        ? ''
        : `&cat=${encodeURIComponent(activeTagName)}`;

      const res: any = await request.get(
        `/top/playlist/highquality?limit=12${catParam}&before=${lastUpdataTime}`
      );

      setData(prev => [...prev, ...formatData(res.playlists || [])]);
      setHasMore(res.more);
      setLastUpdataTime(res.lasttime); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  };
  // 4. 监听哨兵
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, activeTagName, lastUpdataTime]);
  const displayTags = [...highquality.slice(0, 9), { id: 'more', name: '全部标签' }];

  return (
    <div className="p-8 text-white min-h-screen">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer mb-6"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm">返回</span>
      </button>

      {/* 标签区 */}
      <div className="relative">
        
        {/* ===== 顶部标签区 ===== */}
        <div className="grid grid-cols-5 gap-3 pb-4 mb-6 border-b border-zinc-800">
          {displayTags.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'more') {
                  setShowAllTags(true);
                } else {
                  setActiveTagName(item.name);
                }
              }}
              className={`px-4 py-1.5 rounded-md text-sm w-full text-center truncate transition-colors cursor-pointer ${
                item.name === activeTagName
                  ? 'bg-blue-500 text-white font-medium'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* ===== 下拉式弹窗 ===== */}
        {showAllTags && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowAllTags(false)}
            />

            <div 
              className="absolute top-full right-0 mt-2 z-50 bg-zinc-900 w:[700px] max-h:[500px] rounded-xl overflow-y-auto p-6 border border-zinc-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="flex flex-wrap gap-x-4 gap-y-4">
                {highquality.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTagName(item.name);
                      setShowAllTags(false);
                    }}
                    className={`px-4 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                      activeTagName === item.name
                        ? 'bg-blue-500 text-white font-medium'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">
          {activeTagName === '全部标签' ? '全部歌单' : activeTagName + ' 歌单'}
        </h2>
      </div>

      {/* 歌单网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data.map(item => (
          <Link to={`/playlist/${item.id}`} key={item.id}>
            <div className="group cursor-pointer">
              <div className="relative rounded-lg overflow-hidden">
                <img src={item.cover} alt={item.name} loading="lazy" className="w-full aspect-square object-cover" />
                <div className="absolute top-2 right-2 text-white text-[10px] bg-black/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                  🎧 {item.playCount}
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="white">
                      <path d="M4 2.5v11l9-5.5-9-5.5z" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-300 mt-2 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                {item.name}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div ref={observerRef} className="h-10 w-full flex justify-center items-center mt-4">
        {isLoadingMore && <span className="text-zinc-500 text-sm">加载中...</span>}
        {!hasMore && <span className="text-zinc-500 text-sm">已经到底啦～</span>}
      </div>


    </div>
  );
}