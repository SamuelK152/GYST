import { useMemo, useState } from "react";
import "./App.css";

function App() {
  const today = new Date();
  const toISODate = (date) => date.toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(toISODate(today));
  const [activeTab, setActiveTab] = useState("main");

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Draft weekly plan",
      date: toISODate(today),
      time: "09:00",
      completed: false,
    },
    {
      id: 2,
      title: "Gym + mobility",
      date: toISODate(today),
      time: "18:30",
      completed: true,
    },
    {
      id: 3,
      title: "Review monthly budget",
      date: toISODate(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      ),
      time: "12:00",
      completed: false,
    },
  ]);

  const [goals, setGoals] = useState([
    { id: 1, title: "Launch MVP", targetDate: "2026-03-20", progress: 65 },
    { id: 2, title: "Read 12 books", targetDate: "2026-12-31", progress: 20 },
  ]);

  const [journalEntries, setJournalEntries] = useState({
    [toISODate(today)]:
      "Today felt focused. I completed the deep work block and set clear priorities for tomorrow.",
  });

  const [financeEntries, setFinanceEntries] = useState([
    {
      id: 1,
      type: "income",
      amount: 3200,
      category: "Salary",
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
    },
    {
      id: 2,
      type: "expense",
      amount: 860,
      category: "Housing",
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 5)),
    },
    {
      id: 3,
      type: "expense",
      amount: 240,
      category: "Food",
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 10)),
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  const [newFinanceType, setNewFinanceType] = useState("expense");
  const [newFinanceAmount, setNewFinanceAmount] = useState("");
  const [newFinanceCategory, setNewFinanceCategory] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskDraft, setTaskDraft] = useState({ title: "", time: "" });
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalDraft, setGoalDraft] = useState({
    title: "",
    targetDate: "",
    progress: 0,
  });
  const [editingFinanceId, setEditingFinanceId] = useState(null);
  const [financeDraft, setFinanceDraft] = useState({
    type: "expense",
    amount: "",
    category: "",
    date: "",
  });

  const selectedTasks = tasks.filter((task) => task.date === selectedDate);
  const selectedJournal = journalEntries[selectedDate] ?? "";

  const calendar = useMemo(() => {
    const [year, month] = selectedDate.split("-").map(Number);
    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDay = firstOfMonth.getDay();
    const cells = [];

    for (let i = 0; i < startDay; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month - 1, day));
    }

    return {
      year,
      month,
      daysInMonth,
      cells,
    };
  }, [selectedDate]);

  const monthlyFinance = useMemo(() => {
    const [year, month] = selectedDate.split("-").map(Number);
    const currentMonthEntries = financeEntries.filter((entry) => {
      const [entryYear, entryMonth] = entry.date.split("-").map(Number);
      return entryYear === year && entryMonth === month;
    });
    const income = currentMonthEntries
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const expense = currentMonthEntries
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [financeEntries, selectedDate]);

  const projection = monthlyFinance.net * 6;

  const shiftMonth = (direction) => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const next = new Date(year, month - 1 + direction, day);
    setSelectedDate(toISODate(next));
  };

  const updateYear = (value) => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const next = new Date(Number(value), month - 1, day);
    setSelectedDate(toISODate(next));
  };

  const yearOptions = Array.from({ length: 7 }, (_, index) => {
    const currentYear = Number(selectedDate.split("-")[0]);
    return currentYear - 3 + index;
  });

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks((prev) => [
      {
        id: Date.now(),
        title: newTaskTitle.trim(),
        date: selectedDate,
        time: newTaskTime || "Anytime",
        completed: false,
      },
      ...prev,
    ]);
    setNewTaskTitle("");
    setNewTaskTime("");
  };

  const toggleTask = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setTaskDraft({
      title: task.title,
      time: task.time === "Anytime" ? "" : task.time || "",
    });
  };

  const saveTask = (taskId) => {
    if (!taskDraft.title.trim()) return;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              title: taskDraft.title.trim(),
              time: taskDraft.time || "Anytime",
            }
          : task,
      ),
    );
    setEditingTaskId(null);
  };

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const addGoal = () => {
    if (!newGoalTitle.trim() || !newGoalDate) return;
    setGoals((prev) => [
      {
        id: Date.now(),
        title: newGoalTitle.trim(),
        targetDate: newGoalDate,
        progress: 0,
      },
      ...prev,
    ]);
    setNewGoalTitle("");
    setNewGoalDate("");
  };

  const updateGoalProgress = (goalId, value) => {
    const progress = Math.min(100, Math.max(0, Number(value)));
    setGoals((prev) =>
      prev.map((goal) => (goal.id === goalId ? { ...goal, progress } : goal)),
    );
  };

  const startEditGoal = (goal) => {
    setEditingGoalId(goal.id);
    setGoalDraft({
      title: goal.title,
      targetDate: goal.targetDate,
      progress: goal.progress,
    });
  };

  const saveGoal = (goalId) => {
    if (!goalDraft.title.trim() || !goalDraft.targetDate) return;
    const progress = Math.min(100, Math.max(0, Number(goalDraft.progress)));
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              title: goalDraft.title.trim(),
              targetDate: goalDraft.targetDate,
              progress,
            }
          : goal,
      ),
    );
    setEditingGoalId(null);
  };

  const deleteGoal = (goalId) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  const updateJournal = (value) => {
    setJournalEntries((prev) => ({
      ...prev,
      [selectedDate]: value,
    }));
  };

  const addFinanceEntry = () => {
    const amount = Number(newFinanceAmount);
    if (!amount || !newFinanceCategory.trim()) return;
    setFinanceEntries((prev) => [
      {
        id: Date.now(),
        type: newFinanceType,
        amount,
        category: newFinanceCategory.trim(),
        date: selectedDate,
      },
      ...prev,
    ]);
    setNewFinanceAmount("");
    setNewFinanceCategory("");
  };

  const startEditFinance = (entry) => {
    setEditingFinanceId(entry.id);
    setFinanceDraft({
      type: entry.type,
      amount: String(entry.amount),
      category: entry.category,
      date: entry.date,
    });
  };

  const saveFinance = (entryId) => {
    const amount = Number(financeDraft.amount);
    if (!amount || !financeDraft.category.trim() || !financeDraft.date) return;
    setFinanceEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              type: financeDraft.type,
              amount,
              category: financeDraft.category.trim(),
              date: financeDraft.date,
            }
          : entry,
      ),
    );
    setEditingFinanceId(null);
  };

  const deleteFinance = (entryId) => {
    setFinanceEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">MERN Productivity Suite</p>
          <h1>Daily Planner & Goal Tracker</h1>
          <p className="subtitle">
            Tasks, goals, journaling, and finances in one calendar-first
            workspace.
          </p>
        </div>
        <div className="header-actions">
          <button className="primary">Sync with Calendar</button>
          <button className="ghost">Export Summary</button>
        </div>
      </header>

      <nav className="tabs" aria-label="Primary">
        <button
          className={`tab ${activeTab === "main" ? "active" : ""}`}
          onClick={() => setActiveTab("main")}
          type="button"
        >
          Main view
        </button>
        <button
          className={`tab ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
          type="button"
        >
          To-do list
        </button>
        <button
          className={`tab ${activeTab === "goals" ? "active" : ""}`}
          onClick={() => setActiveTab("goals")}
          type="button"
        >
          Goals
        </button>
        <button
          className={`tab ${activeTab === "finance" ? "active" : ""}`}
          onClick={() => setActiveTab("finance")}
          type="button"
        >
          Finance
        </button>
      </nav>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Today&apos;s focus</h3>
          <p>{selectedTasks.length} tasks</p>
          <span>
            {selectedTasks.filter((task) => task.completed).length} completed
          </span>
        </div>
        <div className="stat-card">
          <h3>Monthly net</h3>
          <p>{formatCurrency(monthlyFinance.net)}</p>
          <span>Income {formatCurrency(monthlyFinance.income)}</span>
        </div>
        <div className="stat-card">
          <h3>Goal momentum</h3>
          <p>{goals.length} active goals</p>
          <span>
            Avg progress{" "}
            {Math.round(
              goals.reduce((sum, goal) => sum + goal.progress, 0) /
                goals.length,
            )}
            %
          </span>
        </div>
      </section>

      <main className={`layout ${activeTab !== "main" ? "single" : ""}`}>
        {(activeTab === "main" || activeTab === "tasks") && (
          <section className="panel calendar-panel">
            <div className="panel-header">
              <h2>Calendar</h2>
              <div className="calendar-controls">
                <button
                  type="button"
                  className="action-button ghost"
                  onClick={() => shiftMonth(-1)}
                >
                  ◀
                </button>
                <div className="calendar-title">
                  <span>
                    {new Date(
                      calendar.year,
                      calendar.month - 1,
                    ).toLocaleString("en-US", { month: "long" })}
                  </span>
                  <select
                    value={calendar.year}
                    onChange={(event) => updateYear(event.target.value)}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="action-button ghost"
                  onClick={() => shiftMonth(1)}
                >
                  ▶
                </button>
              </div>
            </div>
            <div className="calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="calendar-label">
                  {day}
                </div>
              ))}
              {calendar.cells.map((date, index) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="calendar-cell empty"
                    />
                  );
                }
                const iso = toISODate(date);
                const hasTasks = tasks.some((task) => task.date === iso);
                const hasJournal = Boolean(journalEntries[iso]);
                const hasIncome = financeEntries.some(
                  (entry) => entry.date === iso && entry.type === "income",
                );
                const hasExpense = financeEntries.some(
                  (entry) => entry.date === iso && entry.type === "expense",
                );
                const hasGoalDeadline = goals.some(
                  (goal) => goal.targetDate === iso,
                );
                const isSelected = iso === selectedDate;

                return (
                  <button
                    key={iso}
                    type="button"
                    className={`calendar-cell ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedDate(iso)}
                  >
                    <span>{date.getDate()}</span>
                    <div className="calendar-dots">
                      {hasTasks && <span className="dot task" />}
                      {hasJournal && <span className="dot journal" />}
                      {hasIncome && <span className="dot finance-income" />}
                      {hasExpense && <span className="dot finance-expense" />}
                      {hasGoalDeadline && <span className="dot goal" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="calendar-footer">
              <p>Selected: {selectedDate}</p>
              <div className="legend">
                <span>
                  <span className="dot task" /> Tasks
                </span>
                <span>
                  <span className="dot journal" /> Journal
                </span>
                <span>
                  <span className="dot finance-income" /> Income
                </span>
                <span>
                  <span className="dot finance-expense" /> Expense
                </span>
                <span>
                  <span className="dot goal" /> Goal deadline
                </span>
              </div>
            </div>
          </section>
        )}

        {(activeTab === "main" || activeTab === "tasks") && (
          <section className="panel">
            <div className="panel-header">
              <h2>To-do list</h2>
              <p>{selectedDate}</p>
            </div>
            <div className="input-row">
              <input
                type="text"
                placeholder="Add a task"
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
              />
              <input
                type="time"
                value={newTaskTime}
                onChange={(event) => setNewTaskTime(event.target.value)}
              />
              <button className="primary" onClick={addTask}>
                Add
              </button>
            </div>
            <ul className="task-list">
              {selectedTasks.length === 0 && (
                <li className="empty-state">No tasks yet. Add one above.</li>
              )}
              {selectedTasks.map((task) => (
                <li key={task.id} className={task.completed ? "completed" : ""}>
                  {editingTaskId === task.id ? (
                    <div className="edit-row">
                      <input
                        type="text"
                        value={taskDraft.title}
                        onChange={(event) =>
                          setTaskDraft((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                      />
                      <input
                        type="time"
                        value={taskDraft.time}
                        onChange={(event) =>
                          setTaskDraft((prev) => ({
                            ...prev,
                            time: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <label>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                      />
                      <span>{task.title}</span>
                    </label>
                  )}
                  <div className="item-actions">
                    {editingTaskId === task.id ? (
                      <>
                        <button
                          type="button"
                          className="action-button primary"
                          onClick={() => saveTask(task.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="action-button ghost"
                          onClick={() => setEditingTaskId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="pill">{task.time}</span>
                        <button
                          type="button"
                          className="action-button ghost"
                          onClick={() => startEditTask(task)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="action-button danger"
                          onClick={() => deleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(activeTab === "main" || activeTab === "goals") && (
          <section className="panel">
            <div className="panel-header">
              <h2>Goals</h2>
              <p>Track long-term outcomes</p>
            </div>
            <div className="input-row">
              <input
                type="text"
                placeholder="New goal"
                value={newGoalTitle}
                onChange={(event) => setNewGoalTitle(event.target.value)}
              />
              <input
                type="date"
                value={newGoalDate}
                onChange={(event) => setNewGoalDate(event.target.value)}
              />
              <button className="primary" onClick={addGoal}>
                Add
              </button>
            </div>
            <div className="goal-list">
              {goals.map((goal) => (
                <div key={goal.id} className="goal-card">
                  {editingGoalId === goal.id ? (
                    <div className="goal-edit">
                      <input
                        type="text"
                        value={goalDraft.title}
                        onChange={(event) =>
                          setGoalDraft((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                      />
                      <input
                        type="date"
                        value={goalDraft.targetDate}
                        onChange={(event) =>
                          setGoalDraft((prev) => ({
                            ...prev,
                            targetDate: event.target.value,
                          }))
                        }
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goalDraft.progress}
                        onChange={(event) =>
                          setGoalDraft((prev) => ({
                            ...prev,
                            progress: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <div>
                      <h3>{goal.title}</h3>
                      <p>Target {goal.targetDate}</p>
                    </div>
                  )}
                  <div className="goal-progress">
                    {editingGoalId === goal.id ? (
                      <span>{goalDraft.progress}%</span>
                    ) : (
                      <>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={goal.progress}
                          onChange={(event) =>
                            updateGoalProgress(goal.id, event.target.value)
                          }
                        />
                        <span>{goal.progress}%</span>
                      </>
                    )}
                    <div className="item-actions">
                      {editingGoalId === goal.id ? (
                        <>
                          <button
                            type="button"
                            className="action-button primary"
                            onClick={() => saveGoal(goal.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="action-button ghost"
                            onClick={() => setEditingGoalId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="action-button ghost"
                            onClick={() => startEditGoal(goal)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="action-button danger"
                            onClick={() => deleteGoal(goal.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "main" && (
          <section className="panel journal-panel">
            <div className="panel-header">
              <h2>Journal</h2>
              <p>Daily reflection</p>
            </div>
            <textarea
              rows="9"
              placeholder="Write your reflection for the day..."
              value={selectedJournal}
              onChange={(event) => updateJournal(event.target.value)}
            />
            <div className="journal-footer">
              <span>
                {selectedJournal.trim().split(/\s+/).filter(Boolean).length}{" "}
                words
              </span>
              <button className="ghost">Save entry</button>
            </div>
          </section>
        )}

        {(activeTab === "main" || activeTab === "finance") && (
          <section className="panel finance-panel">
            <div className="panel-header">
              <h2>Finance</h2>
              <p>Track cashflow & projections</p>
            </div>
            <div className="finance-cards">
              <div>
                <h4>Income</h4>
                <p>{formatCurrency(monthlyFinance.income)}</p>
              </div>
              <div>
                <h4>Expenses</h4>
                <p>{formatCurrency(monthlyFinance.expense)}</p>
              </div>
              <div>
                <h4>6 mo projection</h4>
                <p>{formatCurrency(projection)}</p>
              </div>
            </div>
            <div className="input-row">
              <select
                value={newFinanceType}
                onChange={(event) => setNewFinanceType(event.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={newFinanceAmount}
                onChange={(event) => setNewFinanceAmount(event.target.value)}
              />
              <input
                type="text"
                placeholder="Category"
                value={newFinanceCategory}
                onChange={(event) => setNewFinanceCategory(event.target.value)}
              />
              <button className="primary" onClick={addFinanceEntry}>
                Add
              </button>
            </div>
            <ul className="finance-list">
              {financeEntries.map((entry) => (
                <li key={entry.id}>
                  {editingFinanceId === entry.id ? (
                    <div className="edit-row">
                      <select
                        value={financeDraft.type}
                        onChange={(event) =>
                          setFinanceDraft((prev) => ({
                            ...prev,
                            type: event.target.value,
                          }))
                        }
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <input
                        type="number"
                        value={financeDraft.amount}
                        onChange={(event) =>
                          setFinanceDraft((prev) => ({
                            ...prev,
                            amount: event.target.value,
                          }))
                        }
                      />
                      <input
                        type="text"
                        value={financeDraft.category}
                        onChange={(event) =>
                          setFinanceDraft((prev) => ({
                            ...prev,
                            category: event.target.value,
                          }))
                        }
                      />
                      <input
                        type="date"
                        value={financeDraft.date}
                        onChange={(event) =>
                          setFinanceDraft((prev) => ({
                            ...prev,
                            date: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <div>
                      <strong>{entry.category}</strong>
                      <span>{entry.date}</span>
                    </div>
                  )}
                  <div className="item-actions">
                    {editingFinanceId === entry.id ? (
                      <>
                        <button
                          type="button"
                          className="action-button primary"
                          onClick={() => saveFinance(entry.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="action-button ghost"
                          onClick={() => setEditingFinanceId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className={
                            entry.type === "income" ? "income" : "expense"
                          }
                        >
                          {entry.type === "income" ? "+" : "-"}
                          {formatCurrency(entry.amount)}
                        </span>
                        <button
                          type="button"
                          className="action-button ghost"
                          onClick={() => startEditFinance(entry)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="action-button danger"
                          onClick={() => deleteFinance(entry.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
