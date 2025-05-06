
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

// --- UPDATED FormData interface for Optimization ---
interface FormData {
  targetFile: string; // The file to optimize/modify
  modificationType: 'Optimizar Código' | 'Optimizar Estilo' | 'Añadir CSS Específico' | 'Añadir Importación' | 'Añadir Dependencia/Plugin' | ''; // Type of modification
  specificInstructions: string; // Details for the modification
  // Removed fields related to new component creation (componentType, componentSpecificName, htmlCode, destinationDirectory, integrationTarget)
}

// Mapping for dynamic placeholders
const instructionPlaceholders: Record<FormData['modificationType'], string> = {
    '': 'Selecciona un tipo de modificación para ver ejemplos...',
    'Optimizar Código': "Ej:\n- Refactorizar la función 'fetchData' para usar async/await.\n- Simplificar la lógica condicional en el componente X.\n- Eliminar console.log innecesarios.",
    'Optimizar Estilo': "Ej:\n- Reemplazar márgenes fijos con utilidades de Tailwind (p.ej., m-4, p-2).\n- Asegurar consistencia en el uso de colores primarios (bg-primary, text-primary).\n- Mejorar la responsividad en pantallas 'md' para la tabla de datos.",
    'Añadir CSS Específico': "Ej:\n- Añadir en src/app/globals.css:\n.mi-clase-especial {\n  @apply text-accent font-semibold;\n}\n- Modificar la regla '.card-title' en globals.css para aumentar el tamaño de fuente.",
    'Añadir Importación': "Ej:\n- Añadir `import { useState, useEffect } from 'react';` al inicio del archivo.\n- Importar `import { Card } from '@/components/ui/card';` donde se necesite.",
    'Añadir Dependencia/Plugin': "Ej:\n- Añadir `axios` a package.json: `npm install axios`.\n- Instalar y configurar `react-hook-form` siguiendo su documentación.",
};


// Helper functions to extract file paths from project structure recursively
// These are still needed to populate the targetFile Combobox
const extractAllFilePaths = (structure: any, currentPath: string = '', allPaths: ComboboxOption[] = []): ComboboxOption[] => {
  if (typeof structure !== 'object' || structure === null) {
    return allPaths;
  }

  Object.keys(structure).forEach(key => {
    // Prevent processing prototype properties
    if (!Object.prototype.hasOwnProperty.call(structure, key)) {
        return;
    }

    const newPath = currentPath ? `${currentPath}/${key}` : key;
    const value = structure[key];

    if (typeof value === 'object' && value !== null) {
      // It's a directory, recurse
      extractAllFilePaths(value, newPath, allPaths);
    } else {
      // It's a file, add its path if it looks like a potential target (e.g., .tsx, .js, .css, .json)
      if (/\.(tsx|jsx|js|html|css|json|ts)$/.test(key) && !key.startsWith('.')) { // Added .ts, .json as potential targets
        // Ensure no duplicate paths are added
        if (!allPaths.some(p => p.value === newPath)) {
            allPaths.push({ value: newPath, label: newPath });
        }
      }
    }
  });

  // The final sorting happens in the useEffect hook.
  return allPaths;
};


