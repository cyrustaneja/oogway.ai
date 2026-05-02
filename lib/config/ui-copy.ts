export const UI_COPY = {
  page: { 
    title: (expert: string, batch: string) => `${expert} · ${batch}`, 
    transcript_quality_label: { Good: 'Good', Degraded: 'Degraded', Poor: 'Poor' } 
  },
  sections: {
    keyLearningPoints: 'Key learning points',
    sessionFlow: 'Session flow',
    completeAnalysis: 'Complete analysis',
    contextSetting: 'Context setting',
    topicCoverage: 'Topic coverage',
    analogiesUsed: 'Analogies used',
    questionsAnswered: 'Questions answered',
    mostConfusingPoints: 'Most confusing points',
    mostEngagedStudent: 'Most engaged student',
    mostEngagedTopic: 'Most engaged topic',
    studentEngagement: 'Student engagement',
    accuracyIssues: 'Accuracy issues',
  },
  chapterCard: { 
    whatTaught: 'What was taught', 
    howTaught: 'How it was taught', 
    majorGap: 'Major gap', 
    analogy: 'Analogy used' 
  },
  showAll: (n: number, kind: string) => `+ Show all ${n} ${kind}`,
  flagBanner: { 
    high: (n: number) => `${n} high`, 
    medium: (n: number) => `${n} medium`, 
    low: (n: number) => `${n} low`, 
    ofKind: 'flag' 
  },
  collapseDefault: 3,
}
