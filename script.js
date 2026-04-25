const fallbackPapers = {
  "2025": {
    title: "Andhra Pradesh EAMCET 2025",
    questions: []
  }
};

const questionPapers = window.CRAKMAX_PAPERS || fallbackPapers;

const selectionView = document.getElementById("selection-view");
const examView = document.getElementById("exam-view");
const resultView = document.getElementById("result-view");
const yearSelect = document.getElementById("year-select");
const subjectSelect = document.getElementById("subject-select");
const startBtn = document.getElementById("start-btn");
const examTitle = document.getElementById("exam-title");
const progressChip = document.getElementById("progress-chip");
const subjectTabs = document.getElementById("subject-tabs");
const questionNav = document.getElementById("question-nav");
const examForm = document.getElementById("exam-form");
const submitExamBtn = document.getElementById("submit-exam-btn");
const pendingChip = document.getElementById("pending-chip");
const backBtn = document.getElementById("back-btn");
const scoreText = document.getElementById("score-text");
const toggleDetailsBtn = document.getElementById("toggle-details-btn");
const detailsPanel = document.getElementById("details-panel");
const restartBtn = document.getElementById("restart-btn");

let currentYear = "";
let currentPaper = null;
let latestReport = [];
let activeSubject = "";
let selectedPracticeSubject = "All Subjects";

function normalizeOption(option, index) {
  if (typeof option === "string") {
    return { text: option, image: "", label: String.fromCharCode(65 + index) };
  }

  const text = option && typeof option.text === "string" ? option.text : "";
  const image = option && typeof option.image === "string" ? option.image : "";
  return { text, image, label: String.fromCharCode(65 + index) };
}

function normalizeQuestion(question) {
  const options = Array.isArray(question.options)
    ? question.options.map((opt, idx) => normalizeOption(opt, idx))
    : [];

  const uniqueQuestionImages = [];
  const seen = new Set();
  const rawImages = Array.isArray(question.questionImages) ? question.questionImages : [];
  rawImages.forEach((imgPath) => {
    if (imgPath && !seen.has(imgPath)) {
      uniqueQuestionImages.push(imgPath);
      seen.add(imgPath);
    }
  });

  // Keep only the primary stem image to avoid repeated/fragmented render of the same first question.
  const limitedQuestionImages = uniqueQuestionImages.slice(0, 1);

  return {
    ...question,
    subject: question.subject || "Mathematics",
    question: question.question || `Question ${question.id}`,
    questionImages: limitedQuestionImages,
    options
  };
}

function getPreparedQuestions(paper, subject) {
  const normalized = (paper.questions || []).map(normalizeQuestion);

  const byId = new Map();
  normalized.forEach((q) => {
    if (!byId.has(q.id)) {
      byId.set(q.id, q);
    }
  });

  const unique = Array.from(byId.values()).sort((a, b) => Number(a.id) - Number(b.id));
  if (subject === "All Subjects") {
    return unique;
  }
  return unique.filter((q) => q.subject === subject);
}

function getOptionDisplay(option, index) {
  const label = String.fromCharCode(65 + index);
  if (option.text) {
    return `${label}. ${option.text}`;
  }
  if (option.image) {
    return `${label}. Image Option`;
  }
  return `${label}. Option`;
}
function getOptionPayload(option, index) {
  const label = String.fromCharCode(65 + index);
  return {
    label,
    text: option && option.text ? option.text : "",
    image: option && option.image ? option.image : "",
    display: getOptionDisplay(option || {}, index)
  };
}
function populateYears() {
  const years = Object.keys(questionPapers).sort((a, b) => Number(b) - Number(a));
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });
}

function switchView(view) {
  selectionView.classList.add("hidden");
  examView.classList.add("hidden");
  resultView.classList.add("hidden");
  view.classList.remove("hidden");
}

