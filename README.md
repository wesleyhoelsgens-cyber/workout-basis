# Workout Basis

Zelfstandige Nederlandstalige workout-tracker, los van SVO Academy.

**Open de app:** https://wesleyhoelsgens-cyber.github.io/workout-basis/

Gewichten en cardio zijn direct bewerkbaar, ook vóór het starten. Invoer wordt tijdens het typen bewaard; gewichten ondersteunen een decimale komma. Start een training om sets af te vinken en rond deze af om de training in de historie op te slaan. Via Personen kun je aparte profielen aanmaken en een JSON-backup exporteren.

Gegevens worden uitsluitend in de browser op dit apparaat opgeslagen, niet op GitHub. Ze synchroniseren niet tussen apparaten. De nieuwe website neemt gegevens uit een eerder lokaal HTML-bestand niet automatisch over. Backup importeren is nog niet ingebouwd.

## Controle

Voer `node --test test.cjs` uit met Node.js. Tien tests controleren opslag/herladen, historie, oefeningen en cardio tijdens een training, profielwissels, invoercontrole, tekstescaping, opslagfouten en oudere trainingsgegevens.

Daarnaast handmatig in de browser gecontroleerd: training starten/afronden, gewicht aanpassen, set afvinken, historie, cardio toevoegen tijdens training en mobiele weergave op 390 pixels. Dit is geen test op een fysieke iPhone.

## Publicatie

GitHub Pages publiceert `index.html` vanuit de hoofdmap van de branch `main`. Geen externe bibliotheken, tracking of server nodig.
