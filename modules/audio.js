import { permanentNotes } from "./db_read.js";
import { el, loadJSON } from "./lib.js";

// Globale Variablen für die Klavier-Sounds und Oszillator-Frequenzen
let pianoSounds = {}; // Hier werden die Klavier-Sounds gespeichert
let oscillatorFrequencies = {}; // Hier werden die Frequenzen des Oszillators gespeichert
let activeOscillator = null; // Hier wird der aktive Oszillator gespeichert (wird später verwendet, um den Oszillator zu steuern)
let activeGain = null; // Hier wird der Gain-Node für die Lautstärkeregelung gespeichert
let audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Der AudioContext für die Audio-Verarbeitung, wird für das Erzeugen von Audio-Daten benötigt
let loadedTrack = null; // Speichert den geladenen Track
export let globalAudioBuffer = null; // Speichert den globalen Audio-Buffer, um später darauf zugreifen zu können


// Funktion zum Laden der Instrumentendaten aus einer JSON-Datei
export async function loadInstruments (){
    // Lade die JSON-Daten für die Instrumente (z.B. für Piano und Oszillator)
    const instruments = await loadJSON("./data/instruments.json");

    // Lade die Klavier-Sounds und Oszillator-Frequenzen basierend auf den Daten in instruments.json
    pianoSounds = await loadJSON(`./data/${instruments.piano}`);
    oscillatorFrequencies = await loadJSON(`./data/${instruments.oscillator}`);
};

// Funktion zur Handhabung der Noteninteraktionen (Start, Stop, Update)
export const handleNoteInteraction = (note, volume, action) => {
    // Hole den aktuellen Wert des ausgewählten Instruments aus der Benutzeroberfläche
    const instrument = el("#instrument").value;

    // Wenn das ausgewählte Instrument der Oszillator ist, gehe weiter mit der Oszillator-Logik
    if (instrument === "oscillator") {
        // Wenn die Aktion 'start' ist, starte den Oszillator
        if (action === "start") {
            startOscillator(note, volume);
        // Wenn die Aktion 'update' ist, aktualisiere die Eigenschaften des Oszillators
        } else if (action === "update") {
            updateOscillator(note, volume);
        // Wenn die Aktion 'stop' ist, stoppe den Oszillator
        } else if (action === "stop") {
            stopOscillator();
        }
    // Wenn das ausgewählte Instrument das Piano ist, spiele das Klaviersample ab
    } else if (instrument === "piano") {
        if (action === "start") {
            playPianoSample(note, volume); // Wenn die Aktion 'start', spiele das Klaviersample
        }
    }
};

// Funktion zum Starten des Oszillators
const startOscillator = (note, volume) => {
    stopOscillator(); // Stelle sicher, dass kein Oszillator aktiv ist, bevor ein neuer gestartet wird

    // Erstelle einen neuen Oszillator und einen GainNode für die Lautstärkeregelung
    activeOscillator = audioContext.createOscillator();
    activeGain = audioContext.createGain();

    // Setze den Typ des Oszillators (hier wird eine Sinuswelle verwendet)
    activeOscillator.type = "sine";

    // Setze die Frequenz des Oszillators basierend auf der Note
    activeOscillator.frequency.setValueAtTime(oscillatorFrequencies[note], audioContext.currentTime);

    // Setze die Lautstärke des Oszillators, indem du den Gain-Node einstellst
    activeGain.gain.setValueAtTime(volume * 0.5, audioContext.currentTime);

    // Verbinde den Oszillator mit dem Gain-Node und den Gain-Node mit dem AudioContext
    activeOscillator.connect(activeGain);
    activeGain.connect(audioContext.destination);

    // Starte den Oszillator
    activeOscillator.start();
};

// Funktion zum Aktualisieren des Oszillators (Frequenz und Lautstärke)
const updateOscillator = (note, volume) => {
    // Überprüfe, ob ein Oszillator aktiv ist
    if (activeOscillator) {
        // Wenn der Oszillator aktiv ist, aktualisiere die Frequenz und Lautstärke
        activeOscillator.frequency.setValueAtTime(oscillatorFrequencies[note], audioContext.currentTime);
        activeGain.gain.setValueAtTime(volume * 0.5, audioContext.currentTime); // Lautstärke wird mit einem Faktor von 0.5 angepasst
    }
};

// Funktion zum Stoppen des Oszillators
const stopOscillator = () => {
    // Überprüfe, ob ein Oszillator aktiv ist, und stoppe ihn dann
    if (activeOscillator) {
        activeOscillator.stop(); // Stoppe den Oszillator
        activeOscillator.disconnect(); // Trenne die Verbindung des Oszillators
        activeOscillator = null; // Setze den Oszillator auf null, um eine neue Instanz zu erstellen
        activeGain = null; // Setze den Gain-Node auf null
    }
};

