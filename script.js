document.addEventListener('DOMContentLoaded', function() {
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
    const toggle100Btn = document.getElementById('toggle-100-btn');
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
        show100Questions: false,
        testInProgress: false
    };

    // Initialize the app
    function init() {
        createGroupControls();
        setupEventListeners();
        restoreState();
    }

    // Save state to sessionStorage
    function saveState() {
        sessionStorage.setItem('testAppState', JSON.stringify({
            selectedGroups: state.selectedGroups,
            testQuestions: state.testQuestions,
            currentQuestionIndex: state.currentQuestionIndex,
            score: state.score,
            show100Questions: state.show100Questions,
            testInProgress: state.testInProgress
        }));
    }

    // Restore state from sessionStorage
    function restoreState() {
        if (state.testInProgress) {
            toggle100Btn.checked = state.show100Questions;
            if (state.show100Questions) {
                document.querySelector('.slider').classList.add('checked');
            }
            startTestFromSavedState();
        }
    }

    // Create group selection controls
    function createGroupControls() {
        groupControls.innerHTML = '';
        
        QUESTION_GROUPS.forEach((group, index) => {
            const groupItem = document.createElement('div');
            groupItem.className = 'group-item';
            
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
            
            groupItem.appendChild(checkbox);
            groupItem.appendChild(label);
            groupControls.appendChild(groupItem);
        });
    }

    // Set up event listeners
    function setupEventListeners() {
        toggleAllBtn.addEventListener('click', toggleAllGroups);
        toggle100Btn.addEventListener('change', toggle100Questions);
        startBtn.addEventListener('click', startTest);
        nextBtn.addEventListener('click', nextQuestion);
        restartBtn.addEventListener('click', restartTest);
        
        // Handle page refresh
        window.addEventListener('beforeunload', saveState);
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

    // Toggle 100 questions mode
    function toggle100Questions() {
        state.show100Questions = toggle100Btn.checked;
        saveState();
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
                const response = await fetch(`questions/${groupFile}`);
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
                throw error;
            }
        }
        
        // Shuffle all questions
        const shuffled = shuffleArray(allQuestions);
        
        // Apply 100 question limit if toggle is active
        return state.show100Questions ? shuffled.slice(0, 100) : shuffled;
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
