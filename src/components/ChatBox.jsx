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
  buildFiltersPatch,
  apiSendMessage,
  apiGetHistory,
  apiPatchFilters,
} from "../lib/api";

// ─── Enquiry types ────────────────────────────────────────────────────────────
const ENQUIRY_TYPES = [
  { value: "property_recommendation", label: "Property Recommendation" },
  { value: "sales_assist",            label: "Sales Assist"            },
  { value: "general_question",        label: "General Question"        },
];

// ─── Room type options + fast label lookup ────────────────────────────────────
const ROOM_TYPE_OPTIONS = [
  { value: "ENSUITE",       label: "Ensuite"      },
  { value: "STUDIO",        label: "Studio"       },
  { value: "NON_ENSUITE",   label: "Non Ensuite"  },
  { value: "ONE_BED",       label: "One Bed"      },
  { value: "TWO_BED",       label: "Two Bed"      },
  { value: "THREE_BED",     label: "Three Bed"    },
  { value: "FOUR_BED",      label: "Four Bed"     },
  { value: "FIVE_BED",      label: "Five Bed"     },
  { value: "FIVE_PLUS_BED", label: "Five+ Bed"    },
  { value: "SHARED_ROOM",   label: "Shared Room"  },
  { value: "PRIVATE_ROOM",  label: "Private Room" },
  { value: "TWIN_STUDIO",   label: "Twin Studio"  },
  { value: "TWIN_ENSUITE",  label: "Twin Ensuite" },
  { value: "TWODIO",        label: "Twodio"       },
  { value: "ENTIRE_PLACE",  label: "Entire Place" },
  { value: "DORM",          label: "Dorm"         },
];

// value → human label (e.g. "ENSUITE" → "Ensuite")
const ROOM_TYPE_LABEL = Object.fromEntries(
  ROOM_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

// ─── Filter field config (city & university options are dynamic) ──────────────
const FILTER_CONFIG = [
  { key: "city",      type: "searchable-city",       placeholder: "City"               },
  { key: "budget",    type: "number",                placeholder: "Budget (£/week)"    },
  { key: "university",type: "searchable-university", placeholder: "University"         },
  { key: "roomType",  type: "searchable-static",
    options: ROOM_TYPE_OPTIONS,                       placeholder: "Room Type"          },
  { key: "moveIn",    type: "text",                  placeholder: "Move-in (DD-MM-YYYY)"},
  { key: "lease",     type: "integer",               placeholder: "Lease (weeks)"      },
];

// ─── Default filter values ────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  city:       "",
  budget:     "",
  university: "",
  roomType:   "ENSUITE",
  moveIn:     "05-09-2026",
  lease:      "51",
};

/**
 * Map stored backend filters (snake_case) → frontend filter state (camelCase).
 * Used when restoring a conversation from the sidebar.
 */
const backendToFrontendFilters = (bf = {}) => ({
  city:       bf.city                                        || "",
  budget:     bf.budget       != null ? String(bf.budget)   : "",
  university: bf.university                                  || "",
  roomType:   bf.room_type                                   || "ENSUITE",
  moveIn:     bf.intake                                      || "05-09-2026",
  lease:      bf.lease        != null
                ? String(Math.round(bf.lease))
                : "51",
});

// ─── react-select styles (theme-aware, borderless control) ────────────────────
const buildSelectStyles = (isDark) => ({
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (base) => ({
    ...base,
    background:  "transparent",
    border:      "none",
    boxShadow:   "none",
    minHeight:   "unset",
    cursor:      "pointer",
  }),
  valueContainer:     (base) => ({ ...base, padding: 0 }),
  input:              (base) => ({ ...base, margin: 0, padding: 0, fontSize: "0.875rem", color: "inherit" }),
  singleValue:        (base) => ({ ...base, color: "inherit", fontSize: "0.875rem" }),
  placeholder:        (base) => ({ ...base, color: "rgb(156,163,175)", fontSize: "0.875rem", margin: 0 }),
  indicatorsContainer:(base) => ({ ...base, padding: 0 }),
  indicatorSeparator: ()     => ({ display: "none" }),
  dropdownIndicator:  (base) => ({ ...base, padding: "0 2px", color: "inherit", opacity: 0.4 }),
  clearIndicator:     (base) => ({ ...base, padding: "0 2px", color: "inherit", opacity: 0.4 }),
  menu: (base) => ({
    ...base,
    background:    isDark ? "#1e1035" : "#ffffff",
    borderRadius:  "0.625rem",
    border:        isDark ? "1px solid rgba(128,96,159,0.25)" : "1px solid rgba(0,0,0,0.08)",
    boxShadow:     isDark ? "0 12px 40px rgba(0,0,0,0.5)"    : "0 8px 24px rgba(0,0,0,0.12)",
    marginTop:  "6px",
    marginBottom: "6px",
    overflow: "hidden",
  }),
  menuList: (base) => ({ ...base, padding: "4px 0", maxHeight: "180px" }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    background: isSelected
      ? isDark ? "rgba(128,96,159,0.35)" : "rgba(128,96,159,0.18)"
      : isFocused
        ? isDark ? "rgba(128,96,159,0.18)" : "rgba(128,96,159,0.08)"
        : "transparent",
    color:     isDark ? "#e2d9f3" : "#1a1a2e",
    fontSize:  "0.875rem",
    padding:   "7px 12px",
    cursor:    "pointer",
  }),
});

