import React, { useState } from 'react';
import { SavedAsset, Lead } from '../types';
import { Mail, FileText, Trash2, Copy, Check, Search, Filter, Calendar, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SavedAssetsProps {
  assets: SavedAsset[];
  leads: Lead[];
  onDelete: (id: string) => void;
}

export const SavedAssets: React.FC<SavedAssetsProps> = ({ assets, leads, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'email' | 'deck'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAssets = assets.filter(asset => {
    const lead = leads.find(l => l.id === asset.leadId);
    const matchesSearch = lead?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         asset.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Saved Assets</h2>
          <p className="text-stone-500">Access your saved outreach emails and sales decks.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by company or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-stone-500 whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Type:
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
          >
            <option value="all">All Assets</option>
            <option value="email">Emails</option>
            <option value="deck">Sales Decks</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedAssets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
            <div className="p-4 bg-stone-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900">No assets found</h3>
            <p className="text-stone-500">Save some generated emails or decks to see them here.</p>
          </div>
        ) : (
          sortedAssets.map((asset) => {
            const lead = leads.find(l => l.id === asset.leadId);
            return (
              <div key={asset.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${asset.type === 'email' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {asset.type === 'email' ? <Mail className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900">{lead?.name || 'Unknown Lead'}</h3>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(asset.createdAt).toLocaleDateString()}
                        <span className="text-stone-300">•</span>
                        <span className="capitalize font-medium">{asset.type}</span>
                        {asset.createdByEmail && (
                          <>
                            <span className="text-stone-300">•</span>
                            <div className="flex items-center gap-1 text-stone-400">
                              <User className="w-3 h-3" />
                              {asset.createdByEmail}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(asset.id, asset.content)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        copiedId === asset.id 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title="Copy to clipboard"
                    >
                      {copiedId === asset.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => onDelete(asset.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-8 max-h-96 overflow-auto prose prose-stone max-w-none bg-white">
                  <ReactMarkdown>{asset.content}</ReactMarkdown>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
