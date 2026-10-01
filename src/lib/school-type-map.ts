import { schoolTypeOptions } from "@/lib/constants";

const SCHOOL_TYPE_BY_NAME: Record<string, string> = {
  南京大学: "985",
  哈尔滨工业大学: "985",
  武汉大学: "985",
  东南大学: "985",
  重庆大学: "985",
  西北工业大学: "985",
  北京师范大学: "211",
  上海外国语大学: "211",
  东北师范大学: "211",
  苏州大学: "211",
  暨南大学: "211",
  新疆大学: "211",
  西南大学: "211",
  中国传媒大学: "211",
  南京师范大学: "211",
  郑州大学音乐学院: "211",
  某211: "211",
  青岛大学: "双非",
  南昌航空大学: "双非",
  西南科技大学: "双非",
  天津职业技术师范大学: "双非",
  天津财经大学: "双非",
  沈阳理工大学: "双非",
  江西农业大学: "双非",
  浙江理工大学: "双非",
  淮阴师范学院: "双非",
  台州学院: "双非",
  贵州商学院: "双非",
  青海民族大学: "双非",
  江苏盐城工学院: "双非",
  盐城工学院: "双非",
  民办本科: "普本",
  普本大学: "普本",
  山东华宇工学院: "普本",
  广东白云学院: "普本",
  绵阳城市学院: "普本",
  青岛滨海学院: "普本",
  湖南信息学院: "普本",
  潍坊理工学院: "普本",
  沈阳工学院: "普本",
  长春光华学院: "普本",
  江苏经贸职业技术学院: "专科",
  TOP咨询公司: "企业",
  期刊机构: "其他",
  其他: "其他"
};

const allowedSchoolTypes = new Set(schoolTypeOptions);

function asTrimmedText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

export function normalizeSchoolType(value: unknown): string | undefined {
  const raw = asTrimmedText(value);
  if (!raw) return undefined;
  if (allowedSchoolTypes.has(raw)) return raw;
  return undefined;
}

export function resolveSchoolType(input: {
  schoolType?: unknown;
  school?: unknown;
}): { schoolType: string; inferred: boolean; unresolved: boolean } {
  const fromExcel = normalizeSchoolType(input.schoolType);
  if (fromExcel) {
    return { schoolType: fromExcel, inferred: false, unresolved: false };
  }

  const school = asTrimmedText(input.school);
  if (school && SCHOOL_TYPE_BY_NAME[school]) {
    return {
      schoolType: SCHOOL_TYPE_BY_NAME[school],
      inferred: true,
      unresolved: SCHOOL_TYPE_BY_NAME[school] === "其他" && school === "其他"
    };
  }

  return { schoolType: "其他", inferred: true, unresolved: true };
}
