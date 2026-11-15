/**
 * AJARÄNDUR: 8. KLASSI AJALOO MAAILMAD
 * =====================================
 * 2D Canvas seiklus- ja avastusmäng.
 * Mängija juhib ajarändurit läbi Eesti 8. klassi ajaloo võtmeajastute:
 * 1. Muinas-Eesti (Vanaaja linnus, hiis ja vabadus)
 * 2. Põhjasõda ja Narva kindlus (1700)
 * 3. Versailles' loss ja Päikesekuninga absolutism (1680)
 * 4. Valgustusajastu Pariis ja Entsüklopeedia (1750)
 * 5. Prantsuse Suur Revolutsioon ja Bastille (1789)
 * 6. Tööstusrevolutsiooni Manchester ja aurumasin (1800)
 * 7. Eesti talurahva priius ja Tartu Ülikool (1802-1819)
 * 8. Ajarändurite Keskus (Hub & Portaalid)
 */

class WorldGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 1024;
    this.height = 600;

    // Mängija olek
    this.player = {
      x: 700,
      y: 650,
      vx: 0,
      vy: 0,
      speed: 210,
      sprintMultiplier: 1.5,
      isSprinting: false,
      radius: 18,
      facing: 'down', // 'down', 'up', 'left', 'right'
      isMoving: false,
      walkCycle: 0,
      targetX: null,
      targetY: null,
      footstepTimer: 0
    };

    // Kaamera
    this.camera = {
      x: 0,
      y: 0
    };

    // Juhtimine
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      shift: false,
      interact: false
    };

    // Mängu progress
    this.xp = parseInt(localStorage.getItem('ar_xp') || '0', 10);
    this.discoveries = JSON.parse(localStorage.getItem('ar_discoveries') || '[]');
    this.completedQuests = JSON.parse(localStorage.getItem('ar_quests') || '[]');

    // Aktiivne maailm
    this.currentWorldId = 'ancient'; // Alustame Muinas-Eestist (drevni mir!)
    this.worlds = {};
    this.activeWorld = null;

    // Osakesed ja efektid
    this.particles = [];
    this.lastTime = performance.now();
    this.activeInteractable = null;

    // UI olekud
    this.isModalOpen = false;
  }

  init() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.setupWorlds();
    this.loadWorld(this.currentWorldId);
    this.setupControls();
    this.updateHUD();

    // Käivitame põhitsükli
    requestAnimationFrame((t) => this.gameLoop(t));

    // Lisame perioodilise osakeste lisamise
    setInterval(() => this.spawnAmbientParticles(), 250);
  }

  // ==========================================
  // MAAILMADE DEFINITSIOONID
  // ==========================================
  setupWorlds() {
    this.worlds = {
      // 1. MUINAS-EESTI (Esiaeg ja Muinasaeg - Vanaaja maailm)
      ancient: {
        id: 'ancient',
        title: 'Muinas-Eesti: Vanaaja Linnus ja Hiis',
        era: 'Esiaeg ja Muinasaeg (kuni 13. saj)',
        theme: 'ancient',
        bgColor: '#1d3319',
        pathColor: '#5c4a32',
        width: 1500,
        height: 1000,
        spawn: { x: 750, y: 700 },
        description: 'Muinaseestlaste muinaslinnus, püha tammik ja sepikoda enne ristisõdijate saabumist.',
        entities: [
          {
            id: 'anc_lembitu',
            type: 'npc',
            name: 'Muinasvanem Lembitu',
            role: 'Sakala vanem ja vabadusvõitluse juht',
            icon: '👴',
            x: 750,
            y: 420,
            dialogue: [
              'Tervist, võõramaalane! Mina olen Lembitu, Sakala vanem.',
              'Meie rahvas on siin Läänemere kaldal elanud aastatuhandeid vabana. Me kummardame metsa- ja veehaldjaid, toome ohvreid Ukule ja Taarale.',
              'Kaitseme oma maad Lõhavere kantsis. Igal muinasmaakonnal on oma vanemad, kuid ohu korral koguneme ühiseks malevaks!'
            ],
            fact: 'Muistses Eestis polnud ühtset kuningat ega riiki, vaid 8 suuremat maakonda (Sakala, Ugandi, Rävala jne) ja mitmed kihelkonnad, mida juhtisid vanemad.',
            examTip: 'Kontrolltöös küsitakse: Mis olid Eesti muinasmaakonnad ja kes oli kuulsaim muistse vabadusvõitluse juht? (Lembitu, Madisepäeva lahing 1217).'
          },
          {
            id: 'anc_sepp',
            type: 'npc',
            name: 'Muinasaja Sepp Ilmar',
            role: 'Rauasulatuse meister',
            icon: '🔨',
            x: 420,
            y: 500,
            dialogue: [
              'Tervitus! Minu ääsi kohal säriseb kohalik sooraud.',
              'Enne rauaaega kasutasime kivi ja pronksi, kuid kohalikust soomaagist raua sulatamine tegi meist tugevad.',
              'Sepistan nuge, vikatid, odaotsi ja hõbeehteid meie peremärkidega.'
            ],
            fact: 'Eestis algas rauaaeg umbes 500 eKr. Soorauamaagi sulatamine ahjudes oli muinasühiskonna tähtsaim tehnoloogiline murrang.',
            examTip: 'Raua kasutuselevõtt tõi kaasa põlluharimise hüppelise arengu (rauast sahad ja vikatid).'
          },
          {
            id: 'anc_altar',
            type: 'relic',
            name: 'Püha Ohvrikivi ja Tammik',
            role: 'Esivanemate pühapaik (Hiis)',
            icon: '🗿',
            x: 1050,
            y: 350,
            description: 'Massiivne sammaldunud kivi pühade hiiepuude vahel. Kivil on siledad lohud, kuhu muinaseestlased panid viljapäid, uudseleiba ja hõbevalget.',
            fact: 'Muinaseestlaste usund oli loodususk (animism). Pühades hiites ei tohtinud murda ühtki oksa ega vanduda.',
            examTip: 'Hiied ja ohvrikivid olid muinaseestlaste vaimsed keskused, kus suheldi esivanemate hingedega.'
          },
          {
            id: 'anc_axe',
            type: 'relic',
            name: 'Muistne Pronkskirves ja Kaelavõru',
            role: 'Pronksiaja aarded (u 1000 eKr)',
            icon: '🪓',
            x: 350,
            y: 720,
            description: 'Ilusa roheka paatinaga putkkirves ja spiraalne pronksist kaelavõru. Kuna Eestis vaske ega tina ei leidu, toodi pronksi vahetuskaubana.',
            fact: 'Pronksiajal tekkisid Eestis esimesed kindlustatud asulad (nt Asva ja Ridala Saaremaal) ning kivikirstkalmed.',
            examTip: 'Eesti pronksiaeg (1800–500 eKr): metalli imporditi mere tagant vahetuskaubana naha ja merevaigu vastu.'
          },
          {
            id: 'anc_wall',
            type: 'relic',
            name: 'Muinaslinnuse Vall ja Palktara',
            role: 'Kaitseehitis',
            icon: '🪵',
            x: 750,
            y: 260,
            description: 'Tammepalkidest ja maakividest rajatud järsk kaitsevall. Sõjaohu korral kogunes kogu kihelkonna rahvas koos karjaga linnusesse varjule.',
            fact: 'Eesti suurimad muinaslinnused olid Varbola ja Lõhavere. Need pidasid vastu nädalatepikkustele piiramistele.',
            examTip: 'Linnused jaotati mägilinnusteks, neemiklinnusteks ja maalinnadeks.'
          },
          {
            id: 'portal_to_hub',
            type: 'portal',
            name: 'Ajavärav: Portaalide Peajaam',
            targetWorld: 'hub',
            icon: '🌀',
            x: 750,
            y: 880,
            label: 'Astu portaali [E]'
          }
        ],
        obstacles: [
          // Linnuse müürid
          { x: 550, y: 220, w: 400, h: 30 },
          { x: 550, y: 220, w: 30, h: 180 },
          { x: 920, y: 220, w: 30, h: 180 },
          // Sepikoda
          { x: 340, y: 440, w: 140, h: 90 },
          // Pühad puud
          { x: 1000, y: 280, w: 120, h: 120 }
        ],
        scenery: [
          { type: 'fortress', x: 750, y: 200 },
          { type: 'bonfire', x: 750, y: 550 },
          { type: 'oak', x: 1020, y: 250 },
          { type: 'oak', x: 1140, y: 320 },
          { type: 'oak', x: 960, y: 380 },
          { type: 'tree', x: 200, y: 300 },
          { type: 'tree', x: 250, y: 600 },
          { type: 'tree', x: 1300, y: 400 },
          { type: 'tree', x: 1250, y: 700 }
        ]
      },

      // 2. PÕHJASÕDA JA NARVA KINDLUS (1700)
      narva: {
        id: 'narva',
        title: 'Põhjasõda: Narva Lahing ja Balti Erikord',
        era: 'Uusaeg (1700–1721)',
        theme: 'snow',
        bgColor: '#2c3e50',
        pathColor: '#5a6b7c',
        width: 1500,
        height: 1000,
        spawn: { x: 750, y: 750 },
        description: 'Lumine Narva kindluse esine 1700. aasta novembris. Rootsi armee Karl XII juhtimisel lööb Vene vägesid.',
        entities: [
          {
            id: 'narva_karl',
            type: 'npc',
            name: 'Rootsi Kuningas Karl XII',
            role: 'Rootsi väepealik ja monarh',
            icon: '👑',
            x: 750,
            y: 400,
            dialogue: [
              'Jumal on meiega! 1700. aasta 30. novembril ründasime Peeter I vägesid tihedas lumetormis.',
              'Tuul puhus venelastele otse näkku. Meie 10 000 meest lõid puruks nende 40 000-mehelise armee!',
              'Eesti talupojad olid tublid teejuhid. Paraku viis sõda hiljem meid Poltava alla...'
            ],
            fact: 'Narva lahing oli Karl XII nooruse suurim triumf. Rootsi võit päästis Narva esialgu venelaste kätte langemisest.',
            examTip: 'Põhjasõda kestis 1700–1721. Selle lõpetas Uusikaupunki rahu, millega Eesti läks Vene tsaaririigi koosseisu.'
          },
          {
            id: 'narva_cannon',
            type: 'relic',
            name: 'Rootsi 12-naelane Pronkssuurtükk',
            role: 'Kindluse suurtükivägi',
            icon: '💣',
            x: 520,
            y: 450,
            description: 'Massiivne puuratastel pronkskahur Rootsi kolme krooniga. Kasutati Narva bastionide kaitsmisel.',
            fact: 'Narva kindluse bastione (Victoria, Fama, Gloria, Triumph) peeti 17. sajandi lõpul Euroopa moodsamaiks kindlustusteks (projekteeris Erik Dahlberg).',
            examTip: 'Rootsi ajal rajati Narva ja Tallinna ümber võimsad muldbastionid.'
          },
          {
            id: 'narva_capitulation',
            type: 'relic',
            name: '1710. a Harku Kapitulatsiooniakt',
            role: 'Balti erikorra alusdokument',
            icon: '📜',
            x: 980,
            y: 480,
            description: 'Pärgamendil leping, millega Eestimaa rüütelkond ja Tallinna linn alistusid Peeter I-le katku ja piiramise tõttu.',
            fact: 'Balti erikord tähendas: 1) Saksa keel jäi ametlikuks asjaajamiskeeleks; 2) Luteri usk säilis; 3) Rüütelkonnad säilitasid oma aadliomavalitsuse ja maapäevad.',
            examTip: 'Ülitähtis 8. klassi eksamil: Mis oli Balti erikord ja kuidas see mõjutas Eesti aadlit ja talurahvast?'
          },
          {
            id: 'narva_map',
            type: 'relic',
            name: 'Peeter I Piiramiskaart',
            role: 'Vene strateegia Läänemerel',
            icon: '🗺️',
            x: 750,
            y: 280,
            description: 'Sõjaplaan, mis näitab Vene kaevikuid ümber Narva. Peeter I eesmärk oli murda "Aken Euroopasse".',
            fact: '1700–1710 hävis sõja ja kohutava katku tagajärjel üle poole Eesti elanikkonnast.',
            examTip: 'Peeter I rajas 1703. aastal vallutatud alale Peterburi linna.'
          },
          {
            id: 'portal_to_hub_narva',
            type: 'portal',
            name: 'Ajavärav: Portaalide Peajaam',
            targetWorld: 'hub',
            icon: '🌀',
            x: 750,
            y: 880,
            label: 'Astu portaali [E]'
          }
        ],
        obstacles: [
          { x: 400, y: 220, w: 700, h: 40 }, // Bastioni müür
          { x: 300, y: 550, w: 120, h: 90 }, // Sõjaväetelk
          { x: 1080, y: 550, w: 120, h: 90 }
        ],
        scenery: [
          { type: 'bastion', x: 750, y: 200 },
          { type: 'tent', x: 320, y: 560 },
          { type: 'tent', x: 1100, y: 560 },
          { type: 'snowdrift', x: 500, y: 700 },
          { type: 'snowdrift', x: 950, y: 680 }
        ]
      },

      // 3. VERSAILLES JA LOUIS XIV ABSOLUTISM (1680)
      versailles: {
        id: 'versailles',
        title: 'Versailles: Päikesekuningas ja Absolutism',
        era: 'Uusaeg (17. sajandi lõpp)',
        theme: 'palace',
        bgColor: '#2a1b3d',
        pathColor: '#c49e47',
        width: 1500,
        height: 1000,
        spawn: { x: 750, y: 750 },
        description: 'Versailles\' suurejooneline barokkloss ja aiad. Monarhi piiramatu võim ja merkantilismi hiilgeaeg.',
        entities: [
          {
            id: 'ver_louis',
            type: 'npc',
            name: 'Päikesekuningas Louis XIV',
            role: 'Prantsusmaa absolutistlik monarh',
            icon: '👑',
            x: 750,
            y: 350,
            dialogue: [
              'L\'État, c\'est moi! (Riik – see olen mina!)',
              'Minu võim pärineb otse Jumalalt. Keegi ei tohi minu seadusi kahtluse alla seada.',
              'Kogusin kõik Prantsuse aadlikud siia Versailles\'sse, kus nad tantsivad ja võistlevad minu soosingu pärast, selle asemel et mässata!'
            ],
            fact: 'Louis XIV valitses Prantsusmaad 72 aastat (1643–1715). Ta ehitas Versailles\' lossi absolutismi ja kuningliku ülemvõimu monumendiks.',
            examTip: 'Absolutism on valitsemisvorm, kus monarhile kuulub piiramatu seadusandlik, täidesaatev ja kohtuvõim.'
          },
          {
            id: 'ver_colbert',
            type: 'npc',
            name: 'Jean-Baptiste Colbert',
            role: 'Rahandusminister ja merkantilismi rajaja',
            icon: '💰',
            x: 450,
            y: 420,
            dialogue: [
              'Riigi rikkus mõõdetakse kullas ja hõbedas!',
              'Minu põhimõte on merkantilism: me peame müüma välismaale rohkem kui sisse ostma (positiivne kaubabilanss).',
              'Rajasime riiklikud manufaktuurid (peeglid, pitsid, gobeläänid) ja kehtestasime kõrged kaitsetollid väliskaubale.'
            ],
            fact: 'Merkantilism oli 17.–18. sajandi majanduspoliitika, mis soosis eksporti ja kaitses koduturgu imporditollidega.',
            examTip: 'Colbert\'i merkantilism: eesmärk täita riigikassa väärismetallidega.'
          },
          {
            id: 'ver_throne',
            type: 'relic',
            name: 'Kuldne Päikesetroon',
            role: 'Absolutismi sümbol',
            icon: '🪑',
            x: 750,
            y: 220,
            description: 'Massiivne kullatud troon, mida kaunistab kiirgav päikeseketas. Louis XIV võrdles end Apolloniga, kes toob riigile valgust.',
            fact: 'Õukonnaetikett oli rangelt reguleeritud – aadel pidas suureks auks isegi kuninga hommikust riietumist pealt vaadata (*lever*).',
            examTip: 'Päikesekuninga tiitel sümboliseeris tsentraliseeritud võimu: kõik tiirleb ümber monarhi.'
          },
          {
            id: 'ver_edict',
            type: 'relic',
            name: 'Nantes\'i Edikti Tühistamine (1685)',
            role: 'Usuline tagakiusamine',
            icon: '📜',
            x: 1050,
            y: 450,
            description: 'Kuninglik määrus, mis keelas hugenottide (protestantide) usuvabaduse Prantsusmaal.',
            fact: 'Edikti tühistamise järel põgenes Prantsusmaalt üle 200 000 haritud käsitöölise ja kaupmehe Inglismaale, Madalmaadesse ja Preisimaale, tekitades majandusele tohutut kahju.',
            examTip: 'Usuline sallimatus nõrgendas Prantsusmaa majandust 17. sajandi lõpus.'
          },
          {
            id: 'ver_fountain',
            type: 'relic',
            name: 'Versailles\' Barokk-purskkaev',
            role: 'Tehnika ja aiaarhitektuuri tippteos',
            icon: '⛲',
            x: 750,
            y: 560,
            description: 'Geomeetrilise prantsuse pargi keskel asuv purskkaev. Vesi pumbati Seine\'i jõest hiiglasliku Marly masinaga.',
            fact: 'Versailles\' aedu kutsutakse korrapäraseks ehk prantsuse pargiks – sümboliseerides inimese ja kuninga võimu looduse üle.',
            examTip: 'Prantsuse park on sümmeetriline ja rangelt pügatud, erinevalt inglise vabakujulisest maastikupargist.'
          },
          {
            id: 'portal_to_hub_ver',
            type: 'portal',
            name: 'Ajavärav: Portaalide Peajaam',
            targetWorld: 'hub',
            icon: '🌀',
            x: 750,
            y: 880,
            label: 'Astu portaali [E]'
          }
        ],
        obstacles: [
          { x: 300, y: 150, w: 900, h: 40 },
          { x: 300, y: 150, w: 40, h: 250 },
          { x: 1160, y: 150, w: 40, h: 250 },
          // Purskkaevu ring
          { x: 700, y: 520, w: 100, h: 80 }
        ],
        scenery: [
          { type: 'palace_pillars', x: 750, y: 150 },
          { type: 'hedge', x: 400, y: 650 },
          { type: 'hedge', x: 1100, y: 650 },
          { type: 'statue', x: 550, y: 300 },
          { type: 'statue', x: 950, y: 300 }
        ]
      },

      // 4. VALGUSTUSAJASTU PARIIS (1750)
      enlightenment: {
        id: 'enlightenment',
        title: 'Valgustusajastu: Mõistus ja Filosoofid',
        era: 'Uusaeg (18. sajand)',
        theme: 'salon',
        bgColor: '#241913',
        pathColor: '#8a6240',
        width: 1500,
        height: 1000,
        spawn: { x: 750, y: 750 },
        description: 'Pariisi vaimne filosoofide salong ja trükikoda. Valitseb mõistuseusk, teadus ja vabaduseiha.',
        entities: [
          {
            id: 'enl_voltaire',
            type: 'npc',
            name: 'Voltaire (François-Marie Arouet)',
            role: 'Valgustusfilosoof ja kirjanik',
            icon: '✍️',
            x: 520,
            y: 380,
            dialogue: [
              'Tere, mõtlev inimene! "Purustage see alatu!" – võitlen harimatuse, kirikliku fanatismi ja ebausu vastu.',
              'Ma ei pruugi nõustuda ühegi sinu sõnaga, kuid võitlen surmani sinu õiguse eest seda öelda!',
              'Valgustatud valitseja peaks toetuma filosoofide nõuandele, et harida rahvast ja edendada teadust.'
            ],
            fact: 'Voltaire oli prantsuse valgustuse tuntuim esindaja. Ta kaitses sõna-, usu- ja mõttevabadust.',
            examTip: 'Valgustusajastu põhiidee: inimmõistus (ratio) ja haridus viivad inimkonna pimedusest ja ebausust valgusesse.'
          },
          {
            id: 'enl_montesquieu',
            type: 'npc',
            name: 'Charles de Montesquieu',
            role: 'Õigusteadlane ja filosoof',
            icon: '⚖️',
            x: 980,
            y: 380,
            dialogue: [
              'Tervist! Minu peateos on "Seaduste vaimust" (1748).',
              'Türannia vältimiseks peab riigivõim olema lahutatud kolmeks sõltumatuks haruks:',
              '1. Seadusandlik võim (parlament), 2. Täidesaatev võim (valitsus), 3. Kohtuvõim (sõltumatud kohtud). Need peavad üksteist tasakaalustama!'
            ],
            fact: 'Montesquieu võimude lahususe põhimõte on tänapäevaste demokraatlike riikide põhiseaduste alustala (sh Eesti Vabariigi põhiseaduse § 4).',
            examTip: '8. klassi võtmeküsimus: Kes sõnastas võimude lahususe põhimõtte ja mis on selle kolm haru?'
          },
          {
            id: 'enl_encyclopedia',
            type: 'relic',
            name: 'Diderot\' ja d\'Alembert\'i "Entsüklopeedia"',
            role: 'Valgustuse monumentaalteos',
            icon: '📚',
            x: 750,
            y: 320,
            description: 'Nahkköites hiigeltööd (28 köidet), mis koondasid kogu kaasaegse teaduse, kunsti ja käsitöö teadmised. Kuninglik tsensuur püüdis seda korduvalt keelata.',
            fact: 'Denis Diderot pühendas "Entsüklopeedia" koostamisele üle 20 aasta oma elust.',
            examTip: 'Entsüklopeedia levitas uusi teaduslikke ja kriitilisi ideid kogu Euroopas.'
          },
          {
            id: 'enl_press',
            type: 'relic',
            name: 'Valgustuslik Trükipress',
            role: 'Vaba mõtte levitaja',
            icon: '🖨️',
            x: 420,
            y: 580,
            description: 'Käsitsitöötav puust trükimasin, millega trükiti keelatud pamflette, raamatuid ja ajalehti.',
            fact: '18. sajandil tekkis esimest korda Euroopas laialdane "avalik arvamus" kohvikutes ja lugemisseltsides.',
            examTip: 'Valgustusideed levisid tänu trükikunstile ka Balti kubermangudesse (valgustajad Hupel, Eisen, Merkel).'
          },
          {
            id: 'enl_globe',
            type: 'relic',
            name: 'Päikesesüsteemi Globus ja Teleskoop',
            role: 'Loodusteaduse triumf',
            icon: '🔭',
            x: 1080,
            y: 580,
            description: 'Messingist armillaarsfäär ja teleskoop, mis sümboliseerivad Newtoni füüsikat ja heliotsentrilist maailmapilti.',
            fact: 'Isaac Newtoni gravitatsiooniseadus ja mehaanika panid aluse usule, et universum allub kindlatele loodusseadustele.',
            examTip: 'Valgustajad asendasid religioossed seletused empiiriliste loodusteaduslike katsetega.'
          },
          {
            id: 'portal_to_hub_enl',
            type: 'portal',
            name: 'Ajavärav: Portaalide Peajaam',
            targetWorld: 'hub',
            icon: '🌀',
            x: 750,
            y: 880,
            label: 'Astu portaali [E]'
          }
        ],
        obstacles: [
          { x: 350, y: 200, w: 800, h: 40 }, // Raamaturiiulid
          { x: 350, y: 200, w: 40, h: 250 },
          { x: 1110, y: 200, w: 40, h: 250 }
        ],
        scenery: [
          { type: 'bookshelf', x: 550, y: 190 },
          { type: 'bookshelf', x: 950, y: 190 },
          { type: 'candle', x: 520, y: 350 },
          { type: 'candle', x: 980, y: 350 }
        ]
      },

      // 5. PRANTSUSE SUUR REVOLUTSIOON (1789)
      revolution: {
        id: 'revolution',
        title: 'Prantsuse Revolutsioon: Bastille ja Vabadus',
        era: 'Uusaeg (1789–1799)',
        theme: 'revolution',
        bgColor: '#2c2225',
        pathColor: '#5c4847',
        width: 1500,
        height: 1000,
        spawn: { x: 750, y: 750 },
        description: 'Mässav Pariis 1789–1793. Bastille\' vallutamine, kolme seisuse võitlus ja vabaduse sünd.',
        entities: [
          {
            id: 'rev_robespierre',
            type: 'npc',
            name: 'Maximilien Robespierre',
            role: 'Jakobiinide juht ("Äraostmatu")',
            icon: '🗣️',
            x: 750,
            y: 380,
            dialogue: [
              'Kodanikud! Vabaduse vaenlastele ei saa pakkuda vabadust!',
              'Revolutsioon vajab voorust ja terrorit: voorus ilma terrorita on abitu, terror ilma vooruseta on hävitav.',
              'Kuningas Louis XVI peab surema, et vabariik saaks elada!'
            ],
            fact: 'Jakobiinide diktatuur (1793–1794) tõi kaasa hirmualitsuse, kus giljotineeriti kümneid tuhandeid inimesi, kuni Robespierre ise hukati.',
            examTip: 'Prantsuse revolutsiooni etapid: 1789 Bastille vallutamine, 1792 vabariigi väljakuulutamine, 1793–94 jakobiinide terror.'
          },
          {
            id: 'rev_sansculotte',
            type: 'npc',
            name: 'Kodanik Sanskuloott (Rahva esindaja)',
            role: 'Pariisi lihtrahvas ja revolutsionäär',
            icon: '🥖',
            x: 450,
            y: 480,
            dialogue: [
              'Me nõuame leiba ja õiglust!',
              'Varem maksis ainult kolmas seisus makse, samal ajal kui vaimulikud ja aadlikud priiskasid.',
              '14. juulil 1789 murdsime Bastille\'sse ja näitasime kuningale, kelle käes on tegelik võim!'
            ],
            fact: 'Sanskulottideks kutsuti Pariisi lihtrahvast, kes kandsid aristokraatide lühikeste põlvpükste (*culottes*) asemel pikki tööpükse.',
            examTip: 'Prantsuse ühiskond jagunes kolmeks seisuseks: I vaimulikud, II aadlikud, III ülejäänud rahvas (98% elanikkonnast).'
          },
          {
            id: 'rev_declaration',
            type: 'relic',
            name: 'Inimese ja Kodaniku Õiguste Deklaratsioon (1789)',
            role: 'Inimõiguste nurgakivi',
            icon: '📜',
            x: 750,
            y: 240,
            description: 'Kivitahvlitele raiutud 17 artiklit: "Inimesed sünnivad ja jäävad vabadeks ning õigustelt võrdseteks." Hüüdlause: Liberté, égalité, fraternité (Vabadus, võrdsus, vendlus)!',
            fact: 'Deklaratsioon kaotas feodaalsed eesõigused ja kehtestas seaduse ees võrdsuse, omandi puutumatuse ja usuvabaduse.',
            examTip: 'Põhiline eksamiteema: Mida kuulutas Inimese ja kodaniku õiguste deklaratsioon?'
          },
          {
            id: 'rev_bastille_key',
            type: 'relic',
            name: 'Bastille\' Kindluse Võti ja Rusud',
            role: 'Kuningliku omavoli langemine',
            icon: '🗝️',
            x: 1050,
            y: 420,
            description: 'Raudne võti ja lammutatud Bastille\' kindluse kivid. Pariislased lammutasid kindluse kivi-kivilt paljaste kätega maha.',
            fact: '14. juuli (Bastille\' vallutamise päev) on tänaseni Prantsusmaa tähtsaim riigipüha.',
            examTip: 'Bastille sümboliseeris absolutismi ja despootiat, selle langemine tähistas revolutsiooni algust.'
          },
          {
            id: 'rev_guillotine',
            type: 'relic',
            name: 'Giljotiin (Riiklik habemenuga)',
            role: 'Hirmualitsuse sümbol',
            icon: '⚖️',
            x: 420,
            y: 680,
            description: 'Kaldus teraga hukkamismasin, mille dr Guillotin pakkus välja kui "humaanse ja kõiki seisusi võrdsustava" hukkamisvahendi.',
            fact: 'Giljotiinil hukati nii kuningas Louis XVI, kuninganna Marie Antoinette kui ka hiljem jakobiinide juhid ise.',
            examTip: 'Kõnekäänd: "Revolutsioon sööb omaenda lapsi."'
          },
          {
            id: 'portal_to_hub_rev',
            type: 'portal',
            name: 'Ajavärav: Portaalide Peajaam',
            targetWorld: 'hub',
            icon: '🌀',
            x: 750,
            y: 880,
            label: 'Astu portaali [E]'
          }
        ],
        obstacles: [
          { x: 300, y: 350, w: 100, h: 50 }, // Barrikaad
          { x: 1100, y: 350, w: 100, h: 50 },
          { x: 600, y: 180, w: 300, h: 30 }
        ],
        scenery: [
          { type: 'barricade', x: 320, y: 360 },
          { type: 'barricade', x: 1120, y: 360 },
          { type: 'tricolor', x: 750, y: 170 },
          { type: 'fire_barrel', x: 500, y: 550 },
          { type: 'fire_barrel', x: 1000, y: 550 }
        ]
      },

      // 6. TÖÖSTUSREVOLUTSIOONI MANCHESTER (1800)
      industry: {
        id: 'industry',
        title: 'Tööstusrevolutsioon: Aur ja Masinad',
        era: 'Uusaeg (18.–19. sajand)',
        theme: 'factory',
        bgColor: '#1c1f24',
        pathColor: '#3d444d',
        width: 1500,
        height: 1000,
        spawn: { x: 750, y: 750 },
        description: 'Inglismaa tööstuslinn Manchester. Vabrikute korstnad suitsevad, kolisevad kangasteljed ja susiseb aurumasin.',
        entities: [
          {
            id: 'ind_watt',
            type: 'npc',
            name: 'James Watt (Leidur)',
            role: 'Universaalse aurumasina looja',
            icon: '⚙️',
            x: 520,
            y: 420,
            dialogue: [
              'Tervitus teile tulevikust! Minu nimi on James Watt.',
              '1769. aastal lisasin Thomas Newcomeni primitiivsele aurumasinale eraldi kondensaatori. See säästis 75% kütust!',
              'Minu aurumasin ei vaja enam jõge ega tuult – see paneb vabrikud, rongid ja aurikud liikuma ükskõik kus!'
            ],
            fact: 'James Watti aurumasin oli tööstusrevolutsiooni peamine mootor. Tema auks nimetati võimsusühik vatt (W).',
            examTip: 'Miks algas tööstuspööre just Suurbritannias? (Rikkalikud söe- ja rauamaardlad, vaba kapital, kolooniad, leiutised).'
          },
          {
            id: 'ind_luddite',
            type: 'npc',
            name: 'Ned Ludd (Ludiidist tööline)',
            role: 'Masinalõhkujate juht',
            icon: '🔨',
            x: 980,
            y: 460,
            dialogue: [
              'Masinad röövivad meie leiva! Üks ketrusmasin teeb ära kümne meistri töö!',
              'Töötame vabrikus 14 tundi päevas müras ja tolmus sandikopikate eest. Isegi 8-aastased lapsed pannakse masinate alla ohtlikku tööd tegema.',
              'Öösiti haarame vasarad ja purustame need põrgulikud masinad!'
            ],
            fact: 'Ludiidid olid 19. sajandi alguse inglise käsitöölised, kes protestiks tööpuuduse ja viletsate palkade vastu purustasid vabriku seadmeid.',
            examTip: 'Tööstusrevolutsiooni sotsiaalsed tagajärjed: linnastumine (urbaniseerumine), töölisklassi (proletariaadi) teke, lapstööjõud.'
          },
          {
            id: 'ind_steam_engine',
            type: 'relic',
            name: 'James Watti Aurumasin',
            role: 'Uusaja tehnoloogia süda',
            icon: '🚂',
            x: 750,
            y: 350,
            description: 'Massiivne malmist silindri, kondensaatori ja pöörleva hoorattaga masin. Toodab lakkamatult mehaanilist liikumist.',
            fact: 'Aurumasin võimaldas rajada vabrikuid sisealadele ja linnadesse, vabastades tootmise veerataste asukohapiirangutest.',
            examTip: 'Aurumasin tõi kaasa transpordirevolutsiooni: auruvedur (Stephensoni Rocket 1829) ja aurik (Fultoni Clermont).'
          },
          {
            id: 'ind_jenny',
            type: 'relic',
            name: 'Ketrusmasin "Spinning Jenny"',
            role: 'Tekstiilitööstuse murrang (1764)',
            icon: '🧵',
            x: 420,
            y: 650,
            description: 'James Hargreavesi leiutatud mitme kedervarrega ketrusmasin. Võimaldas ühel töölisel korraga kedrata 16–80 lõngapooli.',
            fact: 'Tekstiilitööstus oli esimene tootmisharu, kus mindi üle masintootmisele, luues kaasaegse vabrikusüsteemi.',
            examTip: 'Käsitöö (manufaktuur) asendus masintootmisega (vabrik).'
          },
          {
            id: 'ind_coal',
            type: 'relic',
            name: 'Kivisöe Vagonett ja Davy Ohutuslamp',
            role: 'Kaevandustehnoloogia',
            icon: '⛏️',
            x: 1080,
            y: 650,
            description: 'Terasvagonett täis musta kivisütt. Kaevurite ohutuslamp (Davy lamp) hoidis ära gaasiplahvatused kaevanduskäikudes.',
            fact: 'Kivisüsi ja raud olid tööstusrevolutsiooni kaks põhilist toorainet ("must kuld").',
            examTip: 'Aurumasinad vajasid auru tekitamiseks tohutul hulgal kivisütt.'
          },
          {
            id: 'portal_to_hub_ind',
            type: 'portal',
            name: 'Ajavärav: Portaalide Peajaam',
            targetWorld: 'hub',
            icon: '🌀',
            x: 750,
            y: 880,
            label: 'Astu portaali [E]'
          }
        ],
        obstacles: [
          { x: 300, y: 180, w: 900, h: 50 }, // Vabriku sein
          { x: 620, y: 700, w: 260, h: 20 }  // Raudtee
        ],
        scenery: [
          { type: 'chimney', x: 450, y: 150 },
          { type: 'chimney', x: 1050, y: 150 },
          { type: 'rails', x: 750, y: 710 },
          { type: 'cogs', x: 750, y: 250 }
        ]
      },

      // 7. EESTI TALURAHVA PRIIDUS JA TARTU ÜLIKOOL (1802-1819)
      estonia: {
        id: 'estonia',
        title: 'Eesti Uusaeg: Talurahva Priius ja Tartu Ülikool',
        era: 'Uusaeg (1802–1819)',
        theme: 'countryside',
        bgColor: '#253518',
        pathColor: '#635338',
        width: 1500,
        height: 1000,
        spawn: { x: 750, y: 750 },
        description: '19. sajandi alguse Eesti küla ja Tartu Ülikool. Pärisorjuse kaotamine, perekonnanimede panek ja vaimuvalguse tõus.',
        entities: [
          {
            id: 'est_peterson',
            type: 'npc',
            name: 'Kristjan Jaak Peterson',
            role: 'Eesti rahvusliku kirjanduse rajaja',
            icon: '🚶',
            x: 520,
            y: 420,
            dialogue: [
              'Tere, noor ajarändur! Mina kõnnin jalgsi Riiast Tartusse tarkust taga nõudma.',
              '"Kas siis selle maa keel laulutuules ei või taevani tõustes üles igavikku omale otsida?"',
              'Kannan uhkusega eesti talupojakuube ja tõestan, et eesti keel kõlbab kõrgkultuuriks ja luuleks!'
            ],
            fact: 'Kristjan Jaak Peterson (1801–1822) õppis taasavatud Tartu Ülikoolis ja kirjutas esimesed eesti filosoofilised oodid. Tema sünnipäeval (14. märtsil) tähistatakse Emakeelepäeva.',
            examTip: 'Kristjan Jaak Peterson on eesti rahvuskirjanduse looja ja esimene teadlikult eesti soost haritlane.'
          },
          {
            id: 'est_clerk',
            type: 'npc',
            name: 'Köster ja Vallakirjutaja',
            role: 'Perekonnanimede panija (1820–1835)',
            icon: '📜',
            x: 980,
            y: 420,
            dialogue: [
              'Tere tulemast vallamajja! Pärast priiuse saamist peame igale eesti perele andma perekonnanime.',
              'Valime nimesid loodusest (Tamm, Saar, Kask, Ilves), ametitest (Sepp, Mölder) või voorustest (Õunapuu, Lill).',
              'Nüüd on talupoeg vaba inimene, kuigi maa kuulub endiselt mõisahärrale!'
            ],
            fact: 'Perekonnanimede panemine toimus Eestimaal 1835. aastaks ja Liivimaal 1826. aastaks. Kokku pandi üle 30 000 erineva nime.',
            examTip: 'Enne seda kutsuti eestlasi talunime ja eesnime järgi (nt Sauna Madis, Välja Toomas).'
          },
          {
            id: 'est_laws',
            type: 'relic',
            name: '1816. ja 1819. a Talurahvaseadused',
            role: 'Pärisorjuse kaotamise seadused',
            icon: '🌾',
            x: 750,
            y: 350,
            description: 'Keiser Aleksander I poolt kinnitatud seadused: 1816 Eestimaa kubermangus ja 1819 Liivimaa kubermangus. Talupojad vabastati pärisorjusest!',
            fact: 'Kuigi talupoeg sai isikliku vabaduse, jäi kogu maa mõisniku omandiks. Talupojad pidid maa rentimiseks tegema rasket teoorjust ("linnupriius").',
            examTip: 'Üks olulisemaid 8. klassi eksamiküsimusi: Mis oli "linnupriius"? (Isiklik vabadus ilma maata, säilis teoorjus).'
          },
          {
            id: 'est_rehetare',
            type: 'relic',
            name: 'Rehetare Reheahi ja Koot',
            role: 'Talupoja eluase ja viljakuivati',
            icon: '🏠',
            x: 420,
            y: 650,
            description: 'Suitsutare massiivse kiviahjuga. Rehetoas kuivatati parte peal rukist, peksti kootidega teri ja elati pimedal talvel.',
            fact: 'Rehetare oli unikaalne eesti ehitis, mida mujal Euroopas sellisel kujul ei tuntud (kombineeritud eluase ja viljakuivati).',
            examTip: 'Rehepeks ja rukkikasvatus olid eesti talupoja peamised elatusallikad.'
          },
          {
            id: 'est_university',
            type: 'relic',
            name: 'Tartu Ülikooli Peahoone ja Sambad',
            role: 'Vaimuvalguse kants (1802)',
            icon: '🏛️',
            x: 1080,
            y: 650,
            description: 'Klassitsistlik kuue sambaga peahoone. Rektor Georg Friedrich Parrot tegi sellest ühe Vene impeeriumi vabama ja euroopalikuma ülikooli.',
            fact: 'Tartu Ülikool taasavati 1802. aastal saksakeelsena (*Kaiserliche Universität zu Dorpat*). See koolitas arste, juriste ja teadlasi.',
            examTip: '1802. a Tartu Ülikooli taasavamine pani aluse Eesti teadus- ja hariduselu uuele tõusule.'
          },
          {
            id: 'portal_to_hub_est',
            type: 'portal',
            name: 'Ajavärav: Portaalide Peajaam',
            targetWorld: 'hub',
            icon: '🌀',
            x: 750,
            y: 880,
            label: 'Astu portaali [E]'
          }
        ],
        obstacles: [
          { x: 300, y: 550, w: 160, h: 100 }, // Rehetare
          { x: 1000, y: 550, w: 200, h: 100 } // Ülikooli tiib
        ],
        scenery: [
          { type: 'rehetare_building', x: 380, y: 580 },
          { type: 'university_columns', x: 1100, y: 580 },
          { type: 'well', x: 600, y: 580 },
          { type: 'rye_sheaf', x: 250, y: 750 },
          { type: 'rye_sheaf', x: 320, y: 800 },
          { type: 'rye_sheaf', x: 1250, y: 750 }
        ]
      },

      // 8. HUB (Ajarändurite Peajaam ja Portaalide Koda)
      hub: {
        id: 'hub',
        title: 'Portaalide Peajaam: Ajaränduri Keskus',
        era: 'Ajaväline keskus',
        theme: 'hub',
        bgColor: '#0b111e',
        pathColor: '#172740',
        width: 1500,
        height: 1000,
        spawn: { x: 750, y: 500 },
        description: 'Müstiline ajarännukeskus, kust avanevad portaalid kõikidesse 8. klassi ajaloo võtmeajastutesse.',
        entities: [
          {
            id: 'hub_guide',
            type: 'npc',
            name: 'Kronos (Ajarännu Instruktor)',
            role: 'Ajaloo teejuht',
            icon: '🧙‍♂️',
            x: 750,
            y: 450,
            dialogue: [
              'Tervist, vapper ajarändur!',
              'Siit keskusest pääsed seitsmesse eri ajastusse, mis hõlmavad kogu Eesti 8. klassi ajaloo ainekava (vanaajast kuni 19. sajandini).',
              'Sinu ülesanne on astuda igasse portaali, uurida esemeid, vestelda suurkujudega ja koguda teadmiste punkte (XP)!',
              'Kui oled valmis, ava teadmiste päevik [J] või tee ajastu test [Q]!'
            ],
            fact: 'Ajalugu ei ole pelgalt aastaarvude tuupimine – see on arusaam sellest, kuidas inimeste otsused kujundasid tänapäeva maailma.',
            examTip: 'Kõik siin uuritud objektid ja tegelased vastavad täpselt Eesti põhikooli riiklikule eksamikavale!'
          },
          // 7 Portaalirõngast ajastutesse
          {
            id: 'p_ancient',
            type: 'portal',
            name: 'Maailm 1: Muinas-Eesti ja Linnus',
            targetWorld: 'ancient',
            icon: '🪓',
            x: 250,
            y: 300,
            label: 'Muinas-Eesti [E]'
          },
          {
            id: 'p_narva',
            type: 'portal',
            name: 'Maailm 2: Põhjasõda ja Narva 1700',
            targetWorld: 'narva',
            icon: '❄️',
            x: 500,
            y: 240,
            label: 'Narva 1700 [E]'
          },
          {
            id: 'p_versailles',
            type: 'portal',
            name: 'Maailm 3: Versailles ja Louis XIV',
            targetWorld: 'versailles',
            icon: '👑',
            x: 750,
            y: 220,
            label: 'Versailles [E]'
          },
          {
            id: 'p_enlightenment',
            type: 'portal',
            name: 'Maailm 4: Valgustusajastu Pariis',
            targetWorld: 'enlightenment',
            icon: '💡',
            x: 1000,
            y: 240,
            label: 'Valgustus [E]'
          },
          {
            id: 'p_revolution',
            type: 'portal',
            name: 'Maailm 5: Prantsuse Revolutsioon',
            targetWorld: 'revolution',
            icon: '⚔️',
            x: 1250,
            y: 300,
            label: 'Revolutsioon [E]'
          },
          {
            id: 'p_industry',
            type: 'portal',
            name: 'Maailm 6: Tööstusrevolutsioon',
            targetWorld: 'industry',
            icon: '⚙️',
            x: 400,
            y: 750,
            label: 'Tööstus [E]'
          },
          {
            id: 'p_estonia',
            type: 'portal',
            name: 'Maailm 7: Eesti Talurahvas & Tartu Ülikool',
            targetWorld: 'estonia',
            icon: '🌾',
            x: 1100,
            y: 750,
            label: 'Eesti 1819 [E]'
          }
        ],
        obstacles: [],
        scenery: [
          { type: 'portal_pillar', x: 250, y: 280 },
          { type: 'portal_pillar', x: 500, y: 220 },
          { type: 'portal_pillar', x: 750, y: 200 },
          { type: 'portal_pillar', x: 1000, y: 220 },
          { type: 'portal_pillar', x: 1250, y: 280 },
          { type: 'portal_pillar', x: 400, y: 730 },
          { type: 'portal_pillar', x: 1100, y: 730 }
        ]
      }
    };
  }

  // ==========================================
  // MAAILMA LAADIMINE
  // ==========================================
  loadWorld(worldId) {
    if (!this.worlds[worldId]) return;
    this.currentWorldId = worldId;
    this.activeWorld = this.worlds[worldId];

    // Seame mängija sünnikohta
    this.player.x = this.activeWorld.spawn.x;
    this.player.y = this.activeWorld.spawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.targetX = null;
    this.player.targetY = null;

    // Heliefekt portaali astumisel
    if (window.sound) window.sound.playPortal();

    // Tühjendame osakesed
    this.particles = [];

    this.updateHUD();
  }

  // ==========================================
  // JUHTIMINE JA SISENDID
  // ==========================================
  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (this.isModalOpen && e.key === 'Escape') {
        this.closeModal();
        return;
      }
      if (this.isModalOpen) return;

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          this.keys.up = true;
          this.player.targetX = null; // Katkesta hiire liikumine
          break;
        case 'arrowdown':
        case 's':
          this.keys.down = true;
          this.player.targetX = null;
          break;
        case 'arrowleft':
        case 'a':
          this.keys.left = true;
          this.player.targetX = null;
          break;
        case 'arrowright':
        case 'd':
          this.keys.right = true;
          this.player.targetX = null;
          break;
        case 'shift':
          this.keys.shift = true;
          break;
        case 'e':
        case ' ':
          this.handleInteract();
          break;
        case 'm':
          this.openWorldMap();
          break;
        case 'j':
          this.openJournal();
          break;
        case 'q':
          this.openMiniQuiz();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          this.keys.up = false;
          break;
        case 'arrowdown':
        case 's':
          this.keys.down = false;
          break;
        case 'arrowleft':
        case 'a':
          this.keys.left = false;
          break;
        case 'arrowright':
        case 'd':
          this.keys.right = false;
          break;
        case 'shift':
          this.keys.shift = false;
          break;
      }
    });

    // Hiire / Puute klõps canvasel (Liigu klõpsatud punkti või klõpsa objektile)
    this.canvas.addEventListener('click', (e) => {
      if (this.isModalOpen) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX + this.camera.x;
      const clickY = (e.clientY - rect.top) * scaleY + this.camera.y;

      // Kontrollime, kas klõpsati otse mõnele objektile
      let clickedEntity = null;
      for (const ent of this.activeWorld.entities) {
        const dist = Math.hypot(clickX - ent.x, clickY - ent.y);
        if (dist < 40) {
          clickedEntity = ent;
          break;
        }
      }

      if (clickedEntity) {
        // Kui oleme juba lähedal, interakteerume kohe
        const playerDist = Math.hypot(this.player.x - clickedEntity.x, this.player.y - clickedEntity.y);
        if (playerDist < 65) {
          this.interactWithEntity(clickedEntity);
          return;
        }
      }

      // Seame mängija sihtkoha
      this.player.targetX = clickX;
      this.player.targetY = clickY;

      // Lisa visuaalne klõpsu laine osake
      this.particles.push({
        type: 'ripple',
        x: clickX,
        y: clickY,
        r: 4,
        maxR: 24,
        alpha: 1,
        color: '#d4af37'
      });
    });
  }

  // ==========================================
  // PÕHILINE MÄNGUTSÜKKEL (60 FPS)
  // ==========================================
  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.isModalOpen) {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // ==========================================
  // UUENDAMINE (FÜÜSIKA JA LOOGIKA)
  // ==========================================
  update(dt) {
    if (!this.activeWorld) return;

    let moveX = 0;
    let moveY = 0;

    // Klahvide sisend
    if (this.keys.up) moveY -= 1;
    if (this.keys.down) moveY += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // Kui klõpsati hiirega sihtkoht
    if (this.player.targetX !== null && this.player.targetY !== null && moveX === 0 && moveY === 0) {
      const dx = this.player.targetX - this.player.x;
      const dy = this.player.targetY - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        moveX = dx / dist;
        moveY = dy / dist;
      } else {
        this.player.targetX = null;
        this.player.targetY = null;
      }
    }

    // Normaliseerime diagonaalliikumise
    if (moveX !== 0 && moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      moveX /= len;
      moveY /= len;
    }

    this.player.isMoving = moveX !== 0 || moveY !== 0;

    // Suund
    if (Math.abs(moveX) > Math.abs(moveY)) {
      this.player.facing = moveX > 0 ? 'right' : 'left';
    } else if (Math.abs(moveY) > 0) {
      this.player.facing = moveY > 0 ? 'down' : 'up';
    }

    // Kiirus ja sprint
    let currentSpeed = this.player.speed;
    if (this.keys.shift) currentSpeed *= this.player.sprintMultiplier;

    const nextX = this.player.x + moveX * currentSpeed * dt;
    const nextY = this.player.y + moveY * currentSpeed * dt;

    // Kokkupõrgete kontroll maailma piiride ja takistustega
    if (this.canMove(nextX, this.player.y)) {
      this.player.x = nextX;
    }
    if (this.canMove(this.player.x, nextY)) {
      this.player.y = nextY;
    }

    // Kõndimise animatsioon ja sammuhelid
    if (this.player.isMoving) {
      this.player.walkCycle += dt * 10;
      this.player.footstepTimer += dt;
      if (this.player.footstepTimer > 0.32) {
        this.player.footstepTimer = 0;
        if (window.sound) window.sound.playStep();
        // Lisa tolmupilve osake jalgade juurde
        this.particles.push({
          type: 'dust',
          x: this.player.x + (Math.random() * 8 - 4),
          y: this.player.y + 14,
          vx: -moveX * 10,
          vy: -moveY * 10 - 5,
          alpha: 0.6,
          size: Math.random() * 3 + 2,
          color: '#8b7d6b'
        });
      }
    } else {
      this.player.walkCycle = 0;
    }

    // Kaamera sujuv liikumine mängija tsentrisse
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    // Piirame kaamera maailma sisse
    this.camera.x = Math.max(0, Math.min(this.activeWorld.width - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.activeWorld.height - this.canvas.height, this.camera.y));

    // Otsime lähimat interakteeritavat objekti
    this.activeInteractable = null;
    let minDist = 65;
    for (const ent of this.activeWorld.entities) {
      const dist = Math.hypot(this.player.x - ent.x, this.player.y - ent.y);
      if (dist < minDist) {
        minDist = dist;
        this.activeInteractable = ent;
      }
    }

    // Osakeste uuendamine
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === 'dust') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * 1.5;
        if (p.alpha <= 0) this.particles.splice(i, 1);
      } else if (p.type === 'ripple') {
        p.r += dt * 35;
        p.alpha -= dt * 2.2;
        if (p.alpha <= 0) this.particles.splice(i, 1);
      } else if (p.type === 'snow') {
        p.y += p.vy * dt;
        p.x += Math.sin(p.y * 0.05) * 15 * dt;
        if (p.y > this.activeWorld.height) p.y = 0;
      } else if (p.type === 'leaf') {
        p.y += p.vy * dt;
        p.x += Math.sin(p.y * 0.04) * 25 * dt;
        if (p.y > this.activeWorld.height) p.y = 0;
      } else if (p.type === 'smoke') {
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        p.size += dt * 8;
        p.alpha -= dt * 0.4;
        if (p.alpha <= 0) this.particles.splice(i, 1);
      } else if (p.type === 'spark') {
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        p.alpha -= dt * 0.8;
        if (p.alpha <= 0) this.particles.splice(i, 1);
      }
    }
  }

  // ==========================================
  // KOKKUPÕRGETE KONTROLL
  // ==========================================
  canMove(x, y) {
    const r = this.player.radius;
    // Maailma piirid
    if (x - r < 40 || x + r > this.activeWorld.width - 40) return false;
    if (y - r < 40 || y + r > this.activeWorld.height - 40) return false;

    // Takistuste ristkülikud
    if (this.activeWorld.obstacles) {
      for (const obs of this.activeWorld.obstacles) {
        if (
          x + r > obs.x &&
          x - r < obs.x + obs.w &&
          y + r > obs.y &&
          y - r < obs.y + obs.h
        ) {
          return false;
        }
      }
    }
    return true;
  }

  // ==========================================
  // JOONISTAMINE JA VISUAALID
  // ==========================================
  render() {
    if (!this.ctx || !this.activeWorld) return;
    const ctx = this.ctx;

    ctx.save();
    // Puhastame ekraani
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Nihutame vaate kaamera järgi
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    // 1. Maapinna taust
    this.drawBackground(ctx);

    // 2. Dekoorid ja stseen
    this.drawScenery(ctx);

    // 3. Interakteeritavad objektid ja NPC-d
    this.drawEntities(ctx);

    // 4. Mängija tegelane
    this.drawPlayer(ctx);

    // 5. Osakesed ja ilmastikuefektid
    this.drawParticles(ctx);

    ctx.restore();

    // 6. UI elemendid (fikseeritud ekraanile)
    this.drawHUD(ctx);
  }

  drawBackground(ctx) {
    const w = this.activeWorld.width;
    const h = this.activeWorld.height;

    // Põhivärv
    ctx.fillStyle = this.activeWorld.bgColor;
    ctx.fillRect(0, 0, w, h);

    // Joonistame maapinna tekstuuriruudud
    const tileSize = 64;
    const startCol = Math.floor(this.camera.x / tileSize);
    const endCol = Math.ceil((this.camera.x + this.canvas.width) / tileSize);
    const startRow = Math.floor(this.camera.y / tileSize);
    const endRow = Math.ceil((this.camera.y + this.canvas.height) / tileSize);

    for (let c = startCol; c <= endCol; c++) {
      for (let r = startRow; r <= endRow; r++) {
        const x = c * tileSize;
        const y = r * tileSize;

        if (this.activeWorld.theme === 'ancient') {
          // Roheline muru ja heledamad tutid
          if ((c + r) % 3 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.fillRect(x, y, tileSize, tileSize);
          }
          // Murututid
          if ((c * 7 + r * 13) % 5 === 0) {
            ctx.fillStyle = '#2e4e26';
            ctx.fillRect(x + 12, y + 20, 3, 8);
            ctx.fillRect(x + 15, y + 18, 3, 10);
          }
        } else if (this.activeWorld.theme === 'snow') {
          // Lumi ja jäised sinakad toonid
          if ((c + r) % 2 === 0) {
            ctx.fillStyle = '#34495e';
            ctx.fillRect(x, y, tileSize, tileSize);
          }
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.strokeRect(x, y, tileSize, tileSize);
        } else if (this.activeWorld.theme === 'palace') {
          // Marmorist šahiruudud (Versailles)
          ctx.fillStyle = (c + r) % 2 === 0 ? '#372450' : '#231633';
          ctx.fillRect(x, y, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
          ctx.strokeRect(x, y, tileSize, tileSize);
        } else if (this.activeWorld.theme === 'salon') {
          // Puitparkett
          ctx.fillStyle = (c + r) % 2 === 0 ? '#382216' : '#2d1b11';
          ctx.fillRect(x, y, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.strokeRect(x, y, tileSize, tileSize);
        } else if (this.activeWorld.theme === 'revolution') {
          // Pariisi munakivisillutis
          ctx.fillStyle = (c + r) % 2 === 0 ? '#362b2d' : '#281f21';
          ctx.fillRect(x, y, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.strokeRect(x, y, tileSize, tileSize);
        } else if (this.activeWorld.theme === 'factory') {
          // Manchesteri tehasepõrand ja tellised
          ctx.fillStyle = (c + r) % 2 === 0 ? '#262a30' : '#1d2025';
          ctx.fillRect(x, y, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.strokeRect(x, y, tileSize, tileSize);
        } else if (this.activeWorld.theme === 'countryside') {
          // Eesti talumaastik
          ctx.fillStyle = (c + r) % 2 === 0 ? '#2c3e1e' : '#233217';
          ctx.fillRect(x, y, tileSize, tileSize);
          if ((c + r) % 4 === 0) {
            ctx.fillStyle = '#65532f'; // Rukkikõrred
            ctx.fillRect(x + 20, y + 20, 2, 6);
          }
        } else if (this.activeWorld.theme === 'hub') {
          // Kosmiline / ajarännukeskus
          ctx.fillStyle = (c + r) % 2 === 0 ? '#101a2e' : '#0c1322';
          ctx.fillRect(x, y, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(74, 144, 226, 0.1)';
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }
    }

    // Teerajad (keskmine kruusatee)
    ctx.fillStyle = this.activeWorld.pathColor;
    ctx.beginPath();
    ctx.arc(750, 500, 160, 0, Math.PI * 2);
    ctx.fill();

    // Ristteed
    ctx.fillRect(720, 100, 60, 800);
    ctx.fillRect(200, 470, 1100, 60);

    // Maailma piiride dekoratiivne äär
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, w - 60, h - 60);
  }

  drawScenery(ctx) {
    if (!this.activeWorld.scenery) return;

    for (const item of this.activeWorld.scenery) {
      ctx.save();
      if (item.type === 'oak') {
        // Suur tammepuu
        ctx.fillStyle = '#4a3728'; // Tüvi
        ctx.fillRect(item.x - 12, item.y, 24, 45);
        ctx.fillStyle = '#2d5a27'; // Võra
        ctx.beginPath();
        ctx.arc(item.x, item.y - 15, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a6e32';
        ctx.beginPath();
        ctx.arc(item.x - 10, item.y - 25, 25, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'tree') {
        // Tavaline okas-/lehtpuu
        ctx.fillStyle = '#3d2817';
        ctx.fillRect(item.x - 6, item.y, 12, 30);
        ctx.fillStyle = '#1e4d2b';
        ctx.beginPath();
        ctx.arc(item.x, item.y - 10, 26, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'bonfire') {
        // Lõke
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(item.x - 15, item.y + 5, 30, 6);
        // Leek
        const flicker = Math.sin(performance.now() * 0.015) * 4;
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(item.x, item.y + flicker, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(item.x, item.y - 4 + flicker, 9, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'chimney') {
        // Manchesteri telliskorsten
        ctx.fillStyle = '#6e2c24';
        ctx.fillRect(item.x - 18, item.y - 60, 36, 80);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(item.x - 22, item.y - 65, 44, 10);
      } else if (item.type === 'tent') {
        // Sõjaväetelk (Rootsi laager)
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - 35);
        ctx.lineTo(item.x - 30, item.y + 20);
        ctx.lineTo(item.x + 30, item.y + 20);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(item.x - 3, item.y - 35, 6, 55);
      } else if (item.type === 'portal_pillar') {
        // Ajarännukeskuse sammas
        ctx.fillStyle = '#1c2d42';
        ctx.fillRect(item.x - 12, item.y - 30, 24, 60);
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x - 12, item.y - 30, 24, 60);
      } else if (item.type === 'university_columns') {
        // Tartu Ülikooli kuus valget klassitsistlikku sammast
        ctx.fillStyle = '#ecf0f1';
        for (let i = -2.5; i <= 2.5; i += 1) {
          ctx.fillRect(item.x + i * 22 - 6, item.y - 40, 12, 60);
        }
        // Viil / katus
        ctx.fillStyle = '#bdc3c7';
        ctx.beginPath();
        ctx.moveTo(item.x - 70, item.y - 40);
        ctx.lineTo(item.x, item.y - 70);
        ctx.lineTo(item.x + 70, item.y - 40);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawEntities(ctx) {
    const time = performance.now();

    for (const ent of this.activeWorld.entities) {
      ctx.save();

      // Varikuju maapinnal
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(ent.x, ent.y + 14, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (ent.type === 'portal') {
        // Helendav portaalirõngas
        const pulse = Math.sin(time * 0.005) * 4;
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(ent.x, ent.y, 32 + pulse, 18 + pulse * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(52, 152, 219, 0.25)';
        ctx.beginPath();
        ctx.ellipse(ent.x, ent.y, 28 + pulse, 15 + pulse * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ikoon ja pealkiri
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ent.icon, ent.x, ent.y + 8);

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(ent.name, ent.x, ent.y - 28);
      } else {
        // NPC või reliikvia
        const isDiscovered = this.discoveries.includes(ent.id);

        // Helendus, kui avastamata
        if (!isDiscovered) {
          const glow = Math.sin(time * 0.006) * 5;
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ent.x, ent.y, 24 + glow, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Ikoon
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.icon, ent.x, ent.y);

        // Nimesilt
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(ent.name, ent.x, ent.y - 26);

        // Avastatud märge
        if (isDiscovered) {
          ctx.fillStyle = '#2ecc71';
          ctx.font = '10px sans-serif';
          ctx.fillText('✓ Avastatud', ent.x, ent.y - 12);
        }
      }

      ctx.restore();
    }

    // Kui mängija on objekti lähedal, joonistame interaktsiooni vihje
    if (this.activeInteractable) {
      const ent = this.activeInteractable;
      const bounce = Math.sin(time * 0.008) * 4;

      ctx.save();
      ctx.fillStyle = 'rgba(13, 19, 31, 0.9)';
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      const text = ent.type === 'portal' ? `[E] Astu portaali` : `[E] Uuri: ${ent.name}`;
      ctx.font = 'bold 13px sans-serif';
      const textWidth = ctx.measureText(text).width;

      const px = ent.x;
      const py = ent.y - 50 + bounce;

      ctx.beginPath();
      ctx.roundRect(px - textWidth / 2 - 12, py - 14, textWidth + 24, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f7d774';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, px, py);
      ctx.restore();
    }
  }

  // ==========================================
  // MÄNGIJA TEGELANE (KÄIVITUS JA ANIMATSIOON)
  // ==========================================
  drawPlayer(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    // 1. Varikuju jalge all
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const legSwing = Math.sin(p.walkCycle) * 7;
    const bodyBob = Math.abs(Math.sin(p.walkCycle)) * 2;

    // 2. Jalad ja saapad
    ctx.fillStyle = '#3e2723'; // Pruunid ränduri saapad
    if (p.facing === 'left' || p.facing === 'right') {
      ctx.fillRect(-6 + legSwing, 8, 5, 10);
      ctx.fillRect(1 - legSwing, 8, 5, 10);
    } else {
      ctx.fillRect(-8, 8 + legSwing, 6, 10);
      ctx.fillRect(2, 8 - legSwing, 6, 10);
    }

    // 3. Keha ja vest
    ctx.translate(0, -bodyBob);

    // Sinine rändurikuub
    ctx.fillStyle = '#1e3799';
    ctx.beginPath();
    ctx.roundRect(-10, -8, 20, 18, 4);
    ctx.fill();

    // Kuldne vöö ja pannal
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-10, 4, 20, 3);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-3, 3, 6, 5);

    // Seljakott (seljas)
    if (p.facing === 'up') {
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      ctx.roundRect(-8, -6, 16, 14, 3);
      ctx.fill();
    } else if (p.facing === 'left') {
      ctx.fillStyle = '#795548';
      ctx.fillRect(6, -6, 6, 12);
    } else if (p.facing === 'right') {
      ctx.fillStyle = '#795548';
      ctx.fillRect(-12, -6, 6, 12);
    }

    // 4. Pea ja nägu
    ctx.fillStyle = '#ffdbac'; // Nahavärv
    ctx.beginPath();
    ctx.arc(0, -14, 9, 0, Math.PI * 2);
    ctx.fill();

    // Silmad vastavalt suunale
    ctx.fillStyle = '#2c3e50';
    if (p.facing === 'down') {
      ctx.fillRect(-4, -15, 2, 3);
      ctx.fillRect(2, -15, 2, 3);
    } else if (p.facing === 'left') {
      ctx.fillRect(-7, -15, 2, 3);
    } else if (p.facing === 'right') {
      ctx.fillRect(5, -15, 2, 3);
    }

    // 5. Ränduri kaabu ja suled
    ctx.fillStyle = '#4a3319';
    // Äär
    ctx.beginPath();
    ctx.ellipse(0, -20, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Kaabu ülaosa
    ctx.fillRect(-7, -27, 14, 8);

    // Kuldne sulg kaabul
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(3, -25);
    ctx.lineTo(8, -33);
    ctx.lineTo(4, -28);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.type === 'snow') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'leaf') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.rot, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ripple') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'smoke') {
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  spawnAmbientParticles() {
    if (!this.activeWorld) return;

    if (this.activeWorld.theme === 'snow') {
      // Narva lumi
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          type: 'snow',
          x: this.camera.x + Math.random() * this.canvas.width,
          y: this.camera.y - 10,
          vy: Math.random() * 40 + 30,
          size: Math.random() * 2.5 + 1.5,
          alpha: 0.8
        });
      }
    } else if (this.activeWorld.theme === 'ancient') {
      // Püha hiie lehed
      if (Math.random() < 0.6) {
        this.particles.push({
          type: 'leaf',
          x: this.camera.x + Math.random() * this.canvas.width,
          y: this.camera.y - 10,
          vy: Math.random() * 30 + 20,
          rot: Math.random() * Math.PI,
          size: Math.random() * 4 + 2,
          color: Math.random() < 0.5 ? '#d35400' : '#27ae60',
          alpha: 0.85
        });
      }
    } else if (this.activeWorld.theme === 'factory') {
      // Korstnasuits
      this.particles.push({
        type: 'smoke',
        x: 450 + (Math.random() * 6 - 3),
        y: 85,
        vx: Math.random() * 15 - 5,
        vy: -Math.random() * 30 - 20,
        size: 8,
        alpha: 0.7
      });
      this.particles.push({
        type: 'smoke',
        x: 1050 + (Math.random() * 6 - 3),
        y: 85,
        vx: Math.random() * 15 - 5,
        vy: -Math.random() * 30 - 20,
        size: 8,
        alpha: 0.7
      });
    }
  }

  // ==========================================
  // HUD JA EKRAANIPEALSED NÄIDIKUD
  // ==========================================
  drawHUD(ctx) {
    // Siin joonistame minimaalse mini-kaardi paremasse ülanurka
    const mmSize = 120;
    const mmX = this.canvas.width - mmSize - 16;
    const mmY = 16;

    ctx.save();
    // Kaardi taust
    ctx.fillStyle = 'rgba(13, 19, 31, 0.8)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(mmX, mmY, mmSize, mmSize, 8);
    ctx.fill();
    ctx.stroke();

    // Kaardi pealkiri
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('MINI-KAART', mmX + 8, mmY + 12);

    // Objektide asukohad minikaardil
    const scaleX = mmSize / this.activeWorld.width;
    const scaleY = mmSize / this.activeWorld.height;

    for (const ent of this.activeWorld.entities) {
      const ex = mmX + ent.x * scaleX;
      const ey = mmY + ent.y * scaleY;
      ctx.fillStyle = ent.type === 'portal' ? '#3498db' : '#f1c40f';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mängija asukoht
    const mx = mmX + this.player.x * scaleX;
    const my = mmY + this.player.y * scaleY;
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  updateHUD() {
    const locTitle = document.getElementById('world-location-title');
    const locEra = document.getElementById('world-location-era');
    const expCounter = document.getElementById('world-exp-counter');
    const discCounter = document.getElementById('world-discoveries-counter');

    if (locTitle && this.activeWorld) locTitle.textContent = this.activeWorld.title;
    if (locEra && this.activeWorld) locEra.textContent = this.activeWorld.era;
    if (expCounter) expCounter.textContent = `${this.xp} XP`;

    // Loendame, mitu selle maailma objekti on avastatud
    if (discCounter && this.activeWorld) {
      const totalInWorld = this.activeWorld.entities.filter(e => e.type !== 'portal').length;
      const discoveredInWorld = this.activeWorld.entities.filter(e => e.type !== 'portal' && this.discoveries.includes(e.id)).length;
      discCounter.textContent = `${discoveredInWorld} / ${totalInWorld}`;
    }
  }

  // ==========================================
  // INTERAKTSIOON JA DIALOOGID
  // ==========================================
  handleInteract() {
    if (!this.activeInteractable) return;
    this.interactWithEntity(this.activeInteractable);
  }

  interactWithEntity(ent) {
    if (ent.type === 'portal') {
      // Portaali kaudu teise maailma reisimine
      if (ent.targetWorld) {
        this.loadWorld(ent.targetWorld);
      }
      return;
    }

    // Avame modal-dialoogi objekti või NPC kohta
    this.isModalOpen = true;

    // Registreerime avastuse
    const isNew = !this.discoveries.includes(ent.id);
    if (isNew) {
      this.discoveries.push(ent.id);
      this.xp += 25;
      localStorage.setItem('ar_discoveries', JSON.stringify(this.discoveries));
      localStorage.setItem('ar_xp', this.xp.toString());
      this.updateHUD();
      if (window.sound) window.sound.playCorrect();
    } else {
      if (window.sound) window.sound.playInteract();
    }

    // Täidame modali sisu
    const modal = document.getElementById('world-interact-modal');
    if (!modal) return;

    document.getElementById('modal-ent-icon').textContent = ent.icon;
    document.getElementById('modal-ent-name').textContent = ent.name;
    document.getElementById('modal-ent-role').textContent = ent.role || 'Ajalooline ese';
    document.getElementById('modal-ent-era').textContent = this.activeWorld.era;

    let bodyHtml = '';
    if (ent.type === 'npc') {
      bodyHtml += `<div class="npc-speech">`;
      for (const line of ent.dialogue) {
        bodyHtml += `<p class="speech-bubble">💬 "${line}"</p>`;
      }
      bodyHtml += `</div>`;
    } else {
      bodyHtml += `<div class="relic-description"><p>${ent.description}</p></div>`;
    }

    if (ent.fact) {
      bodyHtml += `
        <div class="educational-fact-box">
          <div class="fact-head">🎓 <strong>Ajalooline taust (8. klassi õppekava)</strong></div>
          <p>${ent.fact}</p>
        </div>
      `;
    }

    if (ent.examTip) {
      bodyHtml += `
        <div class="exam-tip-box">
          <div class="tip-head">💡 <strong>Mida tasub teada kontrolltöös ja eksamil?</strong></div>
          <p>${ent.examTip}</p>
        </div>
      `;
    }

    if (isNew) {
      bodyHtml += `
        <div class="xp-reward-badge">
          ⭐ <strong>Uus avastus lisatud päevikusse!</strong> Sa teenisid +25 XP!
        </div>
      `;
    }

    document.getElementById('modal-ent-content').innerHTML = bodyHtml;
    modal.classList.add('active');
  }

  closeModal() {
    this.isModalOpen = false;
    document.querySelectorAll('.world-modal-overlay').forEach(m => m.classList.remove('active'));
    if (window.sound) window.sound.playClick();
  }

  // ==========================================
  // KAART, PÄEVIK JA VIKTORIIN
  // ==========================================
  openWorldMap() {
    this.isModalOpen = true;
    const modal = document.getElementById('world-map-modal');
    if (!modal) return;

    const list = document.getElementById('world-map-list');
    list.innerHTML = '';

    for (const [key, w] of Object.entries(this.worlds)) {
      const card = document.createElement('div');
      card.className = `world-travel-card ${key === this.currentWorldId ? 'current' : ''}`;
      card.onclick = () => {
        this.closeModal();
        this.loadWorld(key);
      };

      const totalItems = w.entities.filter(e => e.type !== 'portal').length;
      const discoveredItems = w.entities.filter(e => e.type !== 'portal' && this.discoveries.includes(e.id)).length;

      card.innerHTML = `
        <div class="wt-header">
          <span class="wt-title">${w.title}</span>
          <span class="wt-era">${w.era}</span>
        </div>
        <p class="wt-desc">${w.description}</p>
        <div class="wt-footer">
          <span>🔍 Avastatud: ${discoveredItems} / ${totalItems}</span>
          <button class="btn-primary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">
            ${key === this.currentWorldId ? 'Oled siin' : 'Reisi siia 🚀'}
          </button>
        </div>
      `;
      list.appendChild(card);
    }

    modal.classList.add('active');
  }

  openJournal() {
    this.isModalOpen = true;
    const modal = document.getElementById('world-journal-modal');
    if (!modal) return;

    const container = document.getElementById('world-journal-content');
    let totalItems = 0;
    let totalDiscovered = 0;

    let html = `
      <div class="journal-stats-summary">
        <div class="stat-box">⭐ <strong>Kokku XP:</strong> ${this.xp}</div>
        <div class="stat-box">📜 <strong>Avastatud kokku:</strong> ${this.discoveries.length} eset ja isikut</div>
      </div>
      <div class="journal-worlds-accordion">
    `;

    for (const [key, w] of Object.entries(this.worlds)) {
      if (key === 'hub') continue;
      const wItems = w.entities.filter(e => e.type !== 'portal');
      const wDisc = wItems.filter(e => this.discoveries.includes(e.id));
      totalItems += wItems.length;
      totalDiscovered += wDisc.length;

      html += `
        <div class="journal-era-card">
          <div class="era-header">
            <h4>${w.title} (${w.era})</h4>
            <span class="era-badge">${wDisc.length} / ${wItems.length}</span>
          </div>
          <div class="era-items-grid">
      `;

      for (const item of wItems) {
        const isFound = this.discoveries.includes(item.id);
        html += `
          <div class="j-item ${isFound ? 'found' : 'missing'}">
            <span class="j-icon">${item.icon}</span>
            <div class="j-info">
              <strong>${isFound ? item.name : '??? Salapärane ese'}</strong>
              <small>${isFound ? (item.role || 'Avastatud') : 'Uuri maailmas ringi jalutades'}</small>
            </div>
          </div>
        `;
      }

      html += `</div></div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
    modal.classList.add('active');
  }

  openMiniQuiz() {
    this.isModalOpen = true;
    const modal = document.getElementById('world-quiz-modal');
    if (!modal) return;

    const quizData = this.getEraQuizQuestions(this.currentWorldId);
    let qHtml = `
      <div class="mini-quiz-wrapper">
        <h3 style="color: var(--gold); margin-bottom: 0.5rem;">🎯 Kiirtest: ${this.activeWorld.title}</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Testi oma teadmisi selle ajastu kohta (8. klassi ajalugu):</p>
    `;

    quizData.forEach((q, qIndex) => {
      qHtml += `
        <div class="quiz-q-block" id="quiz-block-${qIndex}" style="background: rgba(0,0,0,0.25); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
          <p style="font-weight: 600; margin-bottom: 0.8rem;">${qIndex + 1}. ${q.question}</p>
          <div class="quiz-options-col" style="display: flex; flex-direction: column; gap: 0.5rem;">
      `;
      q.options.forEach((opt, oIndex) => {
        qHtml += `
          <button class="quiz-choice-btn" onclick="worldGame.checkMiniQuizAnswer(${qIndex}, ${oIndex}, ${q.correct}, this)" style="text-align: left; padding: 0.6rem 1rem; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); color: #fff; border-radius: 6px; cursor: pointer;">
            ${opt}
          </button>
        `;
      });
      qHtml += `
          </div>
          <div class="quiz-feedback" id="quiz-fb-${qIndex}" style="display: none; margin-top: 0.6rem; font-size: 0.9rem;"></div>
        </div>
      `;
    });

    qHtml += `
        <div style="text-align: center; margin-top: 1.5rem;">
          <button class="btn-primary" onclick="worldGame.closeModal()">Lõpeta test ja naase seiklusse ➡️</button>
        </div>
      </div>
    `;

    document.getElementById('world-quiz-content').innerHTML = qHtml;
    modal.classList.add('active');
  }

  checkMiniQuizAnswer(qIndex, choiceIndex, correctIndex, btn) {
    const parent = btn.parentElement;
    const buttons = parent.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);

    const fb = document.getElementById(`quiz-fb-${qIndex}`);
    fb.style.display = 'block';

    if (choiceIndex === correctIndex) {
      btn.style.background = '#27ae60';
      btn.style.borderColor = '#2ecc71';
      fb.innerHTML = `<span style="color: #2ecc71;">✓ Õige vastus! (+15 XP)</span>`;
      this.xp += 15;
      localStorage.setItem('ar_xp', this.xp.toString());
      this.updateHUD();
      if (window.sound) window.sound.playCorrect();
    } else {
      btn.style.background = '#c0392b';
      buttons[correctIndex].style.background = '#27ae60';
      fb.innerHTML = `<span style="color: #e74c3c;">✗ Vale vastus. Õige oli rohelisega märgitud variant.</span>`;
      if (window.sound) window.sound.playWrong();
    }
  }

  getEraQuizQuestions(worldId) {
    const questions = {
      ancient: [
        {
          question: 'Kuidas oli jaotatud Eesti ala muinasajal enne 13. sajandi ristisõdasid?',
          options: ['Eesti oli ühtne kuningriik Lembitu valitsemisel', 'Eesti jagunes umbes 8 suuremaks maakonnaks ja kihelkondadeks', 'Eesti kuulus Rootsi kuninga alla', 'Eestit valitses Vene vürst'],
          correct: 1
        },
        {
          question: 'Mis oli muinaseestlaste tähtsaim pühapaik?',
          options: ['Kivikirik', 'Püha hiis ja ohvrikivi', 'Mõisapark', 'Kindluse kabel'],
          correct: 1
        }
      ],
      narva: [
        {
          question: 'Millist loodusnähtust kasutas Karl XII ära Narva lahingus 1700. aastal?',
          options: ['Tugevat maavärinat', 'Tihedat lumetormi, mis puhus vastastele näkku', 'Kevadist jõe üleujutust', 'Päikesevarjutust'],
          correct: 1
        },
        {
          question: 'Mis oli "Balti erikord", mis kehtestati pärast Eesti alistumist Vene tsaaririigile 1710?',
          options: ['Eesti talupojad said kohe vabaks', 'Aadel kaotas kõik oma mõisad', 'Säilis saksa asjaajamiskeel, luteri usk ja rüütelkondade omavalitsus', 'Eestisse toodi vene õigeusk ja vene keel'],
          correct: 2
        }
      ],
      versailles: [
        {
          question: 'Milline kuulus lause iseloomustab Päikesekuningas Louis XIV absolutistlikku valitsemist?',
          options: ['"Vabadus, võrdsus, vendlus!"', '"Riik – see olen mina!" (L\'État, c\'est moi!)', '"Mõtlen, järelikult olen."', '"Kõikide sõda kõikide vastu."'],
          correct: 1
        },
        {
          question: 'Mis oli Colbert\'i merkantilismi peamine põhimõte?',
          options: ['Osta võimalikult palju kaupu välismaalt sisse', 'Riik ei tohi majandusse üldse sekkuda', 'Eksport peab ületama importi, et kuld koguneks riigikassasse', 'Kogu maa tuleb jagada talupoegade vahel'],
          correct: 2
        }
      ],
      enlightenment: [
        {
          question: 'Kes sõnastas võimude lahususe põhimõtte (seadusandlik, täidesaatev, kohtuvõim)?',
          options: ['Charles de Montesquieu', 'Louis XIV', 'Robespierre', 'Jean-Baptiste Colbert'],
          correct: 0
        },
        {
          question: 'Millise monumentaalse teose koostas Denis Diderot valgustusideede levitamiseks?',
          options: ['"Riik"', '"Entsüklopeedia"', '"Piibel"', '"Versailles\' kroonika"'],
          correct: 1
        }
      ],
      revolution: [
        {
          question: 'Millist sündmust 14. juulil 1789 loetakse Prantsuse revolutsiooni alguseks?',
          options: ['Kuninga kroonimist', 'Bastille\' kindluse vallutamist Pariisi rahva poolt', 'Waterloo lahingut', 'Tartu Ülikooli asutamist'],
          correct: 1
        },
        {
          question: 'Milline kuulus dokument võeti vastu Prantsuse revolutsiooni alguses 1789. aastal?',
          options: ['Inimese ja kodaniku õiguste deklaratsioon', 'Harku kapitulatsiooniakt', 'Nantes\'i edikt', 'Augsburgi usurahu'],
          correct: 0
        }
      ],
      industry: [
        {
          question: 'Kelle täiustatud universaalne aurumasin käivitas tööstusrevolutsiooni?',
          options: ['Thomas Edison', 'James Watt', 'Ned Ludd', 'Karl XII'],
          correct: 1
        },
        {
          question: 'Keda nimetati "ludiitideks"?',
          options: ['Tööstureid ja vabrikute omanikke', 'Töölisi ja käsitöölisi, kes purustasid protestiks masinaid', 'Auruveduri juhte', 'Kivisöekaevanduste järelevaatajaid'],
          correct: 1
        }
      ],
      estonia: [
        {
          question: 'Mida tähendas 1816. ja 1819. a talurahvaseadustega kehtestatud "linnupriius"?',
          options: ['Talupojad said isikliku vabaduse, kuid maa jäi mõisnikule ja säilis teoorjus', 'Talupoeg sai mõisa ja maa tasuta endale', 'Talupoegadel keelati külast lahkuda', 'Eesti kuulutati iseseisvaks riigiks'],
          correct: 0
        },
        {
          question: 'Kes oli see noor eesti luuletaja, kes kõndis jalgsi Riiast Tartusse ja ülistas eesti keelt?',
          options: ['Lydia Koidula', 'Kristjan Jaak Peterson', 'Friedrich Robert Faehlmann', 'Johann Voldemar Jannsen'],
          correct: 1
        }
      ],
      hub: [
        {
          question: 'Mille poolest erineb Uusaeg Keskajast?',
          options: ['Uusajal hakkasid arenema teadus, valgustusideed, maadeavastused ja tööstus', 'Uusajal loobuti täielikult usust ja kirikust', 'Uusajal polnud enam ühtegi sõda', 'Uusaeg algas kiviajaga'],
          correct: 0
        }
      ]
    };

    return questions[worldId] || questions.ancient;
  }
}

// Globaalne eksemplar
window.worldGame = new WorldGame();
