import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, TrendingUp, PiggyBank, Shield } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { aiService } from '../services/aiService';

const SUGGESTIONS = [
  { icon: TrendingUp, label: 'How can I reduce my spending?' },
  { icon: PiggyBank, label: 'Help me create a savings plan' },
  { icon: Shield, label: 'How healthy are my finances?' },
  { icon: Sparkles, label: 'Analyze my spending patterns' },
];

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--color-primary-light)' }}
      >
        <Bot size={16} style={{ color: 'var(--color-primary)' }} />
      </div>
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-2 h-2 rounded-full"
              style={{
                backgroundColor: 'var(--text-muted)',
                animation: `typingBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3"
          style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--color-primary-light)' }}
      >
        <Bot size={16} style={{ color: 'var(--color-primary)' }} />
      </div>
      <div
        className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
          {message.content}
        </p>
      </div>
    </div>
  );
}

export default function AIAdvisor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = await aiService.chat(trimmed);
      const reply = res.data?.response || res.data?.message || res.data?.reply || 'I appreciate the question. Let me analyze your financial data and get back to you with more details.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Sorry, I could not process your request right now. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
      setError(null);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="max-w-7xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          AI Financial Advisor
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Get personalized financial advice powered by AI
        </p>
      </div>

      {/* Chat area */}
      <div
        className="flex-1 rounded-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!hasMessages && (
            <div className="flex flex-col items-center justify-center h-full">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                <Bot size={28} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                How can I help you today?
              </h3>
              <p className="text-sm mb-6 text-center max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                Ask me anything about your finances. I can analyze your spending, suggest savings strategies, and more.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.label)}
                    className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all duration-150"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                    }}
                  >
                    <s.icon size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <span className="text-sm">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}

          {loading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="flex-shrink-0 p-3"
          style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        >
          {error && (
            <p className="text-xs mb-2 px-1" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances..."
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                maxHeight: '120px',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 flex-shrink-0 disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
            >
              {loading ? <LoadingSpinner size="sm" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