// Funktion zum Abspielen eines Klaviersamples
const playPianoSample = async (note, volume) => {
        // Lade die Piano-Sample-Daten (wenn sie nicht bereits geladen sind)
        if (!pianoSounds) {
            pianoSounds = await loadJSON("./data/pianoSamples.json");
        }

        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Prüfe, ob die Note existiert
        const sampleUrl = pianoSounds[note];

        // Lade das Sample als ArrayBuffer
        const response = await fetch(sampleUrl);
        const data = await response.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(data);

        // Erstelle eine Audio-Quelle und einen Gain-Node
        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(volume * 8, audioContext.currentTime);

        // Verbinde die Nodes und spiele den Sound ab
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start();
};


// Funktion zur Verarbeitung des Datei-Uploads (Musikdateien)
export async function handleFileUpload(file) {

    // Falls bereits ein Track geladen wurde, stoppe diesen, bevor der neue geladen wird
    if (loadedTrack) {
        loadedTrack.pause();
    }

    // **Lade das Audio als ArrayBuffer und dekodiere es zu einem AudioBuffer**
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer(); // Lade die Datei als ArrayBuffer
    globalAudioBuffer = await audioContext.decodeAudioData(arrayBuffer); // Dekodiere die Audio-Daten in einen Buffer

    // **Erstelle ein Audio-Element, um das Musikstück in der Benutzeroberfläche darzustellen**
    loadedTrack = new Audio(URL.createObjectURL(file)); // Erstelle ein Audio-Element aus der Datei

    // Aktualisiere die Benutzeroberfläche
    const dropText = el("#drop-text");
    const selectFileButton = el("#select-file-button");
    const playButton = el("#play-backtrack");
    const stopButton = el("#stop-backtrack");
    const loadNewTrack = el("#load-new-backtrack");
    const volumeSlider = el("#volume"); // Lautstärkeregler
    const frequency_vis = el("#frequency-visualization");

    // Zeige den Namen des geladenen Tracks in der Benutzeroberfläche
    dropText.innerHTML = `Now Playing: <br> ${file.name}`;
    selectFileButton.style.display = "none"; // Verstecke den "Select File"-Button
    playButton.disabled = false; // Aktiviere den Play-Button
    stopButton.disabled = false; // Aktiviere den Stop-Button
    frequency_vis.style.display = "block"; // Zeige die Frequenzvisualisierung
    loadNewTrack.style.display = "block"; // Zeige die Möglichkeit, einen neuen Track zu laden
    volumeSlider.value = 0.1; // Setze die Startlautstärke


    // Play-Button mit Visualisierung und Audio-Buffer
    // Wenn der Play-Button geklickt wird, wird die Audiodatei abgespielt und die Frequenzvisualisierung gestartet.
    playButton.addEventListener("click", () => {
        if (loadedTrack) {
            loadedTrack.play(); // Audiodatei abspielen
            startFrequencyVisualization(loadedTrack); // Frequenzvisualisierung starten
        }
    });

    // Stop-Button
    // Wenn der Stop-Button geklickt wird, wird die Audiodatei pausiert.
    stopButton.addEventListener("click", () => {
        if (loadedTrack) {
            loadedTrack.pause(); // Audiodatei anhalten
        }
    });

    // Lautstärkeregler
    // Wenn der Lautstärkeregler bewegt wird, wird die Lautstärke der Audiodatei angepasst.
    volumeSlider.addEventListener("input", (event) => {
        if (loadedTrack) {
            loadedTrack.volume = event.target.value; // Lautstärke an den Wert des Sliders anpassen
        }
    });
};


