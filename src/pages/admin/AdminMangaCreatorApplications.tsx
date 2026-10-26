import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { BookOpen, Check, Clock3, ExternalLink, X, Clapperboard } from 'lucide-react';

type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export const AdminMangaCreatorApplications: React.FC = () => {
  const [status, setStatus] = useState<ApplicationStatus>('pending');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const applications = useQuery(api.creators.listProfessionalCreatorApplications, { status });
  const reviewApplication = useMutation(api.creators.reviewProfessionalCreatorApplication);

  const handleReview = async (applicationId: string, decision: 'approved' | 'rejected') => {
    setProcessingId(applicationId);
    setError('');
    try {
      await reviewApplication({
        applicationId: applicationId as any,
        decision,
        reviewNote: reviewNotes[applicationId]?.trim() || undefined,
      });
    } catch (reviewError: any) {
      setError(reviewError?.message || 'Could not review this application. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const tabs: { id: ApplicationStatus; label: string }[] = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-violet-500">Creator Programs</p>
          <h1 className="text-2xl font-black text-theme-primary">Professional Creator Applications</h1>
          <p className="mt-1 max-w-2xl text-sm text-theme-tertiary">Review portfolios before granting Manga or Short-Movie creator profile types.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500"><BookOpen className="h-5 w-5" /></div>
      </div>

      <div className="flex gap-1 rounded-xl border border-theme-divider bg-theme-surface p-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setStatus(tab.id)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${status === tab.id ? 'bg-violet-600 text-white' : 'text-theme-secondary hover:bg-theme-surface-hover'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}

      {applications === undefined ? (
        <div className="space-y-3">{[0, 1].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl border border-theme-divider bg-theme-surface" />)}</div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-theme-divider-strong bg-theme-surface/50 px-5 py-12 text-center">
          <Clock3 className="mx-auto h-7 w-7 text-theme-tertiary" />
          <p className="mt-3 text-sm font-bold text-theme-primary">No {status} applications</p>
          <p className="mt-1 text-xs text-theme-tertiary">New professional creator applications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application: any) => (
            <article key={application._id} className="rounded-2xl border border-theme-divider bg-theme-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-base font-extrabold text-theme-primary">{application.creatorType === 'manga' ? <BookOpen className="h-4 w-4 text-violet-500" /> : <Clapperboard className="h-4 w-4 text-violet-500" />}{application.publisherName}<span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-violet-500">{application.creatorType === 'manga' ? 'Manga' : 'Short-Movie'}</span></h2>
                  <p className="mt-1 text-xs text-theme-tertiary">
                    Applicant: <strong className="text-theme-secondary">{application.applicant?.name || 'Unknown'}</strong>
                    {application.applicant?.username && <span> · @{application.applicant.username}</span>}
                    {application.applicant?.email && <span> · {application.applicant.email}</span>}
                  </p>
                  <p className="mt-1 text-[10px] text-theme-tertiary">Submitted {new Date(application.submittedAt).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${status === 'pending' ? 'bg-amber-500/10 text-amber-600' : status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500'}`}>{status}</span>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-theme-secondary">{application.about}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a href={application.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-theme-divider px-3 py-2 text-xs font-bold text-violet-500 hover:bg-violet-500/5">
                  Portfolio <ExternalLink className="h-3.5 w-3.5" />
                </a>
                {application.sampleChapterUrl && (
                  <a href={application.sampleChapterUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-theme-divider px-3 py-2 text-xs font-bold text-violet-500 hover:bg-violet-500/5">
                    {application.creatorType === 'manga' ? 'Sample chapter' : 'Sample film / trailer'} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {status === 'pending' ? (
                <div className="mt-4 space-y-3 border-t border-theme-divider-light pt-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">
                    Review note <span className="font-normal normal-case tracking-normal">(optional; sent to the applicant)</span>
                    <textarea maxLength={1200} rows={2} value={reviewNotes[application._id] || ''} onChange={(event) => setReviewNotes((current) => ({ ...current, [application._id]: event.target.value }))} placeholder="Share feedback or next steps" className="mt-1.5 w-full rounded-xl border border-theme-divider bg-theme-base px-3 py-2 text-xs font-normal normal-case tracking-normal text-theme-primary outline-none focus:border-violet-500" />
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button disabled={processingId === application._id} onClick={() => handleReview(application._id, 'rejected')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/5 disabled:opacity-50">
                      <X className="h-4 w-4" /> Reject application
                    </button>
                    <button disabled={processingId === application._id} onClick={() => handleReview(application._id, 'approved')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                      <Check className="h-4 w-4" /> Approve {application.creatorType === 'manga' ? 'Manga' : 'Short-Movie'} Creator
                    </button>
                  </div>
                </div>
              ) : application.reviewNote ? (
                <div className="mt-4 rounded-xl bg-theme-base p-3 text-xs text-theme-secondary"><strong>Review note:</strong> {application.reviewNote}</div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

