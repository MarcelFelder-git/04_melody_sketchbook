// Importiere das Meyda-Modul für Audioanalyse und das globale AudioBuffer aus dem Audio-Modul
import Meyda from "./meyda.js";
import { el,loadJSON } from "./lib.js";
import { globalAudioBuffer } from "./audio.js";


// DOM-Element für die Ausgabe der erkannten Tonart
const keyOutput = el('#key-output');
let scales_chroma = null;  // Wird später die chromatischen Skalen enthalten
let scales = null;         // Wird später die allgemeinen Skalen enthalten

// Funktion zur Analyse der Tonart des Audiobuffers
export const analyzeKey = async () => {
    const audioBuffer = globalAudioBuffer;  // Den Audio-Buffer aus dem globalen Speicher verwenden

    // Wenn kein Audio-Buffer vorhanden ist, beenden wir die Analyse und geben eine Warnung aus
    if (!audioBuffer) {
        return;
    }

    // Lade die Skalen-Daten und analysiere das Chroma (Frequenzspektrum)
    await loadScalesChroma();
    await loadScales();
    
    // Extrahiere die Chroma-Werte aus dem Audio
    const chroma = await extractChroma(audioBuffer);

    // Führe die FFT (Fourier-Transformation) durch, um das Frequenzspektrum zu extrahieren
    const fftResult = await performFFT(audioBuffer);

    // Kombiniere die Chroma-Werte und FFT-Ergebnisse
    const combinedChroma = combineChromaAndFFT(chroma, fftResult);

    // Erkenne die Tonart basierend auf den kombinierten Daten
    const detectedKey = detectKey(combinedChroma);

    // Zeige die erkannte Tonart auf der Webseite an
    displayKey(detectedKey);

    // Aktualisiere die Skalen-Auswahl im Interface
    updateScaleSelection(detectedKey);
};

// Funktion zur Kombination von Chroma-Werten und FFT-Ergebnissen
function combineChromaAndFFT(chroma, fftResult) {
    // Kombiniere beide Daten: Chroma-Werte und Frequenzdaten (mit einem Gewichtungsfaktor)
    return chroma.map((value, index) => value + (fftResult[index] || 0) * 0.5);
}

// FFT-Analyse durchführen (Extraktion des Frequenzspektrums)
async function performFFT(audioBuffer) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;  // Setzt die Größe des FFT-Puffers auf 2048

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);

    return new Promise((resolve) => {
        // Analysiere das Frequenzspektrum und gib die Frequenzdaten zurück
        function getFrequencyData() {
            analyser.getByteFrequencyData(frequencyData);
            resolve(frequencyData);
        }
        requestAnimationFrame(getFrequencyData);
    });
}

// Chroma-Werte aus dem Audio-Buffer extrahieren
async function extractChroma(audioBuffer) {
    const segmentLength = 4096;  // Länge eines Audio-Segments (4096 Samples)
    const segmentCount = 1000;   // Anzahl der Segmente, die extrahiert werden sollen

    // Extrahiere für jedes Segment die Chroma-Werte
    const chromaResults = Array.from({ length: segmentCount }, (_, i) => {
        const startOffset = Math.floor((i / segmentCount) * (audioBuffer.length - segmentLength));
        const chromaBuffer = audioBuffer.getChannelData(0).slice(startOffset, startOffset + segmentLength);
        return Meyda.extract('chroma', chromaBuffer, {
            bufferSize: segmentLength,
            sampleRate: audioBuffer.sampleRate,
        });
    }).filter(result => result && result.length === 12 && result.every(value => !isNaN(value)));

    // Wenn keine gültigen Chroma-Werte extrahiert wurden, gib eine Fehlermeldung aus
    if (chromaResults.length === 0) {
        return new Float32Array(12).fill(0);  // Gib einen Vektor aus Null-Werten zurück
    }

    // Kombiniere alle Chroma-Werte, indem du die Durchschnittswerte berechnest
    const combinedChroma = chromaResults.reduce((acc, result) => {
        result.forEach((value, index) => acc[index] += value);
        return acc;
    }, new Float32Array(12));

    // Berechne den Durchschnitt der Chroma-Werte
    combinedChroma.forEach((value, index) => combinedChroma[index] = value / chromaResults.length);
    return combinedChroma;
}

