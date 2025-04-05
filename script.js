document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const startScreen = document.getElementById('start-screen');
    const testScreen = document.getElementById('test-screen');
    const endScreen = document.getElementById('end-screen');
    const groupControls = document.getElementById('group-controls');
    const toggleAllBtn = document.getElementById('toggle-all-btn');
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    const questionText = document.getElementById('question-text');
    const answersDiv = document.getElementById('answers');
    const questionCounter = document.getElementById('question-counter');
    const scoreDisplay = document.getElementById('score');
    const resultDiv = document.getElementById('result');

    // Test configuration
    const TOTAL_GROUPS = 28;
    const QUESTIONS_PER_TEST = 100;
    let selectedGroups = [];
    let testQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    // Initialize the app
    function init() {
        createGroupControls();
        setupEventListeners();
    }

    // Create group selection controls
    function createGroupControls() {
        for (let i = 1; i <= TOTAL_GROUPS; i++) {
            const groupItem = document.createElement('div');
            groupItem.className = 'group-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `group-${i}`;
            checkbox.value = i;
            
            const label = document.createElement('label');
            label.htmlFor = `group-${i}`;
            label.textContent = `Group ${i} (${i === TOTAL_GROUPS ? 44 : 100} questions)`;
            
            groupItem.appendChild(checkbox);
            groupItem.appendChild(label);
            groupControls.appendChild(groupItem);
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        toggleAllBtn.addEventListener('click', toggleAllGroups);
        startBtn.addEventListener('click', startTest);
        nextBtn.addEventListener('click', nextQuestion);
        restartBtn.addEventListener('click', restartTest);
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

    // Start the test
    async function startTest() {
        selectedGroups = Array.from(document.querySelectorAll('.group-item input:checked'))
                            .map(checkbox => checkbox.value);
        
        if (selectedGroups.length === 0) {
            alert('Please select at least one question group!');
            return;
        }
        
        startBtn.disabled = true;
        startBtn.textContent = 'Loading...';
        
        try {
            testQuestions = await loadQuestions(selectedGroups);
            startScreen.style.display = 'none';
            testScreen.style.display = 'block';
            currentQuestionIndex = 0;
            score = 0;
            scoreDisplay.textContent = '0';
            showQuestion(testQuestions[currentQuestionIndex]);
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
        
        for (const group of groups) {
            try {
                const response = await fetch(`questions/group${group}.json`);
                const questions = await response.json();
                allQuestions = allQuestions.concat(questions);
            } catch (error) {
                console.error(`Error loading group ${group}:`, error);
                throw error;
            }
        }
        
        // Shuffle and select questions
        return shuffleArray(allQuestions).slice(0, QUESTIONS_PER_TEST);
    }

    // Show a question
    function showQuestion(question) {
        questionText.textContent = question.question;
        answersDiv.innerHTML = '';
        questionCounter.textContent = `Question: ${currentQuestionIndex + 1}/${Math.min(testQuestions.length, QUESTIONS_PER_TEST)}`;
        
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
            score++;
            scoreDisplay.textContent = score;
        } else {
            button.classList.add('incorrect');
        }
        
        nextBtn.disabled = false;
    }

    // Show next question
    function nextQuestion() {
        currentQuestionIndex++;
        
        if (currentQuestionIndex < Math.min(testQuestions.length, QUESTIONS_PER_TEST)) {
            showQuestion(testQuestions[currentQuestionIndex]);
        } else {
            testScreen.style.display = 'none';
            endScreen.style.display = 'block';
            resultDiv.textContent = `Your Score: ${score}/${Math.min(testQuestions.length, QUESTIONS_PER_TEST)}`;
        }
    }

    // Restart the test
    function restartTest() {
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