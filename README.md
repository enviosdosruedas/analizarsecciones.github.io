# Firebase Studio / PromptForge

This is a Next.js application designed to generate detailed prompts for an AI assistant capable of modifying project code. The goal is to streamline the process of adding new web sections, components, or pages by providing the AI with precise instructions based on user input and the project's existing structure and styling configurations.

## Core Logic

The application leverages several key technologies:

*   **Next.js (App Router):** Provides the foundation for the web application, utilizing Server Components where possible and the App Router for routing.
*   **React:** Used for building the user interface with functional components and hooks.
*   **Tailwind CSS:** For utility-first styling, enabling rapid UI development consistent with a predefined design system.
*   **Shadcn UI:** A collection of reusable UI components built on Tailwind CSS and Radix UI, providing elements like Cards, Buttons, Inputs, Selects, and Textareas. The theme is configured in `src/app/globals.css` and `tailwind.config.ts`.
*   **TypeScript:** Enhances code quality and maintainability with static typing.

## PromptForge (`src/app/page.tsx`) Logic

The main functionality resides in `src/app/page.tsx`, which implements the "PromptForge" interface. Its key responsibilities are:

1.  **User Input Form:** Presents a form using Shadcn UI components (`Card`, `Label`, `Input`, `Textarea`, `Select`, `Combobox`) to collect details about the web element the user wants to create or integrate:
    *   **Type:** Section, Component, or Page.
    *   **Specific Name:** A descriptive name for the element (used for filenames, component names).
    *   **HTML Code:** The base HTML structure provided by the user.
    *   **Base Destination Directory:** The general folder where the new element should reside or be integrated (e.g., `src/components`, `src/app`). This is selected from a dropdown populated by parsing the project's structure.
    *   **Integration Target:** Specifies whether to integrate the element into an existing file or create a new one. This uses a `Combobox` allowing users to search through existing project files (filtered for relevant types like `.tsx`, `.jsx`) or select an option to create a new file.

2.  **Project Structure Loading:**
    *   On component mount (`useEffect`), it fetches `/public/estructura_proyecto.json`.
    *   Helper functions (`extractSrcDirectories`, `extractAllFilePaths`) parse this JSON to dynamically populate the options for the "Base Destination Directory" `Select` and the "Integration Target" `Combobox`. This ensures the user selects from valid locations within the current project structure.

3.  **Prompt Generation (`generatePrompt` function):**
    *   When the "Generate Prompt" button is clicked, this function gathers all user inputs.
    *   It constructs a detailed, multi-part prompt specifically designed for an AI code assistant (like the one integrated into Firebase Studio).
    *   **Crucially, the prompt instructs the AI to:**
        *   Act directly on the project files.
        *   **Consult Context Files:** Explicitly tells the AI to read `/public/configuracion_proyecto.txt` (for Tailwind/CSS configuration) and `/public/estructura_proyecto.json` (for file structure) to ensure the implementation is contextually correct.
        *   Adapt the provided HTML to JSX if necessary.
        *   Apply styles **exclusively** using Tailwind utilities and existing global CSS variables/classes, deriving the appropriate look and feel from the project's configuration rather than relying on explicit user styling instructions.
        *   Determine the exact file path(s) to modify or create based on the "Type", "Name", "Directory", and "Integration Target".
        *   Handle the import and usage of new components if created.
        *   Follow a specific, sequential implementation plan.
        *   Save all changes.

4.  **Prompt Display and Copying:**
    *   The generated prompt is displayed in a read-only `Textarea`.
    *   A "Copy to Clipboard" button allows the user to easily copy the prompt for use with the AI assistant.

5.  **User Feedback:** Uses the `useToast` hook to provide feedback to the user (e.g., "Prompt copied!", "Error loading structure").

In essence, `page.tsx` acts as an intelligent interface that translates user requirements and project context into a precise, actionable set of instructions for an AI code generation/modification tool.

## Getting Started

This project is set up within Firebase Studio.

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:9002](http://localhost:9002) (or the port specified) with your browser to see the PromptForge application.
```