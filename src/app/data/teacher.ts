export interface Teacher {
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  experience: string;
  education: string[];
  photo: string;
  contact: {
    whatsapp: string;
    email: string;
    instagram: string;
    facebook: string;
  };
  achievements: string[];
}

export const teacherData: Teacher = {
  name: "Prof. Carlos Olmos",
  title: "Maestro de Matemáticas",
  bio: "Soy un apasionado educador con más de 15 años de experiencia enseñando matemáticas. Mi misión es hacer que las matemáticas sean accesibles, comprensibles y hasta divertidas para todos los estudiantes. Creo firmemente que cada persona puede dominar las matemáticas con la metodología correcta y el apoyo adecuado.",
  expertise: [
    "Álgebra y Geometría",
    "Cálculo Diferencial e Integral",
    "Matemáticas para Secundaria y Preparatoria",
    "Preparación para Exámenes de Admisión",
    "Metodologías de Enseñanza Innovadoras",
    "Tutoría Personalizada"
  ],
  experience: "Más de 15 años enseñando matemáticas en diferentes niveles educativos, desde secundaria hasta universidad. He ayudado a más de 2,000 estudiantes a superar sus dificultades con las matemáticas y alcanzar sus metas académicas.",
  education: [
    "Licenciatura en Matemáticas - Universidad Nacional Autónoma de México",
    "Maestría en Educación Matemática - Instituto Politécnico Nacional",
    "Certificación en Metodologías de Enseñanza Digital",
    "Especialización en Psicología Educativa"
  ],
  photo: "/images/teacher-photo.jpg",
  contact: {
    whatsapp: "+52 55 1234 5678",
    email: "carlos.olmos@aprendeconolmos.com",
    instagram: "@profesor_olmos",
    facebook: "Profesor Carlos Olmos"
  },
  achievements: [
    "Profesor Distinguido 2023 - Asociación Mexicana de Matemáticas",
    "Mejor Evaluación Docente 2022 - Instituto de Educación Superior",
    "Certificación en Enseñanza Digital - Google for Education",
    "Más de 2,000 estudiantes exitosos",
    "95% de aprobación en exámenes de admisión",
    "Ponente en Congresos Nacionales de Educación Matemática"
  ]
};
