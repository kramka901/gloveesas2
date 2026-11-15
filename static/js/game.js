/**
 * AJASTUTE VALITSEJA: Simulaatori tuummängu mootor
 */

class HistorySimulator {
  constructor() {
    this.episodes = [];
    this.currentEpisode = null;
    this.currentEventIndex = 0;

    // Riiklikud ressursid (0 - 100%)
    this.stats = {
      gold: 50,
      army: 50,
      people: 50,
      culture: 50
    };

    this.completedEpisodes = JSON.parse(localStorage.getItem('hist_completed') || '[]');
    this.unlockedAchievements = JSON.parse(localStorage.getItem('hist_achievements') || '[]');
  }

  async init() {
    try {
      const response = await fetch('/data/episodes.json');
      this.episodes = await response.json();
      this.renderEpisodesList();
      this.updateStatusBars();
    } catch (err) {
      console.error("Viga peatükkide laadimisel:", err);
    }
  }

  updateStatusBars() {
    ['gold', 'army', 'people', 'culture'].forEach(stat => {
      const val = Math.max(0, Math.min(100, this.stats[stat]));
      const meter = document.getElementById(`meter-${stat}`);
      const text = document.getElementById(`val-${stat}`);
      if (meter) meter.style.width = `${val}%`;
      if (text) text.textContent = `${val}%`;
    });
  }

