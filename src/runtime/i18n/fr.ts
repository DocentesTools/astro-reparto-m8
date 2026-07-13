import type { RepartoDictionary } from "./types.js";

export const fr: RepartoDictionary = {
  locale: "fr",  entity: {
    school: { singular: "Établissement", plural: "Établissements", status: {} },
    academicYear: { singular: "Année scolaire", plural: "Années scolaires", status: { active: "Actif", archived: "Archivé" } },
    department: { singular: "Département", plural: "Départements", status: {} },
    teacherRoster: { singular: "Enseignant", plural: "Enseignants", status: {} },
    assignmentProcess: { singular: "Processus d'affectation", plural: "Processus d'affectation", status: { draft: "Brouillon", ready_for_meeting: "Prêt pour la séance", meeting_open: "Séance ouverte", assigning: "Affectation en cours", department_proposal: "Proposition du département", sent_to_school_leadership: "Envoyé à la direction", returned_by_school_leadership: "Renvoyé par la direction", internal_revision: "Révision interne", final: "Final", reopened: "Rouverte", archived: "Archivé" } },
    subject: { singular: "Matière", plural: "Matières", status: {} },
    classroom: { singular: "Classe", plural: "Classes", status: {} },
    hourRequirement: { singular: "Besoin horaire", plural: "Besoins horaires", status: {} },
    processParticipant: { singular: "Participant au processus", plural: "Participants au processus", status: { active: "Actif", inactive: "Inactif" } },
    assignment: { singular: "Affectation", plural: "Affectations", status: { draft: "Brouillon", confirmed: "Confirmé", overridden: "Forcé", cancelled: "Annulé" } },
    meetingSession: { singular: "Séance", plural: "Séances", status: { prepared: "Préparé", open: "Ouvert", selecting: "Sélection en cours", paused: "En pause", closed: "Clos", reopened: "Rouverte" } },
    selectionTurn: { singular: "Tour de sélection", plural: "Tours de sélection", status: { pending: "En attente", active: "Actif", completed: "Terminé", skipped: "Passé", overridden: "Forcé" } },
    auditEvent: { singular: "Événement d'audit", plural: "Événements d'audit", status: {} },
    version: { singular: "Version", plural: "Versions", status: {} },
    exportArtifact: { singular: "Export", plural: "Exports", status: {} }
  },
  field: {
    name: "Nom",
    label: "Libellé",
    slug: "Slug",
    stage: "Niveau",
    grade: "Niveau",
    groupCode: "Code de groupe",
    locality: "Commune",
    province: "Province",
    region: "Région",
    address: "Adresse",
    notes: "Notes",
    displayName: "Nom affiché",
    linkedUser: "Compte lié",
    active: "Actif",
    startDate: "Date de début",
    endDate: "Date de fin",
    status: "État",
    previousAcademicYear: "Année scolaire précédente",
    school: "Établissement",
    academicYear: "Année scolaire",
    department: "Département",
    departmentHead: "Chef de département",
    requiredHours: "Heures requises",
    availableHours: "Heures disponibles",
    assignedHours: "Heures affectées",
    defaultTeacherHoursReference: "Heures de référence",
    selectionOrderEnabled: "Ordre de sélection activé",
    selectionOrderMode: "Mode d'ordre",
    directTeacherSelectionEnabled: "Sélection directe par l'enseignant",
    lanAccessEnabled: "Accès LAN",
    subject: "Matière",
    classroom: "Classe",
    teacher: "Enseignant",
    hourRequirement: "Besoin horaire",
    processParticipant: "Participant",
    requirementType: "Type",
    assignmentType: "Type",
    source: "Source",
    flags: "Indicateurs",
    participatesInSelection: "Participe à la sélection",
    selectionPosition: "Position",
    selectionPoints: "Points de sélection",
    selectionCriteria: "Critère de sélection",
    selectionNotes: "Notes de sélection",
    orderLocked: "Ordre verrouillé",
    overrideReason: "Motif de dérogation"
  },
  option: {
    requirementType: { ordinary: "Ordinaire", optional: "Optionnel", reinforcement: "Renforcement", split_group: "Groupe dédoublé", bilingual: "Bilingue", other: "Autre" },
    assignmentType: { main: "Principale", shared: "Partagée", reinforcement: "Renforcement", split_group: "Groupe dédoublé", other: "Autre" },
    boolean: { yes: "Oui", no: "Non" }
  },
  view: {
    teacherTitle: "Vue enseignant",
    loading: "Chargement de {entity}",
    pageLoading: {
      title: "Chargement de la page de répartition",
      description: "Préparation du contenu le plus récent de la page."
    },
    unavailable: "{entity} indisponible",
    currentTurn: { status: "État", turn: "Tour", teacher: "Enseignant", started: "Début", waiting: "En attente", noPosition: "Aucune position", noActiveTurn: "Aucun tour actif", notStarted: "Non démarré", position: "Tour {position}", teacherValue: "Enseignant {teacher}" },
    versions: { title: "Versions", item: "Version {number}", comparison: "Comparaison", noChanges: "Aucune modification", requiredDelta: "Écart des heures requises", assignedDelta: "Écart des heures affectées", teacherDelta: "Enseignants", create: "Créer une version", compare: "Comparer les versions" },
    exports: { title: "Centre d'export", finalBlocked: "Finalisation bloquée", finalReady: "Finalisation prête", closeout: "Clôture", finalExport: "Export final", leadershipWorkflow: "Circuit de direction", markReturned: "Marquer comme renvoyé", startRevision: "Démarrer la révision", reopenFinal: "Rouvrir la version finale", type: { internal_draft: "Brouillon interne", school_leadership: "Direction de l'établissement", final: "Final", teacher_summary: "Récapitulatif enseignant", backup: "Sauvegarde" } },
    choice: { title: "Choisir un groupe", confirmation: "Confirmation", choose: "Choisir", pass: "Passer", ready: "Prêt à choisir.", impact: "{hours} heures vous seront affectées.", meetingClosed: "La séance n'est pas ouverte.", directDisabled: "La sélection directe est désactivée.", otherTurn: "C'est le tour d'un autre enseignant.", covered: "Le besoin est déjà couvert.", alreadyCovered: "Ce besoin était déjà couvert.", turnChanged: "Le tour actif a changé. Actualisez l'état de la séance." }
  },
  validation: {
    title: { requirement: "Alerte sur le besoin horaire", teacher: "Alerte enseignant", process: "Alerte processus" },
    requirement: { overAssigned: "Le besoin {subject} pour {group} est suraffecté ({assigned} h affectées pour {required} h requises).", overAssignedOverridden: "Le besoin {subject} pour {group} est suraffecté, mais une dérogation a été enregistrée.", uncovered: "Le besoin {subject} pour {group} n'a encore aucune affectation.", partial: "Le besoin {subject} pour {group} est partiellement couvert ({pending} h restantes).", covered: "Le besoin {subject} pour {group} est entièrement couvert." },
    teacher: { overloaded: "{teacher} est en surcharge ({assigned} h affectées pour {available} h disponibles).", overloadedOverridden: "{teacher} est en surcharge, mais une dérogation a été enregistrée.", balanced: "La charge de {teacher} est équilibrée." },
    process: { balanced: "Les heures du processus sont équilibrées.", pending: "{count} besoin(s) nécessitent encore des heures.", overage: "Le processus contient des suraffectations non résolues." }
  },
  audit: {
    pageTitle: "Audit de la répartition", description: "Consultez les événements d'audit du processus actif.",
    action: { created: "Créé", updated: "Modifié", deleted: "Supprimé", transitioned: "État modifié", reopened: "Rouvert", copied_from_previous_year: "Copié depuis l'année précédente", direct_choice: "Choix direct enregistré", started: "Démarré", completed: "Terminé", skipped: "Passé", overridden: "Forcé" },
    entity: { process: "Processus d'affectation", assignment_process: "Processus d'affectation", assignment: "Affectation", subject: "Matière", hour_requirement: "Besoin horaire", selection_turn: "Tour de sélection", teaching_group: "Classe", process_teacher: "Participant au processus" },
    role: { superadmin: "Super-administrateur", department_head: "Chef de département", teacher: "Enseignant", school_leadership: "Direction de l'établissement" }, event: "{entity} : {action}"
  },
  action: {
    create: "Ajouter",
    edit: "Modifier",
    delete: "Supprimer",
    archive: "Archiver",
    unarchive: "Désarchiver",
    close: "Clore",
    reopen: "Rouvrir",
    transition: "Changer d'état",
    save: "Enregistrer",
    cancel: "Annuler",
    confirm: "Confirmer",
    search: "Rechercher",
    filter: "Filtrer",
    refresh: "Actualiser",
    linkUser: "Lier un compte",
    unlinkUser: "Délier le compte",
    export: "Exporter",
    restore: "Restaurer le brouillon",
    copyFrom: "Copier depuis l'année précédente",
    startTurn: "Démarrer le tour",
    completeTurn: "Terminer le tour",
    skipTurn: "Passer le tour",
    overrideTurn: "Forcer le tour",
    initializeTurns: "Initialiser les tours"
  },
  confirm: {
    delete: { title: "Supprimer {entity} ?", body: "Cette action supprimera définitivement **{name}**. Elle est irréversible.", proceed: "Supprimer définitivement" },
    archive: { title: "Archiver {entity} ?", body: "**{name}** ne figurera plus dans les listes actives. Les données existantes sont conservées et restent consultables depuis la vue archive.", proceed: "Archiver" },
    cancel: "Annuler"
  },
  nav: {
    group: { setup: "Configuration", process: "Processus" },
    item: {
      schools: "Établissements",
      academicYears: "Années scolaires",
      departments: "Départements",
      teacherRoster: "Liste du personnel enseignant",
      dashboard: "Tableau de bord",
      processes: "Processus",
      classrooms: "Classes",
      classroomStages: "Niveaux scolaires",
      subjects: "Matières",
      requirements: "Besoins horaires",
      processParticipants: "Participants au processus",
      assignments: "Affectations",
      meeting: "Séance",
      myView: "Mon espace",
      shared: "Écran partagé",
      versions: "Versions",
      exports: "Exports",
      audit: "Audit"
    }
  },
  flow: {
    bootstrap: {
      title: "Configurer votre répartition",
      subtitle: "Quelques étapes avant de pouvoir tenir la séance.",
      step: { school: "Créer un établissement", academicYear: "Créer une année scolaire", department: "Créer un département", process: "Créer un processus", subjects: "Ajouter des matières", classrooms: "Ajouter des classes", teacherRoster: "Ajouter des enseignants", requirements: "Ajouter des besoins horaires", participants: "Ajouter des participants" },
      done: "Terminé",
      open: "Ouvrir"
    }
  },
  dashboard: {
    balanceState: { balanced: "Équilibré", pending: "En attente", exceeded: "Dépassé", warning: "Avertissement" },
    title: "Tableau de bord du reparto",
    subtitleAdmin: "Suivez l'equilibre, la couverture et l'etat de la seance avant le direct.",
    subtitleReadonly: "Projetez une vue calme en lecture seule pour la seance en direct.",
    pickerLabel: "Processus courant",
    pickerHint: "Changez de processus quand la route n'est pas verrouillee sur un id precis.",
    mode: { admin: "Mode admin", readonly: "Mode lecture seule" },
    section: {
      overview: "Vue d'ensemble",
      teacherLoad: "Charge des enseignants",
      classroomCoverage: "Couverture des classes",
      validations: "Validations",
      checklist: "Checklist de configuration",
      meetingReadiness: "Preparation de la seance"
    },
    metric: {
      required: "Requises",
      assigned: "Affectees",
      available: "Disponibles",
      pending: "En attente",
      blocking: "Bloquantes",
      participants: "Participants",
      requirements: "Besoins"
    },
    state: {
      noDashboard: "Les donnees du tableau de bord apparaitront quand le processus sera pret.",
      noTeachers: "Ajoutez des participants au processus pour voir la charge des enseignants.",
      noRequirements: "Ajoutez des besoins horaires pour voir la couverture des classes.",
      noValidations: "Aucune validation bloquante.",
      lockedToRoute: "Cette route est fixee au processus de l'URL courante."
    },
    summary: {
      balance: "{assigned} heures affectees sur {required}. {pending} heures restent a couvrir.",
      teacherLoad: "{count} participant(s) suivis ; {overloaded} en surcharge.",
      classroomCoverage: "{count} besoin(s), {uncovered} non couverts.",
      validations: "{blocking} validation(s) bloquante(s) et {total} message(s) au total.",
      checklist: "{done} etape(s) terminee(s) sur {total}."
    }
  },
  error: {
    required: "Ce champ est obligatoire.",
    requiredNamed: "{field} est obligatoire.",
    duplicate: "Une entrée portant ce nom existe déjà.",
    duplicateScoped: "Une entrée portant ce nom existe déjà dans {scope}.",
    fkMissing: "Le {field} sélectionné n'existe plus. Veuillez en choisir un autre.",
    fkViolation: "Suppression impossible : {count} élément(s) dépendent encore de cette entrée.",
    hoursInvalid: "Les heures doivent être un nombre positif.",
    hoursExceed: "Le total des heures affectées ({assigned}) dépasse les heures requises ({required}). Indiquez un motif de dérogation.",
    processState: "Le processus est en {status} ; cette action n'est pas autorisée dans cet état.",
    permission: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
    unauthorized: "Votre session a expiré. Veuillez vous reconnecter.",
    network: "Le serveur est injoignable. Veuillez réessayer.",
    server: "Une erreur est survenue de notre côté. Veuillez réessayer.",
    invalidDate: "La date de début doit être antérieure ou égale à la date de fin.",
    conflict: "Cette action entre en conflit avec l'état actuel."
  },
  disabled: {
    noProcess: "Sélectionnez ou créez d'abord un processus.",
    processClosed: "Le processus est en {status} ; cette action est désactivée.",
    missingPrereq: "Créez d'abord le {prereq}.",
    invalidHours: "Les heures ne sont pas valides.",
    noData: "Pas encore de données disponibles.",
    noPermission: "Vous n'avez pas les droits nécessaires."
  },
  table: { noResults: "Aucun résultat.", searchPlaceholder: "Rechercher...", loading: "Chargement...", actions: "Actions", columns: "Colonnes", all: "Toutes", firstPage: "Première page", previousPage: "Page précédente", nextPage: "Page suivante", lastPage: "Dernière page", page: "Page", rowsPerPage: "Lignes par page", searchClassrooms: "Rechercher par niveau, code du groupe ou libellé...", searchSubjects: "Rechercher par nom ou niveau...", searchRequirements: "Rechercher par classe ou matière...", searchParticipants: "Rechercher un enseignant...", searchAssignments: "Rechercher par besoin ou participant...", searchSchools: "Rechercher par nom, localité ou province...", searchAcademicYears: "Rechercher par libellé ou établissement...", searchDepartments: "Rechercher par nom ou établissement...", searchTeacherRoster: "Rechercher un enseignant..." },
  classroomBulk: {
    action: "Créer des groupes",
    title: "Créer plusieurs classes",
    description: "Créer une plage inclusive de classes.",
    groupStart: "Premier groupe",
    groupEnd: "Dernier groupe",
    created: "Classes créées : {count}",
    createError: "Impossible de créer les classes"
  },
  classroomSelection: {
    selectAllVisible: "Sélectionner toutes les classes visibles",
    selectRow: "Sélectionner {name}",
    deleteSelected: "Supprimer la sélection ({count})",
    deleteTitle: "Supprimer les classes sélectionnées",
    deleteBody: "Classes sélectionnées à supprimer : {count}. Cette action est irréversible.",
    deleted: "Classes supprimées : {count}",
    deleteError: "Impossible de supprimer les classes sélectionnées"
  },
  subjectSelection: {
    selectAllVisible: "Sélectionner toutes les matières visibles",
    selectRow: "Sélectionner {name}",
    deleteSelected: "Supprimer la sélection ({count})",
    deleteTitle: "Supprimer les matières sélectionnées",
    deleteBody: "Matières sélectionnées à supprimer : {count}. Cette action est irréversible.",
    deleted: "Matières supprimées : {count}",
    deleteError: "Impossible de supprimer les matières sélectionnées"
  },
  requirementSelection: {
    selectAllVisible: "Sélectionner tous les besoins visibles",
    selectRow: "Sélectionner {name}",
    deleteSelected: "Supprimer la sélection ({count})",
    deleteTitle: "Supprimer les besoins sélectionnés",
    deleteBody: "Besoins sélectionnés à supprimer : {count}. Cette action est irréversible.",
    deleted: "Besoins supprimés : {count}",
    deleteError: "Impossible de supprimer les besoins sélectionnés"
  },
  participantSelection: {
    selectAllVisible: "Sélectionner tous les participants visibles",
    selectRow: "Sélectionner {name}",
    deleteSelected: "Supprimer la sélection ({count})",
    deleteTitle: "Supprimer les participants sélectionnés",
    deleteBody: "Participants sélectionnés à supprimer : {count}. Cette action est irréversible.",
    deleted: "Participants supprimés : {count}",
    deleteError: "Impossible de supprimer les participants sélectionnés"
  },
  assignmentSelection: {
    selectAllVisible: "Sélectionner toutes les affectations visibles",
    selectRow: "Sélectionner {name}",
    deleteSelected: "Supprimer la sélection ({count})",
    deleteTitle: "Supprimer les affectations sélectionnées",
    deleteBody: "Affectations sélectionnées à supprimer : {count}. Cette action est irréversible.",
    deleted: "Affectations supprimées : {count}",
    deleteError: "Impossible de supprimer les affectations sélectionnées"
  },
  classroomStages: {
    pageTitle: "Niveaux scolaires",
    pageDescription: "Gérer les niveaux scolaires de référence communs.",
    formDescription: "Données de référence communes des classes.",
    createTitle: "Créer un niveau scolaire",
    editTitle: "Modifier le niveau scolaire",
    deleteTitle: "Supprimer le niveau scolaire",
    deleteBody: "Supprimer {name} ?",
    field: { stage: "Niveau", shortLabel: "Libellé court", minGrade: "Année minimale", maxGrade: "Année maximale" },
    column: { created: "Créé le", updated: "Modifié le" },
    state: { unauthorized: "Un accès administrateur est requis.", empty: "Aucun niveau scolaire trouvé.", loading: "Chargement des niveaux scolaires...", unavailable: "Les niveaux scolaires sont indisponibles." },
    search: "Rechercher un niveau scolaire",
    toast: { created: "Niveau scolaire créé", updated: "Niveau scolaire modifié", saveError: "Impossible d'enregistrer le niveau scolaire", deleted: "Niveau scolaire supprimé", deleteError: "Impossible de supprimer le niveau scolaire" }
  },
  picker: { noProcesses: "Aucun processus pour le moment.", selectProcess: "Sélectionner un processus", createNew: "Créer un nouveau", createMissingPrerequisite: "Créer le prérequis manquant" }
};
