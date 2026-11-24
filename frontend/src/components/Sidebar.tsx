import {LayoutDashboard,Users,Activity,BrainCircuit,Target,MessageSquare,Radio,ShieldCheck,UserRoundCheck,FileClock,BarChart3,Database,Settings,ChevronRight,Network} from 'lucide-react';

const groups = [
  ['Overview', [['Dashboard', 'dashboard', LayoutDashboard]]],
  ['Intelligence', [['Customer Explorer', 'customers', Users], ['Signal Detection', 'signals', Activity], ['Behavior Analysis', 'behavior', BrainCircuit]]],
  ['AI Agents', [['Agent Pipeline', 'pipeline', Network], ['Decision Center', 'decision', Target]]],
  ['Engagement', [['Next Best Actions', 'actions', Target], ['Message Studio', 'message', MessageSquare], ['Channel Optimization', 'channels', Radio]]],
  ['Governance', [['Suppression & Consent', 'suppression', ShieldCheck], ['Escalations', 'escalations', UserRoundCheck], ['Audit Logs', 'audit', FileClock]]],
  ['Analytics', [['Engagement Analytics', 'analytics', BarChart3], ['Channel Learning', 'learning', Radio]]],
  ['Settings', [['Dataset', 'dataset', Database], ['AI Configuration', 'ai', Settings]]],
];

export default function Sidebar({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">✦</div>
        <div><b>EngageAI</b><span>Financial Intelligence</span></div>
      </div>
      <div className="nav">
        {groups.map(([group, items]: any) => (
          <div className="nav-group" key={group}>
            <label>{group}</label>
            {items.map(([name, key, Icon]: any) => (
              <button className={page === key ? 'active' : ''} onClick={() => setPage(key)} key={key}>
                <Icon size={17} />
                <span>{name}</span>
                {page === key && <ChevronRight size={14} className="nav-arrow" />}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="sidebar-footer"><div className="demo-dot" /><span>Live dataset · local environment</span></div>
    </aside>
  );
}
