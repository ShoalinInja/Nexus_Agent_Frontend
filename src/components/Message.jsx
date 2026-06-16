import React, { useEffect, useState } from "react";
import moment from "moment";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";
import { Copy, Check } from "lucide-react";

/** Recursively pull plain text out of React children (for copy-to-clipboard). */
const extractText = (node) => {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node.props?.children) return extractText(node.props.children);
  return "";
};

/**
 * Fenced code block with a copy button (top-right). This is what the WhatsApp
 * templates render into, so the agent can one-click copy them.
 */
const CodeBlock = ({ children }) => {
  const [copied, setCopied] = useState(false);
  const text = extractText(children);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="group relative my-2">
      <button
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy"}
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/10 px-2 py-1 text-[11px] text-gray-600 transition hover:text-gray-900 dark:bg-white/10 dark:text-gray-300 dark:hover:text-white"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copy
          </>
        )}
      </button>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-black/5 p-3 pr-20 font-mono text-[13px] leading-6 dark:bg-white/10">
        {children}
      </pre>
    </div>
  );
};

/** Markdown element overrides — ChatGPT-like typography (no `reset-tw`). */
const mdComponents = {
  p: ({ children }) => (
    <p className="my-2 leading-7 first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 text-lg font-semibold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h3>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="break-all text-indigo-500 underline underline-offset-2 hover:text-indigo-400"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-[#80609F]/40 pl-3 text-gray-600 dark:text-[#B1A6C0]">
      {children}
    </blockquote>
  ),
  pre: CodeBlock,
  code: ({ children, className }) => (
    <code className={className ? className : "font-mono text-[13px]"}>
      {children}
    </code>
  ),
};

const Message = ({ message }) => {
  const isUser = message.role === "user";

  useEffect(() => {
    Prism.highlightAll();
  }, [message.content]);

  if (isUser) {
    return (
      <div className="my-3 flex flex-col items-end">
        <div className="max-w-[78%] rounded-3xl bg-[#f0eef5] px-4 py-2.5 dark:bg-[#3a2f4d]">
          <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-gray-900 dark:text-gray-100">
            {message.content}
          </div>
        </div>
        <span className="mr-1 mt-1 text-[10px] text-gray-400 dark:text-[#B1A6C0]">
          {moment(message.timestamp).fromNow()}
        </span>
      </div>
    );
  }

  return (
    <div className="my-3 flex justify-start">
      <div className="w-full max-w-3xl">
        {message.isImage ? (
          <img
            src={message.content}
            className="mt-1 w-full max-w-md rounded-lg"
            alt="generated"
          />
        ) : (
          <div className="text-[15px] text-gray-800 dark:text-gray-100">
            <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {message.content}
            </Markdown>
          </div>
        )}
        <span className="mt-1 block text-[10px] text-gray-400 dark:text-[#B1A6C0]">
          {moment(message.timestamp).fromNow()}
        </span>
      </div>
    </div>
  );
};

export default Message;
