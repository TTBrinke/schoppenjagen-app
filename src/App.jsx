import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, List, Settings, RotateCcw, Trophy, AlertCircle, Check, X, Crown, Edit2 } from 'lucide-react';

// HIER KUN JE DE GELUIDEN AANPASSEN
const SOUND_URLS = {
  BOO: "https://www.myinstants.com/media/sounds/crowd-boo-6126.mp3",
  CHEER: "https://www.myinstants.com/media/sounds/applause-7.mp3"
};

const App = () => {
  const [fase, setFase] = useState('setup'); 
  const [aantalSpelers, setAantalSpelers] = useState(4);
  const [spelers, setSpelers] = useState(['Zuid', 'West', 'Noord', 'Oost']);
  const [startDeler, setStartDeler] = useState(0);
  const [huidigeDeler, setHuidigeDeler] = useState(0);
  const [rondes, setRondes] = useState([]);
  const [huidigeRondeInput, setHuidigeRondeInput] = useState([]);
  const [actieveTab, setActieveTab] = useState('INVOEREN');
  const [melding, setMelding] = useState(null);
  const [popupSpelerIndex, setPopupSpelerIndex] = useState(null);
  
  // State voor wijzigen van een ronde
  const [editRondeIndex, setEditRondeIndex] = useState(null);
  
  // State voor de "Er onder door" vraag
  const [erOnderDoorVraag, setErOnderDoorVraag] = useState(null);

  useEffect(() => {
    let nieuweSpelers = [...spelers];
    if (aantalSpelers > spelers.length) {
      for (let i = spelers.length; i < aantalSpelers; i++) {
        nieuweSpelers.push(`Speler ${i + 1}`);
      }
    } else if (aantalSpelers < spelers.length) {
      nieuweSpelers = nieuweSpelers.slice(0, aantalSpelers);
    }
    setSpelers(nieuweSpelers);
    setHuidigeRondeInput(Array(aantalSpelers).fill(0));
    if (startDeler >= aantalSpelers) setStartDeler(0);
  }, [aantalSpelers]);

  const speelGeluid = (url) => {
    try {
      const audio = new Audio(url);
      audio.volume = 0.6;
      audio.play().catch(e => {
        console.warn("Audio kon niet worden afgespeeld. Klik eerst ergens op het scherm.");
      });
    } catch (err) {
      console.error("Audio error:", err);
    }
  };

  const toonMelding = (tekst, type = 'info') => {
    setMelding({ tekst, type });
    setTimeout(() => setMelding(null), 4000);
  };

  const startSpel = () => {
    if (spelers.some(naam => naam.trim() === '')) {
      toonMelding('Vul a.u.b. alle spelernamen in.', 'error');
      return;
    }
    setHuidigeDeler(startDeler);
    setFase('spelen');
    setActieveTab('INVOEREN');
    setRondes([]);
    setEditRondeIndex(null);
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

  const finalizeRonde = (scores, wasErOnderDoor = false) => {
    const huidigeTotalen = berekenTotalen();
    let definitieveScores = [...scores];
    
    const relevanteDeler = editRondeIndex !== null 
      ? (startDeler + editRondeIndex) % aantalSpelers 
      : huidigeDeler;
      
    const magOnderDoorIndex = (relevanteDeler + 1) % aantalSpelers;

    if (wasErOnderDoor) {
      const spelerNaam = spelers[magOnderDoorIndex];
      const tijdelijkeRondes = [...rondes];
      if (editRondeIndex !== null) tijdelijkeRondes.splice(editRondeIndex, 1);
      const totaalZonderHuidige = berekenTotalen(tijdelijkeRondes);

      if (totaalZonderHuidige[magOnderDoorIndex] >= 20) {
        definitieveScores = Array(aantalSpelers).fill(0).map((_, i) => i === magOnderDoorIndex ? -20 : 0);
        toonMelding(`${spelerNaam} is er onder door! -20 punten.`, 'info');
      } else {
        definitieveScores = Array(aantalSpelers).fill(20).map((_, i) => i === magOnderDoorIndex ? 0 : 20);
        toonMelding(`${spelerNaam} had te weinig punten voor -20. Rest krijgt +20!`, 'error');
      }
    }

    if (editRondeIndex !== null) {
      const nieuweRondes = [...rondes];
      nieuweRondes[editRondeIndex] = definitieveScores;
      setRondes(nieuweRondes);
      setEditRondeIndex(null);
      toonMelding("Ronde gewijzigd.", "info");
    } else {
      const nieuweRondes = [...rondes, definitieveScores];
      setRondes(nieuweRondes);
      setHuidigeDeler((huidigeDeler + 1) % aantalSpelers);
    }

    setHuidigeRondeInput(Array(aantalSpelers).fill(0));
    setErOnderDoorVraag(null);
    
    const nieuweTotalen = berekenTotalen(editRondeIndex !== null ? rondes : [...rondes, definitieveScores]);
    if (nieuweTotalen.some(t => t >= 100)) {
      setFase('einde');
      speelGeluid(SOUND_URLS.CHEER);
    } else {
      setActieveTab('SCOREBORD');
    }
  };

  const probeerRondeToeTeVoegen = () => {
    const scores = huidigeRondeInput.map(val => parseInt(val, 10) || 0);
    const totaalPunten = scores.reduce((a, b) => a + b, 0);

    if (totaalPunten !== 20) {
      toonMelding(`De totale score moet precies 20 zijn! (Nu: ${totaalPunten})`, 'error');
      return;
    }

    const relevanteDeler = editRondeIndex !== null 
      ? (startDeler + editRondeIndex) % aantalSpelers 
      : huidigeDeler;
    const magOnderDoorIndex = (relevanteDeler + 1) % aantalSpelers;
    
    if (scores[magOnderDoorIndex] === 20) {
      setErOnderDoorVraag(scores);
    } else {
      finalizeRonde(scores, false);
    }
  };

  const startWijzigenRonde = (index) => {
    setEditRondeIndex(index);
    setHuidigeRondeInput([...rondes[index]]);
    setActieveTab('INVOEREN');
    window.scrollTo(0, 0);
  };

  const selecteerScore = (waarde) => {
    if (waarde > 13) {
      speelGeluid(SOUND_URLS.BOO);
    }
    const nw = [...huidigeRondeInput];
    nw[popupSpelerIndex] = waarde;
    setHuidigeRondeInput(nw);
    setPopupSpelerIndex(null);
  };

  const huidigeTotalen = berekenTotalen();
  const laagsteScore = huidigeTotalen.length > 0 ? Math.min(...huidigeTotalen) : 0;
  
  const relevanteDeler = editRondeIndex !== null 
    ? (startDeler + editRondeIndex) % aantalSpelers 
    : huidigeDeler;
  const magOnderDoorIndex = (relevanteDeler + 1) % aantalSpelers;

  const totaalIngevuld = huidigeRondeInput.reduce((acc, val, idx) => 
    idx === popupSpelerIndex ? acc : acc + val, 0
  );
  const puntenResterend = 20 - totaalIngevuld;

  if (fase === 'setup') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950 text-slate-200 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
              <Crown className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight text-center leading-tight">Schoppenjagen<br/><span className="text-emerald-400 text-lg font-medium">Met de Kamelaadjes</span></h1>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Aantal spelers (3-6)</label>
              <div className="flex space-x-2">
                {[3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    onClick={() => setAantalSpelers(num)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      aantalSpelers === num
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Spelernamen & Eerste Deler</label>
              <div className="space-y-3">
                {spelers.map((naam, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setStartDeler(index)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all font-bold ${
                        startDeler === index 
                          ? 'bg-emerald-500 text-white shadow-md' 
                          : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                      }`}
                    >
                      D
                    </button>
                    <input
                      type="text"
                      value={naam}
                      onChange={(e) => {
                        const nw = [...spelers];
                        nw[index] = e.target.value;
                        setSpelers(nw);
                      }}
                      className="w-full bg-transparent px-2 py-2 text-white focus:outline-none"
                      placeholder={`Speler ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={startSpel}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center transition-all"
            >
              <Play className="mr-2 w-5 h-5 fill-current" /> Start de Strijd
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen bg-slate-950 font-sans text-slate-200">
      
      {melding && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-5">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center space-x-3 backdrop-blur-md border ${
            melding.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : 'bg-emerald-500/90 border-emerald-400 text-white'
          }`}>
            <AlertCircle className="w-5 h-5" />
            <span>{melding.tekst}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-slate-900 shadow-2xl flex flex-col relative overflow-hidden h-screen border-x border-slate-800">
        
        <header className="px-6 py-5 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {actieveTab === 'SCOREBORD' && 'Scorebord'}
              {actieveTab === 'INVOEREN' && (editRondeIndex !== null ? `Wijzig Ronde ${editRondeIndex + 1}` : `Ronde ${rondes.length + 1}`)}
              {actieveTab === 'OPTIES' && 'Instellingen'}
            </h2>
            {actieveTab === 'INVOEREN' && (
              <p className="text-xs text-slate-400 mt-1 flex items-center">
                Deler: <span className="text-emerald-400 font-bold ml-1">{spelers[relevanteDeler]}</span>
              </p>
            )}
          </div>
          <Crown className="w-6 h-6 text-slate-600" />
        </header>

        <div className="flex-1 overflow-y-auto pb-24 bg-slate-900 relative">
          
          {fase === 'einde' && (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center">
              <Trophy className="w-16 h-16 text-yellow-400 mb-6 animate-bounce" />
              <h2 className="text-3xl font-extrabold text-white mb-2">Spel Voorbij!</h2>
              <div className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-8">
                {spelers.map((speler, i) => ({ naam: speler, score: huidigeTotalen[i] }))
                  .sort((a, b) => a.score - b.score)
                  .map((s, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 rounded-xl mb-2 ${i === 0 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-800/50'}`}>
                      <span>{i + 1}. {s.naam}</span>
                      <span>{s.score} pt</span>
                    </div>
                  ))}
              </div>
              <button onClick={() => { setFase('setup'); setRondes([]); }} className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold shadow-lg"><RotateCcw className="inline mr-2" /> Nieuw Spel</button>
            </div>
          )}

          {actieveTab === 'SCOREBORD' && (
            <div className="p-4 flex flex-col space-y-4">
              <button onClick={() => { setEditRondeIndex(null); setHuidigeRondeInput(Array(aantalSpelers).fill(0)); setActieveTab('INVOEREN'); }} className="w-full bg-emerald-500 text-slate-900 font-bold py-4 rounded-xl shadow-lg flex items-center justify-center"><Plus className="w-5 h-5 mr-2" /> Nieuwe Scores</button>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-sm">
                    <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-400">
                      <tr>
                        <th className="py-4 px-3 w-12 text-slate-500">#</th>
                        {spelers.map((speler, index) => <th key={index} className="py-4 px-2 font-semibold text-slate-200">{speler}</th>)}
                        <th className="py-4 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {rondes.length === 0 ? (
                        <tr><td colSpan={aantalSpelers + 2} className="py-12 text-slate-500 italic text-center">Nog geen scores.</td></tr>
                      ) : (
                        rondes.map((ronde, rIndex) => (
                          <tr key={rIndex} className="hover:bg-slate-700/30">
                            <td className="py-3 px-3 border-r border-slate-700 text-slate-500">{rIndex + 1}</td>
                            {ronde.map((score, sIndex) => <td key={sIndex} className="py-3 px-2 text-slate-300">{score < 0 ? <span className="text-emerald-400 font-bold">{score}</span> : score}</td>)}
                            <td className="py-3 px-2">
                                <button onClick={() => startWijzigenRonde(rIndex)} className="text-slate-600 hover:text-emerald-400 p-1"><Edit2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {rondes.length > 0 && (
                      <tfoot className="bg-slate-900 border-t-2 border-slate-700 font-bold">
                        <tr>
                          <td className="py-4 px-3 border-r border-slate-700 text-slate-400">Tot.</td>
                          {huidigeTotalen.map((totaal, index) => <td key={index} className="py-4 px-2"><span className={totaal === laagsteScore ? 'text-emerald-400' : 'text-white'}>{totaal}</span></td>)}
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {actieveTab === 'INVOEREN' && (
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                {spelers.map((speler, index) => {
                  const isMagUitkomen = index === magOnderDoorIndex;
                  return (
                    <div key={index} className={`bg-slate-800 border p-3 rounded-2xl flex items-center justify-between transition-all ${isMagUitkomen ? 'border-emerald-500/30' : 'border-slate-700'}`}>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 flex items-center">
                          {speler} 
                          {((startDeler + (editRondeIndex !== null ? editRondeIndex : rondes.length)) % aantalSpelers) === index && <span className="ml-2 text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">Deler</span>}
                          {isMagUitkomen && <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">Uitkomst</span>}
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5">Totaal: <span className="text-white">{huidigeTotalen[index]}</span> pt</span>
                      </div>
                      <button onClick={() => setPopupSpelerIndex(index)} className="w-16 h-12 rounded-xl flex items-center justify-center text-xl font-bold bg-slate-900/50 text-white border border-slate-700">{huidigeRondeInput[index]}</button>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl mt-4">
                  <span className="text-sm font-semibold text-slate-400">Totaal (moet 20 zijn):</span>
                  <span className={`text-lg font-bold ${huidigeRondeInput.reduce((a, b) => a + b, 0) === 20 ? 'text-emerald-400' : 'text-red-400'}`}>{huidigeRondeInput.reduce((a, b) => a + b, 0)} / 20</span>
                </div>
              </div>

              <button
                onClick={probeerRondeToeTeVoegen}
                className="w-full bg-emerald-500 text-slate-900 font-extrabold py-4 rounded-xl shadow-lg mt-6 flex items-center justify-center transition-all"
              >
                <Check className="w-5 h-5 mr-2" /> {editRondeIndex !== null ? "Wijziging Opslaan" : "Ronde Opslaan"}
              </button>
              
              {editRondeIndex !== null && (
                <button
                  onClick={() => { setEditRondeIndex(null); setHuidigeRondeInput(Array(aantalSpelers).fill(0)); setActieveTab('SCOREBORD'); }}
                  className="w-full bg-slate-800 text-slate-400 py-3 rounded-xl mt-2 font-bold"
                >
                  Annuleren
                </button>
              )}
            </div>
          )}

          {actieveTab === 'OPTIES' && (
            <div className="p-4 space-y-4">
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
                <h3 className="font-bold text-white mb-4 text-lg border-b border-slate-700 pb-2">Instellingen</h3>
                <div className="space-y-4">
                   <button onClick={() => speelGeluid(SOUND_URLS.BOO)} className="w-full bg-slate-700 py-3 rounded-xl text-white font-bold flex items-center justify-center"><AlertCircle className="mr-2 w-4 h-4" /> Test Boe-geluid</button>
                   <button onClick={() => speelGeluid(SOUND_URLS.CHEER)} className="w-full bg-slate-700 py-3 rounded-xl text-white font-bold flex items-center justify-center"><Trophy className="mr-2 w-4 h-4" /> Test Applaus</button>
                </div>
                <ul className="mt-6 space-y-4 text-sm text-slate-400 border-t border-slate-700 pt-4">
                  <li className="flex justify-between"><span>Aantal spelers</span><span className="text-white font-bold">{aantalSpelers}</span></li>
                  <li className="flex justify-between"><span>Winnaar bij</span><span className="text-emerald-400 font-bold">100 pt</span></li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {erOnderDoorVraag && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[70] flex items-center justify-center p-6 text-center">
            <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-8 max-w-sm shadow-2xl animate-in zoom-in-95">
                <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Er onder door?</h3>
                <p className="text-slate-400 mb-8">Heeft <span className="text-amber-400 font-bold">{spelers[magOnderDoorIndex]}</span> alle slagen gepakt deze ronde?</p>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => finalizeRonde(erOnderDoorVraag, false)} className="bg-slate-800 text-white font-bold py-4 rounded-xl">Nee</button>
                    <button onClick={() => finalizeRonde(erOnderDoorVraag, true)} className="bg-emerald-500 text-slate-900 font-bold py-4 rounded-xl shadow-lg">Ja!</button>
                </div>
            </div>
          </div>
        )}

        {popupSpelerIndex !== null && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col pt-10 px-4 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6 px-2">
              <div>
                <h3 className="text-xl font-bold text-white">Score voor {spelers[popupSpelerIndex]}</h3>
                <p className="text-emerald-400 text-sm">Resterend te verdelen: {puntenResterend} pt</p>
              </div>
              <button onClick={() => setPopupSpelerIndex(null)} className="p-2 bg-slate-800 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-4 gap-3 flex-1 content-start overflow-y-auto pb-10">
              {[...Array(21).keys()].map(num => {
                const isNogMogelijk = num <= puntenResterend;
                return (
                  <button
                    key={num}
                    disabled={!isNogMogelijk}
                    onClick={() => selecteerScore(num)}
                    className={`py-4 rounded-2xl text-lg font-bold transition-all ${
                      huidigeRondeInput[popupSpelerIndex] === num 
                        ? 'bg-emerald-500 text-white shadow-lg' 
                        : isNogMogelijk 
                          ? 'bg-slate-800 text-white border border-slate-700 active:scale-90' 
                          : 'bg-slate-950 text-slate-700 border border-slate-900 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <nav className="absolute bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-between px-2 pb-safe z-20">
          {[
            { id: 'SCOREBORD', icon: <List className="w-5 h-5" />, label: 'Scores' },
            { id: 'INVOEREN', icon: <Plus className="w-5 h-5" />, label: 'Invoeren' },
            { id: 'OPTIES', icon: <Settings className="w-5 h-5" />, label: 'Extra' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActieveTab(tab.id)} className={`flex-1 flex flex-col items-center justify-center py-4 px-2 transition-all ${actieveTab === tab.id ? 'text-emerald-400' : 'text-slate-500'}`}>
              {tab.icon}
              <span className="text-[10px] font-bold mt-1 tracking-wide">{tab.label}</span>
            </button>
          ))}
          <button onClick={() => { if(window.confirm('Nieuw spel starten?')) setFase('setup'); }} className="flex-1 flex flex-col items-center justify-center py-4 px-2 text-red-400/80"><RotateCcw className="w-5 h-5" /><span className="text-[10px] font-bold mt-1">Reset</span></button>
        </nav>
      </div>
    </div>
  );
};

export default App;
