import React, { useState } from "react";
import SideBar from "./components/SideBar";
import { Routes, Route, useLocation } from "react-router-dom";
import ChatBox from "./components/ChatBox";
import Credits from "./pages/Credits";
import Community from "./pages/Community";
import Loading from "./pages/Loading";
import { assets } from "./assets/assets";
import "./assets/prism.css";
import Login from "./pages/Login";
import { useAppContext } from "./context/AppContext";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { user, loadingUser } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();

  if (pathname === "/loading" || loadingUser) return <Loading />;

  return (
    <>
      <Toaster />
      {user ? (
        <div className="flex h-screen w-screen overflow-hidden dark:bg-gradient-to-b from-[#242124] to-[#000000] dark:text-white">
          {/* Mobile hamburger — fixed, only shown when sidebar is closed */}
          {!isMenuOpen && (
            <img
              src={assets.menu_icon}
              className="fixed top-3 left-3 z-50 w-8 h-8 cursor-pointer md:hidden not-dark:invert"
              onClick={() => setIsMenuOpen(true)}
            />
          )}

          {/*
            Sidebar wrapper:
            - Desktop: md:w-[22%] flex-shrink-0 → sidebar is a real flex child, takes 22% width
            - Mobile:  no width (sidebar is fixed/out-of-flow), collapses to 0 automatically
          */}
          <div className="md:w-[22%] md:flex-shrink-0 h-full">
            <SideBar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          </div>

          {/* Chat area — fills exact remaining space, no margin needed */}
          <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
            <Routes>
              <Route path="/" element={<ChatBox />} />
              {/* <Route path="/credits" element={<Credits />} /> */}
              <Route path="/community" element={<Community />} />
            </Routes>
          </div>
        </div>
      ) : (
        <div
          className="flex
        items-center justify-center h-screen w-screen"
        >
          <Login />
        </div>
      )}
    </>
  );
};

export default App;
