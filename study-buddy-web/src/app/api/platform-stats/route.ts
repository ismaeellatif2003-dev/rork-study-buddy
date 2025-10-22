import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch platform stats from the backend API
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://rork-study-buddy-production-eeeb.up.railway.app';
    
    try {
      const response = await fetch(`${API_BASE}/platform-stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const stats = await response.json();
        return NextResponse.json(stats);
      }
    } catch (backendError) {
      console.log('Backend API not available, using fallback');
    }

    // Fallback to zero stats if backend is not available
    return NextResponse.json({
      totalNotes: 0,
      totalFlashcards: 0,
      totalConversations: 0,
      totalEssays: 0,
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    
    // Return zero stats if everything fails
    return NextResponse.json({
      totalNotes: 0,
      totalFlashcards: 0,
      totalConversations: 0,
      totalEssays: 0,
    });
  }
}
