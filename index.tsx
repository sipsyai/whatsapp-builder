import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---
type ViewState = "landing" | "builder";
type NodeType = "start" | "message" | "question" | "condition";

interface NodeData {
  label?: string;
  content?: string; // For message or question text (Body Text)
  variable?: string; // For saving input
  options?: string[]; // For answers
  conditionVar?: string;
  conditionOp?: string;
  conditionVal?: string;
  messageType?: string;
  questionType?: "text" | "buttons" | "list"; // New field for question subtype
  
  // Advanced Question Fields
  headerText?: string;
  footerText?: string;
  mediaHeader?: boolean; // For Buttons type
  buttons?: string[]; // For Buttons type (max 3)
  listButtonText?: string; // For List type (menu button label)
  listSections?: {
    id: string;
    title: string;
    rows: { id: string; title: string; description: string }[];
  }[];
}

interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  data: NodeData;
}

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
              <a
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-[#23482f]/50 hover:text-white transition-colors duration-200"
                href="#"
              >
                <span className="material-symbols-outlined">dashboard</span>
                <p className="text-sm font-medium leading-normal">Dashboard</p>
              </a>
              <a
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#23482f] text-white"
                href="#"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  smart_toy
                </span>
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
                  <span className="material-symbols-outlined text-primary text-5xl">
                    auto_awesome
                  </span>
                  <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                    Start from Scratch
                  </p>
                  <p className="text-[#92c9a4] text-base font-normal leading-normal h-20">
                    Build a custom chatbot with full control over its design,
                    logic, and personality.
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex mt-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#112217] text-sm font-bold leading-normal hover:bg-primary/90 transition-colors"
                  >
                    <span className="truncate">Create Bot</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-stretch justify-start rounded-xl shadow-[0_0_4px_rgba(0,0,0,0.1)] bg-[#193322] p-6 hover:ring-2 hover:ring-primary/50 transition-all duration-300">
                <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-4">
                  <span className="material-symbols-outlined text-primary text-5xl">
                    dashboard_customize
                  </span>
                  <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                    Choose a Template
                  </p>
                  <p className="text-[#92c9a4] text-base font-normal leading-normal h-20">
                    Select a pre-configured bot for common use cases.
                  </p>
                  <button className="flex mt-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 text-primary text-sm font-bold leading-normal hover:bg-primary/30 transition-colors">
                    <span className="truncate">Browse Templates</span>
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
              <div className="flex flex-col gap-1">
                <h2 className="text-white text-lg font-bold">
                  Name Your Chatbot
                </h2>
                <p className="text-[#92c9a4] text-sm">
                  Give your new chatbot a unique name to get started.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-white text-sm font-medium"
                  htmlFor="chatbot-name"
                >
                  Chatbot Name
                </label>
                <input
                  className="w-full rounded-lg border border-white/20 bg-[#112217] px-3 py-2 text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  id="chatbot-name"
                  placeholder="e.g., Customer Support Bot"
                  type="text"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-white/80 hover:text-white text-sm font-medium leading-normal hover:bg-white/10 transition-colors"
                >
                  <span className="truncate">Cancel</span>
                </button>
                <button
                  onClick={onStart}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#112217] text-sm font-bold leading-normal hover:bg-primary/90 transition-colors"
                >
                  <span className="truncate">Create Chatbot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionTypeModal = ({
  onSelect,
  onClose,
}: {
  onSelect: (subType: "text" | "buttons" | "list") => void;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in">
      <div className="w-full max-w-sm rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onClose}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
              Ask a question
            </h1>
          </div>
          <div className="space-y-4">
            {/* Option 1: Question (Text) */}
            <div
              onClick={() => onSelect("text")}
              className="group flex cursor-pointer items-center gap-4 rounded-lg bg-orange-500 p-4 text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md"
            >
              <div className="flex-grow">
                <h2 className="text-lg font-bold">Question</h2>
                <p className="text-sm opacity-90">Ask anything to the user</p>
              </div>
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-orange-400 transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">
                  person_question
                </span>
              </div>
            </div>

            {/* Option 2: Buttons */}
            <div
              onClick={() => onSelect("buttons")}
              className="group flex cursor-pointer items-center gap-4 rounded-lg bg-orange-500 p-4 text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md"
            >
              <div className="flex-grow">
                <h2 className="text-lg font-bold">Buttons</h2>
                <p className="text-sm opacity-90">
                  Choices based on buttons<br />(Maximum of 3 choices)
                </p>
              </div>
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-orange-400 transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">
                  radio_button_checked
                </span>
              </div>
            </div>

            {/* Option 3: List */}
            <div
              onClick={() => onSelect("list")}
              className="group flex cursor-pointer items-center gap-4 rounded-lg bg-orange-500 p-4 text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md"
            >
              <div className="flex-grow">
                <h2 className="text-lg font-bold">List</h2>
                <p className="text-sm opacity-90">
                  Choices based on buttons<br />(Maximum of 10 choices)
                </p>
              </div>
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-orange-400 transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">
                  list_alt
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigMessage = ({
  data,
  onClose,
  onSave,
}: {
  data: NodeData;
  onClose: () => void;
  onSave: (data: NodeData) => void;
}) => {
  const [content, setContent] = useState(data.content || "");
  const [messageType, setMessageType] = useState(data.messageType || "Text");

  const handleSave = () => {
    onSave({ ...data, content, messageType });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm fade-in">
      <div className="w-full max-w-3xl h-full bg-[#F7F8FA] dark:bg-[#102216] shadow-2xl overflow-y-auto flex flex-col">
        <div className="p-4 sm:p-8 md:p-12 flex-1">
          <div className="flex flex-col space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-4">
              <h1 className="text-slate-900 dark:text-white text-2xl sm:text-3xl font-bold leading-tight">
                Configure: Send a Message
              </h1>
              <button
                onClick={onClose}
                className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            <main className="flex flex-col gap-6">
              <section>
                <label className="text-slate-900 dark:text-white text-base font-medium leading-normal pb-2 block">
                  Message Type
                </label>
                <div className="flex h-10 w-full items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 p-1">
                  {["Text", "Image", "Video", "Audio", "Document"].map(
                    (type, i) => (
                      <label
                        key={type}
                        className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 ${messageType === type ? "bg-white dark:bg-surface-dark shadow-sm text-primary-blue dark:text-primary" : "text-slate-600 dark:text-gray-300"} text-sm font-medium leading-normal transition-colors`}
                        onClick={() => setMessageType(type)}
                      >
                        <span className="truncate">{type}</span>
                      </label>
                    )
                  )}
                </div>
              </section>
              <section>
                <label className="flex flex-col w-full">
                  <p className="text-slate-900 dark:text-white text-base font-medium leading-normal pb-2">
                    Content
                  </p>
                  <div className="relative rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-surface-dark focus-within:border-primary-blue focus-within:ring-2 focus-within:ring-primary-blue/20">
                    <textarea
                      className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent min-h-36 p-4 text-base font-normal leading-normal placeholder:text-slate-400"
                      placeholder="Type your message here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    ></textarea>
                    <div className="flex items-center justify-between gap-2 border-t border-gray-200 dark:border-white/10 px-2 py-1">
                      <div className="flex gap-1">
                        {["format_bold", "format_italic", "mood"].map(
                          (icon) => (
                            <button
                              key={icon}
                              className="p-2 rounded-md text-slate-500 hover:bg-black/5 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                              <span className="material-symbols-outlined text-xl">
                                {icon}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                      <p className="text-sm text-slate-400 px-2">
                        {content.length}/1000
                      </p>
                    </div>
                  </div>
                </label>
              </section>
            </main>
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 dark:border-white/10 p-4 bg-white dark:bg-surface-dark">
          <button
            onClick={onClose}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-white text-sm font-medium leading-normal hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <span className="truncate">Cancel</span>
          </button>
          <button
            onClick={handleSave}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary-blue dark:bg-primary text-white dark:text-black text-sm font-medium leading-normal hover:opacity-90 transition-colors"
          >
            <span className="truncate">Save Message</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

const ConfigQuestion = ({
  data,
  onClose,
  onSave,
}: {
  data: NodeData;
  onClose: () => void;
  onSave: (data: NodeData) => void;
}) => {
  // Common State
  const [content, setContent] = useState(data.content || ""); // Used for Body Text or Question Text
  const [variable, setVariable] = useState(data.variable || "");
  const [questionType] = useState<"text" | "buttons" | "list">(data.questionType || "text");

  // Buttons & List Header/Footer State
  const [headerText, setHeaderText] = useState(data.headerText || "");
  const [footerText, setFooterText] = useState(data.footerText || "");
  
  // Buttons Specific State
  const [mediaHeader, setMediaHeader] = useState(data.mediaHeader || false);
  const [buttons, setButtons] = useState<string[]>(data.buttons || []);
  const [newButtonText, setNewButtonText] = useState("");

  // List Specific State
  const [listButtonText, setListButtonText] = useState(data.listButtonText || "");
  const [listSections, setListSections] = useState<{ id: string; title: string; rows: { id: string; title: string; description: string }[] }[]>(
    data.listSections || [{ id: crypto.randomUUID(), title: "", rows: [{ id: crypto.randomUUID(), title: "", description: "" }] }]
  );

  const handleSave = () => {
    onSave({ 
      ...data, 
      content, 
      variable,
      questionType,
      headerText,
      footerText,
      mediaHeader,
      buttons,
      listButtonText,
      listSections
    });
    onClose();
  };

  // Helper functions for Buttons
  const handleAddButton = () => {
    if (newButtonText && buttons.length < 3) {
      setButtons([...buttons, newButtonText]);
      setNewButtonText("");
    }
  };
  const removeButton = (index: number) => {
    const newBtns = [...buttons];
    newBtns.splice(index, 1);
    setButtons(newBtns);
  };

  // Helper functions for List
  const addListSection = () => {
    setListSections([...listSections, { id: crypto.randomUUID(), title: "", rows: [{ id: crypto.randomUUID(), title: "", description: "" }] }]);
  };
  const removeListSection = (index: number) => {
    const newSections = [...listSections];
    newSections.splice(index, 1);
    setListSections(newSections);
  };
  const updateSectionTitle = (index: number, val: string) => {
    const newSections = [...listSections];
    newSections[index].title = val;
    setListSections(newSections);
  };
  const addListRow = (sectionIndex: number) => {
    if (listSections[sectionIndex].rows.length < 10) {
      const newSections = [...listSections];
      newSections[sectionIndex].rows.push({ id: crypto.randomUUID(), title: "", description: "" });
      setListSections(newSections);
    }
  };
  const updateListRow = (sectionIndex: number, rowIndex: number, field: 'title'|'description', val: string) => {
    const newSections = [...listSections];
    newSections[sectionIndex].rows[rowIndex] = { ...newSections[sectionIndex].rows[rowIndex], [field]: val };
    setListSections(newSections);
  };
  const removeListRow = (sectionIndex: number, rowIndex: number) => {
    const newSections = [...listSections];
    newSections[sectionIndex].rows.splice(rowIndex, 1);
    setListSections(newSections);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm fade-in">
      <aside className="flex flex-col w-full max-w-md h-screen bg-surface-light dark:bg-surface-dark border-l border-gray-200 dark:border-white/10 shadow-2xl">
        <div className="flex-grow overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-4 p-6 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary-blue/20 text-primary-blue dark:bg-primary/20 dark:text-primary">
              <span className="material-symbols-outlined">
                {questionType === "buttons" ? "radio_button_checked" : questionType === "list" ? "list_alt" : "question_answer"}
              </span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
                {questionType === "buttons" ? "Set Buttons" : questionType === "list" ? "Set List" : "Configure: Ask a Question"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                Set up the question and response logic
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* --- Render based on Question Type --- */}
            
            {/* 1. TEXT TYPE (Default/Original) */}
            {questionType === 'text' && (
              <div>
                <label className="flex flex-col w-full">
                  <p className="text-slate-900 dark:text-white text-base font-medium leading-normal pb-2">
                    Question Text
                  </p>
                  <div className="relative">
                    <textarea
                      className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary-blue/50 dark:focus:ring-primary/50 border border-gray-300 dark:border-white/20 bg-transparent focus:border-primary-blue dark:focus:border-primary min-h-32 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-4 text-base font-normal leading-normal"
                      placeholder="e.g., What is your email address?"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    ></textarea>
                  </div>
                </label>
              </div>
            )}

            {/* 2. BUTTONS TYPE */}
            {questionType === 'buttons' && (
              <>
                {/* Media Header Toggle */}
                <div className="flex items-center justify-between bg-gray-100 dark:bg-white/5 p-3 rounded-lg">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Media Header (Optional)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={mediaHeader} onChange={(e) => setMediaHeader(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-blue dark:peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Header Text */}
                <label className="flex flex-col w-full">
                   <div className="flex justify-between">
                    <p className="text-slate-900 dark:text-white text-sm font-medium pb-2">Header Text <span className="text-gray-500 font-normal">(optional)</span></p>
                    <span className="text-xs text-gray-400">{headerText.length}/60</span>
                   </div>
                   <input
                     className="form-input w-full rounded-lg text-slate-900 dark:text-white bg-transparent border border-gray-300 dark:border-white/20 p-3 text-sm"
                     placeholder="Header Text"
                     maxLength={60}
                     value={headerText}
                     onChange={(e) => setHeaderText(e.target.value)}
                   />
                </label>

                {/* Body Text */}
                <label className="flex flex-col w-full">
                   <div className="flex justify-between">
                    <p className="text-slate-900 dark:text-white text-sm font-medium pb-2">Body Text <span className="text-red-500">*</span></p>
                    <span className="text-xs text-gray-400">{content.length}/1024</span>
                   </div>
                   <p className="text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Ask a question here</p>
                   <textarea
                     className="form-input w-full rounded-lg text-slate-900 dark:text-white bg-transparent border border-gray-300 dark:border-white/20 p-3 text-sm min-h-24"
                     placeholder="Ask a question here..."
                     maxLength={1024}
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                   />
                </label>

                {/* Footer Text */}
                <label className="flex flex-col w-full">
                   <div className="flex justify-between">
                    <p className="text-slate-900 dark:text-white text-sm font-medium pb-2">Footer Text <span className="text-gray-500 font-normal">(optional)</span></p>
                    <span className="text-xs text-gray-400">{footerText.length}/60</span>
                   </div>
                   <input
                     className="form-input w-full rounded-lg text-slate-900 dark:text-white bg-transparent border border-gray-300 dark:border-white/20 p-3 text-sm"
                     placeholder="Footer Text"
                     maxLength={60}
                     value={footerText}
                     onChange={(e) => setFooterText(e.target.value)}
                   />
                </label>

                {/* Buttons List (Styled as visual list with green dots) */}
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-white/10">
                   <div className="flex justify-between items-center">
                     <p className="text-slate-900 dark:text-white text-sm font-bold">Buttons <span className="text-xs font-normal text-gray-500">(Max 3)</span></p>
                   </div>
                   
                   <div className="flex flex-col gap-2">
                      {buttons.map((btn, idx) => (
                        <div key={idx} className="group flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm">
                           <span className="text-sm font-medium text-slate-700 dark:text-gray-200">{btn}</span>
                           <div className="flex items-center gap-2">
                             <button onClick={() => removeButton(idx)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                               <span className="material-symbols-outlined text-lg">delete</span>
                             </button>
                             <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                           </div>
                        </div>
                      ))}
                      
                      {/* Default Option (Visual Only) */}
                      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/5">
                         <span className="text-sm font-medium text-slate-600 dark:text-gray-300">Default</span>
                         <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      </div>
                   </div>

                   {buttons.length < 3 && (
                     <div className="flex gap-2 items-center mt-4">
                        <input 
                          className="flex-1 form-input rounded-lg text-slate-900 dark:text-white bg-transparent border border-gray-300 dark:border-white/20 p-2.5 text-sm"
                          placeholder="New Button (max 20 chars)"
                          maxLength={20}
                          value={newButtonText}
                          onChange={(e) => setNewButtonText(e.target.value)}
                        />
                        <button 
                          onClick={handleAddButton}
                          disabled={!newButtonText}
                          className="bg-primary-blue dark:bg-primary text-white dark:text-black px-4 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50"
                        >
                          Create
                        </button>
                     </div>
                   )}
                </div>
              </>
            )}

             {/* 3. LIST TYPE */}
             {questionType === 'list' && (
              <>
                {/* Header Text */}
                <label className="flex flex-col w-full">
                   <div className="flex justify-between">
                    <p className="text-slate-900 dark:text-white text-sm font-medium pb-2">Header Text <span className="text-gray-500 font-normal">(optional)</span></p>
                    <span className="text-xs text-gray-400">{headerText.length}/60</span>
                   </div>
                   <input
                     className="form-input w-full rounded-lg text-slate-900 dark:text-white bg-transparent border border-gray-300 dark:border-white/20 p-3 text-sm"
                     placeholder="Header Text"
                     maxLength={60}
                     value={headerText}
                     onChange={(e) => setHeaderText(e.target.value)}
                   />
                </label>

                {/* Body Text */}
                <label className="flex flex-col w-full">
                   <div className="flex justify-between">
                    <p className="text-slate-900 dark:text-white text-sm font-medium pb-2">Body Text <span className="text-red-500">*</span></p>
                    <span className="text-xs text-gray-400">{content.length}/1024</span>
                   </div>
                   <textarea
                     className="form-input w-full rounded-lg text-slate-900 dark:text-white bg-transparent border border-gray-300 dark:border-white/20 p-3 text-sm min-h-24"
                     placeholder="default body"
                     maxLength={1024}
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                   />
                </label>

                {/* Footer Text */}
                <label className="flex flex-col w-full">
                   <div className="flex justify-between">
                    <p className="text-slate-900 dark:text-white text-sm font-medium pb-2">Footer Text <span className="text-gray-500 font-normal">(optional)</span></p>
                    <span className="text-xs text-gray-400">{footerText.length}/60</span>
                   </div>
                   <input
                     className="form-input w-full rounded-lg text-slate-900 dark:text-white bg-transparent border border-gray-300 dark:border-white/20 p-3 text-sm"
                     placeholder="Footer Text"
                     maxLength={60}
                     value={footerText}
                     onChange={(e) => setFooterText(e.target.value)}
                   />
                </label>

                {/* List Button Text */}
                <label className="flex flex-col w-full">
                   <div className="flex justify-between">
                    <p className="text-slate-900 dark:text-white text-sm font-medium pb-2">Button Text <span className="text-red-500">*</span></p>
                    <span className="text-xs text-gray-400">{listButtonText.length}/20</span>
                   </div>
                   <input
                     className="form-input w-full rounded-lg text-slate-900 dark:text-white bg-transparent border border-gray-300 dark:border-white/20 p-3 text-sm"
                     placeholder="Menu Here"
                     maxLength={20}
                     value={listButtonText}
                     onChange={(e) => setListButtonText(e.target.value)}
                   />
                </label>

                {/* Sections & Rows */}
                <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-white/10">
                   {listSections.map((section, sIdx) => (
                     <div key={section.id} className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                       <div className="flex items-center gap-2 mb-3">
                         <input
                           className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm font-bold text-slate-800 dark:text-white py-1 focus:outline-none focus:border-primary"
                           placeholder="Section Title (optional)"
                           maxLength={24}
                           value={section.title}
                           onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                         />
                         <button onClick={() => removeListSection(sIdx)} className="text-xs text-red-500 hover:underline">Remove Section</button>
                       </div>
                       
                       <div className="space-y-2">
                          {section.rows.map((row, rIdx) => (
                            <div key={row.id} className="pl-2 border-l-2 border-gray-200 dark:border-gray-600 space-y-1">
                               <div className="flex items-center gap-2">
                                 <input 
                                   className="flex-1 bg-white dark:bg-black/20 rounded px-2 py-1 text-sm border border-gray-200 dark:border-white/10"
                                   placeholder="Row Title (required)"
                                   maxLength={24}
                                   value={row.title}
                                   onChange={(e) => updateListRow(sIdx, rIdx, 'title', e.target.value)}
                                 />
                                 <button onClick={() => removeListRow(sIdx, rIdx)} className="text-gray-400 hover:text-red-500">
                                    <span className="material-symbols-outlined text-base">close</span>
                                 </button>
                               </div>
                               <input 
                                   className="w-full bg-transparent text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 focus:outline-none"
                                   placeholder="Add Description (optional)"
                                   value={row.description}
                                   onChange={(e) => updateListRow(sIdx, rIdx, 'description', e.target.value)}
                                 />
                            </div>
                          ))}
                          <button onClick={() => addListRow(sIdx)} className="text-xs font-semibold text-primary-blue dark:text-primary mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">add</span> New Row
                          </button>
                       </div>
                     </div>
                   ))}
                   
                   {listSections.length < 10 && (
                     <button onClick={addListSection} className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/5">
                       Add New Section
                     </button>
                   )}

                   {/* Default Option (Visual Only) */}
                    <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/5 mt-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-gray-300">Default</span>
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    </div>
                </div>
              </>
             )}

            {/* Common Variable Save Field */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-6">
              <label className="flex flex-col w-full">
                <div className="flex flex-col gap-1 pb-2">
                  <p className="text-slate-900 dark:text-white text-base font-bold">
                    Save Answers in a variable
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Save the user's input to a variable to use it later.
                  </p>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    alternate_email
                  </span>
                  <input
                    className="form-input w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary-blue/50 dark:focus:ring-primary/50 border border-gray-300 dark:border-white/20 bg-transparent focus:border-primary-blue dark:focus:border-primary pl-10 p-3 text-base font-normal leading-normal"
                    placeholder="variable_name"
                    type="text"
                    value={variable}
                    onChange={(e) => setVariable(e.target.value)}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-surface-light dark:bg-surface-dark">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-blue dark:bg-primary text-white dark:text-black hover:opacity-90 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

const ConfigCondition = ({
  data,
  onClose,
  onSave,
}: {
  data: NodeData;
  onClose: () => void;
  onSave: (data: NodeData) => void;
}) => {
  const [conditionVar, setConditionVar] = useState(data.conditionVar || "");
  const [conditionOp, setConditionOp] = useState(
    data.conditionOp || "is equal to"
  );
  const [conditionVal, setConditionVal] = useState(data.conditionVal || "");

  const handleSave = () => {
    onSave({ ...data, conditionVar, conditionOp, conditionVal });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in p-4">
      <div className="layout-container flex h-full max-h-[90vh] w-full max-w-[960px] flex-col bg-background-light dark:bg-[#102216] rounded-xl overflow-hidden shadow-2xl">
        <div className="flex flex-col h-full">
          <div className="flex flex-wrap justify-between gap-3 p-4 border-b border-[#23482f] shrink-0">
            <div className="flex min-w-72 flex-col gap-3">
              <p className="text-black dark:text-white tracking-light text-[32px] font-bold leading-tight">
                Set a Condition
              </p>
              <p className="text-[#557e61] dark:text-[#92c9a4] text-sm font-normal leading-normal">
                Create rules to direct the conversation flow.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-full text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex flex-col p-4 space-y-6 overflow-y-auto flex-1">
            <div className="border border-[#23482f] rounded-xl">
              <h3 className="text-black dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
                IF
              </h3>
              <div className="flex items-center gap-4 px-4 py-3 border-t border-[#23482f]">
                <div className="flex flex-1 flex-col sm:flex-row flex-wrap items-end gap-4">
                  <label className="flex flex-col min-w-40 flex-1">
                    <p className="text-black dark:text-white text-sm sm:text-base font-medium leading-normal pb-2">
                      Variable
                    </p>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-[#cccccc] dark:border-[#326744] bg-[#f0f0f0] dark:bg-[#193322] focus:border-[#007BFF] dark:focus:border-[#13ec5b] h-14 placeholder:text-gray-500 dark:placeholder:text-[#92c9a4] p-[15px] text-base font-normal leading-normal"
                      placeholder="@variable"
                      value={conditionVar}
                      onChange={(e) => setConditionVar(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col min-w-40 flex-1">
                    <p className="text-black dark:text-white text-sm sm:text-base font-medium leading-normal pb-2">
                      Operator
                    </p>
                    <select
                      className="form-select appearance-none flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-[#cccccc] dark:border-[#326744] bg-[#f0f0f0] dark:bg-[#193322] focus:border-[#007BFF] dark:focus:border-[#13ec5b] h-14 p-[15px] text-base font-normal leading-normal"
                      value={conditionOp}
                      onChange={(e) => setConditionOp(e.target.value)}
                    >
                      <option value="is equal to">is equal to</option>
                      <option value="is not equal to">is not equal to</option>
                      <option value="contains">contains</option>
                    </select>
                  </label>
                  <label className="flex flex-col min-w-40 flex-1">
                    <p className="text-black dark:text-white text-sm sm:text-base font-medium leading-normal pb-2">
                      Value
                    </p>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-[#cccccc] dark:border-[#326744] bg-[#f0f0f0] dark:bg-[#193322] focus:border-[#007BFF] dark:focus:border-[#13ec5b] h-14 placeholder:text-gray-500 dark:placeholder:text-[#92c9a4] p-[15px] text-base font-normal leading-normal"
                      placeholder="Value"
                      value={conditionVal}
                      onChange={(e) => setConditionVal(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 border-t border-[#23482f] shrink-0">
            <button
              onClick={onClose}
              className="flex items-center justify-center h-12 px-8 rounded-xl bg-gray-200 dark:bg-[#23482f] text-black dark:text-white hover:bg-gray-300 dark:hover:bg-[#326744] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center justify-center h-12 px-8 rounded-xl bg-[#007BFF] dark:bg-primary text-white dark:text-black font-bold hover:opacity-90 transition-opacity"
            >
              Save Condition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BuilderPage = ({
  nodes,
  setNodes,
  onOpenConfig,
}: {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  onOpenConfig: (nodeId: string, type: NodeType) => void;
}) => {
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Question Type Modal State
  const [pendingDrop, setPendingDrop] = useState<{ x: number; y: number } | null>(
    null
  );

  // AI Assistant State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    setDraggedNodeType(type);
    e.dataTransfer.setData("nodeType", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // If dropping a Question node, stop and ask for type
    if (draggedNodeType === "question") {
      setPendingDrop({ x, y });
      // Do NOT setDraggedNodeType(null) yet, or just reset it and wait for modal logic
      setDraggedNodeType(null);
      return;
    }

    // Normal logic for other nodes
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: draggedNodeType,
      x,
      y,
      data: { label: `New ${draggedNodeType}` },
    };

    setNodes((prev) => [...prev, newNode]);
    setDraggedNodeType(null);
  };

  const handleQuestionTypeSelect = (subType: "text" | "buttons" | "list") => {
    if (!pendingDrop) return;

    let label = "Question";
    if (subType === "buttons") label = "Buttons";
    else if (subType === "list") label = "List";

    const newNode: Node = {
      id: crypto.randomUUID(),
      type: "question",
      x: pendingDrop.x,
      y: pendingDrop.y,
      data: {
        label: label,
        questionType: subType,
        content: subType === "text" ? "Ask anything to the user" : "",
        // Initialize defaults for better UX
        buttons: subType === "buttons" ? ["Yes", "No"] : [],
        listSections: subType === "list" ? [{id: crypto.randomUUID(), title: "Section 1", rows: [{id: crypto.randomUUID(), title: "Option 1", description: ""}]}] : []
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setPendingDrop(null);
  };

  const handleQuestionTypeClose = () => {
    setPendingDrop(null);
  };

  // Logic for moving existing nodes on canvas
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const dragNodeRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onNodeMouseDown = (e: React.MouseEvent, id: string, node: Node) => {
    e.stopPropagation();
    setIsDraggingNode(true);
    dragNodeRef.current = id;
    dragOffsetRef.current = { x: e.clientX - node.x, y: e.clientY - node.y };
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNode && dragNodeRef.current) {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === dragNodeRef.current) {
            return {
              ...n,
              x: e.clientX - dragOffsetRef.current.x,
              y: e.clientY - dragOffsetRef.current.y,
            };
          }
          return n;
        })
      );
    }
  };

  const onCanvasMouseUp = () => {
    setIsDraggingNode(false);
    dragNodeRef.current = null;
  };

  const generateAIResponse = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Using Gemini 3 Pro Thinking Mode as requested
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Create a chatbot flow for the following request: "${aiPrompt}".
        Return a valid JSON object with a "nodes" array.
        Each node must have:
        - id: string (unique)
        - type: "start" | "message" | "question" | "condition"
        - x: number (canvas coordinate, space them out nicely)
        - y: number (canvas coordinate)
        - data: { label: string, content?: string, variable?: string }

        Example: { "nodes": [{ "id": "1", "type": "start", "x": 50, "y": 50, "data": { "label": "Start" } }] }`,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          responseMimeType: "application/json",
        },
      });
      const text = response.text;
      if (text) {
        const result = JSON.parse(text);
        if (result.nodes && Array.isArray(result.nodes)) {
          setNodes(result.nodes);
          setShowAIModal(false);
        }
      }
    } catch (e) {
      console.error("AI Generation failed", e);
      alert("Failed to generate flow. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-zinc-200 dark:border-b-[#23482f] px-6 py-3 shrink-0 bg-background-light dark:bg-background-dark z-20">
        <div className="flex items-center gap-4 text-zinc-900 dark:text-white">
          <div className="size-6 text-primary">
            <svg
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <h2 className="text-zinc-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            ChatBot Builder
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition shadow-lg"
          >
            <span className="material-symbols-outlined text-sm mr-2">
              auto_awesome
            </span>
            <span className="truncate">AI Build</span>
          </button>
          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-zinc-900 dark:text-[#112217] text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition">
            <span className="truncate">Publish</span>
          </button>
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDqlYsp2lIIeayzeAF3OK_0zXWJZCf1HxMBDxCnFc7-aA3XCA8sdLA8PVgwsRR9geQfZ48aCb0UATilok-KqEiv6E6vfrHZhVfMBkl5cjxm7eNT122dRQlXsdGNfAaiGrozY7_msPEyQlDpYCodDtnImjK6DUBhfdETMAdVBXmKFlIgg_Vk5GOMlLPE-yW0FvX1ZOcjkwHizFIGYIvmg4Q_zYbmvD-JT9l25M2zo3Dh0ci8AFee5rC084X6TYalvoZdvZ4mlnxvEeMF")',
            }}
          ></div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="flex h-full w-72 flex-col border-r border-zinc-200 dark:border-[#23482f] bg-background-light dark:bg-background-dark p-4 shrink-0 z-10">
          <div className="px-4 py-3">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                <div className="text-zinc-500 dark:text-[#92c9a4] flex border-none bg-zinc-200 dark:bg-[#23482f] items-center justify-center pl-4 rounded-l-lg border-r-0">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-zinc-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-zinc-200 dark:bg-[#23482f] focus:border-none h-full placeholder:text-zinc-500 dark:placeholder:text-[#92c9a4] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                  placeholder="Find a node"
                />
              </div>
            </label>
          </div>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col">
              <h1 className="text-zinc-900 dark:text-white text-base font-medium leading-normal px-4">
                Nodes
              </h1>
              <p className="text-zinc-500 dark:text-[#92c9a4] text-sm font-normal leading-normal px-4">
                Drag to canvas to add
              </p>
            </div>
            <div className="mt-4 border-t border-zinc-200 dark:border-[#23482f] pt-4 flex flex-col gap-2">
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, "message")}
                className="cursor-grab flex items-center gap-4 bg-background-light dark:bg-background-dark px-4 min-h-14 justify-between rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/5 transition text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-lg bg-zinc-200 dark:bg-[#23482f] shrink-0 size-10">
                    <span className="material-symbols-outlined">chat</span>
                  </div>
                  <p className="text-zinc-900 dark:text-white text-base font-normal leading-normal flex-1 truncate">
                    Send a Message
                  </p>
                </div>
                <div className="shrink-0 text-zinc-500 dark:text-[#92c9a4]">
                  <span className="material-symbols-outlined">
                    drag_indicator
                  </span>
                </div>
              </div>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, "question")}
                className="cursor-grab flex items-center gap-4 bg-background-light dark:bg-background-dark px-4 min-h-14 justify-between rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/5 transition text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-lg bg-zinc-200 dark:bg-[#23482f] shrink-0 size-10">
                    <span className="material-symbols-outlined">help</span>
                  </div>
                  <p className="text-zinc-900 dark:text-white text-base font-normal leading-normal flex-1 truncate">
                    Ask a Question
                  </p>
                </div>
                <div className="shrink-0 text-zinc-500 dark:text-[#92c9a4]">
                  <span className="material-symbols-outlined">
                    drag_indicator
                  </span>
                </div>
              </div>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, "condition")}
                className="cursor-grab flex items-center gap-4 bg-background-light dark:bg-background-dark px-4 min-h-14 justify-between rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/5 transition text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-lg bg-zinc-200 dark:bg-[#23482f] shrink-0 size-10">
                    <span className="material-symbols-outlined">
                      call_split
                    </span>
                  </div>
                  <p className="text-zinc-900 dark:text-white text-base font-normal leading-normal flex-1 truncate">
                    Set a Condition
                  </p>
                </div>
                <div className="shrink-0 text-zinc-500 dark:text-[#92c9a4]">
                  <span className="material-symbols-outlined">
                    drag_indicator
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main
          ref={canvasRef}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onMouseLeave={onCanvasMouseUp}
          className="flex-1 bg-zinc-200/50 dark:bg-zinc-900/20 relative overflow-hidden cursor-crosshair"
        >
          {/* Grid Background */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#DEE2E6 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div
            className="absolute inset-0 z-0 hidden dark:block pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(rgba(35, 72, 47, 0.3) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>

          {/* Render Nodes */}
          {nodes.map((node) => {
             const isButtons = node.type === 'question' && node.data.questionType === 'buttons';
             const isList = node.type === 'question' && node.data.questionType === 'list';
             const isBranching = isButtons || isList;
             
             // Helper to extract output items
             let outputs: {id: string, label: string}[] = [];
             if (isButtons && node.data.buttons) {
               outputs = node.data.buttons.map((b, i) => ({ id: `btn-${i}`, label: b }));
             } else if (isList && node.data.listSections) {
               outputs = node.data.listSections.flatMap(s => s.rows.map(r => ({ id: r.id, label: r.title })));
             }

             // Always add Default for branching nodes
             if (isBranching) {
                outputs.push({ id: 'default', label: 'Default' });
             }

             const nodeClasses = isButtons 
                ? "bg-[#0D1F12] rounded-2xl border-2 border-[#13ec5b] shadow-lg flex flex-col min-w-[280px]"
                : `bg-background-light dark:bg-background-dark rounded-xl shadow-lg border border-zinc-200 dark:border-[#23482f] group hover:ring-2 hover:ring-primary transition-all flex flex-col ${isBranching ? 'min-w-[280px]' : 'w-64'}`;

             return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: node.x,
                  top: node.y,
                  cursor: "grab",
                }}
                onMouseDown={(e) => onNodeMouseDown(e, node.id, node)}
                className="z-10"
              >
                <div className={nodeClasses}>
                  {/* Custom Visuals for Buttons Type */}
                  {isButtons ? (
                    <>
                      <div className="flex items-start gap-3 p-4">
                        <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-inner text-white shrink-0">
                          <span className="material-symbols-outlined text-2xl">help</span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="text-white text-lg font-bold leading-tight truncate">Buttons</h3>
                          <p className="text-[#9CA3AF] text-xs font-medium truncate">Click to configure</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); 
                            onOpenConfig(node.id, node.type);
                          }}
                          className="text-gray-500 hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined">settings</span>
                        </button>
                      </div>
                      
                      <div className="h-px bg-white/10 w-full"></div>
                      
                      <div className="flex flex-col py-4 gap-3 w-full">
                          {outputs.map((opt) => (
                            <div key={opt.id} className="relative flex items-center justify-end h-6 pr-4">
                                <span className="text-sm font-medium text-white mr-2 truncate max-w-[180px]">{opt.label}</span>
                                {/* Port Dot */}
                                <div className="absolute -right-[9px] top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-[#4b5563] border-2 border-[#0D1F12] hover:bg-[#13ec5b] hover:border-[#13ec5b] transition-colors cursor-pointer" title={`Connect from ${opt.label}`}></div>
                            </div>
                          ))}
                      </div>
                      
                      {/* Input Port */}
                      <div className="absolute -left-[9px] top-[44px] size-3.5 rounded-full bg-[#4b5563] border-2 border-[#0D1F12] hover:bg-[#13ec5b] hover:border-[#13ec5b] cursor-pointer transition-colors" title="Input"></div>
                    </>
                  ) : (
                    /* Standard Card Layout */
                    <>
                      <div className="flex items-start gap-3 p-4">
                        <div
                          className={`text-white flex items-center justify-center rounded-lg shrink-0 size-10 ${
                            node.type === "start"
                              ? "bg-primary text-[#112217]"
                              : node.type === "message"
                                ? "bg-blue-500"
                                : node.type === "question"
                                  ? "bg-orange-500"
                                  : "bg-purple-500"
                          }`}
                        >
                          <span className="material-symbols-outlined">
                            {node.type === "start"
                              ? "flag"
                              : node.type === "message"
                                ? "chat"
                                : node.type === "question"
                                  ? "help"
                                  : "call_split"}
                          </span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-zinc-900 dark:text-white truncate">
                            {node.type === "start"
                              ? "Start Flow"
                              : node.data.label ||
                                node.type.charAt(0).toUpperCase() +
                                  node.type.slice(1)}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-gray-400 truncate">
                            {node.data.content ||
                              (node.type === "start"
                                ? "Entry point"
                                : "Click to configure")}
                          </p>
                          {node.type === "question" && node.data.variable && (
                            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded mt-1 inline-block">
                              @{node.data.variable}
                            </span>
                          )}
                        </div>
                        {node.type !== "start" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // prevent drag start on click
                              onOpenConfig(node.id, node.type);
                            }}
                            className="text-zinc-400 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-lg">
                              settings
                            </span>
                          </button>
                        )}
                      </div>
                      
                      {/* Dynamic Outputs for List */}
                      {isBranching && outputs.length > 0 && !isButtons && (
                        <div className="flex flex-col pb-4 w-full">
                          <div className="h-px bg-zinc-200 dark:bg-[#23482f] w-full mb-2"></div>
                          {outputs.map((opt) => (
                            <div key={opt.id} className="relative flex items-center justify-end h-8 pr-0 group/row">
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mr-3 truncate max-w-[180px] group-hover/row:text-primary transition-colors">{opt.label}</span>
                                {/* Port Dot - Absolute positioned relative to this row, aligned to the node edge */}
                                <div className="absolute -right-[5px] size-3 rounded-full bg-white dark:bg-zinc-500 border border-zinc-400 hover:bg-primary hover:border-primary transition-colors cursor-pointer" title={`Connect from ${opt.label}`}></div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Standard Connection Points */}
                      
                      {/* Input (Left) - Not for Start Node */}
                      {node.type !== "start" && (
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 size-3 rounded-full bg-white dark:bg-zinc-500 border border-zinc-400 cursor-pointer hover:border-primary hover:bg-primary transition-colors" title="Input"></div>
                      )}
                      
                      {/* Output (Right) - Only for Non-Branching Nodes */}
                      {!isBranching && (
                         <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 size-3 rounded-full bg-white dark:bg-zinc-500 border border-zinc-400 cursor-pointer hover:border-primary hover:bg-primary transition-colors" title="Output"></div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </main>
      </div>

      {/* Question Type Selection Modal */}
      {pendingDrop && (
        <QuestionTypeModal
          onSelect={handleQuestionTypeSelect}
          onClose={handleQuestionTypeClose}
        />
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in">
          <div className="w-full max-w-md rounded-xl bg-[#193322] border border-white/10 p-6 shadow-2xl">
            <h2 className="text-white text-lg font-bold mb-2">
              Generate Flow with AI
            </h2>
            <p className="text-[#92c9a4] text-sm mb-4">
              Describe what you want your chatbot to do, and Gemini will build it
              for you.
            </p>
            <textarea
              className="w-full rounded-lg border border-white/20 bg-[#112217] px-3 py-2 text-white placeholder:text-white/40 focus:border-primary focus:outline-none h-32 mb-4"
              placeholder="e.g. Create a pizza ordering bot that asks for size, toppings, and address."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={generateAIResponse}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-sm">
                      progress_activity
                    </span>
                    Thinking...
                  </>
                ) : (
                  "Generate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [view, setView] = useState<ViewState>("landing");
  const [configModal, setConfigModal] = useState<{
    nodeId: string;
    type: NodeType;
  } | null>(null);

  // Central Node State
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "start-1",
      type: "start",
      x: 100,
      y: 100,
      data: { label: "Start Flow" },
    },
  ]);

  const handleOpenConfig = (nodeId: string, type: NodeType) => {
    setConfigModal({ nodeId, type });
  };

  const handleSaveConfig = (nodeId: string, newData: NodeData) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, data: newData } : node
      )
    );
  };

  const activeNode = configModal
    ? nodes.find((n) => n.id === configModal.nodeId)
    : null;

  return (
    <>
      {view === "landing" && (
        <LandingPage onStart={() => setView("builder")} />
      )}
      {view === "builder" && (
        <BuilderPage
          nodes={nodes}
          setNodes={setNodes}
          onOpenConfig={handleOpenConfig}
        />
      )}

      {/* Overlays/Modals */}
      {configModal && activeNode && (
        <>
          {configModal.type === "message" && (
            <ConfigMessage
              data={activeNode.data}
              onClose={() => setConfigModal(null)}
              onSave={(d) => handleSaveConfig(activeNode.id, d)}
            />
          )}
          {configModal.type === "question" && (
            <ConfigQuestion
              data={activeNode.data}
              onClose={() => setConfigModal(null)}
              onSave={(d) => handleSaveConfig(activeNode.id, d)}
            />
          )}
          {configModal.type === "condition" && (
            <ConfigCondition
              data={activeNode.data}
              onClose={() => setConfigModal(null)}
              onSave={(d) => handleSaveConfig(activeNode.id, d)}
            />
          )}
        </>
      )}
    </>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}