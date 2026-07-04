import { request } from "../client.js";
import {
  AssignmentDirectChoiceSchema,
  AssignmentPublicSchema,
  type AssignmentDirectChoice,
  type AssignmentPublic
} from "../schemas.js";

export const assignments = {
  directChoice: (processId: string, body: AssignmentDirectChoice) =>
    request<AssignmentPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/assignments/direct-choice`,
      body: AssignmentDirectChoiceSchema.parse(body),
      schema: AssignmentPublicSchema,
      auth: true
    })
} as const;
