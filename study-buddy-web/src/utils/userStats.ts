// User stats management utility
// This simulates cross-platform sync between mobile app and website

export interface UserStats {
  notes: number;
  flashcards: number;
  messages: number;
  essays: number;
}

export const updateUserStats = (type: keyof UserStats, increment: number = 1) => {
  const currentStats = localStorage.getItem('studyBuddyUserStats');
  let stats: UserStats;
  
  if (currentStats) {
    stats = JSON.parse(currentStats);
  } else {
    stats = { notes: 0, flashcards: 0, messages: 0, essays: 0 };
  }
  
  stats[type] += increment;
  localStorage.setItem('studyBuddyUserStats', JSON.stringify(stats));
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('userStatsUpdated', { detail: stats }));
  
  return stats;
};

export const getUserStats = (): UserStats => {
  const stats = localStorage.getItem('studyBuddyUserStats');
  if (stats) {
    return JSON.parse(stats);
  }
  return { notes: 0, flashcards: 0, messages: 0, essays: 0 };
};

export const setUserName = (name: string) => {
  localStorage.setItem('studyBuddyUserName', name);
  window.dispatchEvent(new CustomEvent('userNameUpdated', { detail: name }));
};

export const getUserName = (): string => {
  return localStorage.getItem('studyBuddyUserName') || 'John Doe';
};
