import * as XLSX from 'xlsx';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

type StudentCacheEntry = {
  sen: string;
  name: string;
  cgpa: string;
  studentId?: Id<'students'>;
};

type RecordToSave = {
  sen: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
  grade: string;
  credits: string;
  semester: string;
  cgpa: string;
  batchId: string;
  uploadedAt: number;
};

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeHeader(value: string): string {
  const raw = value.toLowerCase();
  if (/sen|roll|enrol|enrollment/.test(raw)) return 'sen';
  if (/name/.test(raw)) return 'name';
  if (/course\s*code|code/i.test(raw)) return 'courseCode';
  if (/course\s*title|title/i.test(raw)) return 'courseTitle';
  if (/grade/.test(raw)) return 'grade';
  if (/credit/.test(raw)) return 'credits';
  if (/cgpa/.test(raw)) return 'cgpa';
  if (/semester/.test(raw)) return 'semester';
  return raw.replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '');
}

function parseSheetRows(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
  const normalized = rows.map((row) => row.map((value) => normalizeText(value)));
  let headerRowIndex = normalized.findIndex((row) => row.some((cell) => /sen|roll|enrol|enrollment/i.test(cell)));
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  const headerRow = normalized[headerRowIndex] || [];
  const headers = headerRow.map(normalizeHeader);
  const dataRows = normalized.slice(headerRowIndex + 1);

  return dataRows.map((row) => {
    const entry: Record<string, string> = {};
    headers.forEach((key, index) => {
      if (key) {
        entry[key] = normalizeText(row[index]);
      }
    });
    return entry;
  });
}

export const listUploads = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('uploads').withIndex('by_uploadedAt').order('desc').take(1000);
  },
});

export const ingestUpload = mutation({
  args: {
    filename: v.string(),
    bytes: v.string(),
    uploadedBy: v.string(),
  },
  handler: async (ctx, { filename, bytes, uploadedBy }) => {
    const workbook = XLSX.read(bytes, { type: 'base64' });
    const batchId = `batch-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const uploadedAt = Date.now();
    const studentCache: Record<string, StudentCacheEntry> = {};
    const recordsToSave: RecordToSave[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const parsedRows = parseSheetRows(sheet);

      for (const row of parsedRows) {
        const sen = normalizeText(row.sen);
        if (!sen) continue;

        const name = normalizeText(row.name);
        const courseCode = normalizeText(row.courseCode);
        const courseTitle = normalizeText(row.courseTitle);
        const grade = normalizeText(row.grade);
        const credits = normalizeText(row.credits);
        const semester = normalizeText(row.semester);
        const cgpa = normalizeText(row.cgpa);

        if (!courseCode && !grade && !cgpa) {
          continue;
        }

        if (!studentCache[sen]) {
          studentCache[sen] = {
            sen,
            name,
            cgpa: cgpa || '',
          };
        } else if (!studentCache[sen].name && name) {
          studentCache[sen].name = name;
        }
        if (cgpa) {
          studentCache[sen].cgpa = cgpa;
        }

        recordsToSave.push({
          sen,
          studentName: name,
          courseCode,
          courseTitle,
          grade,
          credits,
          semester,
          cgpa,
          batchId,
          uploadedAt,
        });
      }
    }

    for (const [sen, studentData] of Object.entries(studentCache)) {
      const existingStudent = await ctx.db.query('students').withIndex('by_sen', (q) => q.eq('sen', sen)).unique();
      if (existingStudent) {
        await ctx.db.patch(existingStudent._id, {
          name: studentData.name || existingStudent.name,
          cgpa: studentData.cgpa || existingStudent.cgpa || '',
        });
        studentCache[sen].studentId = existingStudent._id;
      } else {
        const newStudent = await ctx.db.insert('students', {
          sen,
          name: studentData.name || '',
          importedAt: uploadedAt,
          password_set: false,
          password_hash: '',
          cgpa: studentData.cgpa || '',
        });
        studentCache[sen].studentId = newStudent;
      }
    }

    for (const record of recordsToSave) {
      const studentEntry = studentCache[record.sen];
      if (!studentEntry?.studentId) {
        continue;
      }
      await ctx.db.insert('records', {
        ...record,
        studentId: studentEntry.studentId,
      });
    }

    await ctx.db.insert('uploads', {
      batchId,
      filename,
      uploadedAt,
      uploadedBy,
      recordCount: recordsToSave.length,
    });

    return true;
  },
});
