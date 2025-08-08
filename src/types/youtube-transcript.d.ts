declare module 'youtube-transcript' {
    export interface TranscriptPart {
        text: string
        offset: number
        duration?: number
    }

    export class YoutubeTranscript {
        static fetchTranscript(videoId: string): Promise<TranscriptPart[]>
    }
} 