// Funktion zur Anzeige der erkannten Tonart im DOM
function displayKey(key) {
    if (keyOutput) {
        keyOutput.textContent = `Detected Key: ${key}`;  // Setze den Text des Key-Outputs
    }

    // Setze den Wert der Skalen-Auswahl auf die erkannte Tonart
    const scaleSelection = el('#scale-selection');
    if (scaleSelection) {
        scaleSelection.value = key;
    }
}

// Lade die Skalen-Daten für 'scales_chroma' (ohne Fehlerbehandlung)
async function loadScalesChroma() {
    // Lade die JSON-Daten von der URL
    scales_chroma = await loadJSON('./data/scales_chroma.json');
    
    // Überprüfe, ob 'scales_chroma' geladen wurde und ob es die 'chromatic' Eigenschaft enthält
    // Wenn 'scales_chroma' oder 'scales_chroma.chromatic' nicht existiert, gibt es eine Warnung
    if (!scales_chroma || !scales_chroma.chromatic) {
        console.warn('Fehlende chromatic Skalen');
        return;  // Die Funktion wird hier abgebrochen, wenn die Bedingung zutrifft
    }
}

// Lade die Skalen-Daten für 'scales' (ohne Fehlerbehandlung)
async function loadScales() {
    // Lade die JSON-Daten von der URL
    scales = await loadJSON('./data/scales.json');
    
    // Überprüfe, ob 'scales' geladen wurde und ob es die 'chromatic' Eigenschaft enthält
    // Wenn 'scales' oder 'scales.chromatic' nicht existiert, gibt es eine Warnung
    if (!scales || !scales.chromatic) {
        console.warn('Fehlende chromatic Skalen');
        return;  // Die Funktion wird hier abgebrochen, wenn die Bedingung zutrifft
    }
}

// Erkenne die Tonart basierend auf den Chroma-Daten und den geladenen Skalen
function detectKey(chroma) {
    if (!scales_chroma || !scales_chroma.chromatic) {
        console.error("Fehler: scales ist nicht verfügbar oder 'chromatic' fehlt.");
        return 'Unbekannt';  // Gib eine Standardantwort zurück, wenn die Skalen-Daten fehlen
    }

    const scaleTypes = ['major', 'minor'];  // Definiere die möglichen Skalen-Typen
    return scaleTypes.reduce((bestMatch, scaleType) => {
        // Suche nach dem besten Match für jede Skalen-Art
        return Object.keys(scales_chroma[scaleType]).reduce((best, scaleName) => {
            const scaleProfile = scales_chroma[scaleType][scaleName];  // Das Profil der aktuellen Skala
            const score = chroma.reduce((sum, value, index) => {
                return sum + (scaleProfile.includes(scales_chroma.chromatic[index]) ? value : 0);
            }, 0);

            // Vergleiche das Ergebnis und behalte das beste Ergebnis
            return score > best.score ? { score, key: `${scaleName}` } : best;
        }, bestMatch);
    }, { score: -Infinity, key: 'Unbekannt' }).key;
}

// Aktualisiere die Skalen-Auswahl im Interface basierend auf der erkannten Tonart
function updateScaleSelection(detectedKey) {
    const scaleSelect = document.getElementById("scale-selection");

    // Setze den Wert des "scale-select" basierend auf dem erkannten Key
    scaleSelect.value = detectedKey;

    // Lade die Noten entsprechend der erkannten Skala
    let notes;
    if (detectedKey === 'chromatic') {
        notes = scales.chromatic;
    } else if (scales.major[detectedKey]) {
        notes = scales.major[detectedKey];
    } else if (scales.minor[detectedKey]) {
        notes = scales.minor[detectedKey];
    }

    // Benachrichtige die Anwendung, dass die Skala geändert wurde und die Noten geladen sind
    const scaleChangeEvent = new CustomEvent('scaleChanged', { detail: notes });
    document.dispatchEvent(scaleChangeEvent);
}
