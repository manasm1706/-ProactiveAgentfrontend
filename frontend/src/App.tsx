import { useState, type ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Pipeline from './pages/Pipeline';
import Generic from './pages/Generic';

const titles: Record<string, string> = {
  dashboard: 'Executive Dashboard',
  customers: 'Customer Explorer',
  signals: 'Signal Detection',
  behavior: 'Behavior Analysis',
  pipeline: 'Agent Pipeline',
  decision: 'Decision Center',
  actions: 'Next Best Actions',
  message: 'Message Studio',
  channels: 'Channel Optimization',
  suppression: 'Suppression & Consent',
  escalations: 'Escalation Center',
  audit: 'Audit Logs',
  analytics: 'Engagement Analytics',
  learning: 'Channel Learning',
  dataset: 'Dataset',
  ai: 'AI Configuration',
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [customer, setCustomer] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const selectCustomer = (id: string) => {
    setCustomer(id);
    setPage('customers');
  };

  const navigate = (nextPage: string) => {
    setPage(nextPage);
  };

  let content: ReactNode;

  if (customer && page === 'customers') {
    content = (
      <CustomerProfile
        id={customer}
        back={() => setCustomer(null)}
        onPipeline={(pipelineResult) => {
          setResult(pipelineResult);
          setPage('pipeline');
        }}
      />
    );
  } else if (page === 'dashboard') {
    content = <Dashboard onCustomer={selectCustomer} />;
  } else if (page === 'customers') {
    content = <Customers onSelect={selectCustomer} />;
  } else if (page === 'pipeline') {
    content = (
      <Pipeline
        customerId={customer}
        onCustomerChange={setCustomer}
        result={result}
        setResult={setResult}
      />
    );
  } else {
    content = <Generic type={page} customerId={customer} pipelineResult={result} />;
  }

  return (
    <div className="app">
      <Sidebar page={page} setPage={navigate} />
      <main>
        <Topbar title={titles[page] || 'Engagement Intelligence'} />
        {content}
      </main>
    </div>
  );
}
