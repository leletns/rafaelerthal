'use client';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '2px',
        background: '#F2F2F7',
        borderRadius: '12px',
        padding: '4px',
        overflowX: 'auto',
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: isActive ? 700 : 500,
              fontFamily: 'inherit',
              color: isActive ? '#1D1D1F' : '#86868B',
              background: isActive ? '#fff' : 'transparent',
              boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
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
