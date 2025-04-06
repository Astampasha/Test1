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
    const QUESTIONS_PER_TEST = 100;

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

    let selectedGroups = [];
    let testQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    function init() {
        createGroupControls();
        setupEventListeners();
    }

    function createGroupControls() {
        groupControls.innerHTML = '';
        
        QUESTION_GROUPS.forEach((group, index) => {
            const groupItem = document.createElement('div');
            groupItem.className = 'group-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `group-${index}`;
            checkbox.value = group.file;
            
            const label = document.createElement('label');
            label.htmlFor = `group-${index}`;
            label.textContent = group.name;
            
            groupItem.appendChild(checkbox);
            groupItem.appendChild(label);
            groupControls.appendChild(groupItem);
        });
    }

    function setupEventListeners() {
        toggleAllBtn.addEventListener('click', toggleAllGroups);
        startBtn.addEventListener('click', startTest);
        nextBtn.addEventListener('click', nextQuestion);
        restartBtn.addEventListener('click', restartTest);
    }

    function toggleAllGroups() {
        const checkboxes = document.querySelectorAll('.group-item input');
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allChecked;
        });
        
        toggleAllBtn.textContent = allChecked ? 'Select All Groups' : 'Deselect All Groups';
    }

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
        
        if (allQuestions.length === 0) {
            throw new Error('No questions were loaded from selected groups');
        }
        
        return shuffleArray(allQuestions).slice(0, QUESTIONS_PER_TEST);
    }

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

    function restartTest() {
        endScreen.style.display = 'none';
        startScreen.style.display = 'block';
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    init();
});
