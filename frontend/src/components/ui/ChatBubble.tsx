// ChatBubble — message bubble for case messaging.
// Uses semantic chat tokens + Lucide icons for dark/light mode support.

import { type ReactNode } from 'react';
import { Bot } from 'lucide-react';

interface ChatBubbleProps {
  children: ReactNode;
  variant?: 'mine' | 'theirs' | 'ai';
  timestamp?: string;
  senderName?: string;
  className?: string;
}

const variantStyles = {
  mine:   'rounded-br-sm bg-chat-mine text-chat-mine-fg ml-auto',
  theirs: 'rounded-bl-sm bg-chat-theirs text-chat-theirs-fg border border-border',
  ai:     'rounded-bl-sm bg-chat-ai text-chat-ai-fg border border-chat-ai-border',
};

const timeStyles = {
  mine:   'text-chat-mine-fg/60',
  theirs: 'text-muted',
  ai:     'text-muted',
};

export default function ChatBubble({
  children,
  variant = 'theirs',
  timestamp,
  senderName,
  className = '',
}: ChatBubbleProps) {
  return (
    <div className={`flex flex-col ${variant === 'mine' ? 'items-end' : 'items-start'}`}>
      {senderName && variant !== 'mine' && (
        <span className="mb-1 text-[10px] font-medium text-muted px-1">
          {senderName}
          {variant === 'ai' && <Bot className="ml-0.5 inline h-3 w-3 text-primary" />}
        </span>
      )}
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${variantStyles[variant]} ${className}`}>
        {children}
      </div>
      {timestamp && (
        <span className={`mt-0.5 text-[10px] px-1 ${timeStyles[variant]}`}>
          {timestamp}
        </span>
      )}
    </div>
  );
}
