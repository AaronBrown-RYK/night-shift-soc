import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import AlertQueue from './components/AlertQueue';
import AlertDetail from './components/AlertDetail';
import ShiftReportModal from './components/ShiftReportModal';
import AnalystDossierModal from './components/AnalystDossierModal';
import SOPReferenceModal from './components/SOPReferenceModal';
import CampaignSelectModal from './components/CampaignSelectModal';
import TutorialGuide from './components/TutorialGuide';
import TutorialPromptModal from './components/TutorialPromptModal';
import { socApi } from './services/api';
import { sound } from './services/audio';

export default function App() {
  const [shift, setShift] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  
  // Game clock state (0 to 600 seconds = 10 game minutes)
  const [gameSeconds, setGameSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(2); // default 2x speed for brisk, exciting pacing
  
  // Modals & UI state
  const [report, setReport] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isSOPOpen, setIsSOPOpen] = useState(false);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [isTutorialPromptOpen, setIsTutorialPromptOpen] = useState(false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [analystProfile, setAnalystProfile] = useState(null);
  const [isStartingShift, setIsStartingShift] = useState(false);

  const prevAlertCount = useRef(0);

  // Load analyst profile on initial mount and check first-time onboarding
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const res = await socApi.getAnalystProfile('Echo-Seven');
      if (res.profile) {
        setAnalystProfile(res.profile);
        // Prompt first-time analyst if 0 shifts completed and tutorial not completed
        if (res.profile.shifts_completed === 0 && !res.profile.tutorial_completed) {
          setIsTutorialPromptOpen(true);
          startNewShift();
          return;
        }
      }
      startNewShift();
    } catch (err) {
      console.error('Failed to init app:', err);
      startNewShift();
    }
  };

  const loadAnalystProfile = async () => {
    try {
      const res = await socApi.getAnalystProfile('Echo-Seven');
      if (res.profile) setAnalystProfile(res.profile);
    } catch (err) {
      console.error('Failed to load analyst profile:', err);
    }
  };

  const startNewShift = async () => {
    try {
      setIsStartingShift(true);
      setIsTutorialActive(false);
      setTutorialStep(null);
      const res = await socApi.startShift('Echo-Seven', 'Sector 4 Night Watch');
      if (res.success && res.shift) {
        setShift(res.shift);
        setAlerts(res.shift.alerts || []);
        setGameSeconds(0);
        setIsRunning(true);
        setIsReportOpen(false);
        setReport(null);
        setSelectedAlertId(null);
        prevAlertCount.current = 0;
      }
    } catch (err) {
      console.error('Error starting new shift:', err);
    } finally {
      setIsStartingShift(false);
    }
  };

  // Launch scripted 3-alert Tutorial Shift
  const startTutorialShift = async () => {
    try {
      setIsStartingShift(true);
      const res = await socApi.startTutorialShift(analystProfile?.callsign || 'Echo-Seven');
      if (res.success && res.shift) {
        setShift(res.shift);
        setAlerts(res.shift.alerts || []);
        setGameSeconds(0);
        setIsRunning(true);
        setSpeed(1); // 1x pacing for tutorial
        setIsReportOpen(false);
        setReport(null);
        setIsTutorialActive(true);
        setTutorialStep(1);
        if (res.shift.alerts && res.shift.alerts.length > 0) {
          setSelectedAlertId(res.shift.alerts[0].id);
        }
        prevAlertCount.current = res.shift.alerts?.length || 0;
      }
    } catch (err) {
      console.error('Error starting tutorial shift:', err);
    } finally {
      setIsStartingShift(false);
    }
  };

  const handleTutorialNextStep = () => {
    sound.playClick();
    if (tutorialStep === 1) {
      setTutorialStep(2);
      if (alerts.length > 0) setSelectedAlertId(alerts[0].id);
    } else if (tutorialStep === 2) {
      setTutorialStep(3);
    } else if (tutorialStep === 3) {
      setTutorialStep(4);
    } else if (tutorialStep === 7) {
      handleConcludeShift();
    }
  };

  const handleLaunchCampaignShift = async (shiftNumber) => {
    try {
      setIsStartingShift(true);
      setIsTutorialActive(false);
      setTutorialStep(null);
      const res = await socApi.startCampaignShift(shiftNumber, analystProfile?.callsign || 'Echo-Seven');
      if (res.success && res.shift) {
        setShift(res.shift);
        setAlerts(res.shift.alerts || []);
        setGameSeconds(0);
        setIsRunning(true);
        setIsReportOpen(false);
        setReport(null);
        setSelectedAlertId(null);
        prevAlertCount.current = 0;
      }
    } catch (err) {
      console.error('Error starting campaign shift:', err);
      alert(`Launch Error: ${err.message}`);
    } finally {
      setIsStartingShift(false);
    }
  };

  // Game clock ticker loop
  useEffect(() => {
    if (!isRunning || !shift || shift.status !== 'ACTIVE' || isReportOpen) return;

    const intervalMs = 1000 / speed;
    const timer = setInterval(() => {
      setGameSeconds(prev => {
        const next = prev + 1;
        if (next >= 600) {
          // 10-minute shift elapsed!
          handleConcludeShift(600);
          return 600;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, speed, shift, isReportOpen]);

  // Synchronize alerts when game clock progresses
  useEffect(() => {
    if (!shift || shift.status !== 'ACTIVE') return;

    // Check backend for state at current second
    socApi.getShiftState(shift.shiftId, gameSeconds)
      .then(res => {
        if (res.success && res.shift) {
          setShift(prev => ({
            ...prev,
            score: res.shift.score,
            pendingCount: res.shift.pendingCount,
            triagedCount: res.shift.triagedCount,
            totalScheduled: res.shift.totalScheduled
          }));

          const updatedAlerts = res.shift.alerts || [];
          setAlerts(updatedAlerts);

          // Audio notification if a new alert just arrived
          if (updatedAlerts.length > prevAlertCount.current) {
            const newlyArrived = updatedAlerts[updatedAlerts.length - 1];
            if (newlyArrived) {
              sound.playAlertIncoming(newlyArrived.severity);
            }
            prevAlertCount.current = updatedAlerts.length;
          }

          // Select first alert if nothing is selected
          if (!selectedAlertId && updatedAlerts.length > 0) {
            setSelectedAlertId(updatedAlerts[0].id);
          }
        }
      })
      .catch(err => console.error('Error syncing shift state:', err));
  }, [Math.floor(gameSeconds / 2)]); // Sync every ~2 game seconds

  // Handle Action taken on selected alert
  const handleTakeAction = async (alertId, actionTaken) => {
    if (!shift) return;

    try {
      const res = await socApi.submitAction(shift.shiftId, {
        alertId,
        actionTaken,
        gameSecond: gameSeconds
      });

      if (res.success) {
        // Play audio feedback based on whether action was correct
        if (res.result.isCorrect) {
          sound.playSuccess();
        } else {
          sound.playFailure();
        }

        // Update local alerts list
        setAlerts(prev => prev.map(a => {
          if (a.id === alertId) {
            return {
              ...a,
              ...res.updatedAlert
            };
          }
          return a;
        }));

        // Update shift score
        setShift(prev => ({
          ...prev,
          score: res.currentShiftScore,
          triagedCount: (prev?.triagedCount || 0) + 1,
          pendingCount: Math.max(0, (prev?.pendingCount || 1) - 1)
        }));

        // Advance tutorial steps automatically
        if (isTutorialActive) {
          if (tutorialStep === 4) {
            setTutorialStep(5);
            // Select second alert (the benign vulnerability scanner)
            const secondAlert = alerts.find(a => a.scenarioId === 'SCENARIO_BENIGN_SCANNER_01' || a.id !== alertId);
            if (secondAlert) {
              setSelectedAlertId(secondAlert.id);
            }
          } else if (tutorialStep === 5) {
            setTutorialStep(6);
            // Select third alert (brute force credential stuffing)
            const thirdAlert = alerts.find(a => a.scenarioId === 'SCENARIO_BRUTE_FORCE_01' || (a.id !== alertId && a.status === 'PENDING'));
            if (thirdAlert) {
              setSelectedAlertId(thirdAlert.id);
            }
          } else if (tutorialStep === 6) {
            // Completed solo rep - move to debrief prompt step 7
            setTutorialStep(7);
          }
        }
      }
    } catch (err) {
      console.error('Error submitting action:', err);
      alert(`Dispatch Error: ${err.message}`);
    }
  };

  // Conclude Shift & Compile Report
  const handleConcludeShift = async (finalSecond = gameSeconds) => {
    if (!shift) return;
    setIsRunning(false);

    try {
      const res = await socApi.completeShift(shift.shiftId, finalSecond);
      if (res.success) {
        setReport(res.report);
        setIsReportOpen(true);
        if (res.analystProfile) {
          setAnalystProfile(res.analystProfile);
        }

        // Record tutorial completion if this was a practice tutorial shift
        if (isTutorialActive || shift?.isTutorial || shift?.isPractice) {
          socApi.completeTutorial(analystProfile?.callsign || 'Echo-Seven')
            .then(p => {
              if (p && p.profile) setAnalystProfile(p.profile);
            })
            .catch(err => console.error('Error completing tutorial:', err));
          setIsTutorialActive(false);
          setTutorialStep(null);
        }

        if (res.report.grade === 'S' || res.report.grade === 'A') {
          sound.playSuccess();
        } else if (res.report.grade === 'F') {
          sound.playFailure();
        }
      }
    } catch (err) {
      console.error('Error concluding shift:', err);
    }
  };

  // Fast forward / Skip to Next Alert
  const handleSkipNext = () => {
    sound.playClick();
    // Known scheduled arrival offsets: 15, 80, 160, 240, 360
    const offsets = [15, 80, 160, 240, 360];
    const nextOffset = offsets.find(o => o > gameSeconds);
    if (nextOffset) {
      setGameSeconds(nextOffset);
    } else {
      setGameSeconds(prev => Math.min(600, prev + 30));
    }
  };

  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 select-none crt-overlay">
      {/* Top Header Bar */}
      <Header
        shift={shift}
        gameSeconds={gameSeconds}
        isRunning={isRunning}
        onToggleTimer={() => {
          sound.playClick();
          setIsRunning(!isRunning);
        }}
        speed={speed}
        onChangeSpeed={(newSpeed) => {
          sound.playClick();
          setSpeed(newSpeed);
        }}
        onSkipNext={handleSkipNext}
        onFinishShift={() => handleConcludeShift(gameSeconds)}
        analystProfile={analystProfile}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const enabled = sound.toggleSound();
          setSoundEnabled(enabled);
        }}
        onOpenDossier={() => {
          sound.playClick();
          setIsDossierOpen(true);
        }}
        onOpenSOP={() => {
          sound.playClick();
          setIsSOPOpen(true);
        }}
        onOpenCampaign={() => {
          sound.playClick();
          setIsCampaignOpen(true);
        }}
        onStartTutorial={startTutorialShift}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Triage Queue */}
        <AlertQueue
          alerts={alerts}
          selectedAlertId={selectedAlertId}
          onSelectAlert={(id) => setSelectedAlertId(id)}
          gameSeconds={gameSeconds}
        />

        {/* Center / Right Alert Detail & Action Console */}
        <AlertDetail
          alert={selectedAlert}
          onTakeAction={handleTakeAction}
          gameSeconds={gameSeconds}
          isShiftCompleted={isReportOpen || shift?.status === 'COMPLETED'}
          analystProfile={analystProfile}
        />
      </div>

      {/* End-of-Shift Debrief Modal */}
      {isReportOpen && (
        <ShiftReportModal
          report={report}
          analystProfile={analystProfile}
          onStartNewShift={() => {
            setIsTutorialActive(false);
            setTutorialStep(null);
            startNewShift();
          }}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {/* Persistent Analyst Dossier Modal */}
      <AnalystDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        onProfileUpdated={(updated) => setAnalystProfile(updated)}
      />

      {/* SOP Incident Handbook Modal */}
      <SOPReferenceModal
        isOpen={isSOPOpen}
        onClose={() => setIsSOPOpen(false)}
      />

      {/* Tactical Campaign Mission Selector Modal */}
      <CampaignSelectModal
        isOpen={isCampaignOpen}
        onClose={() => setIsCampaignOpen(false)}
        onLaunchCampaignShift={handleLaunchCampaignShift}
        analystProfile={analystProfile}
      />

      {/* Interactive Guided Tutorial Overlay */}
      <TutorialGuide
        step={isTutorialActive ? tutorialStep : null}
        onNextStep={handleTutorialNextStep}
        onSkipTutorial={() => {
          setIsTutorialActive(false);
          setTutorialStep(null);
        }}
        currentAlert={selectedAlert}
        onSelectAlert={(id) => setSelectedAlertId(id)}
        alerts={alerts}
        onConcludeShift={() => handleConcludeShift()}
      />

      {/* First-Time Analyst Tutorial Onboarding Prompt Modal */}
      <TutorialPromptModal
        isOpen={isTutorialPromptOpen}
        onStartTutorial={() => {
          setIsTutorialPromptOpen(false);
          startTutorialShift();
        }}
        onStartRegular={() => {
          setIsTutorialPromptOpen(false);
          setIsTutorialActive(false);
          setTutorialStep(null);
          startNewShift();
        }}
        onClose={() => setIsTutorialPromptOpen(false)}
      />
    </div>
  );
}
