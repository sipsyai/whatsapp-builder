import React, { useState, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
  Connection,
  Edge,
  Node,
  NodeProps,
  useReactFlow,
} from "reactflow";

// --- Types ---
type ViewState = "landing" | "builder";
type NodeDataType = "start" | "message" | "question" | "condition";

interface NodeData {
  label: string;
  type?: NodeDataType; // Keep track of logical type inside data
  content?: string;
  variable?: string;
  options?: string[];
  conditionVar?: string;
  conditionOp?: string;
  conditionVal?: string;
  messageType?: string;
  questionType?: "text" | "buttons" | "list";
  
  // Advanced Question Fields
  headerText?: string;
  footerText?: string;
  mediaHeader?: boolean;
  buttons?: string[]; 
  listButtonText?: string;
  listSections?: {
    id: string;
    title: string;
    rows: { id: string; title: string; description: string }[];
  }[];
  
  // Method to trigger config modal from within node component
  onConfig?: () => void;
}

// --- Custom React Flow Nodes ---

const StartNode = ({ data }: NodeProps<NodeData>) => {
  return (
    <div className="bg-background-light dark:bg-background-dark rounded-xl shadow-lg border border-zinc-200 dark:border-[#23482f] w-64">
      <div className="flex items-center gap-3 p-4">
        <div className="bg-primary text-[#112217] flex items-center justify-center rounded-lg shrink-0 size-10">
          <span className="material-symbols-outlined">flag</span>
        </div>
        <div>
          <p className="font-bold text-zinc-900 dark:text-white">Start Flow</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400">Entry point</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />
    </div>
  );
};

const MessageNode = ({ data }: NodeProps<NodeData>) => {
  return (
    <div className="bg-background-light dark:bg-background-dark rounded-xl shadow-lg border border-zinc-200 dark:border-[#23482f] w-64 group hover:ring-2 hover:ring-primary transition-all">
      <Handle type="target" position={Position.Left} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />
      <div className="flex items-start gap-3 p-4">
        <div className="bg-blue-500 text-white flex items-center justify-center rounded-lg shrink-0 size-10">
          <span className="material-symbols-outlined">chat</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="font-bold text-zinc-900 dark:text-white truncate">{data.label}</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400 truncate">{data.content || "Click to configure"}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); data.onConfig?.(); }} className="text-zinc-400 hover:text-white">
          <span className="material-symbols-outlined text-lg">settings</span>
        </button>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />
    </div>
  );
};

