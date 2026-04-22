import ExcelJS from "exceljs";
import type { Teacher, ScheduleSlot, Grade } from "@shared/schema";
import type { ScheduleSlotData } from "@/types/schedule";
import type { ClassScheduleSlot } from "@/components/ClassScheduleTable";
import { DAYS, getSubjectDisplayName } from "@shared/schema";
import { TemplateManager } from "./templateManager";
import { getActivePeriods, getPeriodsCount } from "./scheduleConfig";

// قالب القوالب الجديدة:
// - عنوان مدمج في B3:I4 (الصف 3 العمود 2)
// - رؤوس الحصص في الصف 5، الأعمدة C-I (الأعمدة 3-9)
// - أيام الأسبوع: الصفوف 6-10، تسميات الأيام في العمود B (العمود 2)
// - بيانات الجدول: الأعمدة 3-9 (C-I) للحصص 1-7
const TITLE_ROW = 3;
const TITLE_COL = 2;
const FIRST_DATA_ROW = 6;
const FIRST_PERIOD_COL = 3;
const TEMPLATE_PERIODS = 7;

async function loadActiveTemplate(): Promise<ArrayBuffer> {
  const activeTemplate = TemplateManager.getActiveTemplate();
  if (!activeTemplate) {
    const defaultTemplate = TemplateManager.getBuiltInTemplates()[0];
    const blob = await TemplateManager.getTemplateFile(defaultTemplate);
    return await blob.arrayBuffer();
  }
  const blob = await TemplateManager.getTemplateFile(activeTemplate);
  return await blob.arrayBuffer();
}

// حذف أعمدة الحصص الزائدة من القالب لتطابق عدد الحصص الفعلي
function trimWorksheetPeriods(worksheet: ExcelJS.Worksheet, periodsCount: number) {
  if (periodsCount >= TEMPLATE_PERIODS) return;
  const toRemove = TEMPLATE_PERIODS - periodsCount;
  // الأعمدة المراد حذفها (من اليمين): تبدأ من العمود (FIRST_PERIOD_COL + periodsCount)
  const startCol = FIRST_PERIOD_COL + periodsCount;
  worksheet.spliceColumns(startCol, toRemove);
}

