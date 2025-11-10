export interface Template {
  id: string;
  name: string;
  isBuiltIn: boolean;
  previewUrl?: string;
  fileUrl?: string;
  fileData?: string;
}

const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: "template-1",
    name: "القالب الأول",
    isBuiltIn: true,
    previewUrl: "/template-previews/preview_1.png",
    fileUrl: "/templates/قالب_1.xlsx",
  },
  {
    id: "template-2",
    name: "القالب الثاني",
    isBuiltIn: true,
    previewUrl: "/template-previews/preview_2.png",
    fileUrl: "/templates/قالب_2.xlsx",
  },
  {
    id: "template-3",
    name: "القالب الثالث",
    isBuiltIn: true,
    previewUrl: "/template-previews/preview_3.png",
    fileUrl: "/templates/قالب_3.xlsx",
  },
  {
    id: "template-4",
    name: "القالب الرابع",
    isBuiltIn: true,
    previewUrl: "/template-previews/preview_4.png",
    fileUrl: "/templates/قالب_4.xlsx",
  },
];

const STORAGE_KEY = "custom_templates";
const ACTIVE_TEMPLATE_KEY = "active_template_id";

export class TemplateManager {
  static getAllTemplates(): Template[] {
    const customTemplates = this.getCustomTemplates();
    return [...BUILT_IN_TEMPLATES, ...customTemplates];
  }

  static getBuiltInTemplates(): Template[] {
    return BUILT_IN_TEMPLATES;
  }

  static getCustomTemplates(): Template[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading custom templates:", error);
      return [];
    }
  }

  static saveCustomTemplate(template: Template): void {
    const templates = this.getCustomTemplates();
    const existingIndex = templates.findIndex((t) => t.id === template.id);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }

  static deleteCustomTemplate(id: string): void {
    const templates = this.getCustomTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    if (this.getActiveTemplateId() === id) {
      this.setActiveTemplate(BUILT_IN_TEMPLATES[0].id);
    }
  }

  static getActiveTemplateId(): string {
    return localStorage.getItem(ACTIVE_TEMPLATE_KEY) || BUILT_IN_TEMPLATES[0].id;
  }

  static setActiveTemplate(id: string): void {
    localStorage.setItem(ACTIVE_TEMPLATE_KEY, id);
  }

  static getActiveTemplate(): Template | undefined {
    const id = this.getActiveTemplateId();
    return this.getAllTemplates().find((t) => t.id === id);
  }

  static async addCustomTemplateFromFile(file: File): Promise<Template> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        
        const template: Template = {
          id: `custom-${Date.now()}`,
          name: file.name.replace('.xlsx', ''),
          isBuiltIn: false,
          fileData: base64Data,
        };
        
        this.saveCustomTemplate(template);
        resolve(template);
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsDataURL(file);
    });
  }

  static async getTemplateFile(template: Template): Promise<Blob> {
    if (template.isBuiltIn && template.fileUrl) {
      const response = await fetch(template.fileUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch template file");
      }
      return await response.blob();
    } else if (template.fileData) {
      const base64Data = template.fileData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }
    throw new Error("Template file not available");
  }
}
