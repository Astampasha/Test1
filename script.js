'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const QUESTION_GROUPS = [
        { name: "კარდიოლოგია", file: "group1.json" },
        { name: "პულმონოლოგია", file: "group4.json" },
        { name: "გასტროენტოლოგია", file: "group5.json" },
        { name: "ნეფროლოგია", file: "group7.json" },
        { name: "ჰემატოლოგია", file: "group8.json" },
        { name: "ენდოკრინოლოგია", file: "group10.json" },
        { name: "რევმატოლოგია", file: "group11.json" },
        { name: "იმუნოლოგია - ალეგოლორგია", file: "group12.json" },
        { name: "პედიატრია", file: "group14.json" },
        { name: "ქირურგია", file: "group18.json" },
        { name: "გინეკოლოგია", file: "group21.json" },
    ];

    // --- State ---
    const state = {
        selectedGroups: [],
        questions: [],
        currentQuestionIndex: 0,
        score: 0,
        questionLimit: 0,
        isDarkMode: localStorage.getItem('isDarkMode') === 'true'
    };

    // --- DOM Elements ---
    const els = {
        themeBtn: document.getElementById('theme-toggle'),
        startScreen: document.getElementById('start-screen'),
        testScreen: document.getElementById('test-screen'),
        endScreen: document.getElementById('end-screen'),
        groupControls: document.getElementById('group-controls'),
        toggleAllBtn: document.getElementById('toggle-all-btn'),
        limitToggles: document.querySelectorAll('.limit-toggle'),
        decreaseLimitBtn: document.getElementById('decrease-limit-btn'),
        increaseLimitBtn: document.getElementById('increase-limit-btn'),
        currentLimitDisplay: document.getElementById('current-limit-display'),
        startBtn: document.getElementById('start-btn'),
        nextBtn: document.getElementById('next-btn'),
        restartBtn: document.getElementById('restart-btn'),
        questionText: document.getElementById('question-text'),
        answersContainer: document.getElementById('answers-container'),
        currentQuestionNum: document.getElementById('current-question-num'),
        totalQuestionsNum: document.getElementById('total-questions-num'),
        scoreVal: document.getElementById('score-val'),
        finalResult: document.getElementById('final-result')
    };

    // --- Initialization ---
    function init() {
        applyTheme();
        renderGroupList();
        setupEventListeners();
        updateLimitDisplay(); // Initial display state
    }

    // --- Rendering ---
    function renderGroupList() {
        els.groupControls.innerHTML = '';

        QUESTION_GROUPS.forEach((group, index) => {
            const item = document.createElement('div');
            item.className = 'group-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `group-${index}`;
            checkbox.value = group.file;
            checkbox.dataset.name = group.name; // Keep name for reference if needed

            const label = document.createElement('label');
            label.htmlFor = `group-${index}`;
            label.textContent = group.name;

            item.appendChild(checkbox);
            item.appendChild(label);
            els.groupControls.appendChild(item);

            // Row click handler (Event Delegation is tricky with checkboxes, direct is safer for small lists)
            item.addEventListener('click', (e) => {
                if (e.target !== checkbox && e.target !== label) {
                    checkbox.checked = !checkbox.checked;
                }
            });
        });
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        els.themeBtn.addEventListener('click', toggleTheme);
        els.toggleAllBtn.addEventListener('click', toggleAllGroups);

        // Limit Toggles
        els.limitToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    setLimit(parseInt(e.target.dataset.limit));
                    // Uncheck others
                    els.limitToggles.forEach(t => {
                        if (t !== e.target) t.checked = false;
                    });
                } else {
                    setLimit(0);
                }
            });
        });

        // Limit Adjusters
        els.decreaseLimitBtn.addEventListener('click', () => adjustLimit(-50));
        els.increaseLimitBtn.addEventListener('click', () => adjustLimit(50));

        // Navigation
        els.startBtn.addEventListener('click', startTest);
        els.nextBtn.addEventListener('click', nextQuestion);
        els.restartBtn.addEventListener('click', resetApp);
    }

    // --- Logic: Theme ---
    function toggleTheme() {
        state.isDarkMode = !state.isDarkMode;
        localStorage.setItem('isDarkMode', state.isDarkMode);
        applyTheme();
    }

    function applyTheme() {
        if (state.isDarkMode) {
            document.body.classList.add('dark-mode');
            els.themeBtn.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            els.themeBtn.textContent = '🌙';
        }
    }

    // --- Logic: Groups & Limits ---
    function toggleAllGroups() {
        const checkboxes = els.groupControls.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        checkboxes.forEach(cb => cb.checked = !allChecked);
        els.toggleAllBtn.textContent = allChecked ? "Select All" : "Deselect All";
    }

    function setLimit(limit) {
        state.questionLimit = limit;
        updateLimitDisplay();
        updateLimitTogglesUI();
    }

    function adjustLimit(amount) {
        let newLimit = state.questionLimit + amount;
        if (newLimit < 0) newLimit = 0;
        setLimit(newLimit);
    }

    function updateLimitDisplay() {
        els.currentLimitDisplay.textContent = state.questionLimit === 0 ? "No Limit" : `${state.questionLimit} Questions`;
    }

    function updateLimitTogglesUI() {
        els.limitToggles.forEach(t => {
            t.checked = parseInt(t.dataset.limit) === state.questionLimit;
        });
    }

    // --- Logic: Test Flow ---
    async function startTest() {
        // Collect selected files
        const selectedCheckboxes = els.groupControls.querySelectorAll('input[type="checkbox"]:checked');
        state.selectedGroups = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (state.selectedGroups.length === 0) {
            alert("Please select at least one category!");
            return;
        }

        // Loading state
        els.startBtn.disabled = true;
        els.startBtn.textContent = "Loading...";

        try {
            const allQuestions = await loadAllQuestions(state.selectedGroups);

            if (allQuestions.length === 0) {
                alert("No questions found in selected categories.");
                resetUI();
                return;
            }

            // Shuffle and Limit
            shuffleArray(allQuestions);

            if (state.questionLimit > 0) {
                state.questions = allQuestions.slice(0, state.questionLimit);
            } else {
                state.questions = allQuestions;
            }

            // Reset scores
            state.score = 0;
            state.currentQuestionIndex = 0;

            // Update UI
            els.totalQuestionsNum.textContent = state.questions.length;
            els.scoreVal.textContent = "0";

            // Switch Screen
            els.startScreen.classList.add('hidden');
            els.testScreen.classList.remove('hidden');

            renderQuestion();

        } catch (error) {
            console.error(error);
            alert("Error loading questions:\n" + error.message);
            resetUI();
        }
    }

    async function loadAllQuestions(files) {
        let questions = [];
        for (const file of files) {
            try {
                const response = await fetch(file);
                if (!response.ok) throw new Error(`HTTP Error ${response.status} loading ${file}`);
                const data = await response.json();
                if (Array.isArray(data)) {
                    questions = questions.concat(data);
                } else {
                    console.warn(`File ${file} did not contain an array.`);
                }
            } catch (err) {
                throw new Error(`Failed to load file: ${file}\n${err.message}`);
            }
        }
        return questions;
    }

    function renderQuestion() {
        const q = state.questions[state.currentQuestionIndex];

        els.currentQuestionNum.textContent = state.currentQuestionIndex + 1;
        els.questionText.textContent = q.question;
        els.answersContainer.innerHTML = '';
        els.nextBtn.disabled = true;

        // Shuffle answers? Assuming we keep original order or shuffle if desired.
        // Let's keep original order as per previous behavior/request usually.
        // Copy answers to avoid mutating original if needed, but strings are primitive.

        q.answers.forEach(answerText => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = answerText;
            btn.addEventListener('click', () => handleAnswer(btn, answerText, q.correctAnswer));
            els.answersContainer.appendChild(btn);
        });
    }

    function handleAnswer(selectedBtn, selectedText, correctText) {
        // Disable all buttons
        const allBtns = els.answersContainer.querySelectorAll('.answer-btn');
        allBtns.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctText) {
                btn.classList.add('correct');
            }
        });

        if (selectedText === correctText) {
            state.score++;
            els.scoreVal.textContent = state.score;
            selectedBtn.classList.add('correct'); // Already added above, but ensures visual feedback
        } else {
            selectedBtn.classList.add('incorrect');
        }

        els.nextBtn.disabled = false;
    }

    function nextQuestion() {
        state.currentQuestionIndex++;
        if (state.currentQuestionIndex < state.questions.length) {
            renderQuestion();
        } else {
            endTest();
        }
    }

    function endTest() {
        els.testScreen.classList.add('hidden');
        els.endScreen.classList.remove('hidden');
        els.finalResult.textContent = `Your Score: ${state.score} / ${state.questions.length}`;
    }

    function resetApp() {
        state.selectedGroups = [];
        state.questions = [];
        state.score = 0;
        state.currentQuestionIndex = 0;

        // Don't reset limit or theme, keep user preference
        resetUI();
    }

    function resetUI() {
        els.startBtn.disabled = false;
        els.startBtn.textContent = "Start Test";
        els.startScreen.classList.remove('hidden');
        els.testScreen.classList.add('hidden');
        els.endScreen.classList.add('hidden');

        // Reset checkboxes? Maybe keep them selected for convenience.
        // If we want to clear them:
        // els.groupControls.querySelectorAll('input').forEach(cb => cb.checked = false);
    }

    // --- Helpers ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Run
    init();
});
