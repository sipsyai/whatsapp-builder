import { useState } from "react";

// ... Config Components ...
export const ConfigMessage = ({ data, onClose, onSave }: any) => {
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

export const ConfigQuestion = ({ data, onClose, onSave }: any) => {
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

    const addBtn = () => { if (newBtn && buttons.length < 3) { setButtons([...buttons, newBtn]); setNewBtn(""); } };

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
        newS[sIdx].rows = newS[sIdx].rows.filter((_: unknown, i: number) => i !== rIdx);
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

export const ConfigCondition = ({ data, onClose, onSave }: any) => {
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
