import { Toaster } from "./components/ui/sonner";
import Discover from "./pages/Discover";
import MyMusic from "./pages/MyMusic";
import React,{Suspense} from 'react'
import Layout from "./pages/Layout";
import { BrowserRouter,Routes,Route } from "react-router-dom";
function App() {

  const PlaylistDetail  = React.lazy(()=>import("./pages/PlaylistDetail"))
  const ArtistDetail  = React.lazy(()=>import("./pages/ArtistDetail"))
  const PlaylistSquare = React.lazy(()=>import("./pages/PlaylistSquare"));
  const Genre = React.lazy(()=>import("./pages/Genre")); 
  const Toplist = React.lazy(()=>import("./pages/Toplist")); 
  const Artist = React.lazy(()=>import("./pages/Artist"))
  const Mv = React.lazy(()=>import("./pages/Mv"))
  return (
    <BrowserRouter> 
    <Toaster position="top-center" offset="200px" richColors />
    <Suspense fallback={<div className="text-white p-8">页面加载中...</div>}>
    
      <Routes>
        //父路由
        <Route path='/' element={<Layout />}>
          <Route index element = {<Discover/>}/>
          <Route path = '/my-music' element={<MyMusic/>} />
          <Route path="playlist/:id" element={<PlaylistDetail />} />
          <Route path="playlist-square" element={<PlaylistSquare />} />
          <Route path="Genre" element={<Genre />} />
          <Route path="Toplist" element={<Toplist />} />
          <Route path="Artist" element={<Artist />} />
          <Route path="Artist/:id" element={<ArtistDetail/>}/>
          <Route path="Mv" element={<Mv/>}/>
        </Route>

      </Routes>

    </Suspense>
    
    </BrowserRouter>
  );
}

export default App;