export async function exportMasterScheduleExcel(
  teachers: Teacher[],
  slots: ScheduleSlot[],
  _teacherNotes?: Record<string, string>
) {
  try {
    const PERIODS = getActivePeriods();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("الجدول الرئيسي", {
      views: [{ rightToLeft: true }],
      pageSetup: { orientation: "landscape", paperSize: 8, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    // الصف الأول: عنوان
    worksheet.getRow(1).getCell(1).value = "الجدول الرئيسي - جميع المعلمين";
    worksheet.getRow(1).getCell(1).font = { bold: true, size: 14 };

    // الصف الثاني: رؤوس الأعمدة
    const headerRow = worksheet.getRow(2);
    headerRow.getCell(1).value = "اسم المعلم";
    headerRow.getCell(2).value = "المادة";
    let col = 3;
    DAYS.forEach((day) => {
      PERIODS.forEach((period) => {
        const c = headerRow.getCell(col);
        c.value = `${day} - ${period}`;
        c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        c.font = { bold: true };
        col++;
      });
    });
    headerRow.getCell(col).value = "مجموع الحصص";
    headerRow.getCell(col + 1).value = "10";
    headerRow.getCell(col + 2).value = "11";
    headerRow.getCell(col + 3).value = "12";
    headerRow.font = { bold: true };

    // صفوف بيانات المعلمين
    teachers.forEach((teacher, idx) => {
      const row = worksheet.getRow(idx + 3);
      row.getCell(1).value = teacher.name;
      row.getCell(2).value = teacher.subject;
      let c = 3;
      DAYS.forEach((day) => {
        PERIODS.forEach((period) => {
          const slot = slots.find(
            (s) => s.teacherId === teacher.id && s.day === day && s.period === period
          );
          row.getCell(c).value = slot ? `${slot.grade}/${slot.section}` : "";
          row.getCell(c).alignment = { horizontal: "center", vertical: "middle" };
          c++;
        });
      });
      const teacherSlots = slots.filter((s) => s.teacherId === teacher.id);
      row.getCell(c).value = teacherSlots.length;
      const grades = { 10: 0, 11: 0, 12: 0 } as Record<number, number>;
      teacherSlots.forEach((s) => {
        if (s.grade in grades) grades[s.grade]++;
      });
      row.getCell(c + 1).value = grades[10];
      row.getCell(c + 2).value = grades[11];
      row.getCell(c + 3).value = grades[12];
    });

    // عرض أعمدة
    worksheet.getColumn(1).width = 28;
    worksheet.getColumn(2).width = 12;
    for (let i = 3; i < col + 4; i++) {
      worksheet.getColumn(i).width = 8;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'الجدول_الرئيسي.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting master schedule:', error);
    throw error;
  }
}

// =====================================================
// ================ جدول معلم واحد ======================
// =====================================================
export async function exportTeacherScheduleExcel(
  teacher: Teacher,
  slots: ScheduleSlotData[]
) {
  try {
    const periodsCount = getPeriodsCount();
    const PERIODS = getActivePeriods();
    const arrayBuffer = await loadActiveTemplate();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new Error('Template worksheet not found');

    trimWorksheetPeriods(worksheet, periodsCount);

    worksheet.pageSetup = {
      ...worksheet.pageSetup,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };

    const titleCell = worksheet.getRow(TITLE_ROW).getCell(TITLE_COL);
    titleCell.value = `جدول المعلم: ${teacher.name}`;

    DAYS.forEach((day, dayIdx) => {
      const rowNum = dayIdx + FIRST_DATA_ROW;
      const periodValues: string[] = PERIODS.map((period) => {
        const slot = slots.find((s) => s.day === day && s.period === period);
        return slot ? `${slot.grade}/${slot.section}` : '';
      });

      periodValues.forEach((value, idx) => {
        if (value) {
          worksheet.getRow(rowNum).getCell(idx + FIRST_PERIOD_COL).value = value;
        }
      });

      // دمج الحصص المتتالية المتطابقة
      mergeConsecutive(worksheet, rowNum, periodValues);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `جدول_${teacher.name}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting teacher schedule:', error);
    throw error;
  }
}

function mergeConsecutive(worksheet: ExcelJS.Worksheet, rowNum: number, values: string[]) {
  let mergeStart = -1;
  let currentValue = '';
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v && v === currentValue && mergeStart !== -1) continue;
    if (mergeStart !== -1 && i - mergeStart > 1) {
      try {
        worksheet.mergeCells(rowNum, mergeStart + FIRST_PERIOD_COL, rowNum, i - 1 + FIRST_PERIOD_COL);
        worksheet.getRow(rowNum).getCell(mergeStart + FIRST_PERIOD_COL).value = currentValue;
      } catch {}
    }
    if (v) {
      mergeStart = i;
      currentValue = v;
    } else {
      mergeStart = -1;
      currentValue = '';
    }
  }
  if (mergeStart !== -1 && values.length - mergeStart > 1) {
    try {
      worksheet.mergeCells(rowNum, mergeStart + FIRST_PERIOD_COL, rowNum, values.length - 1 + FIRST_PERIOD_COL);
      worksheet.getRow(rowNum).getCell(mergeStart + FIRST_PERIOD_COL).value = currentValue;
    } catch {}
  }
}

// =====================================================
// نسخ ورقة كاملة من قالب مع حذف الأعمدة الزائدة
// =====================================================
function copyTemplateToSheet(
  baseTemplate: ExcelJS.Worksheet,
  sheet: ExcelJS.Worksheet,
  periodsCount: number
) {
  // نسخ تعريفات الأعمدة (مع تحديد العرض)
  if (baseTemplate.model && baseTemplate.model.cols) {
    sheet.columns = baseTemplate.model.cols.map(() => ({ width: 16 } as any));
  }

  baseTemplate.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const newRow = sheet.getRow(rowNumber);
    if (row.height) newRow.height = row.height;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const newCell = newRow.getCell(colNumber);
      if (rowNumber !== TITLE_ROW || colNumber !== TITLE_COL) {
        newCell.value = cell.value;
      }
      if (cell.style) {
        newCell.style = {
          ...cell.style,
          font: cell.font ? { ...cell.font } : undefined,
          alignment: cell.alignment ? { ...cell.alignment } : undefined,
          border: cell.border ? { ...cell.border } : undefined,
          fill: cell.fill ? { ...cell.fill } : undefined,
          numFmt: cell.numFmt,
        };
      }
    });
  });

  baseTemplate.columns.forEach((col, idx) => {
    if (col && col.width) {
      sheet.getColumn(idx + 1).width = col.width;
    }
  });

  if (baseTemplate.model && baseTemplate.model.merges) {
    baseTemplate.model.merges.forEach((merge: string) => {
      try { sheet.mergeCells(merge); } catch {}
    });
  }

  trimWorksheetPeriods(sheet, periodsCount);
}

// =====================================================
// ================ تصدير جميع المعلمين =================
// =====================================================
export async function exportAllTeachersExcel(
  teachers: Teacher[],
  allSlots: ScheduleSlot[]
) {
  try {
    const periodsCount = getPeriodsCount();
    const PERIODS = getActivePeriods();
    const arrayBuffer = await loadActiveTemplate();
    const finalWorkbook = new ExcelJS.Workbook();

    for (const teacher of teachers) {
      const templateWorkbook = new ExcelJS.Workbook();
      await templateWorkbook.xlsx.load(arrayBuffer);
      const baseTemplate = templateWorkbook.getWorksheet(1);
      if (!baseTemplate) throw new Error('Template worksheet not found');

      const sheet = finalWorkbook.addWorksheet(teacher.name.substring(0, 30), {
        views: [{ rightToLeft: true }],
      });
      sheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      };

      copyTemplateToSheet(baseTemplate, sheet, periodsCount);

      sheet.getRow(TITLE_ROW).getCell(TITLE_COL).value = `جدول المعلم: ${teacher.name}`;

      const teacherSlots = allSlots.filter(s => s.teacherId === teacher.id);

      DAYS.forEach((day, dayIdx) => {
        const rowNum = dayIdx + FIRST_DATA_ROW;
        const periodValues: string[] = PERIODS.map((period) => {
          const slot = teacherSlots.find((s) => s.day === day && s.period === period);
          return slot ? `${slot.grade}/${slot.section}` : '';
        });

        periodValues.forEach((value, idx) => {
          sheet.getRow(rowNum).getCell(idx + FIRST_PERIOD_COL).value = value;
        });

        mergeConsecutive(sheet, rowNum, periodValues);
      });
    }

    const buffer = await finalWorkbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'جداول_جميع_المعلمين.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting all teachers schedules:', error);
    throw error;
  }
}

// =====================================================
// ================ جدول صف واحد =======================
// =====================================================
export async function exportClassScheduleExcel(
  grade: number,
  section: number,
  slots: ClassScheduleSlot[]
) {
  try {
    const periodsCount = getPeriodsCount();
    const PERIODS = getActivePeriods();
    const arrayBuffer = await loadActiveTemplate();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new Error('Template worksheet not found');

    trimWorksheetPeriods(worksheet, periodsCount);

    worksheet.pageSetup = {
      ...worksheet.pageSetup,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };

    worksheet.getRow(TITLE_ROW).getCell(TITLE_COL).value = `جدول الصف: ${grade}/${section}`;

    DAYS.forEach((day, dayIdx) => {
      const rowNum = dayIdx + FIRST_DATA_ROW;
      const periodValues: string[] = PERIODS.map((period) => {
        const slot = slots.find((s) => s.day === day && s.period === period);
        return slot ? getSubjectDisplayName(slot.subject, grade as Grade) : '';
      });

      periodValues.forEach((value, idx) => {
        if (value) {
          worksheet.getRow(rowNum).getCell(idx + FIRST_PERIOD_COL).value = value;
        }
      });

      mergeConsecutive(worksheet, rowNum, periodValues);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `جدول_الصف_${grade}_${section}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting class schedule:', error);
    throw error;
  }
}

// =====================================================
// ================ تصدير جميع الصفوف ==================
// =====================================================
export async function exportAllClassesExcel(
  allSlots: ScheduleSlot[],
  allTeachers: Teacher[],
  gradeSections?: Record<string, number[]>
) {
  try {
    const periodsCount = getPeriodsCount();
    const PERIODS = getActivePeriods();
    const arrayBuffer = await loadActiveTemplate();

    const finalWorkbook = new ExcelJS.Workbook();
    const teacherMap = new Map(allTeachers.map(t => [t.id, t]));

    for (let grade = 10; grade <= 12; grade++) {
      const sections = gradeSections?.[grade.toString()] || [1, 2, 3, 4, 5, 6, 7];
      for (const section of sections) {
        const templateWorkbook = new ExcelJS.Workbook();
        await templateWorkbook.xlsx.load(arrayBuffer);
        const baseTemplate = templateWorkbook.getWorksheet(1);
        if (!baseTemplate) throw new Error('Template worksheet not found');

        const sheet = finalWorkbook.addWorksheet(`${grade}-${section}`, {
          views: [{ rightToLeft: true }],
        });
        sheet.pageSetup = {
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        };

        copyTemplateToSheet(baseTemplate, sheet, periodsCount);
        sheet.getRow(TITLE_ROW).getCell(TITLE_COL).value = `جدول الصف: ${grade}/${section}`;

        const classSlots = allSlots.filter(s => s.grade === grade && s.section === section);

        DAYS.forEach((day, dayIdx) => {
          const rowNum = dayIdx + FIRST_DATA_ROW;
          const periodValues: string[] = PERIODS.map((period) => {
            const slot = classSlots.find((s) => s.day === day && s.period === period);
            if (slot) {
              const teacher = teacherMap.get(slot.teacherId);
              return teacher?.subject ? getSubjectDisplayName(teacher.subject, slot.grade as Grade) : '';
            }
            return '';
          });

          periodValues.forEach((value, idx) => {
            sheet.getRow(rowNum).getCell(idx + FIRST_PERIOD_COL).value = value;
          });

          mergeConsecutive(sheet, rowNum, periodValues);
        });
      }
    }

    const buffer = await finalWorkbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'جداول_جميع_الصفوف.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting all class schedules:', error);
    throw error;
  }
}
