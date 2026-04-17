import React, { useEffect, useMemo, useState, useRef } from "react";
import Select from "react-select";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import Message from "../components/Message";
import toast from "react-hot-toast";
import {
  buildChatPayload,
  buildAssistantMessage,
  buildUserMessage,
  apiSendMessage,
  apiGetHistory,
} from "../lib/api";

// ─── Enquiry types ───────────────────────────────────────────────────────────
const ENQUIRY_TYPES = [
  { value: "property_recommendation", label: "Property Recommendation" },
  { value: "sales_assist", label: "Sales Assist" },
  { value: "general_question", label: "General Question" },
];

// ─── Filter data ──────────────────────────────────────────────────────────────
const FILTER_OPTIONS = {
  city: [
    { value: "london", label: "London" },
    { value: "manchester", label: "Manchester" },
    { value: "birmingham", label: "Birmingham" },
    { value: "leeds", label: "Leeds" },
    { value: "sheffield", label: "Sheffield" },
    { value: "edinburgh", label: "Edinburgh" },
    { value: "bristol", label: "Bristol" },
    { value: "nottingham", label: "Nottingham" },
    { value: "newcastle", label: "Newcastle" },
    { value: "cardiff", label: "Cardiff" },
    { value: "liverpool", label: "Liverpool" },
    { value: "glasgow", label: "Glasgow" },
    { value: "coventry", label: "Coventry" },
    { value: "southampton", label: "Southampton" },
    { value: "leicester", label: "Leicester" },
  ],
  university: [
    { value: "UCL", label: "UCL" },
    { value: "Imperial College London", label: "Imperial College London" },
    { value: "King's College London", label: "King's College London" },
    { value: "University of Oxford", label: "University of Oxford" },
    { value: "University of Cambridge", label: "University of Cambridge" },
    { value: "University of Manchester", label: "University of Manchester" },
    { value: "University of Birmingham", label: "University of Birmingham" },
    { value: "University of Leeds", label: "University of Leeds" },
    { value: "University of Sheffield", label: "University of Sheffield" },
    { value: "University of Edinburgh", label: "University of Edinburgh" },
    { value: "University of Bristol", label: "University of Bristol" },
    { value: "University of Nottingham", label: "University of Nottingham" },
    { value: "Newcastle University", label: "Newcastle University" },
    { value: "Cardiff University", label: "Cardiff University" },
    { value: "University of Liverpool", label: "University of Liverpool" },
    { value: "University of Glasgow", label: "University of Glasgow" },
    { value: "Coventry University", label: "Coventry University" },
    { value: "De Montfort University", label: "De Montfort University" },
  ],
  roomType: [
    { value: "ensuite", label: "Ensuite" },
    { value: "premium_ensuite", label: "Premium Ensuite" },
    { value: "studio", label: "Studio" },
    { value: "standard", label: "Standard Room" },
    { value: "shared", label: "Shared Room" },
  ],
  lease: [
    { value: "43w", label: "43 Weeks" },
    { value: "44w", label: "44 Weeks" },
    { value: "47w", label: "47 Weeks" },
    { value: "48w", label: "48 Weeks" },
    { value: "51w", label: "51 Weeks" },
    { value: "52w", label: "52 Weeks" },
    { value: "full_year", label: "Full Year" },
  ],
};

const FILTER_CONFIG = [
  {
    key: "city",
    type: "searchable",
    options: FILTER_OPTIONS.city,
    placeholder: "City",
  },
  { key: "budget", type: "number", placeholder: "Budget (£/week)" },
  {
    key: "university",
    type: "searchable",
    options: FILTER_OPTIONS.university,
    placeholder: "University",
  },
  {
    key: "roomType",
    type: "searchable",
    options: FILTER_OPTIONS.roomType,
    placeholder: "Room Type",
  },
  { key: "moveIn", type: "text", placeholder: "Move-in (DD-MM-YYYY)" },
  {
    key: "lease",
    type: "searchable",
    options: FILTER_OPTIONS.lease,
    placeholder: "Lease",
  },
];

