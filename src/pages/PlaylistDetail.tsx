import { useEffect, useState } from "react"
import { useParams, useNavigate } from 'react-router-dom';
import request from "../api/request";
import { usePlayerStore, type Song } from "../store/usePlayerStore"; 
import SongList from '../components/SongList'

export interface SingInformation {
    name: string;
    coverImgUrl: string;
    nickName: string;
    avatarUrl: string;
    playCount: number;
    description: string;
    createTime: number;
    tags: string;
}

export default function PlaylistDetail() {
    const { id } = useParams()
    const navigate = useNavigate();
    const [singInformation, setSingInformation] = useState<SingInformation | null>(null)
    const [playList, setPlaylist] = useState<Song[]>([])
    const setPlayList = usePlayerStore((s) => s.setPlayList)

    useEffect(() => {
        if (!id) return;
        // 获取歌单详情（不变）
        const getSingInformation = async () => {
            const res: any = await request.get(`/playlist/detail?id=${id}`);
            setSingInformation({
                name: res.playlist?.name,
                coverImgUrl: res.playlist?.coverImgUrl ? `${res.playlist.coverImgUrl}?param=400y400` : '',
                nickName: res.playlist?.creator?.nickname,
                avatarUrl: res.playlist?.creator?.avatarUrl ? `${res.playlist.creator.avatarUrl}?param=80y80` : '',
                playCount: res.playlist?.playCount,
                description: res.playlist?.description,
                createTime: res.playlist?.createTime,
                tags: res.playlist?.tags?.join(' ') || '',
            });
        };
        getSingInformation()

        // 获取歌单所有歌曲（不变）
        const getAllSingSong = async () => {
            const res: any = await request.get(`/playlist/track/all?id=${id}`)
            const formatted = res.songs.map((item: any) => ({
                id: item.id,
                name: item?.name,
                artist: item.ar?.map((a: any) => a.name).join(' ') || '未知歌手',
                cover: item.al?.picUrl ? `${item.al.picUrl}?param=80y80` : '',
                duration: item.dt,
                fee: item?.fee,
                isVip:item?.fee === 1,
            }))
            setPlaylist(formatted)
        }
        getAllSingSong()
    }, [id])

    return (
        <div className="text-white">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer px-8 pt-6">
                <span className="text-lg">←</span>
                <span className="text-sm">返回</span>
            </button>

            {/* 头部 UI 保持不变 */}
            <div className="flex gap-6 p-8">
                <img src={singInformation?.coverImgUrl} alt={singInformation?.name} referrerPolicy="no-referrer" className="w-48 h-48 rounded-lg object-cover flex-shrink:0" />
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-400 mb-1">歌单</div>
                    <h1 className="text-3xl font-bold text-white mb-4 truncate">{singInformation?.name}</h1>
                    <div className="flex items-center gap-2 mb-4">
                        <img src={singInformation?.avatarUrl} alt={singInformation?.nickName} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-sm text-zinc-300">{singInformation?.nickName}</span>
                        <span className="text-xs text-zinc-500 ml-2">{singInformation?.tags}</span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">简介：{singInformation?.description}</p>
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setPlayList(playList)} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-2">▶ 播放</button>
                        <button className="w-9 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">♡</button>
                        <button className="w-9 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">⬇</button>
                        <button className="w-9 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">↗</button>
                        <button className="w-9 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">⋯</button>
                    </div>
                </div>
            </div>
            <SongList songs={playList} />
        </div>
    );
}