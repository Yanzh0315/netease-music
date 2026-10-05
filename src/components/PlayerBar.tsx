import { useRef, useEffect, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import request from '../api/request';
import parseLRC, { type LyricLine } from '../utils/parseLRC';
import { handleImageError } from '../utils/imageErrorHandler';
import LyricPanel from './LyricPanel';

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

  // ==================== UI 状态 ====================
  const [showQueue, setShowQueue] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [queueKeyword, setQueueKeyword] = useState('');
  const [showLyric, setShowLyric] = useState(false);

  // ==================== 歌词状态 ====================
  const [parsed, setParsed] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);

  // ==================== Refs ====================
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLAnchorElement>(null);

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
            alert('该歌曲无法播放');
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

  // ==================== 渲染 ====================
  return (
    <footer className="fixed bottom-0 left-0 w-full h-20 bg-zinc-800 border-t border-zinc-700 z-50">
      {/* 进度条 */}
      <div className="w-full h-1 bg-zinc-700 cursor-pointer">
        <div
          ref={progressRef}
          className="h-full bg-blue-500"
          style={{ width: '0%' }}
        />
      </div>

      {/* 播放条主体 */}
      {currentSong ? (
        <div className="flex items-center px-6 h-[calc(100%-4px)]">
          {/* 左侧：歌曲信息 */}
          <div
            onClick={() => setShowLyric(!showLyric)}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          >
            <img
              src={currentSong.cover}
              alt={currentSong.name}
              onError={handleImageError}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded object-cover bg-zinc-700 flex-shrink:0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm truncate">{currentSong.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="text-zinc-400 truncate">{currentSong.artist}</span>
                <span
                  ref={timeRef}
                  className="text-zinc-500 font-semibold flex-shrink:0"
                >
                  00:00/00:00
                </span>
              </div>
            </div>
          </div>

          {/* 中间：播放控制按钮 */}
          <div className="flex items-center gap-2 flex-shrink:0">
            <button
              onClick={prevSong}
              className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              ⏮️
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              {isPlaying ? '⏸' : '▶️'}
            </button>
            <button
              onClick={nextSong}
              className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              ⏭️
            </button>
          </div>

          {/* 右侧：队列按钮 */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                showQueue
                  ? 'bg-blue-500 text-white'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-700'
              }`}
            >
              ☰
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
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 flex-shrink:0">
            <div>
              <h3 className="text-white font-bold text-base">播放队列</h3>
              <p className="text-zinc-400 text-xs mt-0.5">共 {playlist.length} 首</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                onClick={() => setShowSearch(!showSearch)}
              >
                🔍
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                onClick={removeAllPlayList}
              >
                🗑
              </button>
              <button
                onClick={() => setShowQueue(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 搜索栏 */}
          {showSearch && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-700 flex-shrink:0">
              <input
                type="text"
                placeholder="搜索歌曲"
                value={queueKeyword}
                onChange={(e) => setQueueKeyword(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded bg-zinc-700 text-white text-sm outline-none placeholder:text-zinc-500"
                autoFocus
              />
              <button
                className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer flex-shrink:0"
                onClick={() => {
                  setShowSearch(false);
                  setQueueKeyword('');
                }}
              >
                取消
              </button>
            </div>
          )}

          {/* 歌曲列表 */}
          <ul className="flex-1 overflow-y-auto py-1">
            {filteredPlaylist.length === 0 ? (
              <li className="text-center text-zinc-700 text-sm py-10">
                播放列表为空
              </li>
            ) : (
              filteredPlaylist.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <li
                    key={song.id}
                    className={`group relative flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                      isCurrent ? 'bg-zinc-700' : 'hover:bg-zinc-700/60'
                    }`}
                  >
                    <span
                      className={`w-5 text-center text-xs flex-shrink:0 ${
                        isCurrent ? 'text-blue-400' : 'text-zinc-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <img
                      src={song.cover}
                      alt={song.name}
                      loading="lazy"
                      onError={handleImageError}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded object-cover flex-shrink:0"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          isCurrent ? 'text-blue-400' : 'text-white'
                        }`}
                      >
                        {song.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {song.artist}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-500 flex-shrink:0 group-hover:opacity-0 transition-opacity">
                      {song.duration
                        ? `${Math.floor(song.duration / 60000)}:${Math.floor(
                            (song.duration % 60000) / 1000
                          )
                            .toString()
                            .padStart(2, '0')}`
                        : '--:--'}
                    </span>

                    {/* 按钮组 */}
                    <div className="absolute right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          usePlayerStore.getState().playSong(song);
                        }}
                        className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M4 2.5v11l9-5.5-9-5.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePlayList(song.id);
                        }}
                        className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <line x1="4" y1="4" x2="12" y2="12" />
                          <line x1="12" y1="4" x2="4" y2="12" />
                        </svg>
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
            setTimeout(() => {
              usePlayerStore.getState().nextSong();
            }, 100);
          } else {
            usePlayerStore.getState().setPlaying(false);
          }
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;

          // 进度条
          if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            if (progressRef.current) {
              progressRef.current.style.width = `${percent}%`;
            }
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
            alert('试听已结束，请开通VIP听完整版');
          }

          // 歌词高亮
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
          usePlayerStore.getState().nextSong();
        }}
      />
    </footer>
  );
}