function renderQuestions(paper) {
  examForm.innerHTML = "";
  subjectTabs.innerHTML = "";
  questionNav.innerHTML = "";
  const normalizedQuestions = paper.questions.map(normalizeQuestion);
  let lastSubject = "";
  const subjects = [];

  normalizedQuestions.forEach((q, questionIndex) => {
    if (!subjects.includes(q.subject)) {
      subjects.push(q.subject);
    }

    if (q.subject !== lastSubject) {
      const subjectBlock = document.createElement("section");
      subjectBlock.className = "subject-divider";
      subjectBlock.dataset.subject = q.subject;
      subjectBlock.innerHTML = `
        <h3>${q.subject}</h3>
        <p>${q.subject === "Mathematics" ? "Questions 1-80" : q.subject === "Physics" ? "Questions 81-120" : "Questions 121-160"}</p>
      `;
      examForm.appendChild(subjectBlock);
      lastSubject = q.subject;
    }
    const questionCard = document.createElement("article");
    questionCard.className = "question-card";
    questionCard.id = `q-card-${q.id}`;
    questionCard.dataset.subject = q.subject;
    questionCard.dataset.questionId = String(q.id);

    const title = document.createElement("h3");
    title.className = "question-title";
    title.textContent = `Q${questionIndex + 1}. ${q.question}`;
    questionCard.appendChild(title);

    if (q.questionImages.length) {
      const mediaWrap = document.createElement("div");
      mediaWrap.className = "question-media";

      q.questionImages.forEach((imgPath, imgIndex) => {
        const image = document.createElement("img");
        image.className = "question-image";
        image.src = imgPath;
        image.alt = `Question ${q.id} image ${imgIndex + 1}`;
        image.loading = "lazy";
        mediaWrap.appendChild(image);
      });

      questionCard.appendChild(mediaWrap);
    }

    q.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "option-row";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question-${q.id}`;
      input.value = String(optionIndex);

      const optionWrap = document.createElement("div");
      optionWrap.className = "option-content";

      const optionText = document.createElement("span");
      optionText.className = "option-text";
      optionText.textContent = getOptionDisplay(option, optionIndex);
      optionWrap.appendChild(optionText);

      if (option.image) {
        const optionImage = document.createElement("img");
        optionImage.className = "option-image";
        optionImage.src = option.image;
        optionImage.alt = `Question ${q.id} option ${String.fromCharCode(65 + optionIndex)}`;
        optionImage.loading = "lazy";
        optionWrap.appendChild(optionImage);
      }

      label.appendChild(input);
      label.appendChild(optionWrap);
      questionCard.appendChild(label);
    });

    examForm.appendChild(questionCard);

    const navButton = document.createElement("button");
    navButton.type = "button";
    navButton.className = "q-nav-box pending";
    navButton.dataset.questionId = String(q.id);
    navButton.dataset.subject = q.subject;
    navButton.textContent = String(q.id);
    navButton.addEventListener("click", () => {
      filterBySubject(q.subject);
      const target = document.getElementById(`q-card-${q.id}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      highlightNavBox(q.id);
    });
    questionNav.appendChild(navButton);
  });

  subjects.forEach((subject, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = `subject-tab ${index === 0 ? "active" : ""}`;
    tab.dataset.subject = subject;
    tab.textContent = subject === "Mathematics" ? "Maths" : subject;
    tab.addEventListener("click", () => filterBySubject(subject));
    subjectTabs.appendChild(tab);
  });

  activeSubject = subjects[0] || "";
  filterBySubject(activeSubject);

  updateProgress();
}

function highlightNavBox(questionId) {
  const boxes = questionNav.querySelectorAll(".q-nav-box");
  boxes.forEach((box) => {
    box.classList.toggle("active", Number(box.dataset.questionId) === Number(questionId));
  });
}

function filterBySubject(subject) {
  if (!subject) {
    return;
  }

  activeSubject = subject;

  const cards = examForm.querySelectorAll(".question-card, .subject-divider");
  cards.forEach((node) => {
    const same = node.dataset.subject === subject;
    node.classList.toggle("subject-hidden", !same);
  });

  const tabs = subjectTabs.querySelectorAll(".subject-tab");
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.subject === subject);
  });

  const boxes = questionNav.querySelectorAll(".q-nav-box");
  boxes.forEach((box) => {
    box.classList.toggle("subject-hidden", box.dataset.subject !== subject);
  });
}

function updateProgress() {
  if (!currentPaper) {
    progressChip.textContent = "0 / 0 Answered";
    pendingChip.textContent = "Pending: 0";
    return;
  }

  const normalizedQuestions = currentPaper.questions.map(normalizeQuestion);
  const answeredCount = normalizedQuestions.filter((q) => {
    return examForm.querySelector(`input[name='question-${q.id}']:checked`);
  }).length;

  const pending = normalizedQuestions.length - answeredCount;

  progressChip.textContent = `${answeredCount} / ${normalizedQuestions.length} Answered`;
  pendingChip.textContent = `Pending: ${pending}`;

  const navBoxes = questionNav.querySelectorAll(".q-nav-box");
  navBoxes.forEach((box) => {
    const qid = Number(box.dataset.questionId);
    const answered = !!examForm.querySelector(`input[name='question-${qid}']:checked`);
    box.classList.toggle("answered", answered);
    box.classList.toggle("pending", !answered);
  });
}

function getAttemptedOption(questionId) {
  const checked = examForm.querySelector(`input[name='question-${questionId}']:checked`);
  return checked ? Number(checked.value) : null;
}

function buildReport() {
  let score = 0;
  const normalizedQuestions = currentPaper.questions.map(normalizeQuestion);
  const report = normalizedQuestions.map((q, index) => {
    const selectedOptionIndex = getAttemptedOption(q.id);
    const isCorrect = selectedOptionIndex === q.correctOptionIndex;

    if (isCorrect) {
      score += 1;
    }

    return {
      serial: index + 1,
      subject: q.subject,
      question: q.question,
      selectedOptionIndex,
      selectedOption: selectedOptionIndex === null
        ? null
        : getOptionPayload(q.options[selectedOptionIndex], selectedOptionIndex),
      correctOption: getOptionPayload(q.options[q.correctOptionIndex], q.correctOptionIndex),
      selectedOptionText: selectedOptionIndex === null
        ? "Not Answered"
        : getOptionDisplay(q.options[selectedOptionIndex], selectedOptionIndex),
      correctOptionText: getOptionDisplay(q.options[q.correctOptionIndex], q.correctOptionIndex),
      isCorrect
    };
  });

  return { score, total: currentPaper.questions.length, report };
}

