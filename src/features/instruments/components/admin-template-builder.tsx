"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplateBuilder } from "./template-builder";
import type { TemplateBuilderProps } from "./template-builder";

type AdminTemplateBuilderProps = Omit<
  TemplateBuilderProps,
  "onSaveResult" | "saveSuccessConfig" | "toolsHref"
>;

export function AdminTemplateBuilder(props: AdminTemplateBuilderProps) {
  const router = useRouter();
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSaveResult = (
    result: { success: true; id: string } | { success: false; error: string }
  ) => {
    if (result.success) {
      setSuccessModalOpen(true);
    } else {
      setErrorMessage(result.error);
      setErrorModalOpen(true);
    }
  };

  const handleSuccessContinue = () => {
    setSuccessModalOpen(false);
    router.push("/admin/instruments");
  };

  return (
    <>
      <TemplateBuilder {...props} onSaveResult={handleSaveResult} toolsHref="/admin/instruments" />

      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="size-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Template Saved Successfully</DialogTitle>
            <DialogDescription className="text-center">
              Your changes have been saved to the template.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={handleSuccessContinue}>Go to Tools</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="size-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Failed to Save Template</DialogTitle>
            <DialogDescription className="text-center text-red-600">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => setErrorModalOpen(false)}>
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
