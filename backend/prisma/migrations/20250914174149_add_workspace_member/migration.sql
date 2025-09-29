/*
  Warnings:

  - You are about to drop the `_WorkspaceMembers` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."WorkspaceRole" AS ENUM ('Owner', 'Admin', 'Editor', 'Viewer');

-- DropForeignKey
ALTER TABLE "public"."_WorkspaceMembers" DROP CONSTRAINT "_WorkspaceMembers_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_WorkspaceMembers" DROP CONSTRAINT "_WorkspaceMembers_B_fkey";

-- DropTable
DROP TABLE "public"."_WorkspaceMembers";

-- CreateTable
CREATE TABLE "public"."WorkspaceMember" (
    "id" TEXT NOT NULL,
    "role" "public"."WorkspaceRole" NOT NULL DEFAULT 'Viewer',
    "userId" TEXT NOT NULL,
    "WorkspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_userId_WorkspaceId_key" ON "public"."WorkspaceMember"("userId", "WorkspaceId");

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_WorkspaceId_fkey" FOREIGN KEY ("WorkspaceId") REFERENCES "public"."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
