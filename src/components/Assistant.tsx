import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Search, FileText, Image as ImageIcon, ArrowUp, Stethoscope, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ai, SYSTEM_INSTRUCTION, MODEL_NAME } from '../lib/gemini';
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
      let isImageGeneration = false;

      if (activeChip === 'Infographie') {
        const factsPrompt = `Tu es professeur agrégé de médecine algérien.
Donne-moi les informations médicales EXACTES et VÉRIFIÉES sur: "${input}"
Structure ta réponse en JSON strict sans markdown:
{
  "titre": "TITRE EN MAJUSCULES",
  "search_query": "Requete de recherche Google courte et précise pour trouver un schéma explicatif médical sur ce sujet (ex: 'schéma anatomie coeur humain', 'cycle de krebs schéma')",
  "sections": [
    {
      "nom": "NOM SECTION",
      "couleur": "#c62828",
      "points": ["fait précis 1", "fait précis 2", "fait précis 3"]
    }
  ],
  "surveillance": ["point 1", "point 2", "point 3"],
  "chiffres_cles": ["valeur importante 1", "valeur importante 2"]
}
Sections possibles: Définition, Physiopathologie, Signes cliniques, Diagnostic, Traitement, Complications, Surveillance.
Couleurs: rouge #c62828 pour urgences/signes, bleu #1565c0 pour diagnostic, vert #2e7d32 pour traitement, orange #e65100 pour complications.
IMPORTANT: uniquement des faits médicaux vérifiés du programme algérien. Pas d'invention.`;

        // Step 1: Get Text Data & Search Query
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: 'user', parts: [{ text: factsPrompt }] }],
        });

        const text = response.text?.trim() || "";
        const clean = text.replace(/```json|```/g, '').trim();
        
        try {
          const data = JSON.parse(clean);
          
          // Step 2: Search for Image (if query exists)
          let searchImageUrl = undefined;
          if (data.search_query) {
             try {
                // Use a separate model call with googleSearch tool to find an image
                const searchResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: 'user', parts: [{ text: `Find a medical diagram or illustration for: ${data.search_query}` }] }],
                    config: {
                        tools: [{ googleSearch: {} }],
                    }
                });
                
                // Extract the first image URL from the grounding metadata
                // Note: The structure depends on the API response, we look for grounding chunks
                const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (chunks && chunks.length > 0) {
                    // Look for an image in the chunks. 
                    // Since the API returns web pages, we might need to rely on the model to extract an image URL 
                    // or just use the first web page's image if available.
                    // However, the standard googleSearch tool returns web pages. 
                    // To get an image directly, we might need to parse the response text if the model describes it,
                    // or better, ask the model to return the URL of an image it found.
                    
                    // Let's try a different approach: Ask the model to find an image URL specifically.
                    // Actually, the googleSearch tool provides web results. 
                    // Let's try to extract a relevant image source from the search result if possible, 
                    // or fallback to a placeholder if not directly accessible.
                    
                    // SIMPLIFICATION FOR THIS ENVIRONMENT:
                    // The googleSearch tool returns web pages. Getting a direct image URL that is hotlinkable 
                    // is difficult and often blocked by CORS or hotlinking protection.
                    // A better approach for "images from google" in this specific constrained environment 
                    // without a custom search API key is to use the generated image we had, 
                    // OR if the user insists on "google images", we can try to find a way.
                    
                    // However, the user request is "let infographie use images from google".
                    // The `googleSearch` tool in the `gemini-2.5-flash` model returns grounding metadata.
                    // Let's inspect the grounding metadata for images.
                    // If not available, we might have to revert to generation or explain the limitation.
                    
                    // BUT, the `gemini-2.5-flash` model with `googleSearch` is capable of returning grounding chunks.
                    // Let's try to find a relevant image URL from the search results.
                    
                    // Actually, let's use the `gemini-2.5-flash` to *find* the image URL for us from the search results.
                    const imageSearchResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [{ role: 'user', parts: [{ text: `Find a direct URL to a medical illustration or diagram for "${data.search_query}". Return ONLY the URL.` }] }],
                        config: {
                            tools: [{ googleSearch: {} }],
                        }
                    });
                    
                    const potentialUrl = imageSearchResponse.text?.trim();
                    if (potentialUrl && (potentialUrl.startsWith('http') || potentialUrl.startsWith('https'))) {
                        searchImageUrl = potentialUrl;
                    }
                }
             } catch (searchError) {
                 console.error("Image Search Error", searchError);
             }
          }

          // Fallback if search fails or returns nothing usable: use generation or placeholder
          // For now, let's keep it undefined if search fails, or maybe fallback to generation?
          // The user specifically asked for "images from google".
          // If we can't get a google image, maybe we shouldn't show anything or show a placeholder.

          const sectionsHTML = data.sections.map((s: any) => `
            <div>
              <div style="color:${s.couleur};font-weight:700;font-size:11px;text-transform:uppercase;border-bottom:2px solid ${s.couleur};padding-bottom:3px;margin-bottom:6px">
                ${s.nom}
              </div>
              <ul style="margin:0;padding-left:14px">
                ${s.points.map((p: string) => `<li style="margin-bottom:4px;color:#1a2e1f;font-size:12px">${p}</li>`).join('')}
              </ul>
            </div>
          `).join('');

          const chiffresHTML = data.chiffres_cles && data.chiffres_cles.length ? `
            <div style="background:#e8f5e9;border-radius:6px;padding:8px 10px;margin-bottom:10px">
              <div style="color:#1b5e20;font-weight:700;font-size:11px;text-transform:uppercase;margin-bottom:5px">
                CHIFFRES CLÉS
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${data.chiffres_cles.map((c: string) => `
                  <span style="background:white;border:1px solid #1b5e20;border-radius:4px;padding:3px 8px;font-size:11px;color:#1b5e20;font-weight:700">
                    ${c}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : '';

          const surveillanceHTML = data.surveillance && data.surveillance.length ? `
            <div style="background:#f5f5f5;border-radius:6px;padding:8px 10px">
              <div style="color:#2e7d32;font-weight:700;font-size:11px;text-transform:uppercase;margin-bottom:5px">
                SURVEILLANCE
              </div>
              <ul style="margin:0;padding-left:14px">
                ${data.surveillance.map((p: string) => `<li style="margin-bottom:3px;color:#1a2e1f;font-size:12px">${p}</li>`).join('')}
              </ul>
            </div>
          ` : '';

          const imageHTML = searchImageUrl ? `
            <div style="margin-bottom:16px;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
                <img src="${searchImageUrl}" alt="Schéma explicatif" style="width:100%;height:auto;display:block;" onError="this.style.display='none'" />
            </div>
          ` : '';

          const htmlContent = `
            <div style="font-family:Arial,sans-serif;line-height:1.5;background:white;padding:16px;border-radius:8px;">
              <div style="text-align:center;font-size:14px;font-weight:900;color:#1a237e;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #1a237e;padding-bottom:8px;margin-bottom:12px">
                ${data.titre}
              </div>
              ${imageHTML}
              ${chiffresHTML}
              <div style="display:grid;grid-template-columns:${data.sections.length > 2 ? '1fr 1fr' : '1fr 1fr'};gap:10px;margin-bottom:10px">
                ${sectionsHTML}
              </div>
              ${surveillanceHTML}
            </div>
          `;

          // Increment infographic count
          const currentCount = parseInt(localStorage.getItem('meduiz_infographics_count') || '0');
          localStorage.setItem('meduiz_infographics_count', (currentCount + 1).toString());

          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: htmlContent, // We will render this as HTML
            type: 'text', // Treat as text but render specially
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);

        } catch (e) {
          console.error("JSON Parse Error", e);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `<div style="color:#c62828;font-size:13px;text-align:center;padding:20px">
              Erreur de génération. Vérifiez que le sujet est médical et réessayez.
            </div>`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } else {
        // Handle other modes (CAT, QCM, Default)
        if (activeChip === 'CAT') {
          prompt = `Génère une Conduite à Tenir (CAT) détaillée pour : ${input}`;
        } else if (activeChip === 'QCM') {
          prompt = `Génère 5 QCMs type résidanat algérien sur le sujet : ${input}. Inclus la réponse et l'explication à la fin.`;
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
              systemInstruction: SYSTEM_INSTRUCTION,
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
      case 'Infographie':
        return "Ex: Anatomie du coeur, Cycle de Krebs...";
      case 'Recherche Web':
        return "Ex: Derniers traitements du diabète, Recommandations HTA...";
      default:
        return "Posez une question médicale (ex: Symptômes de la grippe)...";
    }
  };

  return (
    <div className="relative h-full bg-[#0a1a0f] text-[#e8f5e9] font-sans">

      {/* Messages Area */}
      <div 
        id="chat-area"
        className="fixed top-[56px] left-0 right-0 bottom-[220px] overflow-y-auto p-4 space-y-6 bg-[#0a1a0f] z-0"
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
                  <Stethoscope size={14} className="text-[#00e676]" />
                  <span className="text-[11px] font-bold text-[#00e676] tracking-[0.1em] uppercase">ASSISTANT</span>
                </div>

                {/* Row 2 */}
                <div className="text-[#6daa80] text-[13px]">
                  Réponse :
                </div>

                {/* Row 3 */}
                <div className="bg-[#0f2317] border border-[#1a3d25] rounded-xl p-[14px] shadow-sm text-[#e8f5e9] text-sm leading-relaxed markdown-body">
                   {msg.content.trim().startsWith('<div') ? (
                     <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                   ) : (
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                   )}
                   {msg.imageUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-[#1a3d25]">
                         <img src={msg.imageUrl} alt="Generated content" className="w-full h-auto" />
                      </div>
                   )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end max-w-[85%]">
                <div className="bg-[#00b85e] text-[#0a1a0f] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed font-medium shadow-md">
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
               <Stethoscope size={14} className="text-[#00e676]" />
               <span className="text-[11px] font-bold text-[#00e676] tracking-[0.1em] uppercase">ASSISTANT</span>
             </div>
             
             {/* Row 2 */}
             <div className="text-[#6daa80] text-[13px]">
               Réflexion en cours...
             </div>

             {/* Row 3 */}
             <div className="bg-[#0f2317] border border-[#1a3d25] rounded-xl p-[14px] shadow-sm">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-2 h-2 bg-[#00e676] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#00e676] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-[#00e676] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pills Row */}
      <div 
        id="pills-row"
        className="fixed bottom-[160px] left-0 right-0 px-3 py-2 bg-[#0a1a0f] border-t border-[#1a3d25] z-30 flex gap-2 overflow-x-auto scrollbar-hide"
      >
        <button 
          onClick={() => handleChipClick('Recherche Web')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
            activeChip === 'Recherche Web' 
              ? "bg-[#00e676] text-[#0a1a0f] border-[#00e676] font-bold shadow-[0_0_10px_rgba(0,230,118,0.4)]" 
              : "bg-[#0f2317] text-[#6daa80] border-[#1a3d25] hover:bg-[#00e676] hover:text-[#0a1a0f] hover:border-[#00e676] hover:font-bold hover:shadow-[0_0_10px_rgba(0,230,118,0.4)]"
          )}
        >
          <Search size={14} /> Recherche Web
        </button>
        <button 
          onClick={() => handleChipClick('CAT')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
            activeChip === 'CAT' 
              ? "bg-[#00e676] text-[#0a1a0f] border-[#00e676] font-bold shadow-[0_0_10px_rgba(0,230,118,0.4)]" 
              : "bg-[#0f2317] text-[#6daa80] border-[#1a3d25] hover:bg-[#00e676] hover:text-[#0a1a0f] hover:border-[#00e676] hover:font-bold hover:shadow-[0_0_10px_rgba(0,230,118,0.4)]"
          )}
        >
          <FileText size={14} /> Générer CAT
        </button>
        <button 
          onClick={() => handleChipClick('Infographie')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
            activeChip === 'Infographie' 
              ? "bg-[#00e676] text-[#0a1a0f] border-[#00e676] font-bold shadow-[0_0_10px_rgba(0,230,118,0.4)]" 
              : "bg-[#0f2317] text-[#6daa80] border-[#1a3d25] hover:bg-[#00e676] hover:text-[#0a1a0f] hover:border-[#00e676] hover:font-bold hover:shadow-[0_0_10px_rgba(0,230,118,0.4)]"
          )}
        >
          <ImageIcon size={14} /> Infographie
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
            className="w-full bg-[#081508] border border-[#1a3d25] rounded-2xl py-4 pl-5 pr-14 text-sm text-[#e8f5e9] placeholder-[#3d6b4d] focus:outline-none focus:border-[#00e676]/50 focus:ring-1 focus:ring-[#00e676]/50 transition-all shadow-lg shadow-black/50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-[#00e676]/10 text-[#00e676] rounded-xl hover:bg-[#00e676] hover:text-[#0a1a0f] disabled:opacity-50 transition-all"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
