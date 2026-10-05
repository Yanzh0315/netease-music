import Discover from "./pages/Discover";
import MyMusic from "./pages/MyMusic";
import PlaylistDetail from "./pages/PlaylistDetail";

import Layout from "./pages/Layout";
import { BrowserRouter,Routes,Route } from "react-router-dom";
function App() {
  return (
    <BrowserRouter>
    
      <Routes>
        //父路由
        <Route path='/' element={<Layout />}>
          <Route index element = {<Discover/>}/>
          <Route path = '/my-music' element={<MyMusic/>} />
          <Route path="playlist/:id" element={<PlaylistDetail />} />
        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;