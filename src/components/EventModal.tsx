import React, { useState } from 'react';
import { Trash2, X, Calendar, Tag } from 'lucide-react';

import { CustomEvent } from '../App';

interface EventModalProps {
  date: Date;
  onClose: () => void;
  onSave: (event: { title: string; type: CustomEvent['type']; color: string }) => void;
  onDelete: (id: number) => void;
  events: CustomEvent[];
}

const EventModal: React.FC<EventModalProps> = ({ date, onClose, onSave, onDelete, events }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CustomEvent['type']>('exam');
  const [color, setColor] = useState('#ff5252');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onSave({ title, type, color });
    setTitle('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
      <div className="bg-med-card border border-med-border rounded-2xl shadow-2xl w-full max-w-md text-med-text max-h-[90vh] flex flex-col transition-colors duration-300">
        <div className="p-4 border-b border-med-border flex justify-between items-center">
          <h3 className="font-bold text-lg">Événements</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-med-bg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-10">
          {events.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-med-text-muted uppercase">Événements prévus</label>
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-med-bg border border-med-border rounded-xl transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color || 'var(--med-accent)' }} />
                      <div>
                        <div className="text-sm font-bold">{event.title}</div>
                        <div className="text-[10px] text-med-text-muted uppercase">{event.type}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => event.id && onDelete(event.id)}
                      className="p-2 text-med-danger hover:bg-med-danger/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-px bg-med-border" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <h4 className="text-sm font-bold text-med-accent">Ajouter un nouvel événement</h4>
            
            <div className="flex items-center gap-4 bg-med-bg p-3 rounded-lg border border-med-border transition-colors duration-300">
              <Calendar size={18} className="text-med-accent" />
              <span className="text-sm font-medium">{date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="title" className="text-xs font-bold text-med-text-muted uppercase">Titre de l'événement</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Examen de Cardiologie"
                className="w-full bg-med-bg border border-med-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-med-accent text-med-text placeholder-med-text-dim transition-colors duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="type" className="text-xs font-bold text-med-text-muted uppercase">Type</label>
              <div className="relative">
                <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-med-text-muted" />
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as CustomEvent['type'])}
                  className="w-full appearance-none bg-med-bg border border-med-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-med-accent text-med-text transition-colors duration-300"
                >
                  <option value="exam">Examen</option>
                  <option value="revision">Révision</option>
                  <option value="course">Cours</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-med-text-muted uppercase">Couleur</label>
              <div className="flex items-center gap-3">
                {['#ff5252', '#ffab40', '#00e676', '#40c4ff', '#7c4dff'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 ${color === c ? 'border-med-text' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-med-bg border border-med-border hover:border-med-text-muted transition-colors">
                Fermer
              </button>
              <button type="submit" className="px-5 py-2.5 text-sm font-bold rounded-lg bg-med-accent text-med-bg hover:bg-med-accent-dark transition-colors shadow-[0_0_15px_var(--med-accent)]/30">
                Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
