import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import PlayerBar from "../components/PlayerBar";

function Layout() {
  return (
    <div className="bg-zinc-900 text-white h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>
      </div>
      <PlayerBar />
    </div>
  );
}

export default Layout;