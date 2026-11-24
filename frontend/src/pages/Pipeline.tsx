import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldAlert, Play, UserSearch, Sparkles } from 'lucide-react';
import Badge from '../components/Badge';
import { api } from '../services/api';

export default function Pipeline({ customerId, onCustomerChange, result, setResult }: { customerId: string | null; onCustomerChange: (id: string) => void; result: any; setResult: (x: any) => void }) {
  const [idInput, setIdInput] = useState(customerId || '');
  const [customer, setCustomer] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIdInput(customerId || '');
    if (customerId) api.customer(customerId).then(setCustomer).catch(() => setCustomer(null));
  }, [customerId]);

  const loadCustomer = async () => {
    setError('');
    try {
      const data = await api.customer(idInput.trim());
      setCustomer(data);
      onCustomerChange(idInput.trim());
      setResult(null);
    } catch {
      setCustomer(null);
      setError('Customer not found. Enter an ID from Customer Explorer.');
    }
  };

  const run = async () => {
    if (!customer) return;
    setRunning(true);
    setError('');
    try { setResult(await api.pipeline(customer.customer.customer_id)); }
    catch (e: any) { setError(e.message || 'Pipeline failed.'); }
    finally { setRunning(false); }
  };

  return <div className="page">
    <div className="page-intro"><div><h2>Agent Pipeline</h2><p>Select any customer from the dataset and run the complete agentic decision flow on that customer's data.</p></div><Badge tone="blue">No predefined scenarios</Badge></div>

    <div className="card pipeline-selector">
      <div className="selector-icon"><UserSearch size={21}/></div>
      <div className="selector-copy"><b>Customer under analysis</b><span>Use Customer Explorer or enter any valid customer ID.</span></div>
      <input value={idInput} onChange={e => setIdInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadCustomer()} placeholder="e.g. CUST00001"/>
      <button className="secondary" onClick={loadCustomer}>Load customer</button>
      <button className="primary" disabled={!customer || running} onClick={run}>{running ? <><Loader2 size={16} className="spin"/> Running agents…</> : <><Play size={16} fill="currentColor"/> Run pipeline</>}</button>
    </div>
    {error && <div className="error-banner">{error}</div>}

    {customer && !result && <div className="card selected-customer"><div><span className="section-label">SELECTED CUSTOMER</span><h3>{customer.customer.customer_id}</h3><p>{customer.customer.city} · {customer.customer.customer_segment} · {customer.customer.preferred_channel}</p></div><div className="selected-signal"><b>{customer.derived_signals?.map((x:any) => x.type).join(' · ')}</b><span>Latest behavioral snapshot</span></div></div>}

    {result ? <PipelineResult result={result}/> : <div className="card pipeline-explainer"><div className="explainer-icon"><Sparkles size={23}/></div><h3>How the agentic flow works</h3><p>Every run starts from the selected customer's real records. No customer ID, signal, outcome or message is pre-programmed for the demonstration.</p><div className="pipeline-steps">{['Signal ingestion','Behavior shift','Need inference · Groq','Next best action','Message generation · Groq','Channel & timing','Suppression & consent','Response tracking','Human escalation','Final orchestration'].map((x,i)=><div key={x}><span>{i+1}</span><b>{x}</b></div>)}</div></div>}
  </div>;
}

function PipelineResult({ result }: { result: any }) {
  const d = result.decision;
  return <div className="pipeline-result">
    <div className="stage-list">
      <div className="card run-meta"><span>AI PROVIDER</span><b>{result.ai_mode}</b><small>{result.customer?.customer_id}</small></div>
      {result.stages.map((s: any, i: number) => <div className="stage card" key={`${s.agent}-${i}`}><div className="stage-num">{i + 1}</div><div className="stage-body"><div className="stage-head"><div><span className="agent-kicker">AGENT {String(i + 1).padStart(2, '0')}</span><h3>{s.agent}</h3></div><Badge tone="green"><CheckCircle2 size={13}/> Completed</Badge></div><div className="stage-output">{s.observed || s.possible_need || s.message || s.action || s.channel || s.reason || s.final_status || s.result || 'Stage completed'}</div>{s.confidence !== undefined && <div className="confidence-line"><span>Confidence</span><div><div style={{ width: `${Math.round(Number(s.confidence) * 100)}%` }}/></div><b>{Math.round(Number(s.confidence) * 100)}%</b></div>}{s.evidence?.length > 0 && <div className="evidence-row">{s.evidence.map((e:string) => <span key={e}>{e}</span>)}</div>}</div></div>)}
    </div>

    <div className="decision-card"><div className="decision-kicker">ORCHESTRATOR · FINAL DECISION</div><h2>{d.final_status}</h2><div className="decision-grid"><div><small>Customer</small><b>{d.customer_id}</b></div><div><small>Confidence</small><b>{Math.round((d.confidence || 0) * 100)}%</b></div><div><small>Priority</small><b>{d.priority}</b></div><div><small>Channel</small><b>{d.channel}</b></div></div><div className="decision-section"><span>Observed</span><p>{d.observed}</p></div><div className="decision-section"><span>Groq / AI interpretation</span><p>{d.possible_interpretation}</p><small className="decision-reason">{d.ai_reason}</small></div><div className="decision-section"><span>Recommended action</span><p>{d.recommended_action}</p></div><div className="decision-section"><span>Governance result</span><p>{d.suppression?.reason}</p></div><div className="decision-section"><span>Generated communication</span><p>{d.message}</p></div>{d.case_id && <div className="case-chip"><ShieldAlert size={16}/> Escalation case created: <b>{d.case_id}</b></div>}</div>
  </div>;
}
