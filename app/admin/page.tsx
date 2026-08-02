import type { Metadata } from "next";
import { AdminConsole } from "./AdminConsole";

export const metadata: Metadata = {
  title: "MindEase Admin",
  description: "Admin login and operations dashboard for MindEase Online Clinic.",
};

export default function AdminPage() {
  return <AdminConsole />;
}
