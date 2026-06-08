# Backend - Miniaturas de cursos

## Objetivo

Permitir que el maestro suba una imagen desde su computadora como miniatura principal del curso. Esta imagen se usa en catálogo, carrito, compras, checkout y detalle del curso.

## Endpoint requerido

El frontend usa este endpoint para actualizar solo la miniatura del curso:

```http
PATCH /api/courses/:courseId/thumbnail
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Campo esperado:

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `thumbnail` | File | Sí | Imagen de miniatura del curso. |

Ejemplo con Express + Multer:

```ts
router.patch(
  "/courses/:courseId/thumbnail",
  authMiddleware,
  requireRole("maestro"),
  upload.single("thumbnail"),
  updateCourseThumbnail,
);
```

## Validaciones recomendadas

- `courseId` debe ser ObjectId válido.
- El usuario debe ser maestro y dueño del curso, o tener permisos de edición.
- `thumbnail` es obligatorio para este endpoint.
- `thumbnail.mimetype` debe iniciar con `image/`.
- Formatos recomendados: `image/jpeg`, `image/png`, `image/webp`.
- Tamaño máximo recomendado: 2 MB a 5 MB.

## Almacenamiento

Subir la imagen al storage en una ruta estable, por ejemplo:

```txt
courses/{courseId}/thumbnail.{ext}
```

Luego guardar la URL final en el documento del curso:

```ts
{
  _id: courseId,
  title,
  description,
  thumbnail: thumbnailUrl
}
```

Si el curso ya tenía una miniatura anterior, se recomienda borrar o reemplazar el archivo previo para no dejar basura en storage.

## Respuesta esperada por frontend

El frontend acepta cualquiera de estas dos formas:

```json
{
  "success": true,
  "data": {
    "course": {
      "_id": "68...",
      "title": "Curso de ejemplo",
      "description": "Descripción",
      "thumbnail": "https://storage.example.com/courses/68.../thumbnail.webp",
      "price": 499
    }
  }
}
```

O directamente:

```json
{
  "success": true,
  "data": {
    "_id": "68...",
    "title": "Curso de ejemplo",
    "description": "Descripción",
    "thumbnail": "https://storage.example.com/courses/68.../thumbnail.webp",
    "price": 499
  }
}
```

Lo importante es que `thumbnail` sea una URL usable por el navegador.
