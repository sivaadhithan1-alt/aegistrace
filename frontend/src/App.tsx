import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { FloatingDemoCard } from './components/FloatingDemoCard';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { ContactsView } from './components/ContactsView';
import { DocumentCenterView } from './components/DocumentCenterView';
import { SecurityCenterView } from './components/SecurityCenterView';
import { EncryptionLabView } from './components/EncryptionLabView';
import { LedgerExplorer } from './components/LedgerExplorer';
import { ForensicLab } from './components/ForensicLab';
import { IdentityKeysView } from './components/IdentityKeysView';
import { SystemStatusView } from './components/SystemStatusView';
import { SettingsPolicyView } from './components/SettingsPolicyView';
import { DemoScenarioRunnerView } from './components/DemoScenarioRunnerView';
import { UserInfo } from './types';
import { api } from './api/client';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [currentUser, setCurrentUser] = useState<string>('arjun');
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoCurrentStep, setDemoCurrentStep] = useState<number>(0);
  const [demoCompletedSteps, setDemoCompletedSteps] = useState<number[]>([]);
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  // Sidebar renders local demo personas while backend data hydrates.

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // These requests are independent; do not serialize them during refresh.
      const [usersResult, demoResult] = await Promise.allSettled([
        api.listUsers(),
        api.getDemoState()
      ]);

      if (usersResult.status === 'fulfilled') {
        const uList = usersResult.value;
        setUsers(uList);
        if (uList.length > 0) {
          const arjun = uList.find(u => u.user_id === 'arjun');
          if (arjun) {
            setCurrentUser('arjun');
            api.setCurrentUser('arjun');
          } else {
            setCurrentUser(uList[0].user_id);
            api.setCurrentUser(uList[0].user_id);
          }
        }
      }

      if (demoResult.status === 'fulfilled') {
        setDemoCurrentStep(demoResult.value.current_step || 0);
        setDemoCompletedSteps(demoResult.value.completed_steps || []);
      }
    } catch (err) {
      console.error('Failed to initialize AegisTrace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setCurrentUser(userId);
    api.setCurrentUser(userId);
  };

  const handleLaunchJudgeDemo = async (startStep: number = 1) => {
    setIsDemoActive(true);
    await handleExecuteDemoStep(startStep, 'demo');
  };

  const handleCloseJudgeDemo = () => {
    setIsDemoActive(false);
  };

  const handleExecuteDemoStep = async (stepNum: number, targetPage: PageId) => {
    setIsDemoLoading(true);
    try {
      const res = await api.runDemoStep(stepNum);
      setDemoCurrentStep(res.current_step);
      setDemoCompletedSteps(res.completed_steps);

      // Refresh users if step modified identities
      const uList = await api.listUsers();
      setUsers(uList);

      // Auto-switch persona based on step context for judge clarity
      if (stepNum <= 5) {
        handleSelectUser('arjun');
      } else if (stepNum === 6) {
        handleSelectUser('priya');
      } else if (stepNum === 7) {
        handleSelectUser('rahul');
      } else if (stepNum === 8) {
        handleSelectUser('vikram');
      } else if (stepNum >= 10) {
        handleSelectUser('meera');
      }

      // Automatically navigate to target page
      setCurrentPage(targetPage);
    } catch (err) {
      console.error(`Demo step ${stepNum} failed:`, err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setIsDemoLoading(true);
    try {
      await api.resetDemo();
      setDemoCurrentStep(0);
      setDemoCompletedSteps([]);
      const uList = await api.listUsers();
      setUsers(uList);
      handleSelectUser('arjun');
      setCurrentPage('demo');
    } catch (err) {
      console.error('Reset demo failed:', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleRunFullScenario = async () => {
    setIsDemoLoading(true);
    try {
      const res = await api.runFullDemoScenario();
      setDemoCurrentStep(12);
      setDemoCompletedSteps([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      handleSelectUser('meera');
      setIsDemoActive(true);
      setCurrentPage('forensics');
    } catch (err) {
      console.error('Full scenario failed:', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(page) => {
          setCurrentPage(page);
          setIsMobileNavOpen(false);
        }}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="min-w-0 flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <TopBar
          currentPage={currentPage}
          currentUser={currentUser}
          users={users}
          onOpenDemo={() => handleLaunchJudgeDemo(1)}
          onRefresh={loadInitialData}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        {/* Scrollable View Area */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50">
          {currentPage === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              users={users}
              onNavigate={setCurrentPage}
              onLaunchDemo={() => handleLaunchJudgeDemo(1)}
            />
          )}

          {currentPage === 'chats' && (
            <ChatView
              currentUser={currentUser}
              users={users}
            />
          )}

          {currentPage === 'contacts' && (
            <ContactsView
              users={users}
              currentUser={currentUser}
              onSelectUser={handleSelectUser}
              onNavigate={setCurrentPage}
              onRefresh={loadInitialData}
            />
          )}

          {currentPage === 'documents' && (
            <DocumentCenterView
              currentUser={currentUser}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'security' && (
            <SecurityCenterView />
          )}

          {currentPage === 'encryption' && (
            <EncryptionLabView
              users={users}
              currentUser={currentUser}
            />
          )}

          {currentPage === 'ledger' && (
            <LedgerExplorer />
          )}

          {currentPage === 'forensics' && (
            <ForensicLab />
          )}

          {currentPage === 'identity' && (
            <IdentityKeysView
              users={users}
              currentUser={currentUser}
              onRefresh={loadInitialData}
            />
          )}

          {currentPage === 'system' && (
            <SystemStatusView />
          )}

          {currentPage === 'settings' && (
            <SettingsPolicyView />
          )}

          {currentPage === 'demo' && (
            <DemoScenarioRunnerView
              currentStep={demoCurrentStep}
              completedSteps={demoCompletedSteps}
              isDemoActive={isDemoActive}
              onLaunchDemo={() => handleLaunchJudgeDemo(1)}
              onSelectStep={async (step, page) => {
                setIsDemoActive(true);
                await handleExecuteDemoStep(step, page);
              }}
              onResetDemo={handleResetDemo}
              onRunFullScenario={handleRunFullScenario}
              isLoading={isDemoLoading}
            />
          )}
        </main>
      </div>

      {/* SIH Judge Demo Floating Card: Only displayed when launched */}
      <FloatingDemoCard
        isOpen={isDemoActive}
        currentStep={demoCurrentStep}
        onSelectStep={handleExecuteDemoStep}
        onResetDemo={handleResetDemo}
        onNavigatePage={setCurrentPage}
        onClose={handleCloseJudgeDemo}
        onComplete={handleCloseJudgeDemo}
        isLoading={isDemoLoading}
      />
    </div>
  );
};

export default App;
