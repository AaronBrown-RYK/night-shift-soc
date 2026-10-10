/**
 * Scoring and pedagogical evaluation engine for Night Shift: SOC.
 * Designed to teach cybersecurity analysts the real-world trade-offs of triage:
 * Dismissing a true attack (False Negative) leads to catastrophic breach penalties,
 * while escalating a false positive wastes time/bandwidth (minor penalty).
 */

class ScoringEngine {
  /**
   * Evaluate a single analyst action against scenario definition.
   */
  evaluateAction(scenario, actionTaken, timeToTriageSeconds = 0) {
    const isOptimal = scenario.optimal_action === actionTaken;
    const isAcceptable = scenario.acceptable_actions?.includes(actionTaken) || false;
    const isCorrect = isOptimal || isAcceptable;

    // Base score from scenario definition or fallback defaults
    let basePoints = 0;
    if (scenario.scoring && typeof scenario.scoring[actionTaken] === 'number') {
      basePoints = scenario.scoring[actionTaken];
    } else {
      if (isOptimal) basePoints = 100;
      else if (isAcceptable) basePoints = 60;
      else if (actionTaken === 'Dismiss' && scenario.category !== 'benign_baseline') {
        basePoints = -250; // Severe penalty for dismissing active adversary
      } else {
        basePoints = -80;
      }
    }

    // Speed bonus for quick, decisive action on genuine threats
    let speedBonus = 0;
    if (isCorrect && basePoints > 0 && timeToTriageSeconds > 0 && timeToTriageSeconds <= 30) {
      speedBonus = 15; // Quick response commendation
    }

    const totalPoints = basePoints + speedBonus;

    // Feedback message
    const feedbackText = scenario.feedback?.[actionTaken] || (
      isCorrect ? `Correct action taken: ${actionTaken}. Threat mitigated.`
                : `Incorrect action: ${actionTaken}. Optimal was ${scenario.optimal_action}.`
    );

    // Classification category for SOC metrics
    let classification = 'UNKNOWN';
    if (scenario.category === 'benign_baseline') {
      if (actionTaken === 'Dismiss') classification = 'TRUE_NEGATIVE'; // Correct dismissal
      else if (actionTaken === 'Escalate') classification = 'FALSE_ALARM_ESCALATION'; // Benign escalated
      else classification = 'FALSE_ALARM_OVERKILL'; // Benign blocked/isolated
    } else {
      if (isCorrect) classification = 'TRUE_POSITIVE'; // Threat caught & mitigated
      else if (actionTaken === 'Dismiss') classification = 'FALSE_NEGATIVE'; // Threat missed/dismissed (breach!)
      else classification = 'WRONG_MITIGATION'; // Wrong remediation applied
    }

    return {
      actionTaken,
      optimalAction: scenario.optimal_action,
      acceptableActions: scenario.acceptable_actions || [],
      isCorrect,
      isOptimal,
      basePoints,
      speedBonus,
      totalPoints,
      classification,
      feedback: feedbackText,
      educationalRationale: scenario.educational_rationale
    };
  }

