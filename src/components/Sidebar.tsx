{/* 2. 左侧菜单栏 */}
import {NavLink} from "react-router-dom"
export default function Sidebar(){
    return (
    <>
      <aside className="fixed top-16 left-0 w-56 h-[calc(100vh-64px-80px)] bg-zinc-950 overflow-y-auto p-4">
        <p className="text-zinc-400 text-sm mb-4">在线音乐</p>       
        <NavLink 
          to="/" 
          end 
          className={({ isActive }) => 
            `block px-4 py-3 rounded cursor-pointer mb-2 transition-colors ${
              isActive 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`
          }
        >
          发现音乐
        </NavLink>
        <NavLink 
          to="/my-music" 
          className={({ isActive }) => 
            `block px-4 py-3 rounded cursor-pointer mb-2 transition-colors ${
              isActive 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`
          }
        >
          我的音乐
        </NavLink>
        
        <div className="block px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded cursor-pointer transition-colors">
          关注
        </div>
      </aside>
    </>
    )
}