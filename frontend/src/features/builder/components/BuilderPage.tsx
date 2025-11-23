import React, { useState, useCallback, useRef, useMemo } from "react";
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
import { StartNode, MessageNode, QuestionNode, ConditionNode } from "../../nodes";
import { QuestionTypeModal } from "./QuestionTypeModal";
import { ConfigMessage, ConfigQuestion, ConfigCondition } from "./ConfigModals";
import type { NodeDataType } from "../../../shared/types";

const nodeTypes = {
    start: StartNode,
    message: MessageNode,
    question: QuestionNode,
    condition: ConditionNode,
};

interface BuilderPageProps {
    onSwitchToChat?: () => void;
}

export const BuilderPage = ({ onSwitchToChat }: BuilderPageProps) => {
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
        if (!pendingDropPos) return;

        let label = "Question";
        if (subType === 'buttons') label = "Buttons";
        if (subType === 'list') label = "List";

        const newNode: Node = {
            id: crypto.randomUUID(),
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

    // Add onConfig to data for all nodes (memoized for performance)
    const nodesWithHandler = useMemo(() => {
        return nodes.map(n => ({
            ...n,
            data: {
                ...n.data,
                onConfig: () => setConfigNode(n)
            }
        }));
    }, [nodes]);

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
                    if (result.edges) setEdges(result.edges);
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
        const payload = {
            name: "My Chatbot",
            nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
            edges: edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle }))
        };

        try {
            // Use the API client instead of direct fetch
            const { createFlow } = await import('../../flows/api');
            const data = await createFlow(payload);
            alert(`Flow saved successfully! ID: ${data.id}`);
            console.log("Saved flow:", data);
        } catch (error) {
            console.error("Network error:", error);
            alert("Could not connect to backend (NestJS). Is it running on port 3000?");
        }
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
            id: crypto.randomUUID(),
            type,
            position,
            data: { label: `New ${type}`, type },
        };

        setNodes((nds) => [...nds, newNode]);
    };

    return (
        <div className="flex h-screen w-full flex-col">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-zinc-200 dark:border-b-[#23482f] px-6 py-3 bg-background-light dark:bg-background-dark z-20">
                <div className="flex items-center gap-4 text-zinc-900 dark:text-white">
                    <div className="size-6 text-primary">
                        <span className="material-symbols-outlined text-primary">smart_toy</span>
                    </div>
                    <h2 className="text-lg font-bold">ChatBot Builder (React Flow + NestJS)</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={onSwitchToChat} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-sm">chat</span> Preview
                    </button>
                    <button onClick={() => setShowAIModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 text-sm font-bold">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span> AI Build
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-[#112217] rounded-lg text-sm font-bold">Save to Backend</button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-72 bg-background-light dark:bg-background-dark border-r border-zinc-200 dark:border-[#23482f] p-4 z-10">
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
