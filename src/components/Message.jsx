import React, { useEffect } from "react";
import { assets } from "../assets/assets";
import moment from "moment";
import Markdown from "react-markdown";
import { Streamdown } from "streamdown";
import Prism from "prismjs";

const Message = ({ message }) => {
  const isUser = message.role === "user";

  useEffect(() => {
    Prism.highlightAll();
  }, [message.content]);

  return (
    <div className={`flex my-1 ${isUser ? "justify-end" : "justify-start"}`}>
      {isUser ? (
        <div className="flex items-start gap-2 max-w-2xl">
          {/* USER MESSAGE */}
          <div className="flex flex-col gap-0.5 py-1 px-3 bg-slate-50 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md">
            {/* 🔥 FIX: remove <p> wrapper */}
            <div className="text-sm leading-tight whitespace-pre-wrap break-words reset-tw">
              <Streamdown>{message.content}</Streamdown>
            </div>

            <span className="text-[10px] text-gray-400 dark:text-[#B1A6C0]">
              {moment(message.timestamp).fromNow()}
            </span>
          </div>

          <img
            src={assets.user_icon}
            className="w-8 h-8 rounded-full object-cover"
            alt="user"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 py-1 px-3 max-w-2xl bg-primary/20 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md">
          {message.isImage ? (
            <img
              src={message.content}
              className="w-full max-w-md mt-1 rounded-md"
              alt="generated"
            />
          ) : (
            <div className="text-sm leading-tight whitespace-pre-wrap break-words reset-tw">
              {/* 🔥 FIX: override markdown spacing */}
              <Markdown
                components={{
                  p: ({ children }) => (
                    <p className="m-0 leading-tight">{children}</p>
                  ),
                }}
              >
                {message.content}
              </Markdown>
            </div>
          )}

          <span className="text-[10px] text-gray-400 dark:text-[#B1A6C0]">
            {moment(message.timestamp).fromNow()}
          </span>
        </div>
      )}
    </div>
  );
};

export default Message;
