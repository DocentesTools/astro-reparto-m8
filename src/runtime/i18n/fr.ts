import type { RepartoDictionary } from "./types.js";

export const fr: RepartoDictionary = {
  locale: "fr",  entity: {
    school: { singular: "Établissement", plural: "Établissements", status: {} },
    academicYear: { singular: "Année scolaire", plural: "Années scolaires", status: { active: "Actif", archived: "Archivé" } },
    department: { singular: "Département", plural: "Départements", status: {} },
    teacherRoster: { singular: "Enseignant", plural: "Enseignants", status: {} },
    assignmentProcess: { singular: "Processus d'affectation", plural: "Processus d'affectation", status: { draft: "Brouillon", ready_for_meeting: "Prêt pour la séance", meeting_open: "Séance ouverte", assigning: "Affectation en cours", department_proposal: "Proposition du département", sent_to_school_leadership: "Envoyé à la direction", returned_by_school_leadership: "Renvoyé par la direction", internal_revision: "Révision interne", final: "Final", reopened: "Rouverte", archived: "Archivé" } },
    subject: { singular: "Matière", plural: "Matières", status: {} },
    teachingGroup: { singular: "Classe", plural: "Classes", status: {} },
    hourRequirement: { singular: "Créneau de besoin", plural: "Créneaux de besoin", status: { available: "Disponible", assigned: "Affecté", stale: "Obsolète", reconciliation_required: "Réconciliation requise" } },
    processParticipant: { singular: "Participant au processus", plural: "Participants au processus", status: { active: "Actif", inactive: "Inactif" } },
    assignment: { singular: "Affectation", plural: "Affectations", status: { active: "Active", cancelled: "Annulée" } },
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
    claimCode: "Code de rattachement",
    active: "Actif",
    startDate: "Date de début",
    endDate: "Date de fin",
    status: "État",
    previousAcademicYear: "Année scolaire précédente",
    school: "Établissement",
    academicYear: "Année scolaire",
    department: "Département",
    departmentHead: "Chef de département",
    baseWeeklyHours: "Heures de base",
    extraWeeklyHours: "Heures supplémentaires autorisées",
    targetWeeklyHours: "Heures cibles",
    overloaded: "Surcharge autorisée",
    defaultTeacherHoursReference: "Heures de référence",
    selectionOrderEnabled: "Ordre de sélection activé",
    selectionOrderMode: "Mode d'ordre",
    directTeacherSelectionEnabled: "Sélection directe par l'enseignant",
    lanAccessEnabled: "Accès LAN",
    subject: "Matière",
    teachingGroup: "Classe",
    teacher: "Enseignant",
    hourRequirement: "Créneau de besoin",
    processParticipant: "Participant",
    source: "Source",
    reason: "Motif",
    participatesInSelection: "Participe à la sélection",
    selectionPosition: "Position",
    selectionPoints: "Points de sélection",
    selectionCriteria: "Critère de sélection",
    selectionNotes: "Notes de sélection",
    orderLocked: "Ordre verrouillé",
    allocationCategory: "Catégorie d'attribution",
    activityType: "Type d'activité",
    groupWeeklyHours: "Heures groupe",
    teacherWeeklyHoursPerPosition: "Heures enseignant par poste",
    requiredTeacherCount: "Postes enseignants"
  },
  option: {
    allocationCategory: { main: "Principale", secondary: "Secondaire" },
    activityType: { ordinary: "Ordinaire", tutoring: "Tutorat", co_teaching: "Co-enseignement", support: "Soutien", department_level: "Niveau département", other: "Autre" },
    boolean: { yes: "Oui", no: "Non" }
  },
  view: {
    teacherTitle: "Vue enseignant",
    claim: {
      title: "Rattachez votre profil enseignant",
      intro: "Aucune participation à ce reparto n'est liée à votre compte : il n'y a donc rien à afficher ici. Si le chef de département a préparé un profil enseignant pour vous, demandez-lui un code de rattachement et saisissez-le ci-dessous — il lie ce profil au compte avec lequel vous êtes connecté. Si votre profil est déjà lié, demandez-lui plutôt de vous ajouter à ce reparto.",
      codeLabel: "Code de rattachement",
      codePlaceholder: "XXXXX-XXXXX-XXXXX-XXXXX",
      hint: "La casse et les tirets n'ont pas d'importance.",
      linked: "{name} est désormais lié à votre compte."
    },
    lan: {
      title: "Vos heures",
      metric: {
        base: "Base",
        extra: "Supplémentaires autorisées",
        target: "Cible",
        assigned: "Attribuées",
        remaining: "Restantes"
      },
      overloaded: "{hours} heures supplémentaires vous ont été autorisées.",
      notOverloaded: "Aucune heure supplémentaire ne vous est autorisée.",
      connection: {
        disconnected: "Mises à jour en direct déconnectées",
        live: "Mises à jour en direct connectées",
        stale: "Mises à jour en direct retardées"
      },
      state: {
        pending: "Vous n'avez pas encore atteint votre cible.",
        balanced: "Vos heures attribuées correspondent à votre cible.",
        overloaded_authorized: "Votre cible comprend des heures supplémentaires autorisées.",
        inactive: "Vous n'êtes pas actif dans ce processus.",
        not_participating: "Vous ne faites pas partie de l'ordre de sélection."
      },
      availableSlots: "{count} poste(s) complet(s) restent libres dans ce processus.",
      planBalance: "Heures de groupe {group} face à une dotation de {allocation} ; charge enseignante {teacher} face à une cible de participants de {target}.",
      noAllocation: "aucune dotation pour l'instant",
      noPlanBalance: "Ce processus n'a pas encore de plan pédagogique, il n'y a donc aucun équilibre à afficher."
    },
    loading: "Chargement de {entity}",
    pageLoading: {
      title: "Chargement de la page de répartition",
      description: "Préparation du contenu le plus récent de la page."
    },
    unavailable: "{entity} indisponible",
    access: {
      checking: "Vérification de vos droits d'accès…",
      forbidden: "Vous n'avez pas accès à cette page.",
      forbiddenDetail: "Cette page requiert le rôle {role} ou supérieur.",
      role: {
        user: "utilisateur",
        reader: "lecteur",
        writer: "rédacteur",
        admin: "administrateur",
        superadmin: "super administrateur"
      }
    },
    currentTurn: { status: "État", turn: "Tour", teacher: "Enseignant", started: "Début", waiting: "En attente", noPosition: "Aucune position", noActiveTurn: "Aucun tour actif", notStarted: "Non démarré", position: "Tour {position}", teacherValue: "Enseignant {teacher}" },
    versions: {
      title: "Versions",
      item: "Version {number}",
      itemDetail: "{status} · {created}",
      noReason: "Aucun motif enregistré",
      empty: "Aucune version n'a encore été capturée.",
      create: "Créer une version",
      createReason: "Motif de cette capture (facultatif)",
      createPending: "Capture de la version en cours…",
      createError: "La version n'a pas pu être capturée.",
      compare: "Comparer les versions",
      left: "Version de référence",
      right: "Version comparée",
      comparison: "Comparaison",
      comparisonPending: "Comparaison des deux versions en cours…",
      comparisonError: "La comparaison n'a pas pu être chargée.",
      noComparison: "Aucune comparaison n'a encore été lancée.",
      previousYear: "Comparer avec l'année précédente",
      noPreviousYear: "Ce processus n'a pas été copié depuis une année précédente : il n'y a rien à comparer.",
      source: { versions: "Deux versions capturées", previous_year: "Année scolaire précédente" },
      blocked: {
        not_enough_versions: "Capturez une deuxième version avant de comparer.",
        same_version: "Choisissez deux versions différentes."
      },
      noChanges: "Aucune modification",
      changedSummary: "{changed} dimensions de comparaison modifiées sur {total}.",
      otherChanges: "Aucune dimension de comparaison n'a changé, mais {count} sections de l'instantané diffèrent encore.",
      state: { changed: "Modifié", unchanged: "Inchangé" },
      notComparable: "Non comparable",
      notComparableDetail: "L'une des deux versions n'a aucune dotation de direction : aucun écart ne peut être énoncé.",
      sectionsTitle: "Sections modifiées de l'instantané",
      dimension: {
        allocation: "Dotation de direction",
        group_hours: "Heures d'enseignement par classe",
        teacher_load: "Charge des enseignants",
        subject_category: "Catégorie de matière",
        activity: "Activités d'enseignement",
        group_link: "Liens de classes des activités",
        teacher_position_count: "Postes d'enseignant",
        participant_target: "Cibles des participants",
        requirement_generation: "Génération des besoins"
      },
      delta: {
        allocation_delta: "Écart de dotation",
        group_load_delta: "Écart d'heures par classe",
        teacher_load_delta: "Écart d'heures enseignant",
        participant_target_total_delta: "Écart d'heures cibles",
        generation_number_delta: "Écart de génération",
        teacher_count_delta: "Écart de participants",
        activity_count_delta: "Écart d'activités",
        requirement_count_delta: "Écart de créneaux"
      },
      section: {
        allocationRevisions: "Révisions de dotation",
        teachingPlan: "Plan d'enseignement",
        subjects: "Matières",
        groupSubjects: "Matières par classe",
        teachingActivities: "Activités d'enseignement",
        requirements: "Créneaux de besoin",
        processParticipants: "Participants au processus"
      }
    },
    exports: {
      title: "Centre d'export",
      closeout: "Clôture",
      leadershipWorkflow: "Circuit de direction",
      markReturned: "Marquer comme renvoyé",
      startRevision: "Démarrer la révision",
      reopenFinal: "Rouvrir la version finale",
      type: {
        internal_draft: "Brouillon interne",
        school_leadership: "Direction de l'établissement",
        final: "Final",
        teacher_summary: "Récapitulatif enseignant",
        backup: "Sauvegarde"
      },
      documents: {
        title: "Documents du processus",
        description: "Copies enregistrées de l'état actuel du processus.",
        action: "Exporter : {document}",
        empty: "Aucun document n'a encore été exporté.",
        item: "{document} · {format}",
        success: "Document exporté : {document}.",
        error: "L'export a échoué."
      },
      planning: {
        title: "Exports de planification",
        description:
          "Le plan d'enseignement sous forme de document. Une copie brouillon ou provisoire n'est jamais refusée parce que le plan n'est pas exact.",
        mode: {
          draft: "Brouillon de plan",
          provisional: "Plan provisoire",
          final: "Plan final"
        },
        modeDescription: {
          draft: "Copie de travail pour le département.",
          provisional: "Copie partageable qui indique qu'elle n'est pas validée.",
          final: "Copie stricte, refusée tant qu'un constat bloquant subsiste."
        },
        action: "Exporter",
        neverBlocked: "Disponible quel que soit l'état des équilibres.",
        blocked: {
          plan_missing: "La planification n'a pas commencé pour ce processus.",
          blocking_validations:
            "Résolvez chaque constat bloquant avant d'exporter le plan final."
        },
        feasibilityLabel: "Faisabilité de la répartition : {status}",
        feasibility: {
          not_evaluated: "NON ÉVALUÉE",
          feasible: "FAISABLE",
          infeasible: "INFAISABLE",
          unknown: "INCONNUE"
        },
        feasibilityMissing: "Faisabilité de la répartition : aucun plan",
        notValidated: "Un document provisoire n'est pas un plan validé.",
        resultTitle: "Document de planification",
        resultSummary: "Document {mode} généré le {generated}.",
        activities: "{count} activités",
        exact: "Les deux équilibres sont exacts.",
        inexact:
          "Le plan n'est pas exact. Le document porte les deux équilibres et tous les constats.",
        findings: "{blocking} bloquants · {warning} avertissements",
        error: "L'export de planification a échoué."
      },
      importPlanning: {
        title: "Import du plan",
        description: "Importez des activités dans le plan courant. Un résultat non exact est accepté et affiché avec les suites requises.",
        content: "JSON d'import",
        placeholder: '{"activities": []}',
        action: "Importer le plan",
        neverBlocked: "L'import n'est pas bloqué par un résultat déséquilibré.",
        error: { empty: "Collez un corps d'import de plan.", invalid_json: "Le contenu n'est pas un JSON valide.", invalid_contract: "Le JSON ne respecte pas le contrat d'import du plan." },
        resultTitle: "État du plan importé",
        resultSummary: "{count} activités importées.",
        reconciliationTitle: "Réconciliation requise",
        findings: "{blocking} bloquants · {warning} avertissements",
        success: "Plan importé.",
        requestError: "L'import du plan a échoué."
      },
      restore: {
        confirmTitle: "Restaurer cette sauvegarde dans le brouillon ?",
        confirmBody: "La cible doit être un brouillon vide. Le service valide la génération et la réconciliation avant toute écriture.",
        restoreAssignments: "Restaurer les postes générés et les affectations",
        confirmAction: "Restaurer la sauvegarde",
        blocked: { no_backup: "Créez une sauvegarde JSON avant la restauration.", process_not_draft: "Seul un processus brouillon peut recevoir une sauvegarde." },
        success: "Sauvegarde restaurée.",
        error: "La sauvegarde n'a pas pu être restaurée."
      },
      final: {
        title: "Export final de la répartition",
        description:
          "Exige une répartition complète et une faisabilité confirmée ; il archive le processus.",
        action: "Exporter la version finale",
        ready: "Prêt à être exporté.",
        blocked: {
          plan_missing: "La planification n'a pas commencé pour ce processus.",
          requirements_not_generated:
            "Aucun créneau de besoin n'a encore été généré.",
          findings_unavailable:
            "Les constats de répartition n'ont pas pu être lus.",
          assignment_blocking:
            "La répartition est incomplète : {count} constat(s) bloquant(s) subsistent.",
          feasibility_not_confirmed:
            "La faisabilité de la répartition n'est pas confirmée sur l'état actuel."
        },
        confirmTitle: "Exporter et archiver ?",
        confirmBody:
          "L'export final archive le processus. Seule une réouverture permet de revenir en arrière.",
        confirmAction: "Exporter et archiver",
        success: "Export final créé.",
        error: "L'export final a échoué."
      }
    },
    choice: {
      title: "Choisir un poste",
      confirmation: "Confirmation",
      choose: "Prendre ce poste",
      pass: "Passer",
      ready: "Prêt à prendre le poste sélectionné.",
      noSlots: "Aucun poste actif n'est disponible.",
      position: "Poste {position}",
      hours: "{hours} heures enseignant",
      impact: "Prendre ce poste vous affecte {hours} heures enseignant en entier.",
      remainingTarget: "Il reste {hours} heures avant votre cible.",
      select: "Choisir",
      selected: "Choisi",
      passReasonLabel: "Motif",
      passReasonPlaceholder: "Pourquoi vous passez votre tour",
      passReasonDefault: "Tour passé par l'enseignant.",
      passReasonHint: "Passer un tour est audité. Laissez ce champ vide pour enregistrer le motif par défaut.",
      pending: "En cours…",
      disabled: {
        meeting_not_open: "La réunion n'est pas ouverte.",
        direct_selection_disabled: "La sélection directe est désactivée.",
        plan_not_ready: "Le plan n'est pas encore prêt pour la sélection.",
        reconciliation_required: "Un changement d'attribution doit être réconcilié avant de poursuivre la sélection.",
        selection_blocked: "Le service bloque les sélections pour le moment.",
        not_your_turn: "C'est le tour d'un autre enseignant.",
        no_slot_chosen: "Choisissez d'abord un poste.",
        slot_occupied: "Ce poste est déjà pris.",
        slot_not_available: "Ce poste n'est pas disponible pour la sélection.",
        duplicate_activity_position: "Vous occupez déjà un poste de cette activité.",
        exceeds_remaining_target: "Le poste entier dépasse vos heures cibles restantes."
      },
      conflict: {
        state_changed: "La répartition a changé. Actualisez l'état de la réunion et choisissez à nouveau.",
        refused: "Le service a refusé ce choix.",
        not_found: "Ce poste n'existe plus.",
        not_allowed: "Vous n'êtes pas autorisé à faire ce choix.",
        signed_out: "Votre session a expiré. Veuillez vous reconnecter.",
        network: "Le serveur est injoignable. Veuillez réessayer.",
        server: "Une erreur est survenue de notre côté. Veuillez réessayer."
      }
    }
  },
  audit: {
    pageTitle: "Audit de la répartition", description: "Consultez les événements d'audit du processus actif.",
    action: { created: "Créé", updated: "Modifié", deleted: "Supprimé", transitioned: "État modifié", reopened: "Rouvert", copied_from_previous_year: "Copié depuis l'année précédente", direct_choice: "Choix direct enregistré", started: "Démarré", completed: "Terminé", skipped: "Passé", overridden: "Forcé", undone: "Annulée", reassigned: "Réaffectée", reentered: "Remise en file", recomputed: "Recalculé" },
    entity: { process: "Processus d'affectation", assignment_process: "Processus d'affectation", assignment: "Affectation", subject: "Matière", hour_requirement: "Créneau de besoin", selection_turn: "Tour de sélection", teaching_group: "Classe", process_teacher: "Participant au processus" },
    role: { superadmin: "Super-administrateur", department_head: "Chef de département", teacher: "Enseignant", school_leadership: "Direction de l'établissement" }, event: "{entity} : {action}"
  },
  requirements: {
    pageTitle: "Créneaux de besoin générés",
    description: "Consultez les postes enseignants indivisibles générés depuis le plan d'enseignement. La génération et la réconciliation restent pilotées par le service.",
    statusTitle: "État de la génération et de la réconciliation",
    planUnavailable: "Plan indisponible",
    planStatusSummary: "État du plan : {status}. Génération actuelle : {generation}.",
    planStatus: {
      draft: "Brouillon",
      unbalanced: "Déséquilibré",
      balanced: "Équilibré",
      locked: "Verrouillé",
      requirements_generated: "Besoins générés",
      stale: "Obsolète",
      reconciliation_required: "Réconciliation requise"
    },
    generationState: {
      unavailable: "L'état du plan d'enseignement est indisponible ; les créneaux générés restent en lecture seule.",
      notGenerated: "Le plan n'a pas encore atteint l'étape de génération des besoins.",
      ready: "Le plan est verrouillé et prêt pour la génération des besoins.",
      current: "Les créneaux générés sont à jour pour la génération du service indiquée ci-dessous.",
      stale: "Le plan a changé après la génération. Les créneaux existants restent visibles pendant la préparation de la réconciliation.",
      reconciliationRequired: "Des créneaux affectés exigent une réconciliation explicite avant que la génération redevienne à jour."
    },
    metric: { activities: "Activités", slots: "Créneaux générés", available: "Disponibles", assigned: "Affectés", attention: "À traiter" },
    slotsTitle: "Créneaux par activité et position",
    slotsDescription: "Chaque position est complète et indivisible ; les heures ne sont jamais modifiées depuis cette vue.",
    empty: "Aucun créneau de besoin n'a encore été généré pour ce plan.",
    unknownActivity: "Activité d'enseignement inconnue",
    unknownSubject: "Matière inconnue",
    activityLabel: "{subject} · {type}",
    positionCount: "{count} position(s) enseignante(s)",
    position: "Position {position}",
    teacherHours: "{hours} heures enseignantes",
    generationLineage: "Créé à la génération {created} ; validé à la génération {validated}.",
    retiredLineage: "Retiré à la génération {generation}.",
    superseded: "Un créneau de remplacement a été enregistré."
  },
  assignments: {
    pageTitle: "Tableau des affectations",
    description: "Attribuez chaque poste enseignant complet à un participant éligible. Les heures d'un créneau proviennent de la génération et ne se modifient pas ici.",
    metric: { slots: "Créneaux actifs", assigned: "Affectés", available: "Disponibles" },
    hoursColumn: "Heures du créneau",
    teacherHours: "{hours} heures enseignant",
    unknownSlotHours: "Heures du créneau indisponibles",
    source: {
      department_head: "Chef de département",
      teacher_direct: "Choix direct de l'enseignant",
      imported_from_previous_year: "Importée de l'année précédente",
      system_copy: "Copie système"
    },
    empty: "Aucun créneau n'est encore affecté.",
    historyRow: "Annulée ; conservée pour l'audit.",
    assignAction: "Affecter le créneau",
    assignTitle: "Affecter un créneau de besoin",
    assignDescription: "Choisissez un créneau libre et un participant éligible. Le créneau est toujours pris en entier.",
    selectSlotFirst: "Choisissez un créneau pour voir les participants éligibles.",
    noAssignableSlots: "Tous les créneaux actifs sont déjà affectés.",
    noEligibleTeachers: "Aucun participant n'est éligible pour ce créneau.",
    safeChoice: {
      loading: "Vérification du plan déterministe des choix sûrs en cours.",
      current: "Les choix sont filtrés selon le témoin déterministe actuel.",
      unavailable: "Le filtrage des choix sûrs est indisponible ; relancez l'évaluation administrative de faisabilité.",
      not_required: "Le plan n'a pas de témoin faisable actuel ; les règles ordinaires du service s'appliquent."
    },
    teacherDisabled: {
      participant_inactive: "Participant non actif.",
      duplicate_activity_position: "Occupe déjà un poste de cette activité.",
      exceeds_remaining_target: "Le créneau entier dépasse les heures cibles restantes.",
      strands_remaining_participants: "Ce choix laisserait le reparto restant sans témoin valide.",
      witness_unavailable: "Le statut de choix sûr est indisponible jusqu'à une nouvelle évaluation de faisabilité."
    },
    notesAction: "Notes",
    notesTitle: "Modifier les notes de l'affectation",
    undoAction: "Annuler",
    undoTitle: "Annuler cette affectation ?",
    undoBody: "{slot} redevient disponible et {teacher} revient dans la file de sélection. Le motif est enregistré dans la piste d'audit.",
    undoConfirm: "Annuler l'affectation",
    undone: "L'affectation a été annulée et le créneau libéré.",
    undoError: "Impossible d'annuler l'affectation.",
    selectAllVisible: "Sélectionner toutes les affectations visibles",
    selectRow: "Sélectionner {name}",
    undoSelected: "Annuler la sélection ({count})",
    bulkUndoTitle: "Annuler les affectations sélectionnées ?",
    bulkUndoBody: "Un seul motif est enregistré sur chacune des {count} affectations sélectionnées. Leurs créneaux redeviennent disponibles et les enseignants libérés reviennent dans la file de sélection. Les annulations se font une par une et s'arrêtent au premier refus.",
    bulkUndoConfirm: "Annuler {count} affectations",
    bulkUndone: "Affectations annulées : {count}.",
    bulkUndoError: "Arrêt après l'annulation de {done} affectations sur {total}. Celles déjà annulées le restent.",
    reassignAction: "Réaffecter",
    reassignTitle: "Réaffecter ce créneau",
    reassignBody: "{slot} passe de {teacher} au remplaçant choisi, en une seule opération. Le motif est enregistré dans la piste d'audit.",
    reassignConfirm: "Réaffecter le créneau",
    replacement: "Participant remplaçant",
    reassigned: "Le créneau a été réaffecté.",
    reassignError: "Impossible de réaffecter le créneau.",
    validationsTitle: "Validations d'affectation",
    validationsSummary: "{blocking} anomalie(s) bloquante(s) et {warnings} avertissement(s).",
    validationsLoading: "Chargement des validations d'affectation.",
    validationsUnavailable: "Validations d'affectation indisponibles.",
    noValidations: "Aucune anomalie d'affectation."
  },
  planning: {
    pageTitle: "Planification de la répartition",
    description: "Construisez et vérifiez le plan d'enseignement du processus actif.",
    balanceTitle: "Équilibre de planification",
    group: "Heures des groupes",
    teacher: "Heures des enseignants",
    target: "Objectif",
    planned: "Planifié",
    difference: "Différence",
    loading: "Chargement de l'équilibre de planification.",
    unavailable: "L'équilibre de planification est indisponible.",
    noPlanYet: "Aucun plan d'enseignement n'a encore été créé pour ce processus, il n'y a donc aucun équilibre à afficher.",
    creation: {
      title: "Plan d'enseignement",
      description: "La planification porte sur un unique plan d'enseignement appartenant à ce processus.",
      absent: "Ce processus n'a pas encore de plan d'enseignement. Créez-le pour commencer la planification ; rien n'a échoué.",
      unavailable: "Le plan d'enseignement n'a pas pu être lu.",
      readOnly: "Un administrateur doit créer le plan d'enseignement avant que la planification puisse commencer.",
      action: "Créer le plan d'enseignement",
      pending: "Création du plan d'enseignement.",
      success: "Le plan d'enseignement a été créé.",
      error: "Le plan d'enseignement n'a pas pu être créé.",
      duplicateError: "Ce processus possède déjà un plan d'enseignement."
    },
    materialization: {
      title: "Activités des matières principales",
      description: "Vérifiez chaque ligne active de matière principale avant de créer uniquement les activités encore manquantes.",
      missing: "Manquantes",
      materialized: "Matérialisées",
      empty: "Aucune ligne active de matière principale n'est disponible.",
      loading: "Chargement de l'état de matérialisation des matières principales.",
      unavailable: "L'état de matérialisation des matières principales est indisponible.",
      inherited: "Hérité",
      complete: "Toutes les activités principales sont matérialisées",
      reviewAction: "Vérifier {count} activités manquantes",
      confirmTitle: "Matérialiser les activités principales manquantes ?",
      confirmBody: "Créer {missing} activités manquantes. Les {materialized} activités déjà matérialisées sont affichées pour vérification et ne seront pas dupliquées.",
      confirmAction: "Matérialiser les activités manquantes",
      success: "{created} activités principales créées ; {skipped} lignes déjà matérialisées ignorées.",
      error: "Les activités principales n'ont pas pu être matérialisées.",
      state: {
        missing: "Manquante",
        materialized: "Matérialisée",
        out_of_sync: "Désynchronisée"
      },
      column: {
        subject: "Matière",
        teachingGroup: "Classe",
        groupHours: "Heures groupe",
        teacherHours: "Heures enseignant par poste",
        teacherCount: "Postes enseignants",
        state: "État"
      }
    },
    sync: {
      title: "Activités principales désynchronisées",
      description: "Modifier une cellule matière-groupe ne réécrit jamais l'activité qu'elle a créée. Vérifiez chaque différence puis appliquez-la explicitement.",
      empty: "Chaque activité principale matérialisée correspond à sa cellule source.",
      loading: "Chargement de l'état de synchronisation des activités principales.",
      unavailable: "L'état de synchronisation des activités principales est indisponible.",
      unknownTeachingGroup: "Classe inconnue",
      activityLabel: "{subject} — {teachingGroup}",
      reviewAction: "Vérifier les différences",
      previewTitle: "Synchroniser {subject} — {teachingGroup} ?",
      previewError: "L'aperçu de synchronisation n'a pas pu être chargé.",
      noValueDifferences: "Les valeurs de planification correspondent déjà ; l'application ne fait que lever la marque de désynchronisation.",
      reconciliationRequired: "L'application modifie {count} postes attribués. Ils passent par le flux de réconciliation.",
      noAssignmentImpact: "Aucun poste attribué n'est concerné.",
      applyAction: "Appliquer les valeurs source",
      applySuccess: "{count} valeurs de planification ont été appliquées depuis la cellule source.",
      applyError: "Les valeurs source n'ont pas pu être appliquées.",
      staleError: "Les données de planification ont changé depuis cet aperçu. Vérifiez à nouveau les différences.",
      state: {
        in_sync: "Synchronisée",
        out_of_sync: "Désynchronisée"
      },
      blocked: {
        retirement_required: "La cellule source est retirée. Utilisez le flux encadré de retrait d'activité au lieu d'une synchronisation.",
        no_changes: "Cette activité est déjà synchronisée avec sa cellule source."
      },
      column: {
        field: "Valeur de planification",
        current: "Activité actuelle",
        source: "Cellule source"
      },
      field: {
        group_weekly_hours_per_group: "Heures de groupe",
        teacher_weekly_hours_per_position: "Heures enseignant par poste",
        required_teacher_count: "Postes d'enseignant"
      }
    },
    secondary: {
      title: "Activités secondaires",
      description: "Ajoutez le tutorat, la co-intervention et d'autres activités facultatives tout en séparant les heures groupe de la charge enseignante.",
      createAction: "Ajouter une activité secondaire",
      createTitle: "Ajouter une activité secondaire",
      editTitle: "Modifier l'activité secondaire",
      formDescription: "Choisissez une matière secondaire, ses groupes liés et les valeurs réelles utilisées par les deux équilibres.",
      subject: "Matière secondaire",
      activityType: "Type d'activité",
      groupHours: "Heures par groupe",
      teacherHours: "Heures enseignant par poste",
      teacherCount: "Postes enseignants",
      groups: "Groupes liés",
      notes: "Notes",
      balanceHint: "Impact groupe = heures groupe × groupes liés. Impact enseignant = heures enseignant × postes.",
      multipleGroupsHint: "Sélectionnez un ou plusieurs groupes. Tous reçoivent la même valeur d'heures groupe.",
      singleGroupHint: "Cette matière exige exactement un groupe lié.",
      optionalGroupHint: "Cette matière autorise zéro ou un groupe lié.",
      noGroups: "Aucune cellule groupe-matière active n'est disponible pour cette matière.",
      noLinkedGroups: "Activité de département",
      noSubjects: "Créez une matière secondaire et ses cellules groupe-matière avant d'ajouter une activité.",
      empty: "Aucune activité secondaire active n'a été ajoutée.",
      loading: "Chargement des activités secondaires.",
      unavailable: "Les activités secondaires sont indisponibles.",
      created: "Activité secondaire créée",
      updated: "Activité secondaire modifiée",
      retired: "Activité secondaire retirée",
      saveError: "L'activité secondaire n'a pas pu être enregistrée.",
      retireError: "L'activité secondaire n'a pas pu être retirée.",
      retireTitle: "Retirer l'activité secondaire ?",
      retireBody: "Retirer l'activité secondaire de {subject} ? Elle cesse de compter dans le plan et quitte cette liste.",
      retireConsequence: "Rien n'est supprimé : l'activité conserve son historique et reçoit une date de retrait. Tout poste déjà généré à partir d'elle exige une régénération, et tout poste déjà attribué exige une réconciliation.",
      groupRequiredError: "Sélectionnez un groupe pour cette matière.",
      multipleGroupsError: "Cette matière n'autorise pas plusieurs groupes liés.",
      duplicateGroupsError: "Un groupe ne peut pas être lié plusieurs fois.",
      invalidGroupsError: "Chaque groupe lié doit être une cellule active de la matière sélectionnée.",
      teacherCountError: "Le nombre de postes enseignants doit être un entier positif.",
      notesError: "Les notes ne peuvent pas dépasser 2000 caractères.",
      hoursError: {
        not_a_number: "Saisissez une valeur horaire décimale.",
        too_many_decimals: "Utilisez au maximum deux décimales.",
        negative: "Les heures ne peuvent pas être négatives.",
        out_of_range: "Les heures dépassent la plage prise en charge."
      },
      type: {
        ordinary: "Ordinaire",
        tutoring: "Tutorat",
        co_teaching: "Co-intervention",
        support: "Soutien",
        department_level: "Niveau département",
        other: "Autre"
      }
    },
    generation: {
      title: "Verrouillage du plan et génération des besoins",
      description: "Vérifiez les validations et l'état de verrouillage officiels avant de prévisualiser et générer les postes enseignants indivisibles.",
      planLoading: "Chargement du plan d'enseignement.",
      planUnavailable: "Le plan d'enseignement est indisponible.",
      validationsTitle: "Validations du plan",
      validationsDescription: "Les erreurs bloquantes et avertissements proviennent directement du service et ne sont jamais déduits du texte affiché.",
      validationsLoading: "Chargement des validations du plan.",
      validationsUnavailable: "Les validations du plan sont indisponibles.",
      blocking: "Bloquantes",
      warnings: "Avertissements",
      noValidations: "Aucune validation à signaler.",
      lockTitle: "Confirmation du verrouillage",
      lockConfirmed: "Le service confirme que ce plan est passé par l'état verrouillé du cycle de vie.",
      lockReady: "Ce plan équilibré peut être verrouillé après confirmation des validations du service et du résultat de faisabilité actuel.",
      lockUnavailable: "Le plan doit être équilibré et faisable avant de pouvoir être verrouillé.",
      lockAction: "Vérifier et verrouiller le plan",
      lockDisabledValidations: "Attendez les validations officielles du plan avant de le verrouiller.",
      lockDisabledBlocking: "Corrigez toutes les validations bloquantes avant de verrouiller le plan.",
      lockDisabledFeasibility: "Exécutez la faisabilité avec succès pour le plan actuel avant de le verrouiller.",
      lockDisabledStatus: "Le plan doit être équilibré avant d'être verrouillé.",
      lockConfirmationTitle: "Confirmer le verrouillage du plan",
      lockConfirmationDescription: "Le verrouillage fige ces données de planification faisables pour la génération des besoins. Confirmez uniquement après avoir vérifié les validations ci-dessus.",
      lockConfirmAction: "Verrouiller le plan",
      lockSuccess: "Le plan d'enseignement a été verrouillé par le service.",
      lockError: "Le plan d'enseignement n'a pas pu être verrouillé.",
      unlockTitle: "Déverrouillage",
      unlockRequired: "Les modifications de planification sont refusées tant que le plan est dans cet état ; il faut d'abord le déverrouiller.",
      unlockConsequence: "Le déverrouillage efface l'horodatage du verrou et rend le plan à l'édition équilibrée. La génération des besoins reste indisponible jusqu'à un nouveau verrouillage, et le service revérifie la faisabilité à ce moment-là.",
      unlockAction: "Déverrouiller le plan",
      unlockBlockedGeneration: "Le service ne déverrouille qu'un plan verrouillé avant génération. Ce plan a déjà une génération de besoins : utilisez la régénération ou le flux de réconciliation.",
      unlockReadOnly: "Le déverrouillage d'un plan d'enseignement est une action d'administrateur.",
      unlockPending: "Déverrouillage du plan d'enseignement en cours.",
      unlockSuccess: "Le plan d'enseignement a été déverrouillé par le service.",
      unlockError: "Le plan d'enseignement n'a pas pu être déverrouillé.",
      planStatus: "État du plan : {status}. Génération actuelle : {generation}.",
      previewAction: "Prévisualiser la génération des besoins",
      previewDisabled: "La génération est disponible uniquement pour un plan verrouillé par le service ou obsolète.",
      previewTitle: "Confirmer la génération des besoins",
      previewSummary: "Génération {generation} : créer {create}, conserver {preserve}, retirer {retire}, conflits {conflicts}.",
      previewMetric: {
        create: "Créer",
        preserve: "Conserver",
        retire: "Retirer",
        conflict: "Conflits"
      },
      reconciliationRequired: "Des postes affectés seraient modifiés. Utilisez la réconciliation ; la génération ne peut pas être appliquée.",
      noChanges: "La prévisualisation ne change rien. L'application enregistre tout de même la prochaine génération de validation déterministe.",
      confirmAction: "Générer les postes requis",
      previewError: "La prévisualisation de la génération n'a pas pu être créée.",
      generateError: "Les postes requis n'ont pas pu être générés.",
      success: "Génération appliquée. {count} postes actifs sont disponibles.",
      resultTitle: "Génération appliquée",
      resultSummary: "La génération {generation} a créé {created}, conservé {preserved}, retiré {retired} et compte maintenant {count} postes actifs.",
      totalSlots: "Nombre de postes actifs générés"
    },
    feasibility: {
      title: "Diagnostics de faisabilité",
      description: "Vue chef de département de la dernière évaluation bornée : son état, ses constats et la remédiation suggérée. Les constats ne quittent jamais ce niveau.",
      planLoading: "Chargement du plan d'enseignement.",
      planUnavailable: "Le plan d'enseignement est indisponible.",
      noPlan: "La planification n'a pas commencé pour ce processus ; il n'y a rien à évaluer.",
      statusTitle: "Dernière évaluation",
      evaluatedAt: "Dernière évaluation : {timestamp}",
      solverVersion: "Version du solveur : {version}",
      notEvaluated: "Aucune évaluation actuelle n'existe. Exécutez-en une après les modifications de planification ; chaque changement pertinent réinitialise le résultat enregistré.",
      evaluatedNone: "L'évaluation actuelle ne signale aucun constat.",
      diagnosticsLoading: "Chargement des constats de l'évaluation.",
      diagnosticsUnavailable: "Les constats de l'évaluation sont indisponibles ; une nouvelle évaluation est requise.",
      findingsTitle: "Constats",
      affectedTitle: "Concernés",
      affectedSlot: "{activity} · {position}",
      unresolvedReferences: "{count} référence(s) concernée(s) ne peuvent pas être résolues vers une activité ou un poste actuel.",
      suggestionTitle: "Remédiation suggérée",
      suggestion: {
        incompatible_residual_totals: "Ajustez les cibles des participants ou les heures des activités pour que les totaux restants correspondent exactement.",
        slot_exceeds_every_target: "Réduisez les heures par poste de l'activité concernée, ou augmentez la cible d'un participant par des heures supplémentaires autorisées.",
        distinct_teacher_shortfall: "Ajoutez des participants actifs ou réduisez le nombre de postes enseignants de l'activité concernée pour que chaque poste ait un enseignant distinct.",
        unsatisfiable_targets: "Revoyez ensemble les cibles des participants et les heures des activités : aucune répartition exacte ne peut remplir chaque participant jusqu'à sa cible.",
        instance_size_limit: "L'instance dépasse les limites configurées du solveur. Réduisez les participants ou les postes, ou demandez à l'administrateur de la plateforme de revoir les limites.",
        step_limit: "Relancez l'évaluation. Si elle reste indéterminée, simplifiez l'instance ou demandez à l'administrateur de la plateforme de revoir le budget du solveur.",
        time_limit: "Relancez l'évaluation. Si elle reste indéterminée, simplifiez l'instance ou demandez à l'administrateur de la plateforme de revoir le budget du solveur."
      },
      evaluateAction: "Exécuter l'évaluation de faisabilité",
      evaluateDisabledNoPlan: "Créez le plan d'enseignement avant d'exécuter une évaluation.",
      evaluateSuccess: "Évaluation de faisabilité terminée : {status}.",
      evaluateError: "L'évaluation de faisabilité n'a pas pu être exécutée."
    },
    reconciliation: {
      title: "Modifications d'allocation et réconciliation",
      description: "Enregistrez les révisions d'allocation immuables, vérifiez le plan obsolète et résolvez explicitement chaque poste affecté.",
      allocationFormTitle: "Enregistrer une nouvelle révision d'allocation",
      allocationFormDescription: "La révision précédente reste dans l'historique. Le service marque le plan comme obsolète et conserve activités, besoins et affectations.",
      allocatedHours: "Heures groupe allouées",
      source: "Source",
      sourceOption: {
        manual_transcription: "Transcription manuelle",
        file_import: "Import de fichier",
        copied_draft: "Brouillon copié",
        other: "Autre"
      },
      sourceReference: "Référence de la source",
      allocationReason: "Motif de la modification",
      positiveHoursError: "Les heures allouées doivent être supérieures à zéro.",
      allocationReasonError: "Le motif d'allocation ne peut pas dépasser 500 caractères.",
      sourceReferenceError: "La référence de la source ne peut pas dépasser 500 caractères.",
      recordAllocationAction: "Enregistrer la révision d'allocation",
      allocationRecorded: "La révision d'allocation a été enregistrée. Le travail existant reste conservé.",
      allocationError: "La révision d'allocation n'a pas pu être enregistrée.",
      allocationHistoryTitle: "Historique des révisions d'allocation",
      allocationLoading: "Chargement des révisions d'allocation.",
      allocationUnavailable: "Les révisions d'allocation sont indisponibles.",
      noAllocation: "Aucune allocation n'a encore été communiquée.",
      currentAllocation: "Révision actuelle {revision} : {hours} heures groupe allouées.",
      revision: "Révision",
      state: "État",
      current: "Actuelle",
      superseded: "Remplacée",
      historyPreserved: "Chaque révision d'allocation précédente reste visible et immuable.",
      statusTitle: "État de la réconciliation",
      staleState: "Le service signale un plan obsolète. Les nouvelles affectations restent bloquées jusqu'à la fin de la réconciliation.",
      currentState: "Le plan ne nécessite actuellement aucune réconciliation d'allocation.",
      planStatus: "État du plan : {status}. Génération actuelle : {generation}.",
      assignmentsPreserved: "Les affectations existantes restent visibles et inchangées jusqu'à la confirmation de leur résolution manuelle.",
      previewAction: "Prévisualiser la réconciliation des besoins",
      previewDisabled: "La réconciliation est disponible uniquement lorsque le service signale un plan obsolète ou à réconcilier.",
      previewTitle: "Confirmer la réconciliation manuelle",
      previewSummary: "Génération {generation} : créer {create}, conserver {preserve}, retirer {retire}, conflits affectés {conflicts}.",
      previewMetric: {
        create: "Créer",
        preserve: "Conserver",
        retire: "Retirer",
        conflict: "Conflits affectés"
      },
      preservedRequirements: "{count} besoins inchangés et leurs affectations restent conservés.",
      activity: "Activité",
      position: "Poste",
      hoursChange: "Modification des heures",
      manualAction: "Résolution manuelle",
      unknownActivity: "Activité inconnue",
      hoursRemoved: "{current} heures → poste supprimé",
      hoursChanged: "{current} heures → {next} heures",
      resolution: {
        value_changed: "Libérer l'affectation et créer le poste de remplacement",
        removed: "Libérer l'affectation et retirer le poste supprimé"
      },
      noConflicts: "Aucun poste affecté ne doit être libéré. Vérifiez les modifications non affectées avant application.",
      noChanges: "La prévisualisation de réconciliation ne contient aucune modification.",
      reconciliationReason: "Motif de la réconciliation",
      confirmationWarning: "La confirmation enregistre le motif, libère uniquement les affectations listées et conserve leur historique d'audit. Une prévisualisation modifiée est refusée.",
      confirmAction: "Appliquer la réconciliation manuelle",
      previewError: "La prévisualisation de réconciliation n'a pas pu être créée.",
      stalePreviewError: "La réconciliation a changé. Prévisualisez-la de nouveau avant de confirmer.",
      reconcileError: "Les besoins n'ont pas pu être réconciliés.",
      success: "Réconciliation appliquée. {count} conflits affectés ont été résolus explicitement.",
      resultTitle: "Réconciliation appliquée",
      resultSummary: "La génération {generation} a résolu {resolved} conflits, libéré {released} affectations, créé {created}, conservé {preserved}, retiré {retired} et compte maintenant {count} postes actifs.",
      liveSlots: "Postes actifs après réconciliation",
      hoursError: {
        not_a_number: "Saisissez une valeur horaire décimale.",
        too_many_decimals: "Utilisez au maximum deux décimales.",
        negative: "Les heures ne peuvent pas être négatives.",
        out_of_range: "Les heures dépassent la plage prise en charge."
      }
    }
  },
  action: {
    create: "Ajouter",
    edit: "Modifier",
    delete: "Supprimer",
    retire: "Retirer",
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
    linkUser: "Lier à mon compte",
    issueClaimCode: "Émettre un code de rattachement",
    claimProfile: "Rattacher mon profil",
    copyCode: "Copier le code",
    unlinkUser: "Délier le compte",
    export: "Exporter",
    restore: "Restaurer le brouillon",
    copyFrom: "Copier depuis l'année précédente",
    startTurn: "Démarrer le tour",
    completeTurn: "Terminer le tour",
    skipTurn: "Passer le tour",
    overrideTurn: "Forcer le tour",
    initializeTurns: "Initialiser les tours",
    openSession: "Ouvrir la séance",
    closeSession: "Clore la séance"
  },
  confirm: {
    delete: { title: "Supprimer {entity} ?", body: "Cette action supprimera définitivement **{name}**. Elle est irréversible.", proceed: "Supprimer définitivement" },
    archive: { title: "Archiver {entity} ?", body: "**{name}** ne figurera plus dans les listes actives. Les données existantes sont conservées et restent consultables depuis la vue archive.", proceed: "Archiver" },
    cancel: "Annuler"
  },
  nav: {
    group: {
      configuration: "Étape 1 · Configuration",
      planning: "Étape 2 · Planification",
      assignment: "Étape 3 · Affectation"
    },
    item: {
      schools: "Établissements",
      academicYears: "Années scolaires",
      departments: "Départements",
      teacherRoster: "Liste du personnel enseignant",
      dashboard: "Tableau de bord",
      processes: "Processus",
      teachingGroups: "Classes",
      classroomStages: "Niveaux scolaires",
      groupSubjects: "Matrice groupe-matière",
      processSettings: "Paramètres du processus",
      allocation: "Dotation de la direction",
      planningExports: "Exports de planification",
      subjects: "Matières",
      planning: "Planification",
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
    claimCode: {
      title: "Code de rattachement pour {name}",
      body: "Remettez ce code à {name}. Il ne fonctionne qu'une fois, expire {expires}, et n'est affiché que maintenant — s'il est perdu, émettez-en un autre.",
      copied: "Copié",
      dismiss: "Terminé"
    },
    bootstrap: {
      title: "Configurer votre répartition",
      subtitle: "Les trois étapes, du premier enregistrement à la séance.",
      step: { school: "Créer un établissement", academicYear: "Créer une année scolaire", department: "Créer un département", process: "Créer un processus d'affectation", allocation: "Enregistrer la dotation horaire de la direction", participants: "Ajouter les participants et leurs heures cibles", subjects: "Ajouter les matières enseignées", teachingGroups: "Ajouter les classes", groupSubjects: "Remplir la matrice classe-matière", configurationReview: "Vérifier la configuration et les paramètres de sélection", teachingPlan: "Créer le plan d'enseignement", planBalance: "Équilibrer les heures de classe et la charge enseignante", planLock: "Verrouiller le plan d'enseignement", requirements: "Générer les créneaux de besoin", meeting: "Attribuer les postes en séance" },
      done: "Terminé",
      open: "Ouvrir",
      unknown: "Non vérifié ici",
      openChecklist: "Liste de configuration",
      closeChecklist: "Fermer la liste de configuration",
      checking: "Vérification de ce qui est fait…",
      reason: {
        "no-process": "Sélectionnez d'abord un processus.",
        "not-observed": "Cet écran ne lit pas cette donnée."
      }
    }
  },
  meeting: {
    title: "Conduite de la séance",
    open: "Les choix sont ouverts.",
    openDetail: "Le plan est à jour ; les postes peuvent être distribués.",
    blocked: {
      no_process_data: "Aucune donnée de processus n'a encore été chargée.",
      plan_not_ready: "Le plan n'est pas encore prêt pour les choix.",
      reconciliation_required: "Un changement d'allocation doit être réconcilié avant la poursuite des choix.",
      no_meeting_session: "Aucune session de réunion n'est ouverte."
    },
    lifecycleTitle: "Cycle de vie du plan",
    lifecycle: {
      open: "À jour",
      stale: "Obsolète",
      reconciliation_required: "Réconciliation requise",
      blocked: "Bloqué"
    },
    staleDetail: "Le plan a changé après la génération. Le service décide du sort des postes existants.",
    reconciliationDetail: "Un changement d'allocation a invalidé le plan. Réconciliez-le avant de poursuivre la séance.",
    pendingTitle: "Postes",
    overloadTitle: "Heures supplémentaires autorisées",
    overloadDetail: "{base} h de base + {extra} h autorisées = {target} h de cible",
    noOverloads: "Aucun participant ne porte d'heures supplémentaires autorisées.",
    actionDisabled: {
      no_process_data: "Aucune donnée de processus n'a encore été chargée.",
      plan_not_ready: "Le plan n'est pas encore prêt pour la sélection.",
      reconciliation_required: "Un changement de dotation doit être réconcilié avant que la sélection continue.",
      no_meeting_session: "Aucune session de réunion n'est ouverte. Ouvrez-en une pour gérer les tours.",
      turn_active: "Un tour est déjà en cours.",
      no_active_turn: "Aucun tour n'est en cours.",
      reason_required: "Indiquez d'abord un motif."
    },
    reasonLabel: "Motif",
    reasonPlaceholder: "Pourquoi ce tour est passé ou forcé",
    reasonHint: "Passer ou forcer un tour est audité : un motif est requis.",
    actionPending: "En cours…",
    actionFailed: "L'action sur le tour a échoué.",
    session: {
      title: "Séance de réunion",
      none: "Aucune séance n'est ouverte.",
      closeConfirmTitle: "Clore la séance de réunion ?",
      closeConfirmBody: "Les enseignants perdent l'accès LAN à cette réunion dès que la séance est close.",
      closeConfirmAction: "Clore la séance",
      actionFailed: "L'action sur la séance de réunion a échoué."
    }
  },
  dashboard: {
    balanceState: { balanced: "Équilibré", unbalanced: "Non équilibré", unknown: "Inconnu" },
    readiness: {
      ready: "Prêt",
      not_ready: "Pas prêt",
      recalculation_required: "Recalcul requis"
    },
    feasibility: {
      not_evaluated: "Non évaluée",
      feasible: "Réalisable",
      infeasible: "Irréalisable",
      unknown: "Indéterminée"
    },
    invariant: {
      group: "Heures de classe",
      teacher: "Charge enseignante",
      feasibility: "Faisabilité du reparto",
      readiness: "Préparation"
    },
    title: "Tableau de bord du reparto",
    subtitleAdmin: "Suivez les deux équilibres, l'avancement des affectations et la préparation de la séance avant le direct.",
    subtitleReadonly: "Projetez une vue calme en lecture seule pour la seance en direct.",
    pickerLabel: "Processus courant",
    pickerHint: "Changez de processus quand la route n'est pas verrouillee sur un id precis.",
    mode: { admin: "Mode admin", readonly: "Mode lecture seule" },
    section: {
      planning: "Planification",
      assignment: "Affectation",
      participants: "Participants",
      validations: "Validations",
      checklist: "Checklist de configuration",
      meetingReadiness: "Preparation de la seance"
    },
    metric: {
      totalSlots: "Postes",
      assignedSlots: "Pris",
      availableSlots: "Libres",
      targetHours: "Cible",
      assignedHours: "Affectées",
      remainingHours: "Restantes",
      blocking: "Bloquantes",
      balancedParticipants: "Équilibrés",
      pendingParticipants: "En attente",
      overloadedParticipants: "En surcharge"
    },
    participantState: {
      pending: "N'a pas encore atteint sa cible.",
      balanced: "Les heures affectées correspondent à la cible.",
      overloaded_authorized: "La cible inclut des heures supplémentaires autorisées.",
      inactive: "N'est pas actif dans ce processus.",
      not_participating: "Ne fait pas partie de l'ordre de choix."
    },
    state: {
      noDashboard: "Les donnees du tableau de bord apparaitront quand le processus sera pret.",
      noPlan: "Ce processus n'a pas encore de plan pédagogique.",
      noTeachers: "Ajoutez des participants au processus pour voir leur avancement.",
      noValidations: "Aucun constat.",
      summaryOnly: "Cette vue lit le résumé agrégé, qui ne porte aucun constat par enseignant.",
      lockedToRoute: "Cette route est fixee au processus de l'URL courante."
    },
    summary: {
      slotProgress: "{assigned} postes pris sur {total}.",
      participantHours: "{assigned} h sur {target} h, {remaining} h restantes",
      authorizedExtra: "{hours} heures supplémentaires autorisées.",
      participants: "{count} participant(s) suivis ; {overloaded} avec des heures supplémentaires autorisées.",
      validations: "{total} constat(s) bloquant(s) : {planning} en planification, {assignment} en affectation.",
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
  table: { noResults: "Aucun résultat.", searchPlaceholder: "Rechercher...", loading: "Chargement...", actions: "Actions", columns: "Colonnes", all: "Toutes", firstPage: "Première page", previousPage: "Page précédente", nextPage: "Page suivante", lastPage: "Dernière page", page: "Page", rowsPerPage: "Lignes par page", searchTeachingGroups: "Rechercher par niveau, code du groupe ou libellé...", searchSubjects: "Rechercher par nom...", searchParticipants: "Rechercher un enseignant...", searchAssignments: "Rechercher par besoin ou participant...", searchSchools: "Rechercher par nom, localité ou province...", searchAcademicYears: "Rechercher par libellé ou établissement...", searchDepartments: "Rechercher par nom ou établissement...", searchTeacherRoster: "Rechercher un enseignant..." },
  teachingGroupBulk: {
    action: "Créer des groupes",
    title: "Créer plusieurs classes",
    description: "Créer une plage inclusive de classes.",
    groupStart: "Premier groupe",
    groupEnd: "Dernier groupe",
    created: "Classes créées : {count}",
    createError: "Impossible de créer les classes"
  },
  groupSubjectBulk: {
    title: "Éditeur groupé des matières par classe",
    description: "Prévisualisez et confirmez une matière pour les classes correspondant à l'étape et aux niveaux.",
    modeLabel: "Mode d'opération",
    mode: {
      create_missing: "Créer les éléments manquants",
      update_existing: "Mettre à jour les éléments existants",
      upsert: "Créer ou mettre à jour"
    },
    allStages: "Toutes les étapes",
    minimumGrade: "Niveau minimum",
    maximumGrade: "Niveau maximum",
    groupHours: "Heures groupe",
    teacherHours: "Heures enseignant par poste",
    teacherCount: "Postes enseignants",
    inheritHint: "Laissez un champ d'heures vide pour hériter de la valeur par défaut. Saisissez 0 pour un vrai zéro.",
    previewAction: "Prévisualiser les modifications",
    confirmAction: "Confirmer et appliquer",
    confirmTitle: "Appliquer les modifications matière-classe ?",
    confirmBody: "Appliquer {count} modification(s) de cette prévisualisation. Le serveur refusera l'opération si la sélection a changé.",
    previewTitle: "Prévisualisation groupée",
    noMatches: "Aucune classe ne correspond à ces filtres.",
    noChanges: "La prévisualisation ne contient aucune modification à appliquer.",
    validationTitle: "Erreurs de validation de la prévisualisation",
    stale: "Cette prévisualisation est obsolète car les classes correspondantes ont changé. Prévisualisez de nouveau avant d'appliquer.",
    applied: "{created} ligne(s) matière-classe créée(s) et {updated} mise(s) à jour.",
    previewError: "La prévisualisation des matières par classe n'a pas pu être générée.",
    applyError: "Les modifications des matières par classe n'ont pas pu être appliquées.",
    gradeError: "Les niveaux doivent être des nombres entiers positifs.",
    gradeRangeError: "Le niveau minimum doit être inférieur ou égal au niveau maximum.",
    teacherCountError: "Le nombre de postes enseignants doit être un entier positif.",
    hoursError: {
      not_a_number: "Saisissez une valeur d'heures décimale.",
      too_many_decimals: "Utilisez au maximum deux décimales.",
      negative: "Les heures ne peuvent pas être négatives.",
      out_of_range: "Les heures dépassent la plage prise en charge."
    },
    summary: "{create} à créer, {update} à mettre à jour, {unchanged} inchangé(s), {conflicts} conflit(s).",
    column: {
      action: "Résultat",
      teachingGroup: "Classe",
      groupHours: "Heures groupe",
      teacherHours: "Heures enseignant",
      teacherCount: "Postes enseignants",
      reason: "Détails"
    },
    rowAction: {
      create: "Créer",
      update: "Mettre à jour",
      unchanged: "Inchangé",
      conflict: "Conflit"
    }
  },
  groupSubjectMatrix: {
    pageTitle: "Matrice groupe-matière",
    description: "Une cellule par classe et par matière, portant les valeurs de planification réelles à partir desquelles le plan pédagogique est matérialisé.",
    addAction: "Ajouter une cellule",
    createTitle: "Ajouter une cellule de la matrice",
    editTitle: "Modifier la cellule de la matrice",
    empty: "La matrice est vide. Remplissez-la avec l'éditeur en masse ci-dessous, ou ajoutez une cellule.",
    emptyHint: "La matérialisation des matières principales n'a aucune cellule candidate tant qu'aucune n'existe.",
    inherited: "Hérité",
    identityHint: "La classe et la matière d'une cellule constituent son identité et ne peuvent pas être modifiées ici.",
    readOnly: "Modifier la matrice est une action du chef de département.",
    search: "Rechercher une classe ou une matière...",
    created: "Cellule de la matrice ajoutée.",
    updated: "Cellule de la matrice mise à jour.",
    createError: "La cellule de la matrice n'a pas pu être ajoutée.",
    updateError: "La cellule de la matrice n'a pas pu être mise à jour.",
    selectTeachingGroup: "Sélectionner une classe",
    selectSubject: "Sélectionner une matière"
  },
  allocation: {
    pageTitle: "Dotation de la direction",
    description: "Les heures de groupe hebdomadaires communiquées à ce département par la direction. L'étape 2 équilibre le plan pédagogique par rapport à la révision courante : enregistrez-la avant de commencer la planification.",
    panelTitle: "Révisions de la dotation",
    panelDescription: "Chaque révision est immuable et conserve sa place dans l'historique. En enregistrer une nouvelle après le début de la planification rend le plan obsolète et impose une réconciliation explicite.",
    readOnly: "Enregistrer une révision de la dotation est une action du chef de département."
  },
  processSettings: {
    pageTitle: "Paramètres du processus",
    description: "Comment ce processus sera mené : les heures de référence auxquelles les participants sont comparés, l'ordre de sélection utilisé en séance et les deux espaces que les enseignants atteignent par eux-mêmes.",
    formTitle: "Paramètres de sélection et d'accès LAN",
    field: {
      defaultTeacherHoursReference: "Heures de référence",
      selectionOrderEnabled: "Ordre de sélection activé",
      selectionOrderMode: "Mode d'ordre",
      directTeacherSelectionEnabled: "Sélection directe par l'enseignant",
      lanAccessEnabled: "Accès LAN"
    },
    hint: {
      defaultTeacherHoursReference: "Laissez le champ vide s'il n'y a aucune référence. Un 0 saisi est un vrai zéro et n'équivaut pas à un champ vide.",
      selectionOrderEnabled: "Enregistre un ordre de sélection pour la séance ; les participants prennent alors leurs postes dans cet ordre.",
      selectionOrderMode: "Le mode est enregistré indépendamment et ne s'applique que lorsque l'ordre de sélection est activé.",
      modeInert: "L'ordre de sélection est désactivé : ce mode est enregistré mais ne s'applique pas.",
      directTeacherSelectionEnabled: "Permet à un participant de prendre un poste depuis son propre espace, sans attendre l'enregistrement de son tour.",
      lanAccessEnabled: "Ouvre la vue en lecture seule que les enseignants atteignent sur le réseau local pendant la séance."
    },
    mode: { none: "Aucun ordre", informative: "Informatif", strict: "Strict" },
    statusTitle: "État actuel",
    statusLine: "État : {status}.",
    statusOwnedElsewhere: "L'état n'est pas un paramètre : il appartient au point d'entrée de transition, et l'ouverture d'une séance le fixe directement.",
    unchanged: "Rien n'a changé, il n'y a donc rien à enregistrer.",
    loading: "Chargement du processus.",
    unavailable: "Le processus est indisponible.",
    readOnly: "Modifier les paramètres du processus est une action du chef de département.",
    saved: "Paramètres du processus enregistrés.",
    saveError: "Les paramètres du processus n'ont pas pu être enregistrés.",
    hoursError: {
      not_a_number: "Saisissez une valeur horaire telle que 18 ou 18,50.",
      too_many_decimals: "Les heures acceptent au plus deux décimales.",
      negative: "Les heures ne peuvent pas être négatives.",
      out_of_range: "Cette valeur horaire est trop grande."
    },
    reopen: {
      title: "Rouvrir le processus",
      frozen: "Ce processus est clos. Toute modification de configuration, de planification et d'affectation est refusée tant qu'il n'est pas rouvert.",
      terminal: "Ce processus est archivé. L'archivage est terminal : il ne peut pas être rouvert.",
      readOnly: "Rouvrir un processus est une action du chef de département.",
      reasonLabel: "Motif de réouverture",
      reasonRequired: "Indiquez pourquoi le processus est rouvert.",
      reasonTooLong: "Le motif de réouverture ne peut pas dépasser 500 caractères.",
      consequence: "La réouverture place le processus en état rouvert, efface son horodatage de clôture et laisse de nouveau passer les modifications de configuration, de planification et d'affectation. Rien de ce qui est déjà enregistré n'est supprimé, et le motif que vous indiquez est la seule trace de la raison.",
      action: "Rouvrir le processus",
      reopened: "Le processus a été rouvert.",
      error: "Le processus n'a pas pu être rouvert."
    }
  },
  teachingGroupSelection: {
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
  participants: {
    hoursError: {
      not_a_number: "Saisissez une valeur horaire telle que 12 ou 12,50.",
      too_many_decimals: "Les heures acceptent au maximum deux décimales.",
      negative: "Les heures ne peuvent pas être négatives.",
      out_of_range: "Cette valeur horaire est trop grande."
    },
    extraHoursAction: "Heures suppl.",
    extraHoursTitle: "Autoriser des heures supplémentaires",
    extraHoursBody: "{teacher} a une base de {base} heures et {extra} heures supplémentaires autorisées, pour une cible de {target} heures.",
    extraHoursHint: "Remettez la valeur à 0 pour retirer l'autorisation. Les deux sens sont enregistrés avec votre motif.",
    extraHoursConfirm: "Autoriser",
    extraHoursSaved: "Heures supplémentaires autorisées mises à jour.",
    extraHoursError: "Les heures supplémentaires autorisées n'ont pas pu être modifiées",
    lastExtraHoursReason: "Dernier motif enregistré : {reason}",
    noExtraHoursReason: "Aucune modification des heures supplémentaires n'a encore été enregistrée.",
    targetHint: "Les heures cibles sont la base plus les heures supplémentaires autorisées ; elles ne se modifient pas directement.",
    overloadedYes: "Oui",
    overloadedNo: "Non"
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
  help: {
    open: "Que dois-je faire ici ?",
    close: "Masquer cette aide",
    openFor: "Ouvrir l'aide de {step}",
    what: "Ce qu'est cette page",
    why: "Pourquoi c'est important",
    how: "Comment procéder",
    docs: "Lire le guide complet",
    step: {
      processList: {
        what: "Un processus d'affectation, c'est un département, dans un établissement, pour une année scolaire. Tout le reste de l'application appartient à un processus : une année de travail commence donc ici.",
        why: "Rien de ce qui suit dans le menu ne peut être ouvert tant qu'aucun processus n'est sélectionné : ces pages n'ont alors rien à vous montrer.",
        how: [
          "Choisissez l'année scolaire, puis l'établissement, puis le département. Votre choix est mémorisé dans ce navigateur : vous ne le faites qu'une fois.",
          "Si ce qu'il vous faut n'existe pas encore, choisissez Créer un nouveau. L'année, l'établissement et le département se créent tous depuis cet écran.",
          "Un nouveau processus démarre en Brouillon. Vous ne fixez jamais le statut à la main : il évolue tout seul au fil du travail.",
          "Une fois le processus sélectionné, descendez le menu dans l'ordre : étape 1, puis étape 2, puis étape 3."
        ]
      },
      dashboard: {
        what: "Une vue unique de l'état du processus : la liste de contrôle de configuration, les deux équilibres horaires et ce qui manque encore.",
        why: "C'est le moyen le plus rapide de savoir ce qu'il reste à faire, sans parcourir toutes les pages pour le découvrir.",
        how: [
          "Lisez d'abord la liste de contrôle : elle nomme chaque point de l'étape 1 encore ouvert.",
          "Vérifiez les deux équilibres. Les heures de classe et les heures enseignantes sont deux mesures distinctes et ne s'additionnent jamais.",
          "Suivez le premier point non terminé jusqu'à la page qui permet de le régler."
        ]
      },
      schools: {
        what: "Les établissements connus de ce site. Un établissement est partagé par tout le site, pas par un seul processus.",
        why: "Une année scolaire, un département et donc un processus dépendent tous d'un établissement : rien d'autre ne peut être créé avant lui.",
        how: [
          "Vérifiez que votre établissement n'existe pas déjà avant de le créer : ces fiches sont partagées par tout le monde.",
          "Créez-le avec son nom. La localité, la province, la région, l'adresse et les notes sont facultatives.",
          "Créer et modifier un établissement demande un compte Administrateur ; tout le monde peut lire la liste."
        ]
      },
      academicYears: {
        what: "Une année scolaire, par exemple 2026/2027, avec une date de début et une date de fin. Une année appartient à un établissement.",
        why: "Un processus, c'est un département, dans un établissement, pour une année, et le lien vers l'année précédente est ce qui rend possible une comparaison d'une année sur l'autre.",
        how: [
          "Choisissez l'établissement, donnez un libellé à l'année et fixez ses dates de début et de fin.",
          "Reliez-la à l'année précédente lorsqu'il y en a une. Ce lien est utilisé par la copie depuis l'an dernier et par la comparaison avec l'année précédente.",
          "Une année terminée est archivée, jamais supprimée : sa trace reste intacte."
        ]
      },
      departments: {
        what: "Un département d'enseignement au sein d'un établissement : le groupe d'enseignants dont l'application répartit les heures hebdomadaires.",
        why: "Le département est la troisième composante d'un processus, aux côtés de l'établissement et de l'année scolaire.",
        how: [
          "Choisissez l'établissement, puis donnez au département un nom et un identifiant court.",
          "Le champ Chef de département est purement descriptif. Il indique qui dirige le département et n'accorde aucune permission.",
          "Ce qu'un compte peut faire découle de son rôle, jamais de ce champ."
        ]
      },
      classroomStages: {
        what: "Les niveaux de scolarité auxquels appartiennent vos classes, par exemple Secundaria avec le libellé court ESO et les niveaux 1 à 4.",
        why: "Le nom d'une classe est construit à partir de son niveau : bien définir les niveaux une fois garantit ensuite un nommage cohérent de toutes les classes.",
        how: [
          "Donnez au niveau un nom, le libellé court utilisé dans le nom des classes, et son niveau minimal et maximal.",
          "Le libellé d'une classe est alors généré à partir du niveau, du libellé court et du code de groupe, ce qui donne 3e ESO B.",
          "Tout le monde peut lire les niveaux ; les créer et les modifier demande un compte Administrateur."
        ]
      },
      teacherRoster: {
        what: "La liste du personnel enseignant connu du site. Elle est volontairement distincte des comptes utilisateurs du site.",
        why: "Une fiche de cette liste est ce que vous ajoutez ensuite à un processus comme participant, et la relier à un compte est ce qui permet à cet enseignant d'utiliser Mon espace pendant une séance.",
        how: [
          "Créez une fiche par enseignant avec un nom affiché. Marquez comme inactive la fiche de quelqu'un qui est parti plutôt que de la supprimer.",
          "Pour relier un enseignant à son compte, choisissez Émettre un code sur sa ligne. Le code s'affiche une seule fois, ne sert qu'une fois et expire : remettez-le en privé à cet enseignant.",
          "L'enseignant se connecte avec son propre compte, ouvre Mon espace et saisit le code. Vous ne choisissez jamais de compte à sa place.",
          "Si un code est perdu, émettez-en un autre. L'ancien code ne peut plus être affiché."
        ]
      },
      allocation: {
        what: "Les heures de classe hebdomadaires attribuées à votre département par la direction : le chiffre auquel tout le plan doit aboutir. Avant l'enregistrement de la première révision, la page est simplement vide, ce qui est normal pour un nouveau processus et non une erreur.",
        why: "C'est l'un des deux totaux avec lesquels l'étape 2 s'équilibre : sans lui, il n'y a rien vers quoi planifier.",
        how: [
          "Saisissez les heures de classe hebdomadaires attribuées, strictement positives et à deux décimales au plus, avec un motif écrit. Le motif est obligatoire et conservé définitivement.",
          "Il n'y a ni modification ni suppression. Pour changer le chiffre, vous enregistrez une nouvelle révision, qui remplace la précédente tout en la gardant visible dans l'historique.",
          "Enregistrer une révision après le début de la planification rend le plan obsolète et impose une réconciliation explicite : faites-le donc en connaissance de cause."
        ]
      },
      participants: {
        what: "Les enseignants qui prennent part à ce processus précis, chacun avec sa charge hebdomadaire contractuelle.",
        why: "La somme des objectifs de tous les participants actifs est le total d'heures enseignantes que le plan doit atteindre exactement : pas une heure de plus, pas une heure de moins.",
        how: [
          "Ajoutez chaque enseignant depuis la liste du personnel et renseignez ses heures de base, c'est-à-dire sa charge d'enseignement hebdomadaire contractuelle.",
          "Les heures cibles sont calculées pour vous comme la somme des heures de base et des heures supplémentaires autorisées : elles ne se saisissent pas.",
          "Les heures supplémentaires autorisées partent de zéro et ne changent que par l'action distincte qui exige un motif écrit, dans les deux sens, y compris pour retirer une autorisation.",
          "Indiquez si chaque participant prend un tour lors de la séance, et à quelle position."
        ]
      },
      subjects: {
        what: "Ce qui est enseigné, avec les heures par défaut que chaque matière porte habituellement.",
        why: "Les matières principales sont l'entrée obligatoire que l'étape 2 transforme en activités ; les matières secondaires sont les ajouts discrétionnaires que vous faites à la main.",
        how: [
          "Donnez à chaque matière un nom et une catégorie de dotation, Principale ou Secondaire. Il n'y a pas de case à cocher : la catégorie est la distinction.",
          "Renseignez les heures de classe par défaut, les heures enseignantes par poste par défaut et le nombre de postes enseignants par défaut.",
          "Le type d'activité n'est qu'un libellé descriptif. Il ne change jamais le comportement de l'application.",
          "Les valeurs par défaut n'amorcent que les nouvelles cellules de la matrice. En modifier une plus tard ne réécrit jamais les cellules ni les activités déjà existantes."
        ]
      },
      teachingGroups: {
        what: "Les classes elles-mêmes, chacune avec son niveau, son année et son code de groupe.",
        why: "Une classe est la moitié de chaque cellule de la matrice, et la matrice est ce sur quoi tout le plan est construit.",
        how: [
          "Créez une classe avec son niveau scolaire, son année et son code de groupe. Le libellé est généré pour vous jusqu'à ce que vous le modifiiez à la main.",
          "Pour créer tout un niveau d'un coup, utilisez Créer des classes : choisissez un niveau, une année et une plage de codes de groupe, prévisualisez la liste exacte, puis créez-les ensemble en une seule requête.",
          "Les années que vous pouvez choisir sont limitées à la plage du niveau retenu."
        ]
      },
      groupSubjects: {
        what: "Une cellule pour chaque couple classe-matière réellement existant, portant les heures réelles que ce couple représente.",
        why: "C'est le cœur de l'étape 1 : la matrice est exactement ce que l'étape 2 transforme en plan d'enseignement.",
        how: [
          "Chaque cellule porte les heures de classe, les heures enseignantes par poste et le nombre de postes. Laissez un champ d'heures vide pour hériter de la valeur par défaut de la matière ; saisissez 0 pour un vrai zéro.",
          "Remplir trente cellules une par une est fastidieux : utilisez l'éditeur en masse sous la liste. Choisissez une matière, le mode d'opération, puis restreignez les classes par niveau et par plage d'années.",
          "Appuyez sur Prévisualiser les changements et lisez ce qui sera créé, mis à jour et laissé tel quel. Ce n'est qu'ensuite que Confirmer et appliquer devient disponible.",
          "Si quoi que ce soit a changé entre la prévisualisation et l'application, l'application est refusée. Prévisualisez de nouveau plutôt que d'appuyer une seconde fois."
        ]
      },
      processSettings: {
        what: "La manière dont ce processus sera conduit : la charge de référence, l'ordre de sélection, la sélection directe par les enseignants et l'accès en réseau local.",
        why: "Ces choix déterminent ce que la séance de l'étape 3 pourra faire : réglez-les avant d'ouvrir une session.",
        how: [
          "Fixez la charge horaire de référence à laquelle les participants sont comparés. Laissez le champ vide pour n'en avoir aucune : un 0 saisi est un vrai zéro et n'équivaut pas à un champ vide.",
          "Décidez si un ordre de sélection est enregistré et avec quelle rigueur il s'applique, si les enseignants peuvent prendre un poste depuis leur propre espace, et si la vue en réseau local est ouverte.",
          "Seuls les champs réellement modifiés sont envoyés. Un processus Final doit d'abord être rouvert ici, avec un motif écrit ; Archivé est terminal et n'offre rien."
        ]
      },
      planning: {
        what: "L'unique écran où votre configuration devient un plan d'enseignement : ce qui est réellement enseigné, par combien d'enseignants, pour combien d'heures.",
        why: "L'étape 3 ne peut pas commencer tant que ce plan n'est pas équilibré, prouvé réalisable, verrouillé et transformé en postes.",
        how: [
          "Créez le plan d'enseignement s'il n'existe pas encore. Un processus en possède au plus un, et il n'est pas créé avec le processus.",
          "Matérialisez les activités principales depuis la matrice. Le panneau liste chaque cellule comme manquante ou matérialisée, et ne crée que les manquantes.",
          "Ajoutez à la main les activités secondaires : tutorat, co-enseignement, soutien, tâches de département. C'est là que se fait le travail de planification.",
          "Pilotez avec l'en-tête d'équilibre en haut de l'écran. L'objectif est d'amener les deux écarts à 0,00 : les heures de classe face à la dotation, les heures enseignantes face à l'objectif des participants.",
          "Lisez les validations du plan, puis lancez l'évaluation de faisabilité. Réalisable signifie que l'application détient un agencement concret prouvant que les postes peuvent être distribués exactement.",
          "Verrouillez le plan, prévisualisez la génération des besoins, puis appliquez-la pour créer les postes."
        ]
      },
      requirements: {
        what: "Le résultat en lecture seule de la génération : chaque poste enseignant produit par le plan, groupé par activité, avec son propre état de cycle de vie.",
        why: "Un poste est ce que l'étape 3 remet à un enseignant, entier et indivisible : cette page est donc l'endroit où vous vérifiez que la génération a produit ce que vous attendiez.",
        how: [
          "Comparez le nombre et les heures à ce que la prévisualisation de génération avait annoncé.",
          "Lisez l'état de chaque poste : disponible, affecté, obsolète ou réconciliation requise.",
          "Il n'y a volontairement aucune création, modification ni suppression ici. Les postes ne changent que par une génération ou une réconciliation explicite depuis la page Planification."
        ]
      },
      assignments: {
        what: "Le tableau où chaque poste généré est remis en entier à un participant.",
        why: "C'est la répartition elle-même. Le processus est complet quand chaque poste est pris et que chaque participant a atteint son objectif exactement.",
        how: [
          "Appuyez sur Affecter un poste, choisissez un poste libre, puis un participant. Les participants qui ne peuvent pas le prendre sont listés avec le motif plutôt que retirés en silence.",
          "Un poste ne peut pas être divisé : un enseignant à qui il reste trois heures ne se verra jamais proposer un poste de quatre heures.",
          "Annuler libère un poste et Réaffecter le transfère à quelqu'un d'autre. Les deux exigent un motif écrit et un compte Administrateur, et les deux restent au tableau comme historique.",
          "Si tout le tableau refuse les nouvelles affectations, le plan est obsolète ou demande une réconciliation : retournez à la Planification."
        ]
      },
      meeting: {
        what: "Le poste de pilotage d'une séance de sélection en direct, où les enseignants prennent eux-mêmes leurs postes à tour de rôle.",
        why: "C'est l'alternative au fait de tout affecter vous-même : les enseignants choisissent, dans un ordre enregistré, avec le calcul vérifié au fur et à mesure.",
        how: [
          "Au préalable, reliez chaque enseignant à son compte depuis la Liste du personnel enseignant avec un code, et assurez-vous qu'il participe bien à ce processus.",
          "Vérifiez que le plan est à jour et que les postes sont générés, puis choisissez Ouvrir la session. La session reprend les paramètres en vigueur.",
          "Initialisez les tours, puis pilotez-les avec Démarrer, Terminer, Passer et Forcer. Passer et forcer exigent un motif écrit et sont enregistrés.",
          "Fermez la session à la fin de la séance. La fermeture retire aux enseignants l'accès en réseau local à cette séance."
        ]
      },
      teacherView: {
        what: "L'écran propre à un enseignant : ses heures de base, ses heures supplémentaires autorisées, son objectif, ses heures affectées et restantes, ainsi que les postes encore libres.",
        why: "Il montre à un enseignant ses propres chiffres et ceux de personne d'autre, ce qui permet de l'ouvrir sans risque pendant une séance.",
        how: [
          "Si aucun profil n'est encore relié à votre compte, saisissez sous Revendiquer mon profil le code que votre chef de département vous a remis.",
          "Quand c'est votre tour et que la sélection directe est activée, choisissez un poste libre et prenez-le. Le serveur revérifie qu'il correspond exactement à vos heures restantes.",
          "Vous pouvez aussi passer votre propre tour. Cette page ne montre jamais les heures d'un autre enseignant, ni le motif d'une autorisation d'heures supplémentaires."
        ]
      },
      sharedScreen: {
        what: "La vue de projection : les équilibres, l'état du plan, les postes pris et libres, le tour en cours, et le nombre de participants équilibrés, en attente ou en surcharge.",
        why: "Elle permet à toute une salle de suivre la séance sans qu'aucun nom ni aucune heure d'enseignant n'apparaisse au mur.",
        how: [
          "Ouvrez-la sur la machine de projection pendant que la session de séance est ouverte.",
          "Les noms, les heures individuelles et les motifs écrits sont retirés par le serveur lui-même plutôt que masqués par la page : ils ne peuvent donc pas être révélés.",
          "Il n'existe pas de compte de projection distinct : utilisez la session du chef de département ou celle d'un participant."
        ]
      },
      versions: {
        what: "Des instantanés immuables de tout le processus, pris à la demande, et la comparaison entre deux d'entre eux.",
        why: "Un instantané est ce qui permet de revenir plus tard sur une décision, et la comparaison est ce qui rend possible un bilan d'une année sur l'autre.",
        how: [
          "Donnez à l'instantané une courte note expliquant pourquoi vous le prenez. Il capture la dotation, le plan, la matrice, les activités, les postes et les heures de chaque participant.",
          "Comparez deux versions pour obtenir la réponse du serveur lui-même sur neuf dimensions nommées, chacune avec son écart.",
          "Une dimension peut indiquer non comparable, par exemple quand un côté n'a aucune dotation. C'est une vraie réponse, différente de aucun changement."
        ]
      },
      exports: {
        what: "Trois familles de documents distinctes : le plan sous forme de document, des copies stockées de tout le processus, et l'export final strict.",
        why: "C'est ainsi qu'une répartition sort de l'application : sous une forme que vous pouvez envoyer, conserver ou restaurer plus tard.",
        how: [
          "Le brouillon de planification et le plan provisoire sont disponibles quel que soit l'état des équilibres. Seul le plan final est refusé tant qu'un constat bloquant subsiste.",
          "Les documents de processus sont des copies stockées : un brouillon interne, la copie pour la direction, un récapitulatif par enseignant et une sauvegarde complète. La restauration remet une sauvegarde dans un processus brouillon vide.",
          "L'import de planification réinjecte un document de planification dans le plan courant et n'est volontairement pas bloqué par un résultat déséquilibré : vous récupérez l'équilibre et les constats.",
          "L'export final des affectations exige une répartition complète et une faisabilité confirmée, et il archive le processus. Archivé est terminal : une confirmation vous est donc demandée."
        ]
      },
      audit: {
        what: "Le relevé ordonné de ce qui est arrivé à ce processus, et de qui l'a fait.",
        why: "Chaque motif que l'application vous a demandé de saisir est conservé ici. C'est ce qui rend une décision défendable des mois plus tard.",
        how: [
          "Lisez la piste dans l'ordre : création du processus, révisions de dotation, autorisations d'heures supplémentaires, verrouillages du plan, générations, réconciliations, affectations, annulations et réaffectations.",
          "Chaque entrée porte le compte qui l'a effectuée et l'heure à laquelle elle a eu lieu.",
          "Les motifs écrits ne sont visibles que du chef de département. Ils ne sont jamais montrés aux enseignants ni sur l'écran partagé."
        ]
      }
    }
  },
  picker: { noProcesses: "Aucun processus pour le moment.", selectProcess: "Sélectionner un processus", createNew: "Créer un nouveau", createMissingPrerequisite: "Créer le prérequis manquant" }
};
