import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioFile } from '@/lib/modassembly/openai/transcribe';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        console.log(`Transcribing audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);

        // Convert File to Blob and use the transcribeAudioFile function
        const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
        const { items: transcriptionItems, transcription } = await transcribeAudioFile(audioBlob, audioFile.name);

        console.log('Transcription completed:', transcriptionItems);

        return NextResponse.json({
            transcription: transcription,
            items: transcriptionItems
        });
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return NextResponse.json(
            { error: 'Failed to transcribe audio' },
            { status: 500 }
        );
    }
} 