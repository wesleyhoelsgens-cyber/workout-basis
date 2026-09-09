# Workout Basis

## V2 voortgang — fases 3 en 4

De ontwikkeltak bevat nu Vandaag met acht workoutkeuzes en 30/45/60/90 minuten. Automatische voorstellen wisselen primaire spiergroepen af en schatten per set twee minuten plus één minuut toestelwissel per oefening. Warming-up gebruikt voorlopig het eerste persoonlijke cardio-item en is uitschakelbaar. Het vaste basisschema wordt nooit ingekort; bij overschrijding verschijnt een melding. Andere workout varieert binnen de beschikbare oefeningen.

Zelf samenstellen en Aanpassen bieden de filters Alles, Benen (inclusief Billen/Hamstrings), Rug, Borst, Schouders, Armen (Biceps/Triceps) en Core. Selectie, volgorde en filter worden per persoon lokaal bewaard. Verwijderen uit een voorstel verandert het basisschema niet. De selectie kan met omhoog/omlaagknoppen worden geordend. Onderaan staan het aantal oefeningen, de tijdsinschatting en START WORKOUT.

De minimale koppeling aan de tracker gebruikt stabiele oefening-ID's en de gekozen volgorde. Verdere integratie, waaronder beheer tijdens een lopende samengestelde training, volgt in fase 5. Mobiele afwerking en Safari/Edge-controles volgen in fase 6. Deze ontwikkelfases zijn nog niet openbaar gepubliceerd.

Fase 3: 21 tests geslaagd en Rug + Biceps / 30 minuten in de browser gestart en afgerond. Fase 4: 25 tests geslaagd, inclusief behoud van selectie bij filters/tijdwijziging/herladen en ongewijzigd basisschema. In de browser Leg press en Lat pulldown geselecteerd, gefilterd, omgewisseld, herladen en in de gekozen volgorde gestart; geen consolefouten.

## V2 in ontwikkeling — fase 2

De ontwikkeltak `codex/workout-v2` voegt centrale oefeningdefinities, spiergroeplabels en dataversie 2 toe aan de bestaande app. De Workout Builder is nog niet toegevoegd. De openbare website gebruikt voorlopig V1.

De bestaande opslagsleutel blijft `workout_basis_universal_v1`; `schemaVersion: 2` markeert de nieuwe gegevensstructuur. Bij de eerste V1-migratie wordt het originele JSON-bestand in `workout_basis_universal_v1_backup_before_v2` bewaard voordat de actieve opslag wordt vervangen. Bij onleesbare gegevens of mislukte migratie verschijnt een herstelscherm met een download van de oorspronkelijke gegevens. De backup wordt niet automatisch teruggezet, zodat latere trainingen niet worden overschreven.

Persoonlijke oefening-ID's, instellingen, historie en lopende trainingen blijven behouden. `exerciseLibrary()` combineert persoonlijke oefeningen met centrale kenmerken en historie op oefening-ID. Verwijderde oefeningen met historie worden als gearchiveerde bibliotheekitems aangeboden en niet teruggezet in het basisschema. Onbekende eigen oefeningen worden niet automatisch aan een spiergroep toegewezen. Historie wordt niet gedupliceerd; het laatst gebruikte gewicht wordt daarvan afgeleid en blijft gescheiden van het instelbare gewicht.

Fase 2: 15 automatische tests geslaagd, waaronder de 10 bestaande tests. Aanvullend in de browser getest: training starten, decimale gewichtsinvoer, cardio-invoer, sets afvinken, herladen/hervatten, afronden en historie. Geen fouten in de browserconsole. Safari/iPhone en Edge blijven onderdeel van fase 6.

Zelfstandige Nederlandstalige workout-tracker, los van SVO Academy.

**Open de app:** https://wesleyhoelsgens-cyber.github.io/workout-basis/

Gewichten en cardio zijn direct bewerkbaar, ook vóór het starten. Invoer wordt tijdens het typen bewaard; gewichten ondersteunen een decimale komma. Start een training om sets af te vinken en rond deze af om de training in de historie op te slaan. Via Personen kun je aparte profielen aanmaken en een JSON-backup exporteren.

Gegevens worden uitsluitend in de browser op dit apparaat opgeslagen, niet op GitHub. Ze synchroniseren niet tussen apparaten. De nieuwe website neemt gegevens uit een eerder lokaal HTML-bestand niet automatisch over. Backup importeren is nog niet ingebouwd.

## Controle

Voer `node --test test.cjs` uit met Node.js. Tien tests controleren opslag/herladen, historie, oefeningen en cardio tijdens een training, profielwissels, invoercontrole, tekstescaping, opslagfouten en oudere trainingsgegevens.

Daarnaast handmatig in de browser gecontroleerd: training starten/afronden, gewicht aanpassen, set afvinken, historie, cardio toevoegen tijdens training en mobiele weergave op 390 pixels. Dit is geen test op een fysieke iPhone.

## Publicatie

GitHub Pages publiceert `index.html` vanuit de hoofdmap van de branch `main`. Geen externe bibliotheken, tracking of server nodig.
