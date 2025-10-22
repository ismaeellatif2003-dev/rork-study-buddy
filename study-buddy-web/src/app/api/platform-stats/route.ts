import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return impressive demo numbers
    // In production, you would query your database here
    const platformStats = {
      totalNotes: 125000,
      totalFlashcards: 890000,
      totalConversations: 45000,
      totalEssays: 12000,
    };

    return NextResponse.json(platformStats);
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform stats' },
      { status: 500 }
    );
  }
}
