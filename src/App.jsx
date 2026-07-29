import React, { useState } from "react";
import SideBar from "./components/SideBar";
import { Routes, Route, useLocation } from "react-router-dom";
import ChatBox from "./components/ChatBox";
import PitchRail from "./components/PitchRail";
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
        <div className="flex h-screen w-screen overflow-x-auto overflow-y-hidden dark:bg-gradient-to-b from-[#242124] to-[#000000] dark:text-white">
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

          {/* Chat area — fills exact remaining space, no margin needed.
              min-w floor means the row overflows (horizontal scroll on the
              root) instead of squeezing this unreadably thin once the
              sidebar + chat floor + rail floor exceed the viewport. */}
          <div className="flex-1 min-w-[480px] h-full overflow-hidden flex flex-col">
            <Routes>
              <Route path="/" element={<ChatBox />} />
              {/* <Route path="/credits" element={<Credits />} /> */}
              <Route path="/community" element={<Community />} />
            </Routes>
          </div>

          {/* Pitch Rail — permanent, no collapse/hide/toggle. Width clamps
              between 236px and 320px, targeting 20vw in between. */}
          <div className="w-[20vw] min-w-[236px] max-w-[320px] flex-shrink-0 h-full">
            <PitchRail />
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
