import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import PlayerBar from "../components/PlayerBar";

function Layout() {
  return (
    <div className="bg-zinc-900 text-white min-h-screen">
      <Header />
      <Sidebar />
      <main className="ml-56 pt-16 pb-20 h-screen overflow-y-auto p-6">
        <Outlet />
      </main>
      <PlayerBar />
    </div>
  );
}

export default Layout;