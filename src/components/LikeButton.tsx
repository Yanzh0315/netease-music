import { memo } from 'react';
import { type Song, usePlayerStore } from '../store/usePlayerStore';
import { toast } from "sonner"; 
import { Heart } from 'lucide-react'; 

const LikeButton = memo(({ song }: { song: Song }) => {
    const isLiked = usePlayerStore((state) =>
        state.likeSongs.some((s) => s.id === song.id)
    );
    const toggleLike = usePlayerStore((state) => state.toggleLike);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLike(song);
        if (!isLiked) {
            toast.success("已添加到我喜欢的音乐", {
                icon: <Heart className="w-4 h-4 text-red-500 fill-red-500" />,
                description: song.name,
            });
        } else {
            toast.info("已取消喜欢", {
                icon: <Heart className="w-4 h-4 text-zinc-400" />,
                description: song.name,
            });
        }
    };

    return (
        <button
            onClick={handleLike} 
            className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
            title={isLiked ? "取消喜欢" : "喜欢"}
        >
            <span className={isLiked ? "text-red-500" : "text-zinc-400 hover:text-white"}>
                {isLiked ? '❤️' : '♡'}
            </span>
        </button>
    )
})

export default LikeButton