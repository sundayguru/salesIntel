import React from 'react';
import { Lead, Evaluation } from '../types';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  leads: Lead[];
  evaluations: Evaluation[];
}

export const Dashboard: React.FC<DashboardProps> = ({ leads, evaluations }) => {
  const avgScore = evaluations.length > 0 
    ? Math.round(evaluations.reduce((acc, curr) => acc + curr.score, 0) / evaluations.length)
    : 0;

  const highProbabilityLeads = evaluations.filter(e => e.score >= 70).length;
  
  const recentEvaluations = [...evaluations].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wider">Avg. Probability</p>
          </div>
          <p className="text-3xl font-bold text-stone-900">{avgScore}%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wider">High Potential</p>
          </div>
          <p className="text-3xl font-bold text-stone-900">{highProbabilityLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wider">Total Evaluated</p>
          </div>
          <p className="text-3xl font-bold text-stone-900">{evaluations.length}</p>
        </div>
      </div>

      {/* Recent Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h2 className="text-lg font-semibold text-stone-900">Recent AI Insights</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {recentEvaluations.length === 0 ? (
              <div className="p-12 text-center text-stone-400 italic">No evaluations yet.</div>
            ) : (
              recentEvaluations.map((evalItem) => {
                const lead = leads.find(l => l.id === evalItem.leadId);
                return (
                  <div key={evalItem.id} className="p-6 hover:bg-stone-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-stone-900">{lead?.name || 'Unknown Lead'}</h3>
                        <p className="text-xs text-stone-500">{new Date(evalItem.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        evalItem.score >= 70 ? 'bg-emerald-50 text-emerald-700' : 
                        evalItem.score >= 40 ? 'bg-amber-50 text-amber-700' : 
                        'bg-red-50 text-red-700'
                      }`}>
                        {evalItem.score}% Match
                      </div>
                    </div>
                    <div className="text-sm text-stone-600 prose prose-sm max-w-none line-clamp-3">
                      <ReactMarkdown>{evalItem.insights}</ReactMarkdown>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-6">Lead Status Breakdown</h2>
          <div className="space-y-4">
            {['new', 'researching', 'evaluated', 'contacted'].map((status) => {
              const count = leads.filter(l => l.status === status).length;
              const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-stone-600">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
