import { useEffect, useState } from 'react';
import { Search, ChevronRight, MapPin, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function Customers({ onSelect }: { onSelect: (id: string) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [risk, setRisk] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '5000' });
      if (q.trim()) params.set('search', q.trim());
      if (risk) params.set('risk', risk);
      setRows(await api.customers('?' + params.toString()));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [risk]);

  return <div className="page">
    <div className="page-intro"><div><h2>Customer Explorer</h2><p>Search any customer from the loaded dataset. Nothing is pre-selected or hard-coded.</p></div><Badge tone="blue">{rows.length} customers</Badge></div>
    <div className="card explorer">
      <div className="toolbar">
        <div className="searchbox"><Search size={17}/><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search customer ID, city, occupation or segment..."/></div>
        <select className="filter-select" value={risk} onChange={e => setRisk(e.target.value)}><option value="">All risk</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select>
        <button className="filter-btn" onClick={load}><RefreshCw size={15} className={loading ? 'spin' : ''}/> Search</button>
      </div>
      <div className="table-wrap"><table className="big-table"><thead><tr><th>Customer</th><th>Segment</th><th>Location</th><th>Preferred channel</th><th>Latest signal</th><th>Risk</th><th/></tr></thead><tbody>
        {rows.map(c => <tr key={c.customer_id} onClick={() => onSelect(c.customer_id)}><td><div className="customer-cell"><div className="mini-avatar">{c.customer_id.slice(-2)}</div><div><b>{c.customer_id}</b><small>{c.age} yrs · {c.occupation}</small></div></div></td><td>{c.customer_segment}</td><td><MapPin size={13}/> {c.city}</td><td>{c.preferred_channel}</td><td className="signal-cell">{c.derived_signals?.map((x:any) => x.type).join(', ')}</td><td><Badge tone={c.risk_level === 'High' ? 'orange' : c.risk_level === 'Medium' ? 'yellow' : 'green'}>{c.risk_level}</Badge></td><td><ChevronRight size={17}/></td></tr>)}
      </tbody></table></div>
    </div>
  </div>;
}