// ─── react-select styles (theme-aware, borderless control) ────────────────────
const buildSelectStyles = (isDark) => ({
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (base) => ({
    ...base,
    background: "transparent",
    border: "none",
    boxShadow: "none",
    minHeight: "unset",
    cursor: "pointer",
  }),
  valueContainer: (base) => ({ ...base, padding: 0 }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    fontSize: "0.875rem",
    color: "inherit",
  }),
  singleValue: (base) => ({ ...base, color: "inherit", fontSize: "0.875rem" }),
  placeholder: (base) => ({
    ...base,
    color: "rgb(156,163,175)",
    fontSize: "0.875rem",
    margin: 0,
  }),
  indicatorsContainer: (base) => ({ ...base, padding: 0 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "0 2px",
    color: "inherit",
    opacity: 0.4,
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: "0 2px",
    color: "inherit",
    opacity: 0.4,
  }),
  menu: (base) => ({
    ...base,
    background: isDark ? "#1e1035" : "#ffffff",
    borderRadius: "0.625rem",
    border: isDark
      ? "1px solid rgba(128,96,159,0.25)"
      : "1px solid rgba(0,0,0,0.08)",
    boxShadow: isDark
      ? "0 12px 40px rgba(0,0,0,0.5)"
      : "0 8px 24px rgba(0,0,0,0.12)",
    marginTop: "6px",
    marginBottom: "6px",
    overflow: "hidden",
  }),
  menuList: (base) => ({ ...base, padding: "4px 0", maxHeight: "180px" }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    background: isSelected
      ? isDark
        ? "rgba(128,96,159,0.35)"
        : "rgba(128,96,159,0.18)"
      : isFocused
        ? isDark
          ? "rgba(128,96,159,0.18)"
          : "rgba(128,96,159,0.08)"
        : "transparent",
    color: isDark ? "#e2d9f3" : "#1a1a2e",
    fontSize: "0.875rem",
    padding: "7px 12px",
    cursor: "pointer",
  }),
});

