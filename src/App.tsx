import React, { useState, useEffect, useMemo } from 'react';
import type { Task, ModuleCategory, TaskStatus } from './types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadCategoriesFromStorage,
  saveCategoriesToStorage,
  clearAllStorage,
  exportDataAsJson,
} from './utils/storage';
import { getDeadlineAlertInfo } from './utils/dateUtils';
import { Header, SimpleActiveView } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { UrgentAlertBanner } from './components/UrgentAlertBanner';
import { FilterBar } from './components/FilterBar';
import { QuickAddBar } from './components/QuickAddBar';
import { MondayTableView } from './components/MondayTableView';
import { TaskCard } from './components/TaskCard';
import { DailyTimelineView } from './components/DailyTimelineView';
import { CalendarScheduleView } from './components/CalendarScheduleView';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { QuickUpdateModal } from './components/QuickUpdateModal';
import { TaskInfographicTimelineModal } from './components/TaskInfographicTimelineModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { AISummaryModal } from './components/AISummaryModal';
import { SettingsModal } from './components/SettingsModal';
import { EmptyState } from './components/EmptyState';
import { LoginPage, UserAuthSession } from './components/LoginPage';
import {
  fetchTasksFromCloud,
  syncAllTasksToCloud,
  syncTaskToCloud,
  deleteTaskFromCloud,
  fetchCategoriesFromCloud,
  syncCategoriesToCloud,
} from './utils/api';