// Initialisierung für das Laden von Backing-Tracks
export const initBackingTrack = () => {

    // Elemente, die für das Laden und Bearbeiten der Audiodatei benötigt werden
    const dropArea = el("#drop-area");
    const fileInput = el("#fileInput");
    const selectFileButton = el("#select-file-button");
    const loadNewTrack = el("#load-new-backtrack");

    // Drag-over Event: Wird aktiviert, wenn eine Datei über das Drop-Bereich gezogen wird.
    dropArea.addEventListener("dragover", (event) => {
        event.preventDefault(); // Standardverhalten (z.B. Anzeige des Dateihandhabers) verhindern
    });

    // Drop Event: Wenn eine Datei in den Drop-Bereich abgelegt wird, wird die Datei verarbeitet.
    dropArea.addEventListener("drop", (event) => {
        event.preventDefault(); // Standardverhalten verhindern
        handleFileUpload(event.dataTransfer.files[0]); // Datei verarbeiten (erste Datei aus dem Drop)
    });

    // Datei-Auswahl (Button) wird aktiviert, um eine Datei manuell auszuwählen
    selectFileButton.addEventListener("click", () => {
        fileInput.click(); // Datei-Auswahl-Fenster öffnen
    });

    // Button zum Laden eines neuen Backing-Tracks
    loadNewTrack.addEventListener("click", () => {
        fileInput.click(); // Datei-Auswahl-Fenster öffnen
    });

    // Event, wenn der Benutzer eine Datei im Input-Feld auswählt
    fileInput.addEventListener("change", (event) => {
        handleFileUpload(event.target.files[0]); // Datei verarbeiten
    });
};


// Funktion zum Starten der Frequenzvisualisierung des geladenen Audios
const startFrequencyVisualization = (audioElement) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)(); // AudioContext für die Analyse des Audios erstellen
    const analyser = audioContext.createAnalyser(); // Analysator für die Frequenzanalyse erstellen
    const source = audioContext.createMediaElementSource(audioElement); // Quelle aus dem Audioelement erstellen
    source.connect(analyser); // Audioquelle mit dem Analysator verbinden
    analyser.connect(audioContext.destination); // Analysator an den Audio-Ausgang verbinden

    analyser.fftSize = 256; // Auflösung der Frequenzanalyse einstellen (mehr FFT-Größe = genauere Auflösung)
    const bufferLength = analyser.frequencyBinCount; // Anzahl der Frequenzbins
    const dataArray = new Uint8Array(bufferLength); // Array für die Frequenzdaten

    // Canvas-Element zum Zeichnen der Visualisierung
    const canvas = el("#frequency-visualization");
    const ctx = canvas.getContext("2d"); // 2D-Rendering-Kontext des Canvas holen

    // Funktion zum Zeichnen der Frequenzvisualisierung
    const draw = () => {
        analyser.getByteFrequencyData(dataArray); // Frequenzdaten aus dem Analyser holen

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Canvas löschen
        ctx.fillStyle = "#020e1c"; // Hintergrundfarbe setzen
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Hintergrund zeichnen

        const barWidth = (canvas.width / bufferLength) * 2.5; // Berechnung der Breite der einzelnen Balken
        let barHeight;
        let x = 0;

        // Zeichnen der Balken für jede Frequenz
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];
            let red = Math.min(255, barHeight + 50);
            let green = Math.min(255, 255 - (barHeight / 2)); // Mehr Grün bei kleineren Frequenzen
            let blue = Math.min(255, 255 - (barHeight / 3)); // Mehr Blau bei größeren Frequenzen
        
            // Setze die Farbe auf den dynamischen Wert
            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        
            ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight); // Balken zeichnen
            x += barWidth + 1; // Position des nächsten Balkens
        }

        requestAnimationFrame(draw); // Die Funktion wiederholt sich kontinuierlich, um die Animation zu erzeugen
    };

    draw(); // Die Visualisierung starten
};


// Funktion zur Wiedergabe einer Melodie, die als Array von Noten mit Zeitstempeln und Lautstärke übergeben wird
export const playMelody = (melody) => {
    if (melody.length === 0) return; // Wenn die Melodie leer ist, nichts tun

    const firstTimestamp = melody[0].timestamp / 1000; // Den ersten Timestamp als Referenz in Sekunden umrechnen

    // Jede Note in der Melodie abspielen
    melody.forEach(({ note, volume = 1, timestamp }) => {
        const timestampInSeconds = timestamp / 1000; // Timestamp in Sekunden umrechnen
        const delayInSeconds = timestampInSeconds - firstTimestamp; // Berechnung des Verzögerungswerts relativ zur ersten Note

        // Wenn der Verzögerungswert gültig ist, spiele die Note ab
        if (delayInSeconds >= 0) {
            setTimeout(() => {
                handleNoteInteraction(note, volume, "start"); // Note starten

                // Stoppe die Note nach 500ms
                setTimeout(() => {
                    handleNoteInteraction(note, volume, "stop"); // Note stoppen
                }, 500); // Stoppt nach 500ms
            }, delayInSeconds * 1000); // Setze den Delay in Millisekunden um
        }
    });
};

export async function stopMelody(melody) {
    if (!audioContext) return;

    await audioContext.close();
    audioContext = null;
}

export async function resetMelody() {
    // Audio stoppen
    if (audioContext) {
        await audioContext.close();
        audioContext = null;
    }
}