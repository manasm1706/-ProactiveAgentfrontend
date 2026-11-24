import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Bot, Send, X, User, LoaderCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function CustomerChatbot({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `Hello! I can help explain the account activity and engagement analysis available for ${customerId}. What would you like to understand?` },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    setError('');
    try {
      const result = await api.customerChat(customerId, text, next.slice(0, -1));
      setMessages(current => [...current, { role: 'assistant', content: result.reply || 'I could not prepare a response.' }]);
    } catch (err: any) {
      setError(err?.message || 'The assistant is temporarily unavailable.');
    } finally {
      setSending(false);
    }
  };

  return <div className="chat-overlay" role="dialog" aria-modal="true" aria-label="Customer assistant">
    <section className="customer-chat">
      <header className="chat-header">
        <div className="chat-avatar"><Bot size={20}/></div>
        <div className="chat-heading"><strong>Customer Assistant</strong><span>Context-aware · {customerId}</span></div>
        <button className="chat-close" onClick={onClose} aria-label="Close assistant"><X size={19}/></button>
      </header>
      <div className="chat-context"><ShieldCheck size={15}/> Uses this customer's permitted records through MCP tools</div>
      <div className="chat-messages">
        {messages.map((message, index) => <div className={`chat-line ${message.role}`} key={index}>
          <div className="chat-message-icon">{message.role === 'assistant' ? <Bot size={15}/> : <User size={15}/>}</div>
          <div className="chat-bubble">{message.content}</div>
        </div>)}
        {sending && <div className="chat-line assistant"><div className="chat-message-icon"><Bot size={15}/></div><div className="chat-bubble chat-typing"><LoaderCircle size={15} className="spin"/> Checking customer context…</div></div>}
        <div ref={endRef}/>
      </div>
      {error && <div className="chat-error">{error}</div>}
      <div className="chat-suggestions">
        {['Explain my recent account activity', 'What behavioral changes were detected?', 'Why was this action recommended?'].map(item =>
          <button key={item} disabled={sending} onClick={() => setInput(item)}>{item}</button>
        )}
      </div>
      <form className="chat-compose" onSubmit={send}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about this customer's records…" disabled={sending}/>
        <button type="submit" disabled={sending || !input.trim()} aria-label="Send message"><Send size={17}/></button>
      </form>
      <p className="chat-disclaimer">Information is based on available records and is not personalized financial advice.</p>
    </section>
  </div>;
}
