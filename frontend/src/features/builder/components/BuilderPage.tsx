import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
    ReactFlow,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    type Node,
    type Edge,
    type ReactFlowInstance,
    type Connection,
} from "@xyflow/react";
import { GoogleGenAI } from "@google/genai";
import { StartNode, MessageNode, QuestionNode, ConditionNode, WhatsAppFlowNode, RestApiNode } from "../../nodes";
import { DeletableEdge } from "../../edges";
import { QuestionTypeModal } from "./QuestionTypeModal";
import { ConfigMessage, ConfigQuestion, ConfigCondition, ConfigWhatsAppFlow } from "./ConfigModals";
import { ConfigRestApi } from "./ConfigRestApi";
import { FlowTester } from "./FlowTester";
import type { NodeDataType } from "../../../shared/types";
import type { ChatBot } from "../../chatbots/api";
import { validateFlow, type ValidationError } from "../utils/flowValidation";
import { getLayoutedElements, type LayoutDirection } from "../utils/autoLayout";
import { generateUUID } from "../../../utils/uuid";

const nodeTypes = {
    start: StartNode,
    message: MessageNode,
    question: QuestionNode,
    condition: ConditionNode,
    whatsapp_flow: WhatsAppFlowNode,
    rest_api: RestApiNode,
};

const edgeTypes = {
    deletable: DeletableEdge,
};

interface BuilderPageProps {
    onSwitchToChat?: () => void;
    initialFlow?: ChatBot;
    onFlowSaved?: (chatbotId: string) => void;
}

