import { loadScales } from "./scale_select.js"; // Importiert die Funktion zum Laden der Skalen
import { initCanvas } from "./canvas_handler.js"; // Importiert die Funktion zur Initialisierung des Canvas
import { loadInstruments, handleNoteInteraction, initBackingTrack } from "./audio.js"; // Importiert Funktionen zum Laden von Instrumenten, zur Handhabung von Noteninteraktionen und zum Initialisieren des Backing Tracks

// Diese Funktion wird aufgerufen, um die Anwendung zu initialisieren
export async function initApp() {
    // Lädt die Skalen und Instrumente asynchron
    await loadScales(); // Lädt die Skalen, die in der App verwendet werden
    await loadInstruments(); // Lädt die Instrumente, die in der App verwendet werden

    // Initialisiert Canvas, auf dem Noten angezeigt werden, und setzt die Interaktion mit den Noten
    initCanvas(handleNoteInteraction); // Initialisiert Canvas und setzt die Funktion, die bei der Interaktion mit einer Note aufgerufen wird

    // Initialisiert den Backing Track
    initBackingTrack(); // Startet die Hintergrundmusik oder den Track, der mit der Anwendung verbunden ist
}


// exportiert und aktiviert den Service Worker
export function serviceWorkerAktiv(){
    if('serviceWorker' in navigator){
        navigator.serviceWorker.register('../service-worker.js',{
            scope : './'   
        })
    }
}