import { Course } from '../components/CoursePlayer/types';

export const availableCourses: Course[] = [
  {
    id: 'algebra-basica',
    title: 'Álgebra Básica',
    description: 'Domina los fundamentos del álgebra: ecuaciones, polinomios, factorización y más. Perfecto para estudiantes de secundaria y preparatoria.',
    rating: 4.8,
    totalStudents: 1250,
    totalDuration: 144000, // 40 horas
    price: 299.99,
    isPurchased: false,
    thumbnail: '/images/algebra-thumbnail.jpg',
    sections: [
      {
        id: 'section-1',
        title: 'Fundamentos del Álgebra',
        description: 'Introducción a los conceptos básicos del álgebra',
        order: 1,
        videos: [
          {
            id: 'video-1-1',
            title: '¿Qué es el Álgebra?',
            description: 'Introducción a los conceptos fundamentales del álgebra',
            url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 900, // 15 minutos
            order: 1,
            isCompleted: false,
          },
          {
            id: 'video-1-2',
            title: 'Variables y Expresiones',
            description: 'Aprende a trabajar con variables y expresiones algebraicas',
            url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 1200, // 20 minutos
            order: 2,
            isCompleted: false,
          }
        ]
      }
    ]
  },
  {
    id: 'geometria',
    title: 'Geometría Completa',
    description: 'Explora el mundo de las formas y espacios: ángulos, triángulos, círculos, áreas, volúmenes y geometría analítica.',
    rating: 4.9,
    totalStudents: 980,
    totalDuration: 180000, // 50 horas
    price: 399.99,
    isPurchased: false,
    thumbnail: '/images/geometry-thumbnail.jpg',
    sections: [
      {
        id: 'section-1',
        title: 'Geometría Plana',
        description: 'Conceptos básicos de geometría en el plano',
        order: 1,
        videos: [
          {
            id: 'video-1-1',
            title: 'Puntos, Líneas y Planos',
            description: 'Elementos fundamentales de la geometría',
            url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 900, // 15 minutos
            order: 1,
            isCompleted: false,
          }
        ]
      }
    ]
  },
  {
    id: 'calculo-diferencial',
    title: 'Cálculo Diferencial',
    description: 'Sumérgete en el cálculo: límites, derivadas, aplicaciones y optimización. Ideal para estudiantes universitarios.',
    rating: 4.7,
    totalStudents: 750,
    totalDuration: 216000, // 60 horas
    price: 499.99,
    isPurchased: false,
    thumbnail: '/images/calculus-thumbnail.jpg',
    sections: [
      {
        id: 'section-1',
        title: 'Límites y Continuidad',
        description: 'Fundamentos del cálculo: límites y funciones continuas',
        order: 1,
        videos: [
          {
            id: 'video-1-1',
            title: 'Concepto de Límite',
            description: 'Introducción al concepto fundamental del cálculo',
            url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 1200, // 20 minutos
            order: 1,
            isCompleted: false,
          }
        ]
      }
    ]
  }
];

export const userCourses: Course[] = [
  {
    id: 'algebra-basica',
    title: 'Álgebra Básica',
    description: 'Domina los fundamentos del álgebra: ecuaciones, polinomios, factorización y más.',
    rating: 4.8,
    totalStudents: 1250,
    totalDuration: 144000,
    price: 299.99,
    isPurchased: true,
    thumbnail: '/images/algebra-thumbnail.jpg',
    sections: [
      {
        id: 'section-1',
        title: 'Fundamentos del Álgebra',
        description: 'Introducción a los conceptos básicos del álgebra',
        order: 1,
        videos: [
          {
            id: 'video-1-1',
            title: '¿Qué es el Álgebra?',
            description: 'Introducción a los conceptos fundamentales del álgebra',
            url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 900,
            order: 1,
            isCompleted: true,
          },
          {
            id: 'video-1-2',
            title: 'Variables y Expresiones',
            description: 'Aprende a trabajar con variables y expresiones algebraicas',
            url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 1200,
            order: 2,
            isCompleted: false,
          }
        ]
      }
    ]
  }
];
