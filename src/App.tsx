import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { LeadCard } from './components/LeadCard';
import { ResearchTable } from './components/ResearchTable';
import { CriteriaManager } from './components/CriteriaManager';
import { ServiceManager } from './components/ServiceManager';
import { Dashboard } from './components/Dashboard';
import { Lead, Research, Criterion, Service, Evaluation } from './types';
import { 
  generateLeadsByIndustry, 
  researchCompanyAI, 
  evaluateLeadAI, 
  generateOutreachEmail, 
  generateSalesDeckAI,
  suggestCriteriaAI
} from './services/gemini';
import { Plus, Search, Loader2, X, Send, FileText, AlertTriangle, Filter, ChevronLeft, ChevronRight, Check, CheckCheck, Sparkles, Building2, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads');
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [suggestedLeads, setSuggestedLeads] = useState<Partial<Lead>[]>([]);

  const [isAddingLead, setIsAddingLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadIndustry, setNewLeadIndustry] = useState('');
  const [newLeadWebsite, setNewLeadWebsite] = useState('');
  
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [leadIndustryFilter, setLeadIndustryFilter] = useState('all');
  const [researchLeadFilter, setResearchLeadFilter] = useState('all');
  const [dashboardLeadFilter, setDashboardLeadFilter] = useState('all');
  const [leadPage, setLeadPage] = useState(1);
  const leadsPerPage = 9;

  const industries = Array.from(new Set(leads.map(l => l.industry).filter(Boolean))) as string[];

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(leadSearchQuery.toLowerCase()) || 
                         (lead.industry?.toLowerCase().includes(leadSearchQuery.toLowerCase()));
    const matchesStatus = leadStatusFilter === 'all' || lead.status === leadStatusFilter;
    const matchesIndustry = leadIndustryFilter === 'all' || lead.industry === leadIndustryFilter;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const paginatedLeads = filteredLeads.slice((leadPage - 1) * leadsPerPage, leadPage * leadsPerPage);

  useEffect(() => {
    setLeadPage(1);
  }, [leadSearchQuery, leadStatusFilter, leadIndustryFilter]);

  const cleanObject = (obj: any) => {
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  };

  const [isGeneratingLeads, setIsGeneratingLeads] = useState(false);
  const [genIndustry, setGenIndustry] = useState('');

  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingManualResearch, setIsAddingManualResearch] = useState(false);
  const [manualResearchContent, setManualResearchContent] = useState('');
  const [manualResearchLeadId, setManualResearchLeadId] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ collection: string; id: string } | null>(null);

  const handleAddManualResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !manualResearchContent || !manualResearchLeadId) return;
    await addDoc(collection(db, 'research'), cleanObject({
      leadId: manualResearchLeadId,
      platform: 'Manual',
      content: manualResearchContent,
      userId: user.uid,
      createdAt: new Date().toISOString()
    }));
    setManualResearchContent('');
    setManualResearchLeadId('');
    setIsAddingManualResearch(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const qLeads = query(collection(db, 'leads'), where('userId', '==', user.uid));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });

    const qResearch = query(collection(db, 'research'), where('userId', '==', user.uid));
    const unsubResearch = onSnapshot(qResearch, (snapshot) => {
      setResearch(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Research)));
    });

    const qCriteria = query(collection(db, 'criteria'), where('userId', '==', user.uid));
    const unsubCriteria = onSnapshot(qCriteria, (snapshot) => {
      setCriteria(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Criterion)));
    });

    const qServices = query(collection(db, 'services'), where('userId', '==', user.uid));
    const unsubServices = onSnapshot(qServices, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });

    const qEvaluations = query(collection(db, 'evaluations'), where('userId', '==', user.uid));
    const unsubEvaluations = onSnapshot(qEvaluations, (snapshot) => {
      setEvaluations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evaluation)));
    });

    return () => {
      unsubLeads();
      unsubResearch();
      unsubCriteria();
      unsubServices();
      unsubEvaluations();
    };
  }, [user]);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newLeadName) return;
    await addDoc(collection(db, 'leads'), cleanObject({
      name: newLeadName,
      industry: newLeadIndustry,
      website: newLeadWebsite,
      status: 'new',
      userId: user.uid,
      createdAt: new Date().toISOString()
    }));
    setNewLeadName('');
    setNewLeadIndustry('');
    setNewLeadWebsite('');
    setIsAddingLead(false);
  };

  const handleGenerateLeads = async () => {
    if (!user || !genIndustry) return;
    setIsGeneratingLeads(true);
    try {
      const generated = await generateLeadsByIndustry(genIndustry);
      setSuggestedLeads(generated);
    } catch (error) {
      console.error("Error generating leads:", error);
    } finally {
      setIsGeneratingLeads(false);
    }
  };

  const handleAcceptLead = async (suggested: Partial<Lead>) => {
    if (!user) return;
    await addDoc(collection(db, 'leads'), cleanObject({
      ...suggested,
      status: 'new',
      userId: user.uid,
      createdAt: new Date().toISOString()
    }));
    setSuggestedLeads(prev => prev.filter(l => l.name !== suggested.name));
  };

  const handleAcceptAllLeads = async () => {
    if (!user) return;
    for (const lead of suggestedLeads) {
      await addDoc(collection(db, 'leads'), cleanObject({
        ...lead,
        status: 'new',
        userId: user.uid,
        createdAt: new Date().toISOString()
      }));
    }
    setSuggestedLeads([]);
    setGenIndustry('');
  };

  const handleResearch = async (lead: Lead) => {
    if (!user) return;
    setIsProcessing(true);
    await updateDoc(doc(db, 'leads', lead.id), { status: 'researching' });
    const leadCriteria = criteria.filter(c => !c.leadId || c.leadId === lead.id);
    const results = await researchCompanyAI(lead.name, leadCriteria);
    for (const res of results) {
      await addDoc(collection(db, 'research'), cleanObject({
        ...res,
        leadId: lead.id,
        userId: user.uid,
        createdAt: new Date().toISOString()
      }));
    }
    setIsProcessing(false);
    setResearchLeadFilter(lead.id);
    setActiveTab('research');
  };

  const handleEvaluate = async (lead: Lead) => {
    if (!user) return;
    const leadResearch = research.filter(r => r.leadId === lead.id);
    if (leadResearch.length === 0) {
      setModalContent({ 
        title: "Research Required", 
        content: "Please research the company first before generating an evaluation." 
      });
      return;
    }
    setIsProcessing(true);
    const leadCriteria = criteria.filter(c => !c.leadId || c.leadId === lead.id);
    const evaluation = await evaluateLeadAI(lead, leadResearch, leadCriteria, services);
    await addDoc(collection(db, 'evaluations'), cleanObject({
      ...evaluation,
      leadId: lead.id,
      userId: user.uid,
      createdAt: new Date().toISOString()
    }));
    await updateDoc(doc(db, 'leads', lead.id), { status: 'evaluated' });
    setIsProcessing(false);
    setDashboardLeadFilter(lead.id);
    setActiveTab('dashboard');
  };

  const handleEmail = async (lead: Lead) => {
    const evaluation = evaluations.find(e => e.leadId === lead.id);
    if (!evaluation) {
      setModalContent({ 
        title: "Evaluation Required", 
        content: "Please evaluate the lead first before generating an outreach email." 
      });
      return;
    }
    setIsProcessing(true);
    const email = await generateOutreachEmail(lead, evaluation, services);
    setModalContent({ title: `Outreach Email for ${lead.name}`, content: email });
    setIsProcessing(false);
  };

  const handleDeck = async (lead: Lead) => {
    const evaluation = evaluations.find(e => e.leadId === lead.id);
    if (!evaluation) {
      setModalContent({ 
        title: "Evaluation Required", 
        content: "Please evaluate the lead first before generating a sales deck." 
      });
      return;
    }
    setIsProcessing(true);
    const deck = await generateSalesDeckAI(lead, evaluation, services);
    setModalContent({ title: `Sales Deck for ${lead.name}`, content: deck });
    setIsProcessing(false);
  };

  const handleDelete = (collectionName: string, id: string) => {
    setDeleteConfirmation({ collection: collectionName, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    await deleteDoc(doc(db, deleteConfirmation.collection, deleteConfirmation.id));
    setDeleteConfirmation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userEmail={user.email}>
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">Company Leads</h2>
              <p className="text-stone-500">Manage and research your target companies.</p>
            </div>
            <button
              onClick={() => setIsAddingLead(true)}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>

          {/* Generate Leads Section */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">AI Lead Generator</h3>
                </div>
                <p className="text-sm text-emerald-700">Provide an industry and let AI find potential leads for you.</p>
              </div>
              <div className="flex w-full md:w-auto gap-2">
                <input
                  type="text"
                  value={genIndustry}
                  onChange={(e) => setGenIndustry(e.target.value)}
                  placeholder="e.g. SaaS, Fintech"
                  className="flex-1 md:w-64 px-4 py-2 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  onClick={handleGenerateLeads}
                  disabled={isGeneratingLeads || !genIndustry}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isGeneratingLeads ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Generate
                </button>
              </div>
            </div>

            {suggestedLeads.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center px-2">
                  <p className="text-sm text-emerald-800 font-medium">
                    Suggested Leads for {genIndustry}
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSuggestedLeads([])}
                      className="text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      Dismiss All
                    </button>
                    <button 
                      onClick={handleAcceptAllLeads}
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Accept All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedLeads.map((s, idx) => (
                    <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-emerald-50 rounded-lg">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-stone-900 text-sm">{s.name}</h4>
                            {s.website && (
                              <div className="flex items-center gap-1 text-[10px] text-stone-500">
                                <Globe className="w-2 h-2" />
                                {s.website.replace(/^https?:\/\//, '')}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-stone-600 mb-4 italic">
                          Potential lead in {s.industry || genIndustry}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAcceptLead(s)}
                        className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Accept Lead
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search leads by name or industry..."
                value={leadSearchQuery}
                onChange={(e) => setLeadSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-sm text-stone-500 whitespace-nowrap">
                <Filter className="w-4 h-4" />
                Filter:
              </div>
              <select
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="researching">Researching</option>
                <option value="evaluated">Evaluated</option>
                <option value="contacted">Contacted</option>
              </select>
              <select
                value={leadIndustryFilter}
                onChange={(e) => setLeadIndustryFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              >
                <option value="all">All Industries</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                criteria={criteria}
                onDelete={(id) => handleDelete('leads', id)}
                onResearch={handleResearch}
                onEvaluate={handleEvaluate}
                onEmail={handleEmail}
                onDeck={handleDeck}
              />
            ))}
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
              <div className="p-4 bg-stone-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-stone-300" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900">No leads found</h3>
              <p className="text-stone-500">Try adjusting your search or filters.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                disabled={leadPage === 1}
                onClick={() => setLeadPage(p => Math.max(1, p - 1))}
                className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLeadPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                      leadPage === i + 1 
                        ? 'bg-stone-900 text-white' 
                        : 'border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={leadPage === totalPages}
                onClick={() => setLeadPage(p => Math.min(totalPages, p + 1))}
                className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

          {isAddingLead && (
            <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Add New Lead</h3>
                  <button onClick={() => setIsAddingLead(false)} className="p-2 hover:bg-stone-100 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddLead} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Company Name</label>
                    <input
                      required
                      type="text"
                      value={newLeadName}
                      onChange={(e) => setNewLeadName(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Industry</label>
                    <input
                      type="text"
                      value={newLeadIndustry}
                      onChange={(e) => setNewLeadIndustry(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Website</label>
                    <input
                      type="url"
                      value={newLeadWebsite}
                      onChange={(e) => setNewLeadWebsite(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 transition-colors">
                    Save Lead
                  </button>
                </form>
              </div>
            </div>
          )}

      {activeTab === 'research' && (
        <div className="space-y-8">
          <ResearchTable 
            research={research} 
            leads={leads}
            leadFilter={researchLeadFilter}
            setLeadFilter={setResearchLeadFilter}
            onDelete={(id) => handleDelete('research', id)}
            onAddManual={() => setIsAddingManualResearch(true)}
          />

          {isAddingManualResearch && (
            <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Add Manual Research</h3>
                  <button onClick={() => setIsAddingManualResearch(false)} className="p-2 hover:bg-stone-100 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddManualResearch} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Select Lead</label>
                    <Select
                      required
                      options={leads.map(lead => ({ value: lead.id, label: lead.name }))}
                      value={leads.find(l => l.id === manualResearchLeadId) ? { value: manualResearchLeadId, label: leads.find(l => l.id === manualResearchLeadId)?.name } : null}
                      onChange={(option) => setManualResearchLeadId(option?.value || '')}
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
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Research Content</label>
                    <textarea
                      required
                      value={manualResearchContent}
                      onChange={(e) => setManualResearchContent(e.target.value)}
                      placeholder="Paste findings from LinkedIn, blogs, etc."
                      className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 h-32"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 transition-colors">
                    Save Research
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <Dashboard 
          leads={leads} 
          evaluations={evaluations} 
          initialLeadFilter={dashboardLeadFilter}
          onClearFilter={() => setDashboardLeadFilter('all')}
        />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Evaluation Criteria</h2>
            <p className="text-stone-500 mb-6">Define how AI should score your leads.</p>
            <CriteriaManager 
              criteria={criteria} 
              leads={leads}
              services={services}
              onAdd={(c) => {
                const data = cleanObject({ ...c, userId: user.uid });
                addDoc(collection(db, 'criteria'), data);
              }}
              onDelete={(id) => handleDelete('criteria', id)}
              onSuggest={(lead) => suggestCriteriaAI(lead, services)}
            />
          </section>
          <section>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Your Services</h2>
            <p className="text-stone-500 mb-6">List the services you offer to help AI personalize outreach.</p>
            <ServiceManager 
              services={services} 
              onAdd={(s) => addDoc(collection(db, 'services'), cleanObject({ ...s, userId: user.uid }))}
              onDelete={(id) => handleDelete('services', id)}
            />
          </section>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-[2px] flex items-center justify-center z-[60]">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="font-semibold text-stone-900">AI is working its magic...</p>
          </div>
        </div>
      )}

      {/* Modal for AI Content */}
      {modalContent && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">{modalContent.title}</h3>
              <button onClick={() => setModalContent(null)} className="p-2 hover:bg-stone-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-auto prose prose-stone max-w-none">
              <ReactMarkdown>{modalContent.content}</ReactMarkdown>
            </div>
            <div className="p-6 border-t border-stone-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(modalContent.content);
                  alert("Copied to clipboard!");
                }}
                className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
              >
                Copy Content
              </button>
              <button 
                onClick={() => setModalContent(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">Are you sure?</h3>
            <p className="text-stone-500 mb-8">
              This action cannot be undone. This item will be permanently removed from your database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 py-3 bg-stone-100 text-stone-700 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
