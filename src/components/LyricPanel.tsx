// 歌词面板
import {type LyricLine} from '../utils/parseLRC'
import {type Song} from '../store/usePlayerStore'
import {useEffect, useRef} from 'react'
interface LyricPanelProps{
    parsed : LyricLine[];
    activeLyricIndex:number;
    currentSong: Song | null;
}

export default function LyricPanel({parsed,activeLyricIndex,currentSong}:LyricPanelProps) {
const activeLineRef = useRef<HTMLParagraphElement>(null);
useEffect(()=>{
  activeLineRef.current?.scrollIntoView({
    behavior: 'smooth',// 平滑滚动
    block: 'center',//滚到中间
  })
},[activeLyricIndex])
return (
  <div className="fixed top-16 left-0 w-full bottom-20 z-40 bg-zinc-900 flex flex-col">
    <div className="flex-shrink:0 text-center pt-8 pb-6">
      <h2 className="text-white text-2xl font-bold">{currentSong?.name}</h2>
      <p className="text-zinc-400 text-sm mt-2">{currentSong?.artist}</p>
    </div>
    {/* ===== 中间：歌词滚动区 ===== */}
    <div className="flex-1 overflow-y-auto px-8">
      <div className="max-w-3xl mx-auto py-8 pb-16">
        {parsed.map((line, index) => {
          const distance = Math.abs(index - activeLyricIndex);
          const className = 
            distance === 0 
              ? 'text-white text-2xl font-bold'
              : distance === 1 
              ? 'text-zinc-300 text-xl'
              : distance === 2 
              ? 'text-zinc-400 text-lg'
              : 'text-zinc-600 text-base';

          return (
            <p
              key={index}
              className={`text-center py-3 transition-all duration-300 ${className}`}
              ref={index === activeLyricIndex ? activeLineRef : null}
            >
              {line.text}
            </p>
          );
        })}
      </div>
    </div>

  </div>
);
}