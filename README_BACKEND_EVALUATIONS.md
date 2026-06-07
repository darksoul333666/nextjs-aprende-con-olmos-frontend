# Backend: Evaluaciones por curso y video

Este documento describe el contrato esperado por el frontend para permitir que el maestro cree evaluaciones tipo survey/quiz para sus cursos.

## Objetivo

Soportar evaluaciones con preguntas y respuestas correctas. Las evaluaciones pueden ser:

- `acompanamiento`: aparecen antes, durante o después de un video.
- `certificacion`: se desbloquean al completar todos los videos del curso.

Cada evaluación puede ser `isRequired: true` para bloquear el avance o finalización hasta que el alumno la complete.

## Tipos

```ts
type EvaluationKind = "acompanamiento" | "certificacion";

type EvaluationTrigger =
  | "before_video"
  | "during_video"
  | "after_video"
  | "after_course";

type EvaluationQuestionType =
  | "multiple_choice"
  | "input"
  | "true_false";
```

## Modelo sugerido

```ts
interface CourseEvaluation {
  _id: string;
  courseId: ObjectId;
  sectionId?: ObjectId;
  videoId?: ObjectId;
  title: string;
  description?: string;
  kind: "acompanamiento" | "certificacion";
  trigger: "before_video" | "during_video" | "after_video" | "after_course";
  triggerTimeSeconds?: number;
  isRequired: boolean;
  passingScore?: number;
  questions: EvaluationQuestion[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EvaluationQuestion {
  _id: string;
  prompt: string;
  type: "multiple_choice" | "input" | "true_false";
  options?: EvaluationOption[];
  correctAnswer?: string | boolean;
  explanation?: string;
  order: number;
}

interface EvaluationOption {
  _id?: string;
  text: string;
  isCorrect?: boolean;
}
```

Para estudiantes, se recomienda no enviar `isCorrect` ni `correctAnswer` en el detalle público si no es necesario. Para el editor del maestro sí deben enviarse.

## Endpoints requeridos

### Listar evaluaciones de un curso

```http
GET /api/courses/:courseId/evaluations
Authorization: Bearer <token>
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "evaluations": [
      {
        "_id": "eval_id",
        "courseId": "course_id",
        "sectionId": "section_id",
        "videoId": "video_id",
        "title": "Pregunta de repaso",
        "description": "Contesta antes de avanzar",
        "kind": "acompanamiento",
        "trigger": "after_video",
        "isRequired": true,
        "passingScore": 70,
        "questions": [],
        "order": 1,
        "isCompleted": false,
        "isLocked": false
      }
    ]
  }
}
```

### Crear evaluación

```http
POST /api/courses/:courseId/evaluations
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "title": "Evaluación módulo 1",
  "description": "Repaso rápido",
  "kind": "acompanamiento",
  "trigger": "after_video",
  "sectionId": "section_id",
  "videoId": "video_id",
  "isRequired": true,
  "passingScore": 70,
  "questions": [
    {
      "prompt": "¿Cuál es la respuesta correcta?",
      "type": "multiple_choice",
      "options": [
        { "text": "A", "isCorrect": true },
        { "text": "B", "isCorrect": false }
      ],
      "order": 1
    }
  ],
  "order": 1
}
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "evaluation": {}
  }
}
```

### Actualizar evaluación

```http
PUT /api/courses/:courseId/evaluations/:evaluationId
Authorization: Bearer <token>
Content-Type: application/json
```

Usa el mismo body de creación.

### Eliminar evaluación

```http
DELETE /api/courses/:courseId/evaluations/:evaluationId
Authorization: Bearer <token>
```

### Enviar respuestas del alumno

```http
POST /api/courses/:courseId/evaluations/:evaluationId/submit
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "answers": [
    {
      "questionId": "question_id",
      "answer": "A"
    },
    {
      "questionId": "question_2",
      "answer": true
    }
  ]
}
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "result": {
      "evaluationId": "eval_id",
      "score": 100,
      "passed": true,
      "correctAnswers": 2,
      "totalQuestions": 2
    }
  }
}
```

## Integración con `GET /api/courses/:id`

El frontend también puede leer evaluaciones directamente en el detalle del curso:

```json
{
  "success": true,
  "data": {
    "course": {
      "_id": "course_id",
      "sections": [],
      "evaluations": []
    },
    "canViewVideos": true
  }
}
```

Si el backend no incluye `course.evaluations`, el frontend intentará usar `GET /courses/:courseId/evaluations` en el editor.

## Reglas de negocio

- Solo maestros dueños del curso pueden crear, editar o eliminar evaluaciones.
- Estudiantes solo pueden enviar respuestas.
- `certificacion` debe usar `trigger: "after_course"`.
- `acompanamiento` debe tener `videoId` cuando el trigger sea `before_video`, `during_video` o `after_video`.
- `during_video` debe usar `triggerTimeSeconds`.
- Si `isRequired` es `true`, el backend debe marcar la evaluación como bloqueante hasta que el alumno apruebe o complete, según la regla del producto.
- La certificación debe desbloquearse cuando todos los videos del curso estén completados.

## Persistencia de progreso

Se recomienda guardar intentos:

```ts
interface EvaluationAttempt {
  userId: ObjectId;
  courseId: ObjectId;
  evaluationId: ObjectId;
  answers: Array<{
    questionId: ObjectId;
    answer: string | boolean;
    isCorrect: boolean;
  }>;
  score: number;
  passed: boolean;
  completedAt: Date;
}
```

El endpoint de curso/evaluaciones puede devolver:

```ts
isCompleted: boolean;
isLocked: boolean;
```

para que el frontend pinte el estado correcto.
