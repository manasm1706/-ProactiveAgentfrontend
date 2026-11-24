import { useEffect, useState } from 'react';
import { Bell, Search, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function Topbar({ title }: { title: string }) {
  const [ai, setAi] = useState<any>(null);

  useEffect(() => {
    api.aiStatus().then(setAi).catch(() => setAi(null));
  }, []);

  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">PROACTIVE DIGITAL ENGAGEMENT</div>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <div className="ai-pill">
          <span className="pulse" />
          <Sparkles size={15} />
          {ai?.configured ? `Groq · ${ai.model}` : 'Rules fallback'}
        </div>
        <div className="search-mini"><Search size={16} /><span>Search</span><kbd>⌘ K</kbd></div>
        <button className="icon-btn"><Bell size={18} /></button>
        <div className="avatar">YS</div>
      </div>
    </header>
  );
}