const QuestionNode = ({ data }: NodeProps<NodeData>) => {
  const isButtons = data.questionType === 'buttons';
  const isList = data.questionType === 'list';
  const isBranching = isButtons || isList;

  // Flatten outputs for rendering handles
  let outputs: {id: string, label: string}[] = [];
  if (isButtons && data.buttons) {
    outputs = data.buttons.map((b, i) => ({ id: `btn-${i}`, label: b }));
  } else if (isList && data.listSections) {
    outputs = data.listSections.flatMap(s => s.rows.map(r => ({ id: r.id, label: r.title })));
  }

  // Buttons Specific Style
  if (isButtons) {
    return (
      <div className="bg-[#0D1F12] rounded-2xl border-2 border-[#13ec5b] shadow-lg flex flex-col min-w-[280px]">
        <Handle type="target" position={Position.Left} className="!bg-[#4b5563] !border-[#0D1F12] hover:!bg-[#13ec5b]" style={{ top: 40 }} />
        
        <div className="flex items-start gap-3 p-4">
          <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-inner text-white shrink-0">
            <span className="material-symbols-outlined text-2xl">help</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="text-white text-lg font-bold leading-tight truncate">Buttons</h3>
            <p className="text-[#9CA3AF] text-xs font-medium truncate">Click to configure</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); data.onConfig?.(); }} className="text-gray-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        <div className="h-px bg-white/10 w-full"></div>

        <div className="flex flex-col py-4 gap-3 w-full relative">
          {outputs.map((opt, i) => (
            <div key={opt.id} className="relative flex items-center justify-end h-6 pr-4">
              <span className="text-sm font-medium text-white mr-2 truncate max-w-[180px]">{opt.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={opt.label} // Using label as ID for simplicity in this demo, usually use unique ID
                className="!bg-[#4b5563] !border-[#0D1F12] hover:!bg-[#13ec5b]"
                style={{ top: 'auto', right: -7, transform: 'none', position: 'absolute' }} 
              />
            </div>
          ))}
          {/* Default Handle */}
          <div className="relative flex items-center justify-end h-6 pr-4 mt-2 border-t border-white/5 pt-2">
              <span className="text-sm font-medium text-gray-400 mr-2">Default</span>
              <Handle
                type="source"
                position={Position.Right}
                id="default"
                className="!bg-[#4b5563] !border-[#0D1F12] hover:!bg-[#13ec5b]"
                style={{ top: 'auto', right: -7, transform: 'none', position: 'absolute' }} 
              />
          </div>
        </div>
      </div>
    );
  }

  // Standard/List Style
  return (
    <div className={`bg-background-light dark:bg-background-dark rounded-xl shadow-lg border border-zinc-200 dark:border-[#23482f] group hover:ring-2 hover:ring-primary transition-all flex flex-col ${isBranching ? 'min-w-[280px]' : 'w-64'}`}>
      <Handle type="target" position={Position.Left} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />
      
      <div className="flex items-start gap-3 p-4">
        <div className="bg-orange-500 text-white flex items-center justify-center rounded-lg shrink-0 size-10">
          <span className="material-symbols-outlined">help</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="font-bold text-zinc-900 dark:text-white truncate">{data.label}</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400 truncate">{data.content || "Click to configure"}</p>
          {data.variable && (
            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded mt-1 inline-block">
              @{data.variable}
            </span>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); data.onConfig?.(); }} className="text-zinc-400 hover:text-white">
          <span className="material-symbols-outlined text-lg">settings</span>
        </button>
      </div>

      {isList && (
        <div className="flex flex-col pb-4 w-full">
           <div className="h-px bg-zinc-200 dark:bg-[#23482f] w-full mb-2"></div>
           {outputs.map((opt) => (
             <div key={opt.id} className="relative flex items-center justify-end h-8 pr-0 group/row">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mr-3 truncate max-w-[180px] group-hover/row:text-primary transition-colors">{opt.label}</span>
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id={opt.label} 
                  className="!bg-white dark:!bg-zinc-500 !border-zinc-400 hover:!bg-primary"
                  style={{ top: 'auto', right: -6, transform: 'none', position: 'absolute' }}
                />
             </div>
           ))}
           {/* Default */}
           <div className="relative flex items-center justify-end h-8 pr-0 group/row mt-1 border-t border-zinc-200 dark:border-[#23482f] pt-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-3">Default</span>
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id="default" 
                  className="!bg-white dark:!bg-zinc-500 !border-zinc-400 hover:!bg-primary"
                  style={{ top: 'auto', right: -6, transform: 'none', position: 'absolute' }}
                />
           </div>
        </div>
      )}

      {/* Standard Text Question Output */}
      {!isBranching && (
        <Handle type="source" position={Position.Right} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />
      )}
    </div>
  );
};

