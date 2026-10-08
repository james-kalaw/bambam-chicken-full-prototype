"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeModuleFor } from "@/lib/permissions";
import { useCurrentEmployee } from "@/lib/store";

/** /admin → the signed-in role's home page */
export default function AdminIndexPage() {
  const router = useRouter();
  const employee = useCurrentEmployee();
  useEffect(() => {
    if (employee) router.replace(`/admin/${homeModuleFor(employee.role)}`);
  }, [employee, router]);
  return null;
}
