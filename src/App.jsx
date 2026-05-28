import React, { useState, useEffect } from 'react';
import { Plus, List, BarChart3, Download, Crown, ChevronDown } from 'lucide-react';

const BESCHIKBARE_NAMEN = [
  "Bart", "Dooren", "Jillert", "Joep", "Koedijk", "Maikel", 
  "Mantjes", "Marco", "Patrick", "Piepoort", "Rob", 
  "Roeland", "Ron", "Satje", "Tim", "Tom"
];

const SchoppenLogo = ({ className = "w-16 h-16" }) => (
  <svg className={`${className} text-orange-500`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C11.3 2 6 9 6 12.8C6 16 8.5 17.5 11 17.5C11.5 17.5 11.5 18.5 11 20C10.5 21.5 9 22 9 22H15C15 22 13.5 21.5 13 20C12.5 18.5 12.5 17.5 13 17.5C15.5 17.5 18 16 18 12.8C18 9 12.7 2 12 2Z" />
  </svg>
);

export default function App() {
  const [fase, setFase] = useState('setup'); 
  const [aantalSpelers, setAantalSpelers] = useState(4);
  const [spelers, setSpelers] = useState(['', '', '', '']);
  const [actieveTab, setActieveTab] = useState('INVOEREN');
  const [melding, setMelding] = useState(null);
  
  // Statistieken (simulatie van opslag)
  const [stats] = useState(() => {
    const defaultStats = {};
    BESCHIKBARE_NAMEN.forEach(n => defaultStats[n] = { gewonnen: 0, verloren: 0 });
    return defaultStats;
  });

  const startSpel = () => {
    if (spelers.some(naam => !naam)) {
      setMelding('Selecteer eerst alle spelers!');
      setTimeout(() => setMelding(null), 3000);
      return;
    }
    setFase('spelen');
  };

  return (
    <div className="flex justify-center min-h-screen bg-black text-neutral-200 font-sans">
      <div className="w-full max-w-md bg-[#080808] shadow-2xl flex flex-col relative h-screen border-x border-neutral-900 overflow-hidden">
        
        <header className="px-6 py-5 bg-[#0b0b0b] border-b border-neutral-900 flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Schoppenjagen</h2>
          <SchoppenLogo className="w-8 h-8" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          {melding && <div className="bg-red-900/50 text-red-200 p-3 rounded-xl mb-4 text-sm font-bold text-center">{melding}</div>}
          
          {actieveTab === 'INVOEREN' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Aantal Spelers</label>
                <div className="flex p-1 bg-[#050505] rounded-2xl border border-neutral-850">
                  {[3, 4, 5, 6].map(n => (
                    <button key={n} onClick={() => setAantalSpelers(n)} className={`flex-1 py-3 rounded-xl font-black transition-all ${aantalSpelers === n ? 'bg-orange-500 text-black' : 'text-neutral-400'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {spelers.map((naam, i) => (
                  <div key={i} className="flex items-center space-x-3 bg-neutral-950 p-1.5 rounded-xl border border-neutral-900">
                    <select value={naam} onChange={(e) => { const nw = [...spelers]; nw[i] = e.target.value; setSpelers(nw); }} className="w-full bg-neutral-900 border rounded-lg pl-3 py-3 outline-none font-bold text-sm text-white border-neutral-800">
                      <option value="">Kies speler...</option>
                      {BESCHIKBARE_NAMEN.sort((a,b) => (spelers.includes(a) && spelers[i] !== a ? 1 : -1)).map(n => (
                          <option key={n} value={n} disabled={spelers.includes(n) && spelers[i] !== n}>
                              {n} {spelers.includes(n) && spelers[i] !== n ? '(Gekozen)' : ''}
                          </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <button 
                onClick={startSpel} 
                className="w-full py-5 mt-8 bg-orange-500 text-black font-black rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:bg-orange-400 active:scale-[0.98] transition-all uppercase tracking-widest text-lg"
              >
                Start de Strijd
              </button>
            </div>
          ) : actieveTab === 'STATISTIEKEN' ? (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Spelers Statistieken</h3>
              {BESCHIKBARE_NAMEN.map(n => (
                <div key={n} className="flex justify-between p-4 bg-neutral-950 rounded-xl border border-neutral-900">
                  <span className="font-bold text-white">{n}</span>
                  <span className="text-neutral-500 text-xs font-black">W: {stats[n].gewonnen} / V: {stats[n].verloren}</span>
                </div>
              ))}
            </div>
          ) : actieveTab === 'SCOREBORD' ? (
            <div className="text-center py-20 text-neutral-500 font-bold uppercase tracking-widest">
              {fase === 'spelen' ? "Scorebord geladen..." : "Start eerst een potje!"}
            </div>
          ) : (
             <div className="text-center py-20 text-neutral-500 uppercase tracking-widest text-xs">Installeer de app via je browser-menu.</div>
          )}
        </div>

        <nav className="absolute bottom-0 left-0 w-full bg-[#0c0c0c] border-t border-neutral-900 flex justify-between px-2 pb-6 pt-3">
          {[
            { id: 'SCOREBORD', icon: <List className="w-6 h-6" />, label: 'Scores' },
            { id: 'INVOEREN', icon: <Plus className="w-6 h-6" />, label: 'Invoer' },
            { id: 'STATISTIEKEN', icon: <BarChart3 className="w-6 h-6" />, label: 'Stats' },
            { id: 'INSTALLEREN', icon: <Download className="w-6 h-6" />, label: 'App' },
          ].map((t) => (
            <button key={t.id} onClick={() => setActieveTab(t.id)} className={`flex-1 flex flex-col items-center py-2 ${actieveTab === t.id ? 'text-orange-500' : 'text-neutral-600'}`}>
              {t.icon}
              <span className="text-[10px] font-black mt-1 uppercase">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
