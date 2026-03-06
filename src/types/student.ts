export type Student = {
  id: number;
  name: string;
  email: string;
  type: "junior" | "senior";
  class_id?: number;
  school_id?: number;
};
