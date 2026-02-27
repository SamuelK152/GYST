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
  const resolveFinanceAmount = (entry) => {
    const actual = Number(entry.actualAmount || 0);
    if (actual) return actual;
    return Number(entry.anticipatedAmount || 0);
  };
  const formatDayOrdinal = (isoDate) => {
    const day = Number(isoDate.split("-")[2]);
    if (Number.isNaN(day)) return isoDate;
    const mod10 = day % 10;
    const mod100 = day % 100;
    let suffix = "th";
    if (mod100 < 11 || mod100 > 13) {
      if (mod10 === 1) suffix = "st";
      if (mod10 === 2) suffix = "nd";
      if (mod10 === 3) suffix = "rd";
    }
    return `${day}${suffix}`;
  };
  const getWeekStartISO = (isoDate) => {
    const date = toUTCDate(isoDate);
    date.setUTCDate(date.getUTCDate() - date.getUTCDay());
    return toISODate(date);
  };
  const goalStartDate = (goal) => goal.startDate || goal.targetDate;
  const [selectedDate, setSelectedDate] = useState(toISODate(today));
  const [summaryRange, setSummaryRange] = useState("day");
  const [activeTab, setActiveTab] = useState("main");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
    {
      id: 1,
      title: "Launch MVP",
      startDate: "2026-01-15",
      targetDate: "2026-03-20",
      progress: 65,
    },
    {
      id: 2,
      title: "Read 12 books",
      startDate: "2026-01-01",
      targetDate: "2026-12-31",
      progress: 20,
    },
  ]);

  const [financeEntries, setFinanceEntries] = useState([
    {
      id: 1,
      type: "income",
      anticipatedAmount: 3200,
      actualAmount: 3200,
      category: "Salary",
      description: "Primary paycheck",
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
      recurrence: { type: "monthly" },
      exceptions: [],
    },
    {
      id: 2,
      type: "expense",
      anticipatedAmount: 860,
      actualAmount: 860,
      category: "Housing",
      description: "Rent payment",
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 5)),
      recurrence: { type: "monthly" },
      exceptions: [],
    },
    {
      id: 3,
      type: "expense",
      anticipatedAmount: 240,
      actualAmount: 215,
      category: "Food",
      description: "Groceries and pantry",
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
  const [newGoalStartDate, setNewGoalStartDate] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  const [newFinanceType, setNewFinanceType] = useState("expense");
  const [newFinanceAnticipated, setNewFinanceAnticipated] = useState("");
  const [newFinanceActual, setNewFinanceActual] = useState("");
  const [newFinanceCategory, setNewFinanceCategory] = useState("");
  const [newFinanceDescription, setNewFinanceDescription] = useState("");
  const [newFinanceRecurrenceType, setNewFinanceRecurrenceType] =
    useState("once");
  const [newFinanceRecurrenceInterval, setNewFinanceRecurrenceInterval] =
    useState("2");
  const [financeTab, setFinanceTab] = useState("all");
  const [financeTypeFilter, setFinanceTypeFilter] = useState("all");
  const [editModal, setEditModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
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
    startDate: "",
    targetDate: "",
    progress: 0,
    sourceId: null,
  });
  const [financeDraft, setFinanceDraft] = useState({
    type: "expense",
    anticipatedAmount: "",
    actualAmount: "",
    category: "",
    description: "",
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
          const amount = resolveFinanceAmount(entry);
          if (entry.type === "income") {
            income += amount;
          } else {
            expense += amount;
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

  const selectedFinanceEntries = useMemo(
    () =>
      financeInstancesForMonth.filter((entry) => entry.date === selectedDate),
    [financeInstancesForMonth, selectedDate],
  );

  const selectedFinanceTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    selectedFinanceEntries.forEach((entry) => {
      const amount = resolveFinanceAmount(entry);
      if (entry.type === "income") {
        income += amount;
      } else {
        expense += amount;
      }
    });
    return { income, expense, net: income - expense };
  }, [selectedFinanceEntries]);

  const summaryRangeDates = useMemo(() => {
    const anchor = toUTCDate(selectedDate);
    let start = new Date(anchor);
    let end = new Date(anchor);

    if (summaryRange === "week") {
      start = new Date(anchor);
      start.setUTCDate(anchor.getUTCDate() - anchor.getUTCDay());
      end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 6);
    }

    if (summaryRange === "month") {
      start = new Date(
        Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1),
      );
      end = new Date(
        Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0),
      );
    }

    if (summaryRange === "year") {
      start = new Date(Date.UTC(anchor.getUTCFullYear(), 0, 1));
      end = new Date(Date.UTC(anchor.getUTCFullYear(), 11, 31));
    }

    const dates = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(
        formatDateParts(
          cursor.getUTCFullYear(),
          cursor.getUTCMonth() + 1,
          cursor.getUTCDate(),
        ),
      );
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return dates;
  }, [selectedDate, summaryRange]);

  const summaryRangeSet = useMemo(
    () => new Set(summaryRangeDates),
    [summaryRangeDates],
  );

  const summaryTaskEntries = useMemo(() => {
    const instances = [];
    summaryRangeDates.forEach((date) => {
      tasks.forEach((task) => {
        if (occursOnDate(task, date)) {
          const isRecurringInstance = task.recurrence?.type !== "once";
          instances.push({
            ...task,
            instanceId: isRecurringInstance
              ? `${task.id}-${date}`
              : String(task.id),
            sourceId: task.id,
            isRecurringInstance,
            date,
          });
        }
      });
    });
    return instances.sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, summaryRangeDates]);

  const summaryFinanceEntries = useMemo(() => {
    const instances = [];
    summaryRangeDates.forEach((date) => {
      financeEntries.forEach((entry) => {
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
      });
    });
    return instances.sort((a, b) => b.date.localeCompare(a.date));
  }, [financeEntries, summaryRangeDates]);

  const summaryFinanceTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    summaryFinanceEntries.forEach((entry) => {
      const amount = resolveFinanceAmount(entry);
      if (entry.type === "income") {
        income += amount;
      } else {
        expense += amount;
      }
    });
    return { income, expense, net: income - expense };
  }, [summaryFinanceEntries]);

  const summaryGoals = useMemo(() => {
    const start = summaryRangeDates[0];
    const end = summaryRangeDates[summaryRangeDates.length - 1];
    if (!start || !end) return [];
    return goals.filter((goal) => {
      const goalStart = goalStartDate(goal);
      return goalStart <= end && goal.targetDate >= start;
    });
  }, [goals, summaryRangeDates]);

  const taskSummaryStats = useMemo(() => {
    const total = summaryTaskEntries.length;
    const complete = summaryTaskEntries.filter((task) => task.completed).length;
    const active = total - complete;
    const completion = total ? Math.round((complete / total) * 100) : 0;
    return { active, complete, completion };
  }, [summaryTaskEntries]);

  const goalSummaryStats = useMemo(() => {
    const total = summaryGoals.length;
    const startedGoals = summaryGoals.filter(
      (goal) => goalStartDate(goal) <= selectedDate,
    );
    const complete = summaryGoals.filter(
      (goal) => Number(goal.progress) >= 100,
    ).length;
    const active = startedGoals.filter(
      (goal) => Number(goal.progress) < 100,
    ).length;
    const completion = total ? Math.round((complete / total) * 100) : 0;
    return { active, complete, completion };
  }, [summaryGoals, selectedDate]);

  const summaryRangeLabel = useMemo(() => {
    if (summaryRange === "day") return selectedDate;
    const start = summaryRangeDates[0];
    const end = summaryRangeDates[summaryRangeDates.length - 1];
    if (!start || !end) return selectedDate;
    if (summaryRange === "week") return `${start} → ${end}`;
    if (summaryRange === "month") return start.slice(0, 7);
    if (summaryRange === "year") return start.slice(0, 4);
    return selectedDate;
  }, [summaryRange, summaryRangeDates, selectedDate]);

  const filteredFinanceEntries = useMemo(() => {
    const matchesTab = (recurrence) => {
      const type = recurrence?.type || "once";
      if (financeTab === "all") {
        return true;
      }
      if (financeTab === "daily") {
        return type === "daily" || type === "every-x-days";
      }
      if (financeTab === "weekly") {
        return type === "weekly" || type === "every-x-weeks";
      }
      if (financeTab === "monthly") {
        return (
          type === "monthly" || type === "every-x-months" || type === "once"
        );
      }
      if (financeTab === "one-time") {
        return type === "once";
      }
      if (financeTab === "yearly") {
        return type === "yearly";
      }
      return true;
    };

    const matchesType = (type) => {
      if (financeTypeFilter === "all") return true;
      return type === financeTypeFilter;
    };

    return summaryFinanceEntries.filter(
      (entry) => matchesTab(entry.recurrence) && matchesType(entry.type),
    );
  }, [summaryFinanceEntries, financeTab, financeTypeFilter]);

  const groupedFinanceListItems = useMemo(() => {
    const toMonthKey = (isoDate) => isoDate.slice(0, 7);
    const formatMonthLabel = (isoDate) =>
      new Date(`${isoDate}T00:00:00Z`).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    const formatDayLabel = (isoDate) =>
      new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });

    const getGroupMeta = (isoDate) => {
      if (summaryRange === "year") {
        return {
          key: `month-${toMonthKey(isoDate)}`,
          label: formatMonthLabel(isoDate),
        };
      }

      if (summaryRange === "month") {
        const weekStart = getWeekStartISO(isoDate);
        const weekEndDate = toUTCDate(weekStart);
        weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
        const weekEnd = toISODate(weekEndDate);
        return {
          key: `week-${weekStart}`,
          label: `${weekStart} → ${weekEnd}`,
        };
      }

      if (summaryRange === "week") {
        return { key: `day-${isoDate}`, label: formatDayLabel(isoDate) };
      }

      return { key: `day-${isoDate}`, label: formatDayLabel(isoDate) };
    };

    const items = [];
    let currentGroupKey = "";

    filteredFinanceEntries.forEach((entry) => {
      const groupMeta = getGroupMeta(entry.date);
      if (groupMeta.key !== currentGroupKey) {
        items.push({
          type: "group",
          key: `group-${groupMeta.key}`,
          label: groupMeta.label,
        });
        currentGroupKey = groupMeta.key;
      }
      items.push({ type: "entry", key: entry.instanceId, entry });
    });

    return items;
  }, [filteredFinanceEntries, summaryRange]);

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

  const closeDetailModal = () => {
    setDetailModal(null);
  };

  const openDetailModal = (type, entity) => {
    setDetailModal({ type, entity });
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

  const openNewTaskModal = () => {
    setNewTaskTitle("");
    setNewTaskTime("");
    setNewTaskRecurrenceType("once");
    setNewTaskRecurrenceInterval("2");
    setEditModal({ type: "new-task" });
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
    if (!newGoalTitle.trim() || !newGoalStartDate || !newGoalDate) return;
    if (newGoalStartDate > newGoalDate) return;
    setGoals((prev) => [
      {
        id: Date.now(),
        title: newGoalTitle.trim(),
        startDate: newGoalStartDate,
        targetDate: newGoalDate,
        progress: 0,
      },
      ...prev,
    ]);
    setNewGoalTitle("");
    setNewGoalStartDate("");
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
      startDate: goalStartDate(goal),
      targetDate: goal.targetDate,
      progress: goal.progress,
      sourceId: goal.id,
    });
  };

  const openNewGoalModal = () => {
    setNewGoalTitle("");
    setNewGoalStartDate(selectedDate);
    setNewGoalDate("");
    setEditModal({ type: "new-goal" });
  };

  const saveGoal = () => {
    if (
      !goalDraft.title.trim() ||
      !goalDraft.startDate ||
      !goalDraft.targetDate
    ) {
      return;
    }
    if (goalDraft.startDate > goalDraft.targetDate) return;
    const progress = Math.min(100, Math.max(0, Number(goalDraft.progress)));
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalDraft.sourceId
          ? {
              ...goal,
              title: goalDraft.title.trim(),
              startDate: goalDraft.startDate,
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

  const addFinanceEntry = () => {
    const anticipatedAmount = Number(newFinanceAnticipated);
    const actualAmount = Number(newFinanceActual);
    if (!anticipatedAmount && !actualAmount) return;
    if (!newFinanceCategory.trim()) return;
    setFinanceEntries((prev) => [
      {
        id: Date.now(),
        type: newFinanceType,
        anticipatedAmount: anticipatedAmount || 0,
        actualAmount: actualAmount || 0,
        category: newFinanceCategory.trim(),
        description: newFinanceDescription.trim(),
        date: selectedDate,
        recurrence: buildRecurrence(
          newFinanceRecurrenceType,
          newFinanceRecurrenceInterval,
        ),
        exceptions: [],
      },
      ...prev,
    ]);
    setNewFinanceAnticipated("");
    setNewFinanceActual("");
    setNewFinanceCategory("");
    setNewFinanceDescription("");
    setNewFinanceRecurrenceType("once");
    setNewFinanceRecurrenceInterval("2");
  };

  const openFinanceModal = (entry) => {
    setEditModal({ type: "finance", entity: entry });
    setFinanceDraft({
      type: entry.type,
      anticipatedAmount: String(entry.anticipatedAmount ?? ""),
      actualAmount: String(entry.actualAmount ?? ""),
      category: entry.category,
      description: entry.description || "",
      date: entry.date,
      recurrenceType: entry.recurrence?.type || "once",
      recurrenceInterval: String(entry.recurrence?.interval || 2),
      sourceId: entry.sourceId,
      isRecurringInstance: entry.isRecurringInstance,
    });
  };

  const openNewFinanceModal = () => {
    setNewFinanceType("expense");
    setNewFinanceAnticipated("");
    setNewFinanceActual("");
    setNewFinanceCategory("");
    setNewFinanceDescription("");
    setNewFinanceRecurrenceType("once");
    setNewFinanceRecurrenceInterval("2");
    setEditModal({ type: "new-finance" });
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
        anticipatedAmount:
          overrides.anticipatedAmount ?? instance.anticipatedAmount ?? 0,
        actualAmount: overrides.actualAmount ?? instance.actualAmount ?? 0,
        category: overrides.category ?? instance.category,
        description: overrides.description ?? instance.description ?? "",
        date: overrides.date ?? instance.date,
        recurrence: { type: "once" },
        exceptions: [],
      },
      ...prev,
    ]);
  };

  const saveFinance = () => {
    const anticipatedAmount = Number(financeDraft.anticipatedAmount);
    const actualAmount = Number(financeDraft.actualAmount);
    if (!anticipatedAmount && !actualAmount) return;
    if (!financeDraft.category.trim() || !financeDraft.date) return;
    if (financeDraft.isRecurringInstance) {
      addFinanceException(financeDraft.sourceId, financeDraft.date);
      addOneTimeFinanceFromInstance(
        {
          type: financeDraft.type,
          anticipatedAmount,
          actualAmount,
          category: financeDraft.category.trim(),
          description: financeDraft.description.trim(),
          date: financeDraft.date,
        },
        {
          type: financeDraft.type,
          anticipatedAmount,
          actualAmount,
          category: financeDraft.category.trim(),
          description: financeDraft.description.trim(),
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
              anticipatedAmount,
              actualAmount,
              category: financeDraft.category.trim(),
              description: financeDraft.description.trim(),
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

  const showTaskIndicators = activeTab === "main" || activeTab === "tasks";
  const showGoalIndicators = activeTab === "main" || activeTab === "goals";
  const showFinanceIndicators = activeTab === "main" || activeTab === "finance";
  const navItems = [
    { id: "main", label: "Main view" },
    { id: "tasks", label: "To-do list" },
    { id: "goals", label: "Goals" },
    { id: "finance", label: "Finance" },
  ];

  const navigateTo = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const openCalendarModal = () => setIsCalendarOpen(true);
  const closeCalendarModal = () => setIsCalendarOpen(false);

  const summaryRangeOptions = [
    { id: "day", label: "Day", icon: "☀" },
    { id: "week", label: "Week", icon: "📅" },
    { id: "month", label: "Month", icon: "🗓" },
    { id: "year", label: "Year", icon: "📆" },
  ];

  const renderSummaryRangeControls = () => (
    <div className="range-controls" role="group" aria-label="Summary range">
      {summaryRangeOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`range-button ${summaryRange === option.id ? "active" : ""}`}
          onClick={() => setSummaryRange(option.id)}
        >
          <span className="range-icon" aria-hidden="true">
            {option.icon}
          </span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );

  const renderCalendarButton = () => (
    <button
      type="button"
      className="action-button ghost"
      onClick={openCalendarModal}
    >
      Calendar
    </button>
  );

  const renderCalendar = () => (
    <>
      <div className="panel-header calendar-header">
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
        {(() => {
          const selectedCellIndex = calendar.cells.findIndex(
            (date) => date && toISODate(date) === selectedDate,
          );
          const selectedRowIndex =
            selectedCellIndex >= 0 ? Math.floor(selectedCellIndex / 7) : -1;

          return calendar.cells.map((date, index) => {
            const rowIndex = Math.floor(index / 7);
            const isWeekSelected =
              summaryRange === "week" && rowIndex === selectedRowIndex;

            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className={`calendar-cell empty ${isWeekSelected ? "week-highlight" : ""}`}
                />
              );
            }

            const iso = toISODate(date);
            const hasTasks =
              showTaskIndicators &&
              tasks.some((task) => occursOnDate(task, iso));
            const hasIncome =
              showFinanceIndicators &&
              financeEntries.some(
                (entry) => entry.type === "income" && occursOnDate(entry, iso),
              );
            const hasExpense =
              showFinanceIndicators &&
              financeEntries.some(
                (entry) => entry.type === "expense" && occursOnDate(entry, iso),
              );
            const hasGoalDeadline =
              showGoalIndicators &&
              goals.some((goal) => goal.targetDate === iso);
            const isDaySelected =
              summaryRange === "day" && iso === selectedDate;

            return (
              <button
                key={iso}
                type="button"
                className={`calendar-cell ${isDaySelected ? "selected" : ""} ${isWeekSelected ? "week-highlight" : ""}`}
                onClick={() => {
                  const clickedWeekStart = getWeekStartISO(iso);
                  const selectedWeekStart = getWeekStartISO(selectedDate);
                  setSelectedDate(iso);
                  if (summaryRange === "month" || summaryRange === "year") {
                    setSummaryRange("week");
                  } else if (
                    summaryRange === "week" &&
                    clickedWeekStart === selectedWeekStart
                  ) {
                    setSummaryRange("day");
                  }
                }}
              >
                <span>{date.getDate()}</span>
                <div className="calendar-dots">
                  {hasTasks && <span className="dot task" />}
                  {hasIncome && <span className="dot finance-income" />}
                  {hasExpense && <span className="dot finance-expense" />}
                  {hasGoalDeadline && <span className="dot goal" />}
                </div>
              </button>
            );
          });
        })()}
      </div>
      <div className="calendar-footer">
        <p>Selected: {selectedDate}</p>
        <div className="legend">
          {showTaskIndicators && (
            <span>
              <span className="dot task" /> Tasks
            </span>
          )}
          {showFinanceIndicators && (
            <>
              <span>
                <span className="dot finance-income" /> Income
              </span>
              <span>
                <span className="dot finance-expense" /> Expense
              </span>
            </>
          )}
          {showGoalIndicators && (
            <span>
              <span className="dot goal" /> Goal deadline
            </span>
          )}
        </div>
      </div>
    </>
  );

  const recurrenceOptions = [
    { value: "once", label: "One-time" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
    { value: "every-x-days", label: "Every X days" },
    { value: "every-x-weeks", label: "Every X weeks" },
    { value: "every-x-months", label: "Every X months" },
  ];

  const renderRecurrenceRow = ({
    typeValue,
    onTypeChange,
    intervalValue,
    onIntervalChange,
    isIntervalType,
    isDisabled = false,
    intervalPlaceholder,
  }) => (
    <div className="modal-row">
      <select
        value={typeValue}
        onChange={(event) => onTypeChange(event.target.value)}
        disabled={isDisabled}
      >
        {recurrenceOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isIntervalType && (
        <input
          type="number"
          min="1"
          value={intervalValue}
          onChange={(event) => onIntervalChange(event.target.value)}
          disabled={isDisabled}
          placeholder={intervalPlaceholder}
        />
      )}
    </div>
  );

  const renderFinanceAmountRow = ({
    typeValue,
    onTypeChange,
    anticipatedValue,
    onAnticipatedChange,
    actualValue,
    onActualChange,
  }) => (
    <div className="modal-row">
      <select
        value={typeValue}
        onChange={(event) => onTypeChange(event.target.value)}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <input
        type="number"
        placeholder="Anticipated"
        value={anticipatedValue}
        onChange={(event) => onAnticipatedChange(event.target.value)}
      />
      <input
        type="number"
        placeholder="Actual"
        value={actualValue}
        onChange={(event) => onActualChange(event.target.value)}
      />
    </div>
  );

  const renderTaskModalFields = (isNew) => {
    const recurrenceType = isNew
      ? newTaskRecurrenceType
      : taskDraft.recurrenceType;
    const recurrenceInterval = isNew
      ? newTaskRecurrenceInterval
      : taskDraft.recurrenceInterval;

    return (
      <>
        {!isNew && taskDraft.isRecurringInstance && (
          <p className="helper">
            Editing a recurring instance will create a one-time entry for
            {` ${selectedDate}`}
          </p>
        )}
        {isNew && <p className="helper">New task for {selectedDate}.</p>}
        <input
          type="text"
          placeholder={isNew ? "Task title" : undefined}
          value={isNew ? newTaskTitle : taskDraft.title}
          onChange={(event) =>
            isNew
              ? setNewTaskTitle(event.target.value)
              : setTaskDraft((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
          }
        />
        <input
          type="time"
          value={isNew ? newTaskTime : taskDraft.time}
          onChange={(event) =>
            isNew
              ? setNewTaskTime(event.target.value)
              : setTaskDraft((prev) => ({
                  ...prev,
                  time: event.target.value,
                }))
          }
        />
        {renderRecurrenceRow({
          typeValue: recurrenceType,
          onTypeChange: (value) =>
            isNew
              ? setNewTaskRecurrenceType(value)
              : setTaskDraft((prev) => ({
                  ...prev,
                  recurrenceType: value,
                })),
          intervalValue: recurrenceInterval,
          onIntervalChange: (value) =>
            isNew
              ? setNewTaskRecurrenceInterval(value)
              : setTaskDraft((prev) => ({
                  ...prev,
                  recurrenceInterval: value,
                })),
          isIntervalType: recurrenceType.startsWith("every-"),
          isDisabled: !isNew && taskDraft.isRecurringInstance,
          intervalPlaceholder: isNew ? "Interval" : undefined,
        })}
        {isNew && (
          <span className="helper">
            {formatRecurrence(
              buildRecurrence(newTaskRecurrenceType, newTaskRecurrenceInterval),
            )}
          </span>
        )}
      </>
    );
  };

  const renderGoalModalFields = (isNew) => (
    <>
      <input
        type="text"
        placeholder={isNew ? "Goal title" : undefined}
        value={isNew ? newGoalTitle : goalDraft.title}
        onChange={(event) =>
          isNew
            ? setNewGoalTitle(event.target.value)
            : setGoalDraft((prev) => ({
                ...prev,
                title: event.target.value,
              }))
        }
      />
      <input
        type="date"
        value={isNew ? newGoalStartDate : goalDraft.startDate}
        onChange={(event) =>
          isNew
            ? setNewGoalStartDate(event.target.value)
            : setGoalDraft((prev) => ({
                ...prev,
                startDate: event.target.value,
              }))
        }
      />
      <input
        type="date"
        value={isNew ? newGoalDate : goalDraft.targetDate}
        onChange={(event) =>
          isNew
            ? setNewGoalDate(event.target.value)
            : setGoalDraft((prev) => ({
                ...prev,
                targetDate: event.target.value,
              }))
        }
      />
      {!isNew && (
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
      )}
    </>
  );

  const renderFinanceModalFields = (isNew) => {
    const recurrenceType = isNew
      ? newFinanceRecurrenceType
      : financeDraft.recurrenceType;
    const recurrenceInterval = isNew
      ? newFinanceRecurrenceInterval
      : financeDraft.recurrenceInterval;

    return (
      <>
        {!isNew && financeDraft.isRecurringInstance && (
          <p className="helper">
            Editing a recurring instance will create a one-time entry for
            {` ${financeDraft.date}`}.
          </p>
        )}
        {isNew && <p className="helper">New entry for {selectedDate}.</p>}
        {renderFinanceAmountRow({
          typeValue: isNew ? newFinanceType : financeDraft.type,
          onTypeChange: (value) =>
            isNew
              ? setNewFinanceType(value)
              : setFinanceDraft((prev) => ({
                  ...prev,
                  type: value,
                })),
          anticipatedValue: isNew
            ? newFinanceAnticipated
            : financeDraft.anticipatedAmount,
          onAnticipatedChange: (value) =>
            isNew
              ? setNewFinanceAnticipated(value)
              : setFinanceDraft((prev) => ({
                  ...prev,
                  anticipatedAmount: value,
                })),
          actualValue: isNew ? newFinanceActual : financeDraft.actualAmount,
          onActualChange: (value) =>
            isNew
              ? setNewFinanceActual(value)
              : setFinanceDraft((prev) => ({
                  ...prev,
                  actualAmount: value,
                })),
        })}
        <input
          type="text"
          placeholder={isNew ? "Category" : undefined}
          value={isNew ? newFinanceCategory : financeDraft.category}
          onChange={(event) =>
            isNew
              ? setNewFinanceCategory(event.target.value)
              : setFinanceDraft((prev) => ({
                  ...prev,
                  category: event.target.value,
                }))
          }
        />
        <input
          type="text"
          placeholder="Description"
          value={isNew ? newFinanceDescription : financeDraft.description}
          onChange={(event) =>
            isNew
              ? setNewFinanceDescription(event.target.value)
              : setFinanceDraft((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
          }
        />
        {!isNew && (
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
        )}
        {renderRecurrenceRow({
          typeValue: recurrenceType,
          onTypeChange: (value) =>
            isNew
              ? setNewFinanceRecurrenceType(value)
              : setFinanceDraft((prev) => ({
                  ...prev,
                  recurrenceType: value,
                })),
          intervalValue: recurrenceInterval,
          onIntervalChange: (value) =>
            isNew
              ? setNewFinanceRecurrenceInterval(value)
              : setFinanceDraft((prev) => ({
                  ...prev,
                  recurrenceInterval: value,
                })),
          isIntervalType: recurrenceType.startsWith("every-"),
          isDisabled: !isNew && financeDraft.isRecurringInstance,
          intervalPlaceholder: isNew ? "Interval" : undefined,
        })}
        {isNew && (
          <span className="helper">
            {formatRecurrence(
              buildRecurrence(
                newFinanceRecurrenceType,
                newFinanceRecurrenceInterval,
              ),
            )}
          </span>
        )}
      </>
    );
  };

  return (
    <div className={`app-shell ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <aside className="sidebar" aria-label="Page navigation">
        <p className="sidebar-title">Navigate</p>
        <nav className="sidebar-nav" aria-label="Pages">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${activeTab === item.id ? "active" : ""}`}
              onClick={() => navigateTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="app">
        <header className="app-header">
          <div className="app-header-main">
            <button
              type="button"
              className="sidebar-toggle"
              aria-label="Open navigation"
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
            <div>
              <h1>
                <button
                  type="button"
                  className="app-title-nav"
                  onClick={() => navigateTo("main")}
                >
                  GYST
                </button>
              </h1>
            </div>
          </div>
        </header>

        <main
          className={`layout ${activeTab === "main" ? "main-layout" : ""} ${activeTab !== "main" ? "single" : ""}`}
        >
          {activeTab === "main" && (
            <section className="panel summary-panel">
              <div className="panel-header">
                <div>
                  <h2>Summary</h2>
                  <p>{summaryRangeLabel}</p>
                </div>
                {renderCalendarButton()}
              </div>
              <div className="summary-grid">
                <button
                  type="button"
                  className={`summary-card summary-nav ${activeTab === "goals" ? "active" : ""}`}
                  onClick={() => setActiveTab("goals")}
                >
                  <h3>Goals</h3>
                  <p>
                    {summaryGoals.length} in range • {goals.length} total
                  </p>
                  <ul>
                    {[...summaryGoals]
                      .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
                      .slice(0, 3)
                      .map((goal) => (
                        <li key={goal.id}>
                          {goal.title} • {goalStartDate(goal)} →{" "}
                          {goal.targetDate}
                        </li>
                      ))}
                    {summaryGoals.length === 0 && (
                      <li>No goal deadlines in range.</li>
                    )}
                  </ul>
                </button>
                <button
                  type="button"
                  className={`summary-card summary-nav ${activeTab === "tasks" ? "active" : ""}`}
                  onClick={() => setActiveTab("tasks")}
                >
                  <h3>Tasks</h3>
                  <p>
                    {summaryTaskEntries.length} total •{" "}
                    {summaryTaskEntries.filter((task) => task.completed).length}{" "}
                    done
                  </p>
                  <ul>
                    {summaryTaskEntries.slice(0, 3).map((task) => (
                      <li key={task.instanceId}>
                        {task.title} • {task.time} • {task.date}
                      </li>
                    ))}
                    {summaryTaskEntries.length === 0 && <li>No tasks.</li>}
                  </ul>
                </button>
                <button
                  type="button"
                  className={`summary-card summary-nav ${activeTab === "finance" ? "active" : ""}`}
                  onClick={() => setActiveTab("finance")}
                >
                  <h3>Finance</h3>
                  <p>
                    Income {formatCurrency(summaryFinanceTotals.income)} •
                    Expense {formatCurrency(summaryFinanceTotals.expense)}
                  </p>
                  <p>Net {formatCurrency(summaryFinanceTotals.net)}</p>
                  <ul>
                    {summaryFinanceEntries.slice(0, 3).map((entry) => (
                      <li key={entry.instanceId}>
                        {entry.category} • {entry.date} •{" "}
                        {formatCurrency(resolveFinanceAmount(entry))}
                      </li>
                    ))}
                    {summaryFinanceEntries.length === 0 && (
                      <li>No finance entries.</li>
                    )}
                  </ul>
                </button>
              </div>
            </section>
          )}
          {activeTab === "tasks" && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>To-do list</h2>
                  <p>{summaryRangeLabel}</p>
                </div>
                <div className="panel-header-actions">
                  {renderCalendarButton()}
                </div>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Active</h3>
                  <p>{taskSummaryStats.active}</p>
                </div>
                <div className="stat-card">
                  <h3>Complete</h3>
                  <p>{taskSummaryStats.complete}</p>
                </div>
                <div className="stat-card">
                  <h3>Progress</h3>
                  <p>{taskSummaryStats.completion}%</p>
                </div>
              </div>
              <ul className="task-list">
                {selectedTasks.length === 0 && (
                  <li className="empty-state">No tasks yet. Add one above.</li>
                )}
                {selectedTasks.map((task) => (
                  <li
                    key={task.instanceId}
                    className={task.completed ? "completed" : ""}
                    onClick={() => openDetailModal("task", task)}
                  >
                    <label onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => toggleTask(task)}
                      />
                      <span>{task.title}</span>
                    </label>
                    <div className="item-actions">
                      <span className="pill">{task.time}</span>
                      <span className="pill secondary">
                        {formatRecurrence(task.recurrence)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeTab === "goals" && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Goals</h2>
                  <p>{summaryRangeLabel}</p>
                </div>
                <div className="panel-header-actions">
                  {renderCalendarButton()}
                </div>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Active</h3>
                  <p>{goalSummaryStats.active}</p>
                </div>
                <div className="stat-card">
                  <h3>Complete</h3>
                  <p>{goalSummaryStats.complete}</p>
                </div>
                <div className="stat-card">
                  <h3>Progress</h3>
                  <p>{goalSummaryStats.completion}%</p>
                </div>
              </div>
              <div className="goal-list">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="goal-card"
                    onClick={() => openDetailModal("goal", goal)}
                  >
                    <div>
                      <h3>{goal.title}</h3>
                      <p>
                        {goalStartDate(goal)} → {goal.targetDate}
                      </p>
                    </div>
                    <div className="goal-progress">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          updateGoalProgress(goal.id, event.target.value)
                        }
                      />
                      <span>{goal.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "finance" && (
            <section className="panel finance-panel">
              <div className="panel-header">
                <div>
                  <h2>Finance</h2>
                  <p>{summaryRangeLabel}</p>
                </div>
                <div className="panel-header-actions">
                  {renderCalendarButton()}
                </div>
              </div>
              <div className="finance-cards stats-grid">
                <div className="stat-card">
                  <h3>Income</h3>
                  <p>{formatCurrency(summaryFinanceTotals.income)}</p>
                </div>
                <div className="stat-card">
                  <h3>Expenses</h3>
                  <p>{formatCurrency(summaryFinanceTotals.expense)}</p>
                </div>
                <div className="stat-card">
                  <h3>Net</h3>
                  <p>{formatCurrency(summaryFinanceTotals.net)}</p>
                </div>
              </div>
              <div className="finance-filters">
                <select
                  className="finance-filter-select"
                  aria-label="Recurrence filter"
                  value={financeTab}
                  onChange={(event) => setFinanceTab(event.target.value)}
                >
                  <option value="all">All recurrences</option>
                  <option value="one-time">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <select
                  className="finance-filter-select"
                  aria-label="Entry type filter"
                  value={financeTypeFilter}
                  onChange={(event) => setFinanceTypeFilter(event.target.value)}
                >
                  <option value="all">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <ul className="finance-list">
                {filteredFinanceEntries.length === 0 && (
                  <li className="empty-state">No entries for this tab.</li>
                )}
                {groupedFinanceListItems.map((item) => {
                  if (item.type === "group") {
                    return (
                      <li key={item.key} className="finance-group-header">
                        {item.label}
                      </li>
                    );
                  }

                  const { entry } = item;
                  const hasActualAmount =
                    entry.actualAmount !== null &&
                    entry.actualAmount !== undefined &&
                    Number(entry.actualAmount) !== 0;
                  const displayedAmount = hasActualAmount
                    ? Number(entry.actualAmount || 0)
                    : Number(entry.anticipatedAmount || 0);

                  return (
                    <li
                      key={item.key}
                      onClick={() => openDetailModal("finance", entry)}
                    >
                      <div className="finance-entry-main">
                        <strong>{entry.category}</strong>
                        <div className="finance-entry-meta">
                          <span>{entry.description || "No description"}</span>
                        </div>
                      </div>
                      <div className="item-actions finance-entry-actions">
                        <div className="finance-entry-row">
                          <strong className="finance-entry-date">
                            {formatDayOrdinal(entry.date)}
                          </strong>
                          <span className="pill secondary">
                            {formatRecurrence(entry.recurrence)}
                          </span>
                        </div>
                        <div className="finance-entry-row">
                          <span
                            className={
                              entry.type === "income" ? "income" : "expense"
                            }
                          >
                            {entry.type === "income" ? "+" : "-"}
                            {formatCurrency(displayedAmount)}
                          </span>
                          <span className="pill secondary">
                            {hasActualAmount ? "Actual" : "Estimate"}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </main>

        {["tasks", "goals", "finance"].includes(activeTab) &&
          !isCalendarOpen &&
          !editModal && (
            <button
              type="button"
              className="floating-add-button"
              aria-label={`New ${
                activeTab === "tasks"
                  ? "task"
                  : activeTab === "goals"
                    ? "goal"
                    : "finance entry"
              }`}
              onClick={() => {
                if (activeTab === "tasks") openNewTaskModal();
                if (activeTab === "goals") openNewGoalModal();
                if (activeTab === "finance") openNewFinanceModal();
              }}
            >
              +
            </button>
          )}

        {isCalendarOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal calendar-modal">
              <header className="modal-header">
                <h3>Calendar</h3>
                <button
                  type="button"
                  className="action-button ghost"
                  onClick={closeCalendarModal}
                >
                  Close
                </button>
              </header>
              <div className="modal-body calendar-modal-body">
                {renderSummaryRangeControls()}
                {renderCalendar()}
              </div>
            </div>
          </div>
        )}

        {detailModal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal">
              <header className="modal-header">
                <h3>
                  {detailModal.type === "task" && "Task details"}
                  {detailModal.type === "goal" && "Goal details"}
                  {detailModal.type === "finance" && "Finance details"}
                </h3>
                <button
                  type="button"
                  className="action-button ghost"
                  onClick={closeDetailModal}
                >
                  Close
                </button>
              </header>
              <div className="modal-body">
                {detailModal.type === "task" && (
                  <>
                    <strong>{detailModal.entity.title}</strong>
                    <span>Date: {detailModal.entity.date}</span>
                    <span>Time: {detailModal.entity.time}</span>
                    <span>
                      Status:{" "}
                      {detailModal.entity.completed ? "Complete" : "Active"}
                    </span>
                    <span>
                      Recurrence:{" "}
                      {formatRecurrence(detailModal.entity.recurrence)}
                    </span>
                  </>
                )}
                {detailModal.type === "goal" && (
                  <>
                    <strong>{detailModal.entity.title}</strong>
                    <span>Start: {goalStartDate(detailModal.entity)}</span>
                    <span>Target: {detailModal.entity.targetDate}</span>
                    <span>Progress: {detailModal.entity.progress}%</span>
                  </>
                )}
                {detailModal.type === "finance" && (
                  <>
                    <strong>{detailModal.entity.category}</strong>
                    <span>Date: {detailModal.entity.date}</span>
                    <span>
                      Description:{" "}
                      {detailModal.entity.description || "No description"}
                    </span>
                    <span>Type: {detailModal.entity.type}</span>
                    <span>
                      Recurrence:{" "}
                      {formatRecurrence(detailModal.entity.recurrence)}
                    </span>
                    <span>
                      Amount:{" "}
                      {formatCurrency(resolveFinanceAmount(detailModal.entity))}
                    </span>
                  </>
                )}
              </div>
              <div className="modal-actions">
                <div className="modal-actions-right">
                  <button
                    type="button"
                    className="action-button ghost"
                    onClick={closeDetailModal}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="action-button primary"
                    onClick={() => {
                      if (detailModal.type === "task") {
                        openTaskModal(detailModal.entity);
                      }
                      if (detailModal.type === "goal") {
                        openGoalModal(detailModal.entity);
                      }
                      if (detailModal.type === "finance") {
                        openFinanceModal(detailModal.entity);
                      }
                      closeDetailModal();
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editModal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal">
              <header className="modal-header">
                <h3>
                  {editModal.type === "task" && "Edit task"}
                  {editModal.type === "new-task" && "New task"}
                  {editModal.type === "goal" && "Edit goal"}
                  {editModal.type === "new-goal" && "New goal"}
                  {editModal.type === "finance" && "Edit finance entry"}
                  {editModal.type === "new-finance" && "New finance entry"}
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
                {editModal.type === "task" && renderTaskModalFields(false)}
                {editModal.type === "new-task" && renderTaskModalFields(true)}
                {editModal.type === "goal" && renderGoalModalFields(false)}
                {editModal.type === "new-goal" && renderGoalModalFields(true)}
                {editModal.type === "finance" &&
                  renderFinanceModalFields(false)}
                {editModal.type === "new-finance" &&
                  renderFinanceModalFields(true)}
              </div>
              <div className="modal-actions">
                {!(editModal.type || "").startsWith("new-") && (
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
                )}
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
                      if (editModal.type === "new-task") {
                        addTask();
                        closeModal();
                      }
                      if (editModal.type === "goal") saveGoal();
                      if (editModal.type === "new-goal") {
                        addGoal();
                        closeModal();
                      }
                      if (editModal.type === "finance") saveFinance();
                      if (editModal.type === "new-finance") {
                        addFinanceEntry();
                        closeModal();
                      }
                    }}
                  >
                    {(editModal.type || "").startsWith("new-")
                      ? "Create"
                      : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
