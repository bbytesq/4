import React, { useEffect, useMemo, useState } from 'react';

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

const COOKIE_NAME = 'react_todo_list';
const COOKIE_MAX_AGE_DAYS = 30;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name: string): string | null {
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

function loadTodosFromCookie(): Todo[] {
  try {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Todo[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t) => ({
      ...t,
      completed: Boolean(t.completed),
    }));
  } catch {
    return [];
  }
}

function saveTodosToCookie(todos: Todo[]) {
  setCookie(COOKIE_NAME, JSON.stringify(todos), COOKIE_MAX_AGE_DAYS);
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodosFromCookie());
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    saveTodosToCookie(todos);
  }, [todos]);

  const filteredTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.completed);
    if (filter === 'completed') return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTodos((prev) => [todo, ...prev]);
    setNewTitle('');
  };

  const handleToggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const startEditTodo = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const handleEditSubmit = (id: string) => {
    const title = editingTitle.trim();
    if (!title) {
      setEditingId(null);
      setEditingTitle('');
      return;
    }
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    setEditingId(null);
    setEditingTitle('');
  };

  const handleClearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="app">
      <div className="card">
        <header className="header">
          <h1>Todo List</h1>
          <p className="subtitle">CRUD + cookies, React + TypeScript</p>
        </header>

        <form className="todo-form" onSubmit={handleAddTodo}>
          <input
            type="text"
            placeholder="Новая задача..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button type="submit">Добавить</button>
        </form>

        <div className="toolbar">
          <div className="filters">
            <button
              type="button"
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Все
            </button>
            <button
              type="button"
              className={filter === 'active' ? 'active' : ''}
              onClick={() => setFilter('active')}
            >
              Активные
            </button>
            <button
              type="button"
              className={filter === 'completed' ? 'active' : ''}
              onClick={() => setFilter('completed')}
            >
              Выполненные
            </button>
          </div>
          <div className="toolbar-right">
            <span className="counter">
              Осталось: <strong>{activeCount}</strong>
            </span>
            <button
              type="button"
              className="secondary"
              onClick={handleClearCompleted}
              disabled={todos.length === activeCount}
            >
              Очистить выполненные
            </button>
          </div>
        </div>

        <ul className="todo-list">
          {filteredTodos.length === 0 && (
            <li className="empty">Задач пока нет</li>
          )}
          {filteredTodos.map((todo) => (
            <li key={todo.id} className={todo.completed ? 'completed' : ''}>
              <label className="todo-main">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                />
                {editingId === todo.id ? (
                  <input
                    className="edit-input"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleEditSubmit(todo.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSubmit(todo.id);
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditingTitle('');
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="title" onDoubleClick={() => startEditTodo(todo)}>
                    {todo.title}
                  </span>
                )}
              </label>
              <button
                type="button"
                className="icon-button"
                onClick={() => startEditTodo(todo)}
                aria-label="Редактировать"
              >
                ✏️
              </button>
              <button
                type="button"
                className="icon-button danger"
                onClick={() => handleDeleteTodo(todo.id)}
                aria-label="Удалить"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <footer className="footer">
          <small>Задачи сохраняются в cookies на 30 дней.</small>
        </footer>
      </div>
    </div>
  );
};

