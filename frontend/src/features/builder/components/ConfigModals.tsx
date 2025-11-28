import { useState, useMemo, useEffect } from "react";
import type { ButtonItem, Condition, ConditionGroup } from "@/shared/types";
import { useReactFlow } from "@xyflow/react";
import { flowsApi, type WhatsAppFlow } from "../../flows/api";
import { getActiveDataSources, type DataSource } from "../../data-sources/api";

// ... Config Components ...
export const ConfigMessage = ({ data, onClose, onSave }: any) => {
    const [content, setContent] = useState(data.content || "");
    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm fade-in">
            <div className="w-full max-w-3xl h-full bg-[#102216] shadow-2xl overflow-y-auto flex flex-col border-l border-white/10">
                <div className="p-8 flex-1">
                    <header className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-white">Configure: Send a Message</h1>
                        <button onClick={onClose}><span className="material-symbols-outlined text-white">close</span></button>
                    </header>
                    <label className="block">
                        <span className="text-sm font-medium text-white">Content</span>
                        <textarea className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white min-h-[150px]" value={content} onChange={e => setContent(e.target.value)} placeholder="Type message..." />
                    </label>
                </div>
                <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-white/5 text-white transition-colors">Cancel</button>
                    <button onClick={() => { onSave({ ...data, content }); onClose(); }} className="px-4 py-2 rounded-lg bg-primary text-[#112217] font-bold hover:bg-primary/90 transition-colors">Save</button>
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

    // Buttons Specific - Convert legacy string[] to ButtonItem[] if needed
    const initButtons = (): ButtonItem[] => {
        if (!data.buttons || data.buttons.length === 0) return [];
        // Check if already ButtonItem[] format
        if (typeof data.buttons[0] === 'object' && 'id' in data.buttons[0]) {
            return data.buttons as ButtonItem[];
        }
        // Legacy string[] format - convert to ButtonItem[]
        return (data.buttons as string[]).map((title, i) => ({ id: `btn-${i}`, title }));
    };
    const [buttons, setButtons] = useState<ButtonItem[]>(initButtons());
    const [newBtn, setNewBtn] = useState("");

    // List Specific
    const [listButtonText, setListButtonText] = useState(data.listButtonText || "Main Menu");
    // Default structure if empty
    const [sections, setSections] = useState<any[]>(data.listSections || [
        { id: 's1', title: 'Section 1', rows: [{ id: 'r1', title: 'Option 1', description: '' }] }
    ]);

    // Dynamic List/Buttons Support
    const [listMode, setListMode] = useState<'static' | 'dynamic'>(
        data.dynamicListSource ? 'dynamic' : 'static'
    );
    const [dynamicListSource, setDynamicListSource] = useState(data.dynamicListSource || '');
    const [dynamicLabelField, setDynamicLabelField] = useState(data.dynamicLabelField || 'name');
    const [dynamicDescField, setDynamicDescField] = useState(data.dynamicDescField || '');

    const addBtn = () => {
        if (newBtn.trim() && buttons.length < 3) {
            setButtons([...buttons, { id: `btn-${buttons.length}`, title: newBtn.trim() }]);
            setNewBtn("");
        }
    };

    const removeBtn = (index: number) => {
        const newButtons = buttons.filter((_, i) => i !== index);
        // Re-index remaining buttons with sequential IDs
        newButtons.forEach((btn, i) => { btn.id = `btn-${i}`; });
        setButtons(newButtons);
    };

    const updateBtnTitle = (index: number, title: string) => {
        const newButtons = [...buttons];
        newButtons[index] = { ...newButtons[index], title };
        setButtons(newButtons);
    };

    // List Helpers
    const addSection = () => {
        if (sections.length >= 10) return; // Max 10 sections
        setSections([...sections, { id: `section-${sections.length}`, title: 'New Section', rows: [] }]);
    };
    const removeSection = (idx: number) => {
        setSections(sections.filter((_, i) => i !== idx));
    };
    const updateSectionTitle = (idx: number, val: string) => {
        const newS = [...sections]; newS[idx].title = val; setSections(newS);
    };
    const addRow = (sIdx: number) => {
        const newS = [...sections];
        if (newS[sIdx].rows.length >= 10) return; // Max 10 rows per section
        newS[sIdx].rows.push({ id: `row-${newS[sIdx].rows.length}`, title: 'New Option', description: '' });
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
        const saveData: any = {
            ...data,
            content,
            variable,
            headerText: (isButtons || isList) ? headerText : undefined,
            footerText: (isButtons || isList) ? footerText : undefined
        };

        if (isButtons) {
            saveData.buttons = buttons;
        } else if (isList) {
            if (listMode === 'dynamic') {
                saveData.dynamicListSource = dynamicListSource;
                saveData.dynamicLabelField = dynamicLabelField || 'name';
                saveData.dynamicDescField = dynamicDescField || undefined;
                saveData.listButtonText = listButtonText;
                delete saveData.listSections; // Remove static sections
            } else {
                saveData.listSections = sections;
                saveData.listButtonText = listButtonText;
                delete saveData.dynamicListSource; // Remove dynamic config
                delete saveData.dynamicLabelField;
                delete saveData.dynamicDescField;
            }
        }

        onSave(saveData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm fade-in">
            <div className="w-full max-w-md h-full bg-[#102216] shadow-2xl p-6 flex flex-col border-l border-white/10">
                <h2 className="text-xl font-bold mb-4 text-white">Configure {data.label}</h2>

                <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                    {/* Common: Header (Optional) */}
                    {(isButtons || isList) && (
                        <label className="block">
                            <span className="text-sm font-medium text-gray-300">Header Text (Optional)</span>
                            <input className="w-full mt-1 p-2 border rounded bg-black/20 text-white border-white/10" value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="Header..." maxLength={60} />
                        </label>
                    )}

                    {/* Common: Body/Question Text */}
                    <label className="block">
                        <span className="text-sm font-medium text-gray-300">Body Text (Required)</span>
                        <textarea className="w-full mt-1 p-2 border rounded bg-black/20 text-white border-white/10 min-h-[80px]" value={content} onChange={e => setContent(e.target.value)} placeholder="Ask a question..." maxLength={1024} />
                    </label>

                    {/* Common: Footer (Optional) */}
                    {(isButtons || isList) && (
                        <label className="block">
                            <span className="text-sm font-medium text-gray-300">Footer Text (Optional)</span>
                            <input className="w-full mt-1 p-2 border rounded bg-black/20 text-white border-white/10" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Footer..." maxLength={60} />
                        </label>
                    )}

                    {/* Buttons Configuration */}
                    {isButtons && (
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <span className="text-sm font-bold text-white block mb-2">Buttons (Max 3)</span>
                            <div className="space-y-2">
                                {buttons.map((btn, i) => (
                                    <div key={btn.id} className="flex items-center gap-2">
                                        <input
                                            className="flex-1 p-2 bg-black/20 rounded border border-white/10 text-sm text-white"
                                            value={btn.title}
                                            onChange={(e) => updateBtnTitle(i, e.target.value)}
                                            placeholder="Button title"
                                            maxLength={20}
                                        />
                                        <button onClick={() => removeBtn(i)} className="text-red-500 hover:text-red-400 p-1">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {buttons.length < 3 && (
                                <div className="flex flex-col gap-2 mt-3">
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 border rounded p-2 text-sm bg-black/20 text-white border-white/10"
                                            value={newBtn}
                                            onChange={e => setNewBtn(e.target.value)}
                                            placeholder="New Button Label"
                                            maxLength={20}
                                        />
                                        <button onClick={addBtn} className="bg-primary text-[#112217] px-3 py-1 rounded text-sm font-bold">Add</button>
                                    </div>
                                    <span className="text-xs text-gray-400">(Max 20 chars)</span>
                                </div>
                            )}
                            {buttons.length >= 3 && (
                                <div className="mt-2 text-xs text-amber-400">Maximum 3 buttons reached</div>
                            )}
                        </div>
                    )}

                    {/* List Configuration */}
                    {isList && (
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-medium text-gray-300">List Button Label</span>
                                <input className="w-full mt-1 p-2 border rounded bg-black/20 text-white border-white/10" value={listButtonText} onChange={e => setListButtonText(e.target.value)} placeholder="e.g. Open Menu" maxLength={20} />
                            </label>

                            {/* List Mode Toggle */}
                            <div className="block">
                                <label className="block text-sm font-medium text-white mb-2">List Mode</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setListMode('static')}
                                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${listMode === 'static'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        Static
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setListMode('dynamic')}
                                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${listMode === 'dynamic'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        Dynamic
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic Mode UI */}
                            {listMode === 'dynamic' && (
                                <div className="space-y-4 p-4 bg-blue-900/20 rounded-lg border border-blue-800">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Source Variable (API response)
                                        </label>
                                        <input
                                            type="text"
                                            value={dynamicListSource}
                                            onChange={(e) => setDynamicListSource(e.target.value)}
                                            className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white"
                                            placeholder="e.g., categories, products, brands"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Variable name from REST API Node output
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">
                                                Label Field
                                            </label>
                                            <input
                                                type="text"
                                                value={dynamicLabelField}
                                                onChange={(e) => setDynamicLabelField(e.target.value)}
                                                className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white"
                                                placeholder="name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">
                                                Description Field (optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={dynamicDescField}
                                                onChange={(e) => setDynamicDescField(e.target.value)}
                                                className="w-full p-3 border border-white/20 rounded-lg bg-black/20 text-white"
                                                placeholder="description"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs text-blue-300 space-y-1">
                                        <p>• Source variable must contain an array of objects</p>
                                        <p>• Label field will be used for option titles</p>
                                        <p>• Description field is optional</p>
                                    </div>
                                </div>
                            )}

                            {/* Static Mode UI */}
                            {listMode === 'static' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-white">List Sections (Max 10)</span>
                                    <button onClick={addSection} disabled={sections.length >= 10} className="text-xs text-primary hover:underline disabled:text-gray-400 disabled:cursor-not-allowed">+ Add Section</button>
                                </div>

                                {sections.map((section, sIdx) => (
                                    <div key={section.id} className="border border-white/10 rounded-lg p-3 bg-white/5">
                                        <div className="flex flex-col gap-1 mb-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    className="flex-1 bg-transparent border-b border-dashed border-gray-500 focus:border-primary outline-none text-sm font-bold text-white py-1"
                                                    value={section.title}
                                                    onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                                                    placeholder="Section Title (Optional)"
                                                    maxLength={24}
                                                />
                                                <button onClick={() => removeSection(sIdx)} className="text-red-500 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                                            </div>
                                            <span className="text-xs text-gray-400">(Max 24 chars)</span>
                                        </div>

                                        <div className="space-y-2 pl-2 border-l-2 border-white/10">
                                            {section.rows.map((row: any, rIdx: number) => (
                                                <div key="{row.id}" className="group flex flex-col gap-1 relative bg-black/20 p-2 rounded border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 flex flex-col gap-1">
                                                            <input
                                                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-white placeholder:text-gray-400"
                                                                value={row.title}
                                                                onChange={(e) => updateRow(sIdx, rIdx, 'title', e.target.value)}
                                                                placeholder="Row Title"
                                                                maxLength={24}
                                                            />
                                                            <span className="text-xs text-gray-400">(Max 24 chars)</span>
                                                        </div>
                                                        <button onClick={() => removeRow(sIdx, rIdx)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"><span className="material-symbols-outlined text-sm">close</span></button>
                                                    </div>
                                                    <input
                                                        className="w-full bg-transparent border-none p-0 text-xs text-gray-400 placeholder:text-gray-600"
                                                        value={row.description}
                                                        onChange={(e) => updateRow(sIdx, rIdx, 'description', e.target.value)}
                                                        placeholder="Description (Optional)"
                                                        maxLength={72}
                                                    />
                                                    <span className="text-xs text-gray-400">(Max 72 chars)</span>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addRow(sIdx)}
                                                disabled={section.rows.length >= 10}
                                                className="w-full py-1 text-xs text-center border border-dashed border-gray-600 rounded text-gray-500 hover:text-primary hover:border-primary transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
                                                + Add Row {section.rows.length >= 10 && '(Max 10 reached)'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            )}
                        </div>
                    )}

                    <label className="block pt-4 border-t border-white/10">
                        <span className="text-sm font-medium text-gray-300">Variable Name</span>
                        <input className="w-full mt-1 p-2 border rounded bg-black/20 text-white border-white/10" value={variable} onChange={e => setVariable(e.target.value)} placeholder="e.g. user_choice" />
                    </label>
                </div>

                <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 rounded text-white hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-[#112217] rounded font-bold hover:bg-primary/90 transition-colors">Save</button>
                </div>
            </div>
        </div>
    );
};

export const ConfigCondition = ({ data, onClose, onSave }: any) => {
    const reactFlowInstance = useReactFlow();

    // Operators available
    const operators = [
        { value: "==", label: "Equal To (==)" },
        { value: "!=", label: "Not Equal To (!=)" },
        { value: ">", label: "Greater Than (>)" },
        { value: "<", label: "Less Than (<)" },
        { value: ">=", label: "Greater Than or Equal (>=)" },
        { value: "<=", label: "Less Than or Equal (<=)" },
        { value: "contains", label: "Contains" },
        { value: "not_contains", label: "Does Not Contain" },
    ];

    // Extract available variables from question nodes in the flow
    const availableVariables = useMemo(() => {
        const nodes = reactFlowInstance.getNodes();
        const vars: string[] = [];

        nodes.forEach(node => {
            if (node.type === 'question' && node.data?.variable && typeof node.data.variable === 'string') {
                vars.push(node.data.variable as string);
            }
        });

        return vars;
    }, [reactFlowInstance]);

    // Initialize conditions from data
    const initConditions = (): Condition[] => {
        // Check if new structure exists
        if (data.conditionGroup && data.conditionGroup.conditions.length > 0) {
            return data.conditionGroup.conditions;
        }
        // Check legacy structure
        if (data.conditionVar) {
            return [{
                id: 'cond-0',
                variable: data.conditionVar,
                operator: data.conditionOp || '==',
                value: data.conditionVal || ''
            }];
        }
        // Default empty condition
        return [{
            id: 'cond-0',
            variable: availableVariables[0] || '',
            operator: '==',
            value: ''
        }];
    };

    const [label, setLabel] = useState(data.label || "Condition");
    const [conditions, setConditions] = useState<Condition[]>(initConditions());
    const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>(
        data.conditionGroup?.logicalOperator || 'AND'
    );

    const addCondition = () => {
        if (conditions.length >= 5) return; // Max 5 conditions
        setConditions([
            ...conditions,
            {
                id: `cond-${conditions.length}`,
                variable: availableVariables[0] || '',
                operator: '==',
                value: ''
            }
        ]);
    };

    const removeCondition = (index: number) => {
        if (conditions.length === 1) return; // Must have at least one condition
        const newConditions = conditions.filter((_, i) => i !== index);
        // Re-index
        newConditions.forEach((cond, i) => { cond.id = `cond-${i}`; });
        setConditions(newConditions);
    };

    const updateCondition = (index: number, field: keyof Condition, value: string) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setConditions(newConditions);
    };

    const handleSave = () => {
        // Validation: ensure all conditions have required fields
        const isValid = conditions.every(c => c.variable && c.operator && c.value);
        if (!isValid) {
            alert("Please fill all condition fields");
            return;
        }

        const conditionGroup: ConditionGroup = {
            conditions,
            logicalOperator
        };

        onSave({
            ...data,
            label,
            conditionGroup,
            // Keep legacy fields for backward compatibility
            conditionVar: conditions[0]?.variable,
            conditionOp: conditions[0]?.operator,
            conditionVal: conditions[0]?.value,
        });
        onClose();
    };

    // Generate preview text
    const previewText = useMemo(() => {
        if (conditions.length === 0) return "No conditions defined";

        return conditions.map((cond, idx) => {
            const op = operators.find(o => o.value === cond.operator)?.label || cond.operator;
            const condText = `${cond.variable} ${op} "${cond.value}"`;

            if (idx === conditions.length - 1) return condText;
            return `${condText} ${logicalOperator}`;
        }).join(' ');
    }, [conditions, logicalOperator]);

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm fade-in">
            <div className="w-full max-w-2xl h-full bg-[#102216] shadow-2xl overflow-y-auto flex flex-col border-l border-white/10">
                <div className="p-8 flex-1">
                    <header className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-white">Configure: Condition</h1>
                        <button onClick={onClose}>
                            <span className="material-symbols-outlined text-white">close</span>
                        </button>
                    </header>

                    <div className="space-y-6">
                        {/* Label */}
                        <label className="block">
                            <span className="text-sm font-medium text-white">Label</span>
                            <input
                                className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                placeholder="e.g. Check Age"
                            />
                        </label>

                        {/* Available Variables Info */}
                        {availableVariables.length === 0 && (
                            <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-amber-400 text-lg">warning</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-300">No variables available</p>
                                        <p className="text-xs text-amber-400 mt-1">
                                            Add Question nodes with variable names before this condition node to make them available for comparison.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Conditions */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white">Conditions {conditions.length > 1 && `(${conditions.length})`}</span>
                                {conditions.length < 5 && (
                                    <button
                                        onClick={addCondition}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                        disabled={availableVariables.length === 0}
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        Add Condition
                                    </button>
                                )}
                            </div>

                            {conditions.map((condition, index) => (
                                <div key={condition.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-xs font-medium text-gray-400">
                                            Condition {index + 1}
                                        </span>
                                        {conditions.length > 1 && (
                                            <button
                                                onClick={() => removeCondition(index)}
                                                className="text-red-500 hover:text-red-400"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {/* Variable Selection */}
                                        <label className="block">
                                            <span className="text-xs font-medium text-gray-300">Variable</span>
                                            <select
                                                className="w-full mt-1 p-2 rounded border bg-black/20 text-white border-white/10"
                                                value={condition.variable}
                                                onChange={e => updateCondition(index, 'variable', e.target.value)}
                                                disabled={availableVariables.length === 0}
                                            >
                                                {availableVariables.length === 0 ? (
                                                    <option value="">No variables available</option>
                                                ) : (
                                                    <>
                                                        <option value="">Select variable...</option>
                                                        {availableVariables.map(v => (
                                                            <option key={v} value={v}>{v}</option>
                                                        ))}
                                                    </>
                                                )}
                                            </select>
                                        </label>

                                        {/* Operator Selection */}
                                        <label className="block">
                                            <span className="text-xs font-medium text-gray-300">Operator</span>
                                            <select
                                                className="w-full mt-1 p-2 rounded border bg-black/20 text-white border-white/10"
                                                value={condition.operator}
                                                onChange={e => updateCondition(index, 'operator', e.target.value)}
                                            >
                                                {operators.map(op => (
                                                    <option key={op.value} value={op.value}>{op.label}</option>
                                                ))}
                                            </select>
                                        </label>

                                        {/* Value Input */}
                                        <label className="block">
                                            <span className="text-xs font-medium text-gray-300">Value</span>
                                            <input
                                                className="w-full mt-1 p-2 rounded border bg-black/20 text-white border-white/10"
                                                value={condition.value}
                                                onChange={e => updateCondition(index, 'value', e.target.value)}
                                                placeholder="Enter comparison value..."
                                            />
                                        </label>
                                    </div>

                                    {/* Logical operator between conditions */}
                                    {index < conditions.length - 1 && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setLogicalOperator('AND')}
                                                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                                                        logicalOperator === 'AND'
                                                            ? 'bg-primary text-[#112217]'
                                                            : 'bg-black/20 text-gray-400 border border-white/10'
                                                    }`}
                                                >
                                                    AND
                                                </button>
                                                <button
                                                    onClick={() => setLogicalOperator('OR')}
                                                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                                                        logicalOperator === 'OR'
                                                            ? 'bg-primary text-[#112217]'
                                                            : 'bg-black/20 text-gray-400 border border-white/10'
                                                    }`}
                                                >
                                                    OR
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {conditions.length >= 5 && (
                                <div className="text-xs text-amber-600 text-amber-400">
                                    Maximum 5 conditions reached
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-400 text-lg">visibility</span>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-blue-300 mb-1">Condition Preview</p>
                                    <p className="text-sm text-blue-400 font-mono">
                                        {previewText}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Help Text */}
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>• Variables come from previous Question nodes in your flow</p>
                            <p>• Use AND when all conditions must be true</p>
                            <p>• Use OR when any condition can be true</p>
                            <p>• String comparisons are case-sensitive</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg hover:bg-zinc-100 hover:bg-white/5 text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-primary text-[#112217] font-bold hover:bg-primary/90 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ConfigWhatsAppFlow = ({ data, onClose, onSave }: any) => {
    const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDataSources, setLoadingDataSources] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [label, setLabel] = useState(data.label || "WhatsApp Flow");
    const [selectedFlowId, setSelectedFlowId] = useState(data.whatsappFlowId || "");
    const [manualFlowId, setManualFlowId] = useState(""); // Manual Flow ID input
    const [selectedDataSourceId, setSelectedDataSourceId] = useState(data.dataSourceId || "");
    const [flowCta, setFlowCta] = useState(data.flowCta || "Start");
    const [flowMode, setFlowMode] = useState<'navigate' | 'data_exchange'>(data.flowMode || "navigate");
    const [bodyText, setBodyText] = useState(data.flowBodyText || "");
    const [headerText, setHeaderText] = useState(data.flowHeaderText || "");
    const [footerText, setFooterText] = useState(data.flowFooterText || "");
    const [outputVariable, setOutputVariable] = useState(data.flowOutputVariable || "");
    const [initialScreen, setInitialScreen] = useState(data.flowInitialScreen || "");
    const [initialDataJson, setInitialDataJson] = useState(
        data.flowInitialData ? JSON.stringify(data.flowInitialData, null, 2) : ""
    );

    // Load available flows and data sources
    useEffect(() => {
        const loadFlows = async () => {
            try {
                setLoading(true);
                // Fetch active/published flows for chatbot use
                const activeFlows = await flowsApi.getActive();
                setFlows(activeFlows);
            } catch (err) {
                setError("Failed to load WhatsApp Flows");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const loadDataSources = async () => {
            try {
                setLoadingDataSources(true);
                const activeSources = await getActiveDataSources();
                setDataSources(activeSources);
            } catch (err) {
                console.error("Failed to load data sources:", err);
            } finally {
                setLoadingDataSources(false);
            }
        };

        loadFlows();
        loadDataSources();
    }, []);

    const selectedFlow = useMemo(() => {
        return flows.find(f => f.whatsappFlowId === selectedFlowId);
    }, [flows, selectedFlowId]);

    const handleSave = () => {
        // Use manual Flow ID if provided, otherwise use selected Flow ID
        const finalFlowId = manualFlowId.trim() || selectedFlowId;

        if (!finalFlowId) {
            alert("Please select a WhatsApp Flow or enter a Flow ID manually");
            return;
        }

        if (!flowCta.trim()) {
            alert("Please enter a button text (CTA)");
            return;
        }

        if (!bodyText.trim()) {
            alert("Please enter body text");
            return;
        }

        // Parse initial data JSON if provided
        let parsedInitialData: Record<string, any> | undefined;
        if (initialDataJson.trim()) {
            try {
                parsedInitialData = JSON.parse(initialDataJson);
            } catch {
                alert("Invalid JSON in initial data field");
                return;
            }
        }

        onSave({
            ...data,
            label,
            whatsappFlowId: finalFlowId,
            dataSourceId: selectedDataSourceId || undefined,
            flowCta,
            flowMode,
            flowBodyText: bodyText,
            flowHeaderText: headerText || undefined,
            flowFooterText: footerText || undefined,
            flowOutputVariable: outputVariable || undefined,
            flowInitialScreen: initialScreen || undefined,
            flowInitialData: parsedInitialData,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm fade-in">
            <div className="w-full max-w-2xl h-full bg-[#102216] shadow-2xl overflow-y-auto flex flex-col border-l border-white/10">
                <div className="p-8 flex-1">
                    <header className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-white">Configure: WhatsApp Flow</h1>
                        <button onClick={onClose}>
                            <span className="material-symbols-outlined text-white">close</span>
                        </button>
                    </header>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-3 text-white">Loading flows...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                            <p className="text-red-300">{error}</p>
                        </div>
                    ) : flows.length === 0 ? (
                        <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-amber-400">warning</span>
                                <div>
                                    <p className="font-medium text-amber-300">No Published Flows Available</p>
                                    <p className="text-sm text-amber-400 mt-1">
                                        You need to create and publish a WhatsApp Flow first. Go to the Flows page to create one.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Label */}
                            <label className="block">
                                <span className="text-sm font-medium text-white">Node Label</span>
                                <input
                                    className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    placeholder="e.g. Booking Form"
                                />
                            </label>

                            {/* Flow Selection Dropdown */}
                            <div className="space-y-2">
                                <label className="block">
                                    <span className="text-sm font-medium text-white">WhatsApp Flow</span>
                                    <select
                                        className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
                                        value={selectedFlowId}
                                        onChange={e => {
                                            setSelectedFlowId(e.target.value);
                                            setManualFlowId(""); // Clear manual input when selecting from dropdown
                                        }}
                                        disabled={loading || !!manualFlowId}
                                    >
                                        <option value="">-- Select a Flow --</option>
                                        {flows.map(flow => (
                                            <option key={flow.id} value={flow.whatsappFlowId}>
                                                {flow.name} ({flow.whatsappFlowId})
                                            </option>
                                        ))}
                                    </select>
                                    {loading && <span className="text-xs text-zinc-500 mt-1 block">Loading flows...</span>}
                                </label>

                                {selectedFlow && !manualFlowId && (
                                    <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
                                        <p className="text-sm text-green-300">
                                            <strong>Selected:</strong> {selectedFlow.name}
                                        </p>
                                        {selectedFlow.description && (
                                            <p className="text-xs text-green-400 mt-1">{selectedFlow.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Manual Flow ID Input */}
                            <div className="space-y-2">
                                <label className="block">
                                    <span className="text-sm font-medium text-zinc-400">Or enter Flow ID manually</span>
                                    <input
                                        type="text"
                                        value={manualFlowId}
                                        onChange={e => {
                                            setManualFlowId(e.target.value);
                                            if (e.target.value.trim()) {
                                                setSelectedFlowId(""); // Clear dropdown selection when entering manual ID
                                            }
                                        }}
                                        placeholder="e.g., 1234567890123456"
                                        className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10 placeholder:text-zinc-600"
                                        disabled={!!selectedFlowId}
                                    />
                                    <span className="text-xs text-zinc-500 mt-1 block">
                                        Enter a WhatsApp Flow ID if it's not in the list above
                                    </span>
                                </label>
                            </div>

                            {/* Data Source Configuration (Optional) */}
                            <div className="space-y-4 p-4 bg-blue-900/20 rounded-lg border border-blue-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-blue-400">database</span>
                                    <span className="text-sm font-bold text-white">Data Source Configuration (Optional)</span>
                                </div>

                                {/* Data Source Selector */}
                                <label className="block">
                                    <span className="text-sm font-medium text-white">Data Source</span>
                                    <select
                                        className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
                                        value={selectedDataSourceId}
                                        onChange={e => setSelectedDataSourceId(e.target.value)}
                                        disabled={loadingDataSources}
                                    >
                                        <option value="">-- Select a Data Source --</option>
                                        {dataSources.map(ds => (
                                            <option key={ds.id} value={ds.id}>
                                                {ds.name} ({ds.type})
                                            </option>
                                        ))}
                                    </select>
                                    {loadingDataSources && <span className="text-xs text-zinc-500 mt-1 block">Loading data sources...</span>}
                                </label>

                                <p className="text-xs text-blue-300">
                                    Configure a data source if this flow requires backend data for dynamic content
                                </p>
                            </div>

                            {/* Body Text */}
                            <label className="block">
                                <span className="text-sm font-medium text-white">Body Text *</span>
                                <textarea
                                    className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10 min-h-[80px]"
                                    value={bodyText}
                                    onChange={e => setBodyText(e.target.value)}
                                    placeholder="Message shown before the flow button..."
                                    maxLength={1024}
                                />
                                <span className="text-xs text-gray-400">{bodyText.length}/1024 chars</span>
                            </label>

                            {/* CTA Button Text */}
                            <label className="block">
                                <span className="text-sm font-medium text-white">Button Text (CTA) *</span>
                                <input
                                    className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
                                    value={flowCta}
                                    onChange={e => setFlowCta(e.target.value)}
                                    placeholder="e.g. Start, Open Form, Book Now"
                                    maxLength={20}
                                />
                                <span className="text-xs text-gray-400">{flowCta.length}/20 chars (no emoji)</span>
                            </label>

                            {/* Flow Mode */}
                            <div className="block">
                                <span className="text-sm font-medium text-white block mb-2">Flow Mode</span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setFlowMode('navigate')}
                                        className={`flex-1 p-3 rounded-lg border transition-colors ${
                                            flowMode === 'navigate'
                                                ? 'bg-primary text-[#112217] border-primary'
                                                : 'bg-black/20 text-white border-white/10'
                                        }`}
                                    >
                                        <span className="font-bold block">Navigate</span>
                                        <span className="text-xs opacity-75">Static flow, no backend</span>
                                    </button>
                                    <button
                                        onClick={() => setFlowMode('data_exchange')}
                                        className={`flex-1 p-3 rounded-lg border transition-colors ${
                                            flowMode === 'data_exchange'
                                                ? 'bg-primary text-[#112217] border-primary'
                                                : 'bg-black/20 text-white border-white/10'
                                        }`}
                                    >
                                        <span className="font-bold block">Data Exchange</span>
                                        <span className="text-xs opacity-75">Dynamic, with backend</span>
                                    </button>
                                </div>
                            </div>

                            {/* Header Text (Optional) */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-300">Header Text (Optional)</span>
                                <input
                                    className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
                                    value={headerText}
                                    onChange={e => setHeaderText(e.target.value)}
                                    placeholder="Optional header..."
                                    maxLength={60}
                                />
                            </label>

                            {/* Footer Text (Optional) */}
                            <label className="block">
                                <span className="text-sm font-medium text-gray-300">Footer Text (Optional)</span>
                                <input
                                    className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
                                    value={footerText}
                                    onChange={e => setFooterText(e.target.value)}
                                    placeholder="Optional footer..."
                                    maxLength={60}
                                />
                            </label>

                            {/* Output Variable */}
                            <label className="block pt-4 border-t border-white/10">
                                <span className="text-sm font-medium text-white">Output Variable (Optional)</span>
                                <input
                                    className="w-full mt-2 p-3 rounded-lg border bg-black/20 text-white border-white/10"
                                    value={outputVariable}
                                    onChange={e => setOutputVariable(e.target.value)}
                                    placeholder="e.g. flow_response"
                                />
                                <span className="text-xs text-gray-400">
                                    Store flow response in this variable for use in subsequent nodes
                                </span>
                            </label>

                            {/* Advanced: Initial Screen (for navigate mode) */}
                            {flowMode === 'navigate' && (
                                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                    <span className="text-sm font-bold text-white block mb-3">Advanced Options</span>

                                    <label className="block mb-4">
                                        <span className="text-xs font-medium text-gray-300">Initial Screen ID</span>
                                        <input
                                            className="w-full mt-1 p-2 rounded border bg-black/20 text-white border-white/10 text-sm"
                                            value={initialScreen}
                                            onChange={e => setInitialScreen(e.target.value)}
                                            placeholder="e.g. WELCOME_SCREEN"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-xs font-medium text-gray-300">Initial Data (JSON)</span>
                                        <textarea
                                            className="w-full mt-1 p-2 rounded border bg-black/20 text-white border-white/10 text-sm font-mono min-h-[80px]"
                                            value={initialDataJson}
                                            onChange={e => setInitialDataJson(e.target.value)}
                                            placeholder='{"customer_name": "{{name}}", "order_id": "{{order_id}}"}'
                                        />
                                        <span className="text-xs text-gray-400">
                                            Use {"{{variable}}"} syntax for dynamic values
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Help Text */}
                            <div className="text-xs text-gray-400 space-y-1 pt-4 border-t border-white/10">
                                <p>• Select a flow from the dropdown or enter a Flow ID manually</p>
                                <p>• Only active/published WhatsApp Flows appear in the dropdown</p>
                                <p>• Navigate mode: Static forms with predefined screens</p>
                                <p>• Data Exchange mode: Dynamic flows with backend interaction</p>
                                <p>• Flow responses can be stored in a variable for later use</p>
                                <p>• Data sources are only needed for data_exchange mode flows</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg hover:bg-zinc-100 hover:bg-white/5 text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-primary text-[#112217] font-bold hover:bg-primary/90 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
