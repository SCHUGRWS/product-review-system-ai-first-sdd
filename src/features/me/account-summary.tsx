// Receives display strings only, so nothing else from the account reaches the page.
export function AccountSummary({
  fullName,
  email,
  memberSince,
}: {
  fullName: string;
  email: string;
  memberSince: string;
}) {
  return (
    <dl className="mt-4 text-[0.9375rem]">
      <dt className="sr-only">Name</dt>
      <dd className="text-[1.25rem] leading-snug font-bold tracking-[-0.015em] break-words text-ink">
        {fullName}
      </dd>
      <dt className="sr-only">Email</dt>
      <dd className="mt-1 break-all text-slate">{email}</dd>
      <dt className="sr-only">Membership</dt>
      <dd className="mt-4 border-t border-dashed border-rule pt-4 text-ink">
        {memberSince}
      </dd>
    </dl>
  );
}

export function AccountSummarySkeleton() {
  return (
    <div aria-hidden="true" className="mt-4 space-y-3">
      <div className="h-5 w-3/4 rounded-full bg-paper" />
      <div className="h-3.5 w-11/12 rounded-full bg-paper" />
      <div className="mt-6 h-3.5 w-2/3 rounded-full bg-paper" />
    </div>
  );
}
