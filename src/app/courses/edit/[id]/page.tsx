"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Save,
  Edit,
  Delete,
  Add,
  ArrowBack,
  Visibility,
  VisibilityOff,
  Publish,
  Drafts,
  ExpandMore,
  DragIndicator,
  VideoLibrary,
  Description,
  Settings,
  UploadFile,
  PictureAsPdf,
  Image,
  Slideshow,
  Article,
  Quiz,
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import {
  courseService,
  Course,
  CourseResource,
  CourseResourceType,
  Section,
  Video,
  CreateCourseRequest,
} from "../../../services/courseService";
import {
  CourseEvaluation,
  EvaluationKind,
  EvaluationQuestion,
  EvaluationQuestionType,
  EvaluationTrigger,
  SaveEvaluationRequest,
  evaluationService,
} from "../../../services/evaluationService";
import { Navbar } from "../../../components/Navigation/Navbar";

type EditableVideo = Omit<Video, "_id"> & { _id?: string };
type EditableCourseResource = Omit<CourseResource, "_id"> & { _id?: string };
type EditableSection = Omit<Section, "_id"> & {
  _id?: string;
  videos: EditableVideo[];
  resources: EditableCourseResource[];
};

type EvaluationFormState = SaveEvaluationRequest;

const createDefaultQuestion = (order: number): EvaluationQuestion => ({
  prompt: "",
  type: "multiple_choice",
  options: [
    { text: "Opción 1", isCorrect: true },
    { text: "Opción 2", isCorrect: false },
  ],
  correctAnswer: "",
  order,
});

