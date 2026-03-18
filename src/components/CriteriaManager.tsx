import React, { useState } from 'react';
import Select from 'react-select';
import { Criterion, Lead, Service } from '../types';
import { Plus, Trash2, Info, Link2, Sparkles, Loader2, Check, CheckCheck, User } from 'lucide-react';

interface CriteriaManagerProps {
  criteria: Criterion[];
  leads: Lead[];
  services: Service[];
  onAdd: (criterion: Omit<Criterion, 'id' | 'userId' | 'createdByEmail'>) => void;
  onDelete: (id: string) => void;
  onSuggest: (lead: Lead | null) => Promise<Omit<Criterion, 'id' | 'userId' | 'createdByEmail'>[]>;
}

export const CriteriaManager: React.FC<CriteriaManagerProps> = ({ 
  criteria, 
  leads, 
  services,
  onAdd, 
  onDelete,
  onSuggest
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState(0.5);
  const [leadId, setLeadId] = useState('');
  
  const [suggestingForLeadId, setSuggestingForLeadId] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Omit<Criterion, 'id' | 'userId' | 'createdByEmail'>[]>([]);

  const handleSuggest = async () => {
    const lead = leads.find(l => l.id === suggestingForLeadId) || null;
    
    setIsSuggesting(true);
    try {
      const newSuggestions = await onSuggest(lead);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Error getting suggestions:", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const acceptSuggestion = (index: number) => {
    const suggestion = suggestions[index];
    onAdd(suggestion);
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const acceptAllSuggestions = () => {
    suggestions.forEach(s => onAdd(s));
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const newCriterion: Omit<Criterion, 'id' | 'userId' | 'createdByEmail'> = { 
      name, 
      description, 
      weight
    };
    if (leadId) {
      newCriterion.leadId = leadId;
    }
    onAdd(newCriterion);
    setName('');
    setDescription('');
    setWeight(0.5);
    setLeadId('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Add Evaluation Criterion</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Market Fit"
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Weight (0-1)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Link to Lead (Optional)</label>
              <Select
                options={[
                  { value: '', label: 'Global (All Leads)' },
                  ...leads.map(l => ({ value: l.id, label: l.name }))
                ]}
                value={leadId ? { value: leadId, label: leads.find(l => l.id === leadId)?.name } : { value: '', label: 'Global (All Leads)' }}
                onChange={(option) => setLeadId(option?.value || '')}
                placeholder="Search for a company..."
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '0.75rem',
                    borderColor: '#e7e5e4',
                    padding: '2px',
                    boxShadow: 'none',
                    '&:hover': {
                      borderColor: '#e7e5e4'
                    }
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? '#f5f5f4' : 'white',
                    color: '#1c1917',
                    '&:active': {
                      backgroundColor: '#e7e5e4'
                    }
                  })
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this criterion measure?"
              className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 h-24"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors ml-auto"
          >
            <Plus className="w-4 h-4" />
            Add Criterion
          </button>
        </form>
      </div>

      {/* AI Suggestions Section */}
      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-stone-900">AI Criteria Suggestions</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Target Lead for Context (Optional)</label>
            <Select
              isClearable
              options={leads.map(l => ({ value: l.id, label: l.name }))}
              value={leads.find(l => l.id === suggestingForLeadId) ? { value: suggestingForLeadId, label: leads.find(l => l.id === suggestingForLeadId)?.name } : null}
              onChange={(option) => setSuggestingForLeadId(option?.value || '')}
              placeholder="Select a lead or leave blank for general criteria..."
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '0.75rem',
                  borderColor: '#d1fae5',
                  padding: '2px',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#10b981' }
                })
              }}
            />
          </div>
          <button
            onClick={handleSuggest}
            disabled={isSuggesting}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
          >
            {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Suggestions
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <p className="text-sm text-emerald-800 font-medium">
                {suggestingForLeadId 
                  ? `Suggested for ${leads.find(l => l.id === suggestingForLeadId)?.name}`
                  : 'General Suggestions based on your Services'}
              </p>
              <button 
                onClick={acceptAllSuggestions}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Accept All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((s, idx) => (
                <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-stone-900">{s.name}</h4>
                      <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                        {Math.round(s.weight * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mb-4">{s.description}</p>
                  </div>
                  <button
                    onClick={() => acceptSuggestion(idx)}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Accept Suggestion
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {criteria.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm relative group">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-stone-900">{c.name}</h3>
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                  {Math.round(c.weight * 100)}%
                </span>
              </div>
              <button
                onClick={() => onDelete(c.id)}
                className="p-2 -mr-2 -mt-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {c.leadId && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3">
                <Link2 className="w-3 h-3" />
                Linked: {leads.find(l => l.id === c.leadId)?.name || 'Unknown Lead'}
              </div>
            )}
            <p className="text-sm text-stone-600 line-clamp-2 mb-2">{c.description}</p>
            {c.createdByEmail && (
              <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium border-t border-stone-100 pt-2">
                <User className="w-2 h-2" />
                {c.createdByEmail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
