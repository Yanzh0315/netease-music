import { create } from 'zustand';
import { persist} from 'zustand/middleware';
// 1. 定义歌曲的数据结构
export interface Song {
  id: number;
  name: string;
  artist: string;
  cover: string;
  audioUrl?: string;   // 播放地址
  duration: number; // 总时长（毫秒）
  fee: number,
  trialEnd?:number | null,
}
// 2. 定义 Store 的类型
interface PlayerState {
  currentSong: Song | null;   // 当前播放的歌曲
  isPlaying: boolean;         // 是否正在播放
  playList : Song[];          //播放列表
  playSong: (song: Song) => void;    // 切歌方法
  togglePlay: () => void;            // 播放/暂停切换
  setPlaying: (playing: boolean) => void; // 强制设置播放状态
  addSong:(song : Song) => void;
  nextSong:() =>void;
  prevSong:() =>void;
  setNewUrl: (newInfo: { 
  audioUrl: string; 
  duration: number; 
  trialEnd: number | null;   // 👈 加
  }) => void;
  removePlayList:(id:number)=>void;//删除歌曲队列中的某条数据
  removeAllPlayList:()=>void;//删除歌曲队列中的所有数据
  setPlayList:(playList : Song[]) => void;//替换队列数据
}
// 3. 创建 store
export const usePlayerStore = create<PlayerState>()(
  persist(
  (set,get) => ({
  // 初始状态
  currentSong: null,
  isPlaying: false,
  playList:[],

  // 方法：播放一首新歌,并把播放的歌曲放到队列
  playSong:(song)=>{
    set({ currentSong: song, isPlaying: true, }),
    get().addSong(song)
  },
  // 方法：切换播放/暂停
  togglePlay: () => set((state) => ({ 
    isPlaying: !state.isPlaying 
  })),
  // 方法：强制设置播放状态
  setPlaying: (playing) => set({ isPlaying: playing }),
  //添加播放列表
  addSong:(song)=> set((state)=>{
   const searchId = state.playList.some((item)=>item.id === song.id)
   if(searchId) return state;  
   return {playList:[...state.playList,song]}
  }),
  //下一首
  nextSong:()=>{
    const {currentSong,playList} = get();    
    if(!currentSong || playList.length === 0) return;
    const currentIndex  = playList.findIndex((song) => song.id === currentSong.id)
    if(currentIndex === playList.length-1){
      set(()=>({currentSong:playList[0]}))
    } else{
      set(()=>({currentSong:playList[currentIndex+1]}))
    }
  },
  //上一首
  prevSong:()=>{
    const {currentSong,playList} = get();  
    if(!currentSong || playList.length === 0) return;
    const currentIndex  = playList.findIndex((song) => song.id === currentSong.id)
    if (currentIndex === -1) {
      set({ currentSong: playList[0], isPlaying: true });
      return;
    }
    if(currentIndex === 0){
      set(()=>({currentSong:playList[playList.length-1]}))
    } else{
      set(()=>({currentSong:playList[currentIndex-1]}))
  }
},
  //补充切换列表时丢失的URL
setNewUrl: (value) => set((state) => {
  if (state.currentSong?.audioUrl === value.audioUrl) {
    return state;
  }
  return {
    currentSong: state.currentSong ? {
      ...state.currentSong,
      audioUrl: value.audioUrl,
      duration: value.duration,
      trialEnd: value.trialEnd,
    } : null,
  };
}),
removePlayList: (id) => set((state) => {
  const newPlaylist = state.playList.filter((item) => item.id !== id);
  
  if (state.currentSong?.id !== id) {
    return { playList: newPlaylist };
  }
  if (newPlaylist.length === 0) {
    return {
      playList: [],
      currentSong: null,
      isPlaying: false,
    };
  }
  // 3.2 列表还有歌 → 切换到第一首
  return {
    playList: newPlaylist,
    currentSong: newPlaylist[0],
    isPlaying: true,
  };
}),
  //删除歌曲队列中的所有数据
removeAllPlayList:() => set(()=>({
    playList:[],
    currentSong:null,
    isPlaying:false,
})),
  //替换队列数据
setPlayList:(playList)=>set(({
    playList:playList,
    currentSong:playList[0] ?? null,
    isPlaying:true,
}))
}),
{
  name:'player-storage',
  partialize:(state)=>({
    currentSong:state.currentSong,
    playList:state.playList,
  })
}
))