export const BuilderPage = ({ onSwitchToChat, initialFlow, onFlowSaved }: BuilderPageProps) => {
    // Flow State
    const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
    const [currentFlowName, setCurrentFlowName] = useState("My Chatbot");
    const [currentFlowDescription, setCurrentFlowDescription] = useState("");

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
        { id: 'start-1', type: 'start', position: { x: 50, y: 50 }, data: { label: 'Start Flow' } }
    ]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [configNode, setConfigNode] = useState<Node | null>(null);

    // Drag & Drop State
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [pendingDropType, setPendingDropType] = useState<NodeDataType | null>(null);
    const [pendingDropPos, setPendingDropPos] = useState<{ x: number, y: number } | null>(null);

    // AI State
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // Validation State
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [showValidationPanel, setShowValidationPanel] = useState(false);

    // Test Mode State
    const [testMode, setTestMode] = useState(false);

    // Auto Layout State
    const [isLayouting, setIsLayouting] = useState(false);

    // Load initial flow when provided
    useEffect(() => {
        if (initialFlow) {
            setCurrentFlowId(initialFlow.id);
            setCurrentFlowName(initialFlow.name);
            setCurrentFlowDescription(initialFlow.description || "");
            if (initialFlow.nodes && initialFlow.nodes.length > 0) {
                setNodes(initialFlow.nodes);
            }
            if (initialFlow.edges && initialFlow.edges.length > 0) {
                // Add id field and type to edges if missing (required by ReactFlow)
                const edgesWithIds = initialFlow.edges.map(edge => ({
                    ...edge,
                    id: edge.id || `${edge.source}-${edge.target}${edge.sourceHandle ? `-${edge.sourceHandle}` : ''}`,
                    type: 'deletable'
                }));
                setEdges(edgesWithIds);
            }
        }
    }, [initialFlow]);

    const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

    // Validate connections before creating them
    const isValidConnection = useCallback((connection: Edge | Connection) => {
        const conn = connection as Connection;

        // Prevent connecting to start node
        const targetNode = nodes.find(n => n.id === conn.target);
        if (targetNode?.type === 'start') {
            return false;
        }

        // Prevent self-connections
        if (conn.source === conn.target) {
            return false;
        }

        // Prevent duplicate connections
        const isDuplicate = edges.some(
            edge => edge.source === conn.source &&
                edge.target === conn.target &&
                edge.sourceHandle === conn.sourceHandle
        );

        return !isDuplicate;
    }, [nodes, edges]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow') as NodeDataType;
            if (typeof type === 'undefined' || !type || !reactFlowInstance) return;

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
                id: generateUUID(),
                type,
                position,
                data: { label: `New ${type}`, type },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const handleQuestionTypeSelect = (subType: "text" | "buttons" | "list") => {
        if (!pendingDropPos) return;

        let label = "Question";
        if (subType === 'buttons') label = "Buttons";
        if (subType === 'list') label = "List";

        const newNode: Node = {
            id: generateUUID(),
            type: 'question',
            position: pendingDropPos,
            data: {
                label,
                questionType: subType,
                type: 'question',
                buttons: subType === 'buttons' ? ['Yes', 'No'] : [],
                listSections: subType === 'list' ? [{ id: '1', title: 'Section', rows: [{ id: 'r1', title: 'Option 1', description: '' }] }] : []
            }
        };
        setNodes((nds) => [...nds, newNode]);
        setPendingDropType(null);
        setPendingDropPos(null);
    };

    // Node Click Handling
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        // Prevent config opening for Start node if not needed
        if (node.type !== 'start') {
            setConfigNode(node);
        }
    }, []);

    const updateNodeData = (newData: any) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === configNode?.id) {
                return { ...node, data: { ...node.data, ...newData } };
            }
            return node;
        }));
    };

    const deleteNode = useCallback((nodeId: string) => {
        // Prevent deleting start node
        if (nodeId === 'start-1') {
            alert('Cannot delete the Start node');
            return;
        }

        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) =>
            edge.source !== nodeId && edge.target !== nodeId
        ));
        setConfigNode(null); // Close config if open
    }, [setNodes, setEdges]);

    // Add onConfig and onDelete to data for all nodes (memoized for performance)
    const nodesWithHandler = useMemo(() => {
        return nodes.map(n => ({
            ...n,
            data: {
                ...n.data,
                onConfig: () => setConfigNode(n),
                onDelete: () => deleteNode(n.id)
            }
        }));
    }, [nodes, deleteNode]);

    // --- AI Generation Logic ---
    const generateAIResponse = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        try {
            // Use VITE_API_KEY from env
            const apiKey = import.meta.env.VITE_API_KEY;
            if (!apiKey) {
                alert("Please set VITE_API_KEY in .env file");
                setIsGenerating(false);
                return;
            }

            const ai = new GoogleGenAI({ apiKey });
            // Using thinking mode as requested
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash-thinking-exp-1219", // Updated model name if needed, keeping generic or specific
                contents: `Create a chatbot flow using React Flow structure. Request: "${aiPrompt}".
        Return JSON with "nodes" and "edges".
        Node types: "start", "message", "question" (w/ questionType: "text"|"buttons"), "condition".
        Coordinates should be spaced out (e.g. x: 0, 300, 600).
        `,
                config: {
                    // thinkingConfig: { thinkingBudget: 32768 }, // Check if supported by SDK version
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
                        data: { ...n.data, onConfig: () => { } } // handlers re-attached in render
                    }));
                    setNodes(mappedNodes);
                    if (result.edges) {
                        // Add deletable type to AI-generated edges
                        const mappedEdges = result.edges.map((e: any) => ({
                            ...e,
                            type: 'deletable'
                        }));
                        setEdges(mappedEdges);
                    }
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

    // NestJS Backend Integration
    const handleSave = async () => {
        // Validate flow before saving
        const errors = validateFlow(nodes, edges);
        setValidationErrors(errors);

        // Check if there are any errors (severity: 'error')
        const hasErrors = errors.some(e => e.severity === 'error');
        const hasWarnings = errors.some(e => e.severity === 'warning');

        if (hasErrors) {
            setShowValidationPanel(true);
            alert('Flow has validation errors. Please fix them before saving.');
            return;
        }

        // If only warnings, ask for confirmation
        if (hasWarnings) {
            setShowValidationPanel(true);
            const confirmed = window.confirm(
                'There are some warnings in your flow. Do you want to continue saving?'
            );
            if (!confirmed) {
                return;
            }
        }

        const payload = {
            name: currentFlowName,
            description: currentFlowDescription || undefined,
            nodes: nodes.map(n => {
                const buttons = (n.data as any).buttons;
                return {
                    id: n.id,
                    type: n.type,
                    position: n.position,
                    data: {
                        ...n.data,
                        // Transform buttons to ButtonItemDto format { id, title } for backend
                        buttons: Array.isArray(buttons)
                            ? buttons.map((btn: any, index: number) =>
                                typeof btn === 'string'
                                    ? { id: `btn_${index}`, title: btn }
                                    : { id: btn.id || `btn_${index}`, title: btn.title }
                              )
                            : undefined,
                        // Remove non-serializable functions
                        onConfig: undefined,
                        onDelete: undefined
                    }
                };
            }),
            edges: edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle }))
        };

        try {
            if (currentFlowId) {
                // Update existing flow
                const { updateChatBot } = await import('../../chatbots/api');
                const data = await updateChatBot(currentFlowId, payload);
                alert(`Flow "${data.name}" updated successfully!`);
                console.log("Updated flow:", data);
                if (onFlowSaved) onFlowSaved(data.id);
            } else {
                // Create new flow
                const { createChatBot } = await import('../../chatbots/api');
                const data = await createChatBot(payload);
                setCurrentFlowId(data.id);
                alert(`Flow "${data.name}" saved successfully! ID: ${data.id}`);
                console.log("Created flow:", data);
                if (onFlowSaved) onFlowSaved(data.id);
            }

            // Clear validation errors on successful save
            setValidationErrors([]);
            setShowValidationPanel(false);
        } catch (error) {
            console.error("Save error:", error);
            alert("Could not save flow. Is the backend running on port 3000?");
        }
    }

    const handleNewFlow = () => {
        if (currentFlowId && !window.confirm('Start a new flow? Unsaved changes will be lost.')) {
            return;
        }
        setCurrentFlowId(null);
        setCurrentFlowName("My Chatbot");
        setCurrentFlowDescription("");
        setNodes([{ id: 'start-1', type: 'start', position: { x: 50, y: 50 }, data: { label: 'Start Flow' } }]);
        setEdges([]);
    }

    const addNode = (type: NodeDataType) => {
        // Calculate position based on existing nodes for better UX
        const position = reactFlowInstance
            ? reactFlowInstance.screenToFlowPosition({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
            })
            : {
                x: 250 + nodes.length * 50,
                y: 250 + nodes.length * 50,
            };

        if (type === 'question') {
            setPendingDropType(type);
            setPendingDropPos(position);
            return;
        }

        const newNode: Node = {
            id: generateUUID(),
            type,
            position,
            data: { label: `New ${type}`, type },
        };

        setNodes((nds) => [...nds, newNode]);
    };

    // Auto Layout Handler
    const handleAutoLayout = useCallback((direction: LayoutDirection = 'TB') => {
        if (nodes.length === 0) return;

        setIsLayouting(true);

        // Small delay for UI feedback
        setTimeout(() => {
            const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges, {
                direction,
                nodeWidth: 280,
                nodeHeight: 80,
                rankSeparation: 100,
                nodeSeparation: 60,
            });

            setNodes(layoutedNodes);

            // Fit view after layout
            if (reactFlowInstance) {
                setTimeout(() => {
                    reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
                }, 50);
            }

            setIsLayouting(false);
        }, 100);
    }, [nodes, edges, setNodes, reactFlowInstance]);

    return (
        <div className="flex h-screen w-full flex-col">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-zinc-200 dark:border-b-[#23482f] px-6 py-3 bg-background-light dark:bg-background-dark z-20">
                <div className="flex items-center gap-4 text-zinc-900 dark:text-white">
                    <div className="size-6 text-primary">
                        <span className="material-symbols-outlined text-primary">smart_toy</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">ChatBot Builder (React Flow + NestJS)</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {currentFlowId ? `Editing: ${currentFlowName}` : 'New Flow'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleNewFlow} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-sm">add</span> New Flow
                    </button>
                    <button onClick={onSwitchToChat} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-sm">chat</span> Preview
                    </button>
                    <button
                        onClick={() => setTestMode(!testMode)}
                        className={`px-4 py-2 ${testMode ? 'bg-primary text-[#112217]' : 'bg-orange-600 text-white'} rounded-lg flex items-center gap-2 text-sm font-bold hover:opacity-90 transition-all`}
                    >
                        <span className="material-symbols-outlined text-sm">{testMode ? 'edit' : 'science'}</span>
                        {testMode ? 'Edit Mode' : 'Test Mode'}
                    </button>
                    <button
                        onClick={() => {
                            const errors = validateFlow(nodes, edges);
                            setValidationErrors(errors);
                            setShowValidationPanel(true);
                            if (errors.length === 0) {
                                alert('Flow validation passed! No issues found.');
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">check_circle</span> Validate
                    </button>
                    <div className="relative group">
                        <button
                            onClick={() => handleAutoLayout('TB')}
                            disabled={isLayouting || nodes.length === 0}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-sm">
                                {isLayouting ? 'sync' : 'account_tree'}
                            </span>
                            {isLayouting ? 'Layouting...' : 'Auto Layout'}
                        </button>
                        {/* Dropdown for layout directions */}
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#193322] border border-zinc-200 dark:border-white/10 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
                            <button
                                onClick={() => handleAutoLayout('TB')}
                                className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#23482f] flex items-center gap-2 rounded-t-lg"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                Top to Bottom
                            </button>
                            <button
                                onClick={() => handleAutoLayout('LR')}
                                className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#23482f] flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                Left to Right
                            </button>
                            <button
                                onClick={() => handleAutoLayout('BT')}
                                className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#23482f] flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                Bottom to Top
                            </button>
                            <button
                                onClick={() => handleAutoLayout('RL')}
                                className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#23482f] flex items-center gap-2 rounded-b-lg"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Right to Left
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setShowAIModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-purple-700 transition-colors">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span> AI Build
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-[#112217] rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                        {currentFlowId ? 'Update Flow' : 'Save Flow'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Test Mode Full Screen */}
                {testMode ? (
                    <FlowTester
                        flowId={currentFlowId || 'new-flow'}
                        nodes={nodes}
                        edges={edges}
                    />
                ) : (
                    <>
                        {/* Sidebar */}
                        <aside className="w-72 bg-background-light dark:bg-background-dark border-r border-zinc-200 dark:border-[#23482f] p-4 z-10 overflow-y-auto">
                    {/* Flow Info Section */}
                    <div className="mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Flow Details</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Flow Name</label>
                                <input
                                    type="text"
                                    value={currentFlowName}
                                    onChange={(e) => setCurrentFlowName(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-[#23482f] border border-zinc-200 dark:border-transparent rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Enter flow name..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description (Optional)</label>
                                <textarea
                                    value={currentFlowDescription}
                                    onChange={(e) => setCurrentFlowDescription(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-[#23482f] border border-zinc-200 dark:border-transparent rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder="Describe what this flow does..."
                                />
                            </div>
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Nodes</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 bg-white dark:bg-[#23482f] rounded-lg cursor-grab border dark:border-transparent shadow-sm flex items-center gap-3" onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'message')} draggable>
                                <span className="material-symbols-outlined text-blue-500">chat</span>
                                <span className="dark:text-white font-medium">Message</span>
                            </div>
                            <button onClick={() => addNode('message')} className="p-3 bg-white dark:bg-[#23482f] rounded-lg border dark:border-transparent shadow-sm hover:bg-gray-50 dark:hover:bg-[#1a3523] text-primary">
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 bg-white dark:bg-[#23482f] rounded-lg cursor-grab border dark:border-transparent shadow-sm flex items-center gap-3" onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'question')} draggable>
                                <span className="material-symbols-outlined text-orange-500">help</span>
                                <span className="dark:text-white font-medium">Question</span>
                            </div>
                            <button onClick={() => addNode('question')} className="p-3 bg-white dark:bg-[#23482f] rounded-lg border dark:border-transparent shadow-sm hover:bg-gray-50 dark:hover:bg-[#1a3523] text-primary">
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 bg-white dark:bg-[#23482f] rounded-lg cursor-grab border dark:border-transparent shadow-sm flex items-center gap-3" onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'condition')} draggable>
                                <span className="material-symbols-outlined text-purple-500">call_split</span>
                                <span className="dark:text-white font-medium">Condition</span>
                            </div>
                            <button onClick={() => addNode('condition')} className="p-3 bg-white dark:bg-[#23482f] rounded-lg border dark:border-transparent shadow-sm hover:bg-gray-50 dark:hover:bg-[#1a3523] text-primary">
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 bg-white dark:bg-[#23482f] rounded-lg cursor-grab border dark:border-transparent shadow-sm flex items-center gap-3" onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'whatsapp_flow')} draggable>
                                <span className="material-symbols-outlined text-green-500">check_box</span>
                                <span className="dark:text-white font-medium">WhatsApp Flow</span>
                            </div>
                            <button onClick={() => addNode('whatsapp_flow')} className="p-3 bg-white dark:bg-[#23482f] rounded-lg border dark:border-transparent shadow-sm hover:bg-gray-50 dark:hover:bg-[#1a3523] text-primary">
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 bg-white dark:bg-[#23482f] rounded-lg cursor-grab border dark:border-transparent shadow-sm flex items-center gap-3" onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'rest_api')} draggable>
                                <span className="material-symbols-outlined text-cyan-500">api</span>
                                <span className="dark:text-white font-medium">REST API</span>
                            </div>
                            <button onClick={() => addNode('rest_api')} className="p-3 bg-white dark:bg-[#23482f] rounded-lg border dark:border-transparent shadow-sm hover:bg-gray-50 dark:hover:bg-[#1a3523] text-primary">
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-600 dark:text-blue-300">
                            <strong>NestJS Integration:</strong>
                            <br />
                            The nodes and edges are sent to `POST /flows`.
                            <br />
                            Ensure the NestJS server is running.
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
                        edgeTypes={edgeTypes}
                        defaultEdgeOptions={{ type: 'deletable' }}
                        isValidConnection={isValidConnection}
                        fitView
                        minZoom={0.5}
                        maxZoom={2}
                        panOnScroll={false}
                        zoomOnDoubleClick={true}
                        className="bg-zinc-100 dark:bg-[#0a160e]"
                    >
                        <Background color="#333" gap={20} />
                        <Controls />
                    </ReactFlow>
                </div>
                    </>
                )}
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
            {configNode && configNode.type === 'whatsapp_flow' && (
                <ConfigWhatsAppFlow data={configNode.data} onClose={() => setConfigNode(null)} onSave={updateNodeData} />
            )}
            {configNode && configNode.type === 'rest_api' && (
                <ConfigRestApi data={configNode.data} onClose={() => setConfigNode(null)} onSave={updateNodeData} />
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

            {/* Validation Errors Panel */}
            {showValidationPanel && validationErrors.length > 0 && (
                <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto bg-white dark:bg-[#193322] border border-zinc-200 dark:border-white/10 rounded-lg shadow-2xl">
                    <div className="sticky top-0 flex items-center justify-between p-4 bg-white dark:bg-[#193322] border-b border-zinc-200 dark:border-white/10">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500">warning</span>
                            Validation Issues
                        </h3>
                        <button
                            onClick={() => setShowValidationPanel(false)}
                            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="p-4 space-y-2">
                        {validationErrors.map((error, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border ${
                                    error.severity === 'error'
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className={`material-symbols-outlined text-sm ${
                                        error.severity === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                                    }`}>
                                        {error.severity === 'error' ? 'error' : 'warning'}
                                    </span>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${
                                            error.severity === 'error'
                                                ? 'text-red-800 dark:text-red-200'
                                                : 'text-yellow-800 dark:text-yellow-200'
                                        }`}>
                                            {error.message}
                                        </p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                            Node: {error.nodeId === 'flow' ? 'Flow Level' : error.nodeId.slice(0, 8)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="sticky bottom-0 p-4 bg-white dark:bg-[#193322] border-t border-zinc-200 dark:border-white/10 flex justify-between items-center">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {validationErrors.filter(e => e.severity === 'error').length} errors, {validationErrors.filter(e => e.severity === 'warning').length} warnings
                        </span>
                        <button
                            onClick={() => setShowValidationPanel(false)}
                            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-lg text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};
