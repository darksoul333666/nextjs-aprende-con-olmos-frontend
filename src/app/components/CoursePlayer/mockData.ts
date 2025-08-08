import { Course } from './types';

export const mockCourse: Course = {
  id: 'ios-swift-complete-bootcamp',
  title: 'iOS & Swift - The Complete iOS App Development Bootcamp',
  description: 'From Beginner to iOS App Developer with Just One Course! Fully Updated with a Comprehensive Module Dedicated to SwiftUI!',
  rating: 4.7,
  totalStudents: 408351,
  totalDuration: 217800, // 60.5 hours in seconds
  price: 89.99,
  isPurchased: true,
  sections: [
    {
      id: 'section-1',
      title: 'Getting Started with iOS Development',
      description: 'Learn the basics of iOS development and set up your development environment',
      order: 1,
      videos: [
        {
          id: 'video-1-1',
          title: 'Welcome to the Course',
          description: 'Introduction to the course and what you will learn',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 180, // 3 minutes
          order: 1,
          isCompleted: true,
        },
        {
          id: 'video-1-2',
          title: 'Setting Up Your Development Environment',
          description: 'Install Xcode and configure your development environment',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 600, // 10 minutes
          order: 2,
          isCompleted: true,
        },
        {
          id: 'video-1-3',
          title: 'Understanding the iOS Ecosystem',
          description: 'Learn about iOS devices, versions, and development guidelines',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 900, // 15 minutes
          order: 3,
          isCompleted: false,
        }
      ]
    },
    {
      id: 'section-2',
      title: 'Swift Fundamentals',
      description: 'Master the Swift programming language fundamentals',
      order: 2,
      videos: [
        {
          id: 'video-2-1',
          title: 'Introduction to Swift',
          description: 'Learn the basics of Swift syntax and concepts',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 1200, // 20 minutes
          order: 1,
          isCompleted: false,
        },
        {
          id: 'video-2-2',
          title: 'Variables and Constants',
          description: 'Understanding variables, constants, and data types in Swift',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 1020, // 17 minutes
          order: 2,
          isCompleted: false,
        },
        {
          id: 'video-2-3',
          title: 'Control Flow',
          description: 'Learn about if statements, loops, and switch statements',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 1500, // 25 minutes
          order: 3,
          isCompleted: false,
        }
      ]
    },
    {
      id: 'section-3',
      title: 'Building Your First App',
      description: 'Create your first iOS app from scratch',
      order: 3,
      videos: [
        {
          id: 'video-3-1',
          title: 'Creating a New Xcode Project',
          description: 'Step-by-step guide to creating your first iOS project',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 900, // 15 minutes
          order: 1,
          isCompleted: false,
        },
        {
          id: 'video-3-2',
          title: 'Understanding the Interface Builder',
          description: 'Learn how to use Interface Builder to design your app UI',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 1800, // 30 minutes
          order: 2,
          isCompleted: false,
        },
        {
          id: 'video-3-3',
          title: 'Connecting UI to Code',
          description: 'Learn how to connect your UI elements to Swift code',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 1200, // 20 minutes
          order: 3,
          isCompleted: false,
        }
      ]
    },
    {
      id: 'section-4',
      title: 'Advanced iOS Concepts',
      description: 'Dive deeper into advanced iOS development concepts',
      order: 4,
      videos: [
        {
          id: 'video-4-1',
          title: 'Table Views and Collection Views',
          description: 'Learn how to display lists and grids in your iOS apps',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 2400, // 40 minutes
          order: 1,
          isCompleted: false,
          isLocked: true,
        },
        {
          id: 'video-4-2',
          title: 'Networking and APIs',
          description: 'Learn how to fetch data from the internet in your iOS apps',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 2100, // 35 minutes
          order: 2,
          isCompleted: false,
          isLocked: true,
        },
        {
          id: 'video-4-3',
          title: 'Core Data',
          description: 'Learn how to persist data in your iOS apps using Core Data',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          duration: 2700, // 45 minutes
          order: 3,
          isCompleted: false,
          isLocked: true,
        }
      ]
    }
  ]
};