const ConditionNode = ({ data }: NodeProps<NodeData>) => {
  return (
    <div className="bg-background-light dark:bg-background-dark rounded-xl shadow-lg border border-zinc-200 dark:border-[#23482f] w-64 group hover:ring-2 hover:ring-primary transition-all">
      <Handle type="target" position={Position.Left} className="!bg-white dark:!bg-zinc-500 !border-zinc-400" />
      <div className="flex items-start gap-3 p-4">
        <div className="bg-purple-500 text-white flex items-center justify-center rounded-lg shrink-0 size-10">
          <span className="material-symbols-outlined">call_split</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="font-bold text-zinc-900 dark:text-white truncate">{data.label}</p>
          <p className="text-xs text-zinc-500 dark:text-gray-400 truncate">
             {data.conditionVar ? `${data.conditionVar} ${data.conditionOp} ${data.conditionVal}` : "Click to configure"}
          </p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); data.onConfig?.(); }} className="text-zinc-400 hover:text-white">
          <span className="material-symbols-outlined text-lg">settings</span>
        </button>
      </div>
      
      {/* True Path */}
      <div className="relative h-8 flex items-center justify-end pr-4">
         <span className="text-xs text-green-500 font-bold mr-2">True</span>
         <Handle type="source" position={Position.Right} id="true" className="!bg-green-500 !border-green-600" style={{top: '50%'}} />
      </div>

      {/* False Path */}
      <div className="relative h-8 flex items-center justify-end pr-4 mb-2">
         <span className="text-xs text-red-500 font-bold mr-2">False</span>
         <Handle type="source" position={Position.Right} id="false" className="!bg-red-500 !border-red-600" style={{top: '50%'}} />
      </div>
    </div>
  );
};

const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  question: QuestionNode,
  condition: ConditionNode,
};

// --- Components ---

