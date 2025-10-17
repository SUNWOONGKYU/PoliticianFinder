import { BetaTesterInvitePanel, BetaTesterList } from '@/components/admin/BetaTesterInvitePanel';

export default function BetaTestersPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Beta Tester Management</h1>
      <div className="grid gap-6">
        <BetaTesterInvitePanel />
        <BetaTesterList />
      </div>
    </div>
  );
}
