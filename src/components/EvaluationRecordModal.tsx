import React, { useState } from 'react';
import { EvaluationRecord } from '../types';
import { X, Copy, Check, Download, FileText, Sparkles, User, RefreshCw, Layers } from 'lucide-react';

interface EvaluationRecordModalProps {
  record: EvaluationRecord;
  onClose: () => void;
}

export const EvaluationRecordModal: React.FC<EvaluationRecordModalProps> = ({
  record,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedMarkdown = `# Mini-Me Reflection Evaluation Record
**Date:** ${new Date(record.timestamp).toLocaleString()}
**Acceptance Status:** ${record.acceptanceStatus}

---

### 1. Journal Input
> ${record.journalInput}

---

### 2. Initial AI Suggestion (Hypothesis)
- **Reflection:** ${record.initialSuggestions.reflection}
- **Reflection Question:** ${record.initialSuggestions.question || 'None'}
- **Suggested Moods:** ${record.initialSuggestions.emotions.map((e) => `${e.name} (${e.color})`).join(', ')}
- **Initial Inferred Rationale:** ${record.initialSuggestions.whyTheseColors || 'N/A'}

---

### 3. User Feedback & Clarification
${
  record.userFeedback
    ? `- **Feedback Category:** ${record.userFeedback.feedbackLabel}
- **User's Explicit Note:** ${record.userFeedback.userNote || '(No initial written note provided)'}`
    : 'No feedback submitted prior to finalization.'
}

${
  record.revisedSuggestion
    ? `---

### 4. Revised Understanding & Negotiation
- **Colors Preserved?:** ${record.revisedSuggestion.colorsPreserved ? 'YES (Kept as user requested)' : 'NO (Adapted)'}
- **What Changed:** ${record.revisedSuggestion.whatChanged || 'Revised based on user guidance.'}
- **Originally Inferred by Mini-Me:** ${record.revisedSuggestion.originalInference || record.initialSuggestions.whyTheseColors || 'N/A'}
- **User's Stated Meaning (Authoritative):** ${record.revisedSuggestion.userExplicitMeaning || record.userFeedback?.userNote || '(None)'}
- **Revision Response:** ${record.revisedSuggestion.revisionResponse}
- **Clarifying Question:** ${record.revisedSuggestion.clarifyingQuestion || 'None'}
- **Revised Moods:** ${record.revisedSuggestion.emotions.map((e) => `${e.name} (${e.color})`).join(', ')}
- **Revised Rationale:** ${record.revisedSuggestion.whyRevisedColors || 'N/A'}`
    : ''
}

---

### 5. Final Selection
- **Final Moods:** ${record.finalSelection.moodIds.join(', ')}
- **Colors:** ${record.finalSelection.colors.join(', ')}
- **User's Choice Explanation:** ${record.finalSelection.explanationNote || '(None)'}
- **Outcome:** ${record.acceptanceStatus} (AI suggestions were ${
    record.acceptanceStatus === 'Accepted'
      ? 'accepted'
      : record.acceptanceStatus === 'Adjusted'
      ? 'adjusted with user revisions'
      : 'rejected in favor of user manual choice'
  })
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minime-eval-record-${new Date(record.timestamp).toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFDF9] border border-[#EAE3D5] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EAE3D5] flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#BAA1FF]" />
              <h2 className="font-serif text-xl sm:text-2xl text-stone-900 font-medium">
                Reflection Evaluation Record
              </h2>
              <span
                className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-semibold ${
                  record.acceptanceStatus === 'Accepted'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : record.acceptanceStatus === 'Adjusted'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {record.acceptanceStatus}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 font-light">
              Collaborative Sensemaking Audit Log (Human judgment as ground truth)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-stone-700">
          {/* Ground truth disclaimer */}
          <div className="p-3 bg-[#FAF7F0] border border-amber-200/60 rounded-xl text-[11px] text-amber-900 italic font-serif">
            "AI suggestions are exploratory hypotheses. The user's lived experience is the sole ground truth."
          </div>

          {/* Section 1: Journal Input */}
          <div className="space-y-1.5">
            <span className="uppercase tracking-widest text-[10px] font-semibold text-stone-400 block">
              Journal Entry Text
            </span>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 font-serif text-sm leading-relaxed text-stone-800 italic">
              "{record.journalInput}"
            </div>
          </div>

          {/* Section 2: Initial Suggestion */}
          <div className="space-y-2 border-t border-stone-100 pt-4">
            <span className="uppercase tracking-widest text-[10px] font-semibold text-stone-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-600" />
              1. Initial AI Suggestion (Hypothesis)
            </span>
            <p className="font-serif text-stone-800 italic text-sm">
              "{record.initialSuggestions.reflection}"
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {record.initialSuggestions.emotions.map((e) => (
                <span
                  key={e.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200 text-xs font-medium"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: e.color }}
                  />
                  <span>{e.name}</span>
                </span>
              ))}
            </div>
            {record.initialSuggestions.whyTheseColors && (
              <p className="text-[11px] font-serif text-stone-500 italic pt-1">
                Initial Inferred Meaning: "{record.initialSuggestions.whyTheseColors}"
              </p>
            )}
          </div>

          {/* Section 3: User Feedback */}
          {record.userFeedback && (
            <div className="space-y-2 border-t border-stone-100 pt-4">
              <span className="uppercase tracking-widest text-[10px] font-semibold text-stone-400 flex items-center gap-1.5">
                <User className="w-3 h-3 text-stone-600" />
                2. User Feedback & Clarification
              </span>
              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                <p className="font-medium text-stone-900">
                  {record.userFeedback.feedbackLabel}
                </p>
                {record.userFeedback.userNote && (
                  <p className="text-stone-700 font-serif italic text-xs">
                    "{record.userFeedback.userNote}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Revised Suggestion (if applicable) */}
          {record.revisedSuggestion && (
            <div className="space-y-3 border-t border-stone-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-widest text-[10px] font-semibold text-stone-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-emerald-600" />
                  3. Revised AI Hypothesis & Understanding
                </span>
                {record.revisedSuggestion.colorsPreserved && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    Colors Preserved
                  </span>
                )}
              </div>

              <p className="font-serif text-stone-800 italic text-sm">
                "{record.revisedSuggestion.revisionResponse}"
              </p>

              {/* What Changed Summary */}
              {record.revisedSuggestion.whatChanged && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-stone-600 block">
                    What Changed Between Initial & Revised:
                  </span>
                  <p className="font-serif text-xs text-stone-700 italic">
                    {record.revisedSuggestion.whatChanged}
                  </p>
                </div>
              )}

              {/* Inferred vs. User Stated Meaning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 bg-[#FAF7F0] border border-stone-200 rounded-lg">
                  <span className="text-[9px] uppercase font-mono text-stone-500 font-semibold block mb-0.5">
                    Originally Inferred
                  </span>
                  <p className="font-serif text-xs text-stone-700 italic">
                    "{record.revisedSuggestion.originalInference || record.initialSuggestions.whyTheseColors || 'N/A'}"
                  </p>
                </div>

                <div className="p-2.5 bg-white border border-amber-200 rounded-lg">
                  <span className="text-[9px] uppercase font-mono text-amber-900 font-semibold block mb-0.5">
                    Your Stated Meaning
                  </span>
                  <p className="font-serif text-xs text-stone-800 font-medium">
                    "{record.revisedSuggestion.userExplicitMeaning || record.userFeedback?.userNote || '(None)'}"
                  </p>
                </div>
              </div>

              {record.revisedSuggestion.clarifyingQuestion && (
                <p className="font-serif text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60">
                  <strong>Clarifying Question Asked:</strong> {record.revisedSuggestion.clarifyingQuestion}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {record.revisedSuggestion.emotions.map((e) => (
                  <span
                    key={e.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200 text-xs font-medium"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: e.color }}
                    />
                    <span>{e.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Final Selection */}
          <div className="space-y-2 border-t border-stone-100 pt-4 bg-[#FAF7F0] p-4 rounded-xl border border-stone-200/60">
            <span className="uppercase tracking-widest text-[10px] font-semibold text-stone-600 block">
              4. User's Final Selected Colors
            </span>
            <div className="flex items-center gap-2">
              {record.finalSelection.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: c }}
                  />
                  <span className="font-mono text-xs">{c}</span>
                </div>
              ))}
            </div>
            {record.finalSelection.explanationNote && (
              <p className="text-xs text-stone-600 font-serif italic pt-1">
                Why chosen: "{record.finalSelection.explanationNote}"
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-100/70 border-t border-[#EAE3D5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-stone-300 hover:border-stone-800 text-stone-800 transition-colors shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Markdown' : 'Copy Record'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </button>
        </div>
      </div>
    </div>
  );
};
