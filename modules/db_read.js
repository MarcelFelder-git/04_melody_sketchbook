import { db } from "./db.js";  // Importiert die Datenbankfunktionen
import { el, create, loadHTML } from "./lib.js";  // Importiert Hilfsfunktionen für DOM-Manipulation und HTML-Load
import { loadScales } from "./scale_select.js";  // Importiert die Funktion zum Laden von Skalen

// Konstanten für die Darstellung von aktiven und passiven Bereichen
const dbArea = el('#db-area');  // DOM-Element, das den Datenbankbereich darstellt
export let permanentNotes = [];  // Exportiert eine leere Liste für dauerhaft gespeicherte Noten

// Funktion zum Entfernen der Maske (Anzeige ausblenden)
const removeMask = () => {
    dbArea.innerHTML = '';  // Löscht den Inhalt des Datenbankbereichs
    dbArea.className = 'area-passiv';  // Setzt die Klasse für den passiven Bereich
};

// Funktion zum Anzeigen des Load-Bereichs (Laden der gespeicherten Samples)
export async function showLoadArea() {
    dbArea.className = 'area-aktiv';  // Setzt die Klasse für den aktiven Bereich
    const html = await loadHTML('data/db-reader.html');  // Lädt das HTML für den Load-Bereich
    dbArea.innerHTML = html;  // Fügt das geladene HTML in den DOM ein
    
    el('#abbrechen').addEventListener('click', removeMask);  // Fügt einen Event-Listener hinzu, um die Maske zu entfernen

    const data = await db.readAll();  // Liest alle Daten aus der Datenbank

    if (data.length === 0) {
        el('#info_lesen').innerText = "The database is empty.";  // Zeigt eine Nachricht an, wenn die DB leer ist
        return;
    }

    el('#showmelodies').append(dbGenerator(data));  // Generiert und fügt die Samples in den DOM ein
}

// Funktion zum Generieren der HTML-Datenbankeinträge
function dbGenerator(data) {
    const wrapper = create('div');  // Erstellt ein Wrapper-Element für die Items
    wrapper.className = 'item-wrapper';  // Setzt die Klasse für das Wrapper-Element

    // Iteriert durch alle Daten und erstellt für jedes Item ein Div
    data.forEach((item) => {
        const div = create('div');  // Erstellt ein Div für jedes Item
        div.className = 'item';  // Setzt die Klasse für das Item-Div
        wrapper.append(div);  // Fügt das Div dem Wrapper hinzu

        // Titel anzeigen
        const span = create('span');
        span.innerText = `Titel: ${item.title}`;  // Setzt den Titel des Samples
        span.className = 'titel';  // Setzt die Klasse für den Titel
        div.append(span);  // Fügt den Titel dem Item-Div hinzu

        // Load-Button
        const loadBtn = create('button');
        loadBtn.className = 'loader';
        loadBtn.innerText = 'Load Melody';
        loadBtn.addEventListener('click', () => loadMelody(item, div));  // Lädt das Sample beim Klicken
        div.append(loadBtn);  // Fügt den Button dem Item-Div hinzu

        // Delete-Button
        const delBtn = create('button');
        delBtn.className = 'delete';
        delBtn.innerText = 'Delete Melody';
        delBtn.addEventListener('click', () => deleteMelody(item, div));  // Löscht das Sample beim Klicken
        div.append(delBtn);  // Fügt den Button dem Item-Div hinzu
    });

    return wrapper;  // Gibt den Wrapper mit den Einträgen zurück
}

// Funktion zum Laden eines Samples
async function loadMelody(item, div) {
    // Zeigt den Titel des Samples im DOM an
    el('#sample-titel').innerText = `Titel: ${item.title}`;

    // Setzt das BPM, falls vorhanden
    if (item.bpm) {
        globals.speed = item.bpm;
        el('#speed').value = item.bpm;
        el('#speed-label').innerText = `${item.bpm} BPM`;
    }

    // Lade zuerst die Skalen
    await loadScales();

    // Setze danach die gespeicherte Skala, falls vorhanden
    if (item.scale) {
        el('#scale-selection').value = item.scale;
        el('#scale-selection').dispatchEvent(new Event('change'));  // Manuelles Triggern des 'change'-Events
    }

    // Setze das Instrument, falls vorhanden
    if (item.instrument) {
        el('#instrument').value = item.instrument;
    }

    // Lade die Noten, wenn sie vorhanden sind
    if (item.notes && Array.isArray(item.notes)) {
        localStorage.setItem('permanentNotes', JSON.stringify(item.notes));  // Speichert die Noten im LocalStorage
        permanentNotes = item.notes;  // Setzt die permanenten Noten
    }
    
    removeMask();  // Entfernt die Maske (zeigt den Inhalt an)
}

// Funktion zum Löschen eines Samples
function deleteMelody(item, div) {
    // 1. Löscht den Eintrag aus der Datenbank
    db.deleteItem(item.id);

    // 2. Entfernt den Eintrag aus dem DOM
    div.remove();
}
