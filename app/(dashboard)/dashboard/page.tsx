import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  let where = {};
  if (role === "EXPERT") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { expertId: true } });
    if (user?.expertId) {
      where = { expertId: user.expertId };
    }
  }

  const [analyses, totalExperts] = await Promise.all([
    prisma.analysisSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        expert: { select: { name: true } },
        sessionNote: { 
          select: { 
            name: true, 
            moduleId: true,
            module: { select: { id: true, name: true, course: { select: { name: true } } } } 
          } 
        },
        batch: { select: { name: true } },
      },
    }),
    prisma.expert.count({ where: { deletedAt: null } }),
  ]);

  const complete  = analyses.filter((a) => a.v3Status === "COMPLETE").length;
  const inProgress = analyses.filter((a) =>
    ["PREPROCESSING","EXTRACTING","AGGREGATING","SYNTHESISING"].includes(a.v3Status)
  ).length;

  return (
    <DashboardClient 
      analyses={analyses}
      totalExperts={totalExperts}
      role={role}
      complete={complete}
      inProgress={inProgress}
    />
  );
}