  /**
   * Compile comprehensive End-of-Shift report.
   */
  compileShiftReport(shiftState, actionsHistory) {
    const totalAlerts = shiftState.alerts.length;
    const triagedActions = actionsHistory || [];
    const triagedCount = triagedActions.length;
    const untriagedCount = totalAlerts - triagedCount;

    let totalScore = 0;
    let correctCount = 0;
    let caughtCount = 0;
    let missedCount = 0;
    let falsePositivePenalties = 0;
    let totalDecisionTime = 0;

    const breakdown = [];

    // Evaluate each scheduled alert
    for (const alert of shiftState.alerts) {
      const actionRecord = triagedActions.find(a => a.alertId === alert.id);
      if (actionRecord) {
        totalScore += actionRecord.points;
        totalDecisionTime += (actionRecord.decisionTimeSeconds || 0);

        if (actionRecord.isCorrect) {
          correctCount++;
        }

        if (alert.scenario.category !== 'benign_baseline') {
          if (actionRecord.isCorrect) caughtCount++;
          else missedCount++;
        } else {
          if (!actionRecord.isCorrect) falsePositivePenalties++;
        }

        breakdown.push({
          alertId: alert.id,
          title: alert.scenario.title,
          severity: alert.scenario.severity,
          category: alert.scenario.category,
          sourceIp: alert.scenario.source_ip,
          targetAsset: alert.scenario.hostname,
          actionTaken: actionRecord.actionTaken,
          optimalAction: alert.scenario.optimal_action,
          isCorrect: actionRecord.isCorrect,
          points: actionRecord.points,
          decisionTimeSeconds: actionRecord.decisionTimeSeconds,
          feedback: actionRecord.feedback,
          educationalRationale: alert.scenario.educational_rationale
        });
      } else {
        // Untriaged / Expired alert at shift end
        const isThreat = alert.scenario.category !== 'benign_baseline';
        const unhandledPenalty = isThreat ? -200 : 0;
        totalScore += unhandledPenalty;
        if (isThreat) missedCount++;

        breakdown.push({
          alertId: alert.id,
          title: alert.scenario.title,
          severity: alert.scenario.severity,
          category: alert.scenario.category,
          sourceIp: alert.scenario.source_ip,
          targetAsset: alert.scenario.hostname,
          actionTaken: 'UNHANDLED / EXPIRED',
          optimalAction: alert.scenario.optimal_action,
          isCorrect: false,
          points: unhandledPenalty,
          decisionTimeSeconds: 0,
          feedback: isThreat 
            ? 'UNHANDLED BREACH: Alert expired in queue without triage! Threat persisted in the network.'
            : 'ALERT EXPIRED: Benign alert expired without review.',
          educationalRationale: alert.scenario.educational_rationale
        });
      }
    }

    const accuracyPercent = totalAlerts > 0 ? Math.round((correctCount / totalAlerts) * 100) : 0;
    const mtttSeconds = triagedCount > 0 ? Number((totalDecisionTime / triagedCount).toFixed(1)) : 0;

    // Rating determination
    let grade = 'C';
    let statusSummary = 'Shift Concluded';
    let badgeClass = 'text-yellow-400';

    if (accuracyPercent >= 90 && totalScore >= 400 && missedCount === 0) {
      grade = 'S';
      statusSummary = 'FLAWLESS WATCH — Perimeter fully secured, zero breaches.';
      badgeClass = 'text-emerald-400';
    } else if (accuracyPercent >= 75 && missedCount === 0) {
      grade = 'A';
      statusSummary = 'COMMENDED TRIAGE — All active adversary actions mitigated.';
      badgeClass = 'text-cyan-400';
    } else if (accuracyPercent >= 60 && missedCount <= 1) {
      grade = 'B';
      statusSummary = 'ACCEPTABLE PERFORMANCE — Minor breach containment delay.';
      badgeClass = 'text-blue-400';
    } else if (missedCount > 1 || accuracyPercent < 45) {
      grade = 'F';
      statusSummary = 'BREACH INCURRED — Adversaries established persistent footholds during your shift.';
      badgeClass = 'text-red-500';
    } else {
      grade = 'C';
      statusSummary = 'DEFICIENT TRIAGE — Review standard operating procedures.';
      badgeClass = 'text-amber-400';
    }

    return {
      grade,
      statusSummary,
      finalScore: totalScore,
      accuracyPercent,
      mtttSeconds,
      totalAlerts,
      triagedCount,
      untriagedCount,
      caughtCount,
      missedCount,
      falsePositivePenalties,
      isPractice: Boolean(shiftState.isPractice),
      isTutorial: Boolean(shiftState.isTutorial),
      breakdown
    };
  }
}

module.exports = new ScoringEngine();
