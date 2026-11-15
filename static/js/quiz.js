/**
 * AJASTUTE VALITSEJA: 8. klassi Ajaloo Viktoriini ja Eksamimootor
 */

class HistoryQuiz {
  constructor() {
    this.allQuestions = [];
    this.activeQuestions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.isAnswered = false;
  }

  async init() {
    try {
      const response = await fetch('/data/quiz.json');
      this.allQuestions = await response.json();
    } catch (e) {
      console.error("Viga viktoriini küsimuste laadimisel:", e);
    }
  }

  startQuiz(count = 10) {
    window.sound.playClick();
    if (!this.allQuestions.length) return;

    // Segame küsimused ja võtame soovitud arvu
    const shuffled = [...this.allQuestions].sort(() => 0.5 - Math.random());
    this.activeQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
    this.currentIndex = 0;
    this.score = 0;
    this.isAnswered = false;

    // Peidame tulemuse ja näitame küsimuste kasti
    document.getElementById('quiz-result-view').style.display = 'none';
    document.getElementById('quiz-active-view').style.display = 'block';

    switchView('quiz');
    this.renderQuestion();
  }

  renderQuestion() {
    this.isAnswered = false;
    const q = this.activeQuestions[this.currentIndex];
    if (!q) {
      this.finishQuiz();
      return;
    }

    document.getElementById('quiz-progress').textContent = `Küsimus ${this.currentIndex + 1} / ${this.activeQuestions.length}`;
    document.getElementById('quiz-score').textContent = `Tulemus: ${this.score} punkti`;
    document.getElementById('quiz-topic').textContent = q.topic || 'Uusaeg';
    document.getElementById('quiz-title').textContent = q.question;

    const optionsBox = document.getElementById('quiz-options');
    optionsBox.innerHTML = '';

    q.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.textContent = optText;
      btn.onclick = () => this.handleAnswer(idx, btn);
      optionsBox.appendChild(btn);
    });

    const expBox = document.getElementById('quiz-explanation');
    expBox.classList.remove('active');
    expBox.textContent = '';

    const nextBox = document.getElementById('quiz-next-box');
    nextBox.classList.remove('active');
  }

  handleAnswer(selectedIndex, clickedBtn) {
    if (this.isAnswered) return;
    this.isAnswered = true;

    const q = this.activeQuestions[this.currentIndex];
    const optionButtons = document.querySelectorAll('.quiz-option-btn');
    optionButtons.forEach(btn => btn.disabled = true);

    const isCorrect = selectedIndex === q.correct;
    if (isCorrect) {
      this.score++;
      clickedBtn.classList.add('correct');
      window.sound.playCorrect();
    } else {
      clickedBtn.classList.add('incorrect');
      if (optionButtons[q.correct]) {
        optionButtons[q.correct].classList.add('correct');
      }
      window.sound.playWrong();
    }

    document.getElementById('quiz-score').textContent = `Tulemus: ${this.score} punkti`;

    const expBox = document.getElementById('quiz-explanation');
    expBox.innerHTML = `<strong>${isCorrect ? 'Õige vastus!' : 'Õige lahendus:'}</strong> ${q.explanation}`;
    expBox.classList.add('active');

    const nextBox = document.getElementById('quiz-next-box');
    nextBox.classList.add('active');
  }

  nextQuestion() {
    window.sound.playClick();
    this.currentIndex++;
    if (this.currentIndex >= this.activeQuestions.length) {
      this.finishQuiz();
    } else {
      this.renderQuestion();
    }
  }

  finishQuiz() {
    window.sound.playFanfare();
    document.getElementById('quiz-active-view').style.display = 'none';
    const resultView = document.getElementById('quiz-result-view');
    resultView.style.display = 'block';

    const total = this.activeQuestions.length;
    const percent = Math.round((this.score / total) * 100);

    let grade = 2;
    let comment = "Ajaloo teemasid tasub veel korrata! Vaata kindlasti ajatelge ja sõnastikku.";
    if (percent >= 90) {
      grade = 5;
      comment = "Suurepärane! Oled tõeline 8. klassi ajaloo ekspert ja tunned uusaega peensusteni!";
      unlockAchievement('ach_quiz_master');
    } else if (percent >= 75) {
      grade = 4;
      comment = "Väga tubli tulemus! Sul on tugevad teadmised uusaja murrangutest.";
      unlockAchievement('ach_quiz_passed');
    } else if (percent >= 50) {
      grade = 3;
      comment = "Rahuldav! Põhitõed on selged, kuid kordamine teeb meistriks.";
      unlockAchievement('ach_quiz_passed');
    }

    document.getElementById('report-grade').textContent = grade;
    document.getElementById('report-score-text').textContent = `Vastasid õigesti ${this.score} küsimusele ${total}-st (${percent}%).`;
    document.getElementById('report-comment').textContent = comment;
  }
}

window.quiz = new HistoryQuiz();
