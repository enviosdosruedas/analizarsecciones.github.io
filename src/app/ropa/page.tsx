
'use client';

import { useState, useCallback, useEffect, type FC } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';

// Matches the fields in the "Plantilla de Prompt para Solicitudes de Desarrollo en EstilosIA"
interface EstilosIAFormData {
  requestType: string;
  specificName: string;
  baseDirectory: string;
  integrationFile: string;
  integrationLocation: string;
  detailedDescription: string;
  styleRequirements: string;
  additionalConsiderations: string;
}

// Helper function to extract all file paths from the project structure recursively
// This function is kept from the original PromptForgePage to populate file selection comboboxes
const extractAllFilePaths = (structure: any, currentPath: string = '', allPaths: ComboboxOption[] = []): ComboboxOption[] => {
  if (typeof structure !== 'object' || structure === null) {
    return allPaths;
  }

  Object.keys(structure).forEach(key => {
    const newPath = currentPath ? `${currentPath}/${key}` : key;
    const value = structure[key];

    if (typeof value === 'object' && value !== null) {
      // It's a directory, recurse
      extractAllFilePaths(value, newPath, allPaths);
    } else {
      // It's a file, add its path if it looks like a potential target (e.g., .tsx, .js, .css)
      if (/\.(tsx|jsx|js|html|css)$/.test(key) && !key.startsWith('.')) {
        allPaths.push({ value: newPath, label: newPath });
      }
    }
  });
  return allPaths;
};


