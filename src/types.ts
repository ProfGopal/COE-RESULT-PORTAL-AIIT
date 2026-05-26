export type StudentProfile = {
  _id: string;
  sen: string;
  name: string;
  password_set: boolean;
  password_hash: string;
  studentUserId: string;
  cgpa?: string;
};

export type StudentRecord = {
  _id: string;
  sen: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
  grade: string;
  credits: string;
  semester: string;
  cgpa?: string;
  batchId: string;
  uploadedAt: string;
};

export type UploadBatch = {
  _id: string;
  batchId: string;
  filename: string;
  uploadedAt: string;
  uploadedBy: string;
  recordCount: number;
};

export type AuthUser = {
  _id: string;
  role: 'admin' | 'student';
  sen?: string;
  studentId?: string;
  username?: string;
  name?: string;
};
