import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { Task, Lead, UserProfile } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Trash2, 
  Plus, 
  Calendar as CalendarIcon, 
  Filter, 
  Search, 
  MoreVertical, 
  Building2,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  CalendarDays,
  User,
  UserPlus
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns';

interface TaskManagerProps {
  tasks: Task[];
  leads: Lead[];
  users: UserProfile[];
  onAdd: (task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'createdByEmail'>) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  initialLeadFilter?: string;
  onClearFilter?: () => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ 
  tasks, 
  leads, 
  users,
  onAdd, 
  onUpdate, 
  onDelete,
  initialLeadFilter = 'all',
  onClearFilter
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLeadId, setNewLeadId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState<UserProfile | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
  const [leadFilter, setLeadFilter] = useState(initialLeadFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Update lead filter if initialLeadFilter changes
  React.useEffect(() => {
    setLeadFilter(initialLeadFilter);
  }, [initialLeadFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newLeadId) return;
    onAdd({
      title: newTitle,
      leadId: newLeadId,
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      status: 'todo',
      assignedToEmail: newAssignedTo?.email || null,
      assignedToUid: newAssignedTo?.uid || null
    });
    setNewTitle('');
    setNewLeadId('');
    setNewDueDate('');
    setNewAssignedTo(null);
    setIsAdding(false);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesLead = leadFilter === 'all' || task.leadId === leadFilter;
    const lead = leads.find(l => l.id === task.leadId);
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         lead?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesLead && matchesSearch;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Circle className="w-5 h-5 text-stone-300" />;
    }
  };

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const leadOptions = useMemo(() => [
    { value: 'all', label: 'All Leads' },
    ...leads.map(l => ({ value: l.id, label: l.name }))
  ], [leads]);

  const userOptions = useMemo(() => 
    users.map(u => ({ value: u.uid, label: u.displayName, email: u.email, user: u })),
  [users]);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Task Tracker</h2>
          <p className="text-stone-500">Manage follow-ups and actions for your leads.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              title="Calendar View"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>
        <div className="flex gap-3 items-center">
          {leadFilter !== 'all' && (
            <button
              onClick={() => {
                setLeadFilter('all');
                onClearFilter?.();
              }}
              className="px-3 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors whitespace-nowrap"
            >
              Clear Filter
            </button>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <Select
            options={leadOptions}
            value={leadOptions.find(o => o.value === leadFilter)}
            onChange={(opt) => setLeadFilter(opt?.value || 'all')}
            styles={selectStyles}
            placeholder="Select Lead..."
          />
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-md animate-in fade-in slide-in-from-top-4 duration-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Task Title</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Associated Lead</label>
                <Select
                  options={leads.map(l => ({ value: l.id, label: l.name }))}
                  value={leads.find(l => l.id === newLeadId) ? { value: newLeadId, label: leads.find(l => l.id === newLeadId)?.name } : null}
                  onChange={(opt) => setNewLeadId(opt?.value || '')}
                  styles={selectStyles}
                  placeholder="Search for a company..."
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Assign To</label>
                <Select
                  options={userOptions}
                  value={newAssignedTo ? { value: newAssignedTo.uid, label: newAssignedTo.displayName } : null}
                  onChange={(opt: any) => setNewAssignedTo(opt ? opt.user : null)}
                  styles={selectStyles}
                  placeholder="Search user..."
                  isClearable
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-20">
              <div className="p-4 bg-stone-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-stone-300" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900">All caught up!</h3>
              <p className="text-stone-500">No tasks found matching your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {sortedTasks.map((task) => {
                const lead = leads.find(l => l.id === task.leadId);
                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
                
                return (
                  <div key={task.id} className={`p-4 hover:bg-stone-50 transition-colors flex items-center gap-4 ${task.status === 'done' ? 'opacity-60' : ''}`}>
                    <button
                      onClick={() => onUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                      className="flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      {getStatusIcon(task.status)}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={`font-medium text-stone-900 truncate ${task.status === 'done' ? 'line-through' : ''}`}>
                          {task.title}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          task.status === 'done' ? 'bg-stone-100 text-stone-500' :
                          task.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {lead?.name || 'Unknown Lead'}
                        </span>
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                          <CalendarIcon className="w-3 h-3" />
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                        {task.createdByEmail && (
                          <span className="flex items-center gap-1 text-stone-400">
                            <User className="w-3 h-3" />
                            {task.createdByEmail}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {assigningTaskId === task.id ? (
                            <div className="w-48">
                              <Select
                                options={userOptions}
                                value={task.assignedToUid ? userOptions.find(o => o.value === task.assignedToUid) : null}
                                onChange={(opt: any) => {
                                  onUpdate(task.id, { 
                                    assignedToEmail: opt ? opt.email : null,
                                    assignedToUid: opt ? opt.value : null
                                  });
                                  setAssigningTaskId(null);
                                }}
                                styles={selectStyles}
                                isClearable
                                placeholder="Assign..."
                                autoFocus
                                onBlur={() => setAssigningTaskId(null)}
                              />
                            </div>
                          ) : (
                            <button 
                              onClick={() => setAssigningTaskId(task.id)}
                              className="flex items-center gap-1 text-stone-400 hover:text-emerald-600 transition-colors group/assign"
                            >
                              <UserPlus className="w-3 h-3 group-hover/assign:scale-110 transition-transform" />
                              {task.assignedToEmail ? (
                                <span className="font-medium text-stone-600">{task.assignedToEmail}</span>
                              ) : (
                                <span className="italic">Unassigned</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.status !== 'done' && (
                        <select
                          value={task.status}
                          onChange={(e) => onUpdate(task.id, { status: e.target.value as any })}
                          className="text-xs bg-stone-100 border-none rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500/20"
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      )}
                      <button
                        onClick={() => onDelete(task.id)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <h3 className="font-bold text-stone-900">{format(currentMonth, 'MMMM yyyy')}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-xs font-bold text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-stone-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest border-r border-stone-100 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr">
            {calendarDays.map((day, idx) => {
              const dayTasks = filteredTasks.filter(t => isSameDay(parseISO(t.dueDate), day));
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div 
                  key={idx} 
                  className={`min-h-[120px] p-2 border-r border-b border-stone-100 last:border-r-0 flex flex-col gap-1 ${!isCurrentMonth ? 'bg-stone-50/30' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold ${
                      isToday ? 'bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center -mt-1 -ml-1 shadow-sm' : 
                      isCurrentMonth ? 'text-stone-900' : 'text-stone-300'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                    {dayTasks.map(task => {
                      const lead = leads.find(l => l.id === task.leadId);
                      return (
                        <div 
                          key={task.id}
                          className={`px-2 py-1 rounded text-[10px] font-medium truncate border ${
                            task.status === 'done' ? 'bg-stone-50 text-stone-400 border-stone-100 line-through' :
                            task.status === 'in-progress' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}
                          title={`${task.title} (${lead?.name})`}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
