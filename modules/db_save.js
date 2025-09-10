import { db } from "./db.js"; // Importiert das DB-Modul, das mit der IndexedDB kommuniziert
import { el, loadHTML, group } from "./lib.js"; // Importiert Hilfsfunktionen für DOM-Manipulation und HTML-Laden

const dbArea = el('#db-area'); // Referenz auf das DOM-Element, das den Bereich für die DB-Interaktionen darstellt

// Funktion, die den Bereich für das Speichern eines neuen Songs anzeigt
export async function showSaveArea() {
    dbArea.className = 'area-aktiv'; // Setzt den Bereich auf aktiv, um ihn anzuzeigen
    const data = await loadHTML('data/db-saver.html'); // Lädt die HTML-Vorlage für das Speichern
    dbArea.innerHTML = data; // Setzt die geladene Vorlage in den Bereich ein

    // Event-Listener für den Abbrechen-Button
    el('#abbrechen').addEventListener('click', function () {
        dbArea.innerHTML = ''; // Löscht den Inhalt des DB-Bereichs
        dbArea.className = 'area-passiv'; // Setzt den Bereich auf passiv, um ihn auszublenden
    });

    // Event-Listener für den Speichern-Button
    el('#savesong').addEventListener('click', saveTitle); // Verknüpft die Funktion zum Speichern des Titels
}

// Funktion, die den Titel des Songs speichert
async function saveTitle() {
    el('#info').innerHTML = ''; // Löscht vorherige Fehlermeldungen
    const titleElement = el('#songtitel'); // Holt das Eingabefeld für den Songtitel

    if (!titleElement) {
        console.error('Songtitel Eingabefeld nicht gefunden!'); // Fehlerbehandlung, falls das Eingabefeld nicht existiert
        return;
    }

    const title = titleElement.value; // Holt den Titel aus dem Eingabefeld

    // Prüfung: Hat der Titel mindestens 4 Zeichen?
    if (title.length < 4) {
        el('#info').innerText = 'Please enter a title! (at least 4 letters)'; // Gibt eine Fehlermeldung aus, wenn der Titel zu kurz ist
        return;
    }

    // Titelprüfung: Existiert dieser Titel bereits in der Datenbank?
    const allKeys = await db.readKeys(); // Liest alle vorhandenen Keys (IDs) aus der Datenbank
    let existingItem = null; // Variable zum Speichern eines möglichen vorhandenen Eintrags

    // Durchläuft alle Keys, um den Titel zu prüfen
    for (const key of allKeys) {
        const item = await db.readItem(key); // Liest jedes Item aus der DB
        if (item.title === title) {
            existingItem = item; // Wenn der Titel übereinstimmt, speichern wir das Item
            break; // Wir stoppen die Suche nach dem ersten Treffer
        }
    }

    // Wenn der Titel bereits existiert, fragt der Benutzer, ob er überschrieben werden soll
    if (existingItem) {
        const overwrite = confirm(`The title "${title}" already exists. Do you want to overwrite it?`); // Bestätigungsdialog
        if (!overwrite) {
            return; // Wenn der Benutzer "Abbrechen" wählt, wird die Funktion abgebrochen
        }

        // Löscht das bestehende Item, wenn der Benutzer zustimmt
        await db.deleteItem(existingItem.id);
    }

    // Holt den aktuellen Wert der Skala und des Instruments
    const scale = el('#scale-selection').value; // Die aktuell gewählte Skala
    const instrument = el('#instrument').value; // Das ausgewählte Instrument

    // Holt die Noten aus dem LocalStorage (gespeicherte Noten von einer früheren Aktion)
    const permanentNotes = JSON.parse(localStorage.getItem('permanentNotes') || '[]'); // Noten aus dem LocalStorage

    // Erstellt das DB-Objekt mit den gesammelten Daten
    const dbObj = {
        title: title,  // Der Titel des Songs
        scale: scale,  // Die gewählte Skala
        id: Date.now(), // Eine eindeutige ID basierend auf der aktuellen Zeit
        notes: permanentNotes,  // Die gespeicherten Noten
        instrument: instrument // Das gewählte Instrument
    };

    // Maske (der Bereich für die Eingabe) wird entfernt
    dbArea.innerHTML = ''; // Löscht den Inhalt
    dbArea.className = 'area-passiv'; // Setzt den Bereich auf passiv, um ihn auszublenden

    // Speichert das Objekt in der IndexedDB
    await db.writeItem(dbObj.id, dbObj); // Schreibt das Objekt in die DB
    alert(`Title "${title}" has been successfully saved!`); // Benachrichtigt den Benutzer über den Erfolg
}
