# Find dit valgsted MiniMap
Indtast en adresse og find valgstedet, som tilhører det Valgdistrikt adressen ligger i.  
MiniMap'et kan ses [på Slagelse.dk](https://www.slagelse.dk/da/demokrati-og-udvikling/valg-og-folkeafstemning/europa-parlamentsvalg/valgsteder).  

MiniMap'et bruger [DAWA API'et](https://dawadocs.dataforsyningen.dk/) til at finde adressens afstemningsområde og afstemningssted.

## Spatial Suite opsætning
Der skal være opsat et MiniMap i MiniMap Editoren, som har et MiniMap ID. Det MiniMap skal have en søgefunktion og en _Vis startkort_ funktion tilføjet.  
MiniMap'et bruger SpSRoute servicen til at beregne rute til valgsted. Så den service skal være opsat rigtigt med en token fra Sweco.