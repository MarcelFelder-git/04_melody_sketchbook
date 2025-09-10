import { el, create, loadJSON } from "./lib.js"; // Importiert nützliche Funktionen

// Diese Funktion lädt und zeigt die Skalen zur Auswahl an
export async function loadScales() {
    // Wählt das Dropdown-Menü für die Skalen aus
    const scaleSelect = el('#scale-selection');

    // Lädt die Skalen-Daten von einer JSON-Datei
    const scales = await loadJSON('./data/scales.json');

    // Erstellt und fügt die Platzhalter-Option hinzu
    const placeholderOption = create('option');
    placeholderOption.value = "";
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    placeholderOption.textContent = 'Choose your Scale'; // Text für die Platzhalter-Option
    scaleSelect.appendChild(placeholderOption);

    // Fügt die "Chromatic"-Option hinzu
    const chromaticOption = create('option');
    chromaticOption.value = 'chromatic';
    chromaticOption.textContent = 'Chromatic';
    scaleSelect.appendChild(chromaticOption);

    // Erstelle die "Major"-Gruppe und füge alle "Major"-Skalen hinzu
    const majorOptGroup = create('optgroup');
    majorOptGroup.label = 'Major'; // Label für die Gruppe
    Object.keys(scales.major).forEach(scale => {
        const option = create('option');
        option.value = scale; // Setzt den Wert der Option
        option.textContent = scale; // Setzt den Text der Option
        majorOptGroup.appendChild(option); // Fügt die Option zur Gruppe hinzu
    });

    // Erstelle die "Minor"-Gruppe und füge alle "Minor"-Skalen hinzu
    const minorOptGroup = create('optgroup');
    minorOptGroup.label = 'Minor'; // Label für die Gruppe
    Object.keys(scales.minor).forEach(scale => {
        const option = create('option');
        option.value = scale; // Setzt den Wert der Option
        option.textContent = scale; // Setzt den Text der Option
        minorOptGroup.appendChild(option); // Fügt die Option zur Gruppe hinzu
    });

    // Füge beide Gruppen (Major und Minor) dem Dropdown hinzu
    scaleSelect.appendChild(majorOptGroup);
    scaleSelect.appendChild(minorOptGroup);

    // Setze den Standardwert auf "chromatic"
    scaleSelect.value = '';
    let notes = null; // Initialisiere notes als null

    // Dispatch (sendet) das 'scaleChanged' Event, um die initialen Noten zu laden
    const scaleChangeEvent = new CustomEvent('scaleChanged', { detail: notes });
    document.dispatchEvent(scaleChangeEvent);

    // Eventlistener für Änderungen an der Auswahl der Skala
    scaleSelect.addEventListener('change', (event) => {
        const selectedScale = event.target.value; // Wert der gewählten Skala
        let notes;
        
        // Bestimmt die Noten basierend auf der Auswahl
        if (selectedScale === 'chromatic') {
            notes = scales.chromatic; // Chromatische Skala
        } else if (scales.major[selectedScale]) {
            notes = scales.major[selectedScale]; // Major Skala
        } else if (scales.minor[selectedScale]) {
            notes = scales.minor[selectedScale]; // Minor Skala
        }

        // Dispatch das Event 'scaleChanged' mit den Noten als Detail
        const scaleChangeEvent = new CustomEvent('scaleChanged', { detail: notes });
        document.dispatchEvent(scaleChangeEvent);
    });

    // Stelle sicher, dass das 'change'-Event beim Laden korrekt ausgelöst wird
    scaleSelect.dispatchEvent(new Event('change'));

    // Eventlistener für das 'scaleChanged' Event, der ausgeführt wird, wenn die Skala geändert wurde
    document.addEventListener('scaleChanged', (event) => {
        const notes = event.detail; // Holt die Noten aus dem Event
        const selectedScale = notes;  // Setzt die gewählten Noten als 'selectedScale'
    });
}
