import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Plus, List, RotateCcw, Trophy, 
  AlertCircle, Check, X, Crown, Edit2, VolumeX, ChevronDown, BarChart3, Trash2, Download, Share 
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

// Custom Schoppen-kroon Logo SVG
const SchoppenLogo = ({ className = "w-16 h-16", glow = true }) => (
  <div className="relative">
    {glow && (
      <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
    )}
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
  
  // PIN code beveiliging states
  const [toonPinModal, setToonPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // PWA Installatie states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [toonInstallatieKnop, setToonInstallatieKnop] = useState(false);
  const [isIPhone, setIsIPhone] = useState(false);

  // Statistieken in-memory en lokaal opslaan
  const [stats, setStats] = useState(() => {
    const lokaal = localStorage.getItem('schoppenjagen_stats');
    if (lokaal) {
      try {
        return JSON.parse(lokaal);
      } catch (e) {
        console.error("Fout bij laden stats:", e);
      }
    }
    const defaultStats = {};
    BESCHIKBARE_NAMEN.forEach(naam => {
      defaultStats[naam] = { gewonnen: 0, verloren: 0 };
    });
    return defaultStats;
  });

  const booAudio = useRef(null);
  const cheerAudio = useRef(null);
  const audioTimer = useRef(null);

  // Luister naar PWA installatie-events en detecteer iOS/iPhone
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setToonInstallatieKnop(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
    
    if (isIos && !isStandalone) {
      setIsIPhone(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const voerInstallatieUit = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('App succesvol geïnstalleerd!');
      setToonInstallatieKnop(false);
    }
    setDeferredPrompt(null);
  };

  const initAudio = () => {
    if (!booAudio.current) {
      booAudio.current = new Audio(SOUND_URLS.BOO);
      booAudio.current.load();
    }
    if (!cheerAudio.current) {
      cheerAudio.current = new Audio(SOUND_URLS.CHEER);
      cheerAudio.current.loop = true;
      cheerAudio.current.load();
    }
  };

  const stopGeluid = () => {
    if (booAudio.current) {
      booAudio.current.pause();
      booAudio.current.currentTime = 0;
    }
    if (cheerAudio.current) {
      cheerAudio.current.pause();
      cheerAudio.current.currentTime = 0;
    }
    if (audioTimer.current) clearTimeout(audioTimer.current);
    setIsJuichend(false);
  };

  const speelGeluid = (type) => {
    initAudio();
    stopGeluid();

    if (type === 'BOO') {
      if (booAudio.current) {
        booAudio.current.play().catch(e => console.log("Audio geblokkeerd"));
      }
    } else if (type === 'CHEER') {
      if (cheerAudio.current) {
        setIsJuichend(true);
        cheerAudio.current.play().catch(e => console.log("Audio geblokkeerd"));
        audioTimer.current = setTimeout(() => {
          stopGeluid();
        }, 30000);
      }
    }
  };

  useEffect(() => {
    let nieuweSpelers = [...spelers];
    if (aantalSpelers > spelers.length) {
      for (let i = spelers.length; i < aantalSpelers; i++) {
        nieuweSpelers.push('');
      }
    } else if (aantalSpelers < spelers.length) {
      nieuweSpelers = nieuweSpelers.slice(0, aantalSpelers);
    }
    setSpelers(nieuweSpelers);
    setHuidigeRondeInput(Array(aantalSpelers).fill(0));
    if (startDeler >= aantalSpelers) setStartDeler(0);
  }, [aantalSpelers]);

  const toonMelding = (tekst, type = 'info') => {
    setMelding({ tekst, type });
    setTimeout(() => setMelding(null), 4000);
  };

  const startSpel = () => {
    if (spelers.some(naam => !naam || naam.trim() === '')) {
      toonMelding('Selecteer een geldige naam voor alle spelers.', 'error');
      return;
    }
    const uniekeNamen = new Set(spelers);
    if (uniekeNamen.size !== spelers.length) {
      toonMelding('Iedere speler moet een unieke naam hebben.', 'error');
      return;
    }
    initAudio();
    setHuidigeDeler(startDeler);
    setFase('spelen');
    setActieveTab('INVOEREN');
    setRondes([]);
  };

  const berekenTotalen = (rondesData = rondes) => {
    const totalen = Array(aantalSpelers).fill(0);
    rondesData.forEach(ronde => {
      ronde.forEach((score, index) => {
        totalen[index] += score;
      });
    });
    return totalen;
  };

  const updateStatistieken = (eindTotalen) => {
    const minScore = Math.min(...eindTotalen);
    const maxScore = Math.max(...eindTotalen);

    setStats(prev => {
      const nieuweStats = { ...prev };
      spelers.forEach((naam, idx) => {
        if (!nieuweStats[naam]) {
          nieuweStats[naam] = { gewonnen: 0, verloren: 0 };
        }
        if (eindTotalen[idx] === minScore) {
          nieuweStats[naam].gewonnen += 1;
        }
        if (eindTotalen[idx] === maxScore) {
          nieuweStats[naam].verloren += 1;
        }
      });
      localStorage.setItem('schoppenjagen_stats', JSON.stringify(nieuweStats));
      return nieuweStats;
    });
  };

  const finalizeRonde = (scores, wasErOnderDoor = false) => {
    const delerIdx = editRondeIndex !== null ? (startDeler + editRondeIndex) % aantalSpelers : huidigeDeler;
    const uitkomstIdx = (delerIdx + 1) % aantalSpelers;
    let definitieveScores = [...scores];

    if (wasErOnderDoor) {
      const spelerNaam = spelers[uitkomstIdx];
      const tijdelijkeRondes = [...rondes];
      if (editRondeIndex !== null) tijdelijkeRondes.splice(editRondeIndex, 1);
      const totaalZonderHuidige = berekenTotalen(tijdelijkeRondes);

      if (totaalZonderHuidige[uitkomstIdx] >= 20) {
        definitieveScores = Array(aantalSpelers).fill(0).map((_, i) => i === uitkomstIdx ? -20 : 0);
        speelGeluid('CHEER');
        toonMelding(`${spelerNaam} is er onder door! -20!`, 'info');
      } else {
        definitieveScores = Array(aantalSpelers).fill(20).map((_, i) => i === uitkomstIdx ? 0 : 20);
        speelGeluid('BOO');
        toonMelding(`Te weinig punten voor -20. De rest krijgt +20!`, 'error');
      }
    } else {
      if (definitieveScores.some(s => s >= 20)) {
        speelGeluid('BOO');
      }
    }

    const volgendeRondes = editRondeIndex !== null 
      ? rondes.map((r, idx) => idx === editRondeIndex ? definitieveScores : r)
      : [...rondes, definitieveScores];

    if (editRondeIndex !== null) {
      setRondes(volgendeRondes);
      setEditRondeIndex(null);
    } else {
      setRondes(volgendeRondes);
      setHuidigeDeler((huidigeDeler + 1) % aantalSpelers);
    }

    setHuidigeRondeInput(Array(aantalSpelers).fill(0));
    setErOnderDoorVraag(null);
    setActieveTab('SCOREBORD');
    
    const actueleTotalen = berekenTotalen(volgendeRondes);
    if (actueleTotalen.some(t => t >= 100)) {
      setFase('einde');
      speelGeluid('CHEER');
      updateStatistieken(actueleTotalen);
    }
  };

  const probeerOpslaan = () => {
    const scores = huidigeRondeInput.map(v => parseInt(v) || 0);
    if (scores.reduce((a, b) => a + b, 0) !== 20) {
      toonMelding('Totaal van de scores moet precies 20 zijn!', 'error');
      return;
    }
    const dIdx = editRondeIndex !== null ? (startDeler + editRondeIndex) % aantalSpelers : huidigeDeler;
    const uIdx = (dIdx + 1) % aantalSpelers;
    
    if (scores[uIdx] === 20) {
      setErOnderDoorVraag(scores);
    } else {
      finalizeRonde(scores, false);
    }
  };

  const voegPinCijferToe = (cijfer) => {
    if (pinInput.length < 6) {
      const nieuwePin = pinInput + cijfer;
      setPinInput(nieuwePin);

      if (nieuwePin.length === 6) {
        if (nieuwePin === '123321') {
          const defaultStats = {};
          BESCHIKBARE_NAMEN.forEach(naam => {
            defaultStats[naam] = { gewonnen: 0, verloren: 0 };
          });
          setStats(defaultStats);
          localStorage.setItem('schoppenjagen_stats', JSON.stringify(defaultStats));
          toonMelding('Statistieken succesvol gewist!', 'info');
          setToonPinModal(false);
          setPinInput('');
        } else {
          toonMelding('Onjuiste pincode!', 'error');
          setPinInput('');
        }
      }
    }
  };

  const verwijderPinCijfer = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const getDropdownOpties = (huidigeIdx) => {
    return [...BESCHIKBARE_NAMEN].sort((a, b) => {
      const aGekozen = spelers.includes(a) && spelers[huidigeIdx] !== a;
      const bGekozen = spelers.includes(b) && spelers[huidigeIdx] !== b;
      if (aGekozen && !bGekozen) return 1;
      if (!aGekozen && bGekozen) return -1;
      return a.localeCompare(b);
    });
  };

  const huidigeTotalen = berekenTotalen();
  const laagsteScore = Math.min(...huidigeTotalen);
  const delerLabelIdx = editRondeIndex !== null ? (startDeler + editRondeIndex) % aantalSpelers : huidigeDeler;
  const uitkomstIdxLabel = (delerLabelIdx + 1) % aantalSpelers;
  const restValue = 20 - huidigeRondeInput.reduce((acc, v, i) => i === popupSpelerIndex ? acc : acc + v, 0);

  return (
    <div className="flex justify-center min-h-screen bg-black text-neutral-200 font-sans selection:bg-orange-500/30">
      <div className="w-full max-w-md bg-[#080808] shadow-2xl flex flex-col relative h-screen border-x border-neutral-900 overflow-hidden">
        
        {melding && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-5 duration-350">
            <div className={`px-6 py-3.5 rounded-2xl shadow-2xl font-bold flex items-center space-x-3 backdrop-blur-md border ${
              melding.type === 'error' ? 'bg-red-600/90 border-red-500 text-white' : 'bg-orange-500/95 border-orange-400 text-black'
            }`}>
              <AlertCircle className="w-5 h-5" />
              <span>{melding.tekst}</span>
            </div>
          </div>
        )}

        <header className="px-6 py-5 bg-[#0b0b0b] border-b border-neutral-900 flex justify-between items-center z-10 backdrop-blur-md">
          <div className="text-left">
            <h2 className="text-xl font-black text-white tracking-tight leading-none uppercase">
              {fase === 'setup' && actieveTab === 'INVOEREN' 
                ? 'Nieuw Spel' 
                : actieveTab === 'SCOREBORD' 
                  ? 'Scorebord' 
                  : actieveTab === 'STATISTIEKEN' 
                    ? 'Statistieken' 
                    : actieveTab === 'INSTALLEREN' 
                      ? 'Installeer App' 
                      : editRondeIndex !== null 
                        ? 'Wijzig Ronde' 
                        : 'Invoeren'}
            </h2>
            {actieveTab !== 'STATISTIEKEN' && actieveTab !== 'INSTALLEREN' && fase !== 'setup' && (
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.25em] mt-1.5 flex items-center text-left">
                Deler: <span className="text-white ml-1">{spelers[delerLabelIdx]}</span>
              </p>
            )}
            {actieveTab === 'STATISTIEKEN' && (
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.25em] mt-1.5 text-left">
                Winst / Verlies overzicht
              </p>
            )}
            {fase === 'setup' && actieveTab === 'INVOEREN' && (
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.25em] mt-1.5 text-left">
                Kamelaadjes editie
              </p>
            )}
            {actieveTab === 'INSTALLEREN' && (
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.25em] mt-1.5 text-left">
                Zet op je beginscherm
              </p>
            )}
          </div>
          {isJuichend ? (
            <button 
              onClick={stopGeluid} 
              className="w-10 h-10 bg-red-600/20 text-red-400 rounded-full flex items-center justify-center animate-pulse border border-red-500/30 active:scale-95 transition-transform"
              title="Stop applaus"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          ) : (
            <SchoppenLogo className="w-8 h-8" glow={false} />
          )}
        </header>

        {}
        <div className="flex-1 overflow-y-auto pb-28 p-4 scroll-smooth">
          {fase === 'setup' && actieveTab === 'INVOEREN' ? (
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
                      <button onClick={() => setStartDeler(i)} className={`w-9 h-9 rounded-lg font-black text-xs border ${startDeler === i ? 'bg-orange-500 border-orange-400 text-black shadow-lg shadow-orange-500/20' : 'bg-neutral-900 border-neutral-850 text-neutral-500'}`}>D</button>
                      <div className="relative flex-1">
                        <select value={naam} onChange={(e) => { const nw = [...spelers]; nw[i] = e.target.value; setSpelers(nw); }} className="w-full bg-neutral-900 border rounded-lg pl-3 pr-8 py-2.5 outline-none font-bold text-xs text-white border-neutral-800 appearance-none">
                          <option value="">Kies speler...</option>
                          {getDropdownOpties(i).map(n => {
                            const isGekozen = spelers.includes(n) && spelers[i] !== n;
                            return (
                              <option key={n} value={n} disabled={isGekozen} className={isGekozen ? "text-neutral-600 bg-neutral-950" : "text-white bg-neutral-950"}>
                                {n} {isGekozen ? '(Gekozen)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={startSpel} className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-5 rounded-2xl shadow-2xl shadow-orange-500/10 active:scale-[0.98] transition-all uppercase text-base tracking-wider mt-4 border border-orange-400/20">
                Start de Strijd
              </button>
            </div>
          ) : fase === 'einde' ? (
            <div className="text-center p-8 bg-neutral-950 rounded-3xl border border-orange-500/20 shadow-2xl relative overflow-hidden backdrop-blur-sm animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-amber-500"></div>
              <Trophy className="w-16 h-16 text-orange-500 mx-auto mb-6 animate-bounce" />
              <h2 className="text-3xl font-black mb-6 text-white uppercase tracking-tight">Eindstand</h2>
              <div className="space-y-2 text-left">
                {spelers.map((s, i) => ({ n: s, sc: huidigeTotalen[i] })).sort((a,b) => a.sc - b.sc).map((s, i) => (
                  <div key={i} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                    i === 0 
                      ? 'bg-orange-500/10 text-orange-500 font-bold border-orange-500/30 shadow-inner' 
                      : 'bg-neutral-900 border-neutral-850 text-neutral-300'
                  }`}>
                    <span className="font-bold">{i+1}. {s.n}</span>
                    <span className="font-black">{s.sc} pt</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setFase('setup'); stopGeluid(); setRondes([]); setSpelers(['', '', '', '']); }} className="w-full bg-white text-black py-4.5 rounded-2xl font-black mt-8 shadow-xl hover:bg-neutral-100 active:scale-95 transition-all text-sm tracking-wider uppercase">Nieuw Spel</button>
            </div>
          ) : actieveTab === 'SCOREBORD' ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              {fase === 'setup' ? (
                <div className="text-center py-20 bg-neutral-950 rounded-3xl border border-neutral-900 p-8">
                  <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mb-6">Nog geen actief spel</p>
                  <button onClick={() => setActieveTab('INVOEREN')} className="w-full bg-orange-500 text-black font-black py-4 rounded-xl text-xs uppercase tracking-wider">Start Een Spel</button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => {setEditRondeIndex(null); setHuidigeRondeInput(Array(aantalSpelers).fill(0)); setActieveTab('INVOEREN');}} 
                    className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-5 rounded-2xl shadow-xl shadow-orange-500/5 flex items-center justify-center transition-all active:scale-[0.98] uppercase tracking-wider text-sm border border-orange-400/20"
                  >
                    <Plus className="mr-2 w-5 h-5 stroke-[3]" /> Nieuwe Ronde Invoeren
                  </button>
                  
                  <div className="bg-neutral-950 border border-neutral-900 rounded-[2rem] overflow-hidden shadow-2xl pb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-sm font-sans">
                        <thead className="bg-[#050505] text-neutral-400 border-b border-neutral-900">
                          <tr>
                            <th className="p-4 w-12 border-r border-neutral-900 text-neutral-600 font-black text-[10px] tracking-wider uppercase text-center">#</th>
                            {spelers.map((s, i) => (
                              <th key={i} className="p-4 text-neutral-200 font-black text-xs tracking-wider uppercase text-center">{s}</th>
                            ))}
                            <th className="w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 bg-neutral-950/20 text-neutral-300">
                          {rondes.length === 0 ? (
                            <tr>
                              <td colSpan={aantalSpelers + 2} className="py-16 italic text-neutral-500 text-center text-sm">Nog geen rondes gespeeld.</td>
                            </tr>
                          ) : (
                            rondes.map((r, ri) => (
                              <tr key={ri} className="hover:bg-neutral-900/40 transition-colors">
                                <td className="p-4 text-neutral-500 border-r border-neutral-900 font-bold text-xs">{ri+1}</td>
                                {r.map((s, si) => (
                                  <td key={si} className="p-4 text-center">
                                    <span className={`inline-block px-2.5 py-1 rounded-lg font-bold ${
                                      s < 0 
                                        ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                                        : s >= 13 
                                          ? 'bg-red-500/10 text-red-500 font-black' 
                                          : 'text-neutral-300'
                                    }`}>
                                      {s}
                                    </span>
                                  </td>
                                ))}
                                <td className="p-4">
                                  <button 
                                    onClick={() => {
                                      setEditRondeIndex(ri); 
                                      setHuidigeRondeInput([...rondes[ri]]); 
                                      setActieveTab('INVOEREN');
                                    }} 
                                    className="text-neutral-500 hover:text-orange-500 p-2 rounded-lg hover:bg-neutral-900 transition-all active:scale-90"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {rondes.length > 0 && (
                          <tfoot className="bg-[#050505] font-bold border-t border-neutral-900">
                            <tr className="divide-x divide-neutral-900">
                              <td className="p-5 text-neutral-500 border-r border-neutral-900 text-[10px] font-black tracking-wider uppercase text-center align-middle">Totaal</td>
                              {huidigeTotalen.map((t, i) => (
                                <td key={i} className="p-5 text-center align-middle">
                                  <span className={`text-base font-black ${t === laagsteScore ? 'text-orange-500' : 'text-white'}`}>{t}</span>
                                </td>
                              ))}
                              <td></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : actieveTab === 'STATISTIEKEN' ? (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-900 rounded-[2rem] overflow-hidden shadow-2xl p-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-6 border-b border-neutral-900 pb-4">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">Ranglijst</h3>
                  <button 
                    onClick={() => setToonPinModal(true)}
                    className="text-red-500/60 hover:text-red-400 text-xs font-black uppercase tracking-widest flex items-center space-x-1.5 transition-colors p-2 rounded-lg hover:bg-neutral-900"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Stats Resetten</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {BESCHIKBARE_NAMEN
                    .map(naam => ({
                      naam,
                      gewonnen: stats[naam]?.gewonnen || 0,
                      verloren: stats[naam]?.verloren || 0
                    }))
                    .sort((a, b) => {
                      if (b.gewonnen !== a.gewonnen) return b.gewonnen - a.gewonnen;
                      return a.verloren - b.verloren;
                    })
                    .map((p, idx) => (
                      <div key={p.naam} className="flex justify-between items-center p-4 bg-neutral-900/40 border border-neutral-900 rounded-2xl">
                        <div className="flex items-center space-x-3">
                          <span className="text-neutral-600 font-black text-sm w-5">{idx + 1}.</span>
                          <span className="text-white font-extrabold">{p.naam}</span>
                        </div>
                        <div className="flex space-x-3 text-xs">
                          <span className="px-3 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/15 rounded-xl font-black">
                            {p.gewonnen} Winst
                          </span>
                          <span className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-xl font-bold">
                            {p.verloren} Verlies
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : actieveTab === 'INSTALLEREN' ? (
            /* Volledig gevuld download- en installatie-dashboard */
            <div className="p-4 animate-in fade-in duration-300">
              <div className="bg-[#0c0c0c] border border-neutral-900 rounded-[2rem] p-6 text-center space-y-6 shadow-xl">
                <SchoppenLogo className="w-14 h-14 mx-auto" />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Installeer Schoppenjagen</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto font-sans">
                    Zet Schoppenjagen als volwaardige app op je beginscherm. Zo start je de game sneller en werkt hij zelfs offline!
                  </p>
                </div>

                {/* Automatische of handmatige actie gebaseerd op browser/toestel */}
                {toonInstallatieKnop ? (
                  <div className="space-y-4">
                    <button 
                      onClick={voerInstallatieUit}
                      className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/10 transition-all text-xs uppercase tracking-wider border border-orange-400/20"
                    >
                      <Download className="w-4 h-4 stroke-[3]" />
                      <span>Installeer Nu</span>
                    </button>
                    <p className="text-[10px] text-neutral-500 italic">Druk op de knop om de app direct toe te voegen aan je startscherm.</p>
                  </div>
                ) : isIPhone ? (
                  <div className="text-left bg-neutral-950 p-5 rounded-2xl border border-orange-500/10 space-y-4 font-sans">
                    <div className="flex items-center space-x-2 text-orange-500 font-extrabold text-xs uppercase tracking-wider border-b border-neutral-900 pb-2">
                      <Share className="w-4 h-4" />
                      <span>iPhone Safari Handleiding</span>
                    </div>
                    <ol className="list-decimal list-inside text-xs text-neutral-400 space-y-3 pl-1">
                      <li>Tik onderin de browser op de <span className="text-white font-bold">Deel-knop</span> (vierkantje met pijl omhoog).</li>
                      <li>Scroll naar beneden in het menu.</li>
                      <li>Tik op <span className="text-white font-bold">Zet op beginscherm</span>.</li>
                      <li>Druk rechtsboven op <span className="text-orange-500 font-black">Voeg toe</span>.</li>
                    </ol>
                  </div>
                ) : (
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-900 text-xs text-neutral-400 leading-relaxed">
                    <p className="font-bold text-neutral-300 mb-1">Status: Geïnstalleerd of Browser niet ondersteund</p>
                    Als de knop hierboven niet zichtbaar is, kun je in de browser (bijv. Chrome of Safari) altijd op de drie puntjes of 'Delen' drukken en kiezen voor <span className="text-white font-bold">'Toevoegen aan startscherm'</span>.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {/* Dynamisch gesorteerde spelerslijst op basis van tussenstand */}
                {(() => {
                  const heeftScores = rondes.length > 0;
                  const spelersMetStatus = spelers.map((naam, index) => ({
                    naam,
                    index,
                    score: huidigeTotalen[index]
                  }));

                  const gesorteerdeSpelers = heeftScores 
                    ? [...spelersMetStatus].sort((a, b) => b.score - a.score) 
                    : spelersMetStatus;

                  return gesorteerdeSpelers.map((speler) => {
                    const i = speler.index;
                    const s = speler.naam;
                    const isUitkomst = i === uitkomstIdxLabel;
                    const isDelerSpeler = i === delerLabelIdx;

                    return (
                      <div 
                        key={i} 
                        className={`bg-[#0d0d0d] border p-4 rounded-3xl flex items-center justify-between transition-all duration-300 ${
                          isUitkomst 
                            ? 'border-orange-500/40 ring-1 ring-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.08)] bg-neutral-950' 
                            : 'border-neutral-900'
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-extrabold flex items-center text-neutral-100 text-base">
                            {s} 
                            {isDelerSpeler && (
                              <span className="ml-2 text-[9px] bg-neutral-900 text-neutral-400 px-2 py-1 rounded-lg font-black uppercase tracking-wider border border-neutral-800">
                                Deler
                              </span>
                            )}
                            {isUitkomst && (
                              <span className="ml-2 text-[9px] bg-orange-500/10 text-orange-500 px-2 py-1 rounded-lg font-black uppercase tracking-wider border border-orange-500/10">
                                Uitkomen
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-wider text-left">
                            Totaal: <span className="text-neutral-300 font-extrabold">{huidigeTotalen[i]} pt</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {initAudio(); setPopupSpelerIndex(i);}} 
                          className="w-16 h-14 rounded-2xl font-black bg-[#050505] border border-neutral-800 text-2xl shadow-inner active:bg-neutral-900 active:scale-95 transition-all text-white flex items-center justify-center"
                        >
                          {huidigeRondeInput[i]}
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="flex justify-between items-center p-5 bg-[#050505] rounded-3xl mt-6 border border-neutral-900 shadow-inner">
                <span className="text-neutral-500 text-[10px] font-black uppercase tracking-widest text-left">Verdeeld (moet 20 zijn):</span>
                <span className={`text-xl font-black transition-colors ${
                  huidigeRondeInput.reduce((a,b)=>a+b,0) === 20 ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {huidigeRondeInput.reduce((a,b)=>a+b,0)} / 20
                </span>
              </div>

              <button 
                onClick={probeerOpslaan} 
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-5 rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center uppercase text-base tracking-wider mt-6 border border-orange-400/20"
              >
                <Check className="mr-2 w-5 h-5 stroke-[3]" /> Opslaan
              </button>
              
              {editRondeIndex !== null && (
                <button 
                  onClick={() => {setEditRondeIndex(null); setActieveTab('SCOREBORD');}} 
                  className="w-full bg-neutral-900 text-neutral-400 py-3.5 rounded-2xl font-bold hover:text-white transition-all text-xs uppercase tracking-wider"
                >
                  Annuleren
                </button>
              )}
            </div>
          )}
        </div>

        {}
        {erOnderDoorVraag && (
          <div className="absolute inset-0 bg-black/95 z-[70] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0c0c0c] border border-amber-500/30 rounded-[2.5rem] p-10 max-w-sm shadow-2xl text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                <Crown className="w-8 h-8 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-tight text-center">Er onder door?</h3>
              <p className="text-neutral-400 mb-8 text-sm leading-relaxed text-center font-sans">
                Heeft <span className="text-amber-500 font-extrabold underline">{spelers[uitkomstIdxLabel]}</span> echt alle slagen gepakt deze ronde?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => finalizeRonde(erOnderDoorVraag, false)} className="bg-neutral-900 text-neutral-300 py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform">NEE</button>
                <button onClick={() => finalizeRonde(erOnderDoorVraag, true)} className="bg-orange-500 text-black py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform uppercase tracking-wider shadow-lg shadow-orange-500/10">JA!</button>
              </div>
            </div>
          </div>
        )}

        {/* Volledig dekkend invoerscherm */}
        {popupSpelerIndex !== null && (
          <div className="absolute inset-0 bg-[#050505] z-50 flex flex-col animate-in slide-in-from-bottom-12 duration-350">
            <div className="pt-14 px-8 pb-6 bg-[#0c0c0c] border-b border-neutral-900 flex justify-between items-end shadow-2xl">
              <div className="text-left">
                <h3 className="text-2xl font-black text-white leading-tight">Score {spelers[popupSpelerIndex]}</h3>
                <p className="text-orange-500 font-bold uppercase text-[10px] tracking-widest mt-1 text-left">
                  Nog {restValue} over
                </p>
              </div>
              <button 
                onClick={() => setPopupSpelerIndex(null)} 
                className="p-3 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-400 shadow-lg active:scale-90 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-4 gap-3.5 content-start pb-28">
                {GELDIGE_SCORES.map(num => {
                  const isTeGroot = num > restValue;
                  return (
                    <button 
                      key={num} 
                      disabled={isTeGroot} 
                      onClick={() => { 
                        const nw = [...huidigeRondeInput]; 
                        nw[popupSpelerIndex] = num; 
                        setHuidigeRondeInput(nw); 
                        setPopupSpelerIndex(null); 
                      }} 
                      className={`h-15 rounded-2xl font-black text-lg transition-all flex items-center justify-center ${
                        huidigeRondeInput[popupSpelerIndex] === num 
                          ? 'bg-orange-500 text-black shadow-xl shadow-orange-500/10 ring-2 ring-orange-400/50' 
                          : isTeGroot 
                            ? 'bg-[#050505] text-neutral-800 border-transparent opacity-[0.06] cursor-not-allowed' 
                            : 'bg-neutral-900 border border-neutral-800 active:scale-90 text-white hover:bg-neutral-850'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Beveiligde reset PIN overlay */}
        {toonPinModal && (
          <div className="absolute inset-0 bg-black/98 z-[90] flex flex-col justify-center items-center p-6 animate-in fade-in duration-300">
            <div className="bg-[#0c0c0c] border border-neutral-900 rounded-[2.5rem] p-8 w-full max-w-sm text-center space-y-6 shadow-2xl relative">
              <button 
                onClick={() => { setToonPinModal(false); setPinInput(''); }} 
                className="absolute top-5 right-5 p-2 bg-neutral-900 rounded-full text-neutral-400 active:scale-90 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="space-y-2 pt-4">
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Beveiligde Actie</h3>
                <p className="text-xs text-neutral-400">Voer de 6-cijferige pincode in om de statistieken te wissen.</p>
              </div>

              <div className="flex justify-center space-x-3 py-2">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4.5 h-4.5 rounded-full border transition-all duration-200 ${
                      i < pinInput.length 
                        ? 'bg-orange-500 border-orange-400 scale-110 shadow-[0_0_8px_rgba(249,115,22,0.4)]' 
                        : 'bg-neutral-950 border-neutral-800'
                    }`}
                  ></div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3.5 max-w-[280px] mx-auto pt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button 
                    key={num}
                    onClick={() => voegPinCijferToe(String(num))}
                    className="h-14 rounded-2xl bg-neutral-900 border border-neutral-850 text-white font-black text-xl active:bg-neutral-800 active:scale-95 transition-all flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <button 
                  onClick={() => { setToonPinModal(false); setPinInput(''); }}
                  className="h-14 rounded-2xl bg-neutral-950 text-red-500 font-extrabold text-xs active:bg-neutral-900 active:scale-95 transition-all flex items-center justify-center uppercase tracking-wider"
                >
                  Annuleer
                </button>
                <button 
                  onClick={() => voegPinCijferToe('0')}
                  className="h-14 rounded-2xl bg-neutral-900 border border-neutral-850 text-white font-black text-xl active:bg-neutral-800 active:scale-95 transition-all flex items-center justify-center"
                >
                  0
                </button>
                <button 
                  onClick={verwijderPinCijfer}
                  className="h-14 rounded-2xl bg-neutral-900 border border-neutral-850 text-orange-500 font-extrabold text-xs active:bg-neutral-800 active:scale-95 transition-all flex items-center justify-center uppercase tracking-wider"
                >
                  Terug
                </button>
              </div>
            </div>
          </div>
        )}

        {bevestigResetVraag && (
          <div className="absolute inset-0 bg-black/95 z-[70] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0c0c0c] border border-red-500/30 rounded-[2.5rem] p-8 max-w-sm shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <RotateCcw className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-tight text-center">Spel Resetten?</h3>
              <p className="text-neutral-400 mb-8 text-sm leading-relaxed text-center font-sans">
                Weet je zeker dat je een nieuw spel wilt starten? Alle huidige scores gaan definitief verloren.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setBevestigResetVraag(false)} className="bg-neutral-900 text-neutral-300 py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform">ANNULEREN</button>
                <button 
                  onClick={() => {
                    setBevestigResetVraag(false);
                    setFase('setup'); 
                    stopGeluid(); 
                    setRondes([]);
                    setSpelers(['', '', '', '']);
                  }} 
                  className="bg-red-500 text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform uppercase tracking-wider shadow-lg shadow-red-500/10"
                >
                  JA, RESET
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="absolute bottom-0 left-0 w-full bg-[#0c0c0c]/95 border-t border-neutral-900 flex justify-between px-1 pb-safe z-20 backdrop-blur-xl">
          {[
            { id: 'SCOREBORD', icon: <List className="w-5 h-5" />, label: 'Scores' },
            { id: 'INVOEREN', icon: <Plus className="w-5 h-5" />, label: 'Invoer' },
            { id: 'STATISTIEKEN', icon: <BarChart3 className="w-5 h-5" />, label: 'Stats' },
            { id: 'INSTALLEREN', icon: <Download className="w-5 h-5" />, label: 'App' },
          ].map((t) => (
            <button 
              key={t.id} 
              onClick={() => {initAudio(); setActieveTab(t.id);}} 
              className={`flex-1 flex flex-col items-center py-4 transition-all duration-300 ${
                actieveTab === t.id ? 'text-orange-500 scale-105 font-black' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t.icon}
              <span className="text-[9px] font-black mt-1.5 uppercase tracking-wider">{t.label}</span>
            </button>
          ))}
          <button 
            onClick={() => { setBevestigResetVraag(true); }} 
            className="flex-1 flex flex-col items-center py-4 text-red-500/40 hover:text-red-500 active:scale-95 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[9px] font-black mt-1.5 uppercase tracking-wider">Reset</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
