import React, { useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { NodeData } from '../../../shared/types';

interface Message {
  id: string;
  role: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface FlowTesterProps {
  flowId: string;
  nodes: Node[];
  edges: Edge[];
}

export const FlowTester: React.FC<FlowTesterProps> = ({ nodes, edges }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [isActive, setIsActive] = useState(false);
  const [showVariables, setShowVariables] = useState(true);

  // Replace variables in text with their values
  const replaceVariables = (text: string, vars: Record<string, any>): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return vars[varName] ?? match;
    });
  };

  // Add bot message to chat
  const addBotMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: `bot-${Date.now()}`,
      role: 'bot',
      content,
      timestamp: new Date()
    }]);
  };

  // Add user message to chat
  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  // Find next node based on source and optional handle
  const findNextNode = (sourceId: string, sourceHandle?: string): Node | null => {
    const edge = edges.find(e =>
      e.source === sourceId &&
      (!sourceHandle || e.sourceHandle === sourceHandle)
    );
    if (!edge) return null;
    return nodes.find(n => n.id === edge.target) || null;
  };

  // Evaluate condition for condition nodes
  const evaluateCondition = (conditionVar?: string, conditionOp?: string, conditionVal?: string): boolean => {
    if (!conditionVar || !conditionOp || !conditionVal) return false;

    const varValue = variables[conditionVar];
    if (varValue === undefined) return false;

    const varStr = String(varValue).toLowerCase();
    const condStr = String(conditionVal).toLowerCase();

    switch (conditionOp) {
      case '==':
      case 'equals':
        return varStr === condStr;
      case '!=':
      case 'not equals':
        return varStr !== condStr;
      case 'contains':
        return varStr.includes(condStr);
      case 'starts with':
        return varStr.startsWith(condStr);
      case 'ends with':
        return varStr.endsWith(condStr);
      case '>':
        return parseFloat(varStr) > parseFloat(condStr);
      case '<':
        return parseFloat(varStr) < parseFloat(condStr);
      case '>=':
        return parseFloat(varStr) >= parseFloat(condStr);
      case '<=':
        return parseFloat(varStr) <= parseFloat(condStr);
      default:
        return false;
    }
  };

  // Simulate flow execution for a given node
  const simulateExecution = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      console.warn('Node not found:', nodeId);
      setIsActive(false);
      return;
    }

    const nodeData = node.data as unknown as NodeData;

    switch (node.type) {
      case 'start':
        // Move to next node immediately
        const nextNode = findNextNode(nodeId);
        if (nextNode) {
          setTimeout(() => simulateExecution(nextNode.id), 300);
        } else {
          setIsActive(false);
        }
        break;

      case 'message':
        // Add bot message and auto-proceed
        const content = replaceVariables(nodeData.content || 'Message', variables);
        addBotMessage(content);

        const next = findNextNode(nodeId);
        if (next) {
          setTimeout(() => simulateExecution(next.id), 500);
        } else {
          setIsActive(false);
          addBotMessage('Flow ended. Thank you!');
        }
        break;

      case 'question':
        // Add bot question and wait for user response
        const questionContent = replaceVariables(nodeData.content || 'Question', variables);
        addBotMessage(questionContent);
        setCurrentNodeId(nodeId);
        break;

      case 'condition':
        // Evaluate condition and proceed to true/false path
        const conditionResult = evaluateCondition(
          nodeData.conditionVar,
          nodeData.conditionOp,
          nodeData.conditionVal
        );

        const conditionNext = findNextNode(nodeId, conditionResult ? 'true' : 'false');
        if (conditionNext) {
          setTimeout(() => simulateExecution(conditionNext.id), 300);
        } else {
          setIsActive(false);
          addBotMessage(`Flow ended at condition (${conditionResult ? 'true' : 'false'} path not connected).`);
        }
        break;

      case 'whatsapp_flow':
        // Simulate WhatsApp Flow - show flow message and wait for "completion"
        const flowBodyText = replaceVariables(nodeData.flowBodyText || 'Please complete this form', variables);
        const flowCta = nodeData.flowCta || 'Start';

        addBotMessage(`📋 ${flowBodyText}\n\n[WhatsApp Flow Button: "${flowCta}"]`);

        // In test mode, simulate flow completion after a short delay
        addBotMessage(`⏳ Simulating WhatsApp Flow completion...`);

        // If there's an output variable, simulate storing a response
        if (nodeData.flowOutputVariable) {
          setVariables(prev => ({
            ...prev,
            [nodeData.flowOutputVariable!]: { simulated: true, timestamp: new Date().toISOString() }
          }));
        }

        const flowNext = findNextNode(nodeId);
        if (flowNext) {
          setTimeout(() => {
            addBotMessage(`✅ WhatsApp Flow completed successfully`);
            setTimeout(() => simulateExecution(flowNext.id), 300);
          }, 1000);
        } else {
          setTimeout(() => {
            addBotMessage(`✅ WhatsApp Flow completed. Flow ended.`);
            setIsActive(false);
          }, 1000);
        }
        break;

      default:
        console.warn('Unknown node type:', node.type);
        setIsActive(false);
        break;
    }
  };

  // Handle user response to questions
  const handleUserResponse = (response: string, handleId?: string) => {
    addUserMessage(response);

    // Save to variables if applicable
    const currentNode = nodes.find(n => n.id === currentNodeId);
    const currentData = currentNode?.data as NodeData | undefined;

    if (currentData?.variable) {
      setVariables(prev => ({
        ...prev,
        [currentData.variable!]: response
      }));
    }

    // Find next node
    const nextNode = findNextNode(currentNodeId, handleId);
    if (nextNode) {
      setCurrentNodeId('');
      setTimeout(() => simulateExecution(nextNode.id), 300);
    } else {
      setIsActive(false);
      setCurrentNodeId('');
      addBotMessage('Flow ended. Thank you!');
    }
  };

  // Start the test
  const startTest = () => {
    setMessages([]);
    setVariables({});
    setCurrentNodeId('');
    setIsActive(true);

    const startNode = nodes.find(n => n.type === 'start');
    if (startNode) {
      addBotMessage('Test started. Simulating flow execution...');
      setTimeout(() => simulateExecution(startNode.id), 500);
    } else {
      addBotMessage('Error: No start node found in this flow.');
      setIsActive(false);
    }
  };

  // Reset test
  const resetTest = () => {
    setMessages([]);
    setVariables({});
    setCurrentNodeId('');
    setIsActive(false);
    setInputText('');
  };

  const currentNode = nodes.find(n => n.id === currentNodeId);
  const currentData = currentNode?.data as NodeData | undefined;
  const isWaitingForResponse = currentNode?.type === 'question';

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#23482f] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">science</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Test Mode</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Simulate flow execution</p>
          </div>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <button
              onClick={resetTest}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Reset
            </button>
          )}
          <button
            onClick={startTest}
            disabled={isActive && currentNodeId === ''}
            className="px-4 py-2 bg-primary text-[#112217] rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            Start Test
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="size-16 bg-zinc-100 dark:bg-[#23482f] rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-zinc-400">chat_bubble_outline</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Click "Start Test" to begin simulating your flow
                </p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === 'bot'
                        ? 'bg-zinc-100 dark:bg-[#23482f] text-zinc-900 dark:text-white'
                        : 'bg-primary text-[#112217]'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${
                      msg.role === 'bot' ? 'text-zinc-500 dark:text-zinc-400' : 'text-[#112217]/70'
                    }`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Response Area */}
          {isWaitingForResponse && currentData && (
            <div className="border-t border-zinc-200 dark:border-[#23482f] p-6 bg-white dark:bg-[#0a160e]">
              {currentData.questionType === 'buttons' && currentData.buttons && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Select an option:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {currentData.buttons.map((btn, index) => {
                      const btnText = typeof btn === 'string' ? btn : btn.title;
                      return (
                        <button
                          key={`btn-${index}`}
                          onClick={() => handleUserResponse(btnText, `btn-${index}`)}
                          className="px-4 py-3 bg-zinc-100 dark:bg-[#23482f] hover:bg-primary hover:text-[#112217] dark:hover:bg-primary text-zinc-900 dark:text-white rounded-lg text-sm font-medium transition-colors border border-zinc-200 dark:border-transparent"
                        >
                          {btnText}
                        </button>
                      );
                    })}
                  </div>
                  {/* Default option */}
                  <button
                    onClick={() => handleUserResponse('(No selection)', 'default')}
                    className="w-full mt-2 px-4 py-2 bg-zinc-50 dark:bg-[#1a3523] hover:bg-zinc-100 dark:hover:bg-[#23482f] text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-medium transition-colors border border-dashed border-zinc-300 dark:border-zinc-600"
                  >
                    Skip / Default Path
                  </button>
                </div>
              )}

              {currentData.questionType === 'list' && currentData.listSections && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Select from list:</p>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const [rowId, rowTitle] = e.target.value.split('::');
                        handleUserResponse(rowTitle, rowId);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-3 bg-white dark:bg-[#23482f] border border-zinc-200 dark:border-transparent rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    defaultValue=""
                  >
                    <option value="" disabled>Choose an option...</option>
                    {currentData.listSections.map((section) => (
                      <optgroup key={section.id} label={section.title}>
                        {section.rows.map((row) => (
                          <option key={row.id} value={`${row.id}::${row.title}`}>
                            {row.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <button
                    onClick={() => handleUserResponse('(No selection)', 'default')}
                    className="w-full mt-2 px-4 py-2 bg-zinc-50 dark:bg-[#1a3523] hover:bg-zinc-100 dark:hover:bg-[#23482f] text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-medium transition-colors border border-dashed border-zinc-300 dark:border-zinc-600"
                  >
                    Skip / Default Path
                  </button>
                </div>
              )}

              {currentData.questionType === 'text' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your answer..."
                    className="flex-1 px-4 py-3 bg-white dark:bg-[#23482f] border border-zinc-200 dark:border-transparent rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && inputText.trim()) {
                        handleUserResponse(inputText);
                        setInputText('');
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (inputText.trim()) {
                        handleUserResponse(inputText);
                        setInputText('');
                      }
                    }}
                    disabled={!inputText.trim()}
                    className="px-6 py-3 bg-primary text-[#112217] rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {!isWaitingForResponse && isActive && (
            <div className="border-t border-zinc-200 dark:border-[#23482f] p-4 bg-zinc-50 dark:bg-[#0a160e]">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <div className="size-2 bg-primary rounded-full animate-pulse"></div>
                <p className="text-xs">Processing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Variables Panel */}
        {Object.keys(variables).length > 0 && (
          <div className="w-80 border-l border-zinc-200 dark:border-[#23482f] bg-white dark:bg-[#0a160e] flex flex-col">
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-[#23482f] cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#112217] transition-colors"
              onClick={() => setShowVariables(!showVariables)}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">code</span>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Variables</h4>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  ({Object.keys(variables).length})
                </span>
              </div>
              <span className={`material-symbols-outlined text-zinc-400 transition-transform ${showVariables ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </div>
            {showVariables && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {Object.entries(variables).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-zinc-50 dark:bg-[#23482f] rounded-lg p-3 border border-zinc-200 dark:border-transparent"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-xs">variable</span>
                        <p className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                          {key}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 ml-5 break-words">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
