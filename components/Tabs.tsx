'use client';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  highlight?: boolean; // blue highlight like Mayra/Comercial in original
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="tabs" style={{ marginBottom: 0 }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`tab${isActive ? ' on' : ''}`}
            style={tab.highlight && !isActive ? { color: '#007AFF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' } : {
              display: tab.icon ? 'inline-flex' : undefined,
              alignItems: tab.icon ? 'center' : undefined,
              gap: tab.icon ? '5px' : undefined,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
