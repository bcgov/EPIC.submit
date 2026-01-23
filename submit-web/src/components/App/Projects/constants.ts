import { Plan } from "@/models/Plan";

export const defaultPlans: Array<Plan> = [
  {
    id: 1,
    name: "Management Plan 123",
    submittedDate: "2021-10-10",
    submittedBy: "John Doe",
    isCompleted: true,
  },
  {
    id: 2,
    name: "Management Plan 456",
    submittedDate: "2021-10-11",
    submittedBy: "Jane Doe",
    isCompleted: false,
  },
];
