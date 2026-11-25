-- CreateTable
CREATE TABLE "prompt_snapshots" (
    "id" SERIAL NOT NULL,
    "prompt_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'edit',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prompt_snapshots_prompt_id_idx" ON "prompt_snapshots"("prompt_id");

-- AddForeignKey
ALTER TABLE "prompt_snapshots" ADD CONSTRAINT "prompt_snapshots_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
