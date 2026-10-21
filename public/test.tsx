// import {useCallback, useEffect, useState,useRef} from 'react';
// import request from '../api/request';
// import { usePlayerStore } from '../store/usePlayerStore';
// import {Link} from  "react-router-dom";
// import { useNavigate, useLocation } from 'react-router-dom'; 
// import {handleImageError} from '../utils/imageErrorHandler';
// import displayArtist from '../utils/displayArtist';
// import FeatureCard from '../components/FeatureCard';
// import { type Song } from '../store/usePlayerStore';
// import {useAutoChangeCover} from '../hooks/useAutoChangeCover'
// import {useRequest,useClickAway,useLocalStorageState} from 'ahooks'
// //后端接口数据格式
// export interface RawPlaylist  {
//     id:number;
//     name:string;
//     picUrl:string;
//     playCount:number;
// }
// //前端组件数据格式
// interface Playlist  {
//     id:number;
//     name:string;
//     cover:string;
//     playCount:number;
// }

// export default function Discover(){
//     //请求数据
//     const [data,setDate] = useState<Playlist[] | null>(null);
//     const [loading,setLoading] = useState(true);
//     const [error,setError] = useState<Error | null>(null);
//     //搜索
//     const [keywords,setKeywords] = useState('');
//     //搜索结果
//     const [songs,setSongs] = useState<any[]>([]);
//     const [isFocused,setIsFocused] = useState(false);
//     //搜索状态
//     const [isSearching,setIsSearching] = useState(false);
//     const [page,setPage] = useState(0);
//     const [hasMore,setHasMore] = useState(true);
//     const addSong = usePlayerStore((s)=>s.addSong);
//     const [isRefreshing,setIsRefreshing] = useState(false);
//     const [guessCovers,setGuessCovers] = useState<string[]>([])
//     const dynamicCover  = useAutoChangeCover(guessCovers,10000)
//     const navigate = useNavigate(); 
//     const location = useLocation();
//     const navItems = [
//         {label:'精选推荐',path:'/'},
//         // {label:'排行榜',path:'/'},
//         {label:'歌单广场',path:'/playlist-square'},
//         // {label:'分类歌单',path:'/'},
//     ];
//     const [history,setHistory] = useLocalStorageState<string[]>('search-history',{
//         defaultValue;[],
//     });
//     const searchWrapperRef = useRef<HTMLDivElement>(null)

//     useClickAway(()=>{
//         setIsFocused(false);
//     },searchWrapperRef)


//     //推荐歌单
//     useEffect(()=>{
//         fetchPlaylists();
//     },[])
//     //搜索和分页显示
//     const handleSearch = async(pageNum = 0)=>{
//         if(!keywords.trim()) return ;
//         setIsSearching(true);
//         //分页
//         const limit = 30;
//         const offset = pageNum * limit
//         try{
//                 const res: any = await request.get(`/search?keywords=${keywords}&type=1&limit=${limit}&offset=${offset}`); 
//                  //防御性判断                 
//                 if(!res.result || !res.result.songs){
//                     setLoading(false);
//                     return;
//                 }
//                 const rawList = res.result.songs;
//                 const formatted = rawList.map((item:any)=>({
//                 id:item.id,
//                 name:item.name,
//                 artist: displayArtist(item.artists),
//                 cover: item.artists?.[0]?.img1v1Url 
//                 ? `${item.artists[0].img1v1Url}?param=80y80` 
//                 : '',   
//                 duration:item.duration,             
//                 }));   
//                 if(pageNum === 0){
//                     setSongs(formatted);
//                 } else{
//                     setSongs(prev =>[...prev,...formatted]);
//                 }
//                 setPage(pageNum);
//                 setHasMore(res.result.hasMore)
            
//              } catch(err){
//             console.error(err)
//             }     
//     }
//     //清除输入框
//     const handleClear = ()=>{
//         setKeywords('');
//         setIsSearching(false);
//         setSongs([]);
//         setPage(0);
//         setHasMore(true)
//     }
//     //播放音乐
//     const playSing = async(song:any)=>{
//         try{
//             const singSongs : any = await request.get(`/song/url?id=${song.id}`)
//             const audioUrl = singSongs.data?.[0]?.url;
//             const duration = singSongs.data?.[0]?.time;    
//             const freeTrialInfo = singSongs.data?.[0]?.freeTrialInfo;
//             console.log(singSongs);
            