  renderEpisodesList() {
    const container = document.getElementById('episodes-container');
    if (!container) return;

    container.innerHTML = '';
    this.episodes.forEach(ep => {
      const isCompleted = this.completedEpisodes.includes(ep.id);
      const card = document.createElement('div');
      card.className = `chapter-card ${isCompleted ? 'completed' : ''}`;
      card.onclick = () => this.startEpisode(ep.id);

      card.innerHTML = `
        <div>
          <div class="card-top">
            <span class="card-num">Peatükk ${ep.id}</span>
            <span class="card-period">${ep.period}</span>
          </div>
          <h3 class="card-title">${ep.title}</h3>
          <div class="card-role">👑 Roll: ${ep.role}</div>
          <p class="card-desc">${ep.description}</p>
        </div>
        <div class="card-footer">
          <span class="card-events-count">📜 ${ep.events.length} otsust</span>
          <button class="btn-card-start">${isCompleted ? 'Mängi uuesti' : 'Alusta teekonda'}</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  startEpisode(episodeId) {
    window.sound.playClick();
    this.currentEpisode = this.episodes.find(e => e.id === episodeId);
    if (!this.currentEpisode) return;

    this.currentEventIndex = 0;
    // Lähtestame ressursid stabiilsesse keskmisse seisu
    this.stats = { gold: 50, army: 50, people: 50, culture: 50 };
    this.updateStatusBars();

    switchView('simulator-game');
    this.renderCurrentEvent();
  }

  renderCurrentEvent() {
    if (!this.currentEpisode) return;
    const event = this.currentEpisode.events[this.currentEventIndex];
    if (!event) {
      this.finishEpisode();
      return;
    }

    const counter = document.getElementById('sim-event-counter');
    if (counter) {
      counter.textContent = `Otsus ${this.currentEventIndex + 1} / ${this.currentEpisode.events.length}`;
    }

    const badge = document.getElementById('sim-scenario-badge');
    if (badge) badge.textContent = `${this.currentEpisode.period} • ${this.currentEpisode.role}`;

    const title = document.getElementById('sim-scenario-title');
    if (title) title.textContent = event.title;

    const text = document.getElementById('sim-scenario-text');
    if (text) text.textContent = event.situation;

    const choicesContainer = document.getElementById('sim-choices-container');
    if (choicesContainer) {
      choicesContainer.innerHTML = '';
      const letters = ['A', 'B', 'C'];
      event.choices.forEach((c, idx) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.onclick = () => this.makeChoice(idx);
        btn.innerHTML = `
          <div class="choice-letter">${letters[idx]}</div>
          <div class="choice-text">${c.text}</div>
        `;
        choicesContainer.appendChild(btn);
      });
    }
  }

  makeChoice(choiceIndex) {
    const event = this.currentEpisode.events[this.currentEventIndex];
    const choice = event.choices[choiceIndex];

    // Heli vastavalt otsusele
    if (choice.gold > 0) window.sound.playCoin();
    else if (choice.army > 20) window.sound.playDrum();
    else window.sound.playClick();

    // Ressursside uuendamine
    this.stats.gold += choice.gold || 0;
    this.stats.army += choice.army || 0;
    this.stats.people += choice.people || 0;
    this.stats.culture += choice.culture || 0;

    // Piiramine 0 - 100
    this.updateStatusBars();

    // Kuva ajaloolise fakti ja tagajärje modaalaken
    this.showConsequenceModal(choice);
  }

  showConsequenceModal(choice) {
    const modal = document.getElementById('consequence-modal');
    if (!modal) return;

    document.getElementById('modal-consequence-text').textContent = choice.consequence;
    document.getElementById('modal-fact-text').textContent = choice.historical_fact;

    const impactsContainer = document.getElementById('modal-impacts');
    impactsContainer.innerHTML = '';

    const labels = {
      gold: '💰 Riigikassa',
      army: '🛡️ Sõjavägi',
      people: '🌾 Rahva heaolu',
      culture: '💡 Valgustatus'
    };

    ['gold', 'army', 'people', 'culture'].forEach(stat => {
      const delta = choice[stat];
      if (delta && delta !== 0) {
        const pill = document.createElement('span');
        pill.className = `impact-pill ${delta > 0 ? 'impact-pos' : 'impact-neg'}`;
        pill.textContent = `${labels[stat]} ${delta > 0 ? '+' : ''}${delta}`;
        impactsContainer.appendChild(pill);
      }
    });

    modal.classList.add('active');
  }

  nextEvent() {
    window.sound.playClick();
    const modal = document.getElementById('consequence-modal');
    if (modal) modal.classList.remove('active');

    // Kontrolli kriisi
    if (this.checkCrisis()) return;

    this.currentEventIndex++;
    if (this.currentEventIndex >= this.currentEpisode.events.length) {
      this.finishEpisode();
    } else {
      this.renderCurrentEvent();
    }
  }

  checkCrisis() {
    let crisisMsg = null;
    if (this.stats.gold <= 0) {
      crisisMsg = "Riigikassa on tühi! Sõdurid keelduvad võitlemast ja riik kuulutab välja pankroti.";
    } else if (this.stats.people <= 0) {
      crisisMsg = "Rahva kannatus katkes! Puhkeb halastamatu mäss ja paleed rüüstatakse vihase rahvamassi poolt.";
    } else if (this.stats.army <= 0) {
      crisisMsg = "Armee on hävitatud! Naaberriikide väed tungivad vastupanuta sisse ja jagavad maa omavahel.";
    }

    if (crisisMsg) {
      window.sound.playWrong();
      alert(`⚠️ AJALOOLINE KRIIS!\n\n${crisisMsg}\n\nSinu valitsusaeg sai enneaegse lõpu. Proovi uuesti teha tasakaalukamaid otsuseid!`);
      switchView('episodes');
      return true;
    }
    return false;
  }

  finishEpisode() {
    window.sound.playFanfare();
    if (!this.completedEpisodes.includes(this.currentEpisode.id)) {
      this.completedEpisodes.push(this.currentEpisode.id);
      localStorage.setItem('hist_completed', JSON.stringify(this.completedEpisodes));
    }

    // Saavutuste kontroll
    if (this.currentEpisode.id === 1) unlockAchievement('ach_sun_king');
    if (this.currentEpisode.id === 2) unlockAchievement('ach_great_northern');
    if (this.currentEpisode.id === 3) unlockAchievement('ach_enlightenment');
    if (this.currentEpisode.id === 5) unlockAchievement('ach_bastille');
    if (this.currentEpisode.id === 6) unlockAchievement('ach_napoleon');
    if (this.currentEpisode.id === 7) unlockAchievement('ach_freedom');

    if (this.completedEpisodes.length === this.episodes.length) {
      unlockAchievement('ach_all_chapters');
    }

    const averageScore = Math.round((this.stats.gold + this.stats.army + this.stats.people + this.stats.culture) / 4);
    let grade = 5;
    if (averageScore < 40) grade = 3;
    else if (averageScore < 60) grade = 4;

    const reportCard = `
      🎖️ PEATÜKK ON EDUKALT LÄBITUD!
      ------------------------------------------
      Peatükk: ${this.currentEpisode.title}
      Lõplikud riiklikud näitajad:
      💰 Riigikassa: ${this.stats.gold}%
      🛡️ Sõjaline võim: ${this.stats.army}%
      🌾 Rahva heaolu: ${this.stats.people}%
      💡 Valgustatus & Haridus: ${this.stats.culture}%

      Sinu valitsemishinne: ${grade} (${grade === 5 ? 'Eeskujulik riigijuht' : grade === 4 ? 'Hea valitseja' : 'Rahuldav kompromiss'})
    `;

    setTimeout(() => {
      alert(reportCard);
      this.renderEpisodesList();
      switchView('episodes');
    }, 400);
  }
}

window.sim = new HistorySimulator();