export function App() {
  const [authSession, setAuthSession] = useState<UserAuthSession | null>(() => {
    const saved = localStorage.getItem('iTasking_auth_session');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('iTasking_auth_session');
    setAuthSession(null);
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<ModuleCategory[]>([]);
  const [activeView, setActiveView] = useState<SimpleActiveView>('calendar');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Cloud Sync State
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [activeTaskToUpdate, setActiveTaskToUpdate] = useState<Task | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [initialUpdateTab, setInitialUpdateTab] = useState<'log' | 'edit'>('log');
  const [infographicTask, setInfographicTask] = useState<Task | null>(null);
  const [isInfographicOpen, setIsInfographicOpen] = useState(false);
  const [isNewTaskFormOpen, setIsNewTaskFormOpen] = useState(false);
  const [isAISummaryModalOpen, setIsAISummaryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleOpenInfographic = (task: Task) => {
    setInfographicTask(task);
    setIsInfographicOpen(true);
  };
  const [customUsers, setCustomUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('iTasking_custom_team');
      return saved ? JSON.parse(saved) : ['มอส', 'เอก', 'แป้ง', 'นพ', 'เจมส์', 'ไอซ์'];
    } catch {
      return ['มอส', 'เอก', 'แป้ง', 'นพ', 'เจมส์', 'ไอซ์'];
    }
  });

  // Load clean data from Local Cache first, then sync from Vercel Cloud
  useEffect(() => {
    // 1. Instant local render
    const loaded = loadTasksFromStorage();
    setTasks(loaded);
    setCategories(loadCategoriesFromStorage());

    // 2. Fetch live data from Vercel Cloud Database
    setIsSyncing(true);
    Promise.all([fetchTasksFromCloud(), fetchCategoriesFromCloud()])
      .then(([tasksRes, catsRes]) => {
        if (tasksRes.isCloudConnected) {
          setIsCloudConnected(true);
          setTasks(tasksRes.tasks);
        }
        if (catsRes.isCloudConnected && catsRes.categories.length > 0) {
          setCategories(catsRes.categories);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsSyncing(false);
      });
  }, []);

  const handleRefreshCloud = async () => {
    setIsSyncing(true);
    try {
      const [tasksRes, catsRes] = await Promise.all([
        fetchTasksFromCloud(),
        fetchCategoriesFromCloud(),
      ]);
      setIsCloudConnected(tasksRes.isCloudConnected);
      setTasks(tasksRes.tasks);
      if (catsRes.categories.length > 0) {
        setCategories(catsRes.categories);
      }
    } catch {
      // offline
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    saveTasksToStorage(newTasks);
    // Background cloud sync
    syncAllTasksToCloud(newTasks).catch(() => {});
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const newTasks = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(newTasks);
    saveTasksToStorage(newTasks);
    setActiveTaskToUpdate(null);
    setIsUpdateModalOpen(false);
    // Background cloud sync
    syncTaskToCloud(updatedTask).catch(() => {});

    // Auto-sync category if newly added
    if (
      updatedTask.module &&
      !categories.some((c) => c.name.toLowerCase() === updatedTask.module.toLowerCase())
    ) {
      const newCat: ModuleCategory = {
        id: `cat-${Date.now()}`,
        name: updatedTask.module,
        color: '#0073ea',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeText: 'text-blue-800',
        borderClass: 'border-l-blue-500',
      };
      const newCats = [...categories, newCat];
      setCategories(newCats);
      saveCategoriesToStorage(newCats);
      syncCategoriesToCloud(newCats).catch(() => {});
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const newTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(newTasks);
    saveTasksToStorage(newTasks);
    deleteTaskFromCloud(taskId).catch(() => {});
    setIsUpdateModalOpen(false);
    setActiveTaskToUpdate(null);
  };

  const handleAddCategory = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    if (categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) return;

    const newCat: ModuleCategory = {
      id: `cat-${Date.now()}`,
      name: clean,
      color: '#0073ea',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeText: 'text-blue-800',
      borderClass: 'border-l-blue-500',
    };
    const newCats = [...categories, newCat];
    setCategories(newCats);
    saveCategoriesToStorage(newCats);
    syncCategoriesToCloud(newCats).catch(() => {});
  };

  const handleQuickStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const isDone = newStatus === 'completed';
        const newLog = {
          id: `log-${Date.now()}`,
          taskId: t.id,
          author: t.assignees[0] || 'ผู้ดูแล',
          timestamp: new Date().toISOString(),
          actionType: 'status_change' as const,
          previousStatus: t.status,
          newStatus: newStatus,
          content: `ปรับสถานะเป็น ${newStatus}`,
          progressPercent: isDone ? 100 : t.progress,
        };

        return {
          ...t,
          status: newStatus,
          progress: isDone ? 100 : t.progress,
          logs: [newLog, ...(t.logs || [])],
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    handleUpdateTasks(updated);
  };

  const handleAddTask = (newTask: Task) => {
    const newTasks = [newTask, ...tasks];
    handleUpdateTasks(newTasks);

    // Auto add category if new
    if (!categories.some((c) => c.name.toLowerCase() === newTask.module.toLowerCase())) {
      const newCat: ModuleCategory = {
        id: `cat-${Date.now()}`,
        name: newTask.module,
        color: '#0073ea',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeText: 'text-blue-800',
        borderClass: 'border-l-blue-500',
      };
      const newCats = [...categories, newCat];
      setCategories(newCats);
      saveCategoriesToStorage(newCats);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('คุณต้องการล้างข้อมูลงานทั้งหมดเพื่อเริ่มใหม่ใช่หรือไม่?')) {
      const reset = clearAllStorage();
      setTasks(reset.tasks);
      setCategories(reset.categories);
    }
  };

  // Distinct assignees
  const availableAssignees = useMemo(() => {
    const set = new Set<string>(customUsers);
    tasks.forEach((t) => {
      t.assignees.forEach((a) => {
        if (a && a !== 'ยังไม่ระบุ') set.add(a);
      });
    });
    return Array.from(set);
  }, [tasks, customUsers]);

  const urgentCount = useMemo(() => {
    return tasks.filter((t) => {
      const alert = getDeadlineAlertInfo(t.deadlineDate, t.status);
      return alert.urgency === 'overdue' || alert.urgency === 'due_today' || alert.urgency === 'due_soon';
    }).length;
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDetail = t.detail?.toLowerCase().includes(q);
        const matchModule = t.module.toLowerCase().includes(q);
        const matchAssignee = t.assignees.some((a) => a.toLowerCase().includes(q));
        if (!matchTitle && !matchDetail && !matchModule && !matchAssignee) {
          return false;
        }
      }

      // 2. Module
      if (selectedModule !== 'all' && t.module.toLowerCase() !== selectedModule.toLowerCase()) {
        return false;
      }

      // 3. Assignee
      if (selectedAssignee !== 'all') {
        const matchAssignee = t.assignees.some(
          (a) =>
            a.toLowerCase().includes(selectedAssignee.toLowerCase()) ||
            selectedAssignee.toLowerCase().includes(a.toLowerCase())
        );
        if (!matchAssignee) return false;
      }

      // 4. Status
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'review') {
          if (t.status !== 'review' && t.status !== 'blocked') return false;
        } else if (t.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, selectedModule, selectedAssignee, selectedStatus]);

  const handleOpenUpdate = (task: Task, initialTab: 'log' | 'edit' = 'log') => {
    setActiveTaskToUpdate(task);
    setInitialUpdateTab(initialTab);
    setIsUpdateModalOpen(true);
  };

  // If user is not logged in, render LoginPage immediately
  if (!authSession) {
    return <LoginPage onLogin={(session) => setAuthSession(session)} />;
  }

  return (
    <div className="min-h-screen flex font-sans bg-[#f8fafc]">
      {/* Sleek Modern Left Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        modules={categories}
        selectedModule={selectedModule}
        setSelectedModule={setSelectedModule}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        totalTasksCount={tasks.length}
        urgentCount={urgentCount}
        userSession={authSession}
        onLogout={handleLogout}
        onAddCategory={handleAddCategory}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Glassmorphic Header */}
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          tasks={tasks}
          onOpenNewTask={() => setIsNewTaskFormOpen(true)}
          onOpenTaskUpdate={handleOpenUpdate}
          onOpenAISummary={() => setIsAISummaryModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onExportData={() => exportDataAsJson(tasks)}
          onResetData={handleClearAll}
          userSession={authSession}
          onLogout={handleLogout}
          isCloudConnected={isCloudConnected}
          isSyncing={isSyncing}
          onRefreshCloud={handleRefreshCloud}
        />

        {/* Workspace Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {/* Top Urgent Alert Banner */}
          <UrgentAlertBanner
            tasks={tasks}
            onOpenTaskUpdate={handleOpenUpdate}
          />

          {/* Quick Add Form Bar */}
          <QuickAddBar
            modules={categories}
            availableUsers={availableAssignees}
            onAddTask={handleAddTask}
          />

          {/* Show Filters only if tasks exist */}
          {tasks.length > 0 && (
            <FilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedModule={selectedModule}
              setSelectedModule={setSelectedModule}
              selectedAssignee={selectedAssignee}
              setSelectedAssignee={setSelectedAssignee}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              modules={categories}
              availableUsers={availableAssignees}
              totalFilteredCount={filteredTasks.length}
              totalTasksCount={tasks.length}
            />
          )}

          {/* Content Area */}
          <div className="pt-1">
            {tasks.length === 0 ? (
              <EmptyState onOpenCreate={() => setIsNewTaskFormOpen(true)} />
            ) : (
              <>
                {/* 1. Monday.com Luxury Main Table */}
                {activeView === 'monday' && (
                  <MondayTableView
                    tasks={filteredTasks}
                    modules={categories}
                    onOpenUpdate={handleOpenUpdate}
                    onQuickStatusChange={handleQuickStatusChange}
                    onAddTask={handleAddTask}
                    onOpenInfographic={handleOpenInfographic}
                  />
                )}

                {/* 2. Calendar Schedule Table View */}
                {activeView === 'calendar' && (
                  <CalendarScheduleView
                    tasks={filteredTasks}
                    modules={categories}
                    onOpenUpdate={handleOpenUpdate}
                    onOpenNewTask={() => setIsNewTaskFormOpen(true)}
                    onOpenInfographic={handleOpenInfographic}
                  />
                )}

                {/* 3. Daily Activity Storyline View */}
                {activeView === 'daily' && (
                  <DailyTimelineView
                    tasks={tasks}
                    onOpenUpdate={handleOpenUpdate}
                    onUpdateTask={handleUpdateTask}
                    availableUsers={availableAssignees}
                  />
                )}

                {/* 4. Cards View */}
                {activeView === 'cards' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onOpenUpdate={handleOpenUpdate}
                          onQuickStatusChange={handleQuickStatusChange}
                          onOpenInfographic={handleOpenInfographic}
                        />
                      ))}
                    </div>

                    {filteredTasks.length === 0 && (
                      <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200 text-sm">
                        ไม่พบงานที่ตรงกับตัวกรองที่เลือก
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Executive Dashboard View */}
                {activeView === 'dashboard' && (
                  <ExecutiveDashboard
                    tasks={tasks}
                    modules={categories}
                    onOpenTaskUpdate={handleOpenUpdate}
                    onOpenAISummary={() => setIsAISummaryModalOpen(true)}
                  />
                )}
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="glass-panel border-t border-slate-200/80 py-4 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              🚀 iTasking Pro • Ultra-Premium Workspace
            </span>
            <span className="text-slate-400">Smart Task Tracker • Calendar & Timeline • Cloud Synced</span>
          </div>
        </footer>
      </div>

      {/* Quick Update Modal with Attachments & Full Edit */}
      <QuickUpdateModal
        task={activeTaskToUpdate}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setActiveTaskToUpdate(null);
        }}
        onSaveUpdate={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        availableUsers={availableAssignees}
        modules={categories}
        initialTab={initialUpdateTab}
        onOpenInfographic={handleOpenInfographic}
      />

      {/* Task Infographic Timeline & Journey Modal */}
      <TaskInfographicTimelineModal
        task={infographicTask}
        isOpen={isInfographicOpen}
        onClose={() => {
          setIsInfographicOpen(false);
          setInfographicTask(null);
        }}
        onOpenUpdateModal={(t, tab) => {
          setIsInfographicOpen(false);
          setActiveTaskToUpdate(t);
          setInitialUpdateTab(tab || 'log');
          setIsUpdateModalOpen(true);
        }}
        onSaveUpdate={(updatedTask) => {
          handleUpdateTask(updatedTask);
          setInfographicTask(updatedTask);
        }}
        modules={categories}
        availableUsers={availableAssignees}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isNewTaskFormOpen}
        onClose={() => setIsNewTaskFormOpen(false)}
        onAddTask={handleAddTask}
        modules={categories}
        availableUsers={availableAssignees}
      />

      {/* AI Smart Summary Modal */}
      <AISummaryModal
        isOpen={isAISummaryModalOpen}
        onClose={() => setIsAISummaryModalOpen(false)}
        tasks={tasks}
      />

      {/* Settings Modal (Categories, Team, System) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        categories={categories}
        tasks={tasks}
        onUpdateCategories={(newCats) => {
          setCategories(newCats);
          saveCategoriesToStorage(newCats);
          syncCategoriesToCloud(newCats).catch(() => {});
        }}
        onUpdateTasks={handleUpdateTasks}
        availableUsers={availableAssignees}
        onUpdateUsers={(newUsers) => {
          setCustomUsers(newUsers);
          try {
            localStorage.setItem('iTasking_custom_team', JSON.stringify(newUsers));
          } catch {}
        }}
        isCloudConnected={isCloudConnected}
        onRefreshCloud={handleRefreshCloud}
      />
    </div>
  );
}

export default App;
