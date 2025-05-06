'use client';

import { useState, useCallback } from 'react';
import type { FC } from 'react';
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
} from '@/components/ui/select'; // Import Select components
import { useToast } from '@/hooks/use-toast';

// Updated FormData interface
interface FormData {
  componentType: 'Sección' | 'Componente' | 'Página' | ''; // Added componentType
  componentSpecificName: string; // Added componentSpecificName
  htmlCode: string;
  destinationPage: string;
  insertionPosition: string;
  styleInstructions: string;
}

const PromptForgePage: FC = () => {
  const [formData, setFormData] = useState<FormData>({
    componentType: '', // Initialize componentType
    componentSpecificName: '', // Initialize componentSpecificName
    htmlCode: '',
    destinationPage: '',
    insertionPosition: '',
    styleInstructions: '',
  });
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const { toast } = useToast();

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // Handler for Select component change
  const handleSelectChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      componentType: value as FormData['componentType'],
    }));
  }, []);

  const generatePrompt = useCallback(() => {
    const {
      componentType,
      componentSpecificName,
      htmlCode,
      destinationPage,
      insertionPosition,
      styleInstructions,
    } = formData;

    // Split style instructions into bullet points for the prompt
    const formattedStyleInstructionsList = styleInstructions
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => `* ${line}`) // Keep the '*' for list formatting in the prompt
      .join('\n');

    // New detailed prompt template
    const prompt = `INICIO DEL PROMPT PARA IA

DIRECTIVA DE ACCIÓN INMEDIATA: IMPLEMENTAR CAMBIOS EN EL PROYECTO

Eres una IA con capacidades de modificación de código dentro del entorno de desarrollo de este proyecto (perceptible como "Firebase Studio" o similar). Tu función es actuar directamente sobre los archivos del proyecto para integrar el elemento web solicitado.

Procedimiento Requerido:
Debes leer la información proporcionada, consultar los archivos de contexto del proyecto, y proceder a modificar o crear los archivos necesarios para integrar el elemento web según las especificaciones.

Contexto Detallado del Proyecto (Información Crítica para la Implementación):
Tienes acceso completo para leer y escribir archivos en el sistema de archivos del proyecto. Es OBLIGATORIO que consultes y utilices la información de los siguientes archivos para realizar la implementación correctamente:

/home/user/studio/public/configuracion_proyecto.txt:

Uso: Este archivo contiene la configuración esencial para aplicar estilos y entender la estructura del proyecto. Debes parsear este archivo para obtener:
Ruta de tailwind.config.ts: Consulta este archivo para conocer la paleta de colores personalizada (theme.extend.colors), espaciado, breakpoints (theme.screens), configuraciones de tipografía, etc. Utiliza estas definiciones para aplicar estilos con clases de Tailwind.
Ruta de src/app/globals.css: Revisa este archivo para las variables CSS globales (especialmente las de ShadCN UI mapeadas a la paleta personalizada, como --primary, --background) y cualquier clase CSS global personalizada. Utiliza estas variables/clases cuando sea apropiado (a menudo a través de clases de utilidad de Tailwind como bg-primary, text-foreground).
Alias de directorios (aliases del snippet components.json): Utiliza estos alias (ej: @/components, @/lib/utils, @/hooks, @/ui) para todas las rutas de importación de componentes, utilidades, hooks, etc. al modificar o crear archivos .tsx.
/home/user/studio/public/estructura_proyecto.json:

Uso: Este archivo representa el mapa del proyecto. Debes consultarlo para:
Validar la ruta del "Archivo/Página de Destino" proporcionada.
Identificar la estructura de directorios existente para decidir la ubicación lógica de nuevos archivos (ej: si el tipo es "Componente" o "Sección", busca directorios como src/components/sections/ o src/components/ui/).
Confirmar la existencia de archivos y directorios necesarios.
Especificaciones del Elemento a Integrar (Datos del Usuario):

Tipo de Elemento: ${componentType || '[Por favor, selecciona un tipo]'}
Nombre Específico: ${componentSpecificName || '[Por favor, introduce un nombre específico]'}
Archivo/Página de Destino: ${destinationPage || '[Por favor, especifica la página de destino]'}
Ubicación de Inserción: En el archivo ${destinationPage || '[Nombre del Archivo/Página de Destino]'}, localiza y realiza la inserción en el siguiente punto específico: ${insertionPosition || '[Por favor, describe la ubicación de inserción]'}
Código HTML Base del Elemento:

\`\`\`html
${htmlCode || '[Por favor, pega el código HTML aquí]'}
\`\`\`
Nota: Si el archivo de destino o el nuevo archivo es .tsx (React/Next.js), DEBES convertir y adaptar este HTML a sintaxis JSX válida.

Instrucciones de Estilo y Adaptación (Cómo Implementar los Estilos):
DEBES aplicar estilos activamente al elemento integrado utilizando EXCLUSIVAMENTE las utilidades de Tailwind CSS y las clases/variables definidas en src/app/globals.css, consultando tailwind.config.ts para la configuración personalizada. No introduzcas estilos inline (style="...") ni nuevas clases CSS globales personalizadas.

Implementa los estilos basándote en estas instrucciones específicas, traduciéndolas a clases de Tailwind y/o referencias a variables CSS globales:
${formattedStyleInstructionsList || '* [No se proporcionaron instrucciones de estilo específicas]'}

Además, como parte de la implementación de estilos, DEBES asegurar que el elemento:

Se vea visualmente integrado y consistente con el diseño general del proyecto, utilizando los colores, tipografía y espaciado de la paleta definida en Tailwind y globals.css.
Utilice las clases de utilidad de Tailwind para layout (flex, grid), dimensiones, espaciado, tipografía, bordes, sombras, etc.
Haga uso de las variables CSS globales (--primary, --background, --radius, etc.) según corresponda, generalmente a través de las clases de utilidad de Tailwind (ej: text-primary, bg-card).
Sea completamente responsivo y se adapte correctamente a diferentes tamaños de pantalla, utilizando las utilidades responsivas de Tailwind (ej: sm:, md:, lg:) para ajustar layout, tamaño de fuente, espaciado, etc.
PLAN DE IMPLEMENTACIÓN DETALLADO (Pasos que DEBES Ejecutar Secuencialmente):

1.  Análisis de Contexto: Lee y procesa a fondo /home/user/studio/public/configuracion_proyecto.txt y /home/user/studio/public/estructura_proyecto.json para tener clara la configuración de estilos (Tailwind, CSS global, variables) y la estructura de archivos (rutas, directorios de componentes/páginas).
2.  Preparación de Archivos:
    *   Si el "Tipo de Elemento" es "Componente" o "Sección" y el archivo de destino es .tsx (como es típico en este proyecto Next.js), DEBES crear un nuevo archivo .tsx para el componente/sección. Nómbralo de forma descriptiva usando el "Nombre Específico" (ej: src/components/sections/${componentSpecificName || 'NombreEspecifico'}.tsx) y utiliza la estructura de carpetas de estructura_proyecto.json como guía.
    *   Si el "Tipo de Elemento" es "Página", el archivo a modificar/crear es directamente el "Archivo/Página de Destino" especificado.
    *   Si solo se modifica un archivo existente (no se crea un nuevo componente/página separado), abre el "Archivo/Página de Destino".
3.  Implementación del Código y Estilos (Modificación/Creación):
    *   Toma el "Código HTML Base".
    *   APLICA INMEDIATAMENTE las clases de Tailwind y las referencias a variables/clases CSS globales directamente en el código del elemento (adaptado a JSX si aplica), siguiendo las "Instrucciones de Estilo y Adaptación" y la configuración del proyecto. Asegura que la responsividad se implemente en este paso.
    *   Si creaste un nuevo archivo .tsx para un componente/sección, coloca el código implementado con estilos dentro de la estructura de un componente React funcional.
    *   Si el "Tipo de Elemento" es "Página", coloca el código implementado en el archivo de destino (el nuevo o el existente).
4.  Integración en el Archivo de Destino:
    *   Si creaste un nuevo archivo de componente/sección (.tsx), DEBES añadir una sentencia import para este nuevo componente en la parte superior del "Archivo/Página de Destino" (utiliza los alias definidos, ej: import ${componentSpecificName || 'MyComponent'} from '@/components/sections/${componentSpecificName || 'MyComponent'}';).
    *   DEBES insertar el código del elemento (si modificaste el archivo directamente) o la referencia al nuevo componente (<${componentSpecificName || 'MyComponent'} />) en la "Ubicación de Inserción" especificada dentro del "Archivo/Página de Destino".
5.  Verificación y Limpieza: Revisa el archivo modificado/creado para asegurar que las importaciones sean correctas, la sintaxis sea válida (JSX si es .tsx), y no haya estilos inline o clases CSS globales innecesarias.
6.  GUARDAR CAMBIOS: CONFIRMA que has guardado todos los archivos modificados o creados en el sistema de archivos del proyecto. Esta es una acción esencial.`;

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
                onValueChange={handleSelectChange}
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
            <div className="space-y-2">
              <Label htmlFor="destinationPage">Destination Page</Label>
              <Input
                id="destinationPage"
                name="destinationPage"
                placeholder="e.g., src/app/page.tsx or src/app/about/page.tsx"
                value={formData.destinationPage}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insertionPosition">Insertion Position</Label>
              <Input
                id="insertionPosition"
                name="insertionPosition"
                placeholder="e.g., Antes del <footer>, dentro de #main-content"
                value={formData.insertionPosition}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="styleInstructions">
                Styling Instructions (one per line)
              </Label>
              <Textarea
                id="styleInstructions"
                name="styleInstructions"
                placeholder="Use Tailwind flexbox for centering.\nApply .btn-primary to the button.\nAdd p-4 Tailwind padding."
                value={formData.styleInstructions}
                onChange={handleInputChange}
                rows={5}
              />
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
