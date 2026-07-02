import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';


// Mock IndexedDB database utilities
vi.mock('../utils/db', () => ({
  initDB: vi.fn().mockResolvedValue({}),
  seedDefaultDictionary: vi.fn().mockResolvedValue({}),
  seedDefaultLogs: vi.fn().mockResolvedValue({}),
  getProgress: vi.fn().mockResolvedValue({
    id: 'user_stats',
    streak: 12,
    xp: 450,
    coins: 75,
    completedWeeks: [1],
    studyTime: [20, 30, 15, 35, 25, 45, 0],
    lastStudyDate: '2026-06-30',
    lpkId: 'lpk_a'
  }),
  saveProgress: vi.fn().mockResolvedValue(true),
  addLog: vi.fn().mockResolvedValue(true),
  getVoiceSignature: vi.fn().mockResolvedValue(null)
}));

// Mock Speech Synthesis and Recognition APIs
if (typeof window !== 'undefined') {
  window.speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn().mockReturnValue([])
  };
}

describe('KaigoLingo Session Flow Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete Day 2 session, show results, and return to map successfully', async () => {
    render(<App />);

    // 1. Wait for database and progress loading
    await waitFor(() => {
      expect(screen.getByText('Halo, Budi!')).toBeInTheDocument();
    });

    // 2. Click on Day 2 (Aisatsu Kerja) node on the Map
    const node2 = screen.getByText('Aisatsu Kerja');
    expect(node2).toBeInTheDocument();
    fireEvent.click(node2);

    // 3. Click "Mulai Latihan" in the node details modal
    const startButton = screen.getByText('Mulai Latihan');
    expect(startButton).toBeInTheDocument();
    fireEvent.click(startButton);

    // 4. We are now in LearnScreen. Let's loop through all questions.
    // Day 2 has targetCount = 11 questions.
    let questionCount = 0;
    const maxQuestions = 30; // safety limit

    while (questionCount < maxQuestions) {
      // Check if we reached the results screen
      if (screen.queryByText('SKOR') && screen.queryByText('STATUS')) {
        break;
      }

      // Detect question type by checking elements on screen
      const options = screen.queryAllByRole('button');
      
      // Case A: Matching Question (Type A)
      const pairsContainer = screen.queryByText('Cocokkan');
      if (pairsContainer || screen.queryByText('Cocokkan salam kerja berikut dengan tepat!')) {
        // Simulating matching by clicking left and right cards
        const leftCards = screen.queryAllByText(/Ojamashimasu|Kashikomarimashita|Otsukaresama|Shitsureishimasu/i);
        const rightCards = screen.queryAllByText(/Permisi|Baik|Terima kasih/i);
        
        if (leftCards.length > 0 && rightCards.length > 0) {
          fireEvent.click(leftCards[0]);
          fireEvent.click(rightCards[0]);
        }
      }

      // Case B: Listening Question (Type B)
      const playButton = screen.queryByText('Dengar');
      if (playButton || screen.queryByText('Dengar dan pilih arti yang tepat!')) {
        // Click the first option
        const radioOptions = screen.queryAllByRole('radio');
        if (radioOptions.length > 0) {
          fireEvent.click(radioOptions[0]);
        }
      }

      // Case C: Typing Question (Type C)
      const textInput = screen.queryByPlaceholderText(/Ketik ejaan Romaji/i) || screen.queryByRole('textbox');
      if (textInput) {
        fireEvent.change(textInput, { target: { value: 'shitsureishimasu' } });
      }

      // Case D: Shadowing Question (Type D)
      const bypassButton = screen.queryByText('Saya Tidak Bisa Bicara Sekarang');
      if (bypassButton) {
        // Use our new bypass button to mark it wrong and proceed
        fireEvent.click(bypassButton);
      }

      // Click "Periksa Jawaban" if it is visible and enabled
      const checkButton = screen.queryByText('Periksa Jawaban');
      if (checkButton && !checkButton.disabled) {
        fireEvent.click(checkButton);
      }

      // Click "Lanjutkan" to go to the next question
      const nextButton = screen.queryByText('Lanjutkan');
      if (nextButton) {
        fireEvent.click(nextButton);
        questionCount++;
      }

      // Wait a tiny bit for React state updates
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // 5. Verify we transitioned to the Results Screen successfully
    expect(screen.getByText('SKOR')).toBeInTheDocument();
    expect(screen.getByText('STATUS')).toBeInTheDocument();
    expect(screen.getByText(/Koin/i)).toBeInTheDocument();

    // 6. Click "Kembali ke Map" button
    const backToMapButton = screen.getByText('Kembali ke Map');
    expect(backToMapButton).toBeInTheDocument();
    fireEvent.click(backToMapButton);

    // 7. Verify we returned to the Map Screen
    await waitFor(() => {
      expect(screen.getByText('Jalur Belajar')).toBeInTheDocument();
    });
  });
});
