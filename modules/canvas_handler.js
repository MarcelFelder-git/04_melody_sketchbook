import { el } from "./lib.js";  // Importieren einer Hilfsfunktion zum Erstellen von DOM-Elementen

// Canvas-Element und Kontext für das Zeichnen auf dem Canvas abrufen
const canvas = el("#draw-canvas");
const ctx = canvas.getContext("2d");

// Konfiguration für die Notengröße und einige Hilfsvariablen
const noteSize = 10;  // Größe der Noten im Canvas

let currentNotes = [];  // Array, das die aktuell verfügbaren Noten enthält
let drawnNotes = [];    // Array für die temporär gezeichneten Noten während des Zeichnens
let permanentNotes = []; // Array für dauerhaft gespeicherte Noten, die in localStorage gespeichert werden
let isMouseDown = false;  // Zustand, ob die Maus gerade gedrückt wird
let activeNote = null;    // Die aktuell aktive Note
let activeVolume = null;  // Die aktuell aktive Lautstärke
let startX = 0;           // Start-X-Position der Maus
let startY = 0;           // Start-Y-Position der Maus

// Initialisierung des Canvas mit Event-Listenern und Interaktionen
export const initCanvas = (handleNoteInteraction) => {
    
    // Wenn die Skala geändert wird, aktualisieren wir die verfügbaren Noten
    document.addEventListener("scaleChanged", (event) => {
        currentNotes = event.detail;  // Skala von dem Event speichern
    });

    // Event für Maus-Drücken (Beginnt das Zeichnen)
    canvas.addEventListener("mousedown", (event) => {
        if (!currentNotes || currentNotes.length === 0) {
            alert("Please select a scale before drawing!");  // Fehlermeldung, wenn keine Skala gewählt wurde
            return;  // Blockiert das Zeichnen, wenn keine Skala verfügbar ist
        }

        isMouseDown = true;  // Markiert, dass die Maus gedrückt wurde
        startX = event.offsetX;  // Speichert die X-Position des Mauszeigers
        startY = event.offsetY;  // Speichert die Y-Position des Mauszeigers

        // Bestimmt die Note basierend auf der X-Position (Skalierung der Noten)
        const note = getNoteFromPosition(startX);
        // Bestimmt die Lautstärke basierend auf der Y-Position
        const volume = getVolumeFromPosition(startY);

        activeNote = note;  // Setzt die aktive Note
        activeVolume = volume;  // Setzt die aktive Lautstärke

        // Erzeugt ein Note-Objekt mit Zeitstempel, das sowohl die Note als auch die Position enthält
        const noteWithTimestamp = { 
            x: startX, 
            y: startY, 
            note,
            timestamp: Date.now() // Fügt der Note einen Zeitstempel hinzu
        };

        // Fügt die Note zu den temporären und permanenten Noten hinzu
        drawnNotes.push(noteWithTimestamp);
        permanentNotes.push(noteWithTimestamp);

        // Speichert die permanenten Noten im localStorage
        localStorage.setItem('permanentNotes', JSON.stringify(permanentNotes));

        drawCanvas();  // Zeichnet das Canvas neu

        // Startet die Note im Audio-System
        handleNoteInteraction(note, volume, "start");
    });

    // Event für Maus-Lösen (Beendet das Zeichnen)
    canvas.addEventListener("mouseup", () => {
        if (activeNote) handleNoteInteraction(activeNote, activeVolume, "stop");  // Stoppt die Note im Audio-System
        isMouseDown = false;  // Setzt den Zustand auf 'nicht gedrückt'
        activeNote = null;     // Setzt die aktive Note zurück
        activeVolume = null;   // Setzt die Lautstärke zurück

        // Löscht die temporär gezeichneten Noten, da die Maus losgelassen wurde
        drawnNotes = [];
        drawCanvas();  // Zeichnet das Canvas erneut
    });

    // Event für Maus-Austritt (Beendet das Zeichnen, wenn die Maus den Canvas verlässt)
    canvas.addEventListener("mouseleave", () => {
        if (!isMouseDown) return;  // Wenn die Maus nicht gedrückt wird, passiert nichts
        handleNoteInteraction(activeNote, activeVolume, "stop");  // Stoppt die Note im Audio-System
        isMouseDown = false;  // Setzt den Zustand auf 'nicht gedrückt'
        activeNote = null;     // Setzt die aktive Note zurück
        activeVolume = null;   // Setzt die Lautstärke zurück

        // Löscht die temporär gezeichneten Noten
        drawnNotes = [];
        drawCanvas();  // Zeichnet das Canvas erneut
    });

    // Bestimmt, welche Note basierend auf der X-Position im Canvas ausgewählt wird
    const getNoteFromPosition = (x) => {
        const noteIndex = Math.floor((x / canvas.width) * currentNotes.length);  // Skaliert die X-Position auf den Notenindex
        return currentNotes[noteIndex];  // Gibt die entsprechende Note zurück
    };

    // Bestimmt die Lautstärke basierend auf der Y-Position
    const getVolumeFromPosition = (y) => {
        const centerY = canvas.height / 2;  // Mitte des Canvas in Y-Richtung
        const distanceFromCenter = Math.abs(y - centerY);  // Berechnet den Abstand vom Zentrum
        const maxDistance = canvas.height / 2;  // Maximale Entfernung vom Zentrum
        const volume = Math.max(1 - (distanceFromCenter / maxDistance), 0);  // Lautstärke nimmt mit Entfernung ab
        return volume;
    };

    // Zeichnet alle Noten auf dem Canvas
    const drawCanvas = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // Löscht das Canvas
        
        drawnNotes.forEach(({ x, y, note }) => {
            ctx.beginPath();  // Beginnt einen neuen Zeichenpfad
            ctx.arc(x, y, noteSize, 0, Math.PI * 2);  // Zeichnet einen Kreis (Note) auf dem Canvas
    
            // Glüh-Effekt und Farbe für die Note
            ctx.fillStyle = "rgba(0, 188, 212, 0.8)"; // Transparente Farbe für das Leuchten
            ctx.shadowColor = "rgba(0, 188, 212, 0.5)"; // Halbdurchsichtiger Glow-Effekt
            ctx.shadowBlur = 20; // Glow-Effekt
    
            ctx.fill();  // Füllt den Kreis aus
    
            // Ein Rand um die Note
            ctx.strokeStyle = "#00bcd4";  // Randfarbe
            ctx.lineWidth = 2;  // Randbreite
            ctx.stroke();  // Rand zeichnen
        });
    };

};

