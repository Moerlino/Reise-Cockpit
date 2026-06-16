# Frankreich-Reise-Cockpit

Mobile-first PWA für eine Frankreichreise: Tagesplan, Offline-Reiseordner, Kartenlinks, editierbare Packliste und Französisch-Sprachhelfer.

## Datenschutz-Prinzip dieser Version

Diese Version lädt **keine echte private Reiseplanung automatisch aus GitHub**. Das Repository enthält nur die App selbst und einen unkritischen Beispielplan, damit die Oberfläche sofort getestet werden kann. Deine konkrete Route, Unterkünfte und Tagesdaten werden später über **Plan importieren** als JSON-Datei lokal auf dem Gerät gespeichert und ersetzen den Beispielplan.

Öffentlich auf GitHub Pages liegen nur:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- Icons
- eine neutrale Vorlagen-Datei `travel-plan.private-template.json`
- ein unkritischer Beispielplan `travel-plan.example.json` zum Testen

Nicht ins Repository gehören:

- echte Reiseplanung
- Buchungsnummern
- Zugangscodes
- Ausweiskopien
- sensible private Dokumente

## Lokale Reiseplanung importieren

1. App auf dem Handy öffnen.
2. Reiter **Plan** öffnen.
3. **Plan importieren** wählen.
4. Private JSON-Datei auswählen.
5. Die Daten werden lokal im Browser gespeichert.

Danach funktioniert der Tagesplan mit Abgleich des Handydatums. Der passende Reisetag wird als **Heute** markiert.

## Private JSON-Datei erstellen

Nutze `travel-plan.private-template.json` als Strukturvorlage. Diese Datei ist nur ein Beispiel. Kopiere sie lokal, benenne sie z. B. `meine-frankreichreise.json` und fülle sie mit deiner echten Planung. Diese private Datei nicht ins GitHub-Repository hochladen.

Wichtiges Format:

```json
{
  "meta": {
    "tripName": "Frankreichreise"
  },
  "days": [
    {
      "date": "2026-08-03",
      "title": "Anreise und Ankommen",
      "location": "Straßburg",
      "accommodation": "Unterkunft eintragen",
      "hotelMap": "https://www.google.com/maps/search/?api=1&query=Strasbourg",
      "routeMap": "https://www.google.com/maps/dir/?api=1&destination=Strasbourg",
      "stops": [
        { "time": "08:30", "title": "Abfahrt", "note": "Tickets bereitlegen." },
        { "time": "13:00", "title": "Ankunft", "note": "Zur Unterkunft navigieren." }
      ],
      "notes": "Private Tagesnotiz"
    }
  ]
}
```

Optional können auch `documents`, `places` und `packing` importiert werden.

## Export und Backup

Über **Export** kannst du die lokal gespeicherten Daten wieder als JSON-Datei herunterladen. Das ist sinnvoll als Backup oder zum Übertragen auf ein anderes Gerät.

## Installation auf GitHub Pages

1. ZIP entpacken.
2. Dateien in ein GitHub-Repository hochladen.
3. GitHub Pages aktivieren.
4. Seite auf dem Handy öffnen.
5. Über das Browser-Menü **Zum Home-Bildschirm** hinzufügen.
6. Private Reiseplan-Datei lokal importieren.


## Beispielplan

Die App startet mit einem unkritischen Beispielplan, damit Timeline, Dashboard, Kartenlinks und Packliste direkt sichtbar sind. Sobald du deinen echten Reiseplan importierst, wird dieser lokal gespeichert und der Beispielplan ersetzt.

## Packliste bearbeiten

Im Reiter **Packen** kannst du Einträge manuell hinzufügen, bearbeiten, abhaken oder löschen. Die Änderungen werden lokal im Browser gespeichert.

## Version 6: Reiseplan in der App bearbeiten und updatesichere lokale Daten

