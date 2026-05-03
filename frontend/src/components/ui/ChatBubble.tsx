// ChatBubble — message bubble with survivor, staff, and AI variants.

interface ChatBubbleProps {
  content: string;
  sender: 'survivor' | 'staff' | 'ai';
  senderName?: string;
  timestamp?: string;
  className?: string;
}

const senderStyles = {
  survivor: {
    wrapper: 'justify-end',
    bubble: 'bg-teal-500 text-white rounded-2xl rounded-br-md',
    name: 'text-right text-teal-700',
    time: 'text-right text-teal-100',
  },
  staff: {
    wrapper: 'justify-start',
    bubble: 'bg-white border border-gray-200 text-dark rounded-2xl rounded-bl-md',
    name: 'text-left text-gray-700',
    time: 'text-left text-gray-400',
  },
  ai: {
    wrapper: 'justify-start',
    bubble: 'bg-teal-50 text-dark border border-teal-100 rounded-2xl rounded-bl-md',
    name: 'text-left text-teal-700',
    time: 'text-left text-gray-400',
  },
};

export default function ChatBubble({
  content,
  sender,
  senderName,
  timestamp,
  className = '',
}: ChatBubbleProps) {
  const styles = senderStyles[sender];

  return (
    <div className={`flex ${styles.wrapper} ${className}`}>
      <div className="max-w-[80%] space-y-1">
        {senderName && (
          <p className={`text-xs font-medium ${styles.name}`}>{senderName}</p>
        )}
        <div className={`px-3.5 py-2.5 text-sm leading-relaxed ${styles.bubble}`}>
          {content}
        </div>
        {timestamp && (
          <p className={`text-[10px] ${styles.time}`}>{timestamp}</p>
        )}
      </div>
    </div>
  );
}