// ─── ChatBox ──────────────────────────────────────────────────────────────────
const ChatBox = () => {
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const { selectedChat, theme, user, axios, updateConversationPreview } =
    useAppContext();
  const isDark = theme === "dark";

  const selectStyles = useMemo(() => buildSelectStyles(isDark), [isDark]);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [enquiryType, setEnquiryType] = useState("property_recommendation");
  const [filters, setFilters] = useState(
    Object.fromEntries(FILTER_CONFIG.map((f) => [f.key, ""])),
  );

  const setFilter = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  // Enquiry type selector shown before first message (any type)
  const isFirstMessage = messages.length === 0;

  // Filters are only shown for property_recommendation before first message
  const showFilters =
    isFirstMessage && enquiryType === "property_recommendation";

  // ── Render a single filter cell ──────────────────────────────────────────
  const renderFilter = (field) => {
    if (field.type === "number") {
      return (
        <input
          key={field.key}
          type="number"
          min={0}
          value={filters[field.key]}
          onChange={(e) => setFilter(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full text-sm px-4 bg-transparent outline-none border-none placeholder-gray-400"
        />
      );
    }

    if (field.type === "text") {
      return (
        <input
          key={field.key}
          type="text"
          value={filters[field.key]}
          onChange={(e) => setFilter(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full text-sm px-4 bg-transparent outline-none border-none placeholder-gray-400"
        />
      );
    }

    return (
      <Select
        key={field.key}
        options={field.options}
        value={
          field.options.find((o) => o.value === filters[field.key]) ?? null
        }
        onChange={(opt) => setFilter(field.key, opt ? opt.value : "")}
        placeholder={field.placeholder}
        menuPlacement="auto"
        menuPosition="fixed"
        menuPortalTarget={document.body}
        isClearable
        styles={selectStyles}
      />
    );
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) onSubmit(e);
    }
  };

  // ── Load chat history when conversation is selected ───────────────────────
  useEffect(() => {
    if (!selectedChat?.conversation_id) {
      setMessages([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const { data } = await apiGetHistory(
          axios,
          selectedChat.conversation_id,
        );
        // Convert backend message shape to frontend shape
        const msgs = (data.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now(),
          isImage: false,
        }));
        setMessages(msgs);
      } catch {
        setMessages([]);
      }
    };

    loadHistory();
  }, [selectedChat?.conversation_id]);

  // Scroll to latest message
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // ── Submit handler ────────────────────────────────────────────────────────
  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!user) return toast.error("Login is required.");
    if (!selectedChat?.conversation_id)
      return toast.error("No conversation selected.");

    // Validate mandatory fields for property_recommendation first message
    if (showFilters) {
      if (!filters.city)
        return toast.error("Please select a City before searching.");
      if (!filters.budget)
        return toast.error("Please enter a Budget before searching.");
      if (!filters.university)
        return toast.error("Please select a University before searching.");
    }
    if (!prompt.trim())
      return toast.error("Please enter a message before sending.");

    const promptCopy = prompt;
    setPrompt("");

    // Optimistically render user message
    const userMsg = buildUserMessage(promptCopy);
    setMessages((prev) => [...prev, userMsg]);

    try {
      setLoading(true);

      const payload = buildChatPayload({
        conversationId: selectedChat.conversation_id,
        message: promptCopy,
        filters: showFilters ? filters : {},
        enquiryType: isFirstMessage ? enquiryType : undefined,
      });

      const { data } = await apiSendMessage(axios, payload);
      const assistantMsg = buildAssistantMessage(data.reply);
      setMessages((prev) => [...prev, assistantMsg]);

      // Update the sidebar preview after the first message
      if (isFirstMessage) {
        updateConversationPreview(
          selectedChat.conversation_id,
          promptCopy.slice(0, 50),
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message);
      // Remove the optimistic user message on error
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-28 max-md:mt-14 2xl:pr-40">
      {/* Chat Messages */}
      <div ref={containerRef} className="flex-1 mb-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-primary">
            <img
              src={isDark ? assets.logo_full : assets.logo_full_dark}
              className="w-full max-w-56 md:max-w-68"
              alt="logo"
            />
            <p className="mt-5 text-4xl sm:text-6xl text-center text-gray-400">
              Ask Me Anything
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message, index) => (
              <Message key={index} message={message} />
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prompt Box */}
      <form
        onSubmit={onSubmit}
        className="bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30
  rounded-xl w-full px-4 py-3 flex flex-col gap-3"
      >
        {/* Row 1: Filters evenly spaced */}
        {showFilters && (
          <div className="h-[36px] w-full flex items-center px-2">
            {FILTER_CONFIG.map((field) => (
              <div className="w-full ">{renderFilter(field)}</div>
            ))}
          </div>
        )}

        {/* Row 3: Input full width */}
        <div className="flex items-center gap-3">
          {/* Left: Enquiry Type */}
          {isFirstMessage && (
            <div className="flex items-center gap-2 shrink-0">
              {/* <span className="text-xs text-gray-400">Type:</span> */}
              <div className="w-52">
                <Select
                  options={ENQUIRY_TYPES}
                  value={
                    ENQUIRY_TYPES.find((o) => o.value === enquiryType) ??
                    ENQUIRY_TYPES[0]
                  }
                  onChange={(opt) =>
                    setEnquiryType(opt ? opt.value : "property_recommendation")
                  }
                  menuPlacement="auto"
                  menuPosition="fixed"
                  menuPortalTarget={document.body}
                  isSearchable={false}
                  styles={selectStyles}
                />
              </div>
            </div>
          )}

          {/* Center: Textarea */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your prompt..."
              className="w-full text-sm outline-none bg-transparent border-none resize-none overflow-hidden leading-5 py-1"
            />
          </div>

          {/* Right: Submit */}
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src={loading ? assets.stop_icon : assets.send_icon}
              className="w-8"
              alt="send"
            />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
