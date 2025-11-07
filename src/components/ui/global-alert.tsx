
"use client";

import { useAlert } from '@/context/alert-context';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { ErrorDogIcon } from './error-dog-icon';

export function GlobalAlert() {
  const { isAlertOpen, alertContent, closeAlert } = useAlert();

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={(open) => !open && closeAlert()}>
      <AlertDialogContent>
        <div className="flex gap-6 items-start">
          <div className="flex-shrink-0 pt-1">
            <ErrorDogIcon className="w-20 h-20" />
          </div>
          <div className='flex-grow'>
            <AlertDialogHeader className="text-left p-0">
              <AlertDialogTitle>{alertContent.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {alertContent.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={closeAlert}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
