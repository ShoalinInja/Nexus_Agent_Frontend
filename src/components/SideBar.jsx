import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import moment from "moment";
import toast from "react-hot-toast";

const SideBar = ({ isMenuOpen, setIsMenuOpen }) => {
  const {
    chats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
    user,
    navigate,
    createNewChat,
    setToken,
    deleteChat,
  } = useAppContext();
  const [search, setSearch] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    toast.success("Logged Out");
  };

  const handleDeleteChat = async (e, conversationId) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm("Are you sure you want to delete this?");
    if (!confirmed) return;
    await deleteChat(conversationId);
    toast.success("Chat deleted");
  };

  const filteredChats = chats.filter((chat) => {
    const searchText = search.toLowerCase();
    const preview = chat?.preview?.toLowerCase() || "";
    return preview.includes(searchText);
  });

  return (
    <div
      className={`flex flex-col h-screen w-full md:w-[20%] p-5
      dark:bg-gradient-to-b from-[#242124]/30 to-[#000000]/30
      border-r border-[#80609F]/30 backdrop-blur-3xl
      transition-all duration-500 max-md:absolute left-0 z-1 ${!isMenuOpen && "max-md:-translate-x-full"}`}
    >
      {/* Logo */}
      <img
        src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
        alt="Logo"
        className="w-full max-w-48"
      />

      {/* New Chat Button */}
      <button
        onClick={createNewChat}
        className="flex justify-center items-center w-full py-2 mt-10
        text-white bg-gradient-to-r from-[#A756F7] to-[#A18AF6]
        text-sm rounded-md cursor-pointer hover:opacity-90 transition"
      >
        <span className="mr-2 text-xl">+</span> New Chat
      </button>

      {/* Search */}
      <div className="flex items-center gap-2 p-3 mt-4 border border-gray-400 dark:border-white/20 rounded-md">
        <img
          src={assets.search_icon}
          alt="Search"
          className="w-4 not-dark:invert"
        />
        <input
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          type="text"
          placeholder="Search conversations"
          className="text-xs placeholder:text-gray-400 outline-none w-full bg-transparent"
        />
      </div>

      {/* Chats Section */}
      <div className="flex-1 overflow-y-auto mt-2">
        {filteredChats.length > 0 && (
          <p className="mt-2 text-sm">Recent Chats</p>
        )}
        {filteredChats.length === 0 && (
          <p className="text-xs text-gray-400 mt-4">No chats found</p>
        )}

        {filteredChats.map((chat) => (
          <div
            key={chat.conversation_id}
            onClick={() => {
              navigate("/");
              setSelectedChat(chat);
              setIsMenuOpen(false);
            }}
            className={`p-2 px-4 dark:bg-[#57317C]/10 border
            border-[#80609F]/30 rounded-md mt-2 cursor-pointer
            transition-all duration-300 flex justify-between group
            hover:bg-[#57317C]/20 ${selectedChat?.conversation_id === chat.conversation_id ? "bg-[#57317C]/20" : ""}`}
          >
            <div className="w-full">
              <p className="truncate w-full">
                {chat?.preview || "New conversation"}
              </p>
              <p className="text-xs text-gray-500 dark:text-[#B1A6C0]">
                {chat?.updated_at ? moment(chat.updated_at).fromNow() : ""}
              </p>
            </div>

            <img
              onClick={(e) => handleDeleteChat(e, chat.conversation_id)}
              src={assets.bin_icon}
              className="group-hover:block w-4 cursor-pointer not-dark:invert"
              alt="Delete"
            />
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div
        onClick={() => {
          navigate("/community");
          setIsMenuOpen(false);
        }}
        className="flex items-center gap-2 p-3 mt-4 border border-gray-300
        dark:border-white/15 rounded-md cursor-pointer hover:scale-105 transition-all"
      >
        <img
          src={assets.gallery_icon}
          alt="Gallery"
          className="w-4.5 not-dark:invert"
        />
        <p className="text-sm">Community Images</p>
      </div>

      {/* Dark Mode Toggle */}
      <div
        className="flex items-center justify-between gap-2 p-3 mt-4 border border-gray-300
        dark:border-white/15 rounded-md cursor-pointer hover:scale-105 transition-all"
      >
        <div className="flex items-center gap-2 text-sm">
          <img
            src={assets.theme_icon}
            alt="Dark Mode Button"
            className="2-4 not-dark:invert"
          />
          <p className="text-sm">Dark Mode</p>
        </div>
        <label className="relative inline-flex cursor-pointer">
          <input
            onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
            type="checkbox"
            className="sr-only peer"
            checked={theme === "dark"}
          />
          <div className="w-9 h-5 bg-gray-400 rounded-full peer-checked:bg-purple-600 transition-all"></div>
          <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
        </label>
      </div>

      {/* User Profile */}
      <div
        className="flex items-center gap-3 p-3 mt-4 border border-gray-300
        dark:border-white/15 rounded-md cursor-pointer hover:scale-105 transition-all group"
      >
        <img
          src={assets?.user_icon}
          alt="User Avatar"
          className="w-8 h-8 rounded-full"
        />
        <p className="flex-1 text-sm dark:text-primary truncate">
          {user ? user.name : "Login Your Account"}
        </p>
        {user && (
          <img
            onClick={logout}
            src={assets.logout_icon}
            alt="Logout"
            className="h-5 cursor-pointer not-dark:invert group-hover:block"
          />
        )}
      </div>

      <img
        onClick={() => setIsMenuOpen(false)}
        src={assets.close_icon}
        alt="Side Bar Close Icon"
        className="absolute top-3 right-3 w-5 h-5 cursor-pointer md:hidden not-dark:invert"
      />
    </div>
  );
};

export default SideBar;
