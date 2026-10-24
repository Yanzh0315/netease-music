import { useNavigate } from "react-router-dom"

export default function MV(){
    const navigate = useNavigate()
    return(
        <>
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">返回</span>
            </button>
        <div>MV正在开发中......</div>
        </>
    )
}