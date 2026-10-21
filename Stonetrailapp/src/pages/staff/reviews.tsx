import { useState, useRef, useEffect } from 'react';
import { staff_reviews } from 'virtual:content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Send, RefreshCw, Bot, User, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  // Detect review response blocks in assistant messages
  // Pattern: "**[Name]** (⭐⭐⭐⭐⭐)" or "---" separators
  const renderContent = (content: string) => {
    // Split on horizontal rules to identify review blocks
    const sections = content.split(/\n---+\n/);
    return sections.map((section, i) => (
      <div key={i} className={i > 0 ? 'mt-4 pt-4 border-t border-border/40' : ''}>
        {section.split('\n').map((line, j) => {
          if (!line.trim()) return <br key={j} />;
          // Bold text (reviewer names, headings)
          const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          return (
            <p
              key={j}
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: boldLine }}
            />
          );
        })}
      </div>
    ));
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-accent/20 text-accent border border-accent/30'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm space-y-1 ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border text-foreground rounded-tl-sm'
        }`}
      >
        {renderContent(message.content)}
        <p
          className={`text-[10px] mt-2 ${
            isUser ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StaffReviewsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: staff_reviews.welcomeMessage,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    const assistantId = `assistant-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/reviews-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
        );
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  'Sorry, I encountered an error connecting to the reviews service. Please try again.',
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: staff_reviews.clearedMessage,
        timestamp: new Date(),
      },
    ]);
    setInput('');
  };

  return (
    <>
      <Helmet>
        <title>Review Response Agent — Stone Trail Villas Staff</title>
        <meta name="description" content="Staff-only AI agent for drafting Google review responses for Stone Trail Villas." />
        <link rel="canonical" href="https://stonetrailvillas.com/staff/reviews" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div
        className="min-h-screen flex flex-col"
        style={{ background: 'hsl(var(--background))' }}
      >
        {/* ── Header ── */}
        <header
          className="border-b border-border px-4 py-3 flex items-center justify-between"
          style={{ background: 'hsl(var(--secondary))' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center"
              style={{ background: 'hsl(var(--primary))' }}
            >
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1
                className="text-base font-semibold leading-tight"
                style={{ color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-heading)' }}
              >
                {staff_reviews.agentTitle}
              </h1>
              <p className="text-xs" style={{ color: 'hsl(var(--primary-foreground) / 0.65)' }}>
                {staff_reviews.agentSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs border-primary-foreground/30 text-primary-foreground/70 hidden sm:flex"
            >
              GPT-4o
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">New chat</span>
            </Button>
          </div>
        </header>

        {/* ── Chat area ── */}
        <div className="flex-1 overflow-hidden flex flex-col max-w-3xl w-full mx-auto px-4">
          <ScrollArea className="flex-1 py-6">
            <div className="space-y-5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Typing indicator */}
              {isStreaming && messages[messages.length - 1]?.content === '' && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-accent" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* ── Quick actions ── */}
          {messages.length <= 1 && (
            <div className="pb-3 flex flex-wrap gap-2">
              {staff_reviews.quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isStreaming}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground hover:bg-accent/10 hover:border-accent/40 transition-colors disabled:opacity-50"
                >
                  <MessageSquare className="h-3 w-3 text-accent" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Input ── */}
          <div className="pb-4">
            <form onSubmit={handleSubmit} className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to fetch reviews, draft responses, or give tips…"
                rows={2}
                disabled={isStreaming}
                className="resize-none pr-12 text-sm rounded-xl border-border focus:border-primary/50 bg-card"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isStreaming}
                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
                style={{ background: 'hsl(var(--primary))' }}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
