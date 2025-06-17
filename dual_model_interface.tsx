import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, RotateCcw, User, Bot, Menu } from 'lucide-react';

const DualModelInterface = () => {
  // Mock models with different configurations
  const models = {
    'gpt-3.5-turbo': {
      name: 'GPT-3.5 Turbo',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      temperature: 0.7,
      maxTokens: 1000,
      color: 'bg-green-500',
      avatar: '🤖'
    },
    'gpt-4': {
      name: 'GPT-4',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      temperature: 0.7,
      maxTokens: 1500,
      color: 'bg-blue-500',
      avatar: '🧠'
    },
    'claude-3': {
      name: 'Claude-3',
      endpoint: 'https://api.anthropic.com/v1/messages',
      temperature: 0.8,
      maxTokens: 2000,
      color: 'bg-purple-500',
      avatar: '🎭'
    },
    'local-llama': {
      name: 'Local Llama',
      endpoint: 'http://localhost:11434/api/generate',
      temperature: 0.6,
      maxTokens: 1200,
      color: 'bg-orange-500',
      avatar: '🦙'
    }
  };

  // State for each pane
  const [leftPane, setLeftPane] = useState({
    selectedModel: 'gpt-3.5-turbo',
    input: '',
    conversation: [],
    loading: false,
    error: null
  });

  const [rightPane, setRightPane] = useState({
    selectedModel: 'gpt-4',
    input: '',
    conversation: [],
    loading: false,
    error: null
  });

  const [mirrorInputs, setMirrorInputs] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for auto-scrolling
  const leftChatRef = useRef(null);
  const rightChatRef = useRef(null);
  const dividerRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = (ref) => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(leftChatRef);
  }, [leftPane.conversation, leftPane.loading]);

  useEffect(() => {
    scrollToBottom(rightChatRef);
  }, [rightPane.conversation, rightPane.loading]);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const container = dividerRef.current?.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Constrain between 20% and 80%
      const constrainedWidth = Math.min(Math.max(newLeftWidth, 20), 80);
      setLeftWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Mock API call function
  const callModel = async (modelKey, prompt) => {
    const model = models[modelKey];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate random errors (10% chance)
    if (Math.random() < 0.1) {
      throw new Error(`${model.name} is currently unavailable. Please try again later.`);
    }
    
    // Mock different response styles based on model
    const responses = {
      'gpt-3.5-turbo': `This is a simulated response from GPT-3.5 Turbo. The model would process your prompt and provide a helpful, conversational response with good accuracy and speed.\n\nYour prompt was: "${prompt}"\n\nI would normally provide a detailed and helpful response based on my training data.`,
      'gpt-4': `This is a simulated response from GPT-4. It would provide more detailed, nuanced, and sophisticated reasoning compared to GPT-3.5, with better understanding of complex contexts.\n\nRegarding your prompt: "${prompt}"\n\nI would offer a more comprehensive analysis with deeper insights and better contextual understanding.`,
      'claude-3': `This is a simulated response from Claude-3. I would offer thoughtful, well-structured responses with strong reasoning capabilities and helpful explanations.\n\nYou asked: "${prompt}"\n\nI'd provide a balanced, nuanced response with careful consideration of different perspectives and practical insights.`,
      'local-llama': `This is a simulated response from your local Llama model. It would provide responses based on your local setup, offering privacy and customization benefits.\n\nFor your query: "${prompt}"\n\nI would generate responses using your local hardware while maintaining your data privacy.`
    };
    
    return responses[modelKey] || `Response from ${model.name}: ${prompt}`;
  };

  const handleSubmit = async (side) => {
    const pane = side === 'left' ? leftPane : rightPane;
    const setPaneState = side === 'left' ? setLeftPane : setRightPane;
    
    if (!pane.input.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: pane.input,
      timestamp: new Date()
    };
    
    // Add user message and start loading
    setPaneState(prev => ({
      ...prev,
      conversation: [...prev.conversation, userMessage],
      loading: true,
      error: null,
      input: ''
    }));
    
    try {
      const response = await callModel(pane.selectedModel, pane.input);
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        model: pane.selectedModel
      };
      
      setPaneState(prev => ({
        ...prev,
        conversation: [...prev.conversation, assistantMessage],
        loading: false
      }));
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: error.message,
        timestamp: new Date()
      };
      
      setPaneState(prev => ({
        ...prev,
        conversation: [...prev.conversation, errorMessage],
        loading: false,
        error: error.message
      }));
    }
  };

  const handleInputChange = (side, value) => {
    if (side === 'left') {
      setLeftPane(prev => ({ ...prev, input: value }));
      if (mirrorInputs) {
        setRightPane(prev => ({ ...prev, input: value }));
      }
    } else {
      setRightPane(prev => ({ ...prev, input: value }));
      if (mirrorInputs) {
        setLeftPane(prev => ({ ...prev, input: value }));
      }
    }
  };

  const handleModelChange = (side, modelKey) => {
    const setPaneState = side === 'left' ? setLeftPane : setRightPane;
    
    setPaneState(prev => ({
      ...prev,
      selectedModel: modelKey,
      error: null
    }));
  };

  const clearConversation = (side) => {
    const setPaneState = side === 'left' ? setLeftPane : setRightPane;
    
    setPaneState(prev => ({
      ...prev,
      input: '',
      conversation: [],
      error: null
    }));
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const handleKeyDown = (e, side) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(side);
    }
  };

  const MessageComponent = ({ message, modelKey }) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';
    const model = models[modelKey];
    
    return (
      <div className={`flex gap-3 p-4 ${isUser ? 'bg-transparent' : isError ? 'bg-red-50' : 'bg-gray-50'}`}>
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          ) : isError ? (
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              ⚠️
            </div>
          ) : (
            <div className={`w-8 h-8 ${model?.color || 'bg-gray-500'} rounded-full flex items-center justify-center text-white text-sm`}>
              {model?.avatar || <Bot size={16} />}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-gray-900">
              {isUser ? 'You' : isError ? 'Error' : model?.name || 'Assistant'}
            </span>
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <div className={`prose prose-sm max-w-none ${isError ? 'text-red-700' : 'text-gray-800'}`}>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {message.content}
            </pre>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => copyMessage(message.content)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Copy size={12} />
              Copy
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPane = (side) => {
    const paneData = side === 'left' ? leftPane : rightPane;
    const chatRef = side === 'left' ? leftChatRef : rightChatRef;
    const selectedModel = models[paneData.selectedModel];
    
    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-200 last:border-r-0">
        {/* Header with Model Selection */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1">
              <h3 className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                {side === 'left' ? 'Local Model (Tessa):' : 'Model On-Cloud:'}
              </h3>
              <select
                value={paneData.selectedModel}
                onChange={(e) => handleModelChange(side, e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {Object.entries(models).map(([key, model]) => (
                  <option key={key} value={key}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => clearConversation(side)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors ml-2"
              title="Clear conversation"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          
          {/* Model info */}
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <div className={`w-2 h-2 rounded-full ${selectedModel.color}`}></div>
            <span>Max tokens: {selectedModel.maxTokens}</span>
            <span>•</span>
            <span>Temp: {selectedModel.temperature}</span>
          </div>
        </div>
        
        {/* Chat Messages Area */}
        <div 
          ref={chatRef}
          className="flex-1 overflow-y-auto"
        >
          {paneData.conversation.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 p-8">
              <div className="text-center">
                <div className={`w-16 h-16 ${selectedModel.color} rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4`}>
                  {selectedModel.avatar}
                </div>
                <p className="text-lg font-medium mb-2">Start a conversation</p>
                <p className="text-sm">Send a message to {selectedModel.name} to begin</p>
              </div>
            </div>
          ) : (
            <div>
              {paneData.conversation.map((message) => (
                <MessageComponent 
                  key={message.id} 
                  message={message} 
                  modelKey={paneData.selectedModel}
                />
              ))}
              
              {/* Loading indicator */}
              {paneData.loading && (
                <div className="flex gap-3 p-4 bg-gray-50">
                  <div className={`w-8 h-8 ${selectedModel.color} rounded-full flex items-center justify-center text-white`}>
                    {selectedModel.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {selectedModel.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Input Area at Bottom */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="relative">
            <textarea
              value={paneData.input}
              onChange={(e) => handleInputChange(side, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, side)}
              placeholder={`Message ${selectedModel.name}...`}
              className="w-full p-3 pr-12 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <button
              onClick={() => handleSubmit(side)}
              disabled={paneData.loading || !paneData.input.trim()}
              className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Send message (Enter)"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Left Sidebar - Global Navigation */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Navi</h2>
        </div>
        
        <div className="flex-1 p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300">Memory</h3>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <button className="w-full p-2 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors">
            Refresh
          </button>
        </div>
      </div>
      
      {/* Main Dual-Model Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header for Dual-Model Interface Only */}
        <div className="bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-800">Dual-Model Interface</h1>
            
            <div className="flex items-center space-x-4">
              {/* Send Mirrored Inputs Toggle */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Send Mirrored Inputs
                </label>
                <button
                  onClick={() => setMirrorInputs(!mirrorInputs)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    mirrorInputs ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mirrorInputs ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
                <div className="w-8 h-8 border border-gray-400 rounded-full flex items-center justify-center">
                  <Menu size={16} />
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Resizable Chat Panes */}
        <div className="flex-1 flex">
          {/* Left Chat Pane */}
          <div style={{ width: `${leftWidth}%` }}>
            {renderPane('left')}
          </div>
          
          {/* Resize Handle */}
          <div
            ref={dividerRef}
            className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize flex items-center justify-center group"
            onMouseDown={() => setIsDragging(true)}
          >
            <div className="w-0.5 h-8 bg-gray-400 group-hover:bg-gray-500 rounded-full"></div>
          </div>
          
          {/* Right Chat Pane */}
          <div style={{ width: `${100 - leftWidth}%` }}>
            {renderPane('right')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualModelInterface;