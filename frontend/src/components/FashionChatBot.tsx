import { Send, Bot, User, Sparkles, RefreshCw, MessageCircle, ShoppingBag, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { config } from '../lib/config';
import { processTextForWardrobeItems } from '../utils/textProcessor';

import WardrobeItemLink from './WardrobeItemLink';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface WardrobeItem {
  id: string;
  item_name: string;
  description: string;
  category: string;
  image_url: string;
  date_added: string;
}

const FashionChatBot: React.FC = (): JSX.Element => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  // Fetch wardrobe items for linking
  useEffect(() => {
    const fetchWardrobeItems = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${config.backendUrl}/api/wardrobe?user_id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setWardrobeItems(data);
        }
      } catch {
        // Handle error silently
      }
    };

    void fetchWardrobeItems();
  }, [user?.id]);

  const handleItemClick = (item: WardrobeItem): void => {
    setSelectedItem(item);
    // You can add navigation logic here if needed
    // For now, we'll just show the item in state
  };

  const startNewConversation = (): void => {
    setMessages([]);
    setConversationId(null);
    inputRef.current?.focus();
  };

  const sendMessage = async (): Promise<void> => {
    if (!inputText.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${config.backendUrl}${config.apiEndpoints.chat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText.trim(),
          user_id: user.id,
          conversation_id: conversationId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.conversation_id && !conversationId) {
          setConversationId(data.conversation_id);
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'bot',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderProcessedText = (text: string): JSX.Element => {
    const segments = processTextForWardrobeItems(text, wardrobeItems);

    // Check if the text contains numbered lists or bullet points
    const hasStructuredContent = /\d+\.|•|\*|-/.test(text);

    if (hasStructuredContent) {
      // If it already has structure, format it properly
      const formattedText = text
        // Split numbered lists into separate lines
        .replace(/(\d+\.\s+)/g, '\n$1')
        // Split bullet points into separate lines
        .replace(/([•\*\-]\s+)/g, '\n$1')
        // Clean up extra whitespace
        .replace(/\n\s+/g, '\n')
        .trim();

      // Split into lines and process each line
      const lines = formattedText.split('\n').filter(line => line.trim());

      // Limit to first 6 points (no "more suggestions" text - cleaner)
      const limitedLines = lines.slice(0, 6);

      return (
        <div className="space-y-3">
          {limitedLines.map((line, index) => {
            if (line.trim().length === 0) return null;

            // Check if this line starts with a number or bullet
            const isNumbered = /^\d+\./.test(line.trim());
            const isBullet = /^[•\*\-]/.test(line.trim());

            if (isNumbered || isBullet) {
              // Extract the number and remove it from the content
              let content = line.trim();
              let numberPrefix = '';

              if (isNumbered) {
                const match = content.match(/^(\d+)\.\s+/);
                if (match) {
                  numberPrefix = match[1];
                  content = content.substring(match[0].length);
                }
              } else {
                content = content.substring(2); // Remove bullet and space
              }

              // Process the line content for wardrobe items
              const lineSegments = processTextForWardrobeItems(content, wardrobeItems);

              return (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-l-4 border-purple-500 dark:border-purple-400 shadow-sm hover:shadow-md transition-shadow duration-200" key={index}>
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-xl mt-0.5 flex-shrink-0 min-w-[1.5rem]">
                    {numberPrefix || '•'}
                  </span>
                  <div className="flex-1 text-base leading-relaxed text-gray-800 dark:text-gray-200">
                    {lineSegments.map((segment, segIndex) => {
                      if (segment.type === 'wardrobe-item' && segment.item) {
                        return (
                          <WardrobeItemLink
                            item={segment.item}
                            key={`${segment.item.id}-${segIndex}`}
                            onItemClick={handleItemClick}
                          >
                            {segment.content}
                          </WardrobeItemLink>
                        );
                      }
                      return <span key={segIndex}>{segment.content}</span>;
                    })}
                  </div>
                </div>
              );
            } else {
              // Regular paragraph text
              const lineSegments = processTextForWardrobeItems(line.trim(), wardrobeItems);

              return (
                <div className="text-base leading-relaxed text-gray-700 dark:text-gray-300" key={index}>
                  {lineSegments.map((segment, segIndex) => {
                    if (segment.type === 'wardrobe-item' && segment.item) {
                      return (
                        <WardrobeItemLink
                          item={segment.item}
                          key={`${segment.item.id}-${segIndex}`}
                          onItemClick={handleItemClick}
                        >
                          {segment.content}
                        </WardrobeItemLink>
                      );
                    }
                    return <span key={segIndex}>{segment.content}</span>;
                  })}
                </div>
              );
            }
          })}
        </div>
      );
    }
    
    // If it's a paragraph, try to break it into logical points
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length > 2) {
      // Convert paragraph to bullet points
      return (
        <div className="space-y-3">
          {sentences.map((sentence, index) => {
            if (sentence.trim().length < 15) return null; // Skip very short sentences
            
            const sentenceSegments = processTextForWardrobeItems(sentence.trim(), wardrobeItems);
            
            return (
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-blue-400 dark:border-blue-500" key={index}>
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg mt-0.5 flex-shrink-0">•</span>
                <div className="flex-1 text-sm leading-relaxed">
                  {sentenceSegments.map((segment, segIndex) => {
                    if (segment.type === 'wardrobe-item' && segment.item) {
                      return (
                        <WardrobeItemLink
                          item={segment.item}
                          key={`${segment.item.id}-${segIndex}`}
                          onItemClick={handleItemClick}
                        >
                          {segment.content}
                        </WardrobeItemLink>
                      );
                    }
                    return <span key={segIndex}>{segment.content}</span>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // Default processing for short responses
    return (
      <>
        {segments.map((segment, index) => {
          if (segment.type === 'wardrobe-item' && segment.item) {
            return (
              <WardrobeItemLink
                item={segment.item}
                key={`${segment.item.id}-${index}`}
                onItemClick={handleItemClick}
              >
                {segment.content}
              </WardrobeItemLink>
            );
          }
          return <span key={index}>{segment.content}</span>;
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      {/* Header - Enhanced to match design system */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border-b-2 border-purple-200 dark:border-purple-700 px-6 py-5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Your Personal Fashion Assistant
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Get personalized style advice and outfit recommendations
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            className="inline-flex items-center justify-center p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => {
              const event = new CustomEvent('closeChatModal');
              window.dispatchEvent(event);
            }}
            title="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 px-4 animate-fade-in-up">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full opacity-50 blur-xl"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center border-2 border-purple-200 dark:border-purple-700 shadow-lg">
                  <MessageCircle className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Welcome to Your Fashion Assistant! 👗✨
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                I'm here to help you with style advice, outfit suggestions, and fashion tips.
                Ask me anything about your wardrobe or personal style!
              </p>

              {/* Quick Start Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {[
                  "What should I wear for a job interview?",
                  "Help me style my blue jeans",
                  "What colors go well together?",
                  "Give me casual outfit ideas"
                ].map((suggestion, index) => (
                  <button
                    className="group p-4 text-sm font-medium bg-white dark:bg-gray-700 border-2 border-purple-200 dark:border-purple-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-200 text-left shadow-sm hover:shadow-md hover:scale-[1.02]"
                    key={index}
                    onClick={() => setInputText(suggestion)}
                  >
                    <span className="text-gray-800 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            ) : (
              messages.map((message) => (
                <div
                  className={`flex gap-3 animate-fade-in-up ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                  key={message.id}
                >
                  {message.sender === 'bot' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-purple-100 dark:ring-purple-900/30">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl shadow-md ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white px-5 py-3'
                        : 'bg-gradient-to-br from-gray-50 to-purple-50/50 dark:from-gray-700 dark:to-purple-900/20 text-gray-900 dark:text-gray-100 px-5 py-4 border border-purple-100 dark:border-purple-800/30'
                    }`}
                  >
                    <div className={`leading-relaxed ${message.sender === 'bot' ? 'chat-response text-base' : 'text-base'}`}>
                      {message.sender === 'bot'
                        ? renderProcessedText(message.text)
                        : message.text
                      }
                    </div>
                    <div className={`text-xs mt-2 font-medium ${
                      message.sender === 'user'
                        ? 'text-purple-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.sender === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-teal-100 dark:ring-teal-900/30">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-purple-100 dark:ring-purple-900/30">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-purple-50/50 dark:from-gray-700 dark:to-purple-900/20 text-gray-900 dark:text-gray-100 px-5 py-4 rounded-2xl shadow-md border border-purple-100 dark:border-purple-800/30">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Selected Item Preview */}
          {selectedItem && (
            <div className="mx-6 mb-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-700 shadow-lg animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-purple-900 dark:text-purple-100 text-base">
                  Selected Item: {selectedItem.item_name}
                </h4>
                <button
                  className="p-1.5 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all"
                  onClick={() => setSelectedItem(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white dark:bg-gray-700 shadow-md border-2 border-purple-200 dark:border-purple-700 flex-shrink-0">
                  {selectedItem.image_url ? (
                    <img
                      alt={selectedItem.item_name}
                      className="w-full h-full object-cover"
                      src={selectedItem.image_url}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-purple-800 dark:text-purple-200 mb-3 leading-relaxed">
                    {selectedItem.description}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full border border-purple-200 dark:border-purple-700">
                      {selectedItem.category}
                    </span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      Added: {new Date(selectedItem.date_added).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t-2 border-purple-100 dark:border-purple-800/30 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/10 px-6 py-5">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  className="w-full px-5 py-4 border-2 border-purple-200 dark:border-purple-700 rounded-xl text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 pr-12 font-medium shadow-sm"
                  disabled={isLoading}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about fashion, style, or your wardrobe..."
                  ref={inputRef}
                  type="text"
                  value={inputText}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Sparkles className="w-5 h-5 text-purple-400 dark:text-purple-500 animate-pulse" />
                </div>
              </div>

              <button
                className="inline-flex items-center justify-center px-5 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                disabled={!inputText.trim() || isLoading}
                onClick={() => void sendMessage()}
              >
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </button>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center font-medium">
              Press <kbd className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded text-purple-700 dark:text-purple-300 font-semibold">Enter</kbd> to send • <kbd className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded text-purple-700 dark:text-purple-300 font-semibold">Shift+Enter</kbd> for new line
            </div>
          </div>
      </div>
    </div>
  );
};

export default FashionChatBot;