import React, { useState } from 'react';
import { Service } from '../types';
import { Plus, Trash2, Briefcase, User } from 'lucide-react';

interface ServiceManagerProps {
  services: Service[];
  onAdd: (service: Omit<Service, 'id' | 'userId' | 'createdByEmail'>) => void;
  onDelete: (id: string) => void;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({ services, onAdd, onDelete }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({ name, description });
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Add Your Service</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Service Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Consulting"
              className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you offer..."
              className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-24"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors ml-auto"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm relative group">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />
                <h3 className="font-semibold text-stone-900">{s.name}</h3>
              </div>
              <button
                onClick={() => onDelete(s.id)}
                className="p-2 -mr-2 -mt-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-stone-600 line-clamp-3 mb-2">{s.description}</p>
            {s.createdByEmail && (
              <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium border-t border-stone-100 pt-2">
                <User className="w-2 h-2" />
                {s.createdByEmail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
