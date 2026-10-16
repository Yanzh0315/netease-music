import { useEffect, useMemo, useState } from "react"
import request from "../api/request"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
interface TopListInterface {
    name:string;
    id:number;
    cover:string;
    desc:string;
    tracks:Array<{
        first:string;
        second:string;
    }>;
}

    const categoryRules = [
        { title: '官方榜', keywords: ['飙升榜', '新歌榜', '热歌榜', '原创榜'] },
        { title: 'VIP榜', keywords: ['VIP'] },
        { title: '全球榜', keywords: ['美国', 'UK', '日本', '韩国', '法国', '俄语', '越南', '泰语', 'Billboard', 'Oricon', 'Beatport', 'NRJ'] },
        { title: '特色榜', keywords: ['古典', '电音', '说唱', 'ACG', '摇滚', '国风', '民谣', 'R&B', 'DJ', '网络热歌', '蛋仔派对', 'AI歌曲'] },
        { title: '车友与合作榜', keywords: ['特斯拉', '理想', '比亚迪', '蔚来', '极氪', '昊铂', '埃安', '吉利', '音乐合伙人'] },
        { title: '更多榜单', keywords: [] } 
        ];
export default function Toplist(){
    const [toplistDate,setToplistDate] = useState<TopListInterface[]>([]);
    const navigate = useNavigate()
    useEffect(()=>{
        const getTopList = async()=>{
            try{
                const res : any = await request.get('/toplist')                
                const rawList = (res?.list || []).map((item:any)=>({
                    name:item?.name,
                    id:item?.id,
                    cover:item?.coverImgUrl,
                    desc:item?.description,
                    tracks:item?.tracks,
                }));
               setToplistDate(rawList);                
            } catch(err){
                console.error(err);                
            }
        }
        getTopList()
    },[])

    const groupedToplist = useMemo(() => {
        const result: any[] = [];

        categoryRules.filter(rule => rule.title !== '更多榜单').forEach(rule => {
            const matchedData = toplistDate.filter(item => 
                rule.keywords.some(keyword => item.name.includes(keyword))
            );

            if (matchedData.length > 0) {
                result.push({
                    title: rule.title,
                    data: matchedData 
                });
            }
        });
        const matchedNames = result.flatMap(group => group.data.map((item: any) => item.name));
        const restData = toplistDate.filter(item => !matchedNames.includes(item.name));
        
        if (restData.length > 0) {
            result.push({ title: '更多榜单', data: restData });
        }

        return result;
    }, [toplistDate]);
    const officialToplist = groupedToplist.find(group => group.title === '官方榜');
    
    return (
            <div className="p-8 text-white min-h-screen">
            <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer mb-6"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">返回</span>
            </button>
                {/* ================= 区域 1：四大官方榜（大卡片） ================= */}
                {officialToplist && officialToplist.data.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl font-bold mb-4 text-white">主流榜单</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {officialToplist.data.map((item: any) => (
                            <Link to={`/playlist/${item.id}`} key={item.id}>
                                <div className="group relative h-44 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
                                    <img
                                        src={item.cover}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                                </div>
                            </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ================= 区域 2：其余分类================= */}
                <div className="space-y-10">
                    {groupedToplist
                        .filter(group => group.title !== '官方榜') 
                        .map(group => (
                            <div key={group.title}>
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-lg font-bold text-white">{group.title}</h2>
                                    <span className="text-xs text-zinc-500 mt-1">{group.data.length}个榜单</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {group.data.map((item: any) => (
                                        <Link to={`/playlist/${item.id}`} key={item.id}>
                                            <div className="group flex gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 transition-colors cursor-pointer">
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 shadow-lg">
                                                    <img
                                                        src={item.cover}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h3 className="text-base font-bold text-white truncate mb-2">{item.name}</h3>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        )}