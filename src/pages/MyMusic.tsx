import { usePlayerStore } from '../store/usePlayerStore';
import SongList from '../components/SongList';
import { useMemo, useState } from 'react';

export default function MyLikes() {
    const likedSongs = usePlayerStore((state) => state.likeSongs);
    const imageUrl = likedSongs[0]?.cover || 'https://picsum.photos/200';
    const [isSearching,setIsSearching] = useState(false);
    const [keyWord,setKeyWord] = useState('')

    const filterList = useMemo(()=>{
        if(!keyWord.trim()) return likedSongs;
    
        const lowerKw = keyWord.toLowerCase();
        return likedSongs.filter(song =>
            song.name.toLowerCase().includes(lowerKw)||
            song.artist.toLowerCase().includes(lowerKw)
        )

    },[likedSongs,keyWord]);
  return (
    <div className="w-full min-h-screen bg-[#121212] text-white pb-24">
        <div className="flex gap-6 px-4 pt-10 pb-6 items-start">
            
            <div className="w-48 h-48 rounded-xl overflow-hidden shrink-0 shadow-2xl bg-zinc-800">
                <img 
                    src={imageUrl.replace(/param=\d+y\d+/, 'param=400y400')} 
                    referrerPolicy="no-referrer"
                    alt="我喜欢" 
                    className="w-full h-full object-cover "
                />
            </div>
            <div className="flex flex-col flex-1 min-w-0 pt-2 h-48 justify-between">
                <h1 className="text-4xl font-bold text-white mb-6 truncate">
                    我喜欢
                </h1>
                <div className="flex items-center gap-3">
                    <button 
                        className="px-8 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-2 text-sm transition-colors cursor-pointer" 
                        onClick={() => {
                            if (likedSongs.length === 0) return;
                            usePlayerStore.getState().setPlayList(likedSongs);
                            usePlayerStore.getState().playSong(likedSongs[0]);
                        }}
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> 播放全部
                    </button>
                </div>
            </div>
        </div>
        <div className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-zinc-800">
            <div className="text-sm font-medium text-zinc-400">
                歌曲: {filterList.length}
            </div>
            <div className="flex items-center gap-5 text-zinc-400">
                <button className="hover:text-white transition-colors cursor-pointer" title="搜索">
                    {/* 搜索区域 */}
                    {isSearching ? (
                    <div className="flex items-center bg-zinc-800 rounded px-2 py-1">
                        <input 
                        autoFocus
                        value={keyWord}
                        onChange={(e) => setKeyWord(e.target.value)}
                        placeholder="搜索喜欢的音乐"
                        className="bg-transparent text-white text-sm outline-none w-32"
                        />
                        <button onClick={() => { setKeyWord(''); setIsSearching(false); }}>✕</button>
                    </div>
                    ) : (
                    <button onClick={() => setIsSearching(true)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </button>
                    )} 
                </button>

            </div>
        </div>
        <div className="px-2 mt-2">
        {likedSongs.length > 0 ? (
            filterList.length > 0 ? (
            <SongList songs={filterList} hideTabs={true} />
            ) : (
            <div className="text-zinc-500 text-center py-20">没有找到包含 "{keyWord}" 的歌曲</div>
            )
        ) : (
            <div className="text-zinc-500 text-center py-20">你还没有收藏任何歌曲哦~</div>
        )}
        </div>
    </div>
  );
}