import React from 'react';
import { Research } from '../types';
import { ExternalLink, Trash2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResearchTableProps {
  research: Research[];
  onDelete: (id: string) => void;
  onAddManual: () => void;
}

export const ResearchTable: React.FC<ResearchTableProps> = ({ research, onDelete, onAddManual }) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-stone-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-stone-900">Research Results</h2>
        <button
          onClick={onAddManual}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Manual Research
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Platform</th>
              <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Content</th>
              <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Source</th>
              <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {research.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-stone-400 italic">
                  No research data found. Start by researching a lead.
                </td>
              </tr>
            ) : (
              research.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-md uppercase">
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
                        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Link
                      </a>
                    ) : (
                      <span className="text-stone-400 text-sm italic">Manual</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
