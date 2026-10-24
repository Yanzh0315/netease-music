import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  ListMusic,
  Search,   
  Trash2,   
  X         
} from "lucide-react";
import { toast } from "sonner";
import React, { useRef, useEffect, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import request from '../api/request';
import parseLRC, { type LyricLine } from '../utils/parseLRC';
import { handleImageError } from '../utils/imageErrorHandler';
import LyricPanel from './LyricPanel';
import { type PlayMode } from '../store/usePlayerStore'

export default function PlayerBar() {
  // ==================== Store 订阅 ====================
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playlist = usePlayerStore((s) => s.playList);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextSong = usePlayerStore((s) => s.nextSong);
  const prevSong = usePlayerStore((s) => s.prevSong);
  const removePlayList = usePlayerStore((s) => s.removePlayList);
  const removeAllPlayList = usePlayerStore((s) => s.removeAllPlayList);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
  const playMode = usePlayerStore((s) => s.playMode);
  const setPlayMode = usePlayerStore((s) => s.setPlayMode);

  // ==================== UI 状态 ====================
  const [showQueue, setShowQueue] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [queueKeyword, setQueueKeyword] = useState('');
  const [showLyric, setShowLyric] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showRate, setShowRate] = useState(false);

  // ==================== 歌词状态 ====================
  const [parsed, setParsed] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);

  // ==================== Refs ====================
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLAnchorElement>(null);
  const isDranggingRef = useRef(false);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const isDranggingVolumeRef = useRef(false);

  // ==================== 工具函数 ====================
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ==================== 队列搜索 ====================
  const filteredPlaylist = queueKeyword.trim()
    ? playlist.filter(
        (song) =>
          song.name.toLowerCase().includes(queueKeyword.toLowerCase()) ||
          song.artist.toLowerCase().includes(queueKeyword.toLowerCase())
      )
    : playlist;

  //拖拽音乐进度条
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!audioRef.current || !progressContainerRef.current || !progressRef.current) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    progressRef.current.style.width = `${percent * 100}%`;
    audioRef.current.currentTime = percent * audioRef.current.duration;
    isDranggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!audioRef.current || !progressContainerRef.current || !progressRef.current) return;

    const rect = progressContainerRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    progressRef.current.style.width = `${percent * 100}%`;
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!audioRef.current || !progressContainerRef.current || !progressRef.current) return;

    const rect = progressContainerRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = percent * audioRef.current.duration;

    isDranggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  //拖拽音量条
  const calcVolume = (clientY: number) => {
    if (!volumeBarRef.current) return 0;
    const rect = volumeBarRef.current.getBoundingClientRect();

    let percent = (rect.bottom - clientY) / rect.height;
    return Math.max(0, Math.min(1, percent));
  };

  const handleVolumeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDranggingVolumeRef.current = true;
    setVolume(calcVolume(e.clientY));

    document.addEventListener('mousemove', handleVolumeMouseMove);
    document.addEventListener('mouseup', handleVolumeMouseUp);
  };

  const handleVolumeMouseMove = (e: MouseEvent) => {
    if (!isDranggingVolumeRef.current) return;
    setVolume(calcVolume(e.clientY));
  };

  const handleVolumeMouseUp = () => {
    isDranggingVolumeRef.current = false;
    document.removeEventListener('mousemove', handleVolumeMouseMove);
    document.removeEventListener('mouseup', handleVolumeMouseUp);
  };

  //循环切换模式
  const togglePlayMode = () => {
    const modes: PlayMode[] = ['order', 'random', 'loop'];
    const currentIndex = modes.indexOf(playMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setPlayMode(nextMode);
  };

  // ==================== Effect 1：请求 URL + 设置 src ====================
  useEffect(() => {
    if (!audioRef.current) return;

    if (!currentSong) {
      audioRef.current.pause();
      audioRef.current.src = '';
      return;
    }

    const getUrl = async () => {
      let url = currentSong.audioUrl;

      if (!url) {
        try {
          const res: any = await request.get(`/song/url?id=${currentSong.id}`);
          url = res.data?.[0]?.url;
          const duration = res.data?.[0]?.time;
          const freeTrialInfo = res.data?.[0]?.freeTrialInfo;

          if (!url) {
            toast.error('该歌曲无法播放'); // 👈 顺手把这里的 alert 也改了
            return;
          }
          usePlayerStore.getState().setNewUrl({
            audioUrl: url,
            duration,
            trialEnd: freeTrialInfo?.end ?? null,
          });
        } catch (err) {
          console.error(err);
          return;
        }
      }

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.currentTime = 0;
        if (usePlayerStore.getState().isPlaying) {
          audioRef.current.play().catch((e) => console.log('play() 失败:', e));
        }
      }
    };

    getUrl();
  }, [currentSong?.id]);

  // ==================== Effect 2：播放/暂停 ====================
  useEffect(() => {
    if (!audioRef.current || !audioRef.current.src) return;

    if (isPlaying) {
      audioRef.current.play().catch((e) => console.log('play() 失败:', e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // ==================== Effect 3：请求歌词 ====================
  useEffect(() => {
    if (!currentSong) return;

    const getLyric = async () => {
      try {
        const lyric: any = await request.get(`/lyric?id=${currentSong.id}`);
        const raw = lyric.lrc?.lyric || '';
        setParsed(parseLRC(raw));
      } catch (err) {
        console.error(err);
      }
    };

    getLyric();
  }, [currentSong?.id]);

  // ==================== Effect 4：监听音量 ====================
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // ==================== Effect 5：监听音乐播放速度 ====================
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, currentSong?.id]);

  // ==================== 渲染 ====================
  return (
    <footer className="fixed bottom-0 left-0 w-full h-20 bg-zinc-800 border-t border-zinc-700 z-50">
      {/* 进度条 */}
      <div
        className="w-full h-1 bg-zinc-700 cursor-pointer group"
        onMouseDown={handleMouseDown}
        ref={progressContainerRef}
      >
        <div
          ref={progressRef}
          className="h-full bg-blue-500 relative"
          style={{ width: '0%' }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow" />
        </div>
      </div>

      {/* 播放条主体 */}
      {currentSong ? (
        <div className="flex items-center px-6 h-[calc(100%-4px)]">
          {/* 左侧：歌曲信息 */}
          <div
            onClick={() => setShowLyric(!showLyric)}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
          >
            <div className="relative w-12 h-12 rounded overflow-hidden shrink-0 bg-zinc-700">
              <img
                src={currentSong.cover}
                alt={currentSong.name}
                onError={handleImageError}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm truncate">{currentSong.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="text-zinc-400 truncate">{currentSong.artist}</span>
                {currentSong.isVip && (
                  <span className="text-[10px] text-yellow-500/80 border border-yellow-500/60 px-1 rounded-[3px] scale-90 shrink-0">
                    VIP
                  </span>
                )}
                <span
                  ref={timeRef}
                  className="text-zinc-500 font-semibold shrink-0"
                >
                  00:00/00:00
                </span>
              </div>
            </div>
          </div>

          {/* 中间：极简播放控制 */}
          <div className="flex items-center gap-6 shrink-0">
            <button
              onClick={prevSong}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="text-white hover:scale-110 transition-transform cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>
            <button
              onClick={nextSong}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>

          {/* 右侧控制区 */}

      <div className="flex-1 flex justify-end items-center gap-2"> 
        {/* 播放模式 */}
        <button
          onClick={togglePlayMode}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title={playMode === 'order' ? '顺序播放' : playMode === 'random' ? '随机播放' : '单曲循环'}
        >
          {playMode === 'order' && <Repeat className="w-5 h-5" />}
          {playMode === 'random' && <Shuffle className="w-5 h-5" />}
          {playMode === 'loop' && <Repeat1 className="w-5 h-5" />}
        </button>

        {/* 倍速 */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <button
            onClick={() => setShowRate(!showRate)}
            className={`text-sm font-bold leading-none pt-1px transition-colors cursor-pointer ${
              showRate ? 'text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {playbackRate}x
          </button>
          {showRate && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-20 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <div
                  key={rate}
                  onClick={() => { setPlaybackRate(rate); setShowRate(false); }}
                  className={`text-center py-2 text-sm cursor-pointer transition-colors ${
                    playbackRate === rate ? 'text-blue-400 bg-zinc-700/50 font-bold' : 'text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {rate}x
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 音量 */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <button 
            onClick={() => setShowVolume(!showVolume)}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          {/* 音量下拉框保持不变 */}
          {showVolume && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-8 h-32 bg-zinc-800 border border-zinc-700 rounded-lg flex flex-col items-center py-3 shadow-2xl z-50">
              <div 
                ref={volumeBarRef}
                onMouseDown={handleVolumeMouseDown}
                className="w-1 flex-1 bg-zinc-600 rounded cursor-pointer relative"
              >
                <div 
                  className="absolute bottom-0 w-full bg-blue-500 rounded"
                  style={{ height: `${volume * 100}%` }}
                >
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow" />
                </div>
              </div>
              <span className="text-[10px] text-zinc-400 mt-2">{Math.round(volume * 100)}%</span>
            </div>
          )}
        </div>

        {/* 队列 */}
        <button
          onClick={() => setShowQueue(!showQueue)}
          className={`w-8 h-8 flex items-center justify-center transition-colors cursor-pointer ${
            showQueue ? 'text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </div>
        </div>
      ) : (
        <div className="flex items-center px-6 h-[calc(100%-4px)]">
          <p className="text-zinc-500 text-sm">暂无播放</p>
        </div>
      )}

      {/* 播放队列弹窗 */}
      {showQueue && (
        <div className="absolute bottom-full right-6 mb-2 w-85 h-125 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
            <div>
              <h3 className="text-white font-bold text-base">播放队列</h3>
              <p className="text-zinc-400 text-xs mt-0.5">共 {playlist.length} 首</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                onClick={removeAllPlayList}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowQueue(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 搜索栏 */}
          {showSearch && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-700 shrink-0">
              <input
                type="text"
                placeholder="搜索歌曲"
                value={queueKeyword}
                onChange={(e) => setQueueKeyword(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded bg-zinc-700 text-white text-sm outline-none placeholder:text-zinc-500"
                autoFocus
              />
              <button
                className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                onClick={() => { setShowSearch(false); setQueueKeyword(''); }}
              >
                取消
              </button>
            </div>
          )}

          {/* 歌曲列表 */}
          <ul className="flex-1 overflow-y-auto py-1">
            {filteredPlaylist.length === 0 ? (
              <li className="text-center text-zinc-700 text-sm py-10">播放列表为空</li>
            ) : (
              filteredPlaylist.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <li
                    key={song.id}
                    className={`group relative flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${isCurrent ? 'bg-zinc-700' : 'hover:bg-zinc-700/60'
                      }`}
                  >
                    <span className={`w-5 text-center text-xs shrink-0 ${isCurrent ? 'text-blue-400' : 'text-zinc-500'}`}>
                      {index + 1}
                    </span>
                    <img
                      src={song.cover}
                      alt={song.name}
                      loading="lazy"
                      onError={handleImageError}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isCurrent ? 'text-blue-400' : 'text-white'}`}>
                        {song.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                        {song.isVip && (
                          <span className="text-[10px] text-yellow-500/80 border border-yellow-500/60 px-1 rounded-[3px] scale-90 shrink-0">VIP</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0 group-hover:opacity-0 transition-opacity">
                      {song.duration ? `${Math.floor(song.duration / 60000)}:${Math.floor((song.duration % 60000) / 1000).toString().padStart(2, '0')}` : '--:--'}
                    </span>

                    {/* 按钮组 */}
                    <div className="absolute right-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); usePlayerStore.getState().playSong(song); }}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removePlayList(song.id); }}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* 歌词面板 */}
      {showLyric && (
        <LyricPanel
          parsed={parsed}
          activeLyricIndex={activeLyricIndex}
          currentSong={currentSong}
        />
      )}

      {/* 音频标签 */}
      <audio
        ref={audioRef}
        {...({ referrerPolicy: 'no-referrer' } as any)}
        onError={() => {
          if (!currentSong || !audioRef.current?.src) return;
          if (playlist.length > 1) {
            setTimeout(() => { usePlayerStore.getState().nextSong(); }, 100);
          } else {
            usePlayerStore.getState().setPlaying(false);
          }
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          if (isDranggingRef.current) return;

          // 进度条
          if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            if (progressRef.current) progressRef.current.style.width = `${percent}%`;
          }

          // 时间文本
          if (timeRef.current) {
            timeRef.current.textContent = `${formatTime(audio.currentTime)}/${formatTime(audio.duration)}`;
          }

          // VIP 试听限制
          if (currentSong?.trialEnd && audio.currentTime >= currentSong.trialEnd) {
            audio.pause();
            audio.currentTime = 0;
            usePlayerStore.getState().setPlaying(false);
            usePlayerStore.getState().nextSong();

            toast.custom((t) => (
              <div className="animate-fly-away flex items-center gap-3 bg-zinc-900 border border-zinc-700 text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md">
                <div>
                  <p className="font-bold text-sm text-yellow-500">试听已结束</p>
                  <p className="text-xs text-zinc-400 mt-1">请开通 VIP 听完整版</p>
                </div>
                <button onClick={() => toast.dismiss(t)} className="ml-4 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ), { duration: 4000 });
          }

          // 歌词高亮（注意这里大括号闭合的位置！）
          if (parsed.length !== 0) {
            let idx = 0;
            for (let i = 0; i < parsed.length; i++) {
              if (parsed[i].time <= audio.currentTime) {
                idx = i;
              } else {
                break;
              }
            }
            setActiveLyricIndex(idx);
          }
        }}
        onEnded={() => {
          if (usePlayerStore.getState().playMode === 'loop') {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(e => console.log('重播失败', e));
            }
          } else {
            usePlayerStore.getState().nextSong();
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            audioRef.current.playbackRate = usePlayerStore.getState().playbackRate;
          }
        }}
      />
    </footer>
  );
}