import { useState, useEffect } from "react";
import { Settings, Upload, FileSpreadsheet, Trash2, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TemplateManager, type Template } from "@/lib/templateManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TemplateSettings() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const allTemplates = TemplateManager.getAllTemplates();
    setTemplates(allTemplates);
    setActiveTemplateId(TemplateManager.getActiveTemplateId());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "خطأ",
          description: "يجب أن يكون الملف بصيغة .xlsx",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار ملف قالب",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const newTemplate = await TemplateManager.addCustomTemplateFromFile(file);
      
      toast({
        title: "تم التحميل بنجاح",
        description: "تم إضافة القالب الجديد. يمكنك الآن اختياره للاستخدام.",
      });

      setFile(null);
      loadTemplates();
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل القالب",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSelectTemplate = (id: string) => {
    TemplateManager.setActiveTemplate(id);
    setActiveTemplateId(id);
    toast({
      title: "تم التحديد",
      description: "تم اختيار القالب بنجاح. سيتم استخدامه في التصدير القادم.",
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      TemplateManager.deleteCustomTemplate(templateToDelete);
      toast({
        title: "تم الحذف",
        description: "تم حذف القالب بنجاح",
      });
      loadTemplates();
    }
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold font-heading">إدارة القوالب</h1>

            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                القوالب المتاحة
              </CardTitle>

            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`relative overflow-hidden transition-all ${
                      activeTemplateId === template.id
                        ? "ring-2 ring-primary shadow-lg"
                        : "hover:shadow-md"
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      {template.previewUrl && (
                        <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden cursor-pointer"
                          onClick={() => handlePreview(template)}
                        >
                          <img
                            src={template.previewUrl}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )}
                      {!template.previewUrl && (
                        <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                          <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-sm text-right">
                          {template.name}
                        </h3>
                        <p className="text-xs text-muted-foreground text-right">
                          {template.isBuiltIn ? "قالب مدمج" : "قالب مخصص"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {activeTemplateId === template.id ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            disabled
                          >
                            <Check className="h-4 w-4 ml-2" />
                            محدد
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleSelectTemplate(template.id)}
                          >
                            اختيار
                          </Button>
                        )}
                        {!template.isBuiltIn && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                إضافة قالب جديد
              </CardTitle>

            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-8 bg-muted/20">
                <FileSpreadsheet className="h-16 w-16 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">
                    {file ? file.name : "لم يتم اختيار ملف"}
                  </p>
                  {file && (
                    <p className="text-sm text-muted-foreground mb-4">
                      حجم الملف: {(file.size / 1024).toFixed(2)} كيلوبايت
                    </p>
                  )}
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="template-upload"
                  />
                  <div className="flex gap-2 justify-center">
                    <label htmlFor="template-upload">
                      <Button variant="outline" size="lg" asChild>
                        <span className="cursor-pointer">
                          <Upload className="h-4 w-4 ml-2" />
                          اختر ملف القالب
                        </span>
                      </Button>
                    </label>
                    {file && (
                      <Button
                        size="lg"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="min-w-[200px]"
                      >
                        {uploading ? "جاري الرفع..." : "إضافة القالب"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewTemplate && previewTemplate.previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div className="max-w-4xl w-full bg-background rounded-lg p-6 relative">
            <button
              onClick={closePreview}
              className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
            >
              <span className="text-2xl">&times;</span>
            </button>
            <h2 className="text-xl font-bold text-right mb-4">
              {previewTemplate.name}
            </h2>
            <img
              src={previewTemplate.previewUrl}
              alt={previewTemplate.name}
              className="w-full h-auto rounded-md"
            />
          </div>
        </div>
      )}
    </div>
  );
}