//             if(!audioUrl){
//                 alert('版权受限，当前歌曲暂时无法播放')
//                 return
//             }           
//             usePlayerStore.getState().playSong({
//                 id:song.id,
//                 name:song.name,
//                 artist: song.artist,
//                 cover:song.cover,
//                 audioUrl,
//                 duration,
//                 fee:singSongs.data?.[0]?.fee,
//                 trialEnd: freeTrialInfo?.end ?? null
//             });

//         } catch(err){
//             console.log('请求错误',err)
//         }
//     }
//     //请求歌单数据
//     const fetchPlaylists = ()=>{
//         setIsRefreshing(true);
//            const fetchData = async() =>{
//             try{
//                 const res :any = await request.get<RawPlaylist[]>('/personalized')                
//                 const rawList : RawPlaylist[] = res.result
//                 const formattedList = rawList
//                 //截取前28条数据，UI美观
//                 .slice(0,12)
//                 .map((item: RawPlaylist)=>({
//                     id:item.id,
//                     name:item.name,
//                     cover:item.picUrl
//                     ? `${item.picUrl}?param=400y400`
//                     :'',
//                     playCount:item.playCount,
//                 }))                               
//                 setDate(formattedList)
//                 setLoading(false)
//             } catch(err){
//                 console.log('请求出错',err)
//                 setError(err as Error)
//                 setLoading(false)
//             } finally{
//                 setIsRefreshing(false);
//             }
//             }
//              fetchData()
//     };
//     const { run } = useRequest(
//     () => request.get('/personalized/newsong'),
//     {
//         manual: true,
//         onSuccess: (res: any) => {
//         const rawList = res.result || [];
        
//         const cover = rawList.map((item: any) => item.picUrl).filter((url: string) => url);
//         setGuessCovers(cover);

//         const resDate: Song[] = rawList.map((item: any) => ({
//             id: item.id,
//             name: item.name,
//             artist: displayArtist(item.song?.artists),
//             cover: item?.picUrl ? `${item.picUrl}?param=80y80` : '',
//             audioUrl: '',
//             duration: item.song?.duration || 0,
//             fee: item?.song?.fee || 0,
//             trialEnd: null,
//         }));
//         usePlayerStore.getState().setPlayList(resDate);
//         },
//         onError: (err) => {
//         console.error('获取猜你喜欢失败:', err);
//         }
//     }
//     );
//     const getCommondList = ()=>{
//         run()
//     }
//     //请求猜你喜欢歌曲
//     // const getCommondList = async()=>{
//     //  try{  
//     //      const res:any = await request.get('/personalized/newsong')
//     //      const rawList = res.result || [];

//     //      const cover = rawList.map((item:any)=>item.picUrl).filter((url:string)=>url);         
//     //      setGuessCovers(cover);
//     //      const resDate:Song[] = rawList.map((item:any)=>({
//     //         id:item.id,
//     //         name:item.name,
//     //         artist:displayArtist(item.song?.artists),
//     //         cover:item?.picUrl ? `${item.picUrl}?param=80y80` : '',
//     //         audioUrl:'',
//     //         duration:item.song?.duration || 0,
//     //         fee:item?.song?.fee || 0,
//     //         trialEnd:null,
//     //      })) 
//     //     usePlayerStore.getState().setPlayList(resDate);
//     //     } catch(err){
//     //         console.error(err); 
//     //     }
//     // };
   
//     const handleGuessClick = useCallback(()=>{
//         getCommondList()
//     },[])
//     if(loading) return <div>加载中：......</div>
//     if(error) return <div>出错了:{error.message}</div>

