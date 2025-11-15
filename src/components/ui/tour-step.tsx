
"use client";

import { useTour } from "@/context/tour-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

type TourStepProps = {
  stepId: string;
};

export function TourStep({ stepId }: TourStepProps) {
  const { currentStep, steps, nextStep, prevStep, stopTour, isTourActive } = useTour();
  
  const step = steps.find(s => s.id === stepId);
  const isOpen = isTourActive && currentStep?.id === stepId;

  if (!isOpen || !step) {
    return null;
  }

  return (
    <Popover open={isOpen}>
      <PopoverTrigger asChild>
        {/* The trigger is the highlighted element itself, so we don't render anything here */}
        <div />
      </PopoverTrigger>
      <PopoverContent 
        side={step.side || "bottom"} 
        align={step.align || "center"} 
        className="w-80 z-[100]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{step.title}</h4>
            <p className="text-sm text-muted-foreground">{step.content}</p>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-sm text-muted-foreground">
                {steps.findIndex(s => s.id === step.id) + 1} / {steps.length}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={stopTour}>Skip</Button>
              <div className="flex gap-1">
                 <Button variant="outline" size="icon" className="h-9 w-9" onClick={prevStep} disabled={steps.findIndex(s => s.id === step.id) === 0}>
                    <ArrowLeft className="h-4 w-4" />
                 </Button>
                 <Button size="sm" onClick={nextStep}>
                    {steps.findIndex(s => s.id === step.id) === steps.length - 1 ? 'Finish' : 'Next'}
                    {steps.findIndex(s => s.id === step.id) < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
