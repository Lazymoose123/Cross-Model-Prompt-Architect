
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ModelTarget, Message, PromptResult } from './types';
import { generatePrompt } from './services/geminiService';
import { SparklesIcon, SendIcon, HistoryIcon, TrashIcon, CopyIcon, CheckIcon } from './components/Icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [targetModel, setTargetModel] = useState<ModelTarget>(ModelTarget.GENERAL);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const historyForApi = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }]
    }));

    try {
      const result = await generatePrompt(inputValue, targetModel, historyForApi);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.isClarificationNeeded 
          ? "I need a bit more information to build the perfect prompt for you:"
          : "I've architected a world-class prompt based on your requirements.",
        result,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error while constructing your prompt. Please check your API configuration or try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your conversation history?")) {
      setMessages([]);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar - History (Desktop) / Drawer (Mobile) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transition-transform duration-300 transform ${showHistory ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:flex md:flex-col shadow-2xl`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-indigo-400" />
            <h1 className="font-bold text-lg tracking-tight">Prompt Architect</h1>
          </div>
          <button 
            onClick={() => setShowHistory(false)}
            className="md:hidden p-1 hover:bg-slate-800 rounded"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Recent Sessions</div>
          {messages.length === 0 ? (
            <div className="text-sm text-slate-600 px-2 italic">No history yet</div>
          ) : (
            messages.filter(m => m.role === 'user').slice(-10).reverse().map(m => (
              <button 
                key={m.id} 
                className="w-full text-left p-3 rounded-lg hover:bg-slate-800 transition-colors text-sm text-slate-400 line-clamp-2 border border-transparent hover:border-slate-700"
                onClick={() => {
                  // In a more complex app, we'd switch sessions here
                }}
              >
                {m.content}
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
           <button 
            onClick={clearHistory}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            Clear History
          </button>
          <div className="text-[10px] text-slate-600 text-center uppercase tracking-widest font-mono pt-2">Powered by Gemini 3 Pro</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-gradient-to-b from-slate-950 to-slate-900">
        {/* Top Navigation */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHistory(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <HistoryIcon />
            </button>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs font-medium text-slate-300">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Architect Online
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase mr-2 hidden sm:block">Engine:</label>
            <select 
              value={targetModel}
              onChange={(e) => setTargetModel(e.target.value as ModelTarget)}
              className="bg-slate-900 border border-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2 outline-none transition-all hover:bg-slate-800"
            >
              <option value={ModelTarget.GENERAL}>General LLM</option>
              <option value={ModelTarget.GPT4}>GPT-4 / OpenAI</option>
              <option value={ModelTarget.CLAUDE}>Claude / Anthropic</option>
              <option value={ModelTarget.GEMINI}>Gemini / Google</option>
            </select>
          </div>
        </header>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
              <div className="p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
                <SparklesIcon className="w-12 h-12 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-3">Welcome to AI Architecture</h2>
                <p className="text-slate-400 leading-relaxed">
                  I am a World-Class Prompt Engineer. Tell me what you want to achieve, 
                  and I will build you a state-of-the-art prompt using the 
                  <span className="text-indigo-400 font-semibold mx-1">PTCF framework</span> 
                  (Persona, Task, Context, Format).
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                {[
                  "Write a viral LinkedIn post about AI",
                  "An expert tutor for quantum physics",
                  "A Python tool for scraping web data",
                  "Summary of complex legal documents"
                ].map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => {
                      setInputValue(suggestion);
                    }}
                    className="p-3 text-sm text-left bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all text-slate-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`max-w-[85%] md:max-w-[75%] ${message.role === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' : 'bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none'} p-4 md:p-6 shadow-xl`}>
                <div className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>

                {message.result && (
                  <div className="mt-6 space-y-6">
                    {/* Clarifying Questions */}
                    {message.result.isClarificationNeeded && message.result.clarifyingQuestions && (
                      <div className="space-y-3">
                        {message.result.clarifyingQuestions.map((q, idx) => (
                          <div key={idx} className="flex gap-3 items-start p-3 bg-slate-950/50 rounded-xl border border-indigo-500/20">
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold">{idx + 1}</span>
                            <span className="text-slate-300 italic">{q}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Optimized Prompt Output */}
                    {!message.result.isClarificationNeeded && message.result.optimizedPrompt && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4" /> Optimized Prompt
                          </h3>
                          <button 
                            onClick={() => handleCopy(message.result!.optimizedPrompt!, message.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
                          >
                            {copiedId === message.id ? (
                              <><CheckIcon className="w-3.5 h-3.5" /> Copied</>
                            ) : (
                              <><CopyIcon className="w-3.5 h-3.5" /> Copy Prompt</>
                            )}
                          </button>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-sm overflow-x-auto text-indigo-50 leading-relaxed shadow-inner border-l-4 border-l-indigo-500">
                          {message.result.optimizedPrompt}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">💡 Why This Works</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">{message.result.logic}</p>
                          </div>
                          <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
                            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">🛠️ Model-Specific Tip</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">{message.result.modelTip}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-xl flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
                <span className="text-sm text-slate-400 font-medium">Architecting prompt...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <form 
            onSubmit={handleSend}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500"></div>
            <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl focus-within:border-indigo-500/50 transition-colors">
              <textarea 
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe your prompt goal (e.g., 'Help me write an email to my boss about a raise')"
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 p-3 resize-none max-h-48 scrollbar-none text-sm md:text-base"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`p-3 rounded-xl transition-all ${
                  !inputValue.trim() || isLoading 
                    ? 'text-slate-600 cursor-not-allowed' 
                    : 'text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                }`}
              >
                <SendIcon />
              </button>
            </div>
            <div className="mt-3 flex justify-center gap-4 text-[11px] text-slate-500 font-medium uppercase tracking-widest">
              <span>Persona Focused</span>
              <span className="text-slate-700">•</span>
              <span>Context Aware</span>
              <span className="text-slate-700">•</span>
              <span>Format Defined</span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;
