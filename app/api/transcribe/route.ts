import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioFile } from '@/lib/modassembly/openai/transcribe';
import { checkRateLimit, sanitizeTranscript, sanitizeOrderItem } from '@/lib/utils/security';
import { createClient } from '@/lib/modassembly/supabase/client';

export async function POST(request: NextRequest) {
    try {
        // AI: Authentication and rate limiting
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // AI: Rate limiting for voice transcription
        try {
            checkRateLimit(session.user.id, 'transcribe');
        } catch (rateLimitError) {
            return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
        }
        
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }
        
        // AI: Validate file size and type
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (audioFile.size > maxFileSize) {
            return NextResponse.json({ error: 'Audio file too large' }, { status: 413 });
        }
        
        const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm'];
        if (!allowedTypes.includes(audioFile.type)) {
            return NextResponse.json({ error: 'Invalid audio file type' }, { status: 400 });
        }

        console.log(`Transcribing audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);

        // Convert File to Blob and use the transcribeAudioFile function
        const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
        const { items: transcriptionItems, transcription } = await transcribeAudioFile(audioBlob, audioFile.name);

        console.log('Transcription completed:', transcriptionItems);

        // AI: Sanitize transcription output before returning
        const safeMime = sanitizeTranscript(transcription);
        const safeItems = transcriptionItems.map(item => sanitizeOrderItem(item)).filter(item => item.length > 0);
        
        return NextResponse.json({
            transcription: safeMime,
            items: safeItems
        });
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return NextResponse.json(
            { error: 'Failed to transcribe audio' },
            { status: 500 }
        );
    }
} 