const EstilosIAPromptGeneratorPage: FC = () => {
  const [formData, setFormData] = useState<EstilosIAFormData>({
    requestType: '',
    specificName: '',
    baseDirectory: '',
    integrationFile: '',
    integrationLocation: '',
    detailedDescription: '',
    styleRequirements: '',
    additionalConsiderations: '',
  });
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [filePaths, setFilePaths] = useState<ComboboxOption[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAndProcessStructure = async () => {
      setIsLoadingPaths(true);
      try {
        const response = await fetch('/estructura_proyecto.json'); // Assuming EstilosIA project structure is described here
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const structure = await response.json();
        const extractedFiles = extractAllFilePaths(structure).sort((a, b) => a.label.localeCompare(b.label));
        setFilePaths(extractedFiles);
      } catch (error) {
        console.error("Failed to fetch or process project structure for EstilosIA:", error);
        setFilePaths([]);
        toast({
          title: 'Error',
          description: 'Failed to load project structure for EstilosIA. Please check console.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingPaths(false);
      }
    };

    fetchAndProcessStructure();
  }, [toast]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleRequestTypeChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, requestType: value }));
  }, []);

  const handleIntegrationFileChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, integrationFile: value }));
  }, []);

  const isNewFileRequest = (type: string) => {
    return ['Nueva Página', 'Nuevo Componente'].includes(type);
  };

  const isNewComponentIntegration = (type: string) => {
    return type === 'Nuevo Componente';
  };

  const generateNewPrompt = useCallback(() => {
    const {
      requestType,
      specificName,
      baseDirectory,
      integrationFile,
      integrationLocation,
      detailedDescription,
      styleRequirements,
      additionalConsiderations,
    } = formData;

    // Construct the prompt using the "Plantilla de Prompt para Solicitudes de Desarrollo en EstilosIA"
    const prompt = `Hola, necesito implementar/modificar lo siguiente en la aplicación EstilosIA:

1.  Tipo de Solicitud: ${requestType || '[Por favor, selecciona un tipo]'}

2.  Nombre Específico (si aplica): ${specificName || '[No especificado]'}
    ${requestType === 'Nueva Página' ? `    (Ruta URL: ${specificName || '[ruta no especificada]'}, Nombre Conceptual: "${specificName || '[nombre no especificado]'}")` : ''}
    ${requestType === 'Nuevo Componente' ? `    (Nombre del Componente: ${specificName || '[nombre no especificado].tsx'})` : ''}
    ${requestType.startsWith('Modificar') ? `    (Archivo a modificar: ${specificName || '[archivo no especificado]'})` : ''}

3.  Directorio Base (si es un nuevo archivo): ${isNewFileRequest(requestType) ? (baseDirectory || '[No especificado]') : '(No aplica)'}

4.  Objetivo de Integración (si es un nuevo componente o sección):
    Archivo Principal de Integración: ${isNewComponentIntegration(requestType) ? (integrationFile || '[No especificado]') : '(No aplica)'}
    Ubicación dentro del archivo: ${isNewComponentIntegration(requestType) ? (integrationLocation || '[No especificado]') : '(No aplica)'}

5.  Descripción Detallada de la Funcionalidad:
    ${detailedDescription || '[Por favor, provee una descripción detallada]'}

6.  Requisitos de Estilo (si tienes preferencias específicas más allá de la consistencia general):
    ${styleRequirements || '(Usar estilos consistentes con el proyecto)'}

7.  Consideraciones Adicionales (opcional):
    ${additionalConsiderations || '(Ninguna)'}
`;
    setGeneratedPrompt(prompt);
  }, [formData]);

  const copyToClipboard = useCallback(() => {
    if (!generatedPrompt) {
      toast({
        title: 'Error',
        description: 'No prompt generated yet.',
        variant: 'destructive',
      });
      return;
    }
    navigator.clipboard.writeText(generatedPrompt).then(
      () => {
        toast({
          title: 'Copied!',
          description: 'Prompt para EstilosIA copiado al portapapeles.',
        });
      },
      (err) => {
        toast({
          title: 'Error',
          description: 'Failed to copy prompt for EstilosIA.',
          variant: 'destructive',
        });
        console.error('Failed to copy text: ', err);
      }
    );
  }, [generatedPrompt, toast]);

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Generador de Prompts para EstilosIA</h1>
        <p className="text-muted-foreground">
          Describe la funcionalidad o modificación que necesitas para la aplicación EstilosIA.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Detalles de la Solicitud</CardTitle>
            <CardDescription>
              Completa los campos para generar un prompt detallado para el desarrollo en EstilosIA.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            {/* 1. Tipo de Solicitud */}
            <div className="space-y-2">
              <Label htmlFor="requestType">1. Tipo de Solicitud</Label>
              <Select name="requestType" value={formData.requestType} onValueChange={handleRequestTypeChange}>
                <SelectTrigger id="requestType">
                  <SelectValue placeholder="Selecciona el tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nueva Página">Nueva Página</SelectItem>
                  <SelectItem value="Nuevo Componente">Nuevo Componente</SelectItem>
                  <SelectItem value="Modificar Página Existente">Modificar Página Existente</SelectItem>
                  <SelectItem value="Modificar Componente Existente">Modificar Componente Existente</SelectItem>
                  <SelectItem value="Nueva Funcionalidad en Acción de Servidor">Nueva Funcionalidad en Acción de Servidor</SelectItem>
                  <SelectItem value="Corrección de Bug">Corrección de Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. Nombre Específico */}
            <div className="space-y-2">
              <Label htmlFor="specificName">2. Nombre Específico (si aplica)</Label>
              <Input
                id="specificName"
                name="specificName"
                placeholder="Ruta URL, Nombre Componente, Archivo a modificar..."
                value={formData.specificName}
                onChange={handleInputChange}
              />
            </div>

            {/* 3. Directorio Base (Condicional) */}
            {isNewFileRequest(formData.requestType) && (
              <div className="space-y-2">
                <Label htmlFor="baseDirectory">3. Directorio Base (para nuevos archivos)</Label>
                <Input
                  id="baseDirectory"
                  name="baseDirectory"
                  placeholder="e.g., src/app/perfil/, src/components/user/"
                  value={formData.baseDirectory}
                  onChange={handleInputChange}
                />
                 <p className="text-xs text-muted-foreground pt-1">
                    Ej: src/app/nueva-ruta/, src/components/nuevos/
                  </p>
              </div>
            )}

            {/* 4. Objetivo de Integración (Condicional) */}
            {isNewComponentIntegration(formData.requestType) && (
              <div className="space-y-2">
                <Label>4. Objetivo de Integración</Label>
                <div className="space-y-2 pl-4 border-l-2 border-muted ml-2">
                    <div className='space-y-1'>
                        <Label htmlFor="integrationFile" className="text-sm font-normal">Archivo Principal de Integración</Label>
                        <Combobox
                        options={filePaths}
                        value={formData.integrationFile}
                        onChange={handleIntegrationFileChange}
                        placeholder={isLoadingPaths ? "Cargando archivos..." : "Seleccionar archivo existente..."}
                        searchPlaceholder="Buscar archivo..."
                        emptyPlaceholder="Archivo no encontrado."
                        disabled={isLoadingPaths}
                        triggerClassName="w-full"
                        contentClassName="w-[--radix-popover-trigger-width]"
                        />
                    </div>
                    <div className='space-y-1'>
                        <Label htmlFor="integrationLocation" className="text-sm font-normal">Ubicación dentro del archivo</Label>
                        <Textarea
                        id="integrationLocation"
                        name="integrationLocation"
                        placeholder="Ej: Debajo del título H1, dentro del Card de usuario..."
                        value={formData.integrationLocation}
                        onChange={handleInputChange}
                        rows={2}
                        />
                    </div>
                </div>
              </div>
            )}

            {/* 5. Descripción Detallada de la Funcionalidad */}
            <div className="space-y-2">
              <Label htmlFor="detailedDescription">5. Descripción Detallada de la Funcionalidad</Label>
              <Textarea
                id="detailedDescription"
                name="detailedDescription"
                placeholder="Propósito, contenido, interacciones del usuario, datos involucrados, lógica específica, componentes UI a utilizar (si los conoces)..."
                value={formData.detailedDescription}
                onChange={handleInputChange}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {/* 6. Requisitos de Estilo */}
            <div className="space-y-2">
              <Label htmlFor="styleRequirements">6. Requisitos de Estilo (opcional)</Label>
              <Textarea
                id="styleRequirements"
                name="styleRequirements"
                placeholder="Preferencias específicas más allá de la consistencia general del proyecto..."
                value={formData.styleRequirements}
                onChange={handleInputChange}
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            {/* 7. Consideraciones Adicionales */}
            <div className="space-y-2">
              <Label htmlFor="additionalConsiderations">7. Consideraciones Adicionales (opcional)</Label>
              <Textarea
                id="additionalConsiderations"
                name="additionalConsiderations"
                placeholder="Dependencias, acciones de servidor, tipos a modificar/crear, pasos para reproducir bug..."
                value={formData.additionalConsiderations}
                onChange={handleInputChange}
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateNewPrompt} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Generar Prompt para EstilosIA
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Prompt Generado para EstilosIA</CardTitle>
            <CardDescription>
              Copia el prompt y úsalo con la IA que trabaja en el proyecto EstilosIA.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              readOnly
              value={generatedPrompt}
              placeholder="El prompt para EstilosIA aparecerá aquí..."
              rows={20}
              className="w-full font-mono text-sm resize-none"
              aria-label="Generated Prompt for EstilosIA"
            />
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              disabled={!generatedPrompt}
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar Prompt
            </Button>
          </CardFooter>
        </Card>
      </div>

      <footer className="mt-8 text-center text-muted-foreground text-sm">
        PromptForge: Generador de Prompts para EstilosIA.
      </footer>
    </div>
  );
};

export default EstilosIAPromptGeneratorPage;

    