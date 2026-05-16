// ReferModal — triggered from CaseAssessmentPage to refer a case to another institution.
// Fetches active institutions (excluding caller's own), sends POST /cases/:id/referrals.
// Uses semantic tokens + Lucide icons.

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { Modal, Button } from '../ui';

interface Institution {
  id: string;
  name: string;
  type: string;
}

interface ReferModalProps {
  caseId: string;
  caseNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReferModal({ caseId, caseNumber, isOpen, onClose }: ReferModalProps) {
  const queryClient = useQueryClient();
  const [toInstitutionId, setToInstitutionId] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: institutions, isLoading: instsLoading } = useQuery<Institution[]>({
    queryKey: ['institutions-for-referral'],
    queryFn: async () => {
      const res = await api.get('/institutions?exclude_own=true');
      return res.data.data;
    },
    enabled: isOpen,
  });

  const referMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/cases/${caseId}/referrals`, {
        to_institution_id: toInstitutionId,
        note: note.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-activities', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setTimeout(() => {
        setSuccess(false);
        setToInstitutionId('');
        setNote('');
        onClose();
      }, 1500);
    },
  });

  const handleClose = () => {
    setToInstitutionId('');
    setNote('');
    setSuccess(false);
    onClose();
  };

  const selectClasses = 'w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-heading focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';
  const textareaClasses = 'w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading placeholder:text-placeholder focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Refer Case ${caseNumber}`}
      size="md"
      footer={
        success ? null : (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => referMutation.mutate()}
              disabled={!toInstitutionId || referMutation.isPending}
              isLoading={referMutation.isPending}
            >
              Send Referral
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-success-soft text-success">
            <CheckCircle className="h-6 w-6" />
          </div>
          <p className="font-medium text-heading">Referral sent successfully</p>
          <p className="mt-1 text-sm text-muted">The receiving institution will be notified.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            This will transfer responsibility for case{' '}
            <span className="font-mono font-medium text-heading">{caseNumber}</span> to the selected institution.
          </p>

          {/* Institution dropdown */}
          <div>
            <label htmlFor="refer-institution" className="mb-1.5 block text-sm font-medium text-heading">
              Refer to institution
            </label>
            {instsLoading ? (
              <div className="rounded-xl border border-border bg-inset px-3 py-2 text-sm text-muted">
                Loading institutions...
              </div>
            ) : (
              <select
                id="refer-institution"
                value={toInstitutionId}
                onChange={(e) => setToInstitutionId(e.target.value)}
                className={selectClasses}
              >
                <option value="">Select institution...</option>
                {(institutions || []).map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.type.toUpperCase()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Note */}
          <div>
            <label htmlFor="refer-note" className="mb-1.5 block text-sm font-medium text-heading">
              Note to receiving institution
              <span className="ml-1 text-xs font-normal text-muted">(optional but recommended)</span>
            </label>
            <textarea
              id="refer-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain why you're referring this case and what kind of support is needed..."
              rows={3}
              className={textareaClasses}
            />
          </div>

          {referMutation.isError && (
            <p className="text-sm text-danger">
              Failed to send referral. Please check the institution selection and try again.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
