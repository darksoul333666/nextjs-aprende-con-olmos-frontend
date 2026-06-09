# Backend: Sistema de tickets

Este documento describe el contrato esperado por el frontend para el sistema de tickets de soporte.

Rutas frontend:

```txt
/tickets
/teacher/tickets
```

El estudiante puede crear tickets, ver sus propios tickets y agregar mensajes. El maestro puede listar todos los tickets, filtrarlos, responder y cambiar el estado.

## Modelo esperado

```ts
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high";

interface TicketUser {
  _id: string;
  email: string;
  name?: string;
}

interface TicketMessage {
  _id: string;
  message: string;
  authorRole: "estudiante" | "maestro";
  author?: TicketUser;
  createdAt: string;
}

interface Ticket {
  _id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  courseId?: string;
  courseTitle?: string;
  attachments?: TicketAttachment[];
  student?: TicketUser;
  assignedTeacher?: TicketUser;
  messages?: TicketMessage[];
  createdAt: string;
  updatedAt?: string;
}

interface TicketAttachment {
  _id?: string;
  url: string;
  fileName: string;
  mimeType?: string;
  size?: number;
}
```

## Endpoints requeridos

### Crear ticket

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json | multipart/form-data
```

Body JSON sin adjuntos:

```json
{
  "courseId": "course_id",
  "courseTitle": "Álgebra desde cero",
  "subject": "No puedo acceder a una lección",
  "description": "Compré el curso pero no aparece en Mis cursos.",
  "priority": "medium",
  "category": "Curso"
}
```

Para problemas generales de la plataforma o pago, el frontend envía:

```json
{
  "courseTitle": "Problema técnico con la plataforma / Pago",
  "subject": "No aparece mi pago",
  "description": "Ya pagué, pero el curso sigue bloqueado.",
  "priority": "medium",
  "category": "Problema técnico con la plataforma / Pago"
}
```

Si el estudiante adjunta archivos, el frontend envía `multipart/form-data` al mismo endpoint con estos campos:

```txt
courseId: course_id (opcional para problema general)
courseTitle: Álgebra desde cero
subject: No puedo acceder a una lección
description: La plataforma muestra error al abrir el video.
priority: medium
category: Curso
attachments: <File>
attachments: <File>
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "ticket": {
      "_id": "ticket_id",
      "subject": "No puedo acceder al curso",
      "description": "Compré el curso pero no aparece en Mis cursos.",
      "status": "open",
      "priority": "medium",
      "category": "Curso",
      "courseId": "course_id",
      "courseTitle": "Álgebra desde cero",
      "attachments": [
        {
          "_id": "attachment_id",
          "url": "https://storage.example.com/tickets/captura.png",
          "fileName": "captura.png",
          "mimeType": "image/png",
          "size": 120000
        }
      ],
      "student": {
        "_id": "student_id",
        "email": "alumno@example.com",
        "name": "Alumno Demo"
      },
      "messages": [],
      "createdAt": "2026-06-08T00:00:00.000Z",
      "updatedAt": "2026-06-08T00:00:00.000Z"
    }
  }
}
```

Reglas:

- Requiere usuario autenticado.
- Solo estudiantes deberían crear tickets desde el frontend.
- El backend debe tomar el estudiante desde el JWT, no desde el body.
- `status` inicial sugerido: `open`.
- `courseId` es requerido cuando el ticket corresponde a un curso comprado.
- Para la opción general de plataforma/pago, `courseId` puede omitirse y `courseTitle` debe guardar el texto general.
- Adjuntos opcionales: aceptar imágenes y PDF, idealmente con límite de 10 MB por archivo.

### Listar mis tickets

```http
GET /api/tickets/my
Authorization: Bearer <token>
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "tickets": []
  }
}
```

Reglas:

- Requiere usuario autenticado.
- Devuelve solo tickets del estudiante autenticado.
- Orden sugerido: más recientes primero.

### Listar tickets para maestro

```http
GET /api/tickets?search=&status=all&priority=all
Authorization: Bearer <token>
```

Query params:

- `search`: opcional. Busca por asunto, descripción, correo o nombre del estudiante.
- `status`: `all | open | in_progress | resolved | closed`.
- `priority`: `all | low | medium | high`.

Respuesta:

```json
{
  "success": true,
  "data": {
    "tickets": []
  }
}
```

Reglas:

- Requiere rol `maestro`.
- Devuelve tickets de todos los estudiantes.
- Orden sugerido: abiertos primero y luego más recientes.

### Cambiar estado del ticket

```http
PATCH /api/tickets/:ticketId/status
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "status": "in_progress"
}
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "ticket": {}
  }
}
```

Reglas:

- Requiere rol `maestro`.
- Estados válidos: `open`, `in_progress`, `resolved`, `closed`.
- Responder con el ticket actualizado completo.

### Agregar mensaje

```http
POST /api/tickets/:ticketId/messages
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "message": "Ya revisé tu caso, por favor intenta entrar de nuevo."
}
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "ticket": {}
  }
}
```

Reglas:

- Requiere usuario autenticado.
- El estudiante solo puede escribir en sus propios tickets.
- El maestro puede escribir en cualquier ticket.
- `author` y `authorRole` deben tomarse desde el JWT.
- Responder con el ticket actualizado completo.

## Validaciones sugeridas

- `subject`: requerido, mínimo 5 caracteres.
- `description`: requerido, mínimo 10 caracteres.
- `priority`: requerido, uno de `low`, `medium`, `high`.
- `courseTitle`: requerido para mantener contexto visible aunque el curso cambie de nombre después.
- `message`: requerido, mínimo 1 caracter no vacío.
- No permitir que un estudiante consulte o modifique tickets de otro estudiante.

## Campos sugeridos en Mongo/Mongoose

```ts
{
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ["open", "in_progress", "resolved", "closed"],
    default: "open",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  category: { type: String, trim: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course" },
  courseTitle: { type: String, required: true, trim: true },
  attachments: [
    {
      url: { type: String, required: true },
      fileName: { type: String, required: true },
      mimeType: String,
      size: Number,
    },
  ],
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedTeacher: { type: Schema.Types.ObjectId, ref: "User" },
  messages: [
    {
      message: { type: String, required: true, trim: true },
      author: { type: Schema.Types.ObjectId, ref: "User", required: true },
      authorRole: {
        type: String,
        enum: ["estudiante", "maestro"],
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],
}
```

## Checklist de prueba

1. Iniciar sesión como estudiante.
2. Entrar a `/tickets`.
3. Crear un ticket.
4. Confirmar que aparece en la lista del estudiante.
5. Iniciar sesión como maestro.
6. Entrar a `/teacher/tickets`.
7. Confirmar que se listan los tickets de estudiantes.
8. Cambiar estado del ticket.
9. Enviar una respuesta.
10. Volver como estudiante y confirmar que la respuesta aparece en el ticket.
