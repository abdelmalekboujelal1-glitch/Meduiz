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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f2317] border border-[#1a3d25] rounded-2xl shadow-2xl w-full max-w-md text-[#e8f5e9] max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-[#1a3d25] flex justify-between items-center">
          <h3 className="font-bold text-lg">Événements</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#0a1a0f]">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {events.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#6daa80] uppercase">Événements prévus</label>
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-[#0a1a0f] border border-[#1a3d25] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color || '#00e676' }} />
                      <div>
                        <div className="text-sm font-bold">{event.title}</div>
                        <div className="text-[10px] text-[#6daa80] uppercase">{event.type}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => event.id && onDelete(event.id)}
                      className="p-2 text-[#ff5252] hover:bg-[#ff5252]/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-px bg-[#1a3d25]" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <h4 className="text-sm font-bold text-[#00e676]">Ajouter un nouvel événement</h4>
            
            <div className="flex items-center gap-4 bg-[#0a1a0f] p-3 rounded-lg border border-[#1a3d25]">
              <Calendar size={18} className="text-[#00e676]" />
              <span className="text-sm font-medium">{date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="title" className="text-xs font-bold text-[#6daa80] uppercase">Titre de l'événement</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Examen de Cardiologie"
                className="w-full bg-[#0a1a0f] border border-[#1a3d25] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#00e676] text-white placeholder-[#3d6b4d]"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="type" className="text-xs font-bold text-[#6daa80] uppercase">Type</label>
              <div className="relative">
                <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6daa80]" />
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as CustomEvent['type'])}
                  className="w-full appearance-none bg-[#0a1a0f] border border-[#1a3d25] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#00e676] text-white"
                >
                  <option value="exam">Examen</option>
                  <option value="revision">Révision</option>
                  <option value="course">Cours</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#6daa80] uppercase">Couleur</label>
              <div className="flex items-center gap-3">
                {['#ff5252', '#ffab40', '#00e676', '#40c4ff', '#7c4dff'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 ${color === c ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0a1a0f] border border-[#1a3d25] hover:border-[#6daa80] transition-colors">
                Fermer
              </button>
              <button type="submit" className="px-5 py-2.5 text-sm font-bold rounded-lg bg-[#00e676] text-[#0a1a0f] hover:bg-[#00b85e] transition-colors shadow-[0_0_15px_rgba(0,230,118,0.3)]">
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
