'use client';

import { useState, useEffect } from 'react';
import type { PipelineCard, PipelineStage } from '@/lib/data-model';
import MayraPipeline from '../MayraPipeline';
import { safeStorage, PIPELINE_KEY } from '@/lib/safe-storage';

function generateId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function PipelinePane() {
  const [cards, setCards] = useState<PipelineCard[]>([]);

  useEffect(() => {
    const saved = safeStorage.get<PipelineCard[]>(PIPELINE_KEY, []);
    setCards(saved);
  }, []);

  function saveCards(updated: PipelineCard[]) {
    setCards(updated);
    safeStorage.set(PIPELINE_KEY, updated);
  }

  function handleUpdateCard(card: PipelineCard) {
    const updated = cards.map((c) => (c.id === card.id ? card : c));
    saveCards(updated);
  }

  function handleAddCard(data: Omit<PipelineCard, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newCard: PipelineCard = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    saveCards([...cards, newCard]);
  }

  function handleDeleteCard(id: string) {
    saveCards(cards.filter((c) => c.id !== id));
  }

  return (
    <div>
      <MayraPipeline
        cards={cards}
        onUpdateCard={handleUpdateCard}
        onAddCard={handleAddCard}
        onDeleteCard={handleDeleteCard}
      />
    </div>
  );
}
