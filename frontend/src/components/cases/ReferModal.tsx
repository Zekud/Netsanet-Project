// ReferModal — triggered from CaseAssessmentPage to refer a case to another institution.
// Fetches active institutions (excluding caller's own), sends POST /cases/:id/referrals.

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
            <svg className="h-6 w-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium text-dark">Referral sent successfully</p>
          <p className="mt-1 text-sm text-gray-500">The receiving institution will be notified.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            This will transfer responsibility for case{' '}
            <span className="font-mono font-medium text-dark">{caseNumber}</span> to the selected institution.
          </p>

          {/* Institution dropdown */}
          <div>
            <label htmlFor="refer-institution" className="mb-1.5 block text-sm font-medium text-dark">
              Refer to institution
            </label>
            {instsLoading ? (
              <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500">
                Loading institutions...
              </div>
            ) : (
              <select
                id="refer-institution"
                value={toInstitutionId}
                onChange={(e) => setToInstitutionId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-dark focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
            <label htmlFor="refer-note" className="mb-1.5 block text-sm font-medium text-dark">
              Note to receiving institution
              <span className="ml-1 text-xs font-normal text-gray-500">(optional but recommended)</span>
            </label>
            <textarea
              id="refer-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain why you're referring this case and what kind of support is needed..."
              rows={3}
              className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-dark placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {referMutation.isError && (
            <p className="text-sm text-critical">
              Failed to send referral. Please check the institution selection and try again.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
