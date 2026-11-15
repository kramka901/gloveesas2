# 🌍 Ajarändur: 8. Klassi Ajaloo Maailmad
### *Интерактивная 2D игра-исследование по истории 8 класса в Эстонии*

Kaasahaarav 2D rolli- ja avastusmäng, mis põhineb **Eesti põhikooli 8. klassi ajaloo riiklikul õppekaval**.
Mängija juhib ajarändurit (inimese tegelast), kes jalutab läbi vanaaja ja uusaja maailmade, uurib ajaloolisi esemeid, suhtleb suurkujudega ja kogub teadmisi eksamiteks ja kontrolltöödeks!

---

## 🎮 Kuidas mängu käivitada? / Как запустить игру?

### Variant 1: Käivitamine failiga `start_game.bat` (Lihtsaim Windowsis)
1. Tee topeltklõps failil **`start_game.bat`**.
2. Vali menüüst:
   - **`1`** (Vaikimisi ja soovitatav): Käivitab **2D veebimängu** ja avab selle automaatselt veebibrauseris aadressil `http://127.0.0.1:8008`.
   - **`2`**: Käivitab töölauaversiooni **Pygame** aknas.

### Variant 2: Käivitamine PyCharmis või terminalis
Ava projekt PyCharmis või käsureal ja käivita:
```bash
# 2D Veebimäng (avab automaatselt brauseri):
python main.py

# või Pygame töölauamäng:
python game_pygame.py
```
*(PyCharmis võid ka lihtsalt vajutada rohelist Run-nuppu failil `main.py`, `game_pygame.py` või `lol.py`)*.

---

## 🕹️ Juhtimine / Управление

| Klahv / Tegevus | Funktsioon |
|---|---|
| **W, A, S, D** või **Nooleklahvid** | Tegelase liigutamine neljas suunas |
| **Shift** (hoidmine) | Jooksmine / kiirem liikumine |
| **[E]** või **[Tühikuklahv]** | Objekti uurimine või vestlus tegelasega |
| **Hiireklõps ekraanil** | Tegelane kõnnib ise klõpsatud sihtpunkti! |
| **[M]** | **Maailmakaart**: teleportreeru mistahes ajastusse |
| **[J]** | **Uurimispäevik**: vaata kõiki leitud reliikviaid ja XP-d |
| **[Q]** | **Ajastu Kiirtest**: kontrolli oma teadmisi |
| **Puutenupud ekraanil** | Virtuaalne pult (D-Pad) puuteekraanidele ja hiirele |

---

## 🏛️ Mängu Ajaloolised Maailmad (8. klassi ajalugu Eestis)

Mängus on 8 unikaalset maailma, mis viivad mängija läbi ajaloo pöördepunktide:

### 1. 🪓 Muinas-Eesti: Vanaaja Linnus ja Hiis *(Esiaeg ja muinasaeg)*
- **Koht ja sisu:** Muinaseestlaste palklinnus, pühapaik (hiis ja ohvrikivi) ning sooraua sulatusahi.
- **Tegelased ja objektid:**
  - **Muinasvanem Lembitu**: Sakala vanem, kes räägib muinasmaakondadest, loodususundist ja muistsest vabadusvõitlusest (1217 Madisepäeva lahing).
  - **Sepp Ilmar**: Sooraua sulatamine ja rauast tööriistade (vikat, kirves) revolutsioon põllumajanduses.
  - **Püha Ohvrikivi ja tammik**: Esivanemate vaimud ja animism.
  - **Muinaslinnuse vall**: Kuidas rahvas vaenuohu korral kaitsesse koondus.

### 2. ❄️ Põhjasõda ja Narva Kindlus *(1700. aasta)*
- **Koht ja sisu:** Lumine Narva kindlus, Rootsi väelaager ja bastionid.
- **Tegelased ja objektid:**
  - **Rootsi Kuningas Karl XII**: Räägib Narva lumetormi taktikast, kus 10 000 rootslast lõid 40 000 venelast.
  - **1710. a Harku Kapitulatsioon (Balti erikord)**: Kuidas Eesti läks Vene tsaaririigi alla, kuid rüütelkonnad säilitasid saksa keele, luteri usu ja aadliomavalitsuse.
  - **Rootsi 12-naelane pronkssuurtükk**: Narva muldbastionide kaitsesüsteem.

