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
    classroom: { singular: "Classroom", plural: "Classrooms", status: {} },
    hourRequirement: { singular: "Hour requirement", plural: "Hour requirements", status: {} },
    processParticipant: { singular: "Process participant", plural: "Process participants", status: { active: "Active", inactive: "Inactive" } },
    assignment: { singular: "Assignment", plural: "Assignments", status: { draft: "Draft", confirmed: "Confirmed", overridden: "Overridden", cancelled: "Cancelled" } },
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
    active: "Active",
    startDate: "Start date",
    endDate: "End date",
    status: "Status",
    previousAcademicYear: "Previous academic year",
    school: "School",
    academicYear: "Academic year",
    department: "Department",
    departmentHead: "Department head",
    requiredHours: "Required hours",
    availableHours: "Available hours",
    assignedHours: "Assigned hours",
    defaultTeacherHoursReference: "Default hours reference",
    selectionOrderEnabled: "Selection order enabled",
    selectionOrderMode: "Selection order mode",
    directTeacherSelectionEnabled: "Direct teacher selection",
    lanAccessEnabled: "LAN access",
    subject: "Subject",
    classroom: "Classroom",
    teacher: "Teacher",
    hourRequirement: "Hour requirement",
    processParticipant: "Process participant",
    requirementType: "Type",
    assignmentType: "Type",
    source: "Source",
    flags: "Flags",
    participatesInSelection: "Participates in selection",
    selectionPosition: "Selection position",
    selectionPoints: "Selection points",
    selectionCriteria: "Selection criteria",
    selectionNotes: "Selection notes",
    orderLocked: "Order locked",
    overrideReason: "Override reason"
  },
  option: {
    requirementType: { ordinary: "Ordinary", optional: "Optional", reinforcement: "Reinforcement", split_group: "Split group", bilingual: "Bilingual", other: "Other" },
    assignmentType: { main: "Main", shared: "Shared", reinforcement: "Reinforcement", split_group: "Split group", other: "Other" },
    boolean: { yes: "Yes", no: "No" }
  },
  view: {
    teacherTitle: "Teacher view",
    loading: "{entity} loading",
    unavailable: "{entity} unavailable",
    currentTurn: { status: "Status", turn: "Turn", teacher: "Teacher", started: "Started", waiting: "Waiting", noPosition: "No position", noActiveTurn: "No active turn", notStarted: "Not started", position: "Turn {position}", teacherValue: "Teacher {teacher}" },
    versions: { title: "Versions", item: "Version {number}", comparison: "Comparison", noChanges: "No changes", requiredDelta: "Required delta", assignedDelta: "Assigned delta", teacherDelta: "Teachers", create: "Create version", compare: "Compare versions" },
    exports: { title: "Export center", finalBlocked: "Final blocked", finalReady: "Final ready", closeout: "Closeout", finalExport: "Final export", leadershipWorkflow: "Leadership workflow", markReturned: "Mark returned", startRevision: "Start revision", reopenFinal: "Reopen final", type: { internal_draft: "Internal draft", school_leadership: "School leadership", final: "Final", teacher_summary: "Teacher summary", backup: "Backup" } },
    choice: { title: "Choose group", confirmation: "Confirmation", choose: "Choose", pass: "Pass", ready: "Ready to choose.", impact: "{hours} hours will be assigned to you.", meetingClosed: "The meeting is not open.", directDisabled: "Direct selection is disabled.", otherTurn: "It is another teacher's turn.", covered: "The requirement is already covered.", alreadyCovered: "This requirement was already covered.", turnChanged: "The active turn changed. Refresh the meeting state." }
  },
  validation: {
    title: { requirement: "Requirement warning", teacher: "Teacher warning", process: "Process warning" },
    requirement: { overAssigned: "Requirement {subject} for {group} is over-assigned ({assigned} h assigned for {required} h required).", overAssignedOverridden: "Requirement {subject} for {group} is over-assigned, but an override has been recorded.", uncovered: "Requirement {subject} for {group} has no assignment yet.", partial: "Requirement {subject} for {group} is partially covered ({pending} h still pending).", covered: "Requirement {subject} for {group} is fully covered." },
    teacher: { overloaded: "{teacher} is overloaded ({assigned} h assigned for {available} h available).", overloadedOverridden: "{teacher} is overloaded, but an override has been recorded.", balanced: "{teacher} has a balanced workload." },
    process: { balanced: "Process hours are balanced.", pending: "{count} requirement(s) still need hours.", overage: "The process has unresolved over-assignments." }
  },
  audit: {
    pageTitle: "Reparto audit", description: "Review reparto audit events for the active process.",
    action: { created: "Created", updated: "Updated", deleted: "Deleted", transitioned: "Status changed", reopened: "Reopened", copied_from_previous_year: "Copied from the previous year", direct_choice: "Direct choice recorded", started: "Started", completed: "Completed", skipped: "Skipped", overridden: "Overridden" },
    entity: { process: "Assignment process", assignment_process: "Assignment process", assignment: "Assignment", subject: "Subject", hour_requirement: "Hour requirement", selection_turn: "Selection turn", teaching_group: "Classroom", process_teacher: "Process participant" },
    role: { superadmin: "Super administrator", department_head: "Department head", teacher: "Teacher", school_leadership: "School leadership" }, event: "{entity}: {action}"
  },
  action: {
    create: "Create",
    edit: "Edit",
    delete: "Delete",
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
    linkUser: "Link user",
    unlinkUser: "Unlink user",
    export: "Export",
    restore: "Restore draft",
    copyFrom: "Copy from previous year",
    startTurn: "Start turn",
    completeTurn: "Complete turn",
    skipTurn: "Skip turn",
    overrideTurn: "Override turn",
    initializeTurns: "Initialize turns"
  },
  confirm: {
    delete: { title: "Delete {entity}?", body: "This will permanently delete **{name}**. This action cannot be undone.", proceed: "Delete permanently" },
    archive: { title: "Archive {entity}?", body: "**{name}** will no longer appear in active lists. Existing data is kept and can be reviewed from the archive view.", proceed: "Archive" },
    cancel: "Cancel"
  },
  nav: {
    group: { setup: "Setup", process: "Process" },
    item: {
      schools: "Schools",
      academicYears: "Academic years",
      departments: "Departments",
      teacherRoster: "Teacher roster",
      dashboard: "Dashboard",
      processes: "Processes",
      classrooms: "Classrooms",
      subjects: "Subjects",
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
    bootstrap: {
      title: "Set up your reparto",
      subtitle: "A few steps before you can run the meeting.",
      step: { school: "Create a school", academicYear: "Create an academic year", department: "Create a department", process: "Create a process", subjects: "Add subjects", classrooms: "Add classrooms", teacherRoster: "Add teachers", requirements: "Add hour requirements", participants: "Add process participants" },
      done: "Done",
      open: "Open"
    }
  },
  dashboard: {
    balanceState: { balanced: "Balanced", pending: "Pending", exceeded: "Exceeded", warning: "Warning" },
    title: "Reparto dashboard",
    subtitleAdmin: "Follow balance, coverage, and meeting readiness before the live session.",
    subtitleReadonly: "Project a calm read-only view for the live meeting.",
    pickerLabel: "Current process",
    pickerHint: "Switch process when the route is not locked to a specific id.",
    mode: { admin: "Admin mode", readonly: "Read-only mode" },
    section: {
      overview: "Overview",
      teacherLoad: "Teacher load",
      classroomCoverage: "Classroom coverage",
      validations: "Validations",
      checklist: "Setup checklist",
      meetingReadiness: "Meeting readiness"
    },
    metric: {
      required: "Required",
      assigned: "Assigned",
      available: "Available",
      pending: "Pending",
      blocking: "Blocking",
      participants: "Participants",
      requirements: "Requirements"
    },
    state: {
      noDashboard: "Dashboard data will appear once the process is ready.",
      noTeachers: "Add process participants to see teacher balance.",
      noRequirements: "Add requirements to see classroom coverage.",
      noValidations: "No blocking validations.",
      lockedToRoute: "This route is pinned to the current URL process."
    },
    summary: {
      balance: "{assigned} of {required} hours assigned. {pending} hours still pending.",
      teacherLoad: "{count} participant(s) tracked; {overloaded} overloaded.",
      classroomCoverage: "{count} requirement(s), {uncovered} uncovered.",
      validations: "{blocking} blocking validation(s) and {total} total message(s).",
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
    hoursExceed: "Total assigned hours ({assigned}) exceed required hours ({required}). Provide an override reason.",
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
  table: { noResults: "No results.", searchPlaceholder: "Search...", loading: "Loading...", actions: "Actions", columns: "Columns", all: "All", firstPage: "First page", previousPage: "Previous page", nextPage: "Next page", lastPage: "Last page", page: "Page", rowsPerPage: "Rows per page", searchClassrooms: "Search stage, group code, or label...", searchSubjects: "Search name or stage...", searchRequirements: "Search classroom or subject...", searchParticipants: "Search teacher...", searchAssignments: "Search requirement or participant...", searchSchools: "Search name, locality, or province...", searchAcademicYears: "Search label or school...", searchDepartments: "Search name or school...", searchTeacherRoster: "Search teacher..." },
  picker: { noProcesses: "No processes yet.", selectProcess: "Select a process", createNew: "Create new", createMissingPrerequisite: "Create missing prerequisite" }
};

export const enLocale: RepartoLocale = "en";
