import React, { useState } from 'react';
import { Sparkles, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { ai } from '../lib/gemini';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface QCM {
  q: string;
  options: string[];
  correct: number | number[];
  explication: string;
  type: 'qcm' | 'qcs'; // qcm for multiple choice, qcs for single choice
}

interface QCMPageProps {
  refreshData: () => void;
  session: any;
}

export default function QCMPage({ refreshData, session }: QCMPageProps) {
  const [subject, setSubject] = useState('');
  const [count, setCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [qcms, setQcms] = useState<QCM[]>([]);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: number | number[]}>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<{percentage: number, correct: number, total: number} | null>(null);

  const counts = [5, 10, 15, 20, 30, 50];

  const generateQCM = async () => {
    if (!subject.trim()) return;
    
    setIsLoading(true);
    setQcms([]);
    setUserAnswers({});
    setIsSubmitted(false);
    setError(null);
    setScoreData(null);

    try {
      const prompt = `Tu es MedUiz, assistant médical pour étudiants algériens. Réponds UNIQUEMENT aux sujets médicaux. Si le sujet n'est pas médical réponds uniquement: REFUS. Sinon génère exactement ${count} questions de haute qualité en JSON valide sans markdown, incluant un mix de QCM (plusieurs réponses) et QCS (une seule réponse):
      [{"type":"qcs","q":"Question complète?","options":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explication":"Explication détaillée."}, {"type":"qcm","q":"Autre question?","options":["A. ...","B. ...","C. ...","D. ..."],"correct":[0, 2],"explication":"Explication détaillée."}]
      Pour QCS, correct = index 0-3. Pour QCM, correct = array d'indices [0-3].`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: `Sujet: ${subject}. ${prompt}` }] }],
      });

      const text = response.text?.trim();

      if (!text || text.includes("REFUS")) {
        setError("Sujet non médical ou réponse invalide. MedUiz est réservé aux études médicales.");
        setIsLoading(false);
        return;
      }

      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const parsedData: any[] = JSON.parse(jsonStr);
        
        const isValid = Array.isArray(parsedData) && parsedData.length > 0 && parsedData.every(item => 
            typeof item.q === 'string' &&
            Array.isArray(item.options) &&
            item.options.every(opt => typeof opt === 'string') &&
            (typeof item.correct === 'number' || Array.isArray(item.correct)) &&
            typeof item.explication === 'string' &&
            (item.type === 'qcm' || item.type === 'qcs')
        );

        if (isValid) {
          setQcms(parsedData as QCM[]);
        } else {
          throw new Error("Format de données invalide de l'IA");
        }
      } catch (e) {
        console.error("JSON Parse/Validation Error", e);
        setError("Erreur de génération. Le format de la réponse est invalide. Réessayez.");
      }

    } catch (error) {
      console.error("Generation Error", error);
      setError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (qIndex: number, optionIndex: number) => {
    if (isSubmitted) return;
    
    setUserAnswers(prev => {
      const currentQCM = qcms[qIndex];
      const currentAnswer = prev[qIndex];
      
      if (currentQCM.type === 'qcm') {
        const currentArray = Array.isArray(currentAnswer) ? currentAnswer : [];
        if (currentArray.includes(optionIndex)) {
          return {...prev, [qIndex]: currentArray.filter(i => i !== optionIndex)};
        } else {
          return {...prev, [qIndex]: [...currentArray, optionIndex].sort()};
        }
      } else {
        return {...prev, [qIndex]: optionIndex};
      }
    });
  };

  const handleSubmit = () => {
    const correctCount = qcms.reduce((acc, qcm, index) => {
      const userAnswer = userAnswers[index];
      
      if (qcm.type === 'qcm') {
        const correctArray = Array.isArray(qcm.correct) ? qcm.correct.sort() : [qcm.correct];
        const userArray = Array.isArray(userAnswer) ? userAnswer.sort() : [];
        const areEqual = correctArray.length === userArray.length && correctArray.every((val, i) => val === userArray[i]);
        return acc + (areEqual ? 1 : 0);
      } else {
        return acc + (userAnswer === qcm.correct ? 1 : 0);
      }
    }, 0);
    
    const percentage = Math.round((correctCount / qcms.length) * 100);

    setScoreData({ percentage, correct: correctCount, total: qcms.length });
    setIsSubmitted(true);

    const saveScore = async () => {
        try {
            if (session.user) {
                                await supabase.from('scores').insert({
                    user_id: session.user.id,
                    subject: subject,
                    score: percentage,
                    correct: correctCount,
                    total: qcms.length,
                    mode: 'mixte',
                    date: new Date().toLocaleDateString('fr-DZ'),
                    created_at: new Date().toISOString()
                                });
                refreshData(); // Refresh dashboard data
            }
        } catch (e) {
            console.error("Error saving score:", e);
        }
    };
    saveScore();
  };

  const handleReset = () => {
    setQcms([]);
    setSubject('');
    setUserAnswers({});
    setIsSubmitted(false);
    setScoreData(null);
    setError(null);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#00e676';
    if (percentage >= 60) return '#ffab40';
    return '#ff5252';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) return "Excellent ! Continuez comme ça";
    if (percentage >= 60) return "Bien ! Révisez les erreurs";
    return "Révisez ce sujet";
  };

  return (
    <div className="flex flex-col h-full bg-[#0a1a0f] p-6 overflow-y-auto pb-24 font-sans text-[#e8f5e9]">
      <div className="mb-8">
        <h1 className="text-[18px] font-bold text-white">Générateur de QCM/QCS</h1>
        <p className="text-[#6daa80] text-[12px]">Posez un sujet médical et testez vos connaissances avec un mix de questions.</p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="space-y-2">
          <label className="text-[12px] font-medium text-[#6daa80] uppercase tracking-wide">Sujet de l'examen</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Diabète type 2, Insuffisance cardiaque, HTA..."
            className="w-full bg-[#081508] border border-[#1a3d25] rounded-[10px] py-3 px-4 text-[#e8f5e9] text-[14px] placeholder-[#3d6b4d] focus:outline-none focus:border-[#00e676] focus:ring-2 focus:ring-[#00e676]/10 transition-all"
            disabled={isLoading || qcms.length > 0}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-medium text-[#6daa80]">Nombre de questions</label>
          <div className="flex flex-wrap gap-2">
              {counts.map((c) => (
              <button
                  key={c}
                  onClick={() => setCount(c)}
                  disabled={isLoading || qcms.length > 0}
                  className={cn(
                  "px-4 py-1.5 rounded-[20px] text-[13px] transition-all border",
                  count === c
                      ? "bg-[#00e676] text-[#0a1a0f] border-transparent font-bold"
                      : "bg-transparent border-[#1a3d25] text-[#6daa80] hover:border-[#00e676]/50"
                  )}
              >
                  {c}
              </button>
              ))}
          </div>
        </div>

        {qcms.length === 0 && (
          <button
            onClick={generateQCM}
            disabled={isLoading || !subject.trim()}
            className="w-full bg-[#00e676] hover:bg-[#00b85e] disabled:bg-[#1a3d25] disabled:text-[#3d6b4d] disabled:cursor-not-allowed text-[#0a1a0f] font-bold py-3.5 rounded-[12px] text-[15px] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#3d6b4d] border-t-[#00e676] rounded-full animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Générer l'Examen
              </>
            )}
          </button>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#ff5252]/10 border border-[#ff5252]/30 rounded-[12px] p-4 flex items-center gap-3 text-[#ff5252]"
          >
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        )}
      </div>

      {qcms.length > 0 && (
        <div className="space-y-6">
          {isSubmitted && scoreData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0f2317] border border-[#1a3d25] rounded-[14px] p-6 text-center mb-4"
            >
              <div className="text-[48px] font-black leading-none mb-2" style={{ color: getScoreColor(scoreData.percentage) }}>
                {scoreData.percentage}%
              </div>
              <div className="text-[#e8f5e9] text-[14px] font-medium">
                {scoreData.correct} / {scoreData.total} bonnes réponses
              </div>
              <div className="text-[14px] font-bold mt-2" style={{ color: getScoreColor(scoreData.percentage) }}>
                {getScoreMessage(scoreData.percentage)}
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            {qcms.map((qcm, qIndex) => (
              <motion.div 
                key={qIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qIndex * 0.05 }}
                className="bg-[#0f2317] border border-[#1a3d25] rounded-[14px] p-4"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-[#00e676] font-bold text-sm bg-[#00e676]/10 px-2 py-0.5 rounded-md">{qcm.type.toUpperCase()}</span>
                  <p className="text-[#e8f5e9] text-[14px] leading-relaxed pt-0.5">{qcm.q}</p>
                </div>

                <div className="space-y-1.5">
                  {qcm.options.map((option, oIndex) => {
                    const userAnswer = userAnswers[qIndex];
                    const isSelected = qcm.type === 'qcm'
                        ? Array.isArray(userAnswer) && userAnswer.includes(oIndex)
                        : userAnswer === oIndex;
                        
                    const correctArray = Array.isArray(qcm.correct) ? qcm.correct : [qcm.correct];
                    const isCorrect = correctArray.includes(oIndex);
                    
                    let baseStyle = "w-full text-left border rounded-[10px] px-3.5 py-2.5 text-[13px] transition-all flex items-center gap-3 group";
                    let stateStyle = "";

                    if (isSubmitted) {
                      if (isCorrect) {
                        stateStyle = "bg-[#00e676]/10 border-[#00e676] text-[#00e676] font-medium";
                      } else if (isSelected) {
                        stateStyle = "bg-[#ff5252]/10 border-[#ff5252] text-[#ff5252] font-medium";
                      } else {
                        stateStyle = "bg-[#081508] border-[#1a3d25] text-[#6daa80] opacity-60";
                      }
                    } else if (isSelected) {
                      stateStyle = "bg-[#00e676] text-[#0a1a0f] border-[#00e676] font-bold shadow-[0_0_10px_rgba(0,230,118,0.4)]";
                    } else {
                      stateStyle = "bg-[#081508] border-[#1a3d25] text-[#6daa80] hover:border-[#00e676] hover:text-[#e8f5e9] hover:bg-[#00e676]/5";
                    }

                    const indicator = qcm.type === 'qcm' ? (
                        <div className={cn("w-4 h-4 rounded border-2 flex-shrink-0 transition-all", isSelected ? "bg-[#0a1a0f] border-[#0a1a0f]" : "border-current")}>
                            {isSelected && <CheckCircle size={12} className="text-[#00e676]" />} 
                        </div>
                    ) : (
                        <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all", isSelected ? "border-[#0a1a0f]" : "border-current")}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#0a1a0f]" />} 
                        </div>
                    );

                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleAnswer(qIndex, oIndex)}
                        disabled={isSubmitted}
                        className={cn(baseStyle, stateStyle)}
                      >
                        {!isSubmitted && indicator}
                        <span className="flex-1">{option}</span>
                        {isSubmitted && isCorrect && <CheckCircle size={16} className="text-[#00e676]" />}
                        {isSubmitted && isSelected && !isCorrect && <XCircle size={16} className="text-[#ff5252]" />}
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 bg-[#081508] border-l-[3px] border-[#00e676] rounded-r-[8px] p-3"
                  >
                    <span className="text-[#00e676] font-bold text-[12px] mr-2 not-italic">Explication:</span>
                    <span className="text-[#6daa80] text-[12px] italic">{qcm.explication}</span>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="pt-4 pb-8 space-y-4">
            {!isSubmitted ? (
              (Object.keys(userAnswers).length === qcms.length) && (
                <button
                  onClick={handleSubmit}
                  className="w-full bg-[#00e676] hover:bg-[#00b85e] text-[#0a1a0f] font-bold py-3.5 rounded-[12px] text-[15px] transition-all"
                >
                  Soumettre ({Object.keys(userAnswers).length}/{qcms.length} réponses)
                </button>
              )
            ) : (
              <button
                onClick={handleReset}
                className="w-full bg-transparent border border-[#1a3d25] hover:bg-[#1a3d25] text-[#6daa80] font-medium py-2.5 rounded-[10px] text-[14px] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Nouveau Examen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
