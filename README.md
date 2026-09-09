# Workout Basis V2

**Open de app:** https://wesleyhoelsgens-cyber.github.io/workout-basis/

Zelfstandige Nederlandstalige workout-tracker, los van SVO Academy.

## Huidige versie

V2 bevat fases 2 tot en met 5: centrale oefeningenbibliotheek, veilige V1-migratie, automatische workoutvoorstellen, zelf samenstellen, filters, volgorde aanpassen en koppeling met de bestaande tracker en historie. Kies een persoon, workouttype en beschikbare tijd; bekijk het voorstel en start daarna de training.

Gewichten en historie blijven via de oorspronkelijke oefening-ID gekoppeld. Cardio kan als warming-up worden gekozen. De geschatte duur rekent met twee minuten per set, een minuut toestelwissel per oefening en de gekozen cardiotijd. Het vaste basisschema wordt niet automatisch ingekort.

De volledige mobiele afwerking en gerichte controles in Safari/iPhone en Edge (fase 6) staan nog open.

## Gegevens

Gegevens blijven lokaal in dezelfde browser opgeslagen onder `workout_basis_universal_v1`, met `schemaVersion: 2`. Bij migratie maakt de app eerst een kopie van de V1-opslag onder `workout_basis_universal_v1_backup_before_v2`. Bij een fout verschijnt een herstelscherm met downloadmogelijkheid voor de oorspronkelijke gegevens; de app schrijft dan geen leeg profiel over de opslag.

Profielen, bestaande oefening-ID's, instellingen, historie en lopende trainingen worden behouden. Gegevens synchroniseren niet tussen apparaten. Gebruik Personen om een JSON-backup te exporteren. Backup importeren is nog niet ingebouwd. Wis de browsergegevens niet als je je historie wilt behouden.

## Tests

Voer `node --test test.cjs` uit met Node.js. Alle 30 tests slagen, inclusief migratie, bescherming bij opslagfouten, workoutselectie, aanpassingen, profielscheiding en gedeelde gewichtshistorie tussen workouttypes.

De belangrijkste routes zijn ook in de browser getest: invoer, herladen, voorstellen, selecteren, volgorde wijzigen, starten, afronden en gewichtshistorie hergebruiken. Dit vervangt de nog geplande Safari/iPhone- en Edge-controles niet.

## Publicatie

GitHub Pages publiceert `index.html` uit de hoofdmap van `main`. Er zijn geen externe bibliotheken of server nodig. De ontwikkelgeschiedenis staat ook op `codex/workout-v2`.
