import React, { useState, useEffect } from 'react';
import { Lead, Evaluation } from '../types';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Star, Search, Filter, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  leads: Lead[];
  evaluations: Evaluation[];
  initialLeadFilter?: string;
  onClearFilter?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  leads, 
  evaluations, 
  initialLeadFilter = 'all',
  onClearFilter 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [leadFilter, setLeadFilter] = useState(initialLeadFilter);
  const [scoreFilter, setScoreFilter] = useState('all');

  useEffect(() => {
    if (initialLeadFilter !== 'all') {
      setLeadFilter(initialLeadFilter);
    }
  }, [initialLeadFilter]);

  const filteredEvaluations = evaluations.filter(evalItem => {
    const lead = leads.find(l => l.id === evalItem.leadId);
    const matchesSearch = lead?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         evalItem.insights.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLead = leadFilter === 'all' || evalItem.leadId === leadFilter;
    const matchesScore = scoreFilter === 'all' || 
                        (scoreFilter === 'high' && evalItem.score >= 70) ||
                        (scoreFilter === 'medium' && evalItem.score >= 40 && evalItem.score < 70) ||
                        (scoreFilter === 'low' && evalItem.score < 40);
    
    return matchesSearch && matchesLead && matchesScore;
  });

  const avgScore = filteredEvaluations.length > 0 
    ? Math.round(filteredEvaluations.reduce((acc, curr) => acc + curr.score, 0) / filteredEvaluations.length)
    : 0;

  const highProbabilityLeads = filteredEvaluations.filter(e => e.score >= 70).length;
  
  const recentEvaluations = [...filteredEvaluations].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate average scores per criterion
  const criteriaStats: Record<string, { total: number, count: number }> = {};
  filteredEvaluations.forEach(e => {
    Object.entries(e.criteriaScores).forEach(([name, score]) => {
      if (!criteriaStats[name]) criteriaStats[name] = { total: 0, count: 0 };
      criteriaStats[name].total += score;
      criteriaStats[name].count += 1;
    });
  });

  const sortedCriteria = Object.entries(criteriaStats)
    .map(([name, stats]) => ({ name, avg: Math.round(stats.total / stats.count) }))
    .sort((a, b) => b.avg - a.avg);

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLead = leadFilter === 'all' || l.id === leadFilter;
    return matchesSearch && matchesLead;
  });

  return (
    <div className="space-y-8">
      {/* Filters at the top */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search insights or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <select
                value={leadFilter}
                onChange={(e) => {
                  setLeadFilter(e.target.value);
                  if (e.target.value === 'all' && onClearFilter) onClearFilter();
                }}
                className="pl-10 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
              >
                <option value="all">All Companies</option>
                {leads.filter(l => evaluations.some(e => e.leadId === l.id)).map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name}</option>
                ))}
              </select>
            </div>
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            >
              <option value="all">All Scores</option>
              <option value="high">High Match (70%+)</option>
              <option value="medium">Medium Match (40-69%)</option>
              <option value="low">Low Match (&lt;40%)</option>
            </select>
            {(searchQuery || leadFilter !== 'all' || scoreFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setLeadFilter('all');
                  setScoreFilter('all');
                  if (onClearFilter) onClearFilter();
                }}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <p className="text-3xl font-bold text-stone-900">{filteredEvaluations.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wider">Avg. Confidence</p>
          </div>
          <p className="text-3xl font-bold text-stone-900">
            {filteredEvaluations.length > 0 
              ? Math.round(filteredEvaluations.reduce((acc, curr) => acc + (curr.confidenceScore || 0), 0) / filteredEvaluations.length)
              : 0}%
          </p>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-6">Criteria Performance Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCriteria.length === 0 ? (
            <div className="col-span-full p-8 text-center text-stone-400 italic">No criteria data available yet.</div>
          ) : (
            sortedCriteria.map((c) => (
              <div key={c.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-stone-700">{c.name}</span>
                  <span className="text-stone-500">{c.avg}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      c.avg >= 70 ? 'bg-emerald-500' : 
                      c.avg >= 40 ? 'bg-amber-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${c.avg}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Insights & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-stone-900">AI Insights</h2>
              <span className="text-xs font-medium text-stone-400 uppercase tracking-widest">
                Showing {recentEvaluations.length} results
              </span>
            </div>
            <div className="divide-y divide-stone-100">
              {recentEvaluations.length === 0 ? (
                <div className="p-12 text-center text-stone-400 italic">No evaluations match your filters.</div>
              ) : (
                recentEvaluations.map((evalItem) => {
                  const lead = leads.find(l => l.id === evalItem.leadId);
                  const isAutoSelected = initialLeadFilter === evalItem.leadId;
                  return (
                    <div 
                      key={evalItem.id} 
                      className={`p-6 hover:bg-stone-50 transition-colors ${isAutoSelected ? 'bg-emerald-50/30 border-l-4 border-emerald-500' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <button 
                            onClick={() => setLeadFilter(evalItem.leadId)}
                            className="font-semibold text-stone-900 hover:text-emerald-600 transition-colors text-left"
                          >
                            {lead?.name || 'Unknown Lead'}
                          </button>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-stone-500">{new Date(evalItem.createdAt).toLocaleDateString()}</p>
                            <span className="text-xs text-stone-300">•</span>
                            <p className="text-xs font-medium text-amber-600">Confidence: {evalItem.confidenceScore}%</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          evalItem.score >= 70 ? 'bg-emerald-50 text-emerald-700' : 
                          evalItem.score >= 40 ? 'bg-amber-50 text-amber-700' : 
                          'bg-red-50 text-red-700'
                        }`}>
                          {evalItem.score}% Match
                        </div>
                      </div>
                      <div className="text-sm text-stone-600 prose prose-sm max-w-none">
                        <ReactMarkdown>{evalItem.insights}</ReactMarkdown>
                      </div>
                      {evalItem.criteriaScores && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {Object.entries(evalItem.criteriaScores).map(([name, score]) => (
                            <span key={name} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-medium rounded uppercase">
                              {name}: {score}%
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-6">Lead Status Breakdown</h2>
            <div className="space-y-4">
              {['new', 'researching', 'evaluated', 'contacted'].map((status) => {
                const count = filteredLeads.filter(l => l.status === status).length;
                const percentage = filteredLeads.length > 0 ? (count / filteredLeads.length) * 100 : 0;
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
    </div>
  );
};
