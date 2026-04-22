// -----------------------------------------------------------------
// client/src/lib/api.js
//
// Central API utility for the Nexus Agent frontend.
// Handles: auth headers, filter transforms, and AI message construction.
//
// Chat management is handled entirely through the backend API.
// localStorage is only used for: token, theme.
// -----------------------------------------------------------------

// -----------------------------------------------------------------
// 1. Auth header helper
// -----------------------------------------------------------------

/**
 * Returns the Authorization header object required by the FastAPI backend.
 */
export const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

// -----------------------------------------------------------------
// 2. Filter value transformations
// -----------------------------------------------------------------

/**
 * Parses the frontend lease string into a number of weeks (float).
 *   "43w"       → 43
 *   "full_year" → 52
 *   "" / null   → undefined
 */
export const parseLeaseWeeks = (leaseStr) => {
  if (!leaseStr) return undefined;
  if (leaseStr === "full_year") return 52;
  const parsed = parseInt(leaseStr, 10);
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * Validates a free-text move-in date entered by the user.
 * Accepted formats: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD
 * Returns the raw string as-is (backend handles normalization), or undefined if blank.
 */
export const parseMoveInDate = (dateStr) => {
  if (!dateStr || !dateStr.trim()) return undefined;
  return dateStr.trim();
};

// -----------------------------------------------------------------
// 3. Build the /chat/send request payload
// -----------------------------------------------------------------

/**
 * Constructs the full request body for POST /v0/api/chat/send.
 * Only attaches filter fields that have non-empty values.
 *
 * @param {object} params
 * @param {string} params.conversationId  - UUID from backend
 * @param {string} params.message         - raw user message string
 * @param {object} params.filters         - {city, budget, university, roomType, moveIn, lease}
 *                                          Sent as top-level fields on the first message.
 * @param {string} [params.enquiryType]   - only sent on the first message
 * @param {object} [params.currentFilters] - full dropdown state on every follow-up message.
 *                                          Backend compares this against stored filters to
 *                                          detect drift and force a supply refresh.
 * @returns {object} ready-to-POST body
 */
export const buildChatPayload = ({
  conversationId,
  message,
  filters = {},
  enquiryType,
  currentFilters,
}) => {
  const payload = {
    conversation_id: conversationId,
    message,
  };

  if (enquiryType) payload.enquiry_type = enquiryType;

  // Top-level filter fields (first message or explicit overrides)
  if (filters.city)       payload.city       = filters.city;
  if (filters.university) payload.university = filters.university;
  if (filters.budget)     payload.budget     = parseFloat(filters.budget);
  if (filters.roomType)   payload.room_type  = filters.roomType;

  const lease = parseLeaseWeeks(filters.lease);
  if (lease !== undefined) payload.lease = lease;

  const moveIn = parseMoveInDate(filters.moveIn);
  if (moveIn !== undefined) payload.intake = moveIn;

  // current_filters — sent on every request so the backend can detect
  // drift between the frontend dropdown state and the stored DB filters.
  // Uses backend snake_case key names.
  if (currentFilters) {
    const cf = {};
    if (currentFilters.city)       cf.city       = currentFilters.city;
    if (currentFilters.university) cf.university = currentFilters.university;
    if (currentFilters.budget)     cf.budget     = parseFloat(currentFilters.budget);
    if (currentFilters.roomType)   cf.room_type  = currentFilters.roomType;
    const cfLease = parseLeaseWeeks(currentFilters.lease);
    if (cfLease !== undefined)     cf.lease      = cfLease;
    const cfMoveIn = parseMoveInDate(currentFilters.moveIn);
    if (cfMoveIn !== undefined)    cf.intake     = cfMoveIn;
    if (Object.keys(cf).length)    payload.current_filters = cf;
  }

  return payload;
};

// -----------------------------------------------------------------
// 3b. Build the PATCH /conversation/{id}/filters request body
// -----------------------------------------------------------------

/**
 * Maps frontend filter state (camelCase) to backend snake_case PATCH body.
 * Only includes fields that have a non-empty value.
 */
export const buildFiltersPatch = (filters = {}) => {
  const patch = {};
  if (filters.city)       patch.city       = filters.city;
  if (filters.university) patch.university = filters.university;
  if (filters.budget)     patch.budget     = parseFloat(filters.budget);
  if (filters.roomType)   patch.room_type  = filters.roomType;
  const lease = parseLeaseWeeks(filters.lease);
  if (lease !== undefined) patch.lease     = lease;
  const moveIn = parseMoveInDate(filters.moveIn);
  if (moveIn !== undefined) patch.intake   = moveIn;
  return patch;
};

// -----------------------------------------------------------------
// 4. Message object constructors
// -----------------------------------------------------------------

/**
 * Converts the backend reply string into the message object
 * shape expected by Message.jsx.
 */
export const buildAssistantMessage = (replyText) => ({
  role:      "assistant",
  content:   replyText,
  timestamp: Date.now(),
  isImage:   false,
});

/**
 * Builds the optimistic user-side message object added to the UI
 * before the API response arrives.
 */
export const buildUserMessage = (promptText) => ({
  role:      "user",
  content:   promptText,
  timestamp: Date.now(),
  isImage:   false,
});

// -----------------------------------------------------------------
// 5. Backend API wrappers
//    Each function accepts the axios instance from AppContext.
// -----------------------------------------------------------------

export const apiCreateConversation = (axios, filters = {}) =>
  axios.post("/conversation/create", { filters });

export const apiListConversations = (axios) =>
  axios.get("/conversation/list");

export const apiDeleteConversation = (axios, conversationId) =>
  axios.delete(`/conversation/${conversationId}`);

export const apiSendMessage = (axios, payload) =>
  axios.post("/chat/send", payload);

export const apiGetHistory = (axios, conversationId) =>
  axios.get(`/chat/history?conversation_id=${conversationId}`);

export const apiGetFilters = (axios, conversationId) =>
  axios.get(`/conversation/${conversationId}/filters`);

export const apiPatchFilters = (axios, conversationId, patchBody) =>
  axios.patch(`/conversation/${conversationId}/filters`, patchBody);