- Reisetage können direkt in der App hinzugefügt, bearbeitet und gelöscht werden.
- Programmpunkte werden nicht mehr als Text mit Sonderzeichen bearbeitet, sondern über einzelne Felder für Uhrzeit, Titel und Hinweis.
- Die lokalen Daten liegen unter einem stabilen Speicher-Schlüssel (`franceTravelCockpit.localData`). Dadurch bleiben importierte oder in der App geänderte Reisepläne bei späteren App-Updates erhalten, solange Browserdaten nicht gelöscht werden.
- Ältere lokale Speicherstände aus früheren Versionen werden beim ersten Start automatisch migriert.
- Für zusätzliche Sicherheit regelmäßig den Export-Button verwenden.


## Version 7

- Packliste wird alphabetisch nach Kategorien und innerhalb der Kategorien nach Einträgen sortiert.
- Kategorien können über Filterchips ausgewählt werden.
- Neue oder bearbeitete Packeinträge werden auch mit der Entertaste gespeichert.


## Version 9: Packliste importieren

Im Reiter **Packen** kann über **Packliste importieren** eine lokale Datei geladen werden. Unterstützt werden:

- JSON als Array, als Objekt mit `packing` oder als Liste einfacher Textwerte
- CSV/TXT mit den Spalten `Eintrag`, `Kategorie` und optional `Erledigt`

Nach dem Auswählen entscheidet man, ob die vorhandene Packliste ersetzt oder mit den neuen Einträgen zusammengeführt wird. Doppelte Einträge derselben Kategorie werden beim Zusammenführen übersprungen. Die importierte Packliste bleibt ausschließlich lokal im Browser gespeichert. Vorlagen sind als `packing-list.example.json` und `packing-list.example.csv` enthalten.

## OpenStreetMap-Gesamtkarte

Der Bereich **Karte** zeigt eine interaktive Gesamtübersicht mit Leaflet und OpenStreetMap. Es ist kein Google-Cloud-Konto und kein API-Schlüssel erforderlich. Die Route wird lokal aus den `coordinates` der importierten Reisetage aufgebaut. Die Verbindungslinie ist eine schematische Reiseabfolge und keine straßengenaue Routenberechnung.

Beispiel je Reisetag:

```json
"coordinates": { "lat": 45.8992, "lng": 6.1294 }
```

Die Kartenkacheln werden bei geöffneter Karte aus dem Internet geladen. OpenStreetMap muss sichtbar genannt werden; die App enthält die entsprechende Quellenangabe. Für eine private Reise-App ist die Nutzung gering. Die Kartenansicht ist nicht als Offline-Karte ausgelegt.



## Version 16
- Mobile Wischnavigation: nach links/rechts zwischen den Hauptreitern wechseln.
- Formulare, Dialoge, Links, Schaltflächen und die interaktive Karte sind von der Wischgeste ausgenommen.
- Randgesten werden ignoriert, damit die Browser-Zurück-Geste auf iOS nicht gestört wird.


## Version 17 – flüssige Wischanimation und Datenschutz

- Beim Wischen gleiten die Bereiche passend zur Wischrichtung ein und aus.
- Die Animation respektiert die Systemeinstellung „Bewegung reduzieren“.
- Keine konkrete private Reiseplandatei ist Bestandteil dieses Pakets.
- Private Reisepläne werden ausschließlich über „Plan importieren“ auf dem Gerät geladen.
- Vor dem Upload alte private JSON-Dateien im GitHub-Repository ausdrücklich löschen; bloßes Hochladen der neuen Dateien entfernt alte Repository-Dateien nicht.

## Version 18 – flüssige Wischanimation

- Der sichtbare Reiter folgt beim horizontalen Wischen direkt dem Finger.
- Der benachbarte Reiter gleitet gleichzeitig von links oder rechts herein.
- Zu kurze Wischbewegungen federn flüssig zur Ausgangsseite zurück.
- Formulare, Schaltflächen, Links, Dialoge und die interaktive Karte bleiben von der Wischgeste ausgenommen.
- Der Service Worker lädt neue App-Dateien bevorzugt aus dem Netz, damit Updates zuverlässiger sichtbar werden.
- Es ist kein konkreter privater Reiseplan im Paket enthalten.
