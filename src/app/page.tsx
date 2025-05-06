
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
import { useToast } from '@/hooks/use-toast';

interface FormData {
  componentType: 'Sección' | 'Componente' | 'Página' | '';
  componentSpecificName: string;
  htmlCode: string;
  destinationPage: string; // Will now hold a directory path
  insertionPosition: string;
}

// Helper function to extract top-level directories under src/
const extractSrcDirectories = (structure: any): string[] => {
  if (!structure?.src || typeof structure.src !== 'object') {
    return [];
  }
  const srcDirs = Object.keys(structure.src).filter(key => {
      // Ensure the value associated with the key is an object (representing a directory)
      // and it's not a hidden file/dir like .DS_Store
      return typeof structure.src[key] === 'object' && structure.src[key] !== null && !key.startsWith('.');
  });
  // Prepend 'src/' to each directory name and sort
  return srcDirs.map(dir => `src/${dir}`).sort();
};


const PromptForgePage: FC = () => {
  const [formData, setFormData] = useState<FormData>({
    componentType: '',
    componentSpecificName: '',
    htmlCode: '',
    destinationPage: '',
    insertionPosition: '',
  });
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [directoryPaths, setDirectoryPaths] = useState<string[]>([]); // State for directory paths
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

        // Use the new extraction function for directories
        const extractedDirs = extractSrcDirectories(structure);

        if (extractedDirs.length > 0) {
          setDirectoryPaths(extractedDirs);
        } else {
          console.warn("Could not find directories under src in estructura_proyecto.json");
          setDirectoryPaths([]);
          toast({
            title: 'Warning',
            description: 'Could not find project directories in estructura_proyecto.json.',
            variant: 'destructive', // Use destructive variant for warnings/errors
          });
        }
      } catch (error) {
        console.error("Failed to fetch or process project structure:", error);
        setDirectoryPaths([]); // Set to empty array on error
        toast({
          title: 'Error',
          description: 'Failed to load project directories. Please check console.',
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
       // Only update if it's not the destinationPage (handled by Select)
       if (name !== 'destinationPage') {
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

  // Handler for Destination Page Select change (now Destination Directory)
   const handleDestinationPageChange = useCallback((value: string) => {
     setFormData((prev) => ({
       ...prev,
       destinationPage: value, // Stores the selected directory path
     }));
   }, []);


  const generatePrompt = useCallback(() => {
    const {
      componentType,
      componentSpecificName,
      htmlCode,
      destinationPage, // This now contains the selected directory
      insertionPosition,
    } = formData;

    // **IMPORTANT**: The prompt generation logic needs adjustment.
    // It currently assumes destinationPage is a file path.
    // We need to decide how to use the selected directory.
    // Option 1: Ask the user for a filename within that directory in another field.
    // Option 2: Let the AI decide the filename based on componentSpecificName.
    // Option 3: Modify the prompt to instruct the AI *where* to create/modify files *based on* the selected directory.
    // For now, we'll keep the prompt generation as is, but highlight this needed change.

    const prompt = `INICIO DEL PROMPT PARA IA

DIRECTIVA DE ACCIÓN INMEDIATA: IMPLEMENTAR CAMBIOS EN EL PROYECTO

Eres una IA con capacidades de modificación de código dentro del entorno de desarrollo de este proyecto (perceptible como "Firebase Studio" o similar). Tu función es actuar directamente sobre los archivos del proyecto para integrar el elemento web solicitado.

Procedimiento Requerido:
Debes leer la información proporcionada, consultar los archivos de contexto del proyecto, y proceder a modificar o crear los archivos necesarios para integrar el elemento web según las especificaciones, **determinando los estilos adecuados basándote en la configuración y estructura del proyecto.**

Contexto Detallado del Proyecto (Información Crítica para la Implementación):
Tienes acceso completo para leer y escribir archivos en el sistema de archivos del proyecto. Es OBLIGATORIO que consultes y utilices la información de los siguientes archivos para realizar la implementación correctamente:

/home/user/studio/public/configuracion_proyecto.txt:

Uso: Este archivo contiene la configuración esencial para aplicar estilos y entender la estructura del proyecto. Debes parsear este archivo para obtener:
Ruta de tailwind.config.ts: **Consulta este archivo OBLIGATORIAMENTE para conocer la paleta de colores personalizada (theme.extend.colors), espaciado, breakpoints (theme.screens), configuraciones de tipografía, etc. UTILIZA estas definiciones para aplicar estilos con clases de Tailwind.**
Ruta de src/app/globals.css: **Revisa este archivo OBLIGATORIAMENTE para las variables CSS globales (especialmente las de ShadCN UI mapeadas a la paleta personalizada, como --primary, --background) y cualquier clase CSS global personalizada. UTILIZA estas variables/clases cuando sea apropiado (a menudo a través de clases de utilidad de Tailwind como bg-primary, text-foreground).**
Alias de directorios (aliases del snippet components.json): Utiliza estos alias (ej: @/components, @/lib/utils, @/hooks, @/ui) para todas las rutas de importación de componentes, utilidades, hooks, etc. al modificar o crear archivos .tsx.
/home/user/studio/public/estructura_proyecto.json:

Uso: Este archivo representa el mapa del proyecto. Debes consultarlo para:
Validar la ruta del "Directorio de Destino" proporcionada.
Identificar la estructura de directorios existente para decidir la ubicación lógica de nuevos archivos (ej: si el tipo es "Componente" o "Sección" y el directorio es "src/components", el nuevo archivo podría ser "src/components/sections/${componentSpecificName || 'NombreEspecifico'}.tsx").
Confirmar la existencia de archivos y directorios necesarios.
Especificaciones del Elemento a Integrar (Datos del Usuario):

Tipo de Elemento: ${componentType || '[Por favor, selecciona un tipo]'}
Nombre Específico: ${componentSpecificName || '[Por favor, introduce un nombre específico]'}
Directorio de Destino: ${destinationPage || '[Por favor, selecciona un directorio de destino]'} (Este es el directorio base para la integración. La IA determinará el archivo específico dentro de este directorio).
Ubicación de Inserción (si aplica a un archivo existente dentro del directorio): En el archivo relevante dentro de "${destinationPage || '[Directorio de Destino]'}", localiza y realiza la inserción en el siguiente punto específico: ${insertionPosition || '[Por favor, describe la ubicación de inserción, o indica "Nuevo archivo"]'}
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

1.  Análisis de Contexto: Lee y procesa a fondo \`/home/user/studio/public/configuracion_proyecto.txt\` y \`/home/user/studio/public/estructura_proyecto.json\` para tener clara la configuración de estilos (Tailwind, CSS global, variables) y la estructura de archivos (rutas, directorios de componentes/páginas).
2.  Determinación de Archivo(s):
    *   Basado en el "Tipo de Elemento" y el "Directorio de Destino", determina el nombre y la ruta completa del archivo a modificar o crear (ej: \`src/components/sections/${componentSpecificName || 'NombreEspecifico'}.tsx\` o \`src/app/nueva-pagina/page.tsx\`).
    *   Si el "Tipo de Elemento" es "Componente" o "Sección", DEBES crear un nuevo archivo .tsx dentro del "Directorio de Destino" o un subdirectorio apropiado (usa el "Nombre Específico" para nombrar el archivo).
    *   Si el "Tipo de Elemento" es "Página", determina la ruta del archivo \`page.tsx\` dentro del "Directorio de Destino" (puede requerir crear subdirectorios si la página es nueva).
    *   Si la "Ubicación de Inserción" indica una modificación en un archivo existente, identifica ese archivo dentro del "Directorio de Destino".
3.  Implementación del Código y Estilos (Modificación/Creación):
    *   Toma el "Código HTML Base".
    *   **APLICA INMEDIATAMENTE las clases de Tailwind y las referencias a variables/clases CSS globales directamente en el código del elemento (adaptado a JSX si aplica), basándote en el contexto del proyecto obtenido de los archivos de configuración (\`/home/user/studio/public/configuracion_proyecto.txt\`). Asegura que la responsividad se implemente en este paso.**
    *   Escribe el contenido completo del nuevo archivo .tsx (si aplica) o modifica el archivo existente.
4.  Integración (si se creó un nuevo componente/sección):
    *   Si creaste un nuevo archivo de componente/sección (.tsx), identifica el archivo .tsx relevante (generalmente una página) donde este componente debe ser utilizado (puede ser inferido del contexto o requerir una clarificación adicional si la "Ubicación de Inserción" no es clara).
    *   Añade la sentencia \`import\` para el nuevo componente en la parte superior de ese archivo de destino (usa alias, ej: \`import ${componentSpecificName || 'MyComponent'} from '@/components/sections/${componentSpecificName || 'MyComponent'}';\`).
    *   Inserta la referencia al nuevo componente (\`<${componentSpecificName || 'MyComponent'} />\`) en la "Ubicación de Inserción" especificada dentro de ese archivo de destino.
5.  Verificación y Limpieza: Revisa los archivos modificados/creados para asegurar que las importaciones sean correctas, la sintaxis sea válida (JSX si es .tsx), y no haya estilos inline o clases CSS globales innecesarias.
6.  GUARDAR CAMBIOS: CONFIRMA que has guardado todos los archivos modificados o creados en el sistema de archivos del proyecto. Esta es una acción esencial.

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
    <div className="container mx-auto p-4 md:p-8 flex flex-col"> {/* Removed min-h-screen */}
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
                onValueChange={handleComponentTypeChange} // Use specific handler
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
              <Label htmlFor="destinationPage">Directorio de Destino</Label> {/* Updated Label */}
              <Select
                name="destinationPage" // Keep name for consistency, but it represents directory
                value={formData.destinationPage}
                onValueChange={handleDestinationPageChange} // Use specific handler
                disabled={isLoadingPaths} // Disable while loading
              >
                <SelectTrigger id="destinationPage" aria-label="Select destination directory">
                  <SelectValue placeholder={isLoadingPaths ? "Loading directories..." : "Select a directory..."} />
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
                  ) : null /* Render nothing while loading */}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground pt-1">
                Select the base directory for the component/page. The AI will determine the specific file.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insertionPosition">Insertion Position / Target</Label> {/* Clarified Label */}
              <Input
                id="insertionPosition"
                name="insertionPosition"
                placeholder='e.g., Antes del <footer> en page.tsx, o "Nuevo archivo"'
                value={formData.insertionPosition}
                onChange={handleInputChange}
              />
               <p className="text-xs text-muted-foreground pt-1">
                Describe where to insert in an existing file within the selected directory, or type "Nuevo archivo" if creating one.
              </p>
            </div>
            {/* Removed Styling Instructions Label and Textarea */}
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
              rows={generatedPrompt ? Math.max(15, generatedPrompt.split('\n').length + 2) : 15} // Dynamic height
              className="w-full h-full font-mono text-sm resize-none"
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
