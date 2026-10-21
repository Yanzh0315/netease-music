import { usePlayerStore, type Song } from '../store/usePlayerStore';
import request from '../api/request';
import { handleImageError } from '../utils/imageErrorHandler';
import LikeButton from './LikeButton';

export interface SongListProps {
    songs: Song[]; 
    hideTabs?:boolean;
}

export default function SongList({ songs,hideTabs = false }: SongListProps) {
    const currentSong = usePlayerStore((s) => s.currentSong);
    const addSong = usePlayerStore((s) => s.addSong);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '00:00';
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handlePlay = async (song: Song) => {
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
                id: song.id, name: song.name, artist: song.artist,
                cover: song.cover, audioUrl, duration,
                fee: singSongs.data?.[0]?.fee,
                trialEnd: freeTrialInfo?.end ?? null,
                isVip:song.isVip
            });
        } catch (err) {
            console.log('请求错误', err);
        }
    };

    return (
        <div className="px-8">
            {/* Tab 栏 */}
            { !hideTabs && (
                <div className="flex items-center gap-8 border-b border-zinc-800 mb-4">
                <button className="pb-3 text-white font-bold border-b-2 border-red-500 cursor-pointer">
                    歌曲 {songs?.length}
                </button>
                <button className="pb-3 text-zinc-400 hover:text-white transition-colors cursor-pointer">相似歌单</button>
                <button className="pb-3 text-zinc-400 hover:text-white transition-colors cursor-pointer">评论</button>
                <button className="pb-3 text-zinc-400 hover:text-white transition-colors cursor-pointer">收藏者</button>
            </div>
            )}
            {/* 歌曲列表 */}
            <div>
                {songs?.map((song, index) => { {/* 👈 注意：这里改成 songs.map */}
                    const isCurrent = currentSong?.id === song.id;
                    return (
                        <div key={song.id} className={`group relative flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors ${isCurrent ? 'bg-zinc-800' : 'hover:bg-zinc-800/60'}`}>
                            <span className={`w-6 text-center text-sm flex-shrink:0 ${isCurrent ? 'text-blue-400' : 'text-zinc-500'}`}>{index + 1}</span>
                            <img src={song.cover} alt={song.name} loading="lazy" onError={handleImageError} className="w-10 h-10 rounded object-cover flex-shrink:0" />
                            <div className="flex-1 min-w-0">
                                {/* 歌名 */}
                                <p className={`text-sm truncate ${isCurrent ? 'text-blue-400' : 'text-white'}`}>
                                    {song.name}
                                </p>
                                    <div className="flex items-center mt-0.5 gap-2">
                                    <p className="text-xs text-zinc-400 truncate">
                                        {song.artist}
                                    </p>
                                    
                                    {song.isVip && (
                                        <span className="text-[10px] text-yellow-500/80 border border-yellow-500/60 px-1 rounded-[3px] scale-90 shrink-0">
                                            VIP
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs text-zinc-500 flex-shrink:0 group-hover:opacity-0 transition-opacity">{formatTime(song.duration / 1000)}</span>

                            {/* 按钮组 */}
                            <div className="absolute right-4 opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handlePlay(song); }} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer">▶</button>
                                <button onClick={(e) => { e.stopPropagation(); addSong({ ...song, audioUrl: '', trialEnd: null }); }} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer">＋</button>
                                <LikeButton song = {song}/>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}