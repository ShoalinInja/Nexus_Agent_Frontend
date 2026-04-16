import { createContext, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  authHeader,
  apiCreateConversation,
  apiListConversations,
  apiDeleteConversation,
} from "../lib/api";

// Base URL includes the /v0/api prefix
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser]                         = useState(null);
  // chats shape: [{ conversation_id, preview, filters, created_at, updated_at }]
  const [chats, setChats]                       = useState([]);
  const [selectedChat, setSelectedChat]         = useState(null);
  const [theme, setTheme]                       = useState(localStorage.getItem("theme") || "light");
  const [token, setToken]                       = useState(localStorage.getItem("token") || null);
  const [loadingUser, setLoadingUser]           = useState(true);
  const [hasFetchedChats, setHasFetchedChats]   = useState(false);

  // ── fetchUser ─────────────────────────────────────────────────────────────
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/user", {
        headers: authHeader(token),
      });
      if (data.success) {
        setUser(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      if (error.response?.status === 401) {
        setToken(null);
        localStorage.removeItem("token");
      }
    } finally {
      setLoadingUser(false);
    }
  };

  // ── fetchUserChats — calls GET /conversation/list ─────────────────────────
  const fetchUserChats = async () => {
    try {
      const { data } = await apiListConversations(axios);
      const conversations = data.conversations || [];
      setChats(conversations);
      if (conversations.length > 0) {
        setSelectedChat(conversations[0]);
      } else {
        // No conversations yet — create one automatically
        await _createAndSelectConversation();
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Could not load conversations");
    }
  };

  // ── Internal helper — create a conversation and select it ─────────────────
  const _createAndSelectConversation = async () => {
    try {
      const { data } = await apiCreateConversation(axios, {});
      // Build a minimal conversation item to display in state
      const newConvo = {
        conversation_id: data.conversation_id,
        preview: "New conversation",
        filters: {},
        created_at: data.created_at,
        updated_at: data.created_at,
      };
      setChats((prev) => [newConvo, ...prev]);
      setSelectedChat(newConvo);
      return newConvo;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Could not create conversation");
    }
  };

  // ── createNewChat — calls POST /conversation/create ───────────────────────
  const createNewChat = async () => {
    if (!user) return toast("Login to create new chat");
    navigate("/");
    await _createAndSelectConversation();
  };

  // ── deleteChat — calls DELETE /conversation/{id} ──────────────────────────
  const deleteChat = async (conversationId) => {
    try {
      await apiDeleteConversation(axios, conversationId);
      const updated = chats.filter((c) => c.conversation_id !== conversationId);
      setChats(updated);

      if (selectedChat?.conversation_id === conversationId) {
        if (updated.length > 0) {
          setSelectedChat(updated[0]);
        } else {
          // No conversations left — auto-create one
          await _createAndSelectConversation();
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Could not delete conversation");
    }
  };

  // ── updateConversationPreview — update sidebar after first message ─────────
  // Called by ChatBox after the first reply so the sidebar shows content.
  const updateConversationPreview = (conversationId, preview) => {
    setChats((prev) =>
      prev.map((c) =>
        c.conversation_id === conversationId
          ? { ...c, preview, updated_at: new Date().toISOString() }
          : c
      )
    );
    setSelectedChat((prev) =>
      prev?.conversation_id === conversationId
        ? { ...prev, preview, updated_at: new Date().toISOString() }
        : prev
    );
  };

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      // Attach Bearer token to all outgoing axios requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setUser(null);
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setLoadingUser(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token && !hasFetchedChats) {
      fetchUserChats();
      setHasFetchedChats(true);
    }
  }, [user, token]);

  const value = {
    navigate,
    user,
    setUser,
    fetchUser,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
    createNewChat,
    loadingUser,
    fetchUserChats,
    token,
    setToken,
    axios,
    deleteChat,
    updateConversationPreview,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
};
