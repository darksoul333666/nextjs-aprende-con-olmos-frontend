export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number; // in seconds
  thumbnail?: string;
  isCompleted?: boolean;
  isLocked?: boolean;
  order: number;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  videos: Video[];
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor?: string;
  thumbnail?: string;
  rating: number;
  totalStudents: number;
  totalDuration: number; // in seconds
  sections: Section[];
  price: number;
  isPurchased?: boolean;
}

export interface CourseProgress {
  courseId: string;
  completedVideos: string[];
  currentVideoId?: string;
  lastWatchedAt?: Date;
}