// ─── ChatBox ──────────────────────────────────────────────────────────────────
const ChatBox = () => {
  const containerRef = useRef(null);
  const textareaRef  = useRef(null);
  const { selectedChat, theme, user, axios, updateConversationPreview } =
    useAppContext();
  const isDark = theme === "dark";

  const selectStyles = useMemo(() => buildSelectStyles(isDark), [isDark]);

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [messages,             setMessages]             = useState([]);
  const [loading,              setLoading]              = useState(false);
  const [prompt,               setPrompt]               = useState("");
  const [enquiryType,          setEnquiryType]          = useState("property_recommendation");
  const [filters,              setFilters]              = useState(DEFAULT_FILTERS);

  // Requirements card state
  const [submittedFilters,     setSubmittedFilters]     = useState(null);  // null = not yet submitted
  const [editingRequirements,  setEditingRequirements]  = useState(false); // true = filter row visible
  const [savingFilters,        setSavingFilters]        = useState(false);

  // ── University data state ───────────────────────────────────────────────────
  const [uniData,    setUniData]    = useState([]);
  const [uniLoading, setUniLoading] = useState(true);
  const [uniError,   setUniError]   = useState(false);

  const setFilter = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  // ── Fetch universities on mount ─────────────────────────────────────────────
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setUniLoading(true);
        setUniError(false);
        const { data } = await axios.get("/universities");
        const rows = data.universities || [];
        setUniData(rows);
        console.log(`[UNIVERSITIES LOADED] ${rows.length} entries`);
      } catch (err) {
        console.error("[UNIVERSITIES] Failed to load:", err);
        setUniError(true);
      } finally {
        setUniLoading(false);
      }
    };
    fetchUniversities();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived city options (unique, sorted A–Z) ───────────────────────────────
  const cityOptions = useMemo(() => {
    const seen = new Set();
    const opts = [];
    for (const row of uniData) {
      const city = row.city;
      if (city && !seen.has(city)) {
        seen.add(city);
        opts.push({ value: city, label: city });
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [uniData]);

  // ── Derived university options (filtered by selected city) ─────────────────
  const universityOptions = useMemo(() => {
    const selectedCity = filters.city;
    const filtered     = selectedCity ? uniData.filter((r) => r.city === selectedCity) : uniData;
    const seen = new Set();
    const opts = [];
    for (const row of filtered) {
      const uni = row.university;
      if (uni && !seen.has(uni)) {
        seen.add(uni);
        opts.push({ value: uni, label: uni });
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [uniData, filters.city]);

  // ── Clear university when city changes and current uni is no longer valid ───
  useEffect(() => {
    if (filters.university && filters.city) {
      const stillValid = uniData.some(
        (r) => r.city === filters.city && r.university === filters.university
      );
      if (!stillValid) setFilter("university", "");
    }
  }, [filters.city]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived conditions ──────────────────────────────────────────────────────
  const isFirstMessage = messages.length === 0;
  // Show filter row: first message (property type) OR actively editing requirements
  const showFilters     = isFirstMessage && enquiryType === "property_recommendation";
  const showFilterRow   = showFilters || editingRequirements;

  // ── Load chat history when conversation is selected ─────────────────────────
  useEffect(() => {
    if (!selectedChat?.conversation_id) {
      setMessages([]);
      setSubmittedFilters(null);
      setEditingRequirements(false);
      return;
    }

    // Reset editing state whenever we switch conversations
    setEditingRequirements(false);

    // Restore filter controls from stored DB filters (available synchronously)
    const storedFilters     = selectedChat.filters || {};
    const hasStoredFilters  = Object.keys(storedFilters).length > 0;
    const restoredFilters   = hasStoredFilters
      ? backendToFrontendFilters(storedFilters)
      : DEFAULT_FILTERS;

    if (hasStoredFilters) setFilters(restoredFilters);

    const loadHistory = async () => {
      try {
        const { data } = await apiGetHistory(axios, selectedChat.conversation_id);
        const msgs = (data.messages || []).map((m) => ({
          role:      m.role,
          content:   m.content,
          timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now(),
          isImage:   false,
        }));
        setMessages(msgs);

        // Restore Requirements card if conversation already has messages + filters
        if (msgs.length > 0 && hasStoredFilters) {
          setSubmittedFilters(restoredFilters);
        } else {
          setSubmittedFilters(null);
        }
      } catch {
        setMessages([]);
        setSubmittedFilters(null);
      }
    };

    loadHistory();
  }, [selectedChat?.conversation_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render a single filter cell ─────────────────────────────────────────────
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
          className="w-full text-sm px-4 bg-transparent outline-none border-none placeholder-gray-400
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none"
        />
      );
    }

    if (field.type === "integer") {
      return (
        <input
          key={field.key}
          type="number"
          min={1}
          step={1}
          value={filters[field.key]}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^\d+$/.test(val)) setFilter(field.key, val);
          }}
          placeholder={field.placeholder}
          className="w-full text-sm px-4 bg-transparent outline-none border-none placeholder-gray-400
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none"
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

    if (field.type === "searchable-city") {
      return (
        <Select
          key={field.key}
          options={uniLoading ? [] : cityOptions}
          value={cityOptions.find((o) => o.value === filters.city) ?? null}
          onChange={(opt) => setFilter("city", opt ? opt.value : "")}
          placeholder={uniLoading ? "Loading..." : uniError ? "Failed to load" : field.placeholder}
          menuPlacement="auto"
          menuPosition="fixed"
          menuPortalTarget={document.body}
          isClearable
          isLoading={uniLoading}
          styles={selectStyles}
        />
      );
    }

    if (field.type === "searchable-university") {
      return (
        <Select
          key={field.key}
          options={uniLoading ? [] : universityOptions}
          value={universityOptions.find((o) => o.value === filters.university) ?? null}
          onChange={(opt) => setFilter("university", opt ? opt.value : "")}
          placeholder={uniLoading ? "Loading..." : uniError ? "Failed to load" : field.placeholder}
          menuPlacement="auto"
          menuPosition="fixed"
          menuPortalTarget={document.body}
          isClearable
          isLoading={uniLoading}
          styles={selectStyles}
        />
      );
    }

    // Static searchable dropdown (roomType)
    return (
      <Select
        key={field.key}
        options={field.options}
        value={field.options.find((o) => o.value === filters[field.key]) ?? null}
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

  // ── Auto-resize textarea ────────────────────────────────────────────────────
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

  // ── Scroll to latest message ────────────────────────────────────────────────
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top:      containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // ── Apply filter changes ("Done" button without sending a message) ──────────
  const handleApplyFilters = async () => {
    setSavingFilters(true);
    try {
      await apiPatchFilters(
        axios,
        selectedChat.conversation_id,
        buildFiltersPatch(filters)
      );
      setSubmittedFilters({ ...filters });
      setEditingRequirements(false);
    } catch (err) {
      console.error("[FILTERS] PATCH failed:", err);
      toast.error("Could not save filter changes.");
    } finally {
      setSavingFilters(false);
    }
  };

  // ── Submit handler ──────────────────────────────────────────────────────────
  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!user) return toast.error("Login is required.");
    if (!selectedChat?.conversation_id)
      return toast.error("No conversation selected.");

    // Validate mandatory fields for property_recommendation first message
    if (showFilters) {
      if (!filters.city)       return toast.error("Please select a City before searching.");
      if (!filters.budget)     return toast.error("Please enter a Budget before searching.");
      if (!filters.university) return toast.error("Please select a University before searching.");
    }
    if (!prompt.trim()) return toast.error("Please enter a message before sending.");

    const promptCopy = prompt;
    setPrompt("");

    // Optimistically render user message
    const userMsg = buildUserMessage(promptCopy);
    setMessages((prev) => [...prev, userMsg]);

    // Capture filter snapshot when first message is sent or when editing requirements
    if (showFilters || editingRequirements) {
      setSubmittedFilters({ ...filters });
    }
    if (editingRequirements) {
      setEditingRequirements(false);
    }

    try {
      setLoading(true);

      const payload = buildChatPayload({
        conversationId: selectedChat.conversation_id,
        message:        promptCopy,
        // Top-level filter fields — only on the first message (so backend saves them)
        filters:        showFilters ? filters : {},
        enquiryType:    isFirstMessage ? enquiryType : undefined,
        // Always send current dropdown state for drift detection
        currentFilters: filters,
      });

      const { data }  = await apiSendMessage(axios, payload);
      const assistantMsg = buildAssistantMessage(data.reply);
      setMessages((prev) => [...prev, assistantMsg]);

      if (isFirstMessage) {
        updateConversationPreview(
          selectedChat.conversation_id,
          promptCopy.slice(0, 50)
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message);
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setLoading(false);
    }
  };

  // ── Requirements card pills ─────────────────────────────────────────────────
  const requirementPills = submittedFilters
    ? [
        { label: "City",      value: submittedFilters.city },
        {
          label: "Budget",
          value: submittedFilters.budget ? `£${submittedFilters.budget}/wk` : "",
        },
        { label: "University", value: submittedFilters.university },
        {
          label: "Room",
          value:
            ROOM_TYPE_LABEL[submittedFilters.roomType] ||
            submittedFilters.roomType ||
            "",
        },
        { label: "Move-in", value: submittedFilters.moveIn },
        {
          label: "Lease",
          value: submittedFilters.lease ? `${submittedFilters.lease} wks` : "",
        },
      ].filter((p) => p.value)
    : [];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-28 max-md:mt-14 2xl:pr-40">

      {/* ── Requirements Navbar — sticky, lives OUTSIDE the scroll container ── */}
      {submittedFilters && requirementPills.length > 0 && (
        <div
          className={`flex-shrink-0 flex items-center gap-3 mb-2 px-4 py-2.5 rounded-xl border transition-colors
            ${isDark
              ? "bg-[#1a0f2e]/80 border-[#80609F]/25 backdrop-blur-sm"
              : "bg-white/80        border-[#80609F]/15 backdrop-blur-sm shadow-sm"
            }`}
        >
          {/* Left: label */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-[#b08fd4]" : "bg-[#80609F]"}`} />
            <span
              className={`text-xs font-semibold uppercase tracking-widest whitespace-nowrap
                ${isDark ? "text-[#b08fd4]" : "text-[#80609F]"}`}
            >
              Requirements
            </span>
          </div>

          {/* Divider */}
          <div className={`w-px self-stretch ${isDark ? "bg-[#80609F]/20" : "bg-[#80609F]/15"}`} />

          {/* Center: pills — scrollable row, no wrapping */}
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {requirementPills.map((pill) => (
              <span
                key={pill.label}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0
                  ${isDark
                    ? "bg-[#80609F]/15 border border-[#80609F]/30 text-gray-200"
                    : "bg-[#80609F]/5  border border-[#80609F]/20 text-gray-700"
                  }`}
              >
                <span className={isDark ? "text-gray-500" : "text-gray-400"}>{pill.label}</span>
                <span className={isDark ? "text-[#80609F]/50" : "text-[#80609F]/35"}>·</span>
                <span className="font-medium">{pill.value}</span>
              </span>
            ))}
          </div>

          {/* Right: Edit toggle */}
          <button
            type="button"
            onClick={() => setEditingRequirements((p) => !p)}
            className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all
              ${editingRequirements
                ? isDark
                  ? "bg-[#80609F]/30 text-[#d4bbf0]"
                  : "bg-[#80609F]/15 text-[#80609F] font-medium"
                : isDark
                  ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
              }`}
          >
            {editingRequirements ? "✕ Cancel" : "✏ Edit"}
          </button>
        </div>
      )}

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
        {/* Filter row — shown on first message OR when editing requirements */}
        {showFilterRow && (
          <div className="w-full flex items-center gap-1 px-2">
            {FILTER_CONFIG.map((field) => (
              <div key={field.key} className="w-full min-w-0">
                {renderFilter(field)}
              </div>
            ))}

            {/* "Apply" button — only in edit mode (not first message) */}
            {editingRequirements && (
              <button
                type="button"
                onClick={handleApplyFilters}
                disabled={savingFilters}
                className="shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg
                  bg-[#80609F] hover:bg-[#6d4e8a] active:bg-[#5d3f77]
                  text-white font-medium transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {savingFilters ? "…" : "Apply ✓"}
              </button>
            )}
          </div>
        )}

        {/* Message input row */}
        <div className="flex items-center gap-3">
          {/* Left: Enquiry Type (first message only) */}
          {isFirstMessage && (
            <div className="flex items-center gap-2 shrink-0">
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
