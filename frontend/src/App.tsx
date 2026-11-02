import React, { useState, useEffect, useRef } from 'react';
import type {
  BackendCapabilities,
  BackendHealth,
  ExperimentConfig,
  ExperimentRecord,
} from './types';
import { api } from './services/api';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { OverviewPage } from './pages/OverviewPage';
import { LiveQueryPage } from './pages/LiveQueryPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ResultsPage } from './pages/ResultsPage';
import { ArchitecturePage } from './pages/ArchitecturePage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [capabilities, setCapabilities] = useState<BackendCapabilities | null>(null);

  // Active experiment execution state
  const [runningExperimentId, setRunningExperimentId] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [lastCompletedExperimentId, setLastCompletedExperimentId] = useState<string | null>(null);
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentRecord | null>(null);

  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load
  useEffect(() => {
    fetchHealth();
    fetchCapabilities();

    // Poll health periodically
    const healthInterval = setInterval(() => {
      fetchHealth(false);
    }, 8000);

    return () => {
      clearInterval(healthInterval);
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
    };
  }, []);

  const fetchHealth = async (showLoading: boolean = true) => {
    if (showLoading) setHealthLoading(true);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      if (showLoading) setHealthLoading(false);
    }
  };

  const fetchCapabilities = async () => {
    try {
      const data = await api.getCapabilities();
      setCapabilities(data);
    } catch (err) {
      console.warn('Could not fetch capabilities:', err);
    }
  };

  // Experiment submission and polling
  const handleSubmitExperiment = async (config: ExperimentConfig) => {
    try {
      const response = await api.submitExperiment(config);
      const expId = response.experiment_id;
      setRunningExperimentId(expId);
      setProgressPercent(0);
      setCurrentStep('Initializing worker threads...');

      // Start polling status
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);

      statusPollingRef.current = setInterval(async () => {
        try {
          const status = await api.getExperimentStatus(expId);
          setProgressPercent(status.progress.percent);
          setCurrentStep(status.progress.current_step);

          if (status.status === 'completed') {
            if (statusPollingRef.current) clearInterval(statusPollingRef.current);
            setRunningExperimentId(null);
            setLastCompletedExperimentId(expId);

            // Fetch complete result record
            const fullRecord = await api.getExperiment(expId);
            setCurrentExperiment(fullRecord);
            setActiveTab('results');
          } else if (status.status === 'failed' || status.status === 'cancelled') {
            if (statusPollingRef.current) clearInterval(statusPollingRef.current);
            setRunningExperimentId(null);
            alert(`Experiment ${status.status}: ${status.error || 'Execution stopped.'}`);
          }
        } catch (pollErr) {
          console.error('Error polling experiment status:', pollErr);
        }
      }, 600);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to start experiment: ${err.message}`);
      } else {
        alert('An unexpected error occurred while launching experiment.');
      }
    }
  };

  const handleCancelExperiment = async () => {
    if (!runningExperimentId) return;
    try {
      await api.cancelExperiment(runningExperimentId);
    } catch (err) {
      console.error('Error cancelling experiment:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-stone-900 font-sans selection:bg-brand-primary selection:text-white">
      {/* Light Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        healthLoading={healthLoading}
        onRefreshHealth={() => fetchHealth(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'overview' && (
          <OverviewPage
            onStartExperiment={() => setActiveTab('simulator')}
            health={health}
          />
        )}

        {activeTab === 'query' && <LiveQueryPage />}

        {activeTab === 'simulator' && (
          <SimulatorPage
            health={health}
            capabilities={capabilities}
            runningExperimentId={runningExperimentId}
            progressPercent={progressPercent}
            currentStep={currentStep}
            onSubmitExperiment={handleSubmitExperiment}
            onCancelExperiment={handleCancelExperiment}
            onViewResults={(id) => {
              if (currentExperiment && currentExperiment.id === id) {
                setActiveTab('results');
              } else {
                api.getExperiment(id).then((rec) => {
                  setCurrentExperiment(rec);
                  setActiveTab('results');
                });
              }
            }}
            lastCompletedExperimentId={lastCompletedExperimentId}
          />
        )}

        {activeTab === 'results' && (
          <ResultsPage
            currentExperiment={currentExperiment}
            onNavigateToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'architecture' && <ArchitecturePage />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