function renderDetailedReport(reportRows) {
  detailsPanel.innerHTML = "";

  const buildOptionPreview = (title, optionData, fallbackText) => {
    const container = document.createElement("div");
    container.className = "report-answer-block";

    const heading = document.createElement("p");
    heading.className = "report-answer-title";
    heading.textContent = title;
    container.appendChild(heading);

    if (!optionData) {
      const fallback = document.createElement("p");
      fallback.className = "report-answer-text";
      fallback.textContent = fallbackText;
      container.appendChild(fallback);
      return container;
    }

    const answerText = document.createElement("p");
    answerText.className = "report-answer-text";
    answerText.textContent = `${optionData.label}. ${optionData.text || (optionData.image ? "Image Option" : "Choice")}`;
    container.appendChild(answerText);

    if (optionData.image) {
      const answerImage = document.createElement("img");
      answerImage.className = "report-answer-image";
      answerImage.src = optionData.image;
      answerImage.alt = `${title} ${optionData.label}`;
      answerImage.loading = "lazy";
      container.appendChild(answerImage);
    }

    return container;
  };

  reportRows.forEach((row) => {
    const wrapper = document.createElement("article");
    wrapper.className = `report-item ${row.isCorrect ? "good" : "bad"}`;

    const status = document.createElement("p");
    status.className = "report-status";
    status.innerHTML = row.isCorrect
      ? `<span class='good-mark'>✓ Correct</span>`
      : `<span class='bad-mark'>✗ Wrong</span>`;

    const qLine = document.createElement("p");
    qLine.textContent = `Q${row.serial} (${row.subject}). ${row.question}`;

    const chosen = buildOptionPreview("Your Answer", row.selectedOption, row.selectedOptionText);
    const actual = buildOptionPreview("Correct Answer", row.correctOption, row.correctOptionText);

    wrapper.appendChild(status);
    wrapper.appendChild(qLine);
    wrapper.appendChild(chosen);
    wrapper.appendChild(actual);

    detailsPanel.appendChild(wrapper);
  });
}

yearSelect.addEventListener("change", () => {
  currentYear = yearSelect.value;
  startBtn.disabled = !currentYear;
});

subjectSelect.addEventListener("change", () => {
  selectedPracticeSubject = subjectSelect.value;
});

startBtn.addEventListener("click", () => {
  if (!currentYear) {
    return;
  }

  const selectedPaper = questionPapers[currentYear];
  if (!selectedPaper || !Array.isArray(selectedPaper.questions) || !selectedPaper.questions.length) {
    alert("Question paper data is not available yet for this year.");
    return;
  }

  const filteredQuestions = getPreparedQuestions(selectedPaper, selectedPracticeSubject);
  if (!filteredQuestions.length) {
    alert("No questions available for selected subject.");
    return;
  }

  currentPaper = {
    title: `${selectedPaper.title} - ${selectedPracticeSubject}`,
    questions: filteredQuestions
  };

  examTitle.textContent = currentPaper.title;
  renderQuestions(currentPaper);
  switchView(examView);
});

examForm.addEventListener("change", updateProgress);

submitExamBtn.addEventListener("click", () => {
  if (!currentPaper) {
    return;
  }

  const normalizedQuestions = currentPaper.questions.map(normalizeQuestion);
  const unanswered = normalizedQuestions.filter((q) => getAttemptedOption(q.id) === null);
  if (unanswered.length) {
    alert(`Please answer all questions before submitting. Pending questions: ${unanswered.length}`);

    const firstPending = unanswered[0];
    if (firstPending) {
      filterBySubject(firstPending.subject || "Mathematics");
      const target = document.getElementById(`q-card-${firstPending.id}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      highlightNavBox(firstPending.id);
    }
    return;
  }

  const { score, total, report } = buildReport();
  latestReport = report;
  scoreText.textContent = `${score} / ${total}`;
  detailsPanel.classList.add("hidden");
  toggleDetailsBtn.textContent = "Show Attempt Details";
  switchView(resultView);
});

backBtn.addEventListener("click", () => {
  switchView(selectionView);
});

toggleDetailsBtn.addEventListener("click", () => {
  if (!latestReport.length) {
    return;
  }

  const isHidden = detailsPanel.classList.contains("hidden");
  if (isHidden) {
    renderDetailedReport(latestReport);
    detailsPanel.classList.remove("hidden");
    toggleDetailsBtn.textContent = "Hide Attempt Details";
  } else {
    detailsPanel.classList.add("hidden");
    toggleDetailsBtn.textContent = "Show Attempt Details";
  }
});

restartBtn.addEventListener("click", () => {
  examForm.reset();
  currentYear = "";
  currentPaper = null;
  latestReport = [];
  activeSubject = "";
  selectedPracticeSubject = "All Subjects";
  yearSelect.value = "";
  subjectSelect.value = "All Subjects";
  startBtn.disabled = true;
  switchView(selectionView);
});

populateYears();