//     return (
//         <>
//             {/* 搜索框区域 */}
//             <div className="pt-6">
//                 <div className='mb-6 flex gap-2 items-center'>
//                     <div className='relative flex-1'>
//                         <input
//                             type="text"
//                             placeholder='搜索歌曲'
//                             value={keywords}
//                             onChange={(e) => setKeywords(e.target.value)}
//                             onKeyDown={(e) => e.key === 'Enter' && handleSearch(0)}
//                             className='w-full py-2 pl-4 pr-12 rounded bg-zinc-800 text-white outline-none'
//                         />
//                         {keywords.trim() !== '' && (
//                             <button
//                                 onClick={handleClear}
//                                 className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-600 transition-colors cursor-pointer text-sm'
//                             >
//                                 ✕
//                             </button>
//                         )}
//                     </div>
//                     <button
//                         onClick={() => handleSearch(0)}
//                         className='px-5 py-2 bg-red-500 text-white rounded cursor-pointer hover:bg-red-600 transition-colors whitespace-nowrap shrink-0'
//                     >
//                         搜索
//                     </button>
//                 </div>
//             </div>

//             {isSearching ? (
//                 /* 搜索结果列表 */
//                 <ul className='space-y-1'>
//                     {songs.map((item, index) => (
//                         <li
//                             key={item.id}
//                             className='group relative flex items-center gap-4 p-2 rounded hover:bg-zinc-800 cursor-pointer transition-colors'
//                         >
//                             {/* 序号 */}
//                             <span className='w-6 text-center text-zinc-500 text-sm flex-shrink:0'>{index + 1}</span>
                            
//                             {/* 封面 */}
//                             <img
//                                 src={item.cover}
//                                 alt={item.name}
//                                 loading="lazy"
//                                 onError={handleImageError}
//                                 className='w-10 h-10 rounded object-cover flex-shrink:0'
//                             />
                            
//                             {/* 歌名 + 歌手 */}
//                             <div className="flex-1 min-w-0">
//                                 <p className="text-white text-sm truncate">{item.name}</p>
//                                 <p className="text-zinc-400 text-xs mt-0.5 truncate">{item.artist}</p>
//                             </div>

//                             {/* 按钮组 */}
//                             <div className="absolute right-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
//                                 <button
//                                     onClick={(e) => { e.stopPropagation(); playSing(item); }}
//                                     className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
//                                     title="播放"
//                                 >
//                                     <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
//                                         <path d="M4 2.5v11l9-5.5-9-5.5z" />
//                                     </svg>
//                                 </button>
//                                 <button
//                                     onClick={(e) => {
//                                         e.stopPropagation();
//                                         addSong({
//                                             id: item.id,
//                                             name: item.name,
//                                             artist: item.artist,
//                                             cover: item.cover,
//                                             fee: item.fee,
//                                             audioUrl: '',
//                                             trialEnd: null,
//                                             duration: item.duration,
//                                         });
//                                     }}
//                                     className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
//                                     title="添加到队列"
//                                 >
//                                     <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
//                                         <line x1="8" y1="3" x2="8" y2="13" />
//                                         <line x1="3" y1="8" x2="13" y2="8" />
//                                     </svg>
//                                 </button>
//                             </div>
//                         </li>
//                     ))}

//                     {hasMore && (
//                         <li className="flex justify-center pt-4">
//                             <button
//                                 onClick={() => handleSearch(page + 1)}
//                                 className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
//                             >
//                                 加载更多
//                             </button>
//                         </li>
//                     )}
//                 </ul>
//             ) : (
//                 /* 推荐歌单网格 */
//                 <>
//                 {/* 顶部分类导航条 */}
//                     <div className="flex items-center gap-8 mb-6 overflow-x-auto pb-2 border-b border-zinc-800">
//                         {navItems.map((item) => {
//                             const isActive = location.pathname === item.path;
                            
//                             return (
//                                 <button
//                                     key={item.label}
//                                     onClick={() => navigate(item.path)}
//                                     className={`text-sm font-medium transition-colors cursor-pointer flex-shrink:0 whitespace-nowrap ${
//                                         isActive
//                                             ? 'text-red-500 font-bold' 
//                                             : 'text-zinc-400 hover:text-white'
//                                     }`}
//                                 >
                                 