const createDefaultEvaluationForm = (order: number): EvaluationFormState => ({
  title: "Nueva evaluación",
  description: "",
  kind: "acompanamiento",
  trigger: "after_video",
  isRequired: false,
  passingScore: 70,
  questions: [createDefaultQuestion(1)],
  order,
});

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const resourceFileInputRef = useRef<HTMLInputElement | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  const [selectedSection, setSelectedSection] =
    useState<EditableSection | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoDescription, setNewVideoDescription] = useState("");
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoThumbnail, setNewVideoThumbnail] = useState("");
  const [newVideoMinutes, setNewVideoMinutes] = useState("");
  const [newVideoSeconds, setNewVideoSeconds] = useState("");
  const [isReadingVideoDuration, setIsReadingVideoDuration] = useState(false);
  const [videoDurationDetected, setVideoDurationDetected] = useState(false);
  const [isDraggingVideoFile, setIsDraggingVideoFile] = useState(false);
  const [showAddResourceDialog, setShowAddResourceDialog] = useState(false);
  const [selectedResourceSection, setSelectedResourceSection] =
    useState<EditableSection | null>(null);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceDescription, setNewResourceDescription] = useState("");
  const [newResourceFile, setNewResourceFile] = useState<File | null>(null);
  const [newResourceType, setNewResourceType] =
    useState<CourseResourceType>("pdf");
  const [isDraggingResourceFile, setIsDraggingResourceFile] = useState(false);
  const [evaluations, setEvaluations] = useState<CourseEvaluation[]>([]);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [editingEvaluation, setEditingEvaluation] =
    useState<CourseEvaluation | null>(null);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationFormState>(
    createDefaultEvaluationForm(1),
  );
  const [evaluationDialogError, setEvaluationDialogError] = useState("");
  const [showReplaceVideoDialog, setShowReplaceVideoDialog] = useState(false);
  const [videoToReplace, setVideoToReplace] = useState<{
    sectionId: string;
    videoId: string;
    title: string;
  } | null>(null);
  const [replacementVideoFile, setReplacementVideoFile] =
    useState<File | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState<Partial<CreateCourseRequest>>({
    title: "",
    description: "",
    price: 0,
    sections: [],
  });

  const syncCourseState = useCallback((courseData: Course) => {
    setCourse(courseData);
    setEvaluations(courseData.evaluations || []);
    setFormData({
      title: courseData.title,
      description: courseData.description,
      price: courseData.price,
      sections: courseData.sections,
    });
  }, []);

  const refreshCourse = useCallback(async () => {
    const refreshedCourse = await courseService.getCourse(courseId);
    if (refreshedCourse) {
      syncCourseState(refreshedCourse);
    }
    return refreshedCourse;
  }, [courseId, syncCourseState]);

  const resetVideoForm = () => {
    setNewVideoTitle("");
    setNewVideoDescription("");
    setNewVideoFile(null);
    setNewVideoThumbnail("");
    setNewVideoMinutes("");
    setNewVideoSeconds("");
    setIsReadingVideoDuration(false);
    setVideoDurationDetected(false);
    setSelectedSection(null);
  };

  const resetResourceForm = () => {
    setSelectedResourceSection(null);
    setNewResourceTitle("");
    setNewResourceDescription("");
    setNewResourceFile(null);
    setNewResourceType("pdf");
    setIsDraggingResourceFile(false);
  };

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

  const extractVideoDuration = (file: File) =>
    new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);

      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("No se pudo leer la duración del video"));
      };
      video.src = objectUrl;
    });

  const getTitleFromFileName = (fileName: string) =>
    fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getResourceTypeFromFile = (
    file: File,
  ): CourseResourceType | null => {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (
      fileName.endsWith(".ppt") ||
      fileName.endsWith(".pptx") ||
      mimeType.includes("presentation")
    ) {
      return "powerpoint";
    }

    if (
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx") ||
      mimeType.includes("wordprocessing")
    ) {
      return "docx";
    }

    if (fileName.endsWith(".pdf") || mimeType === "application/pdf") {
      return "pdf";
    }

    if (mimeType.startsWith("image/")) {
      return "image";
    }

    return null;
  };

  const getResourceTypeLabel = (type: CourseResourceType) => {
    const labels: Record<CourseResourceType, string> = {
      powerpoint: "PowerPoint",
      docx: "Documento",
      pdf: "PDF",
      image: "Imagen",
    };

    return labels[type];
  };

  const getResourceIcon = (type: CourseResourceType) => {
    switch (type) {
      case "powerpoint":
        return <Slideshow color="warning" fontSize="small" />;
      case "docx":
        return <Article color="primary" fontSize="small" />;
      case "pdf":
        return <PictureAsPdf color="error" fontSize="small" />;
      case "image":
        return <Image color="success" fontSize="small" />;
      default:
        return <Description color="action" fontSize="small" />;
    }
  };

  const handleVideoFileChange = async (file: File | null) => {
    if (file && !file.type.startsWith("video/")) {
      setError("Selecciona un archivo de video válido");
      return;
    }

    setNewVideoFile(file);
    setVideoDurationDetected(false);

    if (!file) {
      setNewVideoMinutes("");
      setNewVideoSeconds("");
      return;
    }

    if (!newVideoTitle.trim()) {
      setNewVideoTitle(getTitleFromFileName(file.name));
    }

    try {
      setIsReadingVideoDuration(true);
      setError("");

      const duration = await extractVideoDuration(file);
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error("La duración del video no es válida");
      }

      const totalSeconds = Math.round(duration);
      setNewVideoMinutes(String(Math.floor(totalSeconds / 60)));
      setNewVideoSeconds(String(totalSeconds % 60));
      setVideoDurationDetected(true);
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "No se pudo detectar la duración del video. Ingresa la duración manualmente.",
        ),
      );
    } finally {
      setIsReadingVideoDuration(false);
    }
  };

  const handleVideoDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingVideoFile(false);
    handleVideoFileChange(event.dataTransfer.files?.[0] ?? null);
  };

  const handleResourceFileChange = (file: File | null) => {
    if (!file) {
      setNewResourceFile(null);
      return;
    }

    const detectedType = getResourceTypeFromFile(file);
    if (!detectedType) {
      setError(
        "Selecciona un archivo PDF, PowerPoint, Word o imagen válido.",
      );
      return;
    }

    setError("");
    setNewResourceFile(file);
    setNewResourceType(detectedType);

    if (!newResourceTitle.trim()) {
      setNewResourceTitle(getTitleFromFileName(file.name));
    }
  };

  const handleResourceDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingResourceFile(false);
    handleResourceFileChange(event.dataTransfer.files?.[0] ?? null);
  };

  const getEvaluationKindLabel = (kind: EvaluationKind) =>
    kind === "certificacion" ? "Certificación" : "Acompañamiento";

  const getEvaluationTriggerLabel = (trigger: EvaluationTrigger) => {
    const labels: Record<EvaluationTrigger, string> = {
      before_video: "Antes del video",
      during_video: "Durante el video",
      after_video: "Después del video",
      after_course: "Al finalizar el curso",
    };

    return labels[trigger];
  };

  const getQuestionTypeLabel = (type: EvaluationQuestionType) => {
    const labels: Record<EvaluationQuestionType, string> = {
      multiple_choice: "Opción múltiple",
      input: "Respuesta escrita",
      true_false: "Verdadero o falso",
    };

    return labels[type];
  };

  const getVideoTitle = (videoId?: string) => {
    if (!videoId) {
      return "Sin video asignado";
    }

    for (const section of (formData.sections || []) as EditableSection[]) {
      const video = section.videos?.find((item) => item._id === videoId);
      if (video) {
        return video.title;
      }
    }

    return "Video no encontrado";
  };

  const handleOpenAddEvaluation = () => {
    setEditingEvaluation(null);
    setEvaluationForm(createDefaultEvaluationForm(evaluations.length + 1));
    setEvaluationDialogError("");
    setShowEvaluationDialog(true);
  };

  const handleOpenEditEvaluation = (evaluation: CourseEvaluation) => {
    setEditingEvaluation(evaluation);
    setEvaluationForm({
      title: evaluation.title,
      description: evaluation.description || "",
      kind: evaluation.kind,
      trigger: evaluation.trigger,
      triggerTimeSeconds: evaluation.triggerTimeSeconds,
      sectionId: evaluation.sectionId,
      videoId: evaluation.videoId,
      isRequired: evaluation.isRequired,
      passingScore: evaluation.passingScore || 70,
      questions: evaluation.questions?.length
        ? evaluation.questions
        : [createDefaultQuestion(1)],
      order: evaluation.order || 1,
    });
    setEvaluationDialogError("");
    setShowEvaluationDialog(true);
  };

  const handleEvaluationFieldChange = <K extends keyof EvaluationFormState>(
    field: K,
    value: EvaluationFormState[K],
  ) => {
    setEvaluationDialogError("");
    setEvaluationForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "kind" && value === "certificacion") {
        next.trigger = "after_course";
        next.sectionId = undefined;
        next.videoId = undefined;
        next.triggerTimeSeconds = undefined;
      }

      if (field === "trigger" && value !== "during_video") {
        next.triggerTimeSeconds = undefined;
      }

      return next;
    });
  };

  const handleQuestionChange = (
    questionIndex: number,
    updates: Partial<EvaluationQuestion>,
  ) => {
    setEvaluationDialogError("");
    setEvaluationForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, index) =>
        index === questionIndex ? { ...question, ...updates } : question,
      ),
    }));
  };

  const handleQuestionTypeChange = (
    questionIndex: number,
    type: EvaluationQuestionType,
  ) => {
    const updates: Partial<EvaluationQuestion> = { type };

    if (type === "multiple_choice") {
      updates.options = [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ];
      updates.correctAnswer = "";
    }

    if (type === "input") {
      updates.options = [];
      updates.correctAnswer = "";
    }

    if (type === "true_false") {
      updates.options = [];
      updates.correctAnswer = true;
    }

    handleQuestionChange(questionIndex, updates);
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    text: string,
  ) => {
    const question = evaluationForm.questions[questionIndex];
    const options = [...(question.options || [])];
    options[optionIndex] = { ...options[optionIndex], text };
    handleQuestionChange(questionIndex, { options });
  };

  const handleCorrectOptionChange = (
    questionIndex: number,
    optionIndex: number,
  ) => {
    const question = evaluationForm.questions[questionIndex];
    const options = (question.options || []).map((option, index) => ({
      ...option,
      isCorrect: index === optionIndex,
    }));
    handleQuestionChange(questionIndex, {
      options,
      correctAnswer: options[optionIndex]?.text || "",
    });
  };

  const handleAddOption = (questionIndex: number) => {
    const question = evaluationForm.questions[questionIndex];
    handleQuestionChange(questionIndex, {
      options: [...(question.options || []), { text: "", isCorrect: false }],
    });
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const question = evaluationForm.questions[questionIndex];
    const options = (question.options || []).filter(
      (_, index) => index !== optionIndex,
    );
    handleQuestionChange(questionIndex, { options });
  };

  const handleAddQuestion = () => {
    setEvaluationForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        createDefaultQuestion(prev.questions.length + 1),
      ],
    }));
  };

  const handleRemoveQuestion = (questionIndex: number) => {
    setEvaluationForm((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, index) => index !== questionIndex)
        .map((question, index) => ({ ...question, order: index + 1 })),
    }));
  };

  const validateEvaluationForm = () => {
    if (
      evaluationForm.kind === "acompanamiento" &&
      !evaluationForm.videoId &&
      evaluationForm.trigger !== "after_course"
    ) {
      return "Selecciona el video donde aparecerá la evaluación";
    }

    if (
      evaluationForm.trigger === "during_video" &&
      (evaluationForm.triggerTimeSeconds === undefined ||
        evaluationForm.triggerTimeSeconds < 0)
    ) {
      return "Indica el segundo del video donde aparecerá la evaluación";
    }

    if (!evaluationForm.questions.length) {
      return "Agrega al menos una pregunta";
    }

    for (const [index, question] of evaluationForm.questions.entries()) {
      if (!question.prompt.trim()) {
        return `La pregunta ${index + 1} necesita texto`;
      }

      if (question.type === "multiple_choice") {
        const options = question.options || [];
        if (options.length < 2) {
          return `La pregunta ${index + 1} necesita al menos dos opciones`;
        }
        if (!options.some((option) => option.isCorrect)) {
          return `Selecciona la respuesta correcta de la pregunta ${index + 1}`;
        }
      }

      if (question.type === "input" && !String(question.correctAnswer || "").trim()) {
        return `Agrega la respuesta correcta de la pregunta ${index + 1}`;
      }
    }

    return "";
  };

  const handleSaveEvaluation = async () => {
    const validationMessage = validateEvaluationForm();
    if (validationMessage) {
      setEvaluationDialogError(validationMessage);
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setEvaluationDialogError("");
      setSuccess("");

      const normalizedQuestions = evaluationForm.questions.map(
        (question, index) => {
          const options =
            question.type === "multiple_choice"
              ? (question.options || []).map((option, optionIndex) => ({
                  ...option,
                  text: option.text.trim() || `Opción ${optionIndex + 1}`,
                }))
              : [];
          const correctOption = options.find((option) => option.isCorrect);

          return {
            ...question,
            prompt: question.prompt.trim(),
            options,
            correctAnswer:
              question.type === "multiple_choice"
                ? correctOption?.text || options[0]?.text || ""
                : question.correctAnswer,
            order: index + 1,
          };
        },
      );

      const payload: SaveEvaluationRequest = {
        ...evaluationForm,
        title:
          evaluationForm.title.trim() ||
          (evaluationForm.kind === "certificacion"
            ? "Evaluación de certificación"
            : "Evaluación de acompañamiento"),
        description: evaluationForm.description?.trim() || undefined,
        questions: normalizedQuestions,
      };

      if (editingEvaluation) {
        await evaluationService.updateEvaluation(
          courseId,
          editingEvaluation._id,
          payload,
        );
      } else {
        await evaluationService.createEvaluation(courseId, payload);
      }

      const courseEvaluations =
        await evaluationService.getCourseEvaluations(courseId);
      setEvaluations(courseEvaluations);
      setShowEvaluationDialog(false);
      setEditingEvaluation(null);
      setEvaluationForm(createDefaultEvaluationForm(courseEvaluations.length + 1));
      setSuccess(
        editingEvaluation
          ? "Evaluación actualizada correctamente"
          : "Evaluación creada correctamente",
      );
    } catch (error) {
      setEvaluationDialogError(
        getErrorMessage(error, "Error al guardar la evaluación"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      await evaluationService.deleteEvaluation(courseId, evaluationId);
      setEvaluations((prev) =>
        prev.filter((evaluation) => evaluation._id !== evaluationId),
      );
      setSuccess("Evaluación eliminada correctamente");
    } catch (error) {
      setError(getErrorMessage(error, "Error al eliminar la evaluación"));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        const courseData = await courseService.getCourse(courseId);
        if (courseData) {
          syncCourseState(courseData);
          if (!courseData.evaluations?.length) {
            try {
              const courseEvaluations =
                await evaluationService.getCourseEvaluations(courseId);
              setEvaluations(courseEvaluations);
            } catch {}
          }
        } else {
          setError("Curso no encontrado");
        }
      } catch {
        setError("No se pudo cargar la información del curso");
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, syncCourseState]);

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]:
          field === "price" ? parseFloat(e.target.value) || 0 : e.target.value,
      }));
    };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (!course) return;

      const updatedCourse = await courseService.updateCourse(courseId, {
        title: formData.title,
        description: formData.description,
        price: formData.price,
      });
      if (updatedCourse) {
        syncCourseState(updatedCourse);
        setEditMode(false);
        setSuccess("Curso actualizado correctamente");
      } else {
        setError("Error al actualizar el curso");
      }
    } catch {
      setError("Error al actualizar el curso");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishCourse = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (!course) return;

      const publishedCourse =
        await courseService.toggleCourseVisibility(courseId);
      if (publishedCourse) {
        setCourse(publishedCourse);
        setSuccess("Curso publicado exitosamente");
      } else {
        setError("Error al publicar el curso");
      }
    } catch {
      setError("Error al publicar el curso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (!course) return;

      const updatedCourse =
        await courseService.toggleCourseVisibility(courseId);
      if (updatedCourse) {
        setCourse(updatedCourse);
        setSuccess(
          course.isVisible
            ? "Curso ocultado exitosamente"
            : "Curso publicado exitosamente",
        );
      } else {
        setError("Error al cambiar la visibilidad del curso");
      }
    } catch {
      setError("Error al cambiar la visibilidad del curso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await courseService.createCourseSection({
        courseId,
        title: newSectionTitle.trim(),
        order: (formData.sections?.length || 0) + 1,
      });

      const refreshedCourse = await refreshCourse();
      if (refreshedCourse) {
        setSuccess("Sección agregada correctamente");
        setNewSectionTitle("");
        setShowAddSectionDialog(false);
      } else {
        setError("Se creó la sección, pero no se pudo refrescar el curso");
      }
    } catch (error) {
      setError(getErrorMessage(error, "Error al agregar la sección"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVideo = async () => {
    if (!newVideoTitle.trim() || !newVideoFile || !selectedSection)
      return;

    if (!selectedSection._id) {
      setError("Guarda la sección antes de subir videos");
      return;
    }

    const minutes = parseInt(newVideoMinutes) || 0;
    const seconds = parseInt(newVideoSeconds) || 0;

    if (minutes < 0 || seconds < 0) {
      setError("Los minutos y segundos no pueden ser negativos");
      return;
    }

    if (seconds > 59) {
      setError("Los segundos no pueden ser mayores a 59");
      return;
    }

    const totalSeconds = minutes * 60 + seconds;

    if (!minutes && !seconds) {
      setError("Debes ingresar al menos minutos o segundos");
      return;
    }

    if (totalSeconds <= 0) {
      setError("La duración debe ser mayor a 0");
      return;
    }

    if (!Number.isInteger(totalSeconds) || totalSeconds <= 0) {
      setError("La duración debe ser un número entero positivo");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      await courseService.uploadCourseVideo({
        courseId,
        sectionId: selectedSection._id,
        file: newVideoFile,
        title: newVideoTitle.trim(),
        description: newVideoDescription.trim(),
        duration: totalSeconds,
        order: (selectedSection.videos?.length || 0) + 1,
        thumbnail: newVideoThumbnail.trim() || undefined,
      });

      const refreshedCourse = await refreshCourse();
      if (refreshedCourse) {
        setSuccess("Video subido y guardado correctamente");
      } else {
        setError("Video subido, pero no se pudo refrescar el curso");
      }
      resetVideoForm();
      setShowAddVideoDialog(false);
    } catch (error) {
      setError(getErrorMessage(error, "Error al agregar el video"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddResource = async () => {
    if (!newResourceTitle.trim() || !newResourceFile || !selectedResourceSection) {
      return;
    }

    if (!selectedResourceSection._id) {
      setError("Guarda la sección antes de subir recursos");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await courseService.uploadCourseResource({
        courseId,
        sectionId: selectedResourceSection._id,
        file: newResourceFile,
        title: newResourceTitle.trim(),
        description: newResourceDescription.trim() || undefined,
        type: newResourceType,
        order: (selectedResourceSection.resources?.length || 0) + 1,
      });

      const refreshedCourse = await refreshCourse();
      if (refreshedCourse) {
        setSuccess("Recurso subido y guardado correctamente");
      } else {
        setError("Recurso subido, pero no se pudo refrescar el curso");
      }

      resetResourceForm();
      setShowAddResourceDialog(false);
    } catch (error) {
      setError(getErrorMessage(error, "Error al agregar el recurso"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSection = async (section: EditableSection) => {
    if (!section._id) {
      setError("No se encontró el identificador de la sección");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await courseService.deleteCourseSection(courseId, section._id);
      const refreshedCourse = await refreshCourse();
      if (refreshedCourse) {
        setSuccess("Sección eliminada correctamente");
      } else {
        setError("Se eliminó la sección, pero no se pudo refrescar el curso");
      }
    } catch (error) {
      setError(getErrorMessage(error, "Error al eliminar la sección"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveVideo = async (
    section: EditableSection,
    video: EditableVideo,
  ) => {
    if (!section._id || !video._id) {
      setError("No se encontró el identificador del video");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await courseService.deleteCourseVideo(courseId, section._id, video._id);
      const refreshedCourse = await refreshCourse();
      if (refreshedCourse) {
        setSuccess("Video eliminado correctamente");
      } else {
        setError("Se eliminó el video, pero no se pudo refrescar el curso");
      }
    } catch (error) {
      setError(getErrorMessage(error, "Error al eliminar el video"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveResource = async (
    section: EditableSection,
    resource: EditableCourseResource,
  ) => {
    if (!section._id || !resource._id) {
      setError("No se encontró el identificador del recurso");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await courseService.deleteCourseResource(
        courseId,
        section._id,
        resource._id,
      );
      const refreshedCourse = await refreshCourse();
      if (refreshedCourse) {
        setSuccess("Recurso eliminado correctamente");
      } else {
        setError("Se eliminó el recurso, pero no se pudo refrescar el curso");
      }
    } catch (error) {
      setError(getErrorMessage(error, "Error al eliminar el recurso"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenReplaceVideoDialog = (
    section: EditableSection,
    video: EditableVideo,
  ) => {
    if (!section._id || !video._id) {
      setError("No se encontró el identificador del video para reemplazarlo");
      return;
    }

    setVideoToReplace({
      sectionId: section._id,
      videoId: video._id,
      title: video.title,
    });
    setReplacementVideoFile(null);
    setShowReplaceVideoDialog(true);
  };

  const handleReplaceVideo = async () => {
    if (!videoToReplace || !replacementVideoFile) {
      setError("Selecciona un archivo para reemplazar el video");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await courseService.replaceCourseVideo({
        courseId,
        sectionId: videoToReplace.sectionId,
        videoId: videoToReplace.videoId,
        file: replacementVideoFile,
      });

      const refreshedCourse = await refreshCourse();
      if (refreshedCourse) {
        setSuccess("Video reemplazado correctamente");
      } else {
        setError("Video reemplazado, pero no se pudo refrescar el curso");
      }

      setShowReplaceVideoDialog(false);
      setVideoToReplace(null);
      setReplacementVideoFile(null);
    } catch (error) {
      setError(getErrorMessage(error, "Error al reemplazar el video"));
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const steps = [
    {
      label: "Información Básica",
      description: "Título, descripción y precio del curso",
      icon: <Description />,
    },
    {
      label: "Secciones y Recursos",
      description: "Organiza el contenido del curso",
      icon: <VideoLibrary />,
    },
    {
      label: "Evaluaciones",
      description: "Configura surveys y certificación",
      icon: <Quiz />,
    },
    {
      label: "Configuración",
      description: "Visibilidad y estado del curso",
      icon: <Settings />,
    },
  ];

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <Navbar currentPage="courses" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h5" color="text.secondary">
              Curso no encontrado.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Navbar currentPage="courses" />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => router.push("/teacher/courses")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            {courseId === "new"
              ? "Crear Nuevo Curso"
              : `Editar: ${course.title}`}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} orientation="horizontal">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  icon={step.icon}
                  onClick={() => setActiveStep(index)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    transition: "background-color 0.2s ease, color 0.2s ease",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                    "&:hover .MuiStepLabel-label": {
                      color: "primary.main",
                    },
                    "&:hover .MuiStepLabel-iconContainer": {
                      color: "primary.main",
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Box sx={{ mb: 4 }}>
          {activeStep === 0 && (
            <Paper sx={{ p: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 600 }}
                >
                  Información Básica
                </Typography>
                <Button
                  variant={editMode ? "outlined" : "contained"}
                  startIcon={editMode ? <Save /> : <Edit />}
                  onClick={editMode ? handleSave : () => setEditMode(true)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <CircularProgress size={20} />
                  ) : editMode ? (
                    "Guardar"
                  ) : (
                    "Editar"
                  )}
                </Button>
              </Box>

              <Box display="flex" flexDirection="column" gap={3}>
                <TextField
                  fullWidth
                  label="Título del Curso"
                  value={formData.title}
                  onChange={handleInputChange("title")}
                  disabled={!editMode}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descripción"
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  disabled={!editMode}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Precio ($)"
                  value={formData.price}
                  onChange={handleInputChange("price")}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Box>
            </Paper>
          )}

          {activeStep === 1 && (
            <Paper sx={{ p: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 600 }}
                >
                  Secciones, Videos y Recursos
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowAddSectionDialog(true)}
                  disabled={isSaving}
                >
                  Agregar Sección
                </Button>
              </Box>

              {formData.sections && formData.sections.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={3}>
                  {formData.sections.map((section, sectionIndex) => (
                    <Accordion key={sectionIndex} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            width: "100%",
                          }}
                        >
                          <DragIndicator color="action" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {section.title}
                          </Typography>
                          <Chip
                            label={`${section.videos?.length || 0} videos`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={`${section.resources?.length || 0} recursos`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        </Box>
                      </AccordionSummary>
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleRemoveSection(section as EditableSection)
                          }
                          color="error"
                          disabled={isSaving}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                      <AccordionDetails>
                        {section.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            {section.description}
                          </Typography>
                        )}

                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                            >
                              Videos
                            </Typography>
                            <Button
                              size="small"
                              startIcon={
                                isSaving ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Add />
                                )
                              }
                              onClick={() => {
                                const editableSection =
                                  section as EditableSection;
                                if (!editableSection._id) {
                                  setError(
                                    "No se encontró el identificador de la sección. Recarga el curso e intenta de nuevo.",
                                  );
                                  return;
                                }
                                setSelectedSection(editableSection);
                                setShowAddVideoDialog(true);
                              }}
                              disabled={isSaving}
                            >
                              {isSaving ? "Guardando..." : "Agregar Video"}
                            </Button>
                          </Box>

                          {section.videos && section.videos.length > 0 ? (
                            <List dense>
                              {section.videos.map((video, videoIndex) => (
                                <ListItem key={videoIndex} sx={{ px: 0 }}>
                                  <ListItemText
                                    primary={video.title}
                                    secondaryTypographyProps={{
                                      component: "div",
                                    }}
                                    secondary={
                                      <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={2}
                                      >
                                        <Typography variant="caption">
                                          {formatDuration(video.duration || 0)}
                                        </Typography>
                                        {video.description && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {video.description}
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                  />
                                  <ListItemSecondaryAction>
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      onClick={() =>
                                        handleOpenReplaceVideoDialog(
                                          section as EditableSection,
                                          video as EditableVideo,
                                        )
                                      }
                                      disabled={isSaving}
                                      color="primary"
                                    >
                                      <UploadFile />
                                    </IconButton>
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      onClick={() =>
                                        handleRemoveVideo(
                                          section as EditableSection,
                                          video as EditableVideo,
                                        )
                                      }
                                      color="error"
                                      disabled={isSaving}
                                    >
                                      <Delete />
                                    </IconButton>
                                  </ListItemSecondaryAction>
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No hay videos en esta sección
                            </Typography>
                          )}
                        </Box>

                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                            >
                              Recursos
                            </Typography>
                            <Button
                              size="small"
                              startIcon={
                                isSaving ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <UploadFile />
                                )
                              }
                              onClick={() => {
                                const editableSection =
                                  section as EditableSection;
                                if (!editableSection._id) {
                                  setError(
                                    "No se encontró el identificador de la sección. Recarga el curso e intenta de nuevo.",
                                  );
                                  return;
                                }
                                setSelectedResourceSection(editableSection);
                                setShowAddResourceDialog(true);
                              }}
                              disabled={isSaving}
                            >
                              {isSaving ? "Guardando..." : "Agregar Recurso"}
                            </Button>
                          </Box>

                          {section.resources && section.resources.length > 0 ? (
                            <List dense>
                              {section.resources.map((resource, resourceIndex) => (
                                <ListItem key={resourceIndex} sx={{ px: 0 }}>
                                  <Box sx={{ mr: 1.5, display: "flex" }}>
                                    {getResourceIcon(resource.type)}
                                  </Box>
                                  <ListItemText
                                    primary={resource.title}
                                    secondaryTypographyProps={{
                                      component: "div",
                                    }}
                                    secondary={
                                      <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                        flexWrap="wrap"
                                      >
                                        <Chip
                                          label={getResourceTypeLabel(
                                            resource.type,
                                          )}
                                          size="small"
                                          variant="outlined"
                                        />
                                        {resource.description && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {resource.description}
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                  />
                                  <ListItemSecondaryAction>
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      onClick={() =>
                                        handleRemoveResource(
                                          section as EditableSection,
                                          resource as EditableCourseResource,
                                        )
                                      }
                                      color="error"
                                      disabled={isSaving}
                                    >
                                      <Delete />
                                    </IconButton>
                                  </ListItemSecondaryAction>
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No hay recursos en esta sección
                            </Typography>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <VideoLibrary
                    sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No hay secciones en este curso
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowAddSectionDialog(true)}
                    disabled={isSaving}
                    sx={{ mt: 2 }}
                  >
                    Agregar Primera Sección
                  </Button>
                </Box>
              )}
            </Paper>
          )}

          {activeStep === 2 && (
            <Paper sx={{ p: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{ fontWeight: 600 }}
                  >
                    Evaluaciones
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crea evaluaciones de acompañamiento por video o una
                    evaluación de certificación al finalizar el curso.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenAddEvaluation}
                  disabled={isSaving}
                >
                  Agregar Evaluación
                </Button>
              </Box>

              {evaluations.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  {evaluations.map((evaluation) => (
                    <Card key={evaluation._id}>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              flexWrap="wrap"
                              mb={1}
                            >
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {evaluation.title}
                              </Typography>
                              <Chip
                                label={getEvaluationKindLabel(evaluation.kind)}
                                color={
                                  evaluation.kind === "certificacion"
                                    ? "secondary"
                                    : "primary"
                                }
                                size="small"
                              />
                              <Chip
                                label={
                                  evaluation.isRequired
                                    ? "Obligatoria"
                                    : "Opcional"
                                }
                                color={
                                  evaluation.isRequired ? "error" : "default"
                                }
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            {evaluation.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                {evaluation.description}
                              </Typography>
                            )}
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Chip
                                label={getEvaluationTriggerLabel(
                                  evaluation.trigger,
                                )}
                                size="small"
                              />
                              {evaluation.videoId && (
                                <Chip
                                  label={getVideoTitle(evaluation.videoId)}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {evaluation.trigger === "during_video" && (
                                <Chip
                                  label={`${evaluation.triggerTimeSeconds || 0}s`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              <Chip
                                label={`${evaluation.questions.length} pregunta(s)`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={`Aprobación ${evaluation.passingScore || 70}%`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditEvaluation(evaluation)}
                              disabled={isSaving}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteEvaluation(evaluation._id)
                              }
                              disabled={isSaving}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <Quiz sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay evaluaciones configuradas
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Agrega preguntas de acompañamiento o certificación para tus
                    alumnos.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleOpenAddEvaluation}
                    disabled={isSaving}
                  >
                    Agregar Primera Evaluación
                  </Button>
                </Box>
              )}
            </Paper>
          )}

          {activeStep === 3 && (
            <Paper sx={{ p: 4 }}>
              <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 600, mb: 3 }}
              >
                Configuración del Curso
              </Typography>

              <Box display="flex" flexDirection="column" gap={3}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{ fontWeight: 600 }}
                      >
                        Estado del Curso
                      </Typography>
                      <Chip
                        label={course.isVisible ? "Publicado" : "Borrador"}
                        color={course.isVisible ? "success" : "default"}
                        icon={course.isVisible ? <Visibility /> : <Drafts />}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      {course.isVisible
                        ? "Tu curso está visible para todos los estudiantes y puede ser comprado."
                        : "Tu curso está en modo borrador y solo tú puedes verlo."}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      {!course.isVisible ? (
                        <Button
                          variant="contained"
                          startIcon={<Publish />}
                          onClick={handlePublishCourse}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <CircularProgress size={20} />
                          ) : (
                            "Publicar Curso"
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<VisibilityOff />}
                          onClick={handleToggleVisibility}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <CircularProgress size={20} />
                          ) : (
                            "Ocultar Curso"
                          )}
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{ fontWeight: 600, mb: 2 }}
                    >
                      Información del Curso
                    </Typography>

                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Secciones:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formData.sections?.length || 0}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Videos Totales:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formData.sections?.reduce(
                            (total, section) =>
                              total + (section.videos?.length || 0),
                            0,
                          ) || 0}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Duración Total:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatDuration(course.totalDuration || 0)}
                        </Typography>
                      </Box>

                      {course.isVisible && (
                        <>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Estudiantes:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {course.totalStudents || 0}
                            </Typography>
                          </Box>

                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Calificación:
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {course.rating?.toFixed(1) || "0.0"}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Paper>
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={activeStep === 0}
            onClick={() =>
              setActiveStep((prevActiveStep) => prevActiveStep - 1)
            }
          >
            Anterior
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              setActiveStep((prevActiveStep) => prevActiveStep + 1)
            }
            disabled={activeStep === steps.length - 1}
          >
            Siguiente
          </Button>
        </Box>
      </Container>

      <Dialog
        open={showEvaluationDialog}
        onClose={() => {
          if (!isSaving) {
            setShowEvaluationDialog(false);
            setEditingEvaluation(null);
            setEvaluationDialogError("");
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEvaluation ? "Editar Evaluación" : "Agregar Evaluación"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            {evaluationDialogError && (
              <Alert severity="error">{evaluationDialogError}</Alert>
            )}
            <TextField
              fullWidth
              label="Título"
              value={evaluationForm.title}
              onChange={(event) =>
                handleEvaluationFieldChange("title", event.target.value)
              }
              required
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Descripción (opcional)"
              value={evaluationForm.description || ""}
              onChange={(event) =>
                handleEvaluationFieldChange("description", event.target.value)
              }
            />
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                select
                label="Tipo de evaluación"
                value={evaluationForm.kind}
                onChange={(event) =>
                  handleEvaluationFieldChange(
                    "kind",
                    event.target.value as EvaluationKind,
                  )
                }
                sx={{ flex: 1, minWidth: 220 }}
              >
                <MenuItem value="acompanamiento">Acompañamiento</MenuItem>
                <MenuItem value="certificacion">Certificación</MenuItem>
              </TextField>
              <TextField
                select
                label="Momento"
                value={evaluationForm.trigger}
                onChange={(event) =>
                  handleEvaluationFieldChange(
                    "trigger",
                    event.target.value as EvaluationTrigger,
                  )
                }
                disabled={evaluationForm.kind === "certificacion"}
                sx={{ flex: 1, minWidth: 220 }}
              >
                <MenuItem value="before_video">Antes del video</MenuItem>
                <MenuItem value="during_video">Durante el video</MenuItem>
                <MenuItem value="after_video">Después del video</MenuItem>
                <MenuItem value="after_course">Al finalizar el curso</MenuItem>
              </TextField>
            </Box>
            {evaluationForm.kind === "acompanamiento" && (
              <Box display="flex" gap={2} flexWrap="wrap">
                <TextField
                  select
                  label="Video"
                  value={evaluationForm.videoId || ""}
                  onChange={(event) => {
                    const videoId = event.target.value;
                    const section = (
                      (formData.sections || []) as EditableSection[]
                    ).find((item) =>
                      item.videos?.some((video) => video._id === videoId),
                    );
                    handleEvaluationFieldChange("videoId", videoId);
                    handleEvaluationFieldChange("sectionId", section?._id);
                  }}
                  sx={{ flex: 2, minWidth: 260 }}
                >
                  {((formData.sections || []) as EditableSection[]).flatMap((section) =>
                    (section.videos || []).map((video) => (
                      <MenuItem key={video._id} value={video._id}>
                        {section.title} - {video.title}
                      </MenuItem>
                    )),
                  )}
                </TextField>
                {evaluationForm.trigger === "during_video" && (
                  <TextField
                    type="number"
                    label="Segundo"
                    value={evaluationForm.triggerTimeSeconds || 0}
                    onChange={(event) =>
                      handleEvaluationFieldChange(
                        "triggerTimeSeconds",
                        Math.max(0, parseInt(event.target.value) || 0),
                      )
                    }
                    sx={{ flex: 1, minWidth: 140 }}
                    inputProps={{ min: 0 }}
                  />
                )}
              </Box>
            )}
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={evaluationForm.isRequired}
                    onChange={(event) =>
                      handleEvaluationFieldChange(
                        "isRequired",
                        event.target.checked,
                      )
                    }
                  />
                }
                label={
                  evaluationForm.kind === "certificacion"
                    ? "Certificación obligatoria para finalizar"
                    : "Bloqueante para avanzar"
                }
              />
              <TextField
                type="number"
                label="Puntaje mínimo (%)"
                value={evaluationForm.passingScore || 70}
                onChange={(event) =>
                  handleEvaluationFieldChange(
                    "passingScore",
                    Math.min(100, Math.max(0, parseInt(event.target.value) || 0)),
                  )
                }
                sx={{ width: 180 }}
                inputProps={{ min: 0, max: 100 }}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Preguntas
              </Typography>
              <Button startIcon={<Add />} onClick={handleAddQuestion}>
                Agregar Pregunta
              </Button>
            </Box>

            {evaluationForm.questions.map((question, questionIndex) => (
              <Card key={questionIndex} variant="outlined">
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Pregunta {questionIndex + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveQuestion(questionIndex)}
                      disabled={evaluationForm.questions.length === 1}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  <TextField
                    fullWidth
                    label="Texto de la pregunta"
                    value={question.prompt}
                    onChange={(event) =>
                      handleQuestionChange(questionIndex, {
                        prompt: event.target.value,
                      })
                    }
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    select
                    fullWidth
                    label="Tipo de respuesta"
                    value={question.type}
                    onChange={(event) =>
                      handleQuestionTypeChange(
                        questionIndex,
                        event.target.value as EvaluationQuestionType,
                      )
                    }
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="multiple_choice">Opción múltiple</MenuItem>
                    <MenuItem value="input">Respuesta escrita</MenuItem>
                    <MenuItem value="true_false">Verdadero o falso</MenuItem>
                  </TextField>

                  {question.type === "multiple_choice" && (
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Typography variant="subtitle2">
                        Opciones y respuesta correcta
                      </Typography>
                      {(question.options || []).map((option, optionIndex) => (
                        <Box
                          key={optionIndex}
                          display="flex"
                          gap={1}
                          alignItems="center"
                        >
                          <Checkbox
                            checked={!!option.isCorrect}
                            onChange={() =>
                              handleCorrectOptionChange(
                                questionIndex,
                                optionIndex,
                              )
                            }
                          />
                          <TextField
                            fullWidth
                            label={`Opción ${optionIndex + 1}`}
                            value={option.text}
                            onChange={(event) =>
                              handleOptionChange(
                                questionIndex,
                                optionIndex,
                                event.target.value,
                              )
                            }
                          />
                          <IconButton
                            color="error"
                            onClick={() =>
                              handleRemoveOption(questionIndex, optionIndex)
                            }
                            disabled={(question.options || []).length <= 2}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => handleAddOption(questionIndex)}
                      >
                        Agregar opción
                      </Button>
                    </Box>
                  )}

                  {question.type === "input" && (
                    <TextField
                      fullWidth
                      label="Respuesta correcta"
                      value={String(question.correctAnswer || "")}
                      onChange={(event) =>
                        handleQuestionChange(questionIndex, {
                          correctAnswer: event.target.value,
                        })
                      }
                    />
                  )}

                  {question.type === "true_false" && (
                    <TextField
                      select
                      fullWidth
                      label="Respuesta correcta"
                      value={String(question.correctAnswer ?? true)}
                      onChange={(event) =>
                        handleQuestionChange(questionIndex, {
                          correctAnswer: event.target.value === "true",
                        })
                      }
                    >
                      <MenuItem value="true">Verdadero</MenuItem>
                      <MenuItem value="false">Falso</MenuItem>
                    </TextField>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 1,
          }}
        >
          {evaluationDialogError && (
            <Alert severity="error">{evaluationDialogError}</Alert>
          )}
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              onClick={() => {
                setShowEvaluationDialog(false);
                setEditingEvaluation(null);
                setEvaluationDialogError("");
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEvaluation}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
            >
              {isSaving ? "Guardando..." : "Guardar Evaluación"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showAddSectionDialog}
        onClose={() => setShowAddSectionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar Nueva Sección</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título de la Sección"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAddSectionDialog(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddSection}
            variant="contained"
            disabled={isSaving || !newSectionTitle.trim()}
            startIcon={isSaving ? <CircularProgress size={20} /> : <Add />}
          >
            {isSaving ? "Guardando..." : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showAddVideoDialog}
        onClose={() => {
          if (!isSaving) {
            setShowAddVideoDialog(false);
            resetVideoForm();
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar Nuevo Video</DialogTitle>
        <DialogContent>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!isSaving) {
                videoFileInputRef.current?.click();
              }
            }}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && !isSaving) {
                event.preventDefault();
                videoFileInputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingVideoFile(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingVideoFile(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDraggingVideoFile(false);
            }}
            onDrop={handleVideoDrop}
            sx={{
              mt: 2,
              mb: 1,
              p: 3,
              border: "2px dashed",
              borderColor: isDraggingVideoFile ? "primary.main" : "divider",
              borderRadius: 2,
              bgcolor: isDraggingVideoFile ? "action.selected" : "background.paper",
              cursor: isSaving ? "not-allowed" : "pointer",
              textAlign: "center",
              transition: "border-color 0.2s ease, background-color 0.2s ease",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "action.hover",
              },
            }}
          >
            <UploadFile color="primary" sx={{ fontSize: 42, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {isReadingVideoDuration
                ? "Leyendo duración..."
                : newVideoFile
                  ? "Cambiar archivo de video"
                  : "Selecciona o arrastra tu video aquí"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Haz click para abrir el explorador o suelta un archivo de video.
            </Typography>
            <input
              ref={videoFileInputRef}
              hidden
              type="file"
              accept="video/*"
              onChange={(e) =>
                handleVideoFileChange(e.target.files?.[0] ?? null)
              }
            />
          </Box>
          {newVideoFile && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 2, display: "block" }}
            >
              Archivo seleccionado: {newVideoFile.name}
            </Typography>
          )}
          {videoDurationDetected && (
            <Typography
              variant="caption"
              color="success.main"
              sx={{ mb: 2, display: "block" }}
            >
              Duración detectada automáticamente. Puedes ajustarla si lo
              necesitas.
            </Typography>
          )}
          <TextField
            fullWidth
            label="Título del Video"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Descripción (opcional)"
            value={newVideoDescription}
            onChange={(e) => setNewVideoDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Miniatura (opcional)"
            value={newVideoThumbnail}
            onChange={(e) => setNewVideoThumbnail(e.target.value)}
            placeholder="https://example.com/thumbnail.jpg"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Minutos"
              value={newVideoMinutes}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "" ||
                  (parseInt(value) >= 0 && parseInt(value) <= 999)
                ) {
                  setNewVideoMinutes(value);
                }
              }}
              placeholder="5"
              inputProps={{ min: 0, max: 999 }}
              helperText="0-999 minutos"
            />
            <TextField
              fullWidth
              type="number"
              label="Segundos"
              value={newVideoSeconds}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "" ||
                  (parseInt(value) >= 0 && parseInt(value) <= 59)
                ) {
                  setNewVideoSeconds(value);
                }
              }}
              placeholder="30"
              inputProps={{ min: 0, max: 59 }}
              helperText="0-59 segundos"
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            La duración se calcula automáticamente al seleccionar el archivo.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAddVideoDialog(false);
              resetVideoForm();
            }}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddVideo}
            variant="contained"
            disabled={isSaving || isReadingVideoDuration || !newVideoFile}
            startIcon={isSaving ? <CircularProgress size={20} /> : <Add />}
          >
            {isSaving ? "Guardando..." : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showAddResourceDialog}
        onClose={() => {
          if (!isSaving) {
            setShowAddResourceDialog(false);
            resetResourceForm();
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar Nuevo Recurso</DialogTitle>
        <DialogContent>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!isSaving) {
                resourceFileInputRef.current?.click();
              }
            }}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && !isSaving) {
                event.preventDefault();
                resourceFileInputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingResourceFile(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingResourceFile(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDraggingResourceFile(false);
            }}
            onDrop={handleResourceDrop}
            sx={{
              mt: 2,
              mb: 1,
              p: 3,
              border: "2px dashed",
              borderColor: isDraggingResourceFile ? "primary.main" : "divider",
              borderRadius: 2,
              bgcolor: isDraggingResourceFile
                ? "action.selected"
                : "background.paper",
              cursor: isSaving ? "not-allowed" : "pointer",
              textAlign: "center",
              transition: "border-color 0.2s ease, background-color 0.2s ease",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "action.hover",
              },
            }}
          >
            <UploadFile color="primary" sx={{ fontSize: 42, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {newResourceFile
                ? "Cambiar archivo del recurso"
                : "Selecciona o arrastra tu recurso aquí"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PDF, PowerPoint, Word o imágenes.
            </Typography>
            <input
              ref={resourceFileInputRef}
              hidden
              type="file"
              accept=".ppt,.pptx,.doc,.docx,.pdf,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={(e) =>
                handleResourceFileChange(e.target.files?.[0] ?? null)
              }
            />
          </Box>
          {newResourceFile && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 2, display: "block" }}
            >
              Archivo seleccionado: {newResourceFile.name}
            </Typography>
          )}
          <TextField
            fullWidth
            label="Título del Recurso"
            value={newResourceTitle}
            onChange={(e) => setNewResourceTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Tipo de archivo"
            value={newResourceType}
            onChange={(e) =>
              setNewResourceType(e.target.value as CourseResourceType)
            }
            sx={{ mb: 2 }}
          >
            <MenuItem value="powerpoint">PowerPoint</MenuItem>
            <MenuItem value="docx">Documento Word</MenuItem>
            <MenuItem value="pdf">PDF</MenuItem>
            <MenuItem value="image">Imagen</MenuItem>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Descripción (opcional)"
            value={newResourceDescription}
            onChange={(e) => setNewResourceDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowAddResourceDialog(false);
              resetResourceForm();
            }}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddResource}
            variant="contained"
            disabled={isSaving || !newResourceFile || !newResourceTitle.trim()}
            startIcon={isSaving ? <CircularProgress size={20} /> : <Add />}
          >
            {isSaving ? "Guardando..." : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showReplaceVideoDialog}
        onClose={() => {
          if (!isSaving) {
            setShowReplaceVideoDialog(false);
            setVideoToReplace(null);
            setReplacementVideoFile(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reemplazar Video</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona el nuevo archivo para reemplazar &quot;
            {videoToReplace?.title}&quot;.
          </Typography>
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFile />}
            fullWidth
          >
            {replacementVideoFile
              ? "Cambiar archivo seleccionado"
              : "Seleccionar nuevo video"}
            <input
              hidden
              type="file"
              accept="video/*"
              onChange={(e) =>
                setReplacementVideoFile(e.target.files?.[0] ?? null)
              }
            />
          </Button>
          {replacementVideoFile && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Archivo seleccionado: {replacementVideoFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowReplaceVideoDialog(false);
              setVideoToReplace(null);
              setReplacementVideoFile(null);
            }}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReplaceVideo}
            variant="contained"
            disabled={isSaving || !replacementVideoFile}
            startIcon={
              isSaving ? <CircularProgress size={20} /> : <UploadFile />
            }
          >
            {isSaving ? "Reemplazando..." : "Reemplazar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
