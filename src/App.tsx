/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Download,
  Trash2,
  HelpCircle,
  Lightbulb,
  FileText,
  Bookmark,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Star,
  CheckCircle2,
  Library,
  BookMarked
} from 'lucide-react';

interface KeyPoint {
  title: string;
  description: string;
}

interface Question {
  question: string;
  answer: string;
  explanation: string;
}

interface StudyNotes {
  id?: string;
  createdAt?: string;
  title: string;
  summary: string;
  keyPoints: KeyPoint[];
  questions: Question[];
  simplifiedExplanation: string;
  shelf?: 'want-to-study' | 'currently-studying' | 'mastered';
}

const SAMPLE_TOPICS = [
  {
    name: "Photosynthesis & Cellular Respiration",
    text: "Photosynthesis is the process used by plants, algae, and certain bacteria to convert light energy into chemical energy. Through this process, plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar (glucose). The light-dependent reactions take place in the thylakoid membrane, converting solar energy into chemical carriers ATP and NADPH. The Calvin cycle (light-independent reactions) occurs in the stroma, using ATP and NADPH to fix carbon dioxide into G3P (glucose precursor). Conversely, cellular respiration is the metabolic process by which cells break down glucose to release energy in the form of ATP. It occurs in three main stages: glycolysis (in cytoplasm), the Krebs cycle / citric acid cycle (in mitochondrial matrix), and oxidative phosphorylation via the electron transport chain (inner mitochondrial membrane), producing approximately 36 to 38 ATP molecules per glucose molecule."
  },
  {
    name: "Machine Learning: Overfitting & Regularization",
    text: "In machine learning, overfitting occurs when a statistical model or machine learning algorithm captures the noise and random fluctuations in the training data rather than the underlying distribution. As a result, the model performs exceptionally well on training data but generalizes poorly to unseen test or validation data. Causes of overfitting include models that are too complex (high variance), insufficient training data, or excessive training epochs without early stopping. To combat overfitting, several regularization techniques are employed. L1 regularization (Lasso) adds a penalty equal to the absolute value of the magnitude of coefficients, which can drive some coefficients to zero for feature selection. L2 regularization (Ridge) adds a penalty proportional to the square of the coefficient magnitudes, preventing weights from growing too large. Other techniques include dropout in neural networks, cross-validation, data augmentation, and pruning decision trees."
  },
  {
    name: "Macroeconomics: Monetary Policy & Inflation",
    text: "Monetary policy refers to the actions undertaken by a nation's central bank (such as the Federal Reserve) to control the money supply and achieve macroeconomic goals like price stability and maximum employment. Central banks primarily use three tools: open market operations (buying or selling government securities), the discount rate (interest rate charged to commercial banks), and reserve requirements (fraction of deposits banks must hold). Expansionary monetary policy involves lowering interest rates and buying bonds to increase liquidity, stimulate borrowing, and combat economic downturns, though it risks triggering inflation. Contractionary monetary policy involves raising interest rates and selling bonds to reduce money supply and cool down inflation. Inflation is the general increase in prices and fall in the purchasing power of money over time, often measured via the Consumer Price Index (CPI)."
  }
];

