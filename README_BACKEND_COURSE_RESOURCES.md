# Backend: Recursos descargables por sección

Este documento describe los cambios necesarios en el backend para soportar recursos descargables por sección de curso. El frontend ya espera poder subir y mostrar archivos de tipo PowerPoint, Word, PDF e imágenes junto a los videos de cada sección.

## Objetivo

Permitir que un maestro suba recursos desde su máquina dentro del editor de cursos, asociados a una sección específica. El backend debe recibir esos archivos, subirlos a Bunny, guardar sus metadatos y devolverlos en el detalle del curso para que el estudiante pueda descargarlos.

## Modelo de datos

Agregar un arreglo `resources` dentro de cada sección del curso.

```ts
type CourseResourceType = "powerpoint" | "docx" | "pdf" | "image";

interface CourseResource {
  _id: string;
  title: string;
  description?: string;
  url: string;
  type: CourseResourceType;
  fileName?: string;
  mimeType?: string;
  size?: number;
  storagePath?: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}
```

Ejemplo en `Section`:

```ts
interface Section {
  _id: string;
  title: string;
  description?: string;
  order: number;
  videos: Video[];
  resources: CourseResource[];
}
```

## Tipos permitidos

El backend debe validar extensión y MIME type.

```ts
const allowedResourceTypes = {
  powerpoint: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  docx: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};
```

Extensiones aceptadas:

- PowerPoint: `.ppt`, `.pptx`
- Word: `.doc`, `.docx`
- PDF: `.pdf`
- Imágenes: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

## Endpoints requeridos

### Subir recurso

```http
POST /api/courses/:courseId/sections/:sectionId/resources/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Campos `FormData` esperados:

- `resource`: archivo. Requerido.
- `title`: string. Requerido.
- `type`: `"powerpoint" | "docx" | "pdf" | "image"`. Requerido.
- `description`: string. Opcional.
- `order`: number. Opcional.

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "resource": {
      "_id": "resource_id",
      "title": "Guía de ejercicios",
      "description": "Material complementario",
      "url": "https://cdn.example.com/courses/course_id/sections/section_id/guia.pdf",
      "type": "pdf",
      "fileName": "guia.pdf",
      "mimeType": "application/pdf",
      "size": 245991,
      "storagePath": "courses/course_id/sections/section_id/resources/resource_id-guia.pdf",
      "order": 1
    }
  },
  "message": "Recurso subido correctamente"
}
```

### Eliminar recurso

```http
DELETE /api/courses/:courseId/sections/:sectionId/resources/:resourceId
Authorization: Bearer <token>
```

Comportamiento esperado:

- Validar que el usuario autenticado sea maestro y dueño del curso.
- Buscar el recurso en la sección.
- Eliminar el archivo de Bunny usando `storagePath`.
- Remover el recurso del arreglo `section.resources`.

Respuesta esperada:

```json
{
  "success": true,
  "message": "Recurso eliminado correctamente"
}
```

## Cambios en endpoints existentes

### `GET /api/courses/:id`

Debe incluir `resources` en cada sección.

```json
{
  "success": true,
  "data": {
    "course": {
      "_id": "course_id",
      "title": "Curso ejemplo",
      "sections": [
        {
          "_id": "section_id",
          "title": "Sección 1",
          "videos": [],
          "resources": [
            {
              "_id": "resource_id",
              "title": "Presentación inicial",
              "url": "https://cdn.example.com/presentacion.pptx",
              "type": "powerpoint",
              "fileName": "presentacion.pptx",
              "mimeType": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "size": 102400,
              "order": 1
            }
          ]
        }
      ]
    },
    "canViewVideos": true
  }
}
```

Si el usuario no ha comprado el curso, el backend puede omitir URLs privadas o devolver `isLocked: true`. El frontend también marca recursos como bloqueados cuando `canViewVideos` es `false`.

### Crear/completar curso

Si el backend usa DTOs para `sections`, aceptar opcionalmente:

```ts
resources?: Array<{
  title: string;
  description?: string;
  url: string;
  type: "powerpoint" | "docx" | "pdf" | "image";
  fileName?: string;
  mimeType?: string;
  size?: number;
  order: number;
}>;
```

## Integración con Bunny

El backend debe manejar Bunny directamente. El frontend solo envía el archivo al backend.

Flujo sugerido:

1. Recibir archivo con `multipart/form-data`.
2. Validar autenticación, rol `maestro` y ownership del curso.
3. Validar `courseId`, `sectionId`, `title`, `type`, MIME type, extensión y tamaño máximo.
4. Generar `resourceId`.
5. Subir archivo a Bunny Storage.
6. Construir URL pública o URL firmada de descarga.
7. Guardar metadatos en `section.resources`.
8. Responder con `{ data: { resource } }`.

Ruta sugerida en Bunny:

```txt
courses/{courseId}/sections/{sectionId}/resources/{resourceId}-{safeFileName}
```

## Validaciones recomendadas

- Tamaño máximo sugerido: 50 MB por recurso.
- Rechazar archivos sin extensión o MIME type no permitido.
- Sanitizar nombre original del archivo.
- No confiar solo en el `type` enviado por el frontend; inferir y validar contra archivo real.
- Evitar sobrescribir archivos existentes.
- Limitar subida y eliminación a maestros dueños del curso.

## Contrato frontend

El frontend ya llama estos métodos:

```ts
POST /courses/:courseId/sections/:sectionId/resources/upload
DELETE /courses/:courseId/sections/:sectionId/resources/:resourceId
```

El campo del archivo en `FormData` se llama:

```txt
resource
```

El frontend espera que cada recurso tenga al menos:

```json
{
  "_id": "resource_id",
  "title": "Nombre del recurso",
  "url": "https://...",
  "type": "pdf",
  "order": 1
}
```

Campos opcionales soportados:

```json
{
  "description": "Texto opcional",
  "fileName": "archivo.pdf",
  "mimeType": "application/pdf",
  "size": 123456,
  "isLocked": false
}
```
