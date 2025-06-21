export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    topics?: string[];
    subtopics?: string[];
    category?: string;
    img?: string;
    media?: string;
    audio?: string;
    short_explanation?: string;
    long_explanation?: string;
    clinical_application?: string;
    source_reference?: string;
    tags?: string[];
    keywords?: string[];
    difficulty?: string; // Added for adaptive difficulty
}

export interface Stat {
    userId: string;
    questionId: string;
    answeredCorrectly: boolean;
    timestamp: Date;
}

export interface Bookmark {
    userId: string;
    questionId: string;
    timestamp: Date;
}

export interface ErrorLog {
    userId: string;
    errorMessage: string;
    timestamp: Date;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    criteria: string;
}