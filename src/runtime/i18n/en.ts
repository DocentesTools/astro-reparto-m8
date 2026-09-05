import type { RepartoLocale } from "./types.js";

export const en = {
  locale: "en" as RepartoLocale,
  entity: {
    school: { singular: "School", plural: "Schools", status: {} },
    academicYear: { singular: "Academic year", plural: "Academic years", status: { active: "Active", archived: "Archived" } },
    department: { singular: "Department", plural: "Departments", status: {} },
    teacherRoster: { singular: "Teacher roster entry", plural: "Teacher roster entries", status: {} },
    assignmentProcess: { singular: "Assignment process", plural: "Assignment processes", status: { draft: "Draft", ready_for_meeting: "Ready for meeting", meeting_open: "Meeting open", assigning: "Assigning", department_proposal: "Department proposal", sent_to_school_leadership: "Sent to school leadership", returned_by_school_leadership: "Returned by school leadership", internal_revision: "Internal revision", final: "Final", reopened: "Reopened", archived: "Archived" } },
    subject: { singular: "Subject", plural: "Subjects", status: {} },
    teachingGroup: { singular: "Teaching group", plural: "Teaching groups", status: {} },
    hourRequirement: { singular: "Requirement slot", plural: "Requirement slots", status: { available: "Available", assigned: "Assigned", stale: "Stale", reconciliation_required: "Reconciliation required" } },
    processParticipant: { singular: "Process participant", plural: "Process participants", status: { active: "Active", inactive: "Inactive" } },
    assignment: { singular: "Assignment", plural: "Assignments", status: { active: "Active", cancelled: "Cancelled" } },
    meetingSession: { singular: "Meeting session", plural: "Meeting sessions", status: { prepared: "Prepared", open: "Open", selecting: "Selecting", paused: "Paused", closed: "Closed", reopened: "Reopened" } },
    selectionTurn: { singular: "Selection turn", plural: "Selection turns", status: { pending: "Pending", active: "Active", completed: "Completed", skipped: "Skipped", overridden: "Overridden" } },
    auditEvent: { singular: "Audit event", plural: "Audit events", status: {} },
    version: { singular: "Version", plural: "Versions", status: {} },
    exportArtifact: { singular: "Export artifact", plural: "Export artifacts", status: {} }
  },
  field: {
    name: "Name",
    label: "Label",
    slug: "Slug",
    stage: "Stage",
    grade: "Grade",
    groupCode: "Group code",
    locality: "Locality",
    province: "Province",
    region: "Region",
    address: "Address",
    notes: "Notes",
    displayName: "Display name",
    linkedUser: "Linked user",
    claimCode: "Claim code",
    active: "Active",
    startDate: "Start date",
    endDate: "End date",
    status: "Status",
    previousAcademicYear: "Previous academic year",
    school: "School",
    academicYear: "Academic year",
    department: "Department",
    departmentHead: "Department head",
    baseWeeklyHours: "Base hours",
    extraWeeklyHours: "Authorized extra hours",
    targetWeeklyHours: "Target hours",
    overloaded: "Authorized overload",
    defaultTeacherHoursReference: "Default hours reference",
    selectionOrderEnabled: "Selection order enabled",
    selectionOrderMode: "Selection order mode",
    directTeacherSelectionEnabled: "Direct teacher selection",
    lanAccessEnabled: "LAN access",
    subject: "Subject",
    teachingGroup: "Teaching group",
    teacher: "Teacher",
    hourRequirement: "Requirement slot",
    processParticipant: "Process participant",
    source: "Source",
    reason: "Reason",
    participatesInSelection: "Participates in selection",
    selectionPosition: "Selection position",
    selectionPoints: "Selection points",
    selectionCriteria: "Selection criteria",
    selectionNotes: "Selection notes",
    orderLocked: "Order locked",
    allocationCategory: "Allocation category",
    activityType: "Activity type",
    groupWeeklyHours: "Group hours",
    teacherWeeklyHoursPerPosition: "Teacher hours per position",
    requiredTeacherCount: "Teacher positions"
  },
  option: {
    allocationCategory: { main: "Main", secondary: "Secondary" },
    activityType: { ordinary: "Ordinary", tutoring: "Tutoring", co_teaching: "Co-teaching", support: "Support", department_level: "Department level", other: "Other" },
    boolean: { yes: "Yes", no: "No" }
  },
  view: {
    teacherTitle: "Teacher view",
    claim: {
      title: "Claim your teacher profile",
      intro: "No participation in this process is linked to your account, so there is nothing here to show you. If your department head has prepared a teacher profile for you, ask them for a claim code and enter it below — it binds that profile to the account you are signed in with. If your profile is already linked, ask them to add you to this process instead.",
      codeLabel: "Claim code",
      codePlaceholder: "XXXXX-XXXXX-XXXXX-XXXXX",
      hint: "Case and dashes do not matter.",
      linked: "{name} is now linked to your account."
    },
    lan: {
      title: "Your hours",
      metric: {
        base: "Base",
        extra: "Authorized extra",
        target: "Target",
        assigned: "Assigned",
        remaining: "Remaining"
      },
      overloaded: "{hours} extra hours have been authorized for you.",
      notOverloaded: "No extra hours are authorized for you.",
      connection: {
        disconnected: "Live updates disconnected",
        live: "Live updates connected",
        stale: "Live updates delayed"
      },
      state: {
        pending: "You have not reached your target yet.",
        balanced: "Your assigned hours match your target.",
        overloaded_authorized: "Your target includes authorized extra hours.",
        inactive: "You are not active in this process.",
        not_participating: "You are not part of the selection order."
      },
      availableSlots: "{count} complete position(s) are still free in this process.",
      planBalance: "Group hours {group} against an allocation of {allocation}; teacher load {teacher} against a participant target of {target}.",
      noAllocation: "no allocation yet",
      noPlanBalance: "This process has no teaching plan yet, so there is no balance to show."
    },
    loading: "{entity} loading",
    pageLoading: {
      title: "Loading reparto page",
      description: "Preparing the latest page content."
    },
    unavailable: "{entity} unavailable",
    access: {
      checking: "Checking your access…",
      forbidden: "You do not have access to this page.",
      forbiddenDetail: "This page requires the {role} role or above.",
      role: {
        user: "user",
        reader: "reader",
        writer: "writer",
        admin: "administrator",
        superadmin: "super administrator"
      }
    },
    currentTurn: { status: "Status", turn: "Turn", teacher: "Teacher", started: "Started", waiting: "Waiting", noPosition: "No position", noActiveTurn: "No active turn", notStarted: "Not started", position: "Turn {position}", teacherValue: "Teacher {teacher}" },
    versions: {
      title: "Versions",
      item: "Version {number}",
      itemDetail: "{status} · {created}",
      noReason: "No reason recorded",
      empty: "No version has been captured yet.",
      create: "Create version",
      createReason: "Why this version is being captured (optional)",
      createPending: "Capturing the version…",
      createError: "The version could not be captured.",
      compare: "Compare versions",
      left: "Baseline version",
      right: "Compared version",
      comparison: "Comparison",
      comparisonPending: "Comparing the two versions…",
      comparisonError: "The comparison could not be loaded.",
      noComparison: "No comparison has been run yet.",
      previousYear: "Compare with the previous year",
      noPreviousYear: "This process was not copied from a previous year, so there is nothing to compare it with.",
      source: { versions: "Two captured versions", previous_year: "Previous academic year" },
      blocked: {
        not_enough_versions: "Capture a second version before comparing.",
        same_version: "Choose two different versions."
      },
      noChanges: "No changes",
      changedSummary: "{changed} of {total} comparison dimensions changed.",
      otherChanges: "No comparison dimension changed, but {count} snapshot sections still differ.",
      state: { changed: "Changed", unchanged: "Unchanged" },
      notComparable: "Not comparable",
      notComparableDetail: "One of the two versions has no leadership allocation, so there is no difference to state.",
      sectionsTitle: "Changed snapshot sections",
      dimension: {
        allocation: "Leadership allocation",
        group_hours: "Group teaching hours",
        teacher_load: "Teacher workload",
        subject_category: "Subject category",
        activity: "Teaching activities",
        group_link: "Activity group links",
        teacher_position_count: "Teacher positions",
        participant_target: "Participant targets",
        requirement_generation: "Requirement generation"
      },
      delta: {
        allocation_delta: "Allocation difference",
        group_load_delta: "Group hour difference",
        teacher_load_delta: "Teacher hour difference",
        participant_target_total_delta: "Target hour difference",
        generation_number_delta: "Generation difference",
        teacher_count_delta: "Participant difference",
        activity_count_delta: "Activity difference",
        requirement_count_delta: "Slot difference"
      },
      section: {
        allocationRevisions: "Allocation revisions",
        teachingPlan: "Teaching plan",
        subjects: "Subjects",
        groupSubjects: "Group subjects",
        teachingActivities: "Teaching activities",
        requirements: "Requirement slots",
        processParticipants: "Process participants"
      }
    },
    exports: {
      title: "Export center",
      closeout: "Closeout",
      leadershipWorkflow: "Leadership workflow",
      markReturned: "Mark returned",
      startRevision: "Start revision",
      reopenFinal: "Reopen final",
      type: {
        internal_draft: "Internal draft",
        school_leadership: "School leadership",
        final: "Final",
        teacher_summary: "Teacher summary",
        backup: "Backup"
      },
      documents: {
        title: "Process documents",
        description: "Stored copies of the current process state.",
        action: "Export {document}",
        empty: "No document has been exported yet.",
        item: "{document} · {format}",
        success: "{document} exported.",
        error: "The export failed."
      },
      planning: {
        title: "Planning exports",
        description:
          "The teaching plan as a document. A draft or provisional copy is never withheld because the plan is inexact.",
        mode: {
          draft: "Planning draft",
          provisional: "Provisional plan",
          final: "Final plan"
        },
        modeDescription: {
          draft: "Working copy for the department.",
          provisional: "Shareable copy that says it is not validated.",
          final: "Strict copy, refused while a blocking finding stands."
        },
        action: "Export",
        neverBlocked: "Available whatever the balances say.",
        blocked: {
          plan_missing: "Planning has not started for this process.",
          blocking_validations:
            "Resolve every blocking finding before exporting the final plan."
        },
        feasibilityLabel: "Assignment feasibility: {status}",
        feasibility: {
          not_evaluated: "NOT EVALUATED",
          feasible: "FEASIBLE",
          infeasible: "INFEASIBLE",
          unknown: "UNKNOWN"
        },
        feasibilityMissing: "Assignment feasibility: no plan",
        notValidated: "A provisional document is not a validated plan.",
        resultTitle: "Planning artifact",
        resultSummary: "{mode} artifact generated on {generated}.",
        activities: "{count} activities",
        exact: "Both balances are exact.",
        inexact:
          "The plan is not exact. The artifact carries both balances and every finding.",
        findings: "{blocking} blocking · {warning} warning",
        error: "The planning export failed."
      },
      importPlanning: {
        title: "Planning import",
        description: "Import activities into the current plan. An inexact result is accepted and shown with its follow-up findings.",
        content: "Import JSON",
        placeholder: '{"activities": []}',
        action: "Import planning",
        neverBlocked: "Import is not blocked by an unbalanced result.",
        error: { empty: "Paste a planning import body.", invalid_json: "The content is not valid JSON.", invalid_contract: "The JSON does not match the planning import contract." },
        resultTitle: "Imported plan state",
        resultSummary: "{count} activities imported.",
        reconciliationTitle: "Reconciliation requirements",
        findings: "{blocking} blocking · {warning} warning",
        success: "Planning imported.",
        requestError: "The planning import failed."
      },
      restore: {
        confirmTitle: "Restore this backup into the draft?",
        confirmBody: "The target must be an empty draft. The service validates generation and reconciliation consistency before writing anything.",
        restoreAssignments: "Restore generated positions and assignments",
        confirmAction: "Restore backup",
        blocked: { no_backup: "Create a JSON backup before restoring.", process_not_draft: "Only a draft process can receive a backup." },
        success: "Backup restored.",
        error: "The backup could not be restored."
      },
      final: {
        title: "Final assignment export",
        description:
          "Needs a complete reparto and confirmed feasibility, and archives the process.",
        action: "Export final",
        ready: "Ready to export.",
        blocked: {
          plan_missing: "Planning has not started for this process.",
          requirements_not_generated:
            "No requirement slot has been generated yet.",
          findings_unavailable: "The assignment findings could not be read.",
          assignment_blocking:
            "The reparto is incomplete: {count} blocking finding(s) remain.",
          feasibility_not_confirmed:
            "Assignment feasibility is not confirmed on the current state."
        },
        confirmTitle: "Export and archive?",
        confirmBody:
          "The final export archives the process. Reopening it is the only way back.",
        confirmAction: "Export and archive",
        success: "Final export created.",
        error: "The final export failed."
      }
    },
    choice: {
      title: "Choose a position",
      confirmation: "Confirmation",
      choose: "Take this position",
      pass: "Pass",
      ready: "Ready to take the selected position.",
      noSlots: "No live position is available.",
      position: "Position {position}",
      hours: "{hours} teacher hours",
      impact: "Taking this position assigns {hours} teacher hours to you in full.",
      remainingTarget: "{hours} hours remain before your target.",
      select: "Select",
      selected: "Selected",
      passReasonLabel: "Reason",
      passReasonPlaceholder: "Why you are passing your turn",
      passReasonDefault: "Turn passed by the teacher.",
      passReasonHint: "Passing a turn is audited. Leave this blank to record the default reason.",
      pending: "Working…",
      disabled: {
        meeting_not_open: "The meeting is not open.",
        direct_selection_disabled: "Direct selection is disabled.",
        plan_not_ready: "The plan is not ready for selection yet.",
        reconciliation_required: "An allocation change must be reconciled before selection continues.",
        selection_blocked: "The service is blocking selections right now.",
        not_your_turn: "It is another teacher's turn.",
        no_slot_chosen: "Choose a position first.",
        slot_occupied: "This position is already taken.",
        slot_not_available: "This position is not available for selection.",
        duplicate_activity_position: "You already hold a position of this activity.",
        exceeds_remaining_target: "The whole position does not fit your remaining target hours."
      },
      conflict: {
        state_changed: "The reparto changed. Refresh the meeting state and choose again.",
        refused: "The service refused this choice.",
        not_found: "This position no longer exists.",
        not_allowed: "You are not allowed to make this choice.",
        signed_out: "Your session has expired. Please sign in again.",
        network: "The server is unreachable. Please retry.",
        server: "Something went wrong on our side. Please retry."
      }
    }
  },
  audit: {
    pageTitle: "Reparto audit", description: "Review reparto audit events for the active process.",
    action: { created: "Created", updated: "Updated", deleted: "Deleted", transitioned: "Status changed", reopened: "Reopened", copied_from_previous_year: "Copied from the previous year", direct_choice: "Direct choice recorded", started: "Started", completed: "Completed", skipped: "Skipped", overridden: "Overridden", undone: "Undone", reassigned: "Reassigned", reentered: "Re-entered", recomputed: "Recomputed" },
    entity: { process: "Assignment process", assignment_process: "Assignment process", assignment: "Assignment", subject: "Subject", hour_requirement: "Requirement slot", selection_turn: "Selection turn", teaching_group: "Teaching group", process_teacher: "Process participant" },
    role: { superadmin: "Super administrator", department_head: "Department head", teacher: "Teacher", school_leadership: "School leadership" }, event: "{entity}: {action}"
  },
  requirements: {
    pageTitle: "Generated requirement slots",
    description: "Review the indivisible teacher positions generated from the teaching plan. Generation and reconciliation remain service-owned.",
    statusTitle: "Generation and reconciliation status",
    planUnavailable: "Plan unavailable",
    planStatusSummary: "Plan status: {status}. Current generation: {generation}.",
    planStatus: {
      draft: "Draft",
      unbalanced: "Unbalanced",
      balanced: "Balanced",
      locked: "Locked",
      requirements_generated: "Requirements generated",
      stale: "Stale",
      reconciliation_required: "Reconciliation required"
    },
    generationState: {
      unavailable: "The teaching-plan state is unavailable; generated slots remain read-only.",
      notGenerated: "The plan has not reached requirement generation yet.",
      ready: "The plan is locked and ready for requirement generation.",
      current: "Generated slots are current for the service generation shown below.",
      stale: "The plan changed after generation. Existing slots stay visible while the service prepares reconciliation.",
      reconciliationRequired: "Assigned slots need explicit reconciliation before generation can become current again."
    },
    metric: { activities: "Activities", slots: "Generated slots", available: "Available", assigned: "Assigned", attention: "Needs attention" },
    slotsTitle: "Slots by activity and position",
    slotsDescription: "Each position is complete and indivisible; hours are never edited from this view.",
    empty: "No requirement slots have been generated for this plan yet.",
    unknownActivity: "Unknown teaching activity",
    unknownSubject: "Unknown subject",
    activityLabel: "{subject} · {type}",
    positionCount: "{count} teacher position(s)",
    position: "Position {position}",
    teacherHours: "{hours} teacher hours",
    generationLineage: "Created in generation {created}; validated in generation {validated}.",
    retiredLineage: "Retired in generation {generation}.",
    superseded: "A replacement slot was recorded."
  },
  assignments: {
    pageTitle: "Assignment board",
    description: "Give each complete teacher position to one eligible participant. Slot hours come from generation and are never edited here.",
    metric: { slots: "Live slots", assigned: "Assigned", available: "Available" },
    hoursColumn: "Slot hours",
    teacherHours: "{hours} teacher hours",
    unknownSlotHours: "Slot hours unavailable",
    source: {
      department_head: "Department head",
      teacher_direct: "Teacher direct choice",
      imported_from_previous_year: "Imported from the previous year",
      system_copy: "System copy"
    },
    empty: "No slot has been assigned yet.",
    historyRow: "Cancelled; kept for audit.",
    assignAction: "Assign slot",
    assignTitle: "Assign a requirement slot",
    assignDescription: "Choose one free slot and one eligible participant. The slot is always taken in full.",
    selectSlotFirst: "Choose a slot to see the participants eligible for it.",
    noAssignableSlots: "Every live slot is already assigned.",
    noEligibleTeachers: "No participant is eligible for this slot.",
    safeChoice: {
      loading: "Checking the current deterministic safe-choice plan.",
      current: "Choices are filtered against the current deterministic witness.",
      unavailable: "Safe-choice filtering is unavailable; refresh the administrative feasibility evaluation.",
      not_required: "The plan has no current feasible witness; ordinary server-side assignment rules apply."
    },
    teacherDisabled: {
      participant_inactive: "Not an active participant.",
      duplicate_activity_position: "Already holds a position of this activity.",
      exceeds_remaining_target: "The whole slot does not fit the remaining target hours.",
      strands_remaining_participants: "This choice would leave the remaining reparto without a valid witness.",
      witness_unavailable: "Safe-choice status is unavailable until feasibility is evaluated again."
    },
    notesAction: "Notes",
    notesTitle: "Edit assignment notes",
    undoAction: "Undo",
    undoTitle: "Undo this assignment?",
    undoBody: "{slot} returns to the available slots and {teacher} re-enters the selection queue. The reason is recorded in the audit trail.",
    undoConfirm: "Undo assignment",
    undone: "The assignment was undone and the slot released.",
    undoError: "The assignment could not be undone.",
    selectAllVisible: "Select all visible assignments",
    selectRow: "Select {name}",
    undoSelected: "Undo selected ({count})",
    bulkUndoTitle: "Undo the selected assignments?",
    bulkUndoBody: "One reason is recorded on each of the {count} selected assignments. Their slots return to the available pool and the released teachers re-enter the selection queue. They are undone one at a time and the run stops at the first refusal.",
    bulkUndoConfirm: "Undo {count} assignments",
    bulkUndone: "Assignments undone: {count}.",
    bulkUndoError: "Stopped after undoing {done} of {total} assignments. The ones already undone stay undone.",
    reassignAction: "Reassign",
    reassignTitle: "Reassign this slot",
    reassignBody: "{slot} moves from {teacher} to the replacement you choose, in one operation. The reason is recorded in the audit trail.",
    reassignConfirm: "Reassign slot",
    replacement: "Replacement participant",
    reassigned: "The slot was reassigned.",
    reassignError: "The slot could not be reassigned.",
    validationsTitle: "Assignment validations",
    validationsSummary: "{blocking} blocking and {warnings} warning finding(s).",
    validationsLoading: "Loading assignment validations.",
    validationsUnavailable: "Assignment validations are unavailable.",
    noValidations: "No assignment validation findings."
  },
  planning: {
    pageTitle: "Reparto planning",
    description: "Build and review the teaching plan for the active process.",
    balanceTitle: "Planning balance",
    group: "Group hours",
    teacher: "Teacher hours",
    target: "Target",
    planned: "Planned",
    difference: "Difference",
    loading: "Loading planning balance.",
    unavailable: "Planning balance is unavailable.",
    noPlanYet: "No teaching plan has been created for this process yet, so there is no balance to show.",
    creation: {
      title: "Teaching plan",
      description: "Planning works on a single teaching plan owned by this process.",
      absent: "This process has no teaching plan yet. Create it to start planning; nothing has failed.",
      unavailable: "The teaching plan could not be read.",
      readOnly: "An administrator has to create the teaching plan before planning can start.",
      action: "Create teaching plan",
      pending: "Creating the teaching plan.",
      success: "The teaching plan was created.",
      error: "The teaching plan could not be created.",
      duplicateError: "This process already has a teaching plan."
    },
    materialization: {
      title: "Main-subject activities",
      description: "Review every active main-subject matrix row before creating only the activities that are still missing.",
      missing: "Missing",
      materialized: "Materialized",
      empty: "No active main-subject matrix rows are available.",
      loading: "Loading main-subject materialization state.",
      unavailable: "Main-subject materialization state is unavailable.",
      inherited: "Inherited",
      complete: "All main activities are materialized",
      reviewAction: "Review {count} missing activities",
      confirmTitle: "Materialize missing main activities?",
      confirmBody: "Create {missing} missing activities. The {materialized} activities already materialized are shown for review and will not be duplicated.",
      confirmAction: "Materialize missing activities",
      success: "Created {created} main activities; {skipped} already-materialized rows were skipped.",
      error: "Main activities could not be materialized.",
      state: {
        missing: "Missing",
        materialized: "Materialized",
        out_of_sync: "Out of sync"
      },
      column: {
        subject: "Subject",
        teachingGroup: "Teaching group",
        groupHours: "Group hours",
        teacherHours: "Teacher hours per position",
        teacherCount: "Teacher positions",
        state: "State"
      }
    },
    sync: {
      title: "Out-of-sync main activities",
      description: "Editing a group-subject cell never rewrites the activity it created. Review each difference and apply it explicitly.",
      empty: "Every materialized main activity matches its source cell.",
      loading: "Loading main-activity sync state.",
      unavailable: "Main-activity sync state is unavailable.",
      unknownTeachingGroup: "Unknown teaching group",
      activityLabel: "{subject} — {teachingGroup}",
      reviewAction: "Review differences",
      previewTitle: "Sync {subject} — {teachingGroup}?",
      previewError: "The sync preview could not be loaded.",
      noValueDifferences: "The planning values already match; applying only clears the out-of-sync mark.",
      reconciliationRequired: "Applying changes {count} assigned positions. They are routed through the reconciliation workflow.",
      noAssignmentImpact: "No assigned position is affected.",
      applyAction: "Apply source values",
      applySuccess: "{count} planning values were applied from the source cell.",
      applyError: "The source values could not be applied.",
      staleError: "The planning inputs changed since this preview. Review the differences again.",
      state: {
        in_sync: "In sync",
        out_of_sync: "Out of sync"
      },
      blocked: {
        retirement_required: "The source cell is retired. Use the guarded activity-retirement flow instead of a sync.",
        no_changes: "This activity is already in sync with its source cell."
      },
      column: {
        field: "Planning value",
        current: "Current activity",
        source: "Source cell"
      },
      field: {
        group_weekly_hours_per_group: "Group hours",
        teacher_weekly_hours_per_position: "Teacher hours per position",
        required_teacher_count: "Teacher positions"
      }
    },
    secondary: {
      title: "Secondary activities",
      description: "Add optional tutoring, co-teaching and other activities while keeping group hours and teacher workload independent.",
      createAction: "Add secondary activity",
      createTitle: "Add secondary activity",
      editTitle: "Edit secondary activity",
      formDescription: "Choose one secondary subject, its linked groups, and the actual values used by both planning balances.",
      subject: "Secondary subject",
      activityType: "Activity type",
      groupHours: "Group hours per group",
      teacherHours: "Teacher hours per position",
      teacherCount: "Teacher positions",
      groups: "Linked groups",
      notes: "Notes",
      balanceHint: "Group impact is group hours × linked groups. Teacher impact is teacher hours × teacher positions.",
      multipleGroupsHint: "Select one or more groups. Every selected group receives the same group-hour value.",
      singleGroupHint: "This subject requires exactly one linked group.",
      optionalGroupHint: "This subject permits zero or one linked group.",
      noGroups: "No active group-subject cells are available for this subject.",
      noLinkedGroups: "Department-level activity",
      noSubjects: "Create a secondary subject and its group-subject cells before adding an activity.",
      empty: "No live secondary activities have been added.",
      loading: "Loading secondary activities.",
      unavailable: "Secondary activities are unavailable.",
      created: "Secondary activity created",
      updated: "Secondary activity updated",
      retired: "Secondary activity retired",
      saveError: "The secondary activity could not be saved.",
      retireError: "The secondary activity could not be retired.",
      retireTitle: "Retire secondary activity?",
      retireBody: "Retire the secondary activity for {subject}? It stops counting towards the plan and leaves this list.",
      retireConsequence: "Nothing is deleted: the activity keeps its history and is stamped as retired. Any slot already generated from it needs regeneration, and any slot already assigned needs reconciliation.",
      groupRequiredError: "Select a group for this subject.",
      multipleGroupsError: "This subject does not allow multiple linked groups.",
      duplicateGroupsError: "A group cannot be linked more than once.",
      invalidGroupsError: "Every linked group must be an active cell for the selected subject.",
      teacherCountError: "Teacher positions must be a positive whole number.",
      notesError: "Notes cannot exceed 2000 characters.",
      hoursError: {
        not_a_number: "Enter a decimal hour value.",
        too_many_decimals: "Use at most two decimal places.",
        negative: "Hours cannot be negative.",
        out_of_range: "Hours exceed the supported range."
      },
      type: {
        ordinary: "Ordinary",
        tutoring: "Tutoring",
        co_teaching: "Co-teaching",
        support: "Support",
        department_level: "Department level",
        other: "Other"
      }
    },
    generation: {
      title: "Plan lock and requirement generation",
      description: "Review the authoritative validations and lock state before previewing and generating indivisible teacher-position slots.",
      planLoading: "Loading the teaching plan.",
      planUnavailable: "The teaching plan is unavailable.",
      validationsTitle: "Plan validations",
      validationsDescription: "Blocking and warning findings are read directly from the service and are never inferred from display text.",
      validationsLoading: "Loading plan validations.",
      validationsUnavailable: "Plan validations are unavailable.",
      blocking: "Blocking",
      warnings: "Warnings",
      noValidations: "No plan validation findings.",
      lockTitle: "Lock confirmation",
      lockConfirmed: "The service confirms that this plan passed through the locked lifecycle state.",
      lockReady: "This balanced plan can be locked after you confirm the service validations and current feasibility result.",
      lockUnavailable: "The plan must be balanced and feasible before it can be locked.",
      lockAction: "Review and lock plan",
      lockDisabledValidations: "Wait for the authoritative plan validations before locking.",
      lockDisabledBlocking: "Resolve every blocking plan validation before locking.",
      lockDisabledFeasibility: "Run feasibility successfully for the current plan before locking.",
      lockDisabledStatus: "The plan must be balanced before locking.",
      lockConfirmationTitle: "Confirm plan lock",
      lockConfirmationDescription: "Locking freezes this feasible planning input for requirement generation. Confirm only after reviewing the validation findings above.",
      lockConfirmAction: "Lock plan",
      lockSuccess: "The teaching plan was locked by the service.",
      lockError: "The teaching plan could not be locked.",
      unlockTitle: "Unlock",
      unlockRequired: "Planning changes are refused while the plan is in this state; it has to be unlocked first.",
      unlockConsequence: "Unlocking clears the lock stamp and returns the plan to balanced editing. Requirement generation stays unavailable until it is locked again, and the service re-checks feasibility at that point.",
      unlockAction: "Unlock plan",
      unlockBlockedGeneration: "The service unlocks a locked pre-generation plan only. This plan already has a requirement generation, so use regeneration or the reconciliation workflow instead.",
      unlockReadOnly: "Unlocking a teaching plan is an administrator action.",
      unlockPending: "Unlocking the teaching plan.",
      unlockSuccess: "The teaching plan was unlocked by the service.",
      unlockError: "The teaching plan could not be unlocked.",
      planStatus: "Plan status: {status}. Current generation: {generation}.",
      previewAction: "Preview requirement generation",
      previewDisabled: "Requirement generation is available only for a service-locked or stale plan.",
      previewTitle: "Confirm requirement generation",
      previewSummary: "Generation {generation}: create {create}, preserve {preserve}, retire {retire}, conflicts {conflicts}.",
      previewMetric: {
        create: "Create",
        preserve: "Preserve",
        retire: "Retire",
        conflict: "Conflicts"
      },
      reconciliationRequired: "Assigned slots would change. Use the reconciliation workflow instead; generation cannot be applied.",
      noChanges: "The preview is a no-op. Applying it still records the next deterministic validation generation.",
      confirmAction: "Generate requirement slots",
      previewError: "The requirement-generation preview could not be created.",
      generateError: "Requirement slots could not be generated.",
      success: "Requirement generation applied. {count} live slots are available.",
      resultTitle: "Generation applied",
      resultSummary: "Generation {generation} created {created}, preserved {preserved}, retired {retired}, and now has {count} live slots.",
      totalSlots: "Generated live-slot count"
    },
    feasibility: {
      title: "Feasibility diagnostics",
      description: "Department-head view of the latest bounded evaluation: its status, its findings and the suggested remediation. Findings never leave this tier.",
      planLoading: "Loading the teaching plan.",
      planUnavailable: "The teaching plan is unavailable.",
      noPlan: "Planning has not started for this process, so there is nothing to evaluate.",
      statusTitle: "Latest evaluation",
      evaluatedAt: "Last evaluated: {timestamp}",
      solverVersion: "Solver version: {version}",
      notEvaluated: "No current evaluation exists. Run one after planning edits; every relevant change resets the stored result.",
      evaluatedNone: "The current evaluation reports no findings.",
      diagnosticsLoading: "Loading the evaluation findings.",
      diagnosticsUnavailable: "The evaluation findings are unavailable; a fresh evaluation is required.",
      findingsTitle: "Findings",
      affectedTitle: "Affected",
      affectedSlot: "{activity} · {position}",
      unresolvedReferences: "{count} affected reference(s) cannot be resolved to a current activity or slot.",
      suggestionTitle: "Suggested remediation",
      suggestion: {
        incompatible_residual_totals: "Adjust participant targets or activity hours so the remaining totals match exactly.",
        slot_exceeds_every_target: "Lower the affected activity's hours per position, or raise a participant's target through authorized extra hours.",
        distinct_teacher_shortfall: "Add active participants or lower the affected activity's teacher-position count so every position can have a distinct teacher.",
        unsatisfiable_targets: "Review participant targets and activity hours together: no exact assignment can fill every participant to their target.",
        instance_size_limit: "The instance exceeds the configured solver limits. Reduce participants or slots, or ask the platform administrator to review the limits.",
        step_limit: "Re-run the evaluation. If it stays undetermined, simplify the instance or ask the platform administrator to review the solver budget.",
        time_limit: "Re-run the evaluation. If it stays undetermined, simplify the instance or ask the platform administrator to review the solver budget."
      },
      evaluateAction: "Run feasibility evaluation",
      evaluateDisabledNoPlan: "Create the teaching plan before running an evaluation.",
      evaluateSuccess: "Feasibility evaluation finished: {status}.",
      evaluateError: "The feasibility evaluation could not be run."
    },
    reconciliation: {
      title: "Allocation changes and reconciliation",
      description: "Record immutable allocation revisions, review the stale plan and explicitly resolve every affected assigned slot.",
      allocationFormTitle: "Record a new allocation revision",
      allocationFormDescription: "The previous revision remains in history. The service marks the plan stale and preserves activities, requirements and assignments.",
      allocatedHours: "Allocated group hours",
      source: "Source",
      sourceOption: {
        manual_transcription: "Manual transcription",
        file_import: "File import",
        copied_draft: "Copied draft",
        other: "Other"
      },
      sourceReference: "Source reference",
      allocationReason: "Change reason",
      positiveHoursError: "Allocated hours must be greater than zero.",
      allocationReasonError: "The allocation reason cannot exceed 500 characters.",
      sourceReferenceError: "The source reference cannot exceed 500 characters.",
      recordAllocationAction: "Record allocation revision",
      allocationRecorded: "The allocation revision was recorded. Existing work remains preserved.",
      allocationError: "The allocation revision could not be recorded.",
      allocationHistoryTitle: "Allocation revision history",
      allocationLoading: "Loading allocation revisions.",
      allocationUnavailable: "Allocation revisions are unavailable.",
      noAllocation: "No allocation has been communicated yet.",
      currentAllocation: "Current revision {revision}: {hours} allocated group hours.",
      revision: "Revision",
      state: "State",
      current: "Current",
      superseded: "Superseded",
      historyPreserved: "Every previous allocation revision remains visible and immutable.",
      statusTitle: "Reconciliation status",
      staleState: "The service reports a stale plan. New assignments stay blocked until reconciliation completes.",
      currentState: "The plan does not currently require allocation reconciliation.",
      planStatus: "Plan status: {status}. Current generation: {generation}.",
      assignmentsPreserved: "Existing assignments remain visible and unchanged until you confirm their manual resolution.",
      previewAction: "Preview requirement reconciliation",
      previewDisabled: "Reconciliation is available only when the service reports a stale or reconciliation-required plan.",
      previewTitle: "Confirm manual reconciliation",
      previewSummary: "Generation {generation}: create {create}, preserve {preserve}, retire {retire}, assigned conflicts {conflicts}.",
      previewMetric: {
        create: "Create",
        preserve: "Preserve",
        retire: "Retire",
        conflict: "Assigned conflicts"
      },
      preservedRequirements: "{count} unchanged requirements and their assignments remain preserved.",
      activity: "Activity",
      position: "Position",
      hoursChange: "Hours change",
      manualAction: "Manual resolution",
      unknownActivity: "Unknown activity",
      hoursRemoved: "{current} hours → position removed",
      hoursChanged: "{current} hours → {next} hours",
      resolution: {
        value_changed: "Release the assignment and create the replacement slot",
        removed: "Release the assignment and retire the removed position"
      },
      noConflicts: "No assigned slots require release. Review the unassigned changes before applying.",
      noChanges: "The reconciliation preview contains no changes.",
      reconciliationReason: "Reconciliation reason",
      confirmationWarning: "Confirming records the reason, releases only the listed assignments and keeps their audit history. A changed preview is rejected.",
      confirmAction: "Apply manual reconciliation",
      previewError: "The reconciliation preview could not be created.",
      stalePreviewError: "The reconciliation changed. Preview it again before confirming.",
      reconcileError: "Requirements could not be reconciled.",
      success: "Reconciliation applied. {count} assigned conflicts were explicitly resolved.",
      resultTitle: "Reconciliation applied",
      resultSummary: "Generation {generation} resolved {resolved} conflicts, released {released} assignments, created {created}, preserved {preserved}, retired {retired}, and now has {count} live slots.",
      liveSlots: "Live slots after reconciliation",
      hoursError: {
        not_a_number: "Enter a decimal hour value.",
        too_many_decimals: "Use at most two decimal places.",
        negative: "Hours cannot be negative.",
        out_of_range: "Hours exceed the supported range."
      }
    }
  },
  action: {
    create: "Add",
    edit: "Edit",
    delete: "Delete",
    retire: "Retire",
    archive: "Archive",
    unarchive: "Unarchive",
    close: "Close",
    reopen: "Reopen",
    transition: "Transition",
    save: "Save changes",
    cancel: "Cancel",
    confirm: "Confirm",
    search: "Search",
    filter: "Filter",
    refresh: "Refresh",
    linkUser: "Link to me",
    issueClaimCode: "Issue claim code",
    claimProfile: "Claim my profile",
    copyCode: "Copy code",
    unlinkUser: "Unlink user",
    export: "Export",
    restore: "Restore draft",
    copyFrom: "Copy from previous year",
    startTurn: "Start turn",
    completeTurn: "Complete turn",
    skipTurn: "Skip turn",
    overrideTurn: "Override turn",
    initializeTurns: "Initialize turns",
    openSession: "Open session",
    closeSession: "Close session"
  },
  confirm: {
    delete: { title: "Delete {entity}?", body: "This will permanently delete **{name}**. This action cannot be undone.", proceed: "Delete permanently" },
    archive: { title: "Archive {entity}?", body: "**{name}** will no longer appear in active lists. Existing data is kept and can be reviewed from the archive view.", proceed: "Archive" },
    cancel: "Cancel"
  },
  nav: {
    group: {
      configuration: "Stage 1 · Configuration",
      planning: "Stage 2 · Planning",
      assignment: "Stage 3 · Assignment"
    },
    item: {
      schools: "Schools",
      academicYears: "Academic years",
      departments: "Departments",
      teacherRoster: "Teacher roster",
      dashboard: "Dashboard",
      processes: "Processes",
      teachingGroups: "Teaching groups",
      classroomStages: "Classroom stages",
      groupSubjects: "Group-subject matrix",
      processSettings: "Process settings",
      allocation: "Leadership allocation",
      planningExports: "Planning exports",
      subjects: "Subjects",
      planning: "Planning",
      requirements: "Requirements",
      processParticipants: "Process participants",
      assignments: "Assignments",
      meeting: "Meeting",
      myView: "My view",
      shared: "Shared screen",
      versions: "Versions",
      exports: "Exports",
      audit: "Audit"
    }
  },
  flow: {
    claimCode: {
      title: "Claim code for {name}",
      body: "Give this code to {name}. It works once, expires {expires}, and is shown only now — if it is lost, issue another.",
      copied: "Copied",
      dismiss: "Done"
    },
    bootstrap: {
      title: "Set up your reparto",
      subtitle: "The three stages, from the first record to the meeting.",
      // Every label states the condition `buildSetupChecklist` tests for it —
      // the pair is frozen side by side in `docs/ui-naming-freeze.md` §8.
      step: { school: "Create a school", academicYear: "Create an academic year", department: "Create a department", process: "Create an assignment process", allocation: "Record the leadership hour allocation", participants: "Add process participants and their target hours", subjects: "Add the subjects taught", teachingGroups: "Add the teaching groups", groupSubjects: "Fill the group-subject matrix", configurationReview: "Review the configuration and the selection settings", teachingPlan: "Create the teaching plan", planBalance: "Balance the group hours and the teacher load", planLock: "Lock the teaching plan", requirements: "Generate the requirement slots", meeting: "Hand out the positions in the meeting" },
      done: "Done",
      open: "Open",
      unknown: "Not checked here",
      // The button every step page carries, and the panel it opens. The
      // checklist is a whole-workflow answer, so a step page offers it rather
      // than printing it above the form the reader came for; the dashboard is
      // the one surface it belongs on in full.
      openChecklist: "Setup checklist",
      closeChecklist: "Close the setup checklist",
      checking: "Checking what is done…",
      // The dashboard's progress panel. It reads the same checklist the popup
      // lists, at the altitude a dashboard is read at: how far along, per stage,
      // and the one thing to do next.
      progress: "{done} of {total} done",
      unknownCount: "{count} not checked here",
      next: "Next",
      allDone: "Every step this screen can check is done.",
      reason: {
        "no-process": "Select a process first.",
        "not-observed": "This screen does not read that."
      }
    }
  },
  meeting: {
    title: "Meeting control",
    open: "Selection is open.",
    openDetail: "The plan is current; positions can be handed out.",
    blocked: {
      no_process_data: "No process data has been loaded yet.",
      plan_not_ready: "The plan is not ready for selection yet.",
      reconciliation_required: "An allocation change must be reconciled before selection continues.",
      no_meeting_session: "No meeting session is open."
    },
    lifecycleTitle: "Plan lifecycle",
    lifecycle: {
      open: "Current",
      stale: "Stale",
      reconciliation_required: "Reconciliation required",
      blocked: "Blocked"
    },
    staleDetail: "The plan changed after generation. The service decides what happens to the existing positions.",
    reconciliationDetail: "An allocation change invalidated the plan. Reconcile it before the meeting continues.",
    pendingTitle: "Positions",
    overloadTitle: "Authorized extra hours",
    overloadDetail: "{base} h base + {extra} h authorized = {target} h target",
    noOverloads: "No participant is carrying authorized extra hours.",
    // Why one turn control is closed, as the reason code the button already
    // carried in `data-disabled-reason`. The attribute alone told a test what
    // was wrong and told the head nothing; these are the same codes said out
    // loud next to the button that is refusing.
    actionDisabled: {
      no_process_data: "No process data has been loaded yet.",
      plan_not_ready: "The plan is not ready for selection yet.",
      reconciliation_required: "An allocation change must be reconciled before selection continues.",
      no_meeting_session: "No meeting session is open. Open one to run turns.",
      turn_active: "A turn is already running.",
      no_active_turn: "No turn is running.",
      reason_required: "Give a reason first."
    },
    reasonLabel: "Reason",
    reasonPlaceholder: "Why this turn is skipped or overridden",
    reasonHint: "Skipping or overriding a turn is audited, so it needs a reason.",
    actionPending: "Working…",
    actionFailed: "The turn action failed.",
    session: {
      title: "Meeting session",
      none: "No session open.",
      closeConfirmTitle: "Close the meeting session?",
      closeConfirmBody: "Teachers lose LAN access to this meeting once the session closes.",
      closeConfirmAction: "Close session",
      actionFailed: "The meeting session action failed."
    }
  },
  dashboard: {
    balanceState: { balanced: "Balanced", unbalanced: "Not balanced", unknown: "Unknown" },
    readiness: {
      ready: "Ready",
      not_ready: "Not ready",
      recalculation_required: "Recalculation required"
    },
    feasibility: {
      not_evaluated: "Not evaluated",
      feasible: "Feasible",
      infeasible: "Infeasible",
      unknown: "Undetermined"
    },
    invariant: {
      group: "Group hours",
      teacher: "Teacher load",
      feasibility: "Assignment feasibility",
      readiness: "Readiness"
    },
    title: "Reparto dashboard",
    subtitleAdmin: "Follow both balances, assignment progress, and meeting readiness before the live session.",
    subtitleReadonly: "Project a calm read-only view for the live meeting.",
    pickerLabel: "Current process",
    pickerHint: "Switch process when the route is not locked to a specific id.",
    mode: { admin: "Admin mode", readonly: "Read-only mode" },
    section: {
      planning: "Planning",
      assignment: "Assignment",
      participants: "Participants",
      validations: "Validations",
      checklist: "Setup checklist",
      meetingReadiness: "Meeting readiness"
    },
    metric: {
      totalSlots: "Positions",
      assignedSlots: "Taken",
      availableSlots: "Free",
      targetHours: "Target",
      assignedHours: "Assigned",
      remainingHours: "Remaining",
      blocking: "Blocking",
      balancedParticipants: "Balanced",
      pendingParticipants: "Pending",
      overloadedParticipants: "Overloaded"
    },
    participantState: {
      pending: "Has not reached the target yet.",
      balanced: "Assigned hours match the target.",
      overloaded_authorized: "The target includes authorized extra hours.",
      inactive: "Not active in this process.",
      not_participating: "Not part of the selection order."
    },
    state: {
      noDashboard: "Dashboard data will appear once the process is ready.",
      noPlan: "This process has no teaching plan yet.",
      noTeachers: "Add process participants to see their assignment progress.",
      noValidations: "No findings.",
      summaryOnly: "This view reads the aggregate summary, which carries no per-teacher findings.",
      lockedToRoute: "This route is pinned to the current URL process."
    },
    summary: {
      slotProgress: "{assigned} of {total} positions taken.",
      participantHours: "{assigned} of {target} h, {remaining} h remaining",
      authorizedExtra: "{hours} extra hours authorized.",
      participants: "{count} participant(s) tracked; {overloaded} with authorized extra hours.",
      validations: "{total} blocking finding(s): {planning} in planning, {assignment} in assignment.",
      checklist: "{done} of {total} setup steps complete."
    }
  },
  error: {
    required: "This field is required.",
    requiredNamed: "{field} is required.",
    duplicate: "An entry with this name already exists.",
    duplicateScoped: "An entry with this name already exists in {scope}.",
    fkMissing: "The selected {field} no longer exists. Please pick another.",
    fkViolation: "Cannot delete: {count} item(s) still depend on this entry.",
    hoursInvalid: "Hours must be a positive number.",
    processState: "The process is in {status}; this action is not allowed in that state.",
    permission: "You do not have permission to perform this action.",
    unauthorized: "Your session has expired. Please sign in again.",
    network: "The server is unreachable. Please retry.",
    server: "Something went wrong on our side. Please retry.",
    invalidDate: "Start date must be on or before end date.",
    conflict: "This action conflicts with the current state."
  },
  disabled: {
    noProcess: "Select or create a process first.",
    processClosed: "The process is in {status}; this action is disabled.",
    missingPrereq: "Create the {prereq} first.",
    invalidHours: "Hours are invalid.",
    noData: "No data available yet.",
    noPermission: "You do not have permission."
  },
  table: { noResults: "No results.", searchPlaceholder: "Search...", loading: "Loading...", actions: "Actions", columns: "Columns", all: "All", firstPage: "First page", previousPage: "Previous page", nextPage: "Next page", lastPage: "Last page", page: "Page", rowsPerPage: "Rows per page", searchTeachingGroups: "Search stage, group code, or label...", searchSubjects: "Search name...", searchParticipants: "Search teacher...", searchAssignments: "Search requirement or participant...", searchSchools: "Search name, locality, or province...", searchAcademicYears: "Search label or school...", searchDepartments: "Search name or school...", searchTeacherRoster: "Search teacher..." },
  teachingGroupBulk: {
    action: "Create groups",
    title: "Bulk create teaching groups",
    description: "Create an inclusive teaching group range.",
    groupStart: "Group start",
    groupEnd: "Group end",
    created: "{count} teaching groups created",
    createError: "Teaching groups could not be created"
  },
  groupSubjectBulk: {
    title: "Group-subject bulk editor",
    description: "Preview and confirm one subject across the teaching groups matched by stage and grade.",
    modeLabel: "Operation mode",
    mode: {
      create_missing: "Create missing",
      update_existing: "Update existing",
      upsert: "Create or update"
    },
    allStages: "All stages",
    minimumGrade: "Minimum grade",
    maximumGrade: "Maximum grade",
    groupHours: "Group hours",
    teacherHours: "Teacher hours per position",
    teacherCount: "Teacher positions",
    inheritHint: "Leave an hours field empty to inherit the subject default. Enter 0 for a real zero.",
    previewAction: "Preview changes",
    confirmAction: "Confirm and apply",
    confirmTitle: "Apply group-subject changes?",
    confirmBody: "Apply {count} change(s) from this preview. The server will reject the apply if the matched selection changed.",
    previewTitle: "Bulk preview",
    noMatches: "No teaching groups matched these filters.",
    noChanges: "The preview contains no changes to apply.",
    validationTitle: "Preview validation errors",
    stale: "This preview is stale because the matched teaching groups changed. Preview again before applying.",
    applied: "Created {created} and updated {updated} group-subject row(s).",
    previewError: "The group-subject preview could not be generated.",
    applyError: "The group-subject changes could not be applied.",
    gradeError: "Grades must be positive whole numbers.",
    gradeRangeError: "Minimum grade must be less than or equal to maximum grade.",
    teacherCountError: "Teacher positions must be a positive whole number.",
    hoursError: {
      not_a_number: "Enter a decimal hour value.",
      too_many_decimals: "Use at most two decimal places.",
      negative: "Hours cannot be negative.",
      out_of_range: "Hours exceed the supported range."
    },
    summary: "{create} to create, {update} to update, {unchanged} unchanged, {conflicts} conflict(s).",
    column: {
      action: "Result",
      teachingGroup: "Teaching group",
      groupHours: "Group hours",
      teacherHours: "Teacher hours",
      teacherCount: "Teacher positions",
      reason: "Details"
    },
    rowAction: {
      create: "Create",
      update: "Update",
      unchanged: "Unchanged",
      conflict: "Conflict"
    }
  },
  groupSubjectMatrix: {
    pageTitle: "Group-subject matrix",
    description: "One cell per teaching group and subject, carrying the actual planning values the teaching plan materializes from.",
    addAction: "Add cell",
    createTitle: "Add matrix cell",
    editTitle: "Edit matrix cell",
    empty: "The matrix is empty. Fill it with the bulk editor below, or add a single cell.",
    emptyHint: "Main-subject materialization has no candidate cell until at least one exists.",
    inherited: "Inherited",
    identityHint: "A cell's teaching group and subject are its identity and cannot be changed here.",
    readOnly: "Editing the matrix is a department-head action.",
    search: "Search teaching group or subject...",
    created: "Matrix cell added.",
    updated: "Matrix cell updated.",
    createError: "The matrix cell could not be added.",
    updateError: "The matrix cell could not be updated.",
    selectTeachingGroup: "Select a teaching group",
    selectSubject: "Select a subject"
  },
  allocation: {
    pageTitle: "Leadership allocation",
    description: "The weekly group hours school leadership has communicated to this department. Stage 2 balances the teaching plan against the current revision, so record it before planning starts.",
    panelTitle: "Allocation revisions",
    panelDescription: "Each revision is immutable and keeps its place in the history. Recording a new one after planning has started marks the plan stale and sends it through explicit reconciliation.",
    readOnly: "Recording an allocation revision is a department-head action."
  },
  processSettings: {
    pageTitle: "Process settings",
    description: "How this process will be run: the hours reference participants are measured against, the selection order used at the meeting, and the two surfaces teachers reach on their own.",
    formTitle: "Selection and LAN settings",
    field: {
      defaultTeacherHoursReference: "Default hours reference",
      selectionOrderEnabled: "Selection order enabled",
      selectionOrderMode: "Selection order mode",
      directTeacherSelectionEnabled: "Direct teacher selection",
      lanAccessEnabled: "LAN access"
    },
    hint: {
      defaultTeacherHoursReference: "Leave the field blank for no reference. A typed 0 is a real zero and is not the same as blank.",
      selectionOrderEnabled: "Records a selection order for the meeting; participants then take their positions in that order.",
      selectionOrderMode: "The mode is stored on its own and applies only while the selection order is enabled.",
      modeInert: "The selection order is disabled, so this mode is stored but does not apply.",
      directTeacherSelectionEnabled: "Lets a participant take a position from their own view instead of waiting for their turn to be recorded.",
      lanAccessEnabled: "Opens the read-only view teachers reach over the local network during the meeting."
    },
    mode: { none: "No order", informative: "Informative", strict: "Strict" },
    statusTitle: "Current status",
    statusLine: "Status: {status}.",
    statusOwnedElsewhere: "The status is not a setting: the transition endpoint owns it, and opening a meeting session sets it directly.",
    unchanged: "Nothing has changed, so there is nothing to save.",
    loading: "Loading the process.",
    unavailable: "The process is unavailable.",
    readOnly: "Changing process settings is a department-head action.",
    saved: "Process settings saved.",
    saveError: "The process settings could not be saved.",
    hoursError: {
      not_a_number: "Enter an hour value such as 18 or 18.50.",
      too_many_decimals: "Hours take at most two decimal places.",
      negative: "Hours cannot be negative.",
      out_of_range: "This hour value is too large."
    },
    reopen: {
      title: "Reopen the process",
      frozen: "This process is closed. Configuration, planning and assignment changes are all refused until it is reopened.",
      terminal: "This process is archived. Archiving is terminal, so it cannot be reopened.",
      readOnly: "Reopening a process is a department-head action.",
      reasonLabel: "Reopen reason",
      reasonRequired: "State why the process is being reopened.",
      reasonTooLong: "The reopen reason cannot exceed 500 characters.",
      consequence: "Reopening moves the process to reopened, clears its closing stamp and lets configuration, planning and assignment changes through again. Nothing already recorded is removed, and the reason you give is the only trace of why it was reopened.",
      action: "Reopen process",
      reopened: "The process was reopened.",
      error: "The process could not be reopened."
    }
  },
  teachingGroupSelection: {
    selectAllVisible: "Select all visible teaching groups",
    selectRow: "Select {name}",
    deleteSelected: "Delete selected ({count})",
    deleteTitle: "Delete selected teaching groups",
    deleteBody: "Selected teaching groups to delete: {count}. This action cannot be undone.",
    deleted: "Teaching groups deleted: {count}",
    deleteError: "The selected teaching groups could not be deleted"
  },
  subjectSelection: {
    selectAllVisible: "Select all visible subjects",
    selectRow: "Select {name}",
    deleteSelected: "Delete selected ({count})",
    deleteTitle: "Delete selected subjects",
    deleteBody: "Selected subjects to delete: {count}. This action cannot be undone.",
    deleted: "Subjects deleted: {count}",
    deleteError: "The selected subjects could not be deleted"
  },
  participants: {
    hoursError: {
      not_a_number: "Enter an hour value such as 12 or 12.50.",
      too_many_decimals: "Hours take at most two decimal places.",
      negative: "Hours cannot be negative.",
      out_of_range: "This hour value is too large."
    },
    extraHoursAction: "Extra hours",
    extraHoursTitle: "Authorize extra hours",
    extraHoursBody: "{teacher} has a base of {base} hours and {extra} authorized extra hours, for a target of {target} hours.",
    extraHoursHint: "Set the value back to 0 to withdraw the authorization. Both directions are recorded with your reason.",
    extraHoursConfirm: "Authorize",
    extraHoursSaved: "Authorized extra hours updated.",
    extraHoursError: "The authorized extra hours could not be changed",
    lastExtraHoursReason: "Last recorded reason: {reason}",
    noExtraHoursReason: "No extra-hours change has been recorded yet.",
    targetHint: "Target hours are base plus authorized extra; they are not edited directly.",
    overloadedYes: "Yes",
    overloadedNo: "No"
  },
  participantSelection: {
    selectAllVisible: "Select all visible participants",
    selectRow: "Select {name}",
    deleteSelected: "Delete selected ({count})",
    deleteTitle: "Delete selected participants",
    deleteBody: "Selected participants to delete: {count}. This action cannot be undone.",
    deleted: "Participants deleted: {count}",
    deleteError: "The selected participants could not be deleted"
  },
  classroomStages: {
    pageTitle: "Classroom stages",
    pageDescription: "Manage global classroom stage reference data.",
    formDescription: "Global classroom reference data.",
    createTitle: "Create classroom stage",
    editTitle: "Edit classroom stage",
    deleteTitle: "Delete classroom stage",
    deleteBody: "Delete {name}?",
    field: { stage: "Stage", shortLabel: "Short label", minGrade: "Minimum grade", maxGrade: "Maximum grade" },
    column: { created: "Created", updated: "Updated" },
    state: { unauthorized: "Administrator access required.", empty: "No classroom stages found.", loading: "Loading classroom stages...", unavailable: "Classroom stages unavailable." },
    search: "Search classroom stages",
    toast: { created: "Classroom stage created", updated: "Classroom stage updated", saveError: "Classroom stage could not be saved", deleted: "Classroom stage deleted", deleteError: "Classroom stage could not be deleted" }
  },
  /**
   * Per-step guidance for the `?` button every route carries.
   *
   * The copy is written for somebody opening the application for the first
   * time, and it is the same material as the host-side Reparto Docente guide:
   * `what` names the page, `why` says what depends on it, and `how` is the
   * ordered list of things to actually do. A step's heading is not repeated
   * here — it comes from `nav.item.*`, so the help panel and the menu cannot
   * drift apart.
   */
  help: {
    open: "What do I do here?",
    // The stage line for the two routes that report on the workflow rather than
    // advance it. Every other route borrows `nav.group.*`.
    overview: "Overview",
    close: "Hide this help",
    openFor: "Open the help for {step}",
    what: "What this page is",
    why: "Why it matters",
    how: "How to do it",
    docs: "Read the full guide",
    step: {
      processList: {
        what: "An assignment process is one department, in one school, for one academic year. Everything else in this application belongs to a process, so a year of work starts here.",
        why: "Nothing further down the menu can be opened until a process is selected: those pages have nothing to show you without one.",
        how: [
          "Pick the academic year, then the school, then the department. Your choice is remembered in this browser, so you only make it once.",
          "If what you need does not exist yet, choose Create new. The year, the school and the department can all be created from this one screen.",
          "A new process starts in Draft. You never set the status by hand; it moves on its own as the work progresses.",
          "Once a process is selected, work straight down the menu: Stage 1, then Stage 2, then Stage 3."
        ]
      },
      dashboard: {
        what: "One view of where this process stands: the setup checklist, the two hour balances, and what is still missing.",
        why: "It is the quickest way to answer what do I still have to do, without walking every page to find out.",
        how: [
          "Read the setup checklist first. It names every Stage 1 item that is still open.",
          "Check both balances. Group hours and teacher hours are two separate measurements and are never added together.",
          "Follow the first unfinished checklist item through to the page that closes it."
        ]
      },
      schools: {
        what: "The schools this site knows about. A school is shared by the whole site, not by one process.",
        why: "An academic year, a department and therefore a process all hang off a school, so nothing else can be created until one exists.",
        how: [
          "Check whether your school is already here before creating it. These records are shared by everybody.",
          "Create it with its name. Locality, province, region, address and notes are optional.",
          "Creating and editing a school needs an Administrator account; anybody may read the list."
        ]
      },
      academicYears: {
        what: "A school year, such as 2026/2027, with a start date and an end date. A year belongs to one school.",
        why: "A process is one department, in one school, for one year, and the link to the previous year is what makes a year-on-year comparison possible.",
        how: [
          "Choose the school, give the year a label, and set its start and end dates.",
          "Point it at the previous year when there is one. That link is what copy from last year and the previous-year comparison use.",
          "A finished year is archived, never deleted, so its record stays intact."
        ]
      },
      departments: {
        what: "A teaching department inside a school: the group of teachers whose weekly hours this application shares out.",
        why: "The department is the third part of a process, alongside the school and the academic year.",
        how: [
          "Choose the school, then give the department a name and a short slug.",
          "The department head field is descriptive only. It records who leads the department and grants no permission whatsoever.",
          "What an account may do comes from its role, never from this field."
        ]
      },
      classroomStages: {
        what: "The levels of schooling your classes belong to, for example Secundaria with the short label ESO and grades 1 to 4.",
        why: "A class name is built from its stage, so getting the stages right once keeps every class named consistently afterwards.",
        how: [
          "Give the stage a name, the short label used inside class names, and its lowest and highest grade.",
          "A class label is then generated from the grade, the short label and the group code together, giving 3rd ESO B.",
          "Anybody may read the stages; creating and editing them needs an Administrator account."
        ]
      },
      teacherRoster: {
        what: "The list of teaching staff this site knows about. It is deliberately separate from the site user accounts.",
        why: "A roster entry is what you later add to a process as a participant, and linking it to an account is what lets that teacher use My view during a meeting.",
        how: [
          "Create one entry per teacher with a display name. Mark somebody who has left as inactive rather than deleting them.",
          "To link a teacher to their account, choose Issue claim code on their row. The code is shown once, works once and expires, so hand it to that teacher privately.",
          "The teacher signs in with their own account, opens My view and enters the code. You never pick an account on their behalf.",
          "If a code is lost, issue another one. The old code cannot be displayed again."
        ]
      },
      allocation: {
        what: "The weekly group hours school leadership has given your department: the figure the whole plan has to add up to. Before the first revision is recorded the page is simply empty, which is normal for a new process rather than an error.",
        why: "It is one of the two totals Stage 2 balances against, so there is nothing to plan towards until it is recorded.",
        how: [
          "Enter the allocated weekly group hours, greater than zero and at most two decimals, together with a written reason. The reason is required and kept permanently.",
          "There is no edit and no delete. To change the figure you record a new revision, which supersedes the previous one and keeps it visible as history.",
          "Recording a revision after planning has started makes the plan stale and forces an explicit reconciliation, so do it deliberately."
        ]
      },
      participants: {
        what: "The teachers taking part in this particular process, each with their contracted weekly load.",
        why: "The sum of every active participant target is the teacher-hours total the plan has to hit exactly: not one hour more, not one hour less.",
        how: [
          "Add each teacher from the roster and set their base hours, meaning their contracted weekly teaching load.",
          "Target hours are calculated for you as base plus authorized extra, and cannot be typed in.",
          "Authorized extra hours start at zero and change only through the separate action that requires a written reason, in both directions, including withdrawing one.",
          "Say whether each participant takes a turn in the meeting, and in what position."
        ]
      },
      subjects: {
        what: "What is taught, together with the default hours each one usually carries.",
        why: "Main subjects are the mandatory input Stage 2 turns into activities; secondary ones are the discretionary additions you make by hand.",
        how: [
          "Give each subject a name and an allocation category, Main or Secondary. There is no is-main checkbox: the category is the distinction.",
          "Set the default group hours, the default teacher hours per position, and the default number of teacher positions.",
          "The activity type is a descriptive label only. It never changes how the application behaves.",
          "Defaults only seed new matrix cells. Changing one later never rewrites cells or activities that already exist."
        ]
      },
      teachingGroups: {
        what: "The classes themselves, each with its stage, its grade and its group code.",
        why: "A class is one half of every matrix cell, and the matrix is what the entire plan is built from.",
        how: [
          "Create a class with its classroom stage, its grade and its group code. The label is generated for you until you change it by hand.",
          "To create a whole level at once use Create groups: pick a stage, a grade and a range of group codes, preview the exact list, then create them together in one request.",
          "The grades you may choose are limited to the range of the stage you picked."
        ]
      },
      groupSubjects: {
        what: "One cell for every class-and-subject pair that actually exists, carrying the real hours that pair is worth.",
        why: "This is the heart of Stage 1: the matrix is precisely what Stage 2 turns into the teaching plan.",
        how: [
          "Each cell holds group hours, teacher hours per position and teacher positions. Leave an hours field empty to inherit the subject default; enter 0 for a real zero.",
          "Filling thirty cells one at a time is slow, so use the bulk editor below the list: pick one subject, choose the operation mode, then narrow the classes by stage and grade range.",
          "Press Preview changes and read what it will create, update and leave alone. Only then does Confirm and apply become available.",
          "If anything changed between the preview and the apply, the apply is refused. Preview again rather than pressing apply a second time."
        ]
      },
      processSettings: {
        what: "How this process will be run: the reference load, the selection order, direct teacher selection, and local-network access.",
        why: "These choices decide what the Stage 3 meeting is able to do, so settle them before opening a session.",
        how: [
          "Set the default hours reference participants are measured against. Leave it blank for none: a typed 0 is a real zero and is not the same as blank.",
          "Decide whether a selection order is recorded and how strictly it applies, whether teachers may take a position from their own view, and whether the local-network view is open.",
          "Only the fields you actually changed are sent. A Final process must be reopened here first, with a written reason; Archived is terminal and offers nothing."
        ]
      },
      planning: {
        what: "The one screen where your configuration becomes a teaching plan: what is actually taught, by how many teachers, for how many hours.",
        why: "Stage 3 cannot start until this plan is balanced, proven feasible, locked, and turned into positions.",
        how: [
          "Create the teaching plan if it does not exist yet. A process owns at most one, and it is not created with the process.",
          "Materialise the main activities from the matrix. The panel lists every cell as missing or materialized, and creates only the missing ones.",
          "Add the secondary activities, such as tutoring, co-teaching, support and department duties, by hand. Deciding those is the planning work.",
          "Steer by the balance header at the top. Your goal is both differences at 0.00: group hours against the allocation, teacher hours against the participant target.",
          "Read the plan validations, then run the feasibility evaluation. Feasible means the application holds a concrete arrangement proving the positions can be handed out exactly.",
          "Lock the plan, preview the requirement generation, and apply it to create the positions."
        ]
      },
      requirements: {
        what: "The read-only result of generation: every teacher position the plan produced, grouped by activity, each with its own lifecycle state.",
        why: "A position is what Stage 3 hands to one teacher, whole and unsplit, so this page is where you confirm generation produced what you expected.",
        how: [
          "Check the count and the hours against what the generation preview promised.",
          "Read each position state: available, assigned, stale, or reconciliation required.",
          "There is deliberately no create, edit or delete here. Positions change only through generation or an explicit reconciliation on the Planning page."
        ]
      },
      assignments: {
        what: "The board where each generated position is handed to one participant, in full.",
        why: "This is the sharing-out itself. The process is complete when every position is held and every participant has reached their target exactly.",
        how: [
          "Press Assign slot, choose a free position, then a participant. Participants who cannot take it are listed with the reason rather than quietly dropped.",
          "A position cannot be split, so a teacher with three hours left is never offered a four-hour position.",
          "Undo releases a position and Reassign moves it to somebody else. Both need a written reason and an Administrator account, and both stay on the board as history.",
          "If the whole board refuses new assignments, the plan is stale or needs reconciliation, so go back to Planning."
        ]
      },
      meeting: {
        what: "The control room for a live selection meeting, in which teachers take their own positions in turn.",
        why: "It is the alternative to assigning everything yourself: teachers choose, in a recorded order, with the arithmetic checked as they go.",
        how: [
          "Beforehand, link each teacher to their account from the Teacher roster with a claim code, and make sure they are participants in this process.",
          "Check the plan is current and the positions are generated, then choose Open session. The session carries the current settings forward.",
          "Initialize the turns, then drive them with Start, Complete, Skip and Override. Skipping and overriding require a written reason and are recorded.",
          "Close the session when the meeting is over. Closing removes teacher access to it over the local network."
        ]
      },
      teacherView: {
        what: "A teacher own screen: their base, authorized extra, target, assigned and remaining hours, and the positions still free.",
        why: "It shows one teacher their own figures and nobody else, which is what makes it safe to open during a meeting.",
        how: [
          "If no profile is linked to your account yet, enter the claim code your department head gave you under Claim my profile.",
          "When it is your turn and direct selection is enabled, choose a free position and take it. The server rechecks that it fits your remaining hours exactly.",
          "You may also pass your own turn. This page never shows another teacher hours, nor the reason behind an extra-hours authorization."
        ]
      },
      sharedScreen: {
        what: "The projector view: the balances, plan readiness, positions taken and free, the current turn, and how many participants are balanced, pending or overloaded.",
        why: "It lets a whole room follow the meeting without any teacher name or hours appearing on the wall.",
        how: [
          "Open it on the projected machine while the meeting session is open.",
          "Names, per-teacher hours and written reasons are removed by the server itself rather than hidden by the page, so they cannot be revealed.",
          "There is no separate projector account: use the department head session, or a participant one."
        ]
      },
      versions: {
        what: "Immutable snapshots of the whole process, taken whenever you ask for one, and the comparison between two of them.",
        why: "A snapshot is how you come back to a decision later, and the comparison is what makes a year-on-year review possible.",
        how: [
          "Give the snapshot a short note saying why you are taking it. It captures the allocation, the plan, the matrix, the activities, the positions and each participant hours.",
          "Compare two versions to get the server own answer across nine named dimensions, each with its difference.",
          "A dimension may read not comparable, for instance when one side has no allocation at all. That is a real answer, and not the same as no change."
        ]
      },
      exports: {
        what: "Three different families of document: the plan as a document, stored copies of the whole process, and the strict final export.",
        why: "This is how a reparto leaves the application, as something you can send, keep, or restore later.",
        how: [
          "The planning draft and the provisional plan are available whatever the balances say. Only the final plan is refused while a blocking finding stands.",
          "Process documents are stored copies: an internal draft, the leadership copy, a per-teacher summary and a full backup. Restore puts a backup back into an empty draft process.",
          "Planning import takes a planning document back into the current plan and is deliberately not blocked by an unbalanced result, so you get the balance and the findings back.",
          "The final assignment export needs a complete reparto and confirmed feasibility, and it archives the process. Archived is terminal, so it asks you to confirm."
        ]
      },
      audit: {
        what: "The ordered record of what happened to this process, and who did it.",
        why: "Every reason the application asked you to type is stored here. It is what makes a decision defensible months later.",
        how: [
          "Read the trail in order: process creation, allocation revisions, extra-hour authorizations, plan locks, generations, reconciliations, assignments, undos and reassignments.",
          "Each entry carries the account that performed it and the time it happened.",
          "Written reasons are visible to the department head alone. They are never shown to teachers or on the shared screen."
        ]
      }
    }
  },
  // The no-process gate every process-scoped route falls back to. It selects;
  // it does not create — creating an assignment process is the process list's
  // own job, and the gate links there rather than growing a second form.
  picker: { noProcesses: "No processes yet.", selectProcess: "Select a process", createNew: "Create new", createMissingPrerequisite: "Create missing prerequisite", gateTitle: "No process selected", gateHint: "Pick the process this page should report on.", gateEmptyHint: "Nothing to report on yet — an assignment process comes first.", gateCreate: "Create an assignment process" }
};

export const enLocale: RepartoLocale = "en";