const LandingPage = ({ onStart }: { onStart: () => void }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      <div className="flex flex-1 h-full">
        <aside className="hidden lg:flex w-64 flex-col bg-[#112217] p-4 border-r border-white/10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB32tnVF4JPu-3hPli9p8pS_7UZC0gFE0AhAcPwETfOGuY2A-glAcSiHkKL3W8ulDxNKsHSXpReQISALGyrbr0S23cvUYZvG0sNfGehJiresV5qzvWy8DpM4vvPK5bp8U4RopEPhxtDS1MogXkowZgw6bOM2A2DaOQD5jGX02oN_rzOwyytUm8IZDQCJLAnWWmpZha0PShn_o6NHKeP9Xz1uf-cIOZGgATZkDVUxXvqXaXqcwv6BH6yiG3HHtix4rEYXiriQy3OLuv-")',
                }}
              ></div>
              <div className="flex flex-col">
                <h1 className="text-white text-base font-medium leading-normal">
                  BotBuilders Inc.
                </h1>
                <p className="text-[#92c9a4] text-sm font-normal leading-normal">
                  Workspace
                </p>
              </div>
            </div>
            <nav className="flex flex-col gap-2 mt-4">
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-[#23482f]/50 hover:text-white transition-colors duration-200" href="#">
                <span className="material-symbols-outlined">dashboard</span>
                <p className="text-sm font-medium leading-normal">Dashboard</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#23482f] text-white" href="#">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                <p className="text-sm font-medium leading-normal">Chatbots</p>
              </a>
            </nav>
          </div>
        </aside>
        <main className="flex-1 p-6 lg:p-10 bg-[#102216] overflow-y-auto">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-wrap justify-between gap-3 mb-8">
              <div className="flex flex-col gap-2">
                <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                  Create a New Chatbot
                </p>
                <p className="text-[#92c9a4] text-base font-normal leading-normal">
                  Get started by building a new bot from the ground up or select a
                  pre-built template.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="flex flex-col items-stretch justify-start rounded-xl shadow-[0_0_4px_rgba(0,0,0,0.1)] bg-[#193322] p-6 hover:ring-2 hover:ring-primary/50 transition-all duration-300">
                <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-4">
                  <span className="material-symbols-outlined text-primary text-5xl">auto_awesome</span>
                  <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Start from Scratch</p>
                  <p className="text-[#92c9a4] text-base font-normal leading-normal h-20">
                    Build a custom chatbot with full control over its design, logic, and personality.
                  </p>
                  <button onClick={() => setShowModal(true)} className="flex mt-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#112217] text-sm font-bold leading-normal hover:bg-primary/90 transition-colors">
                    <span className="truncate">Create Bot</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in">
          <div className="w-full max-w-md rounded-xl bg-[#193322] border border-white/10 p-6 shadow-2xl">
            <div className="flex flex-col gap-4">
              <h2 className="text-white text-lg font-bold">Name Your Chatbot</h2>
              <input className="w-full rounded-lg border border-white/20 bg-[#112217] px-3 py-2 text-white" placeholder="e.g., Customer Support Bot" type="text" />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-white/70 hover:text-white">Cancel</button>
                <button onClick={onStart} className="px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold">Create Chatbot</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionTypeModal = ({ onSelect, onClose }: { onSelect: (subType: "text" | "buttons" | "list") => void; onClose: () => void; }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in">
      <div className="w-full max-w-sm rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-700">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Ask a question</h1>
          </div>
          <div className="space-y-4">
            <div onClick={() => onSelect("text")} className="group flex cursor-pointer items-center gap-4 rounded-lg bg-orange-500 p-4 text-white shadow-sm transition-all hover:bg-orange-600">
              <div className="flex-grow">
                <h2 className="text-lg font-bold">Question</h2>
                <p className="text-sm opacity-90">Ask anything to the user</p>
              </div>
              <span className="material-symbols-outlined text-3xl">person_question</span>
            </div>
            <div onClick={() => onSelect("buttons")} className="group flex cursor-pointer items-center gap-4 rounded-lg bg-orange-500 p-4 text-white shadow-sm transition-all hover:bg-orange-600">
              <div className="flex-grow">
                <h2 className="text-lg font-bold">Buttons</h2>
                <p className="text-sm opacity-90">Choices based on buttons<br />(Max 3)</p>
              </div>
              <span className="material-symbols-outlined text-3xl">radio_button_checked</span>
            </div>
            <div onClick={() => onSelect("list")} className="group flex cursor-pointer items-center gap-4 rounded-lg bg-orange-500 p-4 text-white shadow-sm transition-all hover:bg-orange-600">
              <div className="flex-grow">
                <h2 className="text-lg font-bold">List</h2>
                <p className="text-sm opacity-90">Choices based on buttons<br />(Max 10)</p>
              </div>
              <span className="material-symbols-outlined text-3xl">list_alt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ... Config Components ...
const ConfigMessage = ({ data, onClose, onSave }: any) => {
  const [content, setContent] = useState(data.content || "");
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm fade-in">
      <div className="w-full max-w-3xl h-full bg-[#F7F8FA] dark:bg-[#102216] shadow-2xl overflow-y-auto flex flex-col">
        <div className="p-8 flex-1">
          <header className="flex justify-between items-center mb-6">
             <h1 className="text-2xl font-bold dark:text-white">Configure: Send a Message</h1>
             <button onClick={onClose}><span className="material-symbols-outlined dark:text-white">close</span></button>
          </header>
          <label className="block">
             <span className="text-sm font-medium dark:text-white">Content</span>
             <textarea className="w-full mt-2 p-3 rounded-lg border bg-white dark:bg-black/20 dark:text-white min-h-[150px]" value={content} onChange={e => setContent(e.target.value)} placeholder="Type message..." />
          </label>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-black/5 dark:text-white">Cancel</button>
           <button onClick={() => { onSave({ ...data, content }); onClose(); }} className="px-4 py-2 rounded-lg bg-primary-blue text-white">Save</button>
        </div>
      </div>
    </div>
  );
};

const ConfigQuestion = ({ data, onClose, onSave }: any) => {
  const [content, setContent] = useState(data.content || "");
  const [variable, setVariable] = useState(data.variable || "");
  const [headerText, setHeaderText] = useState(data.headerText || "");
  const [footerText, setFooterText] = useState(data.footerText || "");
  
  // Buttons Specific
  const [buttons, setButtons] = useState<string[]>(data.buttons || []);
  const [newBtn, setNewBtn] = useState("");
  
  // List Specific
  const [listButtonText, setListButtonText] = useState(data.listButtonText || "Main Menu");
  // Default structure if empty
  const [sections, setSections] = useState<any[]>(data.listSections || [
     { id: 's1', title: 'Section 1', rows: [{ id: 'r1', title: 'Option 1', description: '' }] }
  ]);

  const addBtn = () => { if(newBtn && buttons.length < 3) { setButtons([...buttons, newBtn]); setNewBtn(""); }};

  // List Helpers
  const addSection = () => {
      setSections([...sections, { id: crypto.randomUUID(), title: 'New Section', rows: [] }]);
  };
  const removeSection = (idx: number) => {
      setSections(sections.filter((_, i) => i !== idx));
  };
  const updateSectionTitle = (idx: number, val: string) => {
      const newS = [...sections]; newS[idx].title = val; setSections(newS);
  };
  const addRow = (sIdx: number) => {
      const newS = [...sections];
      newS[sIdx].rows.push({ id: crypto.randomUUID(), title: 'New Option', description: '' });
      setSections(newS);
  };
  const removeRow = (sIdx: number, rIdx: number) => {
      const newS = [...sections];
      newS[sIdx].rows = newS[sIdx].rows.filter((_, i) => i !== rIdx);
      setSections(newS);
  };
  const updateRow = (sIdx: number, rIdx: number, field: string, val: string) => {
      const newS = [...sections];
      newS[sIdx].rows[rIdx] = { ...newS[sIdx].rows[rIdx], [field]: val };
      setSections(newS);
  };

  const isButtons = data.questionType === 'buttons';
  const isList = data.questionType === 'list';

  const handleSave = () => {
      onSave({ 
          ...data, 
          content, 
          variable,
          buttons: isButtons ? buttons : undefined,
          listSections: isList ? sections : undefined,
          listButtonText: isList ? listButtonText : undefined,
          headerText: (isButtons || isList) ? headerText : undefined,
          footerText: (isButtons || isList) ? footerText : undefined
      }); 
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm fade-in">
       <div className="w-full max-w-md h-full bg-white dark:bg-[#102216] shadow-2xl p-6 flex flex-col border-l dark:border-white/10">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Configure {data.label}</h2>
          
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
             {/* Common: Header (Optional) */}
             {(isButtons || isList) && (
                 <label className="block">
                    <span className="text-sm font-medium dark:text-gray-300">Header Text (Optional)</span>
                    <input className="w-full mt-1 p-2 border rounded dark:bg-black/20 dark:text-white dark:border-white/10" value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="Header..." maxLength={60} />
                 </label>
             )}

             {/* Common: Body/Question Text */}
             <label className="block">
                <span className="text-sm font-medium dark:text-gray-300">Body Text (Required)</span>
                <textarea className="w-full mt-1 p-2 border rounded dark:bg-black/20 dark:text-white dark:border-white/10 min-h-[80px]" value={content} onChange={e => setContent(e.target.value)} placeholder="Ask a question..." maxLength={1024} />
             </label>

             {/* Common: Footer (Optional) */}
             {(isButtons || isList) && (
                 <label className="block">
                    <span className="text-sm font-medium dark:text-gray-300">Footer Text (Optional)</span>
                    <input className="w-full mt-1 p-2 border rounded dark:bg-black/20 dark:text-white dark:border-white/10" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Footer..." maxLength={60} />
                 </label>
             )}

             {/* Buttons Configuration */}
             {isButtons && (
               <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg border dark:border-white/10">
                 <span className="text-sm font-bold dark:text-white block mb-2">Buttons (Max 3)</span>
                 <div className="space-y-2">
                   {buttons.map((b, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className="flex-1 p-2 bg-white dark:bg-black/20 rounded border dark:border-white/10 text-sm dark:text-white">{b}</div>
                        <button onClick={() => setButtons(buttons.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-1">
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                     </div>
                   ))}
                 </div>
                 {buttons.length < 3 && (
                    <div className="flex gap-2 mt-3">
                      <input className="flex-1 border rounded p-2 text-sm dark:bg-black/20 dark:text-white dark:border-white/10" value={newBtn} onChange={e => setNewBtn(e.target.value)} placeholder="New Button Label" maxLength={20} />
                      <button onClick={addBtn} className="bg-primary text-[#112217] px-3 py-1 rounded text-sm font-bold">Add</button>
                    </div>
                 )}
               </div>
             )}

             {/* List Configuration */}
             {isList && (
               <div className="space-y-4">
                   <label className="block">
                        <span className="text-sm font-medium dark:text-gray-300">List Button Label</span>
                        <input className="w-full mt-1 p-2 border rounded dark:bg-black/20 dark:text-white dark:border-white/10" value={listButtonText} onChange={e => setListButtonText(e.target.value)} placeholder="e.g. Open Menu" maxLength={20} />
                   </label>

                   <div className="space-y-4">
                       <div className="flex items-center justify-between">
                           <span className="text-sm font-bold dark:text-white">List Sections</span>
                           <button onClick={addSection} className="text-xs text-primary hover:underline">+ Add Section</button>
                       </div>
                       
                       {sections.map((section, sIdx) => (
                           <div key={section.id} className="border dark:border-white/10 rounded-lg p-3 bg-gray-50 dark:bg-white/5">
                               <div className="flex items-center gap-2 mb-2">
                                   <input 
                                     className="flex-1 bg-transparent border-b border-dashed border-gray-400 dark:border-gray-500 focus:border-primary outline-none text-sm font-bold dark:text-white py-1" 
                                     value={section.title} 
                                     onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                                     placeholder="Section Title (Optional)"
                                   />
                                   <button onClick={() => removeSection(sIdx)} className="text-red-500 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                               </div>

                               <div className="space-y-2 pl-2 border-l-2 border-gray-200 dark:border-white/10">
                                   {section.rows.map((row: any, rIdx: number) => (
                                       <div key={row.id} className="group flex flex-col gap-1 relative bg-white dark:bg-black/20 p-2 rounded border dark:border-white/5">
                                           <div className="flex items-center gap-2">
                                                <input 
                                                    className="flex-1 bg-transparent border-none p-0 text-sm font-medium dark:text-white placeholder:text-gray-400" 
                                                    value={row.title}
                                                    onChange={(e) => updateRow(sIdx, rIdx, 'title', e.target.value)}
                                                    placeholder="Row Title"
                                                />
                                                <button onClick={() => removeRow(sIdx, rIdx)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"><span className="material-symbols-outlined text-sm">close</span></button>
                                           </div>
                                           <input 
                                                className="w-full bg-transparent border-none p-0 text-xs text-gray-500 dark:text-gray-400 placeholder:text-gray-600" 
                                                value={row.description}
                                                onChange={(e) => updateRow(sIdx, rIdx, 'description', e.target.value)}
                                                placeholder="Description (Optional)"
                                            />
                                       </div>
                                   ))}
                                   <button onClick={() => addRow(sIdx)} className="w-full py-1 text-xs text-center border border-dashed border-gray-300 dark:border-gray-600 rounded text-gray-500 hover:text-primary hover:border-primary transition-colors">+ Add Row</button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
             )}

             <label className="block pt-4 border-t dark:border-white/10">
                <span className="text-sm font-medium dark:text-gray-300">Variable Name</span>
                <input className="w-full mt-1 p-2 border rounded dark:bg-black/20 dark:text-white dark:border-white/10" value={variable} onChange={e => setVariable(e.target.value)} placeholder="e.g. user_choice" />
             </label>
          </div>

          <div className="mt-4 flex justify-end gap-2 pt-4 border-t dark:border-white/10">
             <button onClick={onClose} className="px-4 py-2 rounded dark:text-white hover:bg-gray-100 dark:hover:bg-white/5">Cancel</button>
             <button onClick={handleSave} className="px-4 py-2 bg-primary text-[#112217] rounded font-bold hover:bg-opacity-90">Save</button>
          </div>
       </div>
    </div>
  );
};

const ConfigCondition = ({ data, onClose, onSave }: any) => {
   // Simplified logic config
   return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm fade-in">
       <div className="w-full max-w-md h-full bg-white dark:bg-[#102216] shadow-2xl p-6 flex flex-col border-l dark:border-white/10">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Configure Condition</h2>
          <p className="dark:text-gray-400">Logic configuration here...</p>
          <div className="mt-auto flex justify-end gap-2">
             <button onClick={onClose} className="px-4 py-2 rounded dark:text-white">Cancel</button>
             <button onClick={() => { onSave(data); onClose(); }} className="px-4 py-2 bg-primary rounded text-black font-bold">Save</button>
          </div>
       </div>
    </div>
   )
};

const BuilderPage = ({ onBack }: { onBack: () => void }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    { id: 'start-1', type: 'start', position: { x: 50, y: 50 }, data: { label: 'Start Flow' } }
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [configNode, setConfigNode] = useState<Node | null>(null);
  
  // Drag & Drop State
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [pendingDropType, setPendingDropType] = useState<NodeDataType | null>(null);
  const [pendingDropPos, setPendingDropPos] = useState<{x: number, y: number} | null>(null);

  // AI State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeDataType;
      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (type === 'question') {
          setPendingDropType(type);
          setPendingDropPos(position);
          return; // Wait for modal selection
      }

      const newNode: Node = {
        id: crypto.randomUUID(),
        type,
        position,
        data: { label: `New ${type}`, type },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleQuestionTypeSelect = (subType: "text" | "buttons" | "list") => {
      if(!pendingDropPos) return;
      
      let label = "Question";
      if(subType === 'buttons') label = "Buttons";
      if(subType === 'list') label = "List";

      const newNode: Node = {
          id: crypto.randomUUID(),
          type: 'question',
          position: pendingDropPos,
          data: { 
              label, 
              questionType: subType, 
              type: 'question',
              buttons: subType === 'buttons' ? ['Yes', 'No'] : [],
              listSections: subType === 'list' ? [{id: '1', title: 'Section', rows: [{id: 'r1', title: 'Option 1', description: ''}]}] : []
          }
      };
      setNodes((nds) => nds.concat(newNode));
      setPendingDropType(null);
      setPendingDropPos(null);
  };

  // Node Click Handling
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
      // Prevent config opening for Start node if not needed
      if(node.type !== 'start') {
          setConfigNode(node);
      }
  };

  const updateNodeData = (newData: any) => {
      setNodes((nds) => nds.map((node) => {
          if (node.id === configNode?.id) {
              return { ...node, data: { ...node.data, ...newData } };
          }
          return node;
      }));
  };

  // Add onConfig to data for all nodes
  const nodesWithHandler = nodes.map(n => ({
      ...n,
      data: {
          ...n.data,
          onConfig: () => setConfigNode(n)
      }
  }));

  // --- AI Generation Logic ---
  const generateAIResponse = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Using thinking mode as requested
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Create a chatbot flow using React Flow structure. Request: "${aiPrompt}".
        Return JSON with "nodes" and "edges".
        Node types: "start", "message", "question" (w/ questionType: "text"|"buttons"), "condition".
        Coordinates should be spaced out (e.g. x: 0, 300, 600).
        `,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          responseMimeType: "application/json",
        },
      });
      const text = response.text;
      if (text) {
        const result = JSON.parse(text);
        if (result.nodes) {
            // Map AI nodes to our internal structure
            const mappedNodes = result.nodes.map((n: any) => ({
                ...n,
                data: { ...n.data, onConfig: () => {} } // handlers re-attached in render
            }));
            setNodes(mappedNodes);
            if(result.edges) setEdges(result.edges);
            setShowAIModal(false);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error generating flow.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // NestJS Backend simulation
  const handleSave = () => {
      const payload = {
          name: "My Chatbot",
          nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
          edges: edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle }))
      };
      console.log("Saving to NestJS (Simulated):", JSON.stringify(payload, null, 2));
      alert("Flow saved! Check console for NestJS-ready JSON payload.");
  }

  return (
    <div className="flex h-screen w-full flex-col">
       {/* Header */}
       <header className="flex items-center justify-between border-b border-zinc-200 dark:border-b-[#23482f] px-6 py-3 bg-background-light dark:bg-background-dark z-20">
          <div className="flex items-center gap-4 text-zinc-900 dark:text-white">
             <div className="size-6 text-primary">
                <span className="material-symbols-outlined text-primary">smart_toy</span>
             </div>
             <h2 className="text-lg font-bold">ChatBot Builder (React Flow)</h2>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setShowAIModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 text-sm font-bold">
                <span className="material-symbols-outlined text-sm">auto_awesome</span> AI Build
             </button>
             <button onClick={handleSave} className="px-4 py-2 bg-primary text-[#112217] rounded-lg text-sm font-bold">Save</button>
          </div>
       </header>

       <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-72 bg-background-light dark:bg-background-dark border-r border-zinc-200 dark:border-[#23482f] p-4 z-10">
             <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Nodes</h3>
             <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-[#23482f] rounded-lg cursor-grab border dark:border-transparent shadow-sm flex items-center gap-3" onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'message')} draggable>
                   <span className="material-symbols-outlined text-blue-500">chat</span>
                   <span className="dark:text-white font-medium">Message</span>
                </div>
                <div className="p-3 bg-white dark:bg-[#23482f] rounded-lg cursor-grab border dark:border-transparent shadow-sm flex items-center gap-3" onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'question')} draggable>
                   <span className="material-symbols-outlined text-orange-500">help</span>
                   <span className="dark:text-white font-medium">Question</span>
                </div>
                <div className="p-3 bg-white dark:bg-[#23482f] rounded-lg cursor-grab border dark:border-transparent shadow-sm flex items-center gap-3" onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'condition')} draggable>
                   <span className="material-symbols-outlined text-purple-500">call_split</span>
                   <span className="dark:text-white font-medium">Condition</span>
                </div>
             </div>
             
             <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-300">
                   <strong>NestJS Integration:</strong>
                   <br/>
                   The nodes and edges are structured to be sent to a NestJS `FlowService`. 
                   <br/>
                   Click "Save" to see the JSON structure.
                </p>
             </div>
          </aside>

          {/* React Flow Canvas */}
          <div className="flex-1 h-full" ref={reactFlowWrapper}>
             <ReactFlow
                nodes={nodesWithHandler}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-zinc-100 dark:bg-[#0a160e]"
             >
                <Background color="#333" gap={20} />
                <Controls />
             </ReactFlow>
          </div>
       </div>

       {/* Overlays */}
       {pendingDropType && (
           <QuestionTypeModal onSelect={handleQuestionTypeSelect} onClose={() => { setPendingDropType(null); setPendingDropPos(null); }} />
       )}

       {configNode && configNode.type === 'message' && (
           <ConfigMessage data={configNode.data} onClose={() => setConfigNode(null)} onSave={updateNodeData} />
       )}
       {configNode && configNode.type === 'question' && (
           <ConfigQuestion data={configNode.data} onClose={() => setConfigNode(null)} onSave={updateNodeData} />
       )}
       {configNode && configNode.type === 'condition' && (
           <ConfigCondition data={configNode.data} onClose={() => setConfigNode(null)} onSave={updateNodeData} />
       )}
       
       {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in">
          <div className="w-full max-w-md rounded-xl bg-[#193322] border border-white/10 p-6 shadow-2xl">
            <h2 className="text-white text-lg font-bold mb-2">Generate Flow with AI</h2>
            <textarea
              className="w-full rounded-lg border border-white/20 bg-[#112217] px-3 py-2 text-white h-32 mb-4"
              placeholder="Describe your bot flow..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-white/70">Cancel</button>
              <button onClick={generateAIResponse} disabled={isGenerating} className="px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold">
                {isGenerating ? "Thinking..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
       )}

    </div>
  );
};

// --- App Root ---

const App = () => {
  const [view, setView] = useState<ViewState>("landing");

  return (
    <ReactFlowProvider>
      {view === "landing" && <LandingPage onStart={() => setView("builder")} />}
      {view === "builder" && <BuilderPage onBack={() => setView("landing")} />}
    </ReactFlowProvider>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}