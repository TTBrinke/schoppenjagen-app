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

const GELDIGE_SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16, 17, 18, 19, 20];

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
  const [huidigeDeler, setHuidigeDeler] = useState(0);
  const [rondes, setRondes] = useState([]);
  const [huidigeRondeInput, setHuidigeRondeInput] = useState([]);
  const [actieveTab, setActieveTab] = useState('INVOEREN');
  const [melding, setMelding] = useState(null);
  const [popupSpelerIndex, setPopupSpelerIndex] = useState(null);
  const [editRondeIndex, setEditRondeIndex] = useState(null);
  const [erOnderDoorVraag, setErOnderDoorVraag] = useState(null);
  const [isJuichend, setIsJuichend] = useState(false);
  const [bevestigResetVraag, setBevestigResetVraag] = useState(false);
  const [toonPinModal, setToonPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [toonInstallatieKnop, setToonInstallatieKnop] = useState(false);
  const [isIPhone, setIsIPhone] = useState(false);

  const [stats, setStats] = useState(() => {
    const lokaal = localStorage.getItem('schoppenjagen_stats');
    if (lokaal) try { return JSON.parse(lokaal); } catch (e) { console.error(e); }
    const defaultStats = {};
    BESCHIKBARE_NAMEN.forEach(n => defaultStats[n] = { gewonnen: 0, verloren: 0 });
    return defaultStats;
  });

  const booAudio = useRef(null);
  const cheerAudio = useRef(null);
  const audioTimer = useRef(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); setToonInstallatieKnop(true); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
    if (isIos && !isStandalone) setIsIPhone(true);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const voerInstallatieUit = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setToonInstallatieKnop(false);
    setDeferredPrompt(null);
  };

  const startSpel = () => {
    if (spelers.some(naam => !naam || naam.trim() === '')) { toonMelding('Selecteer alle spelers.', 'error'); return; }
    setHuidigeDeler(startDeler);
    setFase('spelen');
    setRondes([]);
  };

  const berekenTotalen = (rondesData = rondes) => {
    const totalen = Array(aantalSpelers).fill(0);
    rondesData.forEach(r => r.forEach((s, i) => totalen[i] += s));
    return totalen;
  };

  const toonMelding = (tekst, type = 'info') => {
    setMelding({ tekst, type });
    setTimeout(() => setMelding(null), 3000);
  };

  const huidigeTotalen = berekenTotalen();
  const laagsteScore = Math.min(...huidigeTotalen);
  const delerLabelIdx = editRondeIndex !== null ? (startDeler + editRondeIndex) % aantalSpelers : huidigeDeler;
  const uitkomstIdxLabel = (delerLabelIdx + 1) % aantalSpelers;

  // Sorteeropties voor namen (Gekozen namen onderaan)
  const getDropdownOpties = (huidigeIdx) => {
    return [...BESCHIKBARE_NAMEN].sort((a, b) => {
      const aGekozen = spelers.includes(a) && spelers[huidigeIdx] !== a;
      const bGekozen = spelers.includes(b) && spelers[huidigeIdx] !== b;
      if (aGekozen && !bGekozen) return 1;
      if (!aGekozen && bGekozen) return -1;
      return 0;
    });
  };

  return (
    <div className="flex justify-center min-h-screen bg-black text-neutral-200 font-sans">
      <div className="w-full max-w-md bg-[#080808] shadow-2xl flex flex-col relative h-screen border-x border-neutral-900 overflow-hidden">
        
        {/* Header - Altijd zichtbaar */}
        <header className="px-6 py-5 bg-[#0b0b0b] border-b border-neutral-900 flex justify-between items-center z-10">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Schoppenjagen</h2>
          <SchoppenLogo className="w-8 h-8" glow={false} />
        </header>

        {/* Hoofdinhoud - Wisselt per Tab */}
        <div className="flex-1 overflow-y-auto pb-28 p-4">
          {actieveTab === 'INVOEREN' ? (
            fase === 'setup' ? (
              <div className="space-y-6 animate-in fade-in duration-300">
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

                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Spelers & Eerste Deler</label>
                  <div className="space-y-3">
                    {spelers.map((naam, i) => (
                      <div key={i} className="flex items-center space-x-3 bg-neutral-950 p-1.5 rounded-xl border border-neutral-900">
                        <button onClick={() => setStartDeler(i)} className={`w-9 h-9 rounded-lg font-black text-xs border ${startDeler === i ? 'bg-orange-500 border-orange-400 text-black' : 'bg-neutral-900 border-neutral-850 text-neutral-500'}`}>D</button>
                        <select value={naam} onChange={(e) => { const nw = [...spelers]; nw[i] = e.target.value; setSpelers(nw); }} className="w-full bg-neutral-900 border rounded-lg pl-3 py-2.5 outline-none font-bold text-xs text-white border-neutral-800">
                          <option value="">Kies speler...</option>
                          {getDropdownOpties(i).map(n => {
                            const isGekozen = spelers.includes(n) && spelers[i] !== n;
                            return (
                              <option key={n} value={n} disabled={isGekozen} className={isGekozen ? "text-neutral-500 bg-neutral-950" : "text-white bg-neutral-900"}>
                                {n} {isGekozen ? '(Gekozen)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={startSpel} className="w-full bg-orange-500 text-black font-black py-4.5 rounded-2xl shadow-xl active:scale-[0.98] uppercase tracking-wider text-sm">Start de Strijd</button>
              </div>
            ) : (
                /* Hier komt je speel-scherm (tijdelijke placeholder) */
                <div className="text-center py-20 text-neutral-500">Spel is bezig...</div>
            )
          ) : actieveTab === 'INSTALLEREN' ? (
            <div className="text-center p-6 space-y-4">
              <p className="text-white font-black">App Installatie</p>
              {/* Hier voeg je eventueel de rest van de installatie-logica toe zoals eerder */}
            </div>
          ) : (
            <div className="text-center py-20 text-neutral-500">Tabblad {actieveTab} is in ontwikkeling.</div>
          )}
        </div>

        {/* Navigatie onderin */}
        <nav className="absolute bottom-0 left-0 w-full bg-[#0c0c0c]/95 border-t border-neutral-900 flex justify-between px-1 pb-safe z-20">
          {[
            { id: 'SCOREBORD', icon: <List className="w-5 h-5" />, label: 'Scores' },
            { id: 'INVOEREN', icon: <Plus className="w-5 h-5" />, label: 'Invoer' },
            { id: 'STATISTIEKEN', icon: <BarChart3 className="w-5 h-5" />, label: 'Stats' },
            { id: 'INSTALLEREN', icon: <Download className="w-5 h-5" />, label: 'App' },
          ].map((t) => (
            <button key={t.id} onClick={() => setActieveTab(t.id)} className={`flex-1 flex flex-col items-center py-4 ${actieveTab === t.id ? 'text-orange-500' : 'text-neutral-500'}`}>
              {t.icon}
              <span className="text-[9px] font-black mt-1.5 uppercase tracking-wider">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
