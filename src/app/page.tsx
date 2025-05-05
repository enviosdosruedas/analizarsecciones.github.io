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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  componentName: string; // Now expects format like "Section: Hero" or "Page: Contact"
  htmlCode: string;
  destinationPage: string;
  insertionPosition: string;
  styleInstructions: string;
}

const PromptForgePage: FC = () => {
  const [formData, setFormData] = useState<FormData>({
    componentName: '',
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

  const generatePrompt = useCallback(() => {
    const {
      componentName,
      htmlCode,
      destinationPage,
      insertionPosition,
      styleInstructions,
    } = formData;

    // Split style instructions into bullet points
    const formattedStyleInstructions = styleInstructions
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => ` * ${line}`)
      .join('\n');

    // Update prompt template to reflect the change in componentName input
    const prompt = `Por favor, integra el siguiente elemento en el archivo ${destinationPage || '[Nombre de la Página de Destino]'}.

**Tipo y Nombre:** ${componentName || '[Tipo: Nombre Específico]'}

**Código HTML a Integrar:**
\`\`\`html
${htmlCode || '[Pega aquí el código HTML ingresado por el usuario]'}
\`\`\`

**Ubicación de Inserción:**
${insertionPosition || '[Describe aquí la Posición en la Página ingresada por el usuario. Sé lo más específico posible, mencionando selectores CSS, IDs o la relación con elementos existentes.]'}

**Instrucciones de Estilo:**
Aplica estilos a este elemento utilizando las clases disponibles en nuestro CSS global y nuestra configuración de Tailwind CSS (tailwind.config.ts).
Por favor, sigue estas instrucciones específicas para el estilo:
${formattedStyleInstructions || ' * [Instrucción de Estilo Específica 1, ingresada por el usuario]'}

Asegúrate de que el elemento se vea coherente con el diseño existente de la página y que sea responsivo.
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
            <div className="space-y-2">
              {/* Updated Label */}
              <Label htmlFor="componentName">Tipo (Sección/Componente/Página) y Nombre Específico</Label>
              <Input
                id="componentName"
                name="componentName"
                // Updated Placeholder
                placeholder="e.g., Sección: Hero con Botón / Página: Contacto"
                value={formData.componentName}
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
                placeholder="e.g., index.html or src/pages/Home.jsx"
                value={formData.destinationPage}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insertionPosition">Insertion Position</Label>
              <Input
                id="insertionPosition"
                name="insertionPosition"
                placeholder="e.g., Before the footer, inside #main-content"
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