// Funktion zum Zeichnen der geladenen Melodie auf dem Canvas
export function drawNotesOnCanvas(melody) {
    if (melody.length === 0) return;  // Keine Noten vorhanden, nichts tun

    const now = Date.now();  // Aktuelle Zeit
    const firstTimestamp = melody[0].timestamp;  // Erster Zeitstempel als Referenz

    melody.forEach(({ note, timestamp }) => {
        const timestampInMillis = timestamp;  // Zeitstempel in Millisekunden
        const delayInMillis = timestampInMillis - firstTimestamp;  // Berechnet die Verzögerung zur ersten Note

        // Wenn die Note in der Zukunft liegt, verzögere sie mit setTimeout
        if (delayInMillis >= 0) {
            setTimeout(() => {
                const positionX = getNotePosition(note);  // Berechnet die X-Position basierend auf der Tonhöhe
                const positionY = canvas.height / 2;  // Y-Position ist immer in der Mitte des Canvas

                let opacity = 1;  // Start-Opacity für die Note

                // Funktion zum Zeichnen der Note mit fallender Opazität
                const drawNoteWithFade = () => {
                    ctx.beginPath();
                    ctx.arc(positionX, positionY, noteSize, 0, Math.PI * 2);  // Zeichnet die Note
                    ctx.fillStyle = `rgba(255, 0, 255, ${opacity})`;  // Magenta mit fallender Opazität
                    ctx.fill();
                    ctx.closePath();
                
                    if (opacity > 0.1) {  // Anstatt 0.5, auf 0.1 verringern für sanfteren Fade
                        opacity -= 0.05;  // Verringert die Opazität nach jedem Frame
                        requestAnimationFrame(drawNoteWithFade);  // Setzt die Animation fort
                    } else {
                        setTimeout(() => {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }, 200);  // Verzögert das Löschen um 200 Millisekunden
                    }
                };

                // Startet die Fade-Animation für die Note
                drawNoteWithFade();

            }, delayInMillis);  // Verzögert die Ausführung basierend auf dem Zeitstempel
        }
    });
}

// Berechnung der X-Position basierend auf der Tonhöhe
const getNotePosition = (note) => {
    const index = currentNotes.indexOf(note);  // Sucht den Index der Note im aktuellen Notenarray
    if (index === -1) return canvas.width / 2;  // Falls die Note nicht gefunden wird, wird sie in der Mitte angezeigt

    // Skaliert den Index auf die X-Achse des Canvas
    return (index / (currentNotes.length - 1)) * canvas.width;
};
