'use client';

import { useState, useCallback, useEffect, type FC } from 'react';
import { Copy } from 'lucide-react'; // Keep Copy icon
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // Keep Input if needed elsewhere, but Textarea is primary focus
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox component
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';

// --- Define Level Type ---
type TargetLevel = 'Página' | 'Sección' | 'Componente' | '';

// --- UPDATED FormData interface for Optimization ---
interface FormData {
  targetFile: string; // The file to optimize/modify
  targetLevel: TargetLevel; // NEW: The level of the target (Page, Section, Component)
  modificationType: 'Optimizar Código' | 'Optimizar Estilo' | 'Añadir CSS Específico' | 'Añadir Importación' | 'Añadir Dependencia/Plugin' | ''; // Type of modification
  specificInstructions: string; // Details for the modification (will be populated by checkboxes + custom input)
}

// --- Structured Suggestion Data by Level and Type ---
const suggestionDataByLevel: Record<Exclude<TargetLevel, ''>, Record<Exclude<FormData['modificationType'], ''>, string[]>> = {
    'Página': {
        'Optimizar Código': [
            "Refactorizar lógica de obtención de datos (fetch) para usar Server Actions o Route Handlers si aplica.",
            "Optimizar el uso de `useState` y `useEffect` para evitar re-renders innecesarios.",
            "Dividir la página en componentes más pequeños si se vuelve muy compleja.",
            "Mejorar el manejo de estados de carga y error para la página completa.",
            "Asegurar que los metadatos de la página (SEO) estén correctamente configurados.",
            "Optimizar llamadas a API o base de datos realizadas desde la página.",
        ],
        'Optimizar Estilo': [
            "Asegurar consistencia del layout principal (padding, max-width) con otras páginas.",
            "Verificar la responsividad general de la página en todos los breakpoints (sm, md, lg, xl).",
            "Garantizar que los colores y tipografía sigan el tema global definido en `globals.css`.",
            "Revisar uso de sombras y bordes para consistencia visual.",
            "Optimizar la carga de fuentes o imágenes grandes específicas de la página.",
        ],
        'Añadir CSS Específico': [
            "Añadir en `globals.css`: `.page-wrapper-${/* nombre-unico */} { /* estilos específicos */ }`", // Sugerencia más general
            "Modificar una regla CSS existente en `globals.css` que afecte el layout de la página.",
        ],
        'Añadir Importación': [
            "Importar `Link` de `next/link` para navegación interna.",
            "Añadir `import { Metadata } from 'next';` para configurar metadatos.",
            "Importar un hook global: `import useAnalytics from '@/hooks/useAnalytics';`",
            "Importar componentes de layout: `import { PageLayout } from '@/components/layout/PageLayout';`",
        ],
        'Añadir Dependencia/Plugin': [
            "Instalar `next-seo` para manejo avanzado de SEO: `npm install next-seo`.",
            "Añadir `framer-motion` para animaciones a nivel de página: `npm install framer-motion`.",
        ],
    },
    'Sección': {
        'Optimizar Código': [
            "Refactorizar la lógica interna de la sección para mayor claridad.",
            "Optimizar el renderizado condicional dentro de la sección.",
            "Asegurar que las props de la sección estén bien tipadas (TypeScript).",
            "Extraer lógica compleja a hooks personalizados si es necesario.",
            "Mejorar la performance si la sección realiza cálculos intensivos.",
        ],
        'Optimizar Estilo': [
            "Asegurar que la sección use `padding` y `margin` de Tailwind consistentemente.",
            "Verificar la responsividad de la sección en sí misma.",
            "Usar colores (`bg-`, `text-`, `border-`) del tema (primary, secondary, accent, etc.).",
            "Aplicar `border-radius` según las variables del tema (`rounded-lg`, `rounded-md`).",
            "Simplificar selectores CSS si se añadió CSS específico anteriormente.",
        ],
        'Añadir CSS Específico': [
            "Añadir en `globals.css`: `.section-${/* nombre-unico */} { /* estilos específicos */ }`",
            "Crear una variante específica para esta sección en `tailwind.config.ts` (si es complejo).",
        ],
        'Añadir Importación': [
            "Importar componentes UI de `@/components/ui` (Button, Card, etc.).",
            "Importar iconos de `lucide-react`.",
            "Importar `Image` de `next/image` para optimización de imágenes dentro de la sección.",
            "Importar `cn` de `@/lib/utils` para clases condicionales.",
        ],
        'Añadir Dependencia/Plugin': [
             "Instalar `embla-carousel-react` si se necesita un carrusel dentro de la sección: `npm install embla-carousel-react`.",
             "Añadir `react-intersection-observer` para animaciones al hacer scroll: `npm install react-intersection-observer`.",
        ],
    },
    'Componente': {
        'Optimizar Código': [
            "Simplificar la lógica del componente al mínimo indispensable.",
            "Utilizar `React.memo` si el componente es puro y recibe las mismas props frecuentemente.",
            "Asegurar que el componente sea lo más reutilizable posible.",
            "Tipar correctamente las props del componente.",
            "Optimizar el manejo de eventos (e.g., `onClick`, `onChange`).",
        ],
        'Optimizar Estilo': [
            "Usar exclusivamente clases de Tailwind para estilizar el componente.",
            "Asegurar que el componente herede colores y fuentes del tema o permita personalización vía props/clases.",
            "Verificar que el componente no tenga márgenes/paddings fijos que dificulten su composición.",
            "Hacer el componente adaptable a diferentes contextos (tamaños de contenedor).",
        ],
        'Añadir CSS Específico': [
            "Evitar añadir CSS específico para componentes; preferir Tailwind o CSS Modules si es estrictamente necesario.",
        ],
        'Añadir Importación': [
            "Importar tipos necesarios: `import type { FC } from 'react';`",
            "Importar `cn` de `@/lib/utils`.",
            "Importar otros componentes UI necesarios.",
        ],
        'Añadir Dependencia/Plugin': [
            "Evitar añadir dependencias directamente a componentes pequeños; gestionar dependencias a nivel de página/layout.",
        ],
    },
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
    targetLevel: '', // Initialize level
    modificationType: '',
    specificInstructions: '',
  });
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [filePaths, setFilePaths] = useState<ComboboxOption[]>([]); // State for file paths (target files)
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(true); // Loading state for file paths
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, boolean>>({}); // State for checkbox selections { suggestionText: isChecked }
  const { toast } = useToast();

  // --- Level Options ---
  const levelOptions: TargetLevel[] = ['Página', 'Sección', 'Componente'];

  // Fetch and process project structure on component mount
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

  // Handler for Target File Combobox change
  const handleTargetFileChange = useCallback((value: string) => {
      setFormData((prev) => ({
        ...prev,
        targetFile: value,
        // Optionally, reset level and modification type if file changes?
        // targetLevel: '',
        // modificationType: '',
        // specificInstructions: '',
      }));
      // setSelectedSuggestions({}); // Reset suggestions if file changes
  }, []);

  // NEW: Handler for Target Level Select change
  const handleLevelChange = useCallback((value: TargetLevel) => {
    setFormData(prev => ({
      ...prev,
      targetLevel: value,
      modificationType: '', // Reset modification type when level changes
      specificInstructions: '', // Reset instructions
    }));
    setSelectedSuggestions({}); // Reset checkbox selections
  }, []);


  // Handler for Modification Type Select change
  const handleModificationTypeChange = useCallback((value: Exclude<FormData['modificationType'], ''>) => {
    setFormData((prev) => ({
      ...prev,
      modificationType: value,
      specificInstructions: '', // Reset instructions when type changes
    }));
    setSelectedSuggestions({}); // Reset checkbox selections
  }, []);


  // Handler for Checkbox changes - Updated to use current suggestions
  const handleCheckboxChange = useCallback((suggestion: string, checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    const newSelectedSuggestions = {
        ...selectedSuggestions,
        [suggestion]: isChecked,
    };
    setSelectedSuggestions(newSelectedSuggestions);

    // Rebuild the specificInstructions string based on current selections
    // Determine current suggestions based on level and type
    let currentSuggestions: string[] = [];
    if (formData.targetLevel && formData.modificationType) {
        currentSuggestions = suggestionDataByLevel[formData.targetLevel]?.[formData.modificationType] ?? [];
    }

    const instructions = currentSuggestions
        .filter(s => newSelectedSuggestions[s]) // Get only checked suggestions
        .join('\n'); // Join them with newline

    setFormData(prev => ({ ...prev, specificInstructions: instructions }));

  }, [selectedSuggestions, formData.targetLevel, formData.modificationType]);


  // Handler for the Textarea (allows manual editing alongside checkbox selections)
   const handleInstructionsChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      if (name === 'specificInstructions') {
         setFormData((prev) => ({ ...prev, [name]: value }));
         // Optional: Desync checkboxes if user types manually, or try to sync (complex)
         // A simple approach is to let the textarea override the checkboxes visually,
         // but the prompt generation will use the textarea value.
         // To be safe, maybe clear checkboxes when textarea is manually edited?
         // setSelectedSuggestions({}); // Uncomment this line to clear checkboxes on manual edit
      }
    },
    []
  );


  // --- UPDATED generatePrompt function to create Optimization Prompt ---
  const generatePrompt = useCallback(() => {
    const {
      targetFile,
      targetLevel, // Include level
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

    // --- Optimization Prompt Template (Updated to include Level) ---
    const prompt = `INICIO DEL PROMPT PARA IA

DIRECTIVA DE ACCIÓN INMEDIATA: OPTIMIZAR O MODIFICAR CÓDIGO EXISTENTE EN EL NIVEL ESPECIFICADO

Eres una IA con capacidades de modificación de código dentro del entorno de desarrollo de este proyecto. Tu función es actuar directamente sobre los archivos del proyecto para optimizar o modificar un elemento web existente según el nivel (Página, Sección, Componente) y las especificaciones proporcionadas.

Procedimiento Requerido:
Debes leer la información proporcionada, incluyendo el nivel del objetivo, consultar los archivos de contexto del proyecto, y proceder a modificar los archivos necesarios para realizar la optimización o adición solicitada.

Uso del Contexto del Proyecto (Información Crítica para la Implementación):
Tienes acceso completo para leer y escribir archivos en el sistema de archivos del proyecto. Es OBLIGATORIO que consultes y utilices la información de los siguientes archivos ubicados en public/ para realizar la implementación correctamente.
/home/user/studio/public/configuracion_proyecto.txt: Contiene la configuración de Tailwind, rutas CSS globales, alias de directorios, etc.
/home/user/studio/public/estructura_proyecto.json: Representa la estructura actual de directorios y archivos.

Especificaciones de la Tarea (Información Proporcionada por el Usuario):

Archivo/Elemento Objetivo: ${targetFile || '[Por favor, selecciona un archivo objetivo]'} (Ruta exacta del archivo a leer y modificar).
Nivel del Objetivo: ${targetLevel || '[Por favor, selecciona el nivel: Página, Sección o Componente]'} (Esto contextualiza la modificación).
Tipo de Modificación: ${modificationType || '[Por favor, selecciona un tipo de modificación]'}
Instrucciones/Detalles Específicos:
${formattedSpecificInstructions || '[Instrucciones detalladas basadas en el Nivel y Tipo de Modificación seleccionados, o texto manual.]'}
[La IA debe interpretar estas instrucciones en el contexto del Nivel y Tipo seleccionados. Por ejemplo, "Optimizar Estilo" en una "Página" se refiere a la coherencia global, mientras que en un "Componente" se refiere a su encapsulamiento y reutilización.]

PLAN DE IMPLEMENTACIÓN (Pasos que DEBES Ejecutar Secuencialmente en el Proyecto):
Análisis del Archivo Objetivo: Lee el contenido actual del "Archivo/Elemento Objetivo" (${targetFile || '[Ruta del Archivo Objetivo]'}).
Aplicación de la Modificación (Contextualizada por Nivel): Basándote en el "Nivel del Objetivo", el "Tipo de Modificación" y las "Instrucciones/Detalles Específicos", realiza los cambios necesarios en el código del archivo objetivo. Adapta tu enfoque según sea una Página, Sección o Componente.
Si es Optimizar Código/Estilo: Aplica las optimizaciones solicitadas considerando el alcance (global para Página, encapsulado para Sección/Componente). Utiliza Tailwind y CSS global según el contexto.
Si es Añadir CSS Específico: Añade o modifica reglas CSS en src/app/globals.css. Considera si es mejor usar Tailwind.
Si es Añadir Importación: Inserta la sentencia import en la ubicación adecuada dentro del "Archivo/Elemento Objetivo", usando alias (@/).
Si es Añadir Dependencia/Plugin: Modifica package.json y realiza configuraciones iniciales si se especificaron.
Ajustes Colaterales (Si Aplica): Realiza ajustes necesarios derivados de la modificación principal.
Verificación de Sintaxis y Coherencia: Revisa todos los archivos modificados asegurando sintaxis correcta y coherencia estilística con el proyecto.
GUARDAR CAMBIOS DEFINITIVAMENTE: CONFIRMA Y GUARDA todos los archivos modificados en el sistema de archivos del proyecto.
Reporte de Ejecución: Lista los archivos modificados y describe brevemente los cambios.

Confirmación de Inicio:
Confirma que has leído y entendido estas instrucciones, incluyendo el Nivel del Objetivo, has accedido al contexto del proyecto, y procederás inmediatamente a ejecutar el plan de implementación modificando archivos en el proyecto.

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

  // --- Determine current suggestions based on level and type ---
   let currentSuggestions: string[] = [];
   if (formData.targetLevel && formData.modificationType) {
       currentSuggestions = suggestionDataByLevel[formData.targetLevel]?.[formData.modificationType] ?? [];
   }

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

             {/* NEW: Target Level Select */}
             <div id="optimizar-level-select-group" className="space-y-2">
               <Label htmlFor="targetLevel">Nivel del Objetivo</Label>
               <Select
                 name="targetLevel"
                 value={formData.targetLevel}
                 onValueChange={handleLevelChange}
                 disabled={!formData.targetFile} // Disable if no file is selected
               >
                 <SelectTrigger id="targetLevel" aria-label="Selecciona el nivel del objetivo">
                   <SelectValue placeholder={!formData.targetFile ? "Selecciona un archivo primero" : "Selecciona Página, Sección o Componente"} />
                 </SelectTrigger>
                 <SelectContent>
                   {levelOptions.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
                <p className="text-xs text-muted-foreground pt-1">
                    Specify if the target is a whole Page, a Section within a page, or a reusable Component.
                </p>
             </div>


            {/* Modification Type Select - Enabled only if level is selected */}
            <div id="optimizar-modification-type-select-group" className="space-y-2">
              <Label htmlFor="modificationType">Tipo de Modificación</Label>
              <Select
                name="modificationType"
                value={formData.modificationType}
                onValueChange={(value) => handleModificationTypeChange(value as Exclude<FormData['modificationType'], ''>)}
                disabled={!formData.targetLevel} // Disable if no level selected
              >
                <SelectTrigger id="modificationType" aria-label="Selecciona el tipo de modificación">
                  <SelectValue placeholder={!formData.targetLevel ? "Selecciona un nivel primero" : "Selecciona el tipo de modificación"} />
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

            {/* Suggestions Checkboxes - Rendered conditionally */}
            {formData.targetLevel && formData.modificationType && currentSuggestions.length > 0 && (
                <div className="space-y-3 pt-2">
                    <Label>Sugerencias (marca las que apliquen):</Label>
                    {/* Scrollable container for suggestions */}
                    <div className="space-y-2 rounded-md border p-3 max-h-48 overflow-y-auto bg-muted/50">
                        {currentSuggestions.map((suggestion, index) => (
                            <div key={`${formData.targetLevel}-${formData.modificationType}-${index}`} className="flex items-start space-x-2"> {/* Use more specific key */}
                                <Checkbox
                                    id={`suggestion-${index}`}
                                    checked={selectedSuggestions[suggestion] || false}
                                    onCheckedChange={(checked) => handleCheckboxChange(suggestion, checked)}
                                    aria-labelledby={`suggestion-label-${index}`} // Improve accessibility
                                />
                                <label
                                    id={`suggestion-label-${index}`} // Corresponding label ID
                                    htmlFor={`suggestion-${index}`}
                                    className="text-sm font-mono cursor-pointer leading-snug" // Ensure readability
                                >
                                    {suggestion}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Specific Instructions Textarea */}
            <div id="optimizar-instructions-input-group" className="space-y-2">
              <Label htmlFor="specificInstructions">
                Instrucciones Específicas (Combinadas o Personalizadas)
              </Label>
              <Textarea
                id="specificInstructions"
                name="specificInstructions"
                placeholder={
                    !formData.modificationType
                      ? "Selecciona Nivel y Tipo de Modificación para ver sugerencias o escribir manualmente."
                      : currentSuggestions.length > 0
                        ? "Edita las instrucciones seleccionadas o añade detalles..."
                        : "Escribe aquí instrucciones detalladas..."
                }
                value={formData.specificInstructions}
                onChange={handleInstructionsChange} // Changed handler
                rows={6} // Adjusted rows
                className="font-mono text-sm"
                disabled={!formData.modificationType} // Disable if no modification type is selected
              />
              <p className="text-xs text-muted-foreground pt-1">
                 Puedes editar las sugerencias seleccionadas o añadir instrucciones manuales aquí.
              </p>
            </div>

          </CardContent>
          <CardFooter id="optimizar-input-card-footer">
            <Button
                onClick={generatePrompt}
                className="w-full"
                // Disable button if essential fields are missing
                disabled={isLoadingPaths || !formData.targetFile || !formData.targetLevel || !formData.modificationType || !formData.specificInstructions.trim()}
              >
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
