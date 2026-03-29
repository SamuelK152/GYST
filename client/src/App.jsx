import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import dayjs from 'dayjs';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Play,
  DollarSign,
  Save,
  RefreshCw,
  NotebookPen,
  FolderPlus
} from 'lucide-react';
import api from './lib/api';
import { todayKey } from './lib/dates';

const PRIORITIES = ['none', 'low', 'med', 'high', 'very_high'];
const WORK_TYPES = ['goal', 'project', 'milestone', 'task', 'subtask'];
const STATUSES = ['not_started', 'in_progress', 'blocked', 'done'];
const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function errorText(error) {
  if (!error) return 'Unknown error';
  const payload = error?.response?.data;
  if (payload?.details?.length) return payload.details.join(' � ');
  return payload?.error || error.message || 'Request failed';
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'UI crashed' };
  }

  componentDidCatch(error) {
    console.error('UI ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="center-screen">
          <div className="card" style={{ maxWidth: 600 }}>
            <h2>Something broke in the UI</h2>
            <p className="muted">{this.state.message}</p>
            <button className="primary" onClick={() => window.location.reload()}>
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type || 'info'}`}>
          <span>{toast.message}</span>
          <div className="row gap-sm center">
            {toast.actionLabel && (
              <button className="toast-action" onClick={() => toast.onAction?.(toast.id)}>
                {toast.actionLabel}
              </button>
            )}
            <button onClick={() => onDismiss(toast.id)}>�</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function IconLabel({ icon: Icon, text, size = 14 }) {
  return (
    <span className="icon-label">
      <Icon size={size} strokeWidth={2} />
      <span>{text}</span>
    </span>
  );
}

function EntryModal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="row between center modal-head">
          <h3>{title}</h3>
          <button className="ghost" onClick={onClose}><IconLabel icon={X} text="Close" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(path, { username, password });
      localStorage.setItem('lifeos_token', data.token);
      onAuth(data.user);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Life OS</h1>
        <p className="muted">Personal management system</p>

        <div className="segmented">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

function HomeDashboard({ dashboard, scoreDaily, scoreWeekly, scoreMonthly, onQuickAction }) {
  const summary = dashboard?.summary;

  return (
    <div className="grid dashboard-grid">
      <div className="card span-2">
        <div className="row between center wrap gap-sm">
          <h2>Today Summary ({dashboard?.today})</h2>
          <div className="row gap-sm wrap">
            {dashboard?.quickLinks?.map((link) => (
              <button key={link.key} className="ghost" onClick={() => onQuickAction(link.key)}>
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div className="row gap wrap mt-sm">
          <div className="metric-card">
            <span>Today Tasks</span>
            <strong>{summary?.tasks?.length || 0}</strong>
          </div>
          <div className="metric-card">
            <span>Top Goals</span>
            <strong>{summary?.topGoals?.length || 0}</strong>
          </div>
          <div className="metric-card">
            <span>Habit Completions</span>
            <strong>{summary?.habits?.filter((h) => h.completed).length || 0}</strong>
          </div>
          <div className="metric-card">
            <span>Budget Today</span>
            <strong>{formatCurrency(summary?.budgetSnapshot?.spentToday || 0)}</strong>
          </div>
          <div className="metric-card accent">
            <span>Today Score</span>
            <strong>{summary?.todayScore?.total || 0}</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Today Schedule</h3>
        <ul className="list dense">
          {(summary?.schedule || []).map((task) => (
            <li key={task._id}>
              <strong>{task.title}</strong>
              <small>
                {task.status} � {task.priority} � {task.dueDate ? dayjs(task.dueDate).format('h:mm A') : 'No due time'}
              </small>
            </li>
          ))}
          {!summary?.schedule?.length && <li className="muted">No scheduled tasks today.</li>}
        </ul>
      </div>

      <div className="card">
        <h3>Top Goals</h3>
        <ul className="list dense">
          {(summary?.topGoals || []).map((goal) => (
            <li key={goal._id}>
              <strong>{goal.title}</strong>
              <small>
                {goal.status} � {goal.progress || 0}%
              </small>
            </li>
          ))}
          {!summary?.topGoals?.length && <li className="muted">No goals yet.</li>}
        </ul>
      </div>

      <div className="card">
        <h3>Score Breakdown</h3>
        <div className="score-grid">
          <div>
            <span>Daily</span>
            <strong>{scoreDaily?.total || 0}</strong>
          </div>
          <div>
            <span>Weekly</span>
            <strong>{scoreWeekly?.total || 0}</strong>
          </div>
          <div>
            <span>Monthly</span>
            <strong>{scoreMonthly?.total || 0}</strong>
          </div>
        </div>

        <ul className="list dense mt-sm">
          {Object.entries(scoreDaily?.breakdown || {}).map(([type, points]) => (
            <li key={type} className="row between">
              <span>{type.replace(/_/g, ' ')}</span>
              <strong>{points}</strong>
            </li>
          ))}
          {!Object.keys(scoreDaily?.breakdown || {}).length && <li className="muted">No score events today.</li>}
        </ul>
      </div>

      <div className="card span-2">
        <h3>In-App Alerts</h3>
        <ul className="list dense">
          {(dashboard?.alerts || []).map((alert, idx) => (
            <li key={`${alert.type}-${idx}`}>
              <strong>{alert.type.replace(/_/g, ' ')}</strong>
              <small>{alert.message || alert.count || alert.amount || 'Triggered'}</small>
            </li>
          ))}
          {!dashboard?.alerts?.length && <li className="muted">No alerts right now.</li>}
        </ul>
      </div>
    </div>
  );
}

function DependencyPicker({ itemId, selectedDependencies, onChange }) {
  const [candidates, setCandidates] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get('/work/dependency-candidates', { params: { itemId } });
        if (!ignore) setCandidates(data || []);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [itemId]);

  const selectedSet = new Set(selectedDependencies.map((d) => d.blockedByItemId));
  const filtered = candidates.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

  function toggle(id) {
    if (selectedSet.has(id)) {
      onChange(selectedDependencies.filter((d) => d.blockedByItemId !== id));
    } else {
      onChange([...selectedDependencies, { blockedByItemId: id }]);
    }
  }

  return (
    <div className="dep-picker">
      <div className="row between center">
        <strong>Dependencies (blocked by)</strong>
        {loading && <small className="muted">Loading�</small>}
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items" />
      <div className="dep-list">
        {filtered.slice(0, 80).map((candidate) => (
          <label key={candidate._id} className="check-inline dep-row">
            <input
              type="checkbox"
              checked={selectedSet.has(candidate._id)}
              onChange={() => toggle(candidate._id)}
            />
            <span>
              {candidate.title} <small className="muted">({candidate.type} � {candidate.status})</small>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function DailyPlanner({ items, reloadItems, toast, setGlobalBusy }) {
  const today = todayKey();
  const [dragId, setDragId] = useState(null);

  const taskCandidates = items.filter((i) => i.type === 'task' || i.type === 'subtask');
  const planned = taskCandidates.filter((i) => i.plannedDate === today);
  const backlog = taskCandidates.filter((i) => i.plannedDate !== today);

  async function setPlanned(itemId, plannedDate) {
    try {
      setGlobalBusy(`Moving task�`);
      await api.patch(`/work/items/${itemId}/plan`, { plannedDate });
      toast(`Task moved to ${plannedDate ? 'Today' : 'Backlog'}.`, 'success');
      reloadItems();
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  function DropZone({ title, acceptsToday, rows }) {
    return (
      <div
        className="planner-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          const itemId = dragId || e.dataTransfer.getData('text/plain');
          if (!itemId) return;
          await setPlanned(itemId, acceptsToday ? today : null);
          setDragId(null);
        }}
      >
        <h4>{title}</h4>
        {rows.map((item) => (
          <div
            key={item._id}
            draggable
            onDragStart={(e) => {
              setDragId(item._id);
              e.dataTransfer.setData('text/plain', item._id);
            }}
            className={`planner-item ${item.dependencyState?.blocked ? 'blocked' : ''}`}
          >
            <strong>{item.title}</strong>
            <small>
              {item.priority} � {item.status}
              {item.dependencyState?.blocked ? ` � blocked by ${item.dependencyState.unresolved}` : ''}
            </small>
          </div>
        ))}
        {!rows.length && <p className="muted">Drop tasks here</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Daily Planning (Drag & Drop)</h3>
      <p className="muted">Drag tasks between Backlog and Today.</p>
      <div className="planner-grid">
        <DropZone title="Backlog" acceptsToday={false} rows={backlog} />
        <DropZone title={`Today (${today})`} acceptsToday rows={planned} />
      </div>
    </div>
  );
}

function WorkSection({ items, reloadItems, toast, setGlobalBusy, saveWorkItem, deleteWorkItem }) {
  const [form, setForm] = useState({
    editId: '',
    type: 'task',
    title: '',
    status: 'not_started',
    priority: 'none',
    dueDate: '',
    estimatedMinutes: '',
    notes: '',
    goalId: '',
    projectId: '',
    parentTaskId: '',
    recurrenceFrequency: 'weekly',
    recurrenceInterval: 1,
    plannedDate: '',
    dependencies: []
  });
  const [view, setView] = useState('kanban');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [workModalOpen, setWorkModalOpen] = useState(false);

  async function createItem(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setGlobalBusy('Saving item�');
      const payload = {
        type: form.type,
        title: form.title,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
        notes: form.notes,
        goalId: form.goalId || undefined,
        projectId: form.projectId || undefined,
        parentTaskId: form.parentTaskId || undefined,
        plannedDate: form.plannedDate || undefined,
        dependencies: form.dependencies
      };

      if (form.type === 'task' || form.type === 'subtask') {
        payload.recurrence = {
          frequency: form.recurrenceFrequency,
          interval: Number(form.recurrenceInterval) || 1
        };
      }

      if (form.editId) {
        await saveWorkItem(form.editId, payload);
        toast('Item updated.', 'success');
      } else {
        await api.post('/work/items', payload);
        toast('Item saved.', 'success');
      }
      setForm((prev) => ({ ...prev, editId: '', title: '', notes: '', estimatedMinutes: '', dueDate: '', dependencies: [] }));
      setMessage('Item saved.');
      setWorkModalOpen(false);
      reloadItems();
    } catch (err) {
      const msg = errorText(err);
      setError(msg);
      toast(msg, 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function updateStatus(item, status) {
    setError('');
    try {
      setGlobalBusy('Updating status�');
      const { data } = await api.patch(`/work/items/${item._id}`, { status });
      if (data?.completionPrompt?.show) {
        setMessage(data.completionPrompt.message);
        toast(data.completionPrompt.message, 'info');
      } else {
        setMessage('Item updated.');
        toast('Status updated.', 'success');
      }
      reloadItems();
    } catch (err) {
      const msg = errorText(err);
      setError(msg);
      toast(msg, 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function saveDependencies(item, dependencies) {
    setError('');
    try {
      setGlobalBusy('Saving dependencies�');
      await saveWorkItem(item._id, { dependencies });
      setMessage('Dependencies updated.');
      toast('Dependencies saved.', 'success');
      reloadItems();
    } catch (err) {
      const msg = errorText(err);
      setError(msg);
      toast(msg, 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function deleteItem(id) {
    setError('');
    const snapshot = items.find((x) => x._id === id);

    try {
      setGlobalBusy('Deleting item�');
      await deleteWorkItem(id);

      toast('Item deleted.', 'success', {
        actionLabel: 'Undo',
        onAction: async () => {
          if (!snapshot) return;
          try {
            setGlobalBusy('Restoring item�');
            const payload = {
              type: snapshot.type,
              title: snapshot.title,
              description: snapshot.description,
              status: snapshot.status,
              priority: snapshot.priority,
              dueDate: snapshot.dueDate,
              estimatedMinutes: snapshot.estimatedMinutes,
              notes: snapshot.notes,
              recurrence: snapshot.recurrence,
              dependencies: snapshot.dependencies,
              goalId: snapshot.goalId,
              projectId: snapshot.projectId,
              parentTaskId: snapshot.parentTaskId,
              plannedDate: snapshot.plannedDate,
              progress: snapshot.progress
            };
            await api.post('/work/items', payload);
            reloadItems();
            toast('Item restored.', 'info');
          } catch (err) {
            toast(errorText(err), 'error');
          } finally {
            setGlobalBusy('');
          }
        }
      });
    } catch (err) {
      const msg = errorText(err);
      setError(msg);
      toast(msg, 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function moveKanban(itemId, targetStatus) {
    try {
      setGlobalBusy('Moving card�');
      await saveWorkItem(itemId, { status: targetStatus });
      toast('Card moved.', 'success');
      reloadItems();
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  const grouped = useMemo(() => {
    const map = { not_started: [], in_progress: [], blocked: [], done: [] };
    items.forEach((item) => {
      map[item.status]?.push(item);
    });
    return map;
  }, [items]);

  const tasksOnly = items.filter((i) => i.type === 'task' || i.type === 'subtask');

  return (
    <div className="grid">
      <DailyPlanner items={items} reloadItems={reloadItems} toast={toast} setGlobalBusy={setGlobalBusy} />

      <div className="grid two-col">
        <div className="card">
          <div className="row between center">
            <h2>Work Items</h2>
            <button
              className="primary"
              onClick={() => {
                setForm((prev) => ({ ...prev, editId: '', title: '', notes: '' }));
                setWorkModalOpen(true);
              }}
            >
              New Entry
            </button>
          </div>

          <EntryModal
            open={workModalOpen}
            title={form.editId ? 'Edit Work Item' : 'New Work Item'}
            onClose={() => setWorkModalOpen(false)}
          >
          <form className="form-grid" onSubmit={createItem}>
            <label>
              Type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {WORK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due Date
              <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </label>
            <label>
              Time Estimate (min)
              <input
                type="number"
                min="0"
                value={form.estimatedMinutes}
                onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              />
            </label>
            <label>
              Goal ID (optional)
              <input value={form.goalId} onChange={(e) => setForm({ ...form, goalId: e.target.value })} />
            </label>
            <label>
              Project ID (optional)
              <input value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
            </label>
            <label>
              Parent Task ID (optional)
              <input value={form.parentTaskId} onChange={(e) => setForm({ ...form, parentTaskId: e.target.value })} />
            </label>
            <label>
              Planned Day
              <input type="date" value={form.plannedDate} onChange={(e) => setForm({ ...form, plannedDate: e.target.value })} />
            </label>

            {(form.type === 'task' || form.type === 'subtask') && (
              <>
                <label>
                  Recurrence
                  <select
                    value={form.recurrenceFrequency}
                    onChange={(e) => setForm({ ...form, recurrenceFrequency: e.target.value })}
                  >
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                  </select>
                </label>
                <label>
                  Recurrence Interval
                  <input
                    type="number"
                    min="1"
                    value={form.recurrenceInterval}
                    onChange={(e) => setForm({ ...form, recurrenceInterval: e.target.value })}
                  />
                </label>
              </>
            )}

            <label className="span-2">
              Notes
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>

            <div className="span-2">
              <DependencyPicker
                itemId={null}
                selectedDependencies={form.dependencies}
                onChange={(dependencies) => setForm((prev) => ({ ...prev, dependencies }))}
              />
            </div>

            <div className="span-2 row between center">
              <button className="primary" type="submit">
                {form.editId ? 'Save Changes' : 'Save Item'}
              </button>
              {form.editId && (
                <button
                  type="button"
                  className="tiny danger"
                  onClick={async () => {
                    try {
                      setGlobalBusy('Deleting item�');
                      await deleteItem(form.editId);
                      setWorkModalOpen(false);
                      setForm((prev) => ({ ...prev, editId: '', title: '', notes: '' }));
                    } catch (_err) {
                      // handled in deleteItem
                    } finally {
                      setGlobalBusy('');
                    }
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </form>
          </EntryModal>
          {message && <p className="success mt-sm">{message}</p>}
          {error && <p className="error mt-sm">{error}</p>}
        </div>

        <div className="card">
          <div className="row between center wrap gap-sm">
            <h2>Execution Views</h2>
            <div className="segmented">
              <button type="button" className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>
                Kanban
              </button>
              <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
                List
              </button>
              <button type="button" className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
                Calendar
              </button>
            </div>
          </div>

          {view === 'kanban' && (
            <div className="kanban">
              {STATUSES.map((status) => (
                <div
                  key={status}
                  className="kanban-col"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const itemId = e.dataTransfer.getData('kanban-item-id');
                    if (!itemId) return;
                    await moveKanban(itemId, status);
                  }}
                >
                  <h4>{status.replace('_', ' ')}</h4>
                  {(grouped[status] || []).map((item) => (
                    <div
                      key={item._id}
                      className={`kanban-card ${item.dependencyState?.blocked ? 'blocked' : ''}`}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('kanban-item-id', item._id)}
                    >
                      <strong>{item.title}</strong>
                      <small>
                        {item.type} � {item.priority}
                        {item.dependencyState?.blocked ? ` � blocked by ${item.dependencyState.unresolved}` : ''}
                      </small>

                      {!!item.dependencyState?.blockers?.length && (
                        <div className="tiny-badges">
                          {item.dependencyState.blockers.slice(0, 2).map((b) => (
                            <span key={b.id} className="badge">
                              {b.title}
                            </span>
                          ))}
                        </div>
                      )}

                      <details>
                        <summary className="tiny-link">Edit dependencies</summary>
                        <DependencyEditor item={item} onSave={saveDependencies} />
                      </details>

                      <div className="row gap-sm mt-sm wrap">
                        {STATUSES.filter((s) => s !== item.status).map((nextStatus) => (
                          <button key={nextStatus} className="tiny" onClick={() => updateStatus(item, nextStatus)}>
                            {nextStatus}
                          </button>
                        ))}
                        <button className="tiny danger" onClick={() => deleteItem(item._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {view === 'list' && (
            <table className="table mt-sm">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Dependencies</th>
                  <th>Priority</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.title}</td>
                    <td>{item.type}</td>
                    <td>{item.status}</td>
                    <td>{item.dependencyState?.unresolved || 0}</td>
                    <td>{item.priority}</td>
                    <td>{item.dueDate ? dayjs(item.dueDate).format('MMM D, YYYY h:mm A') : '-'}</td>
                    <td>
                      <button
                        className="tiny"
                        onClick={() => {
                          setForm({
                            editId: item._id,
                            type: item.type,
                            title: item.title,
                            status: item.status,
                            priority: item.priority,
                            dueDate: item.dueDate ? dayjs(item.dueDate).format('YYYY-MM-DDTHH:mm') : '',
                            estimatedMinutes: item.estimatedMinutes || '',
                            notes: item.notes || '',
                            goalId: item.goalId || '',
                            projectId: item.projectId || '',
                            parentTaskId: item.parentTaskId || '',
                            recurrenceFrequency: item.recurrence?.frequency || 'weekly',
                            recurrenceInterval: item.recurrence?.interval || 1,
                            plannedDate: item.plannedDate || '',
                            dependencies: item.dependencies || []
                          });
                          setWorkModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {view === 'calendar' && (
            <div className="list mt-sm">
              {tasksOnly
                .filter((i) => i.dueDate)
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .map((item) => (
                  <div key={item._id} className="list-item">
                    <strong>{dayjs(item.dueDate).format('ddd, MMM D')}</strong>
                    <span>
                      {item.title} � {item.status} � {item.priority}
                    </span>
                  </div>
                ))}
              {!tasksOnly.some((i) => i.dueDate) && <p className="muted">No dated tasks yet.</p>}
            </div>
          )}
        </div>
      </div>

      <DependencyGraph items={items} />
    </div>
  );
}

function DependencyEditor({ item, onSave }) {
  const [deps, setDeps] = useState(item.dependencies || []);
  return (
    <div className="dep-editor">
      <DependencyPicker itemId={item._id} selectedDependencies={deps} onChange={setDeps} />
      <button className="tiny" onClick={() => onSave(item, deps)}>
        Save dependencies
      </button>
    </div>
  );
}

function DependencyGraph({ items }) {
  const taskItems = items.filter((i) => i.type === 'task' || i.type === 'subtask' || i.type === 'project' || i.type === 'goal');
  const itemMap = new Map(taskItems.map((i) => [i._id, i]));

  const edges = [];
  taskItems.forEach((item) => {
    (item.dependencies || []).forEach((dep) => {
      const blocker = itemMap.get(dep.blockedByItemId);
      if (blocker) {
        edges.push({ from: blocker, to: item });
      }
    });
  });

  return (
    <div className="card">
      <h3>Dependency Graph (focused)</h3>
      <p className="muted">Shows blocked-by relationships across goals/projects/tasks/subtasks.</p>
      <div className="dep-graph">
        {edges.slice(0, 120).map((edge, idx) => (
          <div key={`${edge.from._id}-${edge.to._id}-${idx}`} className="dep-edge">
            <span className="from">{edge.from.title}</span>
            <span className="arrow">?</span>
            <span className={`to ${edge.to.status === 'blocked' ? 'blocked' : ''}`}>{edge.to.title}</span>
          </div>
        ))}
        {!edges.length && <p className="muted">No dependency edges yet.</p>}
      </div>
    </div>
  );
}

function FinanceSection({ analytics, reloadFinance, toast, setGlobalBusy }) {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [debts, setDebts] = useState([]);
  const [error, setError] = useState('');
  const [financeModal, setFinanceModal] = useState({ open: false, type: 'transaction' });

  const [txForm, setTxForm] = useState({
    editId: '',
    accountId: '',
    type: 'expense',
    amount: '',
    category: '',
    occurredAt: dayjs().format('YYYY-MM-DDTHH:mm')
  });
  const [budgetForm, setBudgetForm] = useState({
    editId: '',
    cadence: 'monthly',
    category: 'General',
    amount: '',
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD')
  });
  const [recurringForm, setRecurringForm] = useState({
    editId: '',
    name: '',
    accountId: '',
    type: 'expense',
    amount: '',
    category: '',
    frequency: 'monthly',
    interval: 1,
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: '',
    linkedDebtId: ''
  });
  const [debtForm, setDebtForm] = useState({
    editId: '',
    name: '',
    lender: '',
    originalAmount: '',
    currentBalance: '',
    apr: '',
    minimumPayment: '',
    dueDay: 1,
    notes: ''
  });
  const [debtPaymentForm, setDebtPaymentForm] = useState({ debtId: '', amount: '', principal: '', interest: '', note: '' });

  function openModal(type) {
    setFinanceModal({ open: true, type });
  }

  function closeModal() {
    setFinanceModal((prev) => ({ ...prev, open: false }));
  }

  async function loadMeta() {
    const [accountsRes, txRes, budgetsRes, recurringRes, debtRes] = await Promise.all([
      api.get('/finance/accounts'),
      api.get('/finance/transactions'),
      api.get('/finance/budgets'),
      api.get('/finance/recurring'),
      api.get('/finance/debts')
    ]);

    setAccounts(accountsRes.data || []);
    setTransactions(txRes.data || []);
    setBudgets(budgetsRes.data || []);
    setRecurring(recurringRes.data || []);
    setDebts(debtRes.data || []);

    if (!txForm.accountId && accountsRes.data?.length) {
      setTxForm((prev) => ({ ...prev, accountId: accountsRes.data[0]._id }));
    }
    if (!recurringForm.accountId && accountsRes.data?.length) {
      setRecurringForm((prev) => ({ ...prev, accountId: accountsRes.data[0]._id }));
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setGlobalBusy('Loading finance metadata...');
        await loadMeta();
      } catch (err) {
        const msg = errorText(err);
        setError(msg);
        toast(msg, 'error');
      } finally {
        setGlobalBusy('');
      }
    })();
  }, []);

  async function createAccount(e) {
    e.preventDefault();
    const input = prompt('Account name');
    if (!input) return;
    try {
      setGlobalBusy('Creating account...');
      await api.post('/finance/accounts', { name: input.trim() });
      await loadMeta();
      toast('Account created.', 'success');
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function renameAccount(id, name) {
    const next = prompt('Rename account', name);
    if (!next) return;
    try {
      setGlobalBusy('Renaming account...');
      await api.patch(`/finance/accounts/${id}`, { name: next });
      await loadMeta();
      toast('Account renamed.', 'success');
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function saveTransaction(e) {
    e.preventDefault();
    const payload = {
      accountId: txForm.accountId,
      type: txForm.type,
      amount: Number(txForm.amount),
      category: txForm.category,
      occurredAt: new Date(txForm.occurredAt).toISOString()
    };

    try {
      setGlobalBusy('Saving transaction...');
      if (txForm.editId) {
        await api.patch(`/finance/transactions/${txForm.editId}`, payload);
        toast('Transaction updated.', 'success');
      } else {
        await api.post('/finance/transactions', payload);
        toast('Transaction created.', 'success');
      }
      setTxForm((prev) => ({ ...prev, editId: '', amount: '', category: '' }));
      closeModal();
      await loadMeta();
      reloadFinance();
    } catch (err) {
      setError(errorText(err));
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function deleteTransaction() {
    if (!txForm.editId) return;
    try {
      setGlobalBusy('Deleting transaction...');
      await api.delete(`/finance/transactions/${txForm.editId}`);
      setTxForm((prev) => ({ ...prev, editId: '', amount: '', category: '' }));
      closeModal();
      await loadMeta();
      reloadFinance();
      toast('Transaction deleted.', 'success');
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function saveBudget(e) {
    e.preventDefault();
    const payload = {
      cadence: budgetForm.cadence,
      category: budgetForm.category,
      amount: Number(budgetForm.amount),
      startDate: new Date(`${budgetForm.startDate}T00:00:00Z`).toISOString(),
      endDate: new Date(`${budgetForm.endDate}T23:59:59Z`).toISOString()
    };

    try {
      setGlobalBusy('Saving budget...');
      if (budgetForm.editId) {
        await api.patch(`/finance/budgets/${budgetForm.editId}`, payload);
        toast('Budget updated.', 'success');
      } else {
        await api.post('/finance/budgets', payload);
        toast('Budget created.', 'success');
      }
      setBudgetForm((prev) => ({ ...prev, editId: '', amount: '' }));
      closeModal();
      await loadMeta();
      reloadFinance();
    } catch (err) {
      setError(errorText(err));
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function deleteBudget() {
    if (!budgetForm.editId) return;
    try {
      setGlobalBusy('Deleting budget...');
      await api.delete(`/finance/budgets/${budgetForm.editId}`);
      setBudgetForm((prev) => ({ ...prev, editId: '', amount: '' }));
      closeModal();
      await loadMeta();
      reloadFinance();
      toast('Budget deleted.', 'success');
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function saveRecurring(e) {
    e.preventDefault();
    const payload = {
      name: recurringForm.name,
      accountId: recurringForm.accountId,
      type: recurringForm.type,
      amount: Number(recurringForm.amount),
      category: recurringForm.category,
      frequency: recurringForm.frequency,
      interval: Number(recurringForm.interval || 1),
      startDate: new Date(`${recurringForm.startDate}T00:00:00Z`).toISOString(),
      endDate: recurringForm.endDate ? new Date(`${recurringForm.endDate}T23:59:59Z`).toISOString() : null,
      linkedDebtId: recurringForm.linkedDebtId || null
    };

    try {
      setGlobalBusy('Saving recurring transaction...');
      if (recurringForm.editId) {
        await api.patch(`/finance/recurring/${recurringForm.editId}`, payload);
        toast('Recurring updated.', 'success');
      } else {
        await api.post('/finance/recurring', payload);
        toast('Recurring created.', 'success');
      }
      setRecurringForm((prev) => ({ ...prev, editId: '', name: '', amount: '', category: '', linkedDebtId: '' }));
      closeModal();
      await loadMeta();
    } catch (err) {
      setError(errorText(err));
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function deleteRecurring() {
    if (!recurringForm.editId) return;
    try {
      setGlobalBusy('Deleting recurring...');
      await api.delete(`/finance/recurring/${recurringForm.editId}`);
      setRecurringForm((prev) => ({ ...prev, editId: '', name: '', amount: '', category: '' }));
      closeModal();
      await loadMeta();
      toast('Recurring deleted.', 'success');
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function saveDebt(e) {
    e.preventDefault();
    const payload = {
      name: debtForm.name,
      lender: debtForm.lender,
      originalAmount: Number(debtForm.originalAmount),
      currentBalance: debtForm.currentBalance ? Number(debtForm.currentBalance) : Number(debtForm.originalAmount),
      apr: Number(debtForm.apr || 0),
      minimumPayment: Number(debtForm.minimumPayment || 0),
      dueDay: Number(debtForm.dueDay || 1),
      notes: debtForm.notes
    };

    try {
      setGlobalBusy('Saving debt...');
      if (debtForm.editId) {
        await api.patch(`/finance/debts/${debtForm.editId}`, payload);
        toast('Debt updated.', 'success');
      } else {
        await api.post('/finance/debts', payload);
        toast('Debt created.', 'success');
      }
      setDebtForm({ editId: '', name: '', lender: '', originalAmount: '', currentBalance: '', apr: '', minimumPayment: '', dueDay: 1, notes: '' });
      closeModal();
      await loadMeta();
    } catch (err) {
      setError(errorText(err));
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function deleteDebt() {
    if (!debtForm.editId) return;
    try {
      setGlobalBusy('Deleting debt...');
      await api.delete(`/finance/debts/${debtForm.editId}`);
      setDebtForm({ editId: '', name: '', lender: '', originalAmount: '', currentBalance: '', apr: '', minimumPayment: '', dueDay: 1, notes: '' });
      closeModal();
      await loadMeta();
      toast('Debt deleted.', 'success');
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function logDebtPayment(e) {
    e.preventDefault();
    if (!debtPaymentForm.debtId) return;

    try {
      setGlobalBusy('Logging debt payment...');
      await api.post(`/finance/debts/${debtPaymentForm.debtId}/payments`, {
        amount: Number(debtPaymentForm.amount),
        principal: debtPaymentForm.principal ? Number(debtPaymentForm.principal) : Number(debtPaymentForm.amount),
        interest: Number(debtPaymentForm.interest || 0),
        note: debtPaymentForm.note
      });
      setDebtPaymentForm((prev) => ({ ...prev, amount: '', principal: '', interest: '', note: '' }));
      closeModal();
      await loadMeta();
      toast('Debt payment logged.', 'success');
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  return (
    <div className="grid two-col">
      <div className="card">
        <div className="row between center wrap gap-sm">
          <h2>Finance Entries</h2>
          <div className="row gap-sm wrap">
            <button className="primary" onClick={() => openModal('transaction')}><IconLabel icon={Plus} text="New Transaction" /></button>
            <button className="primary" onClick={() => openModal('budget')}><IconLabel icon={Plus} text="New Budget" /></button>
            <button className="primary" onClick={() => openModal('recurring')}><IconLabel icon={Plus} text="New Recurring" /></button>
            <button className="primary" onClick={() => openModal('debt')}><IconLabel icon={FolderPlus} text="New Debt" /></button>
            <button className="ghost" onClick={() => openModal('debtPayment')}><IconLabel icon={DollarSign} text="Log Debt Payment" /></button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <h3>Accounts</h3>
        <ul className="list dense">
          {accounts.map((acc) => (
            <li key={acc._id} className="row between center">
              <span><strong>{acc.name}</strong> {acc.isDefault ? '(default)' : ''}</span>
              <button className="tiny" onClick={() => renameAccount(acc._id, acc.name)}>Rename</button>
            </li>
          ))}
        </ul>
        <button className="tiny mt-sm" onClick={createAccount}>Add Account</button>

        <h3 className="mt-lg">Transactions</h3>
        <ul className="list dense">
          {transactions.slice(0, 20).map((tx) => (
            <li key={tx._id} className="row between center">
              <span>
                <strong>{tx.category}</strong> • {tx.type} • {formatCurrency(tx.amount)} • {dayjs(tx.occurredAt).format('MMM D, YYYY')}
              </span>
              <button
                className="tiny"
                onClick={() => {
                  setTxForm({
                    editId: tx._id,
                    accountId: tx.accountId,
                    type: tx.type,
                    amount: String(tx.amount),
                    category: tx.category,
                    occurredAt: dayjs(tx.occurredAt).format('YYYY-MM-DDTHH:mm')
                  });
                  openModal('transaction');
                }}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>

        <h3 className="mt-lg">Budgets</h3>
        <ul className="list dense">
          {budgets.map((b) => (
            <li key={b._id} className="row between center">
              <span><strong>{b.category}</strong> ? {b.cadence} ? {formatCurrency(b.amount)}</span>
              <button
                className="tiny"
                onClick={() => {
                  setBudgetForm({
                    editId: b._id,
                    cadence: b.cadence,
                    category: b.category,
                    amount: String(b.amount),
                    startDate: dayjs(b.startDate).format('YYYY-MM-DD'),
                    endDate: dayjs(b.endDate).format('YYYY-MM-DD')
                  });
                  openModal('budget');
                }}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>

        <h3 className="mt-lg">Recurring</h3>
        <div className="row gap-sm">
          <button className="tiny" onClick={async () => {
            try {
              setGlobalBusy('Running due recurring transactions...');
              const { data } = await api.post('/finance/recurring/run-due');
              await loadMeta();
              reloadFinance();
              toast(`Processed ${data.createdCount || 0} due recurring transactions.`, 'success');
            } catch (err) {
              toast(errorText(err), 'error');
            } finally {
              setGlobalBusy('');
            }
          }}> Run Due Now</button>
        </div>
        <ul className="list dense mt-sm">
          {recurring.map((r) => (
            <li key={r._id} className="row between center">
              <span><strong>{r.name}</strong> ? {r.type} ? {formatCurrency(r.amount)} ? {r.frequency} ? next {dayjs(r.nextRunDate).format('MMM D')}</span>
              <button
                className="tiny"
                onClick={() => {
                  setRecurringForm({
                    editId: r._id,
                    name: r.name,
                    accountId: r.accountId,
                    type: r.type,
                    amount: String(r.amount),
                    category: r.category,
                    frequency: r.frequency,
                    interval: r.interval || 1,
                    startDate: dayjs(r.startDate).format('YYYY-MM-DD'),
                    endDate: r.endDate ? dayjs(r.endDate).format('YYYY-MM-DD') : '',
                    linkedDebtId: r.linkedDebtId || ''
                  });
                  openModal('recurring');
                }}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>

        <h3 className="mt-lg">Debts</h3>
        <ul className="list dense">
          {debts.map((d) => (
            <li key={d._id} className="row between center">
              <span><strong>{d.name}</strong> ? balance {formatCurrency(d.currentBalance)} / {formatCurrency(d.originalAmount)} ? APR {d.apr || 0}%</span>
              <button
                className="tiny"
                onClick={() => {
                  setDebtForm({
                    editId: d._id,
                    name: d.name,
                    lender: d.lender || '',
                    originalAmount: String(d.originalAmount || 0),
                    currentBalance: String(d.currentBalance || 0),
                    apr: String(d.apr || 0),
                    minimumPayment: String(d.minimumPayment || 0),
                    dueDay: d.dueDay || 1,
                    notes: d.notes || ''
                  });
                  openModal('debt');
                }}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>

        <EntryModal open={financeModal.open} title={`Finance: ${financeModal.type}`} onClose={closeModal}>
          {financeModal.type === 'transaction' && (
            <form className="form-grid" onSubmit={saveTransaction}>
              <label>Account<select value={txForm.accountId} onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })} required>{accounts.map((acc) => <option key={acc._id} value={acc._id}>{acc.name}</option>)}</select></label>
              <label>Type<select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select></label>
              <label>Amount<input type="number" min="0" step="0.01" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} required /></label>
              <label>Category<input value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })} required /></label>
              <label className="span-2">Date/Time<input type="datetime-local" value={txForm.occurredAt} onChange={(e) => setTxForm({ ...txForm, occurredAt: e.target.value })} required /></label>
              <div className="span-2 row between center">
                <button className="primary" type="submit">{txForm.editId ? 'Save Changes' : 'Save Transaction'}</button>
                {txForm.editId && <button type="button" className="tiny danger" onClick={deleteTransaction}><IconLabel icon={Trash2} text="Delete" /></button>}
              </div>
            </form>
          )}

          {financeModal.type === 'budget' && (
            <form className="form-grid" onSubmit={saveBudget}>
              <label>Cadence<select value={budgetForm.cadence} onChange={(e) => setBudgetForm({ ...budgetForm, cadence: e.target.value })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
              <label>Category<input value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })} required /></label>
              <label>Amount<input type="number" min="0" step="0.01" value={budgetForm.amount} onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })} required /></label>
              <label>Start<input type="date" value={budgetForm.startDate} onChange={(e) => setBudgetForm({ ...budgetForm, startDate: e.target.value })} required /></label>
              <label>End<input type="date" value={budgetForm.endDate} onChange={(e) => setBudgetForm({ ...budgetForm, endDate: e.target.value })} required /></label>
              <div className="span-2 row between center">
                <button className="primary" type="submit">{budgetForm.editId ? 'Save Changes' : 'Save Budget'}</button>
                {budgetForm.editId && <button type="button" className="tiny danger" onClick={deleteBudget}><IconLabel icon={Trash2} text="Delete" /></button>}
              </div>
            </form>
          )}

          {financeModal.type === 'recurring' && (
            <form className="form-grid" onSubmit={saveRecurring}>
              <label>Name<input value={recurringForm.name} onChange={(e) => setRecurringForm({ ...recurringForm, name: e.target.value })} required /></label>
              <label>Account<select value={recurringForm.accountId} onChange={(e) => setRecurringForm({ ...recurringForm, accountId: e.target.value })} required>{accounts.map((acc) => <option key={acc._id} value={acc._id}>{acc.name}</option>)}</select></label>
              <label>Type<select value={recurringForm.type} onChange={(e) => setRecurringForm({ ...recurringForm, type: e.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select></label>
              <label>Amount<input type="number" min="0" step="0.01" value={recurringForm.amount} onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })} required /></label>
              <label>Category<input value={recurringForm.category} onChange={(e) => setRecurringForm({ ...recurringForm, category: e.target.value })} required /></label>
              <label>Frequency<select value={recurringForm.frequency} onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value })}><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option></select></label>
              <label>Interval<input type="number" min="1" value={recurringForm.interval} onChange={(e) => setRecurringForm({ ...recurringForm, interval: e.target.value })} /></label>
              <label>Start Date<input type="date" value={recurringForm.startDate} onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })} required /></label>
              <label>End Date<input type="date" value={recurringForm.endDate} onChange={(e) => setRecurringForm({ ...recurringForm, endDate: e.target.value })} /></label>
              <label>Linked Debt<select value={recurringForm.linkedDebtId} onChange={(e) => setRecurringForm({ ...recurringForm, linkedDebtId: e.target.value })}><option value="">None</option>{debts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></label>
              <div className="span-2 row between center">
                <button className="primary" type="submit">{recurringForm.editId ? 'Save Changes' : 'Save Recurring'}</button>
                {recurringForm.editId && <button type="button" className="tiny danger" onClick={deleteRecurring}><IconLabel icon={Trash2} text="Delete" /></button>}
              </div>
            </form>
          )}

          {financeModal.type === 'debt' && (
            <form className="form-grid" onSubmit={saveDebt}>
              <label>Debt Name<input value={debtForm.name} onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })} required /></label>
              <label>Lender<input value={debtForm.lender} onChange={(e) => setDebtForm({ ...debtForm, lender: e.target.value })} /></label>
              <label>Original Amount<input type="number" min="0" step="0.01" value={debtForm.originalAmount} onChange={(e) => setDebtForm({ ...debtForm, originalAmount: e.target.value })} required /></label>
              <label>Current Balance<input type="number" min="0" step="0.01" value={debtForm.currentBalance} onChange={(e) => setDebtForm({ ...debtForm, currentBalance: e.target.value })} /></label>
              <label>APR %<input type="number" min="0" step="0.01" value={debtForm.apr} onChange={(e) => setDebtForm({ ...debtForm, apr: e.target.value })} /></label>
              <label>Minimum Payment<input type="number" min="0" step="0.01" value={debtForm.minimumPayment} onChange={(e) => setDebtForm({ ...debtForm, minimumPayment: e.target.value })} /></label>
              <label>Due Day<input type="number" min="1" max="31" value={debtForm.dueDay} onChange={(e) => setDebtForm({ ...debtForm, dueDay: e.target.value })} /></label>
              <label className="span-2">Notes<input value={debtForm.notes} onChange={(e) => setDebtForm({ ...debtForm, notes: e.target.value })} /></label>
              <div className="span-2 row between center">
                <button className="primary" type="submit">{debtForm.editId ? 'Save Changes' : 'Save Debt'}</button>
                {debtForm.editId && <button type="button" className="tiny danger" onClick={deleteDebt}><IconLabel icon={Trash2} text="Delete" /></button>}
              </div>
            </form>
          )}

          {financeModal.type === 'debtPayment' && (
            <form className="form-grid" onSubmit={logDebtPayment}>
              <label>Debt<select value={debtPaymentForm.debtId} onChange={(e) => setDebtPaymentForm({ ...debtPaymentForm, debtId: e.target.value })} required><option value="">Select debt</option>{debts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></label>
              <label>Payment Amount<input type="number" min="0" step="0.01" value={debtPaymentForm.amount} onChange={(e) => setDebtPaymentForm({ ...debtPaymentForm, amount: e.target.value })} required /></label>
              <label>Principal<input type="number" min="0" step="0.01" value={debtPaymentForm.principal} onChange={(e) => setDebtPaymentForm({ ...debtPaymentForm, principal: e.target.value })} /></label>
              <label>Interest<input type="number" min="0" step="0.01" value={debtPaymentForm.interest} onChange={(e) => setDebtPaymentForm({ ...debtPaymentForm, interest: e.target.value })} /></label>
              <label className="span-2">Note<input value={debtPaymentForm.note} onChange={(e) => setDebtPaymentForm({ ...debtPaymentForm, note: e.target.value })} /></label>
              <button className="primary span-2" type="submit"><IconLabel icon={DollarSign} text="Log Debt Payment" /></button>
            </form>
          )}
        </EntryModal>
      </div>

      <div className="card">
        <h2>Finance Analytics</h2>
        <div className="row gap wrap mt-sm">
          <div className="metric-card">
            <span>Income</span>
            <strong>{formatCurrency(analytics?.income || 0)}</strong>
          </div>
          <div className="metric-card">
            <span>Expenses</span>
            <strong>{formatCurrency(analytics?.expenses || 0)}</strong>
          </div>
          <div className="metric-card">
            <span>Burn Rate</span>
            <strong>{analytics?.burnRate || 0}x</strong>
          </div>
          <div className="metric-card">
            <span>Savings Rate</span>
            <strong>{analytics?.savingsRate || 0}%</strong>
          </div>
        </div>

        <div className="chart-wrap mt-lg">
          <h3>Spend by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={analytics?.spendByCategory || []}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {(analytics?.spendByCategory || []).map((entry, index) => (
                  <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrap mt-lg">
          <h3>Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics?.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function HabitsSection({ habits, reloadHabits, toast, setGlobalBusy }) {
  const [form, setForm] = useState({ editId: '', name: '', targetType: 'count', targetValue: 1 });
  const [error, setError] = useState('');
  const [habitModalOpen, setHabitModalOpen] = useState(false);

  async function addHabit(e) {
    e.preventDefault();
    setError('');
    try {
      setGlobalBusy('Saving habit...');
      const payload = { ...form, targetValue: Number(form.targetValue) };
      if (form.editId) {
        await api.patch(`/habits/${form.editId}`, payload);
        toast('Habit updated.', 'success');
      } else {
        await api.post('/habits', payload);
        toast('Habit saved.', 'success');
      }
      setForm({ editId: '', name: '', targetType: 'count', targetValue: 1 });
      setHabitModalOpen(false);
      reloadHabits();
    } catch (err) {
      const msg = errorText(err);
      setError(msg);
      toast(msg, 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  async function logHabit(habit) {
    const value = prompt(`Log value for ${habit.name} (target ${habit.targetValue})`, String(habit.targetValue));
    if (value == null) return;
    setError('');
    try {
      setGlobalBusy('Logging habit...');
      await api.post(`/habits/${habit._id}/log`, { date: todayKey(), value: Number(value) });
      reloadHabits();
      toast('Habit logged.', 'success');
    } catch (err) {
      const msg = errorText(err);
      setError(msg);
      toast(msg, 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  return (
    <div className="grid two-col">
      <div className="card">
        <div className="row between center">
          <h2>Habits</h2>
          <button className="primary" onClick={() => { setForm({ editId: '', name: '', targetType: 'count', targetValue: 1 }); setHabitModalOpen(true); }}>
            New Entry
          </button>
        </div>
        {error && <p className="error">{error}</p>}

        <EntryModal
          open={habitModalOpen}
          title={form.editId ? 'Edit Habit' : 'New Habit'}
          onClose={() => setHabitModalOpen(false)}
        >
          <form className="form-grid" onSubmit={addHabit}>
            <label>
              Habit Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Target Type
              <select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
                <option value="count">count</option>
                <option value="minutes">minutes</option>
                <option value="amount">amount</option>
                <option value="boolean">boolean</option>
              </select>
            </label>
            <label>
              Target Value
              <input type="number" min="1" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} required />
            </label>
            <div className="row between center span-2">
              <button className="primary" type="submit">
                {form.editId ? 'Save Changes' : 'Add Habit'}
              </button>
              {form.editId && (
                <button
                  type="button"
                  className="tiny danger"
                  onClick={async () => {
                    try {
                      setGlobalBusy('Deleting habit...');
                      await api.delete(`/habits/${form.editId}`);
                      setForm({ editId: '', name: '', targetType: 'count', targetValue: 1 });
                      setHabitModalOpen(false);
                      reloadHabits();
                      toast('Habit deleted.', 'success');
                    } catch (err) {
                      toast(errorText(err), 'error');
                    } finally {
                      setGlobalBusy('');
                    }
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </EntryModal>
      </div>

      <div className="card">
        <h2>Habit List</h2>
        <ul className="list dense">
          {habits.map((habit) => (
            <li key={habit._id} className="row between center">
              <span>
                <strong>{habit.name}</strong>
                <small>{habit.targetType} target: {habit.targetValue}</small>
              </span>
              <span className="row gap-sm">
                <button
                  className="tiny"
                  onClick={() => {
                    setForm({
                      editId: habit._id,
                      name: habit.name,
                      targetType: habit.targetType,
                      targetValue: habit.targetValue
                    });
                    setHabitModalOpen(true);
                  }}
                >
                  Edit
                </button>
                <button className="tiny" onClick={() => logHabit(habit)}><IconLabel icon={Check} text="Log" /></button>
              </span>
            </li>
          ))}
          {!habits.length && <li className="muted">No habits yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function JournalSection({ entries, reloadJournal, toast, setGlobalBusy }) {
  const [form, setForm] = useState({ editId: '', date: todayKey(), content: '', linksRaw: '' });
  const [error, setError] = useState('');
  const [journalModalOpen, setJournalModalOpen] = useState(false);

  async function saveEntry(e) {
    e.preventDefault();
    setError('');
    try {
      setGlobalBusy('Saving journal entry�');
      const links = form.linksRaw
        .split(',')
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((token) => {
          const [itemType, itemId] = token.split(':');
          return { itemType, itemId };
        });

      if (form.editId) {
        await api.patch(`/journal/${form.editId}`, {
          date: form.date,
          content: form.content,
          links
        });
        toast('Journal updated.', 'success');
      } else {
        await api.post('/journal', {
          date: form.date,
          content: form.content,
          links
        });
        toast('Journal saved.', 'success');
      }

      setForm({ editId: '', date: todayKey(), content: '', linksRaw: '' });
      setJournalModalOpen(false);
      reloadJournal();
    } catch (err) {
      const msg = errorText(err);
      setError(msg);
      toast(msg, 'error');
    } finally {
      setGlobalBusy('');
    }
  }

  return (
    <div className="grid two-col">
      <div className="card">
        <div className="row between center">
          <h2>Journal</h2>
          <button className="primary" onClick={() => { setForm({ editId: '', date: todayKey(), content: '', linksRaw: '' }); setJournalModalOpen(true); }}>
            New Entry
          </button>
        </div>
        {error && <p className="error">{error}</p>}

        <EntryModal
          open={journalModalOpen}
          title={form.editId ? 'Edit Journal Entry' : 'New Journal Entry'}
          onClose={() => setJournalModalOpen(false)}
        >
        <form className="form-grid" onSubmit={saveEntry}>
          <label>
            Date
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </label>
          <label className="span-2">
            Entry
            <textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          </label>
          <label className="span-2">
            Optional Links (comma-separated type:id)
            <input
              value={form.linksRaw}
              onChange={(e) => setForm({ ...form, linksRaw: e.target.value })}
              placeholder="goal:665..., task:665..., income:665..."
            />
          </label>
          <div className="row between center span-2">
            <button className="primary" type="submit">
              {form.editId ? 'Save Changes' : 'Save Journal Entry'}
            </button>
            {form.editId && (
              <button
                type="button"
                className="tiny danger"
                onClick={async () => {
                  try {
                    setGlobalBusy('Deleting journal entry�');
                    await api.delete(`/journal/${form.editId}`);
                    setForm({ editId: '', date: todayKey(), content: '', linksRaw: '' });
                    setJournalModalOpen(false);
                    reloadJournal();
                    toast('Journal entry deleted.', 'success');
                  } catch (err) {
                    toast(errorText(err), 'error');
                  } finally {
                    setGlobalBusy('');
                  }
                }}
              >
                Delete
              </button>
            )}
          </div>
        </form>
        </EntryModal>
      </div>

      <div className="card">
        <h2>Recent Entries</h2>
        <ul className="list">
          {entries.map((entry) => (
            <li key={entry._id} className="row between center">
              <span>
                <strong>{entry.date}</strong>
                <p>{entry.content}</p>
                {entry.links?.length > 0 && <small>Links: {entry.links.map((l) => `${l.itemType}:${l.itemId}`).join(', ')}</small>}
              </span>
              <span className="row gap-sm">
                <button
                  className="tiny"
                  onClick={() => {
                    setForm({
                      editId: entry._id,
                      date: entry.date,
                      content: entry.content,
                      linksRaw: (entry.links || []).map((l) => `${l.itemType}:${l.itemId}`).join(', ')
                    });
                    setJournalModalOpen(true);
                  }}
                >
                  Edit
                </button>
              </span>
            </li>
          ))}
          {!entries.length && <li className="muted">No journal entries yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function CalendarGrid({ grid, currentMonth, onSelectDay }) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!grid) return <p className="muted">No calendar data.</p>;

  if (grid.mode === 'year') {
    return (
      <div className="year-grid">
        {grid.months.map((monthBlock) => (
          <div className="month-block" key={monthBlock.month}>
            <h4>{dayjs().month(monthBlock.month).format('MMMM')}</h4>
            <div className="calendar-week-head">
              {weekDays.map((d) => (
                <span key={d}>{d[0]}</span>
              ))}
            </div>
            {monthBlock.weeks.map((week, idx) => (
              <div className="calendar-week" key={idx}>
                {week.map((day) => (
                  <button
                    key={day.date}
                    className="calendar-cell tiny-cell"
                    type="button"
                    onClick={() => onSelectDay?.(day)}
                  >
                    <span>{day.dayOfMonth}</span>
                    <small>{day.totals.productivity + day.totals.finance + day.totals.journal}</small>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="calendar-block">
      <div className="calendar-week-head">
        {weekDays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      {grid.weeks.map((week, idx) => (
        <div className="calendar-week" key={idx}>
          {week.map((day) => (
            <button
              key={day.date}
              type="button"
              className={`calendar-cell ${day.month !== currentMonth ? 'outside' : ''}`}
              onClick={() => onSelectDay?.(day)}
            >
              <div className="cell-head">
                <strong>{day.dayOfMonth}</strong>
                <small>{day.date}</small>
              </div>
              <div className="cell-metrics">
                <span>P:{day.totals.productivity}</span>
                <span>F:{day.totals.finance}</span>
                <span>J:{day.totals.journal}</span>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function CalendarSection({
  calendarPayload,
  summaryPayload,
  summaryRange,
  setSummaryRange,
  summaryDate,
  setSummaryDate,
  layers,
  setLayers,
  calendarMode,
  setCalendarMode,
  calendarMonth,
  setCalendarMonth,
  calendarYear,
  setCalendarYear,
  toast,
  onManualRefresh
}) {
  const [selectedDay, setSelectedDay] = useState(null);

  function toggleLayer(layer) {
    if (layers.includes(layer)) setLayers(layers.filter((x) => x !== layer));
    else setLayers([...layers, layer]);
  }

  return (
    <div className="grid two-col">
      <div className="card">
        <div className="row between center wrap gap-sm">
          <h2>Calendar</h2>
          <div className="row gap-sm wrap">
            <div className="segmented">
              <button className={calendarMode === 'week' ? 'active' : ''} onClick={() => setCalendarMode('week')}>
                Week
              </button>
              <button className={calendarMode === 'month' ? 'active' : ''} onClick={() => setCalendarMode('month')}>
                Month
              </button>
              <button className={calendarMode === 'year' ? 'active' : ''} onClick={() => setCalendarMode('year')}>
                Year
              </button>
            </div>

            <select value={calendarMonth} onChange={(e) => setCalendarMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {dayjs().month(i).format('MMMM')}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="2000"
              max="3000"
              value={calendarYear}
              onChange={(e) => setCalendarYear(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="row gap-sm wrap mt-sm">
          {['productivity', 'finance', 'journal'].map((layer) => (
            <label key={layer} className="check-inline">
              <input type="checkbox" checked={layers.includes(layer)} onChange={() => toggleLayer(layer)} /> {layer}
            </label>
          ))}
        </div>

        <CalendarGrid
          grid={calendarPayload?.grid}
          currentMonth={calendarMonth}
          onSelectDay={(day) => {
            setSelectedDay(day);
            setSummaryDate(day.date);
            toast(`Selected ${day.date} for summary`, 'info');
          }}
        />

        <div className="raw-layers mt-sm">
          <small className="muted">Raw layers snapshot (top 6 each):</small>
          <div className="grid three-col mt-sm">
            <div>
              <strong>Productivity</strong>
              <ul className="list dense">
                {(calendarPayload?.raw?.productivity || []).slice(0, 6).map((x) => (
                  <li key={x._id}>{x.title}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Finance</strong>
              <ul className="list dense">
                {(calendarPayload?.raw?.finance || []).slice(0, 6).map((x) => (
                  <li key={x._id}>{x.type} {formatCurrency(x.amount)}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Journal</strong>
              <ul className="list dense">
                {(calendarPayload?.raw?.journal || []).slice(0, 6).map((x) => (
                  <li key={x._id}>{x.date}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-sm row gap-sm wrap">
          <button className="tiny" onClick={onManualRefresh}>
            Refresh Calendar + Summary
          </button>
        </div>

        {selectedDay && (
          <div className="calendar-day-panel mt-sm">
            <h4>{selectedDay.date}</h4>
            <div className="grid three-col">
              <div>
                <strong>Productivity</strong>
                <ul className="list dense">
                  {(selectedDay.events?.productivity || []).slice(0, 8).map((x) => (
                    <li key={x._id}>{x.title}</li>
                  ))}
                  {!selectedDay.events?.productivity?.length && <li className="muted">None</li>}
                </ul>
              </div>
              <div>
                <strong>Finance</strong>
                <ul className="list dense">
                  {(selectedDay.events?.finance || []).slice(0, 8).map((x) => (
                    <li key={x._id}>
                      {x.type} {formatCurrency(x.amount)}
                    </li>
                  ))}
                  {!selectedDay.events?.finance?.length && <li className="muted">None</li>}
                </ul>
              </div>
              <div>
                <strong>Journal</strong>
                <ul className="list dense">
                  {(selectedDay.events?.journal || []).slice(0, 8).map((x) => (
                    <li key={x._id}>{(x.content || '').slice(0, 90)}</li>
                  ))}
                  {!selectedDay.events?.journal?.length && <li className="muted">None</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="row between center wrap gap-sm">
          <h2>Summary</h2>
          <div className="row gap-sm wrap">
            <div className="segmented">
              <button className={summaryRange === 'day' ? 'active' : ''} onClick={() => setSummaryRange('day')}>
                Day
              </button>
              <button className={summaryRange === 'week' ? 'active' : ''} onClick={() => setSummaryRange('week')}>
                Week
              </button>
              <button className={summaryRange === 'month' ? 'active' : ''} onClick={() => setSummaryRange('month')}>
                Month
              </button>
              <button className={summaryRange === 'year' ? 'active' : ''} onClick={() => setSummaryRange('year')}>
                Year
              </button>
            </div>
            <small className="muted">Anchor date: {dayjs(summaryDate).format('MMM D, YYYY')} (click a day on calendar)</small>
          </div>
        </div>

        <p className="muted mt-sm">
          {summaryPayload?.from && summaryPayload?.to
            ? `${dayjs(summaryPayload.from).format('MMM D, YYYY')} to ${dayjs(summaryPayload.to).format('MMM D, YYYY')}`
            : 'No summary range loaded yet.'}
        </p>

        <div className="grid three-col mt-sm">
          <div className="metric-card accent">
            <small>Tasks</small>
            <strong>{summaryPayload?.totals?.tasks || 0}</strong>
            <small>{summaryPayload?.tasks?.completionRate || 0}% done</small>
          </div>
          <div className="metric-card">
            <small>Net</small>
            <strong>{formatCurrency(summaryPayload?.totals?.net || 0)}</strong>
            <small>
              In {formatCurrency(summaryPayload?.totals?.income || 0)} · Out {formatCurrency(summaryPayload?.totals?.expense || 0)}
            </small>
          </div>
          <div className="metric-card">
            <small>Journal Entries</small>
            <strong>{summaryPayload?.totals?.journalEntries || 0}</strong>
            <small>{summaryPayload?.totals?.transactions || 0} transactions</small>
          </div>
        </div>

        <div className="mt-sm">
          <strong>Upcoming Tasks</strong>
          <ul className="list dense mt-sm">
            {(summaryPayload?.tasks?.upcoming || []).map((item) => (
              <li key={item._id}>{item.title} <small className="muted">({item.status})</small></li>
            ))}
            {!summaryPayload?.tasks?.upcoming?.length && <li className="muted">No tasks in this range.</li>}
          </ul>
        </div>

        <div className="grid two-col mt-sm">
          <div>
            <strong>Top Expense Categories</strong>
            <ul className="list dense mt-sm">
              {(summaryPayload?.finance?.expenseByCategory || []).map((row) => (
                <li key={row.category}>{row.category}: {formatCurrency(row.amount)}</li>
              ))}
              {!summaryPayload?.finance?.expenseByCategory?.length && <li className="muted">No expenses in this range.</li>}
            </ul>
          </div>
          <div>
            <strong>Latest Journal Notes</strong>
            <ul className="list dense mt-sm">
              {(summaryPayload?.journal?.latest || []).map((entry, idx) => (
                <li key={`${entry.date}-${idx}`}>{entry.date}: {(entry.preview || '').slice(0, 90)}</li>
              ))}
              {!summaryPayload?.journal?.latest?.length && <li className="muted">No journal notes in this range.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('home');
  const [dashboard, setDashboard] = useState(null);
  const [scoreDaily, setScoreDaily] = useState(null);
  const [scoreWeekly, setScoreWeekly] = useState(null);
  const [scoreMonthly, setScoreMonthly] = useState(null);
  const [items, setItems] = useState([]);
  const [habits, setHabits] = useState([]);
  const [financeAnalytics, setFinanceAnalytics] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [calendarPayload, setCalendarPayload] = useState(null);
  const [summaryPayload, setSummaryPayload] = useState(null);
  const [layers, setLayers] = useState(['productivity', 'finance', 'journal']);
  const [calendarMode, setCalendarMode] = useState('month');
  const [calendarMonth, setCalendarMonth] = useState(dayjs().month());
  const [calendarYear, setCalendarYear] = useState(dayjs().year());
  const [summaryRange, setSummaryRange] = useState('day');
  const [summaryDate, setSummaryDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(true);
  const [globalBusy, setGlobalBusy] = useState('');
  const [toasts, setToasts] = useState([]);

  function toast(message, type = 'info', options = {}) {
    const id = `${Date.now()}-${Math.random()}`;
    const payload = {
      id,
      message,
      type,
      actionLabel: options.actionLabel,
      onAction: options.onAction
    };
    setToasts((current) => [...current, payload]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4200);
  }

  function dismissToast(id) {
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  async function loadAuth() {
    const token = localStorage.getItem('lifeos_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('lifeos_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard() {
    const [home, daily, weekly, monthly] = await Promise.all([
      api.get('/dashboard/home'),
      api.get('/dashboard/scores?range=daily'),
      api.get('/dashboard/scores?range=weekly'),
      api.get('/dashboard/scores?range=monthly')
    ]);

    setDashboard(home.data);
    setScoreDaily(daily.data);
    setScoreWeekly(weekly.data);
    setScoreMonthly(monthly.data);
  }

  async function loadItems() {
    const { data } = await api.get('/work/items');
    setItems(data || []);
  }

  async function saveWorkItem(workItemId, updates) {
    await api.patch(`/work/items/${workItemId}`, updates);
    await loadItems();
  }

  async function deleteWorkItem(workItemId) {
    await api.delete(`/work/items/${workItemId}`);
    await loadItems();
  }

  async function loadHabits() {
    const { data } = await api.get('/habits');
    setHabits(data || []);
    await loadDashboard();
  }

  async function loadFinance() {
    const { data } = await api.get('/finance/analytics/summary');
    setFinanceAnalytics(data);
    await loadDashboard();
  }

  async function loadJournal() {
    const { data } = await api.get('/journal');
    setJournalEntries(data || []);
    await loadDashboard();
  }

  async function loadCalendar(mode = calendarMode, month = calendarMonth, year = calendarYear, activeLayers = layers) {
    const { data } = await api.get('/calendar', {
      params: {
        layers: activeLayers.join(','),
        mode,
        month,
        year
      }
    });
    setCalendarPayload(data);
  }

  async function loadSummary(range = summaryRange, date = summaryDate) {
    const { data } = await api.get('/calendar/summary', {
      params: {
        range,
        date
      }
    });
    setSummaryPayload(data || null);
  }

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setGlobalBusy('Loading workspace data�');
        await Promise.all([
          loadDashboard(),
          loadItems(),
          loadHabits(),
          loadFinance(),
          loadJournal(),
          loadCalendar(calendarMode, calendarMonth, calendarYear, layers),
          loadSummary(summaryRange, summaryDate)
        ]);
      } catch (err) {
        toast(errorText(err), 'error');
      } finally {
        setGlobalBusy('');
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setGlobalBusy('Updating calendar�');
        await loadCalendar(calendarMode, calendarMonth, calendarYear, layers);
      } catch (err) {
        toast(errorText(err), 'error');
      } finally {
        setGlobalBusy('');
      }
    })();
  }, [layers, calendarMode, calendarMonth, calendarYear]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setGlobalBusy('Updating summary…');
        await loadSummary(summaryRange, summaryDate);
      } catch (err) {
        toast(errorText(err), 'error');
      } finally {
        setGlobalBusy('');
      }
    })();
  }, [summaryRange, summaryDate, user]);

  function logout() {
    localStorage.removeItem('lifeos_token');
    setUser(null);
  }

  function quickAction(key) {
    if (key === 'new_task' || key === 'daily_plan') setSection('work');
    if (key === 'log_expense') setSection('finance');
    if (key === 'new_journal') setSection('journal');
  }

  if (loading) return <div className="center-screen">Loading...</div>;
  if (!user) return <AuthScreen onAuth={setUser} />;

  return (
    <ErrorBoundary>
      <div className="app-shell">
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
        {globalBusy && <div className="busy-bar">{globalBusy}</div>}

        <aside className="sidebar">
          <div>
            <h1>Life OS</h1>
            <p className="muted">Save X/month engine</p>
          </div>

          <nav>
            {[
              ['home', 'Home'],
              ['work', 'Goals/Projects/Tasks'],
              ['habits', 'Habits'],
              ['finance', 'Finances'],
              ['journal', 'Journal'],
              ['calendar', 'Calendar']
            ].map(([key, label]) => (
              <button key={key} className={section === key ? 'nav active' : 'nav'} onClick={() => setSection(key)}>
                {label}
              </button>
            ))}
          </nav>

          <div className="sidebar-foot">
            <small>@{user.username}</small>
            <button className="ghost" onClick={logout}>
              Logout
            </button>
          </div>
        </aside>

        <main className="main">
          {section === 'home' && (
            <HomeDashboard
              dashboard={dashboard}
              scoreDaily={scoreDaily}
              scoreWeekly={scoreWeekly}
              scoreMonthly={scoreMonthly}
              onQuickAction={quickAction}
            />
          )}
          {section === 'work' && (
            <WorkSection
              items={items}
              reloadItems={loadItems}
              toast={toast}
              setGlobalBusy={setGlobalBusy}
              saveWorkItem={saveWorkItem}
              deleteWorkItem={deleteWorkItem}
            />
          )}
          {section === 'habits' && (
            <HabitsSection habits={habits} reloadHabits={loadHabits} toast={toast} setGlobalBusy={setGlobalBusy} />
          )}
          {section === 'finance' && (
            <FinanceSection
              analytics={financeAnalytics}
              reloadFinance={loadFinance}
              toast={toast}
              setGlobalBusy={setGlobalBusy}
            />
          )}
          {section === 'journal' && (
            <JournalSection
              entries={journalEntries}
              reloadJournal={loadJournal}
              toast={toast}
              setGlobalBusy={setGlobalBusy}
            />
          )}
          {section === 'calendar' && (
            <CalendarSection
              calendarPayload={calendarPayload}
              summaryPayload={summaryPayload}
              summaryRange={summaryRange}
              setSummaryRange={setSummaryRange}
              summaryDate={summaryDate}
              setSummaryDate={setSummaryDate}
              layers={layers}
              setLayers={setLayers}
              calendarMode={calendarMode}
              setCalendarMode={setCalendarMode}
              calendarMonth={calendarMonth}
              setCalendarMonth={setCalendarMonth}
              calendarYear={calendarYear}
              setCalendarYear={setCalendarYear}
              toast={toast}
              onManualRefresh={async () => {
                try {
                  setGlobalBusy('Refreshing calendar + summary…');
                  await Promise.all([
                    loadCalendar(calendarMode, calendarMonth, calendarYear, layers),
                    loadSummary(summaryRange, summaryDate)
                  ]);
                  toast('Calendar refreshed.', 'success');
                } catch (err) {
                  toast(errorText(err), 'error');
                } finally {
                  setGlobalBusy('');
                }
              }}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}















