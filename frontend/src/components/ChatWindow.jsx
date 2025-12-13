import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const emojiPalette = ['😀', '😁', '😂', '😍', '🤔', '😎', '🙏', '👍', '🎉', '❤️'];

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const buildMessageBubble = (message) => {
  const isBot = Boolean(message.is_from_bot);
  const isOutgoing = isBot || message.sender_type === 'bot';
  return {
    alignment: isOutgoing ? 'justify-end' : 'justify-start',
    bubbleStyle: isOutgoing
      ? 'bg-indigo-600 text-white rounded-t-2xl rounded-l-2xl'
      : 'bg-slate-100 text-slate-900 rounded-t-2xl rounded-r-2xl',
    label: isOutgoing ? 'البوت' : 'العميل',
  };
};

function ChatWindow({
  conversation,
  messages,
  loading,
  sending,
  onSend,
  onTransfer,
}) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [file, setFile] = useState(null);
  const scrollRef = useRef(null);

  const sortedMessages = useMemo(
    () => [...(messages || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [messages],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sortedMessages.length]);

  const handleSend = () => {
    if (!text.trim() && !file) return;
    onSend({ text: text.trim(), file });
    setText('');
    setFile(null);
    setShowEmoji(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{conversation?.contact_name || conversation?.contact_phone}</p>
          <p className="text-xs text-slate-500">{conversation?.status ? `الحالة: ${conversation.status}` : '---'}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">متصل</span>
          <button
            type="button"
            onClick={onTransfer}
            className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:border-amber-200 hover:text-amber-700"
          >
            تحويل للمشغل
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-3">
        {loading && <p className="text-center text-sm text-slate-500">جاري تحميل المحادثة...</p>}
        {!loading && sortedMessages.length === 0 && (
          <div className="text-center text-sm text-slate-500">لا توجد رسائل بعد، ابدأ المحادثة الآن.</div>
        )}

        {sortedMessages.map((message) => {
          const { alignment, bubbleStyle, label } = buildMessageBubble(message);
          return (
            <div key={`${message.id || message.timestamp}`}> 
              <div className={`flex ${alignment}`}>
                <div className="max-w-[75%] space-y-1">
                  <div className={`inline-flex flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm ${bubbleStyle}`}>
                    <div className="flex items-center gap-2 text-[11px] font-semibold opacity-75">
                      <span>{label}</span>
                      <span>•</span>
                      <span>{formatDateTime(message.timestamp)}</span>
                    </div>
                    {message.message_text && <p className="leading-relaxed">{message.message_text}</p>}
                    {message.media_url && message.media_url.match(/\.(jpg|jpeg|png|gif)$/i) && (
                      <img
                        src={message.media_url}
                        alt="media"
                        className="max-h-64 w-full rounded-lg object-cover"
                      />
                    )}
                    {message.media_url && !message.media_url.match(/\.(jpg|jpeg|png|gif)$/i) && (
                      <a
                        href={message.media_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold underline"
                      >
                        ملف مرفق
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <label
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 shadow-sm hover:border-indigo-200 hover:text-indigo-700"
              >
                📎 إرفاق
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file && <span className="text-[11px] text-slate-600">{file.name}</span>}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmoji((prev) => !prev)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 shadow-sm hover:border-indigo-200 hover:text-indigo-700"
              >
                😀
              </button>
              {showEmoji && (
                <div className="absolute bottom-12 right-0 z-10 grid grid-cols-5 gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                  {emojiPalette.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="text-lg"
                      onClick={() => setText((prev) => `${prev}${emoji}`)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا"
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onTransfer}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-300"
            >
              نقل للمشغل
            </button>
            <button
              type="button"
              disabled={sending || (!text.trim() && !file)}
              onClick={handleSend}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {sending ? 'جاري الإرسال...' : 'إرسال'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ChatWindow.propTypes = {
  conversation: PropTypes.object,
  messages: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  sending: PropTypes.bool,
  onSend: PropTypes.func.isRequired,
  onTransfer: PropTypes.func.isRequired,
};

ChatWindow.defaultProps = {
  conversation: null,
  messages: [],
  loading: false,
  sending: false,
};

export default ChatWindow;
