import React, { useState } from 'react';
import Select from 'react-select';
import { Lead, Criterion, UserProfile } from '../types';
import { Building2, Globe, Tag, Trash2, Search, FileText, Mail, Briefcase, CheckCircle2, ChevronDown, ChevronUp, Link2, User, Plus, UserPlus } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  criteria: Criterion[];
  users: UserProfile[];
  onDelete: (id: string) => void;
  onResearch: (lead: Lead) => void;
  onEvaluate: (lead: Lead) => void;
  onEmail: (lead: Lead) => void;
  onDeck: (lead: Lead) => void;
  onTasks: (lead: Lead) => void;
  onAddCriteria: (lead: Lead) => void;
  onAssign: (leadId: string, user: UserProfile | null) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  criteria, 
  users,
  onDelete, 
  onResearch, 
  onEvaluate, 
  onEmail, 
  onDeck, 
  onTasks,
  onAddCriteria,
  onAssign
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const userOptions = users.map(u => ({ value: u.uid, label: u.displayName, email: u.email, user: u }));
  const selectedUserOption = lead.assignedToUid ? userOptions.find(o => o.value === lead.assignedToUid) : null;

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: '0.75rem',
      borderColor: '#e7e5e4',
      fontSize: '0.875rem',
      boxShadow: 'none',
      '&:hover': { borderColor: '#e7e5e4' }
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#f5f5f4' : 'white',
      color: '#1c1917',
      fontSize: '0.875rem',
      '&:active': { backgroundColor: '#e7e5e4' }
    })
  };

  const linkedCriteria = criteria.filter(c => c.leadId === lead.id);
  const globalCriteriaCount = criteria.filter(c => !c.leadId).length;

  const statusColors = {
    new: 'bg-blue-50 text-blue-700 border-blue-100',
    researching: 'bg-amber-50 text-amber-700 border-amber-100',
    evaluated: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    contacted: 'bg-stone-50 text-stone-700 border-stone-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-50 rounded-lg">
            <Building2 className="w-6 h-6 text-stone-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-stone-900">{lead.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[lead.status]}`}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </span>
              {lead.createdByEmail && (
                <span className="flex items-center gap-1 text-[10px] text-stone-400 font-medium">
                  <User className="w-2 h-2" />
                  {lead.createdByEmail}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(lead.id)}
          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-6">
        {lead.industry && (
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Tag className="w-4 h-4" />
            {lead.industry}
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Globe className="w-4 h-4" />
            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 underline underline-offset-2">
              {lead.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}

        <div className="pt-2">
          {isAssigning ? (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Assign Lead To</label>
              <Select
                options={userOptions}
                value={selectedUserOption}
                onChange={(opt) => {
                  onAssign(lead.id, opt ? opt.user : null);
                  setIsAssigning(false);
                }}
                styles={selectStyles}
                isClearable
                placeholder="Search user..."
                autoFocus
                onBlur={() => setIsAssigning(false)}
              />
            </div>
          ) : (
            <button 
              onClick={() => setIsAssigning(true)}
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-600 transition-colors group/assign"
            >
              <UserPlus className="w-4 h-4 text-stone-400 group-hover/assign:text-emerald-600" />
              {lead.assignedToEmail ? (
                <span className="font-medium text-stone-900">{lead.assignedToEmail}</span>
              ) : (
                <span className="text-stone-400 italic">Unassigned</span>
              )}
            </button>
          )}
        </div>
        
        {linkedCriteria.length === 0 && (
          <div className="pt-4">
            <button
              onClick={() => onAddCriteria(lead)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-100 hover:bg-emerald-100 transition-all group/cta"
            >
              <Plus className="w-4 h-4 group-hover/cta:scale-110 transition-transform" />
              Add criteria
            </button>
          </div>
        )}

        <div className="pt-3 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              
              {linkedCriteria.length > 0 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider hover:text-emerald-700 transition-colors"
                >
                  <Link2 className="w-3 h-3" />
                  Specific Criteria: {linkedCriteria.length}
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
              <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                <Globe className="w-3 h-3" />
                Global {linkedCriteria.length === 0 && "Criteria"}: {globalCriteriaCount}
              </div>
            </div>
          </div>

          {isExpanded && linkedCriteria.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {linkedCriteria.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <CheckCircle2 className="w-2 h-2" />
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onResearch(lead)}
          className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          <Search className="w-3 h-3" />
          Research
        </button>
        <button
          onClick={() => onEvaluate(lead)}
          className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <FileText className="w-3 h-3" />
          Evaluate
        </button>
        <button
          onClick={() => onEmail(lead)}
          className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <Mail className="w-3 h-3" />
          Email
        </button>
        <button
          onClick={() => onDeck(lead)}
          className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <Briefcase className="w-3 h-3" />
          Deck
        </button>
        <button
          onClick={() => onTasks(lead)}
          className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <CheckCircle2 className="w-3 h-3" />
          Tasks
        </button>
      </div>
    </div>
  );
};
