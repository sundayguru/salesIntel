import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { Research, Lead } from '../types';
import { ExternalLink, Trash2, Plus, Search, Filter, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResearchTableProps {
  research: Research[];
  leads: Lead[];
  leadFilter: string;
  setLeadFilter: (id: string) => void;
  onDelete: (id: string) => void;
  onAddManual: () => void;
}

export const ResearchTable: React.FC<ResearchTableProps> = ({ 
  research, 
  leads, 
  leadFilter,
  setLeadFilter,
  onDelete, 
  onAddManual 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const leadOptions = useMemo(() => [
    { value: 'all', label: 'All Companies' },
    ...leads.map(l => ({ value: l.id, label: l.name }))
  ], [leads]);

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: '0.75rem',
      borderColor: '#e7e5e4',
      padding: '2px',
      minWidth: '200px',
      backgroundColor: '#fafaf9',
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

  const filteredResearch = research.filter(item => {
    const lead = leads.find(l => l.id === item.leadId);
    const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLead = leadFilter === 'all' || item.leadId === leadFilter;
    return matchesSearch && matchesLead;
  });

  const totalPages = Math.ceil(filteredResearch.length / itemsPerPage);
  const paginatedResearch = filteredResearch.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, leadFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search research by content, platform or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-stone-500 whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Company:
          </div>
          <Select
            options={leadOptions}
            value={leadOptions.find(o => o.value === leadFilter)}
            onChange={(opt) => setLeadFilter(opt?.value || 'all')}
            styles={selectStyles}
            placeholder="Select Company..."
          />
          <button
            onClick={onAddManual}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Manual
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Content</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Created By</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedResearch.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-400 italic">
                    No research data found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedResearch.map((item) => {
                  const lead = leads.find(l => l.id === item.leadId);
                  return (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-stone-400" />
                          <span className="text-sm font-medium text-stone-900">{lead?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-stone-100 text-stone-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                          {item.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-sm text-stone-600 line-clamp-3 prose prose-sm max-w-none">
                          <ReactMarkdown>{item.content}</ReactMarkdown>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.sourceUrl ? (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Link
                          </a>
                        ) : (
                          <span className="text-stone-400 text-xs italic">Manual Entry</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500 whitespace-nowrap">
                        {item.createdByEmail || 'System'}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-stone-500">
            Showing <span className="font-medium text-stone-900">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-stone-900">{Math.min(page * itemsPerPage, filteredResearch.length)}</span> of <span className="font-medium text-stone-900">{filteredResearch.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                    page === i + 1 
                      ? 'bg-stone-900 text-white shadow-lg shadow-stone-200' 
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
