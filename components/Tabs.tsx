'use client';

import { useRef } from 'react';

interface Tab {
  id: string;
  label: string;
  highlight?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(e: React.KeyboardEvent) {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    if (e.key === 'ArrowLeft')  next = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home')       next = 0;
    if (e.key === 'End')        next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div
      ref={listRef}
      className="tabs"
      role="tablist"
      aria-label="Seções do painel"
      onKeyDown={onKeyDown}
      style={{ marginBottom: 0 }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`aba-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`painel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`tab${isActive ? ' on' : ''}`}
            style={tab.highlight && !isActive ? { color: 'var(--c-blue)', fontWeight: 600 } : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
