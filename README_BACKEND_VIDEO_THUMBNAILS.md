# Backend - Miniaturas de videos

## Objetivo

Permitir que el maestro suba una imagen desde su computadora como miniatura de cada video, en lugar de capturar una URL manualmente.

## Endpoint afectado

El frontend ya usa este endpoint para subir videos:

```http
POST /api/courses/:courseId/sections/:sectionId/videos/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Debe aceptar estos campos:

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `video` | File | Sí | Archivo de video. |
| `thumbnail` | File | No | Imagen para miniatura del video. |
| `title` | string | Sí | Título del video. |
| `description` | string | No | Descripción del video. |
| `duration` | number/string | Sí | Duración en segundos. |
| `order` | number/string | No | Orden del video dentro de la sección. |

Ejemplo con Express + Multer:

```ts
upload.fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
])
```

## Validaciones recomendadas

- `video` debe ser obligatorio y `mimetype` debe iniciar con `video/`.
- `thumbnail` es opcional, pero si viene debe iniciar con `image/`.
- Formatos recomendados para `thumbnail`: `image/jpeg`, `image/png`, `image/webp`.
- Tamaño máximo recomendado para miniatura: 2 MB a 5 MB.
- El maestro debe tener permiso para editar el curso.
- `courseId` y `sectionId` deben ser ObjectId válidos.

## Almacenamiento

Subir ambos archivos al storage:

- Video: ruta actual que ya usan.
- Miniatura: una ruta separada, por ejemplo:

```txt
courses/{courseId}/sections/{sectionId}/videos/{videoId}/thumbnail.{ext}
```

Después guardar en el documento del video la URL pública o firmada:

```ts
{
  _id: videoId,
  title,
  description,
  url: videoUrl,
  thumbnail: thumbnailUrl, // opcional
  duration,
  order
}
```

## Respuesta esperada por frontend

El frontend espera que la respuesta incluya el video actualizado y que `thumbnail` sea una URL usable por el navegador:

```json
{
  "success": true,
  "data": {
    "video": {
      "_id": "68...",
      "title": "Introducción",
      "description": "Video inicial",
      "url": "https://storage.example.com/video.mp4",
      "thumbnail": "https://storage.example.com/thumbnail.webp",
      "duration": 420,
      "order": 1
    }
  }
}
```

## Endpoint para actualizar solo miniatura

El frontend usa este endpoint para editar la miniatura de un video ya subido, sin volver a subir el archivo de video:

```http
PATCH /api/courses/:courseId/sections/:sectionId/videos/:videoId/thumbnail
Content-Type: multipart/form-data
```

Campo:

| Campo | Tipo | Requerido |
| --- | --- | --- |
| `thumbnail` | File | Sí |

Respuesta:

```json
{
  "success": true,
  "data": {
    "video": {
      "_id": "68...",
      "thumbnail": "https://storage.example.com/new-thumbnail.webp"
    }
  }
}
```

## Nota de compatibilidad

Antes el frontend podía mandar `thumbnail` como string URL. Con este cambio, en la subida de videos el frontend manda `thumbnail` como archivo dentro del mismo `multipart/form-data`. Backend puede mantener compatibilidad aceptando string, pero el flujo nuevo debe priorizar archivo.
