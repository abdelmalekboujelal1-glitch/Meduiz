import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Search, FileText, Image as ImageIcon, ArrowUp, Stethoscope, LogOut, Calculator } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ai, SYSTEM_INSTRUCTION, MODEL_NAME, CALCULATOR_SYSTEM_PROMPT } from '../lib/gemini';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'qcm';
  imageUrl?: string;
  timestamp: Date;
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bonjour ! Je suis MedUiz, votre assistant médical. Comment puis-je vous aider ?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeChip, setActiveChip] = useState<string | null>('Infographie');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !activeChip) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let prompt = input;
      let modelToUse = MODEL_NAME;
      let currentSystemInstruction = SYSTEM_INSTRUCTION;

      // Handle other modes (CAT, QCM, Default)
      if (activeChip === 'CAT') {
        prompt = `Génère une Conduite à Tenir (CAT) détaillée pour : ${input}`;
      } else if (activeChip === 'QCM') {
        prompt = `Génère 5 QCMs type résidanat algérien sur le sujet : ${input}. Inclus la réponse et l'explication à la fin.`;
      } else if (activeChip === 'Calculateur') {
        currentSystemInstruction = CALCULATOR_SYSTEM_PROMPT;
      }

      // Text Streaming
      const result = await ai.models.generateContentStream({
          model: modelToUse,
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          config: {
            systemInstruction: currentSystemInstruction,
          },
      });

        let fullText = "";
        const botMessageId = (Date.now() + 1).toString();
        
        // Add initial empty message
        setMessages((prev) => [...prev, {
            id: botMessageId,
            role: 'assistant',
            content: "",
            timestamp: new Date(),
        }]);

        for await (const chunk of result) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                setMessages((prev) => 
                    prev.map(msg => 
                        msg.id === botMessageId 
                            ? { ...msg, content: fullText } 
                            : msg
                    )
                );
            }
        }
    } catch (error) {
      console.error("Error generating content:", error);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Une erreur est survenue. Veuillez réessayer.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setActiveChip(null);
    }
  };

  const handleChipClick = (chip: string) => {
    setActiveChip(chip === activeChip ? null : chip);
  };

  const getPlaceholder = () => {
    switch (activeChip) {
      case 'CAT':
        return "Ex: Asthme aigu grave, IDM, AVC...";
      case 'Calculateur':
        return "Ex: Calculer l'IMC, Score de Glasgow, GFR...";
      case 'Recherche Web':
        return "Ex: Derniers traitements du diabète, Recommandations HTA...";
      default:
        return "Posez une question médicale (ex: Symptômes de la grippe)...";
    }
  };

  return (
    <div className="relative h-full bg-med-bg text-med-text font-sans transition-colors duration-300">

      {/* Messages Area */}
      <div 
        id="chat-area"
        className="fixed top-16 left-0 right-0 bottom-[220px] overflow-y-auto p-4 space-y-6 bg-med-bg z-0 transition-colors duration-300"
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex flex-col max-w-[90%] md:max-w-[70%] lg:max-w-[60%]",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start w-full"
            )}
          >
            {msg.role === 'assistant' ? (
              <div className="flex flex-col gap-2 w-full">
                {/* Row 1 */}
                <div className="flex items-center gap-2">
                  <Stethoscope size={14} className="text-med-accent" />
                  <span className="text-[11px] font-bold text-med-accent tracking-[0.1em] uppercase">ASSISTANT</span>
                </div>

                {/* Row 2 */}
                <div className="text-med-text-muted text-[13px]">
                  Réponse :
                </div>

                {/* Row 3 */}
                <div className="bg-med-card border border-med-border rounded-xl p-[14px] shadow-sm text-med-text text-sm leading-relaxed markdown-body transition-colors duration-300">
                   {msg.content.trim().startsWith('<div') ? (
                     <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                   ) : (
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                   )}
                   {msg.imageUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-med-border">
                         <img src={msg.imageUrl} alt="Generated content" className="w-full h-auto" />
                      </div>
                   )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end max-w-[85%]">
                <div className="bg-med-accent-dark text-med-bg rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed font-medium shadow-md transition-colors duration-300">
                  {msg.content}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {isLoading && (
           <div className="flex flex-col gap-2 w-full max-w-[90%] md:max-w-[70%] lg:max-w-[60%] mr-auto items-start">
             {/* Row 1 */}
             <div className="flex items-center gap-2">
               <Stethoscope size={14} className="text-med-accent" />
               <span className="text-[11px] font-bold text-med-accent tracking-[0.1em] uppercase">ASSISTANT</span>
             </div>
             
             {/* Row 2 */}
             <div className="text-med-text-muted text-[13px]">
               Réflexion en cours...
             </div>

             {/* Row 3 */}
             <div className="bg-med-card border border-med-border rounded-xl p-[14px] shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-2 h-2 bg-med-accent rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-med-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-med-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pills Row */}
      <div 
        id="pills-row"
        className="fixed bottom-[160px] left-0 right-0 px-3 py-2 bg-med-bg border-t border-med-border z-30 flex gap-2 overflow-x-auto scrollbar-hide transition-colors duration-300"
      >
        <button 
          onClick={() => handleChipClick('Recherche Web')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
            activeChip === 'Recherche Web' 
              ? "bg-med-accent text-med-bg border-med-accent font-bold shadow-[0_0_10px_var(--med-accent)]/40" 
              : "bg-med-card text-med-text-muted border-med-border hover:bg-med-accent hover:text-med-bg hover:border-med-accent hover:font-bold hover:shadow-[0_0_10px_var(--med-accent)]/40"
          )}
        >
          <Search size={14} /> Recherche Web
        </button>
        <button 
          onClick={() => handleChipClick('CAT')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
            activeChip === 'CAT' 
              ? "bg-med-accent text-med-bg border-med-accent font-bold shadow-[0_0_10px_var(--med-accent)]/40" 
              : "bg-med-card text-med-text-muted border-med-border hover:bg-med-accent hover:text-med-bg hover:border-med-accent hover:font-bold hover:shadow-[0_0_10px_var(--med-accent)]/40"
          )}
        >
          <FileText size={14} /> Générer CAT
        </button>
        <button 
          onClick={() => handleChipClick('Calculateur')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
            activeChip === 'Calculateur' 
              ? "bg-med-accent text-med-bg border-med-accent font-bold shadow-[0_0_10px_var(--med-accent)]/40" 
              : "bg-med-card text-med-text-muted border-med-border hover:bg-med-accent hover:text-med-bg hover:border-med-accent hover:font-bold hover:shadow-[0_0_10px_var(--med-accent)]/40"
          )}
        >
          <Calculator size={14} /> Calculateur
        </button>
      </div>

      {/* Input Bar */}
      <div 
        id="input-bar"
        className="fixed bottom-[90px] left-0 right-0 mx-3 z-40"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={getPlaceholder()}
            className="w-full bg-med-input border border-med-border rounded-2xl py-4 pl-5 pr-14 text-sm text-med-text placeholder-med-text-dim focus:outline-none focus:border-med-accent/50 focus:ring-1 focus:ring-med-accent/50 transition-all shadow-lg shadow-black/50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-med-accent/10 text-med-accent rounded-xl hover:bg-med-accent hover:text-med-bg disabled:opacity-50 transition-all"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
