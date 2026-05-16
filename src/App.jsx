import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, List, Settings, RotateCcw, Trophy, AlertCircle, Check, X, Crown, Edit2 } from 'lucide-react';

/**
 * SCHOPPENJAGEN MET DE KAMELAADJES
 * Zorg dat je boo.mp3 en applaus.mp3 in de 'public' map op GitHub zet voor de geluidseffecten.
 */

const SOUND_URLS = {
    BOO: "/boo.mp3",
    CHEER: "/applaus.mp3"
};

export default function App() {
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
    const [editRondeIndex, setEditRondeIndex] = useState(null);
    const [erOnderDoorVraag, setErOnderDoorVraag] = useState(null);

    const booAudio = useRef(null);
    const cheerAudio = useRef(null);

    // Initialiseer audio-objecten voor mobiel gebruik (moet via een klik geactiveerd worden)
    const initAudio = () => {
        if (!booAudio.current) {
            booAudio.current = new Audio(SOUND_URLS.BOO);
            booAudio.current.load();
        }
        if (!cheerAudio.current) {
            cheerAudio.current = new Audio(SOUND_URLS.CHEER);
            cheerAudio.current.load();
        }
    };

    const speelGeluid = (type) => {
        initAudio();
        const audio = type === 'BOO' ? booAudio.current : cheerAudio.current;
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("Audio geblokkeerd door browser instellingen"));
        }
    };

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

        const toonMelding = (tekst, type = 'info') => {
            setMelding({ tekst, type });
            setTimeout(() => setMelding(null), 4000);
        };

        const startSpel = () => {
            if (spelers.some(naam => naam.trim() === '')) {
                toonMelding('Vul a.u.b. alle spelernamen in.', 'error');
                return;
            }
            initAudio(); // Activeer audio bij de eerste grote knopdruk
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
            const delerIndex = editRondeIndex !== null ? (startDeler + editRondeIndex) % aantalSpelers : huidigeDeler;
            const uitkomstIndex = (delerIndex + 1) % aantalSpelers;
            let definitieveScores = [...scores];

            if (wasErOnderDoor) {
                const spelerNaam = spelers[uitkomstIndex];
                const tijdelijkeRondes = [...rondes];
                if (editRondeIndex !== null) tijdelijkeRondes.splice(editRondeIndex, 1);
                const totaalZonderHuidige = berekenTotalen(tijdelijkeRondes);

                if (totaalZonderHuidige[uitkomstIndex] >= 20) {
                    definitieveScores = Array(aantalSpelers).fill(0).map((_, i) => i === uitkomstIndex ? -20 : 0);
                    toonMelding(`${spelerNaam} zakt 20 punten!`, 'info');
                } else {
                    definitieveScores = Array(aantalSpelers).fill(20).map((_, i) => i === uitkomstIndex ? 0 : 20);
                    toonMelding(`${spelerNaam} kon niet zakken. De rest krijgt +20!`, 'error');
                }
            }

            if (editRondeIndex !== null) {
                const nw = [...rondes];
                nw[editRondeIndex] = definitieveScores;
                setRondes(nw);
                setEditRondeIndex(null);
                toonMelding("Ronde aangepast", "info");
            } else {
                setRondes([...rondes, definitieveScores]);
                setHuidigeDeler((huidigeDeler + 1) % aantalSpelers);
            }

            setHuidigeRondeInput(Array(aantalSpelers).fill(0));
            setErOnderDoorVraag(null);

            const checkRondes = editRondeIndex !== null ? rondes : [...rondes, definitieveScores];
            const nwTotalen = berekenTotalen(checkRondes);
            if (nwTotalen.some(t => t >= 100)) {
                setFase('einde');
                speelGeluid('CHEER');
            } else {
                setActieveTab('SCOREBORD');
            }
        };

        const probeerOpslaan = () => {
            const scores = huidigeRondeInput.map(v => parseInt(v) || 0);
            if (scores.reduce((a, b) => a + b, 0) !== 20) {
                toonMelding('Het totaal van de ronde moet exact 20 zijn!', 'error');
                return;
            }
            const dIndex = editRondeIndex !== null ? (startDeler + editRondeIndex) % aantalSpelers : huidigeDeler;
            const uIndex = (dIndex + 1) % aantalSpelers;

            if (scores[uIndex] === 20) {
                setErOnderDoorVraag(scores);
            } else {
                finalizeRonde(scores, false);
            }
        };

        const huidigeTotalen = berekenTotalen();
        const laagsteScore = Math.min(...huidigeTotalen);
        const delerLabelIdx = editRondeIndex !== null ? (startDeler + editRondeIndex) % aantalSpelers : huidigeDeler;
        const uitkomstLabelIdx = (delerLabelIdx + 1) % aantalSpelers;
        const restPunten = 20 - huidigeRondeInput.reduce((acc, v, i) => i === popupSpelerIndex ? acc : acc + v, 0);

        if (fase === 'setup') {
            return (
                <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950 text-slate-200 font-sans">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="flex flex-col items-center mb-8">
                <Crown className="w-12 h-12 text-emerald-400 mb-4" />
                <h1 className="text-3xl font-black text-center leading-tight">Schoppenjagen<br/><span className="text-emerald-400 text-lg font-medium tracking-wide">Met de Kamelaadjes</span></h1>
                </div>
                <div className="space-y-6">
                <div className="text-left">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Aantal Spelers</label>
                <div className="flex space-x-2">
                {[3, 4, 5, 6].map(n => (
                    <button key={n} onClick={() => setAantalSpelers(n)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${aantalSpelers === n ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>{n}</button>
                ))}
                </div>
                </div>
                <div className="space-y-3 text-left">
                {spelers.map((n, i) => (
                    <div key={i} className="flex items-center space-x-3 bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                    <button onClick={() => setStartDeler(i)} className={`w-10 h-10 rounded-lg font-bold transition-all ${startDeler === i ? 'bg-emerald-500 text-slate-900 shadow-md' : 'bg-slate-700 text-slate-500'}`}>D</button>
                    <input type="text" value={n} onChange={(e) => { const nw = [...spelers]; nw[i] = e.target.value; setSpelers(nw); }} className="w-full bg-transparent p-2 text-white outline-none focus:bg-slate-800/80 rounded" placeholder="Naam speler" />
                    </div>
                ))}
                </div>
                <button onClick={startSpel} className="w-full bg-emerald-500 text-slate-900 font-black py-4 rounded-xl shadow-lg active:scale-95 transition-transform uppercase tracking-widest">Start de Strijd</button>
                </div>
                </div>
                </div>
            );
        }

        return (
            <div className="flex justify-center min-h-screen bg-slate-950 text-slate-200 font-sans">
            <div className="w-full max-w-md bg-slate-900 shadow-2xl flex flex-col relative h-screen border-x border-slate-800 overflow-hidden">

            {melding && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-5">
                <div className={`px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center space-x-3 backdrop-blur-md border ${melding.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : 'bg-emerald-500/90 border-emerald-400 text-white'}`}>
                <AlertCircle className="w-5 h-5" />
                <span>{melding.tekst}</span>
                </div>
                </div>
            )}

            <header className="px-6 py-5 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-10">
            <h2 className="text-xl font-bold tracking-tight">
            {actieveTab === 'SCOREBORD' ? 'Scorebord' : editRondeIndex !== null ? 'Wijzig Ronde' : 'Invoeren'}
            </h2>
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Deler: {spelers[delerLabelIdx]}</div>
            </header>

            <div className="flex-1 overflow-y-auto pb-24 p-4 scroll-smooth">
            {fase === 'einde' ? (
                <div className="text-center p-8 bg-slate-800/50 rounded-3xl border border-emerald-500/30 shadow-2xl">
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 animate-bounce" />
                <h2 className="text-3xl font-black mb-6">Gewonnen!</h2>
                <div className="space-y-2 text-left">
                {spelers.map((s, i) => ({ n: s, sc: huidigeTotalen[i] })).sort((a,b) => a.sc - b.sc).map((s, i) => (
                    <div key={i} className={`flex justify-between p-4 rounded-2xl ${i===0 ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-slate-700/30'}`}>
                    <span>{i+1}. {s.n}</span><span>{s.sc} pt</span>
                    </div>
                ))}
                </div>
                <button onClick={() => { setFase('setup'); setRondes([]); }} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-bold mt-8 shadow-xl">Nieuw Spel</button>
                </div>
            ) : actieveTab === 'SCOREBORD' ? (
                <div className="space-y-4">
                <button onClick={() => {setEditRondeIndex(null); setHuidigeRondeInput(Array(aantalSpelers).fill(0)); setActieveTab('INVOEREN');}} className="w-full bg-emerald-500 text-slate-900 font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center transition-transform active:scale-95"><Plus className="mr-2" /> Nieuwe Scores</button>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                <table className="w-full text-center text-sm">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                <tr><th className="p-4 w-10 border-r border-slate-700 text-slate-500">#</th>{spelers.map((s, i) => <th key={i} className="p-4 text-slate-200 font-bold">{s}</th>)}<th className="w-10"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 bg-slate-800/30 text-slate-300">
                {rondes.length === 0 ? (
                    <tr><td colSpan={aantalSpelers + 2} className="py-12 italic text-slate-500">Nog geen rondes gespeeld.</td></tr>
                ) : (
                    rondes.map((r, ri) => (
                        <tr key={ri} className="hover:bg-slate-700/40 transition-colors">
                        <td className="p-3 text-slate-500 border-r border-slate-700 font-medium">{ri+1}</td>
                        {r.map((s, si) => <td key={si} className={`p-3 ${s < 0 ? 'text-emerald-400 font-bold underline' : s >= 13 ? 'text-red-400' : ''}`}>{s}</td>)}
                        <td className="p-3 text-right"><button onClick={() => startWijzigenRonde(ri)} className="text-slate-600 hover:text-emerald-400 p-2"><Edit2 className="w-4 h-4" /></button></td>
                        </tr>
                    ))
                )}
                </tbody>
                {rondes.length > 0 && (
                    <tfoot className="bg-slate-900 font-bold border-t-2 border-slate-700">
                    <tr><td className="p-4 text-slate-500 border-r border-slate-700 text-[10px] uppercase">Tot.</td>{huidigeTotalen.map((t, i) => <td key={i} className={`p-4 ${t === laagsteScore ? 'text-emerald-400 text-lg' : 'text-white'}`}>{t}</td>)}<td></td></tr>
                    </tfoot>
                )}
                </table>
                </div>
                </div>
                </div>
            ) : (
                <div className="space-y-3">
                {spelers.map((s, i) => {
                    const isUitkomst = i === uitkomstLabelIdx;
                    return (
                        <div key={i} className={`bg-slate-800 border p-4 rounded-2xl flex items-center justify-between transition-all duration-300 ${isUitkomst ? 'border-emerald-500/40 ring-1 ring-emerald-500/10 shadow-lg' : 'border-slate-700'}`}>
                        <div className="text-left">
                        <div className="font-bold flex items-center text-slate-100">{s} {isUitkomst && <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">Uitkomst</span>}</div>
                        <div className="text-xs text-slate-500 mt-1">Huidig Totaal: <span className="text-white font-bold">{huidigeTotalen[i]}</span> pt</div>
                        </div>
                        <button onClick={() => {initAudio(); setPopupSpelerIndex(i);}} className="w-16 h-14 rounded-xl font-black bg-slate-900 border border-slate-700 text-2xl shadow-inner active:bg-slate-800 transition-colors">{huidigeRondeInput[i]}</button>
                        </div>
                    );
                })}
                <div className="flex justify-between items-center p-5 bg-slate-950 rounded-2xl mt-6 border border-slate-800 shadow-inner">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Totaal (moet 20 zijn):</span>
                <span className={`text-2xl font-black ${huidigeRondeInput.reduce((a,b)=>a+b,0)===20 ? 'text-emerald-400' : 'text-red-400'}`}>{huidigeRondeInput.reduce((a,b)=>a+b,0)} / 20</span>
                </div>
                <button onClick={probeerOpslaan} className="w-full bg-emerald-500 text-slate-900 font-black py-5 rounded-2xl shadow-xl mt-6 active:scale-95 transition-transform flex items-center justify-center uppercase tracking-widest"><Check className="mr-2 w-6 h-6" /> OPSLAAN</button>
                {editRondeIndex !== null && <button onClick={() => {setEditRondeIndex(null); setHuidigeRondeInput(Array(aantalSpelers).fill(0)); setActieveTab('SCOREBORD');}} className="w-full bg-slate-800 text-slate-400 py-4 rounded-xl font-bold mt-2">Annuleren</button>}
                </div>
            )}
            </div>

            {erOnderDoorVraag && (
                <div className="absolute inset-0 bg-slate-950/95 z-[70] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-slate-900 border border-amber-500/40 rounded-[2.5rem] p-10 max-w-sm shadow-2xl text-center">
                <Crown className="w-20 h-20 text-amber-400 mx-auto mb-6 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                <h3 className="text-3xl font-black mb-4 text-white uppercase tracking-tighter">Er onder door?</h3>
                <p className="text-slate-400 mb-10 text-lg leading-snug">Heeft <span className="text-amber-400 font-black underline">{spelers[uitkomstLabelIdx]}</span> echt alle slagen gepakt deze ronde?</p>
                <div className="grid grid-cols-2 gap-4">
                <button onClick={() => finalizeRonde(erOnderDoorVraag, false)} className="bg-slate-800 py-5 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-transform">NEE</button>
                <button onClick={() => finalizeRonde(erOnderDoorVraag, true)} className="bg-emerald-500 text-slate-900 py-5 rounded-2xl font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">JA!</button>
                </div>
                </div>
                </div>
            )}

            {popupSpelerIndex !== null && (
                <div className="absolute inset-0 bg-slate-950/98 z-50 flex flex-col pt-12 px-6 animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center mb-10">
                <div className="text-left">
                <h3 className="text-2xl font-black text-white leading-tight">Score {spelers[popupSpelerIndex]}</h3>
                <p className="text-emerald-400 font-bold uppercase text-xs tracking-widest mt-1">Nog {restPunten} punten beschikbaar</p>
                </div>
                <button onClick={() => setPopupSpelerIndex(null)} className="p-3 bg-slate-800 rounded-full text-slate-400 shadow-lg"><X className="w-6 h-6" /></button>
                </div>
                <div className="grid grid-cols-4 gap-4 content-start overflow-y-auto pb-24">
                {[...Array(21).keys()].map(num => (
                    <button key={num} disabled={num > restPunten} onClick={() => { if(num>13) speelGeluid('BOO'); const nw = [...huidigeRondeInput]; nw[popupSpelerIndex]=num; setHuidigeRondeInput(nw); setPopupSpelerIndex(null); }} className={`h-16 rounded-2xl font-black text-xl transition-all ${huidigeRondeInput[popupSpelerIndex]===num ? 'bg-emerald-500 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/50' : num > restPunten ? 'bg-slate-950 text-slate-800 border-slate-900 opacity-10 cursor-not-allowed' : 'bg-slate-800 border border-slate-700 active:scale-90 text-white'}`}>{num}</button>
                ))}
                </div>
                </div>
            )}

            <nav className="absolute bottom-0 left-0 w-full bg-slate-900/95 border-t border-slate-800 flex justify-between px-2 pb-safe z-20 backdrop-blur-lg">
            {[
                { id: 'SCOREBORD', icon: <List className="w-6 h-6" />, label: 'Scores' },
                { id: 'INVOEREN', icon: <Plus className="w-6 h-6" />, label: 'Invoer' },
                { id: 'OPTIES', icon: <Settings className="w-6 h-6" />, label: 'Extra' },
            ].map((t) => (
                <button key={t.id} onClick={() => {initAudio(); setActieveTab(t.id);}} className={`flex-1 flex flex-col items-center py-5 transition-all ${actieveTab === t.id ? 'text-emerald-400 scale-105' : 'text-slate-600'}`}>
                {t.icon}<span className="text-[10px] font-black mt-2 uppercase tracking-[0.2em]">{t.label}</span>
                </button>
            ))}
            <button onClick={() => { if(confirm('Nieuw spel starten? Alle scores gaan verloren.')) setFase('setup'); }} className="flex-1 flex flex-col items-center py-5 text-red-500/40 active:text-red-500 transition-colors"><RotateCcw className="w-6 h-6" /><span className="text-[10px] font-black mt-2 uppercase tracking-[0.2em]">Reset</span></button>
            </nav>
            </div>
            </div>
        );
}
