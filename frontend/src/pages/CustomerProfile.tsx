import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Play, ShieldCheck, BrainCircuit, WalletCards, MapPin, Clock, Activity, MessageSquare, Bot } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import Badge from '../components/Badge';
import CustomerChatbot from '../components/CustomerChatbot';

const money = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export default function CustomerProfile({ id, back, onPipeline }: { id: string; back: () => void; onPipeline: (r: any) => void }) {
  const [d, setD] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => { setD(null); api.customer(id).then(setD); }, [id]);

  const activity = useMemo(() => {
    if (!d?.transactions?.length) return [];
    const grouped: Record<string, number> = {};
    d.transactions.forEach((t: any) => {
      const key = String(t.transaction_datetime || '').slice(0, 7);
      if (!key) return;
      grouped[key] = (grouped[key] || 0) + Number(t.amount_inr || 0);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([month, amount]) => ({ month, amount: Math.round(amount) }));
  }, [d]);

  if (!d) return <div className="loading">Loading customer intelligence…</div>;
  const c = d.customer;
  const s = d.signals?.[0];
  const latestDecision = d.decisions?.[0];

  const run = async () => {
    setRunning(true);
    try { onPipeline(await api.pipeline(id)); } finally { setRunning(false); }
  };

  return <div className="page">
    <button className="back" onClick={back}><ArrowLeft size={16}/> Customer Explorer</button>
    <div className="profile-hero card">
      <div className="profile-main"><div className="profile-avatar">{id.slice(-2)}</div><div><div className="profile-id">CUSTOMER RECORD · {c.record_type}</div><h2>{c.customer_id}</h2><div className="meta"><span><MapPin size={14}/>{c.city}</span><span><Clock size={14}/>Preferred hour {c.preferred_contact_hour}:00</span><span><WalletCards size={14}/>{c.customer_segment}</span></div></div></div>
      <div className="profile-actions"><Badge tone={c.marketing_opt_out ? 'red' : 'green'}>{c.marketing_opt_out ? 'Marketing opted out' : 'Marketing eligible'}</Badge><button className="chat-launch-button" onClick={() => setChatOpen(true)}><Bot size={16}/> Talk to Assistant</button><button className="primary" disabled={running} onClick={run}><Play size={16} fill="currentColor"/>{running ? 'Running agents…' : 'Run AI Analysis'}</button></div>
    </div>

    <div className="stat-strip card"><div><small>Monthly income</small><b>₹{money.format(c.monthly_income_inr || 0)}</b></div><div><small>Approx. balance</small><b>₹{money.format(c.approx_account_balance_inr || 0)}</b></div><div><small>Preferred channel</small><b>{c.preferred_channel}</b></div><div><small>App usage</small><b>{c.app_usage_frequency}</b></div><div><small>Latest sensitivity</small><Badge tone={s?.sensitivity_level === 'High' ? 'orange' : 'blue'}>{s?.sensitivity_level || 'Standard'}</Badge></div></div>

    <div className="grid-2">
      <div className="card chart-card"><div className="card-head"><div><h3>Observed transaction activity</h3><p>Actual transaction amounts from this customer's supplied records.</p></div></div>{activity.length ? <div className="chart"><ResponsiveContainer width="100%" height={250}><AreaChart data={activity}><CartesianGrid vertical={false} stroke="#e6eef7"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip formatter={(v:any) => [`₹${money.format(Number(v))}`, 'Amount']}/><Area type="monotone" dataKey="amount" stroke="#2388ed" fill="#dff0ff" strokeWidth={3}/></AreaChart></ResponsiveContainer></div> : <div className="empty-small">No transaction records available.</div>}</div>
      <div className="card signal-focus"><div className="section-label">LATEST BEHAVIORAL SNAPSHOT</div><h3>{s?.detected_signal_summary || 'No descriptive signal supplied'}</h3><div className="change-grid"><div><small>Spending change</small><strong>{s?.spending_change_pct ?? 0}%</strong></div><div><small>Savings change</small><strong>{s?.savings_contribution_change_pct ?? 0}%</strong></div><div><small>App activity</small><strong>{s?.app_login_change_pct ?? 0}%</strong></div><div><small>Unusual withdrawal</small><strong>{s?.unusual_withdrawal_flag ? 'Yes' : 'No'}</strong></div></div><div className="fact"><span>Derived signals</span><b>{(d.derived_signals || []).map((x:any) => x.type).join(' · ')}</b></div><div className="fact"><span>Stored label</span><b>{s?.inferred_life_event || 'None supplied'}</b></div></div>
    </div>

    <div className="grid-2">
      <div className="card"><div className="card-head"><div><h3>Recent transactions</h3><p>Real records loaded for this customer.</p></div><Activity size={18}/></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Type</th><th>Amount</th></tr></thead><tbody>{d.transactions.slice(0,10).map((t:any) => <tr key={t.transaction_id}><td>{String(t.transaction_datetime).slice(0,10)}</td><td>{t.merchant_category}</td><td>{t.transaction_type}</td><td>₹{money.format(t.amount_inr || 0)}</td></tr>)}</tbody></table></div></div>
      <div className="card"><div className="card-head"><div><h3>Engagement history</h3><p>Historical channel and response behavior.</p></div><MessageSquare size={18}/></div><div className="table-wrap"><table><thead><tr><th>Channel</th><th>Action</th><th>Opened</th><th>Converted</th></tr></thead><tbody>{d.engagements.slice(0,10).map((e:any) => <tr key={e.engagement_id}><td>{e.selected_channel}</td><td>{e.recommended_next_best_action}</td><td>{e.opened ? 'Yes' : 'No'}</td><td>{e.converted ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div></div>
    </div>

    <div className="card"><div className="card-head"><div><h3>Latest AI decision</h3><p>Only decisions actually generated by running the pipeline appear here.</p></div></div>{latestDecision ? <div className="decision-summary"><Badge tone={latestDecision.final_status === 'ESCALATED TO HUMAN' ? 'orange' : 'blue'}>{latestDecision.final_status}</Badge><div><b>{latestDecision.action}</b><small>Confidence {Math.round((latestDecision.confidence || 0) * 100)}% · {latestDecision.channel}</small></div></div> : <div className="empty-small">No AI decision has been generated for this customer yet. Click “Run AI Analysis”.</div>}</div>

    <div className="card"><div className="reason-grid"><div><BrainCircuit/><b>Agentic reasoning</b><p>The system takes this customer's own behavioral and engagement context through the multi-stage agent pipeline.</p></div><div><ShieldCheck/><b>Governance before contact</b><p>Consent, opt-out, sensitivity and escalation checks can override a recommendation before any message is eligible.</p></div></div></div>
    {chatOpen && <CustomerChatbot customerId={id} onClose={() => setChatOpen(false)} />}
  </div>;
}