// New Page Component for /optimizar with Optimization Logic
const OptimizarPage: FC = () => {
  // --- UPDATED State for Optimization Form ---
  const [formData, setFormData] = useState<FormData>({
    targetFile: '',
    modificationType: '',
    specificInstructions: '',
  });
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [filePaths, setFilePaths] = useState<ComboboxOption[]>([]); // State for file paths (target files)
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(true); // Loading state for file paths
  const { toast } = useToast();

  // Fetch and process project structure on component mount
  // This is needed to populate the list of files that can be optimized/modified
  useEffect(() => {
    const fetchAndProcessStructure = async () => {
      setIsLoadingPaths(true);
      try {
        const response = await fetch('/estructura_proyecto.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const structure = await response.json();

        let extractedFiles = extractAllFilePaths(structure);
        // Sort file paths alphabetically AFTER extraction is complete
        extractedFiles.sort((a, b) => a.label.localeCompare(b.label));

        setFilePaths(extractedFiles);

      } catch (error) {
        console.error("Failed to fetch or process project structure for OptimizarPage:", error);
        setFilePaths([]); // Set to empty array on error
        toast({
          title: 'Error',
          description: 'Failed to load project structure for optimization targets. Please check console.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingPaths(false);
      }
    };

    fetchAndProcessStructure();
  }, [toast]); // Add toast to dependency array


  // --- UPDATED Input Handlers for Optimization Form ---
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      // Handle only the specificInstructions textarea
      if (name === 'specificInstructions') {
         setFormData((prev) => ({ ...prev, [name]: value }));
      }
    },
    []
  );

  // Handler for Target File Combobox change
  const handleTargetFileChange = useCallback((value: string) => {
      setFormData((prev) => ({
        ...prev,
        targetFile: value,
      }));
  }, []);

  // Handler for Modification Type Select change
  const handleModificationTypeChange = useCallback((value: FormData['modificationType']) => {
    setFormData((prev) => ({
      ...prev,
      modificationType: value,
      // Optionally clear specific instructions when type changes
      // specificInstructions: '',
    }));
  }, []);


  // --- UPDATED generatePrompt function to create Optimization Prompt ---
  const generatePrompt = useCallback(() => {
    const {
      targetFile,
      modificationType,
      specificInstructions,
    } = formData;

    // Format specific instructions as bullet points if provided
    const formattedSpecificInstructions = specificInstructions
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => ` * ${line}`)
      .join('\n');

    // --- Optimization Prompt Template (based on user's provided structure) ---
    const prompt = `INICIO DEL PROMPT PARA IA

DIRECTIVA DE ACCIÓN INMEDIATA: OPTIMIZAR O MODIFICAR CÓDIGO EXISTENTE

Eres una IA con capacidades de modificación de código dentro del entorno de desarrollo de este proyecto (perceptible como "Firebase Studio" o similar). Tu función es actuar directamente sobre los archivos del proyecto para optimizar o modificar un elemento web existente (Componente, Sección o Página) según las especificaciones proporcionadas.

Procedimiento Requerido:
Debes leer la información proporcionada sobre la tarea, consultar los archivos de contexto del proyecto para entender el entorno de desarrollo, y proceder a modificar los archivos necesarios para realizar la optimización o adición solicitada.

Uso del Contexto del Proyecto (Información Crítica para la Implementación):
Tienes acceso completo para leer y escribir archivos en el sistema de archivos del proyecto. Es OBLIGATORIO que consultes y utilices la información de los siguientes archivos ubicados en public/ para realizar la implementación correctamente. Esta información te permitirá entender la configuración de estilos, la estructura de directorios, los alias y las convenciones del proyecto antes de realizar cualquier cambio.
/home/user/studio/public/configuracion_proyecto.txt: Contiene la configuración de Tailwind, rutas CSS globales, alias de directorios, etc.
/home/user/studio/public/estructura_proyecto.json: Representa la estructura actual de directorios y archivos.

Especificaciones de la Tarea (Información Proporcionada por el Usuario):

Archivo/Elemento Objetivo: ${targetFile || '[Por favor, selecciona un archivo objetivo]'} (Esta es la ruta exacta del archivo que debes leer y modificar. Valida esta ruta usando estructura_proyecto.json).
Tipo de Modificación: ${modificationType || '[Por favor, selecciona un tipo de modificación]'}
Instrucciones/Detalles Específicos:
${formattedSpecificInstructions || '[El contenido ingresado por el usuario en el área de texto para detalles. El formato y contenido dependerán del "Tipo de Modificación".]'}
Si es Optimizar Código: Describe qué aspectos del código deben optimizarse (ej: "Refactorizar la lógica de manejo de estado", "Mejorar la eficiencia de la función X", "Limpiar código comentado").
Si es Optimizar Estilo: Describe qué aspectos del estilo deben optimizarse (ej: "Asegurar que todo el espaciado use utilidades de Tailwind", "Limpiar clases CSS no utilizadas", "Mejorar la responsividad en tamaños medianos").
Si es Añadir CSS Específico: Proporciona el código CSS exacto a añadir y especifica dónde debe ser añadido (ej: "Añadir estas reglas CSS en src/app/globals.css bajo el selector .mi-clase-personalizada", o "Modificar la regla CSS existente para .alguna-clase en globals.css para incluir estas propiedades"). Nota para la IA: Aunque se solicita CSS específico, siempre que sea posible, considera si la misma funcionalidad se puede lograr con utilidades de Tailwind o variables CSS globales existentes, y prioriza esa aproximación a menos que la instrucción sea muy específica.
Si es Añadir Importación: Proporciona la sentencia import completa (ej: import { useState } from 'react'; o import { Button } from '@/components/ui/button';). Si es posible, indica en qué parte del archivo debe ir (ej: "al principio del componente principal", "dentro de un useEffect").
Si es Añadir Dependencia/Plugin: Proporciona el nombre del paquete o plugin (ej: axios, react-query, @hookform/resolvers). Si se especifican, incluye la versión (ej: axios@^1.0.0). Si hay pasos de configuración inicial, descríbelos (ej: "Instalar axios", "Configurar QueryClientProvider en el layout principal").

PLAN DE IMPLEMENTACIÓN (Pasos que DEBES Ejecutar Secuencialmente en el Proyecto):
Análisis del Archivo Objetivo: Lee el contenido actual del "Archivo/Elemento Objetivo" (${targetFile || '[Ruta del Archivo Objetivo]'}).
Aplicación de la Modificación: Basándote en el "Tipo de Modificación" y las "Instrucciones/Detalles Específicos", realiza los cambios necesarios en el código del archivo objetivo.
Si es Optimizar Código/Estilo: Modifica el código existente para aplicar las optimizaciones solicitadas, utilizando el contexto del proyecto (Tailwind, CSS global, alias) para guiar los cambios de estilo y estructura.
Si es Añadir CSS Específico: Abre el archivo src/app/globals.css y añade o modifica las reglas CSS según las instrucciones.
Si es Añadir Importación: Inserta la sentencia import proporcionada en la ubicación adecuada dentro del "Archivo/Elemento Objetivo", utilizando los alias (@/) si corresponden.
Si es Añadir Dependencia/Plugin:
Modifica el archivo package.json para añadir la nueva dependencia en la sección dependencies o devDependencies según corresponda.
Si se especificaron pasos de configuración inicial, realiza las modificaciones necesarias en los archivos relevantes (ej: src/app/layout.tsx, archivos de configuración, etc.), utilizando los alias correctos.
Ajustes Colaterales (Si Aplica): Si la modificación principal requiere ajustes en otras partes del código del archivo objetivo (ej: usar un hook recién importado, ajustar llamadas a API después de añadir axios), realiza esos ajustes.
Verificación de Sintaxis y Coherencia: Revisa todos los archivos modificados (${targetFile ? `[${targetFile}]` : '[Ruta del Archivo Objetivo]'}, src/app/globals.css, package.json, etc.) para asegurar que la sintaxis sea correcta y que los cambios de estilo sean coherentes con el proyecto (usando Tailwind y CSS global según el contexto).
GUARDAR CAMBIOS DEFINITIVAMENTE: CONFIRMA Y GUARDA todos los archivos modificados en el sistema de archivos del proyecto. Esta es una acción esencial.
Reporte de Ejecución: Proporciona una lista clara de todos los archivos que fueron modificados durante esta tarea y describe brevemente la naturaleza del cambio en cada uno (ej: "Modificado src/components/sections/HeroSection.tsx para optimizar estilos y añadir importación de useInView. Modificado package.json para añadir axios.").

Confirmación de Inicio:
Confirma que has leído y entendido estas instrucciones, has accedido al contexto del proyecto, y procederás inmediatamente a ejecutar el plan de implementación modificando archivos en el proyecto.

FIN DEL PROMPT`;
    // --- End of Optimization Prompt Template ---

    setGeneratedPrompt(prompt);
  }, [formData]);

  // copyToClipboard function copied from src/app/page.tsx
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
          description: 'Prompt copied to clipboard.',
        });
      },
      (err) => {
        toast({
          title: 'Error',
          description: 'Failed to copy prompt.',
          variant: 'destructive',
        });
        console.error('Failed to copy text: ', err);
      }
    );
  }, [generatedPrompt, toast]);

  // --- UPDATED JSX structure for Optimization Form ---
  return (
    <div id="optimizar-page-container" className="container mx-auto p-4 md:p-8 flex flex-col">
      <header id="optimizar-page-header" className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">PromptForge (Optimization)</h1>
        <p className="text-muted-foreground">
          Generate structured prompts for AI-powered web component optimization and modification.
        </p>
      </header>

      <div id="optimizar-main-grid" className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
        {/* Input Card for Optimization */}
        <Card id="optimizar-input-card" className="flex flex-col">
          <CardHeader>
            <CardTitle>Optimization Details</CardTitle>
            <CardDescription>
              Provide the details for the optimization or modification you want to perform.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">

            {/* Target File Combobox */}
            <div id="optimizar-target-file-combobox-group" className="space-y-2">
                <Label htmlFor="targetFile">Archivo/Elemento Objetivo</Label>
                <Combobox
                    options={filePaths} // Use filePaths fetched from structure
                    value={formData.targetFile}
                    onChange={handleTargetFileChange}
                    placeholder={isLoadingPaths ? "Loading files..." : "Select target file..."}
                    searchPlaceholder="Search file to optimize..."
                    emptyPlaceholder="No matching file found."
                    disabled={isLoadingPaths}
                    triggerClassName="w-full" // Ensure button takes full width
                    contentClassName="w-[--radix-popover-trigger-width]" // Match trigger width
                 />
                <p className="text-xs text-muted-foreground pt-1">
                    Select the existing file (Page, Component, etc.) you want to optimize or modify.
                </p>
            </div>

            {/* Modification Type Select */}
            <div id="optimizar-modification-type-select-group" className="space-y-2">
              <Label htmlFor="modificationType">Tipo de Modificación</Label>
              <Select
                name="modificationType"
                value={formData.modificationType}
                onValueChange={handleModificationTypeChange}
              >
                <SelectTrigger id="modificationType" aria-label="Selecciona el tipo de modificación">
                  <SelectValue placeholder="Selecciona el tipo de modificación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Optimizar Código">Optimizar Código</SelectItem>
                  <SelectItem value="Optimizar Estilo">Optimizar Estilo</SelectItem>
                  <SelectItem value="Añadir CSS Específico">Añadir CSS Específico</SelectItem>
                  <SelectItem value="Añadir Importación">Añadir Importación</SelectItem>
                  <SelectItem value="Añadir Dependencia/Plugin">Añadir Dependencia/Plugin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific Instructions Textarea */}
            <div id="optimizar-instructions-input-group" className="space-y-2">
              <Label htmlFor="specificInstructions">
                Instrucciones/Detalles Específicos
              </Label>
              <Textarea
                id="specificInstructions"
                name="specificInstructions"
                placeholder={instructionPlaceholders[formData.modificationType || '']}
                value={formData.specificInstructions}
                onChange={handleInputChange}
                rows={8} // Give more space for instructions
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground pt-1">
                Provide clear and specific details based on the "Tipo de Modificación" selected.
              </p>
            </div>

          </CardContent>
          <CardFooter id="optimizar-input-card-footer">
            <Button onClick={generatePrompt} className="w-full" disabled={isLoadingPaths}>
               {isLoadingPaths ? 'Loading Files...' : 'Generate Optimization Prompt'}
            </Button>
          </CardFooter>
        </Card>

        {/* Generated Prompt Card */}
        <Card id="optimizar-prompt-card" className="flex flex-col">
          <CardHeader>
            <CardTitle>Generated Optimization Prompt</CardTitle>
            <CardDescription>
              Copy the prompt below and paste it into your target AI tool.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              id="optimizar-prompt-display"
              readOnly
              value={generatedPrompt}
              placeholder="Generated optimization prompt will appear here..."
              rows={20} // Keep original rows or adjust if needed
              className="w-full font-mono text-sm resize-none" // Maintain original styling
              aria-label="Generated Prompt"
            />
          </CardContent>
          <CardFooter id="optimizar-prompt-card-footer">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              disabled={!generatedPrompt}
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
            </Button>
          </CardFooter>
        </Card>
      </div>

      <footer id="optimizar-page-footer" className="mt-8 text-center text-muted-foreground text-sm">
        Built with Next.js, Tailwind CSS, and ShadCN UI. (Optimization Prompt Generator)
      </footer>
    </div>
  );
};

export default OptimizarPage; // Export the new page component
