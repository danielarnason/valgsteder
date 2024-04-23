# Find dit valgsted MiniMap
Indtast en adresse og find valgstedet, som tilhører det Valgdistrikt adressen ligger i.  
MiniMap'et kan ses [på Slagelse.dk](https://www.slagelse.dk/da/demokrati-og-udvikling/valg-og-folkeafstemning/europa-parlamentsvalg/valgsteder)

## Data
Bruger data fra LOIS databasen over valgdistrikter. 

Datasættet skal have den følgende datastruktur;
|navn|AfstemningsOmraadenummer|AfstemningsstedNavn|AdgangsAdresseBetegnelse|
|----|-------|-----|------|
|Tårnborg|5|Taarnborg Forsamlingshus|Frølundevej 50, 4220 Korsør|

I LOIS databasen kan det findes med SQL'en:
```sql
select
	afs.navn,
	afs.AfstemningsOmraadenummer,
	afs.AfstemningsstedNavn,
	adr.AdgangsAdresseBetegnelse,
	afs.Geometri
from DAGI.AfstemningsomraadeGeoView as afs
join DAR.HusnummerGeoView as adr 
on adr.HusnummerId = afs.AfstemningsstedAdresselokalid  
where afs.KommuneKode = 330;
```

OBS.  
Da MiniMap'et skal bruges på borgersitet, så har vi ikke direkte adgang til LOIS databasen. Derfor tages der en kopi af datasættet, som indlæses i den database, som WebGIS'en har adgang til.

## Spatial Suite opsætning
Der skal være opsat et MiniMap i MiniMap Editoren, som har et MiniMap ID. Det MiniMap skal have en søgefunktion og en _Vis startkort_ funktion tilføjet.  
Der skal også være defineret en datasource til datasættet beskrevet tidligere.

MiniMap'et bruger SpSRoute servicen til at beregne rute til valgsted. Så den service skal være opsat rigtigt med en token fra Sweco.