### 3. 👑 Versailles' Kuldne Loss ja Louis XIV *(1680)*
- **Koht ja sisu:** Prantsuse barokkpalee, Peeglisaal ja geomeetrilised aiad.
- **Tegelased ja objektid:**
  - **Päikesekuningas Louis XIV**: *"L'État, c'est moi! (Riik – see olen mina!)"* – absolutistlik monarh jumalikul õigusel.
  - **Jean-Baptiste Colbert**: Merkantilismi põhimõtted (positiivne kaubabilanss, eksport > import, riiklikud manufaktuurid).
  - **Kuldne Päikesetroon & Nantes'i edikti tühistamine (1685)**: Hugenottide põgenemine ja selle mõju riigile.

### 4. 💡 Valgustusajastu Pariis ja Filosoofide Salong *(1750)*
- **Koht ja sisu:** Raamatukogu, trükikoda ja filosoofide arutelusalong.
- **Tegelased ja objektid:**
  - **Voltaire**: Sõnavabadus, usuline sallivus ja võitlus kirikliku ebausu vastu.
  - **Charles de Montesquieu**: Võimude lahususe kolmainsus (seadusandlik, täidesaatev ja kohtuvõim peavad üksteist tasakaalustama).
  - **Diderot' "Entsüklopeedia"**: 28-köiteline universaalne teadmistekogu.

### 5. ⚔️ Prantsuse Suur Revolutsioon ja Bastille *(1789–1799)*
- **Koht ja sisu:** Pariisi tänavad, barrikaadid, Bastille' varemed ja giljotiin.
- **Tegelased ja objektid:**
  - **Maximilien Robespierre**: Jakobiinide hirmualitsus (terror ja voorus) 1793–1794.
  - **Inimese ja Kodaniku Õiguste Deklaratsioon (1789)**: *"Liberté, Égalité, Fraternité!"* – kõik inimesed sünnivad vabadeks ja võrdseteks.
  - **Bastille' kindluse võti**: 14. juuli 1789 kuningliku despootia langemine.

### 6. ⚙️ Tööstusrevolutsiooni Manchester *(1800)*
- **Koht ja sisu:** Telliskivivabrikud, suitsevad korstnad, raudteerööpad ja söekaevandus.
- **Tegelased ja objektid:**
  - **James Watt**: Eraldi kondensaatoriga universaalne aurumasin, mis vabastas tööstuse veejõu asukohapiirangutest.
  - **Ned Ludd**: Ludiidid (masinalõhkujad) – protest ebainimlike 14-tunniste tööpäevade ja lapstööjõu vastu.
  - **Ketrusmasin "Spinning Jenny" & Stephensoni auruvedur "Rocket"**.

### 7. 🌾 Eesti Talurahva Priius ja Tartu Ülikool *(1802–1819)*
- **Koht ja sisu:** Eesti talutare (rehetare), rukkihakid ning Tartu Ülikooli kuus sammast.
- **Tegelased ja objektid:**
  - **Kristjan Jaak Peterson**: Eesti rahvuskirjanduse looja, kes kõndis jalgsi Riiast Tartusse ("Kas siis selle maa keel...").
  - **1816 ja 1819 talurahvaseadused**: Pärisorjuse kaotamine ("linnupriius" – isiklik vabadus ilma maata, säilis teoorjus).
  - **Perekonnanimede panek (1820–1835)**: Kuidas eestlased said loodus- ja ametinimed (Tamm, Kask, Sepp).
  - **Tartu Ülikooli taasavamine (1802)**: *Universitas Dorpatensis* ja teaduse taassünd.

### 8. 🌀 Portaalide Keskus (Ajamasin)
- Keskne peajaam, kust viivad 7 portaali igasse ajastusse, lisaks koondstatistika ja teadmiste koodeks.

---

## 🌟 Hariduslikud Funktsioonid

- **Kogemuspunktid (XP) ja Tasemed**: Iga uuritud objekt annab +25 XP ja salvestub uurimispäevikusse.
- **Õpivihjed kontrolltöödeks**: Iga objekti ja isiku juures on spetsiaalselt välja toodud *"Mida tasub teada eksamil ja kontrolltöös"*.
- **Ajastu Kiirtestid ([Q] nupp)**: Õpitud teemade kohene kontrollimine valikvastustega.
- **Suur Eksamitunnistus**: Eraldi vaates on saadaval 10-, 20- ja 30-küsimuseline täiseksam ametliku hindega (1–5).
- **Mõistete Sõnastik ja Ajatelg**: 8. klassi ajalooterminite reaalajas otsing ja kronoloogia.

---

Head ajarändamist ja suurepäraseid tulemusi ajalootunnis! 🎓
