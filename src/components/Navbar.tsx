
'use client';

import type { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Define navigation links based on the user request
const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/optimizar', label: 'Optimizar' },
  { href: '/otra', label: 'Otra' }, 
  { href: '/ropa', label: 'Ropa' },// Added new link
];

const Navbar: FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-primary bg-opacity-95 shadow-lg backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          {/* Logo y nombre */}
          <Link href="/" className="flex items-center space-x-2 py-2">
            <Image
              src="https://picsum.photos/50/50" // Placeholder image
              alt="PromptForge Logo" // Updated Alt Text
              width={50}
              height={50}
              className="h-10 sm:h-12 w-auto transition-all rounded-full"
              data-ai-hint="logo tool" // AI Hint for image search
            />
            <div className="hidden md:block">
              <h1 className="text-primary-foreground text-lg sm:text-xl font-bold leading-tight">
                PromptForge
              </h1>
            </div>
             {/* Show title on small screens when logo is smaller */}
            <div className="md:hidden">
               <h1 className="text-primary-foreground text-base font-bold leading-tight">
                 PromptForge
               </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-primary-foreground hover:text-accent-foreground hover:bg-accent/20 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
             <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-accent/20 hover:text-accent-foreground">
                   <Menu className="h-6 w-6" />
                   <span className="sr-only">Abrir menú</span>
                 </Button>
               </SheetTrigger>
               <SheetContent side="right" className="w-[250px] sm:w-[300px] bg-background p-4">
                 <SheetHeader className="mb-4 text-left">
                   <SheetTitle className="text-lg font-semibold text-foreground">Menú</SheetTitle>
                   <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cerrar</span>
                   </SheetClose>
                 </SheetHeader>
                 <Separator className="mb-4"/>
                 <div className="flex flex-col space-y-2">
                   {navLinks.map((link) => (
                     <SheetClose asChild key={link.href}>
                       <Link
                         href={link.href}
                         className="text-foreground hover:bg-accent hover:text-accent-foreground block px-3 py-2 rounded-md text-base font-medium transition-colors"
                         onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                       >
                         {link.label}
                       </Link>
                     </SheetClose>
                   ))}
                 </div>
               </SheetContent>
             </Sheet>
           </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
