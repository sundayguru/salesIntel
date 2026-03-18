import React from 'react';
import { Lead, Criterion } from '../types';
import { 
  Circle, 
  Clock, 
  CheckCircle2, 
  Send, 
  ChevronRight
} from 'lucide-react';
import { LeadCard } from './LeadCard';

interface PipelineViewProps {
  leads: Lead[];
  criteria: Criterion[];
  onUpdateStatus: (id: string, status: Lead['status']) => void;
  onDeleteLead: (id: string) => void;
  onResearch: (lead: Lead) => void;
  onEvaluate: (lead: Lead) => void;
  onEmail: (lead: Lead) => void;
  onDeck: (lead: Lead) => void;
  onTasks: (lead: Lead) => void;
  onAddCriteria: (lead: Lead) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({ 
  leads, 
  criteria,
  onUpdateStatus, 
  onDeleteLead,
  onResearch,
  onEvaluate,
  onEmail,
  onDeck,
  onTasks,
  onAddCriteria
}) => {
  const stages: { id: Lead['status']; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'new', label: 'New Leads', icon: <Circle className="w-4 h-4" />, color: 'bg-blue-500' },
    { id: 'researching', label: 'Researching', icon: <Clock className="w-4 h-4" />, color: 'bg-amber-500' },
    { id: 'evaluated', label: 'Evaluated', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-emerald-500' },
    { id: 'contacted', label: 'Contacted', icon: <Send className="w-4 h-4" />, color: 'bg-purple-500' },
  ];

  const getLeadsInStage = (stageId: Lead['status']) => {
    return leads.filter(lead => lead.status === stageId);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-900">Sales Pipeline</h2>
        <p className="text-stone-500">Track your leads through the conversion funnel.</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-6">
        <div className="flex gap-6 h-full min-w-max">
          {stages.map((stage) => {
            const stageLeads = getLeadsInStage(stage.id);
            return (
              <div key={stage.id} className="w-96 flex flex-col bg-stone-50 rounded-3xl border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${stage.color} text-white`}>
                      {stage.icon}
                    </div>
                    <h3 className="font-bold text-stone-900">{stage.label}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 rounded-full text-xs font-bold">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {stageLeads.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-2xl text-stone-400">
                      <p className="text-xs font-medium">No leads here</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div key={lead.id} className="relative group/pipeline">
                        <LeadCard
                          lead={lead}
                          criteria={criteria}
                          onDelete={onDeleteLead}
                          onResearch={onResearch}
                          onEvaluate={onEvaluate}
                          onEmail={onEmail}
                          onDeck={onDeck}
                          onTasks={onTasks}
                          onAddCriteria={onAddCriteria}
                        />
                        
                        {/* Status Move Button Overlay */}
                        <div className="absolute top-4 right-12 opacity-0 group-hover/pipeline:opacity-100 transition-opacity">
                          {stages.map((s, idx) => {
                            const currentIdx = stages.findIndex(st => st.id === lead.status);
                            if (idx === currentIdx + 1) {
                              return (
                                <button
                                  key={s.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(lead.id, s.id);
                                  }}
                                  className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                                  title={`Move to ${s.label}`}
                                >
                                  Next Stage
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
