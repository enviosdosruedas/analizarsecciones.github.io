import type { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar: FC = () => {
  return (
    <nav className="bg-primary bg-opacity-95 shadow-lg backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          {/* Logo y nombre */}
          <Link href="/" className="flex items-center space-x-2 py-2">
            <Image
              src="https://picsum.photos/50/50" // Placeholder image
              alt="Envios DosRuedas Logo"
              width={50}
              height={50}
              className="h-10 sm:h-12 w-auto transition-all rounded-full" // Added rounded-full for placeholder
              data-ai-hint="logo delivery" // AI Hint for image search
            />
            <div className="hidden md:block">
              <h1 className="text-primary-foreground text-lg sm:text-xl font-bold leading-tight">
                Envios DosRuedas
              </h1>
            </div>
          </Link>
          {/* Add other navbar elements like navigation links or buttons here if needed */}
          {/* Example: <div className="text-primary-foreground">Nav Links</div> */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
