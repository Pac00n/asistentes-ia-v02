'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from './ui/button';

export default function ConsentLink({ className }: { className?: string }) {
  return (
    <Link href="/settings/consents" className={className || ''}>
      <Button variant="outline" size="sm" className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        <span>Gestionar consentimientos</span>
      </Button>
    </Link>
  );
}
