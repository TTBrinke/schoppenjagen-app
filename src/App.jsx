import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Plus, List, Settings, RotateCcw, Trophy, 
  AlertCircle, Check, X, Crown, Edit2, VolumeX, Volume2, ChevronDown, BarChart3, Trash2, Download, Share 
} from 'lucide-react';

const SOUND_URLS = {
  BOO: "/boo.mp3",
  CHEER: "/applaus.mp3"
};

const BESCHIKBARE_NAMEN = [
  "Bart", "Dooren", "Jillert", "Joep", "Koedijk", "Maikel", 
  "Mantjes", "Marco", "Patrick", "Piepoort", "Rob", 
  "Roeland", "Ron", "Satje", "Tim", "Tom"
];

const SchoppenLogo = ({ className = "w-16 h-16", glow = true }) => (
  <div className="relative">
    {glow && <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>}
    <svg className={`${className} text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C11.3 2 6 9 6 12.8C6 16 8.5 17.5 11 17.5C11.5 17.5 11.5 18.5 11 20C10.5 21.5 9 22 9 22H15C15 22 13.5 21.5 13 20C12.5 18.5 12.5 17.5 13 17.5C15.5 17.5 18 16 18 12.8C18 9 12.7 2 12 2Z" />
      <path d="M12 4.5L13.5 6.5L16 5.5L14.5 8H9.5L8 5.5L10.5 6.5L12 4.5Z" fill="#000000" stroke="#f97316" strokeWidth="0.5" />
    </svg>
  </div>
);

export default function App() {
  const [fase, setFase] = useState('setup'); 
  const [aantalSpelers, setAantalSpelers] = useState(4);
  const [spelers, setSpelers] = useState(['', '', '', '']);
  const [startDeler, setStartDeler] = useState(0);
  const [actieveTab, setActieveTab] = useState('INVOEREN');
  
  const [rondes, setRondes] = useState([]);
  const [huidigeRondeInput, setHuidigeRondeInput] = useState([]);
  const [melding, setMelding] = useState(null);

  useEffect(() => {
    let nieuweSpelers = [...spelers];
    if (aantalSpelers > spelers.length) {
      for (let i = spelers.length; i < aantalSpelers; i++) nieuweSpelers.push('');
    } else if (aantalSpelers < spelers.length) {
      nieuweSpelers = nieuweSpelers.slice(0, aantalSpelers);
    }
    setSpelers(nieuweSpelers);
    setHuidigeRondeInput(Array(aantalSpelers).fill(0));
  }, [aantalSpelers]);

  const startSpel = () => {
    if (spelers.some(naam => !naam || naam.trim() === '')) { alert('Selecteer alle namen.'); return; }
    setFase('spelen');
  };

  return (
    <div className="flex justify-center min-h-screen bg-black text-neutral-200 font-sans">
      <div className="w-full max-w-md bg-[#080808] shadow-2xl flex flex-col relative h-screen border-x border-neutral-900 overflow-hidden">
        
        <header className="px-6 py-5 bg-[#0b0b0b] border-b border-neutral-900 flex justify-between items-center z-10">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Schoppenjagen</h2>
          <SchoppenLogo className="w-8 h-8" glow={false} />
        </header>

        {}
        <div className="flex-1 overflow-y-auto p-5">
          {fase === 'setup' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Aantal Spelers</label>
                <div className="flex p-1.5 bg-[#050505] rounded-2xl border border-neutral-850">
                  {[3, 4, 5, 6].map(n => (
                    <button key={n} onClick={() => setAantalSpelers(n)} className={`flex-1 py-4 rounded-xl font-black text-lg transition-all ${aantalSpelers === n ? 'bg-orange-500 text-black shadow-lg' : 'text-neutral-400'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Spelers & Deler</label>
                <div className="space-y-4">
                  {spelers.map((naam, i) => (
                    <div key={i} className="flex items-center space-x-3 bg-neutral-900/50 p-2 rounded-2xl border border-neutral-800">
                      <button onClick={() => setStartDeler(i)} className={`w-12 h-12 rounded-xl font-black text-sm border ${startDeler === i ? 'bg-orange-500 border-orange-400 text-black' : 'bg-neutral-950 border-neutral-800 text-neutral-500'}`}>D</button>
                      <select value={naam} onChange={(e) => { const nw = [...spelers]; nw[i] = e.target.value; setSpelers(nw); }} className="w-full bg-transparent outline-none font-bold text-sm text-white py-2">
                        <option value="">Kies speler...</option>
                        {BESCHIKBARE_NAMEN.map(n => (
                          <option key={n} value={n} className="bg-neutral-900">{n}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={startSpel} className="w-full bg-orange-500 text-black font-black py-5 rounded-2xl shadow-2xl shadow-orange-500/20 active:scale-[0.98] uppercase tracking-wider text-base">Start de Strijd</button>
            </div>
          ) : (
             <div className="text-center py-20 text-neutral-500">Spel is gestart!</div>
          )}
        </div>

        {}
        <nav className="absolute bottom-0 left-0 w-full bg-[#0c0c0c]/95 border-t border-neutral-900 flex justify-between px-1 pb-safe z-20">
          {[
            { id: 'SCOREBORD', icon: <List className="w-6 h-6" />, label: 'Scores' },
            { id: 'INVOEREN', icon: <Plus className="w-6 h-6" />, label: 'Invoer' },
            { id: 'STATISTIEKEN', icon: <BarChart3 className="w-6 h-6" />, label: 'Stats' },
            { id: 'INSTALLEREN', icon: <Download className="w-6 h-6" />, label: 'App' },
          ].map((t) => (
            <button key={t.id} onClick={() => setActieveTab(t.id)} className={`flex-1 flex flex-col items-center py-5 ${actieveTab === t.id ? 'text-orange-500' : 'text-neutral-500'}`}>
              {t.icon}
              <span className="text-[10px] font-black mt-2 uppercase tracking-wider">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
