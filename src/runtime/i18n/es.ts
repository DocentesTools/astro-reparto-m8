import type { RepartoDictionary } from "./types.js";

export const es: RepartoDictionary = {
  locale: "es",  entity: {
    school: { singular: "Centro", plural: "Centros", status: {} },
    academicYear: { singular: "Curso académico", plural: "Cursos académicos", status: { active: "Activo", archived: "Archivado" } },
    department: { singular: "Departamento", plural: "Departamentos", status: {} },
    teacherRoster: { singular: "Docente", plural: "Docentes", status: {} },
    assignmentProcess: { singular: "Proceso de reparto", plural: "Procesos de reparto", status: { draft: "Borrador", ready_for_meeting: "Listo para la sesión", meeting_open: "Sesión abierta", assigning: "Asignación en curso", department_proposal: "Propuesta del departamento", sent_to_school_leadership: "Enviado a la dirección", returned_by_school_leadership: "Devuelto por la dirección", internal_revision: "Revisión interna", final: "Final", reopened: "Reabierto", archived: "Archivado" } },
    subject: { singular: "Materia", plural: "Materias", status: {} },
    teachingGroup: { singular: "Grupo", plural: "Grupos", status: {} },
    hourRequirement: { singular: "Puesto horario", plural: "Puestos horarios", status: { available: "Disponible", assigned: "Asignado", stale: "Obsoleto", reconciliation_required: "Conciliación requerida" } },
    processParticipant: { singular: "Participante en el proceso", plural: "Participantes en el proceso", status: { active: "Activo", inactive: "Inactivo" } },
    assignment: { singular: "Reparto", plural: "Repartos", status: { active: "Activo", cancelled: "Cancelado" } },
    meetingSession: { singular: "Sesión de reparto", plural: "Sesiones de reparto", status: { prepared: "Preparado", open: "Abierto", selecting: "Seleccionando", paused: "En pausa", closed: "Cerrado", reopened: "Reabierta" } },
    selectionTurn: { singular: "Turno de selección", plural: "Turnos de selección", status: { pending: "Pendiente", active: "Activo", completed: "Completado", skipped: "Saltado", overridden: "Forzado" } },
    auditEvent: { singular: "Evento de auditoría", plural: "Eventos de auditoría", status: {} },
    version: { singular: "Versión", plural: "Versiones", status: {} },
    exportArtifact: { singular: "Exportación", plural: "Exportaciones", status: {} }
  },
  field: {
    name: "Nombre",
    label: "Etiqueta",
    slug: "Slug",
    stage: "Etapa",
    grade: "Curso",
    groupCode: "Código de grupo",
    locality: "Localidad",
    province: "Provincia",
    region: "Comunidad autónoma",
    address: "Dirección",
    notes: "Notas",
    displayName: "Nombre a mostrar",
    linkedUser: "Usuario vinculado",
    claimCode: "Código de vinculación",
    active: "Activo",
    startDate: "Fecha de inicio",
    endDate: "Fecha de fin",
    status: "Estado",
    previousAcademicYear: "Curso académico anterior",
    school: "Centro",
    academicYear: "Curso académico",
    department: "Departamento",
    departmentHead: "Jefe de departamento",
    baseWeeklyHours: "Horas base",
    extraWeeklyHours: "Horas extra autorizadas",
    targetWeeklyHours: "Horas objetivo",
    overloaded: "Sobrecarga autorizada",
    defaultTeacherHoursReference: "Horas de referencia",
    selectionOrderEnabled: "Orden de selección activado",
    selectionOrderMode: "Modo de orden",
    directTeacherSelectionEnabled: "Selección directa del docente",
    lanAccessEnabled: "Acceso LAN",
    subject: "Materia",
    teachingGroup: "Grupo",
    teacher: "Docente",
    hourRequirement: "Puesto horario",
    processParticipant: "Participante",
    source: "Origen",
    reason: "Motivo",
    participatesInSelection: "Participa en la selección",
    selectionPosition: "Posición",
    selectionPoints: "Puntos de selección",
    selectionCriteria: "Criterio de selección",
    selectionNotes: "Notas de selección",
    orderLocked: "Orden bloqueado",
    allocationCategory: "Categoría de asignación",
    activityType: "Tipo de actividad",
    groupWeeklyHours: "Horas de grupo",
    teacherWeeklyHoursPerPosition: "Horas por puesto docente",
    requiredTeacherCount: "Puestos docentes"
  },
  option: {
    allocationCategory: { main: "Principal", secondary: "Secundaria" },
    activityType: { ordinary: "Ordinaria", tutoring: "Tutoría", co_teaching: "Codocencia", support: "Apoyo", department_level: "Nivel de departamento", other: "Otra" },
    boolean: { yes: "Sí", no: "No" }
  },
  view: {
    teacherTitle: "Vista docente",
    claim: {
      title: "Vincula tu perfil docente",
      intro: "Ninguna participación en este reparto está vinculada a tu cuenta, así que aquí no hay nada que mostrarte. Si la jefatura de departamento ha preparado un perfil docente para ti, pídele un código de vinculación e introdúcelo abajo: vincula ese perfil con la cuenta con la que has iniciado sesión. Si tu perfil ya está vinculado, pídele que te añada a este reparto.",
      codeLabel: "Código de vinculación",
      codePlaceholder: "XXXXX-XXXXX-XXXXX-XXXXX",
      hint: "Las mayúsculas y los guiones son indiferentes.",
      linked: "{name} ya está vinculado a tu cuenta."
    },
    lan: {
      title: "Tus horas",
      metric: {
        base: "Base",
        extra: "Extra autorizadas",
        target: "Objetivo",
        assigned: "Asignadas",
        remaining: "Restantes"
      },
      overloaded: "Se te han autorizado {hours} horas extra.",
      notOverloaded: "No tienes horas extra autorizadas.",
      connection: {
        disconnected: "Actualizaciones en directo desconectadas",
        live: "Actualizaciones en directo conectadas",
        stale: "Actualizaciones en directo retrasadas"
      },
      state: {
        pending: "Todavía no has alcanzado tu objetivo.",
        balanced: "Tus horas asignadas coinciden con tu objetivo.",
        overloaded_authorized: "Tu objetivo incluye horas extra autorizadas.",
        inactive: "No estás activo en este proceso.",
        not_participating: "No formas parte del orden de selección."
      },
      availableSlots: "Quedan {count} puesto(s) completo(s) libres en este proceso.",
      planBalance: "Horas de grupo {group} frente a una dotación de {allocation}; carga docente {teacher} frente a un objetivo de participantes de {target}.",
      noAllocation: "sin dotación todavía",
      noPlanBalance: "Este proceso aún no tiene plan docente, así que no hay equilibrio que mostrar."
    },
    loading: "Cargando {entity}",
    pageLoading: {
      title: "Cargando página de reparto",
      description: "Preparando el contenido más reciente de la página."
    },
    unavailable: "{entity} no disponible",
    access: {
      checking: "Comprobando su acceso…",
      forbidden: "No tiene acceso a esta página.",
      forbiddenDetail: "Esta página requiere el rol {role} o superior.",
      role: {
        user: "usuario",
        reader: "lector",
        writer: "editor",
        admin: "administrador",
        superadmin: "superadministrador"
      }
    },
    currentTurn: { status: "Estado", turn: "Turno", teacher: "Docente", started: "Inicio", waiting: "En espera", noPosition: "Sin posición", noActiveTurn: "Sin turno activo", notStarted: "Sin iniciar", position: "Turno {position}", teacherValue: "Docente {teacher}" },
    versions: {
      title: "Versiones",
      item: "Versión {number}",
      itemDetail: "{status} · {created}",
      noReason: "Sin motivo registrado",
      empty: "Todavía no se ha capturado ninguna versión.",
      create: "Crear versión",
      createReason: "Motivo de esta captura (opcional)",
      createPending: "Capturando la versión…",
      createError: "No se ha podido capturar la versión.",
      compare: "Comparar versiones",
      left: "Versión de referencia",
      right: "Versión comparada",
      comparison: "Comparación",
      comparisonPending: "Comparando las dos versiones…",
      comparisonError: "No se ha podido cargar la comparación.",
      noComparison: "Todavía no se ha realizado ninguna comparación.",
      previousYear: "Comparar con el curso anterior",
      noPreviousYear: "Este proceso no se copió de un curso anterior, así que no hay nada con lo que compararlo.",
      source: { versions: "Dos versiones capturadas", previous_year: "Curso académico anterior" },
      blocked: {
        not_enough_versions: "Captura una segunda versión antes de comparar.",
        same_version: "Elige dos versiones diferentes."
      },
      noChanges: "Sin cambios",
      changedSummary: "{changed} de {total} dimensiones de comparación han cambiado.",
      otherChanges: "Ninguna dimensión de comparación ha cambiado, pero {count} secciones de la instantánea siguen siendo distintas.",
      state: { changed: "Cambiada", unchanged: "Sin cambios" },
      notComparable: "No comparable",
      notComparableDetail: "Una de las dos versiones no tiene dotación de dirección, así que no hay diferencia que indicar.",
      sectionsTitle: "Secciones modificadas de la instantánea",
      dimension: {
        allocation: "Dotación de dirección",
        group_hours: "Horas lectivas por grupo",
        teacher_load: "Carga del profesorado",
        subject_category: "Categoría de materia",
        activity: "Actividades docentes",
        group_link: "Grupos vinculados a las actividades",
        teacher_position_count: "Puestos docentes",
        participant_target: "Objetivos de los participantes",
        requirement_generation: "Generación de puestos horarios"
      },
      delta: {
        allocation_delta: "Diferencia de dotación",
        group_load_delta: "Diferencia de horas por grupo",
        teacher_load_delta: "Diferencia de horas docentes",
        participant_target_total_delta: "Diferencia de horas objetivo",
        generation_number_delta: "Diferencia de generación",
        teacher_count_delta: "Diferencia de participantes",
        activity_count_delta: "Diferencia de actividades",
        requirement_count_delta: "Diferencia de puestos"
      },
      section: {
        allocationRevisions: "Revisiones de dotación",
        teachingPlan: "Plan docente",
        subjects: "Materias",
        groupSubjects: "Materias por grupo",
        teachingActivities: "Actividades docentes",
        requirements: "Puestos horarios",
        processParticipants: "Participantes del proceso"
      }
    },
    exports: {
      title: "Centro de exportación",
      closeout: "Cierre",
      leadershipWorkflow: "Flujo de dirección",
      markReturned: "Marcar como devuelto",
      startRevision: "Iniciar revisión",
      reopenFinal: "Reabrir versión final",
      type: {
        internal_draft: "Borrador interno",
        school_leadership: "Dirección del centro",
        final: "Final",
        teacher_summary: "Resumen docente",
        backup: "Copia de seguridad"
      },
      documents: {
        title: "Documentos del proceso",
        description: "Copias guardadas del estado actual del proceso.",
        action: "Exportar: {document}",
        empty: "Todavía no se ha exportado ningún documento.",
        item: "{document} · {format}",
        success: "Documento exportado: {document}.",
        error: "La exportación ha fallado."
      },
      planning: {
        title: "Exportaciones de planificación",
        description:
          "El plan docente como documento. Una copia en borrador o provisional nunca se retiene porque el plan no sea exacto.",
        mode: {
          draft: "Borrador del plan",
          provisional: "Plan provisional",
          final: "Plan final"
        },
        modeDescription: {
          draft: "Copia de trabajo para el departamento.",
          provisional: "Copia compartible que indica que no está validada.",
          final: "Copia estricta, rechazada mientras haya un aviso bloqueante."
        },
        action: "Exportar",
        neverBlocked: "Disponible sea cual sea el estado de los equilibrios.",
        blocked: {
          plan_missing: "La planificación no ha empezado en este proceso.",
          blocking_validations:
            "Resuelve cada aviso bloqueante antes de exportar el plan final."
        },
        feasibilityLabel: "Viabilidad del reparto: {status}",
        feasibility: {
          not_evaluated: "SIN EVALUAR",
          feasible: "VIABLE",
          infeasible: "INVIABLE",
          unknown: "DESCONOCIDA"
        },
        feasibilityMissing: "Viabilidad del reparto: sin plan",
        notValidated: "Un documento provisional no es un plan validado.",
        resultTitle: "Documento de planificación",
        resultSummary: "Documento {mode} generado el {generated}.",
        activities: "{count} actividades",
        exact: "Ambos equilibrios son exactos.",
        inexact:
          "El plan no es exacto. El documento incluye ambos equilibrios y todos los avisos.",
        findings: "{blocking} bloqueantes · {warning} advertencias",
        error: "La exportación de planificación ha fallado."
      },
      importPlanning: {
        title: "Importación del plan",
        description: "Importa actividades en el plan actual. Se acepta un resultado inexacto y se muestran sus acciones pendientes.",
        content: "JSON de importación",
        placeholder: '{"activities": []}',
        action: "Importar planificación",
        neverBlocked: "La importación no se bloquea por un resultado desequilibrado.",
        error: { empty: "Pega un cuerpo de importación del plan.", invalid_json: "El contenido no es JSON válido.", invalid_contract: "El JSON no cumple el contrato de importación del plan." },
        resultTitle: "Estado del plan importado",
        resultSummary: "{count} actividades importadas.",
        reconciliationTitle: "Requisitos de conciliación",
        findings: "{blocking} bloqueantes · {warning} advertencias",
        success: "Planificación importada.",
        requestError: "La importación del plan ha fallado."
      },
      restore: {
        confirmTitle: "¿Restaurar esta copia en el borrador?",
        confirmBody: "El destino debe ser un borrador vacío. El servicio valida la generación y la conciliación antes de escribir.",
        restoreAssignments: "Restaurar puestos generados y asignaciones",
        confirmAction: "Restaurar copia",
        blocked: { no_backup: "Crea una copia JSON antes de restaurar.", process_not_draft: "Solo un proceso en borrador puede recibir una copia." },
        success: "Copia restaurada.",
        error: "No se pudo restaurar la copia."
      },
      final: {
        title: "Exportación final del reparto",
        description:
          "Requiere un reparto completo y viabilidad confirmada, y archiva el proceso.",
        action: "Exportar versión final",
        ready: "Listo para exportar.",
        blocked: {
          plan_missing: "La planificación no ha empezado en este proceso.",
          requirements_not_generated:
            "Todavía no se ha generado ningún puesto horario.",
          findings_unavailable: "No se han podido leer los avisos del reparto.",
          assignment_blocking:
            "El reparto está incompleto: quedan {count} aviso(s) bloqueante(s).",
          feasibility_not_confirmed:
            "La viabilidad del reparto no está confirmada sobre el estado actual."
        },
        confirmTitle: "¿Exportar y archivar?",
        confirmBody:
          "La exportación final archiva el proceso. Solo se puede deshacer reabriéndolo.",
        confirmAction: "Exportar y archivar",
        success: "Exportación final creada.",
        error: "La exportación final ha fallado."
      }
    },
    choice: {
      title: "Elegir un puesto",
      confirmation: "Confirmación",
      choose: "Tomar este puesto",
      pass: "Pasar",
      ready: "Listo para tomar el puesto seleccionado.",
      noSlots: "No hay ningún puesto vivo disponible.",
      position: "Puesto {position}",
      hours: "{hours} horas docentes",
      impact: "Tomar este puesto le asigna {hours} horas docentes completas.",
      remainingTarget: "Le quedan {hours} horas antes de su objetivo.",
      select: "Elegir",
      selected: "Elegido",
      passReasonLabel: "Motivo",
      passReasonPlaceholder: "Por qué pasa su turno",
      passReasonDefault: "Turno pasado por el docente.",
      passReasonHint: "Pasar un turno queda auditado. Deje el campo vacío para registrar el motivo por defecto.",
      pending: "En curso…",
      disabled: {
        meeting_not_open: "La reunión no está abierta.",
        direct_selection_disabled: "La selección directa está desactivada.",
        plan_not_ready: "El plan todavía no está listo para la selección.",
        reconciliation_required: "Un cambio de asignación debe reconciliarse antes de continuar la selección.",
        selection_blocked: "El servicio está bloqueando las selecciones ahora mismo.",
        not_your_turn: "Es el turno de otro docente.",
        no_slot_chosen: "Elija primero un puesto.",
        slot_occupied: "Este puesto ya está ocupado.",
        slot_not_available: "Este puesto no está disponible para la selección.",
        duplicate_activity_position: "Ya ocupa un puesto de esta actividad.",
        exceeds_remaining_target: "El puesto completo no cabe en sus horas objetivo restantes."
      },
      conflict: {
        state_changed: "El reparto cambió. Actualice el estado de la reunión y elija de nuevo.",
        refused: "El servicio rechazó esta elección.",
        not_found: "Este puesto ya no existe.",
        not_allowed: "No tiene permiso para hacer esta elección.",
        signed_out: "Su sesión ha caducado. Inicie sesión de nuevo.",
        network: "No se puede contactar con el servidor. Inténtelo de nuevo.",
        server: "Algo falló por nuestra parte. Inténtelo de nuevo."
      }
    }
  },
  audit: {
    pageTitle: "Auditoría del reparto", description: "Consulta los eventos de auditoría del proceso activo.",
    action: { created: "Creado", updated: "Modificado", deleted: "Eliminado", transitioned: "Estado modificado", reopened: "Reabierto", copied_from_previous_year: "Copiado del curso anterior", direct_choice: "Elección directa registrada", started: "Iniciado", completed: "Completado", skipped: "Omitido", overridden: "Forzado", undone: "Deshecho", reassigned: "Reasignado", reentered: "Reincorporado", recomputed: "Recalculado" },
    entity: { process: "Proceso de reparto", assignment_process: "Proceso de reparto", assignment: "Reparto", subject: "Materia", hour_requirement: "Puesto horario", selection_turn: "Turno de elección", teaching_group: "Grupo", process_teacher: "Participante en el proceso" },
    role: { superadmin: "Superadministrador", department_head: "Jefatura de departamento", teacher: "Docente", school_leadership: "Dirección del centro" }, event: "{entity}: {action}"
  },
  requirements: {
    pageTitle: "Puestos horarios generados",
    description: "Consulta los puestos docentes indivisibles generados desde el plan docente. La generación y la conciliación siguen siendo responsabilidad del servicio.",
    statusTitle: "Estado de generación y conciliación",
    planUnavailable: "Plan no disponible",
    planStatusSummary: "Estado del plan: {status}. Generación actual: {generation}.",
    planStatus: {
      draft: "Borrador",
      unbalanced: "Desequilibrado",
      balanced: "Equilibrado",
      locked: "Bloqueado",
      requirements_generated: "Necesidades generadas",
      stale: "Obsoleto",
      reconciliation_required: "Conciliación requerida"
    },
    generationState: {
      unavailable: "El estado del plan docente no está disponible; los puestos generados siguen siendo de solo lectura.",
      notGenerated: "El plan todavía no ha alcanzado la generación de necesidades.",
      ready: "El plan está bloqueado y listo para generar las necesidades.",
      current: "Los puestos generados están actualizados para la generación del servicio indicada abajo.",
      stale: "El plan cambió después de la generación. Los puestos existentes siguen visibles mientras el servicio prepara la conciliación.",
      reconciliationRequired: "Hay puestos asignados que requieren conciliación explícita antes de que la generación vuelva a estar actualizada."
    },
    metric: { activities: "Actividades", slots: "Puestos generados", available: "Disponibles", assigned: "Asignados", attention: "Requieren atención" },
    slotsTitle: "Puestos por actividad y posición",
    slotsDescription: "Cada posición es completa e indivisible; las horas nunca se editan desde esta vista.",
    empty: "Todavía no se han generado puestos horarios para este plan.",
    unknownActivity: "Actividad docente desconocida",
    unknownSubject: "Materia desconocida",
    activityLabel: "{subject} · {type}",
    positionCount: "{count} posición(es) docente(s)",
    position: "Posición {position}",
    teacherHours: "{hours} horas docentes",
    generationLineage: "Creado en la generación {created}; validado en la generación {validated}.",
    retiredLineage: "Retirado en la generación {generation}.",
    superseded: "Se registró un puesto de sustitución."
  },
  assignments: {
    pageTitle: "Tablero de repartos",
    description: "Asigne cada puesto docente completo a un participante elegible. Las horas del puesto proceden de la generación y no se editan aquí.",
    metric: { slots: "Puestos vivos", assigned: "Asignados", available: "Disponibles" },
    hoursColumn: "Horas del puesto",
    teacherHours: "{hours} horas docentes",
    unknownSlotHours: "Horas del puesto no disponibles",
    source: {
      department_head: "Jefatura de departamento",
      teacher_direct: "Elección directa del docente",
      imported_from_previous_year: "Importado del curso anterior",
      system_copy: "Copia del sistema"
    },
    empty: "Todavía no se ha asignado ningún puesto.",
    historyRow: "Cancelado; se conserva para la auditoría.",
    assignAction: "Asignar puesto",
    assignTitle: "Asignar un puesto horario",
    assignDescription: "Elija un puesto libre y un participante elegible. El puesto siempre se ocupa por completo.",
    selectSlotFirst: "Elija un puesto para ver los participantes elegibles.",
    noAssignableSlots: "Todos los puestos vivos ya están asignados.",
    noEligibleTeachers: "Ningún participante es elegible para este puesto.",
    safeChoice: {
      loading: "Comprobando el plan determinista de elecciones seguras.",
      current: "Las elecciones se filtran con el testigo determinista actual.",
      unavailable: "El filtrado de elecciones seguras no está disponible; vuelve a ejecutar la evaluación administrativa de viabilidad.",
      not_required: "El plan no tiene un testigo viable actual; se aplican las reglas ordinarias del servicio."
    },
    teacherDisabled: {
      participant_inactive: "No es un participante activo.",
      duplicate_activity_position: "Ya ocupa un puesto de esta actividad.",
      exceeds_remaining_target: "El puesto completo no cabe en las horas objetivo restantes.",
      strands_remaining_participants: "Esta elección dejaría el reparto restante sin un testigo válido.",
      witness_unavailable: "El estado de elección segura no está disponible hasta volver a evaluar la viabilidad."
    },
    notesAction: "Notas",
    notesTitle: "Editar las notas del reparto",
    undoAction: "Deshacer",
    undoTitle: "¿Deshacer este reparto?",
    undoBody: "{slot} vuelve a los puestos disponibles y {teacher} regresa a la cola de selección. El motivo queda registrado en la auditoría.",
    undoConfirm: "Deshacer el reparto",
    undone: "El reparto se deshizo y el puesto quedó libre.",
    undoError: "No se pudo deshacer el reparto.",
    selectAllVisible: "Seleccionar todos los repartos visibles",
    selectRow: "Seleccionar {name}",
    undoSelected: "Deshacer la selección ({count})",
    bulkUndoTitle: "¿Deshacer los repartos seleccionados?",
    bulkUndoBody: "Se registra un único motivo en cada uno de los {count} repartos seleccionados. Sus puestos vuelven a estar disponibles y los docentes liberados regresan a la cola de selección. Se deshacen de uno en uno y el proceso se detiene ante el primer rechazo.",
    bulkUndoConfirm: "Deshacer {count} repartos",
    bulkUndone: "Repartos deshechos: {count}.",
    bulkUndoError: "Se detuvo tras deshacer {done} de {total} repartos. Los ya deshechos siguen deshechos.",
    reassignAction: "Reasignar",
    reassignTitle: "Reasignar este puesto",
    reassignBody: "{slot} pasa de {teacher} al sustituto que elija, en una sola operación. El motivo queda registrado en la auditoría.",
    reassignConfirm: "Reasignar el puesto",
    replacement: "Participante sustituto",
    reassigned: "El puesto se reasignó.",
    reassignError: "No se pudo reasignar el puesto.",
    validationsTitle: "Validaciones de reparto",
    validationsSummary: "{blocking} hallazgo(s) bloqueante(s) y {warnings} aviso(s).",
    validationsLoading: "Cargando las validaciones de reparto.",
    validationsUnavailable: "Las validaciones de reparto no están disponibles.",
    noValidations: "No hay hallazgos de validación de reparto."
  },
  planning: {
    pageTitle: "Planificación del reparto",
    description: "Crea y revisa el plan docente del proceso activo.",
    balanceTitle: "Balance de planificación",
    group: "Horas de grupos",
    teacher: "Horas de docentes",
    target: "Objetivo",
    planned: "Planificado",
    difference: "Diferencia",
    loading: "Cargando el balance de planificación.",
    unavailable: "El balance de planificación no está disponible.",
    noPlanYet: "Todavía no se ha creado un plan docente para este proceso, así que no hay balance que mostrar.",
    creation: {
      title: "Plan docente",
      description: "La planificación trabaja sobre un único plan docente propiedad de este proceso.",
      absent: "Este proceso aún no tiene plan docente. Créalo para empezar a planificar; no ha fallado nada.",
      unavailable: "No se ha podido leer el plan docente.",
      readOnly: "Un administrador debe crear el plan docente antes de poder planificar.",
      action: "Crear plan docente",
      pending: "Creando el plan docente.",
      success: "El plan docente se ha creado.",
      error: "No se ha podido crear el plan docente.",
      duplicateError: "Este proceso ya tiene un plan docente."
    },
    materialization: {
      title: "Actividades de materias principales",
      description: "Revisa cada fila activa de materia principal antes de crear únicamente las actividades que faltan.",
      missing: "Pendientes",
      materialized: "Materializadas",
      empty: "No hay filas activas de materias principales disponibles.",
      loading: "Cargando el estado de materialización de materias principales.",
      unavailable: "El estado de materialización de materias principales no está disponible.",
      inherited: "Heredado",
      complete: "Todas las actividades principales están materializadas",
      reviewAction: "Revisar {count} actividades pendientes",
      confirmTitle: "¿Materializar las actividades principales pendientes?",
      confirmBody: "Crear {missing} actividades pendientes. Las {materialized} actividades ya materializadas se muestran para revisión y no se duplicarán.",
      confirmAction: "Materializar actividades pendientes",
      success: "Se crearon {created} actividades principales; se omitieron {skipped} filas ya materializadas.",
      error: "No se pudieron materializar las actividades principales.",
      state: {
        missing: "Pendiente",
        materialized: "Materializada",
        out_of_sync: "Desincronizada"
      },
      column: {
        subject: "Materia",
        teachingGroup: "Grupo",
        groupHours: "Horas de grupo",
        teacherHours: "Horas por puesto docente",
        teacherCount: "Puestos docentes",
        state: "Estado"
      }
    },
    sync: {
      title: "Actividades principales desincronizadas",
      description: "Editar una celda materia-grupo nunca reescribe la actividad que creó. Revisa cada diferencia y aplícala de forma explícita.",
      empty: "Todas las actividades principales materializadas coinciden con su celda de origen.",
      loading: "Cargando el estado de sincronización de las actividades principales.",
      unavailable: "El estado de sincronización de las actividades principales no está disponible.",
      unknownTeachingGroup: "Grupo desconocido",
      activityLabel: "{subject} — {teachingGroup}",
      reviewAction: "Revisar diferencias",
      previewTitle: "¿Sincronizar {subject} — {teachingGroup}?",
      previewError: "No se pudo cargar la vista previa de sincronización.",
      noValueDifferences: "Los valores de planificación ya coinciden; aplicar solo retira la marca de desincronización.",
      reconciliationRequired: "Aplicar cambia {count} puestos asignados. Se encauzan por el flujo de reconciliación.",
      noAssignmentImpact: "Ningún puesto asignado se ve afectado.",
      applyAction: "Aplicar valores de origen",
      applySuccess: "Se aplicaron {count} valores de planificación desde la celda de origen.",
      applyError: "No se pudieron aplicar los valores de origen.",
      staleError: "Los datos de planificación cambiaron desde esta vista previa. Revisa de nuevo las diferencias.",
      state: {
        in_sync: "Sincronizada",
        out_of_sync: "Desincronizada"
      },
      blocked: {
        retirement_required: "La celda de origen está retirada. Usa el flujo controlado de retirada de actividad en lugar de una sincronización.",
        no_changes: "Esta actividad ya está sincronizada con su celda de origen."
      },
      column: {
        field: "Valor de planificación",
        current: "Actividad actual",
        source: "Celda de origen"
      },
      field: {
        group_weekly_hours_per_group: "Horas de grupo",
        teacher_weekly_hours_per_position: "Horas de profesor por puesto",
        required_teacher_count: "Puestos de profesor"
      }
    },
    secondary: {
      title: "Actividades secundarias",
      description: "Añade tutoría, docencia compartida y otras actividades opcionales manteniendo separadas las horas de grupo y la carga docente.",
      createAction: "Añadir actividad secundaria",
      createTitle: "Añadir actividad secundaria",
      editTitle: "Editar actividad secundaria",
      formDescription: "Elige una materia secundaria, sus grupos vinculados y los valores reales utilizados por los dos balances.",
      subject: "Materia secundaria",
      activityType: "Tipo de actividad",
      groupHours: "Horas por grupo",
      teacherHours: "Horas por puesto docente",
      teacherCount: "Puestos docentes",
      groups: "Grupos vinculados",
      notes: "Notas",
      balanceHint: "Impacto de grupo = horas de grupo × grupos vinculados. Impacto docente = horas por puesto × puestos.",
      multipleGroupsHint: "Selecciona uno o varios grupos. Todos reciben el mismo valor de horas de grupo.",
      singleGroupHint: "Esta materia requiere exactamente un grupo vinculado.",
      optionalGroupHint: "Esta materia permite cero o un grupo vinculado.",
      noGroups: "No hay celdas grupo-materia activas para esta materia.",
      noLinkedGroups: "Actividad de departamento",
      noSubjects: "Crea una materia secundaria y sus celdas grupo-materia antes de añadir una actividad.",
      empty: "No se han añadido actividades secundarias activas.",
      loading: "Cargando actividades secundarias.",
      unavailable: "Las actividades secundarias no están disponibles.",
      created: "Actividad secundaria creada",
      updated: "Actividad secundaria actualizada",
      retired: "Actividad secundaria retirada",
      saveError: "No se pudo guardar la actividad secundaria.",
      retireError: "No se pudo retirar la actividad secundaria.",
      retireTitle: "¿Retirar la actividad secundaria?",
      retireBody: "¿Retirar la actividad secundaria de {subject}? Deja de contar en el plan y sale de esta lista.",
      retireConsequence: "No se elimina nada: la actividad conserva su historial y queda marcada con su fecha de retiro. Todo puesto ya generado a partir de ella exige una regeneración, y todo puesto ya asignado exige una reconciliación.",
      groupRequiredError: "Selecciona un grupo para esta materia.",
      multipleGroupsError: "Esta materia no permite varios grupos vinculados.",
      duplicateGroupsError: "Un grupo no se puede vincular más de una vez.",
      invalidGroupsError: "Cada grupo vinculado debe ser una celda activa de la materia seleccionada.",
      teacherCountError: "Los puestos docentes deben ser un número entero positivo.",
      notesError: "Las notas no pueden superar los 2000 caracteres.",
      hoursError: {
        not_a_number: "Introduce un valor decimal de horas.",
        too_many_decimals: "Usa como máximo dos decimales.",
        negative: "Las horas no pueden ser negativas.",
        out_of_range: "Las horas superan el intervalo admitido."
      },
      type: {
        ordinary: "Ordinaria",
        tutoring: "Tutoría",
        co_teaching: "Docencia compartida",
        support: "Apoyo",
        department_level: "Nivel de departamento",
        other: "Otra"
      }
    },
    generation: {
      title: "Bloqueo del plan y generación de necesidades",
      description: "Revisa las validaciones y el estado de bloqueo oficiales antes de previsualizar y generar puestos docentes indivisibles.",
      planLoading: "Cargando el plan docente.",
      planUnavailable: "El plan docente no está disponible.",
      validationsTitle: "Validaciones del plan",
      validationsDescription: "Los errores bloqueantes y avisos proceden directamente del servicio y nunca se deducen del texto mostrado.",
      validationsLoading: "Cargando las validaciones del plan.",
      validationsUnavailable: "Las validaciones del plan no están disponibles.",
      blocking: "Bloqueantes",
      warnings: "Avisos",
      noValidations: "No hay validaciones del plan.",
      lockTitle: "Confirmación del bloqueo",
      lockConfirmed: "El servicio confirma que este plan ha pasado por el estado bloqueado del ciclo de vida.",
      lockReady: "Este plan equilibrado puede bloquearse después de confirmar las validaciones del servicio y el resultado de viabilidad actual.",
      lockUnavailable: "El plan debe estar equilibrado y ser viable antes de poder bloquearse.",
      lockAction: "Revisar y bloquear el plan",
      lockDisabledValidations: "Espera las validaciones oficiales del plan antes de bloquearlo.",
      lockDisabledBlocking: "Resuelve todas las validaciones bloqueantes antes de bloquear el plan.",
      lockDisabledFeasibility: "Ejecuta correctamente la viabilidad del plan actual antes de bloquearlo.",
      lockDisabledStatus: "El plan debe estar equilibrado antes de bloquearse.",
      lockConfirmationTitle: "Confirmar el bloqueo del plan",
      lockConfirmationDescription: "El bloqueo fija estos datos de planificación viables para generar las necesidades. Confirma solo después de revisar las validaciones anteriores.",
      lockConfirmAction: "Bloquear el plan",
      lockSuccess: "El servicio ha bloqueado el plan docente.",
      lockError: "No se pudo bloquear el plan docente.",
      unlockTitle: "Desbloqueo",
      unlockRequired: "Los cambios de planificación se rechazan mientras el plan esté en este estado; primero hay que desbloquearlo.",
      unlockConsequence: "El desbloqueo borra la marca de bloqueo y devuelve el plan a la edición equilibrada. La generación de necesidades seguirá sin estar disponible hasta que vuelva a bloquearse, y el servicio comprobará de nuevo la viabilidad en ese momento.",
      unlockAction: "Desbloquear el plan",
      unlockBlockedGeneration: "El servicio solo desbloquea un plan bloqueado antes de la generación. Este plan ya tiene una generación de necesidades: usa la regeneración o el flujo de reconciliación.",
      unlockReadOnly: "Desbloquear un plan docente es una acción de administrador.",
      unlockPending: "Desbloqueando el plan docente.",
      unlockSuccess: "El servicio ha desbloqueado el plan docente.",
      unlockError: "No se pudo desbloquear el plan docente.",
      planStatus: "Estado del plan: {status}. Generación actual: {generation}.",
      previewAction: "Previsualizar la generación de necesidades",
      previewDisabled: "La generación solo está disponible para un plan bloqueado por el servicio u obsoleto.",
      previewTitle: "Confirmar la generación de necesidades",
      previewSummary: "Generación {generation}: crear {create}, conservar {preserve}, retirar {retire}, conflictos {conflicts}.",
      previewMetric: {
        create: "Crear",
        preserve: "Conservar",
        retire: "Retirar",
        conflict: "Conflictos"
      },
      reconciliationRequired: "Cambiarían puestos ya asignados. Usa el flujo de conciliación; la generación no puede aplicarse.",
      noChanges: "La previsualización no contiene cambios. Al aplicarla se registra igualmente la siguiente generación de validación determinista.",
      confirmAction: "Generar puestos necesarios",
      previewError: "No se pudo crear la previsualización de generación.",
      generateError: "No se pudieron generar los puestos necesarios.",
      success: "Generación aplicada. Hay {count} puestos activos disponibles.",
      resultTitle: "Generación aplicada",
      resultSummary: "La generación {generation} creó {created}, conservó {preserved}, retiró {retired} y ahora tiene {count} puestos activos.",
      totalSlots: "Número de puestos activos generados"
    },
    feasibility: {
      title: "Diagnósticos de viabilidad",
      description: "Vista del jefe de departamento de la última evaluación acotada: su estado, sus hallazgos y la remediación sugerida. Los hallazgos nunca salen de este nivel.",
      planLoading: "Cargando el plan docente.",
      planUnavailable: "El plan docente no está disponible.",
      noPlan: "La planificación no ha comenzado para este proceso, así que no hay nada que evaluar.",
      statusTitle: "Última evaluación",
      evaluatedAt: "Última evaluación: {timestamp}",
      solverVersion: "Versión del solucionador: {version}",
      notEvaluated: "No existe ninguna evaluación actual. Ejecuta una tras los cambios de planificación; cada cambio relevante restablece el resultado almacenado.",
      evaluatedNone: "La evaluación actual no informa de ningún hallazgo.",
      diagnosticsLoading: "Cargando los hallazgos de la evaluación.",
      diagnosticsUnavailable: "Los hallazgos de la evaluación no están disponibles; se requiere una nueva evaluación.",
      findingsTitle: "Hallazgos",
      affectedTitle: "Afectados",
      affectedSlot: "{activity} · {position}",
      unresolvedReferences: "{count} referencia(s) afectada(s) no se pueden resolver a una actividad o puesto actual.",
      suggestionTitle: "Remediación sugerida",
      suggestion: {
        incompatible_residual_totals: "Ajusta las metas de los participantes o las horas de las actividades para que los totales restantes coincidan exactamente.",
        slot_exceeds_every_target: "Reduce las horas por puesto de la actividad afectada, o aumenta la meta de un participante con horas extra autorizadas.",
        distinct_teacher_shortfall: "Añade participantes activos o reduce el número de puestos docentes de la actividad afectada para que cada puesto tenga un docente distinto.",
        unsatisfiable_targets: "Revisa juntas las metas de los participantes y las horas de las actividades: ningún reparto exacto puede cubrir a cada participante hasta su meta.",
        instance_size_limit: "La instancia supera los límites configurados del solucionador. Reduce participantes o puestos, o pide al administrador de la plataforma que revise los límites.",
        step_limit: "Vuelve a ejecutar la evaluación. Si sigue indeterminada, simplifica la instancia o pide al administrador de la plataforma que revise el presupuesto del solucionador.",
        time_limit: "Vuelve a ejecutar la evaluación. Si sigue indeterminada, simplifica la instancia o pide al administrador de la plataforma que revise el presupuesto del solucionador."
      },
      evaluateAction: "Ejecutar la evaluación de viabilidad",
      evaluateDisabledNoPlan: "Crea el plan docente antes de ejecutar una evaluación.",
      evaluateSuccess: "Evaluación de viabilidad terminada: {status}.",
      evaluateError: "No se pudo ejecutar la evaluación de viabilidad."
    },
    reconciliation: {
      title: "Cambios de asignación horaria y conciliación",
      description: "Registra revisiones inmutables de la asignación horaria, revisa el plan obsoleto y resuelve explícitamente cada puesto afectado.",
      allocationFormTitle: "Registrar una nueva revisión de asignación horaria",
      allocationFormDescription: "La revisión anterior permanece en el historial. El servicio marca el plan como obsoleto y conserva actividades, necesidades y repartos.",
      allocatedHours: "Horas de grupo asignadas",
      source: "Origen",
      sourceOption: {
        manual_transcription: "Transcripción manual",
        file_import: "Importación de archivo",
        copied_draft: "Borrador copiado",
        other: "Otro"
      },
      sourceReference: "Referencia del origen",
      allocationReason: "Motivo del cambio",
      positiveHoursError: "Las horas asignadas deben ser mayores que cero.",
      allocationReasonError: "El motivo de la asignación no puede superar los 500 caracteres.",
      sourceReferenceError: "La referencia del origen no puede superar los 500 caracteres.",
      recordAllocationAction: "Registrar revisión de asignación",
      allocationRecorded: "Se registró la revisión de asignación. El trabajo existente permanece conservado.",
      allocationError: "No se pudo registrar la revisión de asignación.",
      allocationHistoryTitle: "Historial de revisiones de asignación",
      allocationLoading: "Cargando revisiones de asignación.",
      allocationUnavailable: "Las revisiones de asignación no están disponibles.",
      noAllocation: "Todavía no se ha comunicado ninguna asignación horaria.",
      currentAllocation: "Revisión actual {revision}: {hours} horas de grupo asignadas.",
      revision: "Revisión",
      state: "Estado",
      current: "Actual",
      superseded: "Sustituida",
      historyPreserved: "Cada revisión de asignación anterior permanece visible e inmutable.",
      statusTitle: "Estado de conciliación",
      staleState: "El servicio informa de un plan obsoleto. Los nuevos repartos permanecen bloqueados hasta completar la conciliación.",
      currentState: "El plan no requiere actualmente conciliación de la asignación horaria.",
      planStatus: "Estado del plan: {status}. Generación actual: {generation}.",
      assignmentsPreserved: "Los repartos existentes permanecen visibles y sin cambios hasta confirmar su resolución manual.",
      previewAction: "Previsualizar conciliación de necesidades",
      previewDisabled: "La conciliación solo está disponible cuando el servicio informa de un plan obsoleto o pendiente de conciliación.",
      previewTitle: "Confirmar conciliación manual",
      previewSummary: "Generación {generation}: crear {create}, conservar {preserve}, retirar {retire}, conflictos asignados {conflicts}.",
      previewMetric: {
        create: "Crear",
        preserve: "Conservar",
        retire: "Retirar",
        conflict: "Conflictos asignados"
      },
      preservedRequirements: "{count} necesidades sin cambios y sus repartos permanecen conservados.",
      activity: "Actividad",
      position: "Puesto",
      hoursChange: "Cambio de horas",
      manualAction: "Resolución manual",
      unknownActivity: "Actividad desconocida",
      hoursRemoved: "{current} horas → puesto eliminado",
      hoursChanged: "{current} horas → {next} horas",
      resolution: {
        value_changed: "Liberar el reparto y crear el puesto de sustitución",
        removed: "Liberar el reparto y retirar el puesto eliminado"
      },
      noConflicts: "Ningún puesto asignado debe liberarse. Revisa los cambios no asignados antes de aplicar.",
      noChanges: "La previsualización de conciliación no contiene cambios.",
      reconciliationReason: "Motivo de la conciliación",
      confirmationWarning: "La confirmación registra el motivo, libera solo los repartos indicados y conserva su historial de auditoría. Se rechaza una previsualización modificada.",
      confirmAction: "Aplicar conciliación manual",
      previewError: "No se pudo crear la previsualización de conciliación.",
      stalePreviewError: "La conciliación ha cambiado. Previsualízala de nuevo antes de confirmar.",
      reconcileError: "No se pudieron conciliar las necesidades.",
      success: "Conciliación aplicada. Se resolvieron explícitamente {count} conflictos asignados.",
      resultTitle: "Conciliación aplicada",
      resultSummary: "La generación {generation} resolvió {resolved} conflictos, liberó {released} repartos, creó {created}, conservó {preserved}, retiró {retired} y ahora tiene {count} puestos activos.",
      liveSlots: "Puestos activos después de la conciliación",
      hoursError: {
        not_a_number: "Introduce un valor decimal de horas.",
        too_many_decimals: "Usa como máximo dos decimales.",
        negative: "Las horas no pueden ser negativas.",
        out_of_range: "Las horas superan el intervalo admitido."
      }
    }
  },
  action: {
    create: "Añadir",
    edit: "Editar",
    delete: "Eliminar",
    retire: "Retirar",
    archive: "Archivar",
    unarchive: "Desarchivar",
    close: "Cerrar",
    reopen: "Reabrir",
    transition: "Cambiar de estado",
    save: "Guardar cambios",
    cancel: "Cancelar",
    confirm: "Confirmar",
    search: "Buscar",
    filter: "Filtrar",
    refresh: "Actualizar",
    linkUser: "Vincular a mi cuenta",
    issueClaimCode: "Emitir código de vinculación",
    claimProfile: "Vincular mi perfil",
    copyCode: "Copiar el código",
    unlinkUser: "Desvincular usuario",
    export: "Exportar",
    restore: "Restaurar borrador",
    copyFrom: "Copiar del curso anterior",
    startTurn: "Iniciar turno",
    completeTurn: "Completar turno",
    skipTurn: "Saltar turno",
    overrideTurn: "Forzar turno",
    initializeTurns: "Inicializar turnos",
    openSession: "Abrir sesión",
    closeSession: "Cerrar sesión"
  },
  confirm: {
    delete: { title: "¿Eliminar {entity}?", body: "Esta acción eliminará permanentemente **{name}**. No se puede deshacer.", proceed: "Eliminar permanentemente" },
    archive: { title: "¿Archivar {entity}?", body: "**{name}** dejará de aparecer en las listas activas. Los datos existentes se conservan y pueden consultarse desde la vista de archivo.", proceed: "Archivar" },
    cancel: "Cancelar"
  },
  nav: {
    group: {
      configuration: "Etapa 1 · Configuración",
      planning: "Etapa 2 · Planificación",
      assignment: "Etapa 3 · Asignación"
    },
    item: {
      schools: "Centros",
      academicYears: "Cursos académicos",
      departments: "Departamentos",
      teacherRoster: "Listado del profesorado",
      dashboard: "Panel",
      processes: "Procesos",
      teachingGroups: "Grupos",
      classroomStages: "Etapas educativas",
      groupSubjects: "Matriz grupo-materia",
      processSettings: "Ajustes del proceso",
      allocation: "Dotación de dirección",
      planningExports: "Exportaciones de planificación",
      subjects: "Materias",
      planning: "Planificación",
      requirements: "Horas necesarias",
      processParticipants: "Participantes en el proceso",
      assignments: "Repartos",
      meeting: "Sesión",
      myView: "Mi vista",
      shared: "Pantalla compartida",
      versions: "Versiones",
      exports: "Exportaciones",
      audit: "Auditoría"
    }
  },
  flow: {
    claimCode: {
      title: "Código de vinculación para {name}",
      body: "Entrega este código a {name}. Sirve una sola vez, caduca {expires} y solo se muestra ahora: si se pierde, emite otro.",
      copied: "Copiado",
      dismiss: "Hecho"
    },
    bootstrap: {
      title: "Configurar el reparto",
      subtitle: "Las tres fases, del primer registro a la sesión.",
      step: { school: "Crear un centro", academicYear: "Crear un curso académico", department: "Crear un departamento", process: "Crear un proceso de reparto", allocation: "Registrar la dotación horaria de la dirección", participants: "Añadir participantes y sus horas objetivo", subjects: "Añadir las materias impartidas", teachingGroups: "Añadir los grupos", groupSubjects: "Rellenar la matriz grupo-materia", configurationReview: "Revisar la configuración y los ajustes de selección", teachingPlan: "Crear el plan docente", planBalance: "Equilibrar las horas de grupo y la carga del profesorado", planLock: "Bloquear el plan docente", requirements: "Generar los puestos horarios", meeting: "Repartir los puestos en la sesión" },
      done: "Hecho",
      open: "Abrir",
      unknown: "No comprobado aquí",
      openChecklist: "Lista de configuración",
      closeChecklist: "Cerrar la lista de configuración",
      checking: "Comprobando lo que está hecho…",
      reason: {
        "no-process": "Seleccione antes un proceso.",
        "not-observed": "Esta pantalla no lee ese dato."
      }
    }
  },
  meeting: {
    title: "Control de la sesión",
    open: "La elección está abierta.",
    openDetail: "El plan está al día; los puestos pueden repartirse.",
    blocked: {
      no_process_data: "Todavía no se han cargado datos del proceso.",
      plan_not_ready: "El plan todavía no está listo para la elección.",
      reconciliation_required: "Un cambio de asignación debe reconciliarse antes de continuar la elección.",
      no_meeting_session: "No hay ninguna sesión de reunión abierta."
    },
    lifecycleTitle: "Ciclo de vida del plan",
    lifecycle: {
      open: "Al día",
      stale: "Obsoleto",
      reconciliation_required: "Requiere reconciliación",
      blocked: "Bloqueado"
    },
    staleDetail: "El plan cambió después de la generación. El servicio decide qué ocurre con los puestos existentes.",
    reconciliationDetail: "Un cambio de asignación invalidó el plan. Reconcílielo antes de continuar la sesión.",
    pendingTitle: "Puestos",
    overloadTitle: "Horas extra autorizadas",
    overloadDetail: "{base} h de base + {extra} h autorizadas = {target} h de objetivo",
    noOverloads: "Ningún participante lleva horas extra autorizadas.",
    actionDisabled: {
      no_process_data: "Todavía no se han cargado datos del proceso.",
      plan_not_ready: "El plan aún no está listo para la selección.",
      reconciliation_required: "Un cambio de asignación debe reconciliarse antes de continuar la selección.",
      no_meeting_session: "No hay ninguna sesión de reunión abierta. Abra una para gestionar turnos.",
      turn_active: "Ya hay un turno en curso.",
      no_active_turn: "No hay ningún turno en curso.",
      reason_required: "Indique primero un motivo."
    },
    reasonLabel: "Motivo",
    reasonPlaceholder: "Por qué se omite o se fuerza este turno",
    reasonHint: "Omitir o forzar un turno queda auditado: hace falta un motivo.",
    actionPending: "En curso…",
    actionFailed: "La acción sobre el turno ha fallado.",
    session: {
      title: "Sesión de la reunión",
      none: "No hay ninguna sesión abierta.",
      closeConfirmTitle: "¿Cerrar la sesión de la reunión?",
      closeConfirmBody: "El profesorado pierde el acceso LAN a esta reunión en cuanto se cierra la sesión.",
      closeConfirmAction: "Cerrar sesión",
      actionFailed: "La acción sobre la sesión de la reunión ha fallado."
    }
  },
  dashboard: {
    balanceState: { balanced: "Equilibrado", unbalanced: "No equilibrado", unknown: "Desconocido" },
    readiness: {
      ready: "Listo",
      not_ready: "No listo",
      recalculation_required: "Requiere recálculo"
    },
    feasibility: {
      not_evaluated: "Sin evaluar",
      feasible: "Factible",
      infeasible: "Inviable",
      unknown: "Indeterminada"
    },
    invariant: {
      group: "Horas de grupo",
      teacher: "Carga docente",
      feasibility: "Factibilidad del reparto",
      readiness: "Preparación"
    },
    title: "Panel de reparto",
    subtitleAdmin: "Siga los dos equilibrios, el avance del reparto y la preparación de la sesión antes del directo.",
    subtitleReadonly: "Proyecte una vista tranquila en solo lectura para la sesion en directo.",
    pickerLabel: "Proceso actual",
    pickerHint: "Cambie de proceso cuando la ruta no este bloqueada a un id concreto.",
    mode: { admin: "Modo admin", readonly: "Modo solo lectura" },
    section: {
      planning: "Planificación",
      assignment: "Reparto",
      participants: "Participantes",
      validations: "Validaciones",
      checklist: "Checklist de configuracion",
      meetingReadiness: "Preparacion de la sesion"
    },
    metric: {
      totalSlots: "Puestos",
      assignedSlots: "Tomados",
      availableSlots: "Libres",
      targetHours: "Objetivo",
      assignedHours: "Asignadas",
      remainingHours: "Restantes",
      blocking: "Bloqueantes",
      balancedParticipants: "Equilibrados",
      pendingParticipants: "Pendientes",
      overloadedParticipants: "Con sobrecarga"
    },
    participantState: {
      pending: "Todavía no ha alcanzado su objetivo.",
      balanced: "Las horas asignadas coinciden con el objetivo.",
      overloaded_authorized: "El objetivo incluye horas extra autorizadas.",
      inactive: "No está activo en este proceso.",
      not_participating: "No forma parte del orden de elección."
    },
    state: {
      noDashboard: "Los datos del panel apareceran cuando el proceso este listo.",
      noPlan: "Este proceso todavía no tiene plan docente.",
      noTeachers: "Anada participantes al proceso para ver su avance.",
      noValidations: "Sin hallazgos.",
      summaryOnly: "Esta vista lee el resumen agregado, que no incluye hallazgos por docente.",
      lockedToRoute: "Esta ruta queda fijada al proceso de la URL actual."
    },
    summary: {
      slotProgress: "{assigned} puestos tomados de {total}.",
      participantHours: "{assigned} h de {target} h, quedan {remaining} h",
      authorizedExtra: "{hours} horas extra autorizadas.",
      participants: "{count} participante(s) seguidos; {overloaded} con horas extra autorizadas.",
      validations: "{total} hallazgo(s) bloqueante(s): {planning} en planificacion, {assignment} en reparto.",
      checklist: "{done} paso(s) completado(s) de {total}."
    }
  },
  error: {
    required: "Este campo es obligatorio.",
    requiredNamed: "{field} es obligatorio.",
    duplicate: "Ya existe un registro con este nombre.",
    duplicateScoped: "Ya existe un registro con este nombre en {scope}.",
    fkMissing: "El {field} seleccionado ya no existe. Elija otro.",
    fkViolation: "No se puede eliminar: {count} elemento(s) siguen dependiendo de este registro.",
    hoursInvalid: "Las horas deben ser un número positivo.",
    processState: "El proceso está en {status}; esta acción no está permitida en ese estado.",
    permission: "No tiene permiso para realizar esta acción.",
    unauthorized: "Su sesión ha caducado. Inicie sesión de nuevo.",
    network: "No se puede contactar con el servidor. Inténtelo de nuevo.",
    server: "Se ha producido un error en el servidor. Inténtelo de nuevo.",
    invalidDate: "La fecha de inicio debe ser anterior o igual a la fecha de fin.",
    conflict: "Esta acción entra en conflicto con el estado actual."
  },
  disabled: {
    noProcess: "Seleccione o cree primero un proceso.",
    processClosed: "El proceso está en {status}; esta acción está desactivada.",
    missingPrereq: "Cree primero el {prereq}.",
    invalidHours: "Las horas no son válidas.",
    noData: "Aún no hay datos disponibles.",
    noPermission: "No tiene permiso."
  },
  table: { noResults: "Sin resultados.", searchPlaceholder: "Buscar...", loading: "Cargando...", actions: "Acciones", columns: "Columnas", all: "Todas", firstPage: "Primera página", previousPage: "Página anterior", nextPage: "Página siguiente", lastPage: "Última página", page: "Página", rowsPerPage: "Filas por página", searchTeachingGroups: "Buscar por etapa, código de grupo o etiqueta...", searchSubjects: "Buscar por nombre...", searchParticipants: "Buscar docente...", searchAssignments: "Buscar por necesidad o participante...", searchSchools: "Buscar por nombre, localidad o provincia...", searchAcademicYears: "Buscar por etiqueta o centro...", searchDepartments: "Buscar por nombre o centro...", searchTeacherRoster: "Buscar docente..." },
  teachingGroupBulk: {
    action: "Crear grupos",
    title: "Crear varios grupos",
    description: "Crear un intervalo inclusivo de grupos.",
    groupStart: "Primer grupo",
    groupEnd: "Último grupo",
    created: "Grupos creados: {count}",
    createError: "No se pudieron crear los grupos"
  },
  groupSubjectBulk: {
    title: "Editor masivo de materias por grupo",
    description: "Previsualiza y confirma una materia para los grupos que coinciden con la etapa y el intervalo de cursos.",
    modeLabel: "Modo de operación",
    mode: {
      create_missing: "Crear los que faltan",
      update_existing: "Actualizar los existentes",
      upsert: "Crear o actualizar"
    },
    allStages: "Todas las etapas",
    minimumGrade: "Curso mínimo",
    maximumGrade: "Curso máximo",
    groupHours: "Horas de grupo",
    teacherHours: "Horas por puesto docente",
    teacherCount: "Puestos docentes",
    inheritHint: "Deja vacío un campo de horas para heredar el valor predeterminado. Escribe 0 para un cero real.",
    previewAction: "Previsualizar cambios",
    confirmAction: "Confirmar y aplicar",
    confirmTitle: "¿Aplicar los cambios de materia por grupo?",
    confirmBody: "Aplicar {count} cambio(s) de esta previsualización. El servidor rechazará la operación si la selección ha cambiado.",
    previewTitle: "Previsualización masiva",
    noMatches: "Ningún grupo coincide con estos filtros.",
    noChanges: "La previsualización no contiene cambios que aplicar.",
    validationTitle: "Errores de validación de la previsualización",
    stale: "Esta previsualización está obsoleta porque han cambiado los grupos coincidentes. Previsualiza de nuevo antes de aplicar.",
    applied: "Se crearon {created} y se actualizaron {updated} fila(s) de materia por grupo.",
    previewError: "No se pudo generar la previsualización de materias por grupo.",
    applyError: "No se pudieron aplicar los cambios de materias por grupo.",
    gradeError: "Los cursos deben ser números enteros positivos.",
    gradeRangeError: "El curso mínimo debe ser menor o igual que el curso máximo.",
    teacherCountError: "Los puestos docentes deben ser un número entero positivo.",
    hoursError: {
      not_a_number: "Introduce un valor decimal de horas.",
      too_many_decimals: "Usa como máximo dos decimales.",
      negative: "Las horas no pueden ser negativas.",
      out_of_range: "Las horas superan el intervalo admitido."
    },
    summary: "{create} para crear, {update} para actualizar, {unchanged} sin cambios, {conflicts} conflicto(s).",
    column: {
      action: "Resultado",
      teachingGroup: "Grupo",
      groupHours: "Horas de grupo",
      teacherHours: "Horas docentes",
      teacherCount: "Puestos docentes",
      reason: "Detalles"
    },
    rowAction: {
      create: "Crear",
      update: "Actualizar",
      unchanged: "Sin cambios",
      conflict: "Conflicto"
    }
  },
  groupSubjectMatrix: {
    pageTitle: "Matriz grupo-materia",
    description: "Una celda por grupo y materia, con los valores de planificación reales a partir de los cuales se materializa el plan docente.",
    addAction: "Añadir celda",
    createTitle: "Añadir celda de la matriz",
    editTitle: "Editar celda de la matriz",
    empty: "La matriz está vacía. Rellénala con el editor masivo de abajo o añade una celda.",
    emptyHint: "La materialización de materias principales no tiene ninguna celda candidata mientras no exista al menos una.",
    inherited: "Heredado",
    identityHint: "El grupo y la materia de una celda son su identidad y no se pueden cambiar aquí.",
    readOnly: "Editar la matriz es una acción del jefe de departamento.",
    search: "Buscar grupo o materia...",
    created: "Celda de la matriz añadida.",
    updated: "Celda de la matriz actualizada.",
    createError: "No se pudo añadir la celda de la matriz.",
    updateError: "No se pudo actualizar la celda de la matriz.",
    selectTeachingGroup: "Seleccionar un grupo",
    selectSubject: "Seleccionar una materia"
  },
  allocation: {
    pageTitle: "Dotación de dirección",
    description: "Las horas de grupo semanales que la dirección ha comunicado a este departamento. La etapa 2 equilibra el plan docente frente a la revisión vigente, así que regístrala antes de empezar a planificar.",
    panelTitle: "Revisiones de la dotación",
    panelDescription: "Cada revisión es inmutable y conserva su lugar en el historial. Registrar una nueva después de haber empezado la planificación marca el plan como obsoleto y obliga a una reconciliación explícita.",
    readOnly: "Registrar una revisión de la dotación es una acción del jefe de departamento."
  },
  processSettings: {
    pageTitle: "Ajustes del proceso",
    description: "Cómo se llevará este proceso: las horas de referencia con las que se compara a los participantes, el orden de selección usado en la sesión y los dos espacios a los que el profesorado llega por su cuenta.",
    formTitle: "Ajustes de selección y acceso LAN",
    field: {
      defaultTeacherHoursReference: "Horas de referencia",
      selectionOrderEnabled: "Orden de selección activado",
      selectionOrderMode: "Modo de orden",
      directTeacherSelectionEnabled: "Selección directa del docente",
      lanAccessEnabled: "Acceso LAN"
    },
    hint: {
      defaultTeacherHoursReference: "Deja el campo vacío si no hay referencia. Un 0 escrito es un cero real y no equivale a dejarlo vacío.",
      selectionOrderEnabled: "Registra un orden de selección para la sesión; los participantes toman entonces sus puestos en ese orden.",
      selectionOrderMode: "El modo se guarda por separado y solo se aplica mientras el orden de selección está activado.",
      modeInert: "El orden de selección está desactivado, así que este modo se guarda pero no se aplica.",
      directTeacherSelectionEnabled: "Permite que un participante tome un puesto desde su propia vista, sin esperar a que se registre su turno.",
      lanAccessEnabled: "Abre la vista de solo lectura a la que el profesorado llega por la red local durante la sesión."
    },
    mode: { none: "Sin orden", informative: "Informativo", strict: "Estricto" },
    statusTitle: "Estado actual",
    statusLine: "Estado: {status}.",
    statusOwnedElsewhere: "El estado no es un ajuste: pertenece al punto de transición, y abrir una sesión lo fija directamente.",
    unchanged: "No ha cambiado nada, así que no hay nada que guardar.",
    loading: "Cargando el proceso.",
    unavailable: "El proceso no está disponible.",
    readOnly: "Cambiar los ajustes del proceso es una acción del jefe de departamento.",
    saved: "Ajustes del proceso guardados.",
    saveError: "No se pudieron guardar los ajustes del proceso.",
    hoursError: {
      not_a_number: "Introduce un valor horario como 18 o 18,50.",
      too_many_decimals: "Las horas admiten como máximo dos decimales.",
      negative: "Las horas no pueden ser negativas.",
      out_of_range: "Este valor horario es demasiado grande."
    },
    reopen: {
      title: "Reabrir el proceso",
      frozen: "Este proceso está cerrado. Los cambios de configuración, planificación y asignación se rechazan hasta que se reabra.",
      terminal: "Este proceso está archivado. El archivado es terminal, así que no se puede reabrir.",
      readOnly: "Reabrir un proceso es una acción del jefe de departamento.",
      reasonLabel: "Motivo de reapertura",
      reasonRequired: "Indica por qué se reabre el proceso.",
      reasonTooLong: "El motivo de reapertura no puede superar los 500 caracteres.",
      consequence: "Reabrir devuelve el proceso al estado reabierto, borra su marca de cierre y vuelve a permitir cambios de configuración, planificación y asignación. No se elimina nada de lo ya registrado, y el motivo que indiques es el único rastro de la razón.",
      action: "Reabrir el proceso",
      reopened: "El proceso se reabrió.",
      error: "No se pudo reabrir el proceso."
    }
  },
  teachingGroupSelection: {
    selectAllVisible: "Seleccionar todos los grupos visibles",
    selectRow: "Seleccionar {name}",
    deleteSelected: "Eliminar seleccionados ({count})",
    deleteTitle: "Eliminar los grupos seleccionados",
    deleteBody: "Grupos seleccionados para eliminar: {count}. Esta acción no se puede deshacer.",
    deleted: "Grupos eliminados: {count}",
    deleteError: "No se pudieron eliminar los grupos seleccionados"
  },
  subjectSelection: {
    selectAllVisible: "Seleccionar todas las materias visibles",
    selectRow: "Seleccionar {name}",
    deleteSelected: "Eliminar seleccionadas ({count})",
    deleteTitle: "Eliminar las materias seleccionadas",
    deleteBody: "Materias seleccionadas para eliminar: {count}. Esta acción no se puede deshacer.",
    deleted: "Materias eliminadas: {count}",
    deleteError: "No se pudieron eliminar las materias seleccionadas"
  },
  participants: {
    hoursError: {
      not_a_number: "Introduce un valor de horas como 12 o 12,50.",
      too_many_decimals: "Las horas admiten como máximo dos decimales.",
      negative: "Las horas no pueden ser negativas.",
      out_of_range: "Este valor de horas es demasiado grande."
    },
    extraHoursAction: "Horas extra",
    extraHoursTitle: "Autorizar horas extra",
    extraHoursBody: "{teacher} tiene una base de {base} horas y {extra} horas extra autorizadas, para un objetivo de {target} horas.",
    extraHoursHint: "Vuelve a poner el valor en 0 para retirar la autorización. Ambos sentidos se registran con tu motivo.",
    extraHoursConfirm: "Autorizar",
    extraHoursSaved: "Horas extra autorizadas actualizadas.",
    extraHoursError: "No se pudieron cambiar las horas extra autorizadas",
    lastExtraHoursReason: "Último motivo registrado: {reason}",
    noExtraHoursReason: "Todavía no se ha registrado ningún cambio de horas extra.",
    targetHint: "Las horas objetivo son la base más las horas extra autorizadas; no se editan directamente.",
    overloadedYes: "Sí",
    overloadedNo: "No"
  },
  participantSelection: {
    selectAllVisible: "Seleccionar todos los participantes visibles",
    selectRow: "Seleccionar {name}",
    deleteSelected: "Eliminar seleccionados ({count})",
    deleteTitle: "Eliminar los participantes seleccionados",
    deleteBody: "Participantes seleccionados para eliminar: {count}. Esta acción no se puede deshacer.",
    deleted: "Participantes eliminados: {count}",
    deleteError: "No se pudieron eliminar los participantes seleccionados"
  },
  classroomStages: {
    pageTitle: "Etapas educativas",
    pageDescription: "Gestionar las etapas educativas de referencia comunes.",
    formDescription: "Datos de referencia comunes de los grupos.",
    createTitle: "Crear una etapa educativa",
    editTitle: "Editar la etapa educativa",
    deleteTitle: "Eliminar la etapa educativa",
    deleteBody: "¿Eliminar {name}?",
    field: { stage: "Etapa", shortLabel: "Etiqueta corta", minGrade: "Curso mínimo", maxGrade: "Curso máximo" },
    column: { created: "Creada", updated: "Actualizada" },
    state: { unauthorized: "Se requiere acceso de administrador.", empty: "No se encontraron etapas educativas.", loading: "Cargando etapas educativas...", unavailable: "Las etapas educativas no están disponibles." },
    search: "Buscar etapas educativas",
    toast: { created: "Etapa educativa creada", updated: "Etapa educativa actualizada", saveError: "No se pudo guardar la etapa educativa", deleted: "Etapa educativa eliminada", deleteError: "No se pudo eliminar la etapa educativa" }
  },
  help: {
    open: "¿Qué tengo que hacer aquí?",
    close: "Ocultar esta ayuda",
    openFor: "Abrir la ayuda de {step}",
    what: "Qué es esta página",
    why: "Por qué importa",
    how: "Cómo hacerlo",
    docs: "Leer la guía completa",
    step: {
      processList: {
        what: "Un proceso de reparto es un departamento, en un centro, para un curso académico. Todo lo demás en esta aplicación pertenece a un proceso, así que un curso de trabajo empieza aquí.",
        why: "Nada de lo que sigue en el menú puede abrirse mientras no haya un proceso seleccionado: esas páginas no tienen nada que mostrarte sin él.",
        how: [
          "Elige el curso académico, después el centro y después el departamento. Tu elección se recuerda en este navegador, así que solo la haces una vez.",
          "Si lo que necesitas todavía no existe, elige Crear nuevo. El curso, el centro y el departamento pueden crearse desde esta misma pantalla.",
          "Un proceso nuevo empieza en Borrador. Nunca fijas el estado a mano: avanza solo a medida que progresa el trabajo.",
          "Una vez seleccionado el proceso, baja por el menú en orden: etapa 1, luego etapa 2, luego etapa 3."
        ]
      },
      dashboard: {
        what: "Una vista única del estado del proceso: la lista de comprobación de configuración, los dos equilibrios horarios y lo que todavía falta.",
        why: "Es la forma más rápida de saber qué queda por hacer, sin recorrer todas las páginas para averiguarlo.",
        how: [
          "Lee primero la lista de comprobación: nombra cada punto de la etapa 1 que sigue abierto.",
          "Comprueba los dos equilibrios. Las horas de grupo y las horas del profesorado son dos medidas distintas y nunca se suman.",
          "Sigue el primer punto sin terminar hasta la página que lo resuelve."
        ]
      },
      schools: {
        what: "Los centros que conoce este sitio. Un centro lo comparte todo el sitio, no un solo proceso.",
        why: "Un curso académico, un departamento y por tanto un proceso dependen de un centro, así que no puede crearse nada más hasta que exista uno.",
        how: [
          "Comprueba si tu centro ya está aquí antes de crearlo: estos registros los comparte todo el mundo.",
          "Créalo con su nombre. La localidad, la provincia, la región, la dirección y las notas son opcionales.",
          "Crear y editar un centro requiere una cuenta de Administración; cualquiera puede leer la lista."
        ]
      },
      academicYears: {
        what: "Un curso escolar, por ejemplo 2026/2027, con una fecha de inicio y una de fin. Un curso pertenece a un centro.",
        why: "Un proceso es un departamento, en un centro, para un curso, y el enlace al curso anterior es lo que hace posible una comparación de un año a otro.",
        how: [
          "Elige el centro, ponle una etiqueta al curso y fija sus fechas de inicio y fin.",
          "Enlázalo con el curso anterior cuando exista. Ese enlace es lo que usan la copia del curso pasado y la comparación con el curso anterior.",
          "Un curso terminado se archiva, nunca se borra, de modo que su registro queda intacto."
        ]
      },
      departments: {
        what: "Un departamento didáctico dentro de un centro: el grupo de docentes cuyas horas semanales reparte esta aplicación.",
        why: "El departamento es la tercera parte de un proceso, junto al centro y al curso académico.",
        how: [
          "Elige el centro y después dale al departamento un nombre y un identificador corto.",
          "El campo Jefatura de departamento es solo descriptivo. Registra quién dirige el departamento y no concede ningún permiso.",
          "Lo que una cuenta puede hacer proviene de su rol, nunca de este campo."
        ]
      },
      classroomStages: {
        what: "Las etapas educativas a las que pertenecen tus grupos, por ejemplo Secundaria con la etiqueta corta ESO y los cursos 1 a 4.",
        why: "El nombre de un grupo se construye a partir de su etapa, así que definirlas bien una vez mantiene después todos los grupos nombrados de forma coherente.",
        how: [
          "Dale a la etapa un nombre, la etiqueta corta que se usa dentro del nombre de los grupos, y su curso mínimo y máximo.",
          "La etiqueta de un grupo se genera entonces con el curso, la etiqueta corta y el código de grupo, dando 3.º ESO B.",
          "Cualquiera puede leer las etapas; crearlas y editarlas requiere una cuenta de Administración."
        ]
      },
      teacherRoster: {
        what: "El listado del personal docente que conoce el sitio. Es deliberadamente distinto de las cuentas de usuario del sitio.",
        why: "Una ficha del listado es lo que después añades a un proceso como participante, y vincularla a una cuenta es lo que permite a ese docente usar Mi vista durante una sesión.",
        how: [
          "Crea una ficha por docente con un nombre visible. A quien se haya marchado márcalo como inactivo en lugar de borrarlo.",
          "Para vincular a un docente con su cuenta, elige Emitir código en su fila. El código se muestra una vez, sirve una vez y caduca: entrégaselo en privado.",
          "El docente inicia sesión con su propia cuenta, abre Mi vista e introduce el código. Nunca eliges tú una cuenta en su nombre.",
          "Si se pierde un código, emite otro. El código anterior ya no puede volver a mostrarse."
        ]
      },
      allocation: {
        what: "Las horas de grupo semanales que la dirección ha asignado a tu departamento: la cifra a la que debe llegar todo el plan. Antes de registrar la primera revisión la página está simplemente vacía, lo cual es normal en un proceso nuevo y no un error.",
        why: "Es uno de los dos totales con los que se equilibra la etapa 2, así que sin ella no hay nada hacia lo que planificar.",
        how: [
          "Introduce las horas de grupo semanales asignadas, mayores que cero y con dos decimales como máximo, junto con un motivo escrito. El motivo es obligatorio y se conserva de forma permanente.",
          "No hay edición ni borrado. Para cambiar la cifra registras una revisión nueva, que sustituye a la anterior y la mantiene visible como historial.",
          "Registrar una revisión después de haber empezado a planificar deja el plan obsoleto y obliga a una reconciliación explícita, así que hazlo de forma deliberada."
        ]
      },
      participants: {
        what: "El profesorado que participa en este proceso concreto, cada persona con su carga semanal contratada.",
        why: "La suma de los objetivos de todos los participantes activos es el total de horas del profesorado que el plan debe alcanzar exactamente: ni una hora más, ni una hora menos.",
        how: [
          "Añade a cada docente desde el listado y fija sus horas base, es decir, su carga lectiva semanal contratada.",
          "Las horas objetivo se calculan por ti como la suma de las horas base y las extra autorizadas, y no se pueden escribir.",
          "Las horas extra autorizadas parten de cero y solo cambian mediante la acción específica que exige un motivo escrito, en ambos sentidos, incluida la retirada de una autorización.",
          "Indica si cada participante toma turno en la sesión y en qué posición."
        ]
      },
      subjects: {
        what: "Lo que se imparte, junto con las horas por defecto que cada materia suele llevar.",
        why: "Las materias principales son la entrada obligatoria que la etapa 2 convierte en actividades; las secundarias son las adiciones discrecionales que haces a mano.",
        how: [
          "Dale a cada materia un nombre y una categoría de reparto, Principal o Secundaria. No hay una casilla de principal: la categoría es la distinción.",
          "Fija las horas de grupo por defecto, las horas de profesorado por puesto por defecto y el número de puestos por defecto.",
          "El tipo de actividad es solo una etiqueta descriptiva. Nunca cambia el comportamiento de la aplicación.",
          "Los valores por defecto solo inicializan celdas nuevas de la matriz. Cambiar uno más tarde nunca reescribe celdas ni actividades que ya existen."
        ]
      },
      teachingGroups: {
        what: "Los grupos en sí, cada uno con su etapa, su curso y su código de grupo.",
        why: "Un grupo es la mitad de cada celda de la matriz, y la matriz es aquello sobre lo que se construye todo el plan.",
        how: [
          "Crea un grupo con su etapa educativa, su curso y su código de grupo. La etiqueta se genera por ti hasta que la cambies a mano.",
          "Para crear un nivel entero de una vez usa Crear grupos: elige una etapa, un curso y un rango de códigos de grupo, previsualiza la lista exacta y créalos juntos en una sola petición.",
          "Los cursos que puedes elegir se limitan al rango de la etapa seleccionada."
        ]
      },
      groupSubjects: {
        what: "Una celda por cada par grupo-materia que existe realmente, con las horas reales que ese par representa.",
        why: "Es el corazón de la etapa 1: la matriz es exactamente lo que la etapa 2 convierte en el plan docente.",
        how: [
          "Cada celda lleva horas de grupo, horas de profesorado por puesto y número de puestos. Deja un campo de horas vacío para heredar el valor por defecto de la materia; escribe 0 para un cero real.",
          "Rellenar treinta celdas una a una es lento, así que usa el editor masivo bajo la lista: elige una materia, el modo de operación y después acota los grupos por etapa y rango de cursos.",
          "Pulsa Previsualizar cambios y lee qué se creará, qué se actualizará y qué se dejará igual. Solo entonces se habilita Confirmar y aplicar.",
          "Si algo ha cambiado entre la previsualización y la aplicación, la aplicación se rechaza. Vuelve a previsualizar en lugar de pulsar aplicar una segunda vez."
        ]
      },
      processSettings: {
        what: "Cómo se llevará este proceso: la carga de referencia, el orden de selección, la selección directa por el profesorado y el acceso por red local.",
        why: "Estas decisiones determinan lo que podrá hacer la sesión de la etapa 3, así que resuélvelas antes de abrir una sesión.",
        how: [
          "Fija la carga horaria de referencia con la que se compara a los participantes. Déjala en blanco para no tener ninguna: un 0 escrito es un cero real y no equivale a dejarlo en blanco.",
          "Decide si se registra un orden de selección y con qué rigor se aplica, si el profesorado puede tomar un puesto desde su propia vista, y si la vista por red local está abierta.",
          "Solo se envían los campos que has cambiado realmente. Un proceso Final debe reabrirse aquí primero, con un motivo escrito; Archivado es terminal y no ofrece nada."
        ]
      },
      planning: {
        what: "La única pantalla donde tu configuración se convierte en un plan docente: qué se imparte realmente, con cuántos docentes y durante cuántas horas.",
        why: "La etapa 3 no puede empezar hasta que este plan esté equilibrado, demostrado viable, bloqueado y convertido en puestos.",
        how: [
          "Crea el plan docente si todavía no existe. Un proceso tiene como mucho uno, y no se crea junto con el proceso.",
          "Materializa las actividades principales desde la matriz. El panel lista cada celda como pendiente o materializada, y crea solo las pendientes.",
          "Añade a mano las actividades secundarias: tutoría, docencia compartida, apoyo, tareas de departamento. Decidir eso es el trabajo de planificación.",
          "Guíate por la cabecera de equilibrio de la parte superior. El objetivo es dejar ambas diferencias en 0,00: horas de grupo frente a la dotación, horas de profesorado frente al objetivo de los participantes.",
          "Lee las validaciones del plan y después ejecuta la evaluación de viabilidad. Viable significa que la aplicación tiene una disposición concreta que demuestra que los puestos pueden repartirse exactamente.",
          "Bloquea el plan, previsualiza la generación de puestos y aplícala para crearlos."
        ]
      },
      requirements: {
        what: "El resultado de solo lectura de la generación: cada puesto docente que produjo el plan, agrupado por actividad y con su propio estado de ciclo de vida.",
        why: "Un puesto es lo que la etapa 3 entrega a un docente, entero y sin dividir, así que esta página es donde confirmas que la generación produjo lo que esperabas.",
        how: [
          "Compara el número y las horas con lo que prometió la previsualización de la generación.",
          "Lee el estado de cada puesto: disponible, asignado, obsoleto o con reconciliación requerida.",
          "Aquí no hay deliberadamente creación, edición ni borrado. Los puestos solo cambian por una generación o una reconciliación explícita desde la página de Planificación."
        ]
      },
      assignments: {
        what: "El tablero donde cada puesto generado se entrega íntegro a un participante.",
        why: "Este es el reparto en sí. El proceso está completo cuando cada puesto está tomado y cada participante ha alcanzado su objetivo exactamente.",
        how: [
          "Pulsa Asignar puesto, elige un puesto libre y después un participante. Quienes no puedan tomarlo aparecen con el motivo en lugar de desaparecer sin explicación.",
          "Un puesto no puede dividirse, así que a alguien con tres horas restantes nunca se le ofrecerá un puesto de cuatro horas.",
          "Deshacer libera un puesto y Reasignar lo pasa a otra persona. Ambas exigen un motivo escrito y una cuenta de Administración, y ambas quedan en el tablero como historial.",
          "Si el tablero entero rechaza nuevas asignaciones, el plan está obsoleto o necesita reconciliación: vuelve a Planificación."
        ]
      },
      meeting: {
        what: "La sala de control de una sesión de selección en directo, en la que el profesorado toma sus propios puestos por turnos.",
        why: "Es la alternativa a asignarlo todo tú: el profesorado elige, en un orden registrado, con la aritmética comprobada sobre la marcha.",
        how: [
          "Antes de empezar, vincula a cada docente con su cuenta desde el Listado del profesorado mediante un código, y asegúrate de que participa en este proceso.",
          "Comprueba que el plan está al día y que los puestos están generados, y después elige Abrir sesión. La sesión arrastra los ajustes vigentes.",
          "Inicializa los turnos y después gobiérnalos con Iniciar, Completar, Saltar y Forzar. Saltar y forzar exigen un motivo escrito y quedan registrados.",
          "Cierra la sesión cuando termine la reunión. Al cerrarla se retira al profesorado el acceso por red local a esa sesión."
        ]
      },
      teacherView: {
        what: "La pantalla propia de un docente: sus horas base, extra autorizadas, objetivo, asignadas y restantes, y los puestos que siguen libres.",
        why: "Muestra a un docente sus propias cifras y las de nadie más, que es lo que permite abrirla sin riesgo durante una sesión.",
        how: [
          "Si todavía no hay ningún perfil vinculado a tu cuenta, introduce en Reclamar mi perfil el código que te dio la jefatura de departamento.",
          "Cuando sea tu turno y la selección directa esté activada, elige un puesto libre y tómalo. El servidor vuelve a comprobar que encaja exactamente con tus horas restantes.",
          "También puedes pasar tu propio turno. Esta página nunca muestra las horas de otro docente ni el motivo de una autorización de horas extra."
        ]
      },
      sharedScreen: {
        what: "La vista de proyección: los equilibrios, el estado del plan, los puestos tomados y libres, el turno actual y cuántos participantes están equilibrados, pendientes o sobrecargados.",
        why: "Permite que toda una sala siga la sesión sin que aparezca en la pared ningún nombre ni ninguna hora de una persona concreta.",
        how: [
          "Ábrela en el equipo de proyección mientras la sesión esté abierta.",
          "Los nombres, las horas individuales y los motivos escritos los elimina el propio servidor en lugar de ocultarlos la página, así que no pueden revelarse.",
          "No hay una cuenta de proyección aparte: usa la sesión de la jefatura de departamento o la de un participante."
        ]
      },
      versions: {
        what: "Instantáneas inmutables de todo el proceso, tomadas cuando las pidas, y la comparación entre dos de ellas.",
        why: "Una instantánea es lo que te permite volver más tarde sobre una decisión, y la comparación es lo que hace posible una revisión de un curso a otro.",
        how: [
          "Ponle a la instantánea una nota breve explicando por qué la tomas. Captura la dotación, el plan, la matriz, las actividades, los puestos y las horas de cada participante.",
          "Compara dos versiones para obtener la respuesta del propio servidor en nueve dimensiones con nombre, cada una con su diferencia.",
          "Una dimensión puede indicar no comparable, por ejemplo cuando un lado no tiene ninguna dotación. Es una respuesta real, y no es lo mismo que sin cambios."
        ]
      },
      exports: {
        what: "Tres familias distintas de documento: el plan como documento, copias almacenadas de todo el proceso, y la exportación final estricta.",
        why: "Así es como un reparto sale de la aplicación: como algo que puedes enviar, conservar o restaurar más adelante.",
        how: [
          "El borrador de planificación y el plan provisional están disponibles digan lo que digan los equilibrios. Solo el plan final se rechaza mientras quede un hallazgo bloqueante.",
          "Los documentos de proceso son copias almacenadas: un borrador interno, la copia para la dirección, un resumen por docente y una copia de seguridad completa. Restaurar devuelve una copia de seguridad a un proceso borrador vacío.",
          "La importación de planificación reintroduce un documento de planificación en el plan actual y deliberadamente no se bloquea por un resultado desequilibrado: recuperas el equilibrio y los hallazgos.",
          "La exportación final de asignaciones exige un reparto completo y viabilidad confirmada, y archiva el proceso. Archivado es terminal, así que se te pide confirmación."
        ]
      },
      audit: {
        what: "El registro ordenado de lo que le ha ocurrido a este proceso y de quién lo hizo.",
        why: "Cada motivo que la aplicación te pidió escribir se guarda aquí. Es lo que hace defendible una decisión meses después.",
        how: [
          "Lee el rastro en orden: creación del proceso, revisiones de dotación, autorizaciones de horas extra, bloqueos del plan, generaciones, reconciliaciones, asignaciones, anulaciones y reasignaciones.",
          "Cada entrada lleva la cuenta que la realizó y la hora en que ocurrió.",
          "Los motivos escritos solo los ve la jefatura de departamento. Nunca se muestran al profesorado ni en la pantalla compartida."
        ]
      }
    }
  },
  picker: { noProcesses: "Aún no hay procesos.", selectProcess: "Seleccionar un proceso", createNew: "Crear nuevo", createMissingPrerequisite: "Crear el requisito previo faltante" }
};
