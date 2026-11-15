/**
 * AJASTUTE VALITSEJA: Teatmeteoste, ajatelje ja saavutuste moodul
 */

const ACHIEVEMENTS_DEF = [
  { id: 'ach_sun_king', title: 'Päikesekuninga mantlipärija', desc: 'Lõpeta 1. peatükk: Louis XIV absolutism', icon: '👑' },
  { id: 'ach_great_northern', title: 'Põhjasõja strateeg', desc: 'Lõpeta 2. peatükk: Põhjasõda ja Balti erikord', icon: '⚔️' },
  { id: 'ach_enlightenment', title: 'Valgustusfilosoof', desc: 'Lõpeta 3. peatükk: Valgustusajastu mõtlejad', icon: '💡' },
  { id: 'ach_bastille', title: 'Bastille vallutaja', desc: 'Lõpeta 5. peatükk: Prantsuse revolutsioon', icon: '🚩' },
  { id: 'ach_napoleon', title: 'Keiserlik marssal', desc: 'Lõpeta 6. peatükk: Napoleoni ajastu', icon: '🦅' },
  { id: 'ach_freedom', title: 'Eesti talurahva vabastaja', desc: 'Lõpeta 7. peatükk: Pärisorjuse kaotamine', icon: '🌾' },
  { id: 'ach_all_chapters', title: 'Uusaja Suur Valitseja', desc: 'Lõpeta edukalt kõik 7 ajaloopeatükki', icon: '🏆' },
  { id: 'ach_quiz_passed', title: 'Ajalootunni tubli', desc: 'Soorita ajaloo viktoriin positiivsele hindele (vähemalt 3)', icon: '📜' },
  { id: 'ach_quiz_master', title: 'Ajaloo Kuldmedal (Hinne 5)', desc: 'Soorita viktoriin vähemalt 90% õigete vastustega', icon: '⭐' }
];

function unlockAchievement(achId) {
  let list = JSON.parse(localStorage.getItem('hist_achievements') || '[]');
  if (!list.includes(achId)) {
    list.push(achId);
    localStorage.setItem('hist_achievements', JSON.stringify(list));
    const ach = ACHIEVEMENTS_DEF.find(a => a.id === achId);
    if (ach) {
      window.sound.playFanfare();
      showToast(`🏆 UUS SAAVUTUS: ${ach.title}!`, ach.desc);
    }
  }
}

function showToast(title, desc) {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.background = 'linear-gradient(135deg, #162238, #0d131f)';
  toast.style.border = '2px solid #d4af37';
  toast.style.borderRadius = '12px';
  toast.style.padding = '1rem 1.4rem';
  toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.8)';
  toast.style.zIndex = '9999';
  toast.style.color = '#fff';
  toast.style.animation = 'fadeIn 0.3s ease';
  toast.innerHTML = `
    <div style="font-weight: 700; color: #f7d774; margin-bottom: 0.3rem;">${title}</div>
    <div style="font-size: 0.85rem; color: #94a3b8;">${desc}</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

class EncyclopediaManager {
  constructor() {
    this.timelineData = [];
    this.glossaryData = [];
    this.figuresData = [];
    this.currentGlossaryFilter = 'Kõik';
  }

  async init() {
    try {
      const [tRes, gRes, fRes] = await Promise.all([
        fetch('/data/timeline.json'),
        fetch('/data/glossary.json'),
        fetch('/data/figures.json')
      ]);
      this.timelineData = await tRes.json();
      this.glossaryData = await gRes.json();
      this.figuresData = await fRes.json();

      this.renderTimeline();
      this.renderGlossary();
      this.renderFigures();
      this.renderAchievements();
    } catch (e) {
      console.error("Viga teatmematerjalide laadimisel:", e);
    }
  }

  renderTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    container.innerHTML = '';

    this.timelineData.forEach(item => {
      const div = document.createElement('div');
      div.className = 'timeline-item';
      div.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-meta">
            <span class="timeline-year">${item.year}</span>
            <span class="timeline-tag">${item.category} • ${item.region}</span>
          </div>
          <h3 class="timeline-title">${item.title}</h3>
          <p class="timeline-desc">${item.description}</p>
        </div>
      `;
      container.appendChild(div);
    });
  }

  renderGlossary(query = '', category = 'Kõik') {
    const container = document.getElementById('glossary-container');
    if (!container) return;
    container.innerHTML = '';

    const q = query.toLowerCase().trim();
    const filtered = this.glossaryData.filter(item => {
      const matchQuery = item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q);
      const matchCat = category === 'Kõik' || item.category === category;
      return matchQuery && matchCat;
    });

    if (filtered.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 2rem;">Ühtegi mõistet ei leitud.</p>';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'glossary-card';
      card.innerHTML = `
        <h4 class="glossary-term">${item.term}</h4>
        <span class="glossary-category">${item.category}</span>
        <p class="glossary-def">${item.definition}</p>
      `;
      container.appendChild(card);
    });
  }

  renderFigures() {
    const container = document.getElementById('figures-container');
    if (!container) return;
    container.innerHTML = '';

    this.figuresData.forEach(fig => {
      const card = document.createElement('div');
      card.className = 'figure-card';
      card.innerHTML = `
        <div class="figure-header">
          <h3 class="figure-name">${fig.name}</h3>
          <span class="figure-years">${fig.years}</span>
        </div>
        <div class="figure-role">${fig.role}</div>
        <p class="figure-desc">${fig.description}</p>
        <div class="figure-quote">"${fig.quote}"</div>
      `;
      container.appendChild(card);
    });
  }

  renderAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;
    container.innerHTML = '';

    const unlocked = JSON.parse(localStorage.getItem('hist_achievements') || '[]');

    ACHIEVEMENTS_DEF.forEach(ach => {
      const isUnlocked = unlocked.includes(ach.id);
      const card = document.createElement('div');
      card.className = `achieve-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="achieve-icon">${ach.icon}</div>
        <div class="achieve-info">
          <h4>${ach.title} ${isUnlocked ? '✓' : '🔒'}</h4>
          <p>${ach.desc}</p>
        </div>
      `;
      container.appendChild(card);
    });
  }
}

window.encyclopedia = new EncyclopediaManager();
