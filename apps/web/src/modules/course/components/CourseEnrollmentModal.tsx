"use client";

import { useState } from "react";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { Button, Card, Select, Textarea } from "@/components/ui";
import { useChurchUnitMetaQuery } from "@services/church-unit";
import { useEnrollOthersMutation } from "@services/course";

type CourseEnrollmentModalProps = {
  courseId: string;
  onClose: () => void;
};

export function CourseEnrollmentModal({ courseId, onClose }: CourseEnrollmentModalProps) {
  const { t } = useTranslation();
  const { toast } = useFeedback();
  const [churchUnitId, setChurchUnitId] = useState("");
  const [userIdsText, setUserIdsText] = useState("");
  
  const churchUnitMetaQuery = useChurchUnitMetaQuery();
  const enrollOthers = useEnrollOthersMutation(courseId);

  async function handleEnroll() {
    const userIds = userIdsText.split(",").map(id => id.trim()).filter(Boolean);
    
    try {
      await enrollOthers.mutateAsync({
        church_unit_id: churchUnitId || undefined,
        user_ids: userIds.length > 0 ? userIds : undefined,
      });
      
      toast({
        title: t("admin.churchUnits.toast.saved"),
        variant: "success",
      });
      onClose();
    } catch (error) {
      toast({
        title: t("error.500.title"),
        description: error instanceof Error ? error.message : String(error),
        variant: "error",
      });
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--bg-scrim)] backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md overflow-hidden rounded-[2rem] p-8 animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Enroll Others</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Church Unit
            </label>
            <Select
              value={churchUnitId}
              onChange={(e) => setChurchUnitId(e.target.value)}
            >
              <option value="">Select a unit (optional)</option>
              {churchUnitMetaQuery.data?.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Individual User IDs (comma separated)
            </label>
            <Textarea
              placeholder="e.g. uuid-1, uuid-2"
              value={userIdsText}
              onChange={(e) => setUserIdsText(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            className="flex-1"
            onClick={handleEnroll}
            disabled={enrollOthers.isPending || (!churchUnitId && !userIdsText.trim())}
          >
            {enrollOthers.isPending ? t("common.ready") + "..." : "Enroll"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