//                                     {item.label}
//                                 </button>
//                             );
//                         })}
//                     </div>

//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
//                     <FeatureCard 
//                         title="猜你喜欢" subtitle="根据你的口味推荐" 
//                         bgClass="bg-gradient-to-br from-amber-400 to-orange-500" 
//                         cover={dynamicCover }
//                         onClick={handleGuessClick}
//                     />
//                     <FeatureCard 
//                         title="排行榜" subtitle="热门之选，潮流必备" 
//                         bgClass="bg-gradient-to-br from-red-400 to-rose-600" 
//                         cover="https://picsum.photos/202" 
//                         onClick={() => navigate('/Toplist')}
//                     />
//                     <FeatureCard 
//                         title="歌单广场" subtitle="歌单潮音，一键畅享" 
//                         bgClass="bg-gradient-to-br from-purple-400 to-indigo-500" 
//                         cover="https://picsum.photos/203"
//                         onClick={()=>navigate('/playlist-square')} 
//                     />
//                     <FeatureCard 
//                     title="曲风" 
//                     subtitle="流行、摇滚、民谣" 
//                     bgClass="bg-gradient-to-br from-teal-400 to-emerald-500" 
//                     cover="https://picsum.photos/202" 
//                     onClick={() => navigate('/Genre')}
//                     />
//                     </div>

//                     {/* 推荐歌单网格 */}

//                     <div className="flex items-center justify-between mb-4 mt-2">
//                         {/* 左侧标题 */}
//                         <h2 className="text-white text-lg font-bold">热门歌单推荐</h2>
                        
//                         {/* 右侧操作按钮组 */}
//                         <div className="flex items-center gap-3 text-zinc-400">
//                         {/* 刷新按钮 */}
//                         <button 
//                             className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
//                             title="换一批"
//                         >
//                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.29l5.62 5.62"/>
//                             </svg>
//                         </button>
                        
//                         {/* 跳转/查看更多按钮 */}
//                         <button 
//                             className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
//                             title="查看全部"
//                         >
//                             <span className="text-xs">查看更多</span>
//                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M9 18l6-6-6-6"/>
//                             </svg>
//                         </button>
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
//                         {data?.map(item => (
//                         <Link to={`/playlist/${item.id}`} key={item.id}>
//                             <div className="group cursor-pointer">
//                             <div className="relative rounded-lg overflow-hidden">
//                                 <img
//                                 src={item.cover}
//                                 alt={item.name}
//                                 loading="lazy"
//                                 onError={handleImageError}
//                                 className="w-full aspect-square object-cover" 
//                                 />
                                
//                                 <div className="absolute top-2 right-2 text-white text-[10px] bg-black/50 px-1.5 py-0.5 rounded flex items-center gap-1">
//                                 🎧 {item.playCount}
//                                 </div>
                                
//                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                                 <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
//                                     <svg width="12" height="12" viewBox="0 0 16 16" fill="white">
//                                     <path d="M4 2.5v11l9-5.5-9-5.5z" />
//                                     </svg>
//                                 </div>
//                                 </div>
//                             </div>
                            
//                             {/* 歌单标题：缩小字号，保持两行截断 */}
//                             <p className="text-xs text-zinc-300 mt-2 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
//                                 {item.name}
//                             </p>
//                             </div>
//                         </Link>
//                         ))}
//                     </div>

//                     <div className="flex justify-center mt-8 mb-4">
//                         <button
//                             onClick={fetchPlaylists}
//                             disabled={isRefreshing}
//                             className={`flex items-center gap-2 px-8 py-2.5 rounded-full border transition-all cursor-pointer ${
//                                 isRefreshing
//                                     ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
//                                     : 'bg-zinc-800/80 border-zinc-600 text-zinc-200 hover:bg-zinc-700 hover:text-white hover:border-zinc-500'
//                             }`}
//                         >
//                             <span className={`text-sm ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
//                             {isRefreshing ? '正在换一批...' : '换一批'}
//                         </button>
//                     </div>
//                 </>
//             )}
//         </>
//     )
// }
