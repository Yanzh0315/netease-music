import {memo} from 'react';
import {type Song , usePlayerStore} from '../store/usePlayerStore'

const LikeButton = memo(({song}:{song : Song})=>{
    const isLiked = usePlayerStore((state)=>
    state.likeSongs.some((s)=>s.id === song.id)
);
const toggleLike = usePlayerStore((state)=>state.toggleLike);

return(
    <button
            onClick={(e) => {
                e.stopPropagation(); 
                toggleLike(song);
            }}
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