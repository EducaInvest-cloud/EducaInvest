import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { supabase } from "@/integrations/supabase/client";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('educainvest_chat_history');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
        return [{
            id: "welcome",
            role: "assistant",
            content: "Olá! Sou seu Tutor Financeiro com IA.\n\nPosso te ajudar com dúvidas sobre investimentos, termos do mercado ou explicar o conteúdo das aulas.\n\nComo posso ajudar hoje?"
        }];
    });

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        localStorage.setItem('educainvest_chat_history', JSON.stringify(messages));
    }, [messages]);

    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const lastAssistantMessageRef = useRef<HTMLDivElement>(null);

    const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || "";

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const scrollToAssistantMessage = () => {
        if (lastAssistantMessageRef.current) {
            lastAssistantMessageRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest"
            });
        }
    };

    const isLastMessageAssistant = messages.length > 0 && messages[messages.length - 1].role === 'assistant';
    const isInitialWelcome = messages.length === 1 && messages[0].id === 'welcome';

    useEffect(() => {
        if (!isOpen) return;

        if (isLastMessageAssistant && !isInitialWelcome) {
            const timeout = setTimeout(scrollToAssistantMessage, 300);
            return () => clearTimeout(timeout);
        } else {
            scrollToBottom(isInitialWelcome ? "auto" : "smooth");
        }
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            if (!N8N_WEBHOOK_URL) {
                throw new Error("Webhook URL not configured");
            }

            console.log("[Chat] Sending to webhook:", N8N_WEBHOOK_URL);

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pergunta: userMessage.content }),
            });

            console.log("[Chat] Response status:", response.status, response.statusText);
            console.log("[Chat] Response content-type:", response.headers.get('content-type'));

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                console.error("[Chat] Error response body:", errorBody);
                throw new Error(`Falha na comunicação com a IA (${response.status})`);
            }

            // Read response as text first to avoid crashing on empty/non-JSON bodies
            const rawText = await response.text();
            console.log("[Chat] Raw response:", rawText.substring(0, 500));

            if (!rawText || rawText.trim() === '') {
                throw new Error('Resposta vazia do servidor');
            }

            let data: any;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                // Response is plain text, not JSON — use it directly
                console.log("[Chat] Response is plain text, using directly");
                data = rawText;
            }

            // Handle potential double-serialization (n8n sometimes returns JSON as a string)
            let parsedData = data;
            if (typeof data === 'string') {
                try {
                    const potentialJson = JSON.parse(data);
                    if (typeof potentialJson === 'object' && potentialJson !== null) {
                        parsedData = potentialJson;
                    }
                } catch (e) {
                    // It's just a regular string, keep as is
                }
            }

            // Robust parsing to avoid technical output or silent failures
            let botResponseText = '';
            const NO_RESULTS_FOUND = "Puxa, não encontrei informações específicas sobre isso na minha base de conhecimento atual sobre EducaInvest. 🧐\n\nPosso tentar ajudar com termos financeiros, dúvidas sobre as aulas ou explicar como os jogos funcionam. Poderia reformular sua pergunta?";

            // Helper function to extract text from OpenAI-like message structure
            const extractTextFromItem = (item: any) => {
                if (!item) return null;
                // n8n OpenAI message structure
                if (item.content && Array.isArray(item.content) && item.content[0]?.text) {
                    return item.content[0].text;
                }
                if (typeof item === 'string') return item;
                if (item.text && typeof item.text === 'string') return item.text;
                if (item.output && typeof item.output === 'string') return item.output;
                if (item.message && typeof item.message === 'string') return item.message;
                return null;
            };

            // 1. Handle Array responses (common in n8n list-based nodes)
            if (Array.isArray(parsedData)) {
                if (parsedData.length === 0) {
                    botResponseText = NO_RESULTS_FOUND;
                } else {
                    botResponseText = extractTextFromItem(parsedData[0]) || "";
                }
            }
            // 2. Handle Object responses
            else if (typeof parsedData === 'object' && parsedData !== null) {
                // Check common technical indicators of "no data"
                const isEmpty = Object.keys(parsedData).length === 0;

                if (isEmpty) {
                    botResponseText = NO_RESULTS_FOUND;
                } else if (Array.isArray(parsedData.output)) {
                    botResponseText = parsedData.output.length > 0
                        ? extractTextFromItem(parsedData.output[0]) || ""
                        : NO_RESULTS_FOUND;
                } else {
                    botResponseText = extractTextFromItem(parsedData) || "";
                }
            }
            // 3. Handle simple strings
            else if (typeof parsedData === 'string' && parsedData.trim()) {
                botResponseText = parsedData;
            }

            // Final fallback for technical results like "[]" or unrecognized objects
            if (!botResponseText || botResponseText === "[]" || botResponseText === "{}" || botResponseText.trim() === "") {
                botResponseText = NO_RESULTS_FOUND;
            }

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: botResponseText
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: !N8N_WEBHOOK_URL
                    ? "⚠️ Configuração pendente: Adicione a URL do Webhook n8n no arquivo .env (VITE_N8N_WEBHOOK_URL)."
                    : (error as Error)?.message?.includes('vazia')
                        ? "⚠️ O webhook retornou uma resposta vazia. Verifique se o fluxo do n8n está ativo e configurado corretamente."
                        : "Desculpe, tive um problema para processar sua pergunta. Tente novamente mais tarde."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Don't render if not authenticated
    if (!isAuthenticated) return null;

    return (
        <div className="fixed bottom-16 right-0 z-50 p-4 md:bottom-8 md:right-8 flex flex-col items-end pointer-events-none">
            <div className="pointer-events-auto">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-0 z-[60] w-full h-full md:relative md:inset-auto md:w-[450px] md:h-[600px] md:max-h-[85vh] bg-slate-900/95 backdrop-blur-xl md:border border-white/10 md:rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/20 to-transparent flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                        <Bot className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-white text-sm">Tutor IA</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs text-slate-400">Online</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Messages Area */}
                            <ScrollArea className="flex-1 p-4 overscroll-contain">
                                <div className="space-y-4">
                                    {messages.map((msg, index) => (
                                        <motion.div
                                            key={msg.id}
                                            ref={index === messages.length - 1 && msg.role === 'assistant' ? lastAssistantMessageRef : null}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex gap-3 max-w-[85%]",
                                                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                                msg.role === 'user'
                                                    ? "bg-slate-700 border-slate-600"
                                                    : "bg-primary/20 border-primary/30"
                                            )}>
                                                {msg.role === 'user' ? (
                                                    <User className="w-4 h-4 text-slate-300" />
                                                ) : (
                                                    <Bot className="w-4 h-4 text-primary" />
                                                )}
                                            </div>

                                            <div className={cn(
                                                "p-3 rounded-2xl text-sm leading-relaxed",
                                                msg.role === 'user'
                                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                    : "bg-white/10 text-slate-200 rounded-tl-sm border border-white/5"
                                            )}>
                                                {msg.role === 'user' ? (
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                ) : (
                                                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:border prose-pre:border-white/10">
                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Loading State */}
                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-3 mr-auto max-w-[85%]"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                                                <Bot className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="bg-white/10 p-4 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                <span className="text-xs text-slate-400 animate-pulse">Consultando base de conhecimento...</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Input Area */}
                            <div className="p-4 border-t border-white/10 bg-slate-950/50">
                                <div className="flex text-[10px] text-slate-500 mb-2 justify-center gap-2">
                                    <Sparkles className="w-3 h-3 text-primary/50" />
                                    <span>IA treinada com conteúdo EducaInvest</span>
                                </div>
                                <div className="relative">
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Digite sua dúvida..."
                                        disabled={isLoading}
                                        className="pr-12 bg-white/5 border-white/10 focus-visible:ring-primary/50 rounded-xl"
                                    />
                                    <Button
                                        size="icon"
                                        className="absolute right-1 top-1 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isLoading}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Button */}
                <AnimatePresence>
                    {!isOpen && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8, rotate: 20 }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsOpen(true)}
                            className={cn(
                                "h-14 w-14 md:h-16 md:w-16 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] flex items-center justify-center transition-all duration-300 z-50 bg-gradient-to-tr from-primary to-blue-600 text-white border border-white/20"
                            )}
                        >
                            <MessageCircle className="w-7 h-7 md:w-8 md:h-8 fill-current" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
