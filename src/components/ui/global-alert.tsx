
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
        <AlertDialogHeader className="items-center text-center">
          <ErrorDogIcon className="w-24 h-24 mb-4" />
          <AlertDialogTitle>{alertContent.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {alertContent.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={closeAlert}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