export default function App() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<StudyNotes | null>(null);
  const [savedNotes, setSavedNotes] = useState<StudyNotes[]>([]);
  const [activeTab, setActiveTab] = useState<'generator' | 'shelves' | 'community'>('generator');
  const [activeShelfFilter, setActiveShelfFilter] = useState<'all' | 'want-to-study' | 'currently-studying' | 'mastered'>('all');
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({});
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Load saved notes from localStorage on mount with stable ID sanitization & deduplication
  useEffect(() => {
    try {
      const stored = localStorage.getItem('goodreads_studygen_notes');
      if (stored) {
        const parsed: StudyNotes[] = JSON.parse(stored);
        const seenIds = new Set<string>();
        const seenTitles = new Set<string>();
        const sanitized: StudyNotes[] = [];
        
        parsed.forEach((note, index) => {
          const stableId = note.id && note.id.trim() !== '' ? note.id : `note_${index}_${Date.now()}`;
          const titleKey = (note.title || '').trim().toLowerCase();
          
          if (!seenIds.has(stableId) && !seenTitles.has(titleKey)) {
            seenIds.add(stableId);
            seenTitles.add(titleKey);
            sanitized.push({
              ...note,
              id: stableId
            });
          }
        });
        
        setSavedNotes(sanitized);
        localStorage.setItem('goodreads_studygen_notes', JSON.stringify(sanitized));
      }
    } catch (e) {
      console.error('Failed to load study shelves', e);
    }
  }, []);

  const saveToShelf = (currentNotes: StudyNotes, shelf: 'want-to-study' | 'currently-studying' | 'mastered' = 'currently-studying') => {
    const noteId = currentNotes.id || `note_${Date.now()}`;
    const noteWithMeta = {
      ...currentNotes,
      id: noteId,
      createdAt: currentNotes.createdAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      shelf
    };
    
    const existingIndex = savedNotes.findIndex(n => n.id === noteId || n.title.trim().toLowerCase() === currentNotes.title.trim().toLowerCase());
    
    let updated: StudyNotes[];
    if (existingIndex >= 0) {
      updated = [...savedNotes];
      updated[existingIndex] = { ...updated[existingIndex], ...noteWithMeta, id: updated[existingIndex].id };
    } else {
      updated = [noteWithMeta, ...savedNotes];
    }

    setSavedNotes(updated);
    try {
      localStorage.setItem('goodreads_studygen_notes', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to shelf', e);
    }
    alert(`Notebook successfully saved to your "${shelf.replace(/-/g, ' ')}" shelf!`);
  };

  const deleteSavedNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedNotes.filter(n => n.id !== id);
    setSavedNotes(updated);
    try {
      localStorage.setItem('goodreads_studygen_notes', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete notebook', e);
    }
  };

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(1);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (textToUse?: string) => {
    const text = textToUse || inputText;
    if (!text || text.trim().length < 20) {
      setError('Please enter at least 20 characters of study material.');
      return;
    }

    setError(null);
    setLoading(true);
    setNotes(null);
    setShowAnswers({});
    setQuizMode(false);
    setQuizAnswers({});
    setQuizSubmitted(false);

    try {
      const response = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate study notes.');
      }

      setNotes({
        ...data,
        id: `note_${Date.now()}`
      });
      setActiveTab('generator');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while generating notes.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const exportMarkdown = () => {
    if (!notes) return;
    let md = `# ${notes.title}\n\n`;
    md += `## Executive Summary\n${notes.summary}\n\n`;
    md += `## Key Takeaways\n`;
    notes.keyPoints.forEach((kp, idx) => {
      md += `### ${idx + 1}. ${kp.title}\n${kp.description}\n\n`;
    });
    md += `## Practice Questions\n`;
    notes.questions.forEach((q, idx) => {
      md += `**Q${idx + 1}: ${q.question}**\n*Answer:* ${q.answer}\n*Explanation:* ${q.explanation}\n\n`;
    });
    md += `## Simplified Explanation (ELI5)\n${notes.simplifiedExplanation}\n`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notes.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notebook.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredShelves = activeShelfFilter === 'all' 
    ? savedNotes 
    : savedNotes.filter(n => n.shelf === activeShelfFilter);

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#2C221E] flex flex-col font-sans">
      {/* Goodreads Literary Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#382110] text-[#F4F1EA] shadow-md px-6 py-3.5 flex items-center justify-between gap-8 border-b border-[#24150A]">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('generator')}>
          <div className="w-9 h-9 rounded bg-[#7C2D12] flex items-center justify-center text-white shadow-inner font-serif font-bold text-lg">
            S
          </div>
          <div>
            <span className="text-xl font-serif font-bold tracking-tight text-[#FAF8F5] whitespace-nowrap shrink-0">
              StudyGen <span className="text-[#D97706] font-normal">AI</span>
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#E6E2D8]">
          <button
            onClick={() => setActiveTab('generator')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activeTab === 'generator' ? 'text-white font-semibold underline underline-offset-4 decoration-[#D97706]' : ''}`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('shelves')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${activeTab === 'shelves' ? 'text-white font-semibold underline underline-offset-4 decoration-[#D97706]' : ''}`}
          >
            <Library className="w-4 h-4 text-[#D97706]" />
            <span>My Study Shelves</span>
            {savedNotes.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#7C2D12] text-white text-xs rounded">
                {savedNotes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${activeTab === 'community' ? 'text-white font-semibold underline underline-offset-4 decoration-[#D97706]' : ''}`}
          >
            Community Notebooks
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setActiveTab('generator');
              const el = document.getElementById('generator-input-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 text-xs font-serif font-semibold text-white bg-[#7C2D12] hover:bg-[#993A18] rounded transition-all shadow-sm whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Generate Notebook</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {activeTab === 'community' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn font-serif">
            <h1 className="text-3xl font-bold text-[#382110]">Community Study Notebooks</h1>
            <p className="text-sm text-stone-600 font-sans">Explore popular study notes shared by students and readers worldwide.</p>
            
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="bg-[#FAF8F5] p-6 rounded border border-[#E6E2D8] shadow-xs space-y-3">
                <div className="flex items-center gap-1 text-amber-600 text-xs font-sans">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-stone-500 ml-1">(4.9 / 128 ratings)</span>
                </div>
                <h3 className="text-lg font-bold text-[#382110]">Quantum Mechanics: Wavefunctions & Operators</h3>
                <p className="text-xs text-stone-500 font-sans">Curated by Prof. H. Feynman · 8 Key Takeaways · 5 Quiz Qs</p>
                <p className="text-sm text-stone-700 font-sans line-clamp-2">Comprehensive summary of superposition, Schrödinger equation, and Heisenberg's uncertainty principle with simplified physical analogies.</p>
                <button
                  onClick={() => {
                    setInputText("Quantum mechanics is the branch of physics that provides a mathematical description of the dual wave-particle properties of matter and radiation. It includes the Schrödinger equation, wavefunctions, superposition, and Heisenberg's uncertainty principle.");
                    setActiveTab('generator');
                  }}
                  className="text-xs font-sans font-semibold text-[#7C2D12] hover:underline"
                >
                  Study This Notebook →
                </button>
              </div>

              <div className="bg-[#FAF8F5] p-6 rounded border border-[#E6E2D8] shadow-xs space-y-3">
                <div className="flex items-center gap-1 text-amber-600 text-xs font-sans">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5" />
                  <span className="text-stone-500 ml-1">(4.7 / 94 ratings)</span>
                </div>
                <h3 className="text-lg font-bold text-[#382110]">Advanced Organic Chemistry: Reaction Mechanisms</h3>
                <p className="text-xs text-stone-500 font-sans">Curated by Dr. R. Woodward · 10 Key Takeaways · 5 Quiz Qs</p>
                <p className="text-sm text-stone-700 font-sans line-clamp-2">Detailed breakdown of SN1, SN2, E1, and E2 reaction kinetics, nucleophiles, electrophiles, and stereochemical outcomes.</p>
                <button
                  onClick={() => {
                    setInputText("Organic chemistry reaction mechanisms describe the step-by-step sequence of elementary reactions by which overall chemical change occurs. Key mechanisms include nucleophilic substitution (SN1 and SN2) and elimination (E1 and E2) reactions, influenced by solvent polarity, leaving groups, and steric hindrance.");
                    setActiveTab('generator');
                  }}
                  className="text-xs font-sans font-semibold text-[#7C2D12] hover:underline"
                >
                  Study This Notebook →
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shelves' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E2D8] pb-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#382110]">My Study Shelves</h1>
                <p className="text-xs text-stone-600 mt-1 font-sans">Manage your saved study notebooks categorized by learning progress.</p>
              </div>
              {/* Shelf Filter Tabs */}
              <div className="flex items-center gap-2 font-sans text-xs">
                <button
                  onClick={() => setActiveShelfFilter('all')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeShelfFilter === 'all' ? 'bg-[#382110] text-white font-semibold' : 'bg-[#E6E2D8] text-stone-700 hover:bg-stone-300'}`}
                >
                  All ({savedNotes.length})
                </button>
                <button
                  onClick={() => setActiveShelfFilter('want-to-study')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeShelfFilter === 'want-to-study' ? 'bg-[#382110] text-white font-semibold' : 'bg-[#E6E2D8] text-stone-700 hover:bg-stone-300'}`}
                >
                  Want to Study
                </button>
                <button
                  onClick={() => setActiveShelfFilter('currently-studying')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeShelfFilter === 'currently-studying' ? 'bg-[#382110] text-white font-semibold' : 'bg-[#E6E2D8] text-stone-700 hover:bg-stone-300'}`}
                >
                  Currently Studying
                </button>
                <button
                  onClick={() => setActiveShelfFilter('mastered')}
                  className={`px-3 py-1.5 rounded transition-colors ${activeShelfFilter === 'mastered' ? 'bg-[#382110] text-white font-semibold' : 'bg-[#E6E2D8] text-stone-700 hover:bg-stone-300'}`}
                >
                  Mastered
                </button>
              </div>
            </div>

            {filteredShelves.length === 0 ? (
              <div className="text-center py-20 bg-[#FAF8F5] rounded border border-dashed border-[#E6E2D8]">
                <Library className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                <h3 className="text-lg font-serif font-semibold text-stone-800">Your shelf is currently empty</h3>
                <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 font-sans">Generate study notes from any text and save them to your study shelves.</p>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="mt-6 px-4 py-2 bg-[#7C2D12] text-white rounded text-xs font-serif font-semibold hover:bg-[#993A18] transition-colors"
                >
                  Create Study Notes
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShelves.map(note => (
                  <div
                    key={note.id}
                    onClick={() => {
                      setNotes(note);
                      setActiveTab('generator');
                    }}
                    className="bg-[#FAF8F5] p-6 rounded border border-[#E6E2D8] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-2 font-sans">
                        <span className="uppercase tracking-wider font-semibold text-[#7C2D12]">
                          Shelf: {note.shelf ? note.shelf.replace(/-/g, ' ') : 'currently studying'}
                        </span>
                        <button
                          onClick={(e) => deleteSavedNote(note.id!, e)}
                          className="text-stone-400 hover:text-red-700 p-1 transition-colors"
                          title="Remove from shelf"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="text-base font-serif font-bold text-[#382110] group-hover:text-[#7C2D12] transition-colors line-clamp-2">
                        {note.title}
                      </h3>
                      <p className="text-sm text-stone-600 mt-2 font-sans line-clamp-3">
                        {note.summary}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-[#E6E2D8] flex items-center justify-between text-xs font-sans text-stone-500">
                      <span>{note.keyPoints.length} Key Points · {note.questions.length} Quiz Qs</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#7C2D12]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="space-y-12 animate-fadeIn">


            {/* Input Workspace */}
            <div id="generator-input-section" className="bg-[#FAF8F5] p-8 rounded border border-[#E6E2D8] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-serif">
                <div>
                  <h2 className="text-xl font-bold text-[#382110]">Create Study Notebook</h2>
                  <p className="text-sm text-stone-600 font-sans mt-0.5">Paste textbook chapters, research papers, or lecture transcripts below.</p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-3 animate-fadeIn font-sans">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="relative font-sans">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste educational text here (minimum 20 characters)..."
                  rows={8}
                  className="w-full p-4 bg-white border border-[#E6E2D8] rounded text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-1 focus:ring-[#7C2D12] resize-y"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-3 text-xs text-stone-400">
                  <span>{inputText.length} characters</span>
                  {inputText.length > 0 && (
                    <button
                      onClick={() => setInputText('')}
                      className="text-stone-400 hover:text-red-700 font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 font-sans">
                <div className="text-xs text-stone-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#7C2D12]" />
                  <span>AI synthesizes summary, key takeaways, practice quiz, and ELI5 explanation.</span>
                </div>
                <button
                  onClick={() => handleGenerate()}
                  disabled={loading || inputText.trim().length === 0}
                  className="w-full sm:w-auto px-8 py-3 bg-[#7C2D12] text-white font-serif font-bold rounded hover:bg-[#993A18] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Synthesizing Notebook...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-[#D97706]" />
                      <span>Generate Study Notes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Loading Steps */}
              {loading && (
                <div className="p-6 bg-[#F4F1EA] border border-[#E6E2D8] rounded space-y-3 animate-fadeIn font-sans">
                  <div className="flex items-center gap-3 text-stone-900 font-semibold text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#7C2D12]" />
                    <span>Processing literary & technical study material...</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    <div className={`p-3 rounded border flex items-center gap-2 ${loadingStep >= 1 ? 'bg-white border-[#E6E2D8] text-stone-900 font-medium shadow-xs' : 'bg-stone-100 border-transparent text-stone-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${loadingStep >= 1 ? 'bg-[#7C2D12] animate-pulse' : 'bg-stone-300'}`} />
                      <span>1. Analyzing text & structure</span>
                    </div>
                    <div className={`p-3 rounded border flex items-center gap-2 ${loadingStep >= 2 ? 'bg-white border-[#E6E2D8] text-stone-900 font-medium shadow-xs' : 'bg-stone-100 border-transparent text-stone-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${loadingStep >= 2 ? 'bg-[#7C2D12] animate-pulse' : 'bg-stone-300'}`} />
                      <span>2. Extracting key takeaways</span>
                    </div>
                    <div className={`p-3 rounded border flex items-center gap-2 ${loadingStep >= 3 ? 'bg-white border-[#E6E2D8] text-stone-900 font-medium shadow-xs' : 'bg-stone-100 border-transparent text-stone-400'}`} >
                      <div className={`w-2 h-2 rounded-full ${loadingStep >= 3 ? 'bg-[#7C2D12] animate-pulse' : 'bg-stone-300'}`} />
                      <span>3. Formatting practice quiz</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Notes Notebook View */}
            {notes && (
              <div className="space-y-8 animate-fadeIn">
                {/* Notes Header */}
                <div className="bg-[#FAF8F5] p-6 rounded border border-[#E6E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#7C2D12] uppercase tracking-wider mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Study Notebook</span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-[#382110]">{notes.title}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white border border-[#E6E2D8] rounded px-3 py-1.5 text-xs">
                      <span className="text-stone-500">Save to:</span>
                      <button
                        onClick={() => saveToShelf(notes, 'want-to-study')}
                        className="text-[#7C2D12] font-semibold hover:underline px-1"
                      >
                        Want to Study
                      </button>
                      <span>·</span>
                      <button
                        onClick={() => saveToShelf(notes, 'currently-studying')}
                        className="text-[#7C2D12] font-semibold hover:underline px-1"
                      >
                        Studying
                      </button>
                      <span>·</span>
                      <button
                        onClick={() => saveToShelf(notes, 'mastered')}
                        className="text-[#7C2D12] font-semibold hover:underline px-1"
                      >
                        Mastered
                      </button>
                    </div>
                    <button
                      onClick={exportMarkdown}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-[#E6E2D8] rounded text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4 text-[#7C2D12]" />
                      <span>Export</span>
                    </button>
                    <button
                      onClick={() => {
                        const fullText = `# ${notes.title}\n\nSUMMARY:\n${notes.summary}\n\nKEY POINTS:\n` +
                          notes.keyPoints.map(kp => `- ${kp.title}: ${kp.description}`).join('\n') +
                          `\n\nPRACTICE QUESTIONS:\n` +
                          notes.questions.map((q, i) => `Q${i+1}: ${q.question}\nAnswer: ${q.answer}`).join('\n\n');
                        copyToClipboard(fullText, 'all');
                      }}
                      className="px-4 py-1.5 bg-[#7C2D12] hover:bg-[#993A18] text-white rounded text-xs font-serif font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {copiedSection === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedSection === 'all' ? 'Copied!' : 'Copy All'}</span>
                    </button>
                  </div>
                </div>

                {/* Section 1: Executive Summary */}
                <div className="bg-[#FAF8F5] p-8 rounded border border-[#E6E2D8] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-serif font-bold text-[#382110] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#7C2D12]" />
                      <span>Executive Summary</span>
                    </h3>
                    <button
                      onClick={() => copyToClipboard(notes.summary, 'summary')}
                      className="text-xs font-sans font-medium text-stone-500 hover:text-[#7C2D12] flex items-center gap-1 transition-colors"
                    >
                      {copiedSection === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'summary' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-stone-800 font-sans leading-relaxed text-sm">{notes.summary}</p>
                </div>

                {/* Section 2: Key Takeaways */}
                <div className="bg-[#FAF8F5] p-8 rounded border border-[#E6E2D8] shadow-xs space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-serif font-bold text-[#382110] flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#7C2D12]" />
                      <span>Key Takeaways ({notes.keyPoints.length})</span>
                    </h3>
                    <button
                      onClick={() => {
                        const kpText = notes.keyPoints.map((kp, i) => `${i+1}. ${kp.title}: ${kp.description}`).join('\n\n');
                        copyToClipboard(kpText, 'keyPoints');
                      }}
                      className="text-xs font-sans font-medium text-stone-500 hover:text-[#7C2D12] flex items-center gap-1 transition-colors"
                    >
                      {copiedSection === 'keyPoints' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'keyPoints' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 font-sans">
                    {notes.keyPoints.map((kp, idx) => (
                      <div key={idx} className="p-5 bg-white border border-[#E6E2D8] rounded space-y-2 shadow-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded bg-[#F4F1EA] text-[#7C2D12] font-serif font-bold text-xs flex items-center justify-center shrink-0 border border-[#E6E2D8]">
                            {idx + 1}
                          </span>
                          <h4 className="font-serif font-bold text-[#382110] text-sm">{kp.title}</h4>
                        </div>
                        <p className="text-stone-700 text-xs pl-10 leading-relaxed">{kp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Simplified Explanation (ELI5) */}
                <div className="bg-[#382110] text-[#FAF8F5] p-8 rounded shadow-md space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-serif font-bold flex items-center gap-2 text-[#E6E2D8]">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      <span>Simplified Explanation (Literary Analogy)</span>
                    </h3>
                    <button
                      onClick={() => copyToClipboard(notes.simplifiedExplanation, 'eli5')}
                      className="text-xs font-medium text-stone-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedSection === 'eli5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'eli5' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-stone-200 text-sm leading-relaxed">{notes.simplifiedExplanation}</p>
                </div>

                {/* Section 4: Practice Questions & Quiz Mode */}
                <div className="bg-[#FAF8F5] p-8 rounded border border-[#E6E2D8] shadow-xs space-y-6 font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-serif font-bold text-[#382110] flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-[#7C2D12]" />
                      <span>Practice Quiz & Questions ({notes.questions.length})</span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => setQuizMode(!quizMode)}
                        className={`px-3 py-1.5 rounded transition-all font-serif font-semibold ${quizMode ? 'bg-[#7C2D12] text-white shadow-sm' : 'bg-white text-stone-700 border border-[#E6E2D8] hover:bg-stone-100'}`}
                      >
                        {quizMode ? 'Exit Quiz Mode' : '🎮 Interactive Quiz Mode'}
                      </button>
                      <button
                        onClick={() => {
                          const allShown: { [key: number]: boolean } = {};
                          notes.questions.forEach((_, i) => { allShown[i] = true; });
                          setShowAnswers(allShown);
                        }}
                        className="px-3 py-1.5 bg-white border border-[#E6E2D8] hover:bg-stone-100 text-stone-700 rounded transition-colors"
                      >
                        Show All Answers
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {notes.questions.map((q, idx) => (
                      <div key={idx} className="p-6 bg-white border border-[#E6E2D8] rounded space-y-4 shadow-xs">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <span className="w-7 h-7 rounded bg-[#F4F1EA] text-[#7C2D12] font-serif font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#E6E2D8]">
                              Q{idx + 1}
                            </span>
                            <h4 className="font-serif font-bold text-[#382110] text-sm">{q.question}</h4>
                          </div>
                        </div>

                        {quizMode ? (
                          <div className="pl-10 space-y-3">
                            <input
                              type="text"
                              placeholder="Type your answer here..."
                              value={quizAnswers[idx] || ''}
                              onChange={(e) => setQuizAnswers({ ...quizAnswers, [idx]: e.target.value })}
                              className="w-full p-3 bg-white border border-[#E6E2D8] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#7C2D12]"
                            />
                            {quizSubmitted && (
                              <div className="p-3 bg-[#F4F1EA] border border-[#E6E2D8] rounded text-xs space-y-1">
                                <p className="font-serif font-bold text-[#382110]">Correct Answer: {q.answer}</p>
                                <p className="text-stone-700">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="pl-10 space-y-3">
                            <button
                              onClick={() => setShowAnswers({ ...showAnswers, [idx]: !showAnswers[idx] })}
                              className="text-xs font-semibold text-[#7C2D12] hover:underline transition-colors flex items-center gap-1"
                            >
                              <span>{showAnswers[idx] ? 'Hide Answer & Explanation' : 'Show Answer & Explanation'}</span>
                            </button>

                            {showAnswers[idx] && (
                              <div className="p-4 bg-[#F4F1EA] border border-[#E6E2D8] rounded space-y-2 animate-fadeIn shadow-xs">
                                <p className="text-xs font-serif font-bold text-[#382110]">
                                  <span className="text-[#7C2D12] mr-2">Answer:</span> {q.answer}
                                </p>
                                <p className="text-xs text-stone-700">
                                  <span className="font-semibold text-stone-900 mr-2">Explanation:</span> {q.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {quizMode && !quizSubmitted && (
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={() => setQuizSubmitted(true)}
                          className="px-6 py-2.5 bg-[#7C2D12] text-white font-serif font-bold rounded text-xs hover:bg-[#993A18] transition-colors shadow-sm"
                        >
                          Submit Quiz Answers
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Goodreads Literary Footer */}
      <footer className="mt-20 border-t border-[#E6E2D8] bg-[#FAF8F5] py-8 px-6 text-center text-xs text-stone-600 font-sans">
        <p>© 2026 StudyGen AI.</p>
      </footer>
    </div>
  );
}
