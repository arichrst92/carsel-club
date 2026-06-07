import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  getSessionWithParticipants,
  isSessionStaff,
} from "@/lib/db/queries/sessions";
import { AddParticipantsTabs } from "@/components/sessions/AddParticipantsTabs";

export const metadata = {
  title: "Add Players",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AddParticipantsPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  const result = await getSessionWithParticipants(id);
  if (!result) notFound();

  if (!(await isSessionStaff(id, user.id))) {
    redirect(`/sessions/${id}`);
  }

  return (
    <div className="app-shell">
      <AddParticipantsTabs
        sessionId={id}
        sessionTitle={result.session.title}
      />
    </div>
  );
}
