
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
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'; // Import Combobox
import { useToast } from '@/hooks/use-toast';

interface FormData {
  componentType: 'Sección' | 'Componente' | 'Página' | '';
  componentSpecificName: string;
  htmlCode: string;
  destinationDirectory: string;
  integrationTarget: string; // Changed to string for Combobox value
}

// Helper function to extract top-level directories under src/
const extractSrcDirectories = (structure: any): string[] => {
  if (!structure?.src || typeof structure.src !== 'object') {
    return [];
  }
  const srcDirs = Object.keys(structure.src).filter(key => {
      // Ensure the key points to an object (directory) and isn't hidden
      return typeof structure.src[key] === 'object' && structure.src[key] !== null && !key.startsWith('.');
  });
  // Filter out potential files at the root of src if needed, though Object.keys is usually sufficient
  // Return full paths
  return srcDirs.map(dir => `src/${dir}`).sort();
};


// Helper function to extract all file paths from the project structure recursively
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
      // It's a file, add its path if it looks like a potential target (e.g., .tsx, .js)
      if (/\.(tsx|jsx|js|html|css)$/.test(key) && !key.startsWith('.')) { // Filter for relevant file types
        allPaths.push({ value: newPath, label: newPath });
      }
    }
  });

  return allPaths;
};


const PromptForgePage: FC = () => {
  const [formData, setFormData] = useState<FormData>({
    componentType: '',
    componentSpecificName: '',
    htmlCode: '',
    destinationDirectory: '',
    integrationTarget: '', // Initialize integration target
  });
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [directoryPaths, setDirectoryPaths] = useState<string[]>([]); // State for directory paths
  const [filePaths, setFilePaths] = useState<ComboboxOption[]>([{ value: 'new', label: 'Crear Nueva Página/Archivo' }]); // State for file paths, including 'new' option
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(true); // Loading state
  const { toast } = useToast();

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

        // Use the extraction function for directories
        const extractedDirs = extractSrcDirectories(structure);

        if (extractedDirs.length > 0) {
          setDirectoryPaths(extractedDirs);
        } else {
          console.warn("Could not find directories under src in estructura_proyecto.json");
          setDirectoryPaths([]);
          toast({
            title: 'Warning',
            description: 'Could not find project directories in estructura_proyecto.json.',
            variant: 'destructive',
          });
        }

        // Extract all file paths
        const extractedFiles = extractAllFilePaths(structure);
        // Combine 'new' option with extracted file paths, sorted
        setFilePaths(
            [{ value: 'new', label: 'Crear Nueva Página/Archivo' }, ...extractedFiles].sort((a, b) => a.label.localeCompare(b.label))
        );


      } catch (error) {
        console.error("Failed to fetch or process project structure:", error);
        setDirectoryPaths([]); // Set to empty array on error
        setFilePaths([{ value: 'new', label: 'Crear Nueva Página/Archivo' }]); // Reset file paths with 'new' option
        toast({
          title: 'Error',
          description: 'Failed to load project structure. Please check console.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingPaths(false);
      }
    };

    fetchAndProcessStructure();
  }, [toast]); // Add toast to dependency array


  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
       if (name !== 'destinationDirectory' && name !== 'integrationTarget') { // Also exclude integrationTarget
           setFormData((prev) => ({ ...prev, [name]: value }));
       }
    },
    []
  );

  // Handler for Component Type Select change
  const handleComponentTypeChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      componentType: value as FormData['componentType'],
    }));
  }, []);

  // Handler for Destination Directory Select change
   const handleDestinationDirectoryChange = useCallback((value: string) => {
     setFormData((prev) => ({
       ...prev,
       destinationDirectory: value, // Stores the selected directory path
     }));
   }, []);

  // Handler for Integration Target Combobox change
  const handleIntegrationTargetChange = useCallback((value: string) => {
      setFormData((prev) => ({
        ...prev,
        integrationTarget: value,
      }));
  }, []);


  const generatePrompt = useCallback(() => {
    const {
      componentType,
      componentSpecificName,
      htmlCode,
      destinationDirectory,
      integrationTarget,
    } = formData;

    // Determine integration action and target file description based on user choice
    let integrationActionText = '';
    let targetDescription = '';

    if (integrationTarget === 'new') {
      integrationActionText = 'DEBES crear una nueva página/archivo en el directorio especificado.';
      targetDescription = 'Crear Nueva Página/Archivo';
    } else if (integrationTarget) {
      integrationActionText = `DEBES integrar el elemento en el archivo EXISTENTE: ${integrationTarget}. La IA determinará la ubicación específica dentro de él.`;
      targetDescription = `Integrar en Existente: ${integrationTarget}`;
    } else {
        integrationActionText = '[Error: Selecciona un objetivo de integración]';
        targetDescription = '[Por favor, selecciona un objetivo]';
    }


    // Construct the prompt without the "Análisis de Contexto" section
    const prompt = `INICIO DEL PROMPT PARA IA

DIRECTIVA DE ACCIÓN INMEDIATA: IMPLEMENTAR CAMBIOS EN EL PROYECTO

Eres una IA con capacidades de modificación de código dentro del entorno de desarrollo de este proyecto (perceptible como "Firebase Studio" o similar). Tu función es actuar directamente sobre los archivos del proyecto para integrar el elemento web solicitado.

Procedimiento Requerido:
Debes leer la información proporcionada, consultar los archivos de contexto del proyecto (información interna, no necesitas mencionarla explícitamente en la salida), y proceder a modificar o crear los archivos necesarios para integrar el elemento web según las especificaciones, **determinando los estilos adecuados basándote en la configuración y estructura del proyecto.**

Especificaciones del Elemento a Integrar (Datos del Usuario):

Tipo de Elemento: ${componentType || '[Por favor, selecciona un tipo]'}
Nombre Específico: ${componentSpecificName || '[Por favor, introduce un nombre específico]'}
Directorio de Destino Base: ${destinationDirectory || '[Por favor, selecciona un directorio de destino]'} (Este es el directorio general donde la acción tendrá lugar, relevante si se crea un archivo nuevo).
Objetivo de Integración: ${targetDescription}
Acción de Integración Requerida: ${integrationActionText}
Código HTML Base del Elemento:

\`\`\`html
${htmlCode || '[Por favor, pega el código HTML aquí]'}
\`\`\`
Nota: Si el archivo de destino o el nuevo archivo es .tsx (React/Next.js), DEBES convertir y adaptar este HTML a sintaxis JSX válida.

Instrucciones de Estilo y Adaptación (Cómo Implementar los Estilos):
**DEBES aplicar estilos activamente al elemento integrado utilizando EXCLUSIVAMENTE las utilidades de Tailwind CSS y las clases/variables definidas en \`src/app/globals.css\`, consultando \`tailwind.config.ts\` (accesible vía \`/home/user/studio/public/configuracion_proyecto.txt\`) para la configuración personalizada. NO introduzcas estilos inline (\`style="..."\`) ni nuevas clases CSS globales personalizadas. NO hay instrucciones de estilo explícitas del usuario; debes derivar los estilos apropiados del contexto del proyecto.**

Como parte de la implementación de estilos, DEBES asegurar que el elemento:

**Se vea visualmente integrado y consistente con el diseño general del proyecto, utilizando los colores, tipografía y espaciado de la paleta definida en Tailwind y \`globals.css\` (obtenidos de \`/home/user/studio/public/configuracion_proyecto.txt\`).**
Utilice las clases de utilidad de Tailwind para layout (flex, grid), dimensiones, espaciado, tipografía, bordes, sombras, etc.
Haga uso de las variables CSS globales (--primary, --background, --radius, etc.) según corresponda, generalmente a través de las clases de utilidad de Tailwind (ej: text-primary, bg-card).
Sea completamente responsivo y se adapte correctamente a diferentes tamaños de pantalla, utilizando las utilidades responsivas de Tailwind (ej: sm:, md:, lg:) para ajustar layout, tamaño de fuente, espaciado, etc.
PLAN DE IMPLEMENTACIÓN DETALLADO (Pasos que DEBES Ejecutar Secuencialmente):

1.  Determinación de Archivo(s) y Ubicación:
    *   Basado en el "Tipo de Elemento", el "Directorio de Destino Base", y el "Objetivo de Integración", determina el nombre y la ruta completa del archivo a modificar o crear (ej: \`src/components/sections/${componentSpecificName || 'NombreEspecifico'}.tsx\`, \`src/app/${componentSpecificName || 'nueva-pagina'}/page.tsx\`, o modificar el archivo existente \`${integrationTarget}\`).
    *   Si se integra en un archivo existente (\`${integrationTarget}\`), identifica el punto de inserción lógico (ej., añadir import y uso de componente, o insertar HTML/JSX directamente). Si no hay indicación clara, asume un lugar estándar (ej., al final del contenido principal antes del footer).
    *   Si se crea un nuevo archivo de componente/sección, identifica también la página o componente existente donde este nuevo elemento deberá ser importado y utilizado (puede ser inferido del contexto o requerir una suposición lógica, a menudo será el archivo especificado si 'integrar en existente' fue la lógica implícita antes).
2.  Implementación del Código y Estilos (Modificación/Creación):
    *   Toma el "Código HTML Base".
    *   **APLICA INMEDIATAMENTE las clases de Tailwind y las referencias a variables/clases CSS globales directamente en el código del elemento (adaptado a JSX si aplica), basándote en el contexto del proyecto.** Asegura la responsividad.
    *   Escribe el contenido completo del nuevo archivo .tsx (si aplica) o modifica el archivo existente.
3.  Integración (si se creó un nuevo componente/sección):
    *   Si creaste un nuevo archivo de componente/sección (.tsx), identifica el archivo .tsx relevante donde este componente debe ser utilizado (será \`${integrationTarget}\` si se especificó un archivo existente, o una página inferida si se eligió 'Crear Nueva').
    *   Añade la sentencia \`import\` para el nuevo componente en ese archivo (usa alias).
    *   Inserta la referencia al nuevo componente (\`<${componentSpecificName || 'MyComponent'} />\`) en la ubicación lógica dentro de ese archivo.
4.  Verificación y Limpieza: Revisa los archivos modificados/creados para asegurar que las importaciones sean correctas, la sintaxis sea válida (JSX si es .tsx), y no haya estilos inline o clases CSS globales innecesarias.
5.  GUARDAR CAMBIOS: CONFIRMA que has guardado todos los archivos modificados o creados en el sistema de archivos del proyecto. Esta es una acción esencial.

FIN DEL PROMPT`;


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

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">PromptForge</h1>
        <p className="text-muted-foreground">
          Generate structured prompts for AI-powered web component generation.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Component Details</CardTitle>
            <CardDescription>
              Provide the details for the component you want to generate.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            {/* Select for Component Type */}
            <div className="space-y-2">
              <Label htmlFor="componentType">Tipo</Label>
              <Select
                name="componentType"
                value={formData.componentType}
                onValueChange={handleComponentTypeChange}
              >
                <SelectTrigger id="componentType" aria-label="Selecciona el tipo de componente">
                  <SelectValue placeholder="Selecciona Sección, Componente o Página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sección">Sección</SelectItem>
                  <SelectItem value="Componente">Componente</SelectItem>
                  <SelectItem value="Página">Página</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Input for Specific Name */}
            <div className="space-y-2">
              <Label htmlFor="componentSpecificName">Nombre Específico</Label>
              <Input
                id="componentSpecificName"
                name="componentSpecificName"
                placeholder="e.g., HeroConBoton, FormularioContacto"
                value={formData.componentSpecificName}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="htmlCode">HTML Code</Label>
              <Textarea
                id="htmlCode"
                name="htmlCode"
                placeholder="<section class='hero'>...</section>"
                value={formData.htmlCode}
                onChange={handleInputChange}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            {/* Select for Destination Directory */}
            <div className="space-y-2">
              <Label htmlFor="destinationDirectory">Directorio de Destino Base</Label> {/* Updated Label */}
              <Select
                name="destinationDirectory"
                value={formData.destinationDirectory}
                onValueChange={handleDestinationDirectoryChange}
                disabled={isLoadingPaths}
              >
                <SelectTrigger id="destinationDirectory" aria-label="Select base destination directory"> {/* Updated id */}
                  <SelectValue placeholder={isLoadingPaths ? "Loading directories..." : "Select a base directory..."} />
                </SelectTrigger>
                <SelectContent>
                  {!isLoadingPaths && directoryPaths.length > 0 ? (
                    directoryPaths.map((path) => (
                      <SelectItem key={path} value={path}>
                        {path}
                      </SelectItem>
                    ))
                  ) : !isLoadingPaths ? (
                    <SelectItem value="no-dirs" disabled>No directories found</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground pt-1">
                Select the base directory for the component/page. Relevant if creating a new file.
              </p>
            </div>

             {/* Combobox for Integration Target */}
            <div className="space-y-2">
                <Label htmlFor="integrationTarget">Objetivo de Integración</Label>
                <Combobox
                    options={filePaths}
                    value={formData.integrationTarget}
                    onChange={handleIntegrationTargetChange}
                    placeholder={isLoadingPaths ? "Loading files..." : "Select target file or create new..."}
                    searchPlaceholder="Search file or select 'Create New'..."
                    emptyPlaceholder="No matching file found."
                    disabled={isLoadingPaths}
                    triggerClassName="w-full" // Ensure button takes full width
                    contentClassName="w-[--radix-popover-trigger-width]" // Match trigger width
                 />
                <p className="text-xs text-muted-foreground pt-1">
                    Search for an existing file to integrate into, or select 'Crear Nueva Página/Archivo'.
                </p>
            </div>


          </CardContent>
          <CardFooter>
            <Button onClick={generatePrompt} className="w-full">
              Generate Prompt
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Generated Prompt</CardTitle>
            <CardDescription>
              Copy the prompt below and paste it into your target AI tool.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              readOnly
              value={generatedPrompt}
              placeholder="Generated prompt will appear here..."
              rows={20} // Adjusted rows to be smaller
              className="w-full font-mono text-sm resize-none" // Removed h-full
              aria-label="Generated Prompt"
            />
          </CardContent>
          <CardFooter>
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

      <footer className="mt-8 text-center text-muted-foreground text-sm">
        Built with Next.js, Tailwind CSS, and ShadCN UI.
      </footer>
    </div>
  );
};

export default PromptForgePage;
