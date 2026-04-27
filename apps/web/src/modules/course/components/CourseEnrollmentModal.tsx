"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/providers/I18nProvider";
import { useFeedback } from "@/providers/FeedbackProvider";
import { Button, Card, Select, Textarea, Input } from "@/components/ui";
import { useChurchUnitMetaQuery } from "@services/church-unit";
import { useEnrollOthersMutation, useEnrollPreviewMutation, type EnrollPreviewDto, type EnrollPreviewMemberDto } from "@services/course";
import { Search, UserCheck, UserPlus, X } from "lucide-react";

type CourseEnrollmentModalProps = {
  courseId: string;
  onClose: () => void;
};

export function CourseEnrollmentModal({ courseId, onClose }: CourseEnrollmentModalProps) {
  const { t } = useTranslation();
  const { toast } = useFeedback();
  const [churchUnitId, setChurchUnitId] = useState("");
  const [emailsText, setEmailsText] = useState("");
  const [preview, setPreview] = useState<EnrollPreviewDto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  
  const churchUnitMetaQuery = useChurchUnitMetaQuery();
  const enrollOthers = useEnrollOthersMutation(courseId);
  const previewMutation = useEnrollPreviewMutation(courseId);

  useEffect(() => {
    const emails = emailsText.split(/[\s,]+/).map(e => e.trim()).filter(Boolean);
    
    const timer = setTimeout(async () => {
      try {
        const result = await previewMutation.mutateAsync({
          church_unit_id: churchUnitId || undefined,
          emails: emails.length > 0 ? emails : undefined,
        });
        setPreview(result);
        
        // Auto-select members who are NOT fully enrolled and authorized
        if (result.members.length > 0) {
          const newSelected = new Set<string>();
          result.members.forEach(m => {
            if (!m.is_enrolled || !m.is_authorized) {
              newSelected.add(m.id);
            }
          });
          setSelectedMemberIds(newSelected);
        }
      } catch (error) {
        console.error("Preview failed", error);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [churchUnitId, emailsText, courseId]);

  async function handleEnroll() {
    if (selectedMemberIds.size === 0) return;
    
    try {
      await enrollOthers.mutateAsync({
        member_ids: Array.from(selectedMemberIds),
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

  const toggleMember = (id: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedMemberIds(next);
  };

  const filteredMembers = preview?.members.filter(m => 
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const newEnrollmentCount = preview?.members.filter(m => selectedMemberIds.has(m.id)).length || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--bg-scrim)] backdrop-blur-sm" onClick={onClose} />
      <Card className="relative flex h-[85vh] w-full max-w-4xl overflow-hidden rounded-[2rem] p-0 shadow-[var(--shadow-lg)] animate-in fade-in zoom-in duration-200">
        {/* Left Column: Form */}
        <div className="flex flex-1 flex-col border-r border-[var(--border-subtle)] p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Enroll Others</h2>
            <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-6">
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
                Individual Emails
              </label>
              <Textarea
                placeholder="Enter emails separated by comma, space or newline..."
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                Targeted members will appear in the list on the right.
              </p>
            </div>

            {preview?.invalid_emails && preview.invalid_emails.length > 0 && (
              <div className="rounded-xl border border-[var(--status-danger-muted)] bg-[var(--status-danger-soft)] p-4 text-xs text-[var(--status-danger)]">
                <p className="font-semibold mb-1">Invalid Emails:</p>
                <p>{preview.invalid_emails.join(", ")}</p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-8 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleEnroll}
              disabled={enrollOthers.isPending || selectedMemberIds.size === 0}
            >
              {enrollOthers.isPending ? t("common.ready") + "..." : `Enroll ${selectedMemberIds.size} Members`}
            </Button>
          </div>
        </div>

        {/* Right Column: Preview List */}
        <div className="flex w-[22rem] flex-col bg-[var(--bg-muted)] overflow-hidden">
          <div className="p-6 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[var(--brand-primary)]" />
              Target Members ({preview?.members.length || 0})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[var(--bg-base)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <div 
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    selectedMemberIds.has(member.id) 
                      ? 'border-[var(--brand-primary)] bg-[var(--bg-base)] shadow-sm' 
                      : 'border-transparent hover:bg-[var(--bg-soft)]'
                  }`}
                  onClick={() => !(member.is_enrolled && member.is_authorized) && toggleMember(member.id)}
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.has(member.id)}
                      onChange={() => toggleMember(member.id)}
                      disabled={member.is_enrolled && member.is_authorized}
                      className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer disabled:cursor-not-allowed"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {member.first_name || member.last_name 
                        ? `${member.first_name || ""} ${member.last_name || ""}`.trim() 
                        : member.username}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">{member.email}</p>
                  </div>
                  {member.is_enrolled && (
                    <span className="flex-shrink-0 text-[var(--status-success)]" title={member.is_authorized ? "Fully enrolled and authorized" : "Enrolled, but access not yet configured"}>
                      {member.is_authorized ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4 opacity-50" />}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                <Search className="h-8 w-8 mb-2" />
                <p className="text-xs">No members found</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-[var(--bg-base)] border-t border-[var(--border-subtle)] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">To be enrolled:</span>
              <span className="font-bold text-[var(--text-primary)]">{selectedMemberIds.size}</span>
            </div>
            <div className="flex justify-between text-xs" title="Total members currently enrolled in this course (have a Grade record)">
              <span className="text-[var(--text-secondary)]">Already in course:</span>
              <span className="font-bold text-[var(--text-primary)]">{preview?.enrolled_count ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs" title="Total members explicitly whitelisted for this course (have an Attendance record). If > 0, only these members can see lessons.">
              <span className="text-[var(--text-secondary)]">Whitelisted (Restricted):</span>
              <span className="font-bold text-[var(--text-primary)]">{preview?.authorized_count ?? 0}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
