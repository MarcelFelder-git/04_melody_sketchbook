// Importiere die Funktionen aus verschiedenen Modulen
import { el } from "../modules/lib.js";                  // Hilfsfunktion, um ein Element auszuwählen
import { initApp, serviceWorkerAktiv } from "../modules/main.js";           // Initialisiert die Anwendung
import { showSaveArea } from "../modules/db_save.js";    // Zeigt den Bereich zum Speichern von Daten an
import { showLoadArea, permanentNotes } from "../modules/db_read.js"; // Zeigt den Bereich zum Laden von Daten an und enthält gespeicherte Noten
import { analyzeKey } from "../modules/key_detection.js"; // Erkennt die Tonart der Noten
import { playMelody, stopMelody, resetMelody } from "../modules/audio.js";         // Spielt die gespeicherten Noten ab
import { drawNotesOnCanvas } from "../modules/canvas_handler.js"; // Zeichnet Noten auf dem Canvas
import { addButton } from '../modules/install.js';

// Globale Variable zum Reset - Leider noch Bugfixes nötig
let melody = [];

// Initialisiert die Anwendung, indem alle notwendigen Schritte und Daten geladen werden
initApp();

// Service Worker:

// serviceWorkerAktiv();
// addButton();



// Event Listener

// Indexed DB Speicherscreen wird aufgerufen
el("#save").addEventListener("click", showSaveArea);

// Indexed DB Ladescreen wird aufgerufen
el('#load').addEventListener("click", showLoadArea);

// Wenn auf den "Melodie abspielen"-Button (#play-melody) geklickt wird:
el("#play-melody").addEventListener("click", () => {
    // Wenn es gespeicherte Noten gibt, spiele sie ab
    const savedNotes = localStorage.getItem('permanentNotes');
    melody = savedNotes ? JSON.parse(savedNotes) : permanentNotes; // Nutze gespeicherte Noten oder fallback auf permanentNotes
    // Spielt die gespeicherten Noten ab
    playMelody(melody);
    // Zeichnet die gespeicherten Noten auf dem Canvas
    drawNotesOnCanvas(melody);
    return melody;
});

el("#stop-melody").addEventListener("click", () => {
    stopMelody();  // Ruft die stopMelody-Funktion auf, um die Melodie zu stoppen
});

// Wenn auf den "Tonart analysieren"-Button (#analyze-btn) geklickt wird, wird die Funktion `analyzeKey` aufgerufen
el('#analyze-btn').addEventListener('click', analyzeKey);

// Reset von allem - hier noch Bug - nicht geschafft in der Zeit zu fixen
el("#new-melody").addEventListener("click", () => {
    resetMelody(); 

    // Lokalen Speicher löschen
    localStorage.removeItem("permanentNotes");
    localStorage.clear(); //

    // Canvas / Visualizer leeren
    const canvas = el("#draw-canvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Permanent-Noten und die globale Melodie zurücksetzen
    permanentNotes.length = 0; // Setzt das Array auf leer
    melody = []; // Setzt die globale Melodie zurück
});