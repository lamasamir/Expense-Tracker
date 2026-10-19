(function() {
      // ============================================================
      // STORAGE KEYS
      // ============================================================
      const USERS_KEY = 'bluepink_users_v3';       // { username: { password, profile, transactions } }
      const SESSION_KEY = 'bluepink_session_v3';   // currently logged-in username

      // ============================================================
      // STATE
      // ============================================================
      let users = {};           // all users
      let currentUser = null;   // currently logged-in username (string)
      let currentMonth = '';    // YYYY-MM
      let activeTab = 'expense';

      // ============================================================
      // DOM – AUTH
      // ============================================================
      const loginScreen = document.getElementById('loginScreen');
      const signupScreen = document.getElementById('signupScreen');
      const appScreen = document.getElementById('appScreen');

      const loginUsername = document.getElementById('loginUsername');
      const loginPassword = document.getElementById('loginPassword');
      const loginBtn = document.getElementById('loginBtn');
      const loginError = document.getElementById('loginError');
      const goToSignup = document.getElementById('goToSignup');

      const signupUsername = document.getElementById('signupUsername');
      const signupPassword = document.getElementById('signupPassword');
      const signupPassword2 = document.getElementById('signupPassword2');
      const signupBtn = document.getElementById('signupBtn');
      const signupError = document.getElementById('signupError');
      const goToLogin = document.getElementById('goToLogin');

      // ============================================================
      // DOM – APP
      // ============================================================
      const miniAvatar = document.getElementById('miniAvatar');
      const miniName = document.getElementById('miniName');
      const logoutBtn = document.getElementById('logoutBtn');

      const avatarEl = document.getElementById('avatar');
      const profileNameEl = document.getElementById('profileName');
      const profileOccupationEl = document.getElementById('profileOccupation');
      const profileSinceEl = document.getElementById('profileSince');
      const editProfileBtn = document.getElementById('editProfileBtn');

      const statIncomeEl = document.getElementById('statIncome');
      const statExpenseEl = document.getElementById('statExpense');
      const statBalanceEl = document.getElementById('statBalance');
      const statBalanceBox = document.getElementById('statBalanceBox');
      const statCountEl = document.getElementById('statCount');

      const monthPicker = document.getElementById('monthPicker');

      const tabExpense = document.getElementById('tabExpense');
      const tabIncome = document.getElementById('tabIncome');

      const expenseFormWrap = document.getElementById('expenseFormWrap');
      const incomeFormWrap = document.getElementById('incomeFormWrap');

      const expenseNameInput = document.getElementById('expenseName');
      const expenseCategorySelect = document.getElementById('expenseCategory');
      const expenseAmountInput = document.getElementById('expenseAmount');
      const addExpenseBtn = document.getElementById('addExpenseBtn');

      const incomeNameInput = document.getElementById('incomeName');
      const incomeCategorySelect = document.getElementById('incomeCategory');
      const incomeAmountInput = document.getElementById('incomeAmount');
      const addIncomeBtn = document.getElementById('addIncomeBtn');

      const expenseListSection = document.getElementById('expenseListSection');
      const incomeListSection = document.getElementById('incomeListSection');
      const expenseListEl = document.getElementById('expenseList');
      const incomeListEl = document.getElementById('incomeList');
      const expenseCountEl = document.getElementById('expenseCount');
      const incomeCountEl = document.getElementById('incomeCount');

      // ============================================================
      // HELPERS
      // ============================================================
      const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency', currency: 'USD',
          minimumFractionDigits: 2, maximumFractionDigits: 2
        }).format(value);
      };

      const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

      const getCurrentMonthString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      };

      const getMonthStringFromTimestamp = (ts) => {
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      };

      const formatMonthDisplay = (monthStr) => {
        if (!monthStr) return '';
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      };

      // ============================================================
      // PERSISTENCE
      // ============================================================
      function loadUsers() {
        try {
          const raw = localStorage.getItem(USERS_KEY);
          users = raw ? JSON.parse(raw) : {};
          if (typeof users !== 'object' || Array.isArray(users)) users = {};
        } catch { users = {}; }
      }

      function saveUsers() {
        try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
        catch (e) { console.warn('save users failed', e); }
      }

      function saveSession() {
        try {
          if (currentUser) localStorage.setItem(SESSION_KEY, currentUser);
          else localStorage.removeItem(SESSION_KEY);
        } catch {}
      }

      function loadSession() {
        try { return localStorage.getItem(SESSION_KEY); }
        catch { return null; }
      }

      // ============================================================
      // CURRENT USER DATA HELPERS
      // ============================================================
      function getUserData() {
        if (!currentUser || !users[currentUser]) return null;
        return users[currentUser];
      }

      function saveCurrentUserData() {
        if (currentUser && users[currentUser]) {
          saveUsers();
        }
      }

      // ============================================================
      // AUTH – ERROR DISPLAY
      // ============================================================
      function showError(el, msg) {
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3500);
      }

      // ============================================================
      // AUTH – LOGIN
      // ============================================================
      function handleLogin() {
        const username = loginUsername.value.trim();
        const password = loginPassword.value;

        if (!username) { showError(loginError, 'Please enter your username.'); return; }
        if (!password) { showError(loginError, 'Please enter your password.'); return; }

        if (!users[username]) {
          showError(loginError, 'No account found with that username.');
          return;
        }
        if (users[username].password !== password) {
          showError(loginError, 'Incorrect password. Try again.');
          return;
        }

        // Success
        currentUser = username;
        saveSession();
        loginUsername.value = '';
        loginPassword.value = '';
        showAppScreen();
      }

      // ============================================================
      // AUTH – SIGNUP
      // ============================================================
      function handleSignup() {
        const username = signupUsername.value.trim();
        const password = signupPassword.value;
        const password2 = signupPassword2.value;

        if (!username) { showError(signupError, 'Please choose a username.'); return; }
        if (username.length < 3) { showError(signupError, 'Username must be at least 3 characters.'); return; }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          showError(signupError, 'Username can only contain letters, numbers and underscores.');
          return;
        }
        if (users[username]) { showError(signupError, 'That username is already taken.'); return; }
        if (!password || password.length < 4) {
          showError(signupError, 'Password must be at least 4 characters.');
          return;
        }
        if (password !== password2) {
          showError(signupError, 'Passwords do not match.');
          return;
        }

        // Create user with empty data
        users[username] = {
          password,
          profile: {
            name: username,
            occupation: 'Set your name',
            since: 'Member since ' + formatMonthDisplay(getCurrentMonthString())
          },
          transactions: []
        };
        saveUsers();

        currentUser = username;
        saveSession();

        signupUsername.value = '';
        signupPassword.value = '';
        signupPassword2.value = '';

        showAppScreen();
      }

      // ============================================================
      // AUTH – LOGOUT
      // ============================================================
      function handleLogout() {
        currentUser = null;
        saveSession();
        showLoginScreen();
      }

      // ============================================================
      // SCREEN SWITCHING
      // ============================================================
      function showLoginScreen() {
        window.location.href = 'login.html';
      }

      function showSignupScreen() {
        window.location.href = 'register.html';
      }

      function showAppScreen() {
        window.location.href = 'main.html';
      }

      // ============================================================
      // RENDER – PROFILE
      // ============================================================
      function renderProfile() {
        const data = getUserData();
        if (!data) return;
        const p = data.profile;

        miniName.textContent = p.name || currentUser;
        miniAvatar.textContent = (p.name || 'U').trim().charAt(0).toUpperCase();

        profileNameEl.textContent = p.name || currentUser;
        profileOccupationEl.textContent = p.occupation || 'Set your name';
        profileSinceEl.textContent = p.since || 'New member';
        avatarEl.textContent = (p.name || 'U').trim().charAt(0).toUpperCase() || '👤';
      }

      // ============================================================
      // MONTH FILTER
      // ============================================================
      function getTransactionsForMonth(monthStr) {
        const data = getUserData();
        if (!data) return [];
        return data.transactions.filter(t => {
          if (!t.timestamp) return false;
          return getMonthStringFromTimestamp(t.timestamp) === monthStr;
        });
      }

      // ============================================================
      // RENDER – STATS
      // ============================================================
      function renderStats() {
        const monthTx = getTransactionsForMonth(currentMonth);
        const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = income - expense;

        statIncomeEl.textContent = formatCurrency(income);
        statExpenseEl.textContent = formatCurrency(expense);
        statBalanceEl.textContent = formatCurrency(balance);
        statCountEl.textContent = monthTx.length;

        statBalanceBox.classList.toggle('negative', balance < 0);
      }

      // ============================================================
      // RENDER – LISTS
      // ============================================================
      function renderLists() {
        const monthTx = getTransactionsForMonth(currentMonth);

        const expenses = monthTx.filter(t => t.type === 'expense').sort((a, b) => b.timestamp - a.timestamp);
        const incomes = monthTx.filter(t => t.type === 'income').sort((a, b) => b.timestamp - a.timestamp);

        // ---- Expense list ----
        expenseListEl.innerHTML = '';
        if (expenses.length === 0) {
          const li = document.createElement('li');
          li.className = 'empty-message';
          li.innerHTML = `<span>🧾✨</span> No expenses this month — add one!`;
          expenseListEl.appendChild(li);
        } else {
          expenses.forEach(t => expenseListEl.appendChild(createTransactionLi(t)));
        }
        expenseCountEl.textContent = `${expenses.length} item${expenses.length !== 1 ? 's' : ''}`;

        // ---- Income list ----
        incomeListEl.innerHTML = '';
        if (incomes.length === 0) {
          const li = document.createElement('li');
          li.className = 'empty-message';
          li.innerHTML = `<span>💰✨</span> No income this month — add some!`;
          incomeListEl.appendChild(li);
        } else {
          incomes.forEach(t => incomeListEl.appendChild(createTransactionLi(t)));
        }
        incomeCountEl.textContent = `${incomes.length} item${incomes.length !== 1 ? 's' : ''}`;
      }

      function createTransactionLi(transaction) {
        const li = document.createElement('li');
        li.className = 'expense-item';
        if (transaction.type === 'income') li.classList.add('income-item');

        const infoDiv = document.createElement('div');
        infoDiv.className = 'expense-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'expense-name';
        nameSpan.textContent = transaction.name;

        const tagSpan = document.createElement('span');
        tagSpan.className = 'category-tag';
        if (transaction.type === 'income') tagSpan.classList.add('income-tag');
        tagSpan.textContent = transaction.category || (transaction.type === 'income' ? 'Income' : 'Other');
        nameSpan.appendChild(tagSpan);

        const dateSpan = document.createElement('span');
        dateSpan.className = 'expense-date';
        const d = new Date(transaction.timestamp);
        dateSpan.textContent = d.toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(dateSpan);

        const amountSpan = document.createElement('span');
        amountSpan.className = 'expense-amount';
        if (transaction.type === 'income') {
          amountSpan.classList.add('income-amount');
          amountSpan.textContent = '+' + formatCurrency(transaction.amount);
        } else {
          amountSpan.textContent = '-' + formatCurrency(transaction.amount);
        }

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = '✕';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteTransaction(transaction.id);
        });

        li.appendChild(infoDiv);
        li.appendChild(amountSpan);
        li.appendChild(delBtn);
        return li;
      }

      // ============================================================
      // ACTIONS – DELETE
      // ============================================================
      function deleteTransaction(id) {
        const data = getUserData();
        if (!data) return;
        data.transactions = data.transactions.filter(t => t.id !== id);
        saveCurrentUserData();
        renderAll();
      }

      // ============================================================
      // ACTIONS – ADD EXPENSE / INCOME
      // ============================================================
      function buildTimestampForCurrentMonth() {
        const now = new Date();
        const [yStr, mStr] = currentMonth.split('-');
        const year = parseInt(yStr), month = parseInt(mStr) - 1;
        if (now.getFullYear() === year && now.getMonth() === month) return Date.now();
        return new Date(year, month, 15, 12, 0, 0).getTime();
      }

      function addExpense() {
        const data = getUserData();
        if (!data) return;

        const name = expenseNameInput.value.trim();
        const amountRaw = expenseAmountInput.value.trim();
        const category = expenseCategorySelect.value;

        if (!name) { alert('Please enter a description.'); expenseNameInput.focus(); return; }
        if (!amountRaw) { alert('Please enter an amount.'); expenseAmountInput.focus(); return; }
        const amount = parseFloat(amountRaw);
        if (isNaN(amount) || amount <= 0) {
          alert('Please enter a valid amount greater than 0.');
          expenseAmountInput.value = '';
          expenseAmountInput.focus();
          return;
        }

        data.transactions.push({
          id: generateId(),
          type: 'expense',
          name,
          category,
          amount,
          timestamp: buildTimestampForCurrentMonth()
        });
        saveCurrentUserData();

        expenseNameInput.value = '';
        expenseAmountInput.value = '';
        expenseNameInput.focus();
        renderAll();
      }

      function addIncome() {
        const data = getUserData();
        if (!data) return;

        const name = incomeNameInput.value.trim();
        const amountRaw = incomeAmountInput.value.trim();
        const category = incomeCategorySelect.value;

        if (!name) { alert('Please enter a source.'); incomeNameInput.focus(); return; }
        if (!amountRaw) { alert('Please enter an amount.'); incomeAmountInput.focus(); return; }
        const amount = parseFloat(amountRaw);
        if (isNaN(amount) || amount <= 0) {
          alert('Please enter a valid amount greater than 0.');
          incomeAmountInput.value = '';
          incomeAmountInput.focus();
          return;
        }

        data.transactions.push({
          id: generateId(),
          type: 'income',
          name,
          category,
          amount,
          timestamp: buildTimestampForCurrentMonth()
        });
        saveCurrentUserData();

        incomeNameInput.value = '';
        incomeAmountInput.value = '';
        incomeNameInput.focus();
        renderAll();
      }

      // ============================================================
      // TAB SWITCHING
      // ============================================================
      function switchTab(tab) {
        activeTab = tab;
        tabExpense.classList.toggle('active', tab === 'expense');
        tabIncome.classList.toggle('active', tab === 'income');
        expenseFormWrap.classList.toggle('hidden', tab !== 'expense');
        incomeFormWrap.classList.toggle('hidden', tab !== 'income');
        expenseListSection.classList.toggle('hidden', tab !== 'expense');
        incomeListSection.classList.toggle('hidden', tab !== 'income');
        renderLists();
      }

      // ============================================================
      // EDIT PROFILE
      // ============================================================
      function editProfile() {
        const data = getUserData();
        if (!data) return;

        const newName = prompt('Enter your name:', data.profile.name);
        if (newName === null) return;
        const trimmed = newName.trim();
        if (!trimmed) { alert('Name cannot be empty.'); return; }

        const newOcc = prompt('Enter your occupation (optional):', data.profile.occupation === 'Set your name' ? '' : data.profile.occupation);
        if (newOcc === null) return;

        data.profile.name = trimmed;
        data.profile.occupation = newOcc.trim() || 'Set your name';
        saveCurrentUserData();
        renderProfile();
      }

      // ============================================================
      // RENDER ALL
      // ============================================================
      function renderAll() {
        if (!currentUser) return;
        renderProfile();
        renderStats();
        renderLists();
      }

      // ============================================================
      // EVENT BINDING
      // ============================================================
      function bindAuthEvents() {
        if (loginBtn) loginBtn.addEventListener('click', handleLogin);
        if (signupBtn) signupBtn.addEventListener('click', handleSignup);
        if (goToSignup) goToSignup.addEventListener('click', showSignupScreen);
        if (goToLogin) goToLogin.addEventListener('click', showLoginScreen);

        if (loginUsername) loginUsername.addEventListener('keypress', e => { if (e.key === 'Enter') loginPassword?.focus(); });
        if (loginPassword) loginPassword.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });
        if (signupUsername) signupUsername.addEventListener('keypress', e => { if (e.key === 'Enter') signupPassword?.focus(); });
        if (signupPassword) signupPassword.addEventListener('keypress', e => { if (e.key === 'Enter') signupPassword2?.focus(); });
        if (signupPassword2) signupPassword2.addEventListener('keypress', e => { if (e.key === 'Enter') handleSignup(); });
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
      }

      function bindAppEvents() {
        if (monthPicker) monthPicker.addEventListener('change', e => {
          if (e.target.value) { currentMonth = e.target.value; renderAll(); }
        });
        if (tabExpense) tabExpense.addEventListener('click', () => switchTab('expense'));
        if (tabIncome) tabIncome.addEventListener('click', () => switchTab('income'));
        if (addExpenseBtn) addExpenseBtn.addEventListener('click', addExpense);
        if (addIncomeBtn) addIncomeBtn.addEventListener('click', addIncome);
        if (expenseNameInput) expenseNameInput.addEventListener('keypress', e => {
          if (e.key === 'Enter') { e.preventDefault(); expenseAmountInput?.focus(); }
        });
        if (expenseAmountInput) expenseAmountInput.addEventListener('keypress', e => {
          if (e.key === 'Enter') { e.preventDefault(); addExpense(); }
        });
        if (incomeNameInput) incomeNameInput.addEventListener('keypress', e => {
          if (e.key === 'Enter') { e.preventDefault(); incomeAmountInput?.focus(); }
        });
        if (incomeAmountInput) incomeAmountInput.addEventListener('keypress', e => {
          if (e.key === 'Enter') { e.preventDefault(); addIncome(); }
        });
        if (editProfileBtn) editProfileBtn.addEventListener('click', editProfile);
      }

      // ============================================================
      // INIT
      // ============================================================
      function init() {
        loadUsers();
        bindAuthEvents();
        bindAppEvents();

        const page = document.body.dataset.page;
        const savedSession = loadSession();

        if (page === 'main') {
          if (!savedSession || !users[savedSession]) {
            window.location.href = 'login.html';
            return;
          }
          currentUser = savedSession;
          currentMonth = getCurrentMonthString();
          if (monthPicker) monthPicker.value = currentMonth;
          renderAll();
          switchTab('expense');
        } else if (page === 'login') {
          if (savedSession && users[savedSession]) {
            window.location.href = 'main.html';
            return;
          }
          loginUsername?.focus();
        } else if (page === 'register') {
          if (savedSession && users[savedSession]) {
            window.location.href = 'main.html';
            return;
          }
          signupUsername?.focus();
        }
      }

      init();
    })();
