import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch platform stats from the backend API
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://rork-study-buddy-production-eeeb.up.railway.app';
    
    console.log('🔍 Fetching platform stats from:', `${API_BASE}/platform-stats`);
    
    try {
      const response = await fetch(`${API_BASE}/platform-stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Backend response status:', response.status);
      
      if (response.ok) {
        const stats = await response.json();
        console.log('✅ Platform stats from backend:', stats);
        return NextResponse.json(stats);
      } else {
        console.log('❌ Backend API returned error:', response.status, response.statusText);
      }
    } catch (backendError) {
      console.log('❌ Backend API not available:', backendError);
    }

    // Fallback to zero stats if backend is not available
    console.log('🔄 Using fallback zero stats');
    return NextResponse.json({
      totalNotes: 0,
      totalFlashcards: 0,
      totalConversations: 0,
      totalEssays: 0,
    });
  } catch (error) {
    console.error('❌ Error fetching platform stats:', error);
    
    // Return zero stats if everything fails
    return NextResponse.json({
      totalNotes: 0,
      totalFlashcards: 0,
      totalConversations: 0,
      totalEssays: 0,
    });
  }
}
