import { useMemo, useState } from "react";
import "./App.css";

function App() {
  const today = new Date();
  const toISODate = (date) => date.toISOString().split("T")[0];
  const toUTCDate = (isoDate) => new Date(`${isoDate}T00:00:00Z`);
  const formatDateParts = (year, month, day) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const monthsDiff = (start, target) =>
    (target.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (target.getUTCMonth() - start.getUTCMonth());
  const occursOnDate = (entry, targetDate) => {
    if (!entry) return false;
    const { date: startDate, recurrence, exceptions } = entry;
    if (exceptions?.includes(targetDate)) return false;
    if (!recurrence || recurrence.type === "once") {
      return startDate === targetDate;
    }

    const start = toUTCDate(startDate);
    const target = toUTCDate(targetDate);
    const diffDays = Math.floor((target - start) / 86400000);
    if (diffDays < 0) return false;

    switch (recurrence.type) {
      case "daily":
        return true;
      case "weekly":
        return diffDays % 7 === 0;
      case "monthly":
        return (
          target.getUTCDate() === start.getUTCDate() &&
          monthsDiff(start, target) >= 0
        );
      case "yearly":
        return (
          target.getUTCDate() === start.getUTCDate() &&
          target.getUTCMonth() === start.getUTCMonth()
        );
      case "every-x-days":
        return diffDays % Math.max(1, recurrence.interval || 1) === 0;
      case "every-x-weeks":
        return diffDays % (7 * Math.max(1, recurrence.interval || 1)) === 0;
      case "every-x-months":
        return (
          target.getUTCDate() === start.getUTCDate() &&
          monthsDiff(start, target) % Math.max(1, recurrence.interval || 1) ===
            0
        );
      default:
        return startDate === targetDate;
    }
  };
  const buildRecurrence = (type, interval) => {
    if (type && type.startsWith("every-")) {
      return { type, interval: Math.max(1, Number(interval) || 1) };
    }
    return { type: type || "once" };
  };
  const formatRecurrence = (recurrence) => {
    if (!recurrence || recurrence.type === "once") return "One-time";
    if (recurrence.type === "daily") return "Daily";
    if (recurrence.type === "weekly") return "Weekly";
    if (recurrence.type === "monthly") return "Monthly";
    if (recurrence.type === "yearly") return "Yearly";
    if (recurrence.type === "every-x-days") {
      return `Every ${recurrence.interval || 1} days`;
    }
    if (recurrence.type === "every-x-weeks") {
      return `Every ${recurrence.interval || 1} weeks`;
    }
    if (recurrence.type === "every-x-months") {
      return `Every ${recurrence.interval || 1} months`;
    }
    return "One-time";
  };
  const [selectedDate, setSelectedDate] = useState(toISODate(today));
  const [activeTab, setActiveTab] = useState("main");

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Draft weekly plan",
      date: toISODate(today),
      time: "09:00",
      completed: false,
      recurrence: { type: "once" },
      exceptions: [],
    },
    {
      id: 2,
      title: "Gym + mobility",
      date: toISODate(today),
      time: "18:30",
      completed: true,
      recurrence: { type: "weekly" },
      exceptions: [],
    },
    {
      id: 3,
      title: "Review monthly budget",
      date: toISODate(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      ),
      time: "12:00",
      completed: false,
      recurrence: { type: "once" },
      exceptions: [],
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
      recurrence: { type: "monthly" },
      exceptions: [],
    },
    {
      id: 2,
      type: "expense",
      amount: 860,
      category: "Housing",
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 5)),
      recurrence: { type: "monthly" },
      exceptions: [],
    },
    {
      id: 3,
      type: "expense",
      amount: 240,
      category: "Food",
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 10)),
      recurrence: { type: "weekly" },
      exceptions: [],
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newTaskRecurrenceType, setNewTaskRecurrenceType] = useState("once");
  const [newTaskRecurrenceInterval, setNewTaskRecurrenceInterval] =
    useState("2");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  const [newFinanceType, setNewFinanceType] = useState("expense");
  const [newFinanceAmount, setNewFinanceAmount] = useState("");
  const [newFinanceCategory, setNewFinanceCategory] = useState("");
  const [newFinanceRecurrenceType, setNewFinanceRecurrenceType] =
    useState("once");
  const [newFinanceRecurrenceInterval, setNewFinanceRecurrenceInterval] =
    useState("2");
  const [editModal, setEditModal] = useState(null);
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    time: "",
    recurrenceType: "once",
    recurrenceInterval: "2",
    sourceId: null,
    isRecurringInstance: false,
  });
  const [goalDraft, setGoalDraft] = useState({
    title: "",
    targetDate: "",
    progress: 0,
    sourceId: null,
  });
  const [financeDraft, setFinanceDraft] = useState({
    type: "expense",
    amount: "",
    category: "",
    date: "",
    recurrenceType: "once",
    recurrenceInterval: "2",
    sourceId: null,
    isRecurringInstance: false,
  });

  const selectedTasks = useMemo(() => {
    const instances = [];
    tasks.forEach((task) => {
      if (occursOnDate(task, selectedDate)) {
        const isRecurringInstance = task.recurrence?.type !== "once";
        instances.push({
          ...task,
          instanceId: isRecurringInstance
            ? `${task.id}-${selectedDate}`
            : String(task.id),
          sourceId: task.id,
          isRecurringInstance,
          date: selectedDate,
        });
      }
    });
    return instances;
  }, [tasks, selectedDate]);
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
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    let income = 0;
    let expense = 0;

    financeEntries.forEach((entry) => {
      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = formatDateParts(year, month, day);
        if (occursOnDate(entry, date)) {
          if (entry.type === "income") {
            income += entry.amount;
          } else {
            expense += entry.amount;
          }
        }
      }
    });
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [financeEntries, selectedDate]);

  const financeInstancesForMonth = useMemo(() => {
    const [year, month] = selectedDate.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const instances = [];

    financeEntries.forEach((entry) => {
      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = formatDateParts(year, month, day);
        if (occursOnDate(entry, date)) {
          const isRecurringInstance = entry.recurrence?.type !== "once";
          instances.push({
            ...entry,
            instanceId: isRecurringInstance
              ? `${entry.id}-${date}`
              : String(entry.id),
            sourceId: entry.id,
            isRecurringInstance,
            date,
          });
        }
      }
    });

    return instances.sort((a, b) => b.date.localeCompare(a.date));
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
        recurrence: buildRecurrence(
          newTaskRecurrenceType,
          newTaskRecurrenceInterval,
        ),
        exceptions: [],
      },
      ...prev,
    ]);
    setNewTaskTitle("");
    setNewTaskTime("");
    setNewTaskRecurrenceType("once");
    setNewTaskRecurrenceInterval("2");
  };

  const addTaskException = (taskId, date) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              exceptions: Array.from(
                new Set([...(task.exceptions || []), date]),
              ),
            }
          : task,
      ),
    );
  };

  const addOneTimeTaskFromInstance = (instance, overrides = {}) => {
    setTasks((prev) => [
      {
        id: Date.now(),
        title: overrides.title ?? instance.title,
        date: overrides.date ?? instance.date,
        time: overrides.time ?? instance.time,
        completed: overrides.completed ?? instance.completed,
        recurrence: { type: "once" },
        exceptions: [],
      },
      ...prev,
    ]);
  };

  const toggleTask = (task) => {
    if (task.isRecurringInstance) {
      addTaskException(task.sourceId, task.date);
      addOneTimeTaskFromInstance(task, { completed: !task.completed });
      return;
    }
    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.sourceId
          ? { ...item, completed: !item.completed }
          : item,
      ),
    );
  };

  const closeModal = () => {
    setEditModal(null);
  };

  const openTaskModal = (task) => {
    setEditModal({ type: "task", entity: task });
    setTaskDraft({
      title: task.title,
      time: task.time === "Anytime" ? "" : task.time || "",
      recurrenceType: task.recurrence?.type || "once",
      recurrenceInterval: String(task.recurrence?.interval || 2),
      sourceId: task.sourceId,
      isRecurringInstance: task.isRecurringInstance,
    });
  };

  const saveTask = () => {
    if (!taskDraft.title.trim()) return;
    if (taskDraft.isRecurringInstance) {
      addTaskException(taskDraft.sourceId, selectedDate);
      addOneTimeTaskFromInstance({
        title: taskDraft.title.trim(),
        time: taskDraft.time || "Anytime",
        date: selectedDate,
        completed: false,
      });
      closeModal();
      return;
    }
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskDraft.sourceId
          ? {
              ...task,
              title: taskDraft.title.trim(),
              time: taskDraft.time || "Anytime",
              recurrence: buildRecurrence(
                taskDraft.recurrenceType,
                taskDraft.recurrenceInterval,
              ),
            }
          : task,
      ),
    );
    closeModal();
  };

  const deleteTask = (task) => {
    if (task.isRecurringInstance) {
      addTaskException(task.sourceId, task.date);
      return;
    }
    setTasks((prev) => prev.filter((item) => item.id !== task.sourceId));
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

  const openGoalModal = (goal) => {
    setEditModal({ type: "goal", entity: goal });
    setGoalDraft({
      title: goal.title,
      targetDate: goal.targetDate,
      progress: goal.progress,
      sourceId: goal.id,
    });
  };

  const saveGoal = () => {
    if (!goalDraft.title.trim() || !goalDraft.targetDate) return;
    const progress = Math.min(100, Math.max(0, Number(goalDraft.progress)));
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalDraft.sourceId
          ? {
              ...goal,
              title: goalDraft.title.trim(),
              targetDate: goalDraft.targetDate,
              progress,
            }
          : goal,
      ),
    );
    closeModal();
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
        recurrence: buildRecurrence(
          newFinanceRecurrenceType,
          newFinanceRecurrenceInterval,
        ),
        exceptions: [],
      },
      ...prev,
    ]);
    setNewFinanceAmount("");
    setNewFinanceCategory("");
    setNewFinanceRecurrenceType("once");
    setNewFinanceRecurrenceInterval("2");
  };

  const openFinanceModal = (entry) => {
    setEditModal({ type: "finance", entity: entry });
    setFinanceDraft({
      type: entry.type,
      amount: String(entry.amount),
      category: entry.category,
      date: entry.date,
      recurrenceType: entry.recurrence?.type || "once",
      recurrenceInterval: String(entry.recurrence?.interval || 2),
      sourceId: entry.sourceId,
      isRecurringInstance: entry.isRecurringInstance,
    });
  };

  const addFinanceException = (entryId, date) => {
    setFinanceEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              exceptions: Array.from(
                new Set([...(entry.exceptions || []), date]),
              ),
            }
          : entry,
      ),
    );
  };

  const addOneTimeFinanceFromInstance = (instance, overrides = {}) => {
    setFinanceEntries((prev) => [
      {
        id: Date.now(),
        type: overrides.type ?? instance.type,
        amount: overrides.amount ?? instance.amount,
        category: overrides.category ?? instance.category,
        date: overrides.date ?? instance.date,
        recurrence: { type: "once" },
        exceptions: [],
      },
      ...prev,
    ]);
  };

  const saveFinance = () => {
    const amount = Number(financeDraft.amount);
    if (!amount || !financeDraft.category.trim() || !financeDraft.date) return;
    if (financeDraft.isRecurringInstance) {
      addFinanceException(financeDraft.sourceId, financeDraft.date);
      addOneTimeFinanceFromInstance(
        {
          type: financeDraft.type,
          amount,
          category: financeDraft.category.trim(),
          date: financeDraft.date,
        },
        {
          type: financeDraft.type,
          amount,
          category: financeDraft.category.trim(),
          date: financeDraft.date,
        },
      );
      closeModal();
      return;
    }
    setFinanceEntries((prev) =>
      prev.map((entry) =>
        entry.id === financeDraft.sourceId
          ? {
              ...entry,
              type: financeDraft.type,
              amount,
              category: financeDraft.category.trim(),
              date: financeDraft.date,
              recurrence: buildRecurrence(
                financeDraft.recurrenceType,
                financeDraft.recurrenceInterval,
              ),
            }
          : entry,
      ),
    );
    closeModal();
  };

  const deleteFinance = (entry) => {
    if (entry.isRecurringInstance) {
      addFinanceException(entry.sourceId, entry.date);
      return;
    }
    setFinanceEntries((prev) =>
      prev.filter((item) => item.id !== entry.sourceId),
    );
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
                    {new Date(calendar.year, calendar.month - 1).toLocaleString(
                      "en-US",
                      { month: "long" },
                    )}
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
                const hasTasks = tasks.some((task) => occursOnDate(task, iso));
                const hasJournal = Boolean(journalEntries[iso]);
                const hasIncome = financeEntries.some(
                  (entry) =>
                    entry.type === "income" && occursOnDate(entry, iso),
                );
                const hasExpense = financeEntries.some(
                  (entry) =>
                    entry.type === "expense" && occursOnDate(entry, iso),
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
            <div className="input-row recurrence-row">
              <select
                value={newTaskRecurrenceType}
                onChange={(event) =>
                  setNewTaskRecurrenceType(event.target.value)
                }
              >
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="every-x-days">Every X days</option>
                <option value="every-x-weeks">Every X weeks</option>
                <option value="every-x-months">Every X months</option>
              </select>
              {newTaskRecurrenceType.startsWith("every-") && (
                <input
                  type="number"
                  min="1"
                  value={newTaskRecurrenceInterval}
                  onChange={(event) =>
                    setNewTaskRecurrenceInterval(event.target.value)
                  }
                  placeholder="Interval"
                />
              )}
              <span className="helper">
                {formatRecurrence(
                  buildRecurrence(
                    newTaskRecurrenceType,
                    newTaskRecurrenceInterval,
                  ),
                )}
              </span>
            </div>
            <ul className="task-list">
              {selectedTasks.length === 0 && (
                <li className="empty-state">No tasks yet. Add one above.</li>
              )}
              {selectedTasks.map((task) => (
                <li
                  key={task.instanceId}
                  className={task.completed ? "completed" : ""}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task)}
                    />
                    <span>{task.title}</span>
                  </label>
                  <div className="item-actions">
                    <span className="pill">{task.time}</span>
                    <span className="pill secondary">
                      {formatRecurrence(task.recurrence)}
                    </span>
                    <button
                      type="button"
                      className="action-button ghost"
                      onClick={() => openTaskModal(task)}
                    >
                      Edit
                    </button>
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
                  <div>
                    <h3>{goal.title}</h3>
                    <p>Target {goal.targetDate}</p>
                  </div>
                  <div className="goal-progress">
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
                    <div className="item-actions">
                      <button
                        type="button"
                        className="action-button ghost"
                        onClick={() => openGoalModal(goal)}
                      >
                        Edit
                      </button>
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
            <div className="input-row recurrence-row">
              <select
                value={newFinanceRecurrenceType}
                onChange={(event) =>
                  setNewFinanceRecurrenceType(event.target.value)
                }
              >
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="every-x-days">Every X days</option>
                <option value="every-x-weeks">Every X weeks</option>
                <option value="every-x-months">Every X months</option>
              </select>
              {newFinanceRecurrenceType.startsWith("every-") && (
                <input
                  type="number"
                  min="1"
                  value={newFinanceRecurrenceInterval}
                  onChange={(event) =>
                    setNewFinanceRecurrenceInterval(event.target.value)
                  }
                  placeholder="Interval"
                />
              )}
              <span className="helper">
                {formatRecurrence(
                  buildRecurrence(
                    newFinanceRecurrenceType,
                    newFinanceRecurrenceInterval,
                  ),
                )}
              </span>
            </div>
            <ul className="finance-list">
              {financeInstancesForMonth.map((entry) => (
                <li key={entry.instanceId}>
                  <div>
                    <strong>{entry.category}</strong>
                    <span>{entry.date}</span>
                    <span className="pill secondary">
                      {formatRecurrence(entry.recurrence)}
                    </span>
                  </div>
                  <div className="item-actions">
                    <span
                      className={entry.type === "income" ? "income" : "expense"}
                    >
                      {entry.type === "income" ? "+" : "-"}
                      {formatCurrency(entry.amount)}
                    </span>
                    <button
                      type="button"
                      className="action-button ghost"
                      onClick={() => openFinanceModal(entry)}
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {editModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal-header">
              <h3>
                {editModal.type === "task" && "Edit task"}
                {editModal.type === "goal" && "Edit goal"}
                {editModal.type === "finance" && "Edit finance entry"}
              </h3>
              <button
                type="button"
                className="action-button ghost"
                onClick={closeModal}
              >
                Close
              </button>
            </header>
            <div className="modal-body">
              {editModal.type === "task" && (
                <>
                  {taskDraft.isRecurringInstance && (
                    <p className="helper">
                      Editing a recurring instance will create a one-time entry
                      for {selectedDate}.
                    </p>
                  )}
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
                  <div className="modal-row">
                    <select
                      value={taskDraft.recurrenceType}
                      onChange={(event) =>
                        setTaskDraft((prev) => ({
                          ...prev,
                          recurrenceType: event.target.value,
                        }))
                      }
                      disabled={taskDraft.isRecurringInstance}
                    >
                      <option value="once">One-time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="every-x-days">Every X days</option>
                      <option value="every-x-weeks">Every X weeks</option>
                      <option value="every-x-months">Every X months</option>
                    </select>
                    {taskDraft.recurrenceType.startsWith("every-") && (
                      <input
                        type="number"
                        min="1"
                        value={taskDraft.recurrenceInterval}
                        onChange={(event) =>
                          setTaskDraft((prev) => ({
                            ...prev,
                            recurrenceInterval: event.target.value,
                          }))
                        }
                        disabled={taskDraft.isRecurringInstance}
                      />
                    )}
                  </div>
                </>
              )}

              {editModal.type === "goal" && (
                <>
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
                </>
              )}

              {editModal.type === "finance" && (
                <>
                  {financeDraft.isRecurringInstance && (
                    <p className="helper">
                      Editing a recurring instance will create a one-time entry
                      for {financeDraft.date}.
                    </p>
                  )}
                  <div className="modal-row">
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
                  </div>
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
                  <div className="modal-row">
                    <select
                      value={financeDraft.recurrenceType}
                      onChange={(event) =>
                        setFinanceDraft((prev) => ({
                          ...prev,
                          recurrenceType: event.target.value,
                        }))
                      }
                      disabled={financeDraft.isRecurringInstance}
                    >
                      <option value="once">One-time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="every-x-days">Every X days</option>
                      <option value="every-x-weeks">Every X weeks</option>
                      <option value="every-x-months">Every X months</option>
                    </select>
                    {financeDraft.recurrenceType.startsWith("every-") && (
                      <input
                        type="number"
                        min="1"
                        value={financeDraft.recurrenceInterval}
                        onChange={(event) =>
                          setFinanceDraft((prev) => ({
                            ...prev,
                            recurrenceInterval: event.target.value,
                          }))
                        }
                        disabled={financeDraft.isRecurringInstance}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="action-button danger"
                onClick={() => {
                  if (editModal.type === "task") {
                    deleteTask(editModal.entity);
                  }
                  if (editModal.type === "goal") {
                    deleteGoal(editModal.entity.id);
                  }
                  if (editModal.type === "finance") {
                    deleteFinance(editModal.entity);
                  }
                  closeModal();
                }}
              >
                Delete
              </button>
              <div className="modal-actions-right">
                <button
                  type="button"
                  className="action-button ghost"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="action-button primary"
                  onClick={() => {
                    if (editModal.type === "task") saveTask();
                    if (editModal.type === "goal") saveGoal();
                    if (editModal.type === "finance") saveFinance();
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
