import { useEffect, useState } from 'react';
import { Users, Activity, UserRoundCheck, Percent, Sparkles, Database, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function Dashboard({ onCustomer }: { onCustomer: (id: string) => void }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.analytics(), api.customers('?limit=8')]).then(([a, c]) => {
      setAnalytics(a);
      setCustomers(c);
    });
  }, []);

  if (!analytics) return <div className="loading">Loading live portfolio intelligence…</div>;

  const signalData = Object.entries(analytics.signal_distribution || {}).map(([name, value]) => ({ name, value }));
  const riskData = Object.entries(analytics.risk_distribution || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="page">
      <div className="welcome">
        <div>
          <h2>Portfolio intelligence <span>✦</span></h2>
          <p>All metrics below are calculated from the loaded customer, signal and engagement records.</p>
        </div>
        <div className="date-chip">LIVE DATA · NO DEMO RECORDS</div>
      </div>

      <div className="kpi-grid">
        <K label="Customers" v={analytics.total_customers} s="Loaded customer records" icon={Users} />
        <K label="Behavioral Signals" v={analytics.active_signals} s="Latest supplied snapshots" icon={Activity} />
        <K label="Engagements" v={analytics.total_engagements} s="Historical engagement records" icon={Database} />
        <K label="Human Escalations" v={analytics.escalations} s="AI decisions requiring review" icon={UserRoundCheck} />
        <K label="Avg. AI Confidence" v={`${analytics.avg_confidence}%`} s="Only after an AI decision is run" icon={Sparkles} />
      </div>

      <div className="grid-2">
        <div className="card chart-card">
          <div className="card-head"><div><h3>Detected behavioral signals</h3><p>Derived directly from the supplied behavioral fields.</p></div></div>
          <div className="chart">
            {signalData.length ? <ResponsiveContainer width="100%" height={270}>
              <BarChart data={signalData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid horizontal={false} stroke="#e6eef7" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2388ed" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer> : <Empty text="No signal records found." />}
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-head"><div><h3>Portfolio risk distribution</h3><p>Risk is derived from the latest behavioral snapshot for each customer.</p></div></div>
          <div className="chart">
            {riskData.length ? <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={3}>
                  {riskData.map((_, index) => <Cell key={index} fill={['#2388ed', '#73b7ef', '#cfe9fb'][index % 3]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer> : <Empty text="No customers found." />}
          </div>
          <div className="legend-row">{riskData.map((x: any) => <span key={x.name}><i />{x.name}: <b>{x.value}</b></span>)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div><h3>Customers ready for analysis</h3><p>Select any loaded customer and run the real agent pipeline.</p></div><Badge tone="blue">{customers.length} shown</Badge></div>
        <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Segment</th><th>Latest signal</th><th>Risk</th><th>Action</th></tr></thead><tbody>
          {customers.map(c => <tr key={c.customer_id} onClick={() => onCustomer(c.customer_id)}>
            <td><b>{c.customer_id}</b><small>{c.city} · {c.occupation}</small></td>
            <td>{c.customer_segment}</td>
            <td>{c.latest_signal?.detected_signal_summary || 'Snapshot available'}</td>
            <td><Badge tone={c.risk_level === 'High' ? 'orange' : c.risk_level === 'Medium' ? 'yellow' : 'green'}>{c.risk_level}</Badge></td>
            <td><button className="text-btn">Open →</button></td>
          </tr>)}
        </tbody></table></div>
      </div>
    </div>
  );
}

function K({ label, v, s, icon: Icon }: any) {
  return <div className="kpi card"><div className="kpi-top"><div className="kpi-icon"><Icon size={19} /></div><span className="trend up"><ArrowUpRight size={12} /></span></div><div className="kpi-value">{v}</div><div className="kpi-label">{label}</div><div className="kpi-sub">{s}</div></div>;
}

function Empty({ text }: { text: string }) { return <div className="empty-small">{text}</div>; }
