import { getEmergencyContacts } from "@/lib/data";
import PublicShellClient from "@/components/public-shell-client";

export default async function PublicShell({ children }) {
  let emergencyContacts = [];

  try {
    emergencyContacts = await getEmergencyContacts();
  } catch {
    // The rest of the public app remains useful if the directory is temporarily unavailable.
  }

  return (
    <PublicShellClient emergencyContacts={emergencyContacts}>
      {children}
    </PublicShellClient>
  );
}
