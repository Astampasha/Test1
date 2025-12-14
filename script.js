document.addEventListener('DOMContentLoaded', function () {
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

    // DOM elements
    const startScreen = document.getElementById('start-screen');
    const testScreen = document.getElementById('test-screen');
    const endScreen = document.getElementById('end-screen');
    const groupControls = document.getElementById('group-controls');
    const toggleAllBtn = document.getElementById('toggle-all-btn');
    const limitToggles = document.querySelectorAll('.limit-toggle');
    const decreaseLimitBtn = document.getElementById('decrease-limit-btn');
    const increaseLimitBtn = document.getElementById('increase-limit-btn');
    const currentLimitDisplay = document.getElementById('current-limit-display');
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    const questionText = document.getElementById('question-text');
    const answersDiv = document.getElementById('answers');
    const currentQuestionSpan = document.getElementById('current-question');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const scoreSpan = document.querySelector('#score span');
    const resultDiv = document.getElementById('result');

    // Test state (try to load from sessionStorage)
    let state = JSON.parse(sessionStorage.getItem('testAppState')) || {
        selectedGroups: [],
        testQuestions: [],
        currentQuestionIndex: 0,
        score: 0,
        questionLimit: 0,
        testInProgress: false,
        darkMode: localStorage.getItem('darkMode') === 'true'
    };

    // Initialize the app
    function init() {
        createGroupControls();
        setupEventListeners();
        restoreState();

        // precise restoration of theme
        if (state.darkMode) {
            document.body.classList.add('dark-mode');
            const themeBtn = document.getElementById('theme-toggle');
            if (themeBtn) themeBtn.textContent = '☀️';
        }
    }

    // Save state to sessionStorage
    function saveState() {
        sessionStorage.setItem('testAppState', JSON.stringify({
            selectedGroups: state.selectedGroups,
            testQuestions: state.testQuestions,
            currentQuestionIndex: state.currentQuestionIndex,
            score: state.score,
            questionLimit: state.questionLimit,
            testInProgress: state.testInProgress
        }));
    }

    // Restore state from sessionStorage
    function restoreState() {
        // Update limit display and toggles based on saved state
        updateLimitDisplay();
        updateLimitToggles();

        if (state.testInProgress) {
            startTestFromSavedState();
        }
    }

    // Create group selection controls
    function createGroupControls() {
        groupControls.innerHTML = '';

        QUESTION_GROUPS.forEach((group, index) => {
            const groupItem = document.createElement('div');
            groupItem.className = 'group-item';

            // Add click listener to the entire row
            groupItem.addEventListener('click', (e) => {
                // Return if the clicked element is the checkbox or label (let them handle it)
                if (e.target === checkbox || e.target === label) return;

                // Toggle the checkbox for clicks elsewhere in the row
                checkbox.checked = !checkbox.checked;
            });

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `group-${index}`;
            checkbox.value = group.file;
            if (state.selectedGroups.includes(group.file)) {
                checkbox.checked = true;
            }

            const label = document.createElement('label');
            label.htmlFor = `group-${index}`;
            label.textContent = group.name;
            // Remove the preventDefault on label so it works natively or let the row handler handle it?
            // If we exclude label from row handler (above), we don't need to prevent default on label.
            // But if we click label, it toggles checkbox natively.
            // So we just remove the preventDefault listener from label.

            groupItem.appendChild(checkbox);
            groupItem.appendChild(label);
            groupControls.appendChild(groupItem);
        });
    }

    // Set up event listeners
    function setupEventListeners() {
        toggleAllBtn.addEventListener('click', toggleAllGroups);

        // Limit toggle listeners
        limitToggles.forEach(toggle => {
            toggle.addEventListener('change', handleLimitToggle);
        });

        // Limit adjuster buttons
        decreaseLimitBtn.addEventListener('click', () => adjustLimit(-50));
        increaseLimitBtn.addEventListener('click', () => adjustLimit(50));

        // Theme toggle
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', toggleTheme);
        }

        startBtn.addEventListener('click', startTest);
        nextBtn.addEventListener('click', nextQuestion);
        restartBtn.addEventListener('click', restartTest);

        // Handle page refresh
        window.addEventListener('beforeunload', saveState);
    }

    // Toggle theme
    function toggleTheme() {
        state.darkMode = !state.darkMode;
        document.body.classList.toggle('dark-mode');

        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.textContent = state.darkMode ? '☀️' : '🌙';
        }

        localStorage.setItem('darkMode', state.darkMode);
    }

    // Toggle all groups
    function toggleAllGroups() {
        const checkboxes = document.querySelectorAll('.group-item input');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);

        checkboxes.forEach(checkbox => {
            checkbox.checked = !allChecked;
        });

        toggleAllBtn.textContent = allChecked ? 'Select All Groups' : 'Deselect All Groups';
    }

    // Handle limit toggle change
    function handleLimitToggle(e) {
        const limit = parseInt(e.target.dataset.limit);

        if (e.target.checked) {
            // Set this limit and uncheck others
            state.questionLimit = limit;
            limitToggles.forEach(toggle => {
                if (toggle !== e.target) {
                    toggle.checked = false;
                }
            });
        } else {
            // If unchecking, remove limit
            state.questionLimit = 0;
        }

        updateLimitDisplay();
        saveState();
    }

    // Adjust limit by amount (+/- 50)
    function adjustLimit(amount) {
        const newLimit = state.questionLimit + amount;

        // Minimum 50 questions if adjusting up from 0, otherwise minimum 0
        if (newLimit <= 0) {
            state.questionLimit = amount > 0 ? 50 : 0;
        } else {
            state.questionLimit = newLimit;
        }

        updateLimitToggles();
        updateLimitDisplay();
        saveState();
    }

    // Update limit display
    function updateLimitDisplay() {
        if (state.questionLimit === 0) {
            currentLimitDisplay.textContent = 'No Limit';
        } else {
            currentLimitDisplay.textContent = `${state.questionLimit} Questions`;
        }
    }

    // Update limit toggles based on current limit
    function updateLimitToggles() {
        limitToggles.forEach(toggle => {
            const toggleLimit = parseInt(toggle.dataset.limit);
            toggle.checked = (state.questionLimit === toggleLimit);
        });
    }

    // Start the test from saved state
    async function startTestFromSavedState() {
        startScreen.style.display = 'none';
        testScreen.style.display = 'block';

        totalQuestionsSpan.textContent = state.testQuestions.length;
        currentQuestionSpan.textContent = state.currentQuestionIndex + 1;
        scoreSpan.textContent = state.score;

        showQuestion(state.testQuestions[state.currentQuestionIndex]);
    }

    // Start the test
    async function startTest() {
        state.selectedGroups = Array.from(document.querySelectorAll('.group-item input:checked'))
            .map(checkbox => checkbox.value);

        if (state.selectedGroups.length === 0) {
            alert('Please select at least one question group!');
            return;
        }

        startBtn.disabled = true;
        startBtn.textContent = 'Loading...';

        try {
            state.testQuestions = await loadQuestions(state.selectedGroups);

            if (state.testQuestions.length === 0) {
                alert('No questions found in selected groups!');
                return;
            }

            state.currentQuestionIndex = 0;
            state.score = 0;
            state.testInProgress = true;

            totalQuestionsSpan.textContent = state.testQuestions.length;
            currentQuestionSpan.textContent = 1;
            scoreSpan.textContent = '0';

            startScreen.style.display = 'none';
            testScreen.style.display = 'block';

            showQuestion(state.testQuestions[state.currentQuestionIndex]);
            saveState();
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Error loading questions. Please try again.');
        } finally {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Test';
        }
    }

    // Load questions from JSON files
    async function loadQuestions(groups) {
        let allQuestions = [];

        for (const groupFile of groups) {
            try {
                const response = await fetch(`${groupFile}`);
                if (!response.ok) throw new Error(`Failed to load ${groupFile}`);
                const questions = await response.json();

                if (!Array.isArray(questions)) {
                    throw new Error(`Invalid format in ${groupFile}. Expected array of questions.`);
                }

                questions.forEach(q => {
                    if (!q.question || !q.answers || !q.correctAnswer) {
                        throw new Error(`Invalid question format in ${groupFile}`);
                    }
                });

                allQuestions = allQuestions.concat(questions);
            } catch (error) {
                console.error(`Error loading ${groupFile}:`, error);
                alert(`Error loading ${groupFile}. Make sure the file exists and is uploaded to GitHub. Details: ${error.message}`);
                throw error;
            }
        }

        // Shuffle all questions
        const shuffled = shuffleArray(allQuestions);

        // Apply question limit if set
        return state.questionLimit > 0 ? shuffled.slice(0, state.questionLimit) : shuffled;
    }

    // Show a question
    function showQuestion(question) {
        questionText.textContent = question.question;
        answersDiv.innerHTML = '';

        question.answers.forEach(answer => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = answer;
            button.addEventListener('click', () => checkAnswer(button, answer, question.correctAnswer));
            answersDiv.appendChild(button);
        });

        nextBtn.disabled = true;
    }

    // Check the answer
    function checkAnswer(button, selectedAnswer, correctAnswer) {
        const buttons = document.querySelectorAll('.answer-btn');

        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            }
        });

        if (selectedAnswer === correctAnswer) {
            button.classList.add('correct');
            state.score++;
            scoreSpan.textContent = state.score;
        } else {
            button.classList.add('incorrect');
        }

        nextBtn.disabled = false;
        saveState();
    }

    // Show next question
    function nextQuestion() {
        state.currentQuestionIndex++;

        if (state.currentQuestionIndex < state.testQuestions.length) {
            currentQuestionSpan.textContent = state.currentQuestionIndex + 1;
            showQuestion(state.testQuestions[state.currentQuestionIndex]);
            saveState();
        } else {
            state.testInProgress = false;
            testScreen.style.display = 'none';
            endScreen.style.display = 'block';
            resultDiv.textContent = `Your Score: ${state.score}/${state.testQuestions.length}`;
            saveState();
        }
    }

    // Restart the test
    function restartTest() {
        state.testInProgress = false;
        sessionStorage.removeItem('testAppState');
        endScreen.style.display = 'none';
        startScreen.style.display = 'block';
    }

    // Shuffle array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Initialize the app
